import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, User, Mic, Volume2 } from 'lucide-react';
import { audioService } from '../services/audio';

interface FakeCallModalProps {
  callerName?: string;
  callerNumber?: string;
  onDismiss: () => void;
}

export const FakeCallModal: React.FC<FakeCallModalProps> = ({
  callerName = 'Family / Emergency Guardian',
  callerNumber = '+91 98765 43210',
  onDismiss,
}) => {
  const [callState, setCallState] = useState<'incoming' | 'connected'>('incoming');
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (callState === 'incoming') {
      audioService.startRingtone();
      audioService.vibrate(800);
    } else {
      audioService.stopRingtone();
      // Speak urgent message to help user escape
      audioService.speak(
        'Hello! Where are you? Please come outside right now, I am waiting in the car at the corner. Come quickly!',
        'en'
      );
    }

    return () => {
      audioService.stopRingtone();
    };
  }, [callState]);

  useEffect(() => {
    let timer: number;
    if (callState === 'connected') {
      timer = window.setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      clearInterval(timer);
    };
  }, [callState]);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const handleAnswer = () => {
    audioService.stopRingtone();
    setCallState('connected');
  };

  const handleHangup = () => {
    audioService.stopRingtone();
    window.speechSynthesis?.cancel();
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between p-8 bg-slate-950/95 backdrop-blur-xl text-white select-none animate-fade-in">
      {/* Top Status */}
      <div className="text-center pt-8">
        <span className="text-xs uppercase tracking-widest text-emerald-400 font-mono bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/20">
          SAFEOV URGENT CALL SIMULATION
        </span>

        <div className="mt-8 flex flex-col items-center">
          <div className="w-28 h-28 rounded-full bg-slate-800 border-2 border-white/20 flex items-center justify-center shadow-2xl mb-4 relative">
            <User className="w-14 h-14 text-slate-300" />
            {callState === 'incoming' && (
              <span className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-75" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">{callerName}</h2>
          <p className="text-sm text-slate-400 mt-1">{callerNumber}</p>
          <p className="text-xs font-mono text-emerald-400 mt-2">
            {callState === 'incoming' ? 'Incoming call...' : `In Call • ${formatDuration(callDuration)}`}
          </p>
        </div>
      </div>

      {/* Middle info */}
      <div className="text-center max-w-xs mx-auto">
        {callState === 'connected' ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-slate-300 space-y-1">
            <p className="font-semibold text-emerald-400">Escort Speech Active:</p>
            <p className="italic text-slate-400">
              "Where are you? I am waiting outside in the car. Please hurry!"
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Use this simulated urgent call to safely exit uncomfortable situations or deter unwanted attention.
          </p>
        )}
      </div>

      {/* Action Controls */}
      <div className="pb-10 max-w-sm w-full mx-auto">
        {callState === 'incoming' ? (
          <div className="flex items-center justify-around">
            {/* Decline */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleHangup}
                className="w-18 h-18 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 flex items-center justify-center shadow-xl shadow-rose-600/40 transition cursor-pointer"
              >
                <PhoneOff className="w-8 h-8 text-white" />
              </button>
              <span className="text-xs text-slate-400">Decline</span>
            </div>

            {/* Accept */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleAnswer}
                className="w-18 h-18 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 flex items-center justify-center shadow-xl shadow-emerald-500/40 transition cursor-pointer"
              >
                <Phone className="w-8 h-8 text-black" />
              </button>
              <span className="text-xs text-emerald-400 font-semibold">Answer</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => audioService.speak('Where are you? I am waiting right outside, come now!', 'en')}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-xs px-4 py-2.5 rounded-full border border-white/15 cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-indigo-400" />
                Replay Voice
              </button>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleHangup}
                className="w-20 h-20 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 flex items-center justify-center shadow-2xl shadow-rose-600/50 transition cursor-pointer"
              >
                <PhoneOff className="w-9 h-9 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
