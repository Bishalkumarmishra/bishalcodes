import React, { useState, useEffect } from 'react';
import { Wand2, ArrowRight, Code, Smartphone, Wind } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
// @ts-ignore
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const dispatchEditFocus = (el: HTMLElement) => {
  window.dispatchEvent(new CustomEvent('activeEditableFocus', { detail: el }));
};

const AIStudioTeaser: React.FC = () => {
    const { navigate } = useNavigation();
    const [isEditMode, setIsEditMode] = useState(false);
    const [teaserData, setTeaserData] = useState({
      tag: 'AI Playground',
      title: 'Interactive AI Studio',
      description: 'Describe your project layout idea. The integrated editor helps you prototype, edit, and preview simple web interfaces inside a sandbox environment.',
      buttonText: 'Launch AI Studio',
      features: [
        { text: 'Prototype Layouts' },
        { text: 'Responsive Previews' },
        { text: 'Iterative Refinement' }
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
      const fetchTeaserData = async () => {
        try {
          const snap = await getDoc(doc(db, 'settings', 'aiteaser'));
          if (snap.exists() && isMounted) {
            const data = snap.data();
            setTeaserData({
              tag: data.tag || 'AI Playground',
              title: data.title || 'Interactive AI Studio',
              description: data.description || 'Describe your project layout idea. The integrated editor helps you prototype, edit, and preview simple web interfaces inside a sandbox environment.',
              buttonText: data.buttonText || 'Launch AI Studio',
              features: data.features || [
                { text: 'Prototype Layouts' },
                { text: 'Responsive Previews' },
                { text: 'Iterative Refinement' }
              ]
            });
          }
        } catch (err) {
          console.warn("Error fetching AI teaser settings:", err);
        }
      };
      fetchTeaserData();
      return () => { isMounted = false; };
    }, []);

    const handleTeaserSave = async (field: string, value: any) => {
      window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saving' }));
      setTeaserData(prev => ({ ...prev, [field]: value }));
      try {
        await updateDoc(doc(db, 'settings', 'aiteaser'), {
          [field]: value
        });
        window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saved' }));
      } catch (err) {
        console.error("Error saving AI teaser settings:", err);
      }
    };

    const handleFeatureSave = async (index: number, newText: string) => {
      const updatedFeatures = [...teaserData.features];
      updatedFeatures[index] = { ...updatedFeatures[index], text: newText };
      await handleTeaserSave('features', updatedFeatures);
    };

    const getFeatureIcon = (index: number) => {
      switch (index) {
        case 0: return <Code size={16} />;
        case 1: return <Smartphone size={16} />;
        default: return <Wind size={16} />;
      }
    };

    return (
        <section id="ai-teaser" className="py-10 sm:py-14 relative overflow-hidden bg-slate-900 text-white">
            {/* Dark overlay scrim to guarantee text legibility */}
            <div className="absolute inset-0 bg-slate-950/80 z-0 pointer-events-none" />

            {/* Soft, professional gradient overlays (no cheesy glowing spots) */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#e52521]/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-red-800/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="w-full px-[5vw] mx-auto text-center relative z-10">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Wand2 className="text-red-400" size={18} />
                    <p 
                      contentEditable={isEditMode}
                      suppressContentEditableWarning
                      onBlur={(e) => handleTeaserSave('tag', e.currentTarget.textContent || '')}
                      onFocus={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
                      onClick={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
                      className={`text-red-400 font-semibold text-xs uppercase tracking-wider ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text' : ''}`}
                    >
                      {teaserData.tag}
                    </p>
                </div>
                
                <h2 
                  contentEditable={isEditMode}
                  suppressContentEditableWarning
                  onBlur={(e) => handleTeaserSave('title', e.currentTarget.textContent || '')}
                  onFocus={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
                  onClick={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
                  className={`text-white text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4 mx-auto w-fit ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text' : ''}`}
                >
                    {teaserData.title}
                </h2>
                
                <p 
                  contentEditable={isEditMode}
                  suppressContentEditableWarning
                  onBlur={(e) => handleTeaserSave('description', e.currentTarget.textContent || '')}
                  onFocus={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
                  onClick={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
                  className={`text-slate-400 text-sm sm:text-base leading-relaxed mt-2 max-w-2xl mx-auto mb-8 font-normal ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 p-1 rounded cursor-text' : ''}`}
                >
                    {teaserData.description}
                </p>

                {/* Feature highlights */}
                <div className="mb-10 flex flex-wrap items-center justify-center gap-3">
                    {teaserData.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full shrink-0">
                            <div className="text-red-400">{getFeatureIcon(index)}</div>
                            <span 
                              contentEditable={isEditMode}
                              suppressContentEditableWarning
                              onBlur={(e) => handleFeatureSave(index, e.currentTarget.textContent || '')}
                              onFocus={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
                              onClick={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
                              className={`text-white text-xs font-semibold ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text' : ''}`}
                            >
                              {feature.text}
                            </span>
                        </div>
                    ))}
                </div>

                <button 
                    onClick={() => !isEditMode && navigate('ai-studio')}
                    className="inline-flex items-center justify-center gap-1.5 bg-[#e52521] hover:bg-[#d01f1c] text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-md mx-auto"
                >
                    <span
                      contentEditable={isEditMode}
                      suppressContentEditableWarning
                      onBlur={(e) => handleTeaserSave('buttonText', e.currentTarget.textContent || '')}
                      onFocus={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
                      onClick={(e) => isEditMode && dispatchEditFocus(e.currentTarget)}
                      className={`cursor-pointer ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text' : ''}`}
                    >
                      {teaserData.buttonText}
                    </span>
                    <ArrowRight size={16} />
                </button>
            </div>
        </section>
    );
};

export default AIStudioTeaser;