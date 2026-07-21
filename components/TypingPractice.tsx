import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, RefreshCw, Timer, Shield, AlertTriangle } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { SeoGuideSection } from './SeoGuideSection';

// Word databases for typing practice
const EASY_WORDS = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with", "he", "as", "you", 
  "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", 
  "all", "would", "there", "their", "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", 
  "make", "can", "like", "time", "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some", 
  "could", "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think", "also", "back", 
  "after", "use", "two", "how", "our", "work", "first", "well", "way", "even", "new", "want", "because", "any", "these", 
  "give", "day", "most", "us"
];

const MEDIUM_WORDS = [
  "developer", "programming", "javascript", "technology", "interface", "keyboard", "beautiful", "responsive", "application", 
  "database", "frontend", "backend", "connection", "algorithm", "variable", "function", "encryption", "biometrics", 
  "computer", "software", "hardware", "internet", "security", "framework", "performance", "component", "animation", 
  "gradient", "visualizer", "workspace", "efficiency", "accuracy", "practice", "challenge", "keystroke", "calibration", 
  "intelligence", "development", "architecture", "compilation", "rendering", "interactive", "configuration", "credentials"
];

const CODE_SNIPPETS = {
  javascript: "const calculateWpm = (chars, time) => {\n  const words = chars / 5;\n  const minutes = time / 60;\n  return Math.round(words / minutes);\n};",
  python: "def quick_sort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quick_sort(left) + middle + quick_sort(right)",
  html_css: "<div class=\"flex items-center justify-between p-4\">\n  <h1 class=\"text-2xl font-bold text-slate-900\">Bishal Codes</h1>\n  <button class=\"px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700\">\n    Submit\n  </button>\n</div>",
  cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    int n, t1 = 0, t2 = 1, nextTerm = 0;\n    cout << \"Fibonacci Series: \";\n    for (int i = 1; i <= n; ++i) {\n        cout << t1 << \", \";\n        nextTerm = t1 + t2;\n        t1 = t2;\n        t2 = nextTerm;\n    }\n    return 0;\n}"
};

// Keyboard Rows for Visual Keyboard Layout
const KEYBOARD_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"],
  ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
  ["space"]
];

