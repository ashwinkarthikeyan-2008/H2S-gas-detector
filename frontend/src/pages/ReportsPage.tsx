import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  FileText,
  AlertTriangle,
  Building,
  Sigma,
  Calendar,
  Layers,
  ShieldCheck,
  BellRing,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { api, downloadFile } from '../services/api';
import { FilterBar } from '../components/FilterBar';
import { FilterState } from '../types';

export const ReportsPage: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    zoneId: '',
    shiftId: '',
    workerId: '',
    demoStatus: '',
  });

  const [summaryReport, setSummaryReport] = useState<any | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getSummaryReport()
      .then(setSummaryReport)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCopyJson = () => {
    if (!summaryReport) return;
    navigator.clipboard.writeText(JSON.stringify(summaryReport, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const downloadFilteredCsv = () => {
    const url = api.getExportCsvUrl(filters);
    void downloadFile(url);
  };

  const downloadFilteredAlertsCsv = () => {
    const url = api.getExportAlertsCsvUrl({
      startDate: filters.startDate,
      endDate: filters.endDate,
      zoneId: filters.zoneId,
      workerId: filters.workerId,
      severity: filters.demoStatus === 'WARNING' || filters.demoStatus === 'CRITICAL' ? filters.demoStatus : undefined,
    });
    void downloadFile(url);
  };

  const downloadFormalJson = () => {
    const url = api.getExportReportJsonUrl();
    void downloadFile(url);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Reports &amp; Data Intelligence Export</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono tracking-wider">
              EXPORT ENGINE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Generate formal analytical documentation, audit logs, and downloadable tabular CSV files for external statistical software.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={downloadFormalJson}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-midnight-900 hover:bg-slate-800 border border-teal-500/40 text-teal-300 font-semibold text-xs transition"
            title="Download formal exposure report in structured JSON format"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Formal JSON Report</span>
          </button>

          <button
            onClick={downloadFilteredAlertsCsv}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-midnight-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-semibold text-xs transition"
            title="Download simulated alerts matching active filters"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Download Alerts CSV</span>
          </button>

          <button
            onClick={downloadFilteredCsv}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-midnight-950 font-bold text-xs shadow-glow-cyan transition"
            title="Download exposure records matching active filters"
          >
            <Download className="w-4 h-4" />
            <span>Download Exposure CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar with Worker cascade */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Filter cascade status indicator */}
      {hasActiveFilters && (
        <div className="px-4 py-2.5 rounded-xl bg-midnight-900/90 border border-cyan-500/30 text-xs text-slate-300 flex items-center justify-between font-mono">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>
              Active Filter Constraints Applied to Export Downloads:
              {filters.startDate && ` [Start: ${filters.startDate}]`}
              {filters.endDate && ` [End: ${filters.endDate}]`}
              {filters.zoneId && ` [Zone: ${filters.zoneId}]`}
              {filters.shiftId && ` [Shift: ${filters.shiftId}]`}
              {filters.workerId && ` [Worker: ${filters.workerId}]`}
              {filters.demoStatus && ` [Status: ${filters.demoStatus}]`}
            </span>
          </div>
          <span className="text-[11px] text-cyan-400 font-sans">
            Exported rows will strictly match active parameters
          </span>
        </div>
      )}

      {/* Export Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Exposure CSV Card */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-glow">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Exposure Telemetry CSV</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Granular shift records with timestamps, worker ID, zone, shift, simulated RGB channels, and cumulative dose (ppm·hr).
              </p>
            </div>
          </div>
          <button
            onClick={downloadFilteredCsv}
            className="w-full py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-semibold text-cyan-300 flex items-center justify-center space-x-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Exposure Records</span>
          </button>
        </div>

        {/* Simulated Alerts CSV Card */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Simulated Alerts CSV</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                40 simulated threshold alerts with severity, triggering values (ppm·hr), operator acknowledgement states, and audit notes.
              </p>
            </div>
          </div>
          <button
            onClick={downloadFilteredAlertsCsv}
            className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-semibold text-amber-300 flex items-center justify-center space-x-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Simulated Alerts</span>
          </button>
        </div>

        {/* Academic Summary JSON Card */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-400/30 flex items-center justify-center text-teal-400">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Academic Summary JSON</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Descriptive statistics, zone comparison aggregates, seed configuration, and statistical DEV methodology in structured JSON.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyJson}
              className="flex-1 py-2.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-xs font-semibold text-teal-300 flex items-center justify-center space-x-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary JSON'}</span>
            </button>
            <button
              onClick={downloadFormalJson}
              className="px-3.5 py-2.5 rounded-xl bg-midnight-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center space-x-1.5 transition"
              title="Download formal JSON report file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>.json</span>
            </button>
          </div>
        </div>
      </div>

      {/* FORMATTED EXECUTIVE SUMMARY REPORT PREVIEW */}
      <div className="glass-panel rounded-2xl p-6 md:p-8 border border-slate-800 space-y-6 shadow-glass">
        {/* Document Header */}
        <div className="border-b border-slate-800 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono mb-1">
              <FileText className="w-4 h-4" />
              <span>OFFICIAL SYSTEM EXPOSURE REPORT • FORM DEV-2026</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              ChromaGuard Industrial H₂S Exposure Intelligence &amp; Academic DEV Audit Report
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Generated: {summaryReport?.generatedAt || new Date().toISOString()} • Environment: SOFTWARE_DEMONSTRATION
            </p>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-midnight-950 border border-slate-800 text-[11px] font-mono text-slate-400">
            REF: CG-REP-{new Date().getFullYear()}-09
          </div>
        </div>

        {/* Safety Disclaimer Callout inside Report */}
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200/90 text-xs flex items-start space-x-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>ACADEMIC DEMONSTRATION NOTICE:</strong> {summaryReport?.disclaimer}
          </p>
        </div>

        {/* Executive Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3 rounded-xl bg-midnight-900 border border-slate-800">
            <span className="text-slate-400 font-sans block text-[11px]">Total Events Ingested</span>
            <span className="text-lg font-bold text-cyan-glow mt-1 block">
              {summaryReport?.datasetMetrics?.totalRecords || 718} Records
            </span>
          </div>
          <div className="p-3 rounded-xl bg-midnight-900 border border-slate-800">
            <span className="text-slate-400 font-sans block text-[11px]">Sampling Window</span>
            <span className="text-lg font-bold text-white mt-1 block">
              {summaryReport?.datasetMetrics?.dataSpanDays || 20} Calendar Days
            </span>
          </div>
          <div className="p-3 rounded-xl bg-midnight-900 border border-slate-800">
            <span className="text-slate-400 font-sans block text-[11px]">Personnel Monitored</span>
            <span className="text-lg font-bold text-teal-400 mt-1 block">
              {summaryReport?.datasetMetrics?.simulatedWorkers || 40} Workers
            </span>
          </div>
          <div className="p-3 rounded-xl bg-midnight-900 border border-slate-800">
            <span className="text-slate-400 font-sans block text-[11px]">Warning / Critical Limit</span>
            <span className="text-lg font-bold text-rose-400 mt-1 block">
              15.0 / 20.0 ppm·hr
            </span>
          </div>
        </div>

        {/* Zone Breakdown in Report */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
            Industrial Facility Zone Synthesis
          </h4>
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-midnight-950 text-slate-400 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Zone Code</th>
                  <th className="py-2.5 px-3">Facility Area Name</th>
                  <th className="py-2.5 px-3">Risk Tier</th>
                  <th className="py-2.5 px-3 font-mono">Baseline (ppm·hr)</th>
                  <th className="py-2.5 px-3 font-mono">Mean Observed</th>
                  <th className="py-2.5 px-3 font-mono">Peak Event</th>
                  <th className="py-2.5 px-3 font-mono">Record Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {summaryReport?.zoneBreakdowns?.map((z: any) => (
                  <tr key={z.zoneId} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-cyan-400 font-bold">{z.zoneCode}</td>
                    <td className="py-2 px-3 text-white font-sans">{z.zoneName}</td>
                    <td className="py-2 px-3 font-sans">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                        {z.riskTier}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-400">{z.baselinePpmHr.toFixed(1)}</td>
                    <td className="py-2 px-3 font-semibold text-cyan-300">{z.meanExposurePpmHr.toFixed(2)}</td>
                    <td className="py-2 px-3 font-semibold text-rose-400">{z.maxExposurePpmHr.toFixed(1)}</td>
                    <td className="py-2 px-3 text-slate-300 font-sans">{z.recordCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Academic Methodology Sign-off */}
        <div className="p-4 rounded-xl bg-midnight-900 border border-slate-800 space-y-2">
          <h5 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            Academic Methodology Standards
          </h5>
          <ul className="space-y-1 text-xs text-slate-300">
            {summaryReport?.academicMethodologyNotes?.map((note: string, idx: number) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="text-cyan-400">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
