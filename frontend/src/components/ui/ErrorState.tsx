import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | unknown;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Telemetry Transmission Error',
  message = 'An unexpected condition occurred while communicating with the ChromaGuard simulation backend.',
  error,
  onRetry,
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const errorMessage =
    error instanceof Error ? error.message : error ? String(error) : null;

  return (
    <div
      className={`rounded-2xl border border-rose-500/25 bg-gradient-to-br from-midnight-900/80 to-rose-950/25 backdrop-blur-xl p-6 space-y-4 shadow-card-surface ${className}`}
    >
      <div className="flex items-start space-x-3.5">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-300 flex-shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="text-sm font-semibold text-rose-200 tracking-tight">{title}</h4>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">{message}</p>
        </div>
      </div>

      {onRetry && (
        <div className="flex items-center space-x-3 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            iconLeft={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry Request
          </Button>

          {errorMessage && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-slate-400 hover:text-cyan-300 flex items-center space-x-1 font-mono transition"
            >
              <span>{showDetails ? 'Hide Diagnostics' : 'Show Diagnostics'}</span>
              {showDetails ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      )}

      {showDetails && errorMessage && (
        <div className="p-3.5 rounded-xl bg-midnight-950/90 border border-rose-500/20 font-mono text-[11px] text-rose-300/90 overflow-x-auto whitespace-pre-wrap leading-relaxed">
          {errorMessage}
        </div>
      )}
    </div>
  );
};
