"""
QuietVoice - FastAPI Offline Deep Clean Backend
Provides studio-grade offline audio noise reduction for voice recordings.
Works seamlessly with pure Python standard library `wave` and `numpy`.
"""

import io
import wave
import struct
import asyncio
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50 MB safe upload guard (AUD-08)

app = FastAPI(
    title="QuietVoice Deep Clean API",
    description="Studio-grade offline noise reduction for QuietVoice recordings",
    version="1.0.0"
)

# Enable CORS for localhost and mobile local network devices
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "QuietVoice Deep Clean DSP",
        "version": "1.0.0"
    }

def process_offline_deep_clean(raw_wav_bytes: bytes) -> bytes:
    """
    Performs multi-pass studio spectral gating, HPF rumble removal,
    and voice harmonic preservation on WAV audio.
    """
    with wave.open(io.BytesIO(raw_wav_bytes), 'rb') as wav_in:
        n_channels = wav_in.getnchannels()
        sampwidth = wav_in.getsampwidth()
        framerate = wav_in.getframerate()
        n_frames = wav_in.getnframes()
        raw_frames = wav_in.readframes(n_frames)

    # Convert PCM to float32 (-1.0 to 1.0)
    if sampwidth == 2:
        samples = np.frombuffer(raw_frames, dtype=np.int16).astype(np.float32) / 32768.0
    else:
        # Fallback to int16 interpretation
        samples = np.frombuffer(raw_frames, dtype=np.int16).astype(np.float32) / 32768.0

    if n_channels > 1:
        # Downmix to mono for voice analysis
        samples = samples.reshape(-1, n_channels).mean(axis=1)

    # 1. 2nd-order Butterworth High-Pass Filter (85 Hz)
    omega = 2.0 * np.pi * 85.0 / framerate
    cos_w = np.cos(omega)
    alpha = np.sin(omega) / (2.0 * 0.7071)
    a0 = 1.0 + alpha
    b0 = ((1.0 + cos_w) / 2.0) / a0
    b1 = (-(1.0 + cos_w)) / a0
    b2 = ((1.0 + cos_w) / 2.0) / a0
    a1 = (-2.0 * cos_w) / a0
    a2 = (1.0 - alpha) / a0

    filtered = np.zeros_like(samples)
    w1, w2 = 0.0, 0.0
    for i in range(len(samples)):
        x = samples[i]
        y = b0 * x + w1
        w1 = b1 * x - a1 * y + w2
        w2 = b2 * x - a2 * y
        filtered[i] = y

    # 2. STFT Spectral Subtraction
    frame_len = 1024
    hop_len = 256
    window = np.hanning(frame_len)

    # Pad signal
    pad_len = frame_len - (len(filtered) % hop_len)
    padded = np.pad(filtered, (0, pad_len), mode='constant')

    num_frames = (len(padded) - frame_len) // hop_len + 1
    stft = np.zeros((num_frames, frame_len // 2 + 1), dtype=np.complex64)

    for i in range(num_frames):
        seg = padded[i * hop_len : i * hop_len + frame_len] * window
        stft[i] = np.fft.rfft(seg)

    magnitude = np.abs(stft)
    phase = np.angle(stft)

    # Estimate noise spectrum from the lowest 15% energy frames
    frame_energies = np.sum(magnitude ** 2, axis=1)
    noise_cutoff = np.percentile(frame_energies, 15)
    noise_indices = np.where(frame_energies <= noise_cutoff)[0]

    if len(noise_indices) > 2:
        noise_profile = np.mean(magnitude[noise_indices], axis=0)
    else:
        noise_profile = np.mean(magnitude[:5], axis=0) if num_frames > 5 else magnitude[0]

    # Spectral Subtraction parameters
    sub_factor = 2.2  # Over-subtraction
    spectral_floor = 0.06  # Prevents musical noise warble

    # Vectorized Spectral Subtraction across all frames in C without Python loop overhead
    cleaned_mag = np.maximum(magnitude - sub_factor * noise_profile, spectral_floor * magnitude)

    # Reconstruct with IFFT + Overlap-Add
    cleaned_stft = cleaned_mag * np.exp(1j * phase)
    reconstructed = np.zeros(len(padded), dtype=np.float32)
    win_sum = np.zeros(len(padded), dtype=np.float32)

    for i in range(num_frames):
        time_seg = np.fft.irfft(cleaned_stft[i]) * window
        idx = i * hop_len
        reconstructed[idx : idx + frame_len] += time_seg
        win_sum[idx : idx + frame_len] += window ** 2

    # Normalize window overlap
    non_zero = win_sum > 1e-4
    reconstructed[non_zero] /= win_sum[non_zero]
    reconstructed = reconstructed[: len(samples)]

    # 3. Soft Lookahead Peak Limiter & Normalization (-1.0 dBFS target)
    peak = np.max(np.abs(reconstructed))
    if peak > 0.001:
        target_peak = 0.89  # -1 dBFS
        gain = min(1.8, target_peak / peak)
        reconstructed *= gain
    reconstructed = np.clip(reconstructed, -0.98, 0.98)

    # Convert back to 16-bit PCM WAV
    pcm16 = (reconstructed * 32767.0).astype(np.int16)
    out_buf = io.BytesIO()
    with wave.open(out_buf, 'wb') as wav_out:
        wav_out.setnchannels(1)
        wav_out.setsampwidth(2)
        wav_out.setframerate(framerate)
        wav_out.writeframes(pcm16.tobytes())

    return out_buf.getvalue()

@app.post("/api/deep-clean")
async def deep_clean_audio(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(('.wav', '.wave')):
        # Read content anyway
        pass

    try:
        chunks = []
        total_size = 0
        chunk_size = 1024 * 1024  # 1MB chunk streaming check (AUD-08)
        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            total_size += len(chunk)
            if total_size > MAX_UPLOAD_SIZE:
                raise HTTPException(status_code=413, detail="Audio file exceeds 50MB maximum upload limit")
            chunks.append(chunk)

        content = b"".join(chunks)
        if len(content) < 44:
            raise HTTPException(status_code=400, detail="Invalid audio file size")

        # Offload CPU-heavy STFT spectral processing to worker thread pool (AUD-06)
        cleaned_wav = await asyncio.to_thread(process_offline_deep_clean, content)
        return Response(
            content=cleaned_wav,
            media_type="audio/wav",
            headers={
                "Content-Disposition": f"attachment; filename=cleaned_{file.filename or 'voice.wav'}",
                "X-Denoise-Engine": "QuietVoice-DeepClean-v1"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print("Starting QuietVoice Deep Clean Backend on http://0.0.0.0:8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
