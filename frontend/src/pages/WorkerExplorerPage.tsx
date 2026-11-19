import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  ChevronRight,
  X,
  ShieldAlert,
  Clock,
  Award,
  Calendar,
  AlertTriangle,
  Flame,
  CheckCircle2,
  TrendingUp,
  Activity,
  FileSpreadsheet,
  Download,
  Printer,
  Layers,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { api, downloadFile } from '../services/api';
import { WorkerSummary, WorkerDetail, IndustrialZone, Shift } from '../types';
import { EChartWrapper } from '../components/EChartWrapper';
import { StatusBadge, Button, EmptyState } from '../components/ui';

export const WorkerExplorerPage: React.FC = () => {

  // Reference data
  const [zones, setZones] = useState<IndustrialZone[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  // Workers state
  const [workers, setWorkers] = useState<WorkerSummary[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState<boolean>(true);

  // Workers Filters & Search
  const [workerSearch, setWorkerSearch] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<string>('');
  const [workerSortField, setWorkerSortField] = useState<keyof WorkerSummary>('id');
  const [workerSortAsc, setWorkerSortAsc] = useState<boolean>(true);
  const [workerPage, setWorkerPage] = useState<number>(1);
  const workerPageSize = 10;

  // Selected Worker for Detail Modal
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [workerDetail, setWorkerDetail] = useState<WorkerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);


  useEffect(() => {
    Promise.all([api.getZones(), api.getShifts()])
      .then(([zRes, sRes]) => {
        setZones(zRes);
        setShifts(sRes);
      })
      .catch(console.error);
  }, []);

  const loadWorkers = () => {
    setLoadingWorkers(true);
    api.getWorkers(workerSearch, selectedZone, selectedShift)
      .then((data) => {
        setWorkers(data);
        setWorkerPage(1);
      })
      .catch(console.error)
      .finally(() => setLoadingWorkers(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadWorkers();
    }, 200);
    return () => clearTimeout(timer);
  }, [workerSearch, selectedZone, selectedShift]);


  // Load Worker Detail
  const handleSelectWorker = async (id: string) => {
    setSelectedWorkerId(id);
    setDetailLoading(true);
    try {
      const detail = await api.getWorkerDetail(id);
      setWorkerDetail(detail);
    } catch (err) {
      console.error('Failed to load worker detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Reset Worker Filters
  const handleResetWorkerFilters = () => {
    setWorkerSearch('');
    setSelectedZone('');
    setSelectedShift('');
    setWorkerPage(1);
  };

  const exportWorkerProfilePdf = () => {
    document.body.classList.add('dashboard-print-mode');
    const cleanup = () => document.body.classList.remove('dashboard-print-mode');
    window.addEventListener('afterprint', cleanup, { once: true });
    window.setTimeout(() => { window.print(); window.setTimeout(cleanup, 1000); }, 100);
  };

  // Export Workers Directory to CSV
  const handleExportWorkersCsv = () => {
    const csvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const headers = [
      'worker_id',
      'synthetic_name',
      'role',
      'experience_years',
      'preferred_shift_id',
      'preferred_shift_name',
      'badge_id',
      'total_records',
      'avg_exposure_ppm_hr',
      'max_exposure_ppm_hr',
      'latest_demo_status',
    ];

    const rows = sortedWorkers.map((w) => [
      w.id,
      w.syntheticName,
      w.role,
      w.experienceYears,
      w.preferredShiftId,
      w.preferredShiftName,
      w.badgeId,
      w.totalRecords,
      w.avgExposurePpmHr.toFixed(2),
      w.maxExposurePpmHr.toFixed(2),
      w.latestDemoStatus,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'chromaguard_workers_directory.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Worker Sorting & Pagination
  const handleWorkerSort = (field: keyof WorkerSummary) => {
    if (workerSortField === field) {
      setWorkerSortAsc(!workerSortAsc);
    } else {
      setWorkerSortField(field);
      setWorkerSortAsc(true);
    }
  };

  const sortedWorkers = [...workers].sort((a, b) => {
    const valA = a[workerSortField];
    const valB = b[workerSortField];
    if (typeof valA === 'number' && typeof valB === 'number') {
      return workerSortAsc ? valA - valB : valB - valA;
    }
    return workerSortAsc
      ? String(valA ?? '').localeCompare(String(valB ?? ''))
      : String(valB ?? '').localeCompare(String(valA ?? ''));
  });

  const totalWorkerPages = Math.ceil(sortedWorkers.length / workerPageSize) || 1;
  const paginatedWorkers = sortedWorkers.slice(
    (workerPage - 1) * workerPageSize,
    workerPage * workerPageSize
  );
        <div className="flex items-center gap-3 self-start rounded-2xl border border-white/10 bg-midnight-900/60 p-2 sm:self-center">
          <div className="hidden px-2 sm:block"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Directory export</p><p className="mt-0.5 text-xs text-slate-300">Current filters · Excel-ready CSV</p></div>
          <button type="button" onClick={handleExportWorkersCsv} className="flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-4 py-2.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/25" title="Download the visible, sorted worker directory as CSV"><Download className="h-4 w-4" /><span>Export workers CSV</span></button>
        </div>
  return (
    <div className="workspace-page worker-directory-page space-y-6">
      {/* Title & Navigation Tabs */}
      <div className="workspace-hero flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl p-6 md:p-7">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Personnel &amp; Exposure Explorer</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono tracking-wider">
              {workers.length} WORKERS IN VIEW
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Search and review registered worker details and individual exposure history.
          </p>
        </div>
        <button type="button" onClick={handleExportWorkersCsv} className="worker-directory-export-button" title="Download the current worker list as CSV"><Download className="h-4 w-4"/><span>Export list CSV</span></button>
      </div>

      {/* TAB 1: WORKERS DIRECTORY VIEW */}
        <div className="space-y-4">
          <section aria-label="Worker directory summary" className="grid gap-3 sm:grid-cols-3">
            <article className="workspace-panel worker-directory-summary"><span>Workers shown</span><strong>{workers.length}</strong><small>Current search and filters</small></article>
            <article className="workspace-panel worker-directory-summary"><span>Workers with readings</span><strong>{workers.filter((worker) => worker.totalRecords > 0).length}</strong><small>In the current result list</small></article>
            <article className="workspace-panel worker-directory-summary"><span>Exposure records</span><strong>{workers.reduce((total, worker) => total + worker.totalRecords, 0)}</strong><small>Across workers in view</small></article>
          </section>
          {/* Filter and Search Bar */}
          <div className="workspace-panel glass-panel rounded-xl p-4 border border-slate-800 flex flex-wrap gap-3 items-center justify-between">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search worker name, ID (e.g. W-101), role, or badge..."
                value={workerSearch}
                onChange={(e) => setWorkerSearch(e.target.value)}
                className="w-full bg-midnight-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="bg-midnight-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 transition"
              >
                <option value="">All Monitored Zones</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.zoneCode} - {z.zoneName}
                  </option>
                ))}
              </select>

              <select
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                className="bg-midnight-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 transition"
              >
                <option value="">All Operating Shifts</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shiftName}
                  </option>
                ))}
              </select>

              {(workerSearch || selectedZone || selectedShift) && (
                <button
                  onClick={handleResetWorkerFilters}
                  className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                  title="Reset filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}

            </div>
          </div>

          <p className="text-xs text-slate-400">{selectedZone ? `Workers and individual exposure history for ${zones.find((zone) => zone.id === selectedZone)?.zoneName || 'selected zone'}` : 'Select a zone above to view its workers and each worker’s exposure history.'}</p>
          {/* Workers Table */}
          <div className="worker-directory-table glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-glass">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-midnight-900/90 border-b border-slate-800 text-slate-400 font-medium">
                  <tr>
                    <th
                      onClick={() => handleWorkerSort('id')}
                      className="py-3 px-4 cursor-pointer hover:text-cyan-400 transition select-none"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Worker ID</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleWorkerSort('syntheticName')}
                      className="py-3 px-4 cursor-pointer hover:text-cyan-400 transition select-none"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Synthetic Name</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4">Role &amp; Badge</th>
                    <th className="py-3 px-4">Shift</th>
                    <th
                      onClick={() => handleWorkerSort('totalRecords')}
                      className="py-3 px-4 cursor-pointer hover:text-cyan-400 transition select-none"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Records</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleWorkerSort('avgExposurePpmHr')}
                      className="py-3 px-4 cursor-pointer hover:text-cyan-400 transition select-none"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Mean (ppm·hr)</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleWorkerSort('maxExposurePpmHr')}
                      className="py-3 px-4 cursor-pointer hover:text-cyan-400 transition select-none"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Peak (ppm·hr)</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4">Latest Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {loadingWorkers ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500 font-sans">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                          <span>Loading synthetic personnel directory...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedWorkers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500 font-sans">
                        <div className="max-w-md mx-auto space-y-3">
                          <p className="text-slate-400">No synthetic personnel match the current filter criteria.</p>
                          <button
                            onClick={handleResetWorkerFilters}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold transition"
                          >
                            Clear Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedWorkers.map((w) => (
                      <tr
                        key={w.id}
                        onClick={() => handleSelectWorker(w.id)}
                        className="hover:bg-cyan-500/5 cursor-pointer transition"
                      >
                        <td className="py-3 px-4 font-bold text-cyan-400">{w.id}</td>
                        <td className="py-3 px-4 font-sans font-semibold text-white">
                          {w.syntheticName}
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-300">
                          <div>{w.role}</div>
                          <span className="text-[10px] text-slate-500 font-mono">Badge: {w.badgeId}</span>
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-400">{w.preferredShiftName}</td>
                        <td className="py-3 px-4 text-slate-200">{w.totalRecords}</td>
                        <td className="py-3 px-4 font-bold text-cyan-300">
                          {w.avgExposurePpmHr.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 font-bold text-rose-400">
                          {w.maxExposurePpmHr.toFixed(1)}
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <StatusBadge status={w.latestDemoStatus} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right font-sans">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectWorker(w.id);
                            }}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold transition"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Workers Pagination Footer */}
            {sortedWorkers.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-800 bg-midnight-950/60 flex items-center justify-between text-xs text-slate-400 font-sans">
                <span>
                  Showing <strong className="text-white">{paginatedWorkers.length}</strong> of{' '}
                  <strong className="text-white">{sortedWorkers.length}</strong> personnel
                </span>
                <div className="flex items-center space-x-2 font-mono">
                  <button
                    disabled={workerPage <= 1}
                    onClick={() => setWorkerPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 rounded-lg bg-midnight-900 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span>
                    Page {workerPage} of {totalWorkerPages}
                  </span>
                  <button
                    disabled={workerPage >= totalWorkerPages}
                    onClick={() => setWorkerPage((p) => Math.min(totalWorkerPages, p + 1))}
                    className="px-3 py-1 rounded-lg bg-midnight-900 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      {selectedWorkerId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="worker-profile-print-root dashboard-print-root bg-midnight-900 border border-cyan-500/40 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-midnight-900/95 backdrop-blur-xl z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-glow">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <span>{workerDetail ? workerDetail.summary.syntheticName : 'Loading Worker...'}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
                      {selectedWorkerId}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Synthetic Industrial Worker Profile &amp; Cumulative Dosimetry Audit
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button type="button" disabled={!workerDetail || detailLoading} onClick={exportWorkerProfilePdf} className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/25 disabled:cursor-wait disabled:opacity-50" title="Save this worker profile and history as PDF"><Printer className="h-3.5 w-3.5"/><span>Save profile PDF</span></button>
                <button type="button" onClick={() => void downloadFile(api.getExportCsvUrl({ workerId: selectedWorkerId }))} className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/25" title="Download exposure records for this worker as CSV"><Download className="h-3.5 w-3.5"/><span>Exposure CSV</span></button>
                <button
                  onClick={() => {
                    setSelectedWorkerId(null);
                    setWorkerDetail(null);
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            {detailLoading || !workerDetail ? (
              <div className="p-12 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span>Aggregating worker historical dosimetry records...</span>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Profile Overview Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-midnight-850 border border-slate-800">
                    <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                      <Award className="w-3 h-3 text-cyan-400" />
                      <span>Role &amp; Experience</span>
                    </p>
                    <p className="text-xs font-semibold text-white mt-1">{workerDetail.summary.role}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{workerDetail.summary.experienceYears} Years Tenure</p>
                  </div>

                  <div className="p-3 rounded-xl bg-midnight-850 border border-slate-800">
                    <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>Operating Shift</span>
                    </p>
                    <p className="text-xs font-semibold text-white mt-1">{workerDetail.summary.preferredShiftName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Badge: {workerDetail.summary.badgeId}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-midnight-850 border border-slate-800">
                    <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                      <Activity className="w-3 h-3 text-cyan-400" />
                      <span>Mean &amp; Peak Exposure</span>
                    </p>
                    <p className="text-xs font-bold text-cyan-glow mt-1 font-mono">
                      {workerDetail.summary.avgExposurePpmHr.toFixed(2)} ppm·hr
                    </p>
                    <p className="text-[10px] text-rose-400 font-mono">
                      Peak: {workerDetail.summary.maxExposurePpmHr.toFixed(1)} ppm·hr
                    </p>
                  </div>
                </div>

                {/* Worker Exposure Trend Chart */}
                <div className="glass-panel rounded-xl p-4 border border-slate-800">
                  <div className="flex items-center space-x-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                      Individual 20-Day Exposure Timeline Trend
                    </h4>
                  </div>
                  {workerDetail.exposureTrend.length > 0 ? (
                    <EChartWrapper
                      options={{
                        tooltip: {
                          trigger: 'axis',
                          backgroundColor: '#0E1626',
                          borderColor: '#00F0FF',
                          textStyle: { color: '#F8FAFC' },
                        },
                        grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
                        xAxis: {
                          type: 'category',
                          data: workerDetail.exposureTrend.map((t) => t.date.slice(5)),
                          axisLine: { lineStyle: { color: '#334155' } },
                          axisLabel: { color: '#94A3B8', fontSize: 10 },
                        },
                        yAxis: {
                          type: 'value',
                          name: 'ppm·hr',
                          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
                          axisLabel: { color: '#94A3B8' },
                        },
                        series: [
                          {
                            name: 'Shift Exposure',
                            type: 'line',
                            data: workerDetail.exposureTrend.map((t) => t.avgExposurePpmHr),
                            smooth: true,
                            itemStyle: { color: '#00F0FF' },
                            lineStyle: { width: 2.5 },
                            markLine: {
                              data: [
                                { yAxis: 15.0, name: 'Warning (15.0)', lineStyle: { color: '#F59E0B', type: 'dashed' } },
                                { yAxis: 20.0, name: 'Critical (20.0)', lineStyle: { color: '#EF4444', type: 'dashed' } },
                              ],
                            },
                          },
                        ],
                      }}
                      height="220px"
                    />
                  ) : (
                    <p className="text-xs text-slate-500 py-6 text-center">No trend points available for this worker.</p>
                  )}
                </div>

                {/* Worker Alert Incidents */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>
                      Associated Safety Incidents (
                      {workerDetail.alerts ? workerDetail.alerts.length : 0} Simulated Triggers)
                    </span>
                  </h4>
                  {workerDetail.alerts && workerDetail.alerts.length > 0 ? (
                    <div className="space-y-2">
                      {workerDetail.alerts.map((al) => (
                        <div
                          key={al.id}
                          className="p-3 rounded-xl bg-midnight-950 border border-slate-800 flex items-center justify-between text-xs font-mono"
                        >
                          <div>
                            <span className="text-cyan-400 font-bold">{al.id}</span>
                            <span className="text-slate-400 font-sans ml-2">
                              {al.timestamp.replace('T', ' ').slice(0, 16)}
                            </span>
                            <span className="text-rose-400 ml-2 font-bold">
                              {al.triggerValuePpmHr.toFixed(2)} ppm·hr
                            </span>
                            <span className="text-[10px] text-slate-500 font-sans ml-2">
                              [{al.isAcknowledged ? 'ACKNOWLEDGED' : 'PENDING'}]
                            </span>
                          </div>
                          <StatusBadge status={al.demoSeverity} size="sm" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-midnight-950/60 border border-slate-800 text-center text-xs text-slate-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1 inline mr-1.5" />
                      <span>No simulated threshold alerts recorded for this worker during the 20-day demonstration window.</span>
                    </div>
                  )}
                </div>

                {/* Recent Shift Exposure Records */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                    Recent Shift History ({workerDetail.recentRecords.length} recorded telemetry events)
                  </h4>
                  <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-midnight-950 text-slate-400 text-[11px] sticky top-0 font-sans">
                        <tr>
                          <th className="py-2 px-3">Record ID</th>
                          <th className="py-2 px-3">Date &amp; Time</th>
                          <th className="py-2 px-3">Shift</th>
                          <th className="py-2 px-3">Color Badge (RGB)</th>
                          <th className="py-2 px-3 text-right">Exposure</th>
                          <th className="py-2 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-[11px]">
                        {workerDetail.recentRecords.slice(0, 10).map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-800/40">
                            <td className="py-2 px-3 text-cyan-400 font-bold">{rec.id}</td>
                            <td className="py-2 px-3 text-slate-300">{rec.timestamp.replace('T', ' ').slice(0, 16)}</td>
                            <td className="py-2 px-3 text-slate-300 font-sans">{rec.shiftName}</td>
                            <td className="py-2 px-3">
                              <span
                                className="inline-block w-3.5 h-3.5 rounded border border-white/20 mr-1.5 align-middle"
                                style={{
                                  backgroundColor: `rgb(${rec.simulatedColorR}, ${rec.simulatedColorG}, ${rec.simulatedColorB})`,
                                }}
                              />
                              <span className="text-slate-400 text-[10px]">
                                {rec.simulatedColorR},{rec.simulatedColorG},{rec.simulatedColorB}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-semibold text-white">
                              {rec.illustrativeExposureValue.toFixed(2)} ppm·hr
                            </td>
                            <td className="py-2 px-3 text-center font-sans">
                              <StatusBadge status={rec.demoStatus} size="sm" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
