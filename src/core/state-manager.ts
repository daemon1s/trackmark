import { VideoData, Track, VideoControllerState } from '../types';
import { StorageManager } from '../storage/storage-manager';
import { VideoController } from './video-controller';
import { SPANavigator } from './spa-navigator';
import { AudioBooster } from './audio-booster';

export type AppStateListener = (videoData: VideoData | null, controllerState: VideoControllerState) => void;

export class StateManager {
  public videoController: VideoController;
  public spaNavigator: SPANavigator;
  public audioBooster: AudioBooster;
  private currentVideoData: VideoData | null = null;
  private listeners: AppStateListener[] = [];

  constructor() {
    this.videoController = new VideoController();
    this.spaNavigator = new SPANavigator();
    this.audioBooster = new AudioBooster();
    this.init();
  }

  private init(): void {
    this.spaNavigator.onVideoChange(async (videoId) => {
      this.videoController.attachToVideo();
      this.videoController.setVideoId(videoId);
      if (videoId) {
        setTimeout(async () => {
          this.videoController.attachToVideo();
          await this.loadVideoData(videoId);
        }, 150);
      } else {
        this.currentVideoData = null;
        this.videoController.setActiveTrack(null);
        this.videoController.setLoop(false);
        this.notify();
      }
    });

    this.videoController.subscribe((controllerState) => {
      this.autoSyncActiveTrack(controllerState.currentTime);
      this.notify();
    });
  }

  public async loadVideoData(videoId: string): Promise<VideoData> {
    let data = await StorageManager.getVideoData(videoId);
    const videoTitle = this.extractVideoTitle();
    const duration = this.videoController.getDuration();

    if (!data) {
      data = {
        videoId,
        videoTitle,
        duration,
        tracks: [],
        activeTrackId: null,
        isLoopActive: false,
        lastUpdated: Date.now()
      };
    } else {
      if (videoTitle && data.videoTitle !== videoTitle) {
        data.videoTitle = videoTitle;
      }
    }

    this.currentVideoData = data;

    if (data.activeTrackId) {
      const track = data.tracks.find(t => t.id === data.activeTrackId) || null;
      this.videoController.setActiveTrack(track);
    } else {
      this.videoController.setActiveTrack(null);
    }
    this.videoController.setLoop(data.isLoopActive);

    this.notify();
    return data;
  }

  private autoSyncActiveTrack(currentTime: number): void {
    if (!this.currentVideoData || this.videoController.getState().isLoopActive) {
      return;
    }

    const currentTrack = this.currentVideoData.tracks.find(
      t => currentTime >= t.startTime && currentTime < t.endTime
    );

    if (currentTrack && currentTrack.id !== this.currentVideoData.activeTrackId) {
      this.currentVideoData.activeTrackId = currentTrack.id;
      this.videoController.setActiveTrack(currentTrack);
    }
  }

  public async setLoop(active: boolean): Promise<void> {
    this.videoController.setLoop(active);
    if (this.currentVideoData) {
      this.currentVideoData.isLoopActive = active;
      await StorageManager.saveVideoData(this.currentVideoData);
    }
    this.notify();
  }

  public async toggleLoop(): Promise<boolean> {
    const newState = this.videoController.toggleLoop();
    if (this.currentVideoData) {
      this.currentVideoData.isLoopActive = newState;
      await StorageManager.saveVideoData(this.currentVideoData);
    }
    this.notify();
    return newState;
  }

  public async selectTrack(trackId: string, jumpToStart: boolean = true): Promise<void> {
    if (!this.currentVideoData) return;

    const track = this.currentVideoData.tracks.find(t => t.id === trackId) || null;
    this.currentVideoData.activeTrackId = trackId;
    this.videoController.setActiveTrack(track);

    if (track && jumpToStart) {
      this.videoController.seekTo(track.startTime);
    }

    await StorageManager.saveVideoData(this.currentVideoData);
    this.notify();
  }

  public async addTrack(track: Omit<Track, 'id' | 'createdAt' | 'updatedAt'>): Promise<Track | null> {
    if (!this.currentVideoData) return null;

    const newTrack: Track = {
      ...track,
      id: `trk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const updated = await StorageManager.upsertTrack(
      this.currentVideoData.videoId,
      this.currentVideoData.videoTitle,
      this.videoController.getDuration(),
      newTrack
    );

    this.currentVideoData = updated;
    this.notify();
    return newTrack;
  }

  public async importBulkTracks(candidates: Array<{ title: string; startTime: number; endTime: number }>): Promise<number> {
    if (!this.currentVideoData || candidates.length === 0) return 0;

    let count = 0;
    for (const c of candidates) {
      const newTrack: Track = {
        id: `trk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${count}`,
        title: c.title,
        startTime: c.startTime,
        endTime: c.endTime,
        isFavorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      this.currentVideoData.tracks.push(newTrack);
      count++;
    }

    this.currentVideoData.tracks.sort((a, b) => a.startTime - b.startTime);
    await StorageManager.saveVideoData(this.currentVideoData);
    this.notify();
    return count;
  }

  public async deleteTrack(trackId: string): Promise<void> {
    if (!this.currentVideoData) return;

    const updated = await StorageManager.deleteTrack(this.currentVideoData.videoId, trackId);
    if (updated) {
      this.currentVideoData = updated;
      if (this.currentVideoData.activeTrackId === trackId) {
        this.videoController.setActiveTrack(null);
      }
      this.notify();
    }
  }

  public async clearAllTracks(): Promise<void> {
    if (!this.currentVideoData) return;
    const updated = await StorageManager.clearAllTracks(this.currentVideoData.videoId);
    if (updated) {
      this.currentVideoData = updated;
      this.videoController.setActiveTrack(null);
      this.notify();
    }
  }

  public async toggleFavorite(trackId: string): Promise<boolean> {
    if (!this.currentVideoData) return false;

    const isFav = await StorageManager.toggleFavorite(this.currentVideoData.videoId, trackId);
    const track = this.currentVideoData.tracks.find(t => t.id === trackId);
    if (track) {
      track.isFavorite = isFav;
    }
    this.notify();
    return isFav;
  }

  public subscribe(listener: AppStateListener): () => void {
    this.listeners.push(listener);
    listener(this.currentVideoData, this.videoController.getState());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public getVideoData(): VideoData | null {
    return this.currentVideoData;
  }

  private extractVideoTitle(): string {
    const titleEl = document.querySelector('h1.ytd-watch-metadata yt-formatted-string, #title h1');
    return titleEl?.textContent?.trim() || document.title.replace(' - YouTube', '').trim() || 'YouTube Video';
  }

  private notify(): void {
    const controllerState = this.videoController.getState();
    this.listeners.forEach(cb => {
      try {
        cb(this.currentVideoData, controllerState);
      } catch (err) {
        console.error('[TrackMark] StateManager notification error:', err);
      }
    });
  }
}
