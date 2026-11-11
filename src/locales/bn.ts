import { en } from './en';

export const bn: typeof en = {
  appName: 'কোয়ায়েটভয়েস (QuietVoice)',
  tagline: 'অন-ডিভাইস ফ্যান ও ব্যাকগ্রাউন্ড নয়েজ দূর করে পরিষ্কার ভয়েস রেকর্ডার',
  privacyBadge: 'সম্পূর্ণ ডিভাইসের মধ্যে প্রসেসিং (১০০% প্রাইভেট)',
  privacySub: 'আপনার কোনো অডিও কোথাও আপলোড হয় না (ডিপ ক্লিন না চাইলে)।',

  // Recording controls
  tapToRecord: 'রেকর্ড করতে চাপুন',
  recording: 'রেকর্ডিং চলছে...',
  paused: 'পজ করা হয়েছে',
  resume: 'পুনরায় চালু',
  stopAndSave: 'সংরক্ষণ',
  pause: 'পজ',
  cancel: 'বাতিল',

  // Room calibration
  learnRoom: 'রুম ক্যালিব্রেশন',
  learnRoomTitle: 'রুমের নয়েজ প্রোফাইল শিখুন',
  learnRoomDesc: '২ সেকেন্ড চুপ থাকুন যাতে অ্যাপটি আপনার রুমের ফ্যান, এসি ও হিসহিস শব্দ চিনে নিতে পারে।',
  learnRoomCountdown: 'রুমের নয়েজ বিশ্লেষণ হচ্ছে...',
  learnRoomSuccess: 'রুম প্রোফাইল সফলভাবে শেখা হয়েছে! আপনার ঘরের জন্য নয়েজ ফিল্টার তৈরি।',
  calibrating: 'রুমের নীরবতা শুনছে...',

  // Strength Presets
  presetTitle: 'নয়েজ হ্রাসের মাত্রা',
  presetLight: 'হালকা (Light)',
  presetLightDesc: 'মৃদু ফিল্টার (-৮ dB)। কণ্ঠের স্বাভাবিকতা ১০০% ধরে রাখে। শান্ত রুমের জন্য উপযুক্ত।',
  presetBalanced: 'ভারসাম্যপূর্ণ (Balanced)',
  presetBalancedDesc: 'ফ্যান ও এসি নয়েজ অপসারণ (-১৬ dB) এবং প্রাকৃতিক ভয়েস টোন। সাধারণ ব্যবহারের জন্য সেরা।',
  presetAggressive: 'তীব্র (Aggressive)',
  presetAggressiveDesc: 'গভীর ফিল্টারিং (-২৪ dB)। তীব্র এসি ও ফ্যানের ভোঁ ভোঁ শব্দ পুরোপুরি মুছে ফেলে। ভয়েস কিছুটা পাতলা লাগতে পারে।',
  tradeoffNotice: 'সতর্কতা: বেশি নয়েজ কমালে ব্যাকগ্রাউন্ডের শব্দ দূর হলেও গলার স্বর কিছুটা কৃত্রিম শোনাতে পারে।',

  // Proximity Voice Isolation (Distance Blocker)
  proximityTitle: 'কাছের ভয়েস আইসোলেশন (দূরবর্তী শব্দ ব্লক)',
  proximitySub: 'মোবাইলের কাছে থেকে বলা কথা ছাড়া দূরের সব আওয়াজ, ফ্যান ও ঘরের শব্দ পুরোপুরি ব্লক করে।',
  proximityUltra: 'খুব কাছে (৫–১৫ সেমি)',
  proximityUltraDesc: 'ফোন মুখের কাছে রেখে কথা বলুন। দূরের কোনো শব্দ বা মানুষের আওয়াজ ঢুকবে না।',
  proximityNormal: 'হাতে ধরা (১৫–৩০ সেমি)',
  proximityNormalDesc: 'স্বাভাবিকভাবে হাতে ধরে কথা বলুন। দূরের শব্দ আটকে যাবে।',
  proximityOff: 'সব শব্দ (অফ)',
  gateClosedStatus: '🛡️ দূরবর্তী শব্দ ব্লকড (সাইলেন্ট)',
  gateOpenStatus: '🎙️ কাছের ভয়েস চালু আছে',
  distanceThreshold: 'দূরত্ব সেনসিটিভিটি',

  // Video Camera Recorder (30 cm Focus)
  videoTab: 'ভিডিও ক্যাম',
  videoCamTitle: 'কোয়ায়েটক্যাম ভিডিও রেকর্ডার',
  videoPresenterFocus: 'ক্যামেরার সামনের ভয়েস ফোকাস (৩০ সেমি)',
  videoPresenterSub: 'মোবাইল থেকে ৩০ সেমি দূরে বসে থাকা ব্যক্তির ভয়েস রেকর্ড করবে এবং পেছনের সব ধরণের রুম নয়েজ ও ফ্যানের শব্দ ব্লক করবে।',
  videoPresenterVoice: '🎙️ ক্যামেরার ভয়েস সক্রিয় (৩০ সেমি)',
  videoNoiseBlocked: '🛡️ পেছনের নয়েজ ব্লকড',
  startVideo: 'ক্যামেরা চালু করুন',
  recordVideo: 'ভিডিও রেকর্ড শুরু',
  stopVideo: 'ভিডিও সংরক্ষণ',
  flipCamera: 'ক্যামেরা পরিবর্তন',
  videoSaved: 'নয়েজমুক্ত অডিওসহ ভিডিও সংরক্ষিত!',
  myVideos: 'সংরক্ষিত ভিডিও',

  // Audio telemetry & Meters
  rawInput: 'আসল ইনপুট',
  cleanedOutput: 'পরিষ্কার আউটপুট',
  noiseReduction: 'নয়েজ হ্রাস',
  dbReduced: 'dB কমানো হয়েছে',
  cpuLatency: 'ডিএসপি লেটেন্সি',

  // A/B Comparison Player
  abTitle: 'আসল বনাম পরিষ্কার (A/B তুলনা)',
  abDesc: 'প্লেব্যাক চলাকালীন আসল মাইক্রোফোন ও নয়েজমুক্ত শব্দের মধ্যে সরাসরি পরিবর্তন করে শুনুন।',
  modeClean: 'পরিষ্কার (Cleaned)',
  modeRaw: 'আসল (Original)',
  spectrogramView: 'স্পেকট্রোগ্রাম (FFT চার্ট)',
  spectrogramDesc: 'ফ্রিকোয়েন্সি ব্যান্ডে ফ্যানের শব্দ দূর হওয়ার দৃশ্যমান ভিজ্যুয়ালাইজেশন।',

  // Recordings
  recordingsTitle: 'সংরক্ষিত রেকর্ডিং',
  noRecordings: 'এখনও কোনো রেকর্ডিং নেই। উপরে মাইক চাপুন এবং নতুন পরিষ্কার রেকর্ড তৈরি করুন।',
  rename: 'নাম পরিবর্তন',
  share: 'শেয়ার',
  download: 'ডাউনলোড',
  delete: 'মুছে ফেলুন',
  deepClean: 'ডিপ ক্লিন',
  deepCleanDesc: 'এই অডিওতে উচ্চমানের স্টুডিও গ্রেড নয়েজ ফিল্টারিং প্রয়োগ করুন।',
  deepCleanProcessing: 'ডিপ ক্লিন অডিও ফিল্টার চলছে...',
  deepCleanSuccess: 'ডিপ ক্লিন সম্পন্ন! অতিরিক্ত +৬ dB নয়েজ হ্রাস পেয়েছে।',

  // Settings & Edge Cases
  settings: 'সেটিংস',
  micConstraints: 'মাইক্রোফোনের হার্ডওয়্যার ফিচার',
  builtInSuppression: 'ডিভাইসের বিল্ট-ইন নয়েজ সাপ্রেশন',
  builtInEcho: 'ইকো ক্যান্সেলেশন',
  builtInAgc: 'অটো গেইন কন্ট্রোল (AGC)',
  monitoring: 'হেডফোনে সরাসরি মনিটরিং',
  monitoringWarningTitle: 'ফিডব্যাক সতর্কতা!',
  monitoringWarningDesc: 'লাইভ মনিটরিং চালু করার আগে অনুগ্রহ করে হেডফোন ব্যবহার করুন, অন্যথায় স্পিকার থেকে তীব্র ফিডব্যাক শব্দ হতে পারে।',
  iHaveHeadphones: 'আমার কানে হেডফোন আছে',
  sampleRate: 'স্যাম্পল রেট',
  exportFormat: 'রপ্তানি ফরম্যাট',
  theme: 'থিম',
  language: 'ভাষা (Language)',

  // Honesty & Reality Rules
  honestyTitle: 'বাস্তব প্রত্যাশা ও সীমাবদ্ধতা',
  honestySteady: 'ধারাবাহিক শব্দ (ফ্যান, এসি, কম্পিউটারের ভোঁ ভোঁ): ৯০-৯৫% পুরোপুরি দূর হয়।',
  honestyTransient: 'আকস্মিক শব্দ (দরজা বন্ধ হওয়া, পাশে কেউ কথা বলা): আংশিক কমে, তবে ভয়েস বাঁচাতে সম্পূর্ণ বাদ দেওয়া যায় না।',

  // Permissions & Edge Cases
  micPermissionTitle: 'মাইক্রোফোন অনুমতি প্রয়োজন',
  micPermissionDesc: 'আপনার ভয়েস ধারণ এবং ডিভাইসেই সরাসরি ফ্যান ও রুম নয়েজ দূর করতে মাইক্রোফোনের অনুমতি প্রয়োজন।',
  grantPermission: 'অনুমতি দিন',
  permissionDenied: 'মাইক্রোফোনের অনুমতি মেলেনি। অনুগ্রহ করে ব্রাউজার অ্যাড্রেস বার থেকে মাইক্রোফোন পারমিশন অন করুন।',
  audioInterrupted: 'অডিও বাধাপ্রাপ্ত হয়েছে (যেমন ফোন কল বা ব্যাকগ্রাউন্ড)। রেকর্ডিং নিরাপদে পজ করা হয়েছে।',
};
