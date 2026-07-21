import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, MessageSquare } from 'lucide-react';
// @ts-ignore
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const dispatchEditFocus = (el: HTMLElement) => {
  window.dispatchEvent(new CustomEvent('activeEditableFocus', { detail: el }));
};

const Skills: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('Web Design');
  const [isEditMode, setIsEditMode] = useState(false);
  const [aboutData, setAboutData] = useState({
    experience: '3+ Years',
    bio: 'I design and build tailored web applications that combine clean code with intuitive user experiences to solve real business challenges.',
    whatsappUrl: 'https://wa.me/9779827801575'
  });

  const [skillsData, setSkillsData] = useState({
    tag: 'Expertise',
    categories: [
      {
        id: 'Web Design',
        title: 'UI/UX Architecture',
        description: 'Pixel-perfect, structured interfaces that merge clean design systems with optimal responsiveness and speed.',
      },
      {
        id: 'APP Development',
        title: 'Full-Stack Apps',
        description: 'Building secure, scalable web platforms using modern frameworks like React, Next.js, and solid backend integrations.',
      },
      {
        id: 'Consultation.',
        title: 'Digital Strategy',
        description: 'Consultation on system architecture, database design, and technical roadmapping for complex requirements.',
      },
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
    const fetchAboutData = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'about'));
        if (snap.exists() && isMounted) {
          const data = snap.data();
          setAboutData({
            experience: data.experience || '3+ Years',
            bio: data.bio || 'I design and build tailored web applications that combine clean code with intuitive user experiences to solve real business challenges.',
            whatsappUrl: (data.whatsappUrl && data.whatsappUrl.includes('9828701575')) ? 'https://wa.me/9779827801575' : (data.whatsappUrl || 'https://wa.me/9779827801575')
          });
        }
      } catch (err) {
        console.warn("Error fetching about settings in Skills component:", err);
      }
    };
    fetchAboutData();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchSkillsData = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'skills'));
        if (snap.exists() && isMounted) {
          const data = snap.data();
          setSkillsData({
            tag: data.tag || 'Expertise',
            categories: data.categories || [
              {
                id: 'Web Design',
                title: 'UI/UX Architecture',
                description: 'Pixel-perfect, structured interfaces that merge clean design systems with optimal responsiveness and speed.',
              },
              {
                id: 'APP Development',
                title: 'Full-Stack Apps',
                description: 'Building secure, scalable web platforms using modern frameworks like React, Next.js, and solid backend integrations.',
              },
              {
                id: 'Consultation.',
                title: 'Digital Strategy',
                description: 'Consultation on system architecture, database design, and technical roadmapping for complex requirements.',
              },
            ]
          });
        }
      } catch (err) {
        console.warn("Error fetching skills settings:", err);
      }
    };
    fetchSkillsData();
    return () => { isMounted = false; };
  }, []);

  const handleSkillsSave = async (field: string, value: any) => {
    window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saving' }));
    setSkillsData(prev => ({ ...prev, [field]: value }));
    try {
      await updateDoc(doc(db, 'settings', 'skills'), {
        [field]: value
      });
      window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saved' }));
    } catch (err) {
      console.error("Error saving skills settings:", err);
    }
  };

  const handleCategorySave = async (index: number, key: 'title' | 'description', value: string) => {
    const updatedCats = [...skillsData.categories];
    updatedCats[index] = { ...updatedCats[index], [key]: value };
    await handleSkillsSave('categories', updatedCats);
  };

  const handleInlineAboutSave = async (field: string, value: string) => {
    window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saving' }));
    setAboutData(prev => ({ ...prev, [field]: value }));
    try {
      await updateDoc(doc(db, 'settings', 'about'), {
        [field]: value
      });
      window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saved' }));
    } catch (err) {
      console.error("Error saving about settings in Skills:", err);
    }
  };

  return (
    <section id="skills" className="py-10 sm:py-14 bg-white relative overflow-hidden">
      <div className="w-full px-[5vw] mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-16">
          
          <div className="w-full lg:w-1/2 flex flex-col justify-center text-left">
            <div className="flex items-center gap-2 mb-3">
              <p 
                contentEditable={isEditMode}
                suppressContentEditableWarning
                onBlur={(e) => handleSkillsSave('tag', e.currentTarget.textContent || '')}
                onFocus={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
                onClick={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
                className={`text-slate-900 dark:text-white font-semibold text-xs uppercase tracking-wider ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text' : ''}`}
              >
                {skillsData.tag}
              </p>
            </div>

            <h2 
              contentEditable={isEditMode}
              suppressContentEditableWarning
              onBlur={(e) => handleInlineAboutSave('experience', e.currentTarget.textContent || '')}
              onFocus={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
              onClick={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
              className={`text-slate-900 text-3xl sm:text-4xl font-bold mb-6 tracking-tight ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text' : ''}`}
            >
              {aboutData.experience} of Experience
            </h2>

            <p 
              contentEditable={isEditMode}
              suppressContentEditableWarning
              onBlur={(e) => handleInlineAboutSave('bio', e.currentTarget.textContent || '')}
              onFocus={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
              onClick={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
              className={`text-slate-600 dark:text-slate-400 text-xs sm:text-sm md:text-[14px] leading-relaxed mb-6 font-normal max-w-xl ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 p-1 rounded cursor-text' : ''}`}
            >
              {aboutData.bio}
            </p>

            {aboutData.whatsappUrl && (
              <a 
                href={aboutData.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors w-fit shadow-sm"
              >
                <span>WhatsApp Me</span>
                <MessageSquare size={16} className="fill-current" />
              </a>
            )}


          </div>

          <div className="w-full lg:w-1/2 space-y-4 flex flex-col justify-center text-left">
            {skillsData.categories.map((cat, index) => (
              <div 
                key={cat.id}
                onClick={() => !isEditMode && setActiveCategory(cat.id)}
                className={`cursor-pointer rounded-xl p-6 transition-all duration-300 border ${
                  activeCategory === cat.id 
                  ? 'bg-slate-50 border-slate-950 dark:border-white shadow-sm' 
                  : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 
                    contentEditable={isEditMode}
                    suppressContentEditableWarning
                    onBlur={(e) => handleCategorySave(index, 'title', e.currentTarget.textContent || '')}
                    onFocus={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
                    onClick={(e) => { if(isEditMode) { e.stopPropagation(); dispatchEditFocus(e.currentTarget); } }}
                    className={`text-base sm:text-lg font-bold transition-colors ${activeCategory === cat.id ? 'text-slate-950 dark:text-white' : 'text-slate-800'} ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text' : ''}`}
                  >
                    {cat.title}
                  </h3>
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                    activeCategory === cat.id 
                    ? 'border-slate-950 dark:border-white text-slate-950 dark:text-white bg-slate-100 rotate-45' 
                    : 'border-slate-200 text-slate-400'
                  }`}>
                    <ArrowRight size={16} />
                  </div>
                </div>

                {(activeCategory === cat.id || isEditMode) && (
                  <div className="mt-4">
                    <p 
                      contentEditable={isEditMode}
                      suppressContentEditableWarning
                      onBlur={(e) => handleCategorySave(index, 'description', e.currentTarget.textContent || '')}
                      onFocus={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
                      onClick={(e) => { if(isEditMode) { e.stopPropagation(); dispatchEditFocus(e.currentTarget); } }}
                      className={`text-slate-600 text-sm sm:text-base leading-relaxed font-normal ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 p-1 rounded cursor-text' : ''}`}
                    >
                      {cat.description}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Skills;