import React from 'react';
import Navbar from '../sections/Navbar';
import Skills from '../sections/Skills';
import Footer from '../sections/Footer';

const SkillsPage: React.FC = () => (
  <div className="min-h-screen">
    <Navbar />
    <div className="pt-20"><Skills /></div>
    <Footer />
  </div>
);

export default SkillsPage;