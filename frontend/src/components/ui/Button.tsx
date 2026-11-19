import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'warning' | 'ghost';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  iconLeft,
  iconRight,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles: Record<ButtonSize, string> = {
    xs: 'px-2.5 py-1 text-xs space-x-1.5',
    sm: 'px-3 py-1.5 text-xs space-x-2',
    md: 'px-4 py-2.5 text-sm space-x-2',
    lg: 'px-6 py-3.5 text-base space-x-2.5',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-gradient-to-r from-cyan-500 to-teal-accent text-midnight-950 font-bold shadow-glow-cyan hover:opacity-95 hover:shadow-cyan-500/40',
    secondary:
      'bg-midnight-850 hover:bg-midnight-800 text-slate-200 border border-slate-700/80 hover:border-cyan-500/40 shadow-sm',
    outline:
      'bg-transparent hover:bg-cyan-500/10 text-cyan-400 border border-cyan-500/40 hover:border-cyan-400 shadow-sm',
    danger:
      'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-glow-red',
    warning:
      'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-midnight-950 font-bold shadow-glow-amber',
    ghost:
      'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {iconLeft && <span className="flex-shrink-0">{iconLeft}</span>}
          <span>{children}</span>
          {iconRight && <span className="flex-shrink-0">{iconRight}</span>}
        </>
      )}
    </button>
  );
};
