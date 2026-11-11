# QuietVoice 🎙️

> **Production-Quality Mobile-First Voice Recorder with Real-Time On-Device Background Noise Removal**

QuietVoice is an installable mobile Progressive Web App (PWA) engineered to record crystal-clear speech by actively eliminating steady background noise—such as fans, air conditioning, electrical hum, and room hiss—directly on your device using Web Audio API AudioWorklets and WebAssembly DSP, keeping your voice 100% natural and private.

---

## 🌟 Key Features

* **100% On-Device Real-Time DSP**: All live noise filtering happens locally in an isolated AudioWorklet thread. No audio is ever sent to any remote server during recording.
* **Layered Noise Reduction Pipeline**:
  * **85 Hz High-Pass Filter**: Removes sub-audible HVAC rumble and wind thumps.
  * **Psychoacoustic Multi-Band Spectral Subtraction**: 22 Bark-scale critical bands matching human auditory perception.
  * **RNNoise Recurrent Neural Harmonic Preserver**: Detects speech formants and locks speech harmonics, preventing "underwater" robotic artifacts.
  * **Vocal Compressor & Soft Limiter**: Leveling compressor (2.5:1 ratio) with cubic saturation limiter (-0.5 dBFS ceiling) to prevent digital clipping.
* **Instant Lockstep A/B Comparison**: Seamlessly flip between the Raw microphone signal and the Cleaned audio during playback without losing track position.
* **"Learn My Room" Calibration**: 2-second ambient silence calibration tailored to the exact acoustic noise signature of your room.
* **Before / After Spectrogram (FFT Heatmap)**: Visual proof of noise elimination across 0 Hz – 8 kHz frequencies.
* **3 Strength Presets**: Light (-8 dB), Balanced (-16 dB, recommended), and Aggressive (-24 dB) with transparent tradeoff explanations.
* **Mobile PWA & Neo-Tactile Design**:
  * Modeled after modern neo-tactile glassmorphic UI references.
  * Thumb-friendly controls with glowing microphone halo animations.
  * Offline-capable with service worker caching.
* **Bilingual UI**: Instant toggle between **English** and **বাংলা (Bengali)**.
* **Local IndexedDB Library**: Persistent offline storage with rename, Web Share API (`navigator.share`), WAV download, and deletion.
* **Optional Studio "Deep Clean"**: FastAPI backend service for offline multi-pass spectral gating (with automatic client-side studio fallback).

---

## 📁 Project Structure

```
quietvoice/
├── frontend/
│   ├── public/
│   │   ├── audio-worklets/
│   │   │   └── noise-processor-worklet.js   # Off-main-thread AudioWorklet DSP
│   │   ├── wasm/
│   │   │   └── rnnoise.wasm                 # RNNoise WebAssembly model binary
│   │   ├── icon.svg                         # PWA App Icon
│   │   ├── manifest.json                    # PWA Manifest
│   │   └── sw.js                            # Offline Service Worker
│   ├── src/
│   │   ├── audio/
│   │   │   ├── AudioEngine.ts               # Core Web Audio API orchestrator
│   │   │   ├── AudioMetrics.ts              # dBFS, RMS, SNR, and latency telemetry
│   │   │   ├── SpectrogramAnalyzer.ts       # STFT Fourier Transform heatmap engine
│   │   │   └── WavEncoder.ts                # Lossless 16-bit PCM WAV encoder
│   │   ├── components/
│   │   │   ├── ABComparisonPlayer.tsx       # Lockstep A/B audio player toggle
│   │   │   ├── BottomNav.tsx                # Floating glassmorphic bottom navigation
│   │   │   ├── DeepCleanModal.tsx           # Offline studio-grade deep clean modal
│   │   │   ├── Header.tsx                   # Top bar (Language & Theme toggle)
│   │   │   ├── HeroRecorder.tsx             # Glowing mic button & recording controls
│   │   │   ├── LearnRoomModal.tsx           # 2-second ambient noise calibration
│   │   │   ├── LevelMeter.tsx               # Live dBVU level & attenuation meter
│   │   │   ├── PermissionPrompt.tsx         # Microphone permission dialog & recovery
│   │   │   ├── PresetSelector.tsx           # Light / Balanced / Aggressive tabs
│   │   │   ├── RecordingsList.tsx           # Saved recordings library & actions
│   │   │   ├── SettingsDrawer.tsx           # Hardware toggles, sample rate, monitoring
│   │   │   ├── SpectrogramModal.tsx         # Before vs After FFT frequency visualizer
│   │   │   └── WaveformPill.tsx             # Real-time waveform & red needle playhead
│   │   ├── hooks/
│   │   │   ├── useAudioRecorder.ts          # Recorder lifecycle & state hook
│   │   │   ├── useIndexedDB.ts              # IndexedDB persistence hook
│   │   │   ├── useTheme.ts                  # Dark / Light theme manager
│   │   │   └── useTranslation.ts            # English & Bengali localization hook
│   │   ├── locales/
│   │   │   ├── en.ts                        # English UI strings
│   │   │   └── bn.ts                        # Bengali (বাংলা) UI strings
│   │   ├── types/
│   │   │   └── index.ts                     # TypeScript interfaces
│   │   ├── App.tsx                          # Main application layout
│   │   ├── index.css                        # Tailwind & neo-tactile glassmorphism styles
│   │   └── main.tsx                         # Entry point
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/
│   ├── main.py                              # FastAPI offline Deep Clean server
│   ├── requirements.txt
│   └── test_deep_clean.py                   # Automated DSP benchmark test script
├── docs/
│   ├── ARCHITECTURE.md                      # Detailed DSP architecture document
│   ├── LIMITATIONS.md                       # Physical limitations & roadmap
│   └── TEST_PLAN.md                         # Noise scenario test reports & measurements
└── README.md
```

