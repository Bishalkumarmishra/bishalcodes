import React, { useState, useEffect } from 'react';
// @ts-ignore
import { getDoc, doc, updateDoc, increment, collection, addDoc, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import Navbar from '../sections/Navbar';
import Footer from '../sections/Footer';
import { 
  Calendar, Loader2, User, ArrowLeft, Clock, Eye, Star, MessageSquare, Send, Twitter, Linkedin,
  Copy, Check, Heart, Flame, Lightbulb, Sparkles, Edit2
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface BlogPostPageProps {
  id: string | null;
}

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Failed to copy code: ", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute right-2.5 top-2.5 p-1.5 rounded-lg bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white opacity-0 group-hover/code-block:opacity-100 transition-all duration-200 z-10 shadow-sm"
      title="Copy code"
    >
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
    </button>
  );
};

const BlogPostPage: React.FC<BlogPostPageProps> = ({ id }) => {
  const { navigate } = useNavigation();
  const [post, setPost] = useState<any>(null);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [commentForm, setCommentForm] = useState({ name: '', text: '', rating: 5 });
  const [submitting, setSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkMode = () => {
      setIsEditMode(localStorage.getItem('liveEditMode') === 'true');
    };
    checkMode();
    window.addEventListener('liveEditToggle', checkMode);
    return () => window.removeEventListener('liveEditToggle', checkMode);
  }, []);
  const [readTime, setReadTime] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New features state
  const [scrollProgress, setScrollProgress] = useState(0);
  const [reactions, setReactions] = useState<Record<string, number>>({ claps: 0, hearts: 0, fire: 0, insightful: 0 });
  const [userReactions, setUserReactions] = useState<Record<string, number>>({ claps: 0, hearts: 0, fire: 0, insightful: 0 });
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState<{ success: boolean; message: string } | null>(null);
  
  const contentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll progress listener
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Load local reactions
    if (id) {
      const saved = localStorage.getItem(`reactions_${id}`);
      if (saved) {
        try {
          setUserReactions(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      } else {
        setUserReactions({ claps: 0, hearts: 0, fire: 0, insightful: 0 });
      }
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchPostAndData = async () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setLoading(true);
      try {
        const docRef = doc(db, 'blog', id);
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
          const postData = snap.data() as any;
          setPost(postData);
          setReactions(postData.reactions || { claps: 0, hearts: 0, fire: 0, insightful: 0 });

          if (postData.content) {
            const wordsPerMinute = 200;
            const noOfWords = postData.content.split(/\s/g).length;
            setReadTime(Math.ceil(noOfWords / wordsPerMinute));
          }

          try {
            await updateDoc(docRef, { views: increment(1) });
            setPost((prev: any) => prev ? { ...prev, views: (prev.views || 0) + 1 } : prev);
          } catch (viewErr) {
            console.warn("Failed to increment views:", viewErr);
          }
          
          const qRecent = query(collection(db, 'blog'), orderBy('createdAt', 'desc'), limit(5));
          const rSnap = await getDocs(qRecent);
          setRecentPosts(rSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })).filter(p => p.id !== id).slice(0, 4));
          
          const qComments = query(collection(db, 'blog', id, 'comments'), orderBy('timestamp', 'desc'));
          const cSnap = await getDocs(qComments);
          setComments(cSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
        }
      } catch (err) {
        console.warn("Error fetching article details:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPostAndData();
  }, [id]);

  useEffect(() => {
    // Manually execute any <script> tags injected via raw HTML in the blog post content
    if (contentRef.current && post?.content) {
      const scripts = contentRef.current.querySelectorAll('script');
      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
        newScript.appendChild(document.createTextNode(oldScript.innerHTML));
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
    }
  }, [post?.content]);

  const handleReact = async (type: string) => {
    if (!id) return;
    const currentCount = userReactions[type] || 0;
    const limit = type === 'claps' ? 10 : 1;
    if (currentCount >= limit) return;

    const nextUserReactions = { ...userReactions, [type]: currentCount + 1 };
    setUserReactions(nextUserReactions);
    localStorage.setItem(`reactions_${id}`, JSON.stringify(nextUserReactions));

    try {
      const docRef = doc(db, 'blog', id);
      await updateDoc(docRef, {
        [`reactions.${type}`]: increment(1)
      });
      setReactions(prev => ({
        ...prev,
        [type]: (prev[type] || 0) + 1
      }));
    } catch (err) {
      console.warn("Failed to update reaction:", err);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSubmitting(true);
    setNewsletterStatus(null);
    try {
      const emailVal = newsletterEmail.trim();
      await addDoc(collection(db, 'newsletter'), {
        email: emailVal,
        timestamp: Date.now()
      });
      
      // Trigger welcome email notification
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'newsletter-welcome',
            data: { email: emailVal }
          })
        });
      } catch (mailErr) {
        console.warn("Welcome email trigger failed:", mailErr);
      }

      setNewsletterStatus({ success: true, message: 'Subscribed successfully!' });
      setNewsletterEmail('');
    } catch (err) {
      console.error("Newsletter subscription failed:", err);
      setNewsletterStatus({ success: false, message: 'Failed to subscribe. Please try again.' });
    } finally {
      setNewsletterSubmitting(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentForm.name || !commentForm.text) return;
    setSubmitting(true);
    try {
      const data = { ...commentForm, timestamp: Date.now() };
      await addDoc(collection(db, 'blog', id, 'comments'), data);
      setComments([data, ...comments]);
      setCommentForm({ name: '', text: '', rating: 5 });
    } catch (err) {
      alert("Failed to submit comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const sharePost = (platform: string) => {
    const url = window.location.href;
    const text = `Check out this article: ${post.title}`;
    let shareUrl = '';
    if (platform === 'twitter') shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    if (platform === 'linkedin') shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    if (platform === 'whatsapp') shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
    window.open(shareUrl, '_blank');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('blog', undefined, { search: searchQuery.trim() });
    }
  };

  if (loading && id) {
    return (
      <div className="h-screen bg-slate-50 flex flex-col items-center justify-center">
         <Loader2 className="animate-spin text-[#e52521] mb-3" size={28} />
         <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Loading Article...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
         <h1 className="text-slate-900 text-2xl font-bold mb-4 tracking-tight">Article Not Found</h1>
         <button onClick={() => navigate('blog')} className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold text-xs hover:bg-slate-800 transition-colors shadow-sm">
           <ArrowLeft size={16} /> Return to Blogs
         </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <div 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-slate-950 via-[#e52521] to-[#e52521] z-[100] transition-all duration-75"
        style={{ width: `${scrollProgress}%` }}
      />
      <Navbar />
      
      <main className="pt-32 pb-20">
        <div className="w-full px-0 sm:px-[5vw] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-0 sm:gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2">
            <article className="bg-white sm:rounded-lg sm:border sm:border-slate-200 p-0 sm:p-6 sm:shadow-sm">
              {/* Breadcrumb */}
              <div className="mb-6 text-xs text-slate-500 flex items-center gap-1.5 flex-wrap px-4 sm:px-0">
                <span onClick={() => navigate('home')} className="cursor-pointer hover:text-[#d01f1c] transition-colors">Home</span>
                <span>/</span>
                <span onClick={() => navigate('blog')} className="cursor-pointer hover:text-[#d01f1c] transition-colors">Blog</span>
                <span>/</span>
                <span className="text-slate-700 truncate max-w-[200px] sm:max-w-none">{post.title}</span>
              </div>

              <h1 
                contentEditable={isEditMode}
                suppressContentEditableWarning
                onBlur={async (e) => {
                  const val = e.currentTarget.textContent || '';
                  if (val === post.title) return;
                  window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saving' }));
                  await updateDoc(doc(db, 'blog', id!), { title: val });
                  setPost(prev => ({ ...prev, title: val }));
                  window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saved' }));
                }}
                onFocus={(e) => {
                  if (isEditMode) {
                    window.dispatchEvent(new CustomEvent('activeEditableFocus', { detail: e.currentTarget }));
                  }
                }}
                onClick={(e) => {
                  if (isEditMode) {
                    window.dispatchEvent(new CustomEvent('activeEditableFocus', { detail: e.currentTarget }));
                  }
                }}
                className={`text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-4 px-4 sm:px-0 text-left ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 p-0.5 rounded cursor-text' : ''}`}
              >
                {post.title}
              </h1>

              {/* Author profile and publish info */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 border-b border-slate-200 pb-6 mb-6 px-4 sm:px-0 text-left select-none">
                <span className="font-semibold text-slate-800">
                  <span
                    contentEditable={isEditMode}
                    suppressContentEditableWarning
                    onBlur={async (e) => {
                      const val = e.currentTarget.textContent || '';
                      if (val === post.author) return;
                      window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saving' }));
                      await updateDoc(doc(db, 'blog', id!), { author: val });
                      setPost(prev => ({ ...prev, author: val }));
                      window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saved' }));
                    }}
                    onFocus={(e) => {
                      if (isEditMode) {
                        window.dispatchEvent(new CustomEvent('activeEditableFocus', { detail: e.currentTarget }));
                      }
                    }}
                    onClick={(e) => {
                      if (isEditMode) {
                        window.dispatchEvent(new CustomEvent('activeEditableFocus', { detail: e.currentTarget }));
                      }
                    }}
                    className={isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text' : ''}
                  >
                    {post.author || 'Bishal Mishra'}
                  </span>
                </span>
                <span>•</span>
                <span>{new Date(post.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span>•</span>
                <span className="text-[#e52521] font-medium">
                  <span
                    contentEditable={isEditMode}
                    suppressContentEditableWarning
                    onBlur={async (e) => {
                      const val = e.currentTarget.textContent || '';
                      if (val === post.tag) return;
                      window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saving' }));
                      await updateDoc(doc(db, 'blog', id!), { tag: val });
                      setPost(prev => ({ ...prev, tag: val }));
                      window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saved' }));
                    }}
                    onFocus={(e) => {
                      if (isEditMode) {
                        window.dispatchEvent(new CustomEvent('activeEditableFocus', { detail: e.currentTarget }));
                      }
                    }}
                    onClick={(e) => {
                      if (isEditMode) {
                        window.dispatchEvent(new CustomEvent('activeEditableFocus', { detail: e.currentTarget }));
                      }
                    }}
                    className={isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text' : ''}
                  >
                    {post.tag || 'Tech'}
                  </span>
                </span>
                <span>•</span>
                <span>{readTime} min read</span>
                {post.views > 0 && (
                  <>
                    <span>•</span>
                    <span>{post.views} views</span>
                  </>
                )}
              </div>
              
              <figure className="mb-6 mx-4 sm:mx-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center h-[260px] sm:h-[400px] relative group/figure select-none">
                <img src={post.imageUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c'} className="w-full h-full object-cover" alt={post.title} />
                {isEditMode && (
                  <label className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center cursor-pointer text-white font-bold text-[11px] uppercase tracking-wider gap-1.5 transition-all">
                    <Edit2 size={18} className="animate-pulse" />
                    <span>Upload Cover Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        if (!e.target.files || e.target.files.length === 0) return;
                        window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saving' }));
                        try {
                          const { uploadToCloudinary } = await import('../services/cloudinary');
                          const res = await uploadToCloudinary(e.target.files[0]);
                          await updateDoc(doc(db, 'blog', id!), { imageUrl: res.url });
                          setPost(prev => ({ ...prev, imageUrl: res.url }));
                          window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saved' }));
                        } catch (err) {
                          console.error("Error uploading cover photo:", err);
                        }
                      }}
                    />
                  </label>
                )}
              </figure>

              <div ref={contentRef} className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-sm sm:text-base font-normal px-4 sm:px-0 blog-post-content text-left">
                {isEditMode ? (
                  <textarea
                    value={post.content || ''}
                    onChange={(e) => setPost(prev => ({ ...prev, content: e.target.value }))}
                    onBlur={async (e) => {
                      if (e.target.value === post.content) return;
                      window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saving' }));
                      try {
                        await updateDoc(doc(db, 'blog', id!), { content: e.target.value });
                        window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saved' }));
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="w-full min-h-[350px] p-4 font-mono text-xs border-2 border-dashed border-amber-500/80 rounded-lg outline-none bg-slate-50 text-slate-800 focus:bg-white"
                    placeholder="Write your blog post in Markdown format here..."
                  />
                ) : (
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      pre({ children, ...props }: any) {
                        const codeElement = React.Children.toArray(children).find(
                          (child: any) => child.type === 'code' || (child.props && child.props.className)
                        ) as any;
                        const codeText = codeElement ? codeElement.props.children : '';
                        return (
                          <div className="relative group/code-block my-6">
                            <CopyButton text={String(codeText).trim()} />
                            <pre {...props}>
                              {children}
                            </pre>
                          </div>
                        );
                      }
                    } as any}
                  >
                    {post.content}
                  </ReactMarkdown>
                )}
              </div>
            </article>

            {/* Sharing links */}
            <div className="bg-white sm:rounded-xl sm:border sm:border-slate-200 p-6 mt-6 sm:shadow-sm border-t border-slate-200">
              <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-4">Share Article</h3>
              <div className="flex flex-wrap gap-2.5">
                <button onClick={() => sharePost('whatsapp')} className="flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-slate-100 hover:text-slate-800 transition-colors shadow-sm"><MessageSquare size={14} /> WhatsApp</button>
                <button onClick={() => sharePost('twitter')} className="flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-slate-100 hover:text-slate-800 transition-colors shadow-sm"><Twitter size={14} /> Twitter</button>
                <button onClick={() => sharePost('linkedin')} className="flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-slate-100 hover:text-slate-800 transition-colors shadow-sm"><Linkedin size={14} /> LinkedIn</button>
              </div>
            </div>

            {/* Reactions section */}
            <div className="bg-white sm:rounded-xl sm:border sm:border-slate-200 p-6 mt-6 sm:shadow-sm border-t border-slate-200">
              <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-4">React to this Article</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { type: 'claps', label: '👏 Clap', icon: Sparkles, count: reactions.claps || 0, activeColor: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100', userLimit: 10 },
                  { type: 'hearts', label: '❤️ Love', icon: Heart, count: reactions.hearts || 0, activeColor: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100', userLimit: 1 },
                  { type: 'fire', label: '🔥 Fire', icon: Flame, count: reactions.fire || 0, activeColor: 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100', userLimit: 1 },
                  { type: 'insightful', label: '💡 Brainy', icon: Lightbulb, count: reactions.insightful || 0, activeColor: 'bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100', userLimit: 1 }
                ].map(item => {
                  const userCount = userReactions[item.type] || 0;
                  const reachedLimit = userCount >= item.userLimit;
                  return (
                    <button
                      key={item.type}
                      onClick={() => handleReact(item.type)}
                      disabled={reachedLimit}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-xs font-semibold transition-all duration-200 ${
                        userCount > 0 
                          ? item.activeColor 
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                      } ${reachedLimit ? 'opacity-80 cursor-not-allowed' : 'active:scale-95'}`}
                    >
                      <span className="flex items-center gap-1.5">
                        <item.icon size={14} className={userCount > 0 ? "fill-current animate-bounce" : ""} />
                        <span>{item.label}</span>
                      </span>
                      <span className="bg-black/5 px-2 py-0.5 rounded text-[10px] font-bold">
                        {item.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Feedback section */}
            <div className="pt-12 mt-12 border-t border-slate-200" id="feedback">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight mb-6 text-slate-900">Comments & Feedback</h2>
              
              <form onSubmit={handleCommentSubmit} className="bg-white border border-slate-200 p-6 rounded-lg mb-10 space-y-4 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Your Name</label>
                    <input required type="text" value={commentForm.name} onChange={e => setCommentForm({...commentForm, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg text-slate-900 outline-none focus:border-[#e52521] transition-colors text-sm font-normal"/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Rating</label>
                    <div className="flex gap-1 bg-slate-50 w-fit px-2.5 py-1.5 rounded-lg border border-slate-200">
                      {[1,2,3,4,5].map(star => (
                        <button key={star} type="button" onClick={() => setCommentForm({...commentForm, rating: star})} className="transition-transform active:scale-95">
                          <Star size={16} className={star <= commentForm.rating ? "text-amber-400 fill-amber-400" : "text-slate-300"} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Message</label>
                  <textarea required rows={4} value={commentForm.text} onChange={e => setCommentForm({...commentForm, text: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-lg text-slate-900 outline-none focus:border-[#e52521] transition-colors resize-none text-sm font-normal"/>
                </div>
                <button disabled={submitting} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : <><Send size={14} /> Submit Comment</>}
                </button>
              </form>

              <div className="space-y-4">
                {comments.map((c, i) => (
                  <div key={i} className="bg-white border border-slate-200 p-5 rounded-lg flex gap-4 items-start shadow-sm">
                    <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-[#e52521] font-bold text-sm shrink-0">
                      {c.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-2 gap-2">
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-800 truncate">{c.name}</h4>
                          <p className="text-slate-400 text-[9px] font-semibold mt-0.5">{new Date(c.timestamp).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-0.5 shrink-0">
                          {[...Array(5)].map((_, j) => (
                            <Star key={j} size={10} className={j < (c.rating || 5) ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-600 font-normal text-xs sm:text-sm leading-relaxed break-words">"{c.text}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
 
          {/* Sidebar */}
          <aside className="lg:col-span-1 px-4 sm:px-0">
            <div className="space-y-6 lg:sticky lg:top-32">
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Search</h3>
                <form onSubmit={handleSearch} className="relative">
                  <input 
                    type="text" 
                    placeholder="Search blogs..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-xs font-normal outline-none focus:border-[#e52521] transition-colors"
                  />
                  <button type="submit" aria-label="Search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#d01f1c] transition-colors">
                    <span className="block w-4 h-4 bg-[url('https://api.iconify.design/lucide:search.svg')] bg-contain bg-no-repeat opacity-50 hover:opacity-100 transition-opacity" />
                  </button>
                </form>
              </div>

              {/* Newsletter subscription widget */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-950 via-[#e52521] to-[#e52521]" />
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Newsletter</h3>
                <p className="text-slate-500 text-xs leading-relaxed mb-4">
                  Get the latest tech, web design, and digital agency updates straight to your inbox.
                </p>
                <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                  <input 
                    required
                    type="email" 
                    placeholder="Your email address" 
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-normal outline-none focus:border-[#e52521] transition-colors"
                  />
                  <button 
                    type="submit" 
                    disabled={newsletterSubmitting}
                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white py-2 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1 shadow-sm"
                  >
                    {newsletterSubmitting ? <Loader2 className="animate-spin" size={12} /> : "Subscribe"}
                  </button>
                </form>
                {newsletterStatus && (
                  <p className={`text-[10px] font-semibold mt-2.5 ${newsletterStatus.success ? 'text-green-600' : 'text-red-500'}`}>
                    {newsletterStatus.message}
                  </p>
                )}
              </div>

              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Posts</h3>
                <div className="space-y-3">
                  {recentPosts.map(rp => (
                    <div key={rp.id} onClick={() => navigate('blog-post', rp.id)} className="cursor-pointer group flex items-center gap-3">
                      <img src={rp.imageUrl} alt={rp.title} className="w-14 h-14 object-cover rounded-lg bg-slate-100 shrink-0 border border-slate-200"/>
                      <div className="min-w-0 flex-grow">
                        <span className="text-[9px] font-semibold text-[#e52521] mb-1 inline-block uppercase">{rp.tag || 'Tech'}</span>
                        <h4 className="text-slate-800 font-semibold text-xs leading-snug group-hover:text-[#e52521] transition-colors line-clamp-2">{rp.title}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPostPage;
