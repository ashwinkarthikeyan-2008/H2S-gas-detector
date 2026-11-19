import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Modal, Button } from './ui';
import { api } from '../services/api';
import { DemoResetResponse } from '../types';

export interface ResetSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetSuccess?: (result: DemoResetResponse) => void;
}

export const ResetSimulationModal: React.FC<ResetSimulationModalProps> = ({
  isOpen,
  onClose,
  onResetSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DemoResetResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.resetDemo();
      setResult(res);
      if (onResetSuccess) {
        onResetSuccess(res);
      }
      // Broadcast global event so active pages can re-fetch
      window.dispatchEvent(new CustomEvent('chromaguard:simulation-reset', { detail: res }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear worker data.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center space-x-2 text-cyan-400">
          <RotateCcw className="w-5 h-5 text-cyan-glow" />
          <span>Clear Worker Data</span>
        </div>
      }
      subtitle="Remove worker accounts, profiles, exposure records, and alerts"
      footer={
        result ? (
          <Button variant="primary" size="sm" onClick={handleClose}>
            Done
          </Button>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="warning"
              size="sm"
              loading={loading}
              onClick={handleReset}
              iconLeft={<RotateCcw className="w-4 h-4" />}
            >
              Clear worker data
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-start space-x-3 text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold text-sm">Worker data cleared</p>
              <p className="text-xs text-slate-300">{result.message}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-xs">
            <div className="p-2.5 rounded-lg bg-midnight-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Zones retained</span>
              <strong className="text-cyan-400 text-sm">{result.zonesLoaded}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-midnight-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Shifts retained</span>
              <strong className="text-cyan-400 text-sm">{result.shiftsLoaded}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-midnight-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Worker profiles remaining</span>
              <strong className="text-cyan-400 text-sm">{result.workersLoaded}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-midnight-950 border border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-slate-400 block text-[10px]">Exposure records remaining</span>
              <strong className="text-teal-400 text-sm">{result.recordsLoaded}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-midnight-950 border border-slate-800 col-span-2 sm:col-span-2">
              <span className="text-slate-400 block text-[10px]">Alerts remaining</span>
              <strong className="text-amber-400 text-sm">{result.alertsLoaded}</strong>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300">
          <div className="p-3.5 rounded-xl bg-midnight-950 border border-amber-500/30 flex items-start space-x-3 text-amber-300">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs leading-relaxed">
              <strong className="font-semibold block mb-0.5">Clear worker data:</strong>
              This removes all registered worker accounts, profiles, exposure records, and alerts. Admin accounts and zone/shift choices used during registration remain.
            </div>
          </div>

          <p className="text-slate-400 leading-relaxed text-xs">
            New worker details appear in the Admin workspace after workers create their accounts.
          </p>

          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300">
              {error}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
