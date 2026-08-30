export interface EQPreset {
  id: string;
  name: string;
  gains: number[]; // 6 values in dB [-12 to +12]
}

export interface EqualizerSettings {
  enabled: boolean;
  preset: string;
  gains: number[];
}

export interface Track {
  id: string;
  title: string;
  artist?: string;
  startTime: number;
  endTime: number;
  isFavorite: boolean;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface VideoData {
  videoId: string;
  videoTitle: string;
  channelName?: string;
  duration: number;
  tracks: Track[];
  activeTrackId: string | null;
  isLoopActive: boolean;
  lastUpdated: number;
}

export interface StorageSchema {
  [videoId: string]: VideoData;
}

export interface BackupPayload {
  version: string;
  exportedAt: string;
  schemaVersion: number;
  data: StorageSchema;
}

export type LooperStateListener = (state: VideoControllerState) => void;

export interface VideoControllerState {
  videoId: string | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isLoopActive: boolean;
  activeTrack: Track | null;
  isAdPlaying: boolean;
}

