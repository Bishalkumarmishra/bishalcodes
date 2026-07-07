import React from 'react';
import Navbar from '../sections/Navbar';
import Contact from '../sections/Contact';
import Footer from '../sections/Footer';

const ContactPage: React.FC = () => (
  <div className="min-h-screen">
    <Navbar />
    <div className="pt-20"><Contact /></div>
    <Footer />
  </div>
);

export default ContactPage;