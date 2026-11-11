import React from 'react';
import { Shield, ShieldAlert, Mic, UserCheck, Sliders, VolumeX } from 'lucide-react';
import { AudioMetrics, ProximityMode } from '../types';

interface ProximityFencerProps {
  mode: ProximityMode;
  thresholdDb: number;
  metrics: AudioMetrics;
  onChangeMode: (mode: ProximityMode, thresholdDb?: number) => void;
  onChangeThreshold: (thresholdDb: number) => void;
  t: Record<string, string>;
}

export const ProximityFencer: React.FC<ProximityFencerProps> = React.memo(({
  mode,
  thresholdDb,
  metrics,
  onChangeMode,
  onChangeThreshold,
  t,
}) => {
  const isGateOpen = Boolean(metrics.gateOpen);

  const modes: { id: ProximityMode; label: string; desc: string; defaultDb: number }[] = [
    {
      id: 'ultra',
      label: t.proximityUltra.split('(')[0].trim(),
      desc: t.proximityUltraDesc,
      defaultDb: -24
    },
    {
      id: 'normal',
      label: t.proximityNormal.split('(')[0].trim(),
      desc: t.proximityNormalDesc,
      defaultDb: -31
    },
    {
      id: 'off',
      label: t.proximityOff,
      desc: 'No distance filtering',
      defaultDb: -48
    }
  ];

  return (
    <div className="w-full max-w-md mx-auto px-4 my-2">
      <div className="rounded-3xl p-4 bg-dark-card/90 dark:bg-dark-card/90 light:bg-light-card border border-dark-border dark:border-dark-border light:border-light-border shadow-tactile-dark backdrop-blur-xl">
        {/* Header & Live Gate Shutter Status */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white dark:text-white light:text-gray-900">
              {t.proximityTitle}
            </h3>
          </div>

          {/* Real-time Distance Gate Shutter Status Indicator */}
          <div
            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold flex items-center space-x-1.5 transition-all duration-150 ${
              isGateOpen
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
            }`}
          >
            {isGateOpen ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{t.gateOpenStatus}</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3 h-3 text-amber-400" />
                <span>{t.gateClosedStatus}</span>
              </>
            )}
          </div>
        </div>

        {/* Short explanation */}
        <p className="text-[11px] text-gray-300 dark:text-gray-300 light:text-gray-600 leading-relaxed mb-3">
          {t.proximitySub}
        </p>

        {/* 3 Distance Mode Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-black/40 dark:bg-black/40 light:bg-gray-100 border border-white/5 mb-3">
          {modes.map((m) => {
            const isActive = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onChangeMode(m.id, m.defaultDb)}
                className={`py-2 px-1 rounded-xl text-xs font-medium transition-all flex flex-col items-center justify-center relative ${
                  isActive
                    ? 'bg-gradient-to-b from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25 scale-[1.02]'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span className="text-[11px] font-semibold">{m.label}</span>
                <span className={`text-[9px] font-mono ${isActive ? 'text-cyan-100' : 'text-gray-500'}`}>
                  {m.id === 'ultra' ? '5–15 cm' : m.id === 'normal' ? '15–30 cm' : 'All'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sensitivity Fine-Tuning Slider (when not off) */}
        {mode !== 'off' && (
          <div className="pt-2 border-t border-white/5">
            <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
              <span className="flex items-center space-x-1">
                <Sliders className="w-3 h-3 text-cyan-400" />
                <span>{t.distanceThreshold}</span>
              </span>
              <span className="font-mono text-cyan-300 font-semibold">{thresholdDb} dBFS</span>
            </div>

            <input
              type="range"
              min={-40}
              max={-16}
              step={1}
              value={thresholdDb}
              onChange={(e) => onChangeThreshold(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[9px] text-gray-500 font-mono mt-0.5">
              <span>Farther (-40dB)</span>
              <span>Ultra-Close Only (-16dB)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}, (prev, next) => {
  return (
    prev.mode === next.mode &&
    prev.thresholdDb === next.thresholdDb &&
    prev.metrics.gateOpen === next.metrics.gateOpen &&
    prev.t === next.t
  );
});
