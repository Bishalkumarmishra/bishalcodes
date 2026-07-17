import React, { useState, useEffect } from 'react';
import { 
  Key, Terminal, Send, Copy, Check, BookOpen, Play, Code, Zap, Cpu,
  Camera, QrCode, GitCompare, Coins, Braces, FileText, ArrowRight, CheckCircle, Info
} from 'lucide-react';
import Navbar from '../sections/Navbar';
import Footer from '../sections/Footer';
import { useNavigation } from '../context/NavigationContext';

// Define the API structure
interface ApiParam {
  name: string;
  type: string;
  required: boolean;
  defaultVal: string;
  desc: string;
}

interface ApiEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST';
  path: string;
  description: string;
  icon: React.ReactNode;
  params: ApiParam[];
  requestBodyExample?: string;
  responseExample: string;
}

const API_ENDPOINTS: ApiEndpoint[] = [
  {
    id: 'screenshot',
    name: 'Website Screenshot API',
    method: 'GET',
    path: '/api/v1/screenshot',
    description: 'Capture high-resolution screenshots of public websites. Supports custom viewports, formats, and device scale factors.',
    icon: <Camera size={18} />,
    params: [
      { name: 'url', type: 'string', required: true, defaultVal: '', desc: 'The target website URL to capture (e.g. https://google.com).' },
      { name: 'width', type: 'number', required: false, defaultVal: '1280', desc: 'Viewport width in pixels.' },
      { name: 'height', type: 'number', required: false, defaultVal: '800', desc: 'Viewport height in pixels.' },
      { name: 'fullPage', type: 'boolean', required: false, defaultVal: 'false', desc: 'Capture the full scrolling page layout.' },
      { name: 'format', type: 'string', required: false, defaultVal: 'png', desc: 'Output image format (png or jpeg).' }
    ],
    responseExample: `[Raw Binary Image Data] (Content-Type: image/png)`
  },
  {
    id: 'qrcode',
    name: 'QR Code Generator API',
    method: 'GET',
    path: '/api/v1/qrcode',
    description: 'Generate customizable, high-resolution QR codes dynamically. Supports custom colors, sizes, and padding.',
    icon: <QrCode size={18} />,
    params: [
      { name: 'text', type: 'string', required: true, defaultVal: '', desc: 'The text or URL payload to encode inside the QR code.' },
      { name: 'size', type: 'number', required: false, defaultVal: '250', desc: 'The width/height dimension in pixels.' },
      { name: 'color', type: 'string', required: false, defaultVal: '#000000', desc: 'Hex color code for the dark modules.' },
      { name: 'bg', type: 'string', required: false, defaultVal: '#ffffff', desc: 'Hex color code for the background modules.' },
      { name: 'format', type: 'string', required: false, defaultVal: 'image', desc: 'Response format: "image" (returns binary PNG) or "json" (returns base64 dataUrl).' }
    ],
    responseExample: `{
  "success": true,
  "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSU..."
}`
  },
  {
    id: 'ocr',
    name: 'AI OCR Text Extraction API',
    method: 'POST',
    path: '/api/v1/ocr',
    description: 'Extract readable text and document content from images using base64 inputs processed by Gemini 2.5 Flash.',
    icon: <Cpu size={18} />,
    params: [
      { name: 'image', type: 'string', required: true, defaultVal: '', desc: 'The base64-encoded image string data.' },
      { name: 'mimeType', type: 'string', required: false, defaultVal: 'image/jpeg', desc: 'The mime type of the image (e.g. image/png, image/jpeg).' }
    ],
    requestBodyExample: `{
  "image": "iVBORw0KGgoAAAANS...",
  "mimeType": "image/png"
}`,
    responseExample: `{
  "success": true,
  "text": "EXTRACTED DOCUMENT TEXT HERE\nInvoice No: #1002\nTotal: $150.00"
}`
  },
  {
    id: 'summarize',
    name: 'AI Document Summarizer API',
    method: 'POST',
    path: '/api/v1/summarize',
    description: 'Analyze, parse, and generate well-structured summaries or executive abstracts from raw text inputs using Gemini.',
    icon: <FileText size={18} />,
    params: [
      { name: 'text', type: 'string', required: true, defaultVal: '', desc: 'The raw text content or document text to summarize.' }
    ],
    requestBodyExample: `{
  "text": "Insert a long paragraph or book excerpt to summarize..."
}`,
    responseExample: `{
  "success": true,
  "summary": "### Purpose and scope\nThis document provides an overview of...\n\n### Key findings\n- Critical positive factors include...\n- Financial outlook shows..."
}`
  },
  {
    id: 'diff',
    name: 'Diff Checker API',
    method: 'POST',
    path: '/api/v1/diff',
    description: 'Compare two text blocks line-by-line using LCS algorithm, returning additions, deletions, and unchanged strings.',
    icon: <GitCompare size={18} />,
    params: [
      { name: 'source', type: 'string', required: true, defaultVal: '', desc: 'The original reference source text.' },
      { name: 'target', type: 'string', required: true, defaultVal: '', desc: 'The modified comparison target text.' }
    ],
    requestBodyExample: `{
  "source": "const a = 1;\nconst b = 2;",
  "target": "const a = 1;\nconst b = 3;\nconst c = 4;"
}`,
    responseExample: `{
  "success": true,
  "diff": [
    { "type": "unchanged", "value": "const a = 1;" },
    { "type": "removed", "value": "const b = 2;" },
    { "type": "added", "value": "const b = 3;" },
    { "type": "added", "value": "const c = 4;" }
  ],
  "summary": {
    "totalLines": 4,
    "added": 2,
    "removed": 1,
    "unchanged": 1
  }
}`
  },
  {
    id: 'json-format',
    name: 'JSON Formatter & Validator API',
    method: 'POST',
    path: '/api/v1/json-format',
    description: 'Validates raw JSON formatting inputs, and minifies, formats, or validates syntax with detailed error position reports.',
    icon: <Braces size={18} />,
    params: [
      { name: 'json', type: 'string', required: true, defaultVal: '', desc: 'The raw JSON string to process.' },
      { name: 'action', type: 'string', required: false, defaultVal: 'format', desc: 'Process action: "format", "minify", or "validate".' },
      { name: 'space', type: 'number', required: false, defaultVal: '2', desc: 'Indentation spacing (number of spaces, default 2).' }
    ],
    requestBodyExample: `{
  "json": "{\\"name\\":\\"John\\",\\"age\\":30}",
  "action": "format",
  "space": 4
}`,
    responseExample: `{
  "success": true,
  "valid": true,
  "error": null,
  "formatted": "{\n    \"name\": \"John\",\n    \"age\": 30\n}"
}`
  },
  {
    id: 'currency',
    name: 'Currency Exchange API',
    method: 'GET',
    path: '/api/v1/currency',
    description: 'Get real-time currency exchange rates updated from financial markets. Supports custom base currency conversions.',
    icon: <Coins size={18} />,
    params: [
      { name: 'base', type: 'string', required: false, defaultVal: 'USD', desc: 'The reference base currency code (e.g. USD, EUR, INR, NPR).' }
    ],
    responseExample: `{
  "success": true,
  "base": "USD",
  "rates": {
    "NPR": 133.45,
    "INR": 83.28,
    "EUR": 0.92,
    "GBP": 0.79
  },
  "timestamp": 1721223400
}`
  }
];

