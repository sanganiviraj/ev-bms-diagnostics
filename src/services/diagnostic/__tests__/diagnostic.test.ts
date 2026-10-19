import { describe, test, expect, beforeEach } from '@jest/globals';
import { MockDiagnosticAdapter } from '../MockDiagnosticAdapter';
import { UdsNrc } from '../DiagnosticTypes';
import { MOCK_PARAMETER_REGISTRY } from '../../../data/mockBatteryData';

describe('Digital EV Doctor - Automotive Diagnostic Test Suite', () => {
  let adapter: MockDiagnosticAdapter;

  beforeEach(() => {
    adapter = new MockDiagnosticAdapter();
  });

  describe('Connection & Lifecycle', () => {
    test('starts in disconnected state', () => {
      expect(adapter.isConnected()).toBe(false);
    });

    test('refuses UDS requests when disconnected', async () => {
      await expect(adapter.readDataByIdentifier('D100')).rejects.toThrow(
        /Diagnostic adapter disconnected/i
      );
    });

    test('connects successfully and reports simulated adapter metadata', async () => {
      const res = await adapter.connect();
      expect(res.success).toBe(true);
      expect(res.isSimulated).toBe(true);
      expect(res.protocol).toContain('ISO 14229-1');
      expect(adapter.isConnected()).toBe(true);
    });

    test('disconnects and resets security status', async () => {
      await adapter.connect();
      expect(adapter.isConnected()).toBe(true);
      await adapter.disconnect();
      expect(adapter.isConnected()).toBe(false);
    });
  });

  describe('Sample Data Decoding & Scaling Formulas', () => {
    test('decodes State of Charge (SoC) correctly with 0.1 scaling', () => {
      const socDef = MOCK_PARAMETER_REGISTRY.BMS_SOC;
      const result = socDef.decode([0x03, 0x10]); // 784 -> 78.4%
      expect(result.value).toBe(78.4);
      expect(result.validity).toBe('VALID');
    });

    test('decodes Pack Voltage correctly with 0.1 scaling', () => {
      const voltDef = MOCK_PARAMETER_REGISTRY.BMS_PACK_VOLTAGE;
      const result = voltDef.decode([0x0e, 0xf0]); // 3824 -> 382.4 V
      expect(result.value).toBe(382.4);
      expect(result.validity).toBe('VALID');
    });

    test('decodes Negative Signed Current correctly (2s complement)', () => {
      const currDef = MOCK_PARAMETER_REGISTRY.BMS_PACK_CURRENT;
      // 0xFF72 = -142 -> -14.2 A
      const result = currDef.decode([0xff, 0x72]);
      expect(result.value).toBe(-14.2);
      expect(result.validity).toBe('VALID');
    });

    test('decodes Battery Temperature with offset formula (Byte * 0.5 - 40)', () => {
      const tempDef = MOCK_PARAMETER_REGISTRY.BMS_BATT_TEMP;
      // 0x87 = 135 -> 135 * 0.5 - 40 = 27.5 °C
      const result = tempDef.decode([0x87]);
      expect(result.value).toBe(27.5);
      expect(result.validity).toBe('VALID');
    });

    test('handles invalid/truncated payload safely without throwing or silently returning 0', () => {
      const socDef = MOCK_PARAMETER_REGISTRY.BMS_SOC;
      const result = socDef.decode([0x03]); // truncated
      expect(result.validity).toBe('INVALID');
      expect(result.value).toBe('ERR');
    });
  });

  describe('UDS Service Response Parsing', () => {
    beforeEach(async () => {
      await adapter.connect();
    });

    test('DiagnosticSessionControl (0x10) returns 0x50 positive response', async () => {
      const res = await adapter.setDiagnosticSession(0x03);
      expect(res.success).toBe(true);
      expect(res.positiveResponseSid).toBe(0x50);
      expect(res.rawPayload).toContain('50 03');
    });

    test('ReadDataByIdentifier (0x22) returns 0x62 positive response with DID echo', async () => {
      const res = await adapter.readDataByIdentifier('D101');
      expect(res.success).toBe(true);
      expect(res.positiveResponseSid).toBe(0x62);
      expect(res.rawPayload.startsWith('62 D1 01')).toBe(true);
    });

    test('ReadDTCInformation (0x19) retrieves mock DTC trouble codes', async () => {
      const res = await adapter.readDTCs();
      expect(res.success).toBe(true);
      expect(res.dtcs.length).toBeGreaterThan(0);
      expect(res.dtcs[0].code).toBe('BMS_w107');
      expect(res.dtcs[0].isConfirmed).toBe(true);
    });

    test('SecurityAccess (0x27) handles Seed and Key challenge-response', async () => {
      // Step A: Request Seed
      const seedRes = await adapter.requestSecurityAccess(0x01);
      expect(seedRes.success).toBe(true);
      expect(seedRes.positiveResponseSid).toBe(0x67);
      expect(seedRes.rawPayload).toContain('67 01');

      // Step B: Send Key
      const keyRes = await adapter.requestSecurityAccess(0x02);
      expect(keyRes.success).toBe(true);
      expect(keyRes.rawPayload).toBe('67 02');
    });

    test('RoutineControl (0x31) requires prior Security Access', async () => {
      // Trying to execute routine without security auth should yield SecurityAccessDenied (NRC 0x33)
      const res = await adapter.executeRoutine('0215', 0x01);
      expect(res.success).toBe(false);
      expect(res.nrc).toBe(UdsNrc.SECURITY_ACCESS_DENIED);
      expect(res.rawPayload).toContain('7F 31 33');
    });

    test('RoutineControl (0x31) succeeds when Security Access is unlocked', async () => {
      await adapter.requestSecurityAccess(0x02); // unlock
      const res = await adapter.executeRoutine('0215', 0x01);
      expect(res.success).toBe(true);
      expect(res.positiveResponseSid).toBe(0x71);
      expect(res.rawPayload).toContain('71 01 0215 00');
    });
  });

  describe('Developer Fault Injection Scenarios', () => {
    beforeEach(async () => {
      await adapter.connect();
    });

    test('Timeout scenario simulates request timeout', async () => {
      adapter.setScenario('timeout');
      const res = await adapter.readDataByIdentifier('D100');
      expect(res.success).toBe(false);
      expect(res.rawPayload).toBe('TIMEOUT');
      expect(res.errorMessage).toContain('Timeout');
    });

    test('Negative response scenario returns UDS NRC 0x7F', async () => {
      adapter.setScenario('negative_response');
      const res = await adapter.readDataByIdentifier('D100');
      expect(res.success).toBe(false);
      expect(res.rawPayload.startsWith('7F')).toBe(true);
      expect(res.nrc).toBe(UdsNrc.REQUEST_OUT_OF_RANGE);
    });

    test('Failed verification scenario simulates self-test precondition error', async () => {
      await adapter.requestSecurityAccess(0x02); // unlock
      adapter.setScenario('failed_verification');
      const res = await adapter.executeRoutine('0215', 0x01);
      expect(res.success).toBe(false);
      expect(res.errorMessage).toContain('Self-Test Precondition Failure');
    });
  });
});
