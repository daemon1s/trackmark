export type VideoChangeCallback = (videoId: string | null, prevVideoId: string | null) => void;
export type MetadataChangeCallback = (videoId: string | null) => void;

export class SPANavigator {
  private currentVideoId: string | null = null;
  private listeners: VideoChangeCallback[] = [];
  private metadataListeners: MetadataChangeCallback[] = [];
  private pollTimer: number | null = null;

  private lastMetaNotificationTime: number = 0;

  constructor() {
    this.initListeners();
  }

  public getVideoId(): string | null {
    const url = new URL(window.location.href);
    if (url.pathname.startsWith('/watch')) {
      return url.searchParams.get('v');
    }
    return null;
  }

  public onVideoChange(callback: VideoChangeCallback): () => void {
    this.listeners.push(callback);
    const current = this.getVideoId();
    callback(current, null);

    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  public onMetadataChange(callback: MetadataChangeCallback): () => void {
    this.metadataListeners.push(callback);
    return () => {
      this.metadataListeners = this.metadataListeners.filter(cb => cb !== callback);
    };
  }

  private initListeners(): void {
    this.currentVideoId = this.getVideoId();

    const check = (source: string) => this.checkVideoChange(source);
    const notifyMeta = () => {
      const now = Date.now();
      if (now - this.lastMetaNotificationTime < 50) return;
      this.lastMetaNotificationTime = now;
      const vid = this.getVideoId();
      this.metadataListeners.forEach(cb => cb(vid));
    };

    window.addEventListener('yt-navigate-finish', () => check('yt-navigate-finish'));
    document.addEventListener('yt-navigate-finish', () => check('doc-yt-navigate-finish'));
    window.addEventListener('yt-page-data-updated', () => {
      check('yt-page-data-updated');
      notifyMeta();
    });
    document.addEventListener('yt-page-data-updated', () => {
      check('doc-yt-page-data-updated');
      notifyMeta();
    });
    window.addEventListener('popstate', () => check('popstate'));

    this.pollTimer = window.setInterval(() => {
      check('interval-check');
    }, 400);
  }

  private checkVideoChange(source: string): void {
    const newVideoId = this.getVideoId();
    if (newVideoId !== this.currentVideoId) {
      console.log(`[TrackMark] Navigation (${source}): ${this.currentVideoId} -> ${newVideoId}`);
      const prev = this.currentVideoId;
      this.currentVideoId = newVideoId;
      this.listeners.forEach(cb => cb(newVideoId, prev));
    }
  }

  public destroy(): void {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.listeners = [];
    this.metadataListeners = [];
  }
}

