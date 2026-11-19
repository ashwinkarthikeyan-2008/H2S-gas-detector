# ChromaGuard — H₂S Exposure Monitoring & Data Intelligence Platform

[![Java 21](https://img.shields.io/badge/Java-21_LTS-orange.svg)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React 19](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL_3D-black.svg)](https://threejs.org/)
[![Apache ECharts](https://img.shields.io/badge/ECharts-5.x-AA344D.svg)](https://echarts.apache.org/)
[![Tests](https://img.shields.io/badge/JUnit_5-11%20Passed-success.svg)]()

> **ACADEMIC & EDUCATIONAL DEMONSTRATION NOTICE:**
> ChromaGuard is a software-only prototype built on deterministic synthetic datasets for a Java Programming and Data Exploration & Visualization (DEV) academic project. **It does not connect to real IoT hardware, chemical reagent strips, or real hazardous H₂S gas, and is NOT certified for life-safety or official OSHA compliance.**

---

## 1. Project Overview

**ChromaGuard** demonstrates how worker personal exposure-monitoring records could be collected, mathematically aggregated, reviewed, and visualized across complex manufacturing facilities.

The system features:
- **Cinematic Industrial Dark-Mode UI**: Deep midnight navy surfaces with electric cyan and teal glowing accents, glassmorphic card containers, and responsive desktop/mobile views.
- **3D Molecular Hero Visual**: A hardware-accelerated Three.js 3D $H_2S$ molecular visualization featuring atomic translucent shaders, chemical bond cylinders, electron cloud particles, and pointer-responsive parallax with 2D fallback.
- **Dynamic Executive Dashboard**: 6 real-time KPI metric cards and 6 synchronized Apache ECharts panels (Timeline Trend, Zone Comparison vs Baseline, Status Donut, Exposure Histogram, Worker Bar, and Zone-by-Time Heatmap).
- **Worker Personnel Explorer**: Searchable and sortable directory of 40 synthetic workers with personal profile modals and individual 20-day timeline charts.
- **Academic DEV Lab**: Data hygiene inspector (0 missing values, 0 duplicates), parametric and non-parametric descriptive statistics, Tukey IQR outlier detection, and Pearson correlation matrices.
- **Simulated Incident Management**: Persistent acknowledgement workflow logging operator mitigations to the database.
- **Comprehensive Java 21 Backend**: Spring Boot 3.3.4, JPA, Spring Security 6 RBAC, H2 in-memory persistence, and 11 passing JUnit 5 tests.

---

## 2. System Architecture

```text
chromaguard/
├── backend/                              # Java 21 LTS + Spring Boot Service
│   ├── src/main/java/com/chromaguard/
│   │   ├── analytics/                    # Statistical services (IQR, Pearson, Stats)
│   │   ├── config/                       # Security & CORS configuration
│   │   ├── controller/                   # REST API Controllers (Dashboard, Workers, Alerts, etc.)
│   │   ├── dto/                          # Data Transfer Objects
│   │   ├── entity/                       # JPA Domain Entities & Enums
│   │   ├── exception/                    # Global Exception Handler
│   │   ├── repository/                   # Spring Data Repositories
│   │   └── service/                      # Business & Ingestion Services
│   ├── src/main/resources/
│   │   ├── application.yml               # Configuration, thresholds, H2 settings
│   │   └── data/datasets/                # Deterministic Seed CSVs (zones, workers, records, alerts)
│   ├── src/test/java/                    # JUnit 5 Unit & Integration Tests (11 tests)
│   └── pom.xml                           # Maven project descriptor
├── frontend/                             # React 19 + TypeScript + Vite Client
│   ├── src/
│   │   ├── components/                   # 3D Molecule Hero, EChartWrapper, FilterBar
│   │   ├── layouts/                      # AppLayout (Sidebar, Topbar with demo indicator)
│   │   ├── pages/                        # 8 Core application pages
│   │   ├── services/                     # Typed API client
│   │   ├── types/                        # TypeScript domain interfaces
│   │   └── index.css                     # Industrial dark-theme tokens & glassmorphism
│   ├── package.json
│   ├── vite.config.ts                    # Reverse proxy to port 8080
│   └── tailwind.config.js
└── docs/                                 # Academic Documentation
    ├── architecture.md                   # Mermaid diagrams & sequence workflows
    ├── data-dictionary.md                # Full schema & value domain reference
    ├── api-examples.md                   # Curl commands and example JSON responses
    └── testing.md                        # Test strategies and validation results
```

---

## 3. Quick Start & Setup Instructions

### Prerequisites
- **Java 21 LTS** installed (`java -version`).
- **Apache Maven 3.9+** installed (`mvn -version`).
- **Node.js 20+** and **npm** installed (`node -v`).

### 3.1 Running the Backend
From the repository root:
```bash
cd backend
mvn spring-boot:run
```
The backend initializes the H2 in-memory database, ingests the 718 synthetic records across 40 workers, and serves the REST API on `http://localhost:8080`.
- H2 Console available at: `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:chromaguarddb`, User: `sa`, Password: `password`).

### 3.2 Running the Frontend
In a separate terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` (or `http://127.0.0.1:5173`) in any modern web browser.

---

## 4. Academic Concept Mappings

### 4.1 Java 21 Concepts
| Concept | Implementation Location | Description |
| :--- | :--- | :--- |
| **OOP Encapsulation** | `Worker`, `ExposureRecord`, `Alert` | Domain entities protect state through private fields and controlled getters/setters. |
| **Java Streams API** | `ExposureCalculationService`, `AnalyticsService` | Used for grouping by zone/date, averaging, finding maxima, computing variance, and calculating percentiles. |
| **Rich Enums** | `DemoStatus`, `RiskTier`, `UserRole` | Encapsulate thresholds, badge styles, and role authorization. |
| **Layered Architecture** | `controller`, `service`, `repository`, `entity` | Strict separation of concerns with dependency injection via constructors. |
| **Spring Data JPA** | `ExposureRecordRepository` | Parameterized JPQL queries supporting multi-criteria dynamic filtering. |
| **Automated Testing** | `ExposureCalculationServiceTest`, `AnalyticsServiceTest`, `ChromaGuardApplicationTests` | 11 unit and integration tests executing with JUnit 5 and MockMvc. |

### 4.2 Data Exploration & Visualization (DEV) Concepts
| Concept | Implementation Location | Description |
| :--- | :--- | :--- |
| **Data Hygiene Audit** | `DatasetSummaryDto`, `AnalyticsLabPage` | Systematic check for missing values (0%), duplicates (0%), and schema validation. |
| **Parametric Statistics** | `DescriptiveStatsDto`, `AnalyticsService` | Sample mean ($\bar{x}$), sample standard deviation ($s$), and variance ($s^2$). |
| **Non-Parametric Metrics** | `AnalyticsLabPage` | Median ($Q_2$), Quartiles ($Q_1, Q_3$), and Interquartile Range ($IQR$). |
| **Tukey's Fences** | `detectOutliers()`, `AnalyticsLabPage` | Isolates anomalous exposure spikes using $Q_1 - 1.5 \cdot IQR$ and $Q_3 + 1.5 \cdot IQR$. |
| **Pearson Correlation** | `computeCorrelationMatrix()` | Bivariate correlation matrix measuring associations across exposure, dosage, and RGB badge channels. |
| **Multi-Dimensional Encoding** | ECharts Suite | Line charts (trends), Bar charts (zones), Donut charts (categories), Histograms (frequencies), and Heatmaps (intensity matrices). |

---

## 5. Seeded Accounts & Reset Control

### Demonstration User Accounts
| Username | Password | Role | Description |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | `ROLE_ADMIN` | Lead Plant Safety Director (can reset simulation) |
| `auditor` | `audit123` | `ROLE_AUDITOR` | External Academic Reviewer |
| `worker` | `worker123` | `ROLE_WORKER` | Fictional Field Worker (Marcus Vance) |

### Database Reset Instructions
To reset the demonstration state back to the deterministic baseline:
1. Navigate to the **About & Methodology** page in the UI and click **Reset Simulation Database**.
2. Or trigger the REST endpoint directly:
```bash
curl -X POST "http://localhost:8080/api/demo/reset"
```
The endpoint wipes modified alerts and reloads the clean baseline CSV dataset from classpath resources.

---

## 6. Documentation Files
- Detailed System Architecture: [docs/architecture.md](docs/architecture.md)
- Complete Data Dictionary: [docs/data-dictionary.md](docs/data-dictionary.md)
- API Examples & Payloads: [docs/api-examples.md](docs/api-examples.md)
- Test Suites & Assertions: [docs/testing.md](docs/testing.md)

---

## 7. Safety Disclaimer
**ChromaGuard is a software-only educational prototype based on synthetic data. It is not a certified H₂S detector, exposure dosimeter, or life-safety system.**
