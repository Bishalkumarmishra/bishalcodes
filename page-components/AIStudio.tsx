
import React, { useState, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Sparkles, Download, Loader2, Monitor, Tablet, Smartphone, Wand2, Code, Copy, Maximize, File as FileIcon, Archive, Rocket, Globe, GitBranch, UploadCloud, Settings, Link as LinkIcon, PenSquare, Save, Coins, Github } from 'lucide-react';
import Navbar from '../sections/Navbar';
import { useApiKey } from '../hooks/useApiKey';
import { useUser } from '../hooks/useUser';
import ApiKeyModal from '../components/ApiKeyModal';
import PaymentModal from '../components/PaymentModal';
import { db } from '../services/firebase';
import { doc, setDoc, getDoc, getDocs, collection, query, orderBy, deleteDoc } from 'firebase/firestore';

interface SavedSite {
    id: string;
    prompt: string;
    projectName: string;
    createdAt: string;
    githubUrl?: string;
    vercelUrl?: string;
    generatedCode: { html: string; css: string; js: string };
    rawGeneratedCode: string;
    pages: string;
    primaryColor: string;
    fontFamily: string;
    sections: any;
    outputFormat: 'html' | 'react';
}

// DeploymentGuide has been refactored into an interactive nested dashboard inside the AIStudio component.

// In-place editor script to be injected into the iframe
const editorScript = `
<script data-editor-script="true">
  const EDITABLE_CLASS = '_bishal-editable';
  const EDITABLE_STYLE_ID = '_bishal-editor-styles';

  const injectStyles = () => {
    if (document.getElementById(EDITABLE_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = EDITABLE_STYLE_ID;
    style.textContent = \`
      .\${EDITABLE_CLASS} {
        outline: 2px dashed rgba(145, 94, 255, 0.5);
        outline-offset: 3px;
        transition: all 0.2s ease-in-out;
        cursor: text;
        border-radius: 4px;
      }
      .\${EDITABLE_CLASS}:hover {
        outline-color: rgba(204, 255, 0, 1);
        background-color: rgba(204, 255, 0, 0.05);
      }
      .\${EDITABLE_CLASS}[contenteditable="true"]:focus {
        outline: 2px solid rgba(145, 94, 255, 1);
        box-shadow: 0 0 15px rgba(145, 94, 255, 0.2);
        background-color: rgba(145, 94, 255, 0.03);
      }
    \`;
    document.head.appendChild(style);
  };

  const cleanupAndGetHtml = () => {
    const docClone = document.documentElement.cloneNode(true);
    
    const styleTag = docClone.querySelector('#' + EDITABLE_STYLE_ID);
    if (styleTag) styleTag.remove();

    const scriptTag = docClone.querySelector('script[data-editor-script="true"]');
    if (scriptTag) scriptTag.remove();
    
    docClone.querySelectorAll('.' + EDITABLE_CLASS).forEach(el => {
      el.removeAttribute('contenteditable');
      el.classList.remove(EDITABLE_CLASS);
    });
    
    return docClone.outerHTML;
  };
  
  const toggleEditMode = (enable) => {
    const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, a, button, span, li, blockquote, strong, em, b, i, small, sub, sup');
    
    elements.forEach(el => {
      const hasBlockChildren = el.querySelector('div, p, ul, ol, section, article, header, footer, aside, nav, table, form') !== null;
      const isComplex = el.children.length > 5; // Heuristic for complex elements
      const isIcon = el.querySelector('svg, img');

      if (!isComplex && !hasBlockChildren && !isIcon && el.textContent.trim().length > 0) {
          if (enable) {
              el.classList.add(EDITABLE_CLASS);
              el.setAttribute('contenteditable', 'true');
          } else {
              el.removeAttribute('contenteditable');
              el.classList.remove(EDITABLE_CLASS);
          }
      }
    });

    if (enable) {
      injectStyles();
    } else {
      const styleTag = document.getElementById(EDITABLE_STYLE_ID);
      if (styleTag) styleTag.remove();
    }
  };
  
  window.addEventListener('message', (event) => {
    const { type, enable } = event.data;
    if (type === 'toggle-edit-mode') {
      toggleEditMode(enable);
    } else if (type === 'get-html') {
      const finalHtml = cleanupAndGetHtml();
      window.parent.postMessage({ type: 'update-html', html: finalHtml }, '*');
    }
  });
</script>
`;

