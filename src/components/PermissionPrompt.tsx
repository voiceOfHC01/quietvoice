import React from 'react';
import { Mic, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

interface PermissionPromptProps {
  error: string | null;
  onRetry: () => void;
  t: Record<string, string>;
}

export const PermissionPrompt: React.FC<PermissionPromptProps> = ({
  error,
  onRetry,
  t,
}) => {
  if (!error) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm rounded-3xl p-6 bg-dark-card border border-red-500/30 text-center shadow-2xl">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <AlertCircle className="w-7 h-7" />
        </div>

        <h3 className="text-sm font-bold text-white mb-2">
          {t.micPermissionTitle}
        </h3>

        <p className="text-xs text-gray-300 leading-relaxed mb-4">
          {error.includes('denied') || error.includes('NotAllowed')
            ? t.permissionDenied
            : error}
        </p>

        {/* Step-by-step guidance */}
        <div className="text-left bg-black/40 p-3 rounded-xl border border-white/5 text-[11px] text-gray-300 space-y-1.5 mb-4">
          <div className="font-semibold text-white">How to allow microphone:</div>
          <div>1. Tap the lock/tune icon <span className="font-mono text-cyan-400">🔒</span> in the browser address bar.</div>
          <div>2. Toggle <span className="text-cyan-400 font-semibold">Microphone</span> to <span className="text-emerald-400 font-semibold">Allow</span>.</div>
          <div>3. Tap the button below to retry.</div>
        </div>

        <button
          onClick={onRetry}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-xs tracking-wide shadow-lg shadow-cyan-500/25 active:scale-95 transition-all flex items-center justify-center space-x-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{t.grantPermission}</span>
        </button>
      </div>
    </div>
  );
};
