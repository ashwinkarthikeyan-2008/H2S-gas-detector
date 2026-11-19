import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Gauge, Siren, Users } from 'lucide-react';
import { api } from '../services/api';
import { Alert, ExposureRecord, IndustrialZone, Shift, WorkerSummary } from '../types';
import { EChartWrapper } from '../components/EChartWrapper';
import { DashboardExportActions } from '../components/DashboardExportActions';

export const AdminOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [zones, setZones] = useState<IndustrialZone[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [records, setRecords] = useState<ExposureRecord[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [workerProfiles, setWorkerProfiles] = useState<WorkerSummary[]>([]);
  const [activeDataset, setActiveDataset] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([api.getZonesForManagement(), api.getShifts(), api.getExposureRecords(), api.getAlerts(), api.getWorkers(), api.getDatasetState()])
      .then(([zoneData, shiftData, recordData, alertData, workerData, datasetState]) => {
        if (!active) return;
        const activeZoneIds = new Set(recordData.map((record) => record.zoneId));
        const activeShiftIds = new Set(recordData.map((record) => record.shiftId));
        setActiveDataset(datasetState.active);
        setZones(zoneData.filter((zone) => zone.active && (!datasetState.active || activeZoneIds.has(zone.id))));
        setShifts(datasetState.active ? shiftData.filter((shift) => activeShiftIds.has(shift.id)) : shiftData);
        setRecords(recordData); setAlerts(alertData); setWorkerProfiles(workerData);
      })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : 'Dashboard data could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const workers = activeDataset ? new Set(records.map((record) => record.workerId)).size : workerProfiles.length;
  const riskRecords = useMemo(() => records.filter((record) => ['HIGH', 'CRITICAL'].includes(record.demoStatus)).length, [records]);
  const openAlerts = useMemo(() => alerts.filter((alert) => !alert.isAcknowledged).length, [alerts]);
  const zonesByActivity = useMemo(() => zones.filter((zone) => activeDataset ? records.some((record) => record.zoneId === zone.id) : workerProfiles.some((worker) => worker.assignedZoneId === zone.id) || records.some((record) => record.zoneId === zone.id)).map((zone) => {
    const rows = records.filter((record) => record.zoneId === zone.id);
    return { zone, rows, workers: activeDataset ? new Set(rows.map((record) => record.workerId)).size : workerProfiles.filter((worker) => worker.assignedZoneId === zone.id).length, risks: rows.filter((record) => ['HIGH', 'CRITICAL'].includes(record.demoStatus)).length };
  }), [zones, records, workerProfiles, activeDataset]);
  const shiftsByActivity = useMemo(() => shifts.filter((shift) => activeDataset ? records.some((record) => record.shiftId === shift.id) : workerProfiles.some((worker) => worker.preferredShiftId === shift.id) || records.some((record) => record.shiftId === shift.id)).map((shift) => {
    const rows = records.filter((record) => record.shiftId === shift.id);
    return { shift, rows, workers: activeDataset ? new Set(rows.map((record) => record.workerId)).size : workerProfiles.filter((worker) => worker.preferredShiftId === shift.id).length, risks: rows.filter((record) => ['HIGH', 'CRITICAL'].includes(record.demoStatus)).length };
  }), [shifts, records, workerProfiles, activeDataset]);
  const chartText = '#64748b';
  const trendByDay = useMemo(() => {
    const groups = new Map<string, { sum: number; count: number }>();
    records.forEach((record) => {
      const day = record.timestamp.slice(0, 10);
      if (!day) return;
      const current = groups.get(day) || { sum: 0, count: 0 };
      current.sum += record.illustrativeExposureValue;
      current.count += 1;
      groups.set(day, current);
    });
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [records]);
  const trendOption = useMemo(() => ({
    tooltip: { trigger: 'axis', formatter: (params: any[]) => `${params?.[0]?.axisValue || ''}<br/>Average reading: ${Number(params?.[0]?.data || 0).toFixed(2)} ppm·hr` },
    grid: { left: 18, right: 16, top: 30, bottom: 48, containLabel: true },
    xAxis: { type: 'category', name: 'Date', nameLocation: 'middle', nameGap: 28, boundaryGap: false, data: trendByDay.map(([day]) => day.slice(5)), axisLabel: { color: chartText }, nameTextStyle: { color: chartText }, axisLine: { lineStyle: { color: '#cbd5e1' } } },
    yAxis: { type: 'value', name: 'Average exposure (ppm·hr)', nameTextStyle: { color: chartText }, axisLabel: { color: chartText }, splitLine: { lineStyle: { color: '#e2e8f0' } } },
    series: [{ name: 'Average exposure (ppm·hr)', type: 'line', smooth: true, data: trendByDay.map(([, v]) => Number((v.sum / Math.max(1, v.count)).toFixed(2))), symbolSize: 7, lineStyle: { width: 3, color: '#0f766e' }, itemStyle: { color: '#0f766e' }, areaStyle: { color: 'rgba(20,184,166,.16)' }, label: { show: true, position: 'top', color: chartText, formatter: (item: any) => Number(item.value).toFixed(1) } }],
  }), [trendByDay]);
  const zoneChartOption = useMemo(() => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } }, legend: { top: 0, textStyle: { color: chartText } },
    grid: { left: 18, right: 16, top: 42, bottom: 55, containLabel: true },
    xAxis: { type: 'category', name: 'Zone', nameLocation: 'middle', nameGap: 34, data: zonesByActivity.map(({ zone }) => zone.zoneCode), axisLabel: { color: chartText, rotate: zonesByActivity.length > 4 ? 20 : 0 }, nameTextStyle: { color: chartText }, axisLine: { lineStyle: { color: '#cbd5e1' } } },
    yAxis: { type: 'value', name: 'Record count', nameTextStyle: { color: chartText }, axisLabel: { color: chartText }, splitLine: { lineStyle: { color: '#e2e8f0' } } },
    series: [
      { name: 'All readings (records)', type: 'bar', data: zonesByActivity.map(({ rows }) => rows.length), barMaxWidth: 32, itemStyle: { color: '#0e7490', borderRadius: [6, 6, 0, 0] }, label: { show: true, position: 'top', color: chartText } },
      { name: 'High / critical readings (records)', type: 'bar', data: zonesByActivity.map(({ risks }) => risks), barMaxWidth: 32, itemStyle: { color: '#e11d48', borderRadius: [6, 6, 0, 0] }, label: { show: true, position: 'top', color: chartText } },
    ],
  }), [zonesByActivity]);
  const shiftChartOption = useMemo(() => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { top: 0, textStyle: { color: chartText } },
    grid: { left: 16, right: 24, top: 38, bottom: 16, containLabel: true },
    xAxis: { type: 'value', name: 'Count', nameLocation: 'middle', nameGap: 25, minInterval: 1, nameTextStyle: { color: chartText }, axisLabel: { color: chartText }, splitLine: { lineStyle: { color: '#e2e8f0' } } },
    yAxis: { type: 'category', name: 'Shift', nameTextStyle: { color: chartText }, data: shiftsByActivity.map(({ shift }) => shift.shiftName).reverse(), axisLabel: { color: chartText }, axisLine: { lineStyle: { color: '#cbd5e1' } } },
    series: [
      { name: 'Workers (people)', type: 'bar', barMaxWidth: 18, data: shiftsByActivity.map(({ workers: shiftWorkers }) => shiftWorkers).reverse(), itemStyle: { color: '#0284c7', borderRadius: [0, 5, 5, 0] }, label: { show: true, position: 'right', color: chartText } },
      { name: 'Exposure readings (records)', type: 'bar', barMaxWidth: 18, data: shiftsByActivity.map(({ rows }) => rows.length).reverse(), itemStyle: { color: '#7c3aed', borderRadius: [0, 5, 5, 0] }, label: { show: true, position: 'right', color: chartText } },
      { name: 'High / critical cases (records)', type: 'bar', barMaxWidth: 18, data: shiftsByActivity.map(({ risks }) => risks).reverse(), itemStyle: { color: '#e11d48', borderRadius: [0, 5, 5, 0] }, label: { show: true, position: 'right', color: chartText } },
    ],
  }), [shiftsByActivity]);
  const statusOption = useMemo(() => {
    const statusColors: Record<string, string> = { NORMAL: '#16a34a', ELEVATED: '#eab308', WARNING: '#f97316', HIGH: '#fb7185', CRITICAL: '#b91c1c' };
    const counts = ['NORMAL', 'ELEVATED', 'WARNING', 'HIGH', 'CRITICAL'].map((name) => ({ name, value: records.filter((record) => record.demoStatus === name).length, itemStyle: { color: statusColors[name] } }));
    return { tooltip: { trigger: 'item', formatter: '{b}: {c} records ({d}%)' }, legend: { bottom: 0, textStyle: { color: chartText }, itemWidth: 10, itemHeight: 10 }, series: [{ name: 'Exposure records by safety level', type: 'pie', radius: ['42%', '72%'], center: ['50%', '44%'], avoidLabelOverlap: true, itemStyle: { borderColor: '#fff', borderWidth: 3 }, label: { show: true, color: chartText, formatter: '{b}\n{c} ({d}%)' }, data: counts }] };
  }, [records]);
  const doseOption = useMemo(() => {
    const levels = [
      { name: 'Normal', color: '#16a34a' }, { name: 'Elevated', color: '#eab308' },
      { name: 'Warning', color: '#f97316' }, { name: 'High', color: '#fb7185' }, { name: 'Critical', color: '#b91c1c' },
    ];
    return {
      tooltip: { trigger: 'item', formatter: (item: any) => `Safety level: ${item?.seriesName || 'Unknown'}<br/>Worker: ${item?.data?.[2] || 'Unknown'}<br/>Exposure reading: ${Number(item?.value?.[0] || 0).toFixed(2)} ppm·hr<br/>Cumulative dose: ${Number(item?.value?.[1] || 0).toFixed(2)} ppm·hr` },
      legend: { top: 0, textStyle: { color: chartText } },
      grid: { left: 18, right: 20, top: 44, bottom: 48, containLabel: true },
      xAxis: { type: 'value', name: 'Exposure reading (ppm·hr)', nameLocation: 'middle', nameGap: 28, nameTextStyle: { color: chartText }, axisLabel: { color: chartText }, splitLine: { lineStyle: { color: '#e2e8f0' } } },
      yAxis: { type: 'value', name: 'Cumulative dose (ppm·hr)', nameTextStyle: { color: chartText }, axisLabel: { color: chartText }, splitLine: { lineStyle: { color: '#e2e8f0' } } },
      series: levels.map((level) => ({ name: level.name, type: 'scatter', symbolSize: 9, itemStyle: { color: level.color, opacity: .72 }, data: records.filter((record) => record.demoStatus.toLowerCase() === level.name.toLowerCase()).map((record) => [record.illustrativeExposureValue, record.illustrativeCumulativeDose, record.workerName]) })),
    };
  }, [records]);
  const importedNumericColumns = useMemo(() => {
    const totals = new Map<string, { sum: number; count: number; max: number }>();
    records.forEach((record) => {
      if (!record.sourceDatasetJson) return;
      try {
        const source = JSON.parse(record.sourceDatasetJson) as Record<string, string>;
        Object.entries(source).forEach(([column, raw]) => {
          const value = raw?.trim();
          if (!value || !/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(value)) return;
          const number = Number(value);
          if (!Number.isFinite(number)) return;
          const current = totals.get(column) || { sum: 0, count: 0, max: Number.NEGATIVE_INFINITY };
          current.sum += number;
          current.count += 1;
          current.max = Math.max(current.max, number);
          totals.set(column, current);
        });
      } catch { /* keep imported row available even if a legacy payload is malformed */ }
    });
    return [...totals.entries()].filter(([, value]) => value.count > 0)
      .sort(([a], [b]) => a.localeCompare(b));
  }, [records]);
  const importedColumnsOption = useMemo(() => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { top: 0, textStyle: { color: chartText } },
    grid: { left: 24, right: 18, top: 42, bottom: 58, containLabel: true },
    xAxis: { type: 'category', name: 'Original CSV numeric column (unit shown in header)', nameLocation: 'middle', nameGap: 38, data: importedNumericColumns.map(([name]) => name), axisLabel: { color: chartText, rotate: 25, interval: 0 }, nameTextStyle: { color: chartText } },
    yAxis: { type: 'value', name: 'Source value', nameTextStyle: { color: chartText }, axisLabel: { color: chartText }, splitLine: { lineStyle: { color: '#e2e8f0' } } },
    series: [
      { name: 'Average across imported rows', type: 'bar', data: importedNumericColumns.map(([, values]) => Number((values.sum / values.count).toFixed(3))), itemStyle: { color: '#0891b2', borderRadius: [5, 5, 0, 0] } },
      { name: 'Maximum across imported rows', type: 'bar', data: importedNumericColumns.map(([, values]) => Number(values.max.toFixed(3))), itemStyle: { color: '#f97316', borderRadius: [5, 5, 0, 0] } },
    ],
  }), [importedNumericColumns]);

  const openMonitoring = (zoneId = '', shiftId = '') => {
    const params = new URLSearchParams();
    if (zoneId) params.set('zoneId', zoneId);
    if (shiftId) params.set('shiftId', shiftId);
    navigate(`/exposure-monitoring${params.size ? `?${params.toString()}` : ''}`);
  };

  return <div className="admin-dashboard dashboard-print-root space-y-6 text-slate-800">
    <section className="dashboard-hero relative overflow-hidden rounded-3xl p-6 md:p-8">
      <div className="relative z-10 flex flex-wrap items-end justify-between gap-5"><div>
        <p className="dashboard-eyebrow inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"/>ADMIN OVERVIEW</p>
        <h2 className="dashboard-title mt-4 text-3xl font-bold tracking-tight">Safety dashboard</h2>
        <p className="dashboard-copy mt-2 max-w-2xl text-sm">At a glance, compare zone and shift activity. Select any row to open its detailed exposure history.</p>
      </div><button onClick={() => openMonitoring()} className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/15 transition hover:-translate-y-0.5 hover:bg-indigo-800">Open exposure monitoring<ArrowRight className="h-4 w-4"/></button></div>
    </section>

    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
    {loading && <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">Loading dashboard…</p>}
    <section aria-label="Plant summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { label: 'Registered workers', value: workers, icon: Users, tone: 'teal' },
        { label: 'Exposure readings', value: records.length, icon: Activity, tone: 'blue' },
        { label: 'High / critical', value: riskRecords, icon: Gauge, tone: 'rose' },
        { label: 'Open alerts', value: openAlerts, icon: Siren, tone: 'amber' },
      ].map((stat) => { const Icon = stat.icon; return <article key={stat.label} className={`dashboard-stat dashboard-stat-${stat.tone}`}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">{stat.label}</p><p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{stat.value}</p></div><span className="dashboard-stat-icon"><Icon className="h-5 w-5"/></span></div></article>; })}
    </section>

    <section aria-label="Exposure charts" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 px-1"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-teal-700">Visual analytics</p><h3 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Exposure insights</h3><p className="mt-1 text-xs text-slate-500">Different views of the same monitoring data, with units and labels for quick comparison.</p></div><span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[11px] font-medium text-slate-500">{records.length} records · auto-updated from dashboard data</span></div>
      <DashboardExportActions csvUrl={api.getExportCsvUrl()} scopeLabel="dashboard"/>
      {records.length === 0 ? <div className="dashboard-empty-state"><div className="dashboard-empty-icon"><Activity className="h-6 w-6"/></div><div><h3>No exposure readings recorded</h3><p>{workerProfiles.length === 0 ? 'Registered worker profiles and their assignments will appear in Worker Details. Exposure charts will fill when worker readings are recorded.' : `${workerProfiles.length} worker profile${workerProfiles.length === 1 ? '' : 's'} registered. Exposure charts will fill when their readings are recorded.`}</p></div></div> : <div className="dashboard-chart-grid grid gap-5 xl:grid-cols-2">
        <article className="dashboard-panel dashboard-chart-card dashboard-chart-trend"><header className="dashboard-chart-header"><span className="dashboard-chart-index">01</span><div><h3>Exposure trend</h3><p>Daily average reading · all imported dates</p></div><span className="dashboard-chart-type">LINE</span></header><EChartWrapper options={trendOption} height="286px" downloadName="chromaguard_exposure_trend"/></article>
        <article className="dashboard-panel dashboard-chart-card dashboard-chart-zone"><header className="dashboard-chart-header"><span className="dashboard-chart-index">02</span><div><h3>Zone comparison</h3><p>Total readings and high / critical cases</p></div><span className="dashboard-chart-type">BAR</span></header><EChartWrapper options={zoneChartOption} height="286px" downloadName="chromaguard_zone_comparison"/></article>
        <article className="dashboard-panel dashboard-chart-card dashboard-chart-shift"><header className="dashboard-chart-header"><span className="dashboard-chart-index">03</span><div><h3>Shift-wise activity</h3><p>Workers, readings, and high / critical cases</p></div><span className="dashboard-chart-type">GROUPED BAR</span></header><EChartWrapper options={shiftChartOption} height="286px" downloadName="chromaguard_shift_activity"/></article>
        <article className="dashboard-panel dashboard-chart-card dashboard-chart-status"><header className="dashboard-chart-header"><span className="dashboard-chart-index">04</span><div><h3>Exposure level distribution</h3><p>Share of readings by recorded safety level</p></div><span className="dashboard-chart-type">DOUGHNUT</span></header><EChartWrapper options={statusOption} height="286px" downloadName="chromaguard_exposure_levels"/></article>
        <article className="dashboard-panel dashboard-chart-card dashboard-chart-dose xl:col-span-2"><header className="dashboard-chart-header"><span className="dashboard-chart-index">05</span><div><h3>Reading vs cumulative dose</h3><p>Each point is a record; color identifies safety level. Hover for worker details.</p></div><span className="dashboard-chart-type">SCATTER</span></header><EChartWrapper options={doseOption} height="310px" downloadName="chromaguard_reading_vs_dose"/></article>
        {importedNumericColumns.length > 0 && <article className="dashboard-panel dashboard-chart-card xl:col-span-2"><header className="dashboard-chart-header"><span className="dashboard-chart-index">06</span><div><h3>Imported dataset columns</h3><p>Average and maximum for every numeric source column, calculated across all imported rows.</p></div><span className="dashboard-chart-type">SOURCE DATA</span></header><EChartWrapper options={importedColumnsOption} height="330px" downloadName="chromaguard_imported_columns"/></article>}
      </div>}
    </section>

  </div>;
};
