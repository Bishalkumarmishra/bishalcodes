import React from 'react';
import Navbar from '../sections/Navbar';
import Timeline from '../sections/Timeline';
import Footer from '../sections/Footer';

const ExperiencePage: React.FC = () => (
  <div className="min-h-screen">
    <Navbar />
    <div className="pt-20"><Timeline /></div>
    <Footer />
  </div>
);

export default ExperiencePage;