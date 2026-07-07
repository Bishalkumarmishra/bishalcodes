import React, { useState, useEffect, useRef } from 'react';
import { Star, Loader2, MessageSquare } from 'lucide-react';
// @ts-ignore
import { query, collection, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Testimonial } from '../types';

const Testimonials: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const q = query(collection(db, 'testimonials'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as any),
        } as Testimonial));
        setTestimonials(data);
      } catch (error) {
        console.warn("Error fetching testimonials:", error);
        setTestimonials([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  // Mobile Auto-Slide Engine
  useEffect(() => {
    if (loading || testimonials.length <= 1) return;
    const interval = setInterval(() => {
      if (scrollRef.current && window.innerWidth < 768) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const cardWidth = scrollRef.current.firstElementChild?.clientWidth || clientWidth;
        const gap = 20;
        
        let nextScroll = scrollLeft + cardWidth + gap;
        if (nextScroll >= scrollWidth - clientWidth) {
          nextScroll = 0;
        }

        scrollRef.current.scrollTo({
          left: nextScroll,
          behavior: 'smooth'
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [loading, testimonials]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={14} className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
    ));
  };
  
  if (loading) {
    return (
        <section className="py-12 bg-white flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600 mb-3" size={28} />
            <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Loading Feedback...</p>
        </section>
    );
  }

  return (
    <section id="testimonials" className="py-10 sm:py-14 bg-white relative overflow-hidden">
      <div className="w-full px-[5vw] mx-auto relative z-10 flex flex-col items-center">
        <div className="text-center mb-12 max-w-2xl">
          <h2 className="text-slate-900 text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            Client Feedback
          </h2>
          <p className="text-slate-500 text-sm sm:text-base mt-2 font-normal">
            Feedback and comments from collaborators on delivered projects.
          </p>
        </div>
        
        {testimonials.length === 0 ? (
           <div className="py-16 px-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white w-full max-w-4xl">
             <MessageSquare className="text-slate-300 opacity-60 mb-4 mx-auto" size={48} />
             <p className="text-slate-400 font-bold text-lg uppercase tracking-wider">
               No Feedback Available
             </p>
             <p className="text-slate-500 text-xs sm:text-sm mt-2">
                Feedback is being compiled and will be deployed shortly.
             </p>
          </div>
        ) : (
          <div 
            ref={scrollRef}
            className="flex md:grid md:grid-cols-2 lg:grid-cols-3 overflow-x-auto md:overflow-x-visible gap-5 snap-x snap-mandatory scrollbar-hide pb-4 w-full max-w-6xl"
          >
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col shrink-0 w-[85vw] md:w-full snap-center shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-1.5 mb-3.5">
                  {renderStars(testimonial.rating)}
                </div>
                <blockquote className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal mb-6 flex-grow">
                  "{testimonial.text}"
                </blockquote>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-auto">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center overflow-hidden font-bold text-sm shrink-0 border border-indigo-100">
                    {testimonial.avatarUrl ? (
                      <img src={testimonial.avatarUrl} alt={testimonial.name} className="w-full h-full object-cover" />
                    ) : (
                      testimonial.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm leading-tight">{testimonial.name}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{testimonial.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;
