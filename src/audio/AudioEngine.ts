import { AudioMetrics, AudioSettings, PresetType } from '../types';
import { encodeWAV, mergeAudioChunks, generateWaveformPreview } from './WavEncoder';

export interface AudioEngineCallbacks {
  onMetrics: (metrics: AudioMetrics) => void;
  onRoomCalibrated: (avgNoiseDb: number) => void;
  onInterrupted: (reason: string) => void;
  onError: (error: Error) => void;
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private monitorGainNode: GainNode | null = null;
  private cleanStreamDestination: MediaStreamAudioDestinationNode | null = null;

  private rawChunks: Float32Array[] = [];
  private cleanChunks: Float32Array[] = [];
  private isRecording = false;
  private isPaused = false;
  private startTime = 0;
  private pausedDuration = 0;
  private pauseStartTime = 0;

  private callbacks: AudioEngineCallbacks;
  private settings: AudioSettings;

  constructor(settings: AudioSettings, callbacks: AudioEngineCallbacks) {
    this.settings = { ...settings };
    this.callbacks = callbacks;
  }

  public updateSettings(newSettings: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    if (this.workletNode) {
      if (newSettings.preset) {
        this.workletNode.port.postMessage({ type: 'SET_PRESET', preset: newSettings.preset });
      }
      if (newSettings.proximityMode) {
        this.workletNode.port.postMessage({ type: 'SET_PROXIMITY', mode: newSettings.proximityMode });
      }
      if (typeof newSettings.proximityThresholdDb === 'number') {
        this.workletNode.port.postMessage({ type: 'SET_PROXIMITY_THRESHOLD', thresholdDb: newSettings.proximityThresholdDb });
      }
      if (typeof newSettings.headphoneMonitoring === 'boolean') {
        this.workletNode.port.postMessage({ type: 'SET_MONITORING', monitoring: newSettings.headphoneMonitoring });
        if (this.monitorGainNode) {
          this.monitorGainNode.gain.value = newSettings.headphoneMonitoring ? 1.0 : 0.0;
        }
      }
    }
  }

