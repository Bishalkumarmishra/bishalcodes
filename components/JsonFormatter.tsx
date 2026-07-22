import React, { useState, useEffect } from 'react';
import { ArrowLeft, Braces, Clipboard, Check, Code, Network, AlertCircle, FileCode } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { SeoGuideSection } from './SeoGuideSection';

// Recursive Tree Node Component
interface JsonNodeProps {
  name: string | number;
  value: any;
  depth: number;
}

const JsonNode: React.FC<JsonNodeProps> = ({ name, value, depth }) => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const type = typeof value;

  const isObject = value !== null && type === 'object';
  const isArray = Array.isArray(value);

  // Render Primitive values
  if (!isObject) {
    let renderedValue = '';
    let valClass = 'text-green-600 dark:text-green-400';

    if (value === null) {
      renderedValue = 'null';
      valClass = 'text-rose-500 font-bold';
    } else if (type === 'string') {
      renderedValue = `"${value}"`;
      valClass = 'text-green-600 dark:text-green-400 break-all';
    } else if (type === 'number') {
      renderedValue = String(value);
      valClass = 'text-amber-600 dark:text-amber-400';
    } else if (type === 'boolean') {
      renderedValue = String(value);
      valClass = 'text-purple-600 dark:text-purple-400 font-bold';
    }

    return (
      <div className="pl-6 py-0.5 flex flex-wrap items-baseline gap-1 font-mono text-xs select-text">
        {name !== '' && (
          <span className="text-slate-800 dark:text-slate-350 font-semibold select-none">
            "{name}":
          </span>
        )}
        <span className={valClass}>{renderedValue}</span>
      </div>
    );
  }

  // Render arrays/objects
  const keys = isArray ? value : Object.keys(value);
  const itemCount = keys.length;
  const openBrace = isArray ? '[' : '{';
  const closeBrace = isArray ? ']' : '}';

  return (
    <div className="pl-6 py-0.5 font-mono text-xs select-text">
      <div 
        className="flex items-center gap-1.5 cursor-pointer select-none group/node"
        onClick={() => setCollapsed(!collapsed)}
      >
        {itemCount > 0 ? (
          <span className="text-slate-400 group-hover/node:text-indigo-500 text-[9px] w-3 flex justify-center transition-colors">
            {collapsed ? '▶' : '▼'}
          </span>
        ) : (
          <span className="w-3" />
        )}
        {name !== '' && (
          <span className="text-slate-800 dark:text-slate-350 font-semibold">
            "{name}":
          </span>
        )}
        <span className="text-slate-500 dark:text-slate-400 font-bold">
          {openBrace}
          {collapsed && (
            <span className="text-[10px] font-normal bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded mx-1 select-none">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
          )}
        </span>
      </div>

      {!collapsed && itemCount > 0 && (
        <div className="border-l border-slate-200 dark:border-slate-800/80 ml-1.5 pl-1 space-y-0.5">
          {isArray 
            ? value.map((val: any, idx: number) => <JsonNode key={idx} name={idx} value={val} depth={depth + 1} />)
            : Object.entries(value).map(([key, val]) => <JsonNode key={key} name={key} value={val} depth={depth + 1} />)
          }
        </div>
      )}

      {!collapsed && (
        <div className="pl-4 text-slate-500 dark:text-slate-400 font-bold">{closeBrace}</div>
      )}
    </div>
  );
};


