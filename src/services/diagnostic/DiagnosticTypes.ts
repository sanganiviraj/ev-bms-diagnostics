/**
 * Standard UDS (ISO 14229-1) Service Identifiers
 */
export enum UdsServiceId {
  DIAGNOSTIC_SESSION_CONTROL = 0x10,
  ECU_RESET = 0x11,
  CLEAR_DIAGNOSTIC_INFORMATION = 0x14,
  READ_DTC_INFORMATION = 0x19,
  READ_DATA_BY_IDENTIFIER = 0x22,
  SECURITY_ACCESS = 0x27,
  COMMUNICATION_CONTROL = 0x28,
  WRITE_DATA_BY_IDENTIFIER = 0x2E,
  ROUTINE_CONTROL = 0x31,
  TESTER_PRESENT = 0x3E,
  CONTROL_DTC_SETTING = 0x85,
  NEGATIVE_RESPONSE = 0x7F,
}

/**
 * Standard ISO 14229-1 Negative Response Codes (NRC)
 */
export enum UdsNrc {
  GENERAL_REJECT = 0x10,
  SERVICE_NOT_SUPPORTED = 0x11,
  SUB_FUNCTION_NOT_SUPPORTED = 0x12,
  INCORRECT_MESSAGE_LENGTH = 0x13,
  CONDITIONS_NOT_CORRECT = 0x22,
  REQUEST_SEQUENCE_ERROR = 0x24,
  REQUEST_OUT_OF_RANGE = 0x31,
  SECURITY_ACCESS_DENIED = 0x33,
  INVALID_KEY = 0x35,
  EXCEED_NUMBER_OF_ATTEMPTS = 0x36,
  REQUIRED_TIME_DELAY_NOT_EXPIRED = 0x37,
  GENERAL_PROGRAMMING_FAILURE = 0x72,
  RESPONSE_PENDING = 0x78,
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export type FailureScenario =
  | 'success'
  | 'timeout'
  | 'negative_response'
  | 'failed_verification';

export interface DiagnosticResponse {
  success: boolean;
  serviceId: number;
  positiveResponseSid: number;
  nrc?: UdsNrc;
  nrcDescription?: string;
  rawPayload: string; // e.g. "62 D1 00 0F 14"
  dataBytes: number[];
  executionTimeMs: number;
  timestamp: string;
  errorMessage?: string;
}

export interface ConnectionResult {
  success: boolean;
  interfaceName: string;
  vehicleName: string;
  protocol: string;
  timestamp: string;
  isSimulated: boolean;
  message: string;
}

export interface DTCResponse {
  success: boolean;
  dtcs: DiagnosticTroubleCode[];
  rawPayload: string;
  executionTimeMs: number;
  timestamp: string;
}

export interface DiagnosticTroubleCode {
  code: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ecu: string;
  statusByte: string;
  statusText: string;
  isConfirmed: boolean;
  isPending: boolean;
}

export interface BatteryParameter {
  id: string;
  name: string;
  didHex: string; // Mock illustrative DID e.g. "0xD100"
  rawHex: string; // e.g. "0x0E F0"
  decodedValue: number | string;
  unit: string;
  formula: string;
  validity: 'VALID' | 'DEGRADED' | 'INVALID' | 'OUT_OF_RANGE';
  category: 'CORE' | 'THERMAL' | 'SAFETY' | 'CAPACITY';
  lastUpdated: string;
  notes?: string;
}

export type ResetWorkflowStep = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface BMSResetState {
  currentStep: ResetWorkflowStep;
  stepStatus: 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';
  securityAuthorized: boolean;
  sessionActive: boolean;
  resetRoutineExecuted: boolean;
  verificationPassed: boolean | null;
  errorDetails: string | null;
  stepLogs: Array<{
    timestamp: string;
    step: number;
    message: string;
    type: 'info' | 'success' | 'warn' | 'error';
    rawHex?: string;
  }>;
}

export interface DiagnosticLogEntry {
  id: string;
  timestamp: string;
  direction: 'TX' | 'RX' | 'SYSTEM';
  service: string;
  rawHex: string;
  summary: string;
  details?: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
}

export interface DemoSettings {
  scenario: FailureScenario;
  delayMs: number;
  timeoutMs: number;
  simulatedVehicle: string;
  interfaceType: string;
  simulatedVin: string;
}
