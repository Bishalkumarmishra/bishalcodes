import React from 'react';
import Navbar from '../sections/Navbar';
import About from '../sections/About';
import Footer from '../sections/Footer';
import { Sparkles, Zap, Shield, Target, Cpu, Layers, BarChart3, Globe, Code2 } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import EditableText from '../components/EditableText';

const AboutPage: React.FC = () => {
  const { navigate } = useNavigation();
  const philosophy = [
    {
      title: 'Performance First',
      desc: 'Speed is not a feature, it is a requirement. I optimize code for fast asset delivery and loading times.',
      icon: <Zap size={24} className="text-indigo-600" />,
      fieldTitle: 'phil_title_1',
      fieldDesc: 'phil_desc_1'
    },
    {
      title: 'Clean Architecture',
      desc: 'Writing code that is scalable, maintainable, and readable is the core of my methodology.',
      icon: <Layers size={24} className="text-indigo-600" />,
      fieldTitle: 'phil_title_2',
      fieldDesc: 'phil_desc_2'
    },
    {
      title: 'Security Core',
      desc: 'Encryption and data protection are integrated into the architecture from the very first lines of code.',
      icon: <Shield size={24} className="text-indigo-600" />,
      fieldTitle: 'phil_title_3',
      fieldDesc: 'phil_desc_3'
    }
  ];

  const methodology = [
    { step: '01', title: 'Discovery', desc: 'Understanding business goals and user requirements to outline a clear technical plan.', fieldTitle: 'meth_title_1', fieldDesc: 'meth_desc_1' },
    { step: '02', title: 'Architecture', desc: 'Designing data schemas, backend endpoints, and frontend user flows before coding.', fieldTitle: 'meth_title_2', fieldDesc: 'meth_desc_2' },
    { step: '03', title: 'Execution', desc: 'High-velocity development using modern frameworks and standard version control.', fieldTitle: 'meth_title_3', fieldDesc: 'meth_desc_3' },
    { step: '04', title: 'Optimization', desc: 'Code reviews, performance profiling, and browser compatibility testing.', fieldTitle: 'meth_title_4', fieldDesc: 'meth_desc_4' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <Navbar />
      
      {/* Hero Section */}
      <div className="pt-20">
        <About />
      </div>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-indigo-600 dark:bg-slate-950 border-t border-indigo-700 dark:border-slate-800 relative overflow-hidden transition-colors duration-300">
        <div className="w-full px-[5vw] mx-auto text-center relative z-10">
          <h2 className="text-white text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-6 max-w-xl mx-auto transition-colors">
            <EditableText collection="settings" document="about_page" field="cta_title" fallback="Ready to Build Your Next Web Project?" />
          </h2>
          <button 
            onClick={() => navigate('contact')}
            className="inline-flex bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-sm uppercase tracking-wider border border-transparent dark:border-slate-700"
          >
            <EditableText collection="settings" document="about_page" field="cta_btn" fallback="Get in Touch" />
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
