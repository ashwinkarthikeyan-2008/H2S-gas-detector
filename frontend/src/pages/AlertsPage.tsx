import React, { useEffect, useState } from 'react';
import {
  BellRing,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Check,
  X,
  FileCheck2,
  MapPin,
  User,
  ShieldCheck,
  Download,
  ArrowUpDown,
  RotateCcw,
  Sparkles,
  Info,
  Activity,
  CheckCheck,
  Radio,
} from 'lucide-react';
import { api } from '../services/api';
import { Alert, IndustrialZone, LoginResponse } from '../types';
import { EmptyState, Button, StatusBadge } from '../components/ui';

export const AlertsPage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<LoginResponse | null>(() => {
    try { return JSON.parse(localStorage.getItem('chromaguard_user') || 'null'); } catch { return null; }
  });
  const isWorker = currentUser?.role === 'ROLE_WORKER';
  const workerId = isWorker ? currentUser?.associatedWorkerId || '' : '';
  const [workerZoneName, setWorkerZoneName] = useState('your assigned zone');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [zones, setZones] = useState<IndustrialZone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [selectedAckState, setSelectedAckState] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sorting
  const [sortField, setSortField] = useState<keyof Alert>('timestamp');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Pagination
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // Acknowledge Action Modal
  const [ackModalAlert, setAckModalAlert] = useState<Alert | null>(null);
  const [actionNotes, setActionNotes] = useState<string>('Industrial exhaust verified. Safety ventilation unit checked.');
  const [acknowledgedBy, setAcknowledgedBy] = useState<string>('Lead Plant Safety Director');
  const [submittingAck, setSubmittingAck] = useState<boolean>(false);
  const [ackSuccessNotice, setAckSuccessNotice] = useState<string | null>(null);
  const [alertExportError, setAlertExportError] = useState('');

  const loadAlerts = (showLoading = true) => {
    if (showLoading) setLoading(true);
    if (isWorker && !workerId) {
      setAlerts([]);
      setLoading(false);
      return;
    }
    const params: any = {};
    if (selectedSeverity) params.severity = selectedSeverity;
    if (selectedZone) params.zoneId = selectedZone;
    if (selectedAckState !== '') params.isAcknowledged = selectedAckState === 'true';
    // The API enforces the worker's assigned-zone scope. Avoid sending a worker filter,
    // because workers need the complete safety feed for that zone.

    api.getAlerts(params)
      .then((data) => {
        setAlerts(data);
        setPage(1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.getZones().then(setZones).catch(console.error);
  }, []);

  useEffect(() => {
    if (!isWorker || !workerId) return;
    api.getWorkerDetail(workerId).then((detail) => setWorkerZoneName(detail.summary.assignedZoneName || 'your assigned zone')).catch(console.error);
  }, [isWorker, workerId]);

  useEffect(() => {
    loadAlerts();
  }, [selectedSeverity, selectedAckState, selectedZone, currentUser]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') loadAlerts(false);
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [selectedSeverity, selectedAckState, selectedZone, currentUser]);

  useEffect(() => {
    const handleUserChanged = (event: Event) => setCurrentUser((event as CustomEvent<LoginResponse>).detail);
    window.addEventListener('chromaguard:user-changed', handleUserChanged);
    return () => window.removeEventListener('chromaguard:user-changed', handleUserChanged);
  }, []);

  const handleAcknowledgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ackModalAlert || isWorker) return;

    setSubmittingAck(true);
    try {
      const updated = await api.acknowledgeAlert(ackModalAlert.id, actionNotes, acknowledgedBy);
      setAlerts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setAckSuccessNotice(`Simulated alert ${updated.id} acknowledged and logged into audit record.`);
      setAckModalAlert(null);
      // Dispatch custom event so AppLayout updates its unacknowledged counter badge immediately
      window.dispatchEvent(new CustomEvent('chromaguard:alert-acknowledged', { detail: updated }));
      setTimeout(() => setAckSuccessNotice(null), 4000);
    } catch (err: any) {
      alert(`Acknowledgement failed: ${err.message}`);
    } finally {
      setSubmittingAck(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedSeverity('');
    setSelectedAckState('');
    setSelectedZone('');
    setSearchQuery('');
    setPage(1);
  };

  const handleDownloadAlertsCsv = () => {
    setAlertExportError('');
    try {
      const csvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
      const headers = ['alert_id', 'worker_name', 'worker_id', 'zone_name', 'zone_code', 'severity', 'timestamp', 'exposure_ppm_hr', 'threshold_ppm_hr', 'reviewed', 'reviewed_at', 'reviewed_by', 'action_notes'];
      const rows = sortedAlerts.map((alert) => [alert.id, alert.workerName, alert.workerId, alert.zoneName, alert.zoneCode, alert.demoSeverity, alert.timestamp, alert.triggerValuePpmHr, alert.thresholdLimitPpmHr, alert.isAcknowledged, alert.acknowledgedAt, alert.acknowledgedBy, alert.actionNotes]);
      const content = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
      const objectUrl = URL.createObjectURL(new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' }));
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = isWorker ? 'chromaguard_my_safety_alerts.csv' : 'chromaguard_safety_alerts.csv';
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setAlertExportError(error instanceof Error ? error.message : 'Could not export the filtered alerts.');
    }
  };

  const handleSort = (field: keyof Alert) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.id.toLowerCase().includes(q) ||
      a.workerId.toLowerCase().includes(q) ||
      a.workerName.toLowerCase().includes(q) ||
      a.zoneName.toLowerCase().includes(q) ||
      a.zoneCode.toLowerCase().includes(q)
    );
  });

  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    if (typeof valA === 'boolean' && typeof valB === 'boolean') {
      return sortAsc ? (valA === valB ? 0 : valA ? 1 : -1) : (valA === valB ? 0 : valA ? -1 : 1);
    }
    return sortAsc
      ? String(valA ?? '').localeCompare(String(valB ?? ''))
      : String(valB ?? '').localeCompare(String(valA ?? ''));
  });

  const totalPages = Math.ceil(sortedAlerts.length / pageSize) || 1;
  const paginatedAlerts = sortedAlerts.slice((page - 1) * pageSize, page * pageSize);
  const unacknowledgedCount = alerts.filter((a) => !a.isAcknowledged).length;
  const criticalCount = alerts.filter((a) => a.demoSeverity === 'CRITICAL').length;
  const warningCount = alerts.filter((a) => a.demoSeverity === 'WARNING').length;
  const elevatedCount = alerts.filter((a) => a.demoSeverity === 'ELEVATED').length;
  const normalCount = alerts.filter((a) => a.demoSeverity === 'NORMAL').length;
  const reviewedCount = alerts.filter((a) => a.isAcknowledged).length;
  const visibleRangeStart = sortedAlerts.length ? (page - 1) * pageSize + 1 : 0;
  const visibleRangeEnd = Math.min(page * pageSize, sortedAlerts.length);
  const hasActiveFilters = Boolean(selectedSeverity || selectedAckState !== '' || selectedZone || searchQuery);
  const severityMeta: Record<string, { title: string; range: string; icon: React.ReactNode; tone: string }> = {
    NORMAL: { title: 'Normal', range: 'Below 8 ppm·hr', icon: <CheckCircle2/>, tone: 'is-normal' },
    ELEVATED: { title: 'Elevated', range: '8–14.99 ppm·hr', icon: <Activity/>, tone: 'is-elevated' },
    WARNING: { title: 'Warning', range: '15–19.99 ppm·hr', icon: <AlertTriangle/>, tone: 'is-warning' },
    CRITICAL: { title: 'Critical', range: '20 ppm·hr and above', icon: <Flame/>, tone: 'is-critical' },
  };

  return (
    <div className={`workspace-page ${isWorker ? 'worker-alert-page' : ''} alert-center-page space-y-6`}>
      {/* Title & Action Bar */}
      <div className={`workspace-hero ${isWorker ? 'worker-alert-hero' : ''} alert-center-hero flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl p-6 md:p-7`}>
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">{isWorker ? 'My safety signals' : 'Safety alert centre'}</h2>
            {!isWorker && <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono tracking-wider">
              {alerts.length} EVENTS
            </span>}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isWorker ? `Alerts for ${workerZoneName} only. See the level, reading, and whether the safety team has reviewed each event.` : 'See alerts across every zone. Filter by severity, review status, or zone, then record the action taken.'}
          </p>
        </div>

        {!isWorker && <button type="button" onClick={handleDownloadAlertsCsv} disabled={loading} className="dashboard-export-button is-csv" title="Download alerts matching the current filters"><Download className="h-4 w-4"/><span>Export alerts CSV</span></button>}
      </div>
      {isWorker && <div className="dashboard-export-panel worker-alert-export-panel"><div className="dashboard-export-intro"><span className="dashboard-export-icon"><Download className="h-4 w-4"/></span><span><strong>My alert export</strong><small>Download the alerts shown here, including your current filters.</small></span></div><button type="button" onClick={handleDownloadAlertsCsv} disabled={loading} className="dashboard-export-button is-csv" title="Download your filtered alert list as CSV"><Download className="h-4 w-4"/><span>Download alerts CSV</span></button></div>}
      {alertExportError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{alertExportError}</p>}

      <section className={`alert-center-metrics ${isWorker ? 'is-worker' : 'is-admin'}`} aria-label={isWorker ? 'My alert summary' : 'Alert summary'}>
        <article className="alert-metric metric-normal"><span><CheckCircle2/>Normal</span><strong>{normalCount}</strong><small>Below 8 ppm·hr</small></article>
        <article className="alert-metric metric-elevated"><span><Activity/>Elevated</span><strong>{elevatedCount}</strong><small>8–14.99 ppm·hr</small></article>
        <article className="alert-metric metric-warning"><span><AlertTriangle/>Warning</span><strong>{warningCount}</strong><small>15–19.99 ppm·hr</small></article>
        <article className="alert-metric metric-critical"><span><Flame/>Critical</span><strong>{criticalCount}</strong><small>20 ppm·hr and above</small></article>
        <article className="alert-metric metric-pending"><span><Clock/>Pending review</span><strong>{unacknowledgedCount}</strong><small>{isWorker ? 'Safety team is checking' : 'Action required by admin'}</small></article>
        <article className="alert-metric metric-reviewed"><span><CheckCheck/>Reviewed</span><strong>{reviewedCount}</strong><small>Review has been recorded</small></article>
      </section>

      <div className="alert-center-status"><Radio/><span><strong>{isWorker ? `Zone safety feed · ${workerZoneName}` : 'Facility safety feed'}</strong><small>{loading ? 'Syncing latest events…' : `${alerts.length} events loaded · sorted by ${String(sortField)}`}</small></span><i className={loading ? 'is-loading' : ''}/><span className="alert-feed-scope">{isWorker ? 'ASSIGNED ZONE' : 'ALL ZONES'}</span></div>

      {/* Success Notification Banner */}
      {ackSuccessNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-400/40 text-emerald-300 text-xs flex items-center justify-between shadow-glow-cyan animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{ackSuccessNotice}</span>
          </div>
          <button onClick={() => setAckSuccessNotice(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Plain-language guide */}
      <section className="alert-howto" aria-label="How to use alerts">
        <span className="alert-howto-icon"><Info/></span>
        <div><strong>{isWorker ? 'How to read your alerts' : 'What to do next'}</strong><p>{isWorker ? 'Critical = highest priority. Warning = exposure crossed the warning level. “Pending review” means the safety team has not recorded its review yet.' : 'Start with “Pending review”. Open a case to check the worker, zone, time and exposure value, then record the action taken.'}</p></div>
        <span className="alert-howto-step">{isWorker ? 'VIEW ONLY' : '1 · REVIEW  →  2 · ACKNOWLEDGE'}</span>
      </section>

      {/* Filters Bar */}
      <section className="workspace-panel alert-center-filters rounded-2xl border" aria-label="Search and filter alerts">
        <div className="alert-filter-heading"><div><p>FIND AN ALERT</p><h3>Search and filters</h3></div>{hasActiveFilters && <button onClick={handleResetFilters} className="alert-clear-filters"><RotateCcw/>Clear filters</button>}</div>
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={isWorker ? 'Search your zone, date or alert ID' : 'Search worker name, ID, zone or alert ID'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-midnight-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
          />
        </div>

        <div className="alert-filter-controls">
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            aria-label="Filter by severity"
            className="bg-midnight-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-400 transition"
          >
            <option value="">All severity levels</option>
            <option value="NORMAL">Normal · below 8</option>
            <option value="ELEVATED">Elevated · 8–14.99</option>
            <option value="WARNING">Warning · 15–19.99</option>
            <option value="CRITICAL">Critical · 20+</option>
          </select>

          <select
            value={selectedAckState}
            onChange={(e) => setSelectedAckState(e.target.value)}
            aria-label="Filter by review status"
            className="bg-midnight-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-400 transition"
          >
            <option value="">All review statuses</option>
            <option value="false">Pending review</option>
            <option value="true">Reviewed</option>
          </select>

          {!isWorker && <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            aria-label="Filter by zone"
            className="bg-midnight-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-400 transition"
          >
            <option value="">All zones</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.zoneCode} - {z.zoneName}
              </option>
            ))}
          </select>}

        </div>
        <div className="alert-filter-result">Showing <strong>{sortedAlerts.length}</strong> {sortedAlerts.length === 1 ? 'alert' : 'alerts'}{hasActiveFilters ? ' matching your filters' : ''}</div>
      </section>

      {/* Alerts Table */}
      <div className="alert-center-list rounded-2xl border overflow-hidden shadow-sm">
        <div className="alert-case-list" aria-label="Alert cases">
          {loading ? <div className="alert-case-state"><span className="alert-case-spinner"/><strong>Loading alerts</strong><p>Getting the latest alerts for this account.</p></div>
          : paginatedAlerts.length === 0 ? <div className="alert-case-state"><span className="alert-case-empty-icon">{alerts.length === 0 ? <ShieldCheck/> : <Search/>}</span><strong>{alerts.length === 0 ? (isWorker ? 'You’re all clear' : 'No alerts need attention') : 'No matching alerts'}</strong><p>{alerts.length === 0 ? (isWorker ? 'If an alert is linked to your exposure history, it will appear here.' : 'Alerts will appear here when exposure events are recorded.') : 'Change a filter or clear filters to see other alerts.'}</p>{hasActiveFilters && <button onClick={handleResetFilters}>Clear filters</button>}</div>
          : paginatedAlerts.map((alert) => {
            const meta = severityMeta[alert.demoSeverity] || severityMeta.NORMAL;
            const reviewed = alert.isAcknowledged;
            return <article key={alert.id} className={`alert-case ${meta.tone} ${reviewed ? 'is-reviewed' : 'is-pending'}`}>
              <div className="alert-case-rail"><span>{meta.icon}</span><i/></div>
              <div className="alert-case-body">
                <div className="alert-case-top"><div className="alert-case-title"><span className="alert-case-severity">{meta.title.toUpperCase()}</span><strong>{meta.title} safety alert</strong><span className="alert-case-id">{alert.id}</span></div><span className={`alert-case-status ${reviewed ? 'is-reviewed' : 'is-pending'}`}>{reviewed ? <><CheckCircle2/>Reviewed</> : <><Clock/>Pending review</>}</span></div>
                <div className="alert-case-facts">
                  {!isWorker && <div><small>Worker</small><strong>{alert.workerName}</strong><span>{alert.workerId}</span></div>}
                  <div><small>Zone</small><strong>{alert.zoneName}</strong><span>{alert.zoneCode}</span></div>
                  <div><small>When</small><strong>{new Date(alert.timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</strong><span>{new Date(alert.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span></div>
                  <div><small>Exposure reading</small><strong className={meta.tone}>{alert.triggerValuePpmHr.toFixed(2)} <em>ppm·hr</em></strong><span>{meta.range} · limit {alert.thresholdLimitPpmHr.toFixed(2)}</span></div>
                </div>
                {reviewed && !isWorker && <div className="alert-case-review-note"><CheckCheck/><span>Reviewed by <strong>{alert.acknowledgedBy || 'Safety team'}</strong>{alert.actionNotes ? ` · ${alert.actionNotes}` : ''}</span></div>}
                <div className="alert-case-footer"><span><Activity/>Record {alert.recordId}</span>{isWorker ? <span className="alert-worker-next-step">{reviewed ? 'The safety team has reviewed this alert.' : 'The safety team has been notified. No action is needed here.'}</span> : reviewed ? <span className="alert-admin-complete"><CheckCircle2/>Review recorded{alert.acknowledgedAt ? ` · ${new Date(alert.acknowledgedAt).toLocaleString()}` : ''}</span> : <button className="alert-review-button" onClick={() => setAckModalAlert(alert)}><FileCheck2/>Review &amp; acknowledge</button>}</div>
              </div>
            </article>;
          })}
        </div>
{/* Alerts Pagination Footer */}
        {sortedAlerts.length > 0 && (
          <div className="alert-pagination px-4 py-3 border-t border-slate-800 bg-midnight-950/60 flex items-center justify-between text-xs text-slate-400 font-sans">
            <span>Showing <strong className="text-white">{visibleRangeStart}–{visibleRangeEnd}</strong> of <strong className="text-white">{sortedAlerts.length}</strong> alerts</span>
            <div className="flex items-center space-x-2 font-mono">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg bg-midnight-900 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-40"
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded-lg bg-midnight-900 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ACKNOWLEDGE ALERT MODAL */}
      {ackModalAlert && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-midnight-900 border border-cyan-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileCheck2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Acknowledge Simulated Alert</h3>
              </div>
              <button onClick={() => setAckModalAlert(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-midnight-950 border border-slate-800 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Alert ID:</span>
                <span className="text-cyan-400 font-bold">{ackModalAlert.id} (Simulated)</span>
              </div>
              <div className="flex justify-between font-sans">
                <span className="text-slate-400">Personnel:</span>
                <span className="text-white">{ackModalAlert.workerName} ({ackModalAlert.workerId})</span>
              </div>
              <div className="flex justify-between font-sans">
                <span className="text-slate-400">Facility Zone:</span>
                <span className="text-white">{ackModalAlert.zoneName} ({ackModalAlert.zoneCode})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Trigger Value:</span>
                <span className="text-rose-400 font-bold">{ackModalAlert.triggerValuePpmHr.toFixed(2)} ppmÂ·hr</span>
              </div>
              <div className="flex justify-between font-sans text-[10px] text-amber-400/90 pt-1 border-t border-slate-800">
                <span>Demo Severity:</span>
                <span className="font-bold">{ackModalAlert.demoSeverity}</span>
              </div>
            </div>

            <form onSubmit={handleAcknowledgeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Acknowledged By (Operator / Lead)</label>
                <input
                  type="text"
                  required
                  value={acknowledgedBy}
                  onChange={(e) => setAcknowledgedBy(e.target.value)}
                  className="w-full bg-midnight-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Corrective Action Notes / Log</label>
                <textarea
                  required
                  rows={3}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Enter simulated action taken, ventilation inspection notes, or sensor check results..."
                  className="w-full bg-midnight-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-cyan-400 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAckModalAlert(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAck}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-midnight-950 font-bold shadow-glow-cyan transition flex items-center space-x-1.5"
                >
                  {submittingAck ? (
                    <span>Persisting...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirm &amp; Persist</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
