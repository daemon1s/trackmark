import { StateManager } from '../core/state-manager';
import { Track } from '../types';
import { ShadowHost } from './shadow-host';
import { TracklistExtractor } from '../parser/tracklist-extractor';
import { parseTracklistText, ParsedTrackCandidate } from '../parser/timestamp-regex';
import { BackupManager } from '../storage/import-export';
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
  private currentModal: HTMLElement | null = null;
  private activeTab: 'tracks' | 'detect' | 'boost' | 'storage' = 'tracks';

  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
    this.init();
  }

  private init(): void {
    this.stateManager.subscribe(() => {
      if (this.isVisible && this.menuEl) {
        this.updateStateView();
        this.renderTrackList();
      }
    });
  }

  public toggle(): void {
    this.isVisible = !this.isVisible;
    if (this.isVisible) {
      this.lastTracksSignature = '';
      this.show();
    } else {
      this.hide();
    }
  }

  public show(): void {
    this.isVisible = true;
    this.lastTracksSignature = '';
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
        </div>
        <button class="tm-btn-close" id="tm-close-btn" title="Close">✕</button>
      </div>

      <div class="tm-tabs">
        <button class="tm-tab ${this.activeTab === 'tracks' ? 'active' : ''}" data-tab="tracks">TRACKS</button>
        <button class="tm-tab ${this.activeTab === 'detect' ? 'active' : ''}" data-tab="detect">DETECT</button>
        <button class="tm-tab ${this.activeTab === 'boost' ? 'active' : ''}" data-tab="boost">AUDIO & EQ</button>
        <button class="tm-tab ${this.activeTab === 'storage' ? 'active' : ''}" data-tab="storage">STORAGE</button>
      </div>

      <div class="tm-content-pane ${this.activeTab === 'tracks' ? 'active' : ''}" id="pane-tracks">
        <div class="tm-active-bar">
          <div class="tm-active-info">
            <div class="tm-active-title" id="tm-active-title">No track selected</div>
            <div class="tm-active-times" id="tm-active-times">Select or add a track below</div>
          </div>
          <button class="tm-toggle-loop" id="tm-loop-btn">
            LOOP OFF
          </button>
        </div>

        <div class="tm-add-section">
          <div class="tm-inputs-row">
            <input type="text" class="tm-input tm-input-title" placeholder="Track Name / Drop" id="tm-new-title" />
            <input type="text" class="tm-input tm-input-time" placeholder="Start" id="tm-new-start" value="${formatTime(currentTime)}" />
            <input type="text" class="tm-input tm-input-time" placeholder="End" id="tm-new-end" value="${formatTime(currentTime + 30)}" />
          </div>
          <button class="tm-btn-primary" id="tm-add-btn">
            + SAVE & LOOP TRACK
          </button>
        </div>

        <div class="tm-list" id="tm-track-list"></div>
      </div>

      <div class="tm-content-pane ${this.activeTab === 'detect' ? 'active' : ''}" id="pane-detect">
        <div class="tm-tools-panel">
          <div class="tm-tool-card">
            <span class="tm-tool-title">⚡ Auto-Detect Tracklist</span>
            <span class="tm-tool-desc">Extract all songs with timestamps from video description and comments with 1 click.</span>
            <button class="tm-btn-action" id="tm-scan-btn">SCAN METADATA</button>
          </div>

          <div class="tm-tool-card">
            <span class="tm-tool-title">📋 Raw Text Parser</span>
            <span class="tm-tool-desc">Paste any copied tracklist text to parse timestamps automatically.</span>
            <button class="tm-btn-action" id="tm-paste-btn">PASTE TEXT</button>
          </div>
        </div>
      </div>

      <div class="tm-content-pane ${this.activeTab === 'boost' ? 'active' : ''}" id="pane-boost">
        <div class="tm-boost-panel">
          <!-- Equalizer Section -->
          <div class="tm-eq-section">
            <div class="tm-section-header">
              <div class="tm-title-with-info">
                <span class="tm-boost-label">🎛️ Graphic Equalizer</span>
                <div class="tm-info-tooltip-wrap">
                  <span class="tm-info-icon">ℹ️</span>
                  <div class="tm-tooltip-content">
                    <strong>¿Cómo funciona el Ecualizador?</strong><br/>
                    • <strong>60Hz - 150Hz:</strong> Graves y sub-bajos.<br/>
                    • <strong>400Hz - 1kHz:</strong> Claridad en voces y cuerpo.<br/>
                    • <strong>2.4kHz - 15kHz:</strong> Presencia, agudos y brillo.<br/>
                    Ajusta los sliders verticales (-12dB a +12dB) o selecciona un preset para calibrar el audio al instante.
                  </div>
                </div>
              </div>
              <button class="tm-btn-reset-eq" id="tm-reset-eq-btn" title="Reset to Flat">RESET</button>
            </div>

            <div class="tm-preset-select-wrap">
              <select class="tm-preset-select" id="tm-eq-preset-select">
                <option value="flat">Flat / Standard</option>
                <option value="bass_boost">🔥 Bass Boost (Trap / Reggaeton)</option>
                <option value="electronic">⚡ Electronic / EDM / Dance</option>
                <option value="rock">🎸 Rock / Metal</option>
                <option value="pop">🎤 Pop</option>
                <option value="hiphop">🎧 Hip-Hop / R&B</option>
                <option value="vocal">🎙️ Vocal / Podcast Clarity</option>
                <option value="acoustic">🎻 Acoustic / Jazz</option>
                <option value="treble_boost">✨ Treble Boost (Brightness)</option>
                <option value="custom" disabled>Custom (Manual Adjustments)</option>
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
        </div>
      </div>

      <div class="tm-content-pane ${this.activeTab === 'storage' ? 'active' : ''}" id="pane-storage">
        <div class="tm-tools-panel">
          <div class="tm-tool-card">
            <div class="tm-title-with-info">
              <span class="tm-tool-title">💾 Local Storage Memory</span>
              <div class="tm-info-tooltip-wrap">
                <span class="tm-info-icon">ℹ️</span>
                <div class="tm-tooltip-content">
                  <strong>¿Cómo funciona la memoria?</strong><br/>
                  • <strong>100% Local:</strong> Tus pistas y bucles se guardan en <code>chrome.storage.local</code> en tu navegador.<br/>
                  • <strong>Privacidad Total:</strong> Ningún dato sale de tu equipo ni se envía a servidores externos.<br/>
                  • <strong>Persistencia:</strong> No se borra al cerrar YouTube ni al reiniciar tu PC.
                </div>
              </div>
            </div>
            <span class="tm-tool-desc">All your marked loops and song timestamps are stored offline directly in your browser's private local storage.</span>
          </div>

          <div class="tm-tool-card">
            <div class="tm-title-with-info">
              <span class="tm-tool-title">🔄 Backup & Transfer</span>
              <div class="tm-info-tooltip-wrap">
                <span class="tm-info-icon">ℹ️</span>
                <div class="tm-tooltip-content">
                  <strong>Export / Import JSON:</strong><br/>
                  Exporta un archivo <code>.json</code> para crear copias de seguridad de todas tus listas de canciones o migrarlas a otra PC o navegador en segundos.
                </div>
              </div>
            </div>
            <span class="tm-tool-desc">Create portable backup files or restore your saved library across different computers.</span>
            <div class="tm-tools-row">
              <button class="tm-btn-action" id="tm-export-btn" style="flex: 1;">EXPORT JSON</button>
              <button class="tm-btn-action" id="tm-import-btn" style="flex: 1;">IMPORT JSON</button>
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

    // Draggable window logic via header
    const header = this.menuEl.querySelector('.tm-header') as HTMLElement;
    if (header && this.wrapperEl) {
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let startLeft = 0;
      let startTop = 0;

      const onMouseDown = (e: MouseEvent) => {
        if ((e.target as HTMLElement).closest('#tm-close-btn')) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        const rect = this.wrapperEl!.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;

        // Convert bottom/right positioning to absolute top/left for free dragging
        this.wrapperEl!.style.bottom = 'auto';
        this.wrapperEl!.style.right = 'auto';
        this.wrapperEl!.style.left = `${startLeft}px`;
        this.wrapperEl!.style.top = `${startTop}px`;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging || !this.wrapperEl) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        const newLeft = Math.max(10, Math.min(window.innerWidth - this.wrapperEl.offsetWidth - 10, startLeft + dx));
        const newTop = Math.max(10, Math.min(window.innerHeight - this.wrapperEl.offsetHeight - 10, startTop + dy));

        this.wrapperEl.style.left = `${newLeft}px`;
        this.wrapperEl.style.top = `${newTop}px`;
      };

      const onMouseUp = () => {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      header.addEventListener('mousedown', onMouseDown);
    }

    this.menuEl.querySelector('#tm-close-btn')?.addEventListener('click', () => this.hide());

    this.menuEl.querySelectorAll('.tm-tab').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        const tab = (tabBtn as HTMLElement).dataset.tab as 'tracks' | 'detect' | 'boost' | 'storage';
        if (tab) {
          this.activeTab = tab;
          this.menuEl?.querySelectorAll('.tm-tab').forEach(t => t.classList.remove('active'));
          tabBtn.classList.add('active');

          this.menuEl?.querySelectorAll('.tm-content-pane').forEach(p => p.classList.remove('active'));
          this.menuEl?.querySelector(`#pane-${tab}`)?.classList.add('active');
        }
      });
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


    this.menuEl.querySelector('#tm-scan-btn')?.addEventListener('click', () => {
      this.handleAutoScan();
    });

    this.menuEl.querySelector('#tm-paste-btn')?.addEventListener('click', () => {
      this.handlePasteTracklist();
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
      label.textContent = enabled ? `${percent}%` : '100% (OFF)';
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
      alert('No timestamps found in description or comments.\nYou can use "PASTE TEXT" to paste timestamps manually.');
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
        <div class="tm-modal-title">PASTE TRACKLIST</div>
        <button class="tm-btn-close" id="tm-modal-close">✕</button>
      </div>
      <div class="tm-modal-body">
        <span style="font-size: 10px; color: #71717a;">Paste text with timestamps (e.g. 01:23 Song Name):</span>
        <textarea class="tm-textarea" id="tm-paste-area" placeholder="00:00 Intro&#10;03:45 Artist - Track 1&#10;08:20 Artist - Track 2..."></textarea>
      </div>
      <div class="tm-modal-footer">
        <button class="tm-btn-secondary" id="tm-paste-cancel">CANCEL</button>
        <button class="tm-btn-primary" id="tm-paste-parse">PARSE TRACKS</button>
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
        alert('Could not detect any timestamps in the pasted text.');
        return;
      }

      this.showPreviewModal(`Pasted Text (${tracks.length} tracks)`, tracks);
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
        <button class="tm-btn-secondary" id="tm-modal-cancel">CANCEL</button>
        <button class="tm-btn-primary" id="tm-modal-import">
          IMPORT SELECTED (${candidates.length})
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
    const tracks = videoData?.tracks || [];
    const activeTrackId = this.stateManager.videoController.getState().activeTrack?.id;

    const signature = JSON.stringify(tracks.map(t => ({ id: t.id, title: t.title, fav: t.isFavorite, s: t.startTime, e: t.endTime })));
    if (signature === this.lastTracksSignature && listEl.children.length > 0) {
      this.updateActiveItemStyles();
      return;
    }
    this.lastTracksSignature = signature;

    if (tracks.length === 0) {
      listEl.innerHTML = `<div class="tm-empty">No tracks saved for this video.<br/>Use TOOLS to auto-detect or add one above.</div>`;
      return;
    }

    listEl.innerHTML = tracks.map((track: Track) => {
      const isActive = activeTrackId === track.id;
      return `
      <div class="tm-track-item ${isActive ? 'active' : ''}" data-id="${track.id}">
        <div class="tm-track-details">
          <div class="tm-track-name">
            ${isActive ? '<span class="tm-active-badge">▶</span> ' : ''}${track.title}
          </div>
          <div class="tm-track-range">${formatTime(track.startTime)} - ${formatTime(track.endTime)}</div>
        </div>
        <div class="tm-track-actions">
          <button class="tm-btn-fav ${track.isFavorite ? 'starred' : ''}" data-id="${track.id}" title="Favorite">⭐</button>
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
        if (target.classList.contains('tm-btn-fav') || target.classList.contains('tm-btn-del')) {
          return;
        }
        await this.stateManager.selectTrack(trackId, true);
        await this.stateManager.setLoop(true);
      });
    });

    listEl.querySelectorAll('.tm-btn-fav').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const trackId = (btn as HTMLElement).dataset.id;
        if (trackId) {
          await this.stateManager.toggleFavorite(trackId);
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
      loopBtn.textContent = `LOOP ${isLoopActive ? 'ACTIVE' : 'OFF'}`;
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
}


