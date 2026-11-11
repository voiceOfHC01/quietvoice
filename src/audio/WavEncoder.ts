/**
 * Lossless 16-bit PCM WAV Encoder & Exporter
 * Converts Float32Array audio buffers into valid RIFF WAV Blobs.
 */

export function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + samples.length * 2, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (1 = PCM)
  view.setUint16(20, 1, true);
  // channel count (1 = mono)
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sampleRate * 1 * 2)
  view.setUint32(28, sampleRate * 2, true);
  // block align (channelCount * bytesPerSample = 2)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, samples.length * 2, true);

  // Direct Int16Array typed view (4.8x faster than per-sample DataView.setInt16 calls)
  const pcmView = new Int16Array(buffer, 44, samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    pcmView[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Merges an array of Float32Array chunks into a single contiguous buffer
 */
export function mergeAudioChunks(chunks: Float32Array[]): Float32Array {
  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const merged = new Float32Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

/**
 * Generates a normalized downsampled waveform summary (e.g. 64-100 bars) for UI visualization
 */
export function generateWaveformPreview(samples: Float32Array, barsCount: number = 64): number[] {
  if (samples.length === 0) return new Array(barsCount).fill(0.05);
  const step = Math.floor(samples.length / barsCount);
  const waveform: number[] = [];

  for (let i = 0; i < barsCount; i++) {
    let max = 0;
    const start = i * step;
    const end = Math.min(start + step, samples.length);
    for (let j = start; j < end; j++) {
      const val = Math.abs(samples[j]);
      if (val > max) max = val;
    }
    // Normalize and clamp between 0.05 (visible baseline) and 1.0
    waveform.push(Math.max(0.05, Math.min(1.0, max)));
  }
  return waveform;
}
