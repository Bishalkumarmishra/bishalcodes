import React, { useEffect, useRef } from 'react';
import { CheckCircle2, Sparkles, ChevronRight } from 'lucide-react';

const Pricing: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const plans = [
    {
      title: 'INFORMATIVE',
      price: '10-25K',
      buttonText: 'Consultation Booking',
      description: 'Business website, personal portfolio, or single-page landing layouts.',
      features: [
        'Responsive Mobile Layout',
        'Custom Admin dashboard',
        'Standard SEO optimization',
        'Clean, accessible codebase',
        'Post-launch tech support'
      ],
      isPopular: false
    },
    {
      title: 'ECOMMERCE',
      price: '25-55K',
      buttonText: 'Consultation Booking',
      badge: 'Recommended',
      description: 'Specialized store layouts using Shopify, WooCommerce, or custom platforms.',
      features: [
        'High-converting shop setups',
        'Payment gateway integration',
        'Product filter frameworks',
        'Inventory tracking features',
        'Post-launch tech support'
      ],
      isPopular: true
    },
    {
      title: 'ENTERPRISE',
      price: '50K+',
      buttonText: 'Consultation Booking',
      description: 'Bespoke web applications, custom tools, and complex business software.',
      features: [
        'Technical planning sessions',
        'Scalable server setups',
        'Secure user registration',
        'Optimized data processes',
        'Post-launch tech support'
      ],
      isPopular: false
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollRef.current && window.innerWidth < 768) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const cardWidth = scrollRef.current.firstElementChild?.clientWidth || clientWidth;
        const gap = 20;
        let nextScroll = scrollLeft + cardWidth + gap;
        if (nextScroll >= scrollWidth - clientWidth) nextScroll = 0;
        scrollRef.current.scrollTo({ left: nextScroll, behavior: 'smooth' });
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="pricing" className="py-10 sm:py-14 bg-white relative overflow-hidden">
      <div className="w-full px-[5vw] mx-auto relative z-10 flex flex-col items-center">
        <div className="text-center mb-12 max-w-2xl">
          <div className="flex items-center justify-center gap-2 mb-2">
            <p className="text-slate-900 dark:text-white font-semibold text-xs uppercase tracking-wider">Services</p>
          </div>
          <h2 className="text-slate-900 text-3xl sm:text-4xl font-bold tracking-tight">
            Consultation Plans
          </h2>
        </div>

        <div className="w-full max-w-6xl mx-auto">
          <div ref={scrollRef} className="flex md:grid md:grid-cols-3 overflow-x-auto md:overflow-x-visible gap-6 mb-4 snap-x snap-mandatory scrollbar-hide pb-4 items-stretch">
            {plans.map((plan, index) => (
              <div 
                key={index} 
                className={`relative bg-white rounded-xl p-6 sm:p-8 border transition-all duration-300 flex flex-col h-full shrink-0 w-[85vw] md:w-full snap-center group ${
                  plan.isPopular 
                    ? 'border-slate-950 dark:border-white shadow-md scale-[1.01] z-10' 
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                {plan.badge && (
                  <span className="absolute top-4 right-4 bg-slate-950 dark:bg-white text-white dark:text-black text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-transparent dark:border-slate-800">
                    {plan.badge}
                  </span>
                )}
                
                <div className="mb-6">
                  <h3 className="text-slate-400 font-semibold text-xs mb-3 uppercase tracking-wider">{plan.title}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{plan.price}</span>
                    <span className="text-slate-500 font-medium text-xs lowercase">Rs.</span>
                  </div>
                  
                  <a 
                    href="https://wa.me/9779828701575" 
                    className={`block w-full py-2 rounded-lg text-xs font-semibold text-center transition-colors shadow-sm ${
                      plan.isPopular 
                        ? 'bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-100' 
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {plan.buttonText}
                  </a>
                  
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mt-4 font-normal">
                    {plan.description}
                  </p>
                </div>
                
                <div className="w-full h-[1px] bg-slate-100 mb-6" />
                
                <ul className="space-y-3 flex-grow">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center gap-3 text-slate-700">
                      <div className="shrink-0 w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center text-slate-850 bg-slate-100">
                        <ChevronRight size={12} />
                      </div>
                      <span className="text-xs sm:text-sm tracking-tight text-slate-600 font-normal">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;