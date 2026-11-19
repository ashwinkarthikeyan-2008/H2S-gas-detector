import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidthClass = 'max-w-xl',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-midnight-950/80 backdrop-blur-md transition-opacity animate-in fade-in"
      />

      {/* Dialog box */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${maxWidthClass} rounded-2xl bg-midnight-900 border border-cyan-500/30 shadow-2xl overflow-hidden z-10 transition-all`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="space-y-1">
            {title && <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto text-slate-300 text-xs sm:text-sm">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-3.5 border-t border-slate-800 bg-midnight-950/60 flex items-center justify-end space-x-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
