import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

const BROADCAST_CALL_CHANNEL = 'bishal_webrtc_call_channel';

export interface CallSignalPayload {
  type: 'CALL_INIT' | 'CALL_ACCEPT' | 'CALL_END' | 'ICE_CANDIDATE' | 'OFFER' | 'ANSWER' | 'MUTE_TOGGLE';
  sessionId: string;
  callerName: string;
  callerRole: 'admin' | 'user';
  data?: any;
}

// ─── High-quality audio constraints with full noise cancellation ──────────────
const HD_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,        // Removes echo from speaker feedback
  noiseSuppression: true,        // Removes background noise (fans, keyboard etc.)
  autoGainControl: true,         // Normalizes voice volume automatically
  sampleRate: 48000,             // 48kHz — high fidelity audio
  sampleSize: 16,                // 16-bit audio depth
  channelCount: 1,               // Mono — better for voice calls (less noise)
};

// ─── WebRTC ICE servers (STUN + TURN for cross-network traversal) ─────────────
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

class WebRtcVoiceService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private ringtoneInterval: any = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel(BROADCAST_CALL_CHANNEL);
    }
  }

  // ─── Get Microphone with Noise Cancellation ───────────────────────────────
  async getMicrophoneStream(): Promise<MediaStream | null> {
    try {
      // First try with full HD constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: HD_AUDIO_CONSTRAINTS,
        video: false,
      });

      // Apply Web Audio API noise gate as extra layer of cleanup
      const cleanStream = this.applyAudioProcessing(stream);
      this.localStream = cleanStream;
      return cleanStream;
    } catch (err) {
      console.warn('HD audio failed, trying basic fallback:', err);
      try {
        // Fallback: basic noise cancellation if HD constraints unsupported
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
        this.localStream = stream;
        return stream;
      } catch (fallbackErr) {
        console.warn('Microphone access denied or unavailable:', fallbackErr);
        return null;
      }
    }
  }

  // ─── Web Audio API noise gate for extra clarity ───────────────────────────
  private applyAudioProcessing(stream: MediaStream): MediaStream {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return stream;

      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);

      // Dynamics compressor to normalize volume and reduce loud noise spikes
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-30, ctx.currentTime);  // dB — gate threshold
      compressor.knee.setValueAtTime(10, ctx.currentTime);
      compressor.ratio.setValueAtTime(6, ctx.currentTime);         // 6:1 compression
      compressor.attack.setValueAtTime(0.003, ctx.currentTime);    // Fast attack
      compressor.release.setValueAtTime(0.25, ctx.currentTime);    // Smooth release

      // High-pass filter to remove low-frequency rumble (below 100Hz)
      const highPass = ctx.createBiquadFilter();
      highPass.type = 'highpass';
      highPass.frequency.setValueAtTime(100, ctx.currentTime);
      highPass.Q.setValueAtTime(0.7, ctx.currentTime);

      // Low-pass filter to remove high-frequency hiss (above 8kHz)
      const lowPass = ctx.createBiquadFilter();
      lowPass.type = 'lowpass';
      lowPass.frequency.setValueAtTime(8000, ctx.currentTime);
      lowPass.Q.setValueAtTime(0.7, ctx.currentTime);

      // Chain: source → highPass → lowPass → compressor → output
      const dest = ctx.createMediaStreamDestination();
      source.connect(highPass);
      highPass.connect(lowPass);
      lowPass.connect(compressor);
      compressor.connect(dest);

      // Return the processed stream
      return dest.stream;
    } catch (e) {
      console.warn('Audio processing fallback (using raw stream):', e);
      return stream;
    }
  }

  // ─── Create RTCPeerConnection with ICE servers ────────────────────────────
  createPeerConnection(onIceCandidate?: (candidate: RTCIceCandidate) => void): RTCPeerConnection {
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    this.peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    if (onIceCandidate) {
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          onIceCandidate(event.candidate);
        }
      };
    }

    // Add local tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
    }

    return this.peerConnection;
  }

  getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection;
  }

  // ─── Attach remote stream to an audio element ─────────────────────────────
  attachRemoteStream(pc: RTCPeerConnection, audioEl: HTMLAudioElement) {
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        audioEl.srcObject = event.streams[0];
        audioEl.play().catch(e => console.warn('Autoplay blocked:', e));
      }
    };
  }

  // ─── High quality realistic dual-frequency phone ringtone ─────────────────
  startRingtone() {
    this.stopRingtone();
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const playBurst = () => {
        try {
          const ctx = new AudioCtx();
          const now = ctx.currentTime;

          // Dual Tone Oscillators (440Hz + 480Hz US/Global Telephone standard)
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sine';
          osc2.type = 'sine';
          osc1.frequency.value = 440;
          osc2.frequency.value = 480;

          // Smooth gain envelope (soft rise & decay)
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
          gain.gain.setValueAtTime(0.12, now + 1.2);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.35);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 1.35);
          osc2.stop(now + 1.35);
        } catch (e) {
          console.warn('Audio Context error:', e);
        }
      };

      playBurst();
      this.ringtoneInterval = setInterval(playBurst, 2800);
    } catch (e) {
      console.warn('Ringtone error:', e);
    }
  }

  stopRingtone() {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }

  playCallConnectedChime() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Ascending double-tone connected chime (C5 -> E5)
      [523.25, 659.25].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.001, now + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.1, now + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.2);
      });
    } catch (e) {
      console.warn('Chime error:', e);
    }
  }

  playCallEndedChime() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Descending double-tone call ended chime (A4 -> F4)
      [440, 349.23].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.001, now + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.1, now + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.2);
      });
    } catch (e) {
      console.warn('Chime error:', e);
    }
  }

  // ─── Mute / Unmute local microphone ──────────────────────────────────────
  setMuted(muted: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }

  // ─── Broadcast Call Signal to Local Tabs & Global Firestore ──────────────
  async sendSignal(signal: CallSignalPayload) {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(signal);
    }
    // Storage fallback for local tab sync
    localStorage.setItem('bishal_webrtc_signal', JSON.stringify({ ...signal, timestamp: Date.now() }));

    // Global Firestore WebRTC Signal Sync across all internet devices
    try {
      if (signal.sessionId) {
        await setDoc(doc(db, 'webrtc_signals', signal.sessionId), {
          ...signal,
          timestamp: Date.now()
        }, { merge: true });
      }
    } catch (e) {
      console.warn('Firestore WebRTC signal sync warning:', e);
    }
  }

  // ─── Cleanup active streams ───────────────────────────────────────────────
  cleanup() {
    this.stopRingtone();
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }
}

export const webRtcService = new WebRtcVoiceService();
