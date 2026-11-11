import React, { useState } from 'react';
import { 
  Library, 
  Share2, 
  Download, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Sparkles, 
  Play, 
  Sliders, 
  Activity,
  FileAudio,
  Video,
  Mic,
  Film
} from 'lucide-react';
import { RecordingItem, VideoRecordingItem } from '../types';
import { formatTime } from '../audio/AudioMetrics';

interface RecordingsListProps {
  recordings: RecordingItem[];
  videos?: VideoRecordingItem[];
  selectedRecording: RecordingItem | null;
  onSelect: (recording: RecordingItem) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onRenameVideo?: (id: string, newName: string) => void;
  onDeleteVideo?: (id: string) => void;
  onDeepClean: (recording: RecordingItem) => void;
  onOpenSpectrogram: (recording: RecordingItem) => void;
  t: Record<string, string>;
}

export const RecordingsList: React.FC<RecordingsListProps> = ({
  recordings,
  videos = [],
  selectedRecording,
  onSelect,
  onRename,
  onDelete,
  onRenameVideo,
  onDeleteVideo,
  onDeepClean,
  onOpenSpectrogram,
  t,
}) => {
  const [libTab, setLibTab] = useState<'audio' | 'video'>('audio');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [activeVideoPreview, setActiveVideoPreview] = useState<VideoRecordingItem | null>(null);

  const handleStartRename = (id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditName(currentName);
  };

  const handleSaveRename = (id: string, isVideo: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editName.trim()) {
      if (isVideo && onRenameVideo) {
        onRenameVideo(id, editName.trim());
      } else {
        onRename(id, editName.trim());
      }
    }
    setEditingId(null);
  };

  const handleDownload = (rec: RecordingItem, type: 'clean' | 'raw', e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = type === 'clean' ? rec.cleanBlob : rec.rawBlob;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rec.name.replace(/\s+/g, '_')}_${type}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadVideo = (vid: VideoRecordingItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = URL.createObjectURL(vid.videoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${vid.name.replace(/\s+/g, '_')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async (rec: RecordingItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const file = new File([rec.cleanBlob], `${rec.name}.wav`, { type: 'audio/wav' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: rec.name,
          text: `Cleaned audio recorded with QuietVoice (-${rec.measuredNoiseReductionDb.toFixed(1)} dB noise reduced)`
        });
      } else {
        handleDownload(rec, 'clean', e);
      }
    } catch (err) {
      console.log('Share dismissed or not supported:', err);
    }
  };

  const handleShareVideo = async (vid: VideoRecordingItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const file = new File([vid.videoBlob], `${vid.name}.webm`, { type: 'video/webm' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: vid.name,
          text: `QuietCam Video with 30cm clean voice (-${vid.measuredNoiseReductionDb.toFixed(1)} dB noise reduced)`
        });
      } else {
        handleDownloadVideo(vid, e);
      }
    } catch (err) {
      console.log('Share dismissed or not supported:', err);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 my-4 pb-20">
      {/* Video Preview Modal */}
      {activeVideoPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl p-4 bg-dark-card border border-dark-border shadow-2xl relative">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-white truncate max-w-[240px]">
                {activeVideoPreview.name}
              </h3>
              <button
                onClick={() => setActiveVideoPreview(null)}
                className="p-1 rounded-full text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden aspect-[4/5] bg-black border border-white/10 mb-3">
              <video
                src={activeVideoPreview.videoUrl}
                controls
                playsInline
                autoPlay
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-cyan-400 font-mono">
                -{activeVideoPreview.measuredNoiseReductionDb.toFixed(1)} dB Noise Removed • 30cm Focus
              </span>
              <button
                onClick={(e) => handleDownloadVideo(activeVideoPreview, e)}
                className="px-3 py-1.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.download}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Library Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center space-x-2">
          <Library className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-white dark:text-white light:text-gray-900">
            {t.recordingsTitle}
          </h2>
        </div>

        {/* Audio vs Video Segmented Switcher */}
        <div className="flex items-center p-0.5 rounded-full bg-black/40 border border-white/10 text-xs">
          <button
            onClick={() => setLibTab('audio')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center space-x-1 transition-all ${
              libTab === 'audio'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Mic className="w-3 h-3" />
            <span>Audio ({recordings.length})</span>
          </button>
          <button
            onClick={() => setLibTab('video')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center space-x-1 transition-all ${
              libTab === 'video'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Video className="w-3 h-3" />
            <span>Video ({videos.length})</span>
          </button>
        </div>
      </div>

      {/* Audio Tab Content */}
      {libTab === 'audio' && (
        <>
          {recordings.length === 0 ? (
            <div className="rounded-3xl p-8 bg-dark-card/50 dark:bg-dark-card/50 light:bg-light-card border border-dark-border text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 mb-3">
                <FileAudio className="w-6 h-6" />
              </div>
              <p className="text-xs text-gray-400 max-w-[240px] leading-relaxed">
                {t.noRecordings}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recordings.map((rec) => {
                const isSelected = selectedRecording?.id === rec.id;
                const isEditing = editingId === rec.id;
                const formattedDate = new Date(rec.timestamp).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={rec.id}
                    onClick={() => onSelect(rec)}
                    className={`group rounded-2xl p-3.5 transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-dark-card dark:bg-dark-card light:bg-light-card border-cyan-500/50 shadow-glow-cyan'
                        : 'bg-dark-card/70 dark:bg-dark-card/70 light:bg-light-card border-dark-border hover:border-cyan-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2 flex-1 min-w-0 mr-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(rec);
                          }}
                          className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 hover:bg-cyan-500 hover:text-white transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </button>

                        {isEditing ? (
                          <div className="flex items-center space-x-1 flex-1">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-black/50 text-xs px-2 py-1 rounded border border-cyan-500 text-white w-full"
                              autoFocus
                            />
                            <button
                              onClick={(e) => handleSaveRename(rec.id, false, e)}
                              className="p-1 text-emerald-400 hover:text-white"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(null);
                              }}
                              className="p-1 text-gray-400 hover:text-white"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="truncate">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs font-semibold text-white dark:text-white light:text-gray-900 truncate">
                                {rec.name}
                              </span>
                              {rec.isDeepCleaned && (
                                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  Studio Clean
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-[10px] text-gray-400 font-mono">
                              <span>{formattedDate}</span>
                              <span>•</span>
                              <span className="text-cyan-400">-{rec.measuredNoiseReductionDb.toFixed(1)} dB</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <span className="text-xs font-mono font-semibold text-gray-300 dark:text-gray-300 light:text-gray-700">
                        {formatTime(rec.duration)}
                      </span>
                    </div>

                    <div className="h-6 w-full flex items-center gap-[2px] opacity-75 my-1.5 px-0.5">
                      {rec.waveform && rec.waveform.slice(0, 36).map((bar, i) => (
                        <div
                          key={i}
                          className="w-full bg-cyan-500/40 rounded-full"
                          style={{ height: `${Math.max(15, bar * 100)}%` }}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeepClean(rec);
                        }}
                        className="px-2 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-medium flex items-center space-x-1 transition-all"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        <span>{t.deepClean}</span>
                      </button>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenSpectrogram(rec);
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-white/5 transition-all"
                          title={t.spectrogramView}
                        >
                          <Activity className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => handleStartRename(rec.id, rec.name, e)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                          title={t.rename}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => handleShare(rec, e)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                          title={t.share}
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => handleDownload(rec, 'clean', e)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-white/5 transition-all"
                          title={t.download}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(rec.id);
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5 transition-all"
                          title={t.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Video Tab Content */}
      {libTab === 'video' && (
        <>
          {videos.length === 0 ? (
            <div className="rounded-3xl p-8 bg-dark-card/50 dark:bg-dark-card/50 light:bg-light-card border border-dark-border text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 mb-3">
                <Film className="w-6 h-6" />
              </div>
              <p className="text-xs text-gray-400 max-w-[240px] leading-relaxed">
                No videos recorded yet. Tap the Camera tab below to record with 30cm clean voice!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {videos.map((vid) => {
                const isEditing = editingId === vid.id;
                const formattedDate = new Date(vid.timestamp).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={vid.id}
                    className="rounded-2xl p-3.5 bg-dark-card/70 border border-dark-border hover:border-cyan-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2.5 flex-1 min-w-0 mr-2">
                        <button
                          onClick={() => setActiveVideoPreview(vid)}
                          className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 hover:bg-cyan-500 hover:text-white transition-colors"
                        >
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </button>

                        {isEditing ? (
                          <div className="flex items-center space-x-1 flex-1">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="bg-black/50 text-xs px-2 py-1 rounded border border-cyan-500 text-white w-full"
                              autoFocus
                            />
                            <button
                              onClick={(e) => handleSaveRename(vid.id, true, e)}
                              className="p-1 text-emerald-400 hover:text-white"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 text-gray-400 hover:text-white"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="truncate">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs font-semibold text-white truncate">
                                {vid.name}
                              </span>
                              <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                30cm Clean
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-[10px] text-gray-400 font-mono">
                              <span>{formattedDate}</span>
                              <span>•</span>
                              <span className="text-cyan-400">-{vid.measuredNoiseReductionDb.toFixed(1)} dB</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <span className="text-xs font-mono font-semibold text-gray-300">
                        {formatTime(vid.duration)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-1 pt-2 border-t border-white/5">
                      <button
                        onClick={() => setActiveVideoPreview(vid)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 text-[10px] font-medium flex items-center space-x-1 hover:bg-cyan-500/20"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Watch Video</span>
                      </button>

                      <button
                        onClick={(e) => handleStartRename(vid.id, vid.name, e)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                        title={t.rename}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleShareVideo(vid, e)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                        title={t.share}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleDownloadVideo(vid, e)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-white/5 transition-all"
                        title={t.download}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {onDeleteVideo && (
                        <button
                          onClick={() => onDeleteVideo(vid.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5 transition-all"
                          title={t.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
