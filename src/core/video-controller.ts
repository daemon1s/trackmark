import { Track, VideoControllerState, LooperStateListener } from '../types';

export class VideoController {
  private video: HTMLVideoElement | null = null;
  private activeTrack: Track | null = null;
  private isLoopActive: boolean = false;
  private listeners: LooperStateListener[] = [];
  private isSeekingGuard: boolean = false;
  private isProgrammaticSeek: boolean = false;
  private pollInterval: number | null = null;
  private currentVideoId: string | null = null;

  constructor() {
    this.attachToVideo();
  }

  public attachToVideo(): boolean {
    const videoEl = document.querySelector('video.html5-main-video') as HTMLVideoElement;
    if (videoEl && videoEl !== this.video) {
      this.detachListeners();
      this.video = videoEl;
      this.attachListeners();
      console.log('[TrackMark] Attached to YouTube HTML5 video element');
      this.notifyState();
      return true;
    }
    return !!this.video;
  }

  public setVideoId(videoId: string | null): void {
    this.currentVideoId = videoId;
    this.notifyState();
  }

  public setActiveTrack(track: Track | null): void {
    this.activeTrack = track;
    this.notifyState();
  }

  public setLoop(active: boolean): void {
    this.isLoopActive = active;

    if (this.isLoopActive && this.activeTrack && this.video) {
      const current = this.video.currentTime;
      if (current < this.activeTrack.startTime || current >= this.activeTrack.endTime) {
        this.seekTo(this.activeTrack.startTime);
      }
    }

    this.notifyState();
  }

  public toggleLoop(): boolean {
    this.setLoop(!this.isLoopActive);
    return this.isLoopActive;
  }

  public seekTo(timeInSeconds: number): void {
    if (!this.video) {
      this.attachToVideo();
    }
    if (this.video) {
      const targetTime = Math.max(0, Math.min(timeInSeconds, this.video.duration || Infinity));
      this.isSeekingGuard = true;
      this.isProgrammaticSeek = true;
      this.video.currentTime = targetTime;
      setTimeout(() => {
        this.isSeekingGuard = false;
        this.isProgrammaticSeek = false;
      }, 250);
    }
  }

  public getCurrentTime(): number {
    return this.video?.currentTime || 0;
  }

  public getVideoElement(): HTMLVideoElement | null {
    return this.video;
  }

  public getDuration(): number {
    return this.video?.duration || 0;
  }

  public isPlaying(): boolean {
    return !!(this.video && !this.video.paused && !this.video.ended && this.video.readyState > 2);
  }

  public isAdPlaying(): boolean {
    const moviePlayer = document.querySelector('#movie_player');
    if (!moviePlayer) return false;
    return moviePlayer.classList.contains('ad-showing') || moviePlayer.classList.contains('ad-interrupting');
  }

  public subscribe(listener: LooperStateListener): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public getState(): VideoControllerState {
    return {
      videoId: this.currentVideoId,
      currentTime: this.getCurrentTime(),
      duration: this.getDuration(),
      isPlaying: this.isPlaying(),
      isLoopActive: this.isLoopActive,
      activeTrack: this.activeTrack,
      isAdPlaying: this.isAdPlaying(),
    };
  }

  private attachListeners(): void {
    if (!this.video) return;

    this.video.addEventListener('timeupdate', this.handleTimeUpdate);
    this.video.addEventListener('play', this.handleMediaEvent);
    this.video.addEventListener('pause', this.handleMediaEvent);
    this.video.addEventListener('ended', this.handleMediaEvent);
    this.video.addEventListener('seeking', this.handleUserSeeking);
    this.video.addEventListener('seeked', this.handleMediaEvent);

    this.pollInterval = window.setInterval(() => {
      if (!this.video || !document.contains(this.video)) {
        this.attachToVideo();
      }
    }, 1000);
  }

  private detachListeners(): void {
    if (!this.video) return;

    this.video.removeEventListener('timeupdate', this.handleTimeUpdate);
    this.video.removeEventListener('play', this.handleMediaEvent);
    this.video.removeEventListener('pause', this.handleMediaEvent);
    this.video.removeEventListener('ended', this.handleMediaEvent);
    this.video.removeEventListener('seeking', this.handleUserSeeking);
    this.video.removeEventListener('seeked', this.handleMediaEvent);

    if (this.pollInterval !== null) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private handleUserSeeking = (): void => {
    if (!this.video || this.isProgrammaticSeek) return;

    const current = this.video.currentTime;

    if (this.isLoopActive && this.activeTrack) {
      if (current < this.activeTrack.startTime - 0.75 || current > this.activeTrack.endTime + 0.75) {
        console.log(`[TrackMark] User manual seek detected (${current.toFixed(2)}s outside ${this.activeTrack.startTime}s - ${this.activeTrack.endTime}s). Disabling loop.`);
        this.isLoopActive = false;
      }
    }

    this.notifyState();
  };

  private handleTimeUpdate = (): void => {
    if (!this.video) return;

    if (this.isAdPlaying()) {
      return;
    }

    const current = this.video.currentTime;

    if (this.isLoopActive && this.activeTrack && !this.isSeekingGuard) {
      const { startTime, endTime } = this.activeTrack;

      if (endTime > startTime) {
        if (current >= endTime) {
          this.isSeekingGuard = true;
          this.isProgrammaticSeek = true;
          this.video.currentTime = startTime;

          if (this.video.paused) {
            this.video.play().catch(() => {});
          }

          setTimeout(() => {
            this.isSeekingGuard = false;
            this.isProgrammaticSeek = false;
          }, 250);
        }
      }
    }

    this.notifyState();
  };

  private handleMediaEvent = (): void => {
    this.notifyState();
  };

  private notifyState(): void {
    const state = this.getState();
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (err) {
        console.error('[TrackMark] Listener error:', err);
      }
    });
  }

  public destroy(): void {
    this.detachListeners();
    this.listeners = [];
    this.video = null;
  }
}
