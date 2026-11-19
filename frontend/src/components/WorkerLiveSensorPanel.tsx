import React, { useCallback, useEffect, useState } from 'react';
import { Activity, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { LiveSensorReading } from '../types';

const PAGE_SIZE = 20;

const formatReading = (value: number | null, digits = 1) =>
  value === null ? '—' : value.toFixed(digits);

const formatTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

export const WorkerLiveSensorPanel: React.FC<{ workerId: string }> = ({ workerId }) => {
  const [history, setHistory] = useState<LiveSensorReading[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setError('');
    try {
      setHistory(await api.getLiveSensorReadings(workerId, page, PAGE_SIZE));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load live sensor readings.');
    } finally {
      setLoading(false);
    }
  }, [page, workerId]);

  useEffect(() => {
    let active = true;
    let requestInFlight = false;
    const load = async () => {
      if (requestInFlight) return;
      requestInFlight = true;
      setLoading(true);
      setError('');
      try {
        const result = await api.getLiveSensorReadings(workerId, page, PAGE_SIZE);
        if (active) setHistory(result);
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load live sensor readings.');
      } finally {
        if (active) setLoading(false);
        requestInFlight = false;
      }
    };

    void load();
    if (page !== 0) return () => { active = false; };
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [page, workerId]);

  const latest = history[0];
  const h2sStatus = latest?.h2sPpm === null || latest?.h2sPpm === undefined
    ? 'No H₂S value'
    : latest.h2sPpm >= 10 ? 'Danger threshold' : latest.h2sPpm >= 5 ? 'Warning threshold' : 'Below dashboard thresholds';

  return (
    <section className="worker-panel overflow-hidden" aria-labelledby="worker-live-sensor-title">
      <div className="worker-panel-head">
        <div>
          <p className="worker-overline">SHARED DEVICE TELEMETRY</p>
          <h3 id="worker-live-sensor-title">My live sensor readings</h3>
          <p>Readings assigned to your worker profile by the administrator.</p>
        </div>
        <span className="worker-history-count inline-flex items-center gap-1.5"><Activity className="h-4 w-4"/>5-second updates</span>
      </div>

      {latest && <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ['H₂S concentration', formatReading(latest.h2sPpm), 'ppm', h2sStatus],
          ['MQ-2 gas estimate', formatReading(latest.mq2Ppm, 0), 'ppm', 'Estimated'],
          ['MQ-2 raw', formatReading(latest.mq2Raw, 0), 'ADC', 'Sensor output'],
          ['Temperature', formatReading(latest.temperatureC), '°C', 'Ambient'],
          ['Humidity', formatReading(latest.humidityPercent), '%', 'Relative'],
          ['Battery', formatReading(latest.batteryPercent, 0), '%', 'Charge'],
        ].map(([label, value, unit, detail]) => <article key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <span className="text-xs font-semibold text-slate-600">{label}</span>
          <p className="mt-2 flex items-baseline gap-2"><strong className="text-xl text-slate-900">{value}</strong><span className="text-xs text-slate-500">{unit}</span></p>
          <small className="text-[11px] text-slate-500">{detail}</small>
        </article>)}
      </div>}

      {error && <p role="alert" className="mx-4 mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0"/>{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
        <span className="text-xs text-slate-500">{latest ? `Last received ${formatTime(latest.timestamp)}` : 'No hardware readings have been assigned to your profile yet.'}</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}/>Refresh</button>
          <button type="button" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={page === 0 || loading} className="rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-40">Newer</button>
          <span className="text-xs text-slate-500">Page {page + 1}</span>
          <button type="button" onClick={() => setPage((value) => value + 1)} disabled={history.length < PAGE_SIZE || loading} className="rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-40">Older</button>
        </div>
      </div>

      <div className="overflow-x-auto border-t border-slate-100">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600"><tr>{['Time', 'H₂S (ppm)', 'MQ-2 raw', 'MQ-2 est. (ppm)', 'Temp (°C)', 'Humidity', 'Battery'].map((label) => <th key={label} className="whitespace-nowrap px-3 py-2.5">{label}</th>)}</tr></thead>
          <tbody>{history.map((reading) => <tr key={reading.id} className="border-t border-slate-100">
            <td className="whitespace-nowrap px-3 py-2.5">{formatTime(reading.timestamp)}</td>
            <td className="px-3 py-2.5">{formatReading(reading.h2sPpm)}</td>
            <td className="px-3 py-2.5">{formatReading(reading.mq2Raw, 0)}</td>
            <td className="px-3 py-2.5">{formatReading(reading.mq2Ppm, 0)}</td>
            <td className="px-3 py-2.5">{formatReading(reading.temperatureC)}</td>
            <td className="px-3 py-2.5">{formatReading(reading.humidityPercent)}%</td>
            <td className="px-3 py-2.5">{formatReading(reading.batteryPercent, 0)}%</td>
          </tr>)}</tbody>
        </table>
      </div>
      {loading && <p className="border-t p-3 text-xs text-slate-500">Loading live readings…</p>}
      {!loading && !error && !history.length && <p className="border-t p-5 text-center text-sm text-slate-500">Waiting for the admin to connect the shared ESP8266 and assign it to your worker profile.</p>}
      <p className="border-t px-4 py-3 text-[11px] leading-relaxed text-slate-500">Prototype sensor telemetry only; it is not a certified life-safety measurement and remains separate from calculated exposure records.</p>
    </section>
  );
};
