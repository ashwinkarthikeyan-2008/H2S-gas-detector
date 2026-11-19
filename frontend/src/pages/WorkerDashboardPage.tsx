import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, ArrowRight, BadgeCheck, BriefcaseBusiness, Clock3, Download, Gauge, IdCard, Pencil, Printer, Save, Search, ShieldCheck, UserRound, X } from 'lucide-react';
import { api, downloadFile } from '../services/api';
import { Alert, LoginResponse, Shift, WorkerDetail } from '../types';
import { EChartWrapper } from '../components/EChartWrapper';
import { DashboardExportActions } from '../components/DashboardExportActions';
import { WorkerLiveSensorPanel } from '../components/WorkerLiveSensorPanel';

const statusTone: Record<string, string> = {
  NORMAL: 'worker-status-normal',
  ELEVATED: 'worker-status-elevated',
  WARNING: 'worker-status-warning',
  CRITICAL: 'worker-status-critical',
};

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: value, time: 'Time unavailable' };
  return {
    date: date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
    time: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
  };
}

export const WorkerDashboardPage: React.FC<{ view?: 'dashboard' | 'details' | 'exposure' }> = ({ view = 'dashboard' }) => {
  const [user, setUser] = useState<LoginResponse | null>(() => {
    try { return JSON.parse(localStorage.getItem('chromaguard_user') || 'null'); } catch { return null; }
  });
  const [detail, setDetail] = useState<WorkerDetail | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileDraft, setProfileDraft] = useState({ syntheticName: '', role: '', experienceYears: '0', badgeId: '' });
  const [statusFilter, setStatusFilter] = useState('');
  const [shiftFilter, setShiftFilter] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [recordSearch, setRecordSearch] = useState('');
  const workerId = user?.associatedWorkerId || '';

  const exportWorkerProfilePdf = () => {
    document.body.classList.add('dashboard-print-mode');
    const cleanup = () => document.body.classList.remove('dashboard-print-mode');
    window.addEventListener('afterprint', cleanup, { once: true });
    window.setTimeout(() => { window.print(); window.setTimeout(cleanup, 1000); }, 100);
  };

  const load = async () => {
    if (!workerId) {
      setDetail(null);
      setLoading(false);
      setError('Your account is not linked to a worker profile yet. Ask an administrator to link your worker ID so your personal exposure information can be shown.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [workerDetail, shiftData] = await Promise.all([api.getWorkerDetail(workerId), api.getShifts()]);
      setDetail(workerDetail);
      setShifts(shiftData);
      setProfileDraft({ syntheticName: workerDetail.summary.syntheticName, role: workerDetail.summary.role, experienceYears: String(workerDetail.summary.experienceYears), badgeId: workerDetail.summary.badgeId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your worker information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const onUserChanged = (event: Event) => setUser((event as CustomEvent<LoginResponse>).detail);
    const onRefresh = () => { void load(); };
    window.addEventListener('chromaguard:user-changed', onUserChanged);
    window.addEventListener('chromaguard:simulation-reset', onRefresh);
    return () => {
      window.removeEventListener('chromaguard:user-changed', onUserChanged);
      window.removeEventListener('chromaguard:simulation-reset', onRefresh);
    };
  }, [workerId]);

  const durationHours = useMemo(() => {
    const shiftName = detail?.summary.preferredShiftName;
    return shifts.find((shift) => shift.shiftName === shiftName)?.durationHours || 8;
  }, [detail, shifts]);

  const alertsByRecord = useMemo(() => {
    const index = new Map<string, Alert[]>();
    detail?.alerts.forEach((alert) => index.set(alert.recordId, [...(index.get(alert.recordId) || []), alert]));
    return index;
  }, [detail]);

  const recentRecords = useMemo(() => [...(detail?.recentRecords || [])]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [detail]);

  const openAlerts = detail?.alerts.filter((alert) => !alert.isAcknowledged) || [];
  const criticalRecords = recentRecords.filter((record) => record.demoStatus === 'CRITICAL').length;
  const latestRecord = recentRecords[0];
  const filteredRecords = recentRecords.filter((record) => {
    const date = record.timestamp.slice(0, 10);
    const query = recordSearch.trim().toLowerCase();
    return (!statusFilter || record.demoStatus === statusFilter)
      && (!shiftFilter || record.shiftName === shiftFilter)
      && (!zoneFilter || record.zoneId === zoneFilter)
      && (!dateFrom || date >= dateFrom)
      && (!dateTo || date <= dateTo)
      && (!query || [record.id, record.zoneName, record.zoneCode, record.shiftName, record.timestamp].some((value) => value.toLowerCase().includes(query)));
  });
  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!workerId) return;
    setSavingProfile(true); setProfileError(''); setProfileNotice('');
    try {
      await api.updateWorkerProfile(workerId, { ...profileDraft, experienceYears: Number(profileDraft.experienceYears) });
      const refreshed = await api.getWorkerDetail(workerId);
      setDetail(refreshed);
      setProfileDraft({ syntheticName: refreshed.summary.syntheticName, role: refreshed.summary.role, experienceYears: String(refreshed.summary.experienceYears), badgeId: refreshed.summary.badgeId });
      setEditingProfile(false); setProfileNotice('Your profile details have been saved.');
    } catch (saveError) { setProfileError(saveError instanceof Error ? saveError.message : 'Could not save your profile.'); }
    finally { setSavingProfile(false); }
  };
  const chartText = '#68788a';
  const chartRecords = detail?.recentRecords || [];
  const personalTrend = useMemo(() => {
    const grouped = new Map<string, { sum: number; count: number }>();
    chartRecords.forEach((record) => {
      const date = record.timestamp.slice(0, 10);
      if (!date) return;
      const current = grouped.get(date) || { sum: 0, count: 0 };
      current.sum += record.illustrativeExposureValue;
      current.count += 1;
      grouped.set(date, current);
    });
    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-14);
  }, [chartRecords]);
  const personalTrendOption = useMemo(() => ({
    tooltip: { trigger: 'axis', formatter: (items: any[]) => `${items?.[0]?.axisValue || ''}<br/>Average reading: ${Number(items?.[0]?.data || 0).toFixed(2)} ppmÂ·hr` },
    grid: { left: 18, right: 16, top: 26, bottom: 48, containLabel: true },
    xAxis: { type: 'category', name: 'Date', nameLocation: 'middle', nameGap: 28, boundaryGap: false, data: personalTrend.map(([date]) => date.slice(5)), axisLabel: { color: chartText }, nameTextStyle: { color: chartText }, axisLine: { lineStyle: { color: '#d5dee5' } } },
    yAxis: { type: 'value', name: 'Average reading (ppmÂ·hr)', nameTextStyle: { color: chartText }, axisLabel: { color: chartText }, splitLine: { lineStyle: { color: '#e8edf1' } } },
    series: [{ name: 'Average reading (ppmÂ·hr)', type: 'line', smooth: true, data: personalTrend.map(([, value]) => Number((value.sum / Math.max(1, value.count)).toFixed(2))), symbolSize: 7, lineStyle: { width: 3, color: '#0f766e' }, itemStyle: { color: '#0f766e' }, areaStyle: { color: 'rgba(20,184,166,.15)' }, label: { show: true, position: 'top', color: chartText, formatter: (item: any) => Number(item.value).toFixed(1) } }],
  }), [personalTrend]);
  const personalStatusOption = useMemo(() => {
    const statuses = [
      { name: 'Normal', key: 'NORMAL', color: '#16a34a' }, { name: 'Elevated', key: 'ELEVATED', color: '#eab308' },
      { name: 'Warning', key: 'WARNING', color: '#f97316' }, { name: 'Critical', key: 'CRITICAL', color: '#b91c1c' },
    ];
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} records ({d}%)' },
      legend: { bottom: 0, textStyle: { color: chartText }, itemWidth: 10, itemHeight: 10 },
      series: [{ name: 'My exposure records by safety level', type: 'pie', radius: ['44%', '72%'], center: ['50%', '45%'], itemStyle: { borderColor: '#fff', borderWidth: 3 }, label: { show: true, color: chartText, formatter: '{b}\n{c} ({d}%)' }, data: statuses.map((status) => ({ name: status.name, value: chartRecords.filter((record) => record.demoStatus === status.key).length, itemStyle: { color: status.color } })) }],
    };
  }, [chartRecords]);
  return (
    <div className={`worker-dashboard dashboard-print-root worker-view-${view} worker-space-${view} space-y-6`}>
      <section className="worker-welcome flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 md:p-8 rounded-[1.7rem]">
        <div>
          <div className="worker-live-pill"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />{view === 'details' ? 'WORKER PROFILE' : view === 'exposure' ? 'EXPOSURE HISTORY' : 'PERSONAL SAFETY SPACE'}</div>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">{view === 'details' ? 'My Details' : view === 'exposure' ? 'Shift Exposure' : `Hello, ${detail?.summary.syntheticName || user?.fullName || 'Worker'}`}</h2>
          <p className="mt-2 text-sm text-slate-500">{view === 'details' ? 'Your worker profile and assigned work details.' : view === 'exposure' ? 'Your exposure readings with shift, date, time and zone details.' : 'Your personal safety overview and exposure summary.'}</p>
        </div>
        {detail && view === 'details' && <div className="dashboard-export-panel worker-profile-export-panel"><div className="dashboard-export-intro"><span className="dashboard-export-icon"><Printer className="h-4 w-4"/></span><span><strong>Worker profile</strong><small>Save your details as a PDF document.</small></span></div><button type="button" onClick={exportWorkerProfilePdf} className="dashboard-export-button is-pdf"><Printer className="h-4 w-4"/><span>Save profile PDF</span></button></div>}
        {detail && view === 'dashboard' && <div className="worker-hero-context"><span><IdCard/>Worker ID <strong>{detail.summary.id}</strong></span><span><ShieldCheck/>Zone <strong>{detail.summary.assignedZoneName}</strong></span><span><Clock3/>Shift <strong>{detail.summary.preferredShiftName}</strong></span></div>}
      </section>

      {error && <div role="alert" className="worker-message"><AlertTriangle className="w-5 h-5 shrink-0" /><p>{error}</p></div>}

      {view === 'dashboard' && workerId && <WorkerLiveSensorPanel workerId={workerId}/>}

      {detail && <>
        {view === 'details' && <>
          {profileNotice && <p role="status" className="worker-profile-notice">{profileNotice}</p>}
          {profileError && <p role="alert" className="worker-message">{profileError}</p>}
          <div className="grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
            <section id="worker-details" className="worker-panel worker-details-panel scroll-mt-24 overflow-hidden">
              <div className="worker-panel-head"><div><p className="worker-overline">PERSONAL PROFILE</p><h3>Worker information</h3><p>Update your personal and work identity details below.</p></div>{!editingProfile && <button type="button" onClick={() => { setProfileNotice(''); setEditingProfile(true); }} className="worker-profile-edit"><Pencil className="h-4 w-4"/>Edit profile</button>}</div>
              {editingProfile ? <form onSubmit={saveProfile} className="worker-profile-form common-editor-form">
                <label className="common-editor-field"><span><UserRound/>Full name</span><input required maxLength={128} value={profileDraft.syntheticName} onChange={(event) => setProfileDraft({ ...profileDraft, syntheticName: event.target.value })}/></label>
                <label className="common-editor-field"><span><BriefcaseBusiness/>Job role</span><input required maxLength={128} value={profileDraft.role} onChange={(event) => setProfileDraft({ ...profileDraft, role: event.target.value })}/></label>
                <label className="common-editor-field"><span><Activity/>Experience (years)</span><input required type="number" min="0" max="60" value={profileDraft.experienceYears} onChange={(event) => setProfileDraft({ ...profileDraft, experienceYears: event.target.value })}/></label>
                <label className="common-editor-field"><span><IdCard/>Safety badge ID</span><input required maxLength={64} value={profileDraft.badgeId} onChange={(event) => setProfileDraft({ ...profileDraft, badgeId: event.target.value })}/></label>
                <div className="worker-profile-actions"><button disabled={savingProfile} type="submit"><Save className="h-4 w-4"/>{savingProfile ? 'Savingâ€¦' : 'Save changes'}</button><button disabled={savingProfile} type="button" onClick={() => { setEditingProfile(false); setProfileError(''); setProfileDraft({ syntheticName: detail.summary.syntheticName, role: detail.summary.role, experienceYears: String(detail.summary.experienceYears), badgeId: detail.summary.badgeId }); }}><X className="h-4 w-4"/>Cancel</button></div>
              </form> : <div className="worker-details-grid">
                <div><span><UserRound/>Name</span><strong>{detail.summary.syntheticName}</strong></div>
                <div><span><IdCard/>Worker ID</span><strong>{detail.summary.id}</strong></div>
                <div><span><BriefcaseBusiness/>Job role</span><strong>{detail.summary.role}</strong></div>
                <div><span><Activity/>Experience</span><strong>{detail.summary.experienceYears} years</strong></div>
                <div><span><BadgeCheck/>Safety badge ID</span><strong>{detail.summary.badgeId}</strong></div>
                <div><span><ShieldCheck/>Account role</span><strong>Worker</strong></div>
              </div>}
            </section>
            <aside className="worker-assignment-card"><div className="worker-assignment-icon"><ShieldCheck/></div><p className="worker-overline">CURRENT ASSIGNMENT</p><h3>Site placement</h3><dl><div><dt>Assigned zone</dt><dd>{detail.summary.assignedZoneName}</dd></div><div><dt>Preferred shift</dt><dd>{detail.summary.preferredShiftName}</dd></div><div><dt>Shift duration</dt><dd>{durationHours} hours</dd></div><div><dt>Latest status</dt><dd><span className={`worker-status ${statusTone[detail.summary.latestDemoStatus] || ''}`}>{detail.summary.latestDemoStatus}</span></dd></div></dl><p className="worker-assignment-note">Zone and shift assignments are managed by your safety administrator.</p></aside>
          </div>
          <section className="grid gap-3 sm:grid-cols-3" aria-label="Worker exposure profile summary">
            <article className="worker-stat"><span className="worker-stat-icon"><Activity className="w-5 h-5"/></span><p>Total readings</p><strong>{detail.summary.totalRecords}</strong><span className="worker-stat-note">Recorded for your worker ID</span></article>
            <article className="worker-stat"><span className="worker-stat-icon worker-stat-blue"><Gauge className="w-5 h-5"/></span><p>Average exposure</p><strong>{detail.summary.avgExposurePpmHr.toFixed(2)} <small>ppmÂ·hr</small></strong><span className="worker-stat-note">Across your recorded shifts</span></article>
            <article className="worker-stat"><span className="worker-stat-icon worker-stat-amber"><AlertTriangle className="w-5 h-5"/></span><p>Maximum recorded</p><strong>{detail.summary.maxExposurePpmHr.toFixed(2)} <small>ppmÂ·hr</small></strong><span className="worker-stat-note">Highest recorded exposure value</span></article>
          </section>
        </>}

        {view === 'dashboard' && <section className="grid grid-cols-1 sm:grid-cols-2 gap-3.5" aria-label="My exposure dose">
          <article className="worker-stat"><span className="worker-stat-icon"><Activity className="w-5 h-5" /></span><p>Average dose / shift</p><strong>{detail.summary.avgExposurePpmHr.toFixed(2)} <small>ppmÂ·hr</small></strong><span className="worker-stat-note">{durationHours}-hour {detail.summary.preferredShiftName.toLowerCase()} shift</span></article>
          <article className="worker-stat"><span className="worker-stat-icon worker-stat-blue"><ShieldCheck className="w-5 h-5" /></span><p>Latest safety status</p><strong className={`worker-status-large ${statusTone[detail.summary.latestDemoStatus] || ""}`}>{detail.summary.latestDemoStatus}</strong><span className="worker-stat-note">{latestRecord ? `${formatTimestamp(latestRecord.timestamp).date} · ${formatTimestamp(latestRecord.timestamp).time}` : "No exposure readings yet"}</span></article>
          <article className={`worker-stat ${openAlerts.length ? 'worker-stat-alert' : ''}`}><span className="worker-stat-icon worker-stat-amber"><AlertTriangle className="w-5 h-5" /></span><p>Needs attention</p><strong>{openAlerts.length}</strong><span className="worker-stat-note">Unacknowledged safety alerts</span></article>
        </section>}

        {view === 'dashboard' && <section aria-label="My exposure charts" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3 px-1"><div><p className="worker-overline">MY DATA Â· VISUAL SUMMARY</p><h3 className="mt-1 text-lg font-bold text-slate-800">My exposure charts</h3><p className="mt-1 text-xs text-slate-500">Personal readings and shift history only.</p></div></div>
          <DashboardExportActions csvUrl={api.getExportCsvUrl({ workerId })} scopeLabel="your own"/>
          <div className="grid gap-4 xl:grid-cols-2">
            <article className="worker-chart-card worker-chart-trend"><header><span className="worker-chart-index">01</span><div><h4>Exposure trend</h4><p>Daily average reading Â· ppmÂ·hr</p></div><span className="worker-chart-kind">LINE</span></header><EChartWrapper options={personalTrendOption} height="270px" downloadName={`chromaguard_worker_${workerId}_exposure_trend`}/></article>
            <article className="worker-chart-card worker-chart-status"><header><span className="worker-chart-index">02</span><div><h4>My safety levels</h4><p>Share of my readings by recorded status</p></div><span className="worker-chart-kind">DOUGHNUT</span></header><EChartWrapper options={personalStatusOption} height="270px" downloadName={`chromaguard_worker_${workerId}_safety_levels`}/></article>
          </div>
        </section>}

        {view === 'exposure' && <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Exposure history summary">
            <article className="worker-stat"><span className="worker-stat-icon"><Activity className="w-5 h-5"/></span><p>History records</p><strong>{recentRecords.length}</strong><span className="worker-stat-note">Across all recorded shifts</span></article>
            <article className="worker-stat"><span className="worker-stat-icon worker-stat-blue"><Gauge className="w-5 h-5"/></span><p>Average / shift</p><strong>{detail.summary.avgExposurePpmHr.toFixed(2)} <small>ppmÂ·hr</small></strong><span className="worker-stat-note">Average cumulative dose</span></article>
            <article className="worker-stat worker-stat-alert"><span className="worker-stat-icon worker-stat-amber"><AlertTriangle className="w-5 h-5"/></span><p>Critical readings</p><strong>{criticalRecords}</strong><span className="worker-stat-note">Highest alert category</span></article>
            <article className="worker-stat"><span className="worker-stat-icon worker-stat-blue"><Clock3 className="w-5 h-5"/></span><p>Latest reading</p><strong>{latestRecord ? latestRecord.illustrativeExposureValue.toFixed(2) : "—"} <small>ppm·hr</small></strong><span className="worker-stat-note">{latestRecord ? `${formatTimestamp(latestRecord.timestamp).date} · ${formatTimestamp(latestRecord.timestamp).time} · ${latestRecord.zoneName}` : "No readings yet"}</span></article>
          </section>
          <section className="worker-history-filters" aria-label="Filter exposure history">
            <div className="worker-history-filter-title"><div><p className="worker-overline">FIND A READING</p><h3>Filter your exposure history</h3></div><button type="button" onClick={() => { setStatusFilter(''); setShiftFilter(''); setZoneFilter(''); setDateFrom(''); setDateTo(''); setRecordSearch(''); }}>Clear filters</button></div>
            <div className="worker-history-filter-grid">
              <label className="worker-history-search"><span>Search record, zone or shift</span><div><Search/><input value={recordSearch} onChange={(event) => setRecordSearch(event.target.value)} placeholder="Search history"/></div></label>
              <label><span>Safety level</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">All levels</option>{['CRITICAL','WARNING','ELEVATED','NORMAL'].map((value) => <option key={value}>{value}</option>)}</select></label>
              <label><span>Shift</span><select value={shiftFilter} onChange={(event) => setShiftFilter(event.target.value)}><option value="">All shifts</option>{shifts.map((shift) => <option key={shift.id}>{shift.shiftName}</option>)}</select></label>
              <label><span>Zone</span><select value={zoneFilter} onChange={(event) => setZoneFilter(event.target.value)}><option value="">All zones</option>{[...new Map(recentRecords.map((record) => [record.zoneId, record])).values()].map((record) => <option key={record.zoneId} value={record.zoneId}>{record.zoneName}</option>)}</select></label>
              <label><span>From date</span><input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)}/></label>
              <label><span>To date</span><input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)}/></label>
            </div>
          </section>
        </>}

        {view === 'exposure' && <section className="grid xl:grid-cols-[1.55fr_0.85fr] gap-5">
          <div id="shift-exposure" className="worker-panel overflow-hidden scroll-mt-24">
            <div className="worker-panel-head"><div><p className="worker-overline">COMPLETE SHIFT HISTORY</p><h3>Exposure by shift</h3><p>Showing {filteredRecords.length} of {recentRecords.length} records · date, time, shift, zone, level and dose.</p></div><div className="flex items-center gap-2"><span className="worker-history-count">{filteredRecords.length} records</span><button type="button" onClick={() => { const shiftId = shifts.find((shift) => shift.shiftName === shiftFilter)?.id; void downloadFile(api.getExportCsvUrl({ workerId, zoneId: zoneFilter, shiftId, startDate: dateFrom, endDate: dateTo, demoStatus: statusFilter })).catch((reason) => window.alert(reason instanceof Error ? reason.message : 'Could not export your exposure history.')); }} className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-900"><Download className="h-3.5 w-3.5"/>Export my CSV</button></div></div>
            {loading ? <div className="p-8 text-sm text-slate-500">Loading your shift recordsâ€¦</div> : filteredRecords.length === 0 ? <div className="worker-clear-state"><span><Search className="w-6 h-6"/></span><strong>No matching readings</strong><p>Change or clear the selected filters to view more of your history.</p></div> : (
              <div className="worker-record-list worker-shift-ledger">
                {filteredRecords.map((record) => {
                  const when = formatTimestamp(record.timestamp);
                  const recordAlerts = alertsByRecord.get(record.id) || [];
                  const recordDurationHours = shifts.find((shift) => shift.shiftName === record.shiftName)?.durationHours || durationHours;
                  const hourlyDose = record.illustrativeCumulativeDose / recordDurationHours;
                  return <article key={record.id} className="worker-record">
                    <div className="worker-record-date"><strong>{when.date}</strong><span>{when.time}</span></div>
                    <div className="worker-record-main"><div className="flex items-center gap-2 flex-wrap"><strong>{record.shiftName}</strong><span className={`worker-status ${statusTone[record.demoStatus] || ''}`}>{record.demoStatus}</span>{recordAlerts.length > 0 && <span className="worker-alert-mark"><AlertTriangle className="w-3 h-3" />{recordAlerts.length} alert{recordAlerts.length > 1 ? 's' : ''}</span>}</div><span>{record.zoneName} Â· {recordDurationHours} hr shift</span></div>
                    <div className="worker-dose"><strong>{hourlyDose.toFixed(2)}</strong><span>ppmÂ·hr/hr</span><small>{record.illustrativeCumulativeDose.toFixed(2)} total dose</small></div>
                  </article>;
                })}
              </div>
            )}
          </div>

          <div className="worker-panel">
            <div className="worker-panel-head"><div><p className="worker-overline">SAFETY SIGNALS</p><h3>Alert indicators</h3><p>Alerts connected to your exposure records.</p></div><Link to="/alerts" className="worker-alert-count">{openAlerts.length}</Link></div>
            {openAlerts.length === 0 ? <div className="worker-clear-state"><span><BadgeCheck className="w-6 h-6" /></span><strong>All clear</strong><p>You have no unacknowledged alerts right now.</p></div> : <div className="worker-alert-list">{openAlerts.slice(0, 5).map((alert) => {
              const when = formatTimestamp(alert.timestamp);
              return <article key={alert.id} className="worker-alert-item"><span className={`worker-alert-dot ${alert.demoSeverity === 'CRITICAL' ? 'is-critical' : ''}`} /><div><strong>{alert.demoSeverity === 'CRITICAL' ? 'Critical exposure' : 'Exposure warning'}</strong><p>{alert.zoneName} Â· {when.date}, {when.time}</p><small>{alert.triggerValuePpmHr.toFixed(2)} ppmÂ·hr Â· limit {alert.thresholdLimitPpmHr.toFixed(2)}</small></div></article>;
            })}<Link to="/alerts" className="worker-link mt-3">View all alerts <ArrowRight className="w-4 h-4" /></Link></div>}
          </div>
        </section>}
      </>}
    </div>
  );
};
