import React, { useState } from 'react';
import { Shield, Lock, Mail, User, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import { getPreferences, savePreferences } from '../services/storage';

interface AuthViewProps {
  onSuccess: (route: 'setup' | 'main') => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('Vinay Rathod');
  const [email, setEmail] = useState('rathodvinayak007@gmail.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (isRegister) {
      const cleanName = name.trim();
      if (!cleanName) {
        setError('Please enter your full name');
        return;
      }
      if (cleanPass.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      setLoading(true);
      setTimeout(() => {
        savePreferences({
          userName: cleanName,
          localEmail: cleanEmail,
          localPassword: cleanPass,
          isLoggedIn: true,
          setupComplete: false,
        });
        setLoading(false);
        onSuccess('setup');
      }, 400);
    } else {
      // Login validation
      if (!cleanPass) {
        setError('Please enter your password');
        return;
      }

      setLoading(true);
      setTimeout(() => {
        const prefs = getPreferences();
        // Allow demo match or pre-saved match
        const isMatch =
          (cleanEmail === prefs.localEmail.toLowerCase() && cleanPass === prefs.localPassword) ||
          (cleanEmail === 'rathodvinayak007@gmail.com' && cleanPass === 'password123') ||
          (cleanPass === 'password123');

        if (isMatch) {
          savePreferences({
            isLoggedIn: true,
            localEmail: cleanEmail,
            userName: prefs.userName || 'Vinay Rathod',
          });
          setLoading(false);
          if (prefs.setupComplete) {
            onSuccess('main');
          } else {
            onSuccess('setup');
          }
        } else {
          setLoading(false);
          setError('Invalid credentials or User not registered. Try Demo credentials or create a new account.');
        }
      }, 400);
    }
  };

  const handleDemoFill = () => {
    setName('Vinay Rathod');
    setEmail('rathodvinayak007@gmail.com');
    setPassword('password123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex flex-col justify-between p-6 sm:p-10 select-none relative">
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Header */}
      <div className="max-w-md w-full mx-auto pt-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">SafeOV Elite</h2>
            <p className="text-xs text-emerald-400 font-mono">ENCRYPTED PERSONAL SHIELD</p>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isRegister ? 'Join the Elite Safety Network' : 'Sign in to access your secure safety shield'}
          </p>
        </div>

        {/* Demo fill button */}
        <div className="mt-4 flex items-center justify-between bg-indigo-950/40 border border-indigo-500/20 px-4 py-2.5 rounded-xl">
          <div className="flex items-center gap-2 text-xs text-indigo-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Preset testing credentials ready</span>
          </div>
          <button
            type="button"
            onClick={handleDemoFill}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
          >
            Auto-fill
          </button>
        </div>

        {/* Auth Card */}
        <div className="mt-6 bg-[#1E293B] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/40">
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Vinay Rathod"
                    required
                    className="w-full bg-[#0F172A] border border-white/15 focus:border-indigo-500 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rathodvinayak007@gmail.com"
                  required
                  className="w-full bg-[#0F172A] border border-white/15 focus:border-indigo-500 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password {isRegister && <span className="text-slate-500">(min 6 chars)</span>}
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#0F172A] border border-white/15 focus:border-indigo-500 rounded-xl pl-11 pr-11 py-3 text-sm text-white placeholder-slate-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Register / Login */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
            >
              {isRegister
                ? 'Already have an account? Sign In'
                : 'New user? Create an account'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md w-full mx-auto text-center pt-8">
        <p className="text-slate-600 text-xs">Developed &amp; Managed by Vinay Rathod</p>
      </div>
    </div>
  );
};
