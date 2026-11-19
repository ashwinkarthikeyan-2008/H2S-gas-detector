import React from 'react';
import { DemoStatus, RiskTier } from '../../types';

export interface StatusBadgeProps {
  status: DemoStatus | RiskTier | string;
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  pulse = false,
  className = '',
}) => {
  const normalized = (status || '').toUpperCase();

  // Restrained, professional industrial indicators
  let styles = 'bg-slate-900/80 text-slate-300 border-slate-700/80';
  let dotColor = 'bg-slate-400';

  if (normalized === 'NORMAL' || normalized === 'LOW') {
    styles = 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30';
    dotColor = 'bg-emerald-400';
  } else if (normalized === 'ELEVATED' || normalized === 'MEDIUM') {
    styles = 'bg-cyan-950/40 text-cyan-300 border-cyan-500/35 shadow-glow-cyan-sm/20';
    dotColor = 'bg-cyan-400';
  } else if (normalized === 'WARNING' || normalized === 'HIGH') {
    // Restrained amber
    styles = 'bg-amber-950/35 text-amber-200 border-amber-500/30';
    dotColor = 'bg-amber-400';
  } else if (normalized === 'CRITICAL') {
    // Restrained crimson
    styles = 'bg-rose-950/40 text-rose-200 border-rose-500/35';
    dotColor = 'bg-rose-500';
  }

  const sizeStyles =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px] space-x-1.5'
      : 'px-2.5 py-1 text-xs space-x-2';

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded-full border backdrop-blur-md ${sizeStyles} ${styles} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${dotColor} ${
          pulse || normalized === 'CRITICAL' || normalized === 'WARNING' ? 'animate-pulse' : ''
        }`}
      />
      <span className="tracking-wide">{normalized}</span>
    </span>
  );
};
