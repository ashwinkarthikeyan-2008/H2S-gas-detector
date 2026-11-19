import React, { useEffect, useState } from 'react';
import { Filter, RotateCcw, Calendar, MapPin, Clock, ShieldAlert, Sparkles, User } from 'lucide-react';
import { FilterState, IndustrialZone, Shift, WorkerSummary } from '../types';
import { api } from '../services/api';

interface FilterBarProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
  showStatusFilter?: boolean;
  lockedWorkerId?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChange,
  showStatusFilter = true,
  lockedWorkerId,
}) => {
  const [zones, setZones] = useState<IndustrialZone[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [workers, setWorkers] = useState<WorkerSummary[]>([]);

  useEffect(() => {
    api.getZones().then(setZones).catch(console.error);
    api.getShifts().then(setShifts).catch(console.error);
    api.getWorkers().then(setWorkers).catch(console.error);
  }, []);

  const handleFieldChange = (key: keyof FilterState, val: string) => {
    onChange({
      ...filters,
      [key]: val,
    });
  };

  const handleReset = () => {
    onChange({
      startDate: '',
      endDate: '',
      zoneId: '',
      shiftId: '',
      workerId: lockedWorkerId || '',
      demoStatus: '',
    });
  };

  const activeCount = Object.values(filters).filter((v) => v !== '').length;

  return (
    <div className="rounded-2xl p-4 sm:p-5 mb-6 border border-cyan-500/20 bg-gradient-to-br from-midnight-900/85 via-midnight-900/90 to-midnight-950/95 backdrop-blur-xl shadow-card-surface">
      {/* Header & Quick Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-glow shadow-glow-cyan-sm">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-white tracking-wider uppercase font-mono">
            Telemetry Filters
          </span>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              {activeCount} active
            </span>
          )}
        </div>

        {/* Quick presets and reset */}
        <div className="flex items-center space-x-2">
          {activeCount > 0 && (
            <button
              onClick={handleReset}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-midnight-850 hover:bg-slate-800 text-xs text-slate-300 hover:text-cyan-300 border border-slate-700/80 transition shadow-sm font-mono"
            >
              <RotateCcw className="w-3 h-3 text-cyan-400" />
              <span>Reset All</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Inputs Grid (6 Filters: Date From, Date To, Zone, Shift, Worker, Status) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-3.5">
        {/* Date Start */}
        <div className="relative">
          <label className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center space-x-1 font-mono">
            <Calendar className="w-3 h-3 text-cyan-400" />
            <span>From Date</span>
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFieldChange('startDate', e.target.value)}
            className="w-full bg-midnight-950/90 border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/80 focus:ring-1 focus:ring-cyan-400/50 transition font-mono"
          />
        </div>

        {/* Date End */}
        <div className="relative">
          <label className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center space-x-1 font-mono">
            <Calendar className="w-3 h-3 text-cyan-400" />
            <span>To Date</span>
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFieldChange('endDate', e.target.value)}
            className="w-full bg-midnight-950/90 border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/80 focus:ring-1 focus:ring-cyan-400/50 transition font-mono"
          />
        </div>

        {/* Zone Selector */}
        <div className="relative">
          <label className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center space-x-1 font-mono">
            <MapPin className="w-3 h-3 text-teal-400" />
            <span>Industrial Zone</span>
          </label>
          <select
            value={filters.zoneId}
            onChange={(e) => handleFieldChange('zoneId', e.target.value)}
            className="w-full bg-midnight-950/90 border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/80 focus:ring-1 focus:ring-cyan-400/50 transition font-mono"
          >
            <option value="">All Zones</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.zoneCode} - {z.zoneName}
              </option>
            ))}
          </select>
        </div>

        {/* Shift Selector */}
        <div className="relative">
          <label className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center space-x-1 font-mono">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Shift</span>
          </label>
          <select
            value={filters.shiftId}
            onChange={(e) => handleFieldChange('shiftId', e.target.value)}
            className="w-full bg-midnight-950/90 border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/80 focus:ring-1 focus:ring-cyan-400/50 transition font-mono"
          >
            <option value="">All Shifts</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.shiftName}
              </option>
            ))}
          </select>
        </div>

        {/* Worker Selector */}
        {!lockedWorkerId && <div className="relative">
          <label className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center space-x-1 font-mono">
            <User className="w-3 h-3 text-cyan-400" />
            <span>Worker</span>
          </label>
          <select
            value={filters.workerId}
            onChange={(e) => handleFieldChange('workerId', e.target.value)}
            className="w-full bg-midnight-950/90 border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/80 focus:ring-1 focus:ring-cyan-400/50 transition font-mono"
          >
            <option value="">All Workers ({workers.length})</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.badgeId} - {w.syntheticName}
              </option>
            ))}
          </select>
        </div>}

        {/* Status Filter */}
        {showStatusFilter && (
          <div className="relative">
            <label className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center space-x-1 font-mono">
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              <span>Status Level</span>
            </label>
            <select
              value={filters.demoStatus}
              onChange={(e) => handleFieldChange('demoStatus', e.target.value)}
              className="w-full bg-midnight-950/90 border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/80 focus:ring-1 focus:ring-cyan-400/50 transition font-mono"
            >
              <option value="">All Status Levels</option>
              <option value="NORMAL">Normal (&lt; 8 ppm·hr)</option>
              <option value="ELEVATED">Elevated (8-14.9)</option>
              <option value="WARNING">Warning (15-19.9)</option>
              <option value="CRITICAL">Critical (≥ 20)</option>
            </select>
          </div>
        )}
      </div>

      {/* Quick Filter Presets Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-3 mt-3 border-t border-slate-800/80 text-xs">
        <span className="text-[11px] text-slate-300 font-mono flex items-center space-x-1 mr-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Presets:</span>
        </span>

        <button
          onClick={() => onChange({ ...filters, demoStatus: 'CRITICAL' })}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium border transition ${
            filters.demoStatus === 'CRITICAL'
              ? 'bg-rose-950/70 text-rose-200 border-rose-500/60 shadow-glow-red/20'
              : 'bg-midnight-950/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          Critical Incidents
        </button>

        <button
          onClick={() => onChange({ ...filters, demoStatus: 'WARNING' })}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium border transition ${
            filters.demoStatus === 'WARNING'
              ? 'bg-amber-950/70 text-amber-200 border-amber-500/60 shadow-glow-amber/20'
              : 'bg-midnight-950/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          Warning Tier
        </button>

        <button
          onClick={() => onChange({ ...filters, zoneId: 'ZONE-04' })}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium border transition ${
            filters.zoneId === 'ZONE-04'
              ? 'bg-teal-950/70 text-teal-200 border-teal-500/60 shadow-glow-cyan-sm/20'
              : 'bg-midnight-950/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          Zone 4 (Desulfurization)
        </button>

        <button
          onClick={() =>
            onChange({
              ...filters,
              startDate: '2026-09-01',
              endDate: '2026-09-10',
            })
          }
          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium border transition ${
            filters.startDate === '2026-09-01' && filters.endDate === '2026-09-10'
              ? 'bg-cyan-950/70 text-cyan-200 border-cyan-500/60 shadow-glow-cyan-sm/20'
              : 'bg-midnight-950/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          First 10 Days
        </button>

        <button
          onClick={() =>
            onChange({
              ...filters,
              startDate: '2026-09-11',
              endDate: '2026-09-20',
            })
          }
          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium border transition ${
            filters.startDate === '2026-09-11' && filters.endDate === '2026-09-20'
              ? 'bg-cyan-950/70 text-cyan-200 border-cyan-500/60 shadow-glow-cyan-sm/20'
              : 'bg-midnight-950/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          Second 10 Days
        </button>
      </div>
    </div>
  );
};
