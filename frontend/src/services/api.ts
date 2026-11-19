import type {
  DashboardSummary,
  TrendPoint,
  ZoneComparison,
  StatusDistribution,
  HeatmapCell,
  HistogramBin,
  IndustrialZone,
  Shift,
  WorkerSummary,
  WorkerDetail,
  ExposureRecord,
  Alert,
  DescriptiveStats,
  OutlierReport,
  CorrelationReport,
  DatasetSummary,
  FilterState,
  DemoResetResponse,
  LoginResponse,
  ZoneDetail,
  ExposureReportSummary,
  PagedResponse,
  ExposureReadingSubmission,
  ExposureReadingResponse,
  LiveSensorReading,
  LiveSensorReadingSubmission,
  AdminProfileUpdate,
} from '../types';


const API_BASE = '/api';

async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  let stored: Partial<LoginResponse> = {};
  try { stored = JSON.parse(localStorage.getItem('chromaguard_user') || '{}'); } catch { /* refresh below */ }
  const token = stored.token || '';

  const send = (activeToken: string) => {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${activeToken}`);
    return fetch(input, { ...init, headers });
  };

  const response = await send(token);
  // Demo sessions are kept in memory by the backend. A server restart or
  // backend switch invalidates the browser's old token, so return to login
  // instead of leaving the user with a misleading generic API error.
  if (response.status === 401 && token) {
    localStorage.removeItem('chromaguard_user');
    window.dispatchEvent(new CustomEvent('chromaguard:user-changed', { detail: null }));
  }
  return response;
}

export async function downloadFile(url: string): Promise<void> {
  const response = await apiFetch(url);
  if (!response.ok) throw new Error(`Download failed (${response.status})`);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = response.headers.get('Content-Disposition')?.match(/filename="?([^";]+)"?/)?.[1] || 'chromaguard-export.csv';
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = objectUrl; anchor.download = filename; anchor.click();
  URL.revokeObjectURL(objectUrl);
}

function buildQuery(filters?: Partial<FilterState> & Record<string, any>): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      params.append(key, String(val));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorText = await res.text();
    let message = `API request failed with status ${res.status}`;
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.message || message;
      if (Array.isArray(parsed.errors) && parsed.errors.length) {
        message += `: ${parsed.errors.join(', ')}`;
      }
    } catch {
      if (errorText.trim()) message = `${message}: ${errorText.trim().slice(0, 240)}`;
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export const api = {
  // Dashboard
  getSummary: (filters?: Partial<FilterState>): Promise<DashboardSummary> =>
    apiFetch(`${API_BASE}/dashboard/summary${buildQuery(filters)}`).then(handleResponse<DashboardSummary>),

  getTrends: (filters?: Partial<FilterState>): Promise<TrendPoint[]> =>
    apiFetch(`${API_BASE}/dashboard/trends${buildQuery(filters)}`).then(handleResponse<TrendPoint[]>),

  getZoneComparison: (filters?: Partial<FilterState>): Promise<ZoneComparison[]> =>
    apiFetch(`${API_BASE}/dashboard/zone-comparison${buildQuery(filters)}`).then(handleResponse<ZoneComparison[]>),

  getStatusDistribution: (filters?: Partial<FilterState>): Promise<StatusDistribution[]> =>
    apiFetch(`${API_BASE}/dashboard/status-distribution${buildQuery(filters)}`).then(handleResponse<StatusDistribution[]>),

  getHistogram: (filters?: Partial<FilterState>, bins: number = 10): Promise<HistogramBin[]> =>
    apiFetch(`${API_BASE}/dashboard/histogram${buildQuery({ ...filters, bins })}`).then(handleResponse<HistogramBin[]>),

  getHeatmap: (filters?: Partial<FilterState>): Promise<HeatmapCell[]> =>
    apiFetch(`${API_BASE}/dashboard/heatmap${buildQuery(filters)}`).then(handleResponse<HeatmapCell[]>),

  getWorkerComparison: (filters?: Partial<FilterState>, limit: number = 10): Promise<any[]> =>
    apiFetch(`${API_BASE}/dashboard/worker-comparison${buildQuery({ ...filters, limit })}`).then(handleResponse<any[]>),

  // Workers
  getWorkers: (search?: string, zoneId?: string, shiftId?: string): Promise<WorkerSummary[]> =>
    apiFetch(`${API_BASE}/workers${buildQuery({ search, zoneId, shiftId })}`).then(handleResponse<WorkerSummary[]>),

  getWorkerById: (id: string): Promise<WorkerSummary> =>
    apiFetch(`${API_BASE}/workers/${id}`).then(handleResponse<WorkerSummary>),

  getWorkerDetail: (id: string): Promise<WorkerDetail> =>
    apiFetch(`${API_BASE}/workers/${id}/detail`).then(handleResponse<WorkerDetail>),

  updateWorkerProfile: (id: string, profile: Pick<WorkerSummary, 'syntheticName' | 'role' | 'experienceYears' | 'badgeId'>): Promise<WorkerSummary> =>
    apiFetch(`${API_BASE}/workers/${id}/profile`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) }).then(handleResponse<WorkerSummary>),

  getWorkerExposure: (id: string): Promise<ExposureRecord[]> =>
    apiFetch(`${API_BASE}/workers/${id}/exposure`).then(handleResponse<ExposureRecord[]>),

  // Zones & Shifts
  getZones: (): Promise<IndustrialZone[]> =>
    apiFetch(`${API_BASE}/zones`).then(handleResponse<IndustrialZone[]>),

  getZonesForManagement: (): Promise<IndustrialZone[]> =>
    apiFetch(`${API_BASE}/zones/manage`).then(handleResponse<IndustrialZone[]>),

  createZone: (zone: Omit<IndustrialZone, 'id' | 'active'>): Promise<IndustrialZone> =>
    apiFetch(`${API_BASE}/zones`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(zone) }).then(handleResponse<IndustrialZone>),

  updateZone: (id: string, zone: Omit<IndustrialZone, 'id' | 'active'>): Promise<IndustrialZone> =>
    apiFetch(`${API_BASE}/zones/${encodeURIComponent(id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(zone) }).then(handleResponse<IndustrialZone>),

  deleteZone: (id: string): Promise<void> =>
    apiFetch(`${API_BASE}/zones/${encodeURIComponent(id)}`, { method: 'DELETE' }).then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        let message = `API request failed with status ${response.status}`;
        try { message = JSON.parse(errorText).message || message; } catch { /* keep status text */ }
        throw new Error(message);
      }
    }),

  restoreZone: (id: string): Promise<void> =>
    apiFetch(`${API_BASE}/zones/${encodeURIComponent(id)}/restore`, { method: 'PATCH' }).then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        let message = `API request failed with status ${response.status}`;
        try { message = JSON.parse(errorText).message || message; } catch { /* keep status text */ }
        throw new Error(message);
      }
    }),

  getZoneDetail: (id: string): Promise<ZoneDetail> =>
    apiFetch(`${API_BASE}/zones/${id}/detail`).then(handleResponse<ZoneDetail>),

  getZoneRecords: (id: string, params?: Record<string, any>): Promise<PagedResponse<ExposureRecord>> =>
    apiFetch(`${API_BASE}/zones/${id}/records${buildQuery(params)}`).then(handleResponse<PagedResponse<ExposureRecord>>),

  getShifts: (): Promise<Shift[]> =>
    apiFetch(`${API_BASE}/shifts`).then(handleResponse<Shift[]>),

  // Exposure Records
  getExposureRecords: (filters?: Partial<FilterState>, limit: number = 0): Promise<ExposureRecord[]> =>
    apiFetch(`${API_BASE}/exposure-records${buildQuery({ ...filters, limit })}`).then(handleResponse<ExposureRecord[]>),

  getRecordById: (id: string): Promise<ExposureRecord> =>
    apiFetch(`${API_BASE}/exposure-records/${id}`).then(handleResponse<ExposureRecord>),

  submitExposureReading: (reading: ExposureReadingSubmission): Promise<ExposureReadingResponse> =>
    apiFetch(`${API_BASE}/exposure-records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reading),
    }).then(handleResponse<ExposureReadingResponse>),

  submitLiveSensorReading: (reading: LiveSensorReadingSubmission): Promise<LiveSensorReading> =>
    apiFetch(`${API_BASE}/live-sensor-readings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reading),
    }).then(handleResponse<LiveSensorReading>),

  getLiveSensorReadings: (workerId: string, page = 0, size = 20): Promise<LiveSensorReading[]> =>
    apiFetch(`${API_BASE}/live-sensor-readings/workers/${encodeURIComponent(workerId)}${buildQuery({ page, size })}`)
      .then(handleResponse<LiveSensorReading[]>),

  inspectDataset: (file: File): Promise<{ headers: string[]; sampleRows: string[][]; suggestedColumns: Record<string, string> }> => {
    const body = new FormData();
    body.append('file', file);
    return apiFetch(`${API_BASE}/admin/dataset/inspect`, { method: 'POST', body })
      .then(handleResponse<{ headers: string[]; sampleRows: string[][]; suggestedColumns: Record<string, string> }>);
  },

  importDataset: (file: File, mapping: Record<string, string>): Promise<{ importedReadings: number; skippedRows: number; sourceColumnsPreserved: number; mappedColumns: Record<string, string>; message: string }> => {
    const body = new FormData();
    body.append('file', file);
    body.append('mapping', JSON.stringify(mapping));
    return apiFetch(`${API_BASE}/admin/dataset/import`, { method: 'POST', body })
      .then(handleResponse<{ importedReadings: number; skippedRows: number; sourceColumnsPreserved: number; mappedColumns: Record<string, string>; message: string }>);
  },

  getDatasetState: (): Promise<{ active: boolean; datasetVersion: string }> =>
    apiFetch(`${API_BASE}/admin/dataset/state`).then(handleResponse<{ active: boolean; datasetVersion: string }>),

  clearImportedDataset: (): Promise<{ cleared: boolean; deletedRecords: number; deletedAlerts: number; preservedRegisteredWorkers: number; message: string }> =>
    apiFetch(`${API_BASE}/admin/dataset`, { method: 'DELETE' })
      .then(handleResponse<{ cleared: boolean; deletedRecords: number; deletedAlerts: number; preservedRegisteredWorkers: number; message: string }>),

  getImportedSourceCsvUrl: (): string => `${API_BASE}/admin/dataset/export.csv`,

  // Alerts
  getAlerts: (filters?: Partial<FilterState> & { severity?: string; isAcknowledged?: boolean }): Promise<Alert[]> =>
    apiFetch(`${API_BASE}/alerts${buildQuery(filters)}`).then(handleResponse<Alert[]>),

  acknowledgeAlert: (alertId: string, actionNotes: string, acknowledgedBy: string = 'Safety Lead'): Promise<Alert> =>
    apiFetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionNotes, acknowledgedBy }),
    }).then(handleResponse<Alert>),

  // DEV Analytics Lab
  getDescriptiveStats: (): Promise<DescriptiveStats[]> =>
    apiFetch(`${API_BASE}/analytics/descriptive-statistics`).then(handleResponse<DescriptiveStats[]>),

  getOutliers: (): Promise<OutlierReport> =>
    apiFetch(`${API_BASE}/analytics/outliers`).then(handleResponse<OutlierReport>),

  getCorrelation: (): Promise<CorrelationReport> =>
    apiFetch(`${API_BASE}/analytics/correlation`).then(handleResponse<CorrelationReport>),

  getDatasetSummary: (): Promise<DatasetSummary> =>
    apiFetch(`${API_BASE}/analytics/dataset-summary`).then(handleResponse<DatasetSummary>),

  // Reports & Export
  getSummaryReport: (): Promise<any> =>
    apiFetch(`${API_BASE}/reports/summary`).then(handleResponse<any>),

  getFormalReport: (): Promise<ExposureReportSummary> =>
    apiFetch(`${API_BASE}/reports/formal`).then(handleResponse<ExposureReportSummary>),

  getExportCsvUrl: (filters?: Partial<FilterState>): string =>
    `${API_BASE}/reports/export/csv${buildQuery(filters)}`,

  getExportAlertsCsvUrl: (filters?: Record<string, any>): string =>
    `${API_BASE}/reports/export/alerts-csv${buildQuery(filters)}`,

  getExportReportJsonUrl: (): string =>
    `${API_BASE}/reports/export/json`,

  // Demo Controls
  resetDemo: (): Promise<DemoResetResponse> =>
    apiFetch(`${API_BASE}/demo/reset`, { method: 'POST' }).then(handleResponse<DemoResetResponse>),

  getDemoInfo: (): Promise<any> =>
    apiFetch(`${API_BASE}/demo/info`).then(handleResponse<any>),

  // Authentication & Role Switching
  login: (username: string, password: string): Promise<LoginResponse> =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }).then(handleResponse<LoginResponse>),

  register: (fullName: string, username: string, password: string, role: 'ROLE_ADMIN' | 'ROLE_WORKER', zoneId?: string, shiftId?: string): Promise<LoginResponse> =>
    fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, username, password, role, zoneId, shiftId }),
    }).then(handleResponse<LoginResponse>),


  getCurrentUser: (): Promise<LoginResponse> =>
    apiFetch(`${API_BASE}/auth/me`).then(handleResponse<LoginResponse>),

  updateAdminProfile: (profile: AdminProfileUpdate): Promise<LoginResponse> =>
    apiFetch(`${API_BASE}/auth/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    }).then(handleResponse<LoginResponse>),
};

