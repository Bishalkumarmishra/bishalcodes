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
      {liveEdit && (
        <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-800 p-4 rounded-2xl shadow-2xl max-w-xs text-[11px] flex flex-col gap-1.5 transition-all duration-300 transform scale-100 origin-bottom-right">
          <p className="font-bold flex items-center gap-1 text-amber-400 text-[12px]">
            <span>✏️ Live Visual Editor Active</span>
          </p>
          <p className="text-slate-300 leading-relaxed font-medium">
            Double-click or click directly on titles, bios, texts, or stats to edit them. Click outside or press Enter to save instantly!
          </p>
          {savedStatus === 'saving' && (
            <p className="text-amber-400 font-semibold mt-1 flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" /> Saving to database...
            </p>
          )}
          {savedStatus === 'saved' && (
            <p className="text-emerald-400 font-semibold mt-1 flex items-center gap-1.5">
              <Check size={12} className="stroke-[3]" /> Saved to database!
            </p>
          )}
        </div>
      )}
      
      <button
        onClick={toggleEdit}
        title={liveEdit ? 'Exit Live Edit' : 'Live Visual Edit'}
        className={`flex items-center justify-center w-11 h-11 rounded-full shadow-xl border transition-all duration-300 active:scale-95 ${
          liveEdit 
            ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400' 
            : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-700'
        }`}
      >
        <Edit2 size={16} className={liveEdit ? 'animate-pulse' : ''} />
      </button>
    </div>
  );
};

export default LiveEditWidget;
