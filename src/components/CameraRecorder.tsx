import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Video, 
  RotateCcw, 
  Square, 
  Shield, 
  VolumeX, 
  Sliders, 
  Sparkles, 
  CheckCircle, 
  SwitchCamera,
  Play
} from 'lucide-react';
import { AudioMetrics, AudioSettings, VideoRecordingItem } from '../types';
import { VideoRecorderEngine } from '../audio/VideoRecorderEngine';
import { formatTime } from '../audio/AudioMetrics';

interface CameraRecorderProps {
  settings: AudioSettings;
  onVideoSaved: (item: VideoRecordingItem) => void;
  t: Record<string, string>;
}

export const CameraRecorder: React.FC<CameraRecorderProps> = ({
  settings,
  onVideoSaved,
  t,
}) => {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [distancePreset, setDistancePreset] = useState<'20cm' | '30cm' | '50cm'>('30cm');
  const [thresholdDb, setThresholdDb] = useState<number>(-29); // Calibrated default for 30 cm
  const [metrics, setMetrics] = useState<AudioMetrics>({
    rawDb: -100,
    cleanDb: -100,
    rawPeakDb: -100,
    cleanPeakDb: -100,
    noiseReductionDb: 0,
    isVoiced: false,
    gateOpen: false,
    latencyMs: 8.5
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const engineRef = useRef<VideoRecorderEngine | null>(null);
  const timerRef = useRef<number | null>(null);

  // Initialize or start camera
  const handleStartCamera = async () => {
    setCameraError(null);
    if (!videoElementRef.current) return;

    try {
      if (!engineRef.current) {
        engineRef.current = new VideoRecorderEngine(settings, {
          onMetrics: (m) => setMetrics(m),
          onInterrupted: () => {},
          onError: (err) => setCameraError(err.message)
        });
      }

      await engineRef.current.startCamera(videoElementRef.current);
      setIsCameraActive(true);
    } catch (err: unknown) {
      const e = err as Error;
      setCameraError(e.message || 'Could not access camera/mic');
      setIsCameraActive(false);
    }
  };

  const handleFlipCamera = async () => {
    if (engineRef.current && videoElementRef.current) {
      await engineRef.current.flipCamera(videoElementRef.current);
    }
  };

  const handleDistanceChange = (preset: '20cm' | '30cm' | '50cm') => {
    setDistancePreset(preset);
    let db = -29;
    if (preset === '20cm') db = -25;
    if (preset === '30cm') db = -29;
    if (preset === '50cm') db = -34;
    setThresholdDb(db);
    if (engineRef.current) {
      engineRef.current.setDistanceThreshold(db);
    }
  };

  const handleThresholdSlider = (val: number) => {
    setThresholdDb(val);
    if (engineRef.current) {
      engineRef.current.setDistanceThreshold(val);
    }
  };

  // Start / Stop Video Recording
  const handleStartRecording = async () => {
    if (!engineRef.current) return;
    try {
      await engineRef.current.startRecording();
      setIsRecording(true);
      setElapsedTime(0);

      timerRef.current = window.setInterval(() => {
        setElapsedTime((prev) => prev + 0.5);
      }, 500);
    } catch (err) {
      console.error('Failed to start video record:', err);
    }
  };

  const handleStopRecording = async () => {
    if (!engineRef.current) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      const videoItem = await engineRef.current.stopRecording();
      setIsRecording(false);
      setToastMessage(t.videoSaved);
      onVideoSaved(videoItem);

      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error('Failed to stop video recording:', err);
      setIsRecording(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (engineRef.current) {
        engineRef.current.stopCamera();
      }
    };
  }, []);

  const isGateOpen = Boolean(metrics.gateOpen);
  const cleanPct = Math.max(0, Math.min(100, ((metrics.cleanDb + 60) / 60) * 100));

  return (
    <div className="w-full max-w-md mx-auto px-4 my-2 animate-fadeIn">
      {/* Toast notification */}
      {toastMessage && (
        <div className="mb-2 p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Camera Viewfinder Card */}
      <div className="relative rounded-3xl overflow-hidden bg-black border border-dark-border shadow-2xl aspect-[4/5] flex flex-col justify-between p-3.5">
        {/* Hidden / Active Video Viewfinder */}
        <video
          ref={videoElementRef}
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isCameraActive ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Placeholder if camera not yet started */}
        {!isCameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-dark-surface/90">
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-glow-cyan">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">{t.videoCamTitle}</h3>
            <p className="text-xs text-gray-400 max-w-[260px] leading-relaxed mb-5">
              {t.videoPresenterSub}
            </p>

            {cameraError && (
              <div className="mb-3 text-[11px] text-red-400 max-w-[240px]">
                {cameraError}
              </div>
            )}

            <button
              onClick={handleStartCamera}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-xs tracking-wide shadow-lg shadow-cyan-500/25 active:scale-95 transition-all flex items-center space-x-2"
            >
              <Video className="w-4 h-4" />
              <span>{t.startVideo}</span>
            </button>
          </div>
        )}

        {/* Viewfinder Top HUD Bar (when camera is on) */}
        {isCameraActive && (
          <div className="relative z-20 flex items-center justify-between text-xs">
            {/* Recording badge / timer */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white font-mono">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isRecording ? 'bg-red-500 animate-ping' : 'bg-gray-400'
                }`}
              />
              <span className="font-bold">
                {isRecording ? `REC ${formatTime(elapsedTime)}` : 'READY 30cm'}
              </span>
            </div>

            {/* Flip Camera Button */}
            <button
              onClick={handleFlipCamera}
              className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white hover:text-cyan-400 active:scale-90 transition-all"
              title={t.flipCamera}
            >
              <SwitchCamera className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Viewfinder Center Distance Status Overlay */}
        {isCameraActive && (
          <div className="relative z-20 flex justify-center my-auto pointer-events-none">
            <div
              className={`px-3.5 py-1.5 rounded-full text-[11px] font-mono font-semibold flex items-center space-x-1.5 backdrop-blur-md transition-all duration-150 border ${
                isGateOpen
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-glow-cyan'
                  : 'bg-black/75 text-amber-300 border-amber-500/40'
              }`}
            >
              {isGateOpen ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{t.videoPresenterVoice}</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.videoNoiseBlocked}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Viewfinder Bottom HUD Bar */}
        {isCameraActive && (
          <div className="relative z-20 space-y-3">
            {/* Live Audio Level Strip */}
            <div className="p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
              <div className="flex justify-between items-center text-[10px] text-gray-300 mb-1 font-mono">
                <span>Presenter Voice Level</span>
                <span className="text-cyan-400 font-semibold">{metrics.cleanDb.toFixed(1)} dB</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-75 rounded-full"
                  style={{ width: `${cleanPct}%` }}
                />
              </div>
            </div>

            {/* Shutter Button Bar */}
            <div className="flex items-center justify-center space-x-6 pb-2">
              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center shadow-2xl active:scale-95 transition-all group"
                  title={t.recordVideo}
                >
                  <div className="w-12 h-12 rounded-full bg-red-600 group-hover:bg-red-500 transition-colors" />
                </button>
              ) : (
                <button
                  onClick={handleStopRecording}
                  className="w-16 h-16 rounded-full border-4 border-red-500 flex items-center justify-center shadow-2xl active:scale-95 transition-all"
                  title={t.stopVideo}
                >
                  <Square className="w-6 h-6 fill-red-500 text-red-500" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 30cm Camera Focus Controls Card */}
      <div className="rounded-3xl p-4 bg-dark-card/90 dark:bg-dark-card/90 light:bg-light-card border border-dark-border dark:border-dark-border light:border-light-border shadow-tactile-dark backdrop-blur-xl mt-3">
        <div className="flex items-center space-x-2 mb-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white dark:text-white light:text-gray-900">
            {t.videoPresenterFocus}
          </h3>
        </div>

        <p className="text-[11px] text-gray-300 dark:text-gray-300 light:text-gray-600 leading-relaxed mb-3">
          {t.videoPresenterSub}
        </p>

        {/* 3 Distance Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-black/40 dark:bg-black/40 light:bg-gray-100 border border-white/5 mb-3">
          {[
            { id: '20cm', label: '20 cm (Close)', desc: 'Close Selfie', db: -25 },
            { id: '30cm', label: '30 cm (Ideal)', desc: 'Desk / Vlogger', db: -29 },
            { id: '50cm', label: '50 cm (Arm)', desc: 'Arm Length', db: -34 },
          ].map((item) => {
            const isActive = distancePreset === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleDistanceChange(item.id as '20cm' | '30cm' | '50cm')}
                className={`py-2 px-1 rounded-xl text-xs font-medium transition-all flex flex-col items-center justify-center relative ${
                  isActive
                    ? 'bg-gradient-to-b from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25 scale-[1.02]'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span className="text-[11px] font-semibold">{item.label}</span>
                <span className={`text-[9px] font-mono ${isActive ? 'text-cyan-100' : 'text-gray-500'}`}>
                  {item.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sensitivity slider */}
        <div className="pt-2 border-t border-white/5">
          <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
            <span className="flex items-center space-x-1">
              <Sliders className="w-3 h-3 text-cyan-400" />
              <span>Sensitivity Threshold</span>
            </span>
            <span className="font-mono text-cyan-300 font-semibold">{thresholdDb} dBFS</span>
          </div>

          <input
            type="range"
            min={-38}
            max={-20}
            step={1}
            value={thresholdDb}
            onChange={(e) => handleThresholdSlider(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
          />
          <div className="flex justify-between text-[9px] text-gray-500 font-mono mt-0.5">
            <span>Distant Voice Pass (-38dB)</span>
            <span>Strict Front Only (-20dB)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
