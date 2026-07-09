import React, { useRef, useState, useEffect } from 'react';
import { X, CheckCircle2, MessageSquare, Send, Bot, Sparkles, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useApiKey } from '../hooks/useApiKey';
import ApiKeyModal from '../components/ApiKeyModal';
// @ts-ignore
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

interface TechSkillCardProps {
  id: string;
  name: string;
  icon: string;
  onClick: (id: string, name: string) => void;
  isEditMode: boolean;
  onNameSave: (newName: string) => void;
}

const dispatchEditFocus = (el: HTMLElement) => {
  window.dispatchEvent(new CustomEvent('activeEditableFocus', { detail: el }));
};

const TechSkillCard: React.FC<TechSkillCardProps> = ({ id, name, icon, onClick, isEditMode, onNameSave }) => {
  return (
    <div 
      className="p-3 sm:p-4 rounded-xl border border-slate-200 bg-white flex items-center gap-2 sm:gap-3.5 transition-all duration-200 hover:border-indigo-400 hover:shadow-sm cursor-pointer"
      onClick={() => !isEditMode && onClick(id, name)}
    >
      <img src={icon} alt={name} className="w-6 h-6 sm:w-8 sm:h-8 object-contain shrink-0" />
      <span 
        contentEditable={isEditMode}
        suppressContentEditableWarning
        onBlur={(e) => onNameSave(e.currentTarget.textContent || '')}
        onFocus={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
        onClick={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
        className={`text-xs sm:text-base font-semibold text-slate-800 truncate ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text' : ''}`}
      >
        {name}
      </span>
    </div>
  );
};

interface SkillDetailModalProps {
  mainTitle: string;
  icon: string;
  subTopics: { subTitle: string; subContent: string[]; }[];
  selectedSkillName: string;
  onClose: () => void;
}

const SkillDetailModal: React.FC<SkillDetailModalProps> = ({ mainTitle, icon, subTopics, selectedSkillName, onClose }) => {
  const { apiKey, isKeyAvailable, saveApiKey } = useApiKey();
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiChatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAiMessages([
      { role: 'bot', text: `Hi! I'm your AI tutor for **${selectedSkillName}**. Ask me anything about its concepts, best practices, or code examples!` }
    ]);
  }, [selectedSkillName]);

  useEffect(() => {
    if (aiChatScrollRef.current) {
      aiChatScrollRef.current.scrollTop = aiChatScrollRef.current.scrollHeight;
    }
  }, [aiMessages, aiLoading]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleAiSend = async () => {
    if (!aiInput.trim() || aiLoading) return;
    
    if (!isKeyAvailable) {
      setAiMessages(prev => [...prev, { role: 'bot', text: "My connection is offline. Please provide an API key to activate me." }]);
      setIsKeyModalOpen(true);
      return;
    }

    const userQuery = aiInput.trim();
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', text: userQuery }]);
    setAiLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey! });
      const systemInstruction = `You are an expert tutor for ${selectedSkillName}. Provide clear, concise explanations, code examples (if applicable, using markdown code blocks), and best practices. Keep your responses professional and helpful.`;
      
      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: userQuery,
          config: { systemInstruction },
        });
      } catch (err) {
        console.warn("gemini-2.5-flash failed, falling back to gemini-3-flash-preview:", err);
        response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: userQuery,
          config: { systemInstruction },
        });
      }
      setAiMessages(prev => [...prev, { role: 'bot', text: response.text || "I'm having a neural hiccup. Please try again!" }]);
    } catch (error: any) {
      console.error("AI Neural Processing Failure - Detailed Error:", error);
      let userMessage = "AI Neural Processing Failure. Please check the browser console (F12) for detailed error messages.";

      if (error?.message) {
        const msg = error.message.toLowerCase();
        if (msg.includes('api key not valid')) {
            userMessage = "AI Authentication Failed: The API key is invalid. Please update it using the settings panel.";
        } else if (msg.includes('permission denied')) {
            userMessage = "AI Error: Permission Denied. The Gemini API may not be enabled on your Google Cloud project.";
        } else if (msg.includes('quota') || msg.includes('429')) {
            userMessage = "AI Error: Quota Exceeded. Please try again later.";
        }
      }
      setAiMessages(prev => [...prev, { role: 'bot', text: userMessage }]);
    } finally {
      setAiLoading(false);
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
          setAiMessages(prev => [...prev, { role: 'bot', text: "Connection established! Please ask your question again." }]);
        }}
      />
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="skill-detail-title"
      >
        <div className="relative bg-white rounded-2xl p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl flex flex-col border border-slate-200">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Close details"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <img src={icon} alt={mainTitle} className="w-10 h-10 object-contain shrink-0" />
            <h2 id="skill-detail-title" className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">{mainTitle}</h2>
          </div>

          <div className="space-y-6 flex-1 mb-8">
            {subTopics.map((topic, topicIndex) => (
              <div key={topicIndex}>
                <h3 className="text-base md:text-lg font-bold text-slate-800 mb-3 tracking-tight">{topic.subTitle}</h3>
                <ul className="space-y-2 text-slate-600 text-sm md:text-base font-normal">
                  {topic.subContent.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* AI Learning Assistant Section */}
          <div className="pt-6 mt-6 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <Bot size={20} className="text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight">AI Learning Assistant</h3>
            </div>

            <div ref={aiChatScrollRef} className="h-48 overflow-y-auto p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4 space-y-3 custom-scrollbar text-xs">
              {aiMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-lg leading-relaxed ${msg.role === 'user' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-700 shadow-sm border border-slate-200'}`}>
                    {msg.role === 'bot' ? (
                      <div className="prose prose-sm prose-slate max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                    <Loader2 className="animate-spin text-indigo-600" size={14} />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiSend()}
                placeholder={`Ask about ${selectedSkillName}...`}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 placeholder:text-slate-400 font-normal"
                disabled={aiLoading}
              />
              <button 
                onClick={handleAiSend}
                className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
                disabled={aiLoading || !aiInput.trim()}
              >
                {aiLoading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const Overview: React.FC = () => {
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [selectedSkillName, setSelectedSkillName] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [overviewData, setOverviewData] = useState({
    tag: 'Introduction',
    title: 'Overview',
    bioParagraph1: 'As a Full-Stack Developer, I focus on building responsive, highly functional web ecosystems. My passion lies in engineering robust backend architectures paired with clean, accessible frontends.',
    bioParagraph2: 'I collaborate with businesses to deploy software solutions that solve real-world problems, with codebases that are optimized for performance, scalability, and long-term maintainability.',
    coreTechTitle: 'Core Technologies',
    coreTechnologies: [
      { id: "javascript", name: "JavaScript", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg" },
      { id: "typescript", name: "TypeScript", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg" },
      { id: "react", name: "React", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" },
      { id: "next-js", name: "Next.js", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg" },
      { id: "react-query", name: "React Query", icon: "https://cdn.prod.website-files.com/675da0ab9f940c0315fd965f/6767dea5d39b71a90a2523db_react-query.webp" },
      { id: "git-github", name: "Git & GitHub", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg" },
    ]
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkMode = () => {
      setIsEditMode(localStorage.getItem('liveEditMode') === 'true');
    };
    checkMode();
    window.addEventListener('liveEditToggle', checkMode);
    return () => window.removeEventListener('liveEditToggle', checkMode);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchOverviewData = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'overview'));
        if (snap.exists() && isMounted) {
          const data = snap.data();
          setOverviewData({
            tag: data.tag || 'Introduction',
            title: data.title || 'Overview',
            bioParagraph1: data.bioParagraph1 || 'As a Full-Stack Developer, I focus on building responsive, highly functional web ecosystems. My passion lies in engineering robust backend architectures paired with clean, accessible frontends.',
            bioParagraph2: data.bioParagraph2 || 'I collaborate with businesses to deploy software solutions that solve real-world problems, with codebases that are optimized for performance, scalability, and long-term maintainability.',
            coreTechTitle: data.coreTechTitle || 'Core Technologies',
            coreTechnologies: data.coreTechnologies || [
              { id: "javascript", name: "JavaScript", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg" },
              { id: "typescript", name: "TypeScript", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg" },
              { id: "react", name: "React", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" },
              { id: "next-js", name: "Next.js", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg" },
              { id: "react-query", name: "React Query", icon: "https://cdn.prod.website-files.com/675da0ab9f940c0315fd965f/6767dea5d39b71a90a2523db_react-query.webp" },
              { id: "git-github", name: "Git & GitHub", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg" },
            ]
          });
        }
      } catch (err) {
        console.warn("Error fetching overview settings:", err);
      }
    };
    fetchOverviewData();
    return () => { isMounted = false; };
  }, []);

  const handleInlineSave = async (field: string, value: any) => {
    window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saving' }));
    setOverviewData(prev => ({ ...prev, [field]: value }));
    try {
      await updateDoc(doc(db, 'settings', 'overview'), {
        [field]: value
      });
      window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saved' }));
    } catch (err) {
      console.error("Error saving overview data:", err);
    }
  };

  const handleTechNameSave = async (index: number, newName: string) => {
    const updatedTechs = [...overviewData.coreTechnologies];
    updatedTechs[index] = { ...updatedTechs[index], name: newName };
    await handleInlineSave('coreTechnologies', updatedTechs);
  };

  const skillDetailsContent: { [key: string]: { mainTitle: string; icon: string; subTopics: { subTitle: string; subContent: string[]; }[] } } = {
    "javascript": {
      mainTitle: "JavaScript Mastery",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg",
      subTopics: [
        {
          subTitle: "JavaScript Fundamentals",
          subContent: [
            "Variables (number, string)",
            "Console.log & browser dev tools",
            "undefined, null, and 'not defined'",
            "Short-circuiting & ternary operator",
            "Conditional statements (if condition)",
            "Loops (simple loop)",
            "Functions (creating, arguments, return values)",
            "Arrays & objects (nested objects, destructuring)",
            "Accessing object & array values",
            "Null coalescing operator"
          ]
        },
        {
          subTitle: "Advanced JavaScript Basics",
          subContent: [
            "Functions inside objects (this operator)",
            "Arrow functions (binding, implicit return)",
            "Template literals",
            "Spread & rest operators",
            "Date handling in JavaScript",
            "Array methods (map, filter, find, push, pop)"
          ]
        },
        {
          subTitle: "JavaScript in the Browser",
          subContent: [
            "Cross-browser issues & why Chrome?",
            "Optional chaining & null coalescing",
            "Promises & async/await",
            "Error handling (try...catch...finally)",
            "Timers & sleep functions",
            "HTML & JavaScript interaction",
            "String functions (split, join)",
            "Window & document objects",
            "DOM manipulation & event listeners"
          ]
        }
      ]
    },
    "typescript": {
      mainTitle: "TypeScript Fundamentals",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg",
      subTopics: [
        {
          subTitle: "Core TypeScript Concepts",
          subContent: [
            "Static typing & type inference",
            "Interfaces & Types (Type Aliases, Union/Intersection Types)",
            "Enums (Numeric, String, Const)",
            "Generics (Basic usage, Generic Functions/Interfaces)",
            "Basic Type Guards (typeof, instanceof, in operator)",
            "Compiler Options (tsconfig.json essentials)"
          ]
        },
        {
          subTitle: "Advanced Types & Utilities",
          subContent: [
            "Utility Types (Partial, Readonly, Pick, Omit, Exclude, Extract)",
            "Conditional Types (T extends U ? X : Y)",
            "Type Inference in Functions & Callbacks",
            "Type Assertions ('as' keyword, non-null assertion operator)",
            "Module Resolution Strategies (Classic, Node)",
            "Declaration Files (.d.ts) for libraries"
          ]
        }
      ]
    },
    "react": {
      mainTitle: "React Core Concepts",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg",
      subTopics: [
        {
          subTitle: "React Essentials",
          subContent: [
            "Components (Functional & Class Components)",
            "JSX (JavaScript XML) Syntax",
            "Props (Component Communication)",
            "State (Managing Component Data)",
            "Lifecycle Methods / Hooks (useState, useEffect)",
            "Conditional Rendering (If/Else, Ternary, Logical &&)",
            "List Rendering & Keys (Optimizing Lists)",
            "Event Handling (Synthetic Events)"
          ]
        },
        {
          subTitle: "Advanced Hooks & Patterns",
          subContent: [
            "useContext (Global State Management)",
            "useReducer (Complex State Logic)",
            "Custom Hooks (Reusing Stateful Logic)",
            "Higher-Order Components (HOCs) for reusable logic",
            "Render Props Pattern",
            "Compound Components Pattern"
          ]
        },
        {
          subTitle: "Performance Optimization",
          subContent: [
            "React.memo (Memoizing Components)",
            "useCallback (Memoizing Callbacks)",
            "useMemo (Memoizing Values)",
            "Lazy Loading & Suspense (Code Splitting)",
            "Virtualization (Large Lists)",
            "Profiling React Components"
          ]
        }
      ]
    },
    "next-js": {
      mainTitle: "Next.js Basics",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg",
      subTopics: [
        {
          subTitle: "Next.js Fundamentals",
          subContent: [
            "Pages & Routing (File-system based routing)",
            "Server-side Rendering (SSR) vs. Client-side Rendering (CSR)",
            "Static Site Generation (SSG) with getStaticProps",
            "Image Optimization with next/image",
            "Styling (CSS Modules, Tailwind CSS integration)",
            "Environment Variables (.env.local)"
          ]
        },
        {
          subTitle: "Advanced Data Fetching",
          subContent: [
            "getStaticPaths (Dynamic SSG Routes)",
            "Incremental Static Regeneration (ISR)",
            "Client-Side Data Fetching (e.g., SWR, React Query)",
            "Data Revalidation (on-demand, time-based)",
            "Server Components (Conceptual understanding for modern Next.js)"
          ]
        },
        {
          subTitle: "API Routes & Serverless",
          subContent: [
            "Building RESTful APIs with API Routes",
            "Handling Forms & Data Submissions",
            "Authentication Endpoints",
            "Serverless Functions Deployment",
            "Database Integration in API Routes"
          ]
        }
      ]
    },
    "react-query": {
      mainTitle: "React Query Essentials",
      icon: "https://cdn.prod.website-files.com/675da0ab9f940c0315fd965f/6767dea5d39b71a90a2523db_react-query.webp",
      subTopics: [
        {
          subTitle: "React Query Key Features",
          subContent: [
            "Queries (useQuery for GET requests)",
            "Mutations (useMutation for POST/PUT/DELETE)",
            "Query Client (Managing Query Cache)",
            "Automatic Retries & Refetching on Window Focus",
            "Pagination & Infinite Queries",
            "Optimistic Updates"
          ]
        },
        {
          subTitle: "Caching Strategies & Invalidation",
          subContent: [
            "Query Keys (Structuring Cache Data)",
            "Stale-While-Revalidate (Data Freshness)",
            "Manual Query Invalidation & Refetching",
            "Dependent Queries",
            "Prefetching & Preloading Data"
          ]
        },
        {
          subTitle: "Error Handling & Retries",
          subContent: [
            "Custom Error Boundaries with React Query",
            "Global Error Handling with QueryClientProvider",
            "Automatic Retries on Failure",
            "Exponential Backoff for Retries",
            "onError Callbacks for Mutations"
          ]
        }
      ]
    },
    "git-github": {
      mainTitle: "Git & GitHub Basics",
      icon: "https://cdn.jsdelivr.gh/devicons/devicon@latest/icons/git/git-original.svg",
      subTopics: [
        {
          subTitle: "Version Control Essentials",
          subContent: [
            "What is Git & why use GitHub?",
            "SSH connection & Git Bash for Windows",
            "Git Operations: clone, add, commit, push, pull",
            "Understanding Commits, Branches, and Merging",
            "Resolving Merge Conflicts",
            "Viewing History with `git log`",
            "Stashing Changes with `git stash`"
          ]
        },
        {
          subTitle: "Advanced Git Commands",
          subContent: [
            "Git Rebase (Rewriting History)",
            "Git Cherry-Pick (Applying single commits)",
            "Git Reflog (Recovering Lost Commits)",
            "Git Amend (Modifying Last Commit)",
            "Interactive Rebase (Squashing, reordering commits)",
            "Undoing Changes (reset, revert)"
          ]
        },
        {
          subTitle: "Collaboration Workflows",
          subContent: [
            "Feature Branching Workflow",
            "Pull Request (PR) & Code Review Process",
            "GitHub Issues & Project Management",
            "Code Ownership & Branch Protection Rules",
            "GitHub Actions (Introduction to CI/CD)",
            "Forking Workflow for open-source contributions"
          ]
        }
      ]
    },
  };

  const handleCardClick = (id: string, name: string) => {
    setSelectedSkillId(id);
    setSelectedSkillName(name);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSkillId(null);
    setSelectedSkillName(null);
  };

  const currentSkillDetails = selectedSkillId ? skillDetailsContent[selectedSkillId] : null;

  return (
    <section className="bg-slate-50 py-10 sm:py-14 w-full overflow-hidden border-t border-slate-200/60">
      <div className="w-full px-[5vw] mx-auto relative z-10">
        <div className="mb-12 text-left">
          <p 
            contentEditable={isEditMode}
            suppressContentEditableWarning
            onBlur={(e) => handleInlineSave('tag', e.currentTarget.textContent || '')}
            onFocus={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
            onClick={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
            className={`text-indigo-600 font-semibold text-xs uppercase tracking-wider mb-2 w-fit ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text' : ''}`}
          >
            {overviewData.tag}
          </p>
          <h2 
            contentEditable={isEditMode}
            suppressContentEditableWarning
            onBlur={(e) => handleInlineSave('title', e.currentTarget.textContent || '')}
            onFocus={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
            onClick={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
            className={`text-slate-900 font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight leading-tight w-fit ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text' : ''}`}
          >
            {overviewData.title}
          </h2>
          
          <div className="mt-4 text-slate-600 text-sm sm:text-base max-w-4xl leading-relaxed space-y-4 font-normal">
            <p
              contentEditable={isEditMode}
              suppressContentEditableWarning
              onBlur={(e) => handleInlineSave('bioParagraph1', e.currentTarget.textContent || '')}
              onFocus={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
              onClick={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
              className={`${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 p-1 rounded cursor-text' : ''}`}
            >
              {overviewData.bioParagraph1}
            </p>
            <p
              contentEditable={isEditMode}
              suppressContentEditableWarning
              onBlur={(e) => handleInlineSave('bioParagraph2', e.currentTarget.textContent || '')}
              onFocus={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
              onClick={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
              className={`${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 p-1 rounded cursor-text' : ''}`}
            >
              {overviewData.bioParagraph2}
            </p>
          </div>
        </div>

        {/* Tech Skills Grid */}
        <div className="mt-12 text-left">
          <h3 
            contentEditable={isEditMode}
            suppressContentEditableWarning
            onBlur={(e) => handleInlineSave('coreTechTitle', e.currentTarget.textContent || '')}
            onFocus={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
            onClick={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
            className={`text-lg font-bold text-slate-900 mb-6 w-fit ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text' : ''}`}
          >
            {overviewData.coreTechTitle}
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {overviewData.coreTechnologies.map((skill, index) => (
              <TechSkillCard 
                key={skill.id} 
                {...skill} 
                isEditMode={isEditMode}
                onNameSave={(newName) => handleTechNameSave(index, newName)}
                onClick={handleCardClick} 
              />
            ))}
          </div>
        </div>
      </div>

      {isModalOpen && currentSkillDetails && selectedSkillName && (
        <SkillDetailModal
          mainTitle={currentSkillDetails.mainTitle}
          icon={currentSkillDetails.icon}
          subTopics={currentSkillDetails.subTopics}
          selectedSkillName={selectedSkillName}
          onClose={closeModal}
        />
      )}
    </section>
  );
};

export default Overview;
