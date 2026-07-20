import React, { useState, useEffect } from 'react';
import { Edit2, Check } from 'lucide-react';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const LiveEditWidget: React.FC = () => {
  const [liveEdit, setLiveEdit] = useState(false);
  const [savedStatus, setSavedStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const allowedAdmins = [
      'bishalmishra9000@gmail.com',
      'admin@bishalcodes.com',
      'developer@bishalcodes.com'
    ];

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email && allowedAdmins.includes(user.email)) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        // Turn off edit mode if user is not authorized
        if (typeof window !== 'undefined' && localStorage.getItem('liveEditMode') === 'true') {
          localStorage.removeItem('liveEditMode');
          window.dispatchEvent(new Event('liveEditToggle'));
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isEdit = localStorage.getItem('liveEditMode') === 'true';
      setLiveEdit(isEdit);
    }
  }, []);

  const toggleEdit = () => {
    const newVal = !liveEdit;
    setLiveEdit(newVal);
    localStorage.setItem('liveEditMode', newVal ? 'true' : 'false');
    window.dispatchEvent(new Event('liveEditToggle'));
  };

  useEffect(() => {
    const handleStatus = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === 'saving') {
        setSavedStatus('saving');
      } else if (detail === 'saved') {
        setSavedStatus('saved');
        const timer = setTimeout(() => setSavedStatus('idle'), 2000);
        return () => clearTimeout(timer);
      }
    };
    window.addEventListener('liveEditSaveStatus', handleStatus);
    return () => window.removeEventListener('liveEditSaveStatus', handleStatus);
  }, []);

  if (loading || (!isAdmin && typeof window !== 'undefined' && window.location.hostname !== 'localhost')) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2 font-sans select-none pointer-events-auto">
      {liveEdit && savedStatus !== 'idle' && (
        <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-800 px-4 py-2.5 rounded-xl shadow-2xl text-[11px] flex items-center gap-2 transition-all duration-300">
          {savedStatus === 'saving' && (
            <p className="text-amber-400 font-semibold flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" /> Saving...
            </p>
          )}
          {savedStatus === 'saved' && (
            <p className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <Check size={12} className="stroke-[3]" /> Saved!
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveEditWidget;