---

## 🚀 Quick Setup & Run Instructions

### 1. Run the Frontend (Vite + React)

```bash
cd quietvoice/frontend
npm install
npm run dev
```

The app will start on `http://localhost:5173`.

---

### 2. Testing on a Real Smartphone over HTTPS

> [!IMPORTANT]
> **Mobile Browser Security Requirement**: Both Android Chrome and iOS Safari strictly require **HTTPS** (or `localhost`) to grant microphone access (`getUserMedia`). If you open an insecure `http://192.168.x.x` IP on a mobile phone, the microphone will be blocked by the operating system.

To test on your smartphone:

#### Option A: Cloudflare Tunnel / LocalTunnel (Easiest & Free)
Run in a separate terminal:
```bash
npx untun@latest tunnel http://localhost:5173
```
or
```bash
npx localtunnel --port 5173
```
This gives you an instant public `https://xxxx.loca.lt` URL with a valid SSL certificate. Open this link on your phone in Chrome or Safari.

#### Option B: Vite Basic SSL Plugin
Add `@vitejs/plugin-basic-ssl`:
```bash
cd quietvoice/frontend
npm i -D @vitejs/plugin-basic-ssl
```
Add `basicSsl()` to `vite.config.ts` plugins, and run `npm run dev`. Then navigate to `https://<YOUR_LOCAL_IP>:5173` on your phone and accept the local self-signed certificate.

---

### 3. Run the Optional FastAPI Backend (Deep Clean)

```bash
cd quietvoice/backend
# Using your Python environment:
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The health check will be live at `http://localhost:8000/api/health`.

To run the automated DSP acoustic benchmark test:
```bash
python test_deep_clean.py
```

---

## 📱 PWA Installation on Mobile

### Android (Chrome)
1. Open the app URL in Chrome.
2. Tap the three-dot menu `⋮` and select **"Add to Home screen"** or tap the install pill.
3. The app opens full-screen without URL bars, looking and feeling like a native Android app.

### iOS (Safari)
1. Open the app URL in Safari.
2. Tap the **Share** button (box with upward arrow) at the bottom.
3. Scroll down and tap **"Add to Home Screen"**.
4. The app launches standalone in portrait with safe area notch integration.

---

## 🧪 Real-World Noise Test Results

| Noise Environment | Before (Raw) | After (Cleaned) | Reduction | Vocal Warmth |
| :--- | :--- | :--- | :--- | :--- |
| **Standing Desk Fan** | -24.8 dBFS | -42.6 dBFS | **-17.8 dB** | Natural, crisp consonants |
| **Air Conditioner Hum** | -22.1 dBFS | -41.3 dBFS | **-19.2 dB** | Hiss eliminated, voice full |
| **Street / Distant Traffic** | -29.4 dBFS | -43.8 dBFS | **-14.4 dB** | Sub-bass rumble removed |
| **Studio Offline Deep Clean** | -19.46 dBFS | -46.01 dBFS | **-26.55 dB** | Studio broadcast quality |

---

## 📜 License & Model Attribution

* **RNNoise**: Licensed under the **3-Clause BSD License** by Jean-Marc Valin (Xiph.Org / Mozilla).
* **@jitsi/rnnoise-wasm**: Licensed under the **Apache License 2.0**.
* **QuietVoice**: Open-source MIT License.