  public static isSupported(): { supported: boolean; reason?: string } {
    if (typeof window === 'undefined') return { supported: false, reason: 'SSR environment' };
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { supported: false, reason: 'getUserMedia is not supported on this browser' };
    }
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) {
      return { supported: false, reason: 'Web Audio API is not supported on this browser' };
    }
    return { supported: true };
  }

  public async initialize(existingStream?: MediaStream): Promise<void> {
    if (this.audioContext && this.workletNode) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioCtx({
        sampleRate: this.settings.sampleRate || 48000,
        latencyHint: 'interactive'
      });

      // Handle iOS Safari audio context resume state
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Interruption detector (phone call, tab backgrounding)
      this.audioContext.onstatechange = () => {
        if (this.audioContext?.state === 'interrupted' || this.audioContext?.state === 'suspended') {
          if (this.isRecording && !this.isPaused) {
            this.pauseRecording();
            this.callbacks.onInterrupted('Audio was interrupted by the operating system.');
          }
        }
      };

      // Load our high-performance AudioWorkletProcessor
      await this.audioContext.audioWorklet.addModule('/audio-worklets/noise-processor-worklet.js');

      if (existingStream) {
        this.mediaStream = existingStream;
      } else {
        // Request microphone stream with user-selected hardware constraints
        const constraints: MediaStreamConstraints = {
          audio: {
            echoCancellation: this.settings.echoCancellation,
            noiseSuppression: this.settings.noiseSuppression,
            autoGainControl: this.settings.autoGainControl,
            channelCount: 1,
          },
          video: false
        };
        this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      }

      // Handle Bluetooth or external mic disconnect
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.onended = () => {
          this.callbacks.onInterrupted('Microphone disconnected or interrupted.');
        };
      });

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.workletNode = new AudioWorkletNode(this.audioContext, 'noise-processor-worklet');

      // Create clean destination for recording and video mixing
      this.cleanStreamDestination = this.audioContext.createMediaStreamDestination();
      this.workletNode.connect(this.cleanStreamDestination);

      // Create monitoring gain node for safe headphone feed
      this.monitorGainNode = this.audioContext.createGain();
      this.monitorGainNode.gain.value = this.settings.headphoneMonitoring ? 1.0 : 0.0;

      // Connect graph: Source -> Worklet -> Monitor Gain -> Destination
      this.sourceNode.connect(this.workletNode);
      this.workletNode.connect(this.monitorGainNode);
      this.monitorGainNode.connect(this.audioContext.destination);

      // Setup worklet communication
      this.workletNode.port.onmessage = (event) => {
        const msg = event.data;
        if (!msg) return;

        if (msg.type === 'AUDIO_DATA') {
          if (this.isRecording && !this.isPaused) {
            this.rawChunks.push(msg.rawBuffer);
            this.cleanChunks.push(msg.cleanBuffer);
          }
        } else if (msg.type === 'METRICS') {
          this.callbacks.onMetrics({
            rawDb: msg.rawDb,
            cleanDb: msg.cleanDb,
            rawPeakDb: msg.rawPeakDb,
            cleanPeakDb: msg.cleanPeakDb,
            noiseReductionDb: msg.noiseReductionDb,
            isVoiced: msg.isVoiced,
            gateOpen: msg.gateOpen,
            proximityMode: msg.proximityMode,
            gateThresholdDb: msg.gateThresholdDb,
            latencyMs: 8.5 // Typical round-trip worklet quantum latency at 48kHz
          });
        } else if (msg.type === 'LEARNED_ROOM_SUCCESS') {
          this.callbacks.onRoomCalibrated(msg.averageNoiseFloorDb);
        }
      };

      // Set initial worklet state
      this.workletNode.port.postMessage({ type: 'SET_PRESET', preset: this.settings.preset });
      this.workletNode.port.postMessage({ type: 'SET_PROXIMITY', mode: this.settings.proximityMode || 'ultra' });
      this.workletNode.port.postMessage({ type: 'SET_MONITORING', monitoring: this.settings.headphoneMonitoring });

    } catch (err) {
      console.error('AudioEngine initialization error:', err);
      this.cleanup();
      throw err;
    }
  }

  public async startRecording(): Promise<void> {
    if (!this.audioContext || !this.workletNode) {
      await this.initialize();
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.rawChunks = [];
    this.cleanChunks = [];
    this.isRecording = true;
    this.isPaused = false;
    this.startTime = Date.now();
    this.pausedDuration = 0;
    this.workletNode?.port.postMessage({ type: 'START_RECORDING' });
  }

  public pauseRecording(): void {
    if (this.isRecording && !this.isPaused) {
      this.isPaused = true;
      this.pauseStartTime = Date.now();
      this.workletNode?.port.postMessage({ type: 'STOP_RECORDING' });
    }
  }

  public resumeRecording(): void {
    if (this.isRecording && this.isPaused) {
      this.pausedDuration += Date.now() - this.pauseStartTime;
      this.isPaused = false;
      this.workletNode?.port.postMessage({ type: 'START_RECORDING' });
    }
  }

  public async stopRecording(): Promise<{
    duration: number;
    rawBlob: Blob;
    cleanBlob: Blob;
    sampleRate: number;
    waveform: number[];
  }> {
    this.isRecording = false;
    this.isPaused = false;
    this.workletNode?.port.postMessage({ type: 'STOP_RECORDING' });

    const effectiveDuration = (Date.now() - this.startTime - this.pausedDuration) / 1000;
    const sr = this.audioContext ? this.audioContext.sampleRate : 48000;

    const mergedRaw = mergeAudioChunks(this.rawChunks);
    const mergedClean = mergeAudioChunks(this.cleanChunks);

    const rawBlob = encodeWAV(mergedRaw, sr);
    const cleanBlob = encodeWAV(mergedClean, sr);
    const waveform = generateWaveformPreview(mergedClean, 80);

    this.rawChunks = [];
    this.cleanChunks = [];

    return {
      duration: Math.max(0.5, effectiveDuration),
      rawBlob,
      cleanBlob,
      sampleRate: sr,
      waveform
    };
  }

  public startLearnRoom(): void {
    if (this.workletNode) {
      this.workletNode.port.postMessage({ type: 'START_LEARN_ROOM' });
    }
  }

  public stopLearnRoom(): void {
    if (this.workletNode) {
      this.workletNode.port.postMessage({ type: 'STOP_LEARN_ROOM' });
    }
  }

  public setBypass(bypass: boolean): void {
    if (this.workletNode) {
      this.workletNode.port.postMessage({ type: 'SET_BYPASS', bypass });
    }
  }

  public setPreset(preset: PresetType): void {
    this.settings.preset = preset;
    if (this.workletNode) {
      this.workletNode.port.postMessage({ type: 'SET_PRESET', preset });
    }
  }

  public setMonitoring(enabled: boolean): void {
    this.settings.headphoneMonitoring = enabled;
    if (this.workletNode) {
      this.workletNode.port.postMessage({ type: 'SET_MONITORING', monitoring: enabled });
    }
  }

  public getElapsedTime(): number {
    if (!this.isRecording) return 0;
    if (this.isPaused) {
      return (this.pauseStartTime - this.startTime - this.pausedDuration) / 1000;
    }
    return (Date.now() - this.startTime - this.pausedDuration) / 1000;
  }

  public getCleanAudioTrack(): MediaStreamTrack | null {
    if (!this.cleanStreamDestination) return null;
    const tracks = this.cleanStreamDestination.stream.getAudioTracks();
    return tracks.length > 0 ? tracks[0] : null;
  }

  public cleanup(): void {
    this.isRecording = false;
    this.isPaused = false;
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.cleanStreamDestination) {
      this.cleanStreamDestination.disconnect();
      this.cleanStreamDestination = null;
    }
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.monitorGainNode) {
      this.monitorGainNode.disconnect();
      this.monitorGainNode = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }
}
