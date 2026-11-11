import React from 'react';
import { Sparkles, Mic, CheckCircle2 } from 'lucide-react';

interface LearnRoomModalProps {
  isOpen: boolean;
  isCalibrating: boolean;
  countdown: number;
  roomCalibrated: boolean;
  onClose: () => void;
  onStartCalibration: () => void;
  t: Record<string, string>;
}

export const LearnRoomModal: React.FC<LearnRoomModalProps> = ({
  isOpen,
  isCalibrating,
  countdown,
  roomCalibrated,
  onClose,
  onStartCalibration,
  t,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm rounded-3xl p-6 bg-dark-card dark:bg-dark-card light:bg-light-card border border-dark-border text-center relative shadow-2xl">
        {/* Animated Icon / Progress Ring */}
        <div className="relative w-24 h-24 mx-auto my-3 flex items-center justify-center">
          {isCalibrating ? (
            <>
              <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin" />
              <div className="text-2xl font-bold font-mono text-cyan-400">
                {countdown}s
              </div>
            </>
          ) : roomCalibrated ? (
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-scaleUp">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Mic className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-white mb-1.5">
          {isCalibrating
            ? t.learnRoomCountdown
            : roomCalibrated
            ? t.learnRoomSuccess.split('!')[0] + '!'
            : t.learnRoomTitle}
        </h3>

        {/* Description */}
        <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-600 leading-relaxed mb-5">
          {isCalibrating
            ? t.calibrating
            : roomCalibrated
            ? t.learnRoomSuccess
            : t.learnRoomDesc}
        </p>

        {/* Action Button */}
        <div className="flex flex-col space-y-2">
          {!isCalibrating && !roomCalibrated && (
            <button
              onClick={onStartCalibration}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-xs tracking-wide shadow-lg shadow-cyan-500/25 active:scale-95 transition-all flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t.learnRoom}</span>
            </button>
          )}

          {roomCalibrated && !isCalibrating && (
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-semibold text-xs tracking-wide shadow-lg shadow-emerald-600/25 active:scale-95 transition-all"
            >
              Done
            </button>
          )}

          {!isCalibrating && (
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-medium transition-all"
            >
              {t.cancel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
