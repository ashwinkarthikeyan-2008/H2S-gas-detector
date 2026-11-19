import React from 'react';

export type CardVariant = 'default' | 'cyan' | 'teal' | 'warning' | 'critical' | 'elevated';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: CardVariant;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<CardProps> = ({
  children,
  variant = 'default',
  title,
  subtitle,
  badge,
  action,
  footer,
  hoverEffect = true,
  className = '',
  ...props
}) => {
  const variantStyles: Record<CardVariant, string> = {
    default:
      'bg-gradient-to-br from-midnight-900/85 to-midnight-950/90 border-slate-800/80 shadow-card-surface hover:border-cyan-500/35 hover:shadow-glow-cyan-sm/20',
    cyan:
      'bg-gradient-to-br from-midnight-900/90 to-midnight-950/95 border-cyan-500/35 shadow-glow-cyan-sm/25 hover:border-cyan-400/50',
    teal:
      'bg-gradient-to-br from-midnight-900/90 to-midnight-950/95 border-teal-500/35 shadow-glow-teal/20 hover:border-teal-400/50',
    warning:
      'bg-gradient-to-br from-midnight-900/90 to-amber-950/30 border-amber-500/30 shadow-glow-amber/15 hover:border-amber-400/50',
    critical:
      'bg-gradient-to-br from-midnight-900/90 to-rose-950/30 border-rose-500/30 shadow-glow-red/20 hover:border-rose-400/50',
    elevated:
      'bg-gradient-to-br from-midnight-850/95 to-midnight-900/95 border-slate-700/80 shadow-glass hover:border-cyan-400/40',
  };

  const hoverClass = hoverEffect
    ? 'transition-all duration-200 ease-out hover:-translate-y-0.5'
    : '';

  const hasHeader = title || subtitle || badge || action;

  return (
    <div
      className={`rounded-2xl border backdrop-blur-xl ${variantStyles[variant]} ${hoverClass} ${className}`}
      {...props}
    >
      {hasHeader && (
        <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              {title && <h3 className="text-sm font-semibold text-white tracking-tight">{title}</h3>}
              {badge}
            </div>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}

      <div className="p-5">{children}</div>

      {footer && (
        <div className="px-5 py-3 border-t border-slate-800/80 bg-midnight-950/50 rounded-b-2xl">
          {footer}
        </div>
      )}
    </div>
  );
};

export const Card = GlassCard;
