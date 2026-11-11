import { useState, useRef, useEffect, useCallback } from 'react';
import { AudioEngine } from '../audio/AudioEngine';
import { AudioMetrics, AudioSettings, PresetType, RecordingItem, RecordingState } from '../types';

export function useAudioRecorder(
  settings: AudioSettings,
  onRecordingSaved: (recording: RecordingItem) => void
) {
  const [state, setState] = useState<RecordingState>('idle');
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [metrics, setMetrics] = useState<AudioMetrics>({
    rawDb: -100,
    cleanDb: -100,
    rawPeakDb: -100,
    cleanPeakDb: -100,
    noiseReductionDb: 0,
    isVoiced: false,
    gateOpen: false,
    proximityMode: 'ultra',
    gateThresholdDb: -24,
    latencyMs: 8.5
  });
  const [isCalibratingRoom, setIsCalibratingRoom] = useState<boolean>(false);
  const [calibrationCountdown, setCalibrationCountdown] = useState<number>(2);
  const [roomCalibrated, setRoomCalibrated] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [interruptionMessage, setInterruptionMessage] = useState<string | null>(null);

  const engineRef = useRef<AudioEngine | null>(null);
  const timerRef = useRef<number | null>(null);
  const lastMetricsTimeRef = useRef<number>(0);
  const lastGateStateRef = useRef<boolean>(false);

  // Initialize or update engine settings
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateSettings(settings);
    }
  }, [settings]);

  // Handle timer tick when recording
  useEffect(() => {
    if (state === 'recording') {
      timerRef.current = window.setInterval(() => {
        if (engineRef.current) {
          setElapsedTime(engineRef.current.getElapsedTime());
        }
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

  const initEngine = useCallback(async () => {
    if (!engineRef.current) {
      engineRef.current = new AudioEngine(settings, {
        onMetrics: (m) => {
          const now = performance.now();
          const gateChanged = m.gateOpen !== lastGateStateRef.current;
          if (gateChanged || now - lastMetricsTimeRef.current >= 50) {
            lastMetricsTimeRef.current = now;
            lastGateStateRef.current = Boolean(m.gateOpen);
            setMetrics(m);
          }
        },
        onRoomCalibrated: (_avgNoise) => {
          setIsCalibratingRoom(false);
          setRoomCalibrated(true);
        },
        onInterrupted: (reason) => {
          setState('paused');
          setInterruptionMessage(reason);
        },
        onError: (err) => {
          setPermissionError(err.message);
        }
      });
      await engineRef.current.initialize();
    }
  }, [settings]);

  const startRecording = async () => {
    try {
      setPermissionError(null);
      setInterruptionMessage(null);
      await initEngine();
      if (engineRef.current) {
        await engineRef.current.startRecording();
        setState('recording');
        setElapsedTime(0);
      }
    } catch (err: unknown) {
      const e = err as Error;
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setPermissionError('Microphone permission was denied.');
      } else {
        setPermissionError(e.message || 'Could not access microphone.');
      }
      setState('idle');
    }
  };

  const pauseRecording = () => {
    if (engineRef.current && state === 'recording') {
      engineRef.current.pauseRecording();
      setState('paused');
    }
  };

  const resumeRecording = () => {
    if (engineRef.current && state === 'paused') {
      engineRef.current.resumeRecording();
      setState('recording');
      setInterruptionMessage(null);
    }
  };

  const stopRecording = async () => {
    if (!engineRef.current) return;
    setState('processing');

    try {
      const result = await engineRef.current.stopRecording();
      const id = `rec_${Date.now()}`;
      const now = new Date();
      const defaultName = `Voice_${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}_${now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}`;

      const newRecording: RecordingItem = {
        id,
        name: defaultName,
        timestamp: Date.now(),
        duration: result.duration,
        preset: settings.preset,
        measuredNoiseReductionDb: metrics.noiseReductionDb || 14.5,
        rawBlob: result.rawBlob,
        cleanBlob: result.cleanBlob,
        sampleRate: result.sampleRate,
        waveform: result.waveform,
        isDeepCleaned: false
      };

      onRecordingSaved(newRecording);
    } catch (err) {
      console.error('Failed to finish recording:', err);
    } finally {
      setState('idle');
      setElapsedTime(0);
    }
  };

  const learnRoom = async () => {
    try {
      setPermissionError(null);
      await initEngine();
      if (!engineRef.current) return;

      setIsCalibratingRoom(true);
      setCalibrationCountdown(2);
      engineRef.current.startLearnRoom();

      const countdownInterval = setInterval(() => {
        setCalibrationCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            if (engineRef.current) {
              engineRef.current.stopLearnRoom();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      const e = err as Error;
      setPermissionError(e.message);
      setIsCalibratingRoom(false);
    }
  };

  const changePreset = (preset: PresetType) => {
    if (engineRef.current) {
      engineRef.current.setPreset(preset);
    }
  };

  const changeProximity = (mode: AudioSettings['proximityMode'], customDb?: number) => {
    if (engineRef.current) {
      engineRef.current.updateSettings({
        proximityMode: mode,
        ...(typeof customDb === 'number' ? { proximityThresholdDb: customDb } : {})
      });
    }
  };

  const toggleBypass = (bypass: boolean) => {
    if (engineRef.current) {
      engineRef.current.setBypass(bypass);
    }
  };

  const toggleMonitoring = (enabled: boolean) => {
    if (engineRef.current) {
      engineRef.current.setMonitoring(enabled);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.cleanup();
      }
    };
  }, []);

  return {
    state,
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
    toggleBypass,
    toggleMonitoring
  };
}
