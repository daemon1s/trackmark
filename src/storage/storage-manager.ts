import { VideoData, Track, StorageSchema } from '../types';

export class StorageManager {
  static async getVideoData(videoId: string): Promise<VideoData | null> {
    try {
      const result = await chrome.storage.local.get(videoId);
      return (result[videoId] as VideoData) || null;
    } catch (error) {
      console.error('[TrackMark] Error getting video data:', error);
      return null;
    }
  }

  static async saveVideoData(data: VideoData): Promise<void> {
    try {
      data.lastUpdated = Date.now();
      await chrome.storage.local.set({ [data.videoId]: data });
    } catch (error) {
      console.error('[TrackMark] Error saving video data:', error);
    }
  }

  static async getAllData(): Promise<StorageSchema> {
    try {
      const all = await chrome.storage.local.get(null);
      return all as StorageSchema;
    } catch (error) {
      console.error('[TrackMark] Error getting all data:', error);
      return {};
    }
  }

  static async upsertTrack(videoId: string, videoTitle: string, duration: number, track: Track): Promise<VideoData> {
    let videoData = await this.getVideoData(videoId);
    if (!videoData) {
      videoData = {
        videoId,
        videoTitle,
        duration,
        tracks: [],
        activeTrackId: null,
        isLoopActive: false,
        lastUpdated: Date.now()
      };
    }

    const index = videoData.tracks.findIndex(t => t.id === track.id);
    if (index >= 0) {
      videoData.tracks[index] = { ...track, updatedAt: Date.now() };
    } else {
      videoData.tracks.push({ ...track, createdAt: Date.now(), updatedAt: Date.now() });
    }

    videoData.tracks.sort((a, b) => a.startTime - b.startTime);

    await this.saveVideoData(videoData);
    return videoData;
  }

  static async deleteTrack(videoId: string, trackId: string): Promise<VideoData | null> {
    const videoData = await this.getVideoData(videoId);
    if (!videoData) return null;

    videoData.tracks = videoData.tracks.filter(t => t.id !== trackId);
    if (videoData.activeTrackId === trackId) {
      videoData.activeTrackId = null;
      videoData.isLoopActive = false;
    }

    await this.saveVideoData(videoData);
    return videoData;
  }

  static async toggleFavorite(videoId: string, trackId: string): Promise<boolean> {
    const videoData = await this.getVideoData(videoId);
    if (!videoData) return false;

    const track = videoData.tracks.find(t => t.id === trackId);
    if (!track) return false;

    track.isFavorite = !track.isFavorite;
    track.updatedAt = Date.now();
    await this.saveVideoData(videoData);
    return track.isFavorite;
  }

  static async getEqSettings(): Promise<{ presetId: string; gains: number[] } | null> {
    try {
      const res = await chrome.storage.local.get('__tm_global_eq');
      return (res['__tm_global_eq'] as { presetId: string; gains: number[] }) || null;
    } catch {
      return null;
    }
  }

  static async saveEqSettings(settings: { presetId: string; gains: number[] }): Promise<void> {
    try {
      await chrome.storage.local.set({ '__tm_global_eq': settings });
    } catch (e) {
      console.error('[TrackMark] Error saving EQ settings:', e);
    }
  }
}

