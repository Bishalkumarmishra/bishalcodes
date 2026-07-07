import React from 'react';
import Navbar from '../sections/Navbar';
import About from '../sections/About';
import Footer from '../sections/Footer';
import { Sparkles, Zap, Shield, Target, Cpu, Layers, BarChart3, Globe, Code2 } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

const AboutPage: React.FC = () => {
  const { navigate } = useNavigation();
  const philosophy = [
    {
      title: 'Performance First',
      desc: 'Speed is not a feature, it is a requirement. I optimize code for fast asset delivery and loading times.',
      icon: <Zap size={24} className="text-indigo-600" />
    },
    {
      title: 'Clean Architecture',
      desc: 'Writing code that is scalable, maintainable, and readable is the core of my methodology.',
      icon: <Layers size={24} className="text-indigo-600" />
    },
    {
      title: 'Security Core',
      desc: 'Encryption and data protection are integrated into the architecture from the very first lines of code.',
      icon: <Shield size={24} className="text-indigo-600" />
    }
  ];

  const methodology = [
    { step: '01', title: 'Discovery', desc: 'Understanding business goals and user requirements to outline a clear technical plan.' },
    { step: '02', title: 'Architecture', desc: 'Designing data schemas, backend endpoints, and frontend user flows before coding.' },
    { step: '03', title: 'Execution', desc: 'High-velocity development using modern frameworks and standard version control.' },
    { step: '04', title: 'Optimization', desc: 'Code reviews, performance profiling, and browser compatibility testing.' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Navbar />
      
      {/* Hero Section */}
      <div className="pt-20">
        <About />
      </div>

      {/* Philosophy Section */}
      <section className="py-16 sm:py-24 bg-white relative overflow-hidden border-t border-slate-200/60">
        <div className="w-full px-[5vw] mx-auto relative z-10">
          <div className="max-w-3xl mb-12">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-indigo-600 font-semibold text-xs uppercase tracking-wider">Methodology</p>
            </div>
            <h2 className="text-slate-900 text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
              Engineering with Purpose
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {philosophy.map((item, i) => (
              <div key={i} className="p-6 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-sm transition-all duration-300 group">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 tracking-tight">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-normal">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section className="py-16 sm:py-24 bg-slate-50 border-t border-slate-200/60">
        <div className="w-full px-[5vw] mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 items-start">
            <div className="w-full lg:w-1/3 lg:sticky lg:top-32">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="text-indigo-600" size={16} />
                <p className="text-indigo-600 font-semibold text-xs uppercase tracking-wider">Workflow</p>
              </div>
              <h2 className="text-slate-900 text-3xl font-bold tracking-tight leading-tight mb-4">
                The Development Standard
              </h2>
              <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-normal border-l border-slate-200 pl-4">
                I design structured ecosystems. The methodology focuses on safety, efficiency, and clean implementations.
              </p>
            </div>
            
            <div className="w-full lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {methodology.map((m, i) => (
                <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-3xl font-bold text-indigo-100 block mb-4 tracking-tight">{m.step}</span>
                  <h3 className="text-base font-bold text-slate-900 mb-2 tracking-tight">{m.title}</h3>
                  <p className="text-slate-500 text-xs sm:text-sm font-normal leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Facts & Stats Section */}
      <section className="py-16 sm:py-24 bg-white border-t border-slate-200/60">
        <div className="w-full px-[5vw] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Lines of Code', val: '1.2M+', icon: <Code2 size={20} className="text-indigo-600" /> },
              { label: 'Success Rate', val: '98%', icon: <Target size={20} className="text-indigo-600" /> },
              { label: 'Global Clients', val: '45+', icon: <Globe size={20} className="text-indigo-600" /> },
              { label: 'Tech Stacks', val: '12+', icon: <BarChart3 size={20} className="text-indigo-600" /> }
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center mx-auto mb-4 border border-slate-200/80 shadow-sm shrink-0">
                  {stat.icon}
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-1">{stat.val}</p>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-slate-900 relative overflow-hidden">
        <div className="w-full px-[5vw] mx-auto text-center relative z-10">
          <h2 className="text-white text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-6 max-w-xl mx-auto">
            Ready to Build Your Next Web Project?
          </h2>
          <button 
            onClick={() => navigate('contact')}
            className="inline-flex bg-white hover:bg-slate-100 text-slate-900 px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-sm uppercase tracking-wider"
          >
            Get in Touch
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
