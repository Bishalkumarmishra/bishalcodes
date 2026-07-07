import React from 'react';
import { Wand2, ArrowRight, Code, Smartphone, Wind } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

const AIStudioTeaser: React.FC = () => {
    const { navigate } = useNavigation();

    const features = [
      { icon: <Code size={16} />, text: 'Prototype Layouts' },
      { icon: <Smartphone size={16} />, text: 'Responsive Previews' },
      { icon: <Wind size={16} />, text: 'Iterative Refinement' }
    ];

    return (
        <section id="ai-teaser" className="py-10 sm:py-14 relative overflow-hidden bg-slate-900 text-white">
            {/* Dark overlay scrim to guarantee text legibility */}
            <div className="absolute inset-0 bg-slate-950/80 z-0 pointer-events-none" />

            {/* Soft, professional gradient overlays (no cheesy glowing spots) */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-800/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="w-full px-[5vw] mx-auto text-center relative z-10">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Wand2 className="text-indigo-400" size={18} />
                    <p className="text-indigo-400 font-semibold text-xs uppercase tracking-wider">AI Playground</p>
                </div>
                
                <h2 className="text-white text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4">
                    Interactive AI Studio
                </h2>
                
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed mt-2 max-w-2xl mx-auto mb-8 font-normal">
                    Describe your project layout idea. The integrated editor helps you prototype, edit, and preview simple web interfaces inside a sandbox environment.
                </p>

                {/* Feature highlights */}
                <div className="mb-10 flex flex-wrap items-center justify-center gap-3">
                    {features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full shrink-0">
                            <div className="text-indigo-400">{feature.icon}</div>
                            <span className="text-white text-xs font-semibold">{feature.text}</span>
                        </div>
                    ))}
                </div>

                <button 
                    onClick={() => navigate('ai-studio')}
                    className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-md mx-auto"
                >
                    <span>Launch AI Studio</span>
                    <ArrowRight size={16} />
                </button>
            </div>
        </section>
    );
};

export default AIStudioTeaser;