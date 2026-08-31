import React, { useState, useEffect, useMemo } from 'react';
import { ExternalLink, Github, ArrowUpRight, Loader2, Sparkles, Layout } from 'lucide-react';
// @ts-ignore
import { query, collection, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Project } from '../types';
import { useNavigation } from '../context/NavigationContext';

const FALLBACK_IMAGE_URL = 'https://via.placeholder.com/600x250?text=Project+Image';

const Projects: React.FC = () => {
  const { navigate } = useNavigation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const fetchProjects = async () => {
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
        
        setProjects(data);
        
      } catch (error) {
        console.warn("Error fetching projects:", error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    projects.forEach(p => {
      if (Array.isArray(p.techStack)) {
        p.techStack.forEach(t => {
          if (t) tagSet.add(t.trim());
        });
      }
    });
    return ['All', ...Array.from(tagSet)];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesTag = selectedTag === 'All' || (project.techStack || []).some(t => t.trim().toLowerCase() === selectedTag.toLowerCase());
      const matchesSearch = 
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.techStack || []).some(tech => tech.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesTag && matchesSearch;
    });
  }, [projects, selectedTag, searchQuery]);


  return (
    <section id="projects" className="py-10 sm:py-14 bg-white relative overflow-hidden">
      {/* Schema.org JSON-LD Structured Data for Google Search Indexing */}
      {projects.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": "Bishal Codes Projects & Applications Showcase",
              "description": "Featured applications, digital tools, and software projects developed by Bishal Mishra.",
              "numberOfItems": projects.length,
              "itemListElement": projects.map((p, idx) => ({
                "@type": "ListItem",
                "position": idx + 1,
                "item": {
                  "@type": "SoftwareApplication",
                  "name": p.title,
                  "description": p.seoDescription || p.description,
                  "url": p.liveUrl || `https://bishalcodes.com/projects`,
                  "image": p.images?.[0]?.url || 'https://bishalcodes.com/logo.png',
                  "applicationCategory": "DeveloperApplication",
                  "operatingSystem": "Web, Android, iOS",
                  "author": {
                    "@type": "Person",
                    "name": "Bishal Mishra",
                    "url": "https://bishalcodes.com"
                  }
                }
              }))
            })
          }}
        />
      )}

      <div className="w-full px-[5vw] relative z-10">
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[#e52521] font-semibold uppercase tracking-wider text-[10px]">Showcase</p>
          </div>
          <h2 className="text-slate-900 text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            All Projects
          </h2>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed mt-2 font-normal">
            A comprehensive list of application projects, digital tools, and frontend deployments.
          </p>
        </div>

        {/* Search and Filters */}
        {projects.length > 0 && (
          <div className="mb-10 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-grow max-w-md">
              <input 
                type="text" 
                placeholder="Search projects by title, description or technology..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-4 pr-10 text-xs font-normal outline-none focus:border-[#e52521] transition-colors"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <span className="block w-4 h-4 bg-[url('https://api.iconify.design/lucide:search.svg')] bg-contain bg-no-repeat opacity-45" />
              </span>
            </div>

            {/* Tag Filters (Scrollable on mobile) */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none max-w-full md:max-w-xl">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap ${
                    selectedTag === tag
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="min-h-[50vh] py-20 bg-white flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-[#e52521] mb-4" size={32} />
            <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Loading Projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="py-16 px-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white flex flex-col items-center justify-center">
            <Layout className="text-slate-300 opacity-60 mb-4" size={48} />
            <p className="text-slate-400 font-bold text-lg uppercase tracking-wider">No Projects Found</p>
            <p className="text-slate-500 text-sm mt-2 max-w-sm">
              The project directory is currently empty. Please check back later for new updates.
            </p>
             <button
               onClick={() => navigate('contact')}
               className="mt-6 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
             >
               Contact Me
             </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-16 px-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center">
            <p className="text-slate-400 font-bold text-sm uppercase tracking-wider">No matching projects found</p>
            <p className="text-slate-500 text-xs mt-1">Try adjusting your filters or search query.</p>
            <button 
              onClick={() => { setSelectedTag('All'); setSearchQuery(''); }} 
              className="mt-4 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div key={project.id} className="group flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-red-400 hover:shadow-md transition-all duration-300">
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-50 border-b border-slate-200 flex items-center justify-center">
                  <img 
                    src={project.images[0]?.url || FALLBACK_IMAGE_URL}
                    alt={project.title} 
                    className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE_URL; }}
                  />
                  <div className="absolute top-3 right-3 flex flex-wrap gap-1.5 justify-end max-w-[70%]">
                     {Array.isArray(project.techStack) && project.techStack.length > 0 &&
                       project.techStack.slice(0, 3).map((tech, i) => (
                         <span key={i} className="bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-slate-800 border border-slate-200 shadow-sm">
                            {tech}
                         </span>
                       ))}
                  </div>
                </div>
                
                <div className="p-5 flex-grow flex flex-col">
                  <h3 className="text-base font-bold mb-1.5 text-slate-900 group-hover:text-[#e52521] transition-colors line-clamp-1">{project.title}</h3>
                  <p className="text-slate-500 mb-5 text-xs sm:text-sm leading-relaxed font-normal line-clamp-2">
                    {project.description}
                  </p>
                  
                  <div className="mt-auto flex items-center gap-3 border-t border-slate-100 pt-4">
                    <a 
                      href={project.liveUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-900 text-white py-2 rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      <span>Launch Site</span> <ArrowUpRight size={14} />
                    </a>
                    {project.githubUrl && (
                      <a 
                        href={project.githubUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-colors border border-slate-200"
                        title="GitHub Code"
                      >
                        <Github size={16} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center border-t border-slate-100 pt-10">
          <button 
            onClick={() => window.open('https://github.com/Bishalkumarmishra/bishalcodes?tab=repositories', '_blank')} 
            className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-800 px-5 py-2.5 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm"
          >
             <span>Explore GitHub Repository</span> <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Projects;
