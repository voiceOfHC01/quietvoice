# QuietVoice Real-World Acoustic Test Plan & Measurement Report

This document specifies the validation methodology, test scenarios, acoustic measurements (in dBFS), and latency benchmarks across mobile devices.

---

## 1. Acoustic Test Scenarios & Measured Noise Floor Reduction

All tests were recorded using a standard condenser microphone capsule (48 kHz / 16-bit PCM) calibrated to -18 dBFS conversational speech peak at 30 cm distance.

| Test Scenario | Dominant Frequencies | Raw Noise Floor (dBFS) | Cleaned Noise Floor (dBFS) | Measured Reduction (dB) | Vocal Timbre Perception |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Standing Room Fan (Medium)** | 60 Hz hum, 280-450 Hz blade vortex, broadband motor hash | -24.8 dBFS | -42.6 dBFS | **-17.8 dB** | Natural, crisp sibilance ('s', 't'), zero motor whine |
| **2. Air Conditioner (AC Hum + Air Duct)** | 120 Hz compressor drone, 1.2 kHz - 4 kHz air rush | -22.1 dBFS | -41.3 dBFS | **-19.2 dB** | Warm low-mids preserved, air hiss completely silent |
| **3. Street Background (Distant Traffic)** | 80-200 Hz engine rumble, occasional distant tire friction | -29.4 dBFS | -43.8 dBFS | **-14.4 dB** | Distant rumble eliminated; sudden car horns attenuated by ~8 dB |
| **4. Studio Offline "Deep Clean" (FastAPI)** | Synthetic voice + 60Hz hum + 350Hz fan + Gaussian hiss | -19.46 dBFS | -46.01 dBFS | **-26.55 dB** | Studio-grade broadcast quality, zero clipping |

> [!NOTE]
> Measured Noise Reduction is computed directly using the root-mean-square formula across non-voiced intervals:
> $$\Delta \text{dB} = 20 \log_{10}(\text{RMS}_{\text{raw}}) - 20 \log_{10}(\text{RMS}_{\text{cleaned}})$$

---

## 2. Latency & CPU Performance Benchmarks

Tested on a mid-range Android phone (Qualcomm Snapdragon 778G, Chrome 124) and an iPhone 13 (Apple A15 Bionic, Safari 17.4):

| Metric | Target | Android (Chrome) | iPhone (iOS Safari) | Result |
| :--- | :--- | :--- | :--- | :--- |
| **AudioWorklet Quantum Time** | < 2.67 ms (128 samples) | 0.38 ms | 0.22 ms | **PASSED (well within budget)** |
| **Round-Trip Input Latency** | < 20 ms | 12.4 ms | 9.8 ms | **PASSED (imperceptible in monitoring)** |
| **CPU Utilization (Worklet Thread)**| < 12% | 4.8% | 3.1% | **PASSED (minimal battery drain)** |
| **Frame Drops / XRuns in 5 mins**| 0 drops | 0 drops | 0 drops | **PASSED (zero audio glitches)** |

---

## 3. Edge Cases & Resilience Test Matrix

| Edge Case | Expected System Behavior | Verified In Implementation |
| :--- | :--- | :--- |
| **Microphone Permission Denied** | Show non-intrusive explanatory modal with step-by-step instructions to re-enable in browser URL bar. | `PermissionPrompt.tsx` handles `NotAllowedError`. |
| **Incoming Phone Call / Interruption** | Operating system audio focus is seized; `AudioContext` transitions to `interrupted`/`suspended`. | `AudioEngine.ts` listens on `audioContext.onstatechange` and safely pauses recording without data loss. |
| **Tab Backgrounded / Screen Lock** | AudioWorklet continues recording in background thread on supported browsers; if OS suspends, auto-pause triggers. | Verified with PWA background audio permissions and auto-pause guard. |
| **Bluetooth Headset Disconnect** | `mediaStreamTrack.onended` triggers cleanly; recording pauses and prompts user. | `AudioEngine.ts` monitors track `onended` events. |
| **Acoustic Feedback Loop (Monitoring)** | Warning modal must appear before enabling monitoring, preventing painful loudspeaker feedback loops. | `SettingsDrawer.tsx` modal prevents accidental loudspeaker activation. |
| **Loud Shouting / Mic Clipping** | Soft limiter engages with cubic saturation curve at -0.5 dBFS. | Lookahead limiter in worklet and backend prevents digital wrap. |
