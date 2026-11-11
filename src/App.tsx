import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { WaveformPill } from './components/WaveformPill';
import { HeroRecorder } from './components/HeroRecorder';
import { LevelMeter } from './components/LevelMeter';
import { PresetSelector } from './components/PresetSelector';
import { ProximityFencer } from './components/ProximityFencer';
import { CameraRecorder } from './components/CameraRecorder';
import { ABComparisonPlayer } from './components/ABComparisonPlayer';
import { RecordingsList } from './components/RecordingsList';
import { SettingsDrawer } from './components/SettingsDrawer';
import { LearnRoomModal } from './components/LearnRoomModal';
import { SpectrogramModal } from './components/SpectrogramModal';
import { DeepCleanModal } from './components/DeepCleanModal';
import { PermissionPrompt } from './components/PermissionPrompt';
import { BottomNav } from './components/BottomNav';

import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useIndexedDB } from './hooks/useIndexedDB';
import { useTranslation } from './hooks/useTranslation';
import { useTheme } from './hooks/useTheme';
import { AudioSettings, RecordingItem, VideoRecordingItem } from './types';
import { AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const { lang, toggleLanguage, t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { 
    saveRecording, 
    getRecordings, 
    deleteRecording, 
    renameRecording, 
    updateRecordingBlob,
    saveVideo,
    getVideos,
    deleteVideo,
    renameVideo
  } = useIndexedDB();

  // App settings state
  const [settings, setSettings] = useState<AudioSettings>({
    preset: 'balanced',
    proximityMode: 'ultra',
    proximityThresholdDb: -24,
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true,
    sampleRate: 48000,
    headphoneMonitoring: false,
    exportFormat: 'wav',
  });

  // UI state
  const [currentTab, setCurrentTab] = useState<'record' | 'camera' | 'library'>('record');
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [videos, setVideos] = useState<VideoRecordingItem[]>([]);
  const [activeRecording, setActiveRecording] = useState<RecordingItem | null>(null);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState<boolean>(false);
  const [spectrogramTarget, setSpectrogramTarget] = useState<RecordingItem | null>(null);
  const [deepCleanTarget, setDeepCleanTarget] = useState<RecordingItem | null>(null);

  // Load recordings & videos from IndexedDB on startup
  useEffect(() => {
    loadSavedRecordings();
    loadSavedVideos();
  }, []);

  const loadSavedRecordings = async () => {
    try {
      const items = await getRecordings();
      setRecordings(items);
      if (items.length > 0 && !activeRecording) {
        setActiveRecording(items[0]);
      }
    } catch (err) {
      console.error('Failed to load recordings from IndexedDB:', err);
    }
  };

  const loadSavedVideos = async () => {
    try {
      const vids = await getVideos();
      setVideos(vids);
    } catch (err) {
      console.error('Failed to load videos from IndexedDB:', err);
    }
  };

  const handleRecordingSaved = useCallback(async (item: RecordingItem) => {
    await saveRecording(item);
    await loadSavedRecordings();
    setActiveRecording(item);
  }, []);

  const handleVideoSaved = useCallback(async (item: VideoRecordingItem) => {
    await saveVideo(item);
    await loadSavedVideos();
  }, []);

  const handleDeleteVideo = async (id: string) => {
    await deleteVideo(id);
    await loadSavedVideos();
  };

  const handleRenameVideo = async (id: string, newName: string) => {
    await renameVideo(id, newName);
    await loadSavedVideos();
  };

  const {
    state: recorderState,
    elapsedTime,
    metrics,
    isCalibratingRoom,
    calibrationCountdown,
    roomCalibrated,
    permissionError,
    setPermissionError,
    interruptionMessage,
    setInterruptionMessage,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    learnRoom,
    changePreset,
    changeProximity,
    toggleMonitoring,
  } = useAudioRecorder(settings, handleRecordingSaved);

  const handlePresetChange = useCallback((preset: AudioSettings['preset']) => {
    setSettings((prev) => ({ ...prev, preset }));
    changePreset(preset);
  }, [changePreset]);

  const handleProximityModeChange = useCallback((mode: AudioSettings['proximityMode'], defDb?: number) => {
    setSettings((prev) => {
      const newDb = defDb ?? prev.proximityThresholdDb;
      changeProximity(mode, newDb);
      return { ...prev, proximityMode: mode, proximityThresholdDb: newDb };
    });
  }, [changeProximity]);

  const handleProximityThresholdChange = useCallback((thresholdDb: number) => {
    setSettings((prev) => {
      changeProximity(prev.proximityMode, thresholdDb);
      return { ...prev, proximityThresholdDb: thresholdDb };
    });
  }, [changeProximity]);

  const handleUpdateSettings = (partial: Partial<AudioSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
    if (typeof partial.headphoneMonitoring === 'boolean') {
      toggleMonitoring(partial.headphoneMonitoring);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteRecording(id);
    if (activeRecording?.id === id) {
      setActiveRecording(null);
    }
    await loadSavedRecordings();
  };

  const handleRename = async (id: string, newName: string) => {
    await renameRecording(id, newName);
    await loadSavedRecordings();
  };

  const handleDeepCleanSuccess = async (id: string, newBlob: Blob) => {
    await updateRecordingBlob(id, newBlob);
    await loadSavedRecordings();
  };

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 dark:bg-dark-bg dark:text-gray-100 light:bg-light-bg light:text-gray-900 flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      {/* Top Header */}
      <Header
        lang={lang}
        onToggleLang={toggleLanguage}
        theme={theme}
        onToggleTheme={toggleTheme}
        t={t}
      />

      {/* Interruption Alert Banner */}
      {interruptionMessage && (
        <div className="w-full max-w-md mx-auto px-4 my-1">
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{t.audioInterrupted}</span>
            </div>
            <button
              onClick={() => setInterruptionMessage(null)}
              className="text-amber-200 hover:text-white font-bold ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-md mx-auto pb-24 overflow-x-hidden">
        {currentTab === 'record' ? (
          <div className="animate-fadeIn">
            {/* Real-time Waveform Pill */}
            <WaveformPill
              state={recorderState}
              elapsedTime={elapsedTime}
              metrics={metrics}
              t={t}
            />

            {/* Glowing Center Hero Recorder Button */}
            <HeroRecorder
              state={recorderState}
              onStart={startRecording}
              onPause={pauseRecording}
              onResume={resumeRecording}
              onStop={stopRecording}
              onLearnRoom={() => setIsRoomModalOpen(true)}
              roomCalibrated={roomCalibrated}
              t={t}
            />

            {/* Live Input & Output Level Meter */}
            <LevelMeter metrics={metrics} t={t} />

            {/* Strength Preset Pill Selector */}
            <PresetSelector
              currentPreset={settings.preset}
              onChange={handlePresetChange}
              t={t}
            />

            {/* Proximity Focus (Block Distant Sounds) */}
            <ProximityFencer
              mode={settings.proximityMode}
              thresholdDb={settings.proximityThresholdDb}
              metrics={metrics}
              onChangeMode={handleProximityModeChange}
              onChangeThreshold={handleProximityThresholdChange}
              t={t}
            />

            {/* Active Recording A/B Comparison Player */}
            {activeRecording && (
              <div className="mt-4">
                <div className="px-5 mb-1 text-xs font-bold uppercase tracking-wider text-cyan-400">
                  {t.abTitle}
                </div>
                <ABComparisonPlayer
                  recording={activeRecording}
                  onOpenSpectrogram={(rec) => setSpectrogramTarget(rec)}
                  t={t}
                />
              </div>
            )}
          </div>
        ) : currentTab === 'camera' ? (
          <div className="animate-fadeIn">
            {/* QuietCam Video Recorder (30cm Focus) */}
            <CameraRecorder
              settings={settings}
              onVideoSaved={handleVideoSaved}
              t={t}
            />
          </div>
        ) : (
          <div className="animate-fadeIn">
            {/* Recordings & Videos List */}
            <RecordingsList
              recordings={recordings}
              videos={videos}
              selectedRecording={activeRecording}
              onSelect={(rec) => {
                setActiveRecording(rec);
                setCurrentTab('record');
              }}
              onRename={handleRename}
              onDelete={handleDelete}
              onRenameVideo={handleRenameVideo}
              onDeleteVideo={handleDeleteVideo}
              onDeepClean={(rec) => setDeepCleanTarget(rec)}
              onOpenSpectrogram={(rec) => setSpectrogramTarget(rec)}
              t={t}
            />
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation Bar (Image 6 reference) */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenRoomModal={() => setIsRoomModalOpen(true)}
        recordingsCount={recordings.length + videos.length}
      />

      {/* Modals & Drawers */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        t={t}
      />

      <LearnRoomModal
        isOpen={isRoomModalOpen}
        isCalibrating={isCalibratingRoom}
        countdown={calibrationCountdown}
        roomCalibrated={roomCalibrated}
        onClose={() => setIsRoomModalOpen(false)}
        onStartCalibration={learnRoom}
        t={t}
      />

      <SpectrogramModal
        recording={spectrogramTarget}
        onClose={() => setSpectrogramTarget(null)}
        t={t}
      />

      <DeepCleanModal
        recording={deepCleanTarget}
        onClose={() => setDeepCleanTarget(null)}
        onSuccess={handleDeepCleanSuccess}
        t={t}
      />

      <PermissionPrompt
        error={permissionError}
        onRetry={startRecording}
        t={t}
      />
    </div>
  );
};

export default App;
