export type PresetType = 'light' | 'balanced' | 'aggressive';
export type ProximityMode = 'ultra' | 'video30cm' | 'normal' | 'relaxed' | 'off';

export type RecordingState = 'idle' | 'recording' | 'paused' | 'processing';

export interface AudioMetrics {
  rawDb: number;
  cleanDb: number;
  rawPeakDb: number;
  cleanPeakDb: number;
  noiseReductionDb: number;
  isVoiced: boolean;
  gateOpen?: boolean;
  proximityMode?: string;
  gateThresholdDb?: number;
  latencyMs?: number;
}

export interface VideoRecordingItem {
  id: string;
  name: string;
  timestamp: number;
  duration: number; // in seconds
  videoBlob: Blob;
  videoUrl?: string;
  measuredNoiseReductionDb: number;
  distanceMode: string;
}

export interface RecordingItem {
  id: string;
  name: string;
  timestamp: number;
  duration: number; // in seconds
  preset: PresetType;
  proximityMode?: ProximityMode;
  measuredNoiseReductionDb: number;
  rawBlob: Blob; // WAV
  cleanBlob: Blob; // WAV
  cleanUrl?: string;
  rawUrl?: string;
  sampleRate: number;
  waveform: number[]; // normalized 0..1 peak samples for waveform preview
  isDeepCleaned?: boolean;
}

export interface AudioSettings {
  preset: PresetType;
  proximityMode: ProximityMode;
  proximityThresholdDb: number;
  noiseSuppression: boolean; // browser constraint
  echoCancellation: boolean; // browser constraint
  autoGainControl: boolean;  // browser constraint
  sampleRate: number;
  headphoneMonitoring: boolean;
  exportFormat: 'wav' | 'mp3' | 'webm';
}

export type Language = 'en' | 'bn';
export type Theme = 'dark' | 'light';
