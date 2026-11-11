# QuietVoice Known Limitations & Future Roadmap

## 1. Physical & Algorithmic Limitations

### Stationary vs. Transient Noise Separation
* **What works exceptionally well**: Stationary noises with stable statistical power spectrums over time—such as desk fans, ceiling fans, HVAC compressors, laptop cooling fans, 50/60 Hz mains electrical hum, and microphone preamp thermal hiss. QuietVoice consistently removes **-16 to -24 dB** of stationary noise.
* **What cannot be 100% eliminated**: Non-stationary sudden transients (door slams, keyboard clatter, car horns, or other people talking directly into the microphone). Because human speech and sudden transients share overlapping frequency and temporal characteristics, attempting to aggressively wipe out unexpected transients will cause the speaker's consonants and word endings to be clipped. QuietVoice chooses vocal intelligibility over destructive over-filtering.

### Mobile Bluetooth Headset Constraints (HFP / SCO Profile)
* When using Bluetooth wireless earbuds (AirPods, Galaxy Buds) as the input microphone on iOS or Android, the operating system forces the Bluetooth profile into **Hands-Free Profile (HFP / SCO)**.
* HFP limits microphone sampling to **16 kHz (mSBC / Wideband Speech)** or **8 kHz (CVSD)**, regardless of the app's sample rate setting. This cuts off audio above 8 kHz.
* **Recommendation**: For maximum fidelity, use the phone's built-in studio array microphone or wired USB-C/Lightning microphones.

### iOS Safari Audio Focus & User Gesture Rules
* Apple iOS WebKit requires an explicit user gesture (`click` or `touchstart`) before an `AudioContext` can transition from `"suspended"` to `"running"`.
* QuietVoice initializes and resumes the `AudioContext` strictly inside the tap event handler of the Record button.

---

## 2. Next Technical Roadmap

1. **Dual-Microphone Beamforming**: Modern smartphones have a bottom microphone (for voice) and a top/rear microphone (for ambient noise). We plan to support dual-channel `MediaStreamTrack` inputs to calculate real-time phase cancellation between mic pairs.
2. **WebCodecs API Hardware OPUS/AAC Encoding**: Utilize native mobile hardware encoders via `VideoEncoder` / `AudioEncoder` WebCodecs API to output compressed M4A / OPUS files directly with near-zero CPU overhead.
3. **DeepFilterNet ONNX Integration**: Integrate DeepFilterNet3 as an optional ultra-high-definition neural network for desktop or high-end smartphone browsers supporting WebAssembly SIMD and WebGPU.
