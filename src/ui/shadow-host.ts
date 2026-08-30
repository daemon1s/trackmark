import { stylesText } from './styles';

export class ShadowHost {
  private static instance: ShadowHost | null = null;
  public hostElement: HTMLElement | null = null;
  public shadowRoot: ShadowRoot | null = null;

  private constructor() {
    this.mount();
  }

  public static getInstance(): ShadowHost {
    if (!ShadowHost.instance) {
      ShadowHost.instance = new ShadowHost();
    }
    return ShadowHost.instance;
  }

  public mount(): ShadowRoot | null {
    if (this.shadowRoot && this.hostElement && document.contains(this.hostElement)) {
      return this.shadowRoot;
    }

    let playerContainer = document.querySelector('#movie_player') as HTMLElement;
    if (!playerContainer) {
      playerContainer = document.querySelector('ytd-player') || document.body;
    }
    if (!playerContainer) return null;

    let host = document.getElementById('trackmark-shadow-host') as HTMLElement;
    if (!host || !document.contains(host)) {
      if (host) host.remove();
      host = document.createElement('div');
      host.id = 'trackmark-shadow-host';
      host.style.position = 'absolute';
      host.style.top = '0';
      host.style.left = '0';
      host.style.width = '100%';
      host.style.height = '100%';
      host.style.pointerEvents = 'none';
      host.style.zIndex = '999999';
      host.style.overflow = 'visible';

      if (getComputedStyle(playerContainer).position === 'static') {
        playerContainer.style.position = 'relative';
      }

      playerContainer.appendChild(host);
      this.shadowRoot = host.attachShadow({ mode: 'open' });
    } else {
      this.shadowRoot = host.shadowRoot;
    }

    this.hostElement = host;

    if (this.shadowRoot && !this.shadowRoot.querySelector('style#tm-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'tm-styles';
      styleEl.textContent = stylesText;
      this.shadowRoot.appendChild(styleEl);
    }

    return this.shadowRoot;
  }
}
