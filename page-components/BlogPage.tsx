import React, { useState, useEffect } from 'react';
import Navbar from '../sections/Navbar';
import Footer from '../sections/Footer';
import { Calendar, User, ArrowRight, Sparkles, Loader2, Zap } from 'lucide-react';
// @ts-ignore
import { query, collection, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useNavigation } from '../context/NavigationContext';

const BlogPage: React.FC = () => {
  const { navigate } = useNavigation();
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'blog'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
        setAllPosts(data);
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  useEffect(() => {
    const handleUrlChange = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const query = searchParams.get('search') || '';
      setSearchQuery(query);
    };
    
    window.addEventListener('popstate', handleUrlChange);
    handleUrlChange();

    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      const results = allPosts.filter(post => 
        post.title?.toLowerCase().includes(lowercasedQuery) ||
        post.excerpt?.toLowerCase().includes(lowercasedQuery) ||
        post.tag?.toLowerCase().includes(lowercasedQuery) ||
        post.content?.toLowerCase().includes(lowercasedQuery)
      );
      setFilteredPosts(results);
    } else {
      setFilteredPosts(allPosts);
    }
  }, [searchQuery, allPosts]);

  if (loading) return (
    <div className="h-screen bg-slate-50 flex flex-col items-center justify-center">
       <Loader2 className="animate-spin text-indigo-600 mb-3" size={28} />
       <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Loading Articles...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Navbar />
      <div className="w-full px-[5vw] mx-auto pt-32 pb-20 relative z-10">
        <div className="mb-12 border-b border-slate-200 pb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
            Blog
          </h1>
          <p className="text-slate-500 text-sm sm:text-base font-normal max-w-xl">
            Writing about software engineering, database design, and building clean user interfaces.
          </p>
        </div>

        {searchQuery && (
          <div className="mb-8 p-4 bg-slate-100 border border-slate-200 rounded-lg">
            <h2 className="text-sm font-semibold text-slate-800">
              Search results for: <span className="font-normal text-slate-600">"{searchQuery}"</span>
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">{filteredPosts.length} article(s) found.</p>
          </div>
        )}

        {filteredPosts.length === 0 && !loading ? (
          <div className="py-16 px-6 text-center border border-slate-200 rounded-lg bg-white flex flex-col items-center">
             <p className="text-slate-500 font-semibold text-sm">
               {searchQuery ? 'No articles found matching your query.' : 'No articles available.'}
             </p>
             {searchQuery && (
                <button onClick={() => navigate('blog')} className="mt-4 bg-slate-900 text-white px-4 py-2 rounded-lg font-medium text-xs hover:bg-slate-800 transition-colors">
                     Clear Search
                </button>
             )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredPosts.map((post) => (
              <article 
                key={post.id} 
                className="group bg-white rounded-lg border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors cursor-pointer flex flex-col shadow-sm"
                onClick={() => navigate('blog-post', post.id)}
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-50 border-b border-slate-200 flex items-center justify-center">
                  <img src={post.imageUrl || 'https://images.unsplash.com/photo/1555066931-4365d14bab8c'} alt="" className="w-full h-full object-contain" />
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-2 text-xs text-slate-500">
                    <span className="font-medium text-indigo-600">{post.tag || 'Tech'}</span>
                    <span>•</span>
                    <span>{new Date(post.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  
                  <h3 className="text-slate-900 text-lg font-semibold mb-2 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">{post.title}</h3>
                  <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-4 line-clamp-2 font-normal">{post.excerpt}</p>
                  
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 mt-auto">
                    <span>Read article</span>
                    <ArrowRight size={14} className="transform group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default BlogPage;