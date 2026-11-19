import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { Activity, AlertTriangle, BarChart3, Check, Database, Download, FileSpreadsheet, MapPin, Pencil, Plus, RefreshCw, ShieldCheck, Trash2, Upload, Users, X } from 'lucide-react';
import { api, downloadFile } from '../services/api';
import { Alert, ExposureRecord, IndustrialZone, LoginResponse, Shift, WorkerDetail, WorkerSummary } from '../types';
import { FacilityLocation, ZoneCoordinate, ZoneGeographicMap } from '../components/ZoneGeographicMap';
import { DashboardExportActions } from '../components/DashboardExportActions';
import { Esp8266SensorPanel } from '../components/Esp8266SensorPanel';

type DatasetInspection = { headers: string[]; sampleRows: string[][]; suggestedColumns: Record<string, string> };
const levels = ['NORMAL', 'ELEVATED', 'WARNING', 'CRITICAL'] as const;
const levelStyle: Record<string, string> = { NORMAL: 'bg-emerald-100 text-emerald-800', ELEVATED: 'bg-yellow-100 text-yellow-900', WARNING: 'bg-orange-100 text-orange-900', CRITICAL: 'bg-rose-100 text-rose-900' };
const formatDate = (value: string) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); };
const readSource = (record: ExposureRecord): Record<string, string> => { try { return record.sourceDatasetJson ? JSON.parse(record.sourceDatasetJson) : {}; } catch { return {}; } };
const sourceCoordinate = (rows: ExposureRecord[]): ZoneCoordinate | null => {
  for (const record of rows) {
    const source = readSource(record);
    const normalized = Object.entries(source).map(([key, value]) => [key.toLowerCase().replace(/[^a-z]/g, ''), value] as const);
    const find = (aliases: string[]) => normalized.find(([key, value]) => aliases.includes(key) && String(value).trim() !== '')?.[1];
    const lat = Number(find(['lat', 'latitude', 'gpslat', 'ycoord']));
    const lng = Number(find(['lng', 'lon', 'longitude', 'gpslon', 'xcoord']));
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && (lat !== 0 || lng !== 0)) return { lat, lng };
  }
  return null;
};
const generatedZoneCoordinate = (center: ZoneCoordinate, id: string, index: number): ZoneCoordinate => {
  // Spread zones around the selected facility when the source file has no GPS coordinates.
  let hash = 0; for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  const angle = ((index * 137.508 + (Math.abs(hash) % 31)) % 360) * Math.PI / 180;
  const distanceKm = 0.12 + (index % 5) * 0.055;
  return { lat: center.lat + (distanceKm / 111) * Math.cos(angle), lng: center.lng + (distanceKm / (111 * Math.max(0.2, Math.cos(center.lat * Math.PI / 180)))) * Math.sin(angle) };
};

