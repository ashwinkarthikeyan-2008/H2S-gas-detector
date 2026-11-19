import React from 'react';
import { FilterX } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Telemetry Records Found',
  description = 'No matching records found for the current query or filter criteria. Try adjusting date ranges, industrial zones, or operational shifts.',
  icon,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl border border-slate-800/80 bg-gradient-to-br from-midnight-900/60 to-midnight-950/80 backdrop-blur-xl p-8 text-center flex flex-col items-center justify-center space-y-4 shadow-card-surface ${className}`}
    >
      <div className="relative">
        {/* Subtle pulsing background ring */}
        <div className="absolute inset-0 rounded-2xl bg-cyan-500/10 blur-xl animate-pulse" />
        <div className="relative w-14 h-14 rounded-2xl bg-midnight-850/90 border border-slate-700/80 flex items-center justify-center text-slate-400 shadow-inner">
          {icon || <FilterX className="w-6 h-6 text-cyan-400" />}
        </div>
      </div>

      <div className="max-w-md space-y-1">
        <h4 className="text-sm sm:text-base font-semibold text-white tracking-tight">{title}</h4>
        <p className="text-xs text-slate-400 leading-relaxed font-sans">{description}</p>
      </div>

      {actionText && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction} className="mt-2">
          {actionText}
        </Button>
      )}
    </div>
  );
};
