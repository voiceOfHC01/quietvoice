import React, { useRef, useEffect } from 'react';
import { Sparkles, Activity } from 'lucide-react';
import { AudioMetrics, RecordingState } from '../types';
import { formatTimePrecise } from '../audio/AudioMetrics';

interface WaveformPillProps {
  state: RecordingState;
  elapsedTime: number;
  metrics: AudioMetrics;
  t: Record<string, string>;
}

export const WaveformPill: React.FC<WaveformPillProps> = React.memo(({
  state,
  elapsedTime,
  metrics,
  t,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<number[]>(new Array(48).fill(0.08));
  const metricsRef = useRef<AudioMetrics>(metrics);
  metricsRef.current = metrics;

  // Update animated waveform bars
  useEffect(() => {
    let animId: number;

    const updateBars = () => {
      // Calculate instantaneous amplitude based on cleanDb or rawDb
      let amp = 0.08;
      const curMetrics = metricsRef.current;
      if (state === 'recording') {
        const lin = Math.pow(10, (curMetrics.cleanDb + 60) / 40);
        amp = Math.max(0.08, Math.min(0.95, lin));
      } else if (state === 'paused') {
        amp = 0.05;
      }

      // Shift history and push new amplitude
      historyRef.current.shift();
      historyRef.current.push(amp);

      // Draw onto canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;
          ctx.clearRect(0, 0, width, height);

          const barCount = historyRef.current.length;
          const barWidth = 3;
          const gap = (width - barCount * barWidth) / (barCount - 1);
          const centerY = height / 2;

          for (let i = 0; i < barCount; i++) {
            const h = historyRef.current[i] * (height * 0.85);
            const x = i * (barWidth + gap);

            // Styling: future bars dimmed, past bars bright
            if (i < barCount - 12) {
              ctx.fillStyle = state === 'recording' ? '#ffffff' : '#64748b';
            } else if (i === barCount - 12) {
              // Current playhead position
              ctx.fillStyle = '#ef4444';
            } else {
              // Future bars trailing off
              ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            }

            // Rounded vertical bar
            const radius = 1.5;
            const topY = centerY - h / 2;
            ctx.beginPath();
            ctx.roundRect(x, topY, barWidth, Math.max(3, h), radius);
            ctx.fill();
          }

          // Draw the iconic red playhead needle (matching uploaded user references 1 & 4)
          const playheadX = (barCount - 12) * (barWidth + gap) + barWidth / 2;
          ctx.save();
          ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
          ctx.shadowBlur = 10;
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(playheadX, 4);
          ctx.lineTo(playheadX, height - 6);
          ctx.stroke();

          // Bottom red triangle pointer
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(playheadX - 4, height);
          ctx.lineTo(playheadX + 4, height);
          ctx.lineTo(playheadX, height - 6);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(updateBars);
    };

    animId = requestAnimationFrame(updateBars);
    return () => cancelAnimationFrame(animId);
  }, [state]);

  return (
    <div className="w-full max-w-md mx-auto px-4 my-2">
      {/* Outer Pill Container (inspired by reference image 1 & 4) */}
      <div className="relative rounded-3xl p-4 bg-dark-card/90 dark:bg-dark-card/90 light:bg-light-card border border-dark-border dark:border-dark-border light:border-light-border shadow-tactile-dark dark:shadow-tactile-dark light:shadow-tactile-light backdrop-blur-xl">
        {/* Top Info Bar */}
        <div className="flex items-center justify-between text-xs mb-3">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 relative">
              {state === 'recording' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  state === 'recording'
                    ? 'bg-red-500'
                    : state === 'paused'
                    ? 'bg-amber-400'
                    : 'bg-gray-400'
                }`}
              />
            </span>
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-gray-300 dark:text-gray-300 light:text-gray-700">
              {state === 'recording'
                ? t.recording
                : state === 'paused'
                ? t.paused
                : 'READY TO RECORD'}
            </span>
          </div>

          {/* Time display */}
          <div className="font-mono text-sm font-bold tracking-tight text-white dark:text-white light:text-gray-900">
            {formatTimePrecise(elapsedTime)}
          </div>
        </div>

        {/* Center Waveform Canvas */}
        <div className="relative w-full h-20 rounded-2xl bg-black/40 dark:bg-black/40 light:bg-gray-100 flex items-center justify-center overflow-hidden border border-white/5">
          <canvas
            ref={canvasRef}
            width={320}
            height={80}
            className="w-full h-full block"
          />
        </div>

        {/* Bottom Noise Reduction & Telemetry strip */}
        <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px]">
          <div className="flex items-center space-x-1.5 text-cyan-400 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {metrics.noiseReductionDb > 0
                ? `-${metrics.noiseReductionDb} ${t.dbReduced}`
                : `16 dB ${t.noiseReduction}`}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-gray-400 font-mono text-[10px]">
            <span className="flex items-center space-x-1">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>{metrics.latencyMs || 8.5}ms DSP</span>
            </span>
            {metrics.isVoiced && (
              <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-sans">
                Voice Detected
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