const DeveloperPortal: React.FC<{ apiId?: string | null }> = ({ apiId }) => {
  const { navigate } = useNavigation();
  const [selectedApi, setSelectedApi] = useState<ApiEndpoint>(API_ENDPOINTS[0]);
  const [activeTab, setActiveTab] = useState<'docs' | 'playground' | 'snippets'>('docs');
  const [snippetLang, setSnippetLang] = useState<'js' | 'python' | 'curl' | 'go'>('js');
  const [apiKey, setApiKey] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Playground form states
  const [playgroundParams, setPlaygroundParams] = useState<Record<string, string>>({});
  const [loadingPlayground, setLoadingPlayground] = useState(false);
  const [playgroundResult, setPlaygroundResult] = useState<string>('');
  const [isImageResult, setIsImageResult] = useState(false);
  const [imageUrlResult, setImageUrlResult] = useState('');
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  // Load selected API from deep-link ID parameter
  useEffect(() => {
    if (apiId) {
      const matched = API_ENDPOINTS.find(a => a.id === apiId);
      if (matched) {
        setSelectedApi(matched);
      }
    }
  }, [apiId]);

  // Load API Key from local storage or generate initial one
  useEffect(() => {
    const savedKey = localStorage.getItem('developer_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    } else {
      generateNewKey();
    }
  }, []);

  // Update playground inputs when API changes
  useEffect(() => {
    const initialParams: Record<string, string> = {};
    selectedApi.params.forEach(param => {
      // Default playground values
      if (selectedApi.id === 'ocr' && param.name === 'image') {
        initialParams[param.name] = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=='; // Tiny 5x5 transparent dot
      } else if (selectedApi.id === 'summarize' && param.name === 'text') {
        initialParams[param.name] = 'Bishal Codes Studio is a cutting-edge software development agency located in Kathmandu, Nepal. We build high-performance Next.js systems, serverless web engines, automated tool integrations, and interactive user interfaces. Our focus is absolute technical quality, lightning speed, search engine readability, and modular UI engineering.';
      } else if (selectedApi.id === 'diff') {
        if (param.name === 'source') initialParams[param.name] = 'function greet() {\n  console.log("hello");\n}';
        if (param.name === 'target') initialParams[param.name] = 'function greet(user) {\n  console.log("hello", user);\n}';
      } else if (selectedApi.id === 'json-format' && param.name === 'json') {
        initialParams[param.name] = '{"name":"Bishal Codes","status":"active","rating":5}';
      } else if (selectedApi.id === 'screenshot' && param.name === 'url') {
        initialParams[param.name] = 'https://bishalcodes.com';
      } else if (selectedApi.id === 'qrcode' && param.name === 'text') {
        initialParams[param.name] = 'https://bishalcodes.com';
      } else {
        initialParams[param.name] = param.defaultVal;
      }
    });
    setPlaygroundParams(initialParams);
    setPlaygroundResult('');
    setIsImageResult(false);
    setImageUrlResult('');
    setExecutionTime(null);
  }, [selectedApi]);

  const generateNewKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let salt = '';
    for (let i = 0; i < 24; i++) {
      salt += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const newKey = `bc_live_${salt}`;
    setApiKey(newKey);
    localStorage.setItem('developer_api_key', newKey);
  };

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleParamChange = (name: string, val: string) => {
    setPlaygroundParams(prev => ({ ...prev, [name]: val }));
  };

  const runPlayground = async () => {
    setLoadingPlayground(true);
    setIsImageResult(false);
    setPlaygroundResult('');
    setImageUrlResult('');
    const startTime = performance.now();

    try {
      if (selectedApi.method === 'GET') {
        // Construct query parameters
        const queryParams = new URLSearchParams();
        Object.entries(playgroundParams).forEach(([k, v]) => {
          if (v) queryParams.append(k, v);
        });
        queryParams.append('apiKey', apiKey);

        const targetUrl = `${selectedApi.path}?${queryParams.toString()}`;

        // Handle image formats directly
        const isImage = selectedApi.id === 'screenshot' || (selectedApi.id === 'qrcode' && playgroundParams['format'] !== 'json');

        if (isImage) {
          // Verify loading the raw image
          const response = await fetch(targetUrl);
          if (!response.ok) {
            const errJson = await response.json();
            throw new Error(errJson.error || 'Failed to generate image.');
          }
          const blob = await response.blob();
          const objUrl = URL.createObjectURL(blob);
          setIsImageResult(true);
          setImageUrlResult(objUrl);
          setPlaygroundResult('[Binary Image Data Rendered Above]');
        } else {
          // Handle standard JSON GET endpoints
          const response = await fetch(targetUrl);
          const data = await response.json();
          setPlaygroundResult(JSON.stringify(data, null, 2));
        }
      } else {
        // Construct POST request body
        const payload: Record<string, any> = {};
        selectedApi.params.forEach(p => {
          const val = playgroundParams[p.name];
          if (p.type === 'number') {
            payload[p.name] = parseInt(val, 10);
          } else if (p.type === 'boolean') {
            payload[p.name] = val === 'true';
          } else {
            payload[p.name] = val;
          }
        });

        const response = await fetch(selectedApi.path, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        setPlaygroundResult(JSON.stringify(data, null, 2));
      }
    } catch (err: any) {
      setPlaygroundResult(JSON.stringify({ error: err.message || 'Failed to complete request.' }, null, 2));
    } finally {
      const endTime = performance.now();
      setExecutionTime(Math.round(endTime - startTime));
      setLoadingPlayground(false);
    }
  };

  // Generate code integration snippet
  const generateCodeSnippet = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bishalcodes.com';
    const baseUrl = `${origin}${selectedApi.path}`;
    
    // Construct values dictionary
    const values: Record<string, string> = {};
    selectedApi.params.forEach(p => {
      values[p.name] = playgroundParams[p.name] || p.defaultVal;
    });

    if (snippetLang === 'curl') {
      if (selectedApi.method === 'GET') {
        const queryParams = new URLSearchParams(values).toString();
        const fullUrl = queryParams ? `${baseUrl}?${queryParams}` : baseUrl;
        return `curl -X GET "${fullUrl}" \\\n  -H "X-API-Key: ${apiKey}"`;
      } else {
        const jsonBody = JSON.stringify(values, null, 2).replace(/\n/g, '\n  ');
        return `curl -X POST "${baseUrl}" \\\n  -H "X-API-Key: ${apiKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '${jsonBody}'`;
      }
    }

    if (snippetLang === 'js') {
      if (selectedApi.method === 'GET') {
        const queryParams = new URLSearchParams(values).toString();
        const fullUrl = queryParams ? `${baseUrl}?${queryParams}` : baseUrl;
        return `// Integration Example inside Javascript/Node.js
fetch("${fullUrl}", {
  headers: {
    "X-API-Key": "${apiKey}"
  }
})
.then(res => ${selectedApi.id === 'screenshot' || (selectedApi.id === 'qrcode' && values['format'] !== 'json') ? 'res.blob()' : 'res.json()'})
.then(data => {
  console.log("API Response:", data);
})
.catch(err => console.error(err));`;
      } else {
        return `// Integration Example inside Javascript/Node.js
const payload = ${JSON.stringify(values, null, 2)};

fetch("${baseUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "${apiKey}"
  },
  body: JSON.stringify(payload)
})
.then(res => res.json())
.then(data => {
  console.log("API Response:", data);
})
.catch(err => console.error(err));`;
      }
    }

    if (snippetLang === 'python') {
      if (selectedApi.method === 'GET') {
        const isImage = selectedApi.id === 'screenshot' || (selectedApi.id === 'qrcode' && values['format'] !== 'json');
        return `import requests

url = "${baseUrl}"
params = ${JSON.stringify(values, null, 4).replace(/\n/g, '\n')}
headers = {
    "X-API-Key": "${apiKey}"
}

response = requests.get(url, params=params, headers=headers)

if response.status_code == 200:
    ${isImage ? '# Save output image file\n    with open("output.png", "wb") as f:\n        f.write(response.content)\n    print("Image saved successfully.")' : 'data = response.json()\n    print(data)'}
else:
    print("Error:", response.text)`;
      } else {
        return `import requests

url = "${baseUrl}"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "${apiKey}"
}
payload = ${JSON.stringify(values, null, 4).replace(/\n/g, '\n')}

response = requests.post(url, json=payload, headers=headers)
if response.status_code == 200:
    data = response.json()
    print("Success:", data)
else:
    print("Error:", response.text)`;
      }
    }

    if (snippetLang === 'go') {
      if (selectedApi.method === 'GET') {
        const queryParams = new URLSearchParams(values).toString();
        const fullUrl = queryParams ? `${baseUrl}?${queryParams}` : baseUrl;
        return `package main

import (
	"fmt"
	"io"
	"net/http"
)

func main() {
	req, _ := http.NewRequest("GET", "${fullUrl}", nil)
	req.Header.Set("X-API-Key", "${apiKey}")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println("Response Status:", resp.Status)
	fmt.Println("Response Body Length:", len(body))
}`;
      } else {
        const payloadStr = JSON.stringify(values, null, "\t").replace(/\n/g, '\n\t');
        return `package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
)

func main() {
	payload := []byte(\`${payloadStr}\`)
	req, _ := http.NewRequest("POST", "${baseUrl}", bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", "${apiKey}")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println("Response Body:", string(body))
}`;
      }
    }

    return '';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      <Navbar />

      {/* Hero section */}
      <div className="pt-28 pb-12 w-full px-[5vw] relative z-10 border-b border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1 rounded-full mb-3 text-indigo-650 dark:text-indigo-400 font-bold uppercase tracking-wider text-[9px]">
            <Terminal size={12} />
            API Store & Developer Hub
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none animate-none">
            Developer APIs For Core Utilities
          </h1>
          <p className="text-[#475569] dark:text-slate-400 text-sm sm:text-base leading-relaxed mt-3 max-w-2xl font-normal">
            Integrate robust, production-level, and lightning-fast developer utility endpoints. Instantly test requests via the Live Playground and get ready-to-use code snippets.
          </p>
        </div>
      </div>

      {/* Main content grid */}
      <div className="flex-grow w-full px-[5vw] py-10 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar - API Switcher */}
          <div className="lg:col-span-1 space-y-2">
            <p className="text-[#475569] dark:text-slate-400 font-bold uppercase tracking-wider text-[9px] px-3 mb-2">Available APIs</p>
            {API_ENDPOINTS.map(api => {
              const isSelected = selectedApi.id === api.id;
              return (
                <button
                  key={api.id}
                  onClick={() => setSelectedApi(api)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border text-left font-bold transition-all ${
                    isSelected 
                      ? 'bg-slate-900 dark:bg-indigo-600 border-slate-900 dark:border-indigo-500/60 text-white shadow-md' 
                      : 'bg-white dark:bg-transparent border-slate-200 dark:border-slate-900 hover:border-slate-300 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/30 text-[#475569] dark:text-slate-400 hover:text-[#0f172a] dark:hover:text-slate-200'
                  }`}
                >
                  <span className={`p-1.5 rounded-lg border transition-colors ${
                    isSelected ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-[#475569] dark:text-slate-400'
                  }`}>
                    {api.icon}
                  </span>
                  <div className="truncate flex-grow leading-tight">
                    <span className={`text-[11px] sm:text-xs block font-bold ${isSelected ? 'text-white' : 'text-[#0f172a] dark:text-slate-200'}`}>{api.name}</span>
                    <span className={`text-[8px] sm:text-[9px] font-mono block uppercase tracking-wider mt-0.5 ${isSelected ? 'text-indigo-200 dark:text-indigo-300' : 'text-[#475569] dark:text-slate-550'}`}>{api.method} {api.path.split('/v1')[1]}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Playground & Specs workspace */}
          <div className="lg:col-span-3 flex flex-col min-h-[500px]">
            {/* Tabs selector */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-900 mb-6 bg-slate-100 dark:bg-slate-900/10 p-1 rounded-xl w-fit">
              <button
                onClick={() => setActiveTab('docs')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'docs' ? 'bg-white dark:bg-slate-900 text-[#0f172a] dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm' : 'text-[#475569] dark:text-slate-400 hover:text-[#0f172a] dark:hover:text-slate-200'
                }`}
              >
                <BookOpen size={14} />
                Documentation
              </button>
              <button
                onClick={() => setActiveTab('playground')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'playground' ? 'bg-white dark:bg-slate-900 text-[#0f172a] dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm' : 'text-[#475569] dark:text-slate-400 hover:text-[#0f172a] dark:hover:text-slate-200'
                }`}
              >
                <Play size={14} />
                Playground
              </button>
              <button
                onClick={() => setActiveTab('snippets')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'snippets' ? 'bg-white dark:bg-slate-900 text-[#0f172a] dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm' : 'text-[#475569] dark:text-slate-400 hover:text-[#0f172a] dark:hover:text-slate-200'
                }`}
              >
                <Code size={14} />
                Integrations
              </button>
            </div>

            {/* TAB CONTENTS */}
            <div className="flex-grow rounded-2xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/30 p-5 sm:p-7 relative shadow-sm">
              
              {/* DOCUMENTATION TAB */}
              {activeTab === 'docs' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#0f172a] dark:text-white mb-2">{selectedApi.name}</h2>
                    <p className="text-[#475569] dark:text-slate-400 text-xs sm:text-sm leading-relaxed font-normal">{selectedApi.description}</p>
                  </div>

                  {/* Visual Architecture Diagram */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20">
                    <p className="text-[10px] font-bold text-[#475569] dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Terminal size={12} className="text-indigo-600 dark:text-indigo-400" />
                      Request Flow & API Key Authentication Check
                    </p>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center">
                      <div className="flex-grow p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm w-full md:w-auto">
                        <div className="text-[10px] font-bold text-[#475569] dark:text-slate-400 uppercase tracking-wider">Client Request</div>
                        <div className="text-xs font-extrabold text-[#0f172a] dark:text-white mt-1 font-mono">{selectedApi.method} {selectedApi.path}</div>
                      </div>
                      <div className="text-[#475569] dark:text-slate-600 text-xs font-bold leading-none select-none hidden md:block">➔</div>
                      <div className="text-[#475569] dark:text-slate-600 text-xs font-bold leading-none select-none md:hidden">▼</div>
                      <div className="flex-grow p-3 rounded-lg border border-indigo-200 dark:border-indigo-950 bg-indigo-50/30 dark:bg-indigo-950/10 w-full md:w-auto">
                        <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Auth Gate (validateApiKey)</div>
                        <div className="text-xs font-bold text-[#334155] dark:text-slate-350 mt-1">Checks origin / bc_prod_ key</div>
                      </div>
                      <div className="text-[#475569] dark:text-slate-600 text-xs font-bold leading-none select-none hidden md:block">➔</div>
                      <div className="text-[#475569] dark:text-slate-600 text-xs font-bold leading-none select-none md:hidden">▼</div>
                      <div className="flex-grow p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm w-full md:w-auto">
                        <div className="text-[10px] font-bold text-[#475569] dark:text-slate-400 uppercase tracking-wider">Target Resolver</div>
                        <div className="text-xs font-extrabold text-[#0f172a] dark:text-white mt-1">
                          {selectedApi.id === 'ocr' || selectedApi.id === 'summarize' ? 'Gemini 2.5 Flash Model' : selectedApi.id === 'currency' ? 'Yahoo Finance API' : selectedApi.id === 'screenshot' ? 'Microlink Engine' : 'Local Server Thread'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dark block for path is highly visible & standard in both modes */}
                  <div className="flex items-center gap-3 bg-slate-950 border border-slate-900 rounded-xl p-3 sm:p-4">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider text-white ${
                      selectedApi.method === 'POST' ? 'bg-emerald-600' : 'bg-indigo-600'
                    }`}>
                      {selectedApi.method}
                    </span>
                    <code className="text-xs sm:text-sm font-mono font-bold text-slate-300 truncate">
                      {selectedApi.path}
                    </code>
                  </div>

                  {/* Headers section */}
                  <div>
                    <h3 className="text-xs font-bold text-[#0f172a] dark:text-white uppercase tracking-wider mb-3">Required Request Headers</h3>
                    <div className="border border-slate-200 dark:border-slate-900 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
                      <table className="w-full text-[10px] sm:text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-900 bg-slate-100/50 dark:bg-slate-900/50 text-[#475569] dark:text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                            <th className="px-4 py-3">Header</th>
                            <th className="px-4 py-3">Value / Type</th>
                            <th className="px-4 py-3">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-900 font-medium">
                          <tr>
                            <td className="px-4 py-3 font-mono font-bold text-[#4f46e5] dark:text-indigo-400">X-API-Key</td>
                            <td className="px-4 py-3 font-mono text-[#334155] dark:text-[#cbd5e1]">string (Required)</td>
                            <td className="px-4 py-3 text-[#475569] dark:text-slate-500">Your Sandbox or Live API Authentication key.</td>
                          </tr>
                          {selectedApi.method === 'POST' && (
                            <tr>
                              <td className="px-4 py-3 font-mono font-bold text-[#4f46e5] dark:text-indigo-400">Content-Type</td>
                              <td className="px-4 py-3 font-mono text-[#334155] dark:text-[#cbd5e1]">application/json</td>
                              <td className="px-4 py-3 text-[#475569] dark:text-slate-500">Required payload Content Type for POST.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Query Parameters / Body section */}
                  <div>
                    <h3 className="text-xs font-bold text-[#0f172a] dark:text-white uppercase tracking-wider mb-3">
                      {selectedApi.method === 'GET' ? 'Query Parameters' : 'Request Body Schema'}
                    </h3>
                    <div className="border border-slate-200 dark:border-slate-900 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
                      <table className="w-full text-[10px] sm:text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-900 bg-slate-100/50 dark:bg-slate-900/50 text-[#475569] dark:text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                            <th className="px-4 py-3">Field</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Requirement</th>
                            <th className="px-4 py-3">Default</th>
                            <th className="px-4 py-3">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-900 font-medium">
                          {selectedApi.params.map(p => (
                            <tr key={p.name}>
                              <td className="px-4 py-3 font-mono font-bold text-[#4f46e5] dark:text-[#818cf8]">{p.name}</td>
                              <td className="px-4 py-3 font-mono text-[#334155] dark:text-[#cbd5e1]">{p.type}</td>
                              <td className="px-4 py-3">
                                {p.required ? (
                                  <span className="text-[#e11d48] dark:text-[#fb7185] font-semibold uppercase tracking-wider text-[9px]">Required</span>
                                ) : (
                                  <span className="text-[#475569] dark:text-slate-400">Optional</span>
                                )}
                              </td>
                              <td className="px-4 py-3 font-mono text-[#475569] dark:text-slate-400">{p.defaultVal || '-'}</td>
                              <td className="px-4 py-3 text-[#475569] dark:text-slate-500 font-normal">{p.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Response example */}
                  <div>
                    <h3 className="text-xs font-bold text-[#0f172a] dark:text-white uppercase tracking-wider mb-3">Example API Response</h3>
                    <pre className="p-4 rounded-xl bg-slate-950 border border-slate-900 font-mono text-[10px] sm:text-xs text-emerald-450 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {selectedApi.responseExample}
                    </pre>
                  </div>
                </div>
              )}

              {/* PLAYGROUND TAB */}
              {activeTab === 'playground' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-7">
                  
                  {/* Left Column: Config Panel */}
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xs font-bold text-[#0f172a] dark:text-white uppercase tracking-wider mb-2">Request Parameters</h2>
                      <p className="text-[10px] text-[#475569] dark:text-slate-550">Enter parameters below to build and run the query.</p>
                    </div>

                    <div className="space-y-3.5">
                      {selectedApi.params.map(p => (
                        <div key={p.name}>
                          <label className="flex items-center justify-between text-[10px] sm:text-xs font-bold mb-1.5 text-[#334155] dark:text-slate-300">
                            <span>{p.name} {p.required && <span className="text-[#e11d48] dark:text-[#fb7185]">*</span>}</span>
                            <span className="text-[9px] font-mono text-[#475569] dark:text-slate-500">{p.type}</span>
                          </label>

                          {/* Specific input components for different types */}
                          {p.name === 'text' || p.name === 'source' || p.name === 'target' || p.name === 'image' || p.name === 'json' ? (
                            <textarea
                              value={playgroundParams[p.name] || ''}
                              onChange={(e) => handleParamChange(p.name, e.target.value)}
                              rows={selectedApi.id === 'ocr' || selectedApi.id === 'diff' ? 4 : 3}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-[#0f172a] dark:text-white outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors font-mono resize-none leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-700"
                              placeholder={p.desc}
                            />
                          ) : p.type === 'boolean' ? (
                            <select
                              value={playgroundParams[p.name] || 'false'}
                              onChange={(e) => handleParamChange(p.name, e.target.value)}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-[#0f172a] dark:text-white outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors cursor-pointer"
                            >
                              <option value="false">false</option>
                              <option value="true">true</option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={playgroundParams[p.name] || ''}
                              onChange={(e) => handleParamChange(p.name, e.target.value)}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-[#0f172a] dark:text-white outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors font-mono"
                              placeholder={p.defaultVal || p.desc}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={runPlayground}
                      disabled={loadingPlayground}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingPlayground ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending Query...
                        </>
                      ) : (
                        <>
                          <Send size={12} />
                          Send API Request
                        </>
                      )}
                    </button>
                  </div>

                  {/* Right Column: Response Panel */}
                  <div className="flex flex-col h-full min-h-[300px]">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xs font-bold text-[#0f172a] dark:text-white uppercase tracking-wider">Server Response</h2>
                      {executionTime !== null && (
                        <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-450 bg-emerald-500/10 px-2 py-0.5 rounded leading-none border border-emerald-500/20">
                          {executionTime}ms
                        </span>
                      )}
                    </div>

                    {isImageResult ? (
                      <div className="flex-grow flex flex-col items-center justify-center border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950 rounded-xl p-4 min-h-[220px]">
                        <img 
                          src={imageUrlResult} 
                          alt="Playground API Result" 
                          className="max-w-full max-h-[280px] object-contain rounded-lg border border-slate-200 dark:border-slate-800 shadow-md bg-white dark:bg-slate-900" 
                        />
                        <span className="text-[10px] text-[#475569] dark:text-slate-400 font-bold uppercase tracking-wider mt-3">Raw Render Output</span>
                      </div>
                    ) : (
                      <pre className="flex-grow p-4 rounded-xl bg-slate-950 border border-slate-900 font-mono text-[9px] sm:text-xs text-indigo-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[400px]">
                        {playgroundResult || '// Click "Send API Request" to view live JSON response output'}
                      </pre>
                    )}
                  </div>
                </div>
              )}

              {/* INTEGRATIONS TAB */}
              {activeTab === 'snippets' && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xs font-bold text-[#0f172a] dark:text-white uppercase tracking-wider mb-2">Copy Integration Snippet</h2>
                    <p className="text-[10px] text-[#475569] dark:text-slate-550">Pick your favorite language stack. Code is updated in real-time based on current playground values.</p>
                  </div>

                  {/* Language Selector */}
                  <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-900 pb-4">
                    {(['js', 'python', 'curl', 'go'] as const).map(lang => (
                      <button
                        key={lang}
                        onClick={() => setSnippetLang(lang)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                          snippetLang === lang ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-650 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/25' : 'text-[#475569] hover:text-[#0f172a] dark:hover:text-slate-300'
                        }`}
                      >
                        {lang === 'js' ? 'Javascript' : lang === 'python' ? 'Python' : lang === 'curl' ? 'cURL' : 'Go'}
                      </button>
                    ))}
                  </div>

                  {/* Code Panel */}
                  <div className="relative">
                    <button
                      onClick={() => copyToClipboard(generateCodeSnippet(), setCopiedCode)}
                      className="absolute top-3 right-3 p-2 bg-slate-900 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition-colors cursor-pointer"
                    >
                      {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                    <pre className="p-4 rounded-xl bg-slate-950 border border-slate-900 font-mono text-[10px] sm:text-xs text-indigo-300 overflow-x-auto whitespace-pre leading-relaxed">
                      {generateCodeSnippet()}
                    </pre>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Pricing packages section for commercial intent */}
      <div className="py-16 w-full border-t border-slate-200 dark:border-slate-900 bg-slate-100/50 dark:bg-slate-900/10 px-[5vw] relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12">
            <p className="text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider text-[10px] mb-2">API Pricing Models</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] dark:text-white tracking-tight leading-none">
              Choose A Plan That Fits Your Scale
            </h2>
            <p className="text-[#475569] dark:text-slate-400 text-xs sm:text-sm mt-3 leading-relaxed font-normal">
              Unlock live endpoints with higher rate limits, high availability SLA, and dedicated engineering consultation support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free Sandbox */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 flex flex-col justify-between h-full">
              <div>
                <p className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">Developer Sandbox</p>
                <div className="flex items-baseline gap-1 text-[#0f172a] dark:text-white mb-4">
                  <span className="text-3xl font-black">$0</span>
                  <span className="text-xs text-slate-500 font-normal">/ free sandbox</span>
                </div>
                <ul className="space-y-3 text-xs text-[#334155] dark:text-slate-300 font-medium border-t border-slate-200 dark:border-slate-900 pt-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    100 API Requests / day
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    Unlimited local playground queries
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    Access to all 7 API endpoints
                  </li>
                </ul>
              </div>
              <button className="mt-8 w-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider border border-slate-200 dark:border-slate-800">
                Current Plan
              </button>
            </div>

            {/* Pro SaaS API Tier */}
            <div className="p-6 rounded-2xl border-2 border-indigo-500/50 bg-white dark:bg-slate-900 relative flex flex-col justify-between h-full shadow-lg shadow-indigo-500/5 dark:shadow-indigo-500/5">
              <span className="absolute top-0 right-6 -translate-y-1/2 bg-indigo-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                POPULAR
              </span>
              <div>
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">Commercial Pro</p>
                <div className="flex items-baseline gap-1 text-[#0f172a] dark:text-white mb-4">
                  <span className="text-3xl font-black">$29</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">/ month</span>
                </div>
                <ul className="space-y-3 text-xs text-[#334155] dark:text-slate-350 font-medium border-t border-slate-200 dark:border-slate-800/80 pt-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-indigo-600 dark:text-indigo-450 shrink-0" />
                    50,000 API Requests / month
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-indigo-600 dark:text-indigo-450 shrink-0" />
                    Rate limit: 60 req / minute
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-indigo-600 dark:text-indigo-450 shrink-0" />
                    Dedicated HTTPS live production key
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-indigo-600 dark:text-indigo-455 shrink-0" />
                    99.9% Server uptime SLA
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => navigate('checkout', 'pro')}
                className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
              >
                Upgrade to Pro
              </button>
            </div>

            {/* Enterprise Tier */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 flex flex-col justify-between h-full">
              <div>
                <p className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">Custom Integration</p>
                <div className="flex items-baseline gap-1 text-[#0f172a] dark:text-white mb-4">
                  <span className="text-3xl font-black">$149</span>
                  <span className="text-xs text-slate-500 font-normal">/ month starting</span>
                </div>
                <ul className="space-y-3 text-xs text-[#334155] dark:text-slate-350 font-medium border-t border-slate-200 dark:border-slate-900 pt-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    Unlimited Requests (Custom contract)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    Rate limit: 500 req / minute
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    Zero-throttling hosting cluster scaling
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    Email, slack, and call developer support
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => navigate('checkout', 'enterprise')}
                className="mt-8 w-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider border border-slate-200 dark:border-slate-800 cursor-pointer"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default DeveloperPortal;
