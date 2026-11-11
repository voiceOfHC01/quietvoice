import React from 'react';
import { ShieldCheck, Moon, Sun, Languages } from 'lucide-react';
import { Language, Theme } from '../types';

interface HeaderProps {
  lang: Language;
  onToggleLang: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  t: Record<string, string>;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onToggleLang,
  theme,
  onToggleTheme,
  t,
}) => {
  return (
    <header className="w-full max-w-md mx-auto pt-3 px-4 pb-2 flex items-center justify-between z-20">
      {/* Brand logo & status */}
      <div className="flex items-center space-x-2.5">
        <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <div className="w-4 h-4 rounded-full bg-white/90 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-cyan-600 animate-ping" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <h1 className="text-base font-bold tracking-tight text-white dark:text-white">
              {lang === 'bn' ? 'QuietVoice' : 'QuietVoice'}
            </h1>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              DSP
            </span>
          </div>
          <div className="flex items-center space-x-1 text-[11px] text-emerald-400 font-medium">
            <ShieldCheck className="w-3 h-3" />
            <span>{t.privacyBadge}</span>
          </div>
        </div>
      </div>

      {/* Action buttons (Language & Theme) */}
      <div className="flex items-center space-x-2">
        {/* Language switch */}
        <button
          onClick={onToggleLang}
          className="h-8 px-2.5 rounded-full text-xs font-medium flex items-center space-x-1 transition-all bg-dark-pill/80 dark:bg-dark-pill/80 light:bg-light-pill border border-dark-border text-gray-200 hover:text-white hover:border-cyan-500/50"
          title="Toggle Language"
        >
          <Languages className="w-3.5 h-3.5 text-cyan-400" />
          <span className="uppercase text-[11px] font-semibold tracking-wider">
            {lang === 'en' ? 'বাংলা' : 'EN'}
          </span>
        </button>

        {/* Theme switch */}
        <button
          onClick={onToggleTheme}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-dark-pill/80 dark:bg-dark-pill/80 light:bg-light-pill border border-dark-border text-gray-300 hover:text-cyan-400"
          title="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-400" />
          )}
        </button>
      </div>
    </header>
  );
};
