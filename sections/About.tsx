import React, { useState, useEffect } from 'react';
import { Mail, Phone, MessageSquare, Briefcase, Loader2, ChevronLeft, ChevronRight, CheckCircle2, User, Edit2 } from 'lucide-react';
// @ts-ignore
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { uploadToCloudinary } from '../services/cloudinary';

const About: React.FC = () => {
  const [aboutData, setAboutData] = useState({
    title: 'Full-Stack Web Architect',
    aboutHeaderTitle: 'About Me',
    experience: '3+ Years',
    bio: "Hi! I'm Bishal, a full-stack developer based in Nepal. I've spent the past 3+ years designing and building web solutions that bridge the gap between clean, scalable backends and fast, intuitive user interfaces. I love taking complex business ideas and turning them into solid, maintainable code.\n\nTo me, engineering isn't just about using the latest framework; it's about solving real-world problems, optimizing for the user experience, and ensuring that everything is secure, fast, and easy to maintain. I work primarily with Next.js, React, Node.js, and cloud ecosystems, building everything from custom APIs to full e-commerce architectures.",
    phone: '+977 9827801575',
    email: 'developer@bishalcodes.com',
    imageUrl: 'https://www.bishalcodes.com/bishal.png',
    images: [] as string[],
    projectsCompleted: '300+',
    whatsappUrl: 'https://wa.me/9779827801575'
  });
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchAboutData = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'about'));
        if (snap.exists() && isMounted) {
          const data = snap.data();
          setAboutData({
            title: data.title || 'Full-Stack Web Architect',
            aboutHeaderTitle: data.aboutHeaderTitle || 'About Me',
            experience: data.experience || '3+ Years',
            bio: data.bio || "Hi! I'm Bishal, a full-stack developer based in Nepal. I've spent the past 3+ years designing and building web solutions that bridge the gap between clean, scalable backends and fast, intuitive user interfaces. I love taking complex business ideas and turning them into solid, maintainable code.\n\nTo me, engineering isn't just about using the latest framework; it's about solving real-world problems, optimizing for the user experience, and ensuring that everything is secure, fast, and easy to maintain. I work primarily with Next.js, React, Node.js, and cloud ecosystems, building everything from custom APIs to full e-commerce architectures.",
            phone: (data.phone && data.phone.replace(/\s+/g, '') === '+9779828701575') ? '+977 9827801575' : (data.phone || '+977 9827801575'),
            email: data.email || 'developer@bishalcodes.com',
            imageUrl: data.imageUrl || 'https://www.bishalcodes.com/bishal.png',
            images: data.images || [],
            projectsCompleted: data.projectsCompleted || '300+',
            whatsappUrl: (data.whatsappUrl && data.whatsappUrl.includes('9828701575')) ? 'https://wa.me/9779827801575' : (data.whatsappUrl || 'https://wa.me/9779827801575')
          });
        }
      } catch (err) {
        console.warn("Error fetching about settings in About component:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchAboutData();
    return () => { isMounted = false; };
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

  const handleInlineSave = async (field: string, value: string) => {
    // Dispatch save status
    window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saving' }));
    
    // Update local state
    setAboutData(prev => ({ ...prev, [field]: value }));

    try {
      await updateDoc(doc(db, 'settings', 'about'), {
        [field]: value
      });
      window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saved' }));
    } catch (err) {
      console.error("Error updating firestore setting: ", err);
    }
  };

  const allImages = aboutData.images.length > 0
    ? aboutData.images
    : [aboutData.imageUrl];

  useEffect(() => {
    if (allImages.length <= 1 || isEditMode) return; // Freeze auto slider in edit mode
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % allImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [allImages.length, isEditMode]);

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % allImages.length);
  };

  if (loading) {
    return (
      <section id="about" className="py-8 sm:py-12 bg-slate-50 relative overflow-hidden flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-800" size={24} />
      </section>
    );
  }

  return (
    <section id="about" className="py-10 sm:py-14 bg-gradient-to-br from-slate-50 via-white to-slate-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden transition-colors duration-300">
      {/* subtle grid overlay to keep it feeling clean & textured */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg,transparent,transparent 39px,#888 39px,#888 40px), repeating-linear-gradient(90deg,transparent,transparent 39px,#888 39px,#888 40px)',
        }}
      />

      <div className="w-full px-[5vw] mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
          
          {/* Portrait/Slider Column */}
          <div className="w-full lg:w-[42%] flex justify-center items-center">
            <div className="relative max-w-[300px] sm:max-w-[320px] w-full aspect-[4/5] group">
              {/* Backing decorative frame */}
              <div className="absolute inset-0 border-2 border-slate-200 dark:border-slate-700 rounded-[32px] translate-x-3 translate-y-3 -z-10 transition-transform duration-500 group-hover:translate-x-1 group-hover:translate-y-1 hidden sm:block" />
              
              {/* Backing dot matrix SVG decoration */}
              <div className="absolute -top-4 -left-4 w-20 h-20 -z-20 text-slate-200/80 dark:text-slate-700/40 pointer-events-none hidden sm:block">
                <svg width="100%" height="100%" fill="currentColor">
                  <defs>
                    <pattern id="dotPattern" width="10" height="10" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="1.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#dotPattern)" />
                </svg>
              </div>

              <div className="relative w-full h-full rounded-[28px] overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200/60 dark:border-slate-700 shadow-sm transition-colors duration-300">
                {allImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Bishal Mishra ${idx + 1}`}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${
                      idx === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                    }`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/adrianhajdin/project_3D_developer_portfolio/main/src/assets/creator.png';
                    }}
                  />
                ))}

                {/* SVG Corner Bracket Overlay to frame the image in a professional style */}
                <svg 
                  className="absolute inset-4 pointer-events-none text-white/60 dark:text-white/40 z-20" 
                  viewBox="0 0 100 100" 
                  fill="none" 
                  preserveAspectRatio="none" 
                  style={{ width: 'calc(100% - 2rem)', height: 'calc(100% - 2rem)' }}
                >
                  <path d="M 12 0 L 0 0 L 0 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M 88 0 L 100 0 L 100 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M 0 88 L 0 100 L 12 100" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M 100 88 L 100 100 L 88 100" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                {/* Live Image Uploader Overlay */}
                {isEditMode && (
                  <label className="absolute inset-0 bg-black/60 z-30 flex flex-col items-center justify-center cursor-pointer text-white text-[11px] font-bold gap-1 transition-all">
                    <Edit2 size={16} className="animate-pulse" />
                    <span>Upload Portrait Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        if (!e.target.files || e.target.files.length === 0) return;
                        window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saving' }));
                        try {
                          const res = await uploadToCloudinary(e.target.files[0]);
                          const updatedImages = [...aboutData.images];
                          let finalUrl = aboutData.imageUrl;
                          
                          if (updatedImages.length > 0) {
                            updatedImages[currentSlide] = res.url;
                          } else {
                            finalUrl = res.url;
                          }
                          
                          await updateDoc(doc(db, 'settings', 'about'), {
                            imageUrl: finalUrl,
                            images: updatedImages
                          });
                          
                          setAboutData(prev => ({
                            ...prev,
                            imageUrl: finalUrl,
                            images: updatedImages
                          }));
                          window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saved' }));
                        } catch (err) {
                          console.error("Error uploading image in visual edit:", err);
                        }
                      }}
                    />
                  </label>
                )}

                {allImages.length > 1 && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-white/10 select-none">
                    <button
                      onClick={goToPrev}
                      className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all active:scale-90 outline-none"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <div className="flex items-center gap-1.5">
                      {allImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentSlide(idx)}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${
                            idx === currentSlide ? 'bg-white w-3' : 'bg-white/40 hover:bg-white/60'
                          }`}
                          aria-label={`Go to image ${idx + 1}`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={goToNext}
                      className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all active:scale-90 outline-none"
                      aria-label="Next image"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Text/Content Column */}
          <div className="w-full lg:w-[58%]">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300">
              
              {/* Professional Title (No Gemini Purple Gradients) */}
              <div className="flex items-center gap-2 mb-3">
                <User size={14} className="text-slate-800 dark:text-slate-300 shrink-0" />
                <p 
                  contentEditable={isEditMode}
                  suppressContentEditableWarning
                  onBlur={(e) => handleInlineSave('title', e.currentTarget.textContent || '')}
                  className={`text-slate-800 dark:text-slate-300 font-bold text-[11px] uppercase tracking-widest leading-none transition-colors ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text' : ''}`}
                >
                  {aboutData.title || 'Full-Stack Web Architect'}
                </p>
              </div>

              {/* Editable About Header */}
              <h2 
                contentEditable={isEditMode}
                suppressContentEditableWarning
                onBlur={(e) => handleInlineSave('aboutHeaderTitle', e.currentTarget.textContent || '')}
                className={`text-slate-900 dark:text-white text-xl sm:text-2xl md:text-3xl font-extrabold mb-3 tracking-tight font-outfit text-left transition-colors ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text' : ''}`}
              >
                {aboutData.aboutHeaderTitle || 'About Me'}
              </h2>

              {/* Editable Biography text */}
              {isEditMode ? (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleInlineSave('bio', e.currentTarget.innerText || '')}
                  className="text-slate-500 dark:text-slate-400 text-xs sm:text-[13px] md:text-sm leading-relaxed mb-5 font-normal space-y-2 text-left outline-dashed outline-2 outline-amber-500/80 p-2.5 rounded-lg bg-slate-50/50 dark:bg-slate-800/50 cursor-text min-h-[100px] whitespace-pre-wrap transition-colors"
                >
                  {aboutData.bio}
                </div>
              ) : (
                <div className="text-slate-500 dark:text-slate-400 text-xs sm:text-[13px] md:text-sm leading-relaxed mb-5 font-normal space-y-2 text-left transition-colors">
                  {aboutData.bio.split('\n\n').map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
                </div>
              )}

              {/* Badges/Feature Icons + Stats (compact on mobile) */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mb-3 text-left transition-colors space-y-2.5">
                <div className="grid grid-cols-[1fr_1.25fr_1fr] sm:grid-cols-3 gap-1 sm:gap-3">
                  <div className="flex items-center sm:items-start gap-1 min-w-0">
                    <CheckCircle2 size={13} className="text-slate-800 dark:text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-[9px] sm:text-[11px] font-bold text-slate-900 dark:text-slate-200 uppercase tracking-tight sm:tracking-wider leading-tight">Clean Code</h4>
                      <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug hidden sm:block">Scalable & robust logic</p>
                    </div>
                  </div>
                  <div className="flex items-center sm:items-start gap-1 min-w-0">
                    <CheckCircle2 size={13} className="text-slate-800 dark:text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-[9px] sm:text-[11px] font-bold text-slate-900 dark:text-slate-200 uppercase tracking-tight sm:tracking-wider leading-tight whitespace-nowrap sm:whitespace-normal">Fast Execution</h4>
                      <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug hidden sm:block">Snap-fast load speeds</p>
                    </div>
                  </div>
                  <div className="flex items-center sm:items-start gap-1 min-w-0">
                    <CheckCircle2 size={13} className="text-slate-800 dark:text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-[9px] sm:text-[11px] font-bold text-slate-900 dark:text-slate-200 uppercase tracking-tight sm:tracking-wider leading-tight">User-First</h4>
                      <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug hidden sm:block">Polished UX/UI systems</p>
                    </div>
                  </div>
                </div>

                {/* Stats right below badges */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-1">
                  <div className="bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 p-2.5 sm:p-4 rounded-xl hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300 text-left">
                    <p 
                      contentEditable={isEditMode}
                      suppressContentEditableWarning
                      onBlur={(e) => handleInlineSave('projectsCompleted', e.currentTarget.textContent || '')}
                      className={`text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white font-outfit ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text' : ''}`}
                    >
                      {aboutData.projectsCompleted}
                    </p>
                    <p className="text-[8px] sm:text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">Projects Completed</p>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 p-2.5 sm:p-4 rounded-xl hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300 text-left">
                    <p 
                      contentEditable={isEditMode}
                      suppressContentEditableWarning
                      onBlur={(e) => handleInlineSave('experience', e.currentTarget.textContent || '')}
                      className={`text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white font-outfit ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text' : ''}`}
                    >
                      {aboutData.experience}
                    </p>
                    <p className="text-[8px] sm:text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">Experience</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 border-t border-slate-100 dark:border-slate-800 pt-4 text-left transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700 shrink-0 transition-colors">
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className="text-slate-400 dark:text-slate-500 text-[9px] font-bold uppercase tracking-widest">Email</p>
                    <span 
                      contentEditable={isEditMode}
                      suppressContentEditableWarning
                      onBlur={(e) => handleInlineSave('email', e.currentTarget.textContent || '')}
                      className={`text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-[13px] hover:text-slate-950 dark:hover:text-white transition-colors break-all block ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text' : ''}`}
                    >
                      {aboutData.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700 shrink-0 transition-colors">
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="text-slate-400 dark:text-slate-500 text-[9px] font-bold uppercase tracking-widest">Mobile</p>
                    <span 
                      contentEditable={isEditMode}
                      suppressContentEditableWarning
                      onBlur={(e) => handleInlineSave('phone', e.currentTarget.textContent || '')}
                      className={`text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-[13px] hover:text-slate-950 dark:hover:text-white transition-colors block ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text' : ''}`}
                    >
                      {aboutData.phone}
                    </span>
                  </div>
                </div>
              </div>

              {aboutData.whatsappUrl && (
                <div className="text-left">
                  <a 
                    href={aboutData.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-sm active:scale-95"
                  >
                    <span>WhatsApp Me</span>
                    <MessageSquare size={14} className="fill-current" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;