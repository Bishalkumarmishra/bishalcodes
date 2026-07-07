
import React from 'react';
import { Cpu, Zap, Shield, Sparkles, Activity, Terminal } from 'lucide-react';

const Robot: React.FC = () => {
  return (
    <section className="py-24 bg-[#0a0a0a] relative overflow-hidden border-y border-white/5">
      {/* Neural Background Grid */}
      <div className="absolute inset-0 opacity-[0.15]" 
        style={{ 
          backgroundImage: `linear-gradient(#915eff 1px, transparent 1px), linear-gradient(90deg, #915eff 1px, transparent 1px)`,
          backgroundSize: '50px 50px' 
        }} 
      />
      
      {/* Floating Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#915eff]/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#ccff00]/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="w-full px-[5vw] mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-20">
          
          {/* Visual Core Engine */}
          <div className="w-full lg:w-1/2 flex justify-center">
            <div className="relative w-80 h-80 sm:w-[500px] sm:h-[500px]">
              
              {/* Spinning Tech Rings */}
              <div className="absolute inset-0 border-[1px] border-[#915eff]/20 rounded-full animate-[spin_30s_linear_infinite] animate-pulse-opacity" />
              <div className="absolute inset-10 border-[1px] border-dashed border-[#ccff00]/30 rounded-full animate-[spin_20s_linear_infinite_reverse] animate-pulse-opacity" style={{ animationDelay: '0.5s' }} />
              <div className="absolute inset-20 border-[2px] border-double border-[#915eff]/40 rounded-full animate-[spin_15s_linear_infinite]" />
              
              {/* Central Neural Hub */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative group">
                  <div className="absolute -inset-8 bg-[#915eff]/30 rounded-full blur-2xl group-hover:bg-[#915eff]/50 transition-all duration-700 animate-pulse" />
                  
                  <div className="relative w-40 h-40 sm:w-56 sm:h-56 bg-gradient-to-br from-[#1a1a1a] to-[#050816] rounded-3xl rotate-45 flex items-center justify-center shadow-[0_0_80px_rgba(145,94,255,0.4)] border border-white/10 overflow-hidden">
                    {/* Inner counter-rotating element */}
                    <div className="absolute inset-2 border border-white/10 rounded-2xl animate-inner-spin"></div>

                    {/* Inner Scanning Effect */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-[#ccff00] shadow-[0_0_15px_#ccff00] animate-scan opacity-50" />
                    
                    <div className="-rotate-45 flex flex-col items-center gap-2 z-10">
                      <Cpu size={80} className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
                      <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 bg-[#ccff00] rounded-full animate-ping" />
                        <span className="text-[10px] font-black text-[#ccff00] uppercase tracking-[0.3em]">Neural Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Satellite Data Nodes */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 bg-[#ccff00] rounded-2xl flex items-center justify-center shadow-[0_0_30px_#ccff00] animate-float z-20">
                <Zap size={32} className="text-black" />
              </div>
              <div className="absolute bottom-[15%] left-[10%] w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] animate-float-delayed z-20">
                <Shield size={28} className="text-black" />
              </div>
              <div className="absolute bottom-[15%] right-[10%] w-14 h-14 bg-[#915eff] rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(145,94,255,0.5)] animate-float z-20">
                <Activity size={28} className="text-white" />
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="w-full lg:w-1/2 space-y-8">
            <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-2 rounded-full">
              <Terminal size={16} className="text-[#ccff00]" />
              <p className="text-[#ccff00] font-black text-xs uppercase tracking-[0.4em]">SYSTEM CORE ARCHITECTURE</p>
            </div>
            
            <h2 className="text-white text-6xl sm:text-8xl font-black italic tracking-tighter leading-[0.85]">
              Core <br /> <span className="text-[#915eff] drop-shadow-[0_0_30px_rgba(145,94,255,0.5)]">Engine</span>.
            </h2>
            
            <p className="text-slate-400 text-xl md:text-2xl leading-relaxed font-medium italic max-w-xl">
              I don't just write code; I engineer high-performance digital ecosystems. This core engine represents a commitment to scalable, secure, and lightning-fast logic.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <div className="p-8 bg-white/5 rounded-[30px] border border-white/10 hover:bg-white/10 transition-all group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#ccff00] flex items-center justify-center text-black">
                    <Sparkles size={24} />
                  </div>
                  <p className="text-white font-black text-3xl italic">0.01ms</p>
                </div>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest group-hover:text-white transition-colors">Logic Processing Latency</p>
              </div>

              <div className="p-8 bg-white/5 rounded-[30px] border border-white/10 hover:bg-white/10 transition-all group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#915eff] flex items-center justify-center text-white">
                    <Zap size={24} />
                  </div>
                  <p className="text-white font-black text-3xl italic">100%</p>
                </div>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest group-hover:text-white transition-colors">Structural Integrity</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: -10%; }
          50% { top: 110%; }
          50.01% { top: -10%; }
          100% { top: 110%; }
        }
        .animate-scan {
          animation: scan 4s cubic-bezier(0.7, 0, 0.3, 1) infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(-50%); }
          50% { transform: translateY(-30px) translateX(-50%); }
        }
        @keyframes float-no-x {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-no-x 5s ease-in-out infinite;
          animation-delay: 1s;
        }
        @keyframes pulse-opacity {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .animate-pulse-opacity {
          animation: pulse-opacity 5s ease-in-out infinite;
        }
        @keyframes inner-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .animate-inner-spin {
          animation: inner-spin 10s linear infinite;
        }
      `}} />
    </section>
  );
};

export default Robot;
