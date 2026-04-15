/**
 * dj-mix.service.ts
 * Web Audio API engine for DJ-style crossfade mixing.
 *
 * Features:
 * - Crossfade: fade out current track while fading in next
 * - Beat drop effect: brief silence + bass boost on transition
 * - Low-pass filter sweep during transition (classic DJ effect)
 * - Configurable crossfade duration (3–10s)
 */

export type MixEffect = 'crossfade' | 'echo-drop' | 'filter-sweep' | 'cut';

export interface DJMixOptions {
  crossfadeDuration: number; // seconds (3–10)
  effect: MixEffect;
  masterVolume: number; // 0–1
}

export const DEFAULT_MIX_OPTIONS: DJMixOptions = {
  crossfadeDuration: 5,
  effect: 'crossfade',
  masterVolume: 0.8,
};

export class DJMixEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  // Deck A (current)
  private deckA: HTMLAudioElement | null = null;
  private deckASource: MediaElementAudioSourceNode | null = null;
  private deckAGain: GainNode | null = null;
  private deckAFilter: BiquadFilterNode | null = null;

  // Deck B (incoming)
  private deckB: HTMLAudioElement | null = null;
  private deckBSource: MediaElementAudioSourceNode | null = null;
  private deckBGain: GainNode | null = null;
  private deckBFilter: BiquadFilterNode | null = null;

  private isMixing = false;
  private options: DJMixOptions = { ...DEFAULT_MIX_OPTIONS };

  /** Initialize the Web Audio context (must be called after user gesture). */
  init(): void {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.options.masterVolume;
    this.masterGain.connect(this.ctx.destination);
  }

  setOptions(opts: Partial<DJMixOptions>): void {
    this.options = { ...this.options, ...opts };
    if (this.masterGain) {
      this.masterGain.gain.value = this.options.masterVolume;
    }
  }

  getOptions(): DJMixOptions {
    return { ...this.options };
  }

  /** Resume context if suspended (browser autoplay policy). */
  async resume(): Promise<void> {
    if (this.ctx?.state === 'suspended') await this.ctx.resume();
  }

  private createDeck(audio: HTMLAudioElement): {
    source: MediaElementAudioSourceNode;
    gain: GainNode;
    filter: BiquadFilterNode;
  } {
    const ctx = this.ctx!;
    const source = ctx.createMediaElementSource(audio);
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 22000; // fully open by default
    filter.Q.value = 1;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    return { source, gain, filter };
  }

  /**
   * Load a track onto Deck A (the main playing deck).
   * Returns the HTMLAudioElement to control externally.
   */
  loadDeckA(url: string): HTMLAudioElement {
    this.init();
    // Reuse existing element if same src
    if (this.deckA && this.deckA.src === url) return this.deckA;

    // Disconnect old deck A
    this.deckASource?.disconnect();
    this.deckA?.pause();

    const audio = new Audio(url);
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';

    const { source, gain, filter } = this.createDeck(audio);
    gain.gain.value = 1;

    this.deckA = audio;
    this.deckASource = source;
    this.deckAGain = gain;
    this.deckAFilter = filter;

    return audio;
  }

  /**
   * Crossfade from current Deck A to a new track.
   * Returns the new HTMLAudioElement (becomes the new Deck A after mix).
   */
  async crossfadeTo(
    nextUrl: string,
    onComplete: (newAudio: HTMLAudioElement) => void
  ): Promise<void> {
    if (!this.ctx || !this.deckAGain || this.isMixing) return;
    this.isMixing = true;
    await this.resume();

    const ctx = this.ctx;
    const duration = this.options.crossfadeDuration;
    const now = ctx.currentTime;

    // Disconnect old deck B if exists
    this.deckBSource?.disconnect();
    this.deckB?.pause();

    // Create deck B with next track
    const nextAudio = new Audio(nextUrl);
    nextAudio.crossOrigin = 'anonymous';
    nextAudio.preload = 'auto';
    nextAudio.volume = 1;

    const { source: bSource, gain: bGain, filter: bFilter } = this.createDeck(nextAudio);
    this.deckB = nextAudio;
    this.deckBSource = bSource;
    this.deckBGain = bGain;
    this.deckBFilter = bFilter;

    // Start deck B silently
    bGain.gain.value = 0;

    // Wait for deck B to be ready
    await new Promise<void>((resolve) => {
      if (nextAudio.readyState >= 3) { resolve(); return; }
      nextAudio.addEventListener('canplay', () => resolve(), { once: true });
      nextAudio.load();
    });

    nextAudio.play().catch(() => {});

    const aGain = this.deckAGain!;
    const aFilter = this.deckAFilter!;

    switch (this.options.effect) {
      case 'crossfade':
        this.applyCrossfade(aGain, bGain, now, duration);
        break;

      case 'echo-drop':
        this.applyEchoDrop(aGain, bGain, aFilter, bFilter, now, duration);
        break;

      case 'filter-sweep':
        this.applyFilterSweep(aGain, bGain, aFilter, bFilter, now, duration);
        break;

      case 'cut':
        aGain.gain.setValueAtTime(0, now + 0.05);
        bGain.gain.setValueAtTime(1, now + 0.05);
        break;
    }

    // After transition: promote deck B → deck A
    setTimeout(() => {
      // Disconnect old deck A
      this.deckASource?.disconnect();
      this.deckA?.pause();

      this.deckA = this.deckB;
      this.deckASource = this.deckBSource;
      this.deckAGain = this.deckBGain;
      this.deckAFilter = this.deckBFilter;

      this.deckB = null;
      this.deckBSource = null;
      this.deckBGain = null;
      this.deckBFilter = null;

      this.isMixing = false;
      onComplete(this.deckA!);
    }, (duration + 0.5) * 1000);
  }

  // ── Effects ──────────────────────────────────────────────────────────────

  private applyCrossfade(
    aGain: GainNode, bGain: GainNode,
    now: number, dur: number
  ) {
    // Equal-power crossfade curve
    aGain.gain.setValueAtTime(aGain.gain.value, now);
    aGain.gain.linearRampToValueAtTime(0, now + dur);

    bGain.gain.setValueAtTime(0, now);
    bGain.gain.linearRampToValueAtTime(1, now + dur);
  }

  private applyEchoDrop(
    aGain: GainNode, bGain: GainNode,
    aFilter: BiquadFilterNode, _bFilter: BiquadFilterNode,
    now: number, dur: number
  ) {
    const half = dur / 2;

    // Deck A: filter closes + volume drops with echo-like steps
    aFilter.frequency.setValueAtTime(22000, now);
    aFilter.frequency.exponentialRampToValueAtTime(200, now + half);

    aGain.gain.setValueAtTime(1, now);
    aGain.gain.setValueAtTime(0.6, now + half * 0.4);
    aGain.gain.setValueAtTime(0.3, now + half * 0.7);
    aGain.gain.linearRampToValueAtTime(0, now + half + 0.3);

    // Brief silence (drop)
    bGain.gain.setValueAtTime(0, now + half + 0.3);
    // Deck B: slam in
    bGain.gain.linearRampToValueAtTime(1, now + half + 0.6);
  }

  private applyFilterSweep(
    aGain: GainNode, bGain: GainNode,
    aFilter: BiquadFilterNode, bFilter: BiquadFilterNode,
    now: number, dur: number
  ) {
    const half = dur / 2;

    // Deck A: sweep filter down while fading
    aFilter.frequency.setValueAtTime(22000, now);
    aFilter.frequency.exponentialRampToValueAtTime(80, now + dur);
    aGain.gain.setValueAtTime(1, now);
    aGain.gain.linearRampToValueAtTime(0, now + dur);

    // Deck B: sweep filter up while fading in
    bFilter.frequency.setValueAtTime(80, now + half);
    bFilter.frequency.exponentialRampToValueAtTime(22000, now + dur);
    bGain.gain.setValueAtTime(0, now + half);
    bGain.gain.linearRampToValueAtTime(1, now + dur);
  }

  /** Set master volume (0–1). */
  setMasterVolume(v: number): void {
    this.options.masterVolume = v;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(v, this.ctx!.currentTime, 0.05);
    }
  }

  get mixing(): boolean { return this.isMixing; }

  get deckAAudio(): HTMLAudioElement | null { return this.deckA; }

  destroy(): void {
    this.deckASource?.disconnect();
    this.deckBSource?.disconnect();
    this.deckA?.pause();
    this.deckB?.pause();
    this.ctx?.close();
    this.ctx = null;
  }
}

// Singleton
export const djMixEngine = new DJMixEngine();
