import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ExternalLink, Maximize2, X, MessageSquare, Loader2, Sparkles, ArrowLeft, ArrowRight, Github, FileText } from 'lucide-react';
// @ts-ignore
import { query, collection, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Project } from '../types';
import { useNavigation } from '../context/NavigationContext';

interface ProjectMediaGalleryProps {
  project: Project;
  onClose: () => void;
  initialMediaIndex: number;
}

const ProjectMediaGallery: React.FC<ProjectMediaGalleryProps> = ({ project, onClose, initialMediaIndex }) => {
  const { navigate } = useNavigation();
  const [currentMediaIndex, setCurrentMediaIndex] = useState(initialMediaIndex);
  const mediaRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const safeImages = Array.isArray(project.images) ? project.images : [];
  const currentMedia = safeImages.length > 0 ? safeImages[currentMediaIndex] : null;

  const goToNext = useCallback(() => {
    if (safeImages.length > 0) {
      setCurrentMediaIndex((prev) => (prev + 1) % safeImages.length);
    }
  }, [safeImages.length]);

  const goToPrev = useCallback(() => {
    if (safeImages.length > 0) {
      setCurrentMediaIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
    }
  }, [safeImages.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (safeImages.length <= 1) return;
    if (touchStartX.current - touchEndX.current > 50) {
      goToNext();
    } else if (touchEndX.current - touchStartX.current > 50) {
      goToPrev();
    }
  };

  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, goToNext, goToPrev]);

  const handleInquireClick = () => {
    onClose();
    navigate('contact');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl h-[calc(100vh-8rem)] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 z-30 p-2 bg-white/80 rounded-lg text-slate-700 hover:bg-white transition-all border border-slate-200">
          <X size={18} />
        </button>

        {/* Media Content Area */}
        <div ref={mediaRef} className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden"
             onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
          
          {currentMedia ? (
            currentMedia.type === 'image' ? (
              <img 
                src={currentMedia.url} 
                alt={project.title} 
                className="max-w-full max-h-full object-contain select-none"
              />
            ) : currentMedia.type === 'video' ? (
              <iframe 
                src={currentMedia.url.includes('youtube.com') ? currentMedia.url : currentMedia.url + '?autoplay=1&mute=1'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen 
                className="w-full h-full object-contain"
                title={project.title}
                frameBorder="0"
              ></iframe>
            ) : currentMedia.type === 'pdf' || currentMedia.type === 'raw' ? (
              <div className="flex flex-col items-center justify-center text-slate-300 gap-4 p-8 bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full mx-4 shadow-xl">
                <FileText size={48} className="text-red-400" />
                <div className="text-center space-y-1">
                  <p className="text-base font-bold text-white">Document File</p>
                  <p className="text-xs text-slate-400 font-medium">Format: {currentMedia.type.toUpperCase()}</p>
                </div>
                <a 
                  href={currentMedia.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-full text-center bg-[#e52521] hover:bg-[#d01f1c] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all animate-none"
                >
                  Open Document
                </a>
              </div>
            ) : (
              <div className="text-slate-400 text-sm font-medium">Unsupported Media Type</div>
            )
          ) : (
            <div className="text-slate-400 text-sm font-medium">No Media Available</div>
          )}

          {/* Navigation Arrows */}
          {safeImages.length > 1 && (
            <>
              <button onClick={goToPrev} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-lg text-slate-700 hover:bg-white transition-all">
                <ArrowLeft size={20} />
              </button>
              <button onClick={goToNext} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-lg text-slate-700 hover:bg-white transition-all">
                <ArrowRight size={20} />
              </button>
            </>
          )}

          {/* Media Counter */}
          {safeImages.length > 0 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
              {currentMediaIndex + 1} / {safeImages.length}
            </div>
          )}
        </div>

        {/* Project Details and Actions */}
        <div className="p-6 bg-white border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-bold text-slate-900 mb-1">{project.title}</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal line-clamp-2">{project.description}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full md:w-auto">
            <a 
              href={project.liveUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 bg-slate-950 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-slate-800 transition-all shadow-sm"
            >
              <span>Preview Live</span> <ExternalLink size={14} />
            </a>
            {project.githubUrl && (
              <a 
                href={project.githubUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all shadow-sm"
              >
                <span>GitHub</span> <Github size={14} />
              </a>
            )}
            <button
              onClick={handleInquireClick}
              className="inline-flex items-center justify-center gap-1.5 bg-[#e52521] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#d01f1c] transition-all shadow-sm"
            >
              <span>Inquire</span> <MessageSquare size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Services: React.FC = () => {
  const { navigate } = useNavigation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectForGallery, setSelectedProjectForGallery] = useState<Project | null>(null);
  const [initialMediaIndex, setInitialMediaIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => {
          const docData = doc.data() as any;
          return {
            id: doc.id,
            ...docData,
            images: docData.images || [],
            techStack: docData.techStack || [],
          } as Project;
        });
        
        if (isMounted) {
          setProjects(data);
        }
      } catch (error) {
        console.warn("Error fetching projects for Services section:", error);
        if (isMounted) {
          setProjects([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchProjects();
    return () => { isMounted = false; };
  }, []);

  // Mobile Auto-Slide Engine
  useEffect(() => {
    if (loading || projects.length <= 1) return;

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
    }, 4500);

    return () => clearInterval(interval);
  }, [loading, projects]);

  const openGallery = (project: Project, index: number = 0) => {
    setSelectedProjectForGallery(project);
    setInitialMediaIndex(index);
  };

  const handleCloseGallery = useCallback(() => {
    setSelectedProjectForGallery(null);
  }, []);

  return (
    <section id="services" className="py-10 sm:py-14 bg-white relative overflow-hidden">
      <div className="w-full px-[5vw] mx-auto relative z-10">
        <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
               <p className="text-[#e52521] font-semibold uppercase tracking-wider text-[10px]">Showcase</p>
            </div>
            <h2 className="text-slate-900 text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
              Featured Projects
            </h2>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed mt-2 font-normal">
              A selection of application projects built using modern frontend frameworks, cloud infrastructure, and robust API design.
            </p>
          </div>
          
          <button 
            onClick={() => navigate('projects')}
            className="w-fit bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors uppercase tracking-wider shrink-0"
          >
            All Projects
          </button>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="animate-spin text-[#e52521] mx-auto" size={28} />
            <p className="text-slate-400 mt-3 font-semibold text-xs uppercase tracking-wider">Loading Projects...</p>
          </div>
        ) : (
          <div 
            ref={scrollRef}
            className="flex md:grid md:grid-cols-2 lg:grid-cols-3 overflow-x-auto md:overflow-x-visible gap-5 snap-x snap-mandatory scrollbar-hide pb-4"
          >
            {projects.length > 0 ? (
              projects.map((project) => (
                <div 
                  key={project.id} 
                  className="group relative bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-red-400 transition-all duration-300 hover:shadow-md shrink-0 w-[82vw] md:w-full snap-center flex flex-col h-full cursor-pointer" 
                  onClick={() => openGallery(project)}
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-slate-50 border-b border-slate-200 flex items-center justify-center">
                    <img src={project.images[0]?.url || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="250" viewBox="0 0 600 250"><rect width="100%" height="100%" fill="%230f172a"/><text x="50%" y="50%" font-family="sans-serif" font-size="18" font-weight="bold" fill="%23e52521" text-anchor="middle" dominant-baseline="middle">Bishal Codes Project</text></svg>'} alt={project.title} className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-500" />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center p-4">
                      <Maximize2 className="text-white mb-1.5" size={20} />
                      <p className="text-white font-semibold text-[9px] uppercase tracking-wider">View Gallery</p>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="text-slate-900 font-bold text-base mb-1.5 group-hover:text-[#e52521] transition-colors line-clamp-1">{project.title}</h3>
                    <p className="text-slate-500 text-xs sm:text-sm mb-4 line-clamp-2 font-normal flex-grow">{project.description}</p>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      <span>Explore details</span>
                      <ExternalLink size={12} className="text-slate-400 group-hover:text-[#e52521] transition-colors" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 py-16 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <p className="text-slate-400 font-semibold text-base uppercase tracking-wider">No Projects Found</p>
                <button onClick={() => navigate('contact')} className="mt-4 bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold text-xs hover:bg-slate-800 transition-colors uppercase tracking-wider">
                  Contact to Collaborate
                </button>
              </div>
            )}
          </div>
        )}

        {selectedProjectForGallery && (
          <ProjectMediaGallery 
            project={selectedProjectForGallery} 
            onClose={handleCloseGallery}
            initialMediaIndex={initialMediaIndex}
          />
        )}
      </div>
    </section>
  );
};

export default Services;
