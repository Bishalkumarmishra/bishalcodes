import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, ShieldCheck, User, Loader2 } from 'lucide-react';

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
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const WebVoiceCallModal: React.FC<WebVoiceCallModalProps> = ({
  callState,
  onAcceptCall,
  onEndCall,
  onToggleMute,
  isMuted,
  callDuration
}) => {
  if (!callState || callState.status === 'idle') return null;

  const isIncoming = callState.status === 'ringing';
  const isConnected = callState.status === 'connected';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        
        {/* Ambient Glow Background Element */}
        <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none transition-all duration-500 ${
          isConnected ? 'bg-emerald-500' : isIncoming ? 'bg-indigo-500 animate-pulse' : 'bg-indigo-600'
        }`} />

        {/* Top Header Badge */}
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
                // Fallback to text initials if image fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="w-full h-full bg-slate-800 text-white font-bold text-2xl flex items-center justify-center absolute inset-0 -z-10">
              BM
            </div>
          </div>

          {/* Pulse ring when calling/ringing */}
          {!isConnected && (
            <span className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-75 pointer-events-none" />
          )}
        </div>

        {/* Contact Name & Call Status */}
        <h3 className="font-bold text-lg text-white tracking-tight z-10">
          {callState.callerRole === 'admin' ? "Bishal Mishra (Admin)" : callState.callerName}
        </h3>

        <p className="text-xs font-semibold text-slate-300 mt-1 z-10 flex items-center justify-center gap-1.5">
          {callState.status === 'calling' && (
            <span className="flex items-center gap-1.5 text-indigo-400">
              <Loader2 size={13} className="animate-spin" /> Calling Bishal Mishra...
            </span>
          )}
          {callState.status === 'ringing' && (
            <span className="text-emerald-400 font-bold animate-pulse flex items-center gap-1">
              <Phone size={13} /> Incoming Voice Call...
            </span>
          )}
          {callState.status === 'connected' && (
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <Volume2 size={13} className="animate-pulse" /> Live Call Connected • {formatDuration(callDuration)}
            </span>
          )}
          {callState.status === 'ended' && (
            <span className="text-rose-400">Call Ended</span>
          )}
        </p>

        {/* Action Control Buttons */}
        <div className="mt-8 flex items-center justify-center gap-6 z-10 w-full">
          {/* Incoming Call Controls: Accept & Reject */}
          {isIncoming ? (
            <>
              <button
                onClick={onEndCall}
                className="w-14 h-14 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all"
                title="Decline Call"
              >
                <PhoneOff size={22} />
              </button>

              <button
                onClick={onAcceptCall}
                className="w-14 h-14 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all animate-bounce"
                title="Accept Call"
              >
                <Phone size={22} />
              </button>
            </>
          ) : (
            /* Active Call Controls: Mute & End Call */
            <>
              {isConnected && (
                <button
                  onClick={onToggleMute}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isMuted ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
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
