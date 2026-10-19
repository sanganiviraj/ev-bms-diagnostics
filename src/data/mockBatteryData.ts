import { BatteryParameter } from '../services/diagnostic/DiagnosticTypes';

export interface RawParameterDefinition {
  id: string;
  name: string;
  didHex: string; // Illustrative mock DID
  unit: string;
  category: 'CORE' | 'THERMAL' | 'SAFETY' | 'CAPACITY';
  rawBytes: number[];
  formula: string;
  notes: string;
  decode: (bytes: number[]) => { value: number | string; validity: 'VALID' | 'DEGRADED' | 'INVALID' | 'OUT_OF_RANGE' };
}

/**
 * Registry of simulated battery parameters.
 * NOTE: Diagnostic Identifiers (DIDs) and byte scaling formulas are illustrative
 * mock definitions for demonstration and learning purposes.
 */
export const MOCK_PARAMETER_REGISTRY: Record<string, RawParameterDefinition> = {
  BMS_SOC: {
    id: 'BMS_SOC',
    name: 'State of Charge (SoC)',
    didHex: 'D100',
    unit: '%',
    category: 'CORE',
    rawBytes: [0x03, 0x10], // 0x0310 = 784 -> 78.4%
    formula: '((Byte[0] << 8) | Byte[1]) * 0.1',
    notes: 'HV Battery estimated state of charge normalized for display',
    decode: (bytes) => {
      if (bytes.length < 2) return { value: 'ERR', validity: 'INVALID' };
      const raw = (bytes[0] << 8) | bytes[1];
      const val = +(raw * 0.1).toFixed(1);
      const validity = val >= 0 && val <= 100 ? 'VALID' : 'OUT_OF_RANGE';
      return { value: val, validity };
    },
  },
  BMS_PACK_VOLTAGE: {
    id: 'BMS_PACK_VOLTAGE',
    name: 'High-Voltage Pack Potential',
    didHex: 'D101',
    unit: 'V',
    category: 'CORE',
    rawBytes: [0x0e, 0xf0], // 0x0EF0 = 3824 -> 382.4 V
    formula: '((Byte[0] << 8) | Byte[1]) * 0.1',
    notes: 'Total sum of series battery cell modules (Nominal ~350-403V)',
    decode: (bytes) => {
      if (bytes.length < 2) return { value: 'ERR', validity: 'INVALID' };
      const raw = (bytes[0] << 8) | bytes[1];
      const val = +(raw * 0.1).toFixed(1);
      const validity = val > 200 && val < 500 ? 'VALID' : 'OUT_OF_RANGE';
      return { value: val, validity };
    },
  },
  BMS_PACK_CURRENT: {
    id: 'BMS_PACK_CURRENT',
    name: 'Pack Instantaneous Current',
    didHex: 'D102',
    unit: 'A',
    category: 'CORE',
    rawBytes: [0xff, 0x72], // Signed 16-bit: 0xFF72 = -142 -> -14.2 A
    formula: '(signed int16) * 0.1 (Negative = Discharge, Positive = Charge/Regen)',
    notes: 'Current sensor shunt reading across main HV bus',
    decode: (bytes) => {
      if (bytes.length < 2) return { value: 'ERR', validity: 'INVALID' };
      let raw = (bytes[0] << 8) | bytes[1];
      if (raw >= 0x8000) raw -= 0x10000; // 2's complement
      const val = +(raw * 0.1).toFixed(1);
      return { value: val, validity: 'VALID' };
    },
  },
  BMS_BATT_TEMP: {
    id: 'BMS_BATT_TEMP',
    name: 'Average Module Temperature',
    didHex: 'D103',
    unit: '°C',
    category: 'THERMAL',
    rawBytes: [0x87], // 0x87 = 135 -> 135 * 0.5 - 40 = 27.5 °C
    formula: 'Byte[0] * 0.5 - 40.0',
    notes: 'Calculated average of internal pack NTC thermal probes',
    decode: (bytes) => {
      if (bytes.length < 1) return { value: 'ERR', validity: 'INVALID' };
      const val = +(bytes[0] * 0.5 - 40.0).toFixed(1);
      const validity = val >= -40 && val <= 85 ? 'VALID' : 'OUT_OF_RANGE';
      return { value: val, validity };
    },
  },
  BMS_SOH: {
    id: 'BMS_SOH',
    name: 'Battery State of Health (SOH)',
    didHex: 'D104',
    unit: '%',
    category: 'CAPACITY',
    rawBytes: [0x03, 0xb4], // 0x03B4 = 948 -> 94.8%
    formula: '((Byte[0] << 8) | Byte[1]) * 0.1',
    notes: 'Long-term coulomb counting and internal impedance estimation',
    decode: (bytes) => {
      if (bytes.length < 2) return { value: 'ERR', validity: 'INVALID' };
      const raw = (bytes[0] << 8) | bytes[1];
      const val = +(raw * 0.1).toFixed(1);
      return { value: val, validity: 'VALID' };
    },
  },
  BMS_REMAINING_CAPACITY: {
    id: 'BMS_REMAINING_CAPACITY',
    name: 'Available Usable Energy',
    didHex: 'D105',
    unit: 'kWh',
    category: 'CAPACITY',
    rawBytes: [0x02, 0xc8], // 0x02C8 = 712 -> 71.2 kWh
    formula: '((Byte[0] << 8) | Byte[1]) * 0.1',
    notes: 'Remaining usable energy before low-voltage brick threshold',
    decode: (bytes) => {
      if (bytes.length < 2) return { value: 'ERR', validity: 'INVALID' };
      const raw = (bytes[0] << 8) | bytes[1];
      const val = +(raw * 0.1).toFixed(1);
      return { value: val, validity: 'VALID' };
    },
  },
  BMS_CELL_DELTA_V: {
    id: 'BMS_CELL_DELTA_V',
    name: 'Max Cell Voltage Delta (Vmax - Vmin)',
    didHex: 'D106',
    unit: 'mV',
    category: 'SAFETY',
    rawBytes: [0x00, 0x0c], // 12 mV
    formula: '((Byte[0] << 8) | Byte[1]) * 1.0',
    notes: 'Cell imbalance check (< 30 mV considered optimal)',
    decode: (bytes) => {
      if (bytes.length < 2) return { value: 'ERR', validity: 'INVALID' };
      const raw = (bytes[0] << 8) | bytes[1];
      const validity = raw < 50 ? 'VALID' : 'DEGRADED';
      return { value: raw, validity };
    },
  },
  BMS_CONTACTOR_STATE: {
    id: 'BMS_CONTACTOR_STATE',
    name: 'HV Main Contactor Status',
    didHex: 'D107',
    unit: '',
    category: 'SAFETY',
    rawBytes: [0x01], // 1 = CLOSED
    formula: '0=OPEN (SAFE), 1=CLOSED (ENERGIZED), 2=PRECHARGE, 3=FAULT',
    notes: 'High-voltage pyro and magnetic contactor relay telemetry',
    decode: (bytes) => {
      if (bytes.length < 1) return { value: 'UNKNOWN', validity: 'INVALID' };
      const states = ['OPEN (SAFE)', 'CLOSED (HV ACTIVE)', 'PRE-CHARGE ACTIVE', 'FAULT TRIP'];
      const st = states[bytes[0]] || 'UNKNOWN';
      return { value: st, validity: 'VALID' };
    },
  },
  BMS_ISOLATION_RES: {
    id: 'BMS_ISOLATION_RES',
    name: 'Chassis Isolation Resistance',
    didHex: 'D108',
    unit: 'kΩ',
    category: 'SAFETY',
    rawBytes: [0x02, 0x58], // 600 kΩ
    formula: '((Byte[0] << 8) | Byte[1]) * 1.0',
    notes: 'Galvanic isolation check between HV pack potential and vehicle 12V chassis',
    decode: (bytes) => {
      if (bytes.length < 2) return { value: 'ERR', validity: 'INVALID' };
      const raw = (bytes[0] << 8) | bytes[1];
      const validity = raw > 500 ? 'VALID' : 'DEGRADED';
      return { value: raw, validity };
    },
  },
};

/** Convert bytes to formatted hex string e.g. "03 10" */
export function bytesToHex(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

/** Generate a realistic battery parameter snapshot */
export function getInitialMockBatteryParameters(): BatteryParameter[] {
  const now = new Date().toLocaleTimeString();
  return Object.values(MOCK_PARAMETER_REGISTRY).map((def) => {
    const decoded = def.decode(def.rawBytes);
    return {
      id: def.id,
      name: def.name,
      didHex: `0x${def.didHex}`,
      rawHex: bytesToHex(def.rawBytes),
      decodedValue: decoded.value,
      unit: def.unit,
      formula: def.formula,
      validity: decoded.validity,
      category: def.category,
      lastUpdated: now,
      notes: def.notes,
    };
  });
}
