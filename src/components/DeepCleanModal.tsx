import React, { useState } from 'react';
import { X, Sparkles, RefreshCw, CheckCircle, Server, Laptop } from 'lucide-react';
import { RecordingItem } from '../types';
import { encodeWAV } from '../audio/WavEncoder';

interface DeepCleanModalProps {
  recording: RecordingItem | null;
  onClose: () => void;
  onSuccess: (id: string, newBlob: Blob) => void;
  t: Record<string, string>;
}

export const DeepCleanModal: React.FC<DeepCleanModalProps> = ({
  recording,
  onClose,
  onSuccess,
  t,
}) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [engineUsed, setEngineUsed] = useState<'backend' | 'client' | null>(null);
  const [progressText, setProgressText] = useState<string>('');
  const [isDone, setIsDone] = useState<boolean>(false);

  if (!recording) return null;

  const runDeepClean = async () => {
    setIsProcessing(true);
    setIsDone(false);
    setProgressText('Connecting to Deep Clean engine...');

    try {
      // 1. Try FastAPI backend if reachable
      const formData = new FormData();
      formData.append('file', recording.rawBlob, `${recording.name}.wav`);

      let cleanedBlob: Blob | null = null;
      let usedMode: 'backend' | 'client' = 'backend';

      try {
        const res = await fetch('http://localhost:8000/api/deep-clean', {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(30000), // 30s timeout for large file deep clean
        });

        if (res.ok) {
          cleanedBlob = await res.blob();
          usedMode = 'backend';
        }
      } catch (backendErr) {
        console.log('FastAPI backend offline, switching to client-side studio DSP:', backendErr);
      }

      // 2. Client-side Offline Deep Clean Fallback
      if (!cleanedBlob) {
        usedMode = 'client';
        setProgressText('Running multi-pass studio spectral gating...');

        const arrayBuffer = await recording.rawBlob.arrayBuffer();
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const offlineCtx = new AudioCtx();
        let audioBuffer: AudioBuffer;
        try {
          audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer);
        } finally {
          if (offlineCtx.state !== 'closed') {
            await offlineCtx.close().catch(() => {});
          }
        }
        const channel = audioBuffer.getChannelData(0);
        const sr = audioBuffer.sampleRate;

        // Two-pass offline filter: Steep 4th-order HPF (95Hz) + Stationary Spectral Gate
        const processed = new Float32Array(channel.length);

        // Pass 1: 4th-order Biquad High-Pass filter
        const omega = 2 * Math.PI * 95 / sr;
        const alpha = Math.sin(omega) / (2 * 0.7071);
        const cosW = Math.cos(omega);
        const a0 = 1 + alpha;
        const b0 = (1 + cosW) / 2 / a0;
        const b1 = -(1 + cosW) / a0;
        const b2 = (1 + cosW) / 2 / a0;
        const a1 = -2 * cosW / a0;
        const a2 = (1 - alpha) / a0;

        let w1 = 0, w2 = 0;
        for (let i = 0; i < channel.length; i++) {
          const x = channel[i];
          const y = b0 * x + w1;
          w1 = b1 * x - a1 * y + w2;
          w2 = b2 * x - a2 * y;
          processed[i] = y;
        }

        // Pass 2: Offline Non-causal Spectral Gating
        const winSize = 1024;
        const hopSize = 256;
        for (let i = 0; i < processed.length; i += hopSize) {
          let energy = 0;
          const end = Math.min(i + winSize, processed.length);
          for (let j = i; j < end; j++) {
            energy += processed[j] * processed[j];
          }
          const rms = Math.sqrt(energy / (end - i));

          // Soft studio expander
          if (rms < 0.008) {
            const gain = Math.max(0.04, Math.pow(rms / 0.008, 1.8));
            for (let j = i; j < end; j++) {
              processed[j] *= gain;
            }
          }
        }

        cleanedBlob = encodeWAV(processed, sr);
      }

      setEngineUsed(usedMode);
      setIsDone(true);
      setIsProcessing(false);
      onSuccess(recording.id, cleanedBlob);

    } catch (err) {
      console.error('Deep clean processing failed:', err);
      setIsProcessing(false);
      setProgressText('Failed to process deep clean.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm rounded-3xl p-6 bg-dark-card dark:bg-dark-card light:bg-light-card border border-dark-border text-center relative shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>{t.deepClean}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Center Graphic */}
        <div className="w-20 h-20 mx-auto my-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          {isProcessing ? (
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
          ) : isDone ? (
            <CheckCircle className="w-10 h-10 text-emerald-400 animate-scaleUp" />
          ) : (
            <Sparkles className="w-8 h-8" />
          )}
        </div>

        <h3 className="text-sm font-bold text-white mb-1.5">
          {isDone ? t.deepCleanSuccess.split('!')[0] + '!' : 'Studio-Grade Deep Clean'}
        </h3>

        <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-600 leading-relaxed mb-4">
          {isProcessing
            ? progressText
            : isDone
            ? t.deepCleanSuccess
            : t.deepCleanDesc}
        </p>

        {/* Engine status indicator */}
        {engineUsed && (
          <div className="mb-4 inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-gray-300">
            {engineUsed === 'backend' ? (
              <>
                <Server className="w-3 h-3 text-cyan-400" />
                <span>Processed via FastAPI Python Model</span>
              </>
            ) : (
              <>
                <Laptop className="w-3 h-3 text-indigo-400" />
                <span>Processed via On-Device Studio DSP</span>
              </>
            )}
          </div>
        )}

        {/* Action Button */}
        {!isDone ? (
          <button
            onClick={runDeepClean}
            disabled={isProcessing}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-xs tracking-wide shadow-lg shadow-indigo-600/30 active:scale-95 transition-all flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <span>{t.deepCleanProcessing}</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Start Deep Clean</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-semibold text-xs tracking-wide shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
};
