# EV BMS Diagnostics — High-Voltage Diagnostic & Telematics Suite

A cross-platform mobile application for High-Voltage (HV) Battery diagnostics, real-time CAN bus telemetry, and Battery Management System (BMS) service routines built on **ISO 14229-1 (Unified Diagnostic Services - UDS)** and **ISO 15765-4 (CAN)** standards.

---

## 1. Features Overview

### 🔋 1. High-Voltage Battery Diagnostics
- **Live Telemetry Stream**: Real-time monitoring of State of Charge (SoC %), Pack Potential (V), Instantaneous Current (A), Module Temperature (°C), State of Health (SOH %), Usable Capacity (kWh), and Cell Voltage Delta (mV).
- **ISO 14229 Service 0x22 (ReadDataByIdentifier)**: Interactive polling across high-voltage battery parameter DIDs (`0xD100` – `0xD109`).
- **Telemetry Decoding Engine**: Converts raw CAN frame payloads into physical values using standard transfer functions (signed two's complement, linear offsets, and ADC calibrations).
- **Signal Validation**: Real-time validity checks (`VALID`, `DEGRADED`, `INVALID`, `OUT_OF_RANGE`) preventing corrupted or truncated frames from skewing readings.

### 🔄 2. BMS Service & Calibration Workflow
- **Standardized Multi-Stage Routine**:
  1. **Pre-flight Bus Check**: Validates CAN link status and ECU responsiveness.
  2. **Interrogate Active DTCs (0x19)**: Reads stored trouble codes and status masks.
  3. **Extended Diagnostic Session (0x10 0x03)**: Transitions ECU into diagnostic mode with calibrated P2/P2* timeout timings.
  4. **Cryptographic Security Access (0x27)**: Seed-and-Key challenge-response authentication.
  5. **Routine Control (0x31 0x01)**: Triggers onboard BMS calibration and contactor verification.
  6. **Post-Routine Verification**: Re-scans DTC registers and confirms baseline state.
- **Fail-Safe Controls**: Explicit operator confirmation, real-time cancellation hooks, and timeout guards.

### 📜 3. Automotive Terminal & Live Trace
- **Live CAN Frame Trace**: Bidirectional log buffer recording Transmit (`TX`), Receive (`RX`), and `SYSTEM` events with microsecond timestamps and raw hex payloads.
- **Search & Filtering**: Real-time filtering by service ID, direction, and error status.
- **Interactive Dispatch**: Manual dispatch of custom UDS hex frames with response parsing.

### 🛠️ 4. Dual-Mode Hardware Abstraction Layer (HAL)
- **Physical Bluetooth OBD-II Mode**: Connects to vehicle CAN bus via Bluetooth Low Energy dongles (OBDLink MX+, vLinker MC+, Veepeak, ELM327) using native `react-native-ble-plx`.
- **Simulation Bench Mode**: Built-in ISO 14229 state engine for bench testing, automated QA, and failure mode simulation (Negative Response NRC `0x7F`, ECU timeouts, failed verifications).

---

## 2. Architecture

The application implements a strict **Hardware Abstraction Layer (HAL)** decoupling the user interface from the underlying vehicle communication transport:

```
src/
├── app/                      # Application routes and navigation
│   ├── (tabs)/
│   │   ├── index.tsx         # Vehicle overview dashboard
│   │   ├── battery.tsx       # HV battery telemetry monitor
│   │   ├── reset.tsx         # BMS diagnostic & reset workflow
│   │   ├── logs.tsx          # Real-time CAN bus trace
│   │   └── settings.tsx      # Interface selection & hardware scanner
│   ├── _layout.tsx           # Global app layout & theme configuration
│   └── modal.tsx             # Protocol specifications modal
├── components/               # Reusable UI widgets & telemetry gauges
│   ├── BatteryOverviewCard.tsx
│   ├── BluetoothScannerCard.tsx
│   ├── ConnectionCard.tsx
│   ├── LogItemCard.tsx
│   ├── ParameterRow.tsx
│   ├── ResetWorkflowCard.tsx
│   └── TeslaBmsResetCard.tsx
├── data/                     # Diagnostic registries and DTC definitions
│   ├── mockBatteryData.ts    # Parameter registry and decoding functions
│   └── mockDTCs.ts           # Standard automotive fault code definitions
├── services/
│   └── diagnostic/
│       ├── BleManagerService.ts      # Native BLE transport (react-native-ble-plx)
│       ├── BluetoothObdAdapter.ts    # Physical ELM327 / STN CAN adapter
│       ├── CloudVehicleAdapter.ts    # Cloud telematics integration
│       ├── DiagnosticAdapter.ts      # HAL interface contract
│       ├── DiagnosticContext.tsx     # Reactive diagnostic state management
│       ├── DiagnosticTypes.ts        # Protocol types, NRC definitions
│       └── MockDiagnosticAdapter.ts  # ISO 14229 simulation engine
└── theme/                    # Design tokens & color palette
```

---

## 3. Getting Started

### Prerequisites
- **Node.js**: v18+ 
- **Package Manager**: `npm`
- **Native Tooling** (for physical device deployment): Android Studio (Android SDK) or Xcode (macOS).

### Installation
```bash
npm install
```

### Running the Application

#### 1. Android
```bash
npm run android
```

#### 2. iOS (macOS required)
```bash
npm run ios
```

#### 3. Web Preview
```bash
npm run web
```

---

## 4. Quality & Testing

The project includes an automotive unit test suite covering:
- Parameter decoding formulas (scaling factors, 2's complement negative current, temperature offsets).
- UDS service response parsing (`0x10`, `0x19`, `0x22`, `0x27`, `0x31`, `0x3E`).
- Negative Response Code (NRC `0x7F`) error handling.
- Communication timeout recovery.

```bash
# Run unit tests
npm test

# Run TypeScript type check
npx tsc --noEmit
```

---

## 5. Supported Standards
- **ISO 14229-1**: Road vehicles — Unified diagnostic services (UDS)
- **ISO 15765-4**: Road vehicles — Diagnostic communication over Controller Area Network (DoCAN)
- **ISO 11898**: Road vehicles — Controller Area Network (CAN) physical layer
- **SAE J1979**: E/E Diagnostic Test Modes
