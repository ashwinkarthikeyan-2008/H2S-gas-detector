import React from 'react';
import { GlassCard } from './Card';
import { Skeleton } from './Skeleton';

export interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconColor?: 'cyan' | 'teal' | 'amber' | 'rose' | 'emerald';
  trend?: {
    value: string;
    positive?: boolean;
    label?: string;
  };
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon,
  iconColor = 'cyan',
  trend,
  loading = false,
  className = '',
  onClick,
}) => {
  const iconColorMap = {
    cyan: 'bg-cyan-500/12 border-cyan-400/35 text-cyan-glow shadow-glow-cyan-sm',
    teal: 'bg-teal-500/12 border-teal-400/35 text-teal-300 shadow-glow-teal/20',
    amber: 'bg-amber-500/12 border-amber-400/35 text-amber-300 shadow-glow-amber/20',
    rose: 'bg-rose-500/12 border-rose-400/35 text-rose-300 shadow-glow-red/20',
    emerald: 'bg-emerald-500/12 border-emerald-400/35 text-emerald-300 shadow-sm',
  };

  const ambientGlowMap = {
    cyan: 'from-cyan-500/8',
    teal: 'from-teal-500/8',
    amber: 'from-amber-500/8',
    rose: 'from-rose-500/8',
    emerald: 'from-emerald-500/8',
  };

  if (loading) {
    return (
      <div className={`p-5 rounded-2xl bg-midnight-900/70 border border-slate-800 space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-3 w-36" />
      </div>
    );
  }

  return (
    <GlassCard
      className={`relative overflow-hidden cursor-pointer select-none group ${className}`}
      onClick={onClick}
      hoverEffect={true}
    >
      {/* Ambient Radial Spotlight inside the card corner */}
      <div
        className={`absolute -right-8 -top-8 w-36 h-36 rounded-full bg-gradient-to-br ${ambientGlowMap[iconColor]} to-transparent blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-300`}
      />

      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase font-mono">{title}</p>
          <div className="flex items-baseline space-x-1.5 pt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
              {value}
            </span>
            {unit && <span className="text-xs text-slate-400 font-mono font-medium">{unit}</span>}
          </div>
        </div>

        <div
          className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${iconColorMap[iconColor]}`}
        >
          {icon}
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] relative z-10">
          {subtitle && <span className="text-slate-400 truncate font-sans">{subtitle}</span>}
          {trend && (
            <span
              className={`font-mono font-medium ml-auto ${
                trend.positive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {trend.value} {trend.label && <span className="text-slate-400 font-normal">({trend.label})</span>}
            </span>
          )}
        </div>
      )}
    </GlassCard>
  );
};
