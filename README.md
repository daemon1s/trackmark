<p align="center">
  <img src="icons/icon-128.png" alt="TrackMark Logo" width="100" height="100" />
</p>

<h1 align="center">TRACKMARK</h1>

<p align="center">
  <strong>YouTube Track & Segment Looper • 6-Band Graphic Equalizer • Auto-Detect Metadata</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Manifest-V3-00f0ff?style=for-the-badge&logo=googlechrome&logoColor=black" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Audio-Web_Audio_API-05ffa1?style=for-the-badge&logo=soundcharts&logoColor=black" alt="Web Audio API" />
  <img src="https://img.shields.io/badge/License-MIT-ff2a6d?style=for-the-badge" alt="License MIT" />
</p>

---

## 🎬 Demo

<p align="center">
  <video src="assets/demo.mp4" width="100%" controls autoplay loop muted></video>
</p>

---

## ✨ Features

- ⚡ **Precision Track Looping**: Seamless, zero-gap looping with timestamp precision directly inside YouTube's HTML5 player.
- 🎛️ **6-Band Graphic Equalizer**: Web Audio API cascade (60Hz, 150Hz, 400Hz, 1kHz, 2.4kHz, 15kHz) with built-in presets (Bass Boost, EDM, Rock, Pop, Hip-Hop, Vocal Clarity) that persist globally across videos.
- 📋 **1-Click Auto-Detect Tracklist**: Extracts all song titles and timestamps from video descriptions and top comments automatically.
- 📌 **Interactive Timeline Markers**: Visual markers and active loop highlights overlaid directly on the native YouTube progress bar.
- 🔍 **Quick Search Integrations**: Direct YouTube and SoundCloud search buttons next to every song timestamp without restarting playback.
- 🪟 **Draggable & Isolated UI**: Shadow DOM container with fluid header dragging that never leaks styles or interferes with native YouTube shortcuts.
- 💾 **100% Local & Private**: All timestamps and presets are stored offline in `chrome.storage.local`. Includes instant JSON Export/Import for backup.

---

## 🚀 Quick Install (Load Unpacked)

### Option 1: Download Release (.ZIP)

1. Download the latest **`TrackMark-v1.0.0.zip`** from [Releases](https://github.com/daemon1s/trackmark/releases).
2. Extract the `.zip` file to any folder on your computer.
3. Open Google Chrome and go to `chrome://extensions/`.
4. Enable **Developer mode** (Modo desarrollador) in the top-right corner.
5. Click **Load unpacked** (Cargar descomprimida) and select the extracted folder.
6. Open any YouTube video and click the **TrackMark (TM)** icon in the player bar!

---

### Option 2: Build from Source

```bash
# Clone repository
git clone https://github.com/daemon1s/trackmark.git
cd trackmark

# Install dependencies
npm install

# Build extension
npm run build
```

Then load the `dist/` folder into `chrome://extensions/` with **Load unpacked**.

---

## 🛠️ Architecture & Web Audio Graph

```
YouTube HTML5 Video (MediaElementSource)
  │
  ▼
[60Hz LowShelf] ──► [150Hz Peaking] ──► [400Hz Peaking] ──► [1kHz Peaking] ──► [2.4kHz Peaking] ──► [15kHz HighShelf]
  │
  ▼
[GainNode (1.0x)]
  │
  ▼
[DynamicsCompressorNode (Limiter to prevent clipping)]
  │
  ▼
AudioDestination (Hardware Output)
```

---

## 👤 Author

Developed by **[daemon1s](https://github.com/daemon1s)**

---

## 📄 License

MIT License © 2026 [daemon1s](https://github.com/daemon1s)

