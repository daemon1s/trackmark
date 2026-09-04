export const stylesText = `
:host {
  all: initial;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: #d4d4d8;
  box-sizing: border-box;
}

*, *::before, *::after {
  box-sizing: border-box;
}

@keyframes tm-spin-light {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes tm-logo-shimmer {
  0% {
    background-position: 200% center;
  }
  100% {
    background-position: -200% center;
  }
}

@keyframes tm-pane-fade {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tm-menu-wrapper {
  position: absolute;
  right: 20px;
  bottom: 64px;
  width: 420px;
  max-height: 560px;
  border-radius: 8px;
  padding: 1.5px;
  background: #181820;
  box-shadow: 0 0 30px rgba(0, 240, 255, 0.2), 0 20px 50px rgba(0, 0, 0, 0.95);
  z-index: 999999;
  pointer-events: auto !important;
  user-select: none;
  display: flex;
  overflow: hidden;
  position: absolute;
}

.tm-border-light {
  position: absolute;
  top: -150%;
  left: -150%;
  width: 400%;
  height: 400%;
  background: conic-gradient(
    from 0deg,
    #ff2a6d 0deg,
    #ff9f1c 60deg,
    #05ffa1 120deg,
    #00f0ff 180deg,
    #7000ff 240deg,
    #ff2a6d 360deg
  );
  animation: tm-spin-light 3.5s linear infinite;
  z-index: 0;
  pointer-events: none;
}

.tm-menu {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  background: #111115;
  border-radius: 6.5px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tm-header {
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #15151b;
  border-bottom: 1px solid #1f1f27;
  cursor: grab;
}

.tm-header:active {
  cursor: grabbing;
}

.tm-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tm-logo-icon-wrap {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
}

.tm-logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.tm-logo-text {
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 1.5px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: linear-gradient(
    110deg,
    #ffffff 20%,
    #00f0ff 40%,
    #ffffff 50%,
    #05ffa1 60%,
    #ffffff 80%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: tm-logo-shimmer 3.5s ease-in-out infinite;
  text-transform: uppercase;
  display: inline-block;
}

.tm-author-tag {
  font-size: 10px;
  color: #71717a;
  font-weight: 600;
  margin-left: 4px;
}

.tm-author-link {
  color: #00f0ff;
  text-decoration: none;
  font-weight: 700;
  transition: color 0.12s;
}

.tm-author-link:hover {
  color: #05ffa1;
  text-decoration: underline;
}

.tm-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tm-header-icon-link {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #71717a;
  text-decoration: none;
  padding: 4px;
  border-radius: 50%;
  background: transparent;
  transition: color 0.15s ease, transform 0.15s ease;
}

.tm-header-icon-link:hover {
  color: #00f0ff;
  background: transparent;
  transform: scale(1.15);
  filter: drop-shadow(0 0 5px rgba(0, 240, 255, 0.7));
}

.tm-btn-close {
  background: none;
  border: none;
  color: #71717a;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 13px;
  font-weight: bold;
  transition: all 0.12s;
}

.tm-btn-close:hover {
  color: #fff;
  background: #23232b;
}

.tm-tabs {
  display: flex;
  background: #0d0d10;
  margin: 8px 12px 6px 12px;
  padding: 3px;
  border-radius: 6px;
  border: 1px solid #1c1c24;
  gap: 3px;
}

button, input, select, textarea {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.tm-tab {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  flex: 1;
  padding: 5px 2px;
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  color: #71717a;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  letter-spacing: 0.3px;
  transition: color 0.12s ease, background 0.12s ease, border-color 0.12s ease;
  outline: none;
  white-space: nowrap;
}

.tm-tab:hover {
  color: #e4e4e7;
  background: rgba(255, 255, 255, 0.04);
}

.tm-tab.active {
  color: #fff;
  background: #1d1d27;
  border: 1px solid #2d2d3c;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.2);
  font-weight: 700;
}

.tm-content-pane {
  display: none;
  flex-direction: column;
  flex: 1;
}

.tm-content-pane.active {
  display: flex;
}

.tm-title-with-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tm-info-tooltip-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.tm-info-icon {
  font-size: 11px;
  opacity: 0.65;
  transition: opacity 0.15s, transform 0.15s;
}

.tm-info-tooltip-wrap:hover .tm-info-icon {
  opacity: 1;
  transform: scale(1.15);
}

.tm-tooltip-content {
  visibility: hidden;
  opacity: 0;
  width: 230px;
  background: #161622;
  color: #d4d4d8;
  text-align: left;
  border-radius: 6px;
  padding: 8px 10px;
  position: absolute;
  z-index: 100000;
  top: 100%;
  left: 0;
  margin-top: 6px;
  border: 1px solid #2d2d42;
  box-shadow: 0 8px 24px rgba(0,0,0,0.8), 0 0 10px rgba(0, 240, 255, 0.15);
  font-size: 10px;
  line-height: 1.4;
  pointer-events: none;
  transition: opacity 0.18s ease, visibility 0.18s ease, transform 0.18s ease;
  transform: translateY(-4px);
}

.tm-tooltip-content strong {
  color: #00f0ff;
}

.tm-info-tooltip-wrap:hover .tm-tooltip-content {
  visibility: visible;
  opacity: 1;
  transform: translateY(0);
}

.tm-tools-row {
  display: flex;
  gap: 6px;
}


.tm-active-bar {
  padding: 10px 14px;
  background: #141419;
  border-bottom: 1px solid #1f1f27;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.tm-active-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow: hidden;
  flex: 1;
}

.tm-active-title {
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tm-active-times {
  font-size: 10px;
  color: #00f0ff;
  font-family: monospace;
  font-weight: 600;
}



.tm-toggle-loop {
  padding: 5px 12px;
  border-radius: 4px;
  border: 1px solid #272736;
  background: #181822;
  color: #a1a1aa;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  letter-spacing: 0.4px;
}

.tm-toggle-loop.active {
  background: #00f0ff;
  color: #000;
  border-color: #00f0ff;
  box-shadow: 0 0 12px rgba(0, 240, 255, 0.45);
  font-weight: 800;
}

.tm-toggle-loop:hover {
  filter: brightness(1.15);
}

.tm-add-section {
  padding: 10px 14px;
  background: #131317;
  border-bottom: 1px solid #1f1f27;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tm-inputs-row {
  display: flex;
  gap: 6px;
}

.tm-input {
  background: #191920;
  border: 1px solid #272732;
  border-radius: 4px;
  color: #fff;
  padding: 6px 10px;
  font-size: 11px;
  outline: none;
  transition: all 0.12s;
}

.tm-input:focus {
  border-color: #00f0ff;
  background: #1e1e27;
  box-shadow: 0 0 6px rgba(0, 240, 255, 0.2);
}

.tm-input-title {
  flex: 1;
}

.tm-input-time {
  width: 72px;
  text-align: center;
  font-family: monospace;
}

.tm-btn-primary {
  background: #181824;
  color: #00f0ff;
  border: 1px solid #00f0ff;
  border-radius: 4px;
  padding: 7px 12px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  letter-spacing: 0.5px;
}

.tm-btn-primary:hover {
  background: #00f0ff;
  color: #000;
  box-shadow: 0 0 12px rgba(0, 240, 255, 0.5);
}

.tm-btn-primary.active {
  background: #00f0ff;
  color: #000;
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.4);
}

.tm-list {
  flex: 1;
  overflow-y: auto;
  max-height: 200px;
  background: #111115;
  scroll-behavior: smooth;
}

.tm-list::-webkit-scrollbar {
  width: 7px;
}

.tm-list::-webkit-scrollbar-track {
  background: #14141c;
  border-radius: 4px;
}

.tm-list::-webkit-scrollbar-thumb {
  background: #00f0ff;
  border-radius: 4px;
  box-shadow: 0 0 8px rgba(0, 240, 255, 0.5);
}

.tm-list::-webkit-scrollbar-thumb:hover {
  background: #05ffa1;
  box-shadow: 0 0 10px rgba(5, 255, 161, 0.7);
}

.tm-empty {
  padding: 24px 14px;
  text-align: center;
  color: #52525b;
  font-size: 11px;
}

.tm-track-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  border-bottom: 1px solid #16161f;
  cursor: pointer;
  transition: background 0.12s ease;
  position: relative;
  background: transparent;
}

.tm-track-item:hover {
  background: #171720;
}

.tm-track-item.active {
  background: #1f1f2d;
}

.tm-track-item.active .tm-track-name {
  color: #fff;
  font-weight: 700;
  font-size: 11px;
}

.tm-active-badge {
  display: inline-block;
  color: #00f0ff;
  font-size: 9px;
  margin-right: 5px;
  vertical-align: middle;
}

.tm-track-item.active .tm-track-range {
  color: #00f0ff;
  font-weight: 600;
}


@keyframes tm-marquee-scroll {
  0%, 20% {
    transform: translateX(0);
  }
  80%, 100% {
    transform: translateX(var(--marquee-dist, -50%));
  }
}

@keyframes tm-star-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.25) rotate(15deg); }
  100% { transform: scale(1); }
}

.tm-track-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
  flex: 1;
  padding-right: 8px;
  min-width: 0;
}

.tm-track-name-wrap {
  width: 100%;
  overflow: hidden;
  position: relative;
}

.tm-track-name {
  font-size: 11px;
  font-weight: 600;
  color: #e4e4e7;
  display: flex;
  align-items: center;
  white-space: nowrap;
  transition: color 0.12s;
  width: 100%;
  overflow: hidden;
}

.tm-title-inner {
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.tm-title-inner.overflowing {
  overflow: visible;
  text-overflow: clip;
  animation: tm-marquee-scroll 6s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite alternate;
}

.tm-track-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tm-track-range {
  font-size: 10px;
  color: #71717a;
  font-family: monospace;
}

.tm-track-search-links {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tm-search-link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 8.5px;
  font-weight: 700;
  text-decoration: none;
  background: #181822;
  border: 1px solid #282836;
  color: #a1a1aa;
  transition: all 0.12s;
}

.tm-search-link:hover {
  color: #fff;
  border-color: #00f0ff;
  background: #222230;
}

.tm-search-yt:hover {
  color: #ff0033;
  border-color: #ff0033;
}

.tm-search-sc:hover {
  color: #ff5500;
  border-color: #ff5500;
}

.tm-track-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tm-btn-fav {
  background: none;
  border: none;
  cursor: pointer;
  padding: 3px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #4b4b5c;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.tm-btn-fav:hover {
  color: #00f0ff;
  transform: scale(1.15);
}

.tm-btn-fav.starred {
  color: #00f0ff;
  filter: drop-shadow(0 0 5px rgba(0, 240, 255, 0.8));
  animation: tm-star-pulse 0.4s ease;
}

.tm-btn-fav.starred:hover {
  color: #05ffa1;
  filter: drop-shadow(0 0 6px rgba(5, 255, 161, 0.9));
}

.tm-btn-del {
  background: none;
  border: none;
  color: #71717a;
  cursor: pointer;
  padding: 2px 4px;
  font-size: 11px;
  border-radius: 3px;
  transition: all 0.12s;
}

.tm-btn-del:hover {
  color: #fff;
  background: rgba(255, 42, 109, 0.2);
}

.tm-btn-danger {
  color: #ff2a6d !important;
  border-color: #ff2a6d !important;
}

.tm-btn-danger:hover {
  background: #ff2a6d !important;
  color: #fff !important;
  box-shadow: 0 0 10px rgba(255, 42, 109, 0.5) !important;
}

.tm-boost-panel {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: #111115;
  overflow-y: auto;
  max-height: 440px;
}

.tm-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.tm-btn-reset-eq {
  background: #1c1c24;
  border: 1px solid #2d2d3c;
  color: #71717a;
  border-radius: 4px;
  font-size: 9.5px;
  font-weight: 700;
  padding: 2px 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.tm-btn-reset-eq:hover {
  color: #00f0ff;
  border-color: #00f0ff;
}

.tm-preset-select-wrap {
  position: relative;
  width: 100%;
  margin-bottom: 10px;
}

.tm-preset-select {
  width: 100%;
  background: #16161f;
  border: 1px solid #272736;
  border-radius: 5px;
  color: #00f0ff;
  font-size: 11px;
  font-weight: 600;
  padding: 6px 10px;
  outline: none;
  cursor: pointer;
  transition: border 0.15s;
}

.tm-preset-select:focus {
  border-color: #00f0ff;
  box-shadow: 0 0 6px rgba(0, 240, 255, 0.25);
}

.tm-preset-select option {
  background: #14141c;
  color: #fff;
}

.tm-eq-rack {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #16161d;
  border: 1px solid #23232f;
  border-radius: 6px;
  padding: 10px 8px;
  gap: 4px;
}

.tm-eq-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.tm-eq-val {
  font-size: 9.5px;
  font-weight: 700;
  color: #71717a;
  font-family: monospace;
}

.tm-eq-val.active {
  color: #05ffa1;
}

.tm-slider-v {
  -webkit-appearance: slider-vertical;
  appearance: slider-vertical;
  width: 16px;
  height: 80px;
  background: transparent;
  outline: none;
  cursor: pointer;
  accent-color: #00f0ff;
  display: inline-block;
  margin: 0 auto;
}


.tm-eq-freq {
  font-size: 9.5px;
  font-weight: 700;
  color: #a1a1aa;
}

.tm-boost-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #16161d;
  border: 1px solid #23232f;
  border-radius: 6px;
  padding: 10px;
}

.tm-boost-controls {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.tm-btn-preset {
  background: #1f1f2a;
  border: 1px solid #2d2d3b;
  color: #a1a1aa;
  border-radius: 4px;
  padding: 6px 0;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.12s;
}

.tm-btn-preset:hover {
  color: #05ffa1;
  border-color: #05ffa1;
}

.tm-btn-preset.active {
  background: #05ffa1;
  color: #000;
  border-color: #05ffa1;
  box-shadow: 0 0 8px rgba(5, 255, 161, 0.35);
}

.tm-boost-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.tm-boost-value-label {
  font-size: 11px;
  font-weight: 700;
  color: #05ffa1;
  font-family: monospace;
}

.tm-btn-toggle-boost {
  background: #1f1f2a;
  border: 1px solid #2d2d3b;
  color: #00f0ff;
  border-radius: 4px;
  padding: 5px 10px;
  font-size: 9.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.12s;
  text-transform: uppercase;
}

.tm-btn-toggle-boost:hover {
  background: #00f0ff;
  color: #000;
}

.tm-btn-toggle-boost.active {
  background: #00f0ff;
  color: #000;
  border-color: #00f0ff;
  box-shadow: 0 0 8px rgba(0, 240, 255, 0.35);
}

.tm-tools-panel {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #111115;
}

.tm-tool-card {
  background: #16161d;
  border: 1px solid #23232c;
  border-radius: 4px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tm-tool-title {
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  text-transform: uppercase;
}

.tm-tool-desc {
  font-size: 10px;
  color: #71717a;
}

.tm-btn-action {
  background: #1f1f2a;
  border: 1px solid #2d2d3b;
  border-radius: 4px;
  color: #00f0ff;
  padding: 7px 10px;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.12s;
  text-transform: uppercase;
}

.tm-btn-action:hover {
  background: #00f0ff;
  color: #000;
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.4);
}

.tm-footer {
  padding: 8px 14px;
  background: #141418;
  border-top: 1px solid #1f1f27;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tm-footer-btn {
  background: none;
  border: none;
  color: #71717a;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.12s;
}

.tm-footer-btn:hover {
  color: #00f0ff;
}

.tm-modal-view {
  position: absolute;
  inset: 0;
  background: #111115;
  z-index: 1000000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tm-modal-header {
  padding: 10px 14px;
  border-bottom: 1px solid #23232b;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #16161c;
}

.tm-modal-title {
  font-size: 12px;
  font-weight: 700;
  color: #00f0ff;
  text-transform: uppercase;
}

.tm-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tm-textarea {
  width: 100%;
  height: 150px;
  background: #181820;
  border: 1px solid #272734;
  border-radius: 4px;
  color: #fff;
  font-family: monospace;
  font-size: 11px;
  padding: 8px;
  resize: none;
  outline: none;
}

.tm-textarea:focus {
  border-color: #00f0ff;
}

.tm-preview-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #17171f;
  border: 1px solid #22222c;
  border-radius: 4px;
  font-size: 11px;
}

.tm-preview-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #e4e4e7;
}

.tm-preview-time {
  color: #00f0ff;
  font-family: monospace;
  font-size: 10px;
}

.tm-modal-footer {
  padding: 10px 14px;
  border-top: 1px solid #23232b;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  background: #141418;
}

.tm-btn-secondary {
  background: #1d1d26;
  border: 1px solid #2b2b38;
  color: #a1a1aa;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.12s;
}

.tm-btn-secondary:hover {
  color: #fff;
  background: #272733;
}

.tm-list-bar {
  padding: 6px 14px;
  background: #111116;
  border-bottom: 1px solid #1a1a24;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tm-list-count {
  font-size: 10px;
  font-weight: 700;
  color: #71717a;
  letter-spacing: 0.5px;
}

.tm-btn-filter-fav {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #171722;
  border: 1px solid #282836;
  color: #8e8e9f;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 9.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  letter-spacing: 0.3px;
}

.tm-btn-filter-fav:hover {
  color: #00f0ff;
  border-color: #00f0ff;
  background: #1d1d2b;
}

.tm-btn-filter-fav.active {
  background: rgba(0, 240, 255, 0.15);
  border-color: #00f0ff;
  color: #00f0ff;
  box-shadow: 0 0 8px rgba(0, 240, 255, 0.3);
}

.tm-favs-header {
  padding: 10px 14px;
  background: #141419;
  border-bottom: 1px solid #1f1f27;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tm-favs-header-title {
  font-size: 11.5px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tm-favs-count-badge {
  font-size: 9.5px;
  font-weight: 700;
  color: #00f0ff;
  background: rgba(0, 240, 255, 0.12);
  border: 1px solid rgba(0, 240, 255, 0.3);
  padding: 2px 7px;
  border-radius: 10px;
  font-family: monospace;
}

.tm-favs-list {
  max-height: 290px !important;
}

.tm-fav-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 14px 9px 12px;
  border-bottom: 1px solid #16161f;
  border-left: 2px solid transparent;
  box-sizing: border-box;
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease;
  position: relative;
  background: transparent;
}

.tm-fav-item:hover {
  background: #171722;
  border-left-color: #00f0ff;
}

.tm-fav-item.active {
  background: #1d1d2c;
  border-left-color: #05ffa1;
}

.tm-fav-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow: hidden;
  flex: 1;
  padding-right: 8px;
  min-width: 0;
}

.tm-fav-video-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
}

.tm-fav-video-name {
  font-size: 9.5px;
  color: #71717a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
}

.tm-fav-here-badge {
  display: inline-block;
  font-size: 8px;
  font-weight: 800;
  color: #05ffa1;
  background: rgba(5, 255, 161, 0.15);
  border: 1px solid rgba(5, 255, 161, 0.4);
  padding: 1px 4px;
  border-radius: 3px;
  letter-spacing: 0.4px;
}

.tm-fav-track-name {
  font-size: 11px;
  font-weight: 700;
  color: #f4f4f5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
}

.tm-fav-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tm-fav-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
`;
