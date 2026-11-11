import React from 'react';
import { Mic, Pause, Play, Square, Sparkles, SlidersHorizontal } from 'lucide-react';
import { RecordingState } from '../types';

interface HeroRecorderProps {
  state: RecordingState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onLearnRoom: () => void;
  roomCalibrated: boolean;
  t: Record<string, string>;
}

export const HeroRecorder: React.FC<HeroRecorderProps> = React.memo(({
  state,
  onStart,
  onPause,
  onResume,
  onStop,
  onLearnRoom,
  roomCalibrated,
  t,
}) => {
  const isRecording = state === 'recording';
  const isPaused = state === 'paused';
  const isProcessing = state === 'processing';

  const handleMainButtonPress = () => {
    if (state === 'idle') {
      onStart();
    } else if (isRecording) {
      onPause();
    } else if (isPaused) {
      onResume();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 flex flex-col items-center justify-center my-4">
      {/* Central Glowing Mic / Recording Button (modeled on reference image 5) */}
      <div className="relative flex items-center justify-center my-3">
        {/* Ambient Gradient Halo Rings */}
        {isRecording && (
          <>
            <div className="absolute w-52 h-52 rounded-full bg-gradient-to-tr from-cyan-500/20 via-purple-500/30 to-red-500/30 blur-2xl animate-rec-glow" />
            <div className="absolute w-44 h-44 rounded-full border border-red-500/40 animate-ping opacity-40 pointer-events-none" />
            <div className="absolute w-40 h-40 rounded-full border-2 border-dashed border-red-400/50 animate-halo-spin pointer-events-none" />
          </>
        )}

        {state === 'idle' && (
          <div className="absolute w-48 h-48 rounded-full bg-gradient-to-tr from-indigo-500/10 via-cyan-500/20 to-purple-500/20 blur-xl animate-pulse-glow" />
        )}

        {/* Tactile Outer Ring */}
        <div
          className={`relative p-2.5 rounded-full transition-all duration-300 ${
            isRecording
              ? 'bg-gradient-to-b from-red-500/30 to-red-950/40 shadow-glow-red'
              : 'bg-gradient-to-b from-cyan-500/20 to-indigo-950/30 shadow-glow-cyan'
          }`}
        >
          {/* Inner Tactile Button */}
          <button
            onClick={handleMainButtonPress}
            disabled={isProcessing}
            aria-label={isRecording ? t.pause : t.tapToRecord}
            className={`w-28 h-28 rounded-full flex flex-col items-center justify-center transition-transform active:scale-95 shadow-2xl relative overflow-hidden ${
              isRecording
                ? 'bg-gradient-to-b from-red-500 to-red-700 text-white'
                : isPaused
                ? 'bg-gradient-to-b from-amber-500 to-amber-600 text-white'
                : 'bg-gradient-to-b from-cyan-500 via-blue-600 to-indigo-700 text-white'
            }`}
          >
            {/* Glossy highlight */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/25 pointer-events-none rounded-full" />

            {/* Icon */}
            {isRecording ? (
              <Pause className="w-10 h-10 fill-white drop-shadow-md" />
            ) : isPaused ? (
              <Play className="w-10 h-10 fill-white ml-1 drop-shadow-md" />
            ) : (
              <Mic className="w-11 h-11 drop-shadow-md" />
            )}

            <span className="text-[11px] font-bold tracking-wider uppercase mt-1 drop-shadow">
              {isRecording
                ? t.pause
                : isPaused
                ? t.resume
                : t.tapToRecord.split(' ')[0]}
            </span>
          </button>
        </div>
      </div>

      {/* Secondary Controls Bar when recording / paused */}
      {(isRecording || isPaused) && (
        <div className="flex items-center space-x-4 mt-2 mb-2 animate-fadeIn">
          {/* Save / Stop Button */}
          <button
            onClick={onStop}
            className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide flex items-center space-x-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
            <span>{t.stopAndSave}</span>
          </button>
        </div>
      )}

      {/* "Learn My Room" Button (Tactile Pill modeled after image 7) */}
      <div className="mt-3">
        <button
          onClick={onLearnRoom}
          disabled={isRecording || isPaused || isProcessing}
          className={`px-4 py-2 rounded-full text-xs font-medium flex items-center space-x-2 transition-all border ${
            roomCalibrated
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-dark-pill/90 dark:bg-dark-pill/90 light:bg-light-pill text-cyan-300 border-cyan-500/30 hover:border-cyan-400/60 shadow-sm active:scale-95'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>{roomCalibrated ? t.learnRoomSuccess.split('!')[0] + ' ✓' : t.learnRoom}</span>
        </button>
      </div>
    </div>
  );
});
