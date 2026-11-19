export type DemoStatus = 'NORMAL' | 'ELEVATED' | 'WARNING' | 'CRITICAL';
export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DashboardSummary {
  totalWorkers: number;
  totalRecords: number;
  avgExposurePpmHr: number;
  maxExposurePpmHr: number;
  minExposurePpmHr: number;
  warningRecords: number;
  criticalRecords: number;
  elevatedRecords: number;
  normalRecords: number;
  totalAlerts: number;
  unacknowledgedAlerts: number;
  simulatedMode: string;
}

export interface TrendPoint {
  date: string;
  avgExposurePpmHr: number;
  maxExposurePpmHr: number;
  recordCount: number;
  warningCount: number;
  criticalCount: number;
}

export interface ZoneComparison {
  zoneId: string;
  zoneCode: string;
  zoneName: string;
  riskTier: RiskTier;
  baselineExposure: number;
  avgExposurePpmHr: number;
  maxExposurePpmHr: number;
  recordCount: number;
  alertCount: number;
}

export interface StatusDistribution {
  status: DemoStatus;
  displayName: string;
  count: number;
  percentage: number;
  color: string;
}

export interface HeatmapCell {
  zoneCode: string;
  zoneName: string;
  date: string;
  avgExposurePpmHr: number;
  recordCount: number;
}

export interface HistogramBin {
  binLabel: string;
  binMin: number;
  binMax: number;
  count: number;
}

export interface IndustrialZone {
  id: string;
  active: boolean;
  zoneCode: string;
  zoneName: string;
  riskTier: RiskTier;
  baselineExposurePpmHr: number;
  description: string;
}

export interface Shift {
  id: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  durationHours: number;
}

export interface WorkerSummary {
  id: string;
  syntheticName: string;
  assignedZoneId: string;
  assignedZoneName: string;
  preferredShiftId: string;
  preferredShiftName: string;
  role: string;
  experienceYears: number;
  badgeId: string;
  totalRecords: number;
  avgExposurePpmHr: number;
  maxExposurePpmHr: number;
  latestDemoStatus: DemoStatus;
  latestTimestamp: string;
}

export interface ExposureRecord {
  id: string;
  workerId: string;
  workerName: string;
  zoneId: string;
  zoneCode: string;
  zoneName: string;
  shiftId: string;
  shiftName: string;
  timestamp: string;
  simulatedColorR: number;
  simulatedColorG: number;
  simulatedColorB: number;
  illustrativeExposureValue: number;
  illustrativeCumulativeDose: number;
  demoStatus: DemoStatus;
  dataSource: string;
  datasetVersion: string;
  sourceDatasetJson?: string | null;
}

export interface Alert {
  id: string;
  recordId: string;
  workerId: string;
  workerName: string;
  zoneId: string;
  zoneCode: string;
  zoneName: string;
  timestamp: string;
  demoSeverity: DemoStatus;
  triggerValuePpmHr: number;
  thresholdLimitPpmHr: number;
  isAcknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  actionNotes?: string;
}

export interface ExposureReadingSubmission {
  dosePpmHr: number;
  workerId?: string;
  zoneId?: string;
  shiftId?: string;
}

export interface ExposureReadingResponse {
  reading: ExposureRecord;
  alert: Alert | null;
  alertGenerated: boolean;
}

export interface LiveSensorReading {
  id: number;
  workerId: string;
  workerName: string;
  timestamp: string;
  h2sPpm: number | null;
  mq2Raw: number | null;
  mq2Ppm: number | null;
  temperatureC: number | null;
  humidityPercent: number | null;
  batteryPercent: number | null;
}

export interface LiveSensorReadingSubmission {
  workerId: string;
  h2sPpm?: number;
  mq2Raw?: number;
  mq2Ppm?: number;
  temperatureC?: number;
  humidityPercent?: number;
  batteryPercent?: number;
}

export interface WorkerDetail {
  summary: WorkerSummary;
  recentRecords: ExposureRecord[];
  alerts: Alert[];
  exposureTrend: TrendPoint[];
}

export interface DescriptiveStats {
  variableName: string;
  unit: string;
  count: number;
  mean: number;
  median: number;
  stdDev: number;
  variance: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  iqr: number;
}

export interface OutlierReport {
  variableName: string;
  q1: number;
  q3: number;
  iqr: number;
  lowerBound: number;
  upperBound: number;
  totalRecords: number;
  outlierCount: number;
  outlierPercentage: number;
  outlierRecords: ExposureRecord[];
  methodologyNotes: string;
  interpretationText: string;
}

export interface CorrelationReport {
  variables: string[];
  correlationMatrix: Record<string, Record<string, number>>;
  methodology: string;
  observations: string;
}

export interface ColumnMeta {
  name: string;
  dataType: string;
  description: string;
  isNullable: boolean;
  nonNullCount: number;
}

export interface DatasetSummary {
  datasetName: string;
  version: string;
  totalRows: number;
  totalColumns: number;
  columns: ColumnMeta[];
  missingValuesCount: number;
  duplicateRecordsCount: number;
  invalidRecordsCount: number;
  dataQualityStatus: string;
  preparationMethodology: string;
}

export interface FilterState {
  startDate: string;
  endDate: string;
  zoneId: string;
  shiftId: string;
  workerId: string;
  demoStatus: string;
}

export interface DemoResetResponse {
  success: boolean;
  message: string;
  resetTimestamp: string;
  zonesLoaded: number;
  shiftsLoaded: number;
  workersLoaded: number;
  recordsLoaded: number;
  alertsLoaded: number;
}

export type UserRole = 'ROLE_ADMIN' | 'ROLE_WORKER';

export interface LoginResponse {
  token: string | null;
  username: string | null;
  role: UserRole | string | null;
  fullName: string | null;
  associatedWorkerId: string | null;
  message: string;
  email?: string | null;
  phoneNumber?: string | null;
}

export interface AdminProfileUpdate {
  fullName: string;
  username: string;
  email?: string;
  phoneNumber?: string;
}

export interface ZoneDetail {
  id: string;
  zoneCode: string;
  zoneName: string;
  riskTier: RiskTier;
  baselineExposurePpmHr: number;
  description: string;
  totalStationedWorkers: number;
  totalExposureRecords: number;
  observedMeanExposure: number;
  observedMaxExposure: number;
  baselineExcessPercentage: number;
  incidentCount: number;
  statusBreakdown: Record<string, number>;
  stationedWorkers: WorkerSummary[];
  recentAlerts: Alert[];
  dataSource: string;
}

export interface ExposureReportSummary {
  reportId: string;
  reportTitle: string;
  generatedAt: string;
  windowStart: string | null;
  windowEnd: string | null;
  totalRecords: number;
  compliantRecords: number;
  complianceRate: number;
  safetyIndex: number;
  isOverallCompliant: boolean;
  warningAlerts: number;
  criticalAlerts: number;
  meanExposurePpmHr: number;
  peakExposurePpmHr: number;
  zoneBreakdowns: any[];
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}


