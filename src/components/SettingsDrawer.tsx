import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Headphones, 
  AlertTriangle, 
  Mic2, 
  Sliders, 
  Info, 
  SlidersHorizontal,
  HelpCircle,
  HardDrive
} from 'lucide-react';
import { AudioSettings, PresetType } from '../types';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AudioSettings;
  onUpdateSettings: (newSettings: Partial<AudioSettings>) => void;
  t: Record<string, string>;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  t,
}) => {
  const [showHeadphoneWarning, setShowHeadphoneWarning] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleMonitoringToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    if (checked) {
      setShowHeadphoneWarning(true);
    } else {
      onUpdateSettings({ headphoneMonitoring: false });
    }
  };

  const confirmMonitoring = () => {
    setShowHeadphoneWarning(false);
    onUpdateSettings({ headphoneMonitoring: true });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fadeIn">
      {/* Headphone Acoustic Feedback Warning Modal */}
      {showHeadphoneWarning && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-xs rounded-3xl p-5 bg-dark-card border border-amber-500/30 text-center shadow-2xl">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Headphones className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              {t.monitoringWarningTitle}
            </h4>
            <p className="text-xs text-gray-300 leading-relaxed mb-4">
              {t.monitoringWarningDesc}
            </p>
            <div className="flex flex-col space-y-2">
              <button
                onClick={confirmMonitoring}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-xs"
              >
                {t.iHaveHeadphones}
              </button>
              <button
                onClick={() => setShowHeadphoneWarning(false)}
                className="w-full py-2 rounded-xl bg-white/5 text-gray-400 hover:text-white text-xs"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer Container */}
      <div className="w-full max-w-sm h-full bg-dark-surface dark:bg-dark-surface light:bg-light-surface border-l border-dark-border p-5 overflow-y-auto text-white flex flex-col justify-between shadow-2xl animate-slideLeft">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold tracking-tight text-white dark:text-white light:text-gray-900">
                {t.settings}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Section 1: Browser Hardware Microphone Constraints */}
          <div className="mb-5">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-gray-300 mb-2">
              <Mic2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.micConstraints}</span>
            </div>
            <p className="text-[10px] text-gray-400 mb-2.5">
              Browser hardware filters. If audio sounds muffled or clipped on your phone, try disabling them.
            </p>

            <div className="space-y-2 bg-black/40 p-3 rounded-2xl border border-white/5 text-xs">
              {/* Noise suppression */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[11px] text-gray-300">{t.builtInSuppression}</span>
                <input
                  type="checkbox"
                  checked={settings.noiseSuppression}
                  onChange={(e) => onUpdateSettings({ noiseSuppression: e.target.checked })}
                  className="w-4 h-4 rounded accent-cyan-500"
                />
              </label>

              {/* Echo cancellation */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[11px] text-gray-300">{t.builtInEcho}</span>
                <input
                  type="checkbox"
                  checked={settings.echoCancellation}
                  onChange={(e) => onUpdateSettings({ echoCancellation: e.target.checked })}
                  className="w-4 h-4 rounded accent-cyan-500"
                />
              </label>

              {/* Auto gain control */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[11px] text-gray-300">{t.builtInAgc}</span>
                <input
                  type="checkbox"
                  checked={settings.autoGainControl}
                  onChange={(e) => onUpdateSettings({ autoGainControl: e.target.checked })}
                  className="w-4 h-4 rounded accent-cyan-500"
                />
              </label>
            </div>
          </div>

          {/* Section 2: Headphone Live Monitoring */}
          <div className="mb-5">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/5">
              <div className="flex items-center space-x-2">
                <Headphones className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-xs font-semibold text-gray-200">{t.monitoring}</div>
                  <div className="text-[10px] text-gray-400">Listen to processed audio live</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.headphoneMonitoring}
                onChange={handleMonitoringToggle}
                className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Section 3: Audio Sample Rate */}
          <div className="mb-5">
            <label className="text-xs font-semibold text-gray-300 block mb-1.5">
              {t.sampleRate}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[16000, 44100, 48000].map((sr) => (
                <button
                  key={sr}
                  onClick={() => onUpdateSettings({ sampleRate: sr })}
                  className={`py-1.5 rounded-xl text-[11px] font-mono font-medium border transition-all ${
                    settings.sampleRate === sr
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
                      : 'bg-black/30 text-gray-400 border-white/5 hover:text-white'
                  }`}
                >
                  {sr === 16000 ? '16 kHz' : sr === 44100 ? '44.1 kHz' : '48 kHz'}
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Export Format */}
          <div className="mb-5">
            <label className="text-xs font-semibold text-gray-300 block mb-1.5">
              {t.exportFormat}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['wav', 'mp3', 'webm'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => onUpdateSettings({ exportFormat: fmt })}
                  className={`py-1.5 rounded-xl text-[11px] font-mono font-medium uppercase border transition-all ${
                    settings.exportFormat === fmt
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
                      : 'bg-black/30 text-gray-400 border-white/5 hover:text-white'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Quality & Honesty Expectations Card */}
          <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 text-[11px] space-y-1.5">
            <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold">
              <Info className="w-3.5 h-3.5" />
              <span>{t.honestyTitle}</span>
            </div>
            <p className="text-gray-300 leading-relaxed">• {t.honestySteady}</p>
            <p className="text-gray-300 leading-relaxed">• {t.honestyTransient}</p>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-white/10 text-center text-[10px] text-gray-500">
          <span>QuietVoice v1.0 • WebAudio DSP + RNNoise WASM</span>
        </div>
      </div>
    </div>
  );
};
