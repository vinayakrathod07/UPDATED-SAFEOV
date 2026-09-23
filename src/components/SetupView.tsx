import React, { useState } from 'react';
import { Shield, Phone, Mail, User, Check, ArrowLeft } from 'lucide-react';
import { getPreferences, savePreferences } from '../services/storage';

interface SetupViewProps {
  onComplete: () => void;
  canGoBack?: boolean;
  onBack?: () => void;
}

export const SetupView: React.FC<SetupViewProps> = ({ onComplete, canGoBack, onBack }) => {
  const currentPrefs = getPreferences();

  const [userName, setUserName] = useState(currentPrefs.userName || '');
  const [contact1, setContact1] = useState(currentPrefs.contact1 || '+91 98765 43210');
  const [contact2, setContact2] = useState(currentPrefs.contact2 || '+91 91234 56789');
  const [contact3, setContact3] = useState(currentPrefs.contact3 || '');
  const [gmailContact, setGmailContact] = useState(currentPrefs.gmailContact || 'emergency.ops@safeov.org');
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const name = userName.trim();
    const c1 = contact1.trim();
    const c2 = contact2.trim();
    const c3 = contact3.trim();
    const gmail = gmailContact.trim().toLowerCase();

    if (!name || !c1 || !gmail) {
      setError('Please provide your name, primary contact, and email.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(gmail)) {
      setError('Please enter a valid Gmail / Email address.');
      return;
    }

    savePreferences({
      userName: name,
      contact1: c1,
      contact2: c2,
      contact3: c3,
      gmailContact: gmail,
      setupComplete: true,
    });

    setSuccessToast(true);
    setTimeout(() => {
      onComplete();
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] p-6 sm:p-10 select-none relative overflow-y-auto">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-black font-bold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Check className="w-5 h-5" />
          Shield Activated Locally!
        </div>
      )}

      <div className="max-w-xl mx-auto pb-12">
        {/* Navigation / Back */}
        {canGoBack && onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        )}

        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="text-[11px] font-mono text-emerald-400 tracking-wider font-semibold">
              SECURITY CONFIGURATION
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Shield Setup</h1>
          </div>
        </div>

        <p className="text-slate-400 text-sm mt-1">
          Configure your elite emergency network and immediate contact dispatch channels.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* User Info Card */}
          <div className="bg-[#1E293B] border border-white/10 rounded-2xl p-6 shadow-lg">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              Guardian Identity
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Your Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Vinay Rathod"
                  required
                  className="w-full bg-[#0F172A] border border-white/15 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Emergency Mobile Contacts */}
          <div className="bg-[#1E293B] border border-white/10 rounded-2xl p-6 shadow-lg space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Phone className="w-4 h-4 text-indigo-400" />
                Emergency Mobile Contacts
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Emergency SMS containing live GPS location will be broadcasted to these numbers instantly upon SOS trigger.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Contact 1 (Primary) <span className="text-rose-400">*</span>
              </label>
              <input
                type="tel"
                value={contact1}
                onChange={(e) => setContact1(e.target.value)}
                placeholder="+91 98765 43210"
                required
                className="w-full bg-[#0F172A] border border-white/15 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Contact 2 <span className="text-slate-500">(Optional)</span>
              </label>
              <input
                type="tel"
                value={contact2}
                onChange={(e) => setContact2(e.target.value)}
                placeholder="+91 91234 56789"
                className="w-full bg-[#0F172A] border border-white/15 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Contact 3 <span className="text-slate-500">(Optional)</span>
              </label>
              <input
                type="tel"
                value={contact3}
                onChange={(e) => setContact3(e.target.value)}
                placeholder="Optional backup contact number"
                className="w-full bg-[#0F172A] border border-white/15 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition"
              />
            </div>
          </div>

          {/* Secondary Alert (Email) */}
          <div className="bg-[#1E293B] border border-white/10 rounded-2xl p-6 shadow-lg">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400" />
              Secondary Alert (Email)
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Backup dispatch address for evidence records and incident coordinates.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Emergency Gmail / Email Address <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                value={gmailContact}
                onChange={(e) => setGmailContact(e.target.value)}
                placeholder="rathodvinayak007@gmail.com"
                required
                className="w-full bg-[#0F172A] border border-white/15 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition"
              />
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs p-3.5 rounded-xl font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:opacity-95 active:scale-[0.99] text-white font-extrabold text-base py-4 px-6 rounded-2xl shadow-xl shadow-indigo-600/30 transition cursor-pointer tracking-wider"
          >
            ACTIVATE ELITE SHIELD
          </button>
        </form>

        <p className="text-center text-slate-600 text-xs mt-8">
          Developed &amp; Managed by Vinay Rathod
        </p>
      </div>
    </div>
  );
};
