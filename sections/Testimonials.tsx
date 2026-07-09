import React, { useState, useEffect, useRef } from 'react';
import { Star, Edit2 } from 'lucide-react';
// @ts-ignore
import { query, collection, orderBy, getDocs, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Testimonial } from '../types';
import { uploadToCloudinary } from '../services/cloudinary';

const staticTestimonials = [
  {
    id: 'static-1',
    name: 'Bishal Mishra',
    company: 'Developer · bishalcodes.com',
    role: 'Full-Stack Developer',
    rating: 5,
    text: "I built this platform myself, so I know every line of code inside out. What I'm genuinely proud of is how it performs — fast loads, clean UI, and it actually works the way I imagined. Building your own portfolio teaches you more than any tutorial ever will. Shipping real projects is the only way to grow.",
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=250&auto=format&fit=crop',
    circleBg: '#e2e8f0', // Cool gray circle behind
    offsetClass: '-translate-x-3 -translate-y-2',
  },
  {
    id: 'static-2',
    name: 'Janak Singh Karki',
    company: 'Client · Web Project',
    role: 'Business Owner',
    rating: 5,
    text: "Honestly didn't expect this level of quality from a freelancer. Bishal understood exactly what I needed without me explaining too much — the website looked great, loaded fast, and he made edits without any fuss. Will definitely hire again for my next project.",
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=250&auto=format&fit=crop',
    circleBg: '#fef3c7', // Soft warm amber circle behind
    offsetClass: 'translate-x-3 -translate-y-2',
  },
  {
    id: 'static-3',
    name: 'Ritik Chaudhary',
    company: 'Client · Landing Page',
    role: 'Entrepreneur',
    rating: 5,
    text: "Bhai ne kaam bahut accha kiya — seriously impressed. The landing page he made for my business got way more attention than I expected. Mobile look was especially clean. He replies fast and doesn't ghost you. Good guy to work with.",
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=250&auto=format&fit=crop',
    circleBg: '#e9d5ff', // Soft purple circle behind
    offsetClass: 'translate-x-2 -translate-y-3',
  },
];

