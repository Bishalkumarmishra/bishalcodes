import React, { useState, useEffect } from 'react';
import { Sparkles, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
// @ts-ignore
import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { SocialLink } from '../types';

import EditableText from '../components/EditableText';

const Contact: React.FC = () => {
  const [formState, setFormState] = useState({ name: '', email: '', mobile: '', requirements: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [socials, setSocials] = useState<SocialLink[]>([]);

  useEffect(() => {
    const fetchSocials = async () => {
      const snap = await getDoc(doc(db, 'settings', 'socials'));
      if (snap.exists()) setSocials((snap.data() as any).links || []);
      else {
        setSocials([
          { id: 'facebook', name: 'Facebook', url: 'https://www.facebook.com/share/1AhoqK2XMo/', enabled: true },
          { id: 'instagram', name: 'Instagram', url: 'https://www.instagram.com/bishalmishra9827?igsh=NHo2d2I5YTBmdms3', enabled: true },
          { id: 'tiktok', name: 'TikTok', url: 'https://www.tiktok.com/@bishal_mishra1?_r=1&_t=ZS-92jwosZwCW0', enabled: true },
          { id: 'linkedin', name: 'LinkedIn', url: 'https://www.linkedin.com/in/beesalmishra/', enabled: true },
          { id: 'github', name: 'GitHub', url: 'https://github.com/Bishalkumarmishra/bishalcodes', enabled: true },
        ]);
      }
    };
    fetchSocials();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      // Save submission to Firestore
      await addDoc(collection(db, 'submissions'), { ...formState, timestamp: Date.now(), status: 'new' });
      
      // Trigger automatic email notification in background
      fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'contact',
          data: formState,
        }),
      }).catch((err) => {
        console.error('Failed to dispatch automatic email notification:', err);
      });

      setStatus('success');
      setFormState({ name: '', email: '', mobile: '', requirements: '' });
    } catch (error) {
      alert("Submission Error. Try WhatsApp instead.");
      setStatus('idle');
    }
  };

  const getSocialStyle = (name: string) => {
    switch (name) {
      case 'Facebook': return { color: 'bg-indigo-600', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="#ffffff" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> };
      case 'Instagram': return { color: 'bg-rose-600', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="#ffffff" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> };
      case 'TikTok': return { color: 'bg-slate-900', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="#ffffff" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.59-1.01V14.5c.12 5.82-4.99 10.15-10.4 8.78-3.05-.77-5.58-3.55-5.93-6.69-.5-4.43 2.44-8.82 6.81-9.45.62-.1 1.25-.13 1.87-.13v4.03c-.37 0-.74.02-1.1.1-.96.22-1.86.83-2.31 1.72-.45.89-.48 2.03-.04 2.91.44.88 1.34 1.49 2.31 1.72.36.08.73.1 1.1.1 1.12.01 2.22-.01 3.34-.02V.02z"/></svg> };
      case 'LinkedIn': return { color: 'bg-sky-700', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="#ffffff" d="M22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003zM7.12 20.452H3.558V8.995H7.12v11.457zM5.339 7.433c-1.146 0-2.073-.926-2.073-2.072 0-1.147.927-2.073 2.073-2.073s2.073.926 2.073 2.073c0 1.146-.927 2.072-2.073 2.072zm15.112 13.019h-3.557V14.89c0-1.328-.025-3.036-1.85-3.036-1.85 0-2.133 1.445-2.133 2.94v5.658h-3.556V8.995h3.413v1.565h.048c.475-.9 1.636-1.85 3.367-1.85 3.601 0 4.267 2.37 4.267 5.455v6.287z"/></svg> };
      case 'GitHub': return { color: 'bg-zinc-800', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="#ffffff" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg> };
      default: return { color: 'bg-slate-400', icon: null };
    }
  };

  return (
    <section id="contact" className="py-10 sm:py-14 bg-white relative overflow-hidden">
      <div className="w-full px-[5vw] mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          <div className="w-full lg:w-1/2 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3 text-left">
              <div className="text-slate-900 dark:text-white font-semibold text-xs uppercase tracking-wider">
                <EditableText collection="settings" document="contact" field="tag" fallback="Contact" />
              </div>
            </div>
            <h2 className="text-slate-900 text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-left">
              <EditableText collection="settings" document="contact" field="title" fallback="Get in Touch" />
            </h2>
            <div className="text-slate-600 text-base sm:text-lg font-normal leading-relaxed mb-8 max-w-lg text-left">
              <EditableText collection="settings" document="contact" field="description" fallback="If you have a project idea, business inquiry, or technical question, feel free to send a message or reach out via WhatsApp." isTextArea />
            </div>
            
            <a href="https://wa.me/9779827801575" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 mb-8 group w-fit">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-all"><MessageSquare className="text-white fill-white" size={20} /></div>
              <span className="text-slate-800 text-xl sm:text-2xl font-bold tracking-tight hover:text-slate-950 dark:hover:text-white transition-colors">+977 9827801575</span>
            </a>
            
            <div>
              <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider mb-3">Follow Online</p>
              <div className="flex gap-2">
                {socials.filter(s => s.enabled).map((social) => {
                  const style = getSocialStyle(social.name);
                  if (!style.icon) return null;
                  return (
                    <a key={social.id} href={social.url} target="_blank" rel="noopener noreferrer" className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-105 ${style.color} shadow-sm group/social`} aria-label={social.name}>
                      <div className="group-hover/social:scale-105 transition-transform">{style.icon}</div>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="w-full lg:w-1/2">
            <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              {status === 'success' ? (
                <div className="text-center py-12 animate-in zoom-in-95 duration-200">
                   <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={24} className="text-slate-950" /></div>
                   <h3 className="text-slate-900 text-xl font-bold mb-2">Message Sent</h3>
                   <p className="text-slate-500 text-sm font-normal">Thank you for reaching out. I'll get back to you shortly.</p>
                   <button onClick={() => setStatus('idle')} className="mt-8 bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold text-xs hover:bg-slate-100 transition-all">Send Another Message</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Full Name</label>
                      <input type="text" required value={formState.name} onChange={(e) => setFormState({...formState, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-900 outline-none focus:border-slate-950 dark:focus:border-white focus:bg-white transition-all placeholder:text-slate-300 font-normal text-sm" placeholder="Your name"/>
                    </div>
                    <div className="grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Email (optional)</label>
                        <input type="email" value={formState.email} onChange={(e) => setFormState({...formState, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-900 outline-none focus:border-slate-950 dark:focus:border-white focus:bg-white transition-all placeholder:text-slate-300 font-normal text-sm" placeholder="email@example.com"/>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Mobile Number</label>
                    <input type="tel" required value={formState.mobile} onChange={(e) => setFormState({...formState, mobile: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-900 outline-none focus:border-slate-950 dark:focus:border-white focus:bg-white transition-all placeholder:text-slate-300 font-normal text-sm" placeholder="Your phone number"/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Requirements</label>
                    <textarea rows={4} required value={formState.requirements} onChange={(e) => setFormState({...formState, requirements: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-900 outline-none focus:border-slate-950 dark:focus:border-white focus:bg-white transition-all placeholder:text-slate-300 font-normal resize-none text-sm" placeholder="Describe your project requirements..."></textarea>
                  </div>
                  <button type="submit" disabled={status === 'sending'} className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-semibold text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50">
                    {status === 'sending' ? 'Sending...' : <>Send Message <Send size={14} /></>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
