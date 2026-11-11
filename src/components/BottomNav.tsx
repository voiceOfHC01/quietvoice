import React from 'react';
import { Mic, Video, Library, Settings, Sparkles } from 'lucide-react';

interface BottomNavProps {
  currentTab: 'record' | 'camera' | 'library';
  onTabChange: (tab: 'record' | 'camera' | 'library') => void;
  onOpenSettings: () => void;
  onOpenRoomModal: () => void;
  recordingsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  onOpenSettings,
  onOpenRoomModal,
  recordingsCount,
}) => {
  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
      {/* Floating Frosted Glass Pill (modeled on user uploaded image 6) */}
      <div className="pointer-events-auto h-14 px-4 rounded-full bg-dark-pill/85 dark:bg-dark-pill/85 light:bg-light-pill/90 border border-white/10 dark:border-white/10 light:border-black/10 backdrop-blur-xl shadow-2xl flex items-center space-x-4">
        {/* Audio Record tab */}
        <button
          onClick={() => onTabChange('record')}
          className={`relative p-2.5 rounded-full transition-all flex items-center justify-center ${
            currentTab === 'record'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30 scale-105'
              : 'text-gray-400 hover:text-white'
          }`}
          title="Voice Record"
        >
          <Mic className="w-5 h-5" />
        </button>

        {/* QuietCam Video Tab (placed directly next to recording option) */}
        <button
          onClick={() => onTabChange('camera')}
          className={`relative p-2.5 rounded-full transition-all flex items-center justify-center ${
            currentTab === 'camera'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30 scale-105'
              : 'text-gray-400 hover:text-white'
          }`}
          title="QuietCam Video (30cm Focus)"
        >
          <Video className="w-5 h-5" />
        </button>

        {/* Library tab */}
        <button
          onClick={() => onTabChange('library')}
          className={`relative p-2.5 rounded-full transition-all flex items-center justify-center ${
            currentTab === 'library'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30 scale-105'
              : 'text-gray-400 hover:text-white'
          }`}
          title="Recordings"
        >
          <Library className="w-5 h-5" />
          {recordingsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-black text-[9px] font-bold flex items-center justify-center">
              {recordingsCount}
            </span>
          )}
        </button>

        {/* Room Calibration quick button */}
        <button
          onClick={onOpenRoomModal}
          className="p-2.5 rounded-full text-cyan-400 hover:bg-cyan-500/10 transition-all"
          title="Calibrate Room"
        >
          <Sparkles className="w-5 h-5" />
        </button>

        {/* Settings modal button */}
        <button
          onClick={onOpenSettings}
          className="p-2.5 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