export const JsonFormatter: React.FC = () => {
  const { navigate } = useNavigation();

  // Inputs
  const [rawInput, setRawInput] = useState<string>('');
  const [outputMode, setOutputMode] = useState<'formatted' | 'tree'>('formatted');
  
  // Results / States
  const [parsedObject, setParsedObject] = useState<any>(null);
  const [formattedString, setFormattedString] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Validate and parse raw input
  const processJson = (mode: 'indent2' | 'indent4' | 'minify') => {
    const input = rawInput.trim();
    if (!input) {
      setParsedObject(null);
      setFormattedString('');
      setError(null);
      return;
    }

    try {
      const parsed = JSON.parse(input);
      setParsedObject(parsed);
      setError(null);

      let result = '';
      if (mode === 'indent2') {
        result = JSON.stringify(parsed, null, 2);
      } else if (mode === 'indent4') {
        result = JSON.stringify(parsed, null, 4);
      } else if (mode === 'minify') {
        result = JSON.stringify(parsed);
      }
      setFormattedString(result);
    } catch (err: any) {
      setParsedObject(null);
      setFormattedString('');
      
      // Enhance JSON parser error descriptions
      const errorMsg = err.message || 'Invalid JSON syntax.';
      setError(errorMsg);
    }
  };

  // Run automatically when input changes (with a minor delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      processJson('indent2');
    }, 300);
    return () => clearTimeout(timer);
  }, [rawInput]);

  // Syntax highlighting compiler using lightweight client-side HTML tags
  const renderHighlightedJson = () => {
    if (!formattedString) return '';
    
    // Safely encode symbols
    const encoded = formattedString
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Regex to split keys, strings, numbers, booleans, and nulls
    return encoded.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = 'text-amber-600 dark:text-amber-500'; // number default
        
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'text-indigo-600 dark:text-indigo-400 font-bold'; // object key
          } else {
            cls = 'text-green-600 dark:text-green-400 font-medium'; // string
          }
        } else if (/true|false/.test(match)) {
          cls = 'text-purple-600 dark:text-purple-400 font-extrabold'; // boolean
        } else if (/null/.test(match)) {
          cls = 'text-rose-500 font-extrabold'; // null
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  };

  const handleCopy = () => {
    const textToCopy = formattedString || rawInput;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleClear = () => {
    setRawInput('');
    setParsedObject(null);
    setFormattedString('');
    setError(null);
  };

  return (
    <div className="w-full text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Top Hero Header */}
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
                JSON Formatter & Tree Viewer
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-normal leading-relaxed max-w-3xl">
                Format, validate, and parse messy JSON payloads client-side. Convert minified JSON into beautiful highlighted block codes, or browse nested data models dynamically with collapsible nodes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="w-full px-4 md:px-8 py-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch w-full">
          
          {/* Left Panel: Raw Input Area */}
          <div className="flex flex-col space-y-4">
            <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden min-h-[450px] shadow-sm">
              
              {/* Input Toolbar */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between">
                <h3 className="text-xs font-bold flex items-center gap-1.5 text-slate-500">
                  <Braces size={14} className="text-indigo-500" />
                  Raw JSON Input
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClear}
                    className="text-xs font-bold text-slate-500 hover:text-rose-500 cursor-pointer transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Input Field */}
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder='Paste raw JSON here...\ne.g. {"name":"Bishal","role":"Engineer","skills":["TypeScript","React","WebGL"]}'
                className="w-full flex-1 bg-transparent p-5 resize-none outline-none font-mono text-xs leading-relaxed placeholder:text-slate-400 placeholder:italic"
              />

              {/* Metrics line */}
              <div className="p-3 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400 font-semibold flex justify-between bg-slate-50/20">
                <span>Characters: {rawInput.length}</span>
                <span>Lines: {rawInput.split('\n').length}</span>
              </div>

            </div>

            {/* Quick Actions Row */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => processJson('indent2')}
                className="bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
              >
                2-Space Indent
              </button>
              <button
                onClick={() => processJson('indent4')}
                className="bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
              >
                4-Space Indent
              </button>
              <button
                onClick={() => processJson('minify')}
                className="bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
              >
                Minify JSON
              </button>
            </div>
          </div>

          {/* Right Panel: Output & Visualization */}
          <div className="flex flex-col space-y-4">
            
            <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden min-h-[450px] shadow-sm relative">
              
              {/* Output Tab Control Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between">
                
                <div className="flex bg-slate-200/60 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700">
                  <button
                    onClick={() => setOutputMode('formatted')}
                    className={`px-3 py-1 text-[10px] font-black uppercase rounded-md transition-colors flex items-center gap-1.5 ${
                      outputMode === 'formatted'
                        ? 'bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Code size={11} />
                    Code View
                  </button>
                  <button
                    disabled={!!error || !parsedObject}
                    onClick={() => setOutputMode('tree')}
                    className={`px-3 py-1 text-[10px] font-black uppercase rounded-md transition-colors flex items-center gap-1.5 ${
                      outputMode === 'tree'
                        ? 'bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-40'
                    }`}
                  >
                    <Network size={11} />
                    Tree Model
                  </button>
                </div>

                {/* Right toolbar controls */}
                {(formattedString || parsedObject) && (
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-indigo-500 text-xs font-bold transition-colors cursor-pointer"
                  >
                    {isCopied ? <Check size={13} className="text-emerald-500" /> : <Clipboard size={13} />}
                    <span>{isCopied ? 'Copied!' : 'Copy Result'}</span>
                  </button>
                )}

              </div>

              {/* Render Output Content */}
              <div className="flex-1 p-5 overflow-y-auto min-h-[300px]">
                
                {error ? (
                  // Validation syntax error card
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-4 rounded-xl flex items-start gap-3 select-text">
                    <AlertCircle className="w-5 h-5 shrink-0 stroke-[2] mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-black uppercase tracking-wider">JSON validation error</h4>
                      <p className="text-xs leading-relaxed font-mono font-medium">{error}</p>
                    </div>
                  </div>
                ) : rawInput.trim() === '' ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2 select-none py-10">
                    <FileCode size={36} strokeWidth={1.2} />
                    <span className="text-xs font-medium italic">Formatted output will render here...</span>
                  </div>
                ) : outputMode === 'formatted' ? (
                  // Syntax Highlighted text container
                  <pre 
                    className="font-mono text-xs leading-relaxed whitespace-pre-wrap select-text pr-2"
                    dangerouslySetInnerHTML={{ __html: renderHighlightedJson() }}
                  />
                ) : (
                  // Collapsible tree view container
                  <div className="select-none select-text">
                    <JsonNode name="" value={parsedObject} depth={0} />
                  </div>
                )}

              </div>

            </div>

            {/* Privacy Shield Info bar */}
            <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 leading-normal flex gap-3">
              <span className="text-xs">🛡️</span>
              <span>
                <strong>Confidentiality Shield:</strong> Parsing and formatting is executed locally inside your web browser engine. Your JSON data structures are never transmitted over the internet.
              </span>
            </div>

          </div>

        </div>

      </div>

      <SeoGuideSection toolId="json-formatter" />

    </div>
  );
};

export default JsonFormatter;