const Testimonials: React.FC = () => {
  const [dbTestimonials, setDbTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);

  const fetchAllFromFirestore = async () => {
    try {
      const q = query(collection(db, 'testimonials'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any),
      } as Testimonial));
      setDbTestimonials(data);
    } catch (error) {
      console.warn('Error fetching testimonials:', error);
      setDbTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFromFirestore();
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

  // Show database testimonials if they exist; otherwise fallback to static ones.
  const allTestimonials = dbTestimonials.length > 0 ? dbTestimonials : staticTestimonials;

  const handleTestimonialSave = async (id: string, field: 'name' | 'role' | 'company' | 'text', value: string) => {
    window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saving' }));
    const docId = id.startsWith('static-') ? id.replace('static-', 'testimonial-') : id;

    try {
      const docRef = doc(db, 'testimonials', docId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        await updateDoc(docRef, { [field]: value });
      } else {
        const original = allTestimonials.find(t => t.id === id);
        const newDoc = {
          id: docId,
          name: original?.name || '',
          role: (original as any)?.role || '',
          company: (original as any)?.company || '',
          text: original?.text || '',
          rating: original?.rating ?? 5,
          avatarUrl: original?.avatarUrl || '',
          createdAt: Date.now(),
          [field]: value
        };
        await setDoc(docRef, newDoc);
      }
      
      // Refresh list
      await fetchAllFromFirestore();
      window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saved' }));
    } catch (err) {
      console.error("Error saving testimonial visual edit:", err);
    }
  };

  // Auto rotate on mobile (disabled in visual edit mode)
  // Dependency on activeIdx ensures interval resets when user manually swipes/clicks
  useEffect(() => {
    if (allTestimonials.length <= 1 || isEditMode) return;
    const timer = setInterval(() => {
      if (window.innerWidth < 768) {
        setActiveIdx(prev => (prev + 1) % allTestimonials.length);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [allTestimonials.length, isEditMode, activeIdx]);

  // Scroll to active on mobile (horizontal only, avoids vertical page scrolling)
  useEffect(() => {
    if (scrollRef.current && window.innerWidth < 768) {
      const container = scrollRef.current;
      const card = container.children[activeIdx] as HTMLElement;
      if (card) {
        const cardWidth = card.clientWidth;
        const containerWidth = container.clientWidth;
        const cardOffsetLeft = card.offsetLeft;
        const targetScrollLeft = cardOffsetLeft - (containerWidth - cardWidth) / 2;
        
        if (Math.abs(container.scrollLeft - targetScrollLeft) > 5) {
          container.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
        }
      }
    }
  }, [activeIdx]);

  // Listen to manual scrolling to update active idx and dot indicators
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || typeof window === 'undefined' || window.innerWidth >= 768) return;

    let isScrolling: any;
    const handleScroll = () => {
      window.clearTimeout(isScrolling);
      isScrolling = setTimeout(() => {
        const containerWidth = container.clientWidth;
        const containerCenter = container.scrollLeft + containerWidth / 2;
        
        let closestIdx = 0;
        let minDistance = Infinity;
        
        Array.from(container.children).forEach((child, idx) => {
          const card = child as HTMLElement;
          const cardCenter = card.offsetLeft + card.clientWidth / 2;
          const distance = Math.abs(containerCenter - cardCenter);
          if (distance < minDistance) {
            minDistance = distance;
            closestIdx = idx;
          }
        });
        
        setActiveIdx(closestIdx);
      }, 100);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.clearTimeout(isScrolling);
    };
  }, [allTestimonials.length]);

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={13}
        className={i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-100'}
      />
    ));

  return (
    <section
      id="testimonials"
      className="py-12 sm:py-16 relative overflow-hidden"
      style={{ background: 'var(--body-bg)' }}
    >
      {/* subtle grid background texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg,transparent,transparent 39px,#888 39px,#888 40px), repeating-linear-gradient(90deg,transparent,transparent 39px,#888 39px,#888 40px)',
        }}
      />

      <div className="w-full px-[5vw] max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <p
            className="text-xs font-bold uppercase tracking-[0.25em] mb-3 text-indigo-600 dark:text-indigo-400"
          >
            What people say
          </p>
          <h2
            className="font-outfit font-black text-3xl sm:text-4xl leading-tight tracking-tight"
            style={{ color: 'var(--nav-text-active)' }}
          >
            Client Reviews
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-500 dark:text-slate-400">
            Real feedback and comments from collaborators on delivered projects.
          </p>
        </div>

        {/* Cards Grid */}
        <div
          ref={scrollRef}
          className="relative flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-4 md:pb-0 scrollbar-hide pt-12"
        >
          {allTestimonials.map((t, idx) => {
            const isStatic = (t as any).circleBg !== undefined;
            const name = t.name;
            const company = (t as any).company || '';
            const role = (t as any).role || 'Client';
            const text = (t as any).text || '';
            const rating = t.rating ?? 5;
            const avatarUrl = t.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=250&auto=format&fit=crop';
            
            const circleBg = isStatic ? (t as any).circleBg : '#f1f5f9';
            const offsetClass = isStatic ? (t as any).offsetClass : (idx % 2 === 0 ? '-translate-x-2 -translate-y-2' : 'translate-x-2 -translate-y-2');

            return (
              <article
                key={t.id}
                className="flex flex-col shrink-0 w-[82vw] md:w-full snap-center rounded-[20px] p-5 sm:p-6 border relative transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group"
                style={{
                  background: 'var(--card-bg)',
                  borderColor: 'var(--border-color)',
                  boxShadow: '0 8px 24px -10px rgba(0,0,0,0.05)',
                }}
              >
                {/* Modern Avatar Offset Style - slightly smaller to reduce height */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-28 h-28 flex items-center justify-center">
                  {/* Larger Offset Background Circle */}
                  <div
                    className={`absolute w-[84px] h-[84px] rounded-full transition-transform duration-300 transform group-hover:scale-105 ${offsetClass}`}
                    style={{ backgroundColor: circleBg }}
                  />
                  {/* Portrait Avatar */}
                  <div className="w-20 h-20 rounded-full overflow-hidden border-[4px] border-white dark:border-slate-900 shadow-md z-10 group-hover:scale-105 transition-transform duration-300 relative flex items-center justify-center">
                    <img
                      src={avatarUrl}
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                    {isEditMode && (
                      <label className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center cursor-pointer text-white">
                        <Edit2 size={12} className="animate-pulse" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            if (!e.target.files || e.target.files.length === 0) return;
                            window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saving' }));
                            try {
                              const res = await uploadToCloudinary(e.target.files[0]);
                              const docId = t.id.startsWith('static-') ? t.id.replace('static-', 'testimonial-') : t.id;
                              
                              const docRef = doc(db, 'testimonials', docId);
                              const snap = await getDoc(docRef);

                              if (snap.exists()) {
                                await updateDoc(docRef, { avatarUrl: res.url });
                              } else {
                                const original = allTestimonials.find(item => item.id === t.id);
                                const newDoc = {
                                  id: docId,
                                  name: original?.name || '',
                                  role: (original as any)?.role || '',
                                  company: (original as any)?.company || '',
                                  text: original?.text || '',
                                  rating: original?.rating ?? 5,
                                  avatarUrl: res.url,
                                  createdAt: Date.now()
                                };
                                await setDoc(docRef, newDoc);
                              }
                              
                              await fetchAllFromFirestore();
                              window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saved' }));
                            } catch (err) {
                              console.error("Error uploading testimonial image:", err);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Double Quote Quote Marks */}
                <div className="mt-6 mb-2 text-left">
                  <span className="text-[36px] font-serif text-indigo-400/25 leading-none block select-none">“</span>
                </div>

                {/* Review Text */}
                <blockquote
                  contentEditable={isEditMode}
                  suppressContentEditableWarning
                  onBlur={(e) => handleTestimonialSave(t.id, 'text', e.currentTarget.textContent || '')}
                  className={`flex-grow text-[13px] sm:text-[13.5px] leading-relaxed mb-4 font-normal text-slate-600 dark:text-slate-300 text-left ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 p-0.5 rounded cursor-text' : ''}`}
                >
                  {text}
                </blockquote>

                {/* Stars Rating */}
                <div className="flex items-center gap-0.5 mb-3 justify-start">
                  {renderStars(rating)}
                </div>

                {/* Author Info */}
                <div
                  className="pt-4 border-t"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <p
                    contentEditable={isEditMode}
                    suppressContentEditableWarning
                    onBlur={(e) => handleTestimonialSave(t.id, 'name', e.currentTarget.textContent || '')}
                    className={`font-bold text-[14px] text-slate-800 dark:text-slate-100 leading-tight text-left ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text' : ''}`}
                  >
                    {name}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 text-left">
                    <span
                      contentEditable={isEditMode}
                      suppressContentEditableWarning
                      onBlur={(e) => handleTestimonialSave(t.id, 'role', e.currentTarget.textContent || '')}
                      className={isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-0.5 rounded cursor-text' : ''}
                    >
                      {role}
                    </span>
                    {' · '}
                    <span
                      contentEditable={isEditMode}
                      suppressContentEditableWarning
                      onBlur={(e) => handleTestimonialSave(t.id, 'company', e.currentTarget.textContent || '')}
                      className={isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-0.5 rounded cursor-text' : ''}
                    >
                      {company}
                    </span>
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        {/* Mobile dot indicators */}
        <div className="flex md:hidden items-center justify-center gap-1.5 mt-8">
          {allTestimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === activeIdx ? '20px' : '6px',
                height: '6px',
                background: i === activeIdx ? 'var(--nav-text-active)' : 'var(--border-color)',
              }}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
