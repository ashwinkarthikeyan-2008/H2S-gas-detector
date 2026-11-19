import React, { useCallback, useEffect, useState } from 'react';
import { Activity, CircleAlert, PlugZap, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { api } from '../services/api';
import { LiveSensorReading, LiveSensorReadingSubmission, WorkerSummary } from '../types';

type SensorReadings = {
  h2s: number | null;
  mq2Raw: number | null;
  mq2Ppm: number | null;
  temperature: number | null;
  humidity: number | null;
  battery: number | null;
};

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';
type JsonObject = Record<string, unknown>;

const STORAGE_KEY = 'chromaguard_esp8266_endpoint';
const PAGE_SIZE = 20;
const EMPTY_READINGS: SensorReadings = {
  h2s: null,
  mq2Raw: null,
  mq2Ppm: null,
  temperature: null,
  humidity: null,
  battery: null,
};

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeEndpoint(value: string): string {
  let endpoint = value.trim();
  if (!endpoint) throw new Error('Enter the ESP8266 IP address.');
  if (!/^[a-z][a-z\d+.-]*:\/\//i.test(endpoint)) endpoint = `http://${endpoint}`;

  const url = new URL(endpoint);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Use an HTTP or HTTPS device address.');
  }
  if (url.username || url.password) throw new Error('Device addresses cannot contain login credentials.');
  if (url.pathname === '/') url.pathname = '/data';
  return url.toString();
}

function readNumber(payload: JsonObject, keys: string[]): number | null {
  for (const key of keys) {
    const value = payload[key];
    if ((typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

function parseSensorReadings(json: unknown): SensorReadings {
  if (!isJsonObject(json)) throw new Error('Device response must be a JSON object.');
  const payload = isJsonObject(json.sensors) ? json.sensors : json;
  const readings = {
    h2s: readNumber(payload, ['h2s', 'h2s_ppm']),
    mq2Raw: readNumber(payload, ['mq2_raw', 'mq2Raw']),
    mq2Ppm: readNumber(payload, ['mq2_ppm', 'mq2Ppm']),
    temperature: readNumber(payload, ['temperature', 'temp']),
    humidity: readNumber(payload, ['humidity']),
    battery: readNumber(payload, ['battery']),
  };
  if (Object.values(readings).every((reading) => reading === null)) {
    throw new Error('No numeric sensor readings found in the device JSON.');
  }
  return readings;
}

function loadSavedEndpoint(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || '192.168.4.1';
  } catch {
    return '192.168.4.1';
  }
}

const formatReading = (value: number | null | undefined, fractionDigits = 1) =>
  value === null || value === undefined ? '—' : value.toFixed(fractionDigits);

function toSubmission(workerId: string, readings: SensorReadings): LiveSensorReadingSubmission {
  const submission: LiveSensorReadingSubmission = { workerId };
  if (readings.h2s !== null) submission.h2sPpm = readings.h2s;
  if (readings.mq2Raw !== null) submission.mq2Raw = readings.mq2Raw;
  if (readings.mq2Ppm !== null) submission.mq2Ppm = readings.mq2Ppm;
  if (readings.temperature !== null) submission.temperatureC = readings.temperature;
  if (readings.humidity !== null) submission.humidityPercent = readings.humidity;
  if (readings.battery !== null) submission.batteryPercent = readings.battery;
  return submission;
}

function formatTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export const Esp8266SensorPanel: React.FC<{ workers: WorkerSummary[] }> = ({ workers }) => {
  const [endpoint, setEndpoint] = useState(loadSavedEndpoint);
  const [deviceUrl, setDeviceUrl] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [history, setHistory] = useState<LiveSensorReading[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [polling, setPolling] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [error, setError] = useState('');
  const [readings, setReadings] = useState<SensorReadings>(EMPTY_READINGS);
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    if (!selectedWorkerId && workers.length) setSelectedWorkerId(workers[0].id);
  }, [selectedWorkerId, workers]);

  const refreshHistory = useCallback(async () => {
    if (!selectedWorkerId) {
      setHistory([]);
      return;
    }
    setHistoryLoading(true);
    setHistoryError('');
    try {
      setHistory(await api.getLiveSensorReadings(selectedWorkerId, historyPage, PAGE_SIZE));
    } catch (reason) {
      setHistoryError(reason instanceof Error ? reason.message : 'Could not load worker sensor history.');
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage, selectedWorkerId]);

  useEffect(() => {
    void refreshHistory();
    if (!selectedWorkerId || historyPage !== 0) return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refreshHistory();
    }, 5000);
    return () => window.clearInterval(interval);
  }, [historyPage, historyRefresh, refreshHistory, selectedWorkerId]);

  useEffect(() => {
    if (!polling || !deviceUrl || !selectedWorkerId) return;

    let active = true;
    let requestInFlight = false;
    let activeController: AbortController | null = null;

    const readDevice = async () => {
      if (requestInFlight) return;
      requestInFlight = true;
      const controller = new AbortController();
      activeController = controller;
      const timeout = window.setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(deviceUrl, { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error(`Device returned HTTP ${response.status}.`);
        const nextReadings = parseSensorReadings(await response.json());
        if (!active) return;

        setReadings(nextReadings);
        setStatus('connected');
        try {
          const saved = await api.submitLiveSensorReading(toSubmission(selectedWorkerId, nextReadings));
          if (!active) return;
          setLastUpdated(formatTime(saved.timestamp));
          setError('');
          setHistoryRefresh((value) => value + 1);
        } catch (reason) {
          if (!active) return;
          setError(`Device responded, but the reading could not be saved: ${reason instanceof Error ? reason.message : 'Backend request failed.'}`);
        }
      } catch (reason) {
        if (!active) return;
        setStatus('disconnected');
        setError(reason instanceof Error
          ? reason.name === 'AbortError' ? 'Device request timed out.' : reason.message
          : 'Could not read the ESP8266 device.');
      } finally {
        window.clearTimeout(timeout);
        requestInFlight = false;
      }
    };

    setStatus('connecting');
    void readDevice();
    const interval = window.setInterval(() => void readDevice(), 5000);
    return () => {
      active = false;
      activeController?.abort();
      window.clearInterval(interval);
    };
  }, [connectionAttempt, deviceUrl, polling, selectedWorkerId]);

  const connect = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedWorkerId) {
      setError('Select the worker currently being monitored.');
      return;
    }
    try {
      const url = normalizeEndpoint(endpoint);
      setEndpoint(url);
      setDeviceUrl(url);
      setPolling(true);
      setConnectionAttempt((attempt) => attempt + 1);
      setStatus('connecting');
      setError('');
      try {
        localStorage.setItem(STORAGE_KEY, url);
      } catch {
        setError('Connection started, but the browser could not save this device address.');
      }
    } catch (reason) {
      setPolling(false);
      setStatus('disconnected');
      setError(reason instanceof Error ? reason.message : 'Enter a valid ESP8266 address.');
    }
  };

  const disconnect = () => {
    setPolling(false);
    setStatus('idle');
    setError('');
  };

  const changeWorker = (workerId: string) => {
    setSelectedWorkerId(workerId);
    setHistoryPage(0);
    setReadings(EMPTY_READINGS);
    setLastUpdated('');
    setError('');
  };

  const statusLabel = {
    idle: 'Not connected',
    connecting: 'Connecting',
    connected: 'Connected',
    disconnected: 'Disconnected',
  }[status];
  const h2sSeverity = readings.h2s === null
    ? 'No data'
    : readings.h2s >= 10 ? 'Danger' : readings.h2s >= 5 ? 'Warning' : 'Normal';

  const cards = [
    { label: 'H₂S concentration', value: formatReading(readings.h2s), unit: 'ppm', detail: h2sSeverity },
    { label: 'MQ-2 gas estimate', value: formatReading(readings.mq2Ppm, 0), unit: 'ppm', detail: 'Estimated' },
    { label: 'MQ-2 raw', value: formatReading(readings.mq2Raw, 0), unit: 'ADC', detail: 'Sensor output' },
    { label: 'Temperature', value: formatReading(readings.temperature), unit: '°C', detail: 'Ambient' },
    { label: 'Humidity', value: formatReading(readings.humidity), unit: '%', detail: 'Relative' },
    { label: 'Battery', value: formatReading(readings.battery, 0), unit: '%', detail: 'Charge' },
  ];

  return (
    <section className="workspace-panel rounded-3xl border border-cyan-100 bg-gradient-to-br from-white via-cyan-50/40 to-indigo-50/50 p-5 shadow-sm md:p-7" aria-labelledby="esp8266-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="rounded-2xl bg-gradient-to-br from-cyan-700 to-indigo-700 p-3 text-white"><Activity className="h-5 w-5"/></span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-800">Hardware telemetry</p>
            <h3 id="esp8266-title" className="mt-1 text-xl font-bold text-slate-900">Shared ESP8266 live readings</h3>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">Choose the worker being monitored. Each 5-second sample is stored in that worker’s sensor history.</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${status === 'connected' ? 'bg-emerald-100 text-emerald-800' : status === 'disconnected' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'}`} role="status" aria-live="polite">
          {status === 'connected' ? <Wifi className="h-4 w-4"/> : status === 'disconnected' ? <WifiOff className="h-4 w-4"/> : status === 'connecting' ? <RefreshCw className="h-4 w-4 animate-spin"/> : <PlugZap className="h-4 w-4"/>}
          {statusLabel}
        </span>
      </div>

      <form onSubmit={connect} className="mt-5 grid gap-3 rounded-2xl border border-cyan-100 bg-white/80 p-4 md:grid-cols-[1fr_1.2fr_auto_auto] md:items-end">
        <label className="text-xs font-semibold text-slate-700">
          Worker
          <select
            value={selectedWorkerId}
            onChange={(event) => changeWorker(event.target.value)}
            disabled={polling}
            required
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 disabled:bg-slate-100"
          >
            <option value="">Select a worker</option>
            {workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.syntheticName} · {worker.id}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-700">
          ESP8266 IP address or endpoint
          <input
            type="text"
            value={endpoint}
            onChange={(event) => setEndpoint(event.target.value)}
            placeholder="192.168.4.1 or http://192.168.4.1/data"
            autoComplete="url"
            spellCheck={false}
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
          />
        </label>
        <button type="submit" disabled={!workers.length} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-800 to-indigo-800 px-4 py-2.5 text-sm font-bold text-white transition hover:from-cyan-900 hover:to-indigo-900 disabled:cursor-not-allowed disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${status === 'connecting' ? 'animate-spin' : ''}`}/>
          {polling ? 'Reconnect' : 'Connect device'}
        </button>
        {polling && <button type="button" onClick={disconnect} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Stop capture</button>}
      </form>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>JSON: h2s, mq2_raw, mq2_ppm, temperature, humidity, battery (or nested under sensors).</span>
        <span>Last saved: {lastUpdated || '—'}</span>
      </div>
      {error && <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0"/><span>{error} Check the ESP8266 network/IP, endpoint, and CORS response header.</span></p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-slate-200 bg-white/90 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-600">{card.label}</span>
              {card.label === 'H₂S concentration' && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${h2sSeverity === 'Danger' ? 'bg-rose-100 text-rose-800' : h2sSeverity === 'Warning' ? 'bg-amber-100 text-amber-800' : h2sSeverity === 'Normal' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{card.detail}</span>}
            </div>
            <p className="mt-3 flex items-baseline gap-2">
              <strong className="text-2xl font-bold tracking-tight text-slate-900">{card.value}</strong>
              <span className="text-xs text-slate-500">{card.unit}</span>
            </p>
            {card.label !== 'H₂S concentration' && <p className="mt-1 text-[11px] text-slate-500">{card.detail}</p>}
          </article>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div><h4 className="font-semibold text-slate-900">Sensor history · {workers.find((worker) => worker.id === selectedWorkerId)?.syntheticName || 'Select a worker'}</h4><p className="text-xs text-slate-500">Saved hardware samples, newest first. Historical exposure records are kept separate.</p></div>
          <div className="flex items-center gap-2">
            <button type="button" disabled={historyPage === 0 || historyLoading} onClick={() => setHistoryPage((page) => page - 1)} className="rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-40">Newer</button>
            <span className="text-xs text-slate-500">Page {historyPage + 1}</span>
            <button type="button" disabled={history.length < PAGE_SIZE || historyLoading} onClick={() => setHistoryPage((page) => page + 1)} className="rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-40">Older</button>
          </div>
        </div>
        {historyError && <p role="alert" className="m-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{historyError}</p>}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600"><tr>{['Time', 'H₂S (ppm)', 'MQ-2 raw', 'MQ-2 est. (ppm)', 'Temp (°C)', 'Humidity', 'Battery'].map((label) => <th key={label} className="whitespace-nowrap px-3 py-2.5">{label}</th>)}</tr></thead>
            <tbody>
              {history.map((reading) => <tr key={reading.id} className="border-t border-slate-100">
                <td className="whitespace-nowrap px-3 py-2.5">{formatTime(reading.timestamp)}</td>
                <td className="px-3 py-2.5">{formatReading(reading.h2sPpm)}</td>
                <td className="px-3 py-2.5">{formatReading(reading.mq2Raw, 0)}</td>
                <td className="px-3 py-2.5">{formatReading(reading.mq2Ppm, 0)}</td>
                <td className="px-3 py-2.5">{formatReading(reading.temperatureC)}</td>
                <td className="px-3 py-2.5">{formatReading(reading.humidityPercent)}%</td>
                <td className="px-3 py-2.5">{formatReading(reading.batteryPercent, 0)}%</td>
              </tr>)}
            </tbody>
          </table>
        </div>
        {historyLoading && <p className="border-t p-3 text-xs text-slate-500">Loading sensor history…</p>}
        {!historyLoading && !historyError && !history.length && <p className="p-5 text-center text-sm text-slate-500">No hardware readings recorded for this worker yet.</p>}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">The admin browser reads the ESP8266 and stores samples through the authenticated backend. The ESP8266 must be reachable on the same network and include <code className="rounded bg-slate-100 px-1 py-0.5">Access-Control-Allow-Origin</code> in its JSON response.</p>
    </section>
  );
};
