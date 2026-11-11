import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Sparkles, Volume2, RefreshCw } from 'lucide-react';
import { RecordingItem } from '../types';
import { SpectrogramAnalyzer } from '../audio/SpectrogramAnalyzer';

interface SpectrogramModalProps {
  recording: RecordingItem | null;
  onClose: () => void;
  t: Record<string, string>;
}

export const SpectrogramModal: React.FC<SpectrogramModalProps> = ({
  recording,
  onClose,
  t,
}) => {
  const [viewMode, setViewMode] = useState<'clean' | 'raw'>('clean');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playheadProgress, setPlayheadProgress] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cleanFramesRef = useRef<Float32Array[]>([]);
  const rawFramesRef = useRef<Float32Array[]>([]);
  const analyzerRef = useRef<SpectrogramAnalyzer>(new SpectrogramAnalyzer(512, 128));

  // Compute spectrogram frames for both clean and raw audio
  useEffect(() => {
    if (!recording) return;

    let isCancelled = false;
    setIsLoading(true);

    const computeBoth = async () => {
      try {
        const [cleanRes, rawRes] = await Promise.all([
          analyzerRef.current.computeSpectrogram(recording.cleanBlob),
          analyzerRef.current.computeSpectrogram(recording.rawBlob)
        ]);

        if (!isCancelled) {
          cleanFramesRef.current = cleanRes.frames;
          rawFramesRef.current = rawRes.frames;
          setIsLoading(false);
          renderCanvas();
        }
      } catch (err) {
        console.error('Failed to compute spectrogram:', err);
        if (!isCancelled) setIsLoading(false);
      }
    };

    computeBoth();

    return () => {
      isCancelled = true;
    };
  }, [recording]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const frames = viewMode === 'clean' ? cleanFramesRef.current : rawFramesRef.current;
    analyzerRef.current.renderToCanvas(canvas, frames, playheadProgress);
  };

  useEffect(() => {
    if (!isLoading) {
      renderCanvas();
    }
  }, [viewMode, playheadProgress, isLoading]);

  // Audio playback and playhead sync
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration > 0) {
        setPlayheadProgress(audio.currentTime / audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setPlayheadProgress(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, [recording]);

  if (!recording) return null;

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Audio element for playback */}
      <audio
        ref={audioRef}
        src={viewMode === 'clean' ? recording.cleanUrl : recording.rawUrl}
        preload="auto"
      />

      <div className="w-full max-w-lg rounded-3xl p-5 bg-dark-surface dark:bg-dark-surface light:bg-light-surface border border-dark-border text-white shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white flex items-center space-x-2">
              <span>{t.spectrogramView}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                FFT 512
              </span>
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">{t.spectrogramDesc}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Toggle Switch (Clean vs Original Spectrogram) */}
        <div className="flex items-center justify-center mb-4">
          <div className="relative p-1 rounded-full bg-black/60 border border-white/10 flex items-center w-full max-w-[280px]">
            <button
              onClick={() => setViewMode('clean')}
              className={`w-1/2 py-1.5 rounded-full text-xs font-semibold flex items-center justify-center space-x-1 transition-all ${
                viewMode === 'clean'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>{t.modeClean}</span>
            </button>

            <button
              onClick={() => setViewMode('raw')}
              className={`w-1/2 py-1.5 rounded-full text-xs font-semibold flex items-center justify-center space-x-1 transition-all ${
                viewMode === 'raw'
                  ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 text-gray-300" />
              <span>{t.modeRaw}</span>
            </button>
          </div>
        </div>

        {/* Spectrogram Canvas with Frequency Axis */}
        <div className="relative w-full rounded-2xl bg-black border border-white/10 overflow-hidden my-2">
          {isLoading ? (
            <div className="h-48 flex flex-col items-center justify-center space-y-2 text-cyan-400">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="text-xs font-medium">Computing Fourier Transform...</span>
            </div>
          ) : (
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={460}
                height={200}
                className="w-full h-48 block cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickPct = (e.clientX - rect.left) / rect.width;
                  if (audioRef.current && audioRef.current.duration) {
                    audioRef.current.currentTime = clickPct * audioRef.current.duration;
                    setPlayheadProgress(clickPct);
                  }
                }}
              />

              {/* Frequency Axis Overlays */}
              <div className="absolute left-2 top-2 text-[9px] font-mono text-cyan-400/80 bg-black/60 px-1 rounded pointer-events-none">
                8.0 kHz (Air / Hiss)
              </div>
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-cyan-400/80 bg-black/60 px-1 rounded pointer-events-none">
                3.5 kHz (Vocal Formants)
              </div>
              <div className="absolute left-2 bottom-2 text-[9px] font-mono text-cyan-400/80 bg-black/60 px-1 rounded pointer-events-none">
                100 Hz (Fan / AC Rumble)
              </div>
            </div>
          )}
        </div>

        {/* Comparison Callout */}
        <div className="mt-3 p-3 rounded-2xl bg-white/5 border border-white/5 text-[11px] text-gray-300 flex items-start space-x-2">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">Visual Verification: </span>
            {viewMode === 'raw'
              ? 'Notice the continuous solid low-frequency band at bottom (fan drone & room rumble) across the entire timeline.'
              : 'The continuous background drone has been eliminated, leaving only the vocal harmonics intact.'}
          </div>
        </div>

        {/* Bottom Playback Bar */}
        <div className="mt-4 flex items-center justify-between pt-2 border-t border-white/5">
          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="px-4 py-2 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center space-x-2 transition-all active:scale-95"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            <span>{isPlaying ? 'Pause' : 'Play & Track'}</span>
          </button>

          <span className="text-[11px] text-gray-400 font-mono">
            {recording.name}
          </span>
        </div>
      </div>
    </div>
  );
};
