import React, { useState, useEffect } from 'react';
// @ts-ignore
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useNavigation } from '../context/NavigationContext';
import { ArrowRight, ChevronUp, ChevronDown } from 'lucide-react';

const defaultSlides = [
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1920',
  'https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=1920',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1920',
  'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=1920',
  'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?q=80&w=1920'
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

const Hero: React.FC = () => {
  const { navigate } = useNavigation();
  const [currentSlide, setCurrentSlide] = useState(0);

  const defaultMappedSlides: HeroSlide[] = defaultSlides.map((slide, index) => ({
    imageUrl: slide,
    title: index === 0 ? "Hi, I'm Bishal Mishra" : `Specialized Solutions #${index + 1}`,
    subtitle: index === 0 ? "Full-Stack Developer & Web Architect" : `Tailored for Scale #${index + 1}`,
    description: index === 0 ? "I design and build high-performance web applications, clean user interfaces, and robust cloud services that deliver exceptional digital experiences." : `Delivering pixel-perfect components and clean, robust cloud services.`,
    primaryBtnText: 'View My Work',
    primaryBtnLink: 'projects',
    primaryBtnColor: '#6366f1',
    secondaryBtnText: 'Get in Touch',
    secondaryBtnLink: 'contact',
    secondaryBtnColor: 'transparent',
    titleColor: '#ffffff',
    subtitleColor: '#818cf8',
    descriptionColor: '#e2e8f0',
    mobileImageUrl: slide,
    titleSizeMobile: 2.0,
    titleSizeDesktop: 4.5,
    subtitleSizeMobile: 1.125,
    subtitleSizeDesktop: 1.5,
    descSizeMobile: 0.875,
    descSizeDesktop: 1.125,
  }));

  const [heroData, setHeroData] = useState<{
    title: string;
    subtitle: string;
    description: string;
    slides: HeroSlide[];
    sliderHeightMobile?: number;
    sliderHeightDesktop?: number;
  }>({
    title: "Hi, I'm Bishal Mishra",
    subtitle: "Full-Stack Developer & Web Architect",
    description: "I design and build high-performance web applications, clean user interfaces, and robust cloud services that deliver exceptional digital experiences.",
    slides: defaultMappedSlides,
    sliderHeightMobile: 50,
    sliderHeightDesktop: 100,
  });

  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'hero'));
        if (snap.exists()) {
          const data = snap.data();
          const rawSlides = data.slides && data.slides.length > 0 ? data.slides : defaultSlides;
          
          const mappedSlides = rawSlides.map((slide: any, index: number) => {
            const globalTitle = data.title || "Hi, I'm Bishal Mishra";
            const globalSubtitle = data.subtitle || "Full-Stack Developer & Web Architect";
            const globalDesc = data.description || "I design and build high-performance web applications, clean user interfaces, and robust cloud services that deliver exceptional digital experiences.";

            if (typeof slide === 'string') {
              return {
                imageUrl: slide,
                title: index === 0 ? globalTitle : `Specialized Solutions #${index + 1}`,
                subtitle: index === 0 ? globalSubtitle : `Tailored for Scale #${index + 1}`,
                description: index === 0 ? globalDesc : `Delivering pixel-perfect components and clean, robust cloud services.`,
                primaryBtnText: 'View My Work',
                primaryBtnLink: 'projects',
                primaryBtnColor: '#6366f1',
                secondaryBtnText: 'Get in Touch',
                secondaryBtnLink: 'contact',
                secondaryBtnColor: 'transparent',
                titleColor: '#ffffff',
                subtitleColor: '#818cf8',
                descriptionColor: '#e2e8f0',
                mobileImageUrl: slide,
                titleSizeMobile: 2.0,
                titleSizeDesktop: 4.5,
                subtitleSizeMobile: 1.125,
                subtitleSizeDesktop: 1.5,
                descSizeMobile: 0.875,
                descSizeDesktop: 1.125,
              };
            }
            
            return {
              imageUrl: slide.imageUrl || '',
              title: slide.title || globalTitle,
              subtitle: slide.subtitle || globalSubtitle,
              description: slide.description || globalDesc,
              primaryBtnText: slide.primaryBtnText || 'View My Work',
              primaryBtnLink: slide.primaryBtnLink || 'projects',
              primaryBtnColor: slide.primaryBtnColor || '#6366f1',
              secondaryBtnText: slide.secondaryBtnText || 'Get in Touch',
              secondaryBtnLink: slide.secondaryBtnLink || 'contact',
              secondaryBtnColor: slide.secondaryBtnColor || 'transparent',
              titleColor: slide.titleColor || '#ffffff',
              subtitleColor: slide.subtitleColor || '#818cf8',
              descriptionColor: slide.descriptionColor || '#e2e8f0',
              mobileImageUrl: slide.mobileImageUrl || slide.imageUrl || '',
              titleSizeMobile: slide.titleSizeMobile !== undefined ? Number(slide.titleSizeMobile) : 2.0,
              titleSizeDesktop: slide.titleSizeDesktop !== undefined ? Number(slide.titleSizeDesktop) : 4.5,
              subtitleSizeMobile: slide.subtitleSizeMobile !== undefined ? Number(slide.subtitleSizeMobile) : 1.125,
              subtitleSizeDesktop: slide.subtitleSizeDesktop !== undefined ? Number(slide.subtitleSizeDesktop) : 1.5,
              descSizeMobile: slide.descSizeMobile !== undefined ? Number(slide.descSizeMobile) : 0.875,
              descSizeDesktop: slide.descSizeDesktop !== undefined ? Number(slide.descSizeDesktop) : 1.125,
            };
          });

          setHeroData({
            title: data.title || "Hi, I'm Bishal Mishra",
            subtitle: data.subtitle || "Full-Stack Developer & Web Architect",
            description: data.description || "I design and build high-performance web applications, clean user interfaces, and robust cloud services that deliver exceptional digital experiences.",
            slides: mappedSlides,
            sliderHeightMobile: data.sliderHeightMobile !== undefined ? Number(data.sliderHeightMobile) : 50,
            sliderHeightDesktop: data.sliderHeightDesktop !== undefined ? Number(data.sliderHeightDesktop) : 100,
          });
        }
      } catch (err) {
        console.warn("Error fetching hero settings:", err);
      }
    };
    fetchHeroData();
  }, []);

  // Slide auto-play interval
  useEffect(() => {
    const slidesCount = heroData.slides.length;
    if (slidesCount <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slidesCount);
    }, 5000);

    return () => clearInterval(interval);
  }, [heroData.slides]);

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev - 1 + heroData.slides.length) % heroData.slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % heroData.slides.length);
  };

  const activeSlideData = heroData.slides[currentSlide] || {
    title: heroData.title,
    subtitle: heroData.subtitle,
    description: heroData.description,
    primaryBtnText: 'View My Work',
    primaryBtnLink: 'projects',
    primaryBtnColor: '#6366f1',
    secondaryBtnText: 'Get in Touch',
    secondaryBtnLink: 'contact',
    secondaryBtnColor: 'transparent',
    titleColor: '#ffffff',
    subtitleColor: '#818cf8',
    descriptionColor: '#e2e8f0',
    mobileImageUrl: '',
    titleSizeMobile: 2.0,
    titleSizeDesktop: 4.5,
    subtitleSizeMobile: 1.125,
    subtitleSizeDesktop: 1.5,
    descSizeMobile: 0.875,
    descSizeDesktop: 1.125,
  };

  return (
    <>
      <style>{`
        #hero-slider {
          height: ${heroData.sliderHeightMobile || 50}vh;
          min-height: 470px;
        }
        #hero-slider-title {
          font-size: ${activeSlideData.titleSizeMobile || 2.0}rem;
          color: ${activeSlideData.titleColor || '#ffffff'};
          line-height: 1.05;
        }
        #hero-slider-subtitle {
          font-size: ${activeSlideData.subtitleSizeMobile || 1.125}rem;
          color: ${activeSlideData.subtitleColor || '#818cf8'};
          line-height: 1.25;
          letter-spacing: 0.1em;
        }
        #hero-slider-desc {
          font-size: ${activeSlideData.descSizeMobile || 0.875}rem;
          color: ${activeSlideData.descriptionColor || '#e2e8f0'};
          line-height: 1.5;
        }
        @media (min-width: 768px) {
          #hero-slider {
            height: ${heroData.sliderHeightDesktop || 100}vh;
            min-height: 600px;
          }
          #hero-slider-title {
            font-size: ${activeSlideData.titleSizeDesktop || 4.5}rem;
            line-height: 1.05;
          }
          #hero-slider-subtitle {
            font-size: ${activeSlideData.subtitleSizeDesktop || 1.5}rem;
            line-height: 1.35;
            letter-spacing: 0.2em;
          }
          #hero-slider-desc {
            font-size: ${activeSlideData.descSizeDesktop || 1.125}rem;
          }
        }
      `}</style>
      <section 
        id="hero-slider"
        className="relative w-full flex items-center justify-center bg-black overflow-hidden select-none"
      >
        {/* Background Image Slides Stack */}
        <div className="absolute inset-0 w-full h-full z-0">
          {heroData.slides.map((slide, idx) => {
            const isActive = idx === currentSlide;
            const fadeClass = isActive ? 'opacity-90 md:opacity-70 scale-100' : 'opacity-0 scale-105';
            return (
              <React.Fragment key={idx}>
                {/* Desktop background */}
                <div
                  className={`absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-1000 ease-in-out hidden md:block ${fadeClass}`}
                  style={{ backgroundImage: `url(${slide.imageUrl})` }}
                />
                {/* Mobile background */}
                <div
                  className={`absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-1000 ease-in-out md:hidden ${fadeClass}`}
                  style={{ backgroundImage: `url(${slide.mobileImageUrl || slide.imageUrl})` }}
                />
              </React.Fragment>
            );
          })}
        </div>

        {/* Dark overlay scrim to guarantee text legibility - darker on the left for left-aligned text */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 z-[1]" />

        {/* Content Container */}
        <div className="relative w-full px-[6vw] md:px-[10vw] mx-auto z-10 flex flex-col items-start justify-center text-left pt-20 pb-10 md:pt-28 md:pb-20">
          <div className="max-w-3xl space-y-4 md:space-y-5">
            <h1 
              id="hero-slider-title"
              className="font-outfit font-black tracking-tight uppercase drop-shadow-md"
            >
              {activeSlideData.title}
            </h1>
            
            <h2 
              id="hero-slider-subtitle"
              className="font-outfit font-extrabold uppercase leading-snug"
            >
              {activeSlideData.subtitle}
            </h2>

            <p 
              id="hero-slider-desc"
              className="font-sans max-w-2xl leading-relaxed drop-shadow-sm font-medium text-left"
            >
              {activeSlideData.description}
            </p>
          
          {/* Action Buttons */}
          <div className="pt-2 flex flex-row flex-wrap justify-start gap-4">
             {activeSlideData.primaryBtnText && (
               <button 
                 onClick={() => {
                   if (activeSlideData.primaryBtnLink.startsWith('http')) {
                     window.open(activeSlideData.primaryBtnLink, '_blank');
                   } else {
                     navigate(activeSlideData.primaryBtnLink as any);
                   }
                 }}
                 className="inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors shadow-md hover:brightness-110"
                 style={{ backgroundColor: activeSlideData.primaryBtnColor || '#6366f1' }}
               >
                  {activeSlideData.primaryBtnText} <ArrowRight size={14} />
               </button>
             )}
             {activeSlideData.secondaryBtnText && (
               <button 
                 onClick={() => {
                   if (activeSlideData.secondaryBtnLink.startsWith('http')) {
                     window.open(activeSlideData.secondaryBtnLink, '_blank');
                   } else {
                     navigate(activeSlideData.secondaryBtnLink as any);
                   }
                 }}
                 className="border border-slate-700 text-slate-300 px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors hover:text-white"
                 style={{ backgroundColor: activeSlideData.secondaryBtnColor === 'transparent' ? 'rgba(0,0,0,0.4)' : activeSlideData.secondaryBtnColor }}
               >
                  {activeSlideData.secondaryBtnText}
               </button>
             )}
          </div>
        </div>
      </div>

      {/* Bottom-right slide controls */}
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
                className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentSlide ? 'bg-white w-4' : 'bg-slate-500 hover:bg-slate-400'}`}
                aria-label={`Go to slide ${idx + 1}`}
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