const TypingPractice: React.FC = () => {
  const { navigate } = useNavigation();

  // Mode Selection State
  const [vocabMode, setVocabMode] = useState<'easy' | 'medium' | 'code' | 'custom'>('easy');
  const [codeLang, setCodeLang] = useState<keyof typeof CODE_SNIPPETS>('javascript');
  const [duration, setDuration] = useState<number>(30); // 15, 30, 60, 120
  const [customText, setCustomText] = useState<string>('');

  // Typing Active States
  const [targetText, setTargetText] = useState<string>('');
  const [typedInput, setTypedInput] = useState<string>('');
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  // Statistics
  const [correctChars, setCorrectChars] = useState<number>(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState<number>(0);
  const [errorCount, setErrorCount] = useState<number>(0);
  const [errorKeys, setErrorKeys] = useState<Record<string, number>>({});

  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Generate test text based on configuration
  const generateText = useCallback(() => {
    if (vocabMode === 'easy') {
      const selected = [];
      for (let i = 0; i < 60; i++) {
        selected.push(EASY_WORDS[Math.floor(Math.random() * EASY_WORDS.length)]);
      }
      setTargetText(selected.join(' '));
    } else if (vocabMode === 'medium') {
      const selected = [];
      for (let i = 0; i < 40; i++) {
        selected.push(MEDIUM_WORDS[Math.floor(Math.random() * MEDIUM_WORDS.length)]);
      }
      setTargetText(selected.join(' '));
    } else if (vocabMode === 'code') {
      setTargetText(CODE_SNIPPETS[codeLang]);
    } else if (vocabMode === 'custom') {
      setTargetText(customText.trim() || 'Type or paste your custom practice text here to begin typing...');
    }
    
    setTypedInput('');
    setStartTime(null);
    setTimeLeft(duration);
    setIsFinished(false);
    setIsActive(false);
    setCorrectChars(0);
    setTotalKeystrokes(0);
    setErrorCount(0);
    setErrorKeys({});
  }, [vocabMode, codeLang, duration, customText]);

  // Handle parameters change
  useEffect(() => {
    generateText();
  }, [vocabMode, codeLang, duration, generateText]);

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0 && !isFinished) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsFinished(true);
            setIsActive(false);
            if (interval) clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, isFinished]);

  // Listen to physical keyboard events to highlight visual keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      // Auto-focus on keydown if keys are pressed while typing isn't finished
      if (document.activeElement !== inputRef.current && !isFinished && !e.metaKey && !e.ctrlKey && !e.altKey) {
        inputRef.current?.focus();
        setIsFocused(true);
      }

      if (key === ' ') {
        setActiveKeys((prev) => new Set([...prev, 'space']));
      } else {
        setActiveKeys((prev) => new Set([...prev, key]));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === ' ') {
        setActiveKeys((prev) => {
          const next = new Set(prev);
          next.delete('space');
          return next;
        });
      } else {
        setActiveKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isFinished]);

  const handleWorkspaceClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
      // Ensure cursor is always at the end of the text
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  };

  // Handle raw input updates
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (isFinished) return;

    // Start timer on first keystroke
    if (startTime === null) {
      setStartTime(Date.now());
      setIsActive(true);
    }

    setTotalKeystrokes((prev) => prev + 1);

    // Analyze character changes
    const lastCharIndex = value.length - 1;
    const targetChar = targetText[lastCharIndex];
    const typedChar = value[lastCharIndex];

    if (typedChar !== targetChar) {
      setErrorCount((prev) => prev + 1);
      if (targetChar) {
        const keyName = targetChar === ' ' ? 'space' : targetChar.toLowerCase();
        setErrorKeys((prev) => ({
          ...prev,
          [keyName]: (prev[keyName] || 0) + 1
        }));
      }
    }

    setTypedInput(value);

    // Calculate correct chars
    let correct = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === targetText[i]) {
        correct++;
      }
    }
    setCorrectChars(correct);

    // Auto-complete if finished typing entire target block
    if (value.length >= targetText.length) {
      setIsFinished(true);
      setIsActive(false);
    }
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  // Helper stats math
  const elapsedSeconds = duration - timeLeft;
  const timeDivision = elapsedSeconds > 0 ? elapsedSeconds / 60 : (1 / 60);
  const currentWpm = Math.max(0, Math.round((correctChars / 5) / timeDivision));
  const rawWpm = Math.max(0, Math.round((totalKeystrokes / 5) / timeDivision));
  const currentAccuracy = totalKeystrokes > 0 ? Math.round((correctChars / totalKeystrokes) * 100) : 100;

  // Sorting error letters
  const topErrors = Object.entries(errorKeys)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-100 transition-colors duration-300 pb-16 pt-28 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Navigation & Title */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
          <button 
            onClick={() => navigate('services')}
            className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer uppercase tracking-wider"
          >
            <ArrowLeft size={12} /> Back
          </button>
          
          <div className="text-right">
            <h1 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Typing Studio</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Human-Designed Keyboard Tutor</p>
          </div>
        </div>

        {/* Minimal Setup controls */}
        {!isFinished && (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-550">Practice Mode:</span>
              <div className="flex gap-1.5">
                {(['easy', 'medium', 'code', 'custom'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setVocabMode(m)}
                    className={`px-3.5 py-1.5 text-[10px] font-black uppercase rounded-lg border transition-all cursor-pointer ${
                      vocabMode === m
                        ? 'bg-slate-900 border-slate-900 text-white dark:bg-slate-100 dark:border-slate-100 dark:text-slate-950 font-bold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-850 dark:text-slate-350 dark:hover:bg-slate-800'
                    }`}
                  >
                    {m.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-550">Timer:</span>
              <div className="flex gap-1.5">
                {[15, 30, 60, 120].map((t) => (
                  <button
                    key={t}
                    onClick={() => setDuration(t)}
                    className={`px-3.5 py-1.5 text-[10px] font-black uppercase rounded-lg border transition-all cursor-pointer ${
                      duration === t
                        ? 'bg-slate-900 border-slate-900 text-white dark:bg-slate-100 dark:border-slate-100 dark:text-slate-950 font-bold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-850 dark:text-slate-350 dark:hover:bg-slate-800'
                    }`}
                  >
                    {t}s
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic code languages settings */}
        {vocabMode === 'code' && !isFinished && (
          <div className="bg-white dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl p-3 mb-6 flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500">Snippet Language:</span>
            <div className="flex gap-1.5">
              {Object.keys(CODE_SNIPPETS).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setCodeLang(lang as keyof typeof CODE_SNIPPETS)}
                  className={`px-2.5 py-1.5 text-[9px] font-black uppercase rounded border transition-all cursor-pointer ${
                    codeLang === lang
                      ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-950 dark:border-slate-200'
                      : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-850 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  {lang.replace('_', '/')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom text entry input box */}
        {vocabMode === 'custom' && !isFinished && (
          <div className="bg-white dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6 space-y-3">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500">Paste Custom Text Block</label>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Paste or type any paragraph here to practice typing..."
              className="w-full h-20 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg outline-none focus:border-indigo-500 text-xs font-mono text-slate-800 dark:text-slate-200 resize-none transition-colors"
            />
            <button 
              onClick={generateText}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-950 text-[10px] font-black uppercase rounded-lg transition-colors cursor-pointer"
            >
              Apply Custom Text
            </button>
          </div>
        )}

        {!isFinished ? (
          /* Centered typing workspace */
          <div className="space-y-8">
            
            {/* The main workspace block */}
            <div 
              onClick={handleWorkspaceClick}
              className="w-full bg-white dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/80 rounded-2xl p-6 sm:p-10 min-h-[220px] relative cursor-text overflow-hidden transition-all shadow-sm"
            >

              {/* Hidden text listener */}
              <textarea
                ref={inputRef}
                value={typedInput}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className="fixed opacity-0 pointer-events-none w-[1px] h-[1px] left-[-9999px] top-[-9999px]"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck="false"
              />

              {/* Text rendering wrapper - HIGH CONTRAST COLORS */}
              <div className="font-mono text-lg sm:text-2xl leading-relaxed text-slate-400 dark:text-slate-600 tracking-wide break-words whitespace-pre-wrap select-none pr-1">
                {targetText.split('').map((char, index) => {
                  let charClass = "transition-all duration-75 relative";
                  let isCurrent = index === typedInput.length;
                  
                  if (index < typedInput.length) {
                    const isCorrect = typedInput[index] === char;
                    charClass = isCorrect 
                      ? "text-slate-900 dark:text-slate-100 font-bold" 
                      : "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 rounded border-b-2 border-rose-500 font-bold";
                  }

                  return (
                    <span key={index} className={charClass}>
                      {isCurrent && (
                        <span className="absolute left-0 top-[2px] w-[2px] h-[1.15em] bg-indigo-650 dark:bg-indigo-400 animate-pulse" />
                      )}
                      {char}
                    </span>
                  );
                })}
              </div>

            </div>

            {/* Simple statistics row beneath workspace */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="text-center">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">Speed</span>
                <span className="text-xl font-black text-slate-900 dark:text-slate-200 font-mono">{currentWpm} WPM</span>
              </div>
              <div className="text-center">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">Accuracy</span>
                <span className="text-xl font-black text-slate-900 dark:text-slate-200 font-mono">{currentAccuracy}%</span>
              </div>
              <div className="text-center">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">Time Left</span>
                <span className="text-xl font-black text-slate-900 dark:text-slate-200 font-mono">{timeLeft}s</span>
              </div>
              <div className="text-center">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">Errors</span>
                <span className="text-xl font-black text-rose-600 dark:text-rose-450 font-mono">{errorCount}</span>
              </div>
            </div>

            {/* QWERTY Visualizer map */}
            <div className="bg-white dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 block mb-4 text-center">Visual Keyboard Feedback Map</span>
              <div className="space-y-1.5 font-mono">
                {KEYBOARD_ROWS.map((row, rowIdx) => (
                  <div key={rowIdx} className="flex justify-center gap-1">
                    {row.map((key) => {
                      const isSpace = key === 'space';
                      const isPressed = activeKeys.has(key);
                      
                      return (
                        <div
                          key={key}
                          className={`h-8 border text-[10px] font-bold rounded flex items-center justify-center uppercase transition-all duration-75 select-none
                            ${isSpace ? 'w-48 sm:w-60' : 'w-8 sm:w-9'}
                            ${isPressed 
                              ? 'bg-slate-900 border-slate-900 text-white dark:bg-slate-100 dark:border-slate-100 dark:text-slate-950 font-bold scale-[0.97]' 
                              : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-850 dark:text-slate-400'
                            }`}
                        >
                          {isSpace ? 'Space' : key}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Utility control buttons row */}
            <div className="flex justify-center">
              <button
                onClick={generateText}
                className="px-4 py-2 border border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw size={11} />
                Restart Practice
              </button>
            </div>

          </div>
        ) : (
          /* High contrast results summary */
          <div className="bg-white dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 max-w-2xl mx-auto shadow-md text-center">
            
            <h2 className="text-xl font-black uppercase tracking-widest text-slate-900 dark:text-neutral-200 mb-6">Performance Evaluation</h2>

            <div className="grid grid-cols-3 gap-4 border-y border-slate-100 dark:border-slate-800 py-6 mb-6 font-mono">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 block mb-1">Final Speed</span>
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{currentWpm} WPM</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-550 mt-0.5 block">Raw: {rawWpm}</span>
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 block mb-1">Accuracy</span>
                <span className="text-3xl font-black text-emerald-650 dark:text-emerald-450">{currentAccuracy}%</span>
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 block mb-1">Keystrokes</span>
                <span className="text-3xl font-black text-slate-900 dark:text-slate-200">{correctChars} <span className="text-sm text-slate-400 dark:text-slate-550">/ {totalKeystrokes}</span></span>
              </div>
            </div>

            {/* Top error keys list */}
            {topErrors.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-900/35 border border-slate-100 dark:border-slate-850 rounded-xl p-4 text-left mb-6">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 block mb-2">Focus Characters (Errors Breakdown)</span>
                <div className="flex flex-wrap gap-1.5">
                  {topErrors.map(([key, count]) => (
                    <div key={key} className="flex items-center gap-1.5 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded px-2.5 py-1 font-mono text-[10px]">
                      <span className="font-bold text-rose-600 dark:text-rose-400 uppercase">{key}</span>
                      <span className="text-slate-400 dark:text-slate-500">({count}x)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button 
                onClick={generateText}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-850 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-950 text-[10px] font-black uppercase rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw size={11} /> Practice Again
              </button>
              <button 
                onClick={() => setVocabMode('easy')}
                className="px-5 py-2 border border-slate-250 hover:border-slate-350 dark:border-slate-800 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 text-[10px] font-black uppercase rounded-lg transition-colors cursor-pointer"
              >
                Change mode
              </button>
            </div>

          </div>
        )}

        {/* Footer simple shield note */}
        <div className="mt-12 text-center text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase flex items-center justify-center gap-2 tracking-wide">
          <Shield size={12} className="text-slate-400 dark:text-slate-600" />
          <span>Keystroke Shield: 100% Offline client-side execution. Inputs are not saved.</span>
        </div>

      </div>

      {/* Dynamic SEO FAQs and guides */}
      <div className="max-w-7xl mx-auto mt-16 border-t border-slate-200 dark:border-slate-800 pt-10">
        <SeoGuideSection toolId="typing-practice" />
      </div>

    </div>
  );
};

export default TypingPractice;
