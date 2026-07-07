import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, MessageSquare } from 'lucide-react';
// @ts-ignore
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';

const Skills: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('Web Design');
  const [aboutData, setAboutData] = useState({
    experience: '3+ Years',
    bio: 'I design and build tailored web applications that combine clean code with intuitive user experiences to solve real business challenges.',
    whatsappUrl: 'https://wa.me/9779828701575'
  });

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
            whatsappUrl: data.whatsappUrl || 'https://wa.me/9779828701575'
          });
        }
      } catch (err) {
        console.warn("Error fetching about settings in Skills component:", err);
      }
    };
    fetchAboutData();
    return () => { isMounted = false; };
  }, []);

  const categories = [
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
  ];

  const techIcons = [
    'https://rahuljha.dev/assets/avator/webimg/pro/tech/58482ec0cef1014c0b5e4a70.png',
    'https://rahuljha.dev/assets/avator/webimg/pro/tech/3.png',
    'https://rahuljha.dev/assets/avator/webimg/pro/tech/4.png',
    'https://rahuljha.dev/assets/avator/webimg/pro/tech/5.png',
    'https://rahuljha.dev/assets/avator/webimg/pro/tech/6.png',
    'https://rahuljha.dev/assets/avator/webimg/pro/tech/7.png',
    'https://rahuljha.dev/assets/avator/webimg/pro/tech/8.png',
    'https://rahuljha.dev/assets/avator/webimg/pro/tech/2.png'
  ];

  return (
    <section id="skills" className="py-10 sm:py-14 bg-white relative overflow-hidden">
      <div className="w-full px-[5vw] mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          
          <div className="w-full lg:w-1/2 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <p className="text-slate-900 dark:text-white font-semibold text-xs uppercase tracking-wider">Expertise</p>
            </div>

            <h2 className="text-slate-900 text-3xl sm:text-4xl font-bold mb-6 tracking-tight">
              {aboutData.experience} of Experience
            </h2>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-8 font-normal max-w-xl">
              {aboutData.bio}
            </p>

            {aboutData.whatsappUrl && (
              <a 
                href={aboutData.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors w-fit shadow-sm mb-10"
              >
                <span>WhatsApp Me</span>
                <MessageSquare size={16} className="fill-current" />
              </a>
            )}


          </div>

          <div className="w-full lg:w-1/2 space-y-4 flex flex-col justify-center">
            {categories.map((cat) => (
              <div 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`cursor-pointer rounded-xl p-6 transition-all duration-300 border ${
                  activeCategory === cat.id 
                  ? 'bg-slate-50 border-slate-950 dark:border-white shadow-sm' 
                  : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className={`text-base sm:text-lg font-bold transition-colors ${activeCategory === cat.id ? 'text-slate-950 dark:text-white' : 'text-slate-800'}`}>
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

                {activeCategory === cat.id && (
                  <div className="mt-4">
                    <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal">
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