import React, { useEffect, useState } from 'react';
import { Shield, Sparkles, ChevronRight } from 'lucide-react';
import { getPreferences } from '../services/storage';

interface SplashViewProps {
  onNavigate: (route: 'login' | 'setup' | 'main') => void;
}

export const SplashView: React.FC<SplashViewProps> = ({ onNavigate }) => {
  const [creditVisible, setCreditVisible] = useState(false);

  useEffect(() => {
    // Fade in developer credit
    const creditTimer = setTimeout(() => {
      setCreditVisible(true);
    }, 300);

    // Auto-advance after 2.5s matching SplashActivity
    const navTimer = setTimeout(() => {
      handleNext();
    }, 2800);

    return () => {
      clearTimeout(creditTimer);
      clearTimeout(navTimer);
    };
  }, []);

  const handleNext = () => {
    const prefs = getPreferences();
    if (!prefs.isLoggedIn) {
      onNavigate('login');
    } else if (!prefs.setupComplete) {
      onNavigate('setup');
    } else {
      onNavigate('main');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-between p-8 text-white relative overflow-hidden select-none">
      {/* Background ambient radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Top spacing */}
      <div className="pt-8 flex items-center gap-2 text-xs font-mono tracking-widest text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/20">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        SECURE PROTOCOL v2.0
      </div>

      {/* Center Logo & Title */}
      <div className="flex flex-col items-center text-center space-y-5 my-auto z-10">
        <div className="relative group">
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-rose-600 p-0.5 shadow-2xl shadow-indigo-600/30">
            <div className="w-full h-full bg-[#0a0a0f] rounded-[22px] flex items-center justify-center">
              <Shield className="w-14 h-14 text-white drop-shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-black p-1.5 rounded-xl shadow-lg">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <div>
          <h1 className="text-5xl font-extrabold tracking-tight text-white mb-2 font-['Plus_Jakarta_Sans']">
            SafeOV <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-rose-400 to-amber-300 text-3xl font-black">ELITE</span>
          </h1>
          <p className="text-slate-400 text-sm tracking-wider font-medium max-w-xs mx-auto">
            Advanced AI Safety Companion &amp; Autonomous Emergency Shield
          </p>
        </div>

        {/* Instant access button */}
        <button
          onClick={handleNext}
          className="mt-4 flex items-center gap-2 bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-xs font-semibold px-5 py-2.5 rounded-full border border-white/15 text-slate-200 cursor-pointer"
        >
          Initialize Shield Now
          <ChevronRight className="w-4 h-4 text-indigo-400" />
        </button>
      </div>

      {/* Bottom Developer Credit matching original SplashActivity */}
      <div
        className={`pb-6 text-center transition-opacity duration-1000 ${
          creditVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <p className="text-slate-500 text-xs font-medium tracking-wide">
          Developed &amp; Managed by <span className="text-slate-300 font-semibold">Vinay Rathod</span>
        </p>
      </div>
    </div>
  );
};
