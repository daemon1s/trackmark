import { StateManager } from '../core/state-manager';
import { formatTime } from './floating-menu';

export class TimelineMarkers {
  private stateManager: StateManager;
  private containerEl: HTMLElement | null = null;
  private observer: MutationObserver | null = null;

  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
    this.init();
  }

  public init(): void {
    this.injectContainer();

    this.observer = new MutationObserver(() => {
      if (!this.containerEl || !document.contains(this.containerEl)) {
        this.injectContainer();
      }
    });

    const moviePlayer = document.querySelector('#movie_player') || document.body;
    if (moviePlayer) {
      this.observer.observe(moviePlayer, { childList: true, subtree: true });
    }

    this.stateManager.subscribe(() => {
      this.renderMarkers();
    });
  }

  private injectContainer(): boolean {
    const progressBar = document.querySelector('.ytp-progress-bar-container') || document.querySelector('.ytp-progress-bar');
    if (!progressBar) return false;

    let container = progressBar.querySelector('.tm-timeline-markers') as HTMLElement;
    if (!container) {
      container = document.createElement('div');
      container.className = 'tm-timeline-markers';
      container.style.position = 'absolute';
      container.style.inset = '0';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '45';
      progressBar.appendChild(container);
    }

    this.containerEl = container;
    this.renderMarkers();
    return true;
  }

  public renderMarkers(): void {
    if (!this.containerEl) {
      this.injectContainer();
      if (!this.containerEl) return;
    }

    const videoData = this.stateManager.getVideoData();
    const duration = this.stateManager.videoController.getDuration();
    const activeTrack = this.stateManager.videoController.getState().activeTrack;

    if (!videoData || !duration || duration <= 0 || videoData.tracks.length === 0) {
      this.containerEl.innerHTML = '';
      return;
    }

    this.containerEl.innerHTML = videoData.tracks.map(track => {
      const leftPct = (track.startTime / duration) * 100;
      const widthPct = Math.max(0.4, ((track.endTime - track.startTime) / duration) * 100);
      const isActive = activeTrack?.id === track.id;

      return `
        <div class="tm-timeline-seg ${isActive ? 'active' : ''}"
             data-id="${track.id}"
             title="${track.title} (${formatTime(track.startTime)} - ${formatTime(track.endTime)})"
             style="
               position: absolute;
               left: ${leftPct}%;
               width: ${widthPct}%;
               top: 0;
               bottom: 0;
               background: ${isActive ? 'rgba(0, 240, 255, 0.45)' : 'rgba(5, 255, 161, 0.2)'};
               border-left: 2px solid ${isActive ? '#00f0ff' : '#05ffa1'};
               border-right: ${isActive ? '2px solid #00f0ff' : 'none'};
               box-shadow: ${isActive ? '0 0 8px rgba(0, 240, 255, 0.8)' : 'none'};
               pointer-events: none;
               transition: all 0.2s ease;
             ">
          <div style="
            position: absolute;
            left: 0;
            top: -2px;
            width: 5px;
            height: 5px;
            background: ${isActive ? '#00f0ff' : '#05ffa1'};
            border-radius: 50%;
            transform: translateX(-50%);
            box-shadow: 0 0 6px ${isActive ? '#00f0ff' : '#05ffa1'};
          "></div>
        </div>
      `;
    }).join('');
  }

  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.containerEl) {
      this.containerEl.remove();
      this.containerEl = null;
    }
  }
}
