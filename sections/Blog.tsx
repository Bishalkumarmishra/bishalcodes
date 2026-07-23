import React, { useState, useEffect, useRef } from 'react';
import { Clock, User, ArrowRight, Sparkles, Calendar, Loader2 } from 'lucide-react';
// @ts-ignore
import { query, collection, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useNavigation } from '../context/NavigationContext';

const Blog: React.FC = () => {
  const { navigate } = useNavigation();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const q = query(collection(db, 'blog'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
        setPosts(data);
      } catch (e) {
        console.warn("Failed to fetch blog posts:", e);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  // Mobile Auto-Slide Engine
  useEffect(() => {
    if (loading || posts.length <= 1) return;

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
    }, 3500);

    return () => clearInterval(interval);
  }, [loading, posts]);

  if (loading) return (
    <div className="py-24 bg-slate-50 flex flex-col items-center justify-center">
       <Loader2 className="animate-spin text-[#e52521] mb-3" size={28} />
       <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Loading Articles...</p>
    </div>
  );

  return (
    <section id="blog" className="py-10 sm:py-14 bg-slate-50 relative overflow-hidden border-t border-slate-200/60">
      <div className="w-full px-[5vw] mx-auto relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-slate-900 dark:text-white font-semibold text-xs uppercase tracking-wider">Articles</p>
            </div>
            <h2 className="text-slate-900 text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
              Latest Articles
            </h2>
          </div>
          
          <button 
            onClick={() => navigate('blog')}
            className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-800 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm shrink-0"
          >
             <span>View Archive</span> <ArrowRight size={14} className="text-slate-400" />
          </button>
        </div>

        <div 
          ref={scrollRef}
          className="flex md:grid md:grid-cols-2 lg:grid-cols-3 overflow-x-auto md:overflow-x-visible gap-5 snap-x snap-mandatory scrollbar-hide pb-4"
        >
          {posts.slice(0, 3).map((post, i) => (
            <article key={i} className="group bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col h-full hover:border-slate-950 dark:hover:border-white transition-all duration-300 hover:shadow-sm shrink-0 w-[82vw] md:w-full snap-center">
              <div className="relative aspect-[16/9] overflow-hidden bg-slate-50 border-b border-slate-200 flex items-center justify-center">
                <img src={post.imageUrl || post.image} alt={post.title} className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-500" />
                <span className="absolute top-3 left-3 bg-slate-950 dark:bg-white px-2 py-0.5 rounded text-[8px] font-bold text-white dark:text-black uppercase tracking-wider shadow-sm border border-transparent dark:border-slate-800">{post.tag}</span>
              </div>
              <div className="p-5 flex flex-col flex-grow">
                <div className="flex items-center gap-2 text-[9px] font-semibold text-slate-400 mb-2.5 uppercase tracking-wider">
                  <div className="flex items-center gap-1"><Calendar size={10} /> {post.date || new Date(post.createdAt).toLocaleDateString()}</div>
                  <div className="w-1 h-1 bg-slate-200 rounded-full" />
                  <div className="flex items-center gap-1"><User size={10} /> {post.author || 'Bishal'}</div>
                </div>
                <h3 className="text-slate-900 text-base font-bold mb-1.5 group-hover:text-slate-950 dark:group-hover:text-white transition-colors leading-snug line-clamp-2">{post.title}</h3>
                <p className="text-slate-500 text-xs sm:text-sm mb-4 leading-relaxed font-normal line-clamp-2 flex-grow">{post.excerpt}</p>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                   <button 
                    onClick={() => navigate('blog-post', post.id)} 
                    className="inline-flex items-center gap-1.5 text-slate-700 hover:text-slate-950 dark:hover:text-white transition-colors"
                   >
                     <span>Read Article</span> <ArrowRight size={12} />
                   </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Blog;
