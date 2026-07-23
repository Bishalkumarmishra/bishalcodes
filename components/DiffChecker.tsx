import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Diff, Columns, AlignJustify, ArrowLeftRight, Trash2, Clipboard, Check } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { SeoGuideSection } from './SeoGuideSection';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
  lineNumber1?: number;
  lineNumber2?: number;
}

export const DiffChecker: React.FC = () => {
  const { navigate } = useNavigation();

  // Inputs
  const [originalText, setOriginalText] = useState<string>('');
  const [modifiedText, setModifiedText] = useState<string>('');
  const [viewMode, setViewMode] = useState<'split' | 'inline'>('split');

  // Outputs
  const [diffResults, setDiffResults] = useState<DiffLine[]>([]);
  const [addedCount, setAddedCount] = useState<number>(0);
  const [removedCount, setRemovedCount] = useState<number>(0);
  const [isCopiedOriginal, setIsCopiedOriginal] = useState<boolean>(false);
  const [isCopiedModified, setIsCopiedModified] = useState<boolean>(false);

  // Synchronized scroll refs
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const isScrollingLeft = useRef<boolean>(false);
  const isScrollingRight = useRef<boolean>(false);

  // Scroll Sync listeners
  const handleLeftScroll = () => {
    if (isScrollingRight.current || !leftPaneRef.current || !rightPaneRef.current) return;
    isScrollingLeft.current = true;
    rightPaneRef.current.scrollTop = leftPaneRef.current.scrollTop;
    rightPaneRef.current.scrollLeft = leftPaneRef.current.scrollLeft;
    setTimeout(() => {
      isScrollingLeft.current = false;
    }, 50);
  };

  const handleRightScroll = () => {
    if (isScrollingLeft.current || !leftPaneRef.current || !rightPaneRef.current) return;
    isScrollingRight.current = true;
    leftPaneRef.current.scrollTop = rightPaneRef.current.scrollTop;
    leftPaneRef.current.scrollLeft = rightPaneRef.current.scrollLeft;
    setTimeout(() => {
      isScrollingRight.current = false;
    }, 50);
  };

  // Text diff computation using LCS algorithm
  useEffect(() => {
    const lines1 = originalText.split(/\r?\n/);
    const lines2 = modifiedText.split(/\r?\n/);

    const m = lines1.length;
    const n = lines2.length;

    // LCS Table allocation
    const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (lines1[i - 1] === lines2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Backtrack coordinates
    let i = m;
    let j = n;
    const path: DiffLine[] = [];

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && lines1[i - 1] === lines2[j - 1]) {
        path.push({
          type: 'unchanged',
          value: lines1[i - 1],
          lineNumber1: i,
          lineNumber2: j
        });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        path.push({
          type: 'added',
          value: lines2[j - 1],
          lineNumber2: j
        });
        j--;
      } else {
        path.push({
          type: 'removed',
          value: lines1[i - 1],
          lineNumber1: i
        });
        i--;
      }
    }

    const reversed = path.reverse();
    setDiffResults(reversed);

    // Count summaries
    let add = 0;
    let rem = 0;
    reversed.forEach(ln => {
      if (ln.type === 'added') add++;
      if (ln.type === 'removed') rem++;
    });

    setAddedCount(add);
    setRemovedCount(rem);
  }, [originalText, modifiedText]);

  // Load sample content for testing
  const loadSample = () => {
    setOriginalText(
      `Bishal Mishra\nWeb Engineering & Design\n- Responsive components\n- Service worker cache layers\n- Firebase Firestore backend\n\nThank you for visiting my site.`
    );
    setModifiedText(
      `Bishal Mishra\nWorld-Class Web Engineering & 3D Web Architect\n- Responsive components\n- Native Progressive Web Apps (PWA)\n- Cloudinary avatar uploads\n- Firebase Firestore database integrations\n\nEnjoy testing the new tools!`
    );
  };

  const handleSwap = () => {
    const temp = originalText;
    setOriginalText(modifiedText);
    setModifiedText(temp);
  };

  const handleCopy = (text: string, isOriginal: boolean) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      if (isOriginal) {
        setIsCopiedOriginal(true);
        setTimeout(() => setIsCopiedOriginal(false), 2000);
      } else {
        setIsCopiedModified(true);
        setTimeout(() => setIsCopiedModified(false), 2000);
      }
    });
  };

  const handleClear = () => {
    setOriginalText('');
    setModifiedText('');
    setDiffResults([]);
    setAddedCount(0);
    setRemovedCount(0);
  };

  return (
    <div className="w-full text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Top Hero Section */}
      <div className="w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 pt-20 pb-8 md:pt-24 md:pb-12">
        <div className="w-full px-4 md:px-8 mx-auto">
          <div className="flex flex-col items-start gap-4">
            <button 
              onClick={() => navigate('services')}
              className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg"
            >
              <ArrowLeft size={13} />
              Back to Services
            </button>
            <div className="space-y-2">
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight font-heading">
                Instant Text Diff Checker
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-normal leading-relaxed max-w-3xl">
                Compare side-by-side or inline line changes between draft modifications. Visualizes word additions in green and deletions in red. Calculated client-side.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main workspace container */}
      <div className="w-full px-4 md:px-8 py-8">
        
        {/* Editor Fields */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch w-full mb-6">
          
          {/* Left Text Editor (Original) */}
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Original Text (Left)</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(originalText, true)}
                  className="text-slate-400 hover:text-[#e52521] transition-colors p-1"
                  title="Copy text"
                >
                  {isCopiedOriginal ? <Check size={13} className="text-emerald-500" /> : <Clipboard size={13} />}
                </button>
              </div>
            </div>
            <textarea
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              placeholder="Enter original text payload here..."
              rows={8}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 outline-none font-mono text-xs leading-relaxed"
            />
          </div>

          {/* Right Text Editor (Modified) */}
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Modified Text (Right)</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(modifiedText, false)}
                  className="text-slate-400 hover:text-[#e52521] transition-colors p-1"
                  title="Copy text"
                >
                  {isCopiedModified ? <Check size={13} className="text-emerald-500" /> : <Clipboard size={13} />}
                </button>
              </div>
            </div>
            <textarea
              value={modifiedText}
              onChange={(e) => setModifiedText(e.target.value)}
              placeholder="Enter modified draft here..."
              rows={8}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 outline-none font-mono text-xs leading-relaxed"
            />
          </div>

        </div>

        {/* Toolbar & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          
          <div className="flex flex-wrap gap-3 items-center">
            {/* View Mode triggers */}
            <div className="flex bg-slate-200/60 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-250/30 dark:border-slate-700">
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                  viewMode === 'split'
                    ? 'bg-white dark:bg-slate-950 text-[#e52521] dark:text-[#d01f1c] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Columns size={13} />
                Split View
              </button>
              <button
                onClick={() => setViewMode('inline')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                  viewMode === 'inline'
                    ? 'bg-white dark:bg-slate-950 text-[#e52521] dark:text-[#d01f1c] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <AlignJustify size={13} />
                Inline View
              </button>
            </div>

            <button
              onClick={handleSwap}
              className="inline-flex items-center gap-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold hover:text-[#e52521] transition-colors cursor-pointer"
            >
              <ArrowLeftRight size={13} />
              Swap Texts
            </button>
            
            <button
              onClick={loadSample}
              className="text-xs text-[#e52521] dark:text-[#d01f1c] hover:underline font-bold"
            >
              Load Sample Text
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500" /> +{addedCount} Added</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500" /> -{removedCount} Removed</span>
            <button
              onClick={handleClear}
              className="text-rose-500 hover:text-rose-600 flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-800 cursor-pointer"
            >
              <Trash2 size={13} />
              Clear
            </button>
          </div>

        </div>

        {/* Diff Comparison Canvas */}
        {diffResults.length > 0 && (
          <div className="bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-xl overflow-hidden font-mono text-xs select-text">
            
            <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex items-center gap-1.5 text-slate-500 font-bold select-none text-[10px] uppercase tracking-wider">
              <Diff size={12} className="text-[#e52521]" />
              Diff Comparison Output
            </div>

            {viewMode === 'split' ? (
              // SPLIT VIEW RENDERING
              <div className="grid grid-cols-2 divide-x divide-slate-800 max-h-[500px] overflow-hidden">
                
                {/* Left Side: Original Pane */}
                <div 
                  ref={leftPaneRef}
                  onScroll={handleLeftScroll}
                  className="overflow-auto max-h-[460px] divide-y divide-slate-900/10"
                >
                  {diffResults.map((line, idx) => {
                    const isAdded = line.type === 'added';
                    const isRemoved = line.type === 'removed';
                    
                    return (
                      <div 
                        key={idx} 
                        className={`flex py-1.5 px-3 min-h-[28px] ${
                          isRemoved 
                            ? 'bg-rose-500/15 text-rose-300' 
                            : isAdded 
                              ? 'bg-slate-900/40 text-slate-600/40 select-none' 
                              : ''
                        }`}
                      >
                        <span className="w-6 shrink-0 text-right pr-2 text-slate-600 select-none text-[10px]">
                          {!isAdded ? line.lineNumber1 : ''}
                        </span>
                        <span className="mr-2 text-slate-600 shrink-0 select-none w-2">
                          {isRemoved ? '-' : ' '}
                        </span>
                        <span className="whitespace-pre flex-1 break-all">
                          {isAdded ? '' : line.value || ' '}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Right Side: Modified Pane */}
                <div 
                  ref={rightPaneRef}
                  onScroll={handleRightScroll}
                  className="overflow-auto max-h-[460px] divide-y divide-slate-900/10"
                >
                  {diffResults.map((line, idx) => {
                    const isAdded = line.type === 'added';
                    const isRemoved = line.type === 'removed';
                    
                    return (
                      <div 
                        key={idx} 
                        className={`flex py-1.5 px-3 min-h-[28px] ${
                          isAdded 
                            ? 'bg-emerald-500/15 text-emerald-350' 
                            : isRemoved 
                              ? 'bg-slate-900/40 text-slate-600/40 select-none' 
                              : ''
                        }`}
                      >
                        <span className="w-6 shrink-0 text-right pr-2 text-slate-600 select-none text-[10px]">
                          {!isRemoved ? line.lineNumber2 : ''}
                        </span>
                        <span className="mr-2 text-slate-600 shrink-0 select-none w-2">
                          {isAdded ? '+' : ' '}
                        </span>
                        <span className="whitespace-pre flex-1 break-all">
                          {isRemoved ? '' : line.value || ' '}
                        </span>
                      </div>
                    );
                  })}
                </div>

              </div>
            ) : (
              // INLINE VIEW RENDERING
              <div className="max-h-[500px] overflow-auto divide-y divide-slate-900/30">
                {diffResults.map((line, idx) => {
                  const isAdded = line.type === 'added';
                  const isRemoved = line.type === 'removed';

                  return (
                    <div 
                      key={idx} 
                      className={`flex py-1.5 px-4 min-h-[28px] ${
                        isAdded 
                          ? 'bg-emerald-500/15 text-emerald-350' 
                          : isRemoved 
                            ? 'bg-rose-500/15 text-rose-300' 
                            : ''
                      }`}
                    >
                      <div className="flex shrink-0 select-none text-[9px] text-slate-600 text-right gap-1 pr-3 w-10">
                        <span className="w-5">{line.lineNumber1 || ''}</span>
                        <span className="w-5">{line.lineNumber2 || ''}</span>
                      </div>
                      <span className="mr-2 text-slate-600 shrink-0 select-none w-2">
                        {isAdded ? '+' : isRemoved ? '-' : ' '}
                      </span>
                      <span className="whitespace-pre flex-1 break-all">
                        {line.value || ' '}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </div>

      <SeoGuideSection toolId="diff-checker" />

    </div>
  );
};

export default DiffChecker;
