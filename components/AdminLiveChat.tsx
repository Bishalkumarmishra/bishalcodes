import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, User, Mail, Phone, PhoneCall, MessageSquare, ExternalLink, Clock, ShieldCheck, CheckCheck, RefreshCw, Paperclip, Bot, Sparkles, AlertCircle, Trash2 } from 'lucide-react';
import WebVoiceCallModal, { WebCallState } from './WebVoiceCallModal';
import { webRtcService } from '../services/webRtcCall';
import { db } from '../services/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs, query } from 'firebase/firestore';

export interface UserLeadInfo {
  name: string;
  email: string;
  phone: string;
  sessionId: string;
  createdAt: string;
}

export interface ChatMessageItem {
  id: string;
  sessionId: string;
  sender: 'user' | 'admin' | 'bot';
  text: string;
  timestamp: string;
  image?: string;
  fileName?: string;
}

export interface SupportSession {
  lead: UserLeadInfo;
  messages: ChatMessageItem[];
  lastUpdated: string;
  unreadAdminCount: number;
  adminHandled?: boolean;
}

const STORAGE_KEY_SESSIONS = 'bishal_live_support_sessions';
const BROADCAST_CHANNEL_NAME = 'bishal_live_chat_channel';

export const getCanonicalSessionId = (email?: string, fallbackId?: string) => {
  if (email && email.includes('@')) {
    return 'session_' + email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  }
  return fallbackId || 'session_default';
};

