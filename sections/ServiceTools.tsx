import React, { useState, useEffect } from 'react';
import { ArrowRight, Loader2, Wrench } from 'lucide-react';
import { query, collection, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ServiceTool } from '../types';
import { useNavigation } from '../context/NavigationContext';

const ServiceTools: React.FC = () => {
  const { navigate } = useNavigation();
  const [services, setServices] = useState<ServiceTool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchServices = async () => {
      try {
        const q = query(collection(db, 'services'), orderBy('order', 'asc'));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceTool));
        if (isMounted) setServices(data);
      } catch (err) {
        console.warn('ServiceTools: Failed to fetch services', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchServices();
    return () => { isMounted = false; };
  }, []);

  // Curated accent colors per card index for visual variety
  const accents = [
    { from: '#e52521', to: '#ef4444', ring: 'ring-red-500/30', text: 'text-[#e52521] dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' },
    { from: '#f59e0b', to: '#fbbf24', ring: 'ring-amber-500/30', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { from: '#10b981', to: '#34d399', ring: 'ring-emerald-500/30', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { from: '#ec4899', to: '#f472b6', ring: 'ring-pink-500/30', text: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-500/10' },
    { from: '#0f172a', to: '#475569', ring: 'ring-slate-500/30', text: 'text-slate-900 dark:text-slate-300', bg: 'bg-slate-50 dark:bg-slate-900/40' },
    { from: '#14b8a6', to: '#2dd4bf', ring: 'ring-teal-500/30', text: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-500/10' },
    { from: '#f97316', to: '#fb923c', ring: 'ring-orange-500/30', text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10' },
    { from: '#0ea5e9', to: '#38bdf8', ring: 'ring-sky-500/30', text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-500/10' },
  ];

  const displayServices = React.useMemo(() => {
    const list = [...services];
    const hasFileTransfer = list.some(s => s.linkUrl === 'file-transfer');
    const hasScreenshot = list.some(s => s.linkUrl === 'screenshot-studio');
    const hasDevCard = list.some(s => s.linkUrl === 'dev-card-studio');
    
    if (!hasFileTransfer) {
      list.push({
        id: 'file-transfer',
        title: 'File Transfer',
        description: 'Send files up to 100 GB instantly via secure peer-to-peer connection. Get a shareable link or email directly — free, no registration required.',
        iconUrl: '/file-transfer.svg',
        bgImageUrl: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?q=80&w=600&auto=format&fit=crop',
        linkUrl: 'file-transfer',
        badge: 'NEW',
        order: 15
      });
    }
    if (!hasScreenshot) {
      list.push({
        id: 'screenshot-studio',
        title: 'Website Screenshot Studio',
        description: 'Capture high-resolution full-page scrolling screenshots of any site. Customize device viewports, resolutions, and download captures instantly.',
        iconUrl: '/screenshot-studio.svg',
        bgImageUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600&auto=format&fit=crop',
        linkUrl: 'screenshot-studio',
        badge: 'NEW',
        order: 16
      });
    }
    if (!hasDevCard) {
      list.push({
        id: 'dev-card-studio',
        title: 'Developer Card Studio',
        description: 'Design customized developer profile cards and OpenGraph preview banners. Export as PNG images or copy copyable SVG/React vector markups.',
        iconUrl: '/dev-card.svg',
        bgImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop',
        linkUrl: 'dev-card-studio',
        badge: 'NEW',
        order: 14
      });
    }
    return list.sort((a, b) => a.order - b.order).slice(0, 10);
  }, [services]);

  return (
    <section id="service-tools" className="py-10 sm:py-14 relative overflow-hidden">
      <style>{`
        #service-tools .pure-white-card {
          background-color: #ffffff !important;
        }
        :root.dark #service-tools .pure-white-card {
          background-color: rgb(15 23 42 / 0.5) !important;
        }
      `}</style>
      <div className="w-full px-[5vw] mx-auto relative z-10">

        {/* Section Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-[#e52521] font-semibold uppercase tracking-wider text-[10px]">Free Utilities</p>
            </div>
            <h2 className="text-slate-900 dark:text-white text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
              Developer Tools & Services
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed mt-2 font-normal">
              Simple, fast, and privacy-first tools I built that I personally use every day. No sign-up needed — free forever.
            </p>
          </div>

          <button
            onClick={() => navigate('services')}
            className="w-fit bg-slate-900 dark:bg-[#e52521] hover:bg-slate-800 dark:hover:bg-[#d01f1c] text-white px-5 py-2.5 rounded-lg text-xs font-semibold shadow-sm transition-colors uppercase tracking-wider shrink-0 flex items-center gap-2"
          >
            <Wrench size={14} />
            All Tools
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="animate-spin text-[#e52521] mx-auto" size={28} />
            <p className="text-slate-400 mt-3 font-semibold text-xs uppercase tracking-wider">Loading Tools...</p>
          </div>
        ) : displayServices.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <p className="text-slate-400 font-semibold text-sm">No tools available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
            {displayServices.map((service, index) => {
              const accent = accents[index % accents.length];
              return (
                <a
                  key={service.id}
                  href={`/tools/${service.linkUrl}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('services', service.linkUrl);
                  }}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 flex flex-col items-start transition-all duration-200 cursor-pointer relative overflow-hidden h-full hover:shadow-md hover:-translate-y-1"
                >
                  {service.bgImageUrl && (
                    <div
                      className="absolute inset-0 z-0 opacity-10 dark:opacity-[0.03] transition-opacity duration-500 bg-cover bg-center bg-no-repeat"
                      style={{ backgroundImage: `url('${service.bgImageUrl}')` }}
                    />
                  )}

                  <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden p-3 mb-5 border border-slate-100 dark:border-slate-700 relative z-10 shrink-0">
                    {service.iconUrl ? (
                      <img src={service.iconUrl} alt={service.title} className="w-full h-full object-contain drop-shadow-sm" />
                    ) : (
                      <Wrench size={24} className="text-slate-400" />
                    )}
                  </div>

                  <div className="space-y-2 w-full relative z-10">
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 transition-colors flex items-center gap-2 flex-wrap">
                      {service.title}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-[13px] leading-relaxed font-normal line-clamp-2">
                      {service.description}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default ServiceTools;
