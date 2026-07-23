'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Download, Image as ImageIcon, Copy, Check, 
  User, Globe, Github, Plus, Trash2, Layout, Palette, FileCode,
  Type, Settings as SettingsIcon, Sliders, RefreshCw, Move, Pencil,
  Twitter, Linkedin, Youtube, Instagram, MessageSquare, Mail
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { SeoGuideSection } from './SeoGuideSection';
import html2canvas from 'html2canvas';

type PresetType = 'og-image' | 'github-banner' | 'business-card' | 'linkedin-banner' | 'twitter-header' | 'youtube-banner' | 'instagram-post';
type TemplateType = 'minimal-asymmetric' | 'modern-centered' | 'split-hero' | 'neon-cyberpunk' | 'technical-console' | 'retro-vintage' | 'glassmorphism' | 'futuristic-aurora' | 'minimalist-dark' | 'gradient-mesh';
type FontType = 'inter' | 'playfair' | 'fira-code' | 'jakarta' | 'syne';
type BackgroundPresetType = 'slate' | 'cream' | 'midnight-glow' | 'ocean-mist' | 'sunset-rise' | 'forest-moss' | 'glass' | 'custom';

interface ThemeStyles {
  bg: string;
  text: string;
  subtext: string;
  border: string;
  badgeBg: string;
  badgeText: string;
}

const themeStylesMap: Record<TemplateType, ThemeStyles> = {
  'minimal-asymmetric': {
    bg: 'bg-slate-950',
    text: 'text-slate-50',
    subtext: 'text-slate-400',
    border: 'border-slate-800',
    badgeBg: 'bg-slate-900 border border-slate-800',
    badgeText: 'text-slate-350'
  },
  'modern-centered': {
    bg: 'bg-slate-950',
    text: 'text-slate-50',
    subtext: 'text-slate-400',
    border: 'border-slate-800',
    badgeBg: 'bg-slate-900 border border-slate-800',
    badgeText: 'text-slate-350'
  },
  'split-hero': {
    bg: 'bg-slate-900',
    text: 'text-slate-50',
    subtext: 'text-slate-450',
    border: 'border-slate-800',
    badgeBg: 'bg-slate-950 border border-slate-800/80',
    badgeText: 'text-slate-300'
  },
  'neon-cyberpunk': {
    bg: 'bg-slate-950',
    text: 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-red-400',
    subtext: 'text-cyan-400/90',
    border: 'border-[#e52521]/40 shadow-[0_0_15px_rgba(229,37,33,0.25)]',
    badgeBg: 'bg-red-950/30 border border-[#e52521]/30 shadow-[0_0_5px_rgba(229,37,33,0.15)]',
    badgeText: 'text-cyan-300'
  },
  'technical-console': {
    bg: 'bg-slate-950',
    text: 'text-green-500 font-mono',
    subtext: 'text-green-600 font-mono',
    border: 'border-green-950',
    badgeBg: 'bg-slate-900/60 border border-green-950',
    badgeText: 'text-green-400'
  },
  'retro-vintage': {
    bg: 'bg-[#faf6f0]',
    text: 'text-slate-900',
    subtext: 'text-slate-650',
    border: 'border-slate-300/80',
    badgeBg: 'bg-white border border-slate-250',
    badgeText: 'text-slate-700'
  },
  'glassmorphism': {
    bg: 'bg-slate-900/20 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.37)]',
    text: 'text-white',
    subtext: 'text-slate-200/80',
    border: 'border-white/10',
    badgeBg: 'bg-white/10 border border-white/10 backdrop-blur-sm',
    badgeText: 'text-slate-100'
  },
  'futuristic-aurora': {
    bg: 'bg-slate-950 border border-cyan-500/30',
    text: 'text-cyan-400',
    subtext: 'text-slate-400',
    border: 'border-cyan-500/20',
    badgeBg: 'bg-cyan-950/20 border border-cyan-500/30',
    badgeText: 'text-cyan-300'
  },
  'minimalist-dark': {
    bg: 'bg-neutral-950 border border-neutral-900',
    text: 'text-neutral-50',
    subtext: 'text-neutral-500',
    border: 'border-neutral-800',
    badgeBg: 'bg-neutral-900/40 border border-neutral-800',
    badgeText: 'text-neutral-300'
  },
  'gradient-mesh': {
    bg: 'bg-slate-950 border border-[#e52521]/20',
    text: 'text-white',
    subtext: 'text-slate-200/90',
    border: 'border-white/10',
    badgeBg: 'bg-white/10 border border-white/10 backdrop-blur-sm',
    badgeText: 'text-white'
  }
};

const fontStylesMap: Record<FontType, string> = {
  'inter': "'Inter', sans-serif",
  'playfair': "'Playfair Display', serif",
  'fira-code': "'Fira Code', monospace",
  'jakarta': "'Plus Jakarta Sans', sans-serif",
  'syne': "'Syne', sans-serif"
};

const bgGradients: Record<BackgroundPresetType, string> = {
  'slate': 'linear-gradient(to bottom, #090d16, #090d16)',
  'cream': 'linear-gradient(to bottom, #faf6f0, #faf6f0)',
  'midnight-glow': 'linear-gradient(135deg, #1e1b4b 0%, #090d16 100%)',
  'ocean-mist': 'linear-gradient(135deg, #083344 0%, #090d16 100%)',
  'sunset-rise': 'linear-gradient(135deg, #4c0519 0%, #090d16 100%)',
  'forest-moss': 'linear-gradient(135deg, #022c22 0%, #090d16 100%)',
  'glass': 'linear-gradient(to bottom, rgba(15, 23, 42, 0.6), rgba(15, 23, 42, 0.45))',
  'custom': ''
};

