/**
 * Modular Voice & Speech Service
 * Supports Text-to-Speech (TTS), Optional Speech-to-Text (STT),
 * accessible audio playback controls, and graceful degradation.
 */

export interface VoicePlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentText: string | null;
  isSupported: boolean;
}

export class VoiceService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isMuted: boolean = false;
  private listeners: Array<(state: VoicePlaybackState) => void> = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public isSpeechSupported(): boolean {
    return !!this.synth;
  }

  public isRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  public subscribe(listener: (state: VoicePlaybackState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }

  public getState(): VoicePlaybackState {
    return {
      isPlaying: !!(this.synth && this.synth.speaking && !this.synth.paused),
      isPaused: !!(this.synth && this.synth.paused),
      currentText: this.currentUtterance ? this.currentUtterance.text : null,
      isSupported: this.isSpeechSupported(),
    };
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.stop();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Speak a natural-language statement aloud with configured rate and pitch
   */
  public speak(
    text: string,
    options?: { rate?: number; pitch?: number; onEnd?: () => void }
  ): void {
    if (!this.synth || this.isMuted) return;

    // Cancel any ongoing speech
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate || 1.0;
    utterance.pitch = options?.pitch || 1.0;

    // Pick English or Indian English voice if available
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.lang.includes('en-US')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => this.notify();
    utterance.onend = () => {
      this.currentUtterance = null;
      this.notify();
      options?.onEnd?.();
    };
    utterance.onerror = (e) => {
      console.warn('[VoiceService] Speech synthesis error:', e);
      this.currentUtterance = null;
      this.notify();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
    this.notify();
  }

  public pause(): void {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
      this.notify();
    }
  }

  public resume(): void {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
      this.notify();
    }
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
      this.notify();
    }
  }

  public replay(): void {
    if (this.currentUtterance) {
      const text = this.currentUtterance.text;
      this.speak(text);
    }
  }

  /**
   * Optional Speech-to-Text Input with Permission Handling
   */
  public startSpeechRecognition(
    onResult: (transcript: string) => void,
    onError: (errorMsg: string) => void
  ): () => void {
    if (!this.isRecognitionSupported()) {
      onError('Speech recognition is not supported in this browser. Please use keyboard input.');
      return () => {};
    }

    try {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          onError('Microphone permission denied. Please allow microphone access to speak.');
        } else {
          onError(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.start();

      return () => {
        try {
          recognition.stop();
        } catch {}
      };
    } catch (e: any) {
      onError(e?.message || 'Failed to initialize speech recognition.');
      return () => {};
    }
  }
}

export const voiceService = new VoiceService();