export const AdminDashboardPage: React.FC = () => {
  const [params] = useSearchParams();
  const [user] = useState<LoginResponse | null>(() => { try { return JSON.parse(localStorage.getItem('chromaguard_user') || 'null'); } catch { return null; } });
  const [zones, setZones] = useState<IndustrialZone[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [records, setRecords] = useState<ExposureRecord[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [workers, setWorkers] = useState<WorkerSummary[]>([]);
  const [activeDataset, setActiveDataset] = useState(false);
  const [loading, setLoading] = useState(true);
  const hasLoaded = React.useRef(false);
  const [error, setError] = useState('');
  const [zoneId, setZoneId] = useState(params.get('zoneId') || '');
  const [shiftId, setShiftId] = useState(params.get('shiftId') || '');
  const [zoneLevelFilter, setZoneLevelFilter] = useState('');
  const [zoneLocations, setZoneLocations] = useState<Record<string, ZoneCoordinate>>(() => { try { return JSON.parse(localStorage.getItem('chromaguard_zone_locations') || '{}'); } catch { return {}; } });
  const [unpinnedZoneIds, setUnpinnedZoneIds] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('chromaguard_unpinned_zone_ids') || '[]'); } catch { return []; } });
  const [facilityLocation, setFacilityLocation] = useState<FacilityLocation | null>(() => { try { return JSON.parse(localStorage.getItem('chromaguard_facility_location') || 'null'); } catch { return null; } });
  const [datasetFile, setDatasetFile] = useState<File | null>(null);
  const [inspection, setInspection] = useState<DatasetInspection | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [datasetError, setDatasetError] = useState('');
  const [datasetMessage, setDatasetMessage] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterColumn, setFilterColumn] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [workerDetail, setWorkerDetail] = useState<WorkerDetail | null>(null);
  const [workerLoading, setWorkerLoading] = useState(false);
  const [zoneModal, setZoneModal] = useState(false);
  const [editingZone, setEditingZone] = useState<IndustrialZone | null>(null);
  const [zoneForm, setZoneForm] = useState({ zoneCode: '', zoneName: '', riskTier: 'LOW' as IndustrialZone['riskTier'], baselineExposurePpmHr: '0', description: '' });
  const [zoneBusy, setZoneBusy] = useState(false);
  const [modalError, setModalError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    setLoading(!hasLoaded.current); setError('');
    try {
      const [zoneRows, shiftRows, recordRows, alertRows, workerRows, datasetState] = await Promise.all([
        api.getZonesForManagement(), api.getShifts(), api.getExposureRecords(undefined, 0), api.getAlerts(), api.getWorkers(), api.getDatasetState(),
      ]);
      setZones(zoneRows); setActiveDataset(datasetState.active); setRecords(recordRows); setAlerts(alertRows); setWorkers(workerRows);
      const datasetShiftIds = new Set(recordRows.map((record) => record.shiftId));
      setShifts(datasetState.active ? shiftRows.filter((shift) => datasetShiftIds.has(shift.id)) : shiftRows);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not load monitoring data.'); }
    finally { hasLoaded.current = true; setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, 30000); return () => window.clearInterval(timer); }, [refresh]);
  useEffect(() => { localStorage.setItem('chromaguard_zone_locations', JSON.stringify(zoneLocations)); }, [zoneLocations]);
  useEffect(() => { localStorage.setItem('chromaguard_unpinned_zone_ids', JSON.stringify(unpinnedZoneIds)); }, [unpinnedZoneIds]);
  useEffect(() => { if (facilityLocation) localStorage.setItem('chromaguard_facility_location', JSON.stringify(facilityLocation)); else localStorage.removeItem('chromaguard_facility_location'); }, [facilityLocation]);
  const selectMapZone = useCallback((id: string) => { setZoneId(id); setZoneLevelFilter(''); }, []);
  const setZoneLocation = useCallback((id: string, coordinate: ZoneCoordinate) => { setZoneLocations((previous) => ({ ...previous, [id]: coordinate })); setUnpinnedZoneIds((previous) => previous.filter((zoneId) => zoneId !== id)); }, []);
  const resetZoneLocation = useCallback((id: string) => { setZoneLocations((previous) => { const next = { ...previous }; delete next[id]; return next; }); setUnpinnedZoneIds((previous) => previous.includes(id) ? previous : [...previous, id]); }, []);
  const confirmFacilityLocation = useCallback((location: FacilityLocation) => {
    const changed = !!facilityLocation && (Math.abs(facilityLocation.lat - location.lat) > .00001 || Math.abs(facilityLocation.lng - location.lng) > .00001);
    if (changed && Object.keys(zoneLocations).length) {
      if (!window.confirm('Changing the plant location will recreate all automatic zone pins at the new site. Continue?')) return false;
    }
    if (changed || !facilityLocation) {
      setZoneLocations({});
      setUnpinnedZoneIds([]);
    }
    setFacilityLocation(location);
    return true;
  }, [facilityLocation, zoneLocations]);

  const filteredRecords = useMemo(() => records.filter((record) => (!zoneId || record.zoneId === zoneId) && (!shiftId || record.shiftId === shiftId)), [records, zoneId, shiftId]);
  const zoneMapRows = useMemo(() => zones.map((zone) => {
    const zoneRecords = records.filter((record) => record.zoneId === zone.id && (!shiftId || record.shiftId === shiftId));
    const peak = zoneRecords.reduce((max, record) => Math.max(max, levels.indexOf(record.demoStatus)), -1);
    const level = peak >= 0 ? levels[peak] : 'NO DATA';
    return { zone, zoneRecords, level, sourceLocation: sourceCoordinate(zoneRecords), workerCount: activeDataset ? new Set(zoneRecords.map((record) => record.workerId)).size : workers.filter((worker) => worker.assignedZoneId === zone.id).length, peakDose: zoneRecords.reduce((max, record) => Math.max(max, record.illustrativeExposureValue), 0) };
  }), [zones, records, shiftId, activeDataset, workers]);
  useEffect(() => {
    if (!facilityLocation || !zoneMapRows.length) return;
    setZoneLocations((previous) => {
      let changed = false;
      const next = { ...previous };
      zoneMapRows.forEach((row, index) => {
        if (next[row.zone.id] || unpinnedZoneIds.includes(row.zone.id)) return;
        next[row.zone.id] = row.sourceLocation || generatedZoneCoordinate(facilityLocation, row.zone.id, index);
        changed = true;
      });
      return changed ? next : previous;
    });
  }, [facilityLocation, zoneMapRows, unpinnedZoneIds]);
  const selectedZoneMapRow = zoneMapRows.find((row) => row.zone.id === zoneId) || null;
  const selectedZoneRecords = useMemo(() => (selectedZoneMapRow?.zoneRecords || []).filter((record) => !zoneLevelFilter || record.demoStatus === zoneLevelFilter).slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp)), [selectedZoneMapRow, zoneLevelFilter]);
  const monitoredWorkers = useMemo(() => activeDataset
    ? workers.filter((worker) => records.some((record) => record.workerId === worker.id) && (!zoneId || worker.assignedZoneId === zoneId) && (!shiftId || worker.preferredShiftId === shiftId))
    : workers.filter((worker) => (!zoneId || worker.assignedZoneId === zoneId) && (!shiftId || worker.preferredShiftId === shiftId)), [workers, records, activeDataset, zoneId, shiftId]);
  const filteredAlerts = useMemo(() => alerts.filter((alert) => (!zoneId || alert.zoneId === zoneId) && (!shiftId || records.some((record) => record.id === alert.recordId && record.shiftId === shiftId))), [alerts, records, zoneId, shiftId]);
  const importedRows = useMemo(() => records.filter((record) => !!record.sourceDatasetJson), [records]);
  const datasetColumns = useMemo(() => [...new Set(importedRows.flatMap((record) => Object.keys(readSource(record))))], [importedRows]);
  const filterValues = useMemo(() => filterColumn ? [...new Set(importedRows.map((record) => readSource(record)[filterColumn] ?? ''))].sort((a, b) => a.localeCompare(b)) : [], [importedRows, filterColumn]);
  const shownRows = useMemo(() => importedRows.filter((record) => !filterColumn || !filterValue || (readSource(record)[filterColumn] ?? '') === filterValue), [importedRows, filterColumn, filterValue]);
  const recommendation = useMemo(() => {
    const scored = datasetColumns.map((column) => {
      const values = importedRows.map((record) => readSource(record)[column] ?? '');
      const unique = new Set(values).size;
      const semantic = /zone|area|block|shift|worker|status|level|severity|date|time/i.test(column) ? 2 : 0;
      return { column, unique, score: semantic + (unique > 1 && unique <= Math.max(2, Math.ceil(values.length * .6)) ? 1 : 0) };
    }).sort((a, b) => b.score - a.score || a.column.localeCompare(b.column));
    return scored[0]?.score ? scored[0] : null;
  }, [datasetColumns, importedRows]);

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (!/\.(csv|tsv)$/i.test(file.name) && !/csv|tab-separated/i.test(file.type)) { setDatasetError('Choose a CSV or TSV file.'); return; }
    if (file.size > 100 * 1024 * 1024) { setDatasetError('This file exceeds the 100 MB upload limit.'); return; }
    setBusy(true); setDatasetError(''); setDatasetMessage(''); setDatasetFile(file); setInspection(null);
    try { const info = await api.inspectDataset(file); setInspection(info); setMapping(info.suggestedColumns); }
    catch (err) { setDatasetFile(null); setDatasetError(err instanceof Error ? err.message : 'Could not inspect the dataset.'); }
    finally { setBusy(false); }
  };
  const importDataset = async () => {
    if (!datasetFile) return;
    setBusy(true); setDatasetError('');
    try {
      const result = await api.importDataset(datasetFile, mapping);
      setDatasetMessage(`${result.importedReadings} rows imported; ${result.skippedRows} blank rows skipped. All source columns were retained. Clearing this dataset removes exposure records and alerts while preserving registered worker accounts.`);
      setDatasetFile(null); setInspection(null); setFilterColumn(''); setFilterValue(''); await refresh();
      window.dispatchEvent(new CustomEvent('chromaguard:dataset-imported'));
    } catch (err) { setDatasetError(err instanceof Error ? err.message : 'Could not import the dataset.'); }
    finally { setBusy(false); }
  };
  const clearDataset = async () => {
    if (!window.confirm('Clear every imported dataset and remove all exposure readings, alerts, and analysis data derived from them? Registered worker accounts will be kept. This cannot be undone.')) return;
    setBusy(true);
    try { const result = await api.clearImportedDataset(); setDatasetMessage(result.message); setDatasetError(''); setDatasetFile(null); setInspection(null); setMapping({}); setFilterOpen(false); setFilterColumn(''); setFilterValue(''); setZoneId(''); setShiftId(''); setZoneLevelFilter(''); setZoneLocations({}); setUnpinnedZoneIds([]); setFacilityLocation(null); localStorage.removeItem('chromaguard_zone_locations'); localStorage.removeItem('chromaguard_unpinned_zone_ids'); localStorage.removeItem('chromaguard_facility_location'); await refresh(); window.dispatchEvent(new Event('chromaguard:simulation-reset')); }
    catch (err) { setDatasetError(err instanceof Error ? err.message : 'Could not clear the imported dataset.'); }
    finally { setBusy(false); }
  };
  const showZoneForm = (zone?: IndustrialZone) => {
    setEditingZone(zone || null); setModalError('');
    setZoneForm(zone ? { zoneCode: zone.zoneCode, zoneName: zone.zoneName, riskTier: zone.riskTier, baselineExposurePpmHr: String(zone.baselineExposurePpmHr), description: zone.description || '' } : { zoneCode: '', zoneName: '', riskTier: 'LOW', baselineExposurePpmHr: '0', description: '' });
    setZoneModal(true);
  };
  const saveZone = async (event: React.FormEvent) => {
    event.preventDefault(); setZoneBusy(true); setModalError('');
    const data = { ...zoneForm, zoneCode: zoneForm.zoneCode.trim().toUpperCase(), zoneName: zoneForm.zoneName.trim(), baselineExposurePpmHr: Number(zoneForm.baselineExposurePpmHr), description: zoneForm.description.trim() };
    try {
      const saved = editingZone ? await api.updateZone(editingZone.id, data) : await api.createZone(data);
      await refresh(); setZoneModal(false); setNotice(`${saved.zoneCode} · ${saved.zoneName} ${editingZone ? 'updated' : 'added'} successfully.`);
    } catch (err) { setModalError(err instanceof Error ? err.message : 'Could not save zone.'); }
    finally { setZoneBusy(false); }
  };
  const deleteZone = async (zone: IndustrialZone) => {
    if (!window.confirm(`Delete zone ${zone.zoneCode} · ${zone.zoneName}?`)) return;
    try { await api.deleteZone(zone.id); if (zoneId === zone.id) setZoneId(''); await refresh(); setNotice(`${zone.zoneName} was deleted; its history is retained.`); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not delete the zone.'); }
  };
  const restoreZone = async (zone: IndustrialZone) => {
    try { await api.restoreZone(zone.id); await refresh(); setNotice(`${zone.zoneName} was restored.`); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not restore the zone.'); }
  };
  const openWorker = async (workerId: string) => {
    setWorkerLoading(true); setWorkerDetail(null);
    try { setWorkerDetail(await api.getWorkerDetail(workerId)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load worker history.'); }
    finally { setWorkerLoading(false); }
  };

  const zoneForEdit = editingZone;
  return <div className="dashboard-print-root space-y-6 text-slate-800">
    <section className="workspace-hero rounded-3xl border border-cyan-100 bg-gradient-to-r from-cyan-50 via-white to-indigo-50 p-6 shadow-sm md:p-8"><div className="flex flex-wrap items-center justify-between gap-5"><div><p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"/>Live safety monitoring</p><h2 className="mt-4 text-3xl font-bold text-slate-900">Plant exposure monitoring</h2><p className="mt-2 text-sm text-slate-600">Review readings, active zones, safety alerts and imported source data.</p></div><div className="rounded-2xl border border-slate-200 bg-white/90 p-4"><p className="text-xs text-slate-500">Signed in as admin</p><p className="mt-1 font-semibold">{user?.fullName || user?.username || 'Admin'}</p><p className="text-xs text-slate-500">Admin ID: {user?.username || '—'}</p></div></div></section>
    {error && <div role="alert" className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}<button onClick={() => void refresh()} className="font-semibold underline">Retry</button></div>}
    {notice && <div role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}<button onClick={() => setNotice('')} className="ml-3 underline">Dismiss</button></div>}
    <section className="admin-monitor-summary" aria-label="Current monitoring summary"><article><span>Zones in view</span><strong>{activeDataset ? new Set(records.map((record) => record.zoneId)).size : zones.filter((zone) => zone.active).length}</strong><small>{activeDataset ? 'Imported dataset zones' : 'Configured facility zones'}</small></article><article><span>Workers</span><strong>{activeDataset ? new Set(filteredRecords.map((record) => record.workerId)).size : monitoredWorkers.length}</strong><small>Current selection</small></article><article><span>Exposure readings</span><strong>{filteredRecords.length}</strong><small>Current selection</small></article><article><span>Open alerts</span><strong>{filteredAlerts.filter((alert) => !alert.isAcknowledged).length}</strong><small>Current selection</small></article></section>

    <Esp8266SensorPanel workers={workers}/>

    <section className="workspace-panel rounded-3xl border border-cyan-100 bg-gradient-to-br from-white via-cyan-50/40 to-indigo-50/50 p-5 shadow-sm md:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-start gap-3"><span className="rounded-2xl bg-gradient-to-br from-cyan-700 to-indigo-700 p-3 text-white"><Database className="h-5 w-5"/></span><div><p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-800">Dataset workspace</p><h3 className="mt-1 text-xl font-bold text-slate-900">Import exposure data</h3><p className="mt-1 max-w-xl text-sm text-slate-600">Choose a CSV/TSV, map its fields, review sample rows and import the complete dataset.</p></div></div><a href="/exposure-readings-template.csv" download className="rounded-xl border border-cyan-200 bg-white px-3 py-2 text-xs font-semibold text-cyan-900">Get CSV template</a></div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_.8fr]"><label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cyan-200 bg-white/80 p-5 text-center hover:border-cyan-500"><Upload className="h-7 w-7 text-cyan-700"/><strong className="mt-3 text-sm">{datasetFile?.name || 'Select a CSV or TSV dataset'}</strong><span className="mt-1 text-xs text-slate-500">All source columns are preserved · up to 100 MB</span><input type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values" className="sr-only" disabled={busy} onChange={(event) => { void handleFile(event.target.files?.[0]); event.currentTarget.value = ''; }}/></label><div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">{[{ icon: FileSpreadsheet, title: 'Choose', text: 'Select or drop a dataset.' }, { icon: Check, title: 'Review', text: 'Confirm column mapping.' }, { icon: BarChart3, title: 'Analyze', text: 'Filter and chart after import.' }].map(({ icon: Icon, title, text }) => <div key={title} className="flex items-center gap-3 rounded-xl border border-white bg-white/80 p-3"><Icon className="h-5 w-5 text-indigo-700"/><div><strong className="text-xs">{title}</strong><p className="text-[11px] text-slate-500">{text}</p></div></div>)}</div></div>
      {datasetFile && inspection && <div className="mt-4 space-y-4 rounded-2xl border border-cyan-100 bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{datasetFile.name}</strong><span className="text-xs text-slate-500">{inspection.headers.length} columns · {inspection.sampleRows.length} sample rows</span></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{([['worker', 'Worker name / ID', true], ['dose', 'Exposure / dose', true], ['timestamp', 'Date / timestamp', true], ['date', 'Separate date', false], ['zone', 'Zone / area', false], ['shift', 'Shift', false]] as const).map(([field, label, required]) => <label key={field} className="text-xs font-semibold">{label}{required ? ' *' : ''}<select value={mapping[field] || ''} onChange={(event) => setMapping((current) => ({ ...current, [field]: event.target.value }))} className="mt-1 block w-full rounded-lg border bg-white p-2.5 text-sm font-normal"><option value="">{required ? 'Choose a column' : 'Use available assignment'}</option>{inspection.headers.map((header) => <option key={`${field}-${header}`} value={header}>{header}</option>)}</select></label>)}</div><div className="overflow-x-auto rounded-xl border"><table className="min-w-full text-left text-xs"><thead className="bg-slate-50"><tr>{inspection.headers.map((header) => <th key={header} className="px-3 py-2">{header}</th>)}</tr></thead><tbody>{inspection.sampleRows.slice(0, 3).map((row, index) => <tr key={index}>{inspection.headers.map((header, column) => <td key={header} className="border-t px-3 py-2">{row[column] || '—'}</td>)}</tr>)}</tbody></table></div><div className="flex justify-end"><button disabled={busy || !mapping.worker || !mapping.dose || !(mapping.timestamp || mapping.date)} onClick={() => void importDataset()} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-800 to-indigo-800 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy ? <><RefreshCw className="h-4 w-4 animate-spin"/>Importing…</> : <><Database className="h-4 w-4"/>Import all rows</>}</button></div></div>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-100 bg-white p-3"><div><p className="text-sm font-semibold text-cyan-950">{activeDataset ? 'Imported dataset is active' : 'No active imported dataset'}</p><p className="mt-0.5 text-xs text-slate-500">{activeDataset ? `${importedRows.length} source rows · dashboards and analysis use this data` : 'Import a dataset to enable its original-file export.'}</p></div><div className="flex flex-wrap gap-2"><button disabled={busy || !activeDataset} onClick={() => void downloadFile(api.getImportedSourceCsvUrl()).catch((err) => setDatasetError(err instanceof Error ? err.message : 'Could not export the original dataset.'))} className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-900 disabled:cursor-not-allowed disabled:opacity-50"><Download className="h-3.5 w-3.5"/>Export original CSV</button><button disabled={busy} onClick={() => void clearDataset()} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-800 transition hover:bg-rose-100 disabled:cursor-wait disabled:opacity-50"><Trash2 className="h-3.5 w-3.5"/>{busy ? 'Clearing…' : 'Clear dataset & analysis'}</button></div></div>
      {datasetMessage && <p role="status" className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{datasetMessage}</p>}{datasetError && <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{datasetError}</p>}
    </section>

    {datasetColumns.length > 0 && <section className="workspace-panel overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex flex-wrap items-center justify-between gap-3 border-b p-4"><div><h3 className="font-semibold">Imported source rows</h3><p className="text-xs text-slate-500">{shownRows.length} of {importedRows.length} rows · filtering happens after full import</p></div><button onClick={() => setFilterOpen((open) => !open)} className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-900">{filterOpen ? 'Close filters' : 'Filter imported data'}</button></div>{filterOpen && <div className="grid gap-3 border-b bg-slate-50 p-4 md:grid-cols-2"><p className="rounded-xl bg-indigo-50 p-3 text-xs text-indigo-900 md:col-span-2">Suggested filter: {recommendation ? `${recommendation.column} (${recommendation.unique} values)` : 'choose a column below'}. This recommendation will not filter data until you make a selection.</p><label className="text-xs font-semibold">Field<select value={filterColumn} onChange={(event) => { setFilterColumn(event.target.value); setFilterValue(''); }} className="mt-1 block w-full rounded-lg border bg-white p-2.5 text-sm"><option value="">Choose a field</option>{datasetColumns.map((column) => <option key={column} value={column}>{column}</option>)}</select></label>{filterColumn && <label className="text-xs font-semibold">Value<select value={filterValue} onChange={(event) => setFilterValue(event.target.value)} className="mt-1 block w-full rounded-lg border bg-white p-2.5 text-sm"><option value="">All values</option>{filterValues.map((value) => <option key={value || '__blank'} value={value}>{value || '(blank)'}</option>)}</select></label>}</div>}{shownRows.length === 0 ? <p className="p-7 text-center text-sm text-slate-500">No imported dataset rows yet.</p> : <div className="max-h-[430px] overflow-auto"><table className="min-w-full text-left text-xs"><thead className="sticky top-0 bg-slate-50"><tr>{datasetColumns.map((column) => <th key={column} className="whitespace-nowrap border-b px-3 py-2.5">{column}</th>)}</tr></thead><tbody>{shownRows.map((record) => { const source = readSource(record); return <tr key={record.id}>{datasetColumns.map((column) => <td key={column} className="max-w-64 truncate border-b px-3 py-2 text-slate-600">{source[column] || '—'}</td>)}</tr>; })}</tbody></table></div>}</section>}
    <section className="workspace-panel zone-monitor-panel overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <header className="zone-monitor-header flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div><p className="zone-map-kicker">LOCATION-BASED MONITORING</p><h3 className="mt-1 text-xl font-bold text-slate-900">Exposure map by zone</h3><p className="mt-1 text-sm text-slate-500">Choose a zone marker to inspect its readings and filter the zone history below.</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="zone-map-select-label">Shift<select aria-label="Filter map by shift" value={shiftId} onChange={(event) => setShiftId(event.target.value)}><option value="">All shifts</option>{shifts.map((shift) => <option key={shift.id} value={shift.id}>{shift.shiftName}</option>)}</select></label>
          <DashboardExportActions csvUrl={api.getExportCsvUrl({ zoneId, shiftId })} scopeLabel="selected monitoring"/>
          <button onClick={() => showZoneForm()} className="inline-flex items-center gap-1 rounded-xl bg-orange-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"><Plus className="h-4 w-4"/>Add zone</button>
        </div>
      </header>
      <div className="zone-map-legend px-5 pt-4 sm:px-6"><span><i className="is-critical"/>Critical</span><span><i className="is-elevated"/>High / elevated</span><span><i className="is-warning"/>Medium / warning</span><span><i className="is-normal"/>Normal</span><span><i className="is-empty"/>No readings</span><small>Colors show the highest recorded level for the selected shift.</small></div>
      {loading ? <p className="p-8 text-sm text-slate-500">Loading zone data…</p> : <ZoneGeographicMap rows={zoneMapRows} selectedZoneId={zoneId} locations={zoneLocations} facility={facilityLocation} onSelectZone={selectMapZone} onSetLocation={setZoneLocation} onResetLocation={resetZoneLocation} onConfirmFacility={confirmFacilityLocation}/>}
      <div className="zone-map-detail-wrap px-5 pb-5 sm:px-6 sm:pb-6">
        {selectedZoneMapRow ? <>
          <div className="zone-map-selected-card">
            <div className="zone-map-selected-main"><span className={`zone-map-status-dot level-${selectedZoneMapRow.level.toLowerCase().replaceAll(' ', '-')}`}/><div><p className="zone-map-kicker">SELECTED ZONE</p><h4>{selectedZoneMapRow.zone.zoneCode} · {selectedZoneMapRow.zone.zoneName}</h4><p>{selectedZoneMapRow.zone.description || 'Zone exposure and worker activity for the selected shift.'}</p></div></div>
            <div className="zone-map-selected-stats"><div><small>Highest level</small><strong>{selectedZoneMapRow.level === 'ELEVATED' ? 'HIGH' : selectedZoneMapRow.level === 'WARNING' ? 'MEDIUM' : selectedZoneMapRow.level}</strong></div><div><small>Readings</small><strong>{selectedZoneMapRow.zoneRecords.length}</strong></div><div><small>Workers</small><strong>{selectedZoneMapRow.workerCount}</strong></div><div><small>Peak dose</small><strong>{selectedZoneMapRow.peakDose.toFixed(2)} <small>ppm·hr</small></strong></div></div>
            <div className="zone-map-actions">{selectedZoneMapRow.zone.active ? <><button aria-label={`Edit ${selectedZoneMapRow.zone.zoneName}`} onClick={() => showZoneForm(selectedZoneMapRow.zone)}><Pencil className="h-4 w-4"/>Edit zone</button><button aria-label={`Delete ${selectedZoneMapRow.zone.zoneName}`} onClick={() => void deleteZone(selectedZoneMapRow.zone)}><Trash2 className="h-4 w-4"/>Delete</button></> : <button onClick={() => void restoreZone(selectedZoneMapRow.zone)}>Restore zone</button>}</div>
          </div>
          <div className="zone-record-toolbar"><div><h4>Zone exposure history</h4><p>{selectedZoneRecords.length} matching readings for {selectedZoneMapRow.zone.zoneName}</p></div><label>Safety level<select aria-label="Filter selected zone by safety level" value={zoneLevelFilter} onChange={(event) => setZoneLevelFilter(event.target.value)}><option value="">All levels</option>{levels.map((level) => <option key={level} value={level}>{level === 'ELEVATED' ? 'HIGH / ELEVATED' : level === 'WARNING' ? 'MEDIUM / WARNING' : level}</option>)}</select></label><button type="button" onClick={() => { setZoneId(''); setZoneLevelFilter(''); }}>Show all zones</button></div>
          <div className="overflow-x-auto rounded-2xl border border-slate-200"><table className="min-w-full text-left text-xs"><thead className="bg-slate-50"><tr>{['Worker','Zone','Shift','Date / time','Dose (ppm·hr)','Level'].map((label) => <th key={label} className="whitespace-nowrap px-3 py-3">{label}</th>)}</tr></thead><tbody>{selectedZoneRecords.map((record) => <tr key={record.id} className="cursor-pointer border-t border-slate-100 hover:bg-cyan-50" onClick={() => void openWorker(record.workerId)}><td className="whitespace-nowrap px-3 py-2.5 font-semibold">{record.workerName}</td><td className="whitespace-nowrap px-3 py-2.5">{record.zoneCode}</td><td className="whitespace-nowrap px-3 py-2.5">{record.shiftName}</td><td className="whitespace-nowrap px-3 py-2.5">{formatDate(record.timestamp)}</td><td className="px-3 py-2.5">{record.illustrativeExposureValue.toFixed(2)}</td><td className="px-3 py-2.5"><span className={`rounded-full px-2 py-1 ${levelStyle[record.demoStatus]}`}>{record.demoStatus === 'ELEVATED' ? 'HIGH' : record.demoStatus === 'WARNING' ? 'MEDIUM' : record.demoStatus}</span></td></tr>)}</tbody></table>{!selectedZoneRecords.length && <p className="p-6 text-center text-sm text-slate-500">No readings match this zone, shift, and safety level.</p>}</div>
        </> : <div className="zone-map-prompt"><MapPin className="h-5 w-5"/><div><strong>Select a zone on the map</strong><p>Its risk level, worker count, dose summary, and filterable exposure history will appear here.</p></div></div>}
      </div>
    </section>
    <section className="workspace-panel rounded-2xl border border-slate-200 bg-white p-5"><div className="mb-3 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-cyan-700"/><div><h3 className="font-semibold">Safety alerts</h3><p className="text-xs text-slate-500">Alerts for the selected zones and shifts.</p></div></div>{filteredAlerts.length ? <div className="grid gap-2 md:grid-cols-2">{filteredAlerts.slice().sort((a,b) => b.timestamp.localeCompare(a.timestamp)).map((alert) => <article key={alert.id} className="flex items-start gap-3 rounded-xl border p-3"><AlertTriangle className="mt-0.5 h-4 w-4 text-orange-600"/><div className="min-w-0 flex-1"><div className="flex flex-wrap justify-between gap-2"><strong className="text-sm">{alert.demoSeverity} · {alert.workerName}</strong><span className={`rounded-full px-2 py-0.5 text-[10px] ${levelStyle[alert.demoSeverity]}`}>{alert.isAcknowledged ? 'Acknowledged' : 'Open'}</span></div><p className="mt-1 text-xs text-slate-600">{alert.zoneCode} · {formatDate(alert.timestamp)} · {alert.triggerValuePpmHr.toFixed(2)} ppm·hr</p></div></article>)}</div> : <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">No safety alerts in this selection.</p>}</section>

    {(zoneModal || workerDetail || workerLoading) && createPortal(<div role="presentation" className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4" style={{ position: 'fixed', zIndex: 10000, isolation: 'isolate' }} onMouseDown={(event) => { if (event.target === event.currentTarget) { setZoneModal(false); setWorkerDetail(null); } }}><div role="dialog" aria-modal="true" aria-labelledby="zone-modal-title" className="zone-editor-dialog relative z-10 my-auto max-h-[92vh] w-full max-w-2xl overflow-auto rounded-3xl border border-cyan-100 bg-gradient-to-br from-white via-white to-cyan-50/60 p-0 text-slate-800 shadow-2xl"><div className="zone-editor-heading flex items-center justify-between gap-4 border-b border-cyan-100 bg-gradient-to-r from-cyan-50 via-white to-indigo-50 px-5 py-4"><div className="flex min-w-0 items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-700 to-indigo-700 text-white shadow-md"><MapPin className="h-5 w-5"/></span><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-cyan-800">{zoneModal ? (editingZone ? 'Zone settings' : 'Zone configuration') : 'Worker record'}</p><h3 id="zone-modal-title" className="mt-0.5 text-xl font-bold text-slate-900">{zoneModal ? (editingZone ? 'Edit zone' : 'Add a zone') : workerLoading ? 'Loading worker history' : 'Worker exposure history'}</h3><p className="mt-1 text-xs text-slate-500">{zoneModal ? (editingZone ? 'Update the zone details used in monitoring and alerts.' : 'Create a zone for your facility and exposure monitoring.') : 'Review this worker’s exposure history.'}</p></div></div><button aria-label="Close dialog" onClick={() => { setZoneModal(false); setWorkerDetail(null); }} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600"><X className="h-4 w-4"/></button></div>
      {zoneModal && <form onSubmit={(event) => void saveZone(event)} className="zone-editor-form common-editor-form grid gap-4 px-5 py-5 sm:grid-cols-2">{zoneForEdit ? <div className="zone-editor-context sm:col-span-2"><div className="zone-editor-context-head"><div><span className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">Currently editing</span><strong>{zoneForEdit.zoneCode} · {zoneForEdit.zoneName}</strong></div><span className={`zone-editor-state ${zoneForEdit.active ? 'is-active' : 'is-inactive'}`}>{zoneForEdit.active ? 'Active zone' : 'Inactive zone'}</span></div><div className="zone-editor-metrics"><span><strong>{records.filter((record) => record.zoneId === zoneForEdit.id).length}</strong> readings</span><span><strong>{new Set(records.filter((record) => record.zoneId === zoneForEdit.id).map((record) => record.workerId)).size}</strong> workers</span><span><strong>{zoneForEdit.riskTier}</strong> risk tier</span></div></div> : <div className="zone-editor-context zone-editor-create-note sm:col-span-2"><div><span className="text-[10px] font-bold uppercase tracking-[.12em] text-cyan-800">New monitoring area</span><strong>Set up a zone for exposure tracking</strong><small>Add its code, facility name, baseline, and risk level. You can use this zone in records and reports.</small></div><span className="zone-editor-state is-active">Ready to configure</span></div>}<div className="zone-editor-section-title sm:col-span-2"><span>Zone information</span><small>Fields marked * are required</small></div>
        <label className="zone-editor-field text-xs font-bold text-slate-700">Zone code *<input required maxLength={16} pattern="[A-Za-z0-9_-]+" title="Use letters, numbers, hyphens, or underscores." value={zoneForm.zoneCode} onChange={(event) => setZoneForm((form) => ({ ...form, zoneCode: event.target.value.toUpperCase() }))} placeholder="e.g. PROCESS_A"/><span className="zone-editor-help">Unique identifier · letters, numbers, underscore or hyphen</span></label>
        <label className="zone-editor-field text-xs font-bold text-slate-700">Zone name *<input required maxLength={128} value={zoneForm.zoneName} onChange={(event) => setZoneForm((form) => ({ ...form, zoneName: event.target.value }))} placeholder="e.g. Processing unit"/><span className="zone-editor-help">A clear name appears in reports and alerts.</span></label>
        <label className="zone-editor-field text-xs font-bold text-slate-700">Baseline exposure (ppm·hr) *<input required type="number" min="0" step="any" value={zoneForm.baselineExposurePpmHr} onChange={(event) => setZoneForm((form) => ({ ...form, baselineExposurePpmHr: event.target.value }))}/><span className="zone-editor-help">Reference exposure value used for this zone.</span></label>
        <label className="zone-editor-field text-xs font-bold text-slate-700">Risk tier<select value={zoneForm.riskTier} onChange={(event) => setZoneForm((form) => ({ ...form, riskTier: event.target.value as IndustrialZone['riskTier'] }))}>{['LOW','MEDIUM','HIGH','CRITICAL'].map((tier) => <option key={tier}>{tier}</option>)}</select><span className="zone-editor-help">Risk category shown in monitoring views.</span></label>
        <label className="zone-editor-field text-xs font-bold text-slate-700 sm:col-span-2">Description<textarea rows={3} maxLength={512} value={zoneForm.description} onChange={(event) => setZoneForm((form) => ({ ...form, description: event.target.value }))} placeholder="Describe the area, equipment, or work activity…"/><span className="zone-editor-help">Optional · up to 512 characters</span></label>
        {modalError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 sm:col-span-2">{modalError}</p>}
        <div className="zone-editor-actions flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 sm:col-span-2"><p className="text-[11px] text-slate-500">{zoneForEdit ? 'Changes apply to this zone configuration.' : 'The zone becomes available in configuration after saving.'}</p><div className="flex justify-end gap-2"><button type="button" onClick={() => setZoneModal(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600">Cancel</button><button disabled={zoneBusy} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-800 to-indigo-800 px-4 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-50">{zoneBusy ? <><RefreshCw className="h-4 w-4 animate-spin"/>Saving…</> : <><Check className="h-4 w-4"/>{zoneForEdit ? 'Save changes' : 'Add zone'}</>}</button></div></div>
      </form>}
      {(workerLoading || workerDetail) && <div className="p-5">{workerLoading ? <p>Loading complete history…</p> : workerDetail && <><div className="mb-4 grid gap-2 rounded-xl bg-slate-50 p-4 sm:grid-cols-3"><p><span className="text-xs text-slate-500">Worker</span><strong className="block">{workerDetail.summary.syntheticName}</strong></p><p><span className="text-xs text-slate-500">ID</span><strong className="block">{workerDetail.summary.id}</strong></p><p><span className="text-xs text-slate-500">Role</span><strong className="block">{workerDetail.summary.role}</strong></p></div><div className="overflow-auto rounded-xl border"><table className="min-w-full text-left text-xs"><thead className="bg-slate-50"><tr>{['Date / time','Zone','Shift','Dose (ppm·hr)','Level'].map((title) => <th key={title} className="whitespace-nowrap px-3 py-2">{title}</th>)}</tr></thead><tbody>{workerDetail.recentRecords.map((record) => <tr key={record.id}><td className="whitespace-nowrap px-3 py-2">{formatDate(record.timestamp)}</td><td className="px-3 py-2">{record.zoneName}</td><td className="px-3 py-2">{record.shiftName}</td><td className="px-3 py-2">{record.illustrativeExposureValue.toFixed(2)}</td><td className="px-3 py-2">{record.demoStatus}</td></tr>)}</tbody></table></div></>}</div>}
      </div></div>, document.body)}
  </div>;
};
