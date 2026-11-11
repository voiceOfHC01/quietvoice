import React from 'react';
import { AudioMetrics } from '../types';

interface LevelMeterProps {
  metrics: AudioMetrics;
  t: Record<string, string>;
}

export const LevelMeter: React.FC<LevelMeterProps> = React.memo(({ metrics, t }) => {
  // Map dB (-60 to 0) to percentage (0 to 100%)
  const rawPct = Math.max(0, Math.min(100, ((metrics.rawDb + 60) / 60) * 100));
  const cleanPct = Math.max(0, Math.min(100, ((metrics.cleanDb + 60) / 60) * 100));

  return (
    <div className="w-full max-w-md mx-auto px-4 my-2">
      <div className="rounded-2xl p-3 bg-dark-card/60 dark:bg-dark-card/60 light:bg-light-card border border-dark-border text-xs">
        {/* Raw Meter */}
        <div className="mb-2">
          <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1">
            <span>{t.rawInput}</span>
            <span className="font-mono">{metrics.rawDb > -90 ? `${metrics.rawDb.toFixed(1)} dB` : '-∞'}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-gray-500 via-amber-500 to-red-500 transition-all duration-75 rounded-full"
              style={{ width: `${rawPct}%` }}
            />
          </div>
        </div>

        {/* Cleaned Meter */}
        <div>
          <div className="flex justify-between items-center text-[10px] text-cyan-400 mb-1 font-medium">
            <span>{t.cleanedOutput}</span>
            <span className="font-mono">{metrics.cleanDb > -90 ? `${metrics.cleanDb.toFixed(1)} dB` : '-∞'}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-indigo-500 transition-all duration-75 rounded-full shadow-glow-cyan"
              style={{ width: `${cleanPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
