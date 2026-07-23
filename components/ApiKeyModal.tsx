
import React, { useState } from 'react';
import { KeyRound, ExternalLink, Save, X, Loader2 } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  isSaving?: boolean;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, isSaving }) => {
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (inputValue.trim()) {
      onSave(inputValue.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors">
          <X size={24} />
        </button>

        <div className="p-8 sm:p-12 text-center">
            <div className="w-20 h-20 bg-red-50 text-[#e52521] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-100">
                <KeyRound size={40} />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight mb-3">API Key Required</h2>
            <p className="text-slate-500 font-normal max-w-md mx-auto mb-8">
                To use the AI tools, please configure your Google Gemini API key. You can get a free key from Google AI Studio.
            </p>

            <div className="space-y-4">
                <input 
                    type="password"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Paste your API key here..."
                    className="w-full text-center bg-slate-100 border border-slate-200 px-4 py-3 rounded-xl text-slate-900 font-normal outline-none focus:border-[#e52521] focus:ring-2 focus:ring-indigo-100 transition-all text-xs"
                />
                <button 
                    onClick={handleSave}
                    disabled={isSaving || !inputValue.trim()}
                    className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-sm active:scale-95 disabled:opacity-50"
                >
                    {isSaving ? <Loader2 className="animate-spin" size={16}/> : <><Save size={16}/> Save & Continue</>}
                </button>
            </div>
            
            <a href="https://ai.google.dev/gemini-api/docs/api-key" target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#e52521] hover:underline">
                Get your Free API Key <ExternalLink size={14} />
            </a>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
