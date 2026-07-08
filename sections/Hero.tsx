import React, { useState, useEffect, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
// @ts-ignore
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useNavigation } from '../context/NavigationContext';
import { uploadToCloudinary } from '../services/cloudinary';

const defaultSlides = [
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1920',
  'https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=1920',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1920',
  'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=1920',
  'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?q=80&w=1920',
];

interface HeroSlide {
  imageUrl: string;
  title: string;
  subtitle: string;
  description: string;
  primaryBtnText: string;
  primaryBtnLink: string;
  primaryBtnColor: string;
  secondaryBtnText: string;
  secondaryBtnLink: string;
  secondaryBtnColor: string;
  titleColor?: string;
  subtitleColor?: string;
  descriptionColor?: string;
  mobileImageUrl?: string;
  titleSizeMobile?: number;
  titleSizeDesktop?: number;
  subtitleSizeMobile?: number;
  subtitleSizeDesktop?: number;
  descSizeMobile?: number;
  descSizeDesktop?: number;
}

const buildDefaultSlide = (slide: string, index: number): HeroSlide => ({
  imageUrl: slide,
  title: index === 0 ? "Hey, I'm Bishal Mishra" : `Project Focus #${index + 1}`,
  subtitle: index === 0 ? 'Full-Stack Developer & Web Architect' : `What I love building`,
  description:
    index === 0
      ? "I write code, design interfaces, and ship products that actually work. Not just pretty templates — real, fast, production-ready web apps."
      : 'Clean code, real results. Every project is built to solve an actual problem.',
  primaryBtnText: 'See My Work',
  primaryBtnLink: 'projects',
  primaryBtnColor: '#111827',
  secondaryBtnText: "Let's Talk",
  secondaryBtnLink: 'contact',
  secondaryBtnColor: 'transparent',
  titleColor: '#ffffff',
  subtitleColor: '#d1d5db',
  descriptionColor: '#e5e7eb',
  mobileImageUrl: slide,
  titleSizeMobile: 2.1,
  titleSizeDesktop: 4.25,
  subtitleSizeMobile: 1.05,
  subtitleSizeDesktop: 1.35,
  descSizeMobile: 0.9,
  descSizeDesktop: 1.05,
});

// Typing animation hook
const useTyping = (words: string[], speed = 80, pause = 2000) => {
  const [display, setDisplay] = useState('');
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const currentWord = words[wordIdx];

    if (!deleting && charIdx < currentWord.length) {
      timer = setTimeout(() => {
        setDisplay(prev => prev + currentWord[charIdx]);
        setCharIdx(prev => prev + 1);
      }, speed);
    } else if (deleting && charIdx > 0) {
      timer = setTimeout(() => {
        setDisplay(prev => prev.slice(0, -1));
        setCharIdx(prev => prev - 1);
      }, speed / 2);
    } else if (!deleting && charIdx === currentWord.length) {
      timer = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx === 0) {
      setDeleting(false);
      setWordIdx(prev => (prev + 1) % words.length);
    }

    return () => clearTimeout(timer);
  }, [charIdx, deleting, wordIdx, words, speed, pause]);

  return display;
};

