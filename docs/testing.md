# ChromaGuard — Verification & Testing Documentation

## 1. Testing Strategy

ChromaGuard features automated testing across unit calculations, statistical formulas, threshold evaluations, and end-to-end Spring Boot web slices.

---

## 2. Automated Test Suites (JUnit 5)

### 2.1 Unit Tests: `ExposureCalculationServiceTest`
Validates the mathematical exposure calculation service:
- **Threshold Boundary Testing**: Evaluates threshold transitions for `NORMAL` (< 8.0), `ELEVATED` (8.0 - 14.99), `WARNING` (15.0 - 19.99), and `CRITICAL` (≥ 20.0 ppm·hr).
- **Cumulative Dose Formula**: Asserts discrete integration $D = C \cdot \Delta t \cdot \eta$ under standard and edge-case parameters (0 ppm, negative inputs, zero duration).
- **Stream Aggregation**: Asserts arithmetic mean, minimum, and maximum extraction over record collections.

### 2.2 Statistical Unit Tests: `AnalyticsServiceTest`
Verifies core academic DEV calculations:
- **Descriptive Statistics**: Evaluates sample mean, median, sample variance ($s^2 = \frac{\sum (x - \bar{x})^2}{n-1}$), standard deviation ($s$), and quartiles against a benchmark mathematical vector.
- **Pearson Correlation**: Validates that linear vectors yield $r = +1.0$ and inverse vectors yield $r = -1.0$.
- **Histogram Binning**: Ensures continuous values are binned into discrete frequency buckets without loss of count.

### 2.3 Integration Tests: `ChromaGuardApplicationTests`
Runs a full Spring Boot application context with MockMvc:
- **Dataset Ingestion Check**: Confirms at least 5 zones, 3 shifts, 40 workers, >700 exposure records, and >20 simulated alerts are ingested on boot.
- **REST Endpoints Testing**:
  - `GET /api/dashboard/summary` returns 200 OK and valid JSON matching the 40-worker cohort.
  - `GET /api/workers` returns all 40 personnel records.
  - `GET /api/analytics/descriptive-statistics` returns 5 statistical feature rows.
  - `GET /api/analytics/outliers` validates Tukey IQR fences and outlier array structures.

---

## 3. Running Test Suites

Execute the following Maven command from the `backend/` directory:

```powershell
mvn clean test
```

### Test Execution Results
```text
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0 -- in com.chromaguard.ExposureCalculationServiceTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0 -- in com.chromaguard.AnalyticsServiceTest
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0 -- in com.chromaguard.ChromaGuardApplicationTests
[INFO] 
[INFO] Results:
[INFO] Tests run: 11, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

---

## 4. Frontend Type & Build Verification

The React TypeScript application is validated using Vite's production compiler:

```powershell
cd frontend
npm run build
```

**Compiler Output:**
- `✓ 2523 modules transformed.`
- Zero TypeScript type errors.
- Verified bundle generation in `dist/`.
