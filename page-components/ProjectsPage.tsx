import React from 'react';
import Navbar from '../sections/Navbar';
import Projects from '../sections/Projects';
import Footer from '../sections/Footer';

const ProjectsPage: React.FC = () => (
  <div className="min-h-screen">
    <Navbar />
    <div className="pt-20"><Projects /></div>
    <Footer />
  </div>
);

export default ProjectsPage;