const Hero: React.FC = () => {
  const { navigate } = useNavigation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);

  const defaultMappedSlides: HeroSlide[] = defaultSlides.map(buildDefaultSlide);

  const [heroData, setHeroData] = useState<{
    title: string;
    subtitle: string;
    description: string;
    slides: HeroSlide[];
    stats: { num: string; label: string; }[];
    sliderHeightMobile?: number;
    sliderHeightDesktop?: number;
  }>({
    title: "Hey, I'm Bishal Mishra",
    subtitle: 'Full-Stack Developer & Web Architect',
    description:
      "I write code, design interfaces, and ship products that actually work. Not just pretty templates — real, fast, production-ready web apps.",
    slides: defaultMappedSlides,
    stats: [
      { num: '30+', label: 'Projects shipped' },
      { num: '3+', label: 'Years coding' },
      { num: '100%', label: 'Client satisfaction' },
    ],
    sliderHeightMobile: 50,
    sliderHeightDesktop: 100,
  });

  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'hero'));
        if (snap.exists()) {
          const data = snap.data();
          const rawSlides =
            data.slides && data.slides.length > 0 ? data.slides : defaultSlides;

          const mappedSlides = rawSlides.map((slide: any, index: number) => {
            const globalTitle = data.title || "Hey, I'm Bishal Mishra";
            const globalSubtitle =
              data.subtitle || 'Full-Stack Developer & Web Architect';
            const globalDesc =
              data.description ||
              "I write code, design interfaces, and ship products that actually work.";

            if (typeof slide === 'string') return buildDefaultSlide(slide, index);

            return {
              imageUrl: slide.imageUrl || '',
              title: slide.title || globalTitle,
              subtitle: slide.subtitle || globalSubtitle,
              description: slide.description || globalDesc,
              primaryBtnText: slide.primaryBtnText || 'See My Work',
              primaryBtnLink: slide.primaryBtnLink || 'projects',
              primaryBtnColor: slide.primaryBtnColor || '#111827',
              secondaryBtnText: slide.secondaryBtnText || "Let's Talk",
              secondaryBtnLink: slide.secondaryBtnLink || 'contact',
              secondaryBtnColor: slide.secondaryBtnColor || 'transparent',
              titleColor: slide.titleColor || '#ffffff',
              subtitleColor: slide.subtitleColor || '#d1d5db',
              descriptionColor: slide.descriptionColor || '#e5e7eb',
              mobileImageUrl: slide.mobileImageUrl || slide.imageUrl || '',
              titleSizeMobile:
                slide.titleSizeMobile !== undefined ? Number(slide.titleSizeMobile) : 2.1,
              titleSizeDesktop:
                slide.titleSizeDesktop !== undefined ? Number(slide.titleSizeDesktop) : 4.25,
              subtitleSizeMobile:
                slide.subtitleSizeMobile !== undefined ? Number(slide.subtitleSizeMobile) : 1.05,
              subtitleSizeDesktop:
                slide.subtitleSizeDesktop !== undefined ? Number(slide.subtitleSizeDesktop) : 1.35,
              descSizeMobile:
                slide.descSizeMobile !== undefined ? Number(slide.descSizeMobile) : 0.9,
              descSizeDesktop:
                slide.descSizeDesktop !== undefined ? Number(slide.descSizeDesktop) : 1.05,
            };
          });

          setHeroData({
            title: data.title || "Hey, I'm Bishal Mishra",
            subtitle: data.subtitle || 'Full-Stack Developer & Web Architect',
            description:
              data.description ||
              "I write code, design interfaces, and ship products that actually work.",
            slides: mappedSlides,
            stats: data.stats && data.stats.length > 0 ? data.stats : [
              { num: '30+', label: 'Projects shipped' },
              { num: '3+', label: 'Years coding' },
              { num: '100%', label: 'Client satisfaction' },
            ],
            sliderHeightMobile:
              data.sliderHeightMobile !== undefined ? Number(data.sliderHeightMobile) : 50,
            sliderHeightDesktop:
              data.sliderHeightDesktop !== undefined ? Number(data.sliderHeightDesktop) : 100,
          });
        }
      } catch (err) {
        console.warn('Error fetching hero settings:', err);
      }
    };
    fetchHeroData();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkMode = () => {
      setIsEditMode(localStorage.getItem('liveEditMode') === 'true');
    };
    checkMode();
    window.addEventListener('liveEditToggle', checkMode);
    return () => window.removeEventListener('liveEditToggle', checkMode);
  }, []);

  const handleSlideSave = async (field: 'title' | 'description' | 'primaryBtnText' | 'secondaryBtnText' | 'subtitle', value: string) => {
    window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saving' }));
    const updatedSlides = [...heroData.slides];
    if (updatedSlides[currentSlide]) {
      updatedSlides[currentSlide] = {
        ...updatedSlides[currentSlide],
        [field]: value
      };
    }
    
    setHeroData(prev => ({
      ...prev,
      slides: updatedSlides
    }));

    try {
      await updateDoc(doc(db, 'settings', 'hero'), {
        slides: updatedSlides
      });
      window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saved' }));
    } catch (err) {
      console.error("Error updating slide in firestore:", err);
    }
  };

  const handleStatSave = async (index: number, key: 'num' | 'label', value: string) => {
    window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saving' }));
    const updatedStats = [...heroData.stats];
    if (updatedStats[index]) {
      updatedStats[index] = {
        ...updatedStats[index],
        [key]: value
      };
    }
    
    setHeroData(prev => ({
      ...prev,
      stats: updatedStats
    }));

    try {
      await updateDoc(doc(db, 'settings', 'hero'), {
        stats: updatedStats
      });
      window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saved' }));
    } catch (err) {
      console.error("Error updating stat in firestore:", err);
    }
  };

  // Auto-play (freezes in visual edit mode for user editing)
  useEffect(() => {
    const count = heroData.slides.length;
    if (count <= 1 || isEditMode) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % count);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroData.slides, isEditMode]);

  const goToPrev = useCallback(() => {
    setCurrentSlide(prev => (prev - 1 + heroData.slides.length) % heroData.slides.length);
  }, [heroData.slides.length]);

  const goToNext = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % heroData.slides.length);
  }, [heroData.slides.length]);

  const activeSlide = heroData.slides[currentSlide] || heroData.slides[0];

  // Typing words for the subtitle area (played only when NOT editing)
  const typedText = useTyping(
    ['Full-Stack Developer', 'Web Architect', 'UI/UX Thinker', 'Problem Solver'],
    75,
    2200
  );

  return (
    <>
      <style>{`
        #hero-section {
          height: ${heroData.sliderHeightMobile ?? 50}vh;
          min-height: 480px;
        }
        @media (min-width: 768px) {
          #hero-section {
            height: ${heroData.sliderHeightDesktop ?? 100}vh;
            min-height: 620px;
          }
        }
        #hero-title {
          font-size: ${activeSlide?.titleSizeMobile ?? 2.1}rem;
          color: ${activeSlide?.titleColor ?? '#ffffff'};
          line-height: 1.08;
        }
        #hero-typed {
          font-size: ${activeSlide?.subtitleSizeMobile ?? 1.05}rem;
          color: ${activeSlide?.subtitleColor ?? '#d1d5db'};
        }
        #hero-desc {
          font-size: ${activeSlide?.descSizeMobile ?? 0.9}rem;
          color: ${activeSlide?.descriptionColor ?? '#e5e7eb'};
        }
        @media (min-width: 768px) {
          #hero-title {
            font-size: ${activeSlide?.titleSizeDesktop ?? 4.25}rem;
          }
          #hero-typed {
            font-size: ${activeSlide?.subtitleSizeDesktop ?? 1.35}rem;
          }
          #hero-desc {
            font-size: ${activeSlide?.descSizeDesktop ?? 1.05}rem;
          }
        }
        .hero-btn-primary {
          background: #f9fafb;
          color: #111827;
          border: none;
          transition: background 0.2s, transform 0.15s;
        }
        .hero-btn-primary:hover {
          background: #ffffff;
          transform: translateY(-1px);
        }
        .hero-btn-secondary {
          background: rgba(255,255,255,0.08);
          color: #f9fafb;
          border: 1px solid rgba(255,255,255,0.2);
          backdrop-filter: blur(6px);
          transition: background 0.2s, transform 0.15s;
        }
        .hero-btn-secondary:hover {
          background: rgba(255,255,255,0.15);
          transform: translateY(-1px);
        }
        .slide-dot {
          transition: width 0.3s, background 0.3s;
        }
        .cursor-blink {
          display: inline-block;
          width: 2px;
          height: 1em;
          background: currentColor;
          margin-left: 2px;
          vertical-align: text-bottom;
          animation: blink 1s step-end infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .hero-stat {
          border-right: 1px solid rgba(255,255,255,0.12);
          padding-right: 1.5rem;
        }
        .hero-stat:last-child {
          border-right: none;
          padding-right: 0;
        }
      `}</style>

      <section
        id="hero-section"
        className="relative w-full flex items-center justify-center bg-black overflow-hidden select-none"
        style={{ width: '100vw', maxWidth: '100%' }}
        aria-label="Hero — Bishal Mishra, Full-Stack Developer"
      >
        {/* Background slides */}
        <div className="absolute inset-0 z-0">
          {heroData.slides.map((slide, idx) => {
            const active = idx === currentSlide;
            return (
              <React.Fragment key={idx}>
                <div
                  className={`absolute inset-0 bg-cover bg-center hidden md:block transition-all duration-1000 ease-in-out ${
                    active ? 'opacity-70 scale-100' : 'opacity-0 scale-105'
                  }`}
                  style={{ backgroundImage: `url(${slide.imageUrl})` }}
                />
                <div
                  className={`absolute inset-0 bg-cover bg-center md:hidden transition-all duration-1000 ease-in-out ${
                    active ? 'opacity-80 scale-100' : 'opacity-0 scale-105'
                  }`}
                  style={{
                    backgroundImage: `url(${slide.mobileImageUrl || slide.imageUrl})`,
                  }}
                />
              </React.Fragment>
            );
          })}
        </div>

        {/* Change Background button overlay */}
        {isEditMode && (
          <label className="absolute top-4 left-4 z-[25] bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg border border-slate-700/80 hover:bg-black/85 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition-all select-none">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7M16 5l5 5M21 3v6"/></svg>
            <span>Change Slide Background</span>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={async (e) => {
                if (!e.target.files || e.target.files.length === 0) return;
                window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saving' }));
                try {
                  const res = await uploadToCloudinary(e.target.files[0]);
                  const updatedSlides = [...heroData.slides];
                  if (updatedSlides[currentSlide]) {
                    updatedSlides[currentSlide] = {
                      ...updatedSlides[currentSlide],
                      imageUrl: res.url,
                      mobileImageUrl: res.url
                    };
                  }
                  
                  await updateDoc(doc(db, 'settings', 'hero'), {
                    slides: updatedSlides
                  });
                  
                  setHeroData(prev => ({
                    ...prev,
                    slides: updatedSlides
                  }));
                  window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saved' }));
                } catch (err) {
                  console.error("Error uploading slide background:", err);
                }
              }}
            />
          </label>
        )}

        {/* Overlays — darker for richer feel */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-black/40 z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/50 z-[1]" />

        {/* Main content */}
        <div className="relative w-full px-[6vw] md:px-[10vw] z-10 flex flex-col justify-center pt-20 pb-12 md:pt-28 md:pb-20">

          {/* Main heading */}
          <h1
            id="hero-title"
            data-editable-id={`settings-hero-title-${currentSlide}`}
            contentEditable={isEditMode}
            suppressContentEditableWarning
            onBlur={(e) => handleSlideSave('title', e.currentTarget.innerHTML || '')}
            onFocus={(e) => {
              if (isEditMode) {
                window.dispatchEvent(new CustomEvent('activeEditableFocus', { detail: e.currentTarget }));
              }
            }}
            onClick={(e) => {
              if (isEditMode) {
                window.dispatchEvent(new CustomEvent('activeEditableFocus', { detail: e.currentTarget }));
              }
            }}
            className={`font-outfit font-black tracking-tight leading-none mb-3 md:mb-4 max-w-3xl text-left ${isEditMode ? 'outline-dashed outline-2 outline-amber-500/80 p-1 rounded cursor-text bg-black/30' : ''}`}
            dangerouslySetInnerHTML={{ __html: activeSlide?.title ?? heroData.title }}
          />

          {/* Typed subtitle */}
          <p
            id="hero-typed"
            className="font-outfit font-semibold tracking-wide mb-4 md:mb-5 text-left"
            aria-label={activeSlide?.subtitle ?? heroData.subtitle}
          >
            {isEditMode ? (
              <span
                contentEditable
                data-editable-id={`settings-hero-subtitle-${currentSlide}`}
                suppressContentEditableWarning
                onBlur={(e) => handleSlideSave('subtitle', e.currentTarget.textContent || '')}
                onFocus={(e) => {
                  if (isEditMode) {
                    window.dispatchEvent(new CustomEvent('activeEditableFocus', { detail: e.currentTarget }));
                  }
                }}
                onClick={(e) => {
                  if (isEditMode) {
                    window.dispatchEvent(new CustomEvent('activeEditableFocus', { detail: e.currentTarget }));
                  }
                }}
                className="outline-dashed outline-1 outline-amber-500/80 px-1.5 py-0.5 rounded cursor-text bg-black/30 inline-block"
              >
                {activeSlide?.subtitle}
              </span>
            ) : (
              <>
                {typedText}
                <span className="cursor-blink" aria-hidden="true" />
              </>
            )}
          </p>

          {/* Description */}
          <p
            id="hero-desc"
            data-editable-id={`settings-hero-description-${currentSlide}`}
            contentEditable={isEditMode}
            suppressContentEditableWarning
            onBlur={(e) => handleSlideSave('description', e.currentTarget.innerHTML || '')}
            onFocus={(e) => {
              if (isEditMode) {
                window.dispatchEvent(new CustomEvent('activeEditableFocus', { detail: e.currentTarget }));
              }
            }}
            onClick={(e) => {
              if (isEditMode) {
                window.dispatchEvent(new CustomEvent('activeEditableFocus', { detail: e.currentTarget }));
              }
            }}
            className={`max-w-xl leading-relaxed font-normal mb-7 md:mb-9 text-left ${isEditMode ? 'outline-dashed outline-2 outline-amber-500/80 p-1 rounded cursor-text bg-black/30' : ''}`}
            dangerouslySetInnerHTML={{ __html: activeSlide?.description ?? heroData.description }}
          />

          {/* CTA Buttons */}
          <div className="flex flex-row flex-wrap gap-3 mb-10 md:mb-14">
            {activeSlide?.primaryBtnText && (
              <button
                id="hero-cta-primary"
                onClick={() => {
                  if (isEditMode) return;
                  const link = activeSlide.primaryBtnLink;
                  if (link.startsWith('http')) {
                    window.open(link, '_blank');
                  } else {
                    navigate(link as any);
                  }
                }}
                className="hero-btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm tracking-wide shadow-lg"
              >
                <span
                  contentEditable={isEditMode}
                  data-editable-id={`settings-hero-primaryBtnText-${currentSlide}`}
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    e.stopPropagation();
                    handleSlideSave('primaryBtnText', e.currentTarget.textContent || '');
                  }}
                  onFocus={(e) => {
                    if (isEditMode) {
                      window.dispatchEvent(new CustomEvent('activeEditableFocus', { detail: e.currentTarget }));
                    }
                  }}
                  onClick={(e) => {
                    if (isEditMode) {
                      window.dispatchEvent(new CustomEvent('activeEditableFocus', { detail: e.currentTarget }));
                    }
                  }}
                  className={isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text' : ''}
                >
                  {activeSlide.primaryBtnText}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            )}
            {activeSlide?.secondaryBtnText && (
              <button
                id="hero-cta-secondary"
                onClick={() => {
                  if (isEditMode) return;
                  const link = activeSlide.secondaryBtnLink;
                  if (link.startsWith('http')) {
                    window.open(link, '_blank');
                  } else {
                    navigate(link as any);
                  }
                }}
                className="hero-btn-secondary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm tracking-wide"
              >
                <span
                  contentEditable={isEditMode}
                  data-editable-id={`settings-hero-secondaryBtnText-${currentSlide}`}
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    e.stopPropagation();
                    handleSlideSave('secondaryBtnText', e.currentTarget.textContent || '');
                  }}
                  onFocus={(e) => {
                    if (isEditMode) {
                      window.dispatchEvent(new CustomEvent('activeEditableFocus', { detail: e.currentTarget }));
                    }
                  }}
                  onClick={(e) => {
                    if (isEditMode) {
                      window.dispatchEvent(new CustomEvent('activeEditableFocus', { detail: e.currentTarget }));
                    }
                  }}
                  className={isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text' : ''}
                >
                  {activeSlide.secondaryBtnText}
                </span>
              </button>
            )}
          </div>

          {/* Stats bar */}
          <div className="flex flex-row flex-wrap gap-5 md:gap-0">
            {heroData.stats.map((stat, i) => (
              <div
                key={i}
                className="hero-stat flex flex-col gap-0.5 pr-6 mr-6 text-left"
              >
                <span
                  contentEditable={isEditMode}
                  data-editable-id={`settings-hero-stat-num-${i}`}
                  suppressContentEditableWarning
                  onBlur={(e) => handleStatSave(i, 'num', e.currentTarget.textContent || '')}
                  onFocus={(e) => {
                    if (isEditMode) {
                      window.dispatchEvent(new CustomEvent('activeEditableFocus', { detail: e.currentTarget }));
                    }
                  }}
                  onClick={(e) => {
                    if (isEditMode) {
                      window.dispatchEvent(new CustomEvent('activeEditableFocus', { detail: e.currentTarget }));
                    }
                  }}
                  className={`font-outfit font-black text-xl md:text-2xl text-white leading-none ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text bg-black/30' : ''}`}
                >
                  {stat.num}
                </span>
                <span
                  contentEditable={isEditMode}
                  data-editable-id={`settings-hero-stat-label-${i}`}
                  suppressContentEditableWarning
                  onBlur={(e) => handleStatSave(i, 'label', e.currentTarget.textContent || '')}
                  onFocus={(e) => {
                    if (isEditMode) {
                      window.dispatchEvent(new CustomEvent('activeEditableFocus', { detail: e.currentTarget }));
                    }
                  }}
                  onClick={(e) => {
                    if (isEditMode) {
                      window.dispatchEvent(new CustomEvent('activeEditableFocus', { detail: e.currentTarget }));
                    }
                  }}
                  className={`text-[11px] uppercase tracking-[0.15em] font-medium ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text bg-black/30' : ''}`}
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Slide controls — original up/down arrows + dots */}
        {heroData.slides.length > 1 && (
          <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3">
            <button
              onClick={goToPrev}
              className="p-1.5 rounded-full border border-slate-700 bg-black/40 text-slate-400 hover:text-white hover:bg-black/60 transition-all active:scale-95 outline-none"
              aria-label="Previous slide"
            >
              <ChevronUp size={16} />
            </button>
            <div className="flex items-center gap-1.5">
              {heroData.slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className="slide-dot rounded-full"
                  style={{
                    width: idx === currentSlide ? '16px' : '6px',
                    height: '6px',
                    background:
                      idx === currentSlide
                        ? 'rgba(255,255,255,0.9)'
                        : 'rgba(255,255,255,0.3)',
                  }}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
            <button
              onClick={goToNext}
              className="p-1.5 rounded-full border border-slate-700 bg-black/40 text-slate-400 hover:text-white hover:bg-black/60 transition-all active:scale-95 outline-none"
              aria-label="Next slide"
            >
              <ChevronDown size={16} />
            </button>
          </div>
        )}
      </section>
    </>
  );
};

export default Hero;
