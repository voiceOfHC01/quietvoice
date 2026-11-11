import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Activity, Sparkles, Volume2 } from 'lucide-react';
import { RecordingItem } from '../types';
import { formatTime } from '../audio/AudioMetrics';

interface ABComparisonPlayerProps {
  recording: RecordingItem;
  onOpenSpectrogram: (recording: RecordingItem) => void;
  t: Record<string, string>;
}

export const ABComparisonPlayer: React.FC<ABComparisonPlayerProps> = ({
  recording,
  onOpenSpectrogram,
  t,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [mode, setMode] = useState<'clean' | 'raw'>('clean');

  const cleanAudioRef = useRef<HTMLAudioElement | null>(null);
  const rawAudioRef = useRef<HTMLAudioElement | null>(null);

  // Synchronize playback position and time tracking
  useEffect(() => {
    const cleanEl = cleanAudioRef.current;
    if (!cleanEl) return;

    const handleTimeUpdate = () => {
      setCurrentTime(cleanEl.currentTime);
      // Keep raw audio tightly locked to clean audio
      if (rawAudioRef.current && Math.abs(rawAudioRef.current.currentTime - cleanEl.currentTime) > 0.05) {
        rawAudioRef.current.currentTime = cleanEl.currentTime;
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (rawAudioRef.current) rawAudioRef.current.currentTime = 0;
    };

    cleanEl.addEventListener('timeupdate', handleTimeUpdate);
    cleanEl.addEventListener('ended', handleEnded);

    return () => {
      cleanEl.removeEventListener('timeupdate', handleTimeUpdate);
      cleanEl.removeEventListener('ended', handleEnded);
    };
  }, [recording]);

  // Handle Play/Pause
  const togglePlay = async () => {
    if (!cleanAudioRef.current || !rawAudioRef.current) return;

    if (isPlaying) {
      cleanAudioRef.current.pause();
      rawAudioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Ensure sync before playing
      rawAudioRef.current.currentTime = cleanAudioRef.current.currentTime;
      await Promise.all([
        cleanAudioRef.current.play(),
        rawAudioRef.current.play()
      ]);
      setIsPlaying(true);
    }
  };

  // Instant A/B Toggle: keeps position, switches muted property
  const toggleMode = (newMode: 'clean' | 'raw') => {
    setMode(newMode);
    if (cleanAudioRef.current && rawAudioRef.current) {
      // Sync positions exactly
      const tNow = cleanAudioRef.current.currentTime;
      rawAudioRef.current.currentTime = tNow;

      if (newMode === 'clean') {
        cleanAudioRef.current.muted = false;
        rawAudioRef.current.muted = true;
      } else {
        cleanAudioRef.current.muted = true;
        rawAudioRef.current.muted = false;
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newT = parseFloat(e.target.value);
    setCurrentTime(newT);
    if (cleanAudioRef.current) cleanAudioRef.current.currentTime = newT;
    if (rawAudioRef.current) rawAudioRef.current.currentTime = newT;
  };

  const duration = recording.duration || 1;
  const progressPct = (currentTime / duration) * 100;

  return (
    <div className="w-full max-w-md mx-auto px-4 my-2">
      {/* Hidden Synchronized HTML5 Audio Elements */}
      <audio
        ref={cleanAudioRef}
        src={recording.cleanUrl}
        preload="auto"
        muted={mode !== 'clean'}
      />
      <audio
        ref={rawAudioRef}
        src={recording.rawUrl}
        preload="auto"
        muted={mode !== 'raw'}
      />

      {/* Outer Player Card */}
      <div className="rounded-3xl p-4 bg-dark-card/90 dark:bg-dark-card/90 light:bg-light-card border border-dark-border dark:border-dark-border light:border-light-border shadow-tactile-dark backdrop-blur-xl">
        {/* Header: Title and Spectrogram button */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-bold text-white dark:text-white light:text-gray-900 truncate max-w-[200px]">
              {recording.name}
            </h3>
            <span className="text-[10px] text-cyan-400 font-mono">
              -{recording.measuredNoiseReductionDb.toFixed(1)} dB Noise Removed
            </span>
          </div>

          <button
            onClick={() => onOpenSpectrogram(recording)}
            className="px-2.5 py-1 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-medium flex items-center space-x-1 transition-all"
            title="Inspect FFT Spectrogram"
          >
            <Activity className="w-3 h-3" />
            <span>{t.spectrogramView.split(' ')[0]}</span>
          </button>
        </div>

        {/* The Seamless A/B Toggle Switch (Modeled after user image 7) */}
        <div className="flex items-center justify-center my-3">
          <div className="relative p-1 rounded-full bg-black/50 dark:bg-black/50 light:bg-gray-200 border border-white/10 flex items-center w-full max-w-[280px]">
            {/* Slider pill highlight */}
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-all duration-200 ease-out shadow-md ${
                mode === 'clean'
                  ? 'left-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                  : 'left-[calc(50%+2px)] bg-gradient-to-r from-gray-700 to-gray-800 text-gray-200'
              }`}
            />

            {/* Cleaned Button */}
            <button
              onClick={() => toggleMode('clean')}
              className={`relative z-10 w-1/2 py-1.5 text-xs font-semibold rounded-full flex items-center justify-center space-x-1 transition-colors ${
                mode === 'clean' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Sparkles className="w-3 h-3 text-cyan-300" />
              <span>{t.modeClean}</span>
            </button>

            {/* Raw Button */}
            <button
              onClick={() => toggleMode('raw')}
              className={`relative z-10 w-1/2 py-1.5 text-xs font-semibold rounded-full flex items-center justify-center space-x-1 transition-colors ${
                mode === 'raw' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Volume2 className="w-3 h-3 text-gray-300" />
              <span>{t.modeRaw}</span>
            </button>
          </div>
        </div>

        {/* Waveform Scrubber & Needle (Modeled after image 1 & 4) */}
        <div className="relative my-3 pt-1">
          {/* Visual Mini Waveform Bars */}
          <div className="h-10 w-full flex items-center justify-between gap-[2px] opacity-80 mb-1 px-1">
            {recording.waveform && recording.waveform.map((bar, i) => {
              const barProgress = (i / recording.waveform.length) * 100;
              const isPast = barProgress <= progressPct;
              return (
                <div
                  key={i}
                  className={`w-full rounded-full transition-all ${
                    isPast
                      ? mode === 'clean'
                        ? 'bg-cyan-400'
                        : 'bg-amber-400'
                      : 'bg-white/20'
                  }`}
                  style={{ height: `${Math.max(15, bar * 100)}%` }}
                />
              );
            })}
          </div>

          {/* Interactive Range Slider */}
          <input
            type="range"
            min={0}
            max={duration}
            step={0.01}
            value={currentTime}
            onChange={handleSeek}
            className="w-full accent-cyan-400 cursor-pointer h-1 bg-white/10 rounded-lg appearance-none"
          />

          {/* Time tracker */}
          <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center space-x-3 mt-2">
          <button
            onClick={() => {
              if (cleanAudioRef.current) cleanAudioRef.current.currentTime = 0;
              if (rawAudioRef.current) rawAudioRef.current.currentTime = 0;
              setCurrentTime(0);
            }}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            title="Restart"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
