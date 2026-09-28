/**
 * Audio, BGM Music and Speech Synthesis / Recognition utilities
 * Designed to work 100% offline with zero external network dependencies!
 */

// Offline Web Audio API Synthesizers for game feel & instant feedback
class SoundFX {
  private ctx: AudioContext | null = null;
  private sfxEnabled = true;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vanta_sfx_enabled');
      if (saved !== null) {
        this.sfxEnabled = saved === 'true';
      }
    }
  }

  isSfxEnabled(): boolean {
    return this.sfxEnabled;
  }

  toggleSfx(): boolean {
    this.sfxEnabled = !this.sfxEnabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('vanta_sfx_enabled', String(this.sfxEnabled));
    }
    return this.sfxEnabled;
  }

  setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('vanta_sfx_enabled', String(enabled));
    }
  }

  private initCtx() {
    if (!this.sfxEnabled) return;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playCorrect() {
    if (!this.sfxEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.16); // G5
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.24); // C6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {
      console.warn('Audio play error', e);
    }
  }

  playWrong() {
    if (!this.sfxEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.25);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      console.warn('Audio play error', e);
    }
  }

  playCoin() {
    if (!this.sfxEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn('Audio play error', e);
    }
  }

  playLevelUp() {
    if (!this.sfxEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.3);
      });
    } catch (e) {
      console.warn('Audio play error', e);
    }
  }

  playClick() {
    if (!this.sfxEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      console.warn('Audio play error', e);
    }
  }

  playTimerTick(isUrgent = false) {
    if (!this.sfxEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isUrgent ? 880 : 540, now);
      gain.gain.setValueAtTime(isUrgent ? 0.15 : 0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {
      console.warn('Audio play error', e);
    }
  }

  playCountdown(step: number) {
    if (!this.sfxEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freq = step === 0 ? 987.77 : 440; // High tone on GO (0)
      const duration = step === 0 ? 0.4 : 0.15;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('Audio play error', e);
    }
  }

  playStreakFlame() {
    if (!this.sfxEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(740, now + 0.22);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn('Audio play error', e);
    }
  }

  playVictoryFanfare() {
    if (!this.sfxEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const chord = [523.25, 659.25, 783.99, 1046.50];
      const now = this.ctx.currentTime;

      chord.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.12;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.6);
      });
    } catch (e) {
      console.warn('Audio play error', e);
    }
  }
}

export const soundEffects = new SoundFX();

// ==========================================
// PROCEDURAL BACKGROUND MUSIC (BGM) SYNTHESIZER
// Upbeat Traditional-Modern Chinese Pentatonic Harmony
// Loops seamlessly with zero network dependencies!
// ==========================================
class BgmPlayer {
  private ctx: AudioContext | null = null;
  private isPlayingState = false;
  private timer: number | null = null;
  private volume = 0.35;
  private masterGain: GainNode | null = null;
  private noteIndex = 0;

  // Chinese Pentatonic Scale (Gong, Shang, Jiao, Zhi, Yu: C4, D4, E4, G4, A4, C5, D5, E5)
  private melodyNotes = [
    523.25, 587.33, 659.25, 783.99, 880.00, 783.99, 659.25, 587.33,
    523.25, 659.25, 783.99, 1046.50, 880.00, 783.99, 659.25, 523.25,
    392.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 783.99,
    659.25, 587.33, 523.25, 440.00, 392.00, 440.00, 523.25, 523.25,
  ];

  // Bass chords
  private bassNotes = [261.63, 392.00, 329.63, 261.63];

  constructor() {
    if (typeof window !== 'undefined') {
      const savedVolume = localStorage.getItem('vanta_bgm_volume');
      if (savedVolume !== null) {
        this.volume = parseFloat(savedVolume) || 0.35;
      }
    }
  }

  private initAudio() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  isPlaying(): boolean {
    return this.isPlayingState;
  }

  getVolume(): number {
    return this.volume;
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('vanta_bgm_volume', String(this.volume));
    }
  }

  start() {
    if (this.isPlayingState) return;
    this.initAudio();
    if (!this.ctx || !this.masterGain) return;

    this.isPlayingState = true;
    this.noteIndex = 0;
    this.scheduleNextBeat();
  }

  stop() {
    this.isPlayingState = false;
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  toggle(): boolean {
    if (this.isPlayingState) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  private scheduleNextBeat() {
    if (!this.isPlayingState || !this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const freq = this.melodyNotes[this.noteIndex % this.melodyNotes.length];

    // 1. Pluck note (Guzheng / Pipa bell tone)
    const osc = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    osc.type = this.noteIndex % 4 === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    noteGain.gain.setValueAtTime(0.08, now);
    noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(noteGain);
    noteGain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.4);

    // 2. Gentle Bass pad every 8 beats
    if (this.noteIndex % 8 === 0) {
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      const bassFreq = this.bassNotes[Math.floor(this.noteIndex / 8) % this.bassNotes.length];

      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(bassFreq, now);
      bassGain.gain.setValueAtTime(0.06, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      bassOsc.connect(bassGain);
      bassGain.connect(this.masterGain);

      bassOsc.start(now);
      bassOsc.stop(now + 1.8);
    }

    this.noteIndex++;
    // Tempo: ~220ms per 16th beat
    this.timer = window.setTimeout(() => {
      this.scheduleNextBeat();
    }, 240);
  }
}

export const bgmPlayer = new BgmPlayer();

// Web Speech API Text-to-Speech
export function speakChinese(text: string, slow = false) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported');
    return;
  }

  window.speechSynthesis.cancel(); // Cancel any ongoing speech
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = slow ? 0.72 : 0.95;
  utterance.pitch = 1.05;

  // Attempt to select native Chinese voice if available
  const voices = window.speechSynthesis.getVoices();
  const zhVoice = voices.find(
    v => v.lang.startsWith('zh') || v.lang.includes('cmn') || v.name.includes('Chinese')
  );
  if (zhVoice) {
    utterance.voice = zhVoice;
  }

  window.speechSynthesis.speak(utterance);
}

export function speakThai(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'th-TH';
  utterance.rate = 1.0;
  window.speechSynthesis.speak(utterance);
}

// Web Speech API Voice Recognition (Chinese speech to text)
export function createSpeechRecognizer(
  onResult: (transcript: string) => void,
  onError?: (err: any) => void,
  onEnd?: () => void
) {
  if (typeof window === 'undefined') return null;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'zh-CN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };

  recognition.onerror = (event: any) => {
    if (onError) onError(event);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return recognition;
}
