# ChromaGuard — Data Dictionary & Synthetic Corpus Specification

## 1. Corpus Overview

The ChromaGuard demonstration corpus contains **718 synthetic records** collected across **20 consecutive days** (2026-09-01 to 2026-09-20), monitoring **40 synthetic workers** operating across **5 industrial refinery zones** and **3 operational work shifts**.

All values are generated deterministically using the Mulberry32 pseudo-random number generator with fixed seed `42`.

---

## 2. Table Specifications

### 2.1 Table: `industrial_zones`
Stores facility operational areas with baseline environmental risk attributes.

| Column | Type | Nullable | Key | Description / Value Domain |
| :--- | :--- | :---: | :---: | :--- |
| `zone_id` | VARCHAR(32) | NO | PK | Unique identifier (e.g., `ZONE-01`, `ZONE-04`). |
| `zone_code` | VARCHAR(16) | NO | UK | Facility abbreviation (`CCU`, `AGR`, `STTF`, `DT`, `RLT`). |
| `zone_name` | VARCHAR(128) | NO | - | Full industrial section name. |
| `risk_tier` | ENUM | NO | - | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`. |
| `baseline_exposure_ppm_hr` | DOUBLE | NO | - | Operational design target exposure (1.8 to 11.4 ppm·hr). |
| `description` | VARCHAR(512) | YES | - | Engineering summary of hazardous processes. |

---

### 2.2 Table: `shifts`
Defines standard industrial shift rotations.

| Column | Type | Nullable | Key | Description / Value Domain |
| :--- | :--- | :---: | :---: | :--- |
| `shift_id` | VARCHAR(32) | NO | PK | Identifier (`SHIFT-M`, `SHIFT-A`, `SHIFT-N`). |
| `shift_name` | VARCHAR(64) | NO | - | Shift name (Morning, Afternoon, Night). |
| `start_time` | VARCHAR(16) | NO | - | Start time (e.g., `06:00:00`, `14:00:00`, `22:00:00`). |
| `end_time` | VARCHAR(16) | NO | - | End time (e.g., `14:00:00`, `22:00:00`, `06:00:00`). |
| `duration_hours` | INTEGER | NO | - | Standard shift duration (8 hours). |

---

### 2.3 Table: `workers`
Synthetic employee records for tracking personal dosimetry history.

| Column | Type | Nullable | Key | Description / Value Domain |
| :--- | :--- | :---: | :---: | :--- |
| `worker_id` | VARCHAR(32) | NO | PK | Worker identifier (`W-101` to `W-140`). |
| `synthetic_name` | VARCHAR(128) | NO | - | Fictional full name (e.g., Marcus Vance, Elena Reyes). |
| `assigned_zone_id` | VARCHAR(32) | NO | FK | References `industrial_zones.zone_id`. |
| `preferred_shift_id` | VARCHAR(32) | NO | FK | References `shifts.shift_id`. |
| `role` | VARCHAR(128) | NO | - | Job classification (e.g., Lead Process Tech). |
| `experience_years` | INTEGER | NO | - | Tenure in industrial operations (2 to 19 years). |
| `badge_id` | VARCHAR(64) | NO | - | Personal dosimeter badge barcode (e.g., `CG-BDG-8001`). |

---

### 2.4 Table: `exposure_records`
Core time-series exposure observations.

| Column | Type | Nullable | Key | Description / Value Domain |
| :--- | :--- | :---: | :---: | :--- |
| `record_id` | VARCHAR(32) | NO | PK | Unique record identifier (`EXP-00001` to `EXP-00718`). |
| `worker_id` | VARCHAR(32) | NO | FK | References `workers.worker_id`. |
| `zone_id` | VARCHAR(32) | NO | FK | References `industrial_zones.zone_id`. |
| `shift_id` | VARCHAR(32) | NO | FK | References `shifts.shift_id`. |
| `record_timestamp` | TIMESTAMP | NO | IX | ISO-8601 acquisition timestamp. |
| `simulated_color_r` | INTEGER | NO | - | Simulated 8-bit Red channel (40 - 255). |
| `simulated_color_g` | INTEGER | NO | - | Simulated 8-bit Green channel (35 - 255). |
| `simulated_color_b` | INTEGER | NO | - | Simulated 8-bit Blue channel (30 - 245). |
| `illustrative_exposure_value` | DOUBLE | NO | - | Calculated exposure measurement (ppm·hr). |
| `illustrative_cumulative_dose`| DOUBLE | NO | - | Integrated shift cumulative dosage ($D$). |
| `demo_status` | ENUM | NO | IX | `NORMAL`, `ELEVATED`, `WARNING`, `CRITICAL`. |
| `data_source` | VARCHAR(64) | NO | - | Provenance flag: `SIMULATED_DATASET_V1`. |
| `dataset_version` | VARCHAR(32) | NO | - | Generation release tag: `2026.09-DEV`. |

---

### 2.5 Table: `alerts`
Incident management notifications triggered by threshold rules.

| Column | Type | Nullable | Key | Description / Value Domain |
| :--- | :--- | :---: | :---: | :--- |
| `alert_id` | VARCHAR(32) | NO | PK | Alert identifier (`ALT-0001` to `ALT-0040`). |
| `record_id` | VARCHAR(32) | NO | FK | References `exposure_records.record_id`. |
| `worker_id` | VARCHAR(32) | NO | FK | References `workers.worker_id`. |
| `zone_id` | VARCHAR(32) | NO | FK | References `industrial_zones.zone_id`. |
| `alert_timestamp` | TIMESTAMP | NO | IX | Event trigger timestamp. |
| `demo_severity` | ENUM | NO | - | `WARNING` (15.0 ppm·hr) or `CRITICAL` (20.0 ppm·hr). |
| `trigger_value_ppm_hr` | DOUBLE | NO | - | Exposure value causing the alert. |
| `threshold_limit_ppm_hr` | DOUBLE | NO | - | Benchmark limit applied. |
| `is_acknowledged` | BOOLEAN | NO | IX | `true` if acknowledged by safety lead, `false` otherwise. |
| `acknowledged_at` | TIMESTAMP | YES | - | Timestamp when safety lead verified action. |
| `acknowledged_by` | VARCHAR(128) | YES | - | Lead safety officer attribution. |
| `action_notes` | VARCHAR(512) | YES | - | Mitigation audit log notes. |
