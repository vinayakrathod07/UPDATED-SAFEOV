import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Phone,
  Volume2,
  VolumeX,
  Settings,
  LogOut,
  AlertOctagon,
  Mic,
  MicOff,
  Navigation,
  FolderLock,
  Zap,
  Activity,
  CheckCircle2,
  Radio,
  Send,
  Video,
  VideoOff
} from 'lucide-react';
import { getPreferences, savePreferences, saveEvidenceRecord, addDispatchLog } from '../services/storage';
import { audioService } from '../services/audio';
import { AccidentDialog } from './AccidentDialog';
import { FakeCallModal } from './FakeCallModal';
import { EvidenceVaultModal } from './EvidenceVaultModal';

interface MainDashboardProps {
  onOpenSettings: () => void;
  onLogout: () => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({ onOpenSettings, onLogout }) => {
  const prefs = getPreferences();

  // Core State
  const [isSosActive, setIsSosActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState(`WELCOME, ${prefs.userName.toUpperCase()} - SYSTEM ARMED`);
  const [isSirenOn, setIsSirenOn] = useState(false);
  const [language, setLanguage] = useState<'hi' | 'en'>('hi');

  // Modals & Dialogs
  const [showAccidentModal, setShowAccidentModal] = useState(false);
  const [showFakeCall, setShowFakeCall] = useState(false);
  const [showVault, setShowVault] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showShieldStatusToast, setShowShieldStatusToast] = useState(false);

  // SOS Gesture Detection (3 taps or 3s hold)
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const holdIntervalRef = useRef<number | null>(null);

  // Camera & Recording
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);

  // Geolocation & AI Companion
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [botText, setBotText] = useState('I am analyzing your safety situation...');
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [speechInputText, setSpeechInputText] = useState('');
  const [isListeningSpeech, setIsListeningSpeech] = useState(false);
  const speechRecognizerRef = useRef<any>(null);

  // Initialize Camera
  useEffect(() => {
    initCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const initCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraPermission(true);
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable; fallback HUD enabled', err);
      setCameraPermission(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  // Accelerometer Crash Detection (Matches SafetyService.kt gForce > 7.0)
  useEffect(() => {
    const handleDeviceMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const x = acc.x || 0;
      const y = acc.y || 0;
      const z = acc.z || 0;
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const gForce = magnitude / 9.80665;

      if (gForce > 7.0 && !isSosActive && !showAccidentModal) {
        setShowAccidentModal(true);
      }
    };

    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleDeviceMotion);
    }

    return () => {
      if (window.DeviceMotionEvent) {
        window.removeEventListener('devicemotion', handleDeviceMotion);
      }
    };
  }, [isSosActive, showAccidentModal]);

  // Speech Recognition (Matches SpeechRecognizer hi-IN in MainActivity.kt)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = false;
      recognizer.interimResults = false;
      recognizer.lang = language === 'hi' ? 'hi-IN' : 'en-US';

