# ChromaGuard — REST API Documentation & Example Payloads

Base URL: `http://localhost:8080/api`

All endpoints return UTF-8 JSON formatted payloads.

---

## 1. Dashboard Endpoints

### 1.1 GET `/api/dashboard/summary`
Retrieves aggregated KPI metrics. Supports optional filter parameters: `startDate`, `endDate`, `zoneId`, `shiftId`, `workerId`, `demoStatus`.

**Example Request:**
```bash
curl -X GET "http://localhost:8080/api/dashboard/summary?zoneId=ZONE-04"
```

**Example Response:**
```json
{
  "totalWorkers": 8,
  "totalRecords": 142,
  "avgExposurePpmHr": 11.45,
  "maxExposurePpmHr": 25.9,
  "minExposurePpmHr": 5.2,
  "warningRecords": 12,
  "criticalRecords": 14,
  "elevatedRecords": 105,
  "normalRecords": 11,
  "totalAlerts": 26,
  "unacknowledgedAlerts": 17,
  "simulatedMode": "SIMULATED_DEMO_DATA"
}
```

---

### 1.2 GET `/api/dashboard/trends`
Returns daily time-series aggregates for line chart rendering.

**Example Request:**
```bash
curl -X GET "http://localhost:8080/api/dashboard/trends"
```

**Example Response:**
```json
[
  {
    "date": "2026-09-01",
    "avgExposurePpmHr": 6.84,
    "maxExposurePpmHr": 14.12,
    "recordCount": 36,
    "warningCount": 0,
    "criticalCount": 0
  },
  {
    "date": "2026-09-05",
    "avgExposurePpmHr": 10.92,
    "maxExposurePpmHr": 25.9,
    "recordCount": 37,
    "warningCount": 3,
    "criticalCount": 4
  }
]
```

---

### 1.3 GET `/api/dashboard/zone-comparison`
Returns comparative exposure statistics across all 5 monitored units.

**Example Response:**
```json
[
  {
    "zoneId": "ZONE-04",
    "zoneCode": "DT",
    "zoneName": "Desulfurization Trench",
    "riskTier": "CRITICAL",
    "baselineExposure": 11.4,
    "avgExposurePpmHr": 11.45,
    "maxExposurePpmHr": 25.9,
    "recordCount": 142,
    "alertCount": 26
  },
  {
    "zoneId": "ZONE-03",
    "zoneCode": "STTF",
    "zoneName": "Sulfur Treatment Tank Farm",
    "riskTier": "HIGH",
    "baselineExposure": 8.5,
    "avgExposurePpmHr": 8.62,
    "maxExposurePpmHr": 21.8,
    "recordCount": 145,
    "alertCount": 8
  }
]
```

---

## 2. Worker Endpoints

### 2.1 GET `/api/workers`
Returns searchable worker personnel summaries with optional query parameters `search`, `zoneId`, `shiftId`.

**Example Request:**
```bash
curl -X GET "http://localhost:8080/api/workers?search=Marcus"
```

**Example Response:**
```json
[
  {
    "id": "W-101",
    "syntheticName": "Marcus Vance",
    "assignedZoneId": "ZONE-01",
    "assignedZoneName": "Catalyst Cracking Unit",
    "preferredShiftId": "SHIFT-M",
    "preferredShiftName": "Morning Shift",
    "role": "Lead Process Tech",
    "experienceYears": 14,
    "badgeId": "CG-BDG-8000",
    "totalRecords": 18,
    "avgExposurePpmHr": 3.42,
    "maxExposurePpmHr": 6.8,
    "latestDemoStatus": "NORMAL",
    "latestTimestamp": "2026-09-20T06:00:00"
  }
]
```

### 2.2 GET `/api/workers/{id}/detail`
Returns full profile, 20-day trend timeline, recent records, and incident history.

---

## 3. Alerts & Incident Management

### 3.1 POST `/api/alerts/{id}/acknowledge`
Persists operator acknowledgement and mitigation notes into the database.

**Example Request:**
```bash
curl -X POST "http://localhost:8080/api/alerts/ALT-0001/acknowledge" \
  -H "Content-Type: application/json" \
  -d '{
    "acknowledgedBy": "Safety Lead Sarah Jenkins",
    "actionNotes": "Emergency culvert exhaust fan switched to auxiliary power. Isolation valves checked."
  }'
```

**Example Response:**
```json
{
  "id": "ALT-0001",
  "recordId": "EXP-00142",
  "workerId": "W-104",
  "workerName": "Amina Siddiqui",
  "zoneId": "ZONE-04",
  "zoneCode": "DT",
  "zoneName": "Desulfurization Trench",
  "timestamp": "2026-09-05T06:00:00",
  "demoSeverity": "CRITICAL",
  "triggerValuePpmHr": 24.8,
  "thresholdLimitPpmHr": 20.0,
  "isAcknowledged": true,
  "acknowledgedAt": "2026-10-12T22:45:00",
  "acknowledgedBy": "Safety Lead Sarah Jenkins",
  "actionNotes": "Emergency culvert exhaust fan switched to auxiliary power. Isolation valves checked."
}
```

---

## 4. DEV Lab Statistical Endpoints

### 4.1 GET `/api/analytics/descriptive-statistics`
Returns statistical metrics across all numerical features.

### 4.2 GET `/api/analytics/outliers`
Evaluates Tukey IQR outlier fences ($Q_1$, $Q_3$, $IQR$, upper fence, lower fence) and isolates anomalous records.

### 4.3 GET `/api/analytics/correlation`
Returns Pearson correlation matrix across Exposure, Cumulative Dose, and RGB color channels.

---

## 5. Administrative Simulation Control

### 5.1 POST `/api/demo/reset`
Wipes transient modifications and reloads baseline datasets from classpath resources.
```bash
curl -X POST "http://localhost:8080/api/demo/reset"
```
