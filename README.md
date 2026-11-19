# ChromaGuard

**A wearable hydrogen sulfide (H₂S) exposure monitor for refinery workers.**

ChromaGuard keeps the low-cost, power-free color-changing strip used in passive dosimeter badges and replaces the manual chart reading with an automatic, quantitative one. Each reading becomes a cumulative dose in ppm·hr, which is shown to the worker and stored by a Java backend that raises alerts and enforces role-based access.

## Problem

H₂S is toxic and deadens the sense of smell at high concentrations, so workers cannot judge their own exposure. Existing passive badges darken with cumulative exposure, but they are read by eye against a printed chart at the end of the shift. That reading is subjective, depends on the lighting, and gives the worker no warning during the shift.

## How it works

1. A reagent strip darkens as exposure builds up. In this prototype, printed color swatches stand in for the strip.
2. A TCS34725 color sensor under a fixed LED reads the strip, and an ESP32 handles the reading.
3. The RGB values are converted to the CIELAB color space, and a calibrated quadratic regression converts the lightness (L\*) into a cumulative dose in ppm·hr.
4. The wristband LCD shows the dose and a Safe, Warning, or Critical status.
5. The reading is sent to the Java backend, which validates it, stores it, and checks it against the thresholds.
6. Workers see only their own records. Administrators see all workers and the workers at critical exposure.

## Features

- Color capture and dose computation (RGB → CIELAB → regression)
- Live dose and status on the wristband display
- REST API for login, readings, and exposure history
- Role-based access (`WORKER` and `ADMIN`) with JSON Web Tokens
- Warning and Critical alerts using the Observer pattern
- Dashboard with exposure history, a critically exposed list, and zone-wise trends
- A 720-row sample dataset for testing the dashboard

## System modules

| Module | Purpose |
|---|---|
| Sensing and color capture | Reads the strip color with the TCS34725 sensor and ESP32 |
| Dose computation | Converts the color to a cumulative dose in ppm·hr |
| Live display | Shows the dose and status on the wristband LCD |
| Connectivity | Sends each reading to the backend as JSON |
| Authentication and access control | Login and role-based access with JSON Web Tokens |
| Backend and database | Stores workers, shifts, exposure records, and alerts |
| Alert and threshold | Flags Warning and Critical exposure |
| Dashboard and visualization | Worker and administrator views |

## Tech stack

| Area | Tools |
|---|---|
| Wristband | ESP32, TCS34725 color sensor, white LED, 16×2 I²C LCD, C++ (Arduino) |
| Backend | Java 17 or later *(TODO: list the framework and database your final code uses)* |
| Calibration | Python (NumPy, OpenCV, scikit-learn) |
| Testing | Postman |

## Java concepts used

- Object-oriented design: `Worker`, `Shift`, `ExposureRecord`, and `Alert` classes with encapsulation, inheritance, and interfaces
- Collections framework and the Streams API for grouping readings and summing each shift's dose
- Generics and repository interfaces
- Custom exceptions, such as `InvalidDoseReadingException`
- Concurrency with `ExecutorService` and `CompletableFuture`
- Design patterns: Observer (alerts), Factory (sensor types), Singleton (settings), and Builder (reports)

## REST endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Log in and receive a token |
| POST | `/api/readings` | Logged in | Submit a reading |
| GET | `/api/worker/me/exposure` | Worker | View your own exposure history |
| GET | `/api/admin/workers` | Admin | List all workers |
| GET | `/api/admin/workers/critical` | Admin | List workers at Critical exposure |
| GET | `/api/admin/workers/{id}/history` | Admin | View one worker's full history |

## Dose calibration

The dose is calculated from the lightness (L\*) of the strip color using a quadratic least-squares regression fitted on calibration swatches of known dose. On the demonstration swatches, a quadratic fit gave R² of about 0.998. The calibration doses are assigned by the team, so this shows how well the curve fits the swatches and is not an accuracy figure for real exposure.

## Sample dataset

`data/chromaguard_combined_dataset_filled.csv` has 720 rows: 40 workers, 3 administrators, 5 plant zones, 20 days of shifts, 717 exposure records, and 172 alerts. It is simulated, and it is used to develop and test the backend and dashboard.

## Project structure

```
chromaguard/
├── firmware/      ESP32 code (C++ / Arduino)
├── backend/       Java backend
├── calibration/   Python scripts for the color-to-dose regression
├── data/          Sample dataset
├── docs/          Report and diagrams
└── README.md
```

*(TODO: adjust the folders to match your repository.)*

## Getting started

*(TODO: add the build and run commands for your final code, and the demo logins.)*

1. Clone the repository.
2. Build and start the backend.
3. Flash the firmware to the ESP32, and set the WiFi name and the backend address.
4. Open the dashboard in a browser and log in.

## Limitations

- The reagent strip is simulated with printed color swatches. No real H₂S or lead acetate is used.
- The calibration is a simulated set. The accuracy of the dose against real exposure has not been validated.
- The 20 ppm·hr threshold is a demonstration value and not a regulatory limit. Warning is set at 75 percent of it.
- The dataset is simulated.
- There is no wearable enclosure, and no field trial has been done.

## Future work

- A motorized multi-strip carousel for a continuous exposure record during a shift
- Bluetooth Low Energy in place of WiFi, to reduce power use
- Cloud device management for many wristbands
- On-device inference in place of the calibrated formula
- A compact wearable enclosure with a rechargeable battery
- Security hardening for deployment
- Validation with controlled H₂S exposure against a reference instrument

## Team

| Name | Register number |
|---|---|
| ASHWIN SR | 927625BAD014 |
| BALASURYA T | 927625BAD018 |
| HARISH MUTHURASU | 927625BAD056 |

Supervisor: Mr. R. Stalin Babu, Assistant Professor, Department of Artificial Intelligence
M. Kumarasamy College of Engineering, Karur

## License

*(TODO: choose a license, for example MIT.)*
