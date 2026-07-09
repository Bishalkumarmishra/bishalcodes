import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Sparkles, Briefcase } from 'lucide-react';
// @ts-ignore
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const dispatchEditFocus = (el: HTMLElement) => {
  window.dispatchEvent(new CustomEvent('activeEditableFocus', { detail: el }));
};

const Timeline: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [timelineData, setTimelineData] = useState({
    tag: 'Timeline',
    title: 'Work Experience',
    experiences: [
      {
        year: '2025',
        shortDesc: 'Scaling consulting and delivery',
        title: 'Global Delivery',
        description: 'Consulting and engineering web architectures for enterprise clients, focusing on Next.js scalability, security frameworks, and API optimization.',
        isHighlighted: true,
      },
      {
        year: '2024',
        shortDesc: 'Full stack app architectures',
        title: 'Web Developer',
        description: 'Delivering end-to-end full stack web platforms using Node.js, React, and cloud integrations to optimize business operations.',
        isHighlighted: false,
      },
      {
        year: '2023',
        shortDesc: 'Early commerce systems',
        title: 'Commerce Developer',
        description: 'Developed specialized e-commerce setups and PHP backends, integrating database schemas and custom features for growing brands.',
        isHighlighted: false,
      }
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
    const fetchTimelineData = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'experience'));
        if (snap.exists() && isMounted) {
          const data = snap.data();
          setTimelineData({
            tag: data.tag || 'Timeline',
            title: data.title || 'Work Experience',
            experiences: data.experiences || [
              {
                year: '2025',
                shortDesc: 'Scaling consulting and delivery',
                title: 'Global Delivery',
                description: 'Consulting and engineering web architectures for enterprise clients, focusing on Next.js scalability, security frameworks, and API optimization.',
                isHighlighted: true,
              },
              {
                year: '2024',
                shortDesc: 'Full stack app architectures',
                title: 'Web Developer',
                description: 'Delivering end-to-end full stack web platforms using Node.js, React, and cloud integrations to optimize business operations.',
                isHighlighted: false,
              },
              {
                year: '2023',
                shortDesc: 'Early commerce systems',
                title: 'Commerce Developer',
                description: 'Developed specialized e-commerce setups and PHP backends, integrating database schemas and custom features for growing brands.',
                isHighlighted: false,
              }
            ]
          });
        }
      } catch (err) {
        console.warn("Error fetching timeline settings:", err);
      }
    };
    fetchTimelineData();
    return () => { isMounted = false; };
  }, []);

  const handleTimelineSave = async (field: string, value: any) => {
    window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saving' }));
    setTimelineData(prev => ({ ...prev, [field]: value }));
    try {
      await updateDoc(doc(db, 'settings', 'experience'), {
        [field]: value
      });
      window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saved' }));
    } catch (err) {
      console.error("Error saving timeline settings:", err);
    }
  };

  const handleExperienceSave = async (index: number, key: string, value: string) => {
    const updatedExps = [...timelineData.experiences];
    updatedExps[index] = { ...updatedExps[index], [key]: value };
    await handleTimelineSave('experiences', updatedExps);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollRef.current && window.innerWidth < 768) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const cardWidth = scrollRef.current.firstElementChild?.clientWidth || clientWidth;
        const gap = 20;
        
        let nextScroll = scrollLeft + cardWidth + gap;
        if (nextScroll >= scrollWidth - clientWidth - 10) {
          nextScroll = 0;
        }

        scrollRef.current.scrollTo({
          left: nextScroll,
          behavior: 'smooth'
        });
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section id="experience" className="py-10 sm:py-14 bg-slate-50 relative overflow-hidden border-t border-slate-200/60">
      <div className="w-full px-[5vw] mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 text-left">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <p 
                contentEditable={isEditMode}
                suppressContentEditableWarning
                onBlur={(e) => handleTimelineSave('tag', e.currentTarget.textContent || '')}
                onFocus={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
                onClick={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
                className={`text-slate-900 dark:text-white font-semibold text-xs uppercase tracking-wider ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text' : ''}`}
              >
                {timelineData.tag}
              </p>
            </div>
            <h2 
              contentEditable={isEditMode}
              suppressContentEditableWarning
              onBlur={(e) => handleTimelineSave('title', e.currentTarget.textContent || '')}
              onFocus={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
              onClick={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
              className={`text-slate-900 text-3xl sm:text-4xl font-bold tracking-tight ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text' : ''}`}
            >
              {timelineData.title}
            </h2>
          </div>
          <a 
            href="https://wa.me/9779828701575" 
            className="inline-flex items-center justify-center gap-1.5 bg-slate-900 text-white px-4 py-2 rounded-lg font-medium text-xs hover:bg-slate-800 transition-colors shadow-sm shrink-0"
          >
            <span>WhatsApp Me</span> <MessageSquare size={14} className="fill-current" />
          </a>
        </div>

        <div className="relative">
          {/* Vertical Line for Desktop */}
          <div className="hidden md:block absolute left-[150px] top-0 bottom-0 w-[1px] bg-slate-200" />

          {/* Timeline Scroll Container */}
          <div 
            ref={scrollRef}
            className="flex md:flex-col overflow-x-auto md:overflow-x-visible snap-x snap-mandatory scrollbar-hide gap-5 md:space-y-8 pb-4 md:pb-0"
          >
            {timelineData.experiences.map((exp, index) => (
              <div 
                key={index} 
                className="relative flex flex-col md:flex-row gap-6 md:gap-8 shrink-0 w-[85vw] md:w-full snap-center text-left"
              >
                {/* Desktop Year Label */}
                <div className="hidden md:block w-[120px] shrink-0 pt-1 text-right">
                  <p 
                    contentEditable={isEditMode}
                    suppressContentEditableWarning
                    onBlur={(e) => handleExperienceSave(index, 'year', e.currentTarget.textContent || '')}
                    onFocus={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
                    onClick={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
                    className={`text-slate-400 font-bold text-xs uppercase tracking-wider mb-1 w-fit ml-auto ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text' : ''}`}
                  >
                    {exp.year}
                  </p>
                  <p 
                    contentEditable={isEditMode}
                    suppressContentEditableWarning
                    onBlur={(e) => handleExperienceSave(index, 'shortDesc', e.currentTarget.textContent || '')}
                    onFocus={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
                    onClick={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
                    className={`text-slate-700 font-semibold text-sm leading-snug w-fit ml-auto ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text' : ''}`}
                  >
                    {exp.shortDesc}
                  </p>
                </div>

                {/* Dot Marker */}
                <div className="hidden md:block absolute left-[150px] top-3 -translate-x-1/2 z-10">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 border-slate-50 flex items-center justify-center ${exp.isHighlighted ? 'bg-indigo-600 shadow-sm' : 'bg-slate-300'}`} />
                </div>

                {/* Main Card */}
                <div className="flex-1 pb-1">
                  <div className={`p-6 md:p-8 h-full rounded-xl border bg-white transition-all duration-300 flex flex-col sm:flex-row justify-between items-start gap-4 ${
                    exp.isHighlighted 
                    ? 'border-indigo-500 shadow-sm' 
                    : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 
                          contentEditable={isEditMode}
                          suppressContentEditableWarning
                          onBlur={(e) => handleExperienceSave(index, 'title', e.currentTarget.textContent || '')}
                          onFocus={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
                          onClick={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
                          className={`text-slate-900 text-lg sm:text-xl font-bold tracking-tight ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text' : ''}`}
                        >
                          {exp.title}
                        </h3>
                        <span 
                          contentEditable={isEditMode}
                          suppressContentEditableWarning
                          onBlur={(e) => handleExperienceSave(index, 'year', e.currentTarget.textContent || '')}
                          onFocus={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
                          onClick={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
                          className={`md:hidden bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 uppercase tracking-wider ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text' : ''}`}
                        >
                          {exp.year}
                        </span>
                      </div>
                      <p 
                        contentEditable={isEditMode}
                        suppressContentEditableWarning
                        onBlur={(e) => handleExperienceSave(index, 'description', e.currentTarget.textContent || '')}
                        onFocus={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
                        onClick={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
                        className={`text-slate-650 text-sm sm:text-base leading-relaxed font-normal ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 p-1 rounded cursor-text' : ''}`}
                      >
                        {exp.description}
                      </p>
                    </div>

                    <div className="hidden sm:block shrink-0">
                        <a href="https://wa.me/9779828701575" className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${
                          exp.isHighlighted 
                          ? 'bg-slate-950 border-slate-950 text-white hover:bg-slate-800' 
                          : 'border-slate-200 text-slate-400 hover:border-slate-950 hover:text-slate-950 hover:bg-slate-50'
                        }`}>
                          <MessageSquare size={16} />
                       </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Timeline;