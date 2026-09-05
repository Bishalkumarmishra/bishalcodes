
import React from 'react';
import Navbar from '../sections/Navbar';
import Hero from '../sections/Hero';
import Overview from '../sections/Overview';
import About from '../sections/About';
import Skills from '../sections/Skills';
import Services from '../sections/Services';
import Timeline from '../sections/Timeline';
import Pricing from '../sections/Pricing';
import Blog from '../sections/Blog';
import Testimonials from '../sections/Testimonials';
import FAQ from '../sections/FAQ';
import Contact from '../sections/Contact';
import Footer from '../sections/Footer';
import AIStudioTeaser from '../sections/AIStudioTeaser'; // Changed to import the new teaser
import ServiceTools from '../sections/ServiceTools';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Overview />
      <Services />
      <ServiceTools />
      <AIStudioTeaser />
      <Pricing />

      {/* Meet the Builder Divider */}
      <div className="relative py-20 bg-slate-950 border-t border-b border-slate-900 text-center overflow-hidden">
        {/* Tech Grid Background Pattern */}
        <div 
          className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
          style={{ 
            backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 39px,#e52521 39px,#e52521 40px), repeating-linear-gradient(90deg,transparent,transparent 39px,#e52521 39px,#e52521 40px)'
          }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950 opacity-90"></div>
        
        {/* Central Crimson Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-red-600/10 rounded-full blur-[80px] z-0 pointer-events-none"></div>

        {/* Diagonal Tech Accents */}
        <div className="absolute top-0 left-10 w-32 h-[1px] bg-gradient-to-r from-transparent via-[#e52521]/30 to-transparent"></div>
        <div className="absolute bottom-0 right-10 w-32 h-[1px] bg-gradient-to-r from-transparent via-[#e52521]/30 to-transparent"></div>

        <div className="relative max-w-6xl mx-auto px-4 z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-2 tracking-tight">
            Meet the Builder Behind the Platform
          </h2>
          <p className="text-slate-400 text-xs md:text-sm mt-3.5 max-w-lg mx-auto leading-relaxed font-medium">
            Explore the developer skills, engineering principles, and experience timeline that power this platform.
          </p>
        </div>
      </div>

      <About />
      <Skills />
      <Timeline />
      
      <Blog />
      <Testimonials />
      <FAQ />
      <Contact />
      <Footer />
    </div>
  );
};

export default Home;
