
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
      <ServiceTools />
      <AIStudioTeaser />
      <Pricing />
      <FAQ />
      <Contact />
      <Footer />
    </div>
  );
};

export default Home;
