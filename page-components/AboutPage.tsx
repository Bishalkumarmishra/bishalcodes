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

      {/* Philosophy Section */}
      <section className="py-16 sm:py-24 bg-white dark:bg-slate-900 relative overflow-hidden border-t border-slate-200/60 dark:border-slate-800 transition-colors duration-300">
        <div className="w-full px-[5vw] mx-auto relative z-10">
          <div className="max-w-3xl mb-12">
            <div className="flex items-center gap-2 mb-2 text-left">
              <p className="text-indigo-600 font-semibold text-xs uppercase tracking-wider">
                <EditableText collection="settings" document="about_page" field="philosophy_tag" fallback="Methodology" />
              </p>
            </div>
            <h2 className="text-slate-900 dark:text-white text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-left transition-colors">
              <EditableText collection="settings" document="about_page" field="philosophy_title" fallback="Engineering with Purpose" />
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {philosophy.map((item, i) => (
              <div key={i} className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all duration-300 group">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center mb-6 transition-colors">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 tracking-tight transition-colors">
                  <EditableText collection="settings" document="about_page" field={item.fieldTitle} fallback={item.title} isRichText />
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-normal transition-colors">
                  <EditableText collection="settings" document="about_page" field={item.fieldDesc} fallback={item.desc} isTextArea isRichText />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/60 dark:border-slate-800 transition-colors duration-300">
        <div className="w-full px-[5vw] mx-auto text-left">
          <div className="flex flex-col lg:flex-row gap-12 items-start">
            <div className="w-full lg:w-1/3 lg:sticky lg:top-32">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="text-indigo-600" size={16} />
                <p className="text-indigo-600 font-semibold text-xs uppercase tracking-wider">
                  <EditableText collection="settings" document="about_page" field="workflow_tag" fallback="Workflow" />
                </p>
              </div>
              <h2 className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight leading-tight mb-4 transition-colors">
                <EditableText collection="settings" document="about_page" field="workflow_title" fallback="The Development Standard" isRichText />
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed font-normal border-l border-slate-200 dark:border-slate-800 pl-4 transition-colors">
                <EditableText collection="settings" document="about_page" field="workflow_desc" fallback="I design structured ecosystems. The methodology focuses on safety, efficiency, and clean implementations." isTextArea isRichText />
              </p>
            </div>
            
            <div className="w-full lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {methodology.map((m, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
                  <span className="text-3xl font-bold text-indigo-100 dark:text-indigo-900/50 block mb-4 tracking-tight transition-colors">{m.step}</span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 tracking-tight transition-colors">
                    <EditableText collection="settings" document="about_page" field={m.fieldTitle} fallback={m.title} isRichText />
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-normal leading-relaxed transition-colors">
                    <EditableText collection="settings" document="about_page" field={m.fieldDesc} fallback={m.desc} isTextArea isRichText />
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Facts & Stats Section */}
      <section className="py-16 sm:py-24 bg-white dark:bg-slate-900 border-t border-slate-200/60 dark:border-slate-800 transition-colors duration-300">
        <div className="w-full px-[5vw] mx-auto text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Lines of Code', val: '1.2M+', fieldVal: 'stat_val_1', fieldLabel: 'stat_lbl_1', icon: <Code2 size={20} className="text-indigo-600" /> },
              { label: 'Success Rate', val: '98%', fieldVal: 'stat_val_2', fieldLabel: 'stat_lbl_2', icon: <Target size={20} className="text-indigo-600" /> },
              { label: 'Global Clients', val: '45%', fieldVal: 'stat_val_3', fieldLabel: 'stat_lbl_3', icon: <Globe size={20} className="text-indigo-600" /> },
              { label: 'Tech Stacks', val: '12+', fieldVal: 'stat_val_4', fieldLabel: 'stat_lbl_4', icon: <BarChart3 size={20} className="text-indigo-600" /> }
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center mx-auto mb-4 border border-slate-200/80 dark:border-slate-700 shadow-sm shrink-0 transition-colors">
                  {stat.icon}
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-1 transition-colors">
                  <EditableText collection="settings" document="about_page" field={stat.fieldVal} fallback={stat.val} />
                </p>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider transition-colors">
                  <EditableText collection="settings" document="about_page" field={stat.fieldLabel} fallback={stat.label} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
