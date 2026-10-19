import { DiagnosticTroubleCode } from '../services/diagnostic/DiagnosticTypes';

export const INITIAL_MOCK_DTCS: DiagnosticTroubleCode[] = [
  {
    code: 'BMS_w107',
    description: 'Isolation resistance degraded below safety threshold (<500 kΩ)',
    severity: 'HIGH',
    ecu: 'Tesla BMS Master (0x7E4)',
    statusByte: '0x2F',
    statusText: 'CONFIRMED | TEST_FAILED_THIS_CYCLE',
    isConfirmed: true,
    isPending: false,
  },
  {
    code: 'BMS_u029',
    description: 'Contactor open request triggered due to pack voltage mismatch',
    severity: 'CRITICAL',
    ecu: 'Tesla BMS Master (0x7E4)',
    statusByte: '0x3B',
    statusText: 'CONFIRMED | CONTACTOR_PRECHARGE_LATCHED',
    isConfirmed: true,
    isPending: false,
  },
];

export const POST_RESET_CLEARED_DTCS: DiagnosticTroubleCode[] = [];

export function formatDtcBytes(code: string, statusByteHex: string): string {
  return `${code} [Status: ${statusByteHex}]`;
}
