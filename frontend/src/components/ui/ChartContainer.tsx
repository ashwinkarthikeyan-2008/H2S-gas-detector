import React, { useState } from 'react';
import { Maximize2, Minimize2, RefreshCw, Info, Download } from 'lucide-react';
import { GlassCard } from './Card';
import { SkeletonChart } from './Skeleton';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';

export interface ChartContainerProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  infoTooltip?: string;
  loading?: boolean;
  error?: Error | unknown;
  isEmpty?: boolean;
  emptyMessage?: string;
  onRefresh?: () => void;
  onExportCsv?: () => void;
  children: React.ReactNode;
  heightClass?: string;
  className?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  badge,
  infoTooltip,
  loading = false,
  error,
  isEmpty = false,
  emptyMessage = 'No chart points available for selected filter range.',
  onRefresh,
  onExportCsv,
  children,
  heightClass = 'h-72',
  className = '',
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  React.useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const containerClasses = isFullscreen
    ? 'fixed inset-4 md:inset-8 z-50 bg-midnight-950/98 border border-cyan-500/50 p-6 flex flex-col backdrop-blur-3xl shadow-2xl rounded-3xl'
    : className;

  return (
    <GlassCard className={`relative flex flex-col ${containerClasses}`}>
      {/* Header bar */}
      <div className="flex items-start justify-between gap-4 pb-3 mb-2 border-b border-slate-800/80">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight">{title}</h3>
            {badge}
            {infoTooltip && (
              <div className="relative">
                <button
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={() => setShowTooltip(!showTooltip)}
                  className="text-slate-400 hover:text-cyan-400 transition"
                  aria-label="Chart information"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
                {showTooltip && (
                  <div className="absolute left-0 bottom-full mb-2 w-64 p-2.5 rounded-xl bg-midnight-950 border border-cyan-500/30 text-[11px] text-slate-300 shadow-2xl z-20">
                    {infoTooltip}
                  </div>
                )}
              </div>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center space-x-1.5 flex-shrink-0">
          {onExportCsv && (
            <button
              onClick={onExportCsv}
              className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-cyan-400 border border-slate-700/60 transition"
              title="Export Chart Data"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-cyan-400 border border-slate-700/60 transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          )}

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-cyan-400 border border-slate-700/60 transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className={`relative flex-1 ${isFullscreen ? 'h-full' : heightClass}`}>
        {loading ? (
          <SkeletonChart height="h-full" />
        ) : error ? (
          <div className="h-full flex items-center justify-center p-4">
            <ErrorState
              title="Chart Rendering Error"
              error={error}
              onRetry={onRefresh}
              className="w-full"
            />
          </div>
        ) : isEmpty ? (
          <div className="h-full flex items-center justify-center">
            <EmptyState description={emptyMessage} onAction={onRefresh} actionText="Reload" />
          </div>
        ) : (
          children
        )}
      </div>
    </GlassCard>
  );
};