const AdminLiveChat: React.FC = () => {
  const [sessions, setSessions] = useState<SupportSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // In-App Voice Call State
  const [callState, setCallState] = useState<WebCallState | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const durationTimerRef = useRef<any>(null);

  // Listen for WebRTC Voice Signals from local channels & global Firestore
  useEffect(() => {
    const handleSignal = (signal: any) => {
      if (!signal) return;
      if (signal.type === 'CALL_INIT' && signal.callerRole === 'user') {
        setCallState({
          status: 'ringing',
          callerName: signal.callerName || 'Customer',
          callerRole: 'user',
          calleeName: 'Bishal Mishra (Admin)',
          sessionId: signal.sessionId
        });
        webRtcService.startRingtone();
      } else if (signal.type === 'CALL_ACCEPT' && signal.sessionId === callState?.sessionId) {
        webRtcService.stopRingtone();
        webRtcService.playCallConnectedChime();
        setCallState(prev => prev ? { ...prev, status: 'connected' } : null);
        startDurationTimer();
      } else if (signal.type === 'CALL_END') {
        endActiveCall();
      }
    };

    // 1. Listen to active session's WebRTC signals in Firestore
    let unsubFirestore: () => void = () => {};
    if (activeSessionId) {
      try {
        unsubFirestore = onSnapshot(doc(db, 'webrtc_signals', activeSessionId), (snap) => {
          if (snap.exists()) {
            handleSignal(snap.data());
          }
        });
      } catch (e) {}
    }

    // 2. BroadcastChannel & Storage fallback
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('bishal_webrtc_call_channel');
      bc.onmessage = (e) => handleSignal(e.data);
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'bishal_webrtc_signal' && e.newValue) {
        handleSignal(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      if (bc) bc.close();
      unsubFirestore();
    };
  }, [callState, activeSessionId]);

  const startDurationTimer = () => {
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    setCallDuration(0);
    durationTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const initiateAdminCall = async () => {
    if (!activeSession) return;
    await webRtcService.getMicrophoneStream();
    setCallState({
      status: 'calling',
      callerName: 'Bishal Mishra (Admin)',
      callerRole: 'admin',
      calleeName: activeSession.lead.name,
      sessionId: activeSession.lead.sessionId
    });
    webRtcService.startRingtone();
    webRtcService.sendSignal({
      type: 'CALL_INIT',
      sessionId: activeSession.lead.sessionId,
      callerName: 'Bishal Mishra (Admin)',
      callerRole: 'admin'
    });
  };

  const acceptIncomingCall = async () => {
    await webRtcService.getMicrophoneStream();
    webRtcService.stopRingtone();
    webRtcService.playCallConnectedChime();
    setCallState(prev => prev ? { ...prev, status: 'connected' } : null);
    startDurationTimer();
    if (callState) {
      webRtcService.sendSignal({
        type: 'CALL_ACCEPT',
        sessionId: callState.sessionId,
        callerName: 'Bishal Mishra (Admin)',
        callerRole: 'admin'
      });
    }
  };

  const endActiveCall = () => {
    webRtcService.cleanup();
    webRtcService.playCallEndedChime();
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    if (callState) {
      webRtcService.sendSignal({
        type: 'CALL_END',
        sessionId: callState.sessionId,
        callerName: 'Bishal Mishra (Admin)',
        callerRole: 'admin'
      });
    }
    setCallState(null);
    setCallDuration(0);
  };

  // Real-time Firebase Firestore Subscription for Live Customer Sessions
  useEffect(() => {
    try {
      const q = query(collection(db, 'support_sessions'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const liveSessions: SupportSession[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as SupportSession;
          if (data && data.lead) {
            liveSessions.push(data);
          }
        });

        // Sort by last updated timestamp descending
        liveSessions.sort((a, b) => new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime());

        if (liveSessions.length > 0) {
          setSessions(liveSessions);
          localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(liveSessions));

          setActiveSessionId(prev => prev || liveSessions[0].lead.sessionId);
        }
      }, (error) => {
        console.warn("Firestore support_sessions subscription warning:", error);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error("Failed to connect to Firebase Firestore live support sessions:", err);
    }
  }, []);

  // Fetch sessions from Firestore (support_sessions + submissions) and localStorage
  const loadSessions = async () => {
    const combinedSessions: SupportSession[] = [];
    const emailsSeen = new Set<string>();

    // 1. Fetch from support_sessions collection
    try {
      const snap = await getDocs(collection(db, 'support_sessions'));
      snap.forEach(docSnap => {
        const d = docSnap.data() as SupportSession;
        if (d && d.lead && d.lead.email) {
          emailsSeen.add(d.lead.email);
          combinedSessions.push(d);
        }
      });
    } catch (e) {
      console.warn("Could not fetch support_sessions from Firestore:", e);
    }

    // 2. Fetch from submissions collection (Contact form entries & Chat leads)
    try {
      const subSnap = await getDocs(collection(db, 'submissions'));
      subSnap.forEach(docSnap => {
        const d = docSnap.data();
        if (d && d.email && !emailsSeen.has(d.email)) {
          emailsSeen.add(d.email);
          const sId = getCanonicalSessionId(d.email, docSnap.id);
          combinedSessions.push({
            lead: {
              name: d.name || 'Anonymous Lead',
              email: d.email,
              phone: d.phone || d.mobile || '+977 9827801575',
              sessionId: sId,
              createdAt: new Date(d.timestamp || Date.now()).toISOString()
            },
            messages: [
              {
                id: 'msg_' + docSnap.id,
                sessionId: sId,
                sender: 'user',
                text: d.message || 'Submitted customer lead inquiry',
                timestamp: new Date(d.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ],
            lastUpdated: new Date(d.timestamp || Date.now()).toISOString(),
            unreadAdminCount: d.status === 'new' ? 1 : 0
          });
        }
      });
    } catch (e) {
      console.warn("Could not fetch submissions from Firestore:", e);
    }

    // 3. Fallback from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (stored) {
        const parsed: SupportSession[] = JSON.parse(stored);
        parsed.forEach(p => {
          if (p.lead && p.lead.email && !emailsSeen.has(p.lead.email)) {
            emailsSeen.add(p.lead.email);
            combinedSessions.push(p);
          }
        });
      }
    } catch (e) {}

    // Sort by last updated descending
    combinedSessions.sort((a, b) => new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime());

    if (combinedSessions.length > 0) {
      setSessions(combinedSessions);
      setActiveSessionId(prev => prev || combinedSessions[0].lead.sessionId);
    }
  };

  useEffect(() => {
    loadSessions();

    // BroadcastChannel real-time sync
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bc.onmessage = (event) => {
        if (event.data?.type === 'NEW_MESSAGE' || event.data?.type === 'NEW_LEAD' || event.data?.type === 'SESSION_UPDATE') {
          loadSessions();
        }
      };
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_SESSIONS) {
        loadSessions();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (bc) bc.close();
    };
  }, []);

  const activeSession = sessions.find(s => s.lead.sessionId === activeSessionId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeSession?.messages]);

  // Mark session unread count as zero when opened
  useEffect(() => {
    if (activeSessionId) {
      setSessions(prev => {
        const updated = prev.map(s => {
          if (s.lead.sessionId === activeSessionId && s.unreadAdminCount > 0) {
            return { ...s, unreadAdminCount: 0 };
          }
          return s;
        });
        localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updated));
        return updated;
      });
    }
  }, [activeSessionId]);

  // Send admin reply
  const handleSendAdminReply = async (textToSend?: string) => {
    const content = textToSend || replyText;
    if (!content.trim() || !activeSessionId) return;

    const newMsg: ChatMessageItem = {
      id: 'admin_' + Date.now(),
      sessionId: activeSessionId,
      sender: 'admin',
      text: content.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const targetSession = sessions.find(s => s.lead.sessionId === activeSessionId);
    if (!targetSession) return;

    const updatedMessages = [...(targetSession.messages || []), newMsg];
    const updatedSessionObj = {
      ...targetSession,
      messages: updatedMessages,
      lastUpdated: new Date().toISOString(),
      adminHandled: true,
      unreadAdminCount: 0
    };

    // Optimistic UI state update
    setSessions(prev => prev.map(s => s.lead.sessionId === activeSessionId ? updatedSessionObj : s));
    setReplyText('');

    // 1. Sync to Firebase Firestore
    try {
      await setDoc(doc(db, 'support_sessions', activeSessionId), updatedSessionObj, { merge: true });
    } catch (e) {
      console.error("Failed to sync admin reply to Firestore:", e);
    }

    // 2. Sync to localStorage
    try {
      const updatedSessions = sessions.map(s => s.lead.sessionId === activeSessionId ? updatedSessionObj : s);
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updatedSessions));
    } catch (e) {}

    // 3. Broadcast to user chat window
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bc.postMessage({
        type: 'ADMIN_REPLY',
        sessionId: activeSessionId,
        message: newMsg
      });
      bc.close();
    }
  };

  // Delete session
  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm("Are you sure you want to delete this customer chat lead?")) return;

    // 1. Delete from Firestore
    try {
      await deleteDoc(doc(db, 'support_sessions', sessionId));
    } catch (e) {
      console.error("Failed to delete session from Firestore:", e);
    }

    // 2. Delete from local state & storage
    const filtered = sessions.filter(s => s.lead.sessionId !== sessionId);
    setSessions(filtered);
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(filtered));
    if (activeSessionId === sessionId) {
      setActiveSessionId(filtered.length > 0 ? filtered[0].lead.sessionId : null);
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.lead.phone.includes(searchQuery)
  );

  return (
    <div className="h-[calc(100vh-120px)] bg-white border border-slate-200 rounded-2xl flex overflow-hidden shadow-sm text-slate-800 font-sans">
      
      {/* Left Sidebar: Customer Leads & Chat Sessions */}
      {/* On mobile: hidden when chat is open. On desktop: always visible */}
      <div className={`${mobileChatOpen ? 'hidden' : 'flex'} md:flex w-full md:w-80 lg:w-96 border-r border-slate-200 bg-slate-50/70 flex-col shrink-0`}>
        
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 bg-white flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <MessageSquare size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 tracking-tight">Live Chat Support</h3>
                <p className="text-[11px] text-slate-500">{sessions.length} Customer Leads Registered</p>
              </div>
            </div>
            <button
              onClick={loadSessions}
              className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-lg transition-colors"
              title="Refresh sessions"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads by name, gmail, mobile..."
              className="w-full bg-slate-100 border border-slate-200/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-600 focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-200/60">
          {filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
              <User size={32} className="opacity-40" />
              <p className="text-xs font-semibold text-slate-600">No customer leads found</p>
              <p className="text-[10px]">When visitors fill out the chat form, their leads appear here live!</p>
            </div>
          ) : (
            filteredSessions.map((s) => {
              const lastMsg = s.messages[s.messages.length - 1];
              const isSelected = s.lead.sessionId === activeSessionId;

              return (
                <div
                  key={s.lead.sessionId}
                  onClick={() => { setActiveSessionId(s.lead.sessionId); setMobileChatOpen(true); }}
                  className={`p-3.5 cursor-pointer transition-all flex items-start gap-3 relative hover:bg-slate-100/80 ${isSelected ? 'bg-indigo-50/90 border-l-4 border-indigo-600' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-xs">
                    {s.lead.name.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-900 truncate">{s.lead.name}</h4>
                      <span className="text-[9.5px] text-slate-400 shrink-0">
                        {lastMsg ? lastMsg.timestamp : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[10.5px] text-slate-500">
                      <span className="truncate flex items-center gap-1">
                        <Mail size={10} className="text-indigo-600 shrink-0" />
                        {s.lead.email}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[10.5px] text-slate-500">
                      <span className="truncate flex items-center gap-1">
                        <Phone size={10} className="text-emerald-600 shrink-0" />
                        {s.lead.phone}
                      </span>
                    </div>

                    {lastMsg && (
                      <p className="text-[11px] text-slate-600 truncate mt-1 font-normal">
                        <span className="font-semibold text-slate-700">
                          {lastMsg.sender === 'user' ? 'User: ' : lastMsg.sender === 'admin' ? 'Admin: ' : 'AI: '}
                        </span>
                        {lastMsg.text}
                      </p>
                    )}
                  </div>

                  {s.unreadAdminCount > 0 && (
                    <span className="w-4 h-4 bg-indigo-600 text-white font-bold text-[9px] rounded-full flex items-center justify-center shrink-0 shadow-xs">
                      {s.unreadAdminCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Chat Pane */}
      {/* On mobile: only shown when mobileChatOpen. On desktop: always shown */}
      <div className={`${mobileChatOpen ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-white`}>
        {activeSession ? (
          <>
            {/* Active Lead Header */}
            <div className="p-3 bg-white border-b border-slate-200 flex flex-col gap-2 shrink-0 shadow-xs">
              {/* Row 1: Back (mobile) + Avatar + Name */}
              <div className="flex items-center gap-2 min-w-0">
                {/* Back button — mobile only */}
                <button
                  onClick={() => setMobileChatOpen(false)}
                  className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 shrink-0"
                  aria-label="Back to list"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-xs">
                  {activeSession.lead.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-slate-900 truncate">{activeSession.lead.name}</h3>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold rounded-full uppercase tracking-wider shrink-0">
                      Verified Lead
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500 mt-0.5 font-medium">
                    <span className="flex items-center gap-1 truncate">
                      <Mail size={10} className="text-indigo-600 shrink-0" /> {activeSession.lead.email}
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Phone size={10} className="text-emerald-600 shrink-0" /> {activeSession.lead.phone}
                    </span>
                  </div>
                </div>
              </div>


              {/* Row 2: Action Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={initiateAdminCall}
                  className="flex-1 min-w-[100px] px-2 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  title="Make direct in-app voice call to customer"
                >
                  <PhoneCall size={12} /> <span>Live Call</span>
                </button>

                <a
                  href={`https://wa.me/${activeSession.lead.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[100px] px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <MessageSquare size={12} /> <span>WhatsApp</span>
                </a>

                <a
                  href={`tel:${activeSession.lead.phone}`}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200"
                >
                  <Phone size={12} />
                </a>

                <button
                  onClick={() => handleDeleteSession(activeSession.lead.sessionId)}
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors border border-rose-200"
                  title="Delete Lead Session"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* AI vs Live Mode Banner */}
            <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-xs flex-wrap">
              <Sparkles size={12} className="text-indigo-600 shrink-0" />
              <span className="text-slate-700 font-medium text-[11px]">
                <strong className="text-slate-900">{activeSession.adminHandled ? "Admin Live" : "AI Standby"}</strong>
                {' — '}{activeSession.adminHandled ? "Your replies take priority" : "AI assists if admin is away"}
              </span>
            </div>

            {/* Chat Stream */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40 text-xs">
              {activeSession.messages.map((m, i) => {
                const isUser = m.sender === 'user';
                const isAdmin = m.sender === 'admin';

                return (
                  <div key={m.id || i} className={`flex gap-2.5 ${isUser ? 'justify-start' : 'justify-end'}`}>
                    {isUser && (
                      <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5 shadow-xs">
                        {activeSession.lead.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className={`max-w-[75%] flex flex-col ${isUser ? 'items-start' : 'items-end'}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold text-slate-600">
                          {isUser ? activeSession.lead.name : isAdmin ? "Admin (Bishal Mishra)" : "AI Support Desk"}
                        </span>
                        <span className="text-[9px] text-slate-400">{m.timestamp}</span>
                      </div>

                      <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-xs ${
                        isUser
                          ? 'bg-slate-900 text-white rounded-tl-none'
                          : isAdmin
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-white text-slate-800 border border-slate-200/90 rounded-tr-none'
                      }`}>
                        {m.image && (
                          <div className="mb-2 rounded-lg overflow-hidden border border-slate-200">
                            <img src={m.image} alt="Attachment" className="max-w-[240px] max-h-[180px] object-cover" />
                          </div>
                        )}
                        {m.text}
                      </div>
                    </div>

                    {!isUser && (
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] mt-0.5 shadow-xs ${
                        isAdmin ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'
                      }`}>
                        {isAdmin ? <User size={12} /> : <Bot size={12} />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Presets */}
            <div className="px-3 py-1.5 bg-slate-100/80 border-t border-slate-200 flex gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
              <button
                onClick={() => handleSendAdminReply("Hi! Thanks for reaching out. I've reviewed your request and I'm available to discuss your project directly.")}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[10px] font-semibold rounded-lg shrink-0 transition-colors shadow-2xs"
              >
                👋 Greeting Preset
              </button>
              <button
                onClick={() => handleSendAdminReply("Our Informative website package starts at Rs. 10,000 to Rs. 25,000, and E-Commerce starts at Rs. 25,000 to Rs. 55,000.")}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[10px] font-semibold rounded-lg shrink-0 transition-colors shadow-2xs"
              >
                💰 Send Pricing Info
              </button>
              <button
                onClick={() => handleSendAdminReply("I'd be happy to schedule a 1-on-1 call or discuss on WhatsApp (+977 9827801575). What time works best for you?")}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[10px] font-semibold rounded-lg shrink-0 transition-colors shadow-2xs"
              >
                📅 Schedule Call
              </button>
            </div>

            {/* Admin Input Bar */}
            <div className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendAdminReply()}
                placeholder={`Reply to ${activeSession.lead.name}...`}
                className="flex-1 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-600 focus:bg-white transition-all font-medium"
              />
              <button
                onClick={() => handleSendAdminReply()}
                disabled={!replyText.trim()}
                className="p-2.5 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-1 transition-all disabled:opacity-40 shrink-0 shadow-xs"
              >
                <Send size={14} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <MessageSquare size={48} className="opacity-30 mb-3 text-slate-500" />
            <h3 className="font-bold text-sm text-slate-700">Select a Customer Chat Session</h3>
            <p className="text-xs max-w-sm mt-1 text-slate-500">Choose a customer lead from the sidebar to view their full chat history and reply live in real-time!</p>
          </div>
        )}
      </div>

      {/* In-App Voice Call Overlay Modal */}
      <WebVoiceCallModal
        callState={callState}
        onAcceptCall={acceptIncomingCall}
        onEndCall={endActiveCall}
        onToggleMute={() => setIsMuted(prev => !prev)}
        isMuted={isMuted}
        callDuration={callDuration}
      />

    </div>
  );
};

export default AdminLiveChat;
