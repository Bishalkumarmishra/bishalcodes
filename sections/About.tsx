import React, { useState, useEffect } from 'react';
import { Mail, Phone, MessageSquare, Briefcase, Loader2, ChevronUp, ChevronDown, CheckCircle2, User } from 'lucide-react';
// @ts-ignore
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';

const About: React.FC = () => {
  const [aboutData, setAboutData] = useState({
    title: 'Full-Stack Web Architect',
    experience: '3+ Years',
    bio: "Hi! I'm Bishal, a full-stack developer based in Nepal. I've spent the past 3+ years designing and building web solutions that bridge the gap between clean, scalable backends and fast, intuitive user interfaces. I love taking complex business ideas and turning them into solid, maintainable code.\n\nTo me, engineering isn't just about using the latest framework; it's about solving real-world problems, optimizing for the user experience, and ensuring that everything is secure, fast, and easy to maintain. I work primarily with Next.js, React, Node.js, and cloud ecosystems, building everything from custom APIs to full e-commerce architectures.",
    phone: '+977 9828701575',
    email: 'developer@bishalcodes.com',
    imageUrl: 'https://ik.imagekit.io/bishalc/bishal.png',
    images: [] as string[],
    projectsCompleted: '300+',
    whatsappUrl: 'https://wa.me/9779828701575'
  });
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchAboutData = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'about'));
        if (snap.exists() && isMounted) {
          const data = snap.data();
          setAboutData({
            title: data.title || 'Full-Stack Web Architect',
            experience: data.experience || '3+ Years',
            bio: data.bio || "Hi! I'm Bishal, a full-stack developer based in Nepal. I've spent the past 3+ years designing and building web solutions that bridge the gap between clean, scalable backends and fast, intuitive user interfaces. I love taking complex business ideas and turning them into solid, maintainable code.\n\nTo me, engineering isn't just about using the latest framework; it's about solving real-world problems, optimizing for the user experience, and ensuring that everything is secure, fast, and easy to maintain. I work primarily with Next.js, React, Node.js, and cloud ecosystems, building everything from custom APIs to full e-commerce architectures.",
            phone: data.phone || '+977 9828701575',
            email: data.email || 'developer@bishalcodes.com',
            imageUrl: data.imageUrl || 'https://ik.imagekit.io/bishalc/bishal.png',
            images: data.images || [],
            projectsCompleted: data.projectsCompleted || '300+',
            whatsappUrl: data.whatsappUrl || 'https://wa.me/9779828701575'
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

  const allImages = aboutData.images.length > 0
    ? aboutData.images
    : [aboutData.imageUrl];

  useEffect(() => {
    if (allImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % allImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [allImages.length]);

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % allImages.length);
  };

  if (loading) {
    return (
      <section id="about" className="py-10 sm:py-14 bg-slate-50 relative overflow-hidden flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={24} />
      </section>
    );
  }

  return (
    <section id="about" className="py-14 sm:py-20 bg-gradient-to-br from-slate-50 via-white to-slate-50/50 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full px-[5vw] mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
          
          <div className="w-full lg:w-1/2 flex justify-center items-center">
            <div className="relative max-w-[340px] sm:max-w-[360px] w-full aspect-[4/5] group">
              <div className="absolute inset-0 border-2 border-indigo-100 rounded-3xl translate-x-4 translate-y-4 -z-10 transition-transform duration-500 group-hover:translate-x-2 group-hover:translate-y-2 hidden sm:block" />
              
              <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200/60 shadow-md">
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

                {allImages.length > 1 && (
                  <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
                    <button
                      onClick={goToPrev}
                      className="p-1 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 transition-all active:scale-95 outline-none"
                      aria-label="Previous image"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <div className="flex items-center gap-1">
                      {allImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentSlide(idx)}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${
                            idx === currentSlide ? 'bg-white w-3' : 'bg-white/50 hover:bg-white/70'
                          }`}
                          aria-label={`Go to image ${idx + 1}`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={goToNext}
                      className="p-1 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 transition-all active:scale-95 outline-none"
                      aria-label="Next image"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-2 mb-4">
                <User size={16} className="text-indigo-600 shrink-0" />
                <p className="text-indigo-600 font-bold text-xs uppercase tracking-widest leading-none">{aboutData.title || 'Full-Stack Web Architect'}</p>
              </div>

              <h2 className="text-slate-900 text-3xl sm:text-4xl font-extrabold mb-6 tracking-tight font-outfit">
                About Me
              </h2>

              <div className="text-slate-600 text-sm sm:text-base leading-relaxed mb-8 font-normal space-y-4">
                {aboutData.bio.split('\n\n').map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 border-t border-slate-100 pt-6">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Clean Code</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Scalable & robust logic</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Fast Execution</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Snap-fast load speeds</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">User-First</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Polished UX/UI systems</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl hover:border-indigo-100 hover:bg-indigo-50/5 transition-all duration-300">
                  <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit">{aboutData.projectsCompleted}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Projects Completed</p>
                </div>
                <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl hover:border-indigo-100 hover:bg-indigo-50/5 transition-all duration-300">
                  <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit">{aboutData.experience}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Experience</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 border-t border-slate-100 pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 border border-slate-200/60 shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Email</p>
                    <a href={`mailto:${aboutData.email}`} className="text-slate-850 font-semibold text-xs sm:text-sm hover:text-indigo-650 transition-colors break-all">
                      {aboutData.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 border border-slate-200/60 shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Mobile</p>
                    <a href={`tel:${aboutData.phone}`} className="text-slate-850 font-semibold text-xs sm:text-sm hover:text-indigo-650 transition-colors">
                      {aboutData.phone}
                    </a>
                  </div>
                </div>
              </div>

              {aboutData.whatsappUrl && (
                <a 
                  href={aboutData.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-sm hover:shadow-emerald-600/10 active:scale-95"
                >
                  <span>WhatsApp Me</span>
                  <MessageSquare size={16} className="fill-current" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;