export const DeveloperCardStudio: React.FC = () => {
  const { navigate } = useNavigation();

  // Tab selections
  const [activeTab, setActiveTab] = useState<'template' | 'content' | 'styling' | 'settings'>('template');

  // Input states
  const [name, setName] = useState('Bishal Mishra');
  const [title, setTitle] = useState('Full-Stack Software Engineer');
  const [location, setLocation] = useState('Kathmandu, Nepal');
  const [github, setGithub] = useState('Bishalkumarmishra');
  const [website, setWebsite] = useState('bishalcodes.com');
  const [linkedin, setLinkedin] = useState('bishalkumarmishra');
  const [twitter, setTwitter] = useState('BishalMishra');
  const [youtube, setYoutube] = useState('');
  const [instagram, setInstagram] = useState('');
  const [discord, setDiscord] = useState('');
  const [email, setEmail] = useState('');
  const [tags, setTags] = useState<string[]>(['React', 'Next.js', 'TypeScript', 'Node.js', 'Firebase']);
  const [newTag, setNewTag] = useState('');
  
  // Customization presets
  const [activePreset, setActivePreset] = useState<PresetType>('og-image');
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>('minimal-asymmetric');
  const [activeFont, setActiveFont] = useState<FontType>('inter');
  const [bgPreset, setBgPreset] = useState<BackgroundPresetType>('midnight-glow');
  
  // Custom design parameters
  const [customBgColor, setCustomBgColor] = useState('#0b0f19');
  const [customTextColor, setCustomTextColor] = useState('#f8fafc');
  const [customAccentColor, setCustomAccentColor] = useState('#6366f1');
  const [nameFontSize, setNameFontSize] = useState(48); // px unit on base native size (1200)
  const [titleFontSize, setTitleFontSize] = useState(24);
  const [cardRounding, setCardRounding] = useState(16); // px

  // Avatar customization
  const [showAvatar, setShowAvatar] = useState(true);
  const [avatarShape, setAvatarShape] = useState<'circle' | 'rounded'>('circle');
  const [avatarFit, setAvatarFit] = useState<'cover' | 'contain'>('cover');
  const [avatarSize, setAvatarSize] = useState(130); // px
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  
  // Drag and drop positional offset states
  const [avatarOffset, setAvatarOffset] = useState({ x: 0, y: 0 });
  const [detailsOffset, setDetailsOffset] = useState({ x: 0, y: 0 });
  const [tagsOffset, setTagsOffset] = useState({ x: 0, y: 0 });
  const [isDragModeEnabled, setIsDragModeEnabled] = useState(false);
  const [activeDragItem, setActiveDragItem] = useState<'avatar' | 'details' | 'tags' | null>(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });

  // Scale and export utilities
  const [scale, setScale] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [copiedText, setCopiedText] = useState<'svg' | 'react' | null>(null);

  // Refs
  const cardRef = useRef<HTMLDivElement>(null);
  const exportCardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resize handler for perfect scaling in the workspace preview
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateScale = () => {
      if (!containerRef.current) return;
      const parentWidth = containerRef.current.getBoundingClientRect().width;
      
      let targetWidth = 1200;
      if (activePreset === 'github-banner') targetWidth = 800;
      if (activePreset === 'business-card') targetWidth = 600;
      if (activePreset === 'linkedin-banner') targetWidth = 1584;
      if (activePreset === 'twitter-header') targetWidth = 1500;
      if (activePreset === 'youtube-banner') targetWidth = 2048;
      if (activePreset === 'instagram-post') targetWidth = 1080;
      
      const horizontalPadding = 32; // match px-4
      const availableWidth = parentWidth - horizontalPadding;
      
      if (availableWidth < targetWidth) {
        setScale(availableWidth / targetWidth);
      } else {
        setScale(1);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [activePreset]);

  // Align background presets with active template selection automatically
  useEffect(() => {
    if (activeTemplate === 'retro-vintage') {
      setBgPreset('cream');
      setActiveFont('playfair');
    } else if (activeTemplate === 'technical-console') {
      setBgPreset('slate');
      setActiveFont('fira-code');
    } else if (activeTemplate === 'glassmorphism') {
      setBgPreset('glass');
      setActiveFont('jakarta');
    } else if (activeTemplate === 'neon-cyberpunk') {
      setBgPreset('slate');
      setActiveFont('syne');
    } else {
      setBgPreset('midnight-glow');
      setActiveFont('inter');
    }
  }, [activeTemplate]);
 
  // Update styling variables when preset changes to fit the canvas proportions
  useEffect(() => {
    if (activePreset === 'og-image') {
      setNameFontSize(52);
      setTitleFontSize(24);
      setAvatarSize(140);
    } else if (activePreset === 'github-banner') {
      setNameFontSize(38);
      setTitleFontSize(18);
      setAvatarSize(100);
    } else if (activePreset === 'business-card') {
      setNameFontSize(32);
      setTitleFontSize(16);
      setAvatarSize(90);
    } else if (activePreset === 'linkedin-banner') {
      setNameFontSize(44);
      setTitleFontSize(20);
      setAvatarSize(110);
    } else if (activePreset === 'twitter-header') {
      setNameFontSize(48);
      setTitleFontSize(22);
      setAvatarSize(120);
    } else if (activePreset === 'youtube-banner') {
      setNameFontSize(64);
      setTitleFontSize(28);
      setAvatarSize(160);
    } else if (activePreset === 'instagram-post') {
      setNameFontSize(52);
      setTitleFontSize(24);
      setAvatarSize(150);
    }
  }, [activePreset]);

  // Handle local avatar upload
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = newTag.trim();
    if (tag && !tags.includes(tag) && tags.length < 8) {
      setTags([...tags, tag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handlePointerDown = (e: React.PointerEvent, item: 'avatar' | 'details' | 'tags') => {
    if (!isDragModeEnabled) return;
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {}
    setActiveDragItem(item);
    setDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent, item: 'avatar' | 'details' | 'tags') => {
    if (!isDragModeEnabled || activeDragItem !== item) return;
    e.stopPropagation();
    
    const dx = (e.clientX - dragStartPos.x) / scale;
    const dy = (e.clientY - dragStartPos.y) / scale;
    
    if (item === 'avatar') {
      setAvatarOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    } else if (item === 'details') {
      setDetailsOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    } else if (item === 'tags') {
      setTagsOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    }
    
    setDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent, item: 'avatar' | 'details' | 'tags') => {
    if (!isDragModeEnabled) return;
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}
    setActiveDragItem(null);
  };

  const handleDownloadPng = async () => {
    const cardEl = exportCardRef.current;
    if (!cardEl) return;
    try {
      setExporting(true);
      // Wait for font load render triggers
      await document.fonts.ready;
      
      const canvas = await html2canvas(cardEl, {
        scale: 1, // Element is already 3x scaled offscreen, capture at native size
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${name.toLowerCase().replace(/\s+/g, '_')}_og_banner.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to generate crisp PNG image:', err);
    } finally {
      setExporting(false);
    }
  };

  // Compile XML string for inline SVG copy
  const generateSvgMarkup = () => {
    const isDark = activeTemplate !== 'retro-vintage';
    const bgHex = bgPreset === 'custom' ? customBgColor : (activeTemplate === 'retro-vintage' ? '#faf6f0' : bgPreset === 'midnight-glow' ? '#0f172a' : '#0b0f19');
    const textHex = bgPreset === 'custom' ? customTextColor : (isDark ? '#f8fafc' : '#0f172a');
    const subtextHex = bgPreset === 'custom' ? customTextColor + 'cc' : (isDark ? '#94a3b8' : '#64748b');
    const borderHex = bgPreset === 'custom' ? customAccentColor + '40' : (isDark ? '#1e293b' : '#e2e8f0');
    const badgeBgHex = isDark ? '#1e293b' : '#f1f5f9';
    
    let width = 1200;
    let height = 630;
    if (activePreset === 'github-banner') {
      width = 800;
      height = 300;
    } else if (activePreset === 'business-card') {
      width = 600;
      height = 350;
    }

    const cleanName = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const cleanTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const cleanLocation = location.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const cleanGithub = github.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <!-- Background -->
  <rect width="100%" height="100%" fill="${bgHex}" rx="${cardRounding}" />
  <rect x="2" y="2" width="${width - 4}" height="${height - 4}" fill="none" stroke="${borderHex}" stroke-width="2" rx="${cardRounding - 2}" />

  ${showAvatar ? `
  <g transform="translate(80, ${height / 2 - 60})">
    <circle cx="60" cy="60" r="60" fill="${badgeBgHex}" />
    <!-- User Icon silhouette -->
    <path d="M 60,35 A 15,15 0 0,1 60,65 A 15,15 0 0,1 60,35 Z M 40,85 A 20,20 0 0,1 80,85 Z" fill="${textHex}" opacity="0.6" transform="translate(0, -5)" />
  </g>
  ` : ''}

  <!-- Text elements details -->
  <g transform="translate(${showAvatar ? 240 : 80}, ${height / 2 - 40})">
    <text font-family="system-ui, sans-serif" font-weight="800" font-size="${nameFontSize}" fill="${textHex}">${cleanName}</text>
    <text font-family="system-ui, sans-serif" font-weight="600" font-size="${titleFontSize}" fill="${subtextHex}" dy="42">${cleanTitle}</text>
    <text font-family="system-ui, sans-serif" font-weight="500" font-size="14" fill="${subtextHex}" opacity="0.8" dy="75">
      ${cleanLocation ? `📍 ${cleanLocation}    ` : ''}${cleanGithub ? `💻 github.com/${cleanGithub}` : ''}
    </text>
  </g>

  <!-- Tags Row -->
  <g transform="translate(80, ${height - 90})">
    ${tags.map((tag, idx) => {
      const tagX = idx * 115;
      return `<g transform="translate(${tagX}, 0)">
      <rect width="100" height="34" rx="6" fill="${badgeBgHex}" />
      <text font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="${textHex}" x="50" y="21" text-anchor="middle">${tag}</text>
    </g>`;
    }).join('\n    ')}
  </g>
</svg>`;
  };

  const generateReactSnippet = () => {
    return `import React from 'react';

export const DevCard = () => {
  return (
    <div className="w-full max-w-xl bg-slate-950 border border-slate-800 rounded-xl p-6 text-slate-50 font-sans shadow-md">
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-xl font-bold">
          ${name.charAt(0)}
        </div>
        <div>
          <h4 className="text-xl font-bold tracking-tight text-white">${name}</h4>
          <p className="text-slate-400 text-sm font-medium">${title}</p>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 font-semibold">
            <span>📍 ${location}</span>
            <span>•</span>
            <span>github.com/${github}</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mt-6">
        ${tags.map(tag => `        <span className="bg-slate-900 border border-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-md font-medium">${tag}</span>`).join('\n')}
      </div>

      <SeoGuideSection toolId="dev-card-studio" />

    </div>
  );
};`;
  };

  const handleCopyText = (type: 'svg' | 'react') => {
    const text = type === 'svg' ? generateSvgMarkup() : generateReactSnippet();
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleReset = () => {
    setName('Bishal Mishra');
    setTitle('Full-Stack Software Engineer');
    setLocation('Kathmandu, Nepal');
    setGithub('Bishalkumarmishra');
    setWebsite('bishalcodes.com');
    setLinkedin('bishalkumarmishra');
    setTwitter('BishalMishra');
    setYoutube('');
    setInstagram('');
    setDiscord('');
    setEmail('');
    setTags(['React', 'Next.js', 'TypeScript', 'Node.js', 'Firebase']);
    setActiveTemplate('minimal-asymmetric');
    setNameFontSize(48);
    setTitleFontSize(24);
    setShowAvatar(true);
    setAvatarShape('circle');
    setAvatarFit('cover');
    setAvatarSize(130);
    setCardRounding(16);
    setAvatarOffset({ x: 0, y: 0 });
    setDetailsOffset({ x: 0, y: 0 });
    setTagsOffset({ x: 0, y: 0 });
    setIsDragModeEnabled(false);
  };
  // Helper properties map
  const themeStyles = themeStylesMap[activeTemplate];
  
  const getBaseDimensions = () => {
    switch (activePreset) {
      case 'og-image': return { width: 1200, height: 630 };
      case 'github-banner': return { width: 800, height: 300 };
      case 'business-card': return { width: 600, height: 350 };
      case 'linkedin-banner': return { width: 1584, height: 396 };
      case 'twitter-header': return { width: 1500, height: 500 };
      case 'youtube-banner': return { width: 2048, height: 1152 };
      case 'instagram-post': return { width: 1080, height: 1080 };
    }
  };

  const getCardPadding = () => {
    if (activePreset === 'og-image') return 48;
    if (activePreset === 'youtube-banner') return 64;
    if (activePreset === 'instagram-post') return 56;
    if (activePreset === 'github-banner' || activePreset === 'linkedin-banner') return 24;
    return 28; // business-card, twitter-header
  };

  const cardStyleHelper = (isOffscreen: boolean) => {
    let backgroundStyle = '';
    if (bgPreset === 'custom') {
      backgroundStyle = customBgColor;
    } else {
      backgroundStyle = bgGradients[bgPreset];
    }

    const { width: baseWidth, height: baseHeight } = getBaseDimensions();
    const m = isOffscreen ? 3 : 1;

    return {
      width: `${baseWidth * m}px`,
      height: `${baseHeight * m}px`,
      fontFamily: fontStylesMap[activeFont],
      borderRadius: `${cardRounding * m}px`,
      borderWidth: `${2 * m}px`,
      background: backgroundStyle,
      transform: isOffscreen ? 'none' : `scale(${scale})`,
      transformOrigin: 'center center',
      // prevent browser boundary shifts during scale render
      backfaceVisibility: 'hidden' as const,
      WebkitBackfaceVisibility: 'hidden' as const,
      color: bgPreset === 'custom' ? customTextColor : undefined,
    };
  };

  // Unified Renderer for the Developer Card layout variations
  const renderCardContent = (isOffscreen = false) => {
    const m = isOffscreen ? 3 : 1;
    
    // 1. Cyberpunk Neon template styling elements
    const isCyber = activeTemplate === 'neon-cyberpunk';
    const isTerminal = activeTemplate === 'technical-console';
    const isRetro = activeTemplate === 'retro-vintage';
    const isGlass = activeTemplate === 'glassmorphism';
    
    const padVal = getCardPadding() * m;
    const gapVal = 24 * m;
    const metaSize = (activePreset === 'og-image' ? 14 : 11) * m;
    const tagSizeVal = 11 * m;
    const tagPadY = 6 * m;
    const tagPadX = 12 * m;
    const tagGapVal = 8 * m;
    const borderThickness = 2 * m;

    const isDragActive = isDragModeEnabled && !isOffscreen;

    const getDraggableStyles = (item: 'avatar' | 'details' | 'tags') => {
      let x = 0;
      let y = 0;
      if (item === 'avatar') { x = avatarOffset.x; y = avatarOffset.y; }
      else if (item === 'details') { x = detailsOffset.x; y = detailsOffset.y; }
      else if (item === 'tags') { x = tagsOffset.x; y = tagsOffset.y; }

      const scaleMultiplier = isOffscreen ? 3 : 1;

      return {
        transform: `translate(${x * scaleMultiplier}px, ${y * scaleMultiplier}px)`,
        cursor: isDragActive ? 'move' : 'default',
        touchAction: isDragActive ? 'none' : 'auto',
        position: 'relative' as const,
        zIndex: activeDragItem === item ? 50 : (isDragActive ? 20 : 10),
        userSelect: (isDragActive ? 'none' : 'auto') as 'none' | 'auto',
        ...(isDragActive ? {
          border: '1.5px dashed rgba(99, 102, 241, 0.6)',
          borderRadius: '8px',
          padding: '4px',
          boxShadow: activeDragItem === item ? '0 0 12px rgba(99, 102, 241, 0.4)' : 'none',
          backgroundColor: activeDragItem === item ? 'rgba(99, 102, 241, 0.05)' : 'rgba(99, 102, 241, 0.02)',
        } : {})
      };
    };

    const getDragProps = (item: 'avatar' | 'details' | 'tags') => {
      if (!isDragActive) return {};
      return {
        onPointerDown: (e: React.PointerEvent) => handlePointerDown(e, item),
        onPointerMove: (e: React.PointerEvent) => handlePointerMove(e, item),
        onPointerUp: (e: React.PointerEvent) => handlePointerUp(e, item),
      };
    };
    
    // Dynamic avatar layout render helper
    const avatarBlock = showAvatar && (
      <div 
        className="shrink-0 flex items-center justify-center animate-none"
        style={{ 
          width: `${avatarSize * m}px`, 
          height: `${avatarSize * m}px`,
          ...getDraggableStyles('avatar')
        }}
        {...getDragProps('avatar')}
      >
        {avatarUrl ? (
          <div
            style={{ 
              width: `${avatarSize * m}px`, 
              height: `${avatarSize * m}px`,
              borderRadius: avatarShape === 'circle' ? '50%' : `${16 * m}px`,
              backgroundImage: `url(${avatarUrl})`,
              backgroundSize: avatarFit === 'cover' ? 'cover' : 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              borderWidth: `${borderThickness}px`
            }}
            className={`border shadow-sm ${
              isCyber ? 'border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)]' : themeStyles.border
            }`}
          />
        ) : (
          <div 
            style={{ 
              width: `${avatarSize * m}px`, 
              height: `${avatarSize * m}px`,
              borderRadius: avatarShape === 'circle' ? '50%' : `${16 * m}px`,
              fontSize: `${avatarSize * 0.35 * m}px`,
              borderWidth: `${borderThickness}px`
            }}
            className={`flex items-center justify-center font-bold bg-slate-900/60 ${
              isCyber ? 'border-cyan-500 text-cyan-400' : themeStyles.text + ' ' + themeStyles.border
            }`}
          >
            {name ? name.trim().charAt(0) : 'D'}
          </div>
        )}
      </div>
    );

    // Unified meta rows generator
    const renderMetadataItems = () => {
      const iconSize = (activePreset === 'og-image' ? 14 : 11) * m;
      return (
        <>
          {location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: `${4 * m}px` }}>
              📍 {location}
            </span>
          )}
          {github && (
            <span style={{ display: 'flex', alignItems: 'center', gap: `${4 * m}px` }}>
              <Github size={iconSize} /> {github}
            </span>
          )}
          {website && (
            <span style={{ display: 'flex', alignItems: 'center', gap: `${4 * m}px` }}>
              <Globe size={iconSize} /> {website}
            </span>
          )}
          {linkedin && (
            <span style={{ display: 'flex', alignItems: 'center', gap: `${4 * m}px` }}>
              <Linkedin size={iconSize} /> {linkedin}
            </span>
          )}
          {twitter && (
            <span style={{ display: 'flex', alignItems: 'center', gap: `${4 * m}px` }}>
              <Twitter size={iconSize} /> {twitter}
            </span>
          )}
          {youtube && (
            <span style={{ display: 'flex', alignItems: 'center', gap: `${4 * m}px` }}>
              <Youtube size={iconSize} /> {youtube}
            </span>
          )}
          {instagram && (
            <span style={{ display: 'flex', alignItems: 'center', gap: `${4 * m}px` }}>
              <Instagram size={iconSize} /> {instagram}
            </span>
          )}
          {discord && (
            <span style={{ display: 'flex', alignItems: 'center', gap: `${4 * m}px` }}>
              <MessageSquare size={iconSize} /> {discord}
            </span>
          )}
          {email && (
            <span style={{ display: 'flex', alignItems: 'center', gap: `${4 * m}px` }}>
              <Mail size={iconSize} /> {email}
            </span>
          )}
        </>
      );
    };

    // Dynamic tags badges array helper
    const tagsRow = tags.length > 0 && (
      <div 
        style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: `${tagGapVal}px`,
          marginTop: 'auto',
          justifyContent: activeTemplate === 'modern-centered' ? 'center' : 'flex-start',
          ...getDraggableStyles('tags')
        }}
        className={isTerminal ? 'font-mono' : ''}
        {...getDragProps('tags')}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: `${tagSizeVal}px`,
              padding: `${tagPadY}px ${tagPadX}px`,
              borderRadius: `${8 * m}px`,
              borderWidth: `${1 * m}px`,
              ...(bgPreset === 'custom' ? { borderColor: customAccentColor + '40', color: customTextColor } : {})
            }}
            className={`font-bold shadow-sm border transition-all ${themeStyles.badgeBg} ${themeStyles.badgeText}`}
          >
            {isTerminal ? `[ ${tag} ]` : tag}
          </span>
        ))}
      </div>
    );

    // 2. RENDER BY SPECIFIC DESIGNER TEMPLATES
    
    if (isTerminal) {
      // Monospaced Dev Terminal Shell Prompt template layout
      return (
        <div 
          style={{ 
            padding: `${32 * m}px`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%'
          }}
          className="font-mono text-green-400 w-full animate-none"
        >
          {/* Top Window Bar */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              borderBottomWidth: `${1 * m}px`, 
              paddingBottom: `${8 * m}px`, 
              marginBottom: `${12 * m}px` 
            }}
            className="border-green-950 select-none w-full"
          >
            <div style={{ display: 'flex', gap: `${6 * m}px`, alignItems: 'center' }}>
              <span style={{ width: `${8 * m}px`, height: `${8 * m}px` }} className="rounded-full bg-rose-500/80" />
              <span style={{ width: `${8 * m}px`, height: `${8 * m}px` }} className="rounded-full bg-amber-500/80" />
              <span style={{ width: `${8 * m}px`, height: `${8 * m}px` }} className="rounded-full bg-green-500/80" />
            </div>
            <span style={{ fontSize: `${9 * m}px` }} className="text-green-600 font-semibold tracking-wider">visitor@dev:~#</span>
          </div>

          <div style={{ display: 'flex', gap: `${gapVal}px`, alignItems: 'flex-start', flex: 1, minHeight: 0 }}>
            {avatarBlock}
            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: `${10 * m}px`, 
                flex: 1, 
                minWidth: 0,
                ...getDraggableStyles('details')
              }}
              {...getDragProps('details')}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${2 * m}px` }}>
                <div style={{ fontSize: `${9 * m}px` }} className="text-green-600 font-black flex items-center gap-1">
                  <span>$</span> whoami
                </div>
                <h2 
                  style={{ fontSize: `${nameFontSize * m}px`, lineHeight: 1.25 }} 
                  className="font-bold text-green-400"
                >
                  {name || 'Developer Name'}
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: `${2 * m}px` }}>
                <div style={{ fontSize: `${9 * m}px` }} className="text-green-600 font-black flex items-center gap-1">
                  <span>$</span> cat role.txt
                </div>
                <p 
                  style={{ fontSize: `${titleFontSize * m}px`, lineHeight: 1.3 }}
                  className="text-green-500 font-semibold"
                >
                  {title || 'Software Engineer'}
                </p>
              </div>

              <div 
                style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  columnGap: `${14 * m}px`, 
                  rowGap: `${4 * m}px`,
                  fontSize: `${metaSize}px`,
                  paddingTop: `${4 * m}px`
                }}
                className="text-green-600/85"
              >
                {renderMetadataItems()}
              </div>
            </div>
          </div>

          {tagsRow}
        </div>
      );
    }

    if (isRetro) {
      // Serif classic editorial/curriculum design template layout
      return (
        <div 
          style={{ 
            padding: `${padVal}px`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            borderWidth: `${4 * m}px`,
            borderStyle: 'double'
          }}
          className="border-slate-350 text-slate-900 animate-none"
        >
          <div 
            style={{ 
              textAlign: 'center', 
              borderBottomWidth: `${1 * m}px`, 
              paddingBottom: `${8 * m}px`, 
              marginBottom: `${16 * m}px` 
            }}
            className="border-slate-300"
          >
            <span style={{ fontSize: `${9 * m}px`, letterSpacing: '0.2em' }} className="font-bold uppercase text-slate-500">C U R R I C U L U M &nbsp; V I T A E</span>
          </div>
          
          <div style={{ display: 'flex', gap: `${gapVal}px`, alignItems: 'flex-start', flex: 1, minHeight: 0 }}>
            {avatarBlock}
            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: `${6 * m}px`, 
                flex: 1, 
                minWidth: 0,
                ...getDraggableStyles('details')
              }}
              {...getDragProps('details')}
            >
              <h2 
                style={{ fontSize: `${nameFontSize * m}px`, lineHeight: 1.25 }} 
                className="font-serif font-black tracking-tight"
              >
                {name || 'Developer Name'}
              </h2>
              <p 
                style={{ fontSize: `${titleFontSize * m}px`, lineHeight: 1.3 }}
                className="font-serif italic font-semibold text-slate-750"
              >
                {title || 'Software Engineer'}
              </p>
              
              <div 
                style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  columnGap: `${14 * m}px`, 
                  rowGap: `${4 * m}px`,
                  fontSize: `${metaSize}px`,
                  paddingTop: `${4 * m}px`
                }}
                className="font-semibold uppercase tracking-wider text-slate-505"
              >
                {renderMetadataItems()}
              </div>
            </div>
          </div>
          {tagsRow}
        </div>
      );
    }

    if (activeTemplate === 'split-hero') {
      // Split Brand side-banner column layout template
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', height: '100%', width: '100%', overflow: 'hidden' }} className="animate-none">
          {/* Left Hero side banner panel */}
          <div 
            style={{ 
              gridColumn: 'span 4 / span 4', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center', 
              padding: `${12 * m}px`,
              gap: `${12 * m}px`,
              borderRightWidth: `${1 * m}px`
            }}
            className="bg-[#e52521] dark:bg-red-950/60 border-slate-800"
          >
            {avatarBlock}
            <div style={{ fontSize: `${8 * m}px`, letterSpacing: '0.15em' }} className="text-center font-mono font-bold uppercase text-red-200 opacity-60">
              dev profile
            </div>
          </div>

          {/* Right developer info panel */}
          <div 
            style={{ 
              gridColumn: 'span 8 / span 8', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between', 
              padding: `${padVal}px`
            }}
            className="bg-slate-950/20 text-slate-50"
          >
            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: `${8 * m}px`, 
                margin: 'auto 0',
                ...getDraggableStyles('details')
              }}
              {...getDragProps('details')}
            >
              <h2 
                style={{ fontSize: `${nameFontSize * m}px`, lineHeight: 1.25 }} 
                className="font-black tracking-tight text-white"
              >
                {name || 'Developer Name'}
              </h2>
              <p 
                style={{ fontSize: `${titleFontSize * m}px`, lineHeight: 1.3 }}
                className="font-bold text-[#d01f1c]"
              >
                {title || 'Software Engineer'}
              </p>
              
              <div 
                style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  columnGap: `${14 * m}px`, 
                  rowGap: `${4 * m}px`,
                  fontSize: `${metaSize}px`
                }}
                className="font-semibold text-slate-400"
              >
                {renderMetadataItems()}
              </div>
            </div>

            {tagsRow}
          </div>
        </div>
      );
    }

    if (activeTemplate === 'modern-centered') {
      // Center badge layout template style
      return (
        <div 
          style={{ 
            padding: `${padVal}px`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '100%',
            textAlign: 'center'
          }}
          className="animate-none"
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: `${10 * m}px`, flex: 1, justifyContent: 'center', minHeight: 0 }}>
            {avatarBlock}
            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: `${6 * m}px`, 
                maxWidth: `${800 * m}px`,
                ...getDraggableStyles('details')
              }}
              {...getDragProps('details')}
            >
              <h2 
                style={{ fontSize: `${nameFontSize * m}px`, lineHeight: 1.25 }} 
                className={`font-extrabold tracking-tight ${themeStyles.text}`}
              >
                {name || 'Developer Name'}
              </h2>
              <p 
                style={{ fontSize: `${titleFontSize * m}px`, lineHeight: 1.3 }}
                className={`font-semibold ${themeStyles.subtext}`}
              >
                {title || 'Software Engineer'}
              </p>
              
              <div 
                style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  justifyContent: 'center',
                  columnGap: `${14 * m}px`, 
                  rowGap: `${4 * m}px`,
                  fontSize: `${metaSize}px`,
                  marginTop: `${4 * m}px`
                }}
                className="font-bold uppercase tracking-wider opacity-80 text-slate-400"
              >
                {renderMetadataItems()}
              </div>
            </div>
          </div>
          {tagsRow}
        </div>
      );
    }

    if (isCyber) {
      // Neon glowing cyberpunk template style layout
      return (
        <div 
          style={{ 
            padding: `${padVal}px`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            position: 'relative',
            borderWidth: `${1 * m}px`
          }}
          className="border-[#e52521]/30 rounded-xl animate-none"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.15),transparent_40%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.12),transparent_40%)]" />
          
          <div style={{ display: 'flex', gap: `${gapVal}px`, alignItems: 'flex-start', position: 'relative', zIndex: 10, flex: 1, minHeight: 0 }}>
            {avatarBlock}
            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: `${6 * m}px`, 
                flex: 1, 
                minWidth: 0,
                ...getDraggableStyles('details')
              }}
              {...getDragProps('details')}
            >
              <h2 
                style={{ fontSize: `${nameFontSize * m}px`, lineHeight: 1.25 }} 
                className="font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-red-300 to-pink-400"
              >
                {name || 'Developer Name'}
              </h2>
              <p 
                style={{ fontSize: `${titleFontSize * m}px`, lineHeight: 1.3 }}
                className="font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)] animate-none"
              >
                {title || 'Software Engineer'}
              </p>
              
              <div 
                style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  columnGap: `${14 * m}px`, 
                  rowGap: `${4 * m}px`,
                  fontSize: `${metaSize}px`
                }}
                className="font-semibold uppercase tracking-wider text-red-300/80"
              >
                {renderMetadataItems()}
              </div>
            </div>
          </div>

          {tagsRow}
        </div>
      );
    }

    if (isGlass) {
      // Frosted Glassmorphism template style layout
      return (
        <div 
          style={{ 
            padding: `${padVal}px`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            position: 'relative',
            borderWidth: `${1 * m}px`
          }}
          className="rounded-xl border-white/10 backdrop-blur-md shadow-2xl animate-none"
        >
          <div style={{ display: 'flex', gap: `${gapVal}px`, alignItems: 'flex-start', position: 'relative', zIndex: 10, flex: 1, minHeight: 0 }}>
            {avatarBlock}
            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: `${6 * m}px`, 
                flex: 1, 
                minWidth: 0,
                ...getDraggableStyles('details')
              }}
              {...getDragProps('details')}
            >
              <h2 
                style={{ fontSize: `${nameFontSize * m}px`, lineHeight: 1.25 }} 
                className="font-extrabold tracking-tight text-white"
              >
                {name || 'Developer Name'}
              </h2>
              <p 
                style={{ fontSize: `${titleFontSize * m}px`, lineHeight: 1.3 }}
                className="font-semibold text-slate-100/90"
              >
                {title || 'Software Engineer'}
              </p>
              
              <div 
                style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  columnGap: `${14 * m}px`, 
                  rowGap: `${4 * m}px`,
                  fontSize: `${metaSize}px`,
                  paddingTop: `${4 * m}px`
                }}
                className="font-semibold text-slate-300"
              >
                {renderMetadataItems()}
              </div>
            </div>
          </div>

          {tagsRow}
        </div>
      );
    }

    if (activeTemplate === 'futuristic-aurora') {
      return (
        <div 
          style={{ 
            padding: `${padVal}px`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            borderWidth: `${1 * m}px`
          }}
          className="border-cyan-500/30 rounded-xl animate-none"
        >
          {/* Aurora line glows */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${2 * m}px`, background: 'linear-gradient(to right, transparent, #22d3ee, transparent)', opacity: 0.8 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(99,102,241,0.02) 100%)', zIndex: 0 }} />
          
          <div style={{ display: 'flex', gap: `${gapVal}px`, alignItems: 'flex-start', position: 'relative', zIndex: 10, flex: 1, minHeight: 0 }}>
            {avatarBlock}
            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: `${6 * m}px`, 
                flex: 1, 
                minWidth: 0,
                ...getDraggableStyles('details')
              }}
              {...getDragProps('details')}
            >
              <h2 
                style={{ fontSize: `${nameFontSize * m}px`, lineHeight: 1.25 }} 
                className="font-black tracking-tight text-cyan-400 font-sans"
              >
                {name || 'Developer Name'}
              </h2>
              <p 
                style={{ fontSize: `${titleFontSize * m}px`, lineHeight: 1.3 }}
                className="font-bold text-slate-100 tracking-wide uppercase"
              >
                {title || 'Software Engineer'}
              </p>
              
              <div 
                style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  columnGap: `${14 * m}px`, 
                  rowGap: `${4 * m}px`,
                  fontSize: `${metaSize}px`,
                  paddingTop: `${4 * m}px`
                }}
                className="font-semibold text-slate-400"
              >
                {renderMetadataItems()}
              </div>
            </div>
          </div>

          {tagsRow}
        </div>
      );
    }

    if (activeTemplate === 'minimalist-dark') {
      return (
        <div 
          style={{ 
            padding: `${padVal}px`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%'
          }}
          className="bg-neutral-950 text-neutral-50 animate-none"
        >
          <div style={{ display: 'flex', gap: `${gapVal}px`, alignItems: 'flex-start', flex: 1, minHeight: 0 }}>
            {avatarBlock}
            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: `${6 * m}px`, 
                flex: 1, 
                minWidth: 0,
                ...getDraggableStyles('details')
              }}
              {...getDragProps('details')}
            >
              <h2 
                style={{ fontSize: `${nameFontSize * m}px`, lineHeight: 1.2, fontWeight: 800 }} 
                className="tracking-tight text-neutral-50"
              >
                {name || 'Developer Name'}
              </h2>
              <p 
                style={{ fontSize: `${titleFontSize * m}px`, lineHeight: 1.3 }}
                className="font-medium text-neutral-400"
              >
                {title || 'Software Engineer'}
              </p>
              
              <div 
                style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  columnGap: `${14 * m}px`, 
                  rowGap: `${4 * m}px`,
                  fontSize: `${metaSize}px`,
                  paddingTop: `${4 * m}px`
                }}
                className="font-medium text-neutral-500"
              >
                {renderMetadataItems()}
              </div>
            </div>
          </div>

          {tagsRow}
        </div>
      );
    }

    if (activeTemplate === 'gradient-mesh') {
      return (
        <div 
          style={{ 
            padding: `${padVal}px`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            position: 'relative',
            overflow: 'hidden'
          }}
          className="animate-none"
        >
          {/* Fluid mesh gradient blobs */}
          <div style={{ position: 'absolute', top: `-${50 * m}px`, right: `-${50 * m}px`, width: `${300 * m}px`, height: `${300 * m}px`, background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }} />
          <div style={{ position: 'absolute', bottom: `-${80 * m}px`, left: `-${40 * m}px`, width: `${350 * m}px`, height: `${350 * m}px`, background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)', filter: 'blur(50px)', zIndex: 0 }} />
          <div style={{ position: 'absolute', top: '35%', left: '40%', width: `${250 * m}px`, height: `${250 * m}px`, background: 'radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%)', filter: 'blur(45px)', zIndex: 0 }} />
          
          <div style={{ display: 'flex', gap: `${gapVal}px`, alignItems: 'flex-start', position: 'relative', zIndex: 10, flex: 1, minHeight: 0 }}>
            {avatarBlock}
            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: `${6 * m}px`, 
                flex: 1, 
                minWidth: 0,
                ...getDraggableStyles('details')
              }}
              {...getDragProps('details')}
            >
              <h2 
                style={{ fontSize: `${nameFontSize * m}px`, lineHeight: 1.25 }} 
                className="font-extrabold tracking-tight text-white"
              >
                {name || 'Developer Name'}
              </h2>
              <p 
                style={{ fontSize: `${titleFontSize * m}px`, lineHeight: 1.3 }}
                className="font-semibold text-red-200"
              >
                {title || 'Software Engineer'}
              </p>
              
              <div 
                style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  columnGap: `${14 * m}px`, 
                  rowGap: `${4 * m}px`,
                  fontSize: `${metaSize}px`,
                  paddingTop: `${4 * m}px`
                }}
                className="font-semibold text-slate-300"
              >
                {renderMetadataItems()}
              </div>
            </div>
          </div>

          {tagsRow}
        </div>
      );
    }

    // Default: 'minimal-asymmetric'
    return (
      <div 
        style={{ 
          padding: `${padVal}px`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%'
        }}
        className="animate-none"
      >
        <div style={{ display: 'flex', gap: `${gapVal}px`, alignItems: 'flex-start', flex: 1, minHeight: 0 }}>
          {avatarBlock}
          <div 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: `${6 * m}px`, 
              flex: 1, 
              minWidth: 0,
              ...getDraggableStyles('details')
            }}
            {...getDragProps('details')}
          >
            <h2 
              style={{ fontSize: `${nameFontSize * m}px`, lineHeight: 1.25 }} 
              className={`font-extrabold tracking-tight ${themeStyles.text}`}
            >
              {name || 'Developer Name'}
            </h2>
            <p 
              style={{ fontSize: `${titleFontSize * m}px`, lineHeight: 1.3 }}
              className={`font-semibold ${themeStyles.subtext}`}
            >
              {title || 'Software Engineer'}
            </p>
            
            <div 
              style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                columnGap: `${14 * m}px`, 
                rowGap: `${4 * m}px`,
                fontSize: `${metaSize}px`,
                paddingTop: `${4 * m}px`
              }}
              className="font-bold uppercase tracking-wider opacity-85 text-slate-450"
            >
              {renderMetadataItems()}
            </div>
          </div>
        </div>

        {tagsRow}
      </div>
    );
  };

  return (
    <div className="w-full text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Dynamic Font Loader */}
      <link 
        href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600;700&family=Inter:wght@400;600;800&family=Playfair+Display:ital,wght@0,600;0,800;1,600&family=Plus+Jakarta+Sans:wght@400;600;800&family=Syne:wght@700;800&display=swap" 
        rel="stylesheet" 
      />

      {/* Hidden Container for HD Export (No Scale/Zoom Transforms) */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', overflow: 'hidden' }}>
        <div 
          ref={exportCardRef}
          style={cardStyleHelper(true)}
          className="flex flex-col relative overflow-hidden"
        >
          {/* Glowing backdrops for glassmorphism layout */}
          {activeTemplate === 'glassmorphism' && (
            <>
              <div 
                style={{ 
                  position: 'absolute', 
                  top: `${30 * 3}px`, 
                  left: `${30 * 3}px`, 
                  width: `${280 * 3}px`, 
                  height: `${280 * 3}px` 
                }} 
                className="rounded-full bg-[#e52521]/30 blur-3xl animate-none" 
              />
              <div 
                style={{ 
                  position: 'absolute', 
                  bottom: `${30 * 3}px`, 
                  right: `${30 * 3}px`, 
                  width: `${280 * 3}px`, 
                  height: `${280 * 3}px` 
                }} 
                className="rounded-full bg-emerald-500/20 blur-3xl animate-none" 
              />
            </>
          )}
          {renderCardContent(true)}
        </div>
      </div>

      {/* Top Header */}
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
            <div className="flex flex-col sm:flex-row sm:items-end justify-between w-full gap-4">
              <div className="space-y-2">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight font-heading">
                  Developer Card Studio
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-normal leading-relaxed max-w-3xl">
                  Build high-resolution profile banners, OG tags, and digital cards with Canva-style custom templates. Adjust styling configurations and download in ultra-sharp 3x HD.
                </p>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 border border-rose-200/50 hover:bg-rose-500/10 text-rose-500 text-xs px-3.5 py-2 rounded-lg font-bold uppercase transition-colors shrink-0 cursor-pointer"
              >
                <RefreshCw size={12} />
                Reset Layout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="w-full px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
          
          {/* Left Column Controls */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
              
              {/* Tab Navigation */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                {(['template', 'content', 'styling', 'settings'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 text-center py-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
                      activeTab === tab
                        ? 'border-[#e52521] text-[#e52521] dark:text-[#d01f1c] bg-white dark:bg-slate-900'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-350 hover:bg-slate-100/40 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {tab === 'template' ? 'Layouts' : tab}
                  </button>
                ))}
              </div>

              <div className="p-6 space-y-6">
                
                {/* 1. LAYOUTS TAB */}
                {activeTab === 'template' && (
                  <div className="space-y-5">
                    
                    {/* Presets */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                        <Layout size={14} className="text-[#e52521]" />
                        Canvas Dimensions Presets
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['og-image', 'github-banner', 'business-card', 'linkedin-banner', 'twitter-header', 'youtube-banner', 'instagram-post'] as PresetType[]).map((preset) => (
                          <button
                            key={preset}
                            onClick={() => setActivePreset(preset)}
                            className={`text-xs py-2.5 px-2 rounded-lg border font-semibold transition-all cursor-pointer text-center ${
                              activePreset === preset
                                ? 'border-[#e52521] bg-red-50 dark:bg-red-950/30 text-[#e52521] dark:text-[#d01f1c] font-bold shadow-sm'
                                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-slate-350 text-slate-650 dark:text-slate-400'
                            }`}
                          >
                            <span className="block text-[11px] font-bold">
                              {preset === 'og-image' && 'OG Image'}
                              {preset === 'github-banner' && 'GitHub Banner'}
                              {preset === 'business-card' && 'Dev Card'}
                              {preset === 'linkedin-banner' && 'LinkedIn Cover'}
                              {preset === 'twitter-header' && 'Twitter/X Header'}
                              {preset === 'youtube-banner' && 'YouTube Banner'}
                              {preset === 'instagram-post' && 'Instagram Post'}
                            </span>
                            <span className="block text-[9px] text-slate-450 dark:text-slate-500 font-normal mt-0.5">
                              {preset === 'og-image' && '1200 x 630 px'}
                              {preset === 'github-banner' && '800 x 300 px'}
                              {preset === 'business-card' && '600 x 350 px'}
                              {preset === 'linkedin-banner' && '1584 x 396 px'}
                              {preset === 'twitter-header' && '1500 x 500 px'}
                              {preset === 'youtube-banner' && '2048 x 1152 px'}
                              {preset === 'instagram-post' && '1080 x 1080 px'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Styles List */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                        <Palette size={14} className="text-[#e52521]" />
                        Canva Designer Templates
                      </label>
                      
                      <div className="grid grid-cols-1 gap-2.5">
                        {(['minimal-asymmetric', 'modern-centered', 'split-hero', 'neon-cyberpunk', 'technical-console', 'retro-vintage', 'glassmorphism', 'futuristic-aurora', 'minimalist-dark', 'gradient-mesh'] as TemplateType[]).map((temp) => (
                          <button
                            key={temp}
                            onClick={() => setActiveTemplate(temp)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-all cursor-pointer ${
                              activeTemplate === temp
                                ? 'border-[#e52521] bg-red-50/50 dark:bg-red-950/20 text-[#e52521] dark:text-[#d01f1c] font-bold shadow-sm'
                                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/50 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div>
                              <div className="text-xs font-bold capitalize">{temp.replace('-', ' ')}</div>
                              <span className="text-[10px] text-slate-450 dark:text-slate-500 block font-normal mt-0.5">
                                {temp === 'minimal-asymmetric' && 'Clean layout with avatar left, tags at the bottom.'}
                                {temp === 'modern-centered' && 'Symmetrical centered layout for profile badges.'}
                                {temp === 'split-hero' && 'Split layout featuring a bold side brand accent.'}
                                {temp === 'neon-cyberpunk' && 'Glowing gradients, shadows, and text highlights.'}
                                {temp === 'technical-console' && 'Terminal command line emulator format in green.'}
                                {temp === 'retro-vintage' && 'Warm editorial background with serif typography.'}
                                {temp === 'glassmorphism' && 'Frosted glass floating over abstract colored backdrops.'}
                                {temp === 'futuristic-aurora' && 'Futuristic aurora glow backdrop with modern typography.'}
                                {temp === 'minimalist-dark' && 'Ultra clean stark dark design focusing strictly on text layout.'}
                                {temp === 'gradient-mesh' && 'Lush intersecting color blobs in soft organic mesh movement.'}
                              </span>
                            </div>
                            <span className="text-xs">
                              {temp === 'neon-cyberpunk' && '⚡'}
                              {temp === 'technical-console' && '💻'}
                              {temp === 'retro-vintage' && '🖋️'}
                              {temp === 'glassmorphism' && '🔮'}
                              {temp === 'split-hero' && '📊'}
                              {temp === 'modern-centered' && '🎯'}
                              {temp === 'minimal-asymmetric' && '✨'}
                              {temp === 'futuristic-aurora' && '🌌'}
                              {temp === 'minimalist-dark' && '🖤'}
                              {temp === 'gradient-mesh' && '🎨'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. CONTENT TAB */}
                {activeTab === 'content' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Developer Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#e52521] focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Job Title / Tagline</label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#e52521] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Location</label>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. Kathmandu, Nepal"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#e52521] focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">GitHub Profile</label>
                        <input
                          type="text"
                          value={github}
                          onChange={(e) => setGithub(e.target.value)}
                          placeholder="Username"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#e52521] focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Website URL</label>
                        <input
                          type="text"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="domain.com"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#e52521] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Social Media Link Inputs */}
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                        <Globe size={14} className="text-[#e52521]" />
                        Official Social Links
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">LinkedIn Username</label>
                          <input
                            type="text"
                            value={linkedin}
                            onChange={(e) => setLinkedin(e.target.value)}
                            placeholder="e.g. bishalkumarmishra"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#e52521] focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Twitter / X Username</label>
                          <input
                            type="text"
                            value={twitter}
                            onChange={(e) => setTwitter(e.target.value)}
                            placeholder="e.g. BishalMishra"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#e52521] focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">YouTube handle</label>
                          <input
                            type="text"
                            value={youtube}
                            onChange={(e) => setYoutube(e.target.value)}
                            placeholder="e.g. @bishalcodes"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#e52521] focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Instagram Username</label>
                          <input
                            type="text"
                            value={instagram}
                            onChange={(e) => setInstagram(e.target.value)}
                            placeholder="e.g. bishalmishra"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#e52521] focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Discord Username</label>
                          <input
                            type="text"
                            value={discord}
                            onChange={(e) => setDiscord(e.target.value)}
                            placeholder="e.g. bishal#1234"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#e52521] focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Email Address</label>
                          <input
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. bishal@domain.com"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#e52521] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tag badging setup */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                        <FileCode size={14} className="text-[#e52521]" />
                        Tech Tags ({tags.length}/8)
                      </label>
                      <form onSubmit={handleAddTag} className="flex gap-2">
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="e.g. Docker, Rust..."
                          maxLength={15}
                          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#e52521] focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="px-3 bg-slate-900 hover:bg-slate-800 dark:bg-[#e52521] dark:hover:bg-[#d01f1c] text-white font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center"
                        >
                          <Plus size={15} />
                        </button>
                      </form>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {tags.map((tag) => (
                          <span 
                            key={tag}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-400"
                          >
                            {tag}
                            <button 
                              type="button" 
                              onClick={() => handleRemoveTag(tag)}
                              className="text-slate-450 hover:text-rose-500 font-black cursor-pointer"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* 3. STYLING TAB */}
                {activeTab === 'styling' && (
                  <div className="space-y-5">
                    
                    {/* Font Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                        <Type size={14} className="text-[#e52521]" />
                        Select Font Styling
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['inter', 'playfair', 'fira-code', 'jakarta', 'syne'] as FontType[]).map((font) => (
                          <button
                            key={font}
                            onClick={() => setActiveFont(font)}
                            className={`text-xs py-2 px-1.5 rounded-lg border font-semibold capitalize transition-all cursor-pointer ${
                              activeFont === font
                                ? 'border-[#e52521] bg-red-50 dark:bg-red-950/30 text-[#e52521] dark:text-[#d01f1c] font-bold'
                                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-slate-350 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {font === 'fira-code' ? 'Fira Code (Mono)' : font === 'playfair' ? 'Playfair (Serif)' : font}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Gradient backdrop selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                        <Palette size={14} className="text-[#e52521]" />
                        Background Presets
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-2">
                        {(['midnight-glow', 'ocean-mist', 'sunset-rise', 'forest-moss', 'slate', 'cream', 'glass', 'custom'] as BackgroundPresetType[]).map((preset) => (
                          <button
                            key={preset}
                            onClick={() => setBgPreset(preset)}
                            className={`text-xs py-2 px-1 rounded-lg border font-semibold transition-all cursor-pointer capitalize ${
                              bgPreset === preset
                                ? 'border-[#e52521] bg-red-50 dark:bg-red-950/30 text-[#e52521] dark:text-[#d01f1c] font-bold'
                                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-slate-350 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {preset.replace('-', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Picker Fields */}
                    {bgPreset === 'custom' && (
                      <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-slate-400 block">Background</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="color"
                              value={customBgColor}
                              onChange={(e) => setCustomBgColor(e.target.value)}
                              className="w-7 h-7 rounded cursor-pointer border border-slate-200"
                            />
                            <span className="text-[10px] font-mono">{customBgColor}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-slate-400 block">Text</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="color"
                              value={customTextColor}
                              onChange={(e) => setCustomTextColor(e.target.value)}
                              className="w-7 h-7 rounded cursor-pointer border border-slate-200"
                            />
                            <span className="text-[10px] font-mono">{customTextColor}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-slate-400 block">Accent</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="color"
                              value={customAccentColor}
                              onChange={(e) => setCustomAccentColor(e.target.value)}
                              className="w-7 h-7 rounded cursor-pointer border border-slate-200"
                            />
                            <span className="text-[10px] font-mono">{customAccentColor}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Font sizes sliders */}
                    <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                        <Sliders size={14} className="text-[#e52521]" />
                        Font Sizes
                      </label>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                          <span>Name Font Size</span>
                          <span>{nameFontSize}px</span>
                        </div>
                        <input
                          type="range"
                          min={24}
                          max={72}
                          value={nameFontSize}
                          onChange={(e) => setNameFontSize(Number(e.target.value))}
                          className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                          <span>Title Font Size</span>
                          <span>{titleFontSize}px</span>
                        </div>
                        <input
                          type="range"
                          min={14}
                          max={36}
                          value={titleFontSize}
                          onChange={(e) => setTitleFontSize(Number(e.target.value))}
                          className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>
                    </div>

                  </div>
                )}

                {/* 4. SETTINGS TAB */}
                {activeTab === 'settings' && (
                  <div className="space-y-5">
                    
                    {/* Avatar Display */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                          <User size={14} className="text-[#e52521]" />
                          Display Avatar Image
                        </label>
                        <input
                          type="checkbox"
                          checked={showAvatar}
                          onChange={(e) => setShowAvatar(e.target.checked)}
                          className="w-4 h-4 text-[#e52521] bg-slate-100 border-slate-350 rounded focus:ring-[#e52521] cursor-pointer"
                        />
                      </div>

                      {showAvatar && (
                        <div className="space-y-4 pl-3 border-l-2 border-[#e52521]/20">
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Shape</span>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => setAvatarShape('circle')}
                                  className={`text-[10px] px-3 py-1 rounded-md border font-semibold cursor-pointer transition-all ${
                                    avatarShape === 'circle' ? 'border-[#e52521] bg-red-50 dark:bg-indigo-950/20 text-[#e52521] dark:text-[#d01f1c]' : 'border-slate-200 dark:border-slate-800 text-slate-500'
                                  }`}
                                >
                                  Circle
                                </button>
                                <button
                                  onClick={() => setAvatarShape('rounded')}
                                  className={`text-[10px] px-3 py-1 rounded-md border font-semibold cursor-pointer transition-all ${
                                    avatarShape === 'rounded' ? 'border-[#e52521] bg-red-50 dark:bg-indigo-950/20 text-[#e52521] dark:text-[#d01f1c]' : 'border-slate-200 dark:border-slate-800 text-slate-500'
                                  }`}
                                >
                                  Square
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fit Sizing</span>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => setAvatarFit('cover')}
                                  className={`text-[10px] px-3 py-1 rounded-md border font-semibold cursor-pointer transition-all ${
                                    avatarFit === 'cover' ? 'border-[#e52521] bg-red-50 dark:bg-indigo-950/20 text-[#e52521] dark:text-[#d01f1c]' : 'border-slate-200 dark:border-slate-800 text-slate-500'
                                  }`}
                                >
                                  Crop
                                </button>
                                <button
                                  onClick={() => setAvatarFit('contain')}
                                  className={`text-[10px] px-3 py-1 rounded-md border font-semibold cursor-pointer transition-all ${
                                    avatarFit === 'contain' ? 'border-[#e52521] bg-red-50 dark:bg-indigo-950/20 text-[#e52521] dark:text-[#d01f1c]' : 'border-slate-200 dark:border-slate-800 text-slate-500'
                                  }`}
                                >
                                  Fit
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                              <span>Avatar Size</span>
                              <span>{avatarSize}px</span>
                            </div>
                            <input
                              type="range"
                              min={80}
                              max={180}
                              value={avatarSize}
                              onChange={(e) => setAvatarSize(Number(e.target.value))}
                              className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Upload File</span>
                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs font-semibold cursor-pointer">
                              <ImageIcon size={13} />
                              Choose Local Photo
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                className="hidden"
                              />
                            </label>
                          </div>

                        </div>
                      )}
                    </div>

                    {/* Card border layout options */}
                    <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                        <SettingsIcon size={14} className="text-[#e52521]" />
                        Card Border Sizing
                      </label>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                          <span>Border Corner Rounding</span>
                          <span>{cardRounding}px</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={32}
                          value={cardRounding}
                          onChange={(e) => setCardRounding(Number(e.target.value))}
                          className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>
                    </div>

                    {/* Visual Editor (Drag & Drop) */}
                    <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                          <Pencil size={14} className="text-[#e52521]" />
                          Visual Layout Editor
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsDragModeEnabled(!isDragModeEnabled)}
                          className={`text-xs px-3 py-1.5 rounded-full font-bold cursor-pointer transition-all border ${
                            isDragModeEnabled
                              ? 'bg-[#e52521] border-indigo-650 text-white shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-100 dark:text-slate-400'
                          }`}
                        >
                          {isDragModeEnabled ? 'Edit Mode: ON' : 'Edit Mode: OFF'}
                        </button>
                      </div>
                      
                      <div className="text-[10px] text-slate-450 dark:text-slate-500 italic pl-5 leading-normal">
                        {isDragModeEnabled 
                          ? '👉 Click and drag the Avatar, Text details, or Tags block in the preview window to visually position them.' 
                          : 'Toggle layout editing mode on to position card elements visually.'
                        }
                      </div>

                      {(avatarOffset.x !== 0 || avatarOffset.y !== 0 || detailsOffset.x !== 0 || detailsOffset.y !== 0 || tagsOffset.x !== 0 || tagsOffset.y !== 0) && (
                        <div className="pl-5 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setAvatarOffset({ x: 0, y: 0 });
                              setDetailsOffset({ x: 0, y: 0 });
                              setTagsOffset({ x: 0, y: 0 });
                            }}
                            className="text-[10px] font-bold text-rose-500 dark:text-rose-455 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                          >
                            🔄 Reset Elements Positioning
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                )}

              </div>

            </div>
          </div>

          {/* Right Column Preview */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            
            {/* Live Preview Studio block */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between overflow-hidden min-h-[450px]">
              
              <div className="p-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between mb-6 rounded-lg">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Preview Card</span>
                <span className="text-[10px] font-semibold text-slate-400 capitalize">
                  {activeTemplate.replace('-', ' ')} preset ({activePreset === 'og-image' ? '1200 x 630 px' : activePreset === 'github-banner' ? '800 x 300 px' : '600 x 350 px'})
                </span>
              </div>

              {/* Scalable Container */}
              <div 
                ref={containerRef}
                className="flex-1 flex items-center justify-center relative overflow-hidden bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/60 p-4 min-h-[280px]"
              >
                <div 
                  ref={cardRef}
                  id="dev-card-canvas"
                  style={cardStyleHelper(false)}
                  className="absolute shrink-0 flex flex-col relative border-2 transition-all duration-300 overflow-hidden"
                >
                  {/* Glowing backdrops for glassmorphism layout */}
                  {activeTemplate === 'glassmorphism' && (
                    <>
                      <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-[#e52521]/30 blur-3xl" />
                      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl" />
                    </>
                  )}
                  {renderCardContent()}
                </div>
              </div>

              {/* Export Panel */}
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                
                {/* PNG Download */}
                <button
                  onClick={handleDownloadPng}
                  disabled={exporting}
                  className="bg-[#e52521] hover:bg-[#d01f1c] disabled:bg-indigo-400 text-white px-5 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase shadow-sm cursor-pointer transition-colors flex items-center justify-center gap-2 animate-none"
                >
                  {exporting ? (
                    <>Creating HD Canvas...</>
                  ) : (
                    <>
                      <Download size={14} />
                      Download 3X HD PNG
                    </>
                  )}
                </button>

                {/* Copy markup codes buttons */}
                <div className="flex items-center gap-2 justify-center sm:justify-end">
                  
                  <button
                    onClick={() => handleCopyText('svg')}
                    className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-lg cursor-pointer flex items-center gap-1.5"
                  >
                    {copiedText === 'svg' ? (
                      <>
                        <Check size={13} className="text-green-500" />
                        Copied SVG!
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        Copy SVG Markup
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleCopyText('react')}
                    className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-lg cursor-pointer flex items-center gap-1.5"
                  >
                    {copiedText === 'react' ? (
                      <>
                        <Check size={13} className="text-green-500" />
                        Copied React!
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        Copy React Code
                      </>
                    )}
                  </button>

                </div>

              </div>

            </div>
          </div>

        </div>
      </div>

      <SeoGuideSection toolId="dev-card-studio" />

    </div>
  );
};

export default DeveloperCardStudio;
