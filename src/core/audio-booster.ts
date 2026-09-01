import { EQPreset } from '../types';
import { StorageManager } from '../storage/storage-manager';

export const EQ_FREQUENCIES = [60, 150, 400, 1000, 2400, 15000];

export const EQ_PRESETS: Record<string, EQPreset> = {
  flat: {
    id: 'flat',
    name: 'Flat (Off)',
    gains: [0, 0, 0, 0, 0, 0]
  },
  bass_boost: {
    id: 'bass_boost',
    name: 'Bass Boost (Trap / Reggaeton)',
    gains: [7, 5, 2, 0, 0, 0]
  },
  electronic: {
    id: 'electronic',
    name: 'Electronic / EDM / Dance',
    gains: [6, 4, 0, 2, 4, 5]
  },
  rock: {
    id: 'rock',
    name: 'Rock / Metal',
    gains: [5, 3, -1, 2, 4, 5]
  },
  pop: {
    id: 'pop',
    name: 'Pop',
    gains: [-1, 2, 4, 4, 2, -1]
  },
  hiphop: {
    id: 'hiphop',
    name: 'Hip-Hop / R&B',
    gains: [6, 5, 0, 2, 1, 3]
  },
  vocal: {
    id: 'vocal',
    name: 'Vocal / Podcast Clarity',
    gains: [-4, -2, 2, 5, 4, 1]
  },
  acoustic: {
    id: 'acoustic',
    name: 'Acoustic / Jazz',
    gains: [3, 2, 1, 2, 3, 3]
  },
  treble_boost: {
    id: 'treble_boost',
    name: 'Treble Boost (Brightness)',
    gains: [0, 0, 0, 2, 5, 7]
  }
};

export class AudioBooster {
  private audioCtx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private currentVideo: HTMLVideoElement | null = null;

  private boostMultiplier: number = 1.0;
  private isBoostEnabled: boolean = false;
  private currentPresetId: string = 'flat';
  private customGains: number[] = [0, 0, 0, 0, 0, 0];

  constructor() {
    this.loadSavedEq();
    this.loadSavedBoost();
  }

  private async loadSavedBoost(): Promise<void> {
    const saved = await StorageManager.getBoostSettings();
    if (saved) {
      this.boostMultiplier = saved.multiplier;
      this.isBoostEnabled = saved.enabled;
      this.applySettings();
    }
  }

  private async loadSavedEq(): Promise<void> {
    const saved = await StorageManager.getEqSettings();
    if (saved) {
      this.currentPresetId = saved.presetId || 'flat';
      if (Array.isArray(saved.gains) && saved.gains.length === 6) {
        this.customGains = [...saved.gains];
      }
      this.applySettings();
    }
  }


  public init(video: HTMLVideoElement): void {
    if (this.currentVideo === video && this.audioCtx) return;

    try {
      this.currentVideo = video;
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();

      this.gainNode = this.audioCtx.createGain();

      this.compressorNode = this.audioCtx.createDynamicsCompressor();
      this.compressorNode.threshold.setValueAtTime(-12, this.audioCtx.currentTime);
      this.compressorNode.knee.setValueAtTime(24, this.audioCtx.currentTime);
      this.compressorNode.ratio.setValueAtTime(12, this.audioCtx.currentTime);
      this.compressorNode.attack.setValueAtTime(0.003, this.audioCtx.currentTime);
      this.compressorNode.release.setValueAtTime(0.2, this.audioCtx.currentTime);

      this.eqFilters = EQ_FREQUENCIES.map((freq, index) => {
        const filter = this.audioCtx!.createBiquadFilter();
        if (index === 0) {
          filter.type = 'lowshelf';
        } else if (index === EQ_FREQUENCIES.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.setValueAtTime(1.4, this.audioCtx!.currentTime);
        }
        filter.frequency.setValueAtTime(freq, this.audioCtx!.currentTime);
        filter.gain.setValueAtTime(this.customGains[index] || 0, this.audioCtx!.currentTime);
        return filter;
      });

      this.sourceNode = this.audioCtx.createMediaElementSource(video);

      let lastNode: AudioNode = this.sourceNode;
      for (const filter of this.eqFilters) {
        lastNode.connect(filter);
        lastNode = filter;
      }
      lastNode.connect(this.gainNode);
      this.gainNode.connect(this.compressorNode);
      this.compressorNode.connect(this.audioCtx.destination);

      this.applySettings();
    } catch (e) {
      console.warn('[TrackMark] AudioContext initialization deferred or already hooked:', e);
    }
  }

  public setBoost(multiplier: number): void {
    this.boostMultiplier = Math.max(1.0, Math.min(6.0, multiplier));
    this.applySettings();
    StorageManager.saveBoostSettings({
      multiplier: this.boostMultiplier,
      enabled: this.isBoostEnabled
    });
  }

  public setEnabled(enabled: boolean): void {
    this.isBoostEnabled = enabled;
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    this.applySettings();
    StorageManager.saveBoostSettings({
      multiplier: this.boostMultiplier,
      enabled: this.isBoostEnabled
    });
  }

  public getBoost(): number {
    return this.boostMultiplier;
  }

  public getIsEnabled(): boolean {
    return this.isBoostEnabled;
  }

  public setBandGain(index: number, gainDb: number): void {
    if (index < 0 || index >= this.customGains.length) return;
    const clampedGain = Math.max(-12, Math.min(12, gainDb));
    this.customGains[index] = clampedGain;
    this.currentPresetId = 'custom';

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    if (this.eqFilters[index] && this.audioCtx) {
      this.eqFilters[index].gain.setValueAtTime(clampedGain, this.audioCtx.currentTime);
    }

    StorageManager.saveEqSettings({
      presetId: this.currentPresetId,
      gains: [...this.customGains]
    });
  }

  public setPreset(presetId: string): void {
    const preset = EQ_PRESETS[presetId];
    if (!preset) return;

    this.currentPresetId = presetId;
    this.customGains = [...preset.gains];

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    if (this.audioCtx && this.eqFilters.length === this.customGains.length) {
      const now = this.audioCtx.currentTime;
      this.customGains.forEach((gain, i) => {
        this.eqFilters[i].gain.setValueAtTime(gain, now);
      });
    }

    StorageManager.saveEqSettings({
      presetId: this.currentPresetId,
      gains: [...this.customGains]
    });
  }

  public resetEq(): void {
    this.setPreset('flat');
  }

  public getGains(): number[] {
    return [...this.customGains];
  }

  public getCurrentPreset(): string {
    return this.currentPresetId;
  }

  private applySettings(): void {
    if (!this.gainNode || !this.audioCtx) return;

    const now = this.audioCtx.currentTime;

    if (!this.isBoostEnabled) {
      this.gainNode.gain.setValueAtTime(1.0, now);
    } else {
      this.gainNode.gain.setValueAtTime(this.boostMultiplier, now);
    }

    if (this.eqFilters.length === this.customGains.length) {
      this.customGains.forEach((gain, i) => {
        this.eqFilters[i].gain.setValueAtTime(gain, now);
      });
    }
  }
}

