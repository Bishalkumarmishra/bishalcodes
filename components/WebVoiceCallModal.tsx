import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, ShieldCheck, Loader2 } from 'lucide-react';
import { db } from '../services/firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { webRtcService } from '../services/webRtcCall';

export interface WebCallState {
  status: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
  callerName: string;
  callerRole: 'admin' | 'user';
  calleeName: string;
  sessionId: string;
  isMuted?: boolean;
}

interface WebVoiceCallModalProps {
  callState: WebCallState | null;
  onAcceptCall: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
  callDuration: number;
  myRole: 'admin' | 'user';
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// ─── ICE servers for WebRTC NAT traversal ────────────────────────────────────
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

const WebVoiceCallModal: React.FC<WebVoiceCallModalProps> = ({
  callState,
  onAcceptCall,
  onEndCall,
  onToggleMute,
  isMuted,
  callDuration,
  myRole,
}) => {
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  // ─── Full WebRTC SDP exchange via Firestore ─────────────────────────────
  useEffect(() => {
    if (!callState || callState.status !== 'connected') return;

    const sessionId = callState.sessionId;
    let pc: RTCPeerConnection;
    let unsubOffer: () => void = () => {};
    let unsubAnswer: () => void = () => {};
    let unsubCandidates: () => void = () => {};

    const startWebRtc = async () => {
      pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;

      // Play remote stream through hidden audio element
      pc.ontrack = (event) => {
        if (remoteAudioRef.current && event.streams?.[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch(() => {});
        }
      };

      // Get microphone with noise cancellation
      const localStream = await webRtcService.getMicrophoneStream();
      if (localStream) {
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
      }

      const sigDoc = `webrtc_sdp_${sessionId}`;

      // ICE candidate collection — write to Firestore partitioned by role
      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          const candidateKey = myRole === 'admin' ? 'adminCandidates' : 'userCandidates';
          try {
            const docSnap = await getDoc(doc(db, 'webrtc_sdp', sigDoc));
            const prev = docSnap.data() || {};
            const arr = prev[candidateKey] || [];
            arr.push(event.candidate.toJSON());
            await setDoc(doc(db, 'webrtc_sdp', sigDoc), { [candidateKey]: arr }, { merge: true });
          } catch (e) {}
        }
      };

      if (myRole === 'admin') {
        // Admin creates offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await setDoc(doc(db, 'webrtc_sdp', sigDoc), { offer: { type: offer.type, sdp: offer.sdp } }, { merge: true });

        // Listen for answer from user
        unsubAnswer = onSnapshot(doc(db, 'webrtc_sdp', sigDoc), async (snap) => {
          const data = snap.data();
          if (data?.answer && pc.signalingState !== 'stable') {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            } catch (e) {}
          }
          if (data?.userCandidates) {
            for (const c of data.userCandidates) {
              try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (e) {}
            }
          }
        });
      } else {
        // User listens for offer and creates answer
        unsubOffer = onSnapshot(doc(db, 'webrtc_sdp', sigDoc), async (snap) => {
          const data = snap.data();
          if (data?.offer && pc.signalingState === 'stable') {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await setDoc(doc(db, 'webrtc_sdp', sigDoc), { answer: { type: answer.type, sdp: answer.sdp } }, { merge: true });
            } catch (e) {}
          }
          if (data?.adminCandidates) {
            for (const c of data.adminCandidates) {
              try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (e) {}
            }
          }
        });
      }
    };

    startWebRtc();

    return () => {
      unsubOffer();
      unsubAnswer();
      unsubCandidates();
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [callState?.status, callState?.sessionId, myRole]);

  // ─── Clean up peer connection on call end ───────────────────────────────
  useEffect(() => {
    if (!callState || callState.status === 'ended' || callState.status === 'idle') {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
      }
    }
  }, [callState?.status]);

  if (!callState || callState.status === 'idle') return null;

  const isIncoming = callState.status === 'ringing';
  const isConnected = callState.status === 'connected';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      {/* Hidden audio element for remote voice playback */}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />

      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        
        {/* Ambient Glow */}
        <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none transition-all duration-500 ${
          isConnected ? 'bg-emerald-500' : isIncoming ? 'bg-indigo-500 animate-pulse' : 'bg-indigo-600'
        }`} />

        {/* Top Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 border border-slate-700/80 rounded-full text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-6 z-10">
          <ShieldCheck size={12} className="text-emerald-400" />
          <span>Encrypted In-App Web Voice Call</span>
        </div>

        {/* Profile Avatar */}
        <div className="relative mb-4 z-10">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-800 bg-slate-950 shadow-2xl flex items-center justify-center">
            <img
              src="/Bishal.png"
              alt="Bishal Mishra"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="w-full h-full bg-slate-800 text-white font-bold text-2xl flex items-center justify-center absolute inset-0 -z-10">
              BM
            </div>
          </div>
          {!isConnected && (
            <span className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-75 pointer-events-none" />
          )}
        </div>

        {/* Name & Status */}
        <h3 className="font-bold text-lg text-white tracking-tight z-10">
          {callState.callerRole === 'admin' ? 'Bishal Mishra (Admin)' : callState.callerName}
        </h3>

        <p className="text-xs font-semibold text-slate-300 mt-1 z-10 flex items-center justify-center gap-1.5">
          {callState.status === 'calling' && (
            <span className="flex items-center gap-1.5 text-indigo-400">
              <Loader2 size={13} className="animate-spin" /> Calling...
            </span>
          )}
          {callState.status === 'ringing' && (
            <span className="text-emerald-400 font-bold animate-pulse flex items-center gap-1">
              <Phone size={13} /> Incoming Voice Call...
            </span>
          )}
          {callState.status === 'connected' && (
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <Volume2 size={13} className="animate-pulse" /> Live • {formatDuration(callDuration)}
            </span>
          )}
          {callState.status === 'ended' && (
            <span className="text-rose-400">Call Ended</span>
          )}
        </p>

        {/* Controls */}
        <div className="mt-8 flex items-center justify-center gap-6 z-10 w-full">
          {isIncoming ? (
            <>
              <button
                onClick={onEndCall}
                className="w-14 h-14 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all"
                title="Decline"
              >
                <PhoneOff size={22} />
              </button>
              <button
                onClick={onAcceptCall}
                className="w-14 h-14 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all animate-bounce"
                title="Accept"
              >
                <Phone size={22} />
              </button>
            </>
          ) : (
            <>
              {isConnected && (
                <button
                  onClick={onToggleMute}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isMuted ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
              )}
              <button
                onClick={onEndCall}
                className="w-14 h-14 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-all"
                title="End Call"
              >
                <PhoneOff size={22} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebVoiceCallModal;
