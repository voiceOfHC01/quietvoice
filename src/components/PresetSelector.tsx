import React from 'react';
import { Sliders, AlertTriangle } from 'lucide-react';
import { PresetType } from '../types';

interface PresetSelectorProps {
  currentPreset: PresetType;
  onChange: (preset: PresetType) => void;
  t: Record<string, string>;
}

export const PresetSelector: React.FC<PresetSelectorProps> = React.memo(({
  currentPreset,
  onChange,
  t,
}) => {
  const presets: { id: PresetType; label: string; reduction: string }[] = [
    { id: 'light', label: t.presetLight, reduction: '-8 dB' },
    { id: 'balanced', label: t.presetBalanced.split(' ')[0], reduction: '-16 dB' },
    { id: 'aggressive', label: t.presetAggressive, reduction: '-24 dB' },
  ];

  const getDesc = () => {
    switch (currentPreset) {
      case 'light':
        return t.presetLightDesc;
      case 'balanced':
        return t.presetBalancedDesc;
      case 'aggressive':
        return t.presetAggressiveDesc;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 my-2">
      <div className="rounded-3xl p-3.5 bg-dark-card/75 dark:bg-dark-card/75 light:bg-light-card border border-dark-border dark:border-dark-border light:border-light-border backdrop-blur-md">
        {/* Title */}
        <div className="flex items-center justify-between text-xs font-semibold text-gray-300 dark:text-gray-300 light:text-gray-700 mb-2.5">
          <div className="flex items-center space-x-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.presetTitle}</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {currentPreset.toUpperCase()}
          </span>
        </div>

        {/* 3 Pills Tab Selector (modeled after user reference 3 & 7) */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-black/40 dark:bg-black/40 light:bg-gray-100 border border-white/5">
          {presets.map((p) => {
            const isActive = currentPreset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onChange(p.id)}
                className={`py-2 px-1 rounded-xl text-xs font-medium transition-all flex flex-col items-center justify-center relative ${
                  isActive
                    ? 'bg-gradient-to-b from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25 scale-[1.02]'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span className="text-[11px] font-semibold">{p.label}</span>
                <span className={`text-[9px] font-mono ${isActive ? 'text-cyan-100' : 'text-gray-500'}`}>
                  {p.reduction}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Tradeoff Explanation */}
        <div className="mt-2.5 px-1 text-[11px] text-gray-300 dark:text-gray-300 light:text-gray-600 leading-relaxed">
          <p>{getDesc()}</p>
        </div>

        {/* Tradeoff Warning for Aggressive */}
        {currentPreset === 'aggressive' && (
          <div className="mt-2 flex items-start space-x-1.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px]">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
            <span>{t.tradeoffNotice}</span>
          </div>
        )}
      </div>
    </div>
  );
});
