import { StateManager } from '../core/state-manager';
import { Track } from '../types';
import { ShadowHost } from './shadow-host';
import { TracklistExtractor } from '../parser/tracklist-extractor';
import { parseTracklistText, ParsedTrackCandidate } from '../parser/timestamp-regex';
import { BackupManager } from '../storage/import-export';
import { StorageManager } from '../storage/storage-manager';
import { TM_LOGO_DATA_URI } from './logo-asset';

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function parseTime(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':').map(Number);
  if (parts.some(isNaN)) return 0;

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}

export class FloatingMenu {
  private isVisible: boolean = false;
  private menuEl: HTMLElement | null = null;
  private stateManager: StateManager;
  private lastTracksSignature: string = '';
  private lastFavsSignature: string = '';
  private currentModal: HTMLElement | null = null;
  private activeTab: 'tracks' | 'favs' | 'detect' | 'boost' | 'storage' = 'tracks';
  private showOnlyFavorites: boolean = false;

  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
    this.init();
  }

  private init(): void {
    this.stateManager.subscribe(() => {
      if (this.isVisible && this.menuEl) {
        this.updateStateView();
        this.renderTrackList();
        if (this.activeTab === 'favs') {
          this.updateActiveFavItemStyles();
        }
      }
    });
  }

  public toggle(): void {
    this.isVisible = !this.isVisible;
    if (this.isVisible) {
      this.lastTracksSignature = '';
      this.lastFavsSignature = '';
      this.show();
    } else {
      this.hide();
    }
  }

  public show(): void {
    this.isVisible = true;
    this.lastTracksSignature = '';
    this.lastFavsSignature = '';
    this.renderFull();
  }

  private wrapperEl: HTMLElement | null = null;

  public hide(): void {
    this.isVisible = false;
    if (this.wrapperEl) {
      this.wrapperEl.remove();
      this.wrapperEl = null;
      this.menuEl = null;
    }
    this.closeModal();
  }

  private renderFull(): void {
    const shadowRoot = ShadowHost.getInstance().mount();
    if (!shadowRoot) return;

    if (this.wrapperEl) {
      this.wrapperEl.remove();
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'tm-menu-wrapper';

    const borderLight = document.createElement('div');
    borderLight.className = 'tm-border-light';

    const menu = document.createElement('div');
    menu.className = 'tm-menu';

    ['click', 'mousedown', 'mouseup', 'keydown', 'keyup', 'keypress'].forEach(evt => {
      wrapper.addEventListener(evt, (e) => e.stopPropagation());
    });

    const controllerState = this.stateManager.videoController.getState();
    const currentTime = controllerState.currentTime;

    menu.innerHTML = `
      <div class="tm-header">
        <div class="tm-title-group">
          <div class="tm-logo-icon-wrap">
            <img src="${TM_LOGO_DATA_URI}" class="tm-logo-img" alt="TM" />
          </div>
          <span class="tm-logo-text">TRACKMARK</span>
          <span class="tm-author-tag">by <a href="https://github.com/daemon1s" target="_blank" rel="noopener noreferrer" class="tm-author-link">daemon1s</a></span>
        </div>
        <div class="tm-header-actions">
          <a href="https://github.com/daemon1s/trackmark" target="_blank" rel="noopener noreferrer" class="tm-header-icon-link" title="GitHub">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          </a>
          <button class="tm-btn-close" id="tm-close-btn" title="Close">✕</button>
        </div>
      </div>

      <div class="tm-tabs">
        <button class="tm-tab ${this.activeTab === 'tracks' ? 'active' : ''}" data-tab="tracks">Tracks</button>
        <button class="tm-tab ${this.activeTab === 'favs' ? 'active' : ''}" data-tab="favs">★ Favorites</button>
        <button class="tm-tab ${this.activeTab === 'detect' ? 'active' : ''}" data-tab="detect">Detect</button>
        <button class="tm-tab ${this.activeTab === 'boost' ? 'active' : ''}" data-tab="boost">Audio & Equalizer</button>
        <button class="tm-tab ${this.activeTab === 'storage' ? 'active' : ''}" data-tab="storage">Storage</button>
      </div>

      <div class="tm-content-pane ${this.activeTab === 'tracks' ? 'active' : ''}" id="pane-tracks">
        <div class="tm-active-bar">
          <div class="tm-active-info">
            <div class="tm-active-title" id="tm-active-title">No track selected</div>
            <div class="tm-active-times" id="tm-active-times">Select or add a track below</div>
          </div>
          <button class="tm-toggle-loop" id="tm-loop-btn">
            Loop disabled
          </button>
        </div>

        <div class="tm-add-section">
          <div class="tm-inputs-row">
            <input type="text" class="tm-input tm-input-title" placeholder="Track title" id="tm-new-title" />
            <input type="text" class="tm-input tm-input-time" placeholder="Start" id="tm-new-start" value="${formatTime(currentTime)}" />
            <input type="text" class="tm-input tm-input-time" placeholder="End" id="tm-new-end" value="${formatTime(currentTime + 30)}" />
          </div>
          <button class="tm-btn-primary" id="tm-add-btn">
            + Save and loop
          </button>
        </div>

        <div class="tm-list-bar">
          <span class="tm-list-count" id="tm-list-count">All tracks</span>
          <button class="tm-btn-filter-fav ${this.showOnlyFavorites ? 'active' : ''}" id="tm-filter-favs-btn" title="Show only favorites">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="${this.showOnlyFavorites ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span>Favorites only</span>
          </button>
        </div>

        <div class="tm-list" id="tm-track-list"></div>
      </div>

      <div class="tm-content-pane ${this.activeTab === 'favs' ? 'active' : ''}" id="pane-favs">
        <div class="tm-favs-header">
          <div class="tm-title-with-info">
            <span class="tm-favs-header-title">⭐ Global favorites</span>
            <div class="tm-info-tooltip-wrap">
              <span class="tm-info-icon">ℹ️</span>
              <div class="tm-tooltip-content">
                <strong>How do global favorites work?</strong><br/>
                • Shows your favorite tracks and loops across all videos.<br/>
                • Click any track to open that video at the exact timestamp.<br/>
                • If you are already on that video, it jumps and loops immediately.
              </div>
            </div>
          </div>
          <span class="tm-favs-count-badge" id="tm-favs-total-count">0 tracks</span>
        </div>

        <div class="tm-list tm-favs-list" id="tm-favs-list">
          <div class="tm-empty">Loading favorites...</div>
        </div>
      </div>

      <div class="tm-content-pane ${this.activeTab === 'detect' ? 'active' : ''}" id="pane-detect">
        <div class="tm-tools-panel">
          <div class="tm-tool-card">
            <span class="tm-tool-title">⚡ Auto-detect tracks</span>
            <span class="tm-tool-desc">Extract songs and timestamps from description and comments with one click.</span>
            <button class="tm-btn-action" id="tm-scan-btn">Scan metadata</button>
          </div>

          <div class="tm-tool-card">
            <span class="tm-tool-title">📋 Paste timestamps</span>
            <span class="tm-tool-desc">Paste any text with timestamps to parse them automatically.</span>
            <button class="tm-btn-action" id="tm-paste-btn">Paste text</button>
          </div>

          <div class="tm-tool-card">
            <span class="tm-tool-title">🗑️ Clear track list</span>
            <span class="tm-tool-desc">Delete all detected or imported tracks from this video with one click.</span>
            <button class="tm-btn-action tm-btn-danger" id="tm-clear-all-btn">Clear all tracks</button>
          </div>
        </div>
      </div>

      <div class="tm-content-pane ${this.activeTab === 'boost' ? 'active' : ''}" id="pane-boost">
        <div class="tm-boost-panel">
          <div class="tm-eq-section">
            <div class="tm-section-header">
              <div class="tm-title-with-info">
                <span class="tm-boost-label">🎛️ Graphic equalizer</span>
                <div class="tm-info-tooltip-wrap">
                  <span class="tm-info-icon">ℹ️</span>
                  <div class="tm-tooltip-content">
                    <strong>How does the equalizer work?</strong><br/>
                    • <strong>60Hz - 150Hz:</strong> Bass and sub-bass.<br/>
                    • <strong>400Hz - 1kHz:</strong> Midrange body and vocals.<br/>
                    • <strong>2.4kHz - 15kHz:</strong> Treble, presence and brightness.<br/>
                    Adjust the vertical sliders (-12dB to +12dB) or select a genre preset.
                  </div>
                </div>
              </div>
              <button class="tm-btn-reset-eq" id="tm-reset-eq-btn" title="Reset to flat">Reset</button>
            </div>

            <div class="tm-preset-select-wrap">
              <select class="tm-preset-select" id="tm-eq-preset-select">
                <option value="flat">Flat / Default</option>
                <option value="bass_boost">🔥 Bass boost</option>
                <option value="electronic">⚡ Electronic / Dance</option>
                <option value="rock">🎸 Rock / Metal</option>
                <option value="pop">🎤 Pop</option>
                <option value="hiphop">🎧 Hip-Hop / R&B</option>
                <option value="vocal">🎙️ Vocal clarity / Podcast</option>
                <option value="acoustic">🎻 Acoustic / Classical</option>
                <option value="treble_boost">✨ Treble boost</option>
                <option value="custom" disabled>Custom (manual adjustment)</option>
              </select>
            </div>

            <div class="tm-eq-rack">
              <div class="tm-eq-col">
                <span class="tm-eq-val" id="tm-eq-val-0">0dB</span>
                <input type="range" min="-12" max="12" step="1" value="0" class="tm-slider-v" data-band="0" />
                <span class="tm-eq-freq">60Hz</span>
              </div>
              <div class="tm-eq-col">
                <span class="tm-eq-val" id="tm-eq-val-1">0dB</span>
                <input type="range" min="-12" max="12" step="1" value="0" class="tm-slider-v" data-band="1" />
                <span class="tm-eq-freq">150Hz</span>
              </div>
              <div class="tm-eq-col">
                <span class="tm-eq-val" id="tm-eq-val-2">0dB</span>
                <input type="range" min="-12" max="12" step="1" value="0" class="tm-slider-v" data-band="2" />
                <span class="tm-eq-freq">400Hz</span>
              </div>
              <div class="tm-eq-col">
                <span class="tm-eq-val" id="tm-eq-val-3">0dB</span>
                <input type="range" min="-12" max="12" step="1" value="0" class="tm-slider-v" data-band="3" />
                <span class="tm-eq-freq">1kHz</span>
              </div>
              <div class="tm-eq-col">
                <span class="tm-eq-val" id="tm-eq-val-4">0dB</span>
                <input type="range" min="-12" max="12" step="1" value="0" class="tm-slider-v" data-band="4" />
                <span class="tm-eq-freq">2.4kHz</span>
              </div>
              <div class="tm-eq-col">
                <span class="tm-eq-val" id="tm-eq-val-5">0dB</span>
                <input type="range" min="-12" max="12" step="1" value="0" class="tm-slider-v" data-band="5" />
                <span class="tm-eq-freq">15kHz</span>
              </div>
            </div>
          </div>

          <div class="tm-boost-section">
            <div class="tm-section-header">
              <div class="tm-title-with-info">
                <span class="tm-boost-label">🔊 Volume booster</span>
                <div class="tm-info-tooltip-wrap">
                  <span class="tm-info-icon">ℹ️</span>
                  <div class="tm-tooltip-content">
                    <strong>How does the volume booster work?</strong><br/>
                    • <strong>100% - 600%:</strong> Boosts audio above YouTube's native maximum.<br/>
                    • <strong>Limiter compressor:</strong> Prevents distortion when increasing gain.<br/>
                    Toggle the booster and select a level with quick buttons.
                  </div>
                </div>
              </div>
            </div>

            <div class="tm-boost-controls">
              <button class="tm-btn-preset" data-boost="1">100%</button>
              <button class="tm-btn-preset" data-boost="1.5">150%</button>
              <button class="tm-btn-preset" data-boost="2">200%</button>
              <button class="tm-btn-preset" data-boost="3">300%</button>
              <button class="tm-btn-preset" data-boost="4">400%</button>
              <button class="tm-btn-preset" data-boost="6">600%</button>
            </div>

            <div class="tm-boost-status">
              <span class="tm-boost-value-label" id="tm-boost-val-label">100% (disabled)</span>
              <button class="tm-btn-toggle-boost" id="tm-boost-toggle">Enable booster</button>
            </div>
          </div>
        </div>
      </div>

      <div class="tm-content-pane ${this.activeTab === 'storage' ? 'active' : ''}" id="pane-storage">
        <div class="tm-tools-panel">
          <div class="tm-tool-card">
            <div class="tm-title-with-info">
              <span class="tm-tool-title">💾 Local storage</span>
              <div class="tm-info-tooltip-wrap">
                <span class="tm-info-icon">ℹ️</span>
                <div class="tm-tooltip-content">
                  <strong>How does storage work?</strong><br/>
                  • <strong>100% local:</strong> Your tracks and loops are saved in <code>chrome.storage.local</code> in your browser.<br/>
                  • <strong>Full privacy:</strong> No data leaves your machine or is sent to external servers.<br/>
                  • <strong>Persistent:</strong> Not cleared when closing YouTube or restarting your machine.
                </div>
              </div>
            </div>
            <span class="tm-tool-desc">All your loop markers and track marks are stored offline directly in your browser's private storage.</span>
          </div>

          <div class="tm-tool-card">
            <div class="tm-title-with-info">
              <span class="tm-tool-title">🔄 Backup & Transfer</span>
              <div class="tm-info-tooltip-wrap">
                <span class="tm-info-icon">ℹ️</span>
                <div class="tm-tooltip-content">
                  <strong>Export & Import JSON:</strong><br/>
                  Export a <code>.json</code> file to create backups of all your tracklists or migrate them to another browser in seconds.
                </div>
              </div>
            </div>
            <span class="tm-tool-desc">Create portable backup files or restore your saved library across different devices.</span>
            <div class="tm-tools-row">
              <button class="tm-btn-action" id="tm-export-btn" style="flex: 1;">Export JSON</button>
              <button class="tm-btn-action" id="tm-import-btn" style="flex: 1;">Import JSON</button>
              <input type="file" id="tm-import-file" accept=".json" style="display: none;" />
            </div>
          </div>
        </div>
      </div>
    `;

    wrapper.appendChild(borderLight);
    wrapper.appendChild(menu);
    shadowRoot.appendChild(wrapper);
    this.wrapperEl = wrapper;
    this.menuEl = menu;

    this.bindStaticEvents();
    this.renderTrackList();
    this.updateStateView();
  }

  private bindStaticEvents(): void {
    if (!this.menuEl || !this.wrapperEl) return;

    const header = this.menuEl.querySelector('.tm-header') as HTMLElement;
    if (header && this.wrapperEl) {
      let isDragging = false;
      let startMouseX = 0;
      let startMouseY = 0;
      let initialLeft = 0;
      let initialTop = 0;

      const onMouseDown = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('#tm-close-btn') || target.closest('a') || target.closest('button')) return;

        isDragging = true;
        startMouseX = e.clientX;
        startMouseY = e.clientY;

        const parentRect = this.wrapperEl!.offsetParent?.getBoundingClientRect() || { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
        const wrapperRect = this.wrapperEl!.getBoundingClientRect();

        initialLeft = wrapperRect.left - parentRect.left;
        initialTop = wrapperRect.top - parentRect.top;

        this.wrapperEl!.style.bottom = 'auto';
        this.wrapperEl!.style.right = 'auto';
        this.wrapperEl!.style.left = `${initialLeft}px`;
        this.wrapperEl!.style.top = `${initialTop}px`;

        window.addEventListener('mousemove', onMouseMove, { capture: true });
        window.addEventListener('mouseup', onMouseUp, { capture: true });
        e.preventDefault();
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging || !this.wrapperEl) return;
        const dx = e.clientX - startMouseX;
        const dy = e.clientY - startMouseY;

        const parentEl = this.wrapperEl.offsetParent as HTMLElement || document.body;
        const parentWidth = parentEl.clientWidth || window.innerWidth;
        const parentHeight = parentEl.clientHeight || window.innerHeight;
        const menuWidth = this.wrapperEl.offsetWidth || 420;
        const menuHeight = this.wrapperEl.offsetHeight || 400;

        const maxLeft = Math.max(0, parentWidth - menuWidth);
        const maxTop = Math.max(0, parentHeight - menuHeight);

        const clampedLeft = Math.max(0, Math.min(maxLeft, initialLeft + dx));
        const clampedTop = Math.max(0, Math.min(maxTop, initialTop + dy));

        this.wrapperEl.style.left = `${Math.round(clampedLeft)}px`;
        this.wrapperEl.style.top = `${Math.round(clampedTop)}px`;
      };

      const onMouseUp = () => {
        if (isDragging) {
          isDragging = false;
          window.removeEventListener('mousemove', onMouseMove, { capture: true });
          window.removeEventListener('mouseup', onMouseUp, { capture: true });
        }
      };

      header.addEventListener('mousedown', onMouseDown);
    }

    this.menuEl.querySelector('#tm-close-btn')?.addEventListener('click', () => this.hide());

    this.menuEl.querySelectorAll('.tm-tab').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        const tab = (tabBtn as HTMLElement).dataset.tab as 'tracks' | 'favs' | 'detect' | 'boost' | 'storage';
        if (tab) {
          this.activeTab = tab;
          this.menuEl?.querySelectorAll('.tm-tab').forEach(t => t.classList.remove('active'));
          tabBtn.classList.add('active');

          this.menuEl?.querySelectorAll('.tm-content-pane').forEach(p => p.classList.remove('active'));
          this.menuEl?.querySelector(`#pane-${tab}`)?.classList.add('active');

          if (tab === 'favs') {
            this.lastFavsSignature = '';
            this.renderFavsList();
          }
        }
      });
    });

    const filterFavBtn = this.menuEl.querySelector('#tm-filter-favs-btn');
    filterFavBtn?.addEventListener('click', () => {
      this.showOnlyFavorites = !this.showOnlyFavorites;
      filterFavBtn.classList.toggle('active', this.showOnlyFavorites);
      const svg = filterFavBtn.querySelector('svg');
      if (svg) {
        svg.setAttribute('fill', this.showOnlyFavorites ? 'currentColor' : 'none');
      }
      this.renderTrackList();
    });

    this.menuEl.querySelector('#tm-loop-btn')?.addEventListener('click', async () => {
      await this.stateManager.toggleLoop();
    });

    const addBtn = this.menuEl.querySelector('#tm-add-btn');
    addBtn?.addEventListener('click', async () => {
      const titleInput = this.menuEl?.querySelector('#tm-new-title') as HTMLInputElement;
      const startInput = this.menuEl?.querySelector('#tm-new-start') as HTMLInputElement;
      const endInput = this.menuEl?.querySelector('#tm-new-end') as HTMLInputElement;

      const title = titleInput?.value.trim() || `Track @ ${startInput?.value || '00:00'}`;
      const startTime = parseTime(startInput?.value || '00:00');
      let endTime = parseTime(endInput?.value || '00:00');

      if (endTime <= startTime) {
        endTime = startTime + 30;
      }

      const created = await this.stateManager.addTrack({
        title,
        startTime,
        endTime,
        isFavorite: false
      });

      if (created) {
        if (titleInput) titleInput.value = '';
        if (startInput) startInput.value = formatTime(endTime);
        if (endInput) endInput.value = formatTime(endTime + 30);

        await this.stateManager.selectTrack(created.id, true);
        await this.stateManager.setLoop(true);
        this.renderTrackList();
      }
    });

    const videoEl = this.stateManager.videoController.getVideoElement();
    const booster = this.stateManager.audioBooster;

    const presetSelect = this.menuEl.querySelector('#tm-eq-preset-select') as HTMLSelectElement;
    presetSelect?.addEventListener('change', () => {
      if (videoEl) booster.init(videoEl);
      const presetId = presetSelect.value;
      booster.setPreset(presetId);
      this.updateEqUI();
    });

    this.menuEl.querySelector('#tm-reset-eq-btn')?.addEventListener('click', () => {
      if (videoEl) booster.init(videoEl);
      booster.resetEq();
      this.updateEqUI();
    });

    this.menuEl.querySelectorAll<HTMLInputElement>('.tm-slider-v').forEach(slider => {
      slider.addEventListener('input', () => {
        if (videoEl) booster.init(videoEl);
        const bandIndex = Number(slider.dataset.band);
        const gainVal = Number(slider.value);
        booster.setBandGain(bandIndex, gainVal);
        this.updateEqUI();
      });
    });

    this.menuEl.querySelectorAll('.tm-btn-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        if (videoEl) booster.init(videoEl);
        const multiplier = Number((btn as HTMLElement).dataset.boost);
        booster.setBoost(multiplier);
        booster.setEnabled(true);
        this.updateBoostUI();
      });
    });

    this.menuEl.querySelector('#tm-boost-toggle')?.addEventListener('click', () => {
      if (videoEl) booster.init(videoEl);
      booster.setEnabled(!booster.getIsEnabled());
      this.updateBoostUI();
    });


    this.menuEl.querySelector('#tm-scan-btn')?.addEventListener('click', () => {
      this.handleAutoScan();
    });

    this.menuEl.querySelector('#tm-paste-btn')?.addEventListener('click', () => {
      this.handlePasteTracklist();
    });

    this.menuEl.querySelector('#tm-clear-all-btn')?.addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete all tracks for this video?')) {
        await this.stateManager.clearAllTracks();
        this.renderTrackList();
        this.updateStateView();
      }
    });

    this.menuEl.querySelector('#tm-export-btn')?.addEventListener('click', async () => {
      await BackupManager.exportBackup();
    });

    const fileInput = this.menuEl.querySelector('#tm-import-file') as HTMLInputElement;
    this.menuEl.querySelector('#tm-import-btn')?.addEventListener('click', () => {
      fileInput?.click();
    });

    fileInput?.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (file) {
        const res = await BackupManager.importBackup(file);
        alert(res.message);
        if (res.success) {
          const vid = this.stateManager.getVideoData()?.videoId;
          if (vid) {
            await this.stateManager.loadVideoData(vid);
            this.renderTrackList();
          }
        }
      }
      fileInput.value = '';
    });

    const startInput = this.menuEl.querySelector('#tm-new-start') as HTMLInputElement;
    startInput?.addEventListener('dblclick', () => {
      startInput.value = formatTime(this.stateManager.videoController.getCurrentTime());
    });

    const endInput = this.menuEl.querySelector('#tm-new-end') as HTMLInputElement;
    endInput?.addEventListener('dblclick', () => {
      endInput.value = formatTime(this.stateManager.videoController.getCurrentTime());
    });

    this.updateEqUI();
    this.updateBoostUI();
  }

  private updateEqUI(): void {
    if (!this.menuEl) return;
    const booster = this.stateManager.audioBooster;
    const gains = booster.getGains();
    const currentPreset = booster.getCurrentPreset();

    const presetSelect = this.menuEl.querySelector('#tm-eq-preset-select') as HTMLSelectElement;
    if (presetSelect) {
      presetSelect.value = currentPreset;
    }

    gains.forEach((gain, i) => {
      const valLabel = this.menuEl?.querySelector(`#tm-eq-val-${i}`);
      const slider = this.menuEl?.querySelector(`.tm-slider-v[data-band="${i}"]`) as HTMLInputElement;
      if (valLabel) {
        valLabel.textContent = `${gain > 0 ? '+' : ''}${gain}dB`;
        valLabel.classList.toggle('active', gain !== 0);
      }
      if (slider && Number(slider.value) !== gain) {
        slider.value = String(gain);
      }
    });
  }

  private updateBoostUI(): void {
    if (!this.menuEl) return;
    const booster = this.stateManager.audioBooster;
    const percent = Math.round(booster.getBoost() * 100);
    const enabled = booster.getIsEnabled();

    const label = this.menuEl.querySelector('#tm-boost-val-label');
    if (label) {
      label.textContent = enabled ? `${percent}%` : '100% (disabled)';
    }

    const toggle = this.menuEl.querySelector('#tm-boost-toggle') as HTMLButtonElement;
    if (toggle) {
      toggle.textContent = enabled ? 'Disable booster' : 'Enable booster';
      toggle.classList.toggle('active', enabled);
    }

    this.menuEl.querySelectorAll('.tm-btn-preset').forEach(btn => {
      const b = Number((btn as HTMLElement).dataset.boost);
      btn.classList.toggle('active', enabled && Math.round(b * 100) === percent);
    });
  }

  private handleAutoScan(): void {
    const duration = this.stateManager.videoController.getDuration();
    const result = TracklistExtractor.extractFromDOM(duration);

    if (result.tracks.length === 0) {
      alert('No timestamps found in description or comments.\nYou can use "Paste text" to add them manually.');
      return;
    }

    this.showPreviewModal(result.sourceLabel, result.tracks);
  }

  private handlePasteTracklist(): void {
    if (!this.menuEl) return;
    this.closeModal();

    const modal = document.createElement('div');
    modal.className = 'tm-modal-view';
    modal.innerHTML = `
      <div class="tm-modal-header">
        <div class="tm-modal-title">Paste tracklist</div>
        <button class="tm-btn-close" id="tm-modal-close">✕</button>
      </div>
      <div class="tm-modal-body">
        <span style="font-size: 10px; color: #71717a;">Paste text with timestamps (e.g. 01:23 Song Title):</span>
        <textarea class="tm-textarea" id="tm-paste-area" placeholder="00:00 Intro&#10;03:45 Artist - Track 1&#10;08:20 Artist - Track 2..."></textarea>
      </div>
      <div class="tm-modal-footer">
        <button class="tm-btn-secondary" id="tm-paste-cancel">Cancel</button>
        <button class="tm-btn-primary" id="tm-paste-parse">Parse tracks</button>
      </div>
    `;

    this.menuEl.appendChild(modal);
    this.currentModal = modal;

    modal.querySelector('#tm-modal-close')?.addEventListener('click', () => this.closeModal());
    modal.querySelector('#tm-paste-cancel')?.addEventListener('click', () => this.closeModal());

    modal.querySelector('#tm-paste-parse')?.addEventListener('click', () => {
      const area = modal.querySelector('#tm-paste-area') as HTMLTextAreaElement;
      const text = area?.value.trim() || '';
      const duration = this.stateManager.videoController.getDuration();
      const tracks = parseTracklistText(text, duration);

      if (tracks.length === 0) {
        alert('No timestamps could be detected in the pasted text.');
        return;
      }

      this.showPreviewModal(`Pasted text (${tracks.length} tracks)`, tracks);
    });
  }

  private showPreviewModal(title: string, candidates: ParsedTrackCandidate[]): void {
    if (!this.menuEl) return;
    this.closeModal();

    const modal = document.createElement('div');
    modal.className = 'tm-modal-view';
    modal.innerHTML = `
      <div class="tm-modal-header">
        <div class="tm-modal-title">${title}</div>
        <button class="tm-btn-close" id="tm-modal-close">✕</button>
      </div>
      <div class="tm-modal-body">
        <div style="display: flex; flex-direction: column; gap: 4px;">
          ${candidates.map((c, i) => `
            <div class="tm-preview-item">
              <input type="checkbox" checked data-index="${i}" class="tm-preview-check" />
              <div class="tm-preview-title">${c.title}</div>
              <div class="tm-preview-time">${formatTime(c.startTime)} - ${formatTime(c.endTime)}</div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="tm-modal-footer">
        <button class="tm-btn-secondary" id="tm-modal-cancel">Cancel</button>
        <button class="tm-btn-primary" id="tm-modal-import">
          Import selected (${candidates.length})
        </button>
      </div>
    `;

    this.menuEl.appendChild(modal);
    this.currentModal = modal;

    modal.querySelector('#tm-modal-close')?.addEventListener('click', () => this.closeModal());
    modal.querySelector('#tm-modal-cancel')?.addEventListener('click', () => this.closeModal());

    modal.querySelector('#tm-modal-import')?.addEventListener('click', async () => {
      const checkboxes = modal.querySelectorAll<HTMLInputElement>('.tm-preview-check:checked');
      const selected: Array<{ title: string; startTime: number; endTime: number }> = [];

      checkboxes.forEach(cb => {
        const idx = Number(cb.dataset.index);
        if (candidates[idx]) {
          selected.push({
            title: candidates[idx].title,
            startTime: candidates[idx].startTime,
            endTime: candidates[idx].endTime
          });
        }
      });

      if (selected.length > 0) {
        await this.stateManager.importBulkTracks(selected);
        this.closeModal();
        this.activeTab = 'tracks';
        this.menuEl?.querySelectorAll('.tm-tab').forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === 'tracks'));
        this.menuEl?.querySelectorAll('.tm-content-pane').forEach(p => p.classList.toggle('active', p.id === 'pane-tracks'));
        this.renderTrackList();
        const videoData = this.stateManager.getVideoData();
        if (videoData && videoData.tracks.length > 0) {
          await this.stateManager.selectTrack(videoData.tracks[0].id, false);
        }
      }
    });
  }

  private closeModal(): void {
    if (this.currentModal) {
      this.currentModal.remove();
      this.currentModal = null;
    }
  }

  private renderTrackList(): void {
    if (!this.menuEl) return;
    const listEl = this.menuEl.querySelector('#tm-track-list');
    if (!listEl) return;

    const videoData = this.stateManager.getVideoData();
    const allTracks = videoData?.tracks || [];
    const activeTrackId = this.stateManager.videoController.getState().activeTrack?.id;

    const signature = JSON.stringify({
      onlyFavs: this.showOnlyFavorites,
      tracks: allTracks.map(t => ({ id: t.id, title: t.title, fav: t.isFavorite, s: t.startTime, e: t.endTime }))
    });
    if (signature === this.lastTracksSignature && listEl.children.length > 0) {
      this.updateActiveItemStyles();
      return;
    }
    this.lastTracksSignature = signature;

    const tracks = this.showOnlyFavorites ? allTracks.filter(t => t.isFavorite) : allTracks;

    const countEl = this.menuEl.querySelector('#tm-list-count');
    if (countEl) {
      const favCount = allTracks.filter(t => t.isFavorite).length;
      countEl.textContent = this.showOnlyFavorites
        ? `Favorites only (${tracks.length})`
        : `All tracks (${allTracks.length}${favCount > 0 ? ` • ${favCount} ★` : ''})`;
    }

    if (allTracks.length === 0) {
      listEl.innerHTML = `<div class="tm-empty">No tracks saved for this video.<br/>Use the detect tab or add one above.</div>`;
      return;
    }

    if (tracks.length === 0 && this.showOnlyFavorites) {
      listEl.innerHTML = `<div class="tm-empty">No favorite tracks in this video yet.<br/>Click the ★ icon on any track to mark it as favorite.</div>`;
      return;
    }

    listEl.innerHTML = tracks.map((track: Track) => {
      const isActive = activeTrackId === track.id;
      const cleanSearchQuery = encodeURIComponent(track.title.replace(/[[\]()]/g, '').trim());
      const ytSearchUrl = `https://www.youtube.com/results?search_query=${cleanSearchQuery}`;
      const scSearchUrl = `https://soundcloud.com/search?q=${cleanSearchQuery}`;

      return `
      <div class="tm-track-item ${isActive ? 'active' : ''}" data-id="${track.id}">
        <div class="tm-track-details">
          <div class="tm-track-name-wrap">
            <div class="tm-track-name">
              ${isActive ? '<span class="tm-active-badge">▶</span> ' : ''}<span class="tm-title-inner">${track.title}</span>
            </div>
          </div>
          <div class="tm-track-meta">
            <span class="tm-track-range">${formatTime(track.startTime)} - ${formatTime(track.endTime)}</span>
            <div class="tm-track-search-links">
              <a href="${ytSearchUrl}" target="_blank" rel="noopener noreferrer" class="tm-search-link tm-search-yt" title="Search on YouTube" onclick="event.stopPropagation(); window.open('${ytSearchUrl}', '_blank'); return false;">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                YT
              </a>
              <a href="${scSearchUrl}" target="_blank" rel="noopener noreferrer" class="tm-search-link tm-search-sc" title="Search on SoundCloud" onclick="event.stopPropagation(); window.open('${scSearchUrl}', '_blank'); return false;">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M1.17 12.227c-.035 0-.067.03-.07.067L1 15.934c.003.04.035.066.07.066.039 0 .07-.027.07-.066l.102-3.64c-.004-.037-.035-.067-.07-.067zm1.196-.928c-.05 0-.09.04-.093.09l-.164 4.542c.003.05.043.09.093.09.047 0 .086-.04.086-.09l.168-4.542c0-.05-.039-.09-.09-.09zm1.22-.397c-.062 0-.113.05-.117.113l-.145 4.938c.004.062.055.113.117.113.059 0 .11-.05.11-.113l.148-4.938c0-.063-.05-.113-.113-.113zm1.23-.05c-.078 0-.14.062-.14.14l-.04 4.99c0 .077.062.14.14.14.075 0 .137-.063.137-.14l.043-4.99c0-.078-.062-.14-.14-.14zm1.246-.665c-.094 0-.172.079-.172.172v5.652c0 .094.078.172.172.172.094 0 .172-.078.172-.172v-5.652c0-.093-.078-.172-.172-.172zm1.274-1.28c-.11 0-.203.09-.203.204v6.933c0 .114.093.204.203.204.114 0 .207-.09.207-.204v-6.934c0-.113-.093-.203-.207-.203zm1.285-.567c-.129 0-.234.106-.234.235v7.504c0 .129.105.234.234.234.129 0 .235-.105.235-.234v-7.504c0-.129-.106-.235-.235-.235zm1.313-.488c-.145 0-.262.117-.262.262v7.992c0 .144.117.261.262.261.144 0 .261-.117.261-.261V7.852c0-.145-.117-.262-.261-.262zm1.32-.207c-.16 0-.293.133-.293.293v8.2c0 .16.133.293.293.293.16 0 .293-.133.293-.293v-8.2c0-.16-.133-.293-.293-.293zm1.344-.066c-.18 0-.324.148-.324.328v8.266c0 .18.144.328.324.328.18 0 .328-.148.328-.328V7.579c0-.18-.148-.328-.328-.328zm2.493-2.149c-.219 0-.414.043-.594.125-.133.062-.25.148-.351.25-.098.098-.18.211-.239.34-.058.125-.093.261-.105.406-.008.082-.012.164-.012.25v9.336c0 .137.05.266.14.36.095.093.223.144.36.144h7.02c1.785 0 3.234-1.45 3.234-3.235 0-1.687-1.293-3.078-2.953-3.219-.242-2.484-2.336-4.41-4.887-4.41-.531 0-1.047.086-1.531.25-.028-.012-.055-.027-.082-.043z"/></svg>
                SC
              </a>
            </div>
          </div>
        </div>
        <div class="tm-track-actions">
          <button class="tm-btn-fav ${track.isFavorite ? 'starred' : ''}" data-id="${track.id}" title="${track.isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="${track.isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </button>
          <button class="tm-btn-del" data-id="${track.id}" title="Delete">🗑️</button>
        </div>
      </div>
    `;
    }).join('');

    listEl.querySelectorAll('.tm-track-item').forEach(item => {
      const trackId = (item as HTMLElement).dataset.id;
      if (!trackId) return;

      item.addEventListener('click', async (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('.tm-btn-fav') || target.closest('.tm-btn-del') || target.closest('.tm-search-link')) {
          return;
        }
        await this.stateManager.selectTrack(trackId, true);
      });
    });

    setTimeout(() => {
      listEl.querySelectorAll('.tm-track-item').forEach(item => {
        const innerEl = item.querySelector('.tm-title-inner') as HTMLElement;
        const wrapEl = item.querySelector('.tm-track-name-wrap') as HTMLElement;

        if (innerEl && wrapEl && wrapEl.clientWidth > 0) {
          if (innerEl.scrollWidth > wrapEl.clientWidth + 4) {
            const overflowDiff = innerEl.scrollWidth - wrapEl.clientWidth + 16;
            innerEl.classList.add('overflowing');
            innerEl.style.setProperty('--marquee-dist', `-${overflowDiff}px`);
          } else {
            innerEl.classList.remove('overflowing');
          }
        }
      });
    }, 50);

    listEl.querySelectorAll('.tm-btn-fav').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const trackId = (btn as HTMLElement).dataset.id;
        if (trackId) {
          await this.stateManager.toggleFavorite(trackId);
          this.lastFavsSignature = '';
          this.renderTrackList();
        }
      });
    });

    listEl.querySelectorAll('.tm-btn-del').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const trackId = (btn as HTMLElement).dataset.id;
        if (trackId) {
          await this.stateManager.deleteTrack(trackId);
          this.lastFavsSignature = '';
          this.renderTrackList();
        }
      });
    });
  }

  private updateStateView(): void {
    if (!this.menuEl) return;

    const controllerState = this.stateManager.videoController.getState();
    const activeTrack = controllerState.activeTrack;
    const isLoopActive = controllerState.isLoopActive;

    const titleEl = this.menuEl.querySelector('#tm-active-title');
    const timesEl = this.menuEl.querySelector('#tm-active-times');
    const loopBtn = this.menuEl.querySelector('#tm-loop-btn');

    if (titleEl) {
      titleEl.textContent = activeTrack ? activeTrack.title : 'No track selected';
    }
    if (timesEl) {
      timesEl.textContent = activeTrack
        ? `${formatTime(activeTrack.startTime)} - ${formatTime(activeTrack.endTime)}`
        : 'Select or add a track below';
    }

    if (loopBtn) {
      loopBtn.className = `tm-toggle-loop ${isLoopActive ? 'active' : ''}`;
      loopBtn.textContent = isLoopActive ? 'Loop active' : 'Loop disabled';
    }

    this.updateActiveItemStyles();
  }

  private lastScrolledTrackId: string | null = null;

  private updateActiveItemStyles(): void {
    if (!this.menuEl) return;
    const activeTrackId = this.stateManager.videoController.getState().activeTrack?.id;
    let activeElementToScroll: HTMLElement | null = null;

    this.menuEl.querySelectorAll('.tm-track-item').forEach(item => {
      const id = (item as HTMLElement).dataset.id;
      const nameEl = item.querySelector('.tm-track-name');
      const badge = nameEl?.querySelector('.tm-active-badge');
      if (id === activeTrackId) {
        item.classList.add('active');
        activeElementToScroll = item as HTMLElement;
        if (!badge && nameEl) {
          nameEl.insertAdjacentHTML('afterbegin', '<span class="tm-active-badge">▶</span> ');
        }
      } else {
        item.classList.remove('active');
        if (badge) {
          badge.remove();
        }
      }
    });

    if (activeTrackId && activeTrackId !== this.lastScrolledTrackId && activeElementToScroll) {
      this.lastScrolledTrackId = activeTrackId;
      (activeElementToScroll as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    } else if (!activeTrackId) {
      this.lastScrolledTrackId = null;
    }
  }

  private updateActiveFavItemStyles(): void {
    if (!this.menuEl) return;
    const currentVideoId = this.stateManager.getVideoData()?.videoId;
    const activeTrackId = this.stateManager.videoController.getState().activeTrack?.id;

    this.menuEl.querySelectorAll('.tm-fav-item').forEach(itemEl => {
      const vId = (itemEl as HTMLElement).dataset.videoId;
      const tId = (itemEl as HTMLElement).dataset.trackId;
      const isCurrentVideo = Boolean(vId && currentVideoId && vId === currentVideoId);
      const isCurrentlyActive = Boolean(isCurrentVideo && tId && tId === activeTrackId);

      itemEl.classList.toggle('active', isCurrentlyActive);

      const trackNameEl = itemEl.querySelector('.tm-fav-track-name');
      if (trackNameEl) {
        const badge = trackNameEl.querySelector('.tm-active-badge');
        if (isCurrentlyActive && !badge) {
          trackNameEl.insertAdjacentHTML('afterbegin', '<span class="tm-active-badge">▶</span> ');
        } else if (!isCurrentlyActive && badge) {
          badge.remove();
        }
      }

      const videoNameEl = itemEl.querySelector('.tm-fav-video-name');
      if (videoNameEl) {
        const hereBadge = videoNameEl.querySelector('.tm-fav-here-badge');
        if (isCurrentVideo && !hereBadge) {
          videoNameEl.insertAdjacentHTML('afterbegin', '<span class="tm-fav-here-badge">Playing here</span> ');
        } else if (!isCurrentVideo && hereBadge) {
          hereBadge.remove();
        }
      }
    });
  }

  private async renderFavsList(): Promise<void> {
    if (!this.menuEl) return;
    const listEl = this.menuEl.querySelector('#tm-favs-list') as HTMLElement | null;
    const countBadge = this.menuEl.querySelector('#tm-favs-total-count');
    if (!listEl) return;

    const allData = await StorageManager.getAllData();
    const currentVideoId = this.stateManager.getVideoData()?.videoId;

    interface GlobalFavItem {
      videoId: string;
      videoTitle: string;
      track: Track;
    }

    const favorites: GlobalFavItem[] = [];

    for (const [key, val] of Object.entries(allData)) {
      if (key.startsWith('__tm_')) continue;
      const videoData = val as any;
      if (videoData && Array.isArray(videoData.tracks)) {
        for (const track of videoData.tracks) {
          if (track.isFavorite) {
            favorites.push({
              videoId: key,
              videoTitle: videoData.videoTitle || 'YouTube Video',
              track
            });
          }
        }
      }
    }

    favorites.sort((a, b) => (b.track.updatedAt || 0) - (a.track.updatedAt || 0));

    if (countBadge) {
      countBadge.textContent = `${favorites.length} track${favorites.length === 1 ? '' : 's'}`;
    }

    const signature = favorites.map(f => `${f.videoId}:${f.track.id}:${f.track.updatedAt || 0}:${f.track.isFavorite}`).join('|');
    if (signature === this.lastFavsSignature && listEl.children.length > 0) {
      this.updateActiveFavItemStyles();
      return;
    }
    this.lastFavsSignature = signature;

    if (favorites.length === 0) {
      listEl.innerHTML = `
        <div class="tm-empty">
          <div style="font-size: 22px; margin-bottom: 6px;">⭐</div>
          No favorite tracks saved yet.<br/>
          Star any track from your videos to build your personal library.
        </div>
      `;
      return;
    }

    listEl.innerHTML = favorites.map(fav => {
      const isCurrentVideo = fav.videoId === currentVideoId;
      const activeTrackId = this.stateManager.videoController.getState().activeTrack?.id;
      const isCurrentlyActive = isCurrentVideo && activeTrackId === fav.track.id;
      const cleanSearchQuery = encodeURIComponent(fav.track.title.replace(/[[\]()]/g, '').trim());
      const ytSearchUrl = `https://www.youtube.com/results?search_query=${cleanSearchQuery}`;
      const scSearchUrl = `https://soundcloud.com/search?q=${cleanSearchQuery}`;

      return `
        <div class="tm-fav-item ${isCurrentlyActive ? 'active' : ''}" data-video-id="${fav.videoId}" data-track-id="${fav.track.id}" data-start="${fav.track.startTime}">
          <div class="tm-fav-content">
            <div class="tm-fav-video-meta">
              <span class="tm-fav-video-name" title="${fav.videoTitle}">
                ${isCurrentVideo ? '<span class="tm-fav-here-badge">Playing here</span> ' : ''}${fav.videoTitle}
              </span>
            </div>
            <div class="tm-fav-track-name">
              ${isCurrentlyActive ? '<span class="tm-active-badge">▶</span> ' : ''}${fav.track.title}
            </div>
            <div class="tm-fav-meta-row">
              <span class="tm-track-range">${formatTime(fav.track.startTime)} - ${formatTime(fav.track.endTime)}</span>
              <div class="tm-track-search-links">
                <a href="${ytSearchUrl}" target="_blank" rel="noopener noreferrer" class="tm-search-link tm-search-yt" title="Search on YouTube" onclick="event.stopPropagation(); window.open('${ytSearchUrl}', '_blank'); return false;">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  YT
                </a>
                <a href="${scSearchUrl}" target="_blank" rel="noopener noreferrer" class="tm-search-link tm-search-sc" title="Search on SoundCloud" onclick="event.stopPropagation(); window.open('${scSearchUrl}', '_blank'); return false;">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M1.17 12.227c-.035 0-.067.03-.07.067L1 15.934c.003.04.035.066.07.066.039 0 .07-.027.07-.066l.102-3.64c-.004-.037-.035-.067-.07-.067zm1.196-.928c-.05 0-.09.04-.093.09l-.164 4.542c.003.05.043.09.093.09.047 0 .086-.04.086-.09l.168-4.542c0-.05-.039-.09-.09-.09zm1.22-.397c-.062 0-.113.05-.117.113l-.145 4.938c.004.062.055.113.117.113.059 0 .11-.05.11-.113l.148-4.938c0-.063-.05-.113-.113-.113zm1.23-.05c-.078 0-.14.062-.14.14l-.04 4.99c0 .077.062.14.14.14.075 0 .137-.063.137-.14l.043-4.99c0-.078-.062-.14-.14-.14zm1.246-.665c-.094 0-.172.079-.172.172v5.652c0 .094.078.172.172.172.094 0 .172-.078.172-.172v-5.652c0-.093-.078-.172-.172-.172zm1.274-1.28c-.11 0-.203.09-.203.204v6.933c0 .114.093.204.203.204.114 0 .207-.09.207-.204v-6.934c0-.113-.093-.203-.207-.203zm1.285-.567c-.129 0-.234.106-.234.235v7.504c0 .129.105.234.234.234.129 0 .235-.105.235-.234v-7.504c0-.129-.106-.235-.235-.235zm1.313-.488c-.145 0-.262.117-.262.262v7.992c0 .144.117.261.262.261.144 0 .261-.117.261-.261V7.852c0-.145-.117-.262-.261-.262zm1.32-.207c-.16 0-.293.133-.293.293v8.2c0 .16.133.293.293.293.16 0 .293-.133.293-.293v-8.2c0-.16-.133-.293-.293-.293zm1.344-.066c-.18 0-.324.148-.324.328v8.266c0 .18.144.328.324.328.18 0 .328-.148.328-.328V7.579c0-.18-.148-.328-.328-.328zm2.493-2.149c-.219 0-.414.043-.594.125-.133.062-.25.148-.351.25-.098.098-.18.211-.239.34-.058.125-.093.261-.105.406-.008.082-.012.164-.012.25v9.336c0 .137.05.266.14.36.095.093.223.144.36.144h7.02c1.785 0 3.234-1.45 3.234-3.235 0-1.687-1.293-3.078-2.953-3.219-.242-2.484-2.336-4.41-4.887-4.41-.531 0-1.047.086-1.531.25-.028-.012-.055-.027-.082-.043z"/></svg>
                  SC
                </a>
              </div>
            </div>
          </div>
          <div class="tm-fav-actions">
            <button class="tm-btn-fav starred" data-video-id="${fav.videoId}" data-track-id="${fav.track.id}" title="Remove from favorites">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </button>
            <button class="tm-btn-del" data-video-id="${fav.videoId}" data-track-id="${fav.track.id}" title="Delete track">🗑️</button>
          </div>
        </div>
      `;
    }).join('');

    if (!listEl.dataset.hasFavListeners) {
      listEl.dataset.hasFavListeners = 'true';
      listEl.addEventListener('click', async (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('.tm-search-link')) return;

        const favBtn = target.closest('.tm-btn-fav') as HTMLElement | null;
        if (favBtn) {
          e.stopPropagation();
          const vId = favBtn.dataset.videoId;
          const tId = favBtn.dataset.trackId;
          if (!vId || !tId) return;

          const currentVid = this.stateManager.getVideoData()?.videoId;
          if (vId === currentVid) {
            await this.stateManager.toggleFavorite(tId);
          } else {
            await StorageManager.toggleFavorite(vId, tId);
          }
          this.lastFavsSignature = '';
          await this.renderFavsList();
          this.renderTrackList();
          return;
        }

        const delBtn = target.closest('.tm-btn-del') as HTMLElement | null;
        if (delBtn) {
          e.stopPropagation();
          const vId = delBtn.dataset.videoId;
          const tId = delBtn.dataset.trackId;
          if (!vId || !tId) return;

          const currentVid = this.stateManager.getVideoData()?.videoId;
          if (vId === currentVid) {
            await this.stateManager.deleteTrack(tId);
          } else {
            await StorageManager.deleteTrack(vId, tId);
          }
          this.lastFavsSignature = '';
          await this.renderFavsList();
          this.renderTrackList();
          return;
        }

        const itemEl = target.closest('.tm-fav-item') as HTMLElement | null;
        if (itemEl) {
          const vId = itemEl.dataset.videoId;
          const tId = itemEl.dataset.trackId;
          const start = Number(itemEl.dataset.start || 0);
          if (!vId) return;

          const currentVid = this.stateManager.getVideoData()?.videoId;
          if (vId === currentVid) {
            if (tId) {
              await this.stateManager.selectTrack(tId, true);
              await this.stateManager.setLoop(true);
              this.updateActiveFavItemStyles();
            }
          } else {
            const targetUrl = `https://www.youtube.com/watch?v=${vId}&t=${Math.floor(start)}s`;
            window.location.href = targetUrl;
          }
        }
      });
    }
  }
}


