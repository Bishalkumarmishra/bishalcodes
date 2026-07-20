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

  // Get User Microphone
  async getMicrophoneStream(): Promise<MediaStream | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.localStream = stream;
      return stream;
    } catch (err) {
      console.warn("Microphone access denied or unavailable:", err);
      return null;
    }
  }

  // High quality realistic dual-frequency phone ringtone synthesizer (440Hz + 480Hz)
  startRingtone() {
    this.stopRingtone();
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const playBurst = () => {
        try {
          const ctx = new AudioCtx();
          const now = ctx.currentTime;

          // Dual Tone Oscillators (440Hz + 480Hz US/Global Telephone Ringtone standard)
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
          console.warn("Audio Context error:", e);
        }
      };

      playBurst();
      this.ringtoneInterval = setInterval(playBurst, 2800);
    } catch (e) {
      console.warn("Ringtone error:", e);
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
      console.warn("Chime error:", e);
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
      console.warn("Chime error:", e);
    }
  }

  // Broadcast Call Signal to Local Tabs & Global Firestore
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
      console.warn("Firestore WebRTC signal sync warning:", e);
    }
  }

  // Cleanup active streams
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
