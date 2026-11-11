/**
 * Short-Time Fourier Transform (STFT) Spectrogram Analyzer
 * Computes frequency spectrum over time and renders a heatmap canvas
 * visually showing the noise floor disappear in the low and mid bands.
 */

export class SpectrogramAnalyzer {
  private fftSize: number;
  private hopSize: number;
  private cachedCanvas: HTMLCanvasElement | null = null;
  private cachedFrames: Float32Array[] | null = null;

  constructor(fftSize: number = 512, hopSize: number = 256) {
    this.fftSize = fftSize;
    this.hopSize = hopSize;
  }

  /**
   * Computes spectrogram frames (time slices of frequency magnitudes in dB)
   */
  public async computeSpectrogram(audioBlob: Blob): Promise<{
    frames: Float32Array[];
    sampleRate: number;
    duration: number;
    maxFreq: number;
  }> {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const AudioCtx = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ||
                     (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ||
                     AudioContext;
    const tempCtx = new AudioCtx();
    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
    } finally {
      if (tempCtx.state !== 'closed') {
        await tempCtx.close().catch(() => {});
      }
    }
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;

    const frames: Float32Array[] = [];
    const numFrames = Math.floor((channelData.length - this.fftSize) / this.hopSize);
    const hanningWin = this.createHanningWindow(this.fftSize);

    // Subsample frames if file is long (limit to ~400 time columns for smooth mobile canvas rendering)
    const frameStep = Math.max(1, Math.floor(numFrames / 400));
    const numBins = this.fftSize / 2;

    const real = new Float32Array(this.fftSize);
    const imag = new Float32Array(this.fftSize);

    for (let f = 0; f < numFrames; f += frameStep) {
      const offset = f * this.hopSize;
      imag.fill(0);

      for (let n = 0; n < this.fftSize; n++) {
        real[n] = channelData[offset + n] * hanningWin[n];
      }

      // Simple Cooley-Tukey Radix-2 FFT
      this.fft(real, imag);

      // Magnitude in dBFS
      const magnitudes = new Float32Array(numBins);
      for (let k = 0; k < numBins; k++) {
        const mag = Math.sqrt(real[k] * real[k] + imag[k] * imag[k]) / (this.fftSize / 2);
        const db = mag > 0.00001 ? 20 * Math.log10(mag) : -100;
        magnitudes[k] = Math.max(-90, Math.min(0, db));
      }
      frames.push(magnitudes);
    }

    return {
      frames,
      sampleRate,
      duration,
      maxFreq: sampleRate / 2
    };
  }

  /**
   * Renders the STFT heatmap into an HTML5 Canvas
   * Utilizes offscreen canvas bitmap caching so playback playhead scrubbing takes < 0.3ms
   */
  public renderToCanvas(
    canvas: HTMLCanvasElement,
    frames: Float32Array[],
    playheadProgress: number = 0 // 0 to 1
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx || frames.length === 0) return;

    const width = canvas.width;
    const height = canvas.height;

    // Check if cached offscreen heatmap needs regeneration
    if (
      !this.cachedCanvas ||
      this.cachedFrames !== frames ||
      this.cachedCanvas.width !== width ||
      this.cachedCanvas.height !== height
    ) {
      if (!this.cachedCanvas) {
        this.cachedCanvas = document.createElement('canvas');
      }
      this.cachedCanvas.width = width;
      this.cachedCanvas.height = height;
      const offCtx = this.cachedCanvas.getContext('2d');

      if (offCtx) {
        offCtx.clearRect(0, 0, width, height);
        const numFrames = frames.length;
        const numBins = frames[0].length;
        const displayBins = Math.min(numBins, Math.floor(numBins * (8000 / 24000)));
        const colWidth = width / numFrames;

        for (let x = 0; x < numFrames; x++) {
          const frame = frames[x];
          for (let yBin = 0; yBin < displayBins; yBin++) {
            const db = frame[yBin];
            const norm = (db + 90) / 90;
            offCtx.fillStyle = this.getColorForIntensity(norm);
            const yPos = height - (yBin / displayBins) * height;
            const binHeight = height / displayBins + 1;
            offCtx.fillRect(x * colWidth, yPos - binHeight, colWidth + 1, binHeight);
          }
        }
      }
      this.cachedFrames = frames;
    }

    // Blit cached background heatmap in < 0.3ms
    ctx.clearRect(0, 0, width, height);
    if (this.cachedCanvas) {
      ctx.drawImage(this.cachedCanvas, 0, 0);
    }

    // Draw playhead needle with subtle glow
    if (playheadProgress > 0 && playheadProgress <= 1) {
      const playheadX = playheadProgress * width;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      // Playhead triangle bottom indicator
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(playheadX - 5, height);
      ctx.lineTo(playheadX + 5, height);
      ctx.lineTo(playheadX, height - 7);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  private getColorForIntensity(t: number): string {
    // Clamped 0..1
    const v = Math.max(0, Math.min(1, t));
    if (v < 0.2) {
      // Noise floor (deep charcoal / obsidian)
      const b = Math.floor(v * 5 * 60);
      return `rgb(15, 18, ${24 + b})`;
    } else if (v < 0.5) {
      // Quiet background to light speech (dark indigo to purple/blue)
      const p = (v - 0.2) / 0.3;
      return `rgb(${Math.floor(p * 80)}, ${Math.floor(p * 120)}, ${Math.floor(100 + p * 155)})`;
    } else if (v < 0.8) {
      // Speech formants (cyan to amber)
      const p = (v - 0.5) / 0.3;
      return `rgb(${Math.floor(80 + p * 175)}, ${Math.floor(180 - p * 40)}, ${Math.floor(255 - p * 200)})`;
    } else {
      // Strong vocal peaks (bright amber/white)
      const p = (v - 0.8) / 0.2;
      return `rgb(255, ${Math.floor(180 + p * 75)}, ${Math.floor(55 + p * 200)})`;
    }
  }

  private createHanningWindow(length: number): Float32Array {
    const win = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      win[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (length - 1)));
    }
    return win;
  }

  private fft(real: Float32Array, imag: Float32Array) {
    const n = real.length;
    let j = 0;
    for (let i = 0; i < n - 1; i++) {
      if (i < j) {
        const tempR = real[i]; real[i] = real[j]; real[j] = tempR;
        const tempI = imag[i]; imag[i] = imag[j]; imag[j] = tempI;
      }
      let k = n >> 1;
      while (k <= j) {
        j -= k;
        k >>= 1;
      }
      j += k;
    }

    for (let l = 2; l <= n; l <<= 1) {
      const half = l >> 1;
      const angle = (-2 * Math.PI) / l;
      const wStepR = Math.cos(angle);
      const wStepI = Math.sin(angle);

      for (let i = 0; i < n; i += l) {
        let wR = 1;
        let wI = 0;
        for (let k = 0; k < half; k++) {
          const pos = i + k;
          const match = pos + half;
          const uR = real[pos];
          const uI = imag[pos];
          const tR = wR * real[match] - wI * imag[match];
          const tI = wR * imag[match] + wI * real[match];

          real[pos] = uR + tR;
          imag[pos] = uI + tI;
          real[match] = uR - tR;
          imag[match] = uI - tI;

          const nextWR = wR * wStepR - wI * wStepI;
          wI = wR * wStepI + wI * wStepR;
          wR = nextWR;
        }
      }
    }
  }
}
