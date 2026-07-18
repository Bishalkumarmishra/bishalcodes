import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Play, Copy, Check, Trash2, RotateCcw, Monitor, 
  Code2, ExternalLink, Terminal, Eye, EyeOff, LayoutGrid, Sparkles
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

interface TemplateCode {
  name: string;
  html: string;
  css: string;
  js: string;
}

const TEMPLATES: Record<string, TemplateCode> = {
  button: {
    name: 'Glowing Gradient Button',
    html: `<div class="box">\n  <h2 class="title">Interactive Playzone</h2>\n  <p>Modify HTML/CSS/JS and click buttons</p>\n  <button id="glow-btn">Hover & Click Me</button>\n</div>`,
    css: `body {\n  margin: 0;\n  padding: 0;\n  background: #090d16;\n  color: #f1f5f9;\n  font-family: 'Outfit', sans-serif;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 90vh;\n}\n\n.box {\n  text-align: center;\n  background: rgba(15, 23, 42, 0.6);\n  backdrop-filter: blur(12px);\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  padding: 2.5rem;\n  border-radius: 24px;\n  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);\n  max-width: 320px;\n}\n\n.title {\n  font-size: 1.5rem;\n  background: linear-gradient(135deg, #6366f1, #ec4899);\n  -webkit-background-clip: text;\n  -webkit-text-fill-color: transparent;\n  margin-top: 0;\n}\n\nbutton {\n  position: relative;\n  background: linear-gradient(135deg, #4f46e5, #db2777);\n  border: none;\n  color: white;\n  padding: 12px 28px;\n  font-size: 0.85rem;\n  font-weight: 700;\n  border-radius: 12px;\n  cursor: pointer;\n  transition: all 0.3s ease;\n  box-shadow: 0 0 15px rgba(99, 102, 241, 0.4);\n}\n\nbutton:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 0 25px rgba(236, 72, 153, 0.7);\n}\n\nbutton:active {\n  transform: translateY(1px);\n}`,
    js: `// Interactive Console Play\nconsole.log("Welcome to Bishal Codes Live Sandbox!");\n\nconst btn = document.getElementById('glow-btn');\nbtn.addEventListener('click', () => {\n  console.log("Button clicked! Triggering alert...");\n  alert("Interactive Sandbox triggered successfully!");\n});`
  },
  canvas: {
    name: 'Particle Flow Canvas',
    html: `<canvas id="flow-canvas"></canvas>`,
    css: `body {\n  margin: 0;\n  overflow: hidden;\n  background: #030712;\n}\ncanvas {\n  display: block;\n  width: 100vw;\n  height: 100vh;\n}`,
    js: `console.log("Starting Canvas Animation...");\nconst canvas = document.getElementById('flow-canvas');\nconst ctx = canvas.getContext('2d');\n\nlet w = canvas.width = window.innerWidth;\nlet h = canvas.height = window.innerHeight;\n\nwindow.addEventListener('resize', () => {\n  w = canvas.width = window.innerWidth;\n  h = canvas.height = window.innerHeight;\n});\n\nconst particles = [];\nfor (let i = 0; i < 40; i++) {\n  particles.push({\n    x: Math.random() * w,\n    y: Math.random() * h,\n    r: Math.random() * 3 + 1,\n    vx: Math.random() * 1 - 0.5,\n    vy: Math.random() * 1 - 0.5,\n    color: 'hsla(' + (Math.random() * 360) + ', 80%, 60%, 0.7)'\n  });\n}\n\nfunction animate() {\n  ctx.fillStyle = 'rgba(3, 7, 18, 0.1)';\n  ctx.fillRect(0, 0, w, h);\n  \n  particles.forEach(p => {\n    ctx.beginPath();\n    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);\n    ctx.fillStyle = p.color;\n    ctx.fill();\n    \n    p.x += p.vx;\n    p.y += p.vy;\n    \n    if (p.x < 0 || p.x > w) p.vx *= -1;\n    if (p.y < 0 || p.y > h) p.vy *= -1;\n  });\n  \n  requestAnimationFrame(animate);\n}\nanimate();`
  },
  card: {
    name: 'Glassmorphic Card Hover',
    html: `<div class="card">\n  <div class="icon">⚡</div>\n  <h3>High Performance</h3>\n  <p>Client-side rendering built with direct vector calculations for ultra speed.</p>\n</div>`,
    css: `body {\n  margin: 0;\n  padding: 0;\n  background: linear-gradient(135deg, #0f172a, #1e1b4b);\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 90vh;\n  font-family: system-ui, sans-serif;\n}\n\n.card {\n  background: rgba(255, 255, 255, 0.03);\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  border-radius: 20px;\n  padding: 30px;\n  width: 250px;\n  text-align: center;\n  backdrop-filter: blur(10px);\n  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);\n  color: #fff;\n  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);\n}\n\n.card:hover {\n  transform: translateY(-8px);\n  border-color: rgba(255, 255, 255, 0.2);\n  box-shadow: 0 12px 40px rgba(99, 102, 241, 0.2);\n}\n\n.icon {\n  font-size: 2.5rem;\n  margin-bottom: 15px;\n}\n\nh3 {\n  margin: 0 0 10px 0;\n  font-weight: 800;\n  letter-spacing: -0.5px;\n}\n\np {\n  margin: 0;\n  font-size: 0.85rem;\n  color: #94a3b8;\n  line-height: 1.5;\n}`,
    js: `console.log("Card is rendered! Hover card to trigger CSS transitions.");`
  }
};