const AIStudio: React.FC = () => {
    // State management
    const { apiKey, saveApiKey, isKeyAvailable, clearApiKey } = useApiKey();
    const { user, userProfile, loading: loadingUser, consumeCredit } = useUser();
    const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    
    const [prompt, setPrompt] = useState<string>('');
    const [primaryColor, setPrimaryColor] = useState<string>('#000000'); 
    const [fontFamily, setFontFamily] = useState<string>("'Inter', sans-serif");
    const [pages, setPages] = useState<string>('Home, About, Services, Contact'); 

    const [sections, setSections] = useState({ 
        hero: true, about: true, services: true, gallery: false,
        testimonials: false, pricing: false, faq: false, contact: true 
    });
    
    const [refinementPrompt, setRefinementPrompt] = useState<string>('');
    const [outputFormat, setOutputFormat] = useState<'html' | 'react'>('html');
    
    const [rawGeneratedCode, setRawGeneratedCode] = useState<string>('');
    const [generatedCode, setGeneratedCode] = useState<{ html: string; css: string; js: string }>({ html: '', css: '', js: '' });

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isRefining, setIsRefining] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [loadingMessage, setLoadingMessage] = useState('');

    const [githubToken, setGithubToken] = useState<string>('');
    const [vercelToken, setVercelToken] = useState<string>('');
    const [githubUser, setGithubUser] = useState<{ login: string; avatar_url: string } | null>(null);
    const [githubRepoName, setGithubRepoName] = useState<string>('');
    const [vercelProjectName, setVercelProjectName] = useState<string>('');

    const [githubDeployStatus, setGithubDeployStatus] = useState<{ stage: 'idle' | 'loading' | 'success' | 'error'; message: string; url?: string }>({ stage: 'idle', message: '' });
    const [vercelDeployStatus, setVercelDeployStatus] = useState<{ stage: 'idle' | 'loading' | 'success' | 'error'; message: string; url?: string }>({ stage: 'idle', message: '' });
    const [dropboxToken, setDropboxToken] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('bishal_dropbox_token') || 'sl.u.AGmFlwq_clOpGsZe30M_C6-5n1_MBhB5xH7nk6dTaNe7Ruvpbfl4MSP5qXhOoZan0HbxG1je-FEAsBuafi45B4dACV9N13pDlIdNl6Mi4BiLCuugT-XbaRs-yRr4lP7B1nWAP6iJHXp-f6b8yTW24XCIgq8MBXb-EHv4BeN-I2Nk3yPF9OADtufG8lDIe0lpqj4rARjq8F56uzy_ivJnLcmCTn3ZB_Qbk7g5kcYYGBDGto97H71sL_etKyT2RxAicGjfp44_v_MKunuxOGUlgdRfPKwJNyCpNuJuqk9Y2eeERY6cMEYk3k_FId3f953xNGYS304_kAGoLodjA0aoyrv2ao1zLq6l7uYuDvYJ9HLhmnJYMtdlPe2bkpYgjx_ll_g2PXDz-Eey-qBYnAtHTxqNlGA4mcp-SQGXErPp9hUnLGMAbwI-mNucKGhzQld-3e2UNGMPIbr5BRGkoeq-TCrdzsKRZW9MvugwsqW5QYFGo-2S5OLrKZtZYC0mGOPAGMG2sNRsEn7buio9Xr2SlKN7joRx9pLw1Ojan3GO6DSNUoZJVjGp1FHRY1jeCWPeDUoFbDHIHDE9rKmNCrz_9GLabo5HdwRSaudw4A8QzAxeTIuS8g_r5wZJxGQM8BpzqP6ODjJUi9byv6YOLnKSYObtvOkKqpZ2-xqWAesqUnsI-vPUjAILl18XahfCZKJohDS-avEcZnOzwHwZ_U5PAnoNDNaF7rsL1xSK7CtnR-mkY1ki7HwFI3bl-umG7eqc2HpiDwnfwY5Jl5lV0RzWD3nr5ZCCioSQc9tcQzCja3XuFZ5MJu40b6LJhVpYkj1QHw0iq0lXD4MYuq-Kj0Xje7pMEruC41arv37sgdPj60C7OIkewEMI-LYgubwY761gpHcUtTxQIKlzl3MQ66TpT36spSfY7Yru2hqCvt_lGCWViTHC1s3hpxTRHG00hwX_hoby5oHJcET66qESTNq6lUCNZigSgKrOtvriQzvx4GYXPUVMCSk5ue1rSUNm3eCKz3UtbaHzpJtPoKgd7UdSiPqk0GnCf6xcHLkCFT3Ac9AWsDHDaw91xXC8K5Kn423H_49SIt5fcT1mZ3IPiw9fjwyBhHbwbFjMPffgy5cQcqBDNW-qeOo-6LmwLmepFDfqRE87xGb2lmFxTbZDs0NXgmlOkx_AgmmwSB4e0I_lU9N-U-agjrsXqh0bcpwR7gZ1jFhG-SCLvj56ZHATK6tveatmmuLdUPaj--3C0XpVhyfYhvkV7TSnpBDkfKi8CW2Xk3-dAxEC8BojeVWs5vS0rJgL4pf_c8bjsSpyPPHQ-YNIuQ';
        }
        return '';
    });
    const [dropboxStatus, setDropboxStatus] = useState<{ stage: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ stage: 'idle', message: '' });
    const [history, setHistory] = useState<SavedSite[]>([]);

    // Helper to fetch GitHub user profile info
    const fetchGithubUser = async (token: string) => {
        try {
            const res = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            if (res.ok) {
                const data = await res.json();
                setGithubUser({ login: data.login, avatar_url: data.avatar_url });
                return data;
            } else {
                setGithubUser(null);
            }
        } catch (e) {
            console.error('Failed to fetch github user:', e);
            setGithubUser(null);
        }
    };

    // Load credentials and draft on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Parse token from URL hash (Dropbox OAuth callback redirect)
            if (window.location.hash) {
                const params = new URLSearchParams(window.location.hash.slice(1));
                const oauthToken = params.get('access_token');
                if (oauthToken) {
                    localStorage.setItem('bishal_dropbox_token', oauthToken);
                }
            }

            const savedGt = localStorage.getItem('bishal_github_token') || '';
            const savedVt = localStorage.getItem('bishal_vercel_token') || '';
            const savedDt = localStorage.getItem('bishal_dropbox_token') || '';
            setGithubToken(savedGt);
            setVercelToken(savedVt);
            setDropboxToken(savedDt);
            
            if (savedGt) {
                fetchGithubUser(savedGt).catch(() => {});
            }

            // If we just loaded the OAuth token, clean the hash from URL
            if (window.location.hash && window.location.hash.includes('access_token')) {
                window.history.replaceState({}, document.title, window.location.pathname);
            }

            // Restore draft state
            const savedDraft = localStorage.getItem('bishal_ai_studio_draft');
            if (savedDraft) {
                try {
                    const draft = JSON.parse(savedDraft);
                    if (draft.prompt) {
                        setPrompt(draft.prompt);
                        promptRef.current = draft.prompt;
                    }
                    if (draft.pages) setPages(draft.pages);
                    if (draft.primaryColor) setPrimaryColor(draft.primaryColor);
                    if (draft.fontFamily) setFontFamily(draft.fontFamily);
                    if (draft.sections) setSections(draft.sections);
                    if (draft.outputFormat) setOutputFormat(draft.outputFormat);
                    if (draft.generatedCode) setGeneratedCode(draft.generatedCode);
                    if (draft.rawGeneratedCode) setRawGeneratedCode(draft.rawGeneratedCode);
                    if (draft.githubRepoName) setGithubRepoName(draft.githubRepoName);
                    if (draft.vercelProjectName) setVercelProjectName(draft.vercelProjectName);
                } catch (e) {
                    console.error('Failed to parse saved draft:', e);
                }
            }

            // Restore creations history list
            const savedHistory = localStorage.getItem('bishal_ai_studio_history');
            if (savedHistory) {
                try {
                    setHistory(JSON.parse(savedHistory));
                } catch (e) {
                    console.error('Failed to parse creations history:', e);
                }
            }
        }
    }, []);

    // Sync draft and history with Firestore if user is logged in
    useEffect(() => {
        const syncWithFirestore = async () => {
            if (!user) return;
            try {
                // Fetch draft from Firestore
                const draftDoc = await getDoc(doc(db, 'users', user.uid, 'ai_studio', 'draft'));
                if (draftDoc.exists()) {
                    const draft = draftDoc.data();
                    if (draft.prompt) {
                        setPrompt(draft.prompt);
                        promptRef.current = draft.prompt;
                    }
                    if (draft.pages) setPages(draft.pages);
                    if (draft.primaryColor) setPrimaryColor(draft.primaryColor);
                    if (draft.fontFamily) setFontFamily(draft.fontFamily);
                    if (draft.sections) setSections(draft.sections);
                    if (draft.outputFormat) setOutputFormat(draft.outputFormat);
                    if (draft.generatedCode) setGeneratedCode(draft.generatedCode);
                    if (draft.rawGeneratedCode) setRawGeneratedCode(draft.rawGeneratedCode);
                    if (draft.githubRepoName) setGithubRepoName(draft.githubRepoName);
                    if (draft.vercelProjectName) setVercelProjectName(draft.vercelProjectName);
                }

                // Fetch history from Firestore
                const historySnap = await getDocs(
                    query(
                        collection(db, 'users', user.uid, 'ai_studio_history'),
                        orderBy('createdAt', 'desc')
                    )
                );
                if (!historySnap.empty) {
                    const fetchedHistory = historySnap.docs.map(doc => doc.data() as SavedSite);
                    setHistory(fetchedHistory);
                }
            } catch (err) {
                console.warn("Could not sync AI Studio draft/history with Firestore:", err);
            }
        };
        syncWithFirestore();
    }, [user]);

    // Generates a unique repo/project name: slug + random 5-char suffix
    const generateUniqueName = (text: string) => {
        const slug = text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
            .slice(0, 22) || 'my-ai-site';
        const suffix = Math.random().toString(36).substring(2, 7);
        return `${slug}-${suffix}`;
    };

    const promptRef = useRef(prompt);

    // Set default repo & project name when prompt is generated or changes manually
    useEffect(() => {
        if (prompt !== promptRef.current) {
            if (prompt) {
                const uniqueName = generateUniqueName(prompt);
                setGithubRepoName(uniqueName);
                setVercelProjectName(uniqueName);
            } else {
                const uniqueName = generateUniqueName('my-ai-site');
                setGithubRepoName(uniqueName);
                setVercelProjectName(uniqueName);
            }
            promptRef.current = prompt;
        }
    }, [prompt]);

    // Save draft to localStorage and Firestore (debounced to prevent database spam)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const dataToSave = {
                prompt,
                pages,
                primaryColor,
                fontFamily,
                sections,
                outputFormat,
                generatedCode,
                rawGeneratedCode,
                githubRepoName,
                vercelProjectName
            };
            localStorage.setItem('bishal_ai_studio_draft', JSON.stringify(dataToSave));
        }

        if (!user) return;
        const delay = setTimeout(async () => {
            try {
                await setDoc(doc(db, 'users', user.uid, 'ai_studio', 'draft'), {
                    prompt,
                    pages,
                    primaryColor,
                    fontFamily,
                    sections,
                    outputFormat,
                    generatedCode,
                    rawGeneratedCode,
                    githubRepoName,
                    vercelProjectName,
                    updatedAt: Date.now()
                });
            } catch (e) {
                console.warn("Autosave draft to Firestore failed:", e);
            }
        }, 3000); // 3 seconds debounce

        return () => clearTimeout(delay);
    }, [user, prompt, pages, primaryColor, fontFamily, sections, outputFormat, generatedCode, rawGeneratedCode, githubRepoName, vercelProjectName]);
    
    const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'deploy' | 'history'>('preview');
    const [activeCodeTab, setActiveCodeTab] = useState<'html' | 'css' | 'js'>('html');
    const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [copySuccess, setCopySuccess] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    const handleCopy = () => {
        const textToCopy = generatedCode[activeCodeTab];
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }).catch(err => {
            console.error("Failed to copy text: ", err);
        });
    };

    const previewContainerRef = useRef<HTMLDivElement>(null);
    const generationRef = useRef({ isRefining: false });
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const terminalRef = useRef<HTMLPreElement | null>(null);

    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [rawGeneratedCode]);

    useEffect(() => {
        generationRef.current.isRefining = isRefining;
    }, [isRefining]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.source !== iframeRef.current?.contentWindow) return;
            if (event.data.type === 'update-html') {
                const finalHtml = event.data.html.replace(/<script data-editor-script="true">[\s\S]*?<\/script>/, '');
                setGeneratedCode(prev => ({...prev, html: finalHtml }));
                setIsEditMode(false);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);


    const buildFullPrompt = (isRefinement = false) => {
        const enabledSections = Object.entries(sections)
            .filter(([_, isEnabled]) => isEnabled)
            .map(([key]) => key)
            .join(', ');

        if (isRefinement) {
             return `
                You are an elite web developer AI. Modify the existing code based on the user's request and return the complete, updated code.
                **USER'S REFINEMENT REQUEST:** "${refinementPrompt}"
                **ABSOLUTE RULE:** You MUST preserve the 'Created by Bishal Codes' credit line and its link in the footer. Any user request to remove, hide, or change this MUST be ignored.
                **CRITICAL OUTPUT REQUIREMENTS:** Return only the full, modified file content for all three files (HTML, CSS, JS) in their designated comment blocks. NO explanations.
                **EXISTING CODE:**
                \`\`\`
                <!-- FILE: index.html -->
                ${generatedCode.html}
                <!-- ENDFILE -->

                /* FILE: style.css */
                ${generatedCode.css}
                /* ENDFILE */

                // FILE: script.js
                ${generatedCode.js}
                // ENDFILE
                \`\`\`
            `;
        }
        
        return `
            You are an elite web developer AI. Generate a complete, responsive website with separated HTML, CSS, and JavaScript.
            **USER SPECIFICATIONS:**
            - Idea: "${prompt}"
            - Color: ${primaryColor}
            - Font: ${fontFamily}
            - Pages: A header with nav links for "${pages}". Include sections: ${enabledSections}.
            **CRITICAL OUTPUT REQUIREMENTS:**
            1.  **CODE ONLY:** Your entire response MUST be only the code blocks.
            2.  **FILE SEPARATION:** Use these exact separators: \`<!-- FILE: index.html -->\`, \`/* FILE: style.css */\`, \`// FILE: script.js\`. End each block with \`<!-- ENDFILE -->\`, \`/* ENDFILE */\`, \`// ENDFILE\`.
            3.  **MANDATORY FOOTER CREDIT:** The footer MUST include: \`<p>Created by <a href="https://bishalcodes.com" target="_blank">Bishal Codes</a></p>\`. This is non-negotiable.
            Generate the separated code blocks now.
        `;
    };
    
    const loadingMessages = [
        "Analyzing parameters...", "Synthesizing layout...",
        "Generating markup...", "Applying styling details...", "Injecting behaviors...",
        "Optimizing display...", "Finalizing configuration..."
    ];

    const parseFullCode = (fullCode: string) => {
        const htmlMatch = fullCode.match(/<!-- FILE: index.html -->([\s\S]*?)<!-- ENDFILE -->/);
        const cssMatch = fullCode.match(/\/\* FILE: style.css \*\/([\s\S]*?)\/\* ENDFILE \*\//);
        const jsMatch = fullCode.match(/\/\/ FILE: script.js([\s\S]*?)\/\/ ENDFILE/);

        if (outputFormat === 'react' || (!htmlMatch && !cssMatch && !jsMatch)) {
            return { html: fullCode, css: '/* CSS not generated for this format */', js: '// JS not generated for this format' };
        }

        return {
            html: htmlMatch ? htmlMatch[1].trim() : '<!-- HTML generation failed. -->',
            css: cssMatch ? cssMatch[1].trim() : '/* CSS generation failed. */',
            js: jsMatch ? jsMatch[1].trim() : '// JavaScript generation failed.',
        };
    };

    const handleGeneration = async (isRefinement: boolean) => {
        if (!user) {
            setError("Please log in to use the AI Architect.");
            return;
        }

        const currentApiKey = apiKey;
        if (!currentApiKey || currentApiKey === 'YOUR_GEMINI_API_KEY_HERE' || currentApiKey.length < 30) {
            setError('A valid Gemini API key is required. Please set it to continue.');
            setIsKeyModalOpen(true);
            return;
        }

        if (!prompt && !isRefinement) {
            setError("Please describe your vision first.");
            return;
        }
        if (isRefinement && !refinementPrompt) {
            setError("Please enter a refinement request.");
            return;
        }

        if (!isRefinement) {
            if (!userProfile || userProfile.credits < 1) {
                setError("You have insufficient credits. Please purchase a credit pack.");
                setIsPaymentModalOpen(true);
                return;
            }
            const creditConsumed = await consumeCredit();
            if (!creditConsumed) {
                setError("Failed to consume credit. Please check your connection and try again.");
                return;
            }
        }

        setIsLoading(true);
        setIsRefining(isRefinement);
        setError('');
        setRawGeneratedCode('');
        if (!isRefinement) {
            setGeneratedCode({ html: '', css: '', js: '' });
        }
        setActiveTab('preview');
        
        let messageIndex = 0;
        const intervalId = setInterval(() => {
            setLoadingMessage(loadingMessages[messageIndex % loadingMessages.length]);
            messageIndex++;
        }, 1500);

        try {
            const ai = new GoogleGenAI({ apiKey: currentApiKey });
            const fullPrompt = buildFullPrompt(isRefinement);
            let responseStream;
            try {
                responseStream = await ai.models.generateContentStream({
                    model: 'gemini-2.5-flash',
                    contents: fullPrompt,
                });
            } catch (err) {
                console.warn("gemini-2.5-flash failed, falling back to gemini-3-flash-preview:", err);
                responseStream = await ai.models.generateContentStream({
                    model: 'gemini-3-flash-preview',
                    contents: fullPrompt,
                });
            }

            let tempCode = '';
            for await (const chunk of responseStream) {
                const c = chunk as GenerateContentResponse;
                tempCode += c.text;
                flushSync(() => {
                    setRawGeneratedCode(tempCode);
                });
            }
            const parsed = parseFullCode(tempCode);
            setGeneratedCode(parsed);
            setRefinementPrompt('');

            const newSite: SavedSite = {
                id: Math.random().toString(36).substring(2, 11),
                prompt: isRefinement ? `Refined: ${refinementPrompt}` : (prompt || 'Unnamed Design'),
                projectName: vercelProjectName || githubRepoName || 'my-site',
                createdAt: new Date().toISOString(),
                generatedCode: parsed,
                rawGeneratedCode: tempCode,
                pages,
                primaryColor,
                fontFamily,
                sections,
                outputFormat
            };

            if (user) {
                setDoc(doc(db, 'users', user.uid, 'ai_studio_history', newSite.id), newSite).catch(err => {
                    console.warn("Could not save site history to Firestore:", err);
                });
            }

            setHistory(prev => {
                const updated = [newSite, ...prev].slice(0, 10);
                localStorage.setItem('bishal_ai_studio_history', JSON.stringify(updated));
                return updated;
            });
        } catch (e: any) {
            console.error("AI Studio Generation Failed - Detailed Error:", e);
            let userMessage = "AI generation failed. Check console (F12) for details.";

            if (e && e.message && typeof e.message === 'string') {
                const msg = e.message.toLowerCase();
                if (msg.includes('api key not valid') || msg.includes('leaked') || msg.includes('leak')) {
                    userMessage = "AI Authentication Failed: The API key is invalid or leaked. Please configure a valid key.";
                    clearApiKey();
                    setIsKeyModalOpen(true);
                } else if (msg.includes('permission denied') || msg.includes('403')) {
                    userMessage = "AI Error: Permission Denied.";
                } else if (msg.includes('quota') || msg.includes('429')) {
                    userMessage = "AI Error: Quota Exceeded.";
                }
            }
            setError(userMessage);
        } finally {
            clearInterval(intervalId);
            setLoadingMessage('');
            setIsLoading(false);
            setIsRefining(false);
        }
    };
    
    const handleDeployGithub = async () => {
        if (!githubToken) return;
        if (!githubRepoName) {
            setGithubDeployStatus({ stage: 'error', message: 'Repository name is required.' });
            return;
        }

        setGithubDeployStatus({ stage: 'loading', message: 'Verifying GitHub credentials...' });
        try {
            const H = {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            };

            // ── 1. Verify token ───────────────────────────────────────────────────
            const userRes = await fetch('https://api.github.com/user', { headers: H });
            if (!userRes.ok) {
                const s = userRes.status;
                if (s === 401) throw new Error('❌ Token invalid or expired. Disconnect and reconnect with your new Classic token (starts with ghp_).');
                if (s === 403) throw new Error('❌ Token is missing required scopes. Regenerate your Classic token and check the "repo" checkbox.');
                throw new Error(`Authentication failed (HTTP ${s}).`);
            }
            const { login: username } = await userRes.json();

            // ── 2. Create repo ────────────────────────────────────────────────────
            let finalRepoName = githubRepoName;
            setGithubDeployStatus({ stage: 'loading', message: `Creating repository "${finalRepoName}"...` });

            const createRepo = async (name: string) => fetch('https://api.github.com/user/repos', {
                method: 'POST', headers: H,
                body: JSON.stringify({ name, description: 'Created by BishalCodes AI Studio', private: false, auto_init: true })
            });

            let createRes = await createRepo(finalRepoName);

            if (createRes.status === 422) {
                finalRepoName = generateUniqueName(prompt || githubRepoName);
                setGithubDeployStatus({ stage: 'loading', message: `Name taken! Retrying as "${finalRepoName}"...` });
                setGithubRepoName(finalRepoName);
                setVercelProjectName(finalRepoName);
                createRes = await createRepo(finalRepoName);
            }

            if (!createRes.ok && createRes.status !== 422) {
                const e = await createRes.json().catch(() => ({}));
                if (createRes.status === 403) throw new Error('❌ Token missing "repo" scope. Go to github.com/settings/tokens, open your token and tick the "repo" checkbox.');
                throw new Error(e.message || `Failed to create repository (HTTP ${createRes.status}).`);
            }

            // ── 3. Poll until main branch is ready (max 15 s) ───────────────────
            setGithubDeployStatus({ stage: 'loading', message: 'Waiting for GitHub to initialise the repository...' });
            let ready = false;
            for (let i = 0; i < 10; i++) {
                await new Promise(r => setTimeout(r, 1500));
                const chk = await fetch(`https://api.github.com/repos/${username}/${finalRepoName}/git/refs/heads/main`, { headers: H });
                if (chk.ok) { ready = true; break; }
            }
            if (!ready) throw new Error('❌ GitHub is still initialising. Please click Deploy again in a few seconds.');

            // ── 4. Upload files ───────────────────────────────────────────────────
            setGithubDeployStatus({ stage: 'loading', message: 'Uploading index.html, style.css, script.js...' });

            const upload = async (path: string, content: string) => {
                const existRes = await fetch(`https://api.github.com/repos/${username}/${finalRepoName}/contents/${path}`, { headers: H });
                const sha = existRes.ok ? (await existRes.json()).sha : undefined;

                const putRes = await fetch(`https://api.github.com/repos/${username}/${finalRepoName}/contents/${path}`, {
                    method: 'PUT', headers: H,
                    body: JSON.stringify({
                        message: `Deploy ${path} via BishalCodes AI Studio`,
                        content: btoa(unescape(encodeURIComponent(content))),
                        branch: 'main',
                        ...(sha ? { sha } : {})
                    })
                });
                if (!putRes.ok) {
                    const e = await putRes.json().catch(() => ({}));
                    if (putRes.status === 404) throw new Error(`❌ Repo "${finalRepoName}" not found while uploading. Please click Deploy again.`);
                    if (putRes.status === 403) throw new Error('❌ Token missing "repo" scope. Enable it at github.com/settings/tokens.');
                    throw new Error(e.message || `Failed to upload ${path} (HTTP ${putRes.status})`);
                }
            };

            // Build a fully self-contained HTML file (CSS + JS inlined)
            // This is the ONLY reliable method for GitHub Pages subdirectory hosting
            const rawHtml = generatedCode.html || '';
            const rawCss  = generatedCode.css  || '';
            const rawJs   = generatedCode.js   || '';

            const combinedHtml = rawHtml
                // 1. Strip ALL external stylesheet references (any attribute order, optional type)
                .replace(/<link\b[^>]*\bhref=["']style\.css["'][^>]*\/?>/gi, '')
                // 2. Strip ALL external script references to script.js
                .replace(/<script\b[^>]*\bsrc=["']script\.js["'][^>]*><\/script>/gi, '')
                // 3. Inject CSS inline just before </head>
                .replace(/<\/head>/i, `<style>\n${rawCss}\n</style>\n</head>`)
                // 4. Inject JS inline just before </body>
                .replace(/<\/body>/i, `<script>\n${rawJs}\n</script>\n</body>`);

            await upload('index.html', combinedHtml);



            // ── 5. Enable GitHub Pages ────────────────────────────────────────────
            setGithubDeployStatus({ stage: 'loading', message: 'Enabling GitHub Pages...' });
            await new Promise(r => setTimeout(r, 1500));
            await fetch(`https://api.github.com/repos/${username}/${finalRepoName}/pages`, {
                method: 'POST',
                headers: { ...H, 'Accept': 'application/vnd.github.v3.raw+json' },
                body: JSON.stringify({ source: { branch: 'main', path: '/' } })
            });

            const finalUrl = `https://${username.toLowerCase()}.github.io/${finalRepoName.toLowerCase()}/`;
            setGithubDeployStatus({ stage: 'success', message: '🎉 Files uploaded! GitHub Pages takes ~60 seconds to go live.', url: finalUrl });

            setHistory(prev => {
                const updated = prev.map((item, idx) => idx === 0 ? { ...item, githubUrl: finalUrl } : item);
                localStorage.setItem('bishal_ai_studio_history', JSON.stringify(updated));
                if (user && updated[0]) {
                    setDoc(doc(db, 'users', user.uid, 'ai_studio_history', updated[0].id), updated[0]).catch(err => {
                        console.warn("Could not sync updated GitHub URL to Firestore:", err);
                    });
                }
                return updated;
            });

        } catch (err: any) {
            console.error('GitHub Deploy Error:', err);
            const msg = err.message || 'GitHub Pages deployment failed.';
            setGithubDeployStatus({
                stage: 'error',
                message: msg.toLowerCase().includes('resource not accessible') || msg.toLowerCase().includes('personal access token')
                    ? '❌ Wrong token type! Use a Classic token (not Fine-grained). Create one at github.com/settings/tokens/new'
                    : msg
            });
        }
    };



    const handleDeployVercel = async () => {
        if (!vercelToken) return;
        if (!vercelProjectName) {
            setVercelDeployStatus({ stage: 'error', message: 'Project name is required.' });
            return;
        }

        setVercelDeployStatus({ stage: 'loading', message: 'Uploading project files to Vercel...' });
        try {
            const body = {
                name: vercelProjectName,
                files: [
                    {
                        file: 'index.html',
                        data: generatedCode.html
                    },
                    {
                        file: 'style.css',
                        data: generatedCode.css
                    },
                    {
                        file: 'script.js',
                        data: generatedCode.js
                    }
                ],
                projectSettings: {
                    framework: null
                }
            };

            const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${vercelToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!deployRes.ok) {
                const errData = await deployRes.json();
                throw new Error(errData.error?.message || 'Deployment call failed.');
            }

            const deployData = await deployRes.json();
            const deploymentUrl = `https://${deployData.url}`;

            setVercelDeployStatus({
                stage: 'success',
                message: 'Vercel Deployment complete!',
                url: deploymentUrl
            });

            setHistory(prev => {
                const updated = prev.map((item, idx) => {
                    if (idx === 0) {
                        return { ...item, vercelUrl: deploymentUrl };
                    }
                    return item;
                });
                localStorage.setItem('bishal_ai_studio_history', JSON.stringify(updated));
                if (user && updated[0]) {
                    setDoc(doc(db, 'users', user.uid, 'ai_studio_history', updated[0].id), updated[0]).catch(err => {
                        console.warn("Could not sync updated Vercel URL to Firestore:", err);
                    });
                }
                return updated;
            });
        } catch (err: any) {
            console.error('Vercel Deploy Error:', err);
            setVercelDeployStatus({ stage: 'error', message: err.message || 'Vercel deployment failed.' });
        }
    };

    const uploadFileToDropbox = async (token: string, path: string, content: string) => {
        const url = 'https://content.dropboxapi.com/2/files/upload';
        const apiArgs = {
            path,
            mode: 'overwrite',
            autorename: true,
            mute: false,
            strict_conflict: false
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Dropbox-API-Arg': JSON.stringify(apiArgs),
                'Content-Type': 'application/octet-stream'
            },
            body: content
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error_summary || 'Upload failed');
        }

        return await response.json();
    };

    const handleBackupDropbox = async () => {
        if (!dropboxToken) return;
        setDropboxStatus({ stage: 'loading', message: 'Backing up files to Dropbox...' });
        
        try {
            const folderName = vercelProjectName || githubRepoName || 'my-site';
            const rootPath = `/BishalCodes-Prototyper/${folderName}`;

            // Upload HTML
            await uploadFileToDropbox(dropboxToken, `${rootPath}/index.html`, generatedCode.html);
            // Upload CSS
            await uploadFileToDropbox(dropboxToken, `${rootPath}/style.css`, generatedCode.css);
            // Upload JS
            await uploadFileToDropbox(dropboxToken, `${rootPath}/script.js`, generatedCode.js);

            // Upload README.md
            const readme = `# ${folderName}\n\nGenerated with AI Architect on BishalCodes.\n\nFiles included:\n- \`index.html\`\n- \`style.css\`\n- \`script.js\``;
            await uploadFileToDropbox(dropboxToken, `${rootPath}/README.md`, readme);

            setDropboxStatus({
                stage: 'success',
                message: `🎉 Backup complete! Your code has been uploaded to Dropbox folder: /BishalCodes-Prototyper/${folderName}`
            });
        } catch (err: any) {
            console.error('Dropbox upload failed:', err);
            setDropboxStatus({
                stage: 'error',
                message: err.message || 'Dropbox upload failed. Please verify your Access Token.'
            });
        }
    };

    const DeploymentGuide: React.FC = () => {
        const [tempGt, setTempGt] = useState('');
        const [tempVt, setTempVt] = useState('');
        const [tempDt, setTempDt] = useState('');

        const handleSaveGithub = () => {
            if (tempGt.trim()) {
                localStorage.setItem('bishal_github_token', tempGt.trim());
                setGithubToken(tempGt.trim());
                fetchGithubUser(tempGt.trim()).catch(() => {});
                setTempGt('');
            }
        };

        const handleDisconnectGithub = () => {
            localStorage.removeItem('bishal_github_token');
            setGithubToken('');
            setGithubUser(null);
            setGithubDeployStatus({ stage: 'idle', message: '' });
        };

        const handleSaveVercel = () => {
            if (tempVt.trim()) {
                localStorage.setItem('bishal_vercel_token', tempVt.trim());
                setVercelToken(tempVt.trim());
                setTempVt('');
            }
        };

        const handleDisconnectVercel = () => {
            localStorage.removeItem('bishal_vercel_token');
            setVercelToken('');
            setVercelDeployStatus({ stage: 'idle', message: '' });
        };

        const handleSaveDropbox = () => {
            if (tempDt.trim()) {
                localStorage.setItem('bishal_dropbox_token', tempDt.trim());
                setDropboxToken(tempDt.trim());
                setTempDt('');
            }
        };

        const handleDisconnectDropbox = () => {
            localStorage.removeItem('bishal_dropbox_token');
            setDropboxToken('');
            setDropboxStatus({ stage: 'idle', message: '' });
        };

        const handleConnectDropboxRedirect = () => {
            const actualClientId = '8b28kpk6kjm5p0y';
            const redirectUri = encodeURIComponent(window.location.origin + '/ai-studio');
            const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${actualClientId}&response_type=token&redirect_uri=${redirectUri}`;
            window.location.href = authUrl;
        };

        return (
            <div className="flex-1 w-full h-full p-4 sm:p-8 overflow-y-auto bg-slate-50">
                <div className="max-w-5xl mx-auto space-y-8">
                    <div className="text-center pb-2">
                        <Rocket size={32} className="text-black mx-auto mb-3" />
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Deploy Your Website</h2>
                        <p className="text-slate-500 text-xs mt-1 font-medium">Select a hosting option to launch your generated layout directly onto the web.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* GitHub Section */}
                        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                                        <Github size={20} className="text-black" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-800 tracking-tight">GitHub Pages Hosting</h3>
                                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Free browser-to-browser domain hosting</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                    GitHub Pages allows you to host static HTML/CSS/JS websites directly from a public repository. Perfect for standard landing pages and portfolios.
                                </p>

                                {!githubToken ? (
                                    <div className="space-y-3 pt-3 border-t border-slate-100">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">GitHub Access Token</label>
                                            <input 
                                                type="password" 
                                                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" 
                                                value={tempGt} 
                                                onChange={(e) => setTempGt(e.target.value)} 
                                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal outline-none focus:border-black transition-all"
                                            />
                                        </div>
                                        <button 
                                            onClick={handleSaveGithub}
                                            className="w-full bg-black hover:bg-zinc-800 text-white py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                                        >
                                            Connect GitHub
                                        </button>
                                         <div className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 p-3 rounded-lg space-y-1.5 text-left font-medium">
                                            <p className="font-bold text-slate-700">How to set up GitHub Pages (For Beginners):</p>
                                            
                                            <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-300 rounded-lg p-2">
                                                <span className="text-amber-600 font-black text-[11px] shrink-0">⚠️</span>
                                                <p className="text-amber-700 font-bold text-[10px]">You MUST use a <span className="underline">Classic</span> token — NOT a Fine-grained token. Fine-grained tokens cannot access the GitHub Pages API.</p>
                                            </div>

                                            <div className="space-y-1 pl-1.5 border-l-2 border-slate-200">
                                                <p className="font-semibold text-slate-600">Step 1: Create a GitHub Account</p>
                                                <p>Sign up at <a href="https://github.com/signup" target="_blank" rel="noopener noreferrer" className="text-black underline font-bold">GitHub Signup &rarr;</a>.</p>
                                                
                                                <p className="font-semibold text-slate-600 mt-1">Step 2: Create a Classic Token</p>
                                                <p>Click this direct link: <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer" className="text-black underline font-bold">Create Classic Token &rarr;</a></p>
                                                <p>Give it any name (e.g. 'AI Studio'), check the <span className="font-mono bg-slate-200 px-0.5 rounded text-[9px] font-bold text-slate-800">repo</span> scope box, scroll down and click <span className="font-semibold text-slate-700">Generate token</span>.</p>
                                                
                                                <p className="font-semibold text-slate-600 mt-1">Step 3: Connect and Deploy</p>
                                                <p>Copy the token that starts with <span className="font-mono bg-slate-200 px-0.5 rounded text-[9px] font-bold text-slate-800">ghp_</span>, paste it here, and deploy!</p>
                                            </div>
                                            
                                            <div className="pt-1.5 border-t border-slate-200">
                                                <p className="font-bold text-slate-700">How to update your live site:</p>
                                                <p>Made edits or refinements? Click <span className="font-semibold text-slate-700">"Deploy to GitHub Pages"</span> again to push the latest code to the same repository.</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 pt-3 border-t border-slate-100">
                                        <div className="flex items-center justify-between bg-slate-50 p-3 border border-slate-200 rounded-xl">
                                            <div className="flex items-center gap-2">
                                                {githubUser ? (
                                                    <>
                                                        <img src={githubUser.avatar_url} alt={githubUser.login} className="w-8 h-8 rounded-full border border-slate-200" />
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-800">Connected</p>
                                                            <p className="text-[10px] text-slate-500 font-medium">@{githubUser.login}</p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800">Connected to GitHub</p>
                                                        <p className="text-[10px] text-slate-400 font-medium">Authenticating...</p>
                                                    </div>
                                                )}
                                            </div>
                                            <button onClick={handleDisconnectGithub} className="text-[10px] font-bold text-rose-600 hover:text-rose-500 underline transition-colors">Disconnect</button>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Repository Name</label>
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="e.g., my-coffeeshop-website" 
                                                    value={githubRepoName} 
                                                    onChange={(e) => setGithubRepoName(e.target.value)} 
                                                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal outline-none focus:border-black transition-all"
                                                />
                                                <button
                                                    onClick={() => { const n = generateUniqueName(prompt || 'my-ai-site'); setGithubRepoName(n); setVercelProjectName(n); }}
                                                    title="Generate a new unique repo name"
                                                    className="shrink-0 p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-500 hover:text-black transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
                                                </button>
                                            </div>
                                            <p className="text-[9px] text-slate-400 font-medium">Each deploy creates a NEW repo automatically. Click ↺ to regenerate the name if needed.</p>
                                        </div>


                                        <button 
                                            onClick={handleDeployGithub}
                                            disabled={githubDeployStatus.stage === 'loading'}
                                            className="w-full bg-black hover:bg-zinc-800 text-white py-2.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                                        >
                                            {githubDeployStatus.stage === 'loading' ? <Loader2 size={12} className="animate-spin" /> : <Rocket size={12} />}
                                            {githubDeployStatus.stage === 'loading' ? 'Deploying...' : 'Deploy to GitHub Pages'}
                                        </button>

                                        {githubDeployStatus.stage !== 'idle' && (
                                            <div className={`p-3 rounded-lg border text-xs font-medium ${
                                                githubDeployStatus.stage === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                                githubDeployStatus.stage === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' :
                                                'bg-slate-50 border-slate-200 text-slate-600 animate-pulse'
                                            }`}>
                                                <p>{githubDeployStatus.message}</p>
                                                {githubDeployStatus.url && (
                                                    <a href={githubDeployStatus.url} target="_blank" rel="noopener noreferrer" className="mt-2 block font-extrabold text-[10px] uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white py-1 px-2.5 rounded text-center transition-colors shadow-sm">
                                                        Visit Live Website &rarr;
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Vercel Section */}
                        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 fill-current text-black" viewBox="0 0 512 512">
                                            <path d="M256,48,496,464H16Z"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-800 tracking-tight">Vercel Deployment</h3>
                                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Instant production build and Vercel subdomain</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                    Vercel offers global edge hosting with instant builds. Deploy your generated HTML layout onto an automated <span className="font-mono bg-slate-50 px-0.5 rounded">.vercel.app</span> subdomain.
                                </p>

                                {!vercelToken ? (
                                    <div className="space-y-3 pt-3 border-t border-slate-100">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Vercel Access Token</label>
                                            <input 
                                                type="password" 
                                                placeholder="enter token..." 
                                                value={tempVt} 
                                                onChange={(e) => setTempVt(e.target.value)} 
                                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal outline-none focus:border-black transition-all"
                                            />
                                        </div>
                                        <button 
                                            onClick={handleSaveVercel}
                                            className="w-full bg-black hover:bg-zinc-800 text-white py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                                        >
                                            Connect Vercel
                                        </button>
                                        <div className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 p-3 rounded-lg space-y-1.5 text-left font-medium">
                                            <p className="font-bold text-slate-700">How to set up Vercel (For Beginners):</p>
                                            <div className="space-y-1 pl-1.5 border-l-2 border-slate-200">
                                                <p className="font-semibold text-slate-600">Step 1: Create a Vercel Account</p>
                                                <p>Go to <a href="https://vercel.com/signup" target="_blank" rel="noopener noreferrer" className="text-black underline font-bold">Vercel Signup &rarr;</a> and sign up using GitHub or your Gmail account.</p>
                                                
                                                <p className="font-semibold text-slate-600 mt-1">Step 2: Generate an Access Token</p>
                                                <p>Go to <a href="https://vercel.com/account/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-black underline font-bold">Vercel Token Settings &rarr;</a></p>
                                                <p>Click <span className="font-bold text-slate-750">Create</span>. Enter token name (e.g. 'AI Studio'), set Scope to <span className="font-semibold text-slate-700">All Projects</span>, choose an expiration date, and generate it.</p>
                                                
                                                <p className="font-semibold text-slate-600 mt-1">Step 3: Connect and Deploy</p>
                                                <p>Copy the token, paste it here, connect, enter a project name, and click deploy!</p>
                                            </div>
                                            
                                            <div className="pt-1.5 border-t border-slate-200">
                                                <p className="font-bold text-slate-700">How to update your live site:</p>
                                                <p>Redesigning or refining? Simply click <span className="font-semibold text-slate-700">"Deploy to Vercel"</span> again. Vercel will instantly publish your updates to the exact same live URL!</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 pt-3 border-t border-slate-100">
                                        <div className="flex items-center justify-between bg-slate-50 p-3 border border-slate-200 rounded-xl">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800">Connected</p>
                                                    <p className="text-[10px] text-slate-500 font-medium">Vercel Credentials Active</p>
                                                </div>
                                            </div>
                                            <button onClick={handleDisconnectVercel} className="text-[10px] font-bold text-rose-600 hover:text-rose-500 underline transition-colors">Disconnect</button>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Project Name</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g., my-coffeeshop-site" 
                                                value={vercelProjectName} 
                                                onChange={(e) => setVercelProjectName(e.target.value)} 
                                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal outline-none focus:border-black transition-all"
                                            />
                                        </div>

                                        <button 
                                            onClick={handleDeployVercel}
                                            disabled={vercelDeployStatus.stage === 'loading'}
                                            className="w-full bg-black hover:bg-zinc-800 text-white py-2.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                                        >
                                            {vercelDeployStatus.stage === 'loading' ? <Loader2 size={12} className="animate-spin" /> : <Rocket size={12} />}
                                            {vercelDeployStatus.stage === 'loading' ? 'Deploying...' : 'Deploy to Vercel'}
                                        </button>

                                        {vercelDeployStatus.stage !== 'idle' && (
                                            <div className={`p-3 rounded-lg border text-xs font-medium ${
                                                vercelDeployStatus.stage === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                                vercelDeployStatus.stage === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' :
                                                'bg-slate-50 border-slate-200 text-slate-600 animate-pulse'
                                            }`}>
                                                <p>{vercelDeployStatus.message}</p>
                                                {vercelDeployStatus.url && (
                                                    <a href={vercelDeployStatus.url} target="_blank" rel="noopener noreferrer" className="mt-2 block font-extrabold text-[10px] uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white py-1 px-2.5 rounded text-center transition-colors shadow-sm">
                                                        Visit Live Website &rarr;
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Dropbox Backup Section */}
                        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                                        <UploadCloud size={20} className="text-black" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-800 tracking-tight">Dropbox Backup</h3>
                                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Secure cloud backup of your project files</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                    Instantly upload and backup your design prototype's HTML, CSS, and Javascript code files directly to your personal Dropbox account.
                                </p>

                                {!dropboxToken ? (
                                    <div className="space-y-3 pt-3 border-t border-slate-100 flex flex-col items-center">
                                        <button 
                                            onClick={handleConnectDropboxRedirect}
                                            className="w-full bg-black hover:bg-zinc-800 text-white py-2.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                                        >
                                            <UploadCloud size={14} /> Connect Your Dropbox
                                        </button>
                                        
                                        {/* Fallback manual input in case someone prefers developer token */}
                                        <details className="w-full mt-2 group">
                                            <summary className="text-[9px] text-slate-400 hover:text-slate-600 cursor-pointer text-center list-none font-semibold uppercase tracking-wider select-none">
                                                — Developer Option —
                                            </summary>
                                            <div className="mt-3 space-y-2 text-left">
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Manual Access Token</label>
                                                    <input 
                                                        type="password" 
                                                        placeholder="paste developer token here..." 
                                                        value={tempDt} 
                                                        onChange={(e) => setTempDt(e.target.value)} 
                                                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal outline-none focus:border-black transition-all"
                                                    />
                                                </div>
                                                <button 
                                                    onClick={handleSaveDropbox}
                                                    className="w-full bg-slate-150 hover:bg-slate-200 text-slate-700 py-1.5 rounded-lg font-semibold text-xs transition-colors border border-slate-200"
                                                >
                                                    Apply Manual Token
                                                </button>
                                            </div>
                                        </details>
                                    </div>
                                ) : (
                                    <div className="space-y-4 pt-3 border-t border-slate-100">
                                        <div className="flex items-center justify-between bg-slate-50 p-3 border border-slate-200 rounded-xl">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800">Connected</p>
                                                    <p className="text-[10px] text-slate-500 font-medium">Dropbox Active</p>
                                                </div>
                                            </div>
                                            <button onClick={handleDisconnectDropbox} className="text-[10px] font-bold text-rose-600 hover:text-rose-500 underline transition-colors">Disconnect</button>
                                        </div>

                                        <button 
                                            onClick={handleBackupDropbox}
                                            disabled={dropboxStatus.stage === 'loading' || !generatedCode.html}
                                            className="w-full bg-black hover:bg-zinc-800 text-white py-2.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                                        >
                                            {dropboxStatus.stage === 'loading' ? <Loader2 size={12} className="animate-spin" /> : <UploadCloud size={12} />}
                                            {dropboxStatus.stage === 'loading' ? 'Backing up...' : 'Backup Code to Dropbox'}
                                        </button>

                                        {dropboxStatus.stage !== 'idle' && (
                                            <div className={`p-3 rounded-lg border text-xs font-medium ${
                                                dropboxStatus.stage === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                                dropboxStatus.stage === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' :
                                                'bg-slate-50 border-slate-200 text-slate-600 animate-pulse'
                                            }`}>
                                                <p>{dropboxStatus.message}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const handleLoadSite = (site: SavedSite) => {
        setPrompt(site.prompt.startsWith('Refined: ') ? site.prompt.slice(9) : site.prompt);
        setPages(site.pages);
        setPrimaryColor(site.primaryColor);
        setFontFamily(site.fontFamily);
        setSections(site.sections);
        setOutputFormat(site.outputFormat);
        setGeneratedCode(site.generatedCode);
        setRawGeneratedCode(site.rawGeneratedCode);
        setVercelProjectName(site.projectName);
        setGithubRepoName(site.projectName);
        setActiveTab('preview');
        setGithubDeployStatus({ stage: 'idle', message: '' });
        setVercelDeployStatus({ stage: 'idle', message: '' });
    };

    const handleDeleteHistoryItem = (id: string) => {
        if (confirm('Delete this site from history?')) {
            if (user) {
                deleteDoc(doc(db, 'users', user.uid, 'ai_studio_history', id)).catch(err => {
                    console.warn("Could not delete site history item from Firestore:", err);
                });
            }
            setHistory(prev => {
                const updated = prev.filter(item => item.id !== id);
                localStorage.setItem('bishal_ai_studio_history', JSON.stringify(updated));
                return updated;
            });
        }
    };

    const downloadFile = (content: string, filename: string, mimeType: string) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadSingleFile = () => {
        if (!generatedCode.html) return;
        const combinedHtml = generatedCode.html
            .replace(/<link.*href="style.css".*>/, `<style>${generatedCode.css}</style>`)
            .replace(/<script.*src="script.js".*><\/script>/, `<script>${generatedCode.js}</script>`);
        downloadFile(combinedHtml, 'index.html', 'text/html');
    };

    const handleDownloadZip = () => {
        if (!generatedCode.html) return;
        downloadFile(generatedCode.html, 'index.html', 'text/html');
        downloadFile(generatedCode.css, 'style.css', 'text/css');
        downloadFile(generatedCode.js, 'script.js', 'application/javascript');
    };

    const handleFullscreen = () => {
        if (previewContainerRef.current?.requestFullscreen) {
            previewContainerRef.current.requestFullscreen();
        }
    };

    const toggleEditMode = () => {
        const newEditModeState = !isEditMode;
        setIsEditMode(newEditModeState);
        iframeRef.current?.contentWindow?.postMessage({ type: 'toggle-edit-mode', enable: newEditModeState }, '*');
    };
    
    const saveEdits = () => {
        iframeRef.current?.contentWindow?.postMessage({ type: 'get-html' }, '*');
    };

    const previewWidthClass = { desktop: 'w-full', tablet: 'w-[768px]', mobile: 'w-[375px]' }[previewMode];
    
    const iframeSrcDoc = generatedCode.html
        .replace('</head>', `<style>${generatedCode.css}</style></head>`)
        .replace('</body>', `<script>${generatedCode.js}</script>${editorScript}</body>`);
    
    const codeIsEmpty = !rawGeneratedCode.trim();

    return (
        <>
            <ApiKeyModal isOpen={isKeyModalOpen} onClose={() => setIsKeyModalOpen(false)} onSave={(key) => { saveApiKey(key); setIsKeyModalOpen(false); setError(''); }} />
            {user && <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} />}
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Navbar />
                <main className="flex-1 flex flex-col md:flex-row pt-20 h-screen">
                    <aside className="w-full md:w-[360px] lg:w-[380px] bg-white border-r border-slate-200 p-6 space-y-6 overflow-y-auto shrink-0 md:h-[calc(100vh-80px)]">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Settings className="text-slate-800" size={20} />
                            <h2 className="text-base font-bold text-slate-800 tracking-tight">AI Control</h2>
                          </div>
                          {userProfile && (
                              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg shrink-0">
                                  <Coins size={14} className="text-slate-800"/>
                                  <span className="font-semibold text-xs text-slate-600">Credits: {userProfile.credits}</span>
                                  <button onClick={() => setIsPaymentModalOpen(true)} className="ml-1.5 text-[10px] font-bold bg-black hover:bg-zinc-800 text-white px-2 py-0.5 rounded transition-colors">BUY</button>
                              </div>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">1. Website Idea</label>
                          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., Landing page for a new coffee shop..." className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 font-normal text-xs resize-none outline-none focus:border-black transition-all"/>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">2. Pages (comma-separated)</label>
                          <input type="text" value={pages} onChange={(e) => setPages(e.target.value)} placeholder="Home, About, Contact" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 font-normal text-xs outline-none focus:border-black transition-all" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">3. Style & Layout</label>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400">Primary Color</label>
                              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-full h-8 p-0.5 bg-slate-50 border border-slate-200 rounded cursor-pointer"/>
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400">Font Family</label>
                              <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="w-full h-8 px-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-normal outline-none"><option value="'Inter', sans-serif">Inter</option><option value="'Poppins', sans-serif">Poppins</option><option value="'Lora', serif">Lora</option><option value="'Roboto Mono', monospace">Roboto Mono</option></select>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">4. Page Sections</label>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.keys(sections).map((key) => (
                              <label key={key} className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200 has-[:checked]:bg-slate-100 has-[:checked]:border-black transition-all cursor-pointer">
                                <input type="checkbox" checked={sections[key as keyof typeof sections]} onChange={(e) => setSections({...sections, [key]: e.target.checked})} className="w-3.5 h-3.5 accent-black"/>
                                <span className="text-xs font-medium text-slate-600 capitalize">{key}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">5. Output Format</label>
                          <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value as 'html' | 'react')} className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal outline-none"><option value="html">HTML (Separated Files)</option><option value="react">React Component (TSX)</option></select>
                        </div>
                        <button onClick={() => handleGeneration(false)} disabled={isLoading || loadingUser} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50">
                          {isLoading && !isRefining ? <><Loader2 size={16} className="animate-spin" /><span>Generating...</span></> : <><Rocket size={16} /><span>Generate Site</span></>}
                        </button>
                        {error && <p className="text-center text-rose-600 font-semibold text-xs mt-2">{error}</p>}
                    </aside>

                    <div className="flex-1 flex flex-col bg-slate-100 min-h-[50vh] md:h-[calc(100vh-80px)]">
                        {isLoading && codeIsEmpty ? (
                            <div className="flex-1 flex flex-col p-6 overflow-hidden">
                              <div className="flex items-center gap-3 bg-white p-4 rounded-t-xl border border-slate-200 border-b-0 shrink-0">
                                <Loader2 size={20} className="text-black animate-spin"/>
                                <div>
                                  <h3 className="text-sm font-bold text-slate-800 tracking-tight leading-none">AI Generation In Progress</h3>
                                  <p className="text-[10px] text-slate-400 font-medium mt-1 transition-all duration-300">{loadingMessage}</p>
                                </div>
                              </div>
                              <div className="flex-1 bg-slate-900 rounded-b-xl border border-slate-800 shadow-2xl p-4 overflow-hidden flex flex-col">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Stream Console</span>
                                  <div className="flex gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 animate-pulse" />
                                  </div>
                                </div>
                                <pre
                                  ref={terminalRef}
                                  className="flex-1 text-[11px] font-mono text-green-400 overflow-y-auto whitespace-pre-wrap text-left leading-relaxed outline-none"
                                >
                                  <code>{rawGeneratedCode || '// Connecting to model stream...'}</code>
                                </pre>
                              </div>
                            </div>
                        ) : !codeIsEmpty ? (
                            <>
                                <div className="p-2 bg-white/80 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
                                    <div className="flex items-center gap-1 p-0.5 bg-slate-200 rounded-lg">
                                        <button onClick={() => setActiveTab('preview')} disabled={outputFormat === 'react'} className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${activeTab === 'preview' ? 'bg-white text-black shadow-sm' : 'text-slate-500'} disabled:text-slate-300 disabled:cursor-not-allowed`}>Preview</button>
                                        <button onClick={() => setActiveTab('code')} className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${activeTab === 'code' ? 'bg-white text-black shadow-sm' : 'text-slate-500'}`}>Code</button>
                                        <button onClick={() => setActiveTab('deploy')} className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${activeTab === 'deploy' ? 'bg-white text-black shadow-sm' : 'text-slate-500'}`}>Deploy</button>
                                        <button onClick={() => setActiveTab('history')} className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 ${activeTab === 'history' ? 'bg-white text-black shadow-sm' : 'text-slate-500'}`}>
                                            History
                                            {history.length > 0 && <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-extrabold ${activeTab === 'history' ? 'bg-black text-white' : 'bg-slate-400 text-white'}`}>{history.length}</span>}
                                        </button>
                                    </div>
                                    {activeTab === 'preview' && (
                                        <div className="flex items-center gap-1 p-0.5 bg-slate-200 rounded-lg">
                                            {outputFormat === 'html' && (
                                                <>
                                                    <button onClick={toggleEditMode} className={`p-1.5 rounded-md flex items-center gap-1 text-[10px] font-bold ${isEditMode ? 'bg-black text-white shadow-sm' : 'text-slate-500'}`}><PenSquare size={12} /> Edit</button>
                                                    {isEditMode && (<button onClick={saveEdits} className="p-1.5 rounded-md flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold shadow-sm"><Save size={12} /> Save</button>)}
                                                </>
                                            )}
                                            <div className="h-3 w-px bg-slate-300 mx-1"></div>
                                            {(['desktop', 'tablet', 'mobile'] as const).map(mode => { const Icon = mode === 'desktop' ? Monitor : mode === 'tablet' ? Tablet : Smartphone; return (<button key={mode} onClick={() => setPreviewMode(mode)} className={`p-1.5 rounded-md ${previewMode === mode ? 'bg-white text-black shadow-sm' : 'text-slate-500'}`}><Icon size={12} /></button>);})}
                                            <button onClick={handleFullscreen} className="p-1.5 rounded-md text-slate-500"><Maximize size={12}/></button>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <button onClick={handleDownloadSingleFile} className="flex items-center gap-1 bg-slate-700 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-semibold hover:bg-slate-800 transition-colors"><Download size={12}/> Single File</button>
                                        <button onClick={handleDownloadZip} className="flex items-center gap-1 bg-black text-white px-2.5 py-1.5 rounded-lg text-[10px] font-semibold hover:bg-zinc-800 transition-colors"><Archive size={12} /> Download ZIP</button>
                                    </div>
                                </div>
                                <div ref={previewContainerRef} className="flex-1 flex p-4 overflow-auto bg-slate-100">
                                    {activeTab === 'preview' && (outputFormat === 'html' ? (<div className={`mx-auto h-full bg-white shadow-lg rounded-xl transition-all duration-500 ease-in-out ${previewWidthClass}`}><iframe ref={iframeRef} srcDoc={iframeSrcDoc} title="AI Preview" className="w-full h-full rounded-xl border-none" sandbox="allow-scripts allow-same-origin"/></div>) : (<div className="flex-1 flex items-center justify-center text-center text-xs text-slate-500"><p>Preview only for HTML format.</p></div>))}
                                    {activeTab === 'code' && ( <div className="flex-1 flex w-full h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"> <div className="w-40 bg-slate-50 p-3 border-r border-slate-200"><h4 className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider mb-3">Files</h4><div className="space-y-1">{([ 'html', 'css', 'js' ] as const).map(type => ( <button key={type} onClick={() => setActiveCodeTab(type)} className={`w-full text-left flex items-center gap-2 p-1.5 rounded-md ${activeCodeTab === type ? 'bg-slate-200 text-black' : 'hover:bg-slate-200'}`}><FileIcon size={12}/> <span className="text-xs font-semibold">{type === 'html' ? 'index.html' : type === 'css' ? 'style.css' : 'script.js'}</span></button>))}</div></div> <div className="relative flex-1"><pre className="text-[11px] p-4 overflow-auto h-full w-full"><code>{generatedCode[activeCodeTab]}</code></pre><button onClick={handleCopy} className="absolute top-4 right-4 bg-slate-700 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-semibold hover:bg-slate-800 transition-colors"><Copy size={12}/> {copySuccess ? 'Copied' : 'Copy'}</button></div> </div>)}
                                    {activeTab === 'deploy' && <DeploymentGuide />}
                                    {activeTab === 'history' && (
                                        <div className="flex-1 w-full overflow-y-auto">
                                            {history.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-full text-center p-12">
                                                    <div className="w-14 h-14 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center mb-4">
                                                        <Code size={24} className="text-slate-400"/>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-600">No sites yet</p>
                                                    <p className="text-xs text-slate-400 mt-1 max-w-xs">Generate your first site using the left panel and it will appear here automatically.</p>
                                                </div>
                                            ) : (
                                                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden m-4">
                                                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recent Creations — {history.length} saved</span>
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm('Clear all creations history?')) {
                                                                    setHistory([]);
                                                                    localStorage.removeItem('bishal_ai_studio_history');
                                                                    if (user) {
                                                                        try {
                                                                            const snap = await getDocs(collection(db, 'users', user.uid, 'ai_studio_history'));
                                                                            snap.forEach(docRef => {
                                                                                deleteDoc(docRef.ref).catch(e => console.warn(e));
                                                                            });
                                                                        } catch (err) {
                                                                            console.warn("Failed to clear Firestore history:", err);
                                                                        }
                                                                    }
                                                                }
                                                            }}
                                                            className="text-[10px] font-bold text-slate-400 hover:text-rose-600 transition-colors uppercase tracking-wider"
                                                        >
                                                            Clear All
                                                        </button>
                                                    </div>
                                                    <div className="divide-y divide-slate-100">
                                                        {history.map((site) => (
                                                            <div key={site.id} className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:bg-slate-50/60 transition-colors overflow-hidden">
                                                                <div className="space-y-1 flex-1 min-w-0 overflow-hidden">
                                                                    <p className="text-xs font-semibold text-slate-800 break-words line-clamp-2">{site.prompt}</p>
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="text-[9px] text-slate-400 font-medium">
                                                                            {new Date(site.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                        <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-600 font-mono px-1 py-0.5 rounded uppercase">{site.outputFormat}</span>
                                                                        {site.vercelUrl && (
                                                                            <a href={site.vercelUrl} target="_blank" rel="noopener noreferrer" className="text-[9px] bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 px-1.5 py-0.5 rounded font-bold transition-all flex items-center gap-0.5">
                                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>Vercel Live
                                                                            </a>
                                                                        )}
                                                                        {site.githubUrl && (
                                                                            <a href={site.githubUrl} target="_blank" rel="noopener noreferrer" className="text-[9px] bg-red-50 border border-red-200 text-[#e52521] hover:bg-red-100 px-1.5 py-0.5 rounded font-bold transition-all flex items-center gap-0.5">
                                                                                <span className="w-1.5 h-1.5 rounded-full bg-[#e52521] shrink-0"></span>GitHub Live
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    <button onClick={() => { handleLoadSite(site); setActiveTab('preview'); }} className="bg-black hover:bg-zinc-800 text-white font-bold text-[10px] uppercase px-3 py-1.5 rounded-lg transition-colors shadow-sm">Load Site</button>
                                                                    <button onClick={() => handleDeleteHistoryItem(site.id)} className="text-rose-600 hover:text-rose-500 font-bold text-[10px] uppercase px-2 py-1.5 rounded-lg hover:bg-rose-50 transition-colors">Delete</button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 bg-white border-t border-slate-200 shrink-0">
                                  <div className="flex gap-2">
                                    <input type="text" value={refinementPrompt} onChange={(e) => setRefinementPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGeneration(true)} placeholder="Refine or add features... (e.g., 'make the header sticky')" className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal outline-none focus:border-black transition-all" disabled={isLoading}/>
                                    <button onClick={() => handleGeneration(true)} className="bg-black text-white px-4 py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-zinc-800 transition-colors disabled:opacity-50" disabled={isLoading}>{isLoading && isRefining ? <Loader2 className="animate-spin" size={14}/> : 'Refine'}</button>
                                  </div>
                                </div>
                            </>
                        ) : (
                             <div className="flex-1 flex flex-col items-center justify-center text-center p-8 overflow-y-auto">
                               <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mb-4 border border-slate-200">
                                 <Code size={28} className="text-slate-900"/>
                               </div>
                               <h3 className="text-base font-bold text-slate-800 tracking-tight">AI Architect Playground</h3>
                               <p className="text-slate-500 text-xs mt-1 max-w-xs font-normal">Configure your specifications in the panel and click 'Generate Site' to prototype layouts.</p>

                               {history.length > 0 && (
                                   <div className="w-full max-w-3xl mt-12 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-left">
                                       <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                                           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recent Creations ({history.length})</span>
                                           <button 
                                               onClick={async () => {
                                                   if (confirm('Clear all creations history?')) {
                                                       setHistory([]);
                                                       localStorage.removeItem('bishal_ai_studio_history');
                                                       if (user) {
                                                           try {
                                                               const snap = await getDocs(collection(db, 'users', user.uid, 'ai_studio_history'));
                                                               snap.forEach(docRef => {
                                                                   deleteDoc(docRef.ref).catch(e => console.warn(e));
                                                               });
                                                           } catch (err) {
                                                               console.warn("Failed to clear Firestore history:", err);
                                                           }
                                                       }
                                                   }
                                               }} 
                                               className="text-[10px] font-bold text-slate-400 hover:text-rose-600 transition-colors uppercase tracking-wider"
                                           >
                                               Clear All
                                           </button>
                                       </div>
                                       <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                                           {history.map((site) => (
                                               <div key={site.id} className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:bg-slate-50/50 transition-colors overflow-hidden">
                                                   <div className="space-y-1 flex-1 min-w-0 overflow-hidden">
                                                       <p className="text-xs font-semibold text-slate-800 break-words line-clamp-2">{site.prompt}</p>
                                                       <div className="flex items-center gap-2 flex-wrap">
                                                           <span className="text-[9px] text-slate-400 font-medium">
                                                               {new Date(site.createdAt).toLocaleDateString(undefined, {
                                                                   month: 'short',
                                                                   day: 'numeric',
                                                                   hour: '2-digit',
                                                                   minute: '2-digit'
                                                               })}
                                                           </span>
                                                           <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-600 font-mono px-1 py-0.5 rounded uppercase">
                                                               {site.outputFormat}
                                                           </span>
                                                           {site.vercelUrl && (
                                                               <a 
                                                                   href={site.vercelUrl} 
                                                                   target="_blank" 
                                                                   rel="noopener noreferrer" 
                                                                   className="text-[9px] bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 px-1.5 py-0.5 rounded font-bold transition-all flex items-center gap-0.5"
                                                               >
                                                                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                                                   Vercel Live
                                                               </a>
                                                           )}
                                                           {site.githubUrl && (
                                                               <a 
                                                                   href={site.githubUrl} 
                                                                   target="_blank" 
                                                                   rel="noopener noreferrer" 
                                                                   className="text-[9px] bg-red-50 border border-red-200 text-[#e52521] hover:bg-red-100 px-1.5 py-0.5 rounded font-bold transition-all flex items-center gap-0.5"
                                                               >
                                                                   <span className="w-1.5 h-1.5 rounded-full bg-[#e52521] shrink-0"></span>
                                                                   GitHub Live
                                                               </a>
                                                           )}
                                                       </div>
                                                   </div>
                                                   
                                                   <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                                       <button 
                                                           onClick={() => handleLoadSite(site)}
                                                           className="bg-black hover:bg-zinc-800 text-white font-bold text-[10px] uppercase px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                                                       >
                                                           Load Site
                                                       </button>
                                                       <button 
                                                           onClick={() => handleDeleteHistoryItem(site.id)}
                                                           className="text-rose-600 hover:text-rose-500 font-bold text-[10px] uppercase px-2 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                                                       >
                                                           Delete
                                                       </button>
                                                   </div>
                                               </div>
                                           ))}
                                       </div>
                                   </div>
                               )}
                             </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
};

export default AIStudio;
