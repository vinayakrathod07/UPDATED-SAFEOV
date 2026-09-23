import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { audioService } from '../services/audio';

interface AccidentDialogProps {
  onCancel: () => void;
  onConfirmEmergency: () => void;
}

export const AccidentDialog: React.FC<AccidentDialogProps> = ({ onCancel, onConfirmEmergency }) => {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Vibrate & play beep alarm
    audioService.vibrate(1000);
    audioService.playAccidentBeep();

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleExpire();
          return 0;
        }
        audioService.playAccidentBeep();
        audioService.vibrate(300);
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleExpire = () => {
    onConfirmEmergency();
  };

  const handleCancelClick = () => {
    audioService.stopSiren();
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-sm bg-[#0F172A] border-2 border-rose-500 rounded-[28px] p-8 text-center shadow-[0_0_80px_rgba(239,68,68,0.4)] relative overflow-hidden animate-scale-up">
        {/* Top pulsing red aura */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-rose-500/20 blur-2xl pointer-events-none" />

        {/* Alert Icon in circular container */}
        <div className="w-20 h-20 mx-auto rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center animate-bounce">
          <AlertTriangle className="w-10 h-10 text-rose-500" />
        </div>

        {/* Title */}
        <h2 className="mt-6 text-2xl font-extrabold text-rose-500 tracking-wide">
          ACCIDENT DETECTED!
        </h2>
        <p className="mt-1 text-slate-400 text-xs tracking-wide">
          Emergency Response initiated
        </p>

        {/* Countdown */}
        <div className="mt-6">
          <span className="text-7xl font-black text-white font-mono tracking-tighter drop-shadow-lg">
            {countdown}
          </span>
          <p className="mt-1 text-[11px] font-mono tracking-[0.25em] text-slate-400 uppercase">
            Seconds Remaining
          </p>
        </div>

        {/* Cancel Button */}
        <button
          onClick={handleCancelClick}
          className="mt-8 w-full bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-sm py-4 px-6 rounded-2xl border border-white/20 flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          I AM SAFE (CANCEL)
        </button>

        <p className="mt-3 text-[10px] text-slate-500">
          Auto-dialing Ambulance (108) &amp; broadcasting GPS on expiration
        </p>
      </div>
    </div>
  );
};
