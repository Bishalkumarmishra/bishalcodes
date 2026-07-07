import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRightLeft, Copy, Check, Share2, Volume2, Trash2, Loader2 } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

const LANGUAGES = [
  { name: 'English', code: 'en', locale: 'en-US' },
  { name: 'Nepali (नेपाली)', code: 'ne', locale: 'ne-NP' },
  { name: 'Spanish (Español)', code: 'es', locale: 'es-ES' },
  { name: 'Hindi (हिन्दी)', code: 'hi', locale: 'hi-IN' },
  { name: 'French (Français)', code: 'fr', locale: 'fr-FR' },
  { name: 'Chinese (中文)', code: 'zh', locale: 'zh-CN' },
  { name: 'Japanese (日本語)', code: 'ja', locale: 'ja-JP' },
  { name: 'German (Deutsch)', code: 'de', locale: 'de-DE' },
  { name: 'Arabic (العربية)', code: 'ar', locale: 'ar-SA' },
  { name: 'Portuguese (Português)', code: 'pt', locale: 'pt-PT' },
  { name: 'Russian (Русский)', code: 'ru', locale: 'ru-RU' },
  { name: 'Italian (Italiano)', code: 'it', locale: 'it-IT' }
];

export const LanguageTranslator: React.FC = () => {
  const { navigate } = useNavigation();

  // Input text and translated results
  const [inputText, setInputText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  
  // Selection states
  const [sourceLang, setSourceLang] = useState<string>('en');
  const [targetLang, setTargetLang] = useState<string>('ne');

  // UI state variables
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Maximum character limit
  const maxCharLimit = 4000;

  // Swap Source and Target Languages
  const handleLanguageSwap = () => {
    const tempLang = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(tempLang);

    // Swap texts
    const tempText = inputText;
    setInputText(translatedText);
    setTranslatedText(tempText);
  };

  // Perform translation using the free Google Translate API
  const handleTranslate = useCallback(async () => {
    const textToTranslate = inputText.trim();
    if (!textToTranslate) {
      setTranslatedText('');
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`
      );
      
      if (!response.ok) {
        throw new Error("Translation API responded with error status.");
      }

      const data = await response.json();
      if (data && data[0] && Array.isArray(data[0])) {
        const resultText = data[0].map((x: any) => x && x[0] ? x[0] : '').join('');
        setTranslatedText(resultText);
      } else {
        throw new Error("Invalid response format from translation service.");
      }
    } catch (err: any) {
      console.error("Language Translation Failed:", err);
      setError("Translation failed. Please check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  }, [inputText, sourceLang, targetLang]);

  // Auto-translate with debounce
  useEffect(() => {
    if (!inputText.trim()) {
      setTranslatedText('');
      setError(null);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      handleTranslate();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [inputText, sourceLang, targetLang, handleTranslate]);

  // Copy Translation to Clipboard
  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  // Speak translation using browser speech synthesis
  const handleSpeak = () => {
    if (!translatedText || typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const matchedLang = LANGUAGES.find(l => l.code === targetLang);
    const locale = matchedLang?.locale || 'en-US';

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(translatedText);
    utterance.lang = locale;

    // Find the best voice matching target locale
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => v.lang.startsWith(locale) || v.lang.replace('_', '-').startsWith(locale));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Share translation result
  const handleShare = () => {
    if (!translatedText) return;
    const shareData = {
      title: 'Language Translation',
      text: `Original: ${inputText}\nTranslated: ${translatedText}\n`,
      url: window.location.href
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      handleCopy();
    }
  };

  // Clear text inputs
  const handleClear = () => {
    setInputText('');
    setTranslatedText('');
    setError(null);
  };

  return (
    <div className="w-full text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Top Hero Section */}
      <div className="w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 pt-24 pb-8 md:pt-32 md:pb-12">
        <div className="w-full px-4 md:px-8 mx-auto">
          <div className="flex flex-col items-start gap-4">
            <button 
              onClick={() => navigate('services')}
              className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg"
            >
              &larr; Back to Services
            </button>
            <div className="space-y-2">
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight font-heading">
                Language Translator
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-normal leading-relaxed">
                Just type what you want to translate — it works automatically. Supports Nepali, English, Hindi, Chinese, Spanish, and many more languages.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Page Area */}
      <div className="w-full px-4 md:px-8 py-8">

        {/* Translation Boxes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch w-full">
          
          {/* Left Block - Source Text Input */}
          <div className="flex flex-col space-y-4">
            <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden flex flex-col min-h-[300px]">
              
              {/* Toolbar */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Translate From</span>
                  <select
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    className="bg-transparent text-sm font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang.name} value={lang.code} className="dark:bg-slate-900 text-slate-800 dark:text-slate-200">{lang.name}</option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={handleLanguageSwap}
                  className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title="Swap languages"
                >
                  <ArrowRightLeft size={16} />
                </button>
              </div>

              {/* Text Input Container */}
              <div className="flex-1 p-5 relative flex flex-col">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value.slice(0, maxCharLimit))}
                  placeholder={`Type or paste text to translate... (e.g. Welcome to my website!)`}
                  className="w-full flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed placeholder:text-slate-400 font-medium"
                />
                
                {/* Actions row under input */}
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-4 mt-4 text-xs font-semibold text-slate-500">
                  <span className={inputText.length >= maxCharLimit ? 'text-rose-500' : 'text-slate-400'}>
                    {inputText.length} / {maxCharLimit}
                  </span>
                  {inputText && (
                    <button
                      onClick={handleClear}
                      className="inline-flex items-center gap-1 hover:text-rose-500 cursor-pointer transition-colors"
                    >
                      <Trash2 size={14} />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleTranslate}
              disabled={isLoading || !inputText.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold py-2.5 px-5 rounded-lg text-sm transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center shadow-sm"
            >
              {isLoading ? 'Translating...' : 'Translate Text'}
            </button>
          </div>

          {/* Right Block - Translation Output */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden flex flex-col min-h-[300px] relative">
            
            {/* Loading Cover Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-white/40 dark:bg-slate-950/40 backdrop-blur-[1px] z-20 flex items-center justify-center">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-lg shadow-md flex items-center gap-2 text-xs font-semibold">
                  <Loader2 size={14} className="animate-spin text-indigo-600 dark:text-indigo-400" />
                  <span>Translating...</span>
                </div>
              </div>
            )}

            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Translate To</span>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="bg-transparent text-sm font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.name} value={lang.code} className="dark:bg-slate-900 text-slate-800 dark:text-slate-200">{lang.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Translation Output Box */}
            <div className="flex-1 p-5 flex flex-col">
              <div className="flex-1 text-sm leading-relaxed overflow-y-auto font-medium break-words text-slate-950 dark:text-white">
                {translatedText ? (
                  translatedText
                ) : (
                  <span className="text-slate-400 italic font-normal">Translation output will appear here...</span>
                )}
              </div>

              {/* Error Box */}
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs font-semibold leading-relaxed my-2">
                  {error}
                </div>
              )}

              {/* Toolbar Tools */}
              {translatedText && (
                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-4 mt-4">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold px-3.5 py-2 rounded-lg transition-all active:scale-95 cursor-pointer"
                  >
                    {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handleSpeak}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg transition-all active:scale-95 cursor-pointer ${
                      isSpeaking 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Volume2 size={14} className={isSpeaking ? 'animate-bounce' : ''} />
                    <span>{isSpeaking ? 'Stop Audio' : 'Listen'}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold px-3.5 py-2 rounded-lg transition-all active:scale-95 cursor-pointer"
                  >
                    <Share2 size={14} />
                    <span>Share</span>
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default LanguageTranslator;
