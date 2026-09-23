// Audio and Speech Service for SafeOV Elite

class AudioService {
  private audioCtx: AudioContext | null = null;
  private sirenOsc1: OscillatorNode | null = null;
  private sirenOsc2: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenInterval: number | null = null;
  public isSirenPlaying = false;

  private ringtoneInterval: number | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // --- SIREN IMPLEMENTATION ---
  public startSiren(): boolean {
    if (this.isSirenPlaying) return true;
    try {
      const ctx = this.getAudioContext();
      this.sirenGain = ctx.createGain();
      this.sirenGain.gain.setValueAtTime(0.3, ctx.currentTime);
      this.sirenGain.connect(ctx.destination);

      this.sirenOsc1 = ctx.createOscillator();
      this.sirenOsc1.type = 'sawtooth';
      this.sirenOsc1.frequency.setValueAtTime(700, ctx.currentTime);
      this.sirenOsc1.connect(this.sirenGain);
      this.sirenOsc1.start();

      this.sirenOsc2 = ctx.createOscillator();
      this.sirenOsc2.type = 'sine';
      this.sirenOsc2.frequency.setValueAtTime(1200, ctx.currentTime);
      this.sirenOsc2.connect(this.sirenGain);
      this.sirenOsc2.start();

      let toggle = false;
      this.sirenInterval = window.setInterval(() => {
        if (!this.sirenOsc1 || !this.sirenOsc2 || !this.audioCtx) return;
        const now = this.audioCtx.currentTime;
        if (toggle) {
          this.sirenOsc1.frequency.exponentialRampToValueAtTime(1400, now + 0.25);
          this.sirenOsc2.frequency.exponentialRampToValueAtTime(750, now + 0.25);
        } else {
          this.sirenOsc1.frequency.exponentialRampToValueAtTime(750, now + 0.25);
          this.sirenOsc2.frequency.exponentialRampToValueAtTime(1400, now + 0.25);
        }
        toggle = !toggle;
      }, 350);

      this.isSirenPlaying = true;
      return true;
    } catch (e) {
      console.error('Failed to start siren', e);
      return false;
    }
  }

  public stopSiren() {
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
    try {
      if (this.sirenOsc1) {
        this.sirenOsc1.stop();
        this.sirenOsc1.disconnect();
        this.sirenOsc1 = null;
      }
      if (this.sirenOsc2) {
        this.sirenOsc2.stop();
        this.sirenOsc2.disconnect();
        this.sirenOsc2 = null;
      }
      if (this.sirenGain) {
        this.sirenGain.disconnect();
        this.sirenGain = null;
      }
    } catch (e) {
      console.error('Error stopping siren', e);
    }
    this.isSirenPlaying = false;
  }

  // --- ACCIDENT ALARM PULSES ---
  public playAccidentBeep() {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(950, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      console.error('Failed to play accident beep', e);
    }
  }

  // --- FAKE CALL RINGTONE ---
  public startRingtone() {
    this.stopRingtone();
    const playRingBurst = () => {
      try {
        const ctx = this.getAudioContext();
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.frequency.setValueAtTime(440, ctx.currentTime); // Standard US/UK ring tone pair
        osc2.frequency.setValueAtTime(480, ctx.currentTime);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 1.2);
        osc2.stop(ctx.currentTime + 1.2);
      } catch (e) {
        console.error('Ringtone error', e);
      }
    };

    playRingBurst();
    this.ringtoneInterval = window.setInterval(playRingBurst, 2500);
  }

  public stopRingtone() {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }

  // --- TEXT TO SPEECH (Hindi & English) ---
  public speak(text: string, lang: 'hi' | 'en' = 'hi', onDone?: () => void) {
    if (!('speechSynthesis' in window)) {
      if (onDone) onDone();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      // Find matching voice
      const voices = window.speechSynthesis.getVoices();
      if (lang === 'hi') {
        utterance.lang = 'hi-IN';
        const hindiVoice = voices.find(v => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi') || v.lang.includes('IN'));
        if (hindiVoice) utterance.voice = hindiVoice;
      } else {
        utterance.lang = 'en-US';
        const engVoice = voices.find(v => v.lang.includes('en'));
        if (engVoice) utterance.voice = engVoice;
      }

      if (onDone) {
        utterance.onend = () => onDone();
        utterance.onerror = () => onDone();
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Speech synthesis error', e);
      if (onDone) onDone();
    }
  }

  // --- VIBRATION (Matches Android Vibrator) ---
  public vibrate(durationMs: number = 1000) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(durationMs);
      } catch (e) {
        console.warn('Vibration failed', e);
      }
    }
  }
}

export const audioService = new AudioService();
