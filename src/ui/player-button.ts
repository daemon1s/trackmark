import { FloatingMenu } from './floating-menu';
import { TM_LOGO_DATA_URI } from './logo-asset';

export class PlayerButton {
  private floatingMenu: FloatingMenu;
  private buttonEl: HTMLButtonElement | null = null;
  private observer: MutationObserver | null = null;

  constructor(floatingMenu: FloatingMenu) {
    this.floatingMenu = floatingMenu;
    this.init();
  }

  public init(): void {
    const oldStyles = document.getElementById('tm-btn-styles');
    if (oldStyles) oldStyles.remove();

    this.tryInject();

    this.observer = new MutationObserver(() => {
      if (!this.buttonEl || !document.contains(this.buttonEl)) {
        this.tryInject();
      }
    });

    const moviePlayer = document.querySelector('#movie_player') || document.body;
    if (moviePlayer) {
      this.observer.observe(moviePlayer, { childList: true, subtree: true });
    }
  }

  public tryInject(): boolean {
    const rightControls = document.querySelector('.ytp-right-controls');
    if (!rightControls) return false;

    if (document.querySelector('.ytp-trackmark-button')) {
      return true;
    }

    const subtitlesBtn = rightControls.querySelector('.ytp-subtitles-button');

    const button = document.createElement('button');
    button.className = 'ytp-button ytp-trackmark-button';
    button.title = 'TrackMark';
    button.setAttribute('aria-label', 'TrackMark');
    button.style.background = 'transparent';
    button.style.border = 'none';
    button.style.outline = 'none';
    button.style.padding = '0';
    button.style.cursor = 'pointer';
    button.style.display = 'inline-flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.verticalAlign = 'top';
    button.style.opacity = '0.9';
    button.style.transition = 'opacity 0.15s ease, transform 0.15s ease';

    button.innerHTML = `
      <img src="${TM_LOGO_DATA_URI}" style="width: 22px; height: 22px; object-fit: contain; pointer-events: none; display: block; user-select: none;" alt="TM" />
    `;

    button.addEventListener('mouseenter', () => {
      button.style.opacity = '1';
      button.style.transform = 'scale(1.12)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.opacity = '0.9';
      button.style.transform = 'scale(1)';
    });

    const handleClick = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      this.floatingMenu.toggle();
    };

    button.addEventListener('click', handleClick);

    if (subtitlesBtn && subtitlesBtn.parentNode === rightControls) {
      rightControls.insertBefore(button, subtitlesBtn);
    } else {
      rightControls.prepend(button);
    }

    this.buttonEl = button;
    return true;
  }

  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.buttonEl) {
      this.buttonEl.remove();
      this.buttonEl = null;
    }
  }
}
