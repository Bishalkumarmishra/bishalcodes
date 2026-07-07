
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MessageSquare, Send, X, Bot, Sparkles, Loader2, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useApiKey } from '../hooks/useApiKey';
import ApiKeyModal from './ApiKeyModal';

const CodePreviewModal: React.FC<{ code: string; onClose: () => void }> = ({ code, onClose }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'source'>('preview');
  
  const srcDoc = React.useMemo(() => {
    if (code.toLowerCase().includes('<html') || code.toLowerCase().includes('<!doctype')) {
      return code;
    }
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            padding: 24px;
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: #f8fafc;
            color: #1e293b;
          }
        </style>
      </head>
      <body>
        ${code}
      </body>
      </html>
    `;
  }, [code]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-3xl h-[550px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
        {/* Header */}
        <div className="bg-slate-950 p-5 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="font-bold text-xs uppercase tracking-wider">Live Sandbox Preview</h3>
          </div>
          
          {/* Tabs */}
          <div className="flex bg-slate-800/80 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                activeTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Live Output
            </button>
            <button 
              onClick={() => setActiveTab('source')}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                activeTab === 'source' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Source Code
            </button>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 bg-slate-50 relative overflow-hidden">
          {activeTab === 'preview' ? (
            <iframe
              title="Live Sandbox Preview"
              srcDoc={srcDoc}
              sandbox="allow-scripts"
              className="w-full h-full border-0 bg-white"
            />
          ) : (
            <pre className="w-full h-full overflow-auto p-5 text-xs font-mono bg-slate-950 text-slate-300 m-0">
              <code>{code}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

const ChatPre: React.FC<{ children: React.ReactNode; onRun: (code: string) => void }> = ({ children, onRun }) => {
  const [copied, setCopied] = useState(false);
  
  const codeElement = React.Children.toArray(children).find(
    (child: any) => child.type === 'code' || (child.props && child.props.className)
  ) as any;
  const codeText = codeElement ? codeElement.props.children : '';
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(codeText).trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn(e);
    }
  };

  const isHtmlPreviewable = useMemo(() => {
    const text = String(codeText).toLowerCase();
    return text.includes('<html') || text.includes('<div') || text.includes('<button') || text.includes('<style') || text.includes('<script') || text.includes('<!doctype') || text.includes('<svg');
  }, [codeText]);

  return (
    <div className="relative group/chat-code my-3 rounded-lg overflow-hidden border border-slate-200">
      <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 group-hover/chat-code:opacity-100 transition-opacity z-10">
        {isHtmlPreviewable && (
          <button
            onClick={() => onRun(String(codeText))}
            className="p-1 rounded bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-semibold flex items-center gap-1 shadow-sm px-1.5"
            title="Run Code"
          >
            <Sparkles size={10} /> Run
          </button>
        )}
        <button
          onClick={handleCopy}
          className="p-1 rounded bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-semibold flex items-center gap-1 shadow-sm px-1.5"
          title="Copy Code"
        >
          {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />} Copy
        </button>
      </div>
      <pre className="m-0 text-xs p-3 bg-slate-900 text-slate-100 overflow-x-auto rounded-lg font-mono">
        {children}
      </pre>
    </div>
  );
};

const AIAssistant: React.FC = () => {
  const { apiKey, saveApiKey, isKeyAvailable, clearApiKey } = useApiKey();
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  
  const [isOpen, setIsOpen] = useState(false);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: "Hi! I'm Bishal's AI assistant. Ask me anything about his skills, projects, or how he can help your business." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    if (!isKeyAvailable) {
      setIsKeyModalOpen(true);
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey! });
      const systemInstruction = `You are the AI assistant for Bishal Mishra, a world-class Full-Stack Developer and Digital Strategist. 
          Bishal has 3+ years of experience, built 300+ sites, and specializes in Next.js, React, Shopify, and Custom Logic.
          Keep your tone professional, premium, and helpful. Use Markdown for formatting like lists or bold text.
          If asked about pricing, mention his basic rates (10K-50K+ Rs) and suggest booking a consultation.
          Always mention that people can WhatsApp him at +977 9828701575 for serious inquiries.`;

      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: userMessage,
          config: { systemInstruction },
        });
      } catch (err) {
        console.warn("gemini-2.5-flash failed, falling back to gemini-3-flash-preview:", err);
        response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: userMessage,
          config: { systemInstruction },
        });
      }

      setMessages(prev => [...prev, { role: 'bot', text: response.text || "Something went wrong. Please try again!" }]);
    } catch (e: any) {
        console.error("AI Assistant Failed - Detailed Error:", e);
        let userMessage = "Signal lost. The API key might be invalid or have billing issues. Please check the browser console (F12) for details.";

        if (e && e.message && typeof e.message === 'string') {
            const msg = e.message.toLowerCase();
            if (msg.includes('api key not valid')) {
                userMessage = "AI Error: API Key Not Valid. Please enter a correct key to reactivate me.";
                clearApiKey();
                setIsKeyModalOpen(true);
            } else if (msg.includes('permission denied') || msg.includes('403')) {
                userMessage = "AI Error: Permission Denied. The Gemini API may not be enabled on your Google Cloud project, or it's missing a billing account.";
            } else if (msg.includes('quota') || msg.includes('429')) {
                userMessage = "AI Error: Quota Exceeded. Please wait and try again, or check your quota limits in Google Cloud.";
            } else if (msg.includes('api key is restricted')) {
                userMessage = "AI Error: API Key Restricted. Check your key settings in Google Cloud Console to ensure this domain is allowed.";
            }
        }
        setMessages(prev => [...prev, { role: 'bot', text: userMessage }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ApiKeyModal
          isOpen={isKeyModalOpen}
          onClose={() => setIsKeyModalOpen(false)}
          onSave={(key) => {
              saveApiKey(key);
              setIsKeyModalOpen(false);
              setMessages(prev => [...prev, { role: 'bot', text: "Thanks! I'm back online. Try asking your question again." }]);
          }}
      />
      <div className="fixed bottom-8 right-8 z-[100]">
        {isOpen ? (
          <div className="w-[350px] sm:w-[400px] h-[500px] bg-white rounded-[32px] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
            <div className="bg-indigo-600 p-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Bot size={24} />
                </div>
                <div>
                  <p className="font-semibold text-sm uppercase tracking-wider">AI Assistant</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <p className="text-[10px] font-semibold text-white/85">Online & Ready</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-transform">
                <X size={24} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
              {messages.map((m, i) => {
                const markdownComponents: any = {
                  pre({ children }: any) {
                    return <ChatPre onRun={(code) => setPreviewCode(code)}>{children}</ChatPre>;
                  }
                };

                return (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 shadow-sm border border-slate-100'}`}>
                      {m.role === 'bot' ? (
                        <div className="prose prose-sm prose-slate max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                          >
                            {m.text}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        m.text
                      )}
                    </div>
                  </div>
                );
              })}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <Loader2 className="animate-spin text-indigo-600" size={18} />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-3 bg-slate-100 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all"
              />
              <button 
                onClick={handleSend}
                className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group"
          >
            <Sparkles size={28} className="group-hover:rotate-12 transition-transform" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white animate-bounce" />
          </button>
        )}
      </div>
      
      {previewCode && (
        <CodePreviewModal 
          code={previewCode} 
          onClose={() => setPreviewCode(null)} 
        />
      )}
    </>
  );
};

export default AIAssistant;
