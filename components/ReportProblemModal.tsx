
import React, { useState } from 'react';
import { X, AlertTriangle, Send, CheckCircle2, Loader2 } from 'lucide-react';
// @ts-ignore
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';

interface ReportProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReportProblemModal: React.FC<ReportProblemModalProps> = ({ isOpen, onClose }) => {
  const [form, setForm] = useState({ name: '', email: '', problem: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      // Save report to Firestore
      await addDoc(collection(db, 'reports'), {
        ...form,
        timestamp: Date.now(),
        status: 'new'
      });

      // Trigger automatic bug/problem email notification in background
      fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'report',
          data: form,
        }),
      }).catch((err) => {
        console.error('Failed to dispatch automatic bug report email notification:', err);
      });

      setStatus('success');
      setTimeout(() => {
        onClose();
        setStatus('idle');
        setForm({ name: '', email: '', problem: '' });
      }, 2500);
    } catch (error) {
      alert("Failed to transmit report. Please try WhatsApp.");
      setStatus('idle');
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100">
          <X size={20} />
        </button>

        <div className="p-6 sm:p-8">
          {status === 'success' ? (
            <div className="text-center py-8 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Report Submitted</h3>
              <p className="text-slate-500 text-sm">Thank you for letting us know. We will look into it.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center border border-slate-200">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Report a Problem</h2>
                  <p className="text-sm text-slate-500">Let us know if you found a bug or issue.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Full Name *</label>
                  <input 
                    required type="text" placeholder="John Doe"
                    value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full bg-white border border-slate-300 px-4 py-2.5 rounded-lg text-slate-900 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Email Address</label>
                  <input 
                    type="email" placeholder="john@example.com"
                    value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full bg-white border border-slate-300 px-4 py-2.5 rounded-lg text-slate-900 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Description *</label>
                  <textarea 
                    required rows={4} placeholder="Please describe the issue you encountered..."
                    value={form.problem} onChange={e => setForm({...form, problem: e.target.value})}
                    className="w-full bg-white border border-slate-300 px-4 py-3 rounded-lg text-slate-900 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                  />
                </div>

                <button 
                  disabled={status === 'submitting'}
                  className="w-full mt-2 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {status === 'submitting' ? <Loader2 className="animate-spin" size={18} /> : <><Send size={16} /> Submit Report</>}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportProblemModal;
