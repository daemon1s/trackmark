import { BackupPayload } from '../types';
import { StorageManager } from './storage-manager';

export class BackupManager {
  public static async exportBackup(): Promise<void> {
    const allData = await StorageManager.getAllData();
    const payload: BackupPayload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      schemaVersion: 1,
      data: allData
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trackmark-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('[TrackMark] Backup exported successfully');
  }

  public static async importBackup(file: File): Promise<{ success: boolean; videosCount: number; message: string }> {
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as BackupPayload;

      if (!payload || !payload.data || typeof payload.data !== 'object') {
        return { success: false, videosCount: 0, message: 'Invalid JSON file format' };
      }

      let count = 0;
      for (const videoId of Object.keys(payload.data)) {
        const videoData = payload.data[videoId];
        if (videoData && videoData.videoId && Array.isArray(videoData.tracks)) {
          await StorageManager.saveVideoData(videoData);
          count++;
        }
      }

      return {
        success: true,
        videosCount: count,
        message: `Successfully imported data for ${count} videos!`
      };
    } catch (err) {
      console.error('[TrackMark] Import error:', err);
      return { success: false, videosCount: 0, message: 'Failed to parse JSON backup file' };
    }
  }
}
