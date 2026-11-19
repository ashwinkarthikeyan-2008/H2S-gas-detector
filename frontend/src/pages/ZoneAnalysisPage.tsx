import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Factory,
  ShieldAlert,
  Flame,
  AlertTriangle,
  Activity,
  Layers,
  MapPin,
  TrendingUp,
  BarChart2,
  Users,
  Download,
  ExternalLink,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { api, downloadFile } from '../services/api';
import { IndustrialZone, ZoneComparison, WorkerSummary, FilterState, ZoneDetail } from '../types';
import { EChartWrapper } from '../components/EChartWrapper';
import { FilterBar } from '../components/FilterBar';
import { Button, StatusBadge, Skeleton } from '../components/ui';

export const ZoneAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [zones, setZones] = useState<IndustrialZone[]>([]);
  const [zoneComparison, setZoneComparison] = useState<ZoneComparison[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>(() => searchParams.get('zoneId') || 'ZONE-04');
  const [zoneDetail, setZoneDetail] = useState<ZoneDetail | null>(null);
  const [stationedWorkers, setStationedWorkers] = useState<WorkerSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [workersLoading, setWorkersLoading] = useState<boolean>(false);

  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    zoneId: '',
    shiftId: '',
    workerId: '',
    demoStatus: '',
  });

  // Initial load for zones metadata
  useEffect(() => {
    api.getZones()
      .then((zList) => {
        setZones(zList);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const requestedZone = searchParams.get('zoneId');
    if (requestedZone) setSelectedZoneId(requestedZone);
  }, [searchParams]);

  // Fetch zone comparison metrics when filters change
  useEffect(() => {
    setLoading(true);
    api.getZoneComparison(filters)
      .then((zComp) => {
        setZoneComparison(zComp);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters]);

  // Fetch zone detail and stationed personnel whenever selectedZoneId or filters.shiftId change
  useEffect(() => {
    if (!selectedZoneId) return;
    setWorkersLoading(true);
    api.getZoneDetail(selectedZoneId)
      .then((detail) => setZoneDetail(detail))
      .catch(console.error);

    api.getWorkers('', selectedZoneId, filters.shiftId)
      .then((workers) => {
        setStationedWorkers(workers);
      })
      .catch(console.error)
      .finally(() => setWorkersLoading(false));
  }, [selectedZoneId, filters.shiftId]);

  // Listen to simulation reset events
  useEffect(() => {
    const handleReset = () => {
      api.getZoneComparison(filters).then(setZoneComparison).catch(console.error);
      if (selectedZoneId) {
        api.getZoneDetail(selectedZoneId).then(setZoneDetail).catch(console.error);
        api.getWorkers('', selectedZoneId, filters.shiftId).then(setStationedWorkers).catch(console.error);
      }
    };
    window.addEventListener('chromaguard:simulation-reset', handleReset);
    return () => window.removeEventListener('chromaguard:simulation-reset', handleReset);
  }, [filters, selectedZoneId]);

  const selectedZone = zones.find((z) => z.id === selectedZoneId) || zones[0];
  const selectedZoneMetrics = zoneComparison.find((z) => z.zoneId === selectedZoneId);

  const getRiskBadge = (tier: string) => {
    switch (tier) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            CRITICAL RISK
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            HIGH RISK
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            MEDIUM RISK
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            LOW RISK
          </span>
        );
    }
  };

  const handleExportZoneCsv = () => {
    const exportUrl = api.getExportCsvUrl({
      ...filters,
      zoneId: selectedZoneId,
    });
    void downloadFile(exportUrl);
  };

  const comparisonChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0E1626',
      borderColor: '#00F0FF',
      textStyle: { color: '#F8FAFC' },
    },
    legend: {
      data: ['Observed Mean', 'Baseline Target', 'Max Peak'],
      textStyle: { color: '#94A3B8' },
      top: 0,
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: zoneComparison.map((z) => z.zoneName),
      axisLabel: { color: '#94A3B8', interval: 0, rotate: 15, fontSize: 11 },
      axisLine: { lineStyle: { color: '#334155' } },
    },
    yAxis: {
      type: 'value',
      name: 'ppm·hr',
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: '#94A3B8' },
    },
    series: [
      {
        name: 'Observed Mean',
        type: 'bar',
        data: zoneComparison.map((z) => z.avgExposurePpmHr),
        itemStyle: { color: '#00F0FF', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: 'Baseline Target',
        type: 'bar',
        data: zoneComparison.map((z) => z.baselineExposure),
        itemStyle: { color: '#475569', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: 'Max Peak',
        type: 'line',
        data: zoneComparison.map((z) => z.maxExposurePpmHr),
        itemStyle: { color: '#EF4444' },
        lineStyle: { width: 2, type: 'dashed' },
      },
    ],
  }), [zoneComparison]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/30 text-xs font-mono text-cyan-400 mb-2">
            <Factory className="w-3.5 h-3.5 text-cyan-glow" />
            <span>FACILITY DOSIMETRY DIVISION</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Industrial Zone Analysis</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Unit-by-unit comparative dosimetry profiling across the 5 refinery operational sections. Analyze
            environmental gas accumulation, baseline engineering targets, and stationed personnel rosters.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportZoneCsv}
            iconLeft={<Download className="w-3.5 h-3.5" />}
          >
            Export Zone CSV ({selectedZone?.zoneCode || 'Zone'})
          </Button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* 5 Zone Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {zones.map((zone) => {
          const comp = zoneComparison.find((c) => c.zoneId === zone.id);
          const isSelected = zone.id === selectedZoneId;

          return (
            <div
              key={zone.id}
              onClick={() => setSelectedZoneId(zone.id)}
              className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                isSelected
                  ? 'bg-midnight-850 border-cyan-400 shadow-glow-cyan'
                  : 'bg-midnight-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-cyan-400">{zone.zoneCode}</span>
                {getRiskBadge(zone.riskTier)}
              </div>
              <h4 className="text-xs font-semibold text-white line-clamp-1">{zone.zoneName}</h4>
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between font-mono text-[11px]">
                <span className="text-slate-400">Mean:</span>
                <span className="text-cyan-300 font-bold">
                  {comp ? `${comp.avgExposurePpmHr.toFixed(1)} ppm·hr` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px] mt-1">
                <span className="text-slate-400">Alerts:</span>
                <span className={comp && comp.alertCount > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                  {comp ? comp.alertCount : 0} events
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Zone Deep Dive */}
      {selectedZone && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6 shadow-glass">
          {/* Header & KPI Summary */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold text-white">{selectedZone.zoneName}</h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-midnight-950 text-cyan-400 border border-cyan-500/30">
                  {selectedZone.zoneCode} ({selectedZone.id})
                </span>
                {getRiskBadge(selectedZone.riskTier)}
              </div>
              <p className="text-xs text-slate-400 mt-1.5 max-w-2xl">{selectedZone.description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-midnight-950 border border-slate-800 text-center min-w-[95px]">
                <p className="text-[10px] text-slate-500">Baseline Target</p>
                <p className="text-sm font-bold text-slate-300 mt-0.5">{selectedZone.baselineExposurePpmHr} ppm·hr</p>
              </div>
              <div className="p-2.5 rounded-xl bg-midnight-950 border border-slate-800 text-center min-w-[95px]">
                <p className="text-[10px] text-slate-500">Observed Mean</p>
                <p className="text-sm font-bold text-cyan-glow mt-0.5">
                  {selectedZoneMetrics?.avgExposurePpmHr !== undefined
                    ? `${selectedZoneMetrics.avgExposurePpmHr.toFixed(2)} ppm·hr`
                    : '—'}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-midnight-950 border border-slate-800 text-center min-w-[95px]">
                <p className="text-[10px] text-slate-500">Peak Observed</p>
                <p className="text-sm font-bold text-rose-400 mt-0.5">
                  {selectedZoneMetrics?.maxExposurePpmHr !== undefined
                    ? `${selectedZoneMetrics.maxExposurePpmHr.toFixed(1)} ppm·hr`
                    : '—'}
                </p>
              </div>
              {zoneDetail && (
                <>
                  <div className="p-2.5 rounded-xl bg-midnight-950 border border-slate-800 text-center min-w-[95px]">
                    <p className="text-[10px] text-slate-500">Baseline Variance</p>
                    <p className={`text-sm font-bold mt-0.5 ${zoneDetail.baselineExcessPercentage > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {zoneDetail.baselineExcessPercentage > 0 ? `+${zoneDetail.baselineExcessPercentage.toFixed(1)}%` : `${zoneDetail.baselineExcessPercentage.toFixed(1)}%`}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-midnight-950 border border-slate-800 text-center min-w-[95px]">
                    <p className="text-[10px] text-slate-500">Telemetry Logs</p>
                    <p className="text-sm font-bold text-cyan-300 mt-0.5">
                      {zoneDetail.totalExposureRecords}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Comparative Bar Chart across all 5 zones */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Cross-Zone Exposure Benchmarking (Mean vs Baseline Target vs Peak)
                </h4>
              </div>
              <span className="text-[11px] font-mono text-slate-400">5 Operational Units</span>
            </div>
            <EChartWrapper options={comparisonChartOption} height="280px" loading={loading} />
          </div>

          {/* Stationed Personnel Roster */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-teal-400" />
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Stationed Personnel Roster ({selectedZone.zoneCode})
                </h4>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {stationedWorkers.length} Active Personnel Assigned
              </span>
            </div>

            {workersLoading ? (
              <div className="space-y-2 py-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : stationedWorkers.length === 0 ? (
              <div className="py-8 text-center bg-midnight-950/40 rounded-xl border border-slate-800/80">
                <p className="text-xs text-slate-400">
                  No personnel currently stationed in {selectedZone.zoneName} matching active shift filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-midnight-950 text-slate-400 text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Badge ID</th>
                      <th className="py-2.5 px-3 font-sans">Worker Name</th>
                      <th className="py-2.5 px-3 font-sans">Operational Role</th>
                      <th className="py-2.5 px-3 font-sans">Preferred Shift</th>
                      <th className="py-2.5 px-3 text-right">Mean (ppm·hr)</th>
                      <th className="py-2.5 px-3 text-right">Peak (ppm·hr)</th>
                      <th className="py-2.5 px-3 text-center">Telemetry Records</th>
                      <th className="py-2.5 px-3 font-sans text-center">Status</th>
                      <th className="py-2.5 px-3 text-right font-sans">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-[11px]">
                    {stationedWorkers.map((worker) => (
                      <tr key={worker.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3 text-cyan-400 font-bold">{worker.badgeId}</td>
                        <td className="py-2.5 px-3 font-sans font-medium text-white">
                          {worker.syntheticName}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-300">{worker.role}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-400">
                          {worker.preferredShiftName || 'Standard'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-cyan-300 font-semibold">
                          {worker.avgExposurePpmHr ? worker.avgExposurePpmHr.toFixed(2) : '0.00'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-rose-400 font-semibold">
                          {worker.maxExposurePpmHr ? worker.maxExposurePpmHr.toFixed(1) : '0.0'}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-400">{worker.totalRecords}</td>
                        <td className="py-2.5 px-3 text-center">
                          <StatusBadge status={worker.latestDemoStatus} size="sm" />
                        </td>
                        <td className="py-2.5 px-3 text-right font-sans">
                          <button
                            onClick={() => navigate(`/workers?workerId=${worker.id}`)}
                            className="inline-flex items-center space-x-1 text-xs text-cyan-400 hover:text-cyan-200 transition"
                            title="Inspect worker telemetry profile"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