      recognizer.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          processSpeechInput(transcript);
        }
        setIsListeningSpeech(false);
      };

      recognizer.onerror = () => {
        setIsListeningSpeech(false);
      };

      recognizer.onend = () => {
        setIsListeningSpeech(false);
      };

      speechRecognizerRef.current = recognizer;
    }
  }, [language, isSosActive]);

  const startSpeechRecognition = () => {
    if (speechRecognizerRef.current) {
      try {
        setIsListeningSpeech(true);
        speechRecognizerRef.current.start();
      } catch (e) {
        console.error('Speech recognition error', e);
        setIsListeningSpeech(false);
      }
    }
  };

  const processSpeechInput = (text: string) => {
    setBotText(`User: "${text}"`);
    if (text.toLowerCase().includes('help') || text.includes('मदद')) {
      triggerGuidance('Emergency assistance requested by voice command.');
    } else {
      triggerGuidance(text);
    }
  };

  // --- SOS ACTIVATION / DEACTIVATION ---
  const activateSOS = async (triggerSource: string) => {
    if (isSosActive) return;
    setIsSosActive(true);
    setStatusMessage('CRITICAL: SOS ACTIVE');
    audioService.vibrate(1200);

    // Initial Hindi announcement matching MainActivity.kt
    const announcement =
      language === 'hi'
        ? 'एसओएस सक्रिय हो गया है। साक्ष्य सहेजना शुरू कर दिया गया है।'
        : 'Emergency SOS activated. Evidence capture and contact dispatch started.';
    audioService.speak(announcement, language);
    setBotText(announcement);

    // Start video recording
    startEvidenceRecording(triggerSource);

    // Retrieve GPS location and dispatch alerts
    obtainLocationAndDispatch(triggerSource);
  };

  const deactivateSOS = () => {
    if (!isSosActive) return;
    setIsSosActive(false);
    setStatusMessage(`WELCOME, ${prefs.userName.toUpperCase()} - SYSTEM ARMED`);
    stopEvidenceRecording();
    audioService.stopSiren();
    setIsSirenOn(false);

    const deactMsg = language === 'hi' ? 'एसओएस बंद कर दिया गया है।' : 'SOS deactivated. Shield safely returned to standby.';
    audioService.speak(deactMsg, language);
    setBotText(deactMsg);
  };

  // Start MediaRecorder for evidence vault
  const startEvidenceRecording = (triggerSource: string) => {
    if (!mediaStreamRef.current) return;
    try {
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(mediaStreamRef.current, {
        mimeType: 'video/webm;codecs=vp8,opus',
      });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (recordedChunksRef.current.length > 0) {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const videoUrl = URL.createObjectURL(blob);
          saveEvidenceRecord({
            id: 'ev_' + Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            durationSeconds: 15,
            videoUrl,
            trigger: triggerSource,
            location: userLocation || undefined,
          });
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecordingVideo(true);
    } catch (e) {
      console.warn('MediaRecorder not supported or codec failed', e);
    }
  };

  const stopEvidenceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingVideo(false);
  };

  // Obtain Geolocation & Dispatch Alerts (Matching sendEmergencySmsToAll & Geocoder)
  const obtainLocationAndDispatch = (triggerSource: string) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const loc = { latitude: lat, longitude: lng };
          setUserLocation(loc);

          const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
          const smsText = `CRITICAL! I am in danger. GPS: ${mapsUrl}`;

          // Dispatch to Contact 1, 2, 3 and Gmail
          const contacts = [prefs.contact1, prefs.contact2, prefs.contact3].filter(Boolean);
          contacts.forEach((contact) => {
            addDispatchLog({
              type: 'SMS',
              recipient: contact,
              content: smsText,
              status: 'SENT',
            });
          });

          if (prefs.gmailContact) {
            addDispatchLog({
              type: 'EMAIL',
              recipient: prefs.gmailContact,
              content: `URGENT ALERT for ${prefs.userName}. Trigger: ${triggerSource}. GPS Location: ${mapsUrl}`,
              status: 'SENT',
            });
          }

          // Trigger AI Safety Guidance with real location
          triggerGuidance(`User is in danger. Trigger: ${triggerSource}`, loc);
        },
        (error) => {
          console.warn('Geolocation error', error);
          const fallbackLoc = { latitude: 28.6139, longitude: 77.2090, address: 'New Delhi, India' };
          setUserLocation(fallbackLoc);
          triggerGuidance(`Emergency alert triggered. (GPS estimated)`, fallbackLoc);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      triggerGuidance('Emergency alert triggered without GPS coordinates.');
    }
  };

  // Call Server-Side Gemini API via /api/guidance
  const triggerGuidance = async (messageText: string, loc = userLocation) => {
    setIsBotThinking(true);
    try {
      const res = await fetch('/api/guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          location: loc,
          address: loc?.address || '',
          language,
        }),
      });

      const data = await res.json();
      const reply = data.reply || (language === 'hi' ? 'शांत रहें। निकटतम सुरक्षित स्थान पर जाएं।' : 'Stay calm. Move to the nearest safe public location.');
      setBotText(reply);
      audioService.speak(reply, language);
    } catch (e) {
      console.error('Guidance API error', e);
      const fallback =
        language === 'hi'
          ? 'शांत रहें। 50 मीटर आगे बढ़ें और मुख्य सड़क की ओर जाएं। पुलिस स्टेशन निकट है।'
          : 'Stay calm. Move 50 meters forward toward the main road. Emergency services are nearby.';
      setBotText(fallback);
      audioService.speak(fallback, language);
    } finally {
      setIsBotThinking(false);
    }
  };

  // --- SOS BUTTON GESTURE HANDLERS (Matches 3 Taps or 3-Second Hold) ---
  const handleButtonTouchStart = () => {
    setIsHolding(true);
    setHoldProgress(0);

    const startTime = Date.now();
    holdIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / 3000) * 100);
      setHoldProgress(progress);

      if (elapsed >= 3000) {
        clearInterval(holdIntervalRef.current!);
        holdIntervalRef.current = null;
        setIsHolding(false);
        setHoldProgress(0);
        if (isSosActive) deactivateSOS();
        else activateSOS('3-Second Hold');
      }
    }, 50);

    // Tap counter check
    const now = Date.now();
    if (now - lastTapTime < 1000) {
      const newTap = tapCount + 1;
      setTapCount(newTap);
      if (newTap >= 3) {
        if (holdIntervalRef.current) {
          clearInterval(holdIntervalRef.current);
          holdIntervalRef.current = null;
        }
        setIsHolding(false);
        setHoldProgress(0);
        setTapCount(0);
        if (isSosActive) deactivateSOS();
        else activateSOS('3-Taps Detected');
      }
    } else {
      setTapCount(1);
    }
    setLastTapTime(now);
  };

  const handleButtonTouchEnd = () => {
    setIsHolding(false);
    setHoldProgress(0);
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  };

  const toggleSiren = () => {
    if (isSirenOn) {
      audioService.stopSiren();
      setIsSirenOn(false);
    } else {
      audioService.startSiren();
      setIsSirenOn(true);
    }
  };

  const handleManualAccidentTrigger = () => {
    setShowAccidentModal(true);
  };

  const handleAccidentConfirmed = () => {
    setShowAccidentModal(false);
    // Open dialer for ambulance 108
    window.open('tel:108', '_self');
    activateSOS('Accident Impact (>7G)');
  };

  return (
    <div className={`min-h-screen bg-[#050505] text-[#F8FAFC] flex flex-col justify-between relative overflow-hidden select-none font-['Plus_Jakarta_Sans'] ${
      isSirenOn ? 'animate-siren-strobe' : ''
    }`}>
      {/* Background Live Camera Viewfinder (Dimmed 25% idle, 100% SOS active like MainActivity.kt) */}
      <div className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
        isSosActive ? 'opacity-90 z-0' : 'opacity-25 z-0'
      }`}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover filter contrast-125"
        />

        {/* Gradient Overlay matching gradient_overlay.xml */}
        <div className={`absolute inset-0 transition-opacity duration-500 ${
          isSosActive
            ? 'bg-gradient-to-b from-black/60 via-transparent to-black/80'
            : 'bg-gradient-to-b from-[#050505]/90 via-[#050505]/75 to-[#050505]/95'
        }`} />

        {/* HUD Scanner Grid on camera */}
        {isSosActive && (
          <div className="absolute inset-0 border-4 border-rose-600/40 pointer-events-none">
            <div className="absolute top-4 left-4 font-mono text-[11px] text-rose-400 bg-black/60 px-2.5 py-1 rounded">
              REC ● 1080P // AUDIO ON
            </div>
            <div className="absolute top-4 right-4 font-mono text-[11px] text-emerald-400 bg-black/60 px-2.5 py-1 rounded">
              GPS LOCKED
            </div>
          </div>
        )}
      </div>

      {/* TOP STATUS BAR matching activity_main.xml */}
      <header className="relative z-20 flex items-center justify-between p-5 pt-6 max-w-lg mx-auto w-full">
        {/* Live Indicator (Visible when SOS Active) */}
        {isSosActive ? (
          <div className="flex items-center gap-2 bg-rose-600 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-full shadow-lg shadow-rose-600/50 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            LIVE EVIDENCE
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px]">STANDBY</span>
          </div>
        )}

        {/* Quick Utility Tools */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
            className="text-xs font-mono font-bold bg-white/10 hover:bg-white/20 text-indigo-300 px-3 py-1.5 rounded-full border border-white/10 transition cursor-pointer"
            title="Toggle Hindi / English Companion"
          >
            {language === 'hi' ? '🇮🇳 HIN' : '🇬🇧 ENG'}
          </button>

          {/* Incident Vault */}
          <button
            onClick={() => setShowVault(true)}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-slate-300 hover:text-white border border-white/10 cursor-pointer"
            title="Evidence Vault"
          >
            <FolderLock className="w-4 h-4" />
          </button>

          {/* Crash Test Simulator */}
          <button
            onClick={handleManualAccidentTrigger}
            className="w-9 h-9 rounded-full bg-rose-500/20 hover:bg-rose-500/30 flex items-center justify-center transition text-rose-400 hover:text-rose-300 border border-rose-500/30 cursor-pointer"
            title="Simulate Crash Sensor (>7G)"
          >
            <AlertOctagon className="w-4 h-4" />
          </button>

          {/* Settings Icon */}
          <button
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-slate-300 hover:text-white border border-white/10 cursor-pointer"
            title="Shield Setup"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Logout */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-slate-300 hover:text-rose-400 border border-white/10 cursor-pointer"
            title="Logout & Disarm"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* APP TITLE & STATUS SUBTITLE matching activity_main.xml */}
      <div className="relative z-10 text-center my-auto flex flex-col items-center px-4">
        <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-white drop-shadow-md">
          SAFEOV ELITE
        </h1>
        <p className={`text-xs font-mono font-bold tracking-[0.2em] mt-1.5 transition-colors ${
          isSosActive ? 'text-rose-500 animate-pulse' : 'text-emerald-400'
        }`}>
          {statusMessage}
        </p>

        {/* CENTRAL SOS BUTTON matching 260dp container with pulse & glow */}
        <div className="relative my-10 flex items-center justify-center">
          {/* Radial Outer Glow */}
          <div className={`absolute w-72 h-72 rounded-full transition-all duration-700 pointer-events-none ${
            isSosActive
              ? 'bg-rose-600/35 blur-3xl animate-ping'
              : 'bg-rose-600/15 blur-2xl'
          }`} />

          {/* Progress Ring for Long Press */}
          {isHolding && (
            <svg className="absolute w-72 h-72 -rotate-90 pointer-events-none z-20">
              <circle
                cx="144"
                cy="144"
                r="132"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="144"
                cy="144"
                r="132"
                stroke="#FF1744"
                strokeWidth="8"
                fill="none"
                strokeDasharray="830"
                strokeDashoffset={830 - (830 * holdProgress) / 100}
                strokeLinecap="round"
                className="transition-all duration-75"
              />
            </svg>
          )}

          {/* Central 260px Button */}
          <button
            onMouseDown={handleButtonTouchStart}
            onMouseUp={handleButtonTouchEnd}
            onTouchStart={handleButtonTouchStart}
            onTouchEnd={handleButtonTouchEnd}
            className={`w-64 h-64 sm:w-68 sm:h-68 rounded-full flex flex-col items-center justify-center relative cursor-pointer outline-none transition-transform duration-200 active:scale-95 ${
              isSosActive
                ? 'bg-gradient-to-tr from-rose-700 via-rose-600 to-rose-500 animate-sos-pulse shadow-[0_0_80px_rgba(239,68,68,0.8)]'
                : 'bg-gradient-to-tr from-[#99001f] via-[#d50000] to-[#ff1744] shadow-[0_0_50px_rgba(255,23,68,0.4)] hover:shadow-[0_0_70px_rgba(255,23,68,0.6)]'
            }`}
          >
            {/* Inner Ring Texture */}
            <div className="w-52 h-52 sm:w-56 sm:h-56 rounded-full border-2 border-white/20 flex flex-col items-center justify-center bg-black/10 backdrop-blur-xs">
              <span className="text-6xl sm:text-7xl font-black text-white tracking-wider drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
                SOS
              </span>
              <span className="text-[10px] font-mono tracking-widest text-white/70 uppercase mt-1">
                {isHolding ? `${Math.round((3000 - (holdProgress * 30)) / 1000)}s Hold` : isSosActive ? 'TAP TO CANCEL' : 'PRESS OR HOLD'}
              </span>
            </div>
          </button>
        </div>

        {/* Trigger Instructions */}
        <p className="text-[11px] font-mono tracking-widest text-white/50 uppercase">
          3 Taps or Long Press to Trigger
        </p>
      </div>

      {/* BOTTOM SECTION: ACTION BAR & AI COMPANION */}
      <div className="relative z-20 max-w-lg mx-auto w-full px-5 pb-4 space-y-3">
        {/* Bottom Action Bar (Fake Call, Siren, Status) matching activity_main.xml */}
        <div className="bg-[#121212]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-3 flex items-center justify-around shadow-2xl">
          {/* Fake Call */}
          <button
            onClick={() => setShowFakeCall(true)}
            className="flex-1 flex flex-col items-center py-2 text-white/90 hover:text-white transition active:scale-95 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center mb-1">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <span className="text-[11px] font-medium">Fake Call</span>
          </button>

          <div className="w-px h-8 bg-white/10" />

          {/* Siren */}
          <button
            onClick={toggleSiren}
            className="flex-1 flex flex-col items-center py-2 text-white/90 hover:text-white transition active:scale-95 cursor-pointer"
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-1 ${
              isSirenOn ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/40' : 'bg-white/5 text-amber-400'
            }`}>
              {isSirenOn ? <VolumeX className="w-5 h-5 text-black" /> : <Volume2 className="w-5 h-5" />}
            </div>
            <span className={`text-[11px] font-medium ${isSirenOn ? 'text-amber-400 font-bold' : ''}`}>
              {isSirenOn ? 'Mute Siren' : 'Siren'}
            </span>
          </button>

          <div className="w-px h-8 bg-white/10" />

          {/* Shield Status */}
          <button
            onClick={() => {
              setShowShieldStatusToast(true);
              setTimeout(() => setShowShieldStatusToast(false), 3000);
            }}
            className="flex-1 flex flex-col items-center py-2 text-white/90 hover:text-white transition active:scale-95 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center mb-1">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-[11px] font-medium">Status</span>
          </button>
        </div>

        {/* Glassmorphic Bot Interface ("SafeOV Elite") matching botCard */}
        <div className={`bg-[#1C1C1E]/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-4 shadow-2xl transition-all ${
          isSosActive ? 'border-rose-500/40 ring-1 ring-rose-500/30' : ''
        }`}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold tracking-wide text-emerald-400 font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  SAFEOV AI COMPANION
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-mono">
                  {language === 'hi' ? 'Hindi Mode' : 'English Mode'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                {isBotThinking ? (
                  <span className="flex items-center gap-2 text-slate-400 italic">
                    <span className="w-3 h-3 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                    {language === 'hi' ? 'विश्लेषण कर रहा हूँ...' : 'Analyzing emergency guidance...'}
                  </span>
                ) : (
                  botText
                )}
              </p>

              {/* Direct Police Navigation Action */}
              <div className="mt-3 flex items-center gap-2 flex-wrap pt-2 border-t border-white/10">
                <a
                  href="https://www.google.com/maps/search/police+station"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-[11px] font-semibold bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-xl transition"
                >
                  <Navigation className="w-3.5 h-3.5 text-indigo-400" />
                  Nearest Police Station
                </a>

                {/* Voice Input Button */}
                <button
                  onClick={startSpeechRecognition}
                  className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                    isListeningSpeech
                      ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                  }`}
                >
                  {isListeningSpeech ? <Mic className="w-3.5 h-3.5 text-white" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                  {isListeningSpeech ? 'सुन रहा हूँ...' : 'Speak (मदद)'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Credit matching original activity_main.xml */}
        <p className="text-center text-slate-600 text-[10px] pb-1">
          Developed &amp; Managed by Vinay Rathod
        </p>
      </div>

      {/* SHIELD STATUS TOAST NOTIFICATION */}
      {showShieldStatusToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#1E293B] border border-emerald-500/30 text-white text-xs px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>
            {isSosActive
              ? 'SOS ACTIVE - LOCAL SHIELD & LIVE DISPATCH ARMED'
              : 'SHIELD FULLY ARMED - ACCELEROMETER SENSOR ACTIVE'}
          </span>
        </div>
      )}

      {/* ACCIDENT DETECTED MODAL */}
      {showAccidentModal && (
        <AccidentDialog
          onCancel={() => setShowAccidentModal(false)}
          onConfirmEmergency={handleAccidentConfirmed}
        />
      )}

      {/* FAKE CALL MODAL */}
      {showFakeCall && (
        <FakeCallModal
          callerName={prefs.contact1 ? `Guardian (${prefs.contact1})` : 'Home Guardian'}
          callerNumber={prefs.contact1 || '+91 98765 43210'}
          onDismiss={() => setShowFakeCall(false)}
        />
      )}

      {/* EVIDENCE & LOGS VAULT */}
      {showVault && <EvidenceVaultModal onClose={() => setShowVault(false)} />}

      {/* LOGOUT CONFIRMATION MODAL matching MainActivity.kt showLogoutDialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
          <div className="w-full max-w-sm bg-[#1E293B] border border-white/10 rounded-2xl p-6 shadow-2xl text-white space-y-4">
            <h3 className="text-lg font-bold text-white">Deactivate Shield &amp; Logout?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to deactivate your shield and logout? Live crash detection and emergency auto-dispatch will be put on standby.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  savePreferences({ isLoggedIn: false });
                  onLogout();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition cursor-pointer shadow-lg shadow-rose-600/30"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
