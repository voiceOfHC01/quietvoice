export const en = {
  appName: 'QuietVoice',
  tagline: 'Crystal-clear voice recorder with on-device noise elimination',
  privacyBadge: '100% On-Device Processing',
  privacySub: 'No voice data is uploaded unless you request Deep Clean.',
  
  // Recording controls
  tapToRecord: 'Tap to Record',
  recording: 'Recording',
  paused: 'Paused',
  resume: 'Resume',
  stopAndSave: 'Save',
  pause: 'Pause',
  cancel: 'Cancel',
  
  // Room calibration
  learnRoom: 'Learn My Room',
  learnRoomTitle: 'Calibrate Room Noise',
  learnRoomDesc: 'Stay quiet for 2 seconds while QuietVoice maps your room’s fan, AC, and acoustic hiss profile.',
  learnRoomCountdown: 'Calibrating room noise...',
  learnRoomSuccess: 'Room acoustic profile learned! Denoising tailored to your room.',
  calibrating: 'Listening to room silence...',
  
  // Strength Presets
  presetTitle: 'Denoise Strength',
  presetLight: 'Light',
  presetLightDesc: 'Subtle high-pass & gentle gate (-8 dB). Keeps 100% natural vocal timbre. Best for already quiet rooms.',
  presetBalanced: 'Balanced (Recommended)',
  presetBalancedDesc: 'Active fan & AC cancellation (-16 dB) with harmonic voice preservation. Clean and natural.',
  presetAggressive: 'Aggressive',
  presetAggressiveDesc: 'Deep spectral subtraction (-24 dB). Eliminates loud air conditioner hum. Vocal tone may sound slightly leaner.',
  tradeoffNotice: 'Notice: Stronger noise reduction aggressively strips background hum, which can make voice sound slightly thinner.',
  
  // Proximity Voice Isolation (Distance Blocker)
  proximityTitle: 'Close-Voice Isolation (Block Distant Sounds)',
  proximitySub: 'Blocks distant room noise, TV, and nearby people. Only records your voice spoken right near the phone.',
  proximityUltra: 'Near Mic (5–15 cm)',
  proximityUltraDesc: 'Speak right near phone mic. Hard-blocks any distant room audio.',
  proximityNormal: 'Handheld (15–30 cm)',
  proximityNormalDesc: 'Standard handheld talking distance with background voice rejection.',
  proximityOff: 'Wide / Off',
  gateClosedStatus: '🛡️ Distant Sound Blocked',
  gateOpenStatus: '🎙️ Close Voice Passed',
  distanceThreshold: 'Voice Proximity Sensitivity',

  // Video Camera Recorder (30 cm Focus)
  videoTab: 'Video Cam',
  videoCamTitle: 'QuietCam Video Recorder',
  videoPresenterFocus: '30 cm Camera Presenter Focus',
  videoPresenterSub: 'Records the speaker sitting ~30 cm in front of the camera while blocking all background room noise, fans, and distant chatter.',
  videoPresenterVoice: '🎙️ Presenter Voice Active',
  videoNoiseBlocked: '🛡️ Room Noise Blocked',
  startVideo: 'Start Camera',
  recordVideo: 'Start Video REC',
  stopVideo: 'Stop & Save Video',
  flipCamera: 'Flip Camera',
  videoSaved: 'Video saved with studio clean audio!',
  myVideos: 'My Videos',

  // Audio telemetry & Meters
  rawInput: 'Raw Input',
  cleanedOutput: 'Cleaned Output',
  noiseReduction: 'Noise Reduction',
  dbReduced: 'dB reduced',
  cpuLatency: 'DSP Latency',
  
  // A/B Comparison Player
  abTitle: 'A/B Comparison',
  abDesc: 'Flip between the raw microphone audio and the cleaned audio in real time.',
  modeClean: 'Cleaned',
  modeRaw: 'Original',
  spectrogramView: 'Spectrogram (FFT)',
  spectrogramDesc: 'Visual proof of noise removal across frequency bands (0 Hz - 8 kHz).',
  
  // Recordings
  recordingsTitle: 'My Recordings',
  noRecordings: 'No recordings yet. Tap the microphone to record your first clean audio.',
  rename: 'Rename',
  share: 'Share',
  download: 'Download',
  delete: 'Delete',
  deepClean: 'Deep Clean',
  deepCleanDesc: 'Run offline studio-grade deep cleaning on this recording.',
  deepCleanProcessing: 'Processing Deep Clean audio filter...',
  deepCleanSuccess: 'Deep clean complete! Additional +6 dB noise floor reduction applied.',
  
  // Settings & Edge Cases
  settings: 'Settings',
  micConstraints: 'Microphone Hardware Features',
  builtInSuppression: 'Built-in Noise Suppression',
  builtInEcho: 'Built-in Echo Cancellation',
  builtInAgc: 'Auto Gain Control (AGC)',
  monitoring: 'Headphone Live Monitoring',
  monitoringWarningTitle: 'Feedback Warning!',
  monitoringWarningDesc: 'Please connect wired or Bluetooth headphones before enabling live monitoring to prevent loud acoustic feedback.',
  iHaveHeadphones: 'I have headphones on',
  sampleRate: 'Sample Rate',
  exportFormat: 'Export Format',
  theme: 'Theme',
  language: 'Language',
  
  // Honesty & Reality Rules
  honestyTitle: 'Realistic Noise Expectations',
  honestySteady: 'Steady Noise (Fans, AC, PC hum): 90-95% eliminated.',
  honestyTransient: 'Sudden Noises (Door slams, nearby speech, typing): Reduced, but not 100% eliminated to preserve voice.',
  
  // Permissions & Edge Cases
  micPermissionTitle: 'Microphone Permission Needed',
  micPermissionDesc: 'QuietVoice needs microphone access to capture your voice and remove background fan and room noise in real time on your device.',
  grantPermission: 'Grant Permission',
  permissionDenied: 'Microphone access was denied. Please allow microphone permissions in your browser address bar settings to record.',
  audioInterrupted: 'Audio was interrupted (e.g. phone call or background switch). Recording was safely paused.',
};
