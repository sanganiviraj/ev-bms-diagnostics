export type ConnectionMode = 'simulation' | 'ble_obd' | 'cloud_sdk';

export type DiagnosticConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface VehicleProfile {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  batteryCapacityKwh: number;
  nominalVoltage: number;
  maxRangeKm: number;
  imageUrl?: string;
  topViewUrl?: string;
}

export interface MetricCardItem {
  id: string;
  label: string;
  value: string;
  unit?: string;
  subValue?: string;
  badge?: string;
  isPositive?: boolean;
}

export interface ObdBleConfig {
  deviceName: string;
  serviceUuid: string;
  characteristicUuid: string;
  baudRate: number;
  canProtocol: string;
  headerId: string;
}

export interface CloudSdkConfig {
  provider: 'smartcar' | 'tesla_fleet' | 'enode' | 'custom_rest';
  clientId: string;
  accessToken: string;
  vehicleId: string;
  endpointUrl?: string;
}

export type {
  DiagnosticResponse,
  DTCResponse,
  DiagnosticTroubleCode,
  BatteryParameter,
  DiagnosticLogEntry,
  BMSResetState,
  ResetWorkflowStep,
  FailureScenario,
  DemoSettings,
} from '../services/diagnostic/DiagnosticTypes';
