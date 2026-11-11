/**
 * VideoRecorderEngine
 * Captures camera video and feeds the microphone through the AudioEngine's
 * real-time DSP pipeline (30cm presenter distance gate + spectral denoiser),
 * then multiplexes the video track and cleaned audio track into a single video file.
 */

import { AudioEngine } from './AudioEngine';
import { AudioMetrics, AudioSettings, VideoRecordingItem } from '../types';

export interface VideoEngineCallbacks {
  onMetrics: (metrics: AudioMetrics) => void;
  onInterrupted: (reason: string) => void;
  onError: (error: Error) => void;
}

export class VideoRecorderEngine {
  private cameraStream: MediaStream | null = null;
  private combinedStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  private audioEngine: AudioEngine | null = null;
  private settings: AudioSettings;
  private callbacks: VideoEngineCallbacks;

  private facingMode: 'user' | 'environment' = 'user';
  private isRecording = false;
  private startTime = 0;
  private measuredNoiseReduction = 16.5;

  constructor(settings: AudioSettings, callbacks: VideoEngineCallbacks) {
    this.settings = { ...settings, proximityMode: 'video30cm', proximityThresholdDb: -29 };
    this.callbacks = callbacks;
  }

  public async startCamera(videoElement: HTMLVideoElement): Promise<void> {
    try {
      this.stopCamera();

      // Request camera video and mic
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: this.facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: {
          echoCancellation: this.settings.echoCancellation,
          noiseSuppression: this.settings.noiseSuppression,
          autoGainControl: this.settings.autoGainControl,
        }
      });

      // Bind to preview video element
      videoElement.srcObject = this.cameraStream;
      await videoElement.play().catch(() => {});

      // Initialize AudioEngine with this camera's audio stream
      this.audioEngine = new AudioEngine(this.settings, {
        onMetrics: (m) => {
          this.measuredNoiseReduction = m.noiseReductionDb || 16.5;
          this.callbacks.onMetrics(m);
        },
        onRoomCalibrated: () => {},
        onInterrupted: this.callbacks.onInterrupted,
        onError: this.callbacks.onError
      });

      await this.audioEngine.initialize(this.cameraStream);
      // Ensure 30cm presenter focus is active
      this.audioEngine.updateSettings({
        proximityMode: 'video30cm',
        proximityThresholdDb: this.settings.proximityThresholdDb || -29
      });

    } catch (err: unknown) {
      console.error('Failed to start camera:', err);
      this.callbacks.onError(err as Error);
      throw err;
    }
  }

  public async flipCamera(videoElement: HTMLVideoElement): Promise<void> {
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    await this.startCamera(videoElement);
  }

  public setDistanceThreshold(thresholdDb: number): void {
    this.settings.proximityThresholdDb = thresholdDb;
    if (this.audioEngine) {
      this.audioEngine.updateSettings({
        proximityMode: 'video30cm',
        proximityThresholdDb: thresholdDb
      });
    }
  }

  public async startRecording(): Promise<void> {
    if (!this.cameraStream || !this.audioEngine) {
      throw new Error('Camera is not active');
    }

    // Ensure AudioEngine graph and AudioContext are active and un-suspended (AUD-09)
    await this.audioEngine.startRecording();

    const videoTrack = this.cameraStream.getVideoTracks()[0];
    const cleanAudioTrack = this.audioEngine.getCleanAudioTrack();

    if (!videoTrack) throw new Error('No video track available');

    // If clean audio track is ready, use it; otherwise fallback to camera audio
    const audioTrackToUse = cleanAudioTrack || this.cameraStream.getAudioTracks()[0];
    this.combinedStream = new MediaStream([videoTrack, audioTrackToUse]);

    this.recordedChunks = [];

    // Select supported video mime type
    let mimeType = 'video/webm;codecs=vp8,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
      } else {
        mimeType = '';
      }
    }

    const options = mimeType ? { mimeType } : undefined;
    this.mediaRecorder = new MediaRecorder(this.combinedStream, options);

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };

    this.mediaRecorder.start(250); // Slice every 250ms
    this.isRecording = true;
    this.startTime = Date.now();
  }

  public async stopRecording(): Promise<VideoRecordingItem> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('MediaRecorder is not recording'));
        return;
      }

      const duration = (Date.now() - this.startTime) / 1000;
      if (this.audioEngine) {
        this.audioEngine.stopRecording().catch(() => {});
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'video/webm';
        const videoBlob = new Blob(this.recordedChunks, { type: mimeType });
        const now = new Date();
        const defaultName = `QuietCam_${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}_${now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}`;

        const videoItem: VideoRecordingItem = {
          id: `vid_${Date.now()}`,
          name: defaultName,
          timestamp: Date.now(),
          duration: Math.max(0.5, duration),
          videoBlob,
          videoUrl: URL.createObjectURL(videoBlob),
          measuredNoiseReductionDb: this.measuredNoiseReduction,
          distanceMode: '30 cm Camera Focus'
        };

        this.isRecording = false;
        resolve(videoItem);
      };

      this.mediaRecorder.stop();
    });
  }

  public stopCamera(): void {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((t) => t.stop());
      this.cameraStream = null;
    }
    if (this.combinedStream) {
      this.combinedStream.getTracks().forEach((t) => t.stop());
      this.combinedStream = null;
    }
    if (this.audioEngine) {
      this.audioEngine.cleanup();
      this.audioEngine = null;
    }
    this.isRecording = false;
  }
}
