import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  ArrowUpDown,
  Download,
  RotateCcw,
  Sparkles,
  Eye,
  Activity,
  Flame,
  Layers,
  Calendar,
  MapPin,
  Clock,
  User,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { api, downloadFile } from '../services/api';
import { ExposureRecord, FilterState, DemoStatus, LoginResponse } from '../types';
import { FilterBar } from '../components/FilterBar';
import { Button, StatusBadge, Skeleton, EmptyState, Modal } from '../components/ui';

export const ExposureRecordExplorerPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<LoginResponse | null>(() => {
    try { return JSON.parse(localStorage.getItem('chromaguard_user') || 'null'); } catch { return null; }
  });
  const isWorker = currentUser?.role === 'ROLE_WORKER';
  const workerId = isWorker ? currentUser?.associatedWorkerId || '' : '';

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    zoneId: '',
    shiftId: '',
    workerId,
    demoStatus: '',
  });

  // Telemetry Records State
  const [records, setRecords] = useState<ExposureRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Client-side search and sorting
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<keyof ExposureRecord>('timestamp');
  const [sortAsc, setSortAsc] = useState<boolean>(false); // default newest first

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Selected Record Modal
  const [selectedRecord, setSelectedRecord] = useState<ExposureRecord | null>(null);
  const selectedSourceColumns = useMemo(() => {
    if (!selectedRecord?.sourceDatasetJson) return [] as Array<[string, string]>;
    try {
      const values = JSON.parse(selectedRecord.sourceDatasetJson) as Record<string, string>;
      return Object.entries(values);
    } catch {
      return [] as Array<[string, string]>;
    }
  }, [selectedRecord]);

  // Fetch records
  const fetchRecords = async (activeFilters: FilterState) => {
    setLoading(true);
    setError(null);
    try {
      if (isWorker && !workerId) throw new Error('This worker account is not linked to a worker profile.');
      // Load the full filtered history; pagination is applied in the UI after retrieval.
      const data = await api.getExposureRecords(isWorker ? { ...activeFilters, workerId } : activeFilters);
      setRecords(data);
      setCurrentPage(1);
    } catch (err) {
      console.error('Failed to load exposure records:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(filters);
  }, [filters, currentUser]);

  useEffect(() => {
    const handleUserChanged = (event: Event) => {
      const user = (event as CustomEvent<LoginResponse>).detail;
      setCurrentUser(user);
      setFilters((previous) => ({ ...previous, workerId: user?.role === 'ROLE_WORKER' ? user.associatedWorkerId || '' : '' }));
    };
    window.addEventListener('chromaguard:user-changed', handleUserChanged);
    return () => window.removeEventListener('chromaguard:user-changed', handleUserChanged);
  }, []);

  // Listen to simulation reset events
  useEffect(() => {
    const handleReset = () => fetchRecords(filters);
    window.addEventListener('chromaguard:simulation-reset', handleReset);
    return () => window.removeEventListener('chromaguard:simulation-reset', handleReset);
  }, [filters]);

  // Filtered and Sorted Records
  const filteredRecords = useMemo(() => {
    let result = [...records];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.workerName.toLowerCase().includes(q) ||
          r.workerId.toLowerCase().includes(q) ||
          r.zoneName.toLowerCase().includes(q) ||
          r.zoneCode.toLowerCase().includes(q) ||
          r.shiftName.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        return sortAsc
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      }

      if (typeof aVal === 'number') {
        return sortAsc
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      }

      return 0;
    });

    return result;
  }, [records, searchQuery, sortField, sortAsc]);

  // Pagination Slice
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Quick Metrics for active selection
  const selectionMetrics = useMemo(() => {
    if (!filteredRecords.length) {
      return { total: 0, avg: 0, max: 0, criticalCount: 0, warningCount: 0 };
    }
    const total = filteredRecords.length;
    const sum = filteredRecords.reduce((acc, r) => acc + r.illustrativeExposureValue, 0);
    const avg = sum / total;
    const max = Math.max(...filteredRecords.map((r) => r.illustrativeExposureValue));
    const criticalCount = filteredRecords.filter((r) => r.demoStatus === 'CRITICAL').length;
    const warningCount = filteredRecords.filter((r) => r.demoStatus === 'WARNING').length;

    return { total, avg, max, criticalCount, warningCount };
  }, [filteredRecords]);

  const handleSort = (field: keyof ExposureRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default descending for metrics
    }
  };

  const handleExportCsv = () => {
    void downloadFile(api.getExportCsvUrl(filters));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/30 text-xs font-mono text-cyan-400 mb-2">
            <FileText className="w-3.5 h-3.5 text-cyan-glow" />
            <span>PRIMARY TELEMETRY CORPUS</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{isWorker ? 'My Exposure Records' : 'Exposure Record Explorer'}</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Granular inspection of simulated worker dosimeter telemetry packets. Search, filter, and inspect
            optical color badges, exposure concentrations ($C_i$), and cumulative dosages across refinery units.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            iconLeft={<Download className="w-3.5 h-3.5" />}
          >
            Export Filtered CSV ({filteredRecords.length})
          </Button>
        </div>
      </div>

      {/* Global Filter Bar */}
      {isWorker ? (
        <div className="mb-5 rounded-xl border border-emerald-500/25 bg-emerald-950/20 px-4 py-3 text-xs text-slate-300">
          <strong className="text-emerald-300">PERSONAL RECORDS · {workerId}</strong>
          <span className="ml-2">Only your exposure records are shown.</span>
          <div className="mt-3"><FilterBar filters={filters} onChange={(next) => setFilters({ ...next, workerId })} lockedWorkerId={workerId} /></div>
        </div>
      ) : <FilterBar filters={filters} onChange={setFilters} />}

      {/* Selection KPI Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
        <div className="p-3.5 rounded-xl bg-midnight-950 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-sans block">Filtered Records</span>
          <span className="text-xl font-bold text-white block">{selectionMetrics.total}</span>
          <span className="text-[10px] text-slate-500 font-sans">{isWorker ? 'in your personal profile' : 'of 718 total corpus'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-midnight-950 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-sans block">Selection Mean</span>
          <span className="text-xl font-bold text-cyan-300 block">
            {selectionMetrics.avg.toFixed(2)}{' '}
            <span className="text-xs font-normal text-slate-400 font-sans">ppm·hr</span>
          </span>
          <span className="text-[10px] text-slate-500 font-sans">Average exposure</span>
        </div>

        <div className="p-3.5 rounded-xl bg-midnight-950 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-sans block">Selection Peak</span>
          <span className="text-xl font-bold text-rose-400 block">
            {selectionMetrics.max.toFixed(2)}{' '}
            <span className="text-xs font-normal text-slate-400 font-sans">ppm·hr</span>
          </span>
          <span className="text-[10px] text-slate-500 font-sans">Highest observed reading</span>
        </div>

        <div className="p-3.5 rounded-xl bg-midnight-950 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-sans block">Critical Records</span>
          <span className="text-xl font-bold text-rose-500 block">{selectionMetrics.criticalCount}</span>
          <span className="text-[10px] text-slate-500 font-sans">Exceeds 15.0 ppm·hr</span>
        </div>

        <div className="p-3.5 rounded-xl bg-midnight-950 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-sans block">Warning Records</span>
          <span className="text-xl font-bold text-amber-400 block">{selectionMetrics.warningCount}</span>
          <span className="text-[10px] text-slate-500 font-sans">10.0 – 15.0 ppm·hr</span>
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 shadow-glass">
        {/* Search & Meta Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by record ID, worker, zone, or shift..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-midnight-950 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-400">
            <span>
              Showing{' '}
              <strong className="text-white">
                {filteredRecords.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
              </strong>{' '}
              -{' '}
              <strong className="text-white">
                {Math.min(currentPage * pageSize, filteredRecords.length)}
              </strong>{' '}
              of <strong className="text-white">{filteredRecords.length}</strong> records
            </span>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="space-y-2 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-12 text-center">
            <EmptyState
              title="No Exposure Records Found"
              description="No telemetry packets match your active search and filter parameters. Try clearing your filters."
            />
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-midnight-950 text-slate-400 text-[11px] border-b border-slate-800">
                <tr>
                  <th
                    onClick={() => handleSort('id')}
                    className="py-2.5 px-3 cursor-pointer hover:text-cyan-400 transition select-none"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Record ID</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('workerName')}
                    className="py-2.5 px-3 cursor-pointer hover:text-cyan-400 transition select-none font-sans"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Worker Personnel</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('zoneCode')}
                    className="py-2.5 px-3 cursor-pointer hover:text-cyan-400 transition select-none font-sans"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Zone</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 font-sans">Shift</th>
                  <th
                    onClick={() => handleSort('timestamp')}
                    className="py-2.5 px-3 cursor-pointer hover:text-cyan-400 transition select-none"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Timestamp</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center">Optical RGB Badge</th>
                  <th
                    onClick={() => handleSort('illustrativeExposureValue')}
                    className="py-2.5 px-3 text-right cursor-pointer hover:text-cyan-400 transition select-none"
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Exposure (ppm·hr)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('illustrativeCumulativeDose')}
                    className="py-2.5 px-3 text-right cursor-pointer hover:text-cyan-400 transition select-none"
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Cumulative Dose</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 font-sans text-center">Demo Status</th>
                  <th className="py-2.5 px-3 font-sans text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[11px]">
                {paginatedRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 text-cyan-400 font-bold">{r.id}</td>
                    <td className="py-2.5 px-3 text-white font-sans font-medium">
                      <button
                        onClick={() => navigate(`/workers?workerId=${r.workerId}`)}
                        className="hover:text-cyan-300 transition text-left"
                        title="View worker profile"
                      >
                        {r.workerName}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans">
                      <span className="px-1.5 py-0.5 rounded bg-midnight-900 border border-slate-700/80 text-[10px] font-mono mr-1.5 text-cyan-400">
                        {r.zoneCode}
                      </span>
                      {r.zoneName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-sans">{r.shiftName}</td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {r.timestamp.replace('T', ' ').slice(0, 16)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="inline-flex items-center space-x-2">
                        <span
                          className="w-4 h-4 rounded-md border border-slate-600 shadow-sm"
                          style={{
                            backgroundColor: `rgb(${r.simulatedColorR}, ${r.simulatedColorG}, ${r.simulatedColorB})`,
                          }}
                          title={`RGB(${r.simulatedColorR}, ${r.simulatedColorG}, ${r.simulatedColorB})`}
                        />
                        <span className="text-[10px] text-slate-400">
                          {r.simulatedColorR},{r.simulatedColorG},{r.simulatedColorB}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-cyan-300">
                      {r.illustrativeExposureValue.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300">
                      {r.illustrativeCumulativeDose.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <StatusBadge status={r.demoStatus} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      <button
                        onClick={() => setSelectedRecord(r)}
                        className="inline-flex items-center space-x-1 text-xs text-cyan-400 hover:text-cyan-200 transition"
                        title="Inspect full telemetry packet"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
          <span>
            Page <strong className="text-white">{currentPage}</strong> of{' '}
            <strong className="text-white">{totalPages}</strong>
          </span>
          <div className="flex items-center space-x-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded-lg bg-midnight-950 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 rounded-lg bg-midnight-950 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Record Inspection Modal */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={
            <div className="flex items-center space-x-2 text-cyan-400">
              <FileText className="w-5 h-5 text-cyan-glow" />
              <span>Telemetry Packet: {selectedRecord.id}</span>
            </div>
          }
          subtitle={`Simulated Optical Dosimeter Telemetry • Version ${selectedRecord.datasetVersion}`}
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/workers?workerId=${selectedRecord.workerId}`)}
                iconRight={<ExternalLink className="w-3.5 h-3.5" />}
              >
                View Worker Profile ({selectedRecord.workerName})
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedRecord(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-5 text-xs text-slate-300">
            {/* Header Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-midnight-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-sans">Worker Personnel</span>
                <p className="font-semibold text-white text-sm">{selectedRecord.workerName}</p>
                <p className="font-mono text-[11px] text-cyan-400">ID: {selectedRecord.workerId}</p>
              </div>

              <div className="p-3 rounded-xl bg-midnight-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-sans">Operational Location</span>
                <p className="font-semibold text-white text-sm">{selectedRecord.zoneName}</p>
                <p className="font-mono text-[11px] text-slate-400">{selectedRecord.zoneCode}</p>
              </div>

              <div className="p-3 rounded-xl bg-midnight-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-sans">Shift &amp; Timestamp</span>
                <p className="font-semibold text-white text-sm">{selectedRecord.shiftName}</p>
                <p className="font-mono text-[11px] text-slate-400">
                  {selectedRecord.timestamp.replace('T', ' ')}
                </p>
              </div>
            </div>

            {/* Dosimetry & Optical Physics Simulation */}
            <div className="p-4 rounded-xl bg-midnight-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-semibold text-white flex items-center space-x-1.5">
                  <Flame className="w-4 h-4 text-cyan-400" />
                  <span>Optical Dosimetry Physics Model</span>
                </span>
                <StatusBadge status={selectedRecord.demoStatus} size="sm" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Optical RGB Swatch Card */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                    Simulated Badge Chromophore State
                  </span>
                  <div className="flex items-center space-x-3 p-3 rounded-xl bg-midnight-900 border border-slate-800">
                    <div
                      className="w-12 h-12 rounded-xl border border-slate-600 shadow-md flex-shrink-0"
                      style={{
                        backgroundColor: `rgb(${selectedRecord.simulatedColorR}, ${selectedRecord.simulatedColorG}, ${selectedRecord.simulatedColorB})`,
                      }}
                    />
                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="flex items-center space-x-2">
                        <span className="text-rose-400">R: {selectedRecord.simulatedColorR}</span>
                        <span className="text-emerald-400">G: {selectedRecord.simulatedColorG}</span>
                        <span className="text-cyan-400">B: {selectedRecord.simulatedColorB}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-sans">
                        Photometric dark-shift indicates simulated $H_2S$ optical lead-acetate binding.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dosimetry Value Cards */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                    Calculated Dosimetry Metrics
                  </span>
                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <div className="p-2.5 rounded-xl bg-midnight-900 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 font-sans block">Instant Exposure</span>
                      <span className="text-lg font-bold text-cyan-300">
                        {selectedRecord.illustrativeExposureValue.toFixed(2)}
                      </span>
                      <span className="text-[9px] text-slate-500 block">ppm·hr</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-midnight-900 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 font-sans block">Cumulative Dose</span>
                      <span className="text-lg font-bold text-teal-300">
                        {selectedRecord.illustrativeCumulativeDose.toFixed(2)}
                      </span>
                      <span className="text-[9px] text-slate-500 block">ppm·hr</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {selectedSourceColumns.length > 0 && <section className="rounded-xl border border-cyan-500/20 bg-midnight-950/80 p-4">
              <div className="mb-3 flex items-center justify-between gap-3"><div><h4 className="font-semibold text-white">Original CSV row</h4><p className="mt-1 text-[11px] text-slate-400">All source columns and values retained from the uploaded dataset.</p></div><span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold text-cyan-300">{selectedSourceColumns.length} columns</span></div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{selectedSourceColumns.map(([column, value]) => <div key={column} className="min-w-0 rounded-lg border border-slate-800 bg-midnight-900/70 px-3 py-2"><p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500" title={column}>{column}</p><p className="mt-1 break-words text-xs text-slate-200">{value || '—'}</p></div>)}</div>
            </section>}

            {/* Academic Simulation Notice */}
            <div className="p-3.5 rounded-xl bg-midnight-950/80 border border-amber-500/25 flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed text-slate-400">
                <strong className="text-amber-300">Demonstration Corpus Invariant:</strong> Data source is{' '}
                <code className="text-white">{selectedRecord.dataSource}</code>. Readings represent
                synthetic, mathematical laboratory illustrations and cannot be used as certified industrial safety
                measurements.
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