export const CodeRunner: React.FC = () => {
  const { navigate } = useNavigation();
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
  const [templateKey, setTemplateKey] = useState<string>('button');
  
  // Editor code states
  const [htmlCode, setHtmlCode] = useState<string>('');
  const [cssCode, setCssCode] = useState<string>('');
  const [jsCode, setJsCode] = useState<string>('');

  // Live preview states
  const [srcDoc, setSrcDoc] = useState<string>('');
  const [autoRun, setAutoRun] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [editorWidth, setEditorWidth] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load selected template
  useEffect(() => {
    const selected = TEMPLATES[templateKey];
    if (selected) {
      setHtmlCode(selected.html);
      setCssCode(selected.css);
      setJsCode(selected.js);
      setLogs([]);
    }
  }, [templateKey]);

  // Resizing mouse events listener
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidthPx = e.clientX - containerRect.left;
      let newWidthPercent = (newWidthPx / containerRect.width) * 100;
      
      // Constrain size between 20% and 80%
      if (newWidthPercent < 20) newWidthPercent = 20;
      if (newWidthPercent > 80) newWidthPercent = 80;
      
      setEditorWidth(newWidthPercent);
    };

    const stopResizing = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', stopResizing);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopResizing);
    };
  }, [isDragging]);

  // Combine and update source document for rendering inside iframe
  const compilePreview = () => {
    setLogs([]);

    const hasFullHtml = /<html|<!DOCTYPE/i.test(htmlCode) || (/<head/i.test(htmlCode) && /<body/i.test(htmlCode));

    // Console interceptor script
    const loggerScript = `
      <script>
        (function() {
          const _log = console.log;
          const _warn = console.warn;
          const _error = console.error;
          
          window.console.log = function(...args) {
            _log(...args);
            window.parent.postMessage({ 
              type: 'iframe-log', 
              content: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') 
            }, '*');
          };
          window.console.warn = function(...args) {
            _warn(...args);
            window.parent.postMessage({ 
              type: 'iframe-log', 
              content: '⚠️ ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') 
            }, '*');
          };
          window.console.error = function(...args) {
            _error(...args);
            window.parent.postMessage({ 
              type: 'iframe-log', 
              content: '❌ ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') 
            }, '*');
          };
          window.onerror = function(message, source, lineno, colno, error) {
            window.parent.postMessage({ 
              type: 'iframe-log', 
              content: '❌ Error: ' + message + ' (line ' + lineno + ')' 
            }, '*');
            return false;
          };
        })();
      </script>
    `;

    if (hasFullHtml) {
      let content = htmlCode;

      // 1. Inject the logger script right after <head> or at start of <html>
      if (/<head[^>]*>/i.test(content)) {
        content = content.replace(/<head([^>]*)>/i, `<head$1>${loggerScript}`);
      } else if (/<html[^>]*>/i.test(content)) {
        content = content.replace(/<html([^>]*)>/i, `<html$1><head>${loggerScript}</head>`);
      } else {
        content = loggerScript + content;
      }

      // 2. Inject CSS if there is any custom CSS in the CSS tab
      if (cssCode.trim()) {
        const styleTag = `<style>${cssCode}</style>`;
        if (/<\/head>/i.test(content)) {
          content = content.replace(/<\/head>/i, `${styleTag}</head>`);
        } else {
          content = styleTag + content;
        }
      }

      // 3. Inject JS if there is any custom JS in the JS tab
      if (jsCode.trim()) {
        const scriptTag = `
          <script>
            try {
              ${jsCode}
            } catch(e) {
              console.error(e.message);
            }
          </script>
        `;
        if (/<\/body>/i.test(content)) {
          content = content.replace(/<\/body>/i, `${scriptTag}</body>`);
        } else {
          content = content + scriptTag;
        }
      }

      setSrcDoc(content);
    } else {
      // Standard partial HTML wrap
      const compiled = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            ${loggerScript}
            <style>
              ${cssCode}
            </style>
          </head>
          <body>
            ${htmlCode}
            <script>
              try {
                ${jsCode}
              } catch (e) {
                console.error(e.message);
              }
            </script>
          </head>
        </html>
      `;
      setSrcDoc(compiled);
    }
  };

  // Compile on manual run or automatic code changes
  useEffect(() => {
    if (autoRun) {
      const delay = setTimeout(() => {
        compilePreview();
      }, 800);
      return () => clearTimeout(delay);
    }
  }, [htmlCode, cssCode, jsCode, autoRun]);

  // Handle log updates from iframe message dispatcher
  useEffect(() => {
    const handleLogMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'iframe-log') {
        setLogs(prev => [...prev, e.data.content]);
      }
    };
    window.addEventListener('message', handleLogMessage);
    return () => window.removeEventListener('message', handleLogMessage);
  }, []);

  // Listen for Escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto scroll console log window to the bottom on new events
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Copy code from currently active editor tab
  const handleCopyCurrentCode = () => {
    const activeText = activeTab === 'html' ? htmlCode : activeTab === 'css' ? cssCode : jsCode;
    navigator.clipboard.writeText(activeText).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  // Reset inputs back to current template defaults
  const handleResetCurrent = () => {
    const selected = TEMPLATES[templateKey];
    if (selected) {
      if (activeTab === 'html') setHtmlCode(selected.html);
      else if (activeTab === 'css') setCssCode(selected.css);
      else if (activeTab === 'js') setJsCode(selected.js);
      setLogs([]);
    }
  };

  // Wipe out all editor panels
  const handleClearAll = () => {
    setHtmlCode('');
    setCssCode('');
    setJsCode('');
    setLogs([]);
    setSrcDoc('');
  };

  return (
    <div className="w-full text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Top Navigation */}
      <div className="w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 pt-24 pb-8 md:pt-32 md:pb-12">
        <div className="w-full px-4 md:px-8 mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <button 
              onClick={() => navigate('services')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
            >
              <ArrowLeft size={14} /> Back to Services
            </button>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-none text-slate-900 dark:text-white">
              Code Runner & Sandbox
            </h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold tracking-wide uppercase">
              Isolated Live HTML, CSS & JS Execution Playground
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Presets Select */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 px-3 py-1.5 rounded-xl">
              <Sparkles size={14} className="text-indigo-500 dark:text-indigo-400" />
              <select
                value={templateKey}
                onChange={(e) => setTemplateKey(e.target.value)}
                className="bg-transparent text-xs font-bold outline-none border-none text-slate-700 dark:text-slate-300 cursor-pointer pr-1"
              >
                {Object.entries(TEMPLATES).map(([key, item]) => (
                  <option key={key} value={key} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold">
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Auto Run Switch */}
            <button
              onClick={() => setAutoRun(!autoRun)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                autoRun 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-800 text-slate-500'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoRun ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
              <span>{autoRun ? 'Auto Compile ON' : 'Auto Compile OFF'}</span>
            </button>

            {/* Run Trigger */}
            <button
              onClick={compilePreview}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 transition active:scale-95 cursor-pointer"
            >
              <Play size={14} fill="currentColor" />
              <span>Run Code</span>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full px-4 md:px-8 py-8">
        <div 
          ref={containerRef}
          className="w-full flex flex-col lg:flex-row gap-0 items-start select-none"
        >
          
          {/* Editor Workspace Panel */}
          <div 
            className="w-full lg:w-[calc(50%-12px)] lg:shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col"
            style={isMounted && window.innerWidth >= 1024 ? { width: `calc(${editorWidth}% - 12px)` } : undefined}
          >
            
            {/* Editor Headers and Tab Switchers */}
            <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                {[
                  { id: 'html', label: 'HTML', color: 'text-orange-500 border-orange-500' },
                  { id: 'css', label: 'CSS', color: 'text-sky-500 border-sky-500' },
                  { id: 'js', label: 'JavaScript', color: 'text-yellow-500 border-yellow-500' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all border ${
                      activeTab === tab.id 
                        ? `${tab.color} bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800` 
                        : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Utility actions */}
              <div className="flex gap-1.5">
                <button
                  onClick={handleCopyCurrentCode}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                  title="Copy Current Code"
                >
                  {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
                <button
                  onClick={handleResetCurrent}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                  title="Reset to Template Default"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  onClick={handleClearAll}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-500 transition cursor-pointer"
                  title="Clear All Codes"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Main Code Editor Panel */}
            <div className="relative font-mono text-sm leading-relaxed bg-slate-950 text-slate-100 min-h-[380px] flex">
              
              {/* Input Area */}
              {activeTab === 'html' && (
                <textarea
                  value={htmlCode}
                  onChange={(e) => setHtmlCode(e.target.value)}
                  placeholder="<!-- Write HTML here. Full HTML files containing style & script tags are also supported! -->"
                  spellCheck="false"
                  className="w-full min-h-[380px] bg-transparent outline-none border-none p-5 font-mono text-slate-250 leading-normal resize-none focus:ring-0"
                />
              )}

              {activeTab === 'css' && (
                <textarea
                  value={cssCode}
                  onChange={(e) => setCssCode(e.target.value)}
                  placeholder="/* Write CSS here */"
                  spellCheck="false"
                  className="w-full min-h-[380px] bg-transparent outline-none border-none p-5 font-mono text-slate-250 leading-normal resize-none focus:ring-0"
                />
              )}

              {activeTab === 'js' && (
                <textarea
                  value={jsCode}
                  onChange={(e) => setJsCode(e.target.value)}
                  placeholder="// Write JavaScript code here"
                  spellCheck="false"
                  className="w-full min-h-[380px] bg-transparent outline-none border-none p-5 font-mono text-slate-250 leading-normal resize-none focus:ring-0"
                />
              )}
            </div>

          </div>

          {/* Resizer Handle */}
          <div 
            onMouseDown={startResizing}
            className={`hidden lg:flex w-6 cursor-col-resize justify-center items-center shrink-0 group z-25 ${
              isDragging ? 'opacity-100' : 'opacity-50'
            }`}
            title="Drag to Resize Panels"
          >
            <div className="w-1.5 h-20 bg-slate-200 dark:bg-slate-800 group-hover:bg-indigo-500/50 group-active:bg-indigo-500 rounded-full transition-all" />
          </div>

          {/* Interactive Live Preview & Console Output */}
          <div 
            className="w-full lg:w-[calc(50%-12px)] lg:shrink-0 space-y-6 flex flex-col"
            style={isMounted && window.innerWidth >= 1024 ? { width: `calc(${100 - editorWidth}% - 12px)` } : undefined}
          >
            
            {/* Live Canvas Preview Panel */}
            <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden ${
              isFullscreen ? 'fixed inset-0 z-[9999] bg-slate-950' : 'relative'
            }`}>
              
              {/* Preview Header Controls */}
              <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                  <Monitor size={14} className="text-indigo-500" />
                  <span>Interactive Preview Canvas</span>
                </div>
                
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 cursor-pointer shadow-sm"
                >
                  <ExternalLink size={12} />
                  <span>{isFullscreen ? 'Exit Fullscreen' : 'Open Fullscreen'}</span>
                </button>
              </div>

              {/* Render Frame Container */}
              <div className={`bg-slate-950 ${isFullscreen ? 'h-[calc(100vh-50px)]' : 'h-[330px]'} w-full relative`}>
                {srcDoc ? (
                  <iframe
                    title="Code Preview Sandbox"
                    sandbox="allow-scripts allow-modals"
                    srcDoc={srcDoc}
                    className={`w-full h-full border-none bg-white ${isDragging ? 'pointer-events-none' : ''}`}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 space-y-3">
                    <Code2 className="w-10 h-10 stroke-[1.2] text-slate-500" />
                    <div>
                      <p className="text-xs font-bold text-slate-400">Preview is empty</p>
                      <p className="text-[10px] text-slate-500 max-w-xs leading-normal mt-0.5">
                        Write code or click the Run button to load compile outputs.
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Sandbox Console Logger Output Panel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                  <Terminal size={14} className="text-emerald-500" />
                  <span>Sandbox Console Logger</span>
                </div>
                
                {logs.length > 0 && (
                  <button
                    onClick={() => setLogs([])}
                    className="text-[10px] font-black text-rose-500 hover:text-rose-600 tracking-wide uppercase cursor-pointer"
                  >
                    Clear Logs
                  </button>
                )}
              </div>

              {/* Logger Panel Body */}
              <div className="bg-slate-950 p-4 h-[120px] overflow-y-auto font-mono text-xs space-y-1.5 scrollbar-thin scrollbar-track-slate-950 scrollbar-thumb-slate-800">
                {logs.length > 0 ? (
                  <>
                    {logs.map((log, index) => (
                      <div key={index} className="text-slate-300 font-medium leading-relaxed break-words border-b border-slate-900/50 pb-1 last:border-0">
                        {log}
                      </div>
                    ))}
                    <div ref={consoleEndRef} />
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-600 font-semibold text-[10px] uppercase tracking-wider select-none">
                    Console logs will display here...
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};

export default CodeRunner;
