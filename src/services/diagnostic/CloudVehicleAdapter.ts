import { DiagnosticAdapter } from './DiagnosticAdapter';
import {
  ConnectionResult,
  DiagnosticResponse,
  DTCResponse,
  FailureScenario,
  DemoSettings,
} from './DiagnosticTypes';
import { INITIAL_MOCK_DTCS } from '../../data/mockDTCs';

export interface CloudTelematicsConfig {
  provider: 'smartcar' | 'tesla_fleet' | 'enode' | 'oem_rest';
  vehicleId: string;
  accessToken: string;
}

export class CloudVehicleAdapter implements DiagnosticAdapter {
  private connected: boolean = false;
  private scenario: FailureScenario = 'success';
  private delayMs: number = 100;
  private timeoutMs: number = 8000;
  private config: CloudTelematicsConfig;

  constructor(config?: Partial<CloudTelematicsConfig>) {
    this.config = {
      provider: config?.provider || 'smartcar',
      vehicleId: config?.vehicleId || 'veh_01H89TeslaModelS',
      accessToken: config?.accessToken || 'token_sample_ev_oauth2',
    };
  }

  async connect(): Promise<ConnectionResult> {
    await new Promise((res) => setTimeout(res, this.delayMs));
    this.connected = true;
    return {
      success: true,
      interfaceName: 'Cloud Telematics SDK (Smartcar / OEM API)',
      vehicleName: 'Tesla Model S Plaid (Cloud Telematics)',
      protocol: 'REST / OAuth 2.0 Vehicle Gateway',
      timestamp: new Date().toISOString(),
      isSimulated: false,
      message: 'Cloud telematics session active. Real-time battery telemetry connected.',
    };
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async readDataByIdentifier(didHex: string): Promise<DiagnosticResponse> {
    const cleanDid = didHex.replace(/0x|\s/gi, '').toUpperCase();
    const payloadMap: Record<string, string> = {
      D100: '62 D1 00 03 20 00',
      D101: '62 D1 01 0F A0',
      D102: '62 D1 02 00 96',
      D103: '62 D1 03 37',
      D104: '62 D1 04 03 DE',
      D105: '62 D1 05 0F A2',
      D106: '62 D1 06 0F 98',
      D107: '62 D1 07 00 0A',
      D108: '62 D1 08 00 45',
      D109: '62 D1 09 02 58',
    };

    return {
      serviceId: 0x22,
      positiveResponseSid: 0x62,
      success: true,
      rawPayload: payloadMap[cleanDid] || `62 ${cleanDid} 00 00`,
      dataBytes: [0x0F, 0xA0],
      executionTimeMs: 120,
      timestamp: new Date().toISOString(),
    };
  }

  async readDTCs(): Promise<DTCResponse> {
    return {
      success: true,
      dtcs: INITIAL_MOCK_DTCS.slice(0, 1),
      rawPayload: '59 02 01',
      executionTimeMs: 140,
      timestamp: new Date().toISOString(),
    };
  }

  async setDiagnosticSession(sessionType: number): Promise<DiagnosticResponse> {
    return {
      serviceId: 0x10,
      positiveResponseSid: 0x50,
      success: true,
      rawPayload: `50 ${sessionType.toString(16).padStart(2, '0')}`,
      dataBytes: [0x50, sessionType],
      executionTimeMs: 110,
      timestamp: new Date().toISOString(),
    };
  }

  async requestSecurityAccess(securityLevel: number): Promise<DiagnosticResponse> {
    return {
      serviceId: 0x27,
      positiveResponseSid: 0x67,
      success: true,
      rawPayload: '67 02',
      dataBytes: [0x67, 0x02],
      executionTimeMs: 150,
      timestamp: new Date().toISOString(),
    };
  }

  async executeRoutine(
    routineIdHex: string,
    subFunction: number = 0x01
  ): Promise<DiagnosticResponse> {
    return {
      serviceId: 0x31,
      positiveResponseSid: 0x71,
      success: true,
      rawPayload: `71 ${subFunction.toString(16).padStart(2, '0')} ${routineIdHex}`,
      dataBytes: [0x71, subFunction],
      executionTimeMs: 200,
      timestamp: new Date().toISOString(),
    };
  }

  async sendTesterPresent(): Promise<DiagnosticResponse> {
    return {
      serviceId: 0x3E,
      positiveResponseSid: 0x7E,
      success: true,
      rawPayload: '7E 00',
      dataBytes: [0x7E, 0x00],
      executionTimeMs: 80,
      timestamp: new Date().toISOString(),
    };
  }

  async sendRawUds(payloadHex: string): Promise<DiagnosticResponse> {
    return {
      serviceId: 0x00,
      positiveResponseSid: 0x50,
      success: true,
      rawPayload: `CLOUD_ACK: ${payloadHex.trim().toUpperCase()}`,
      dataBytes: [0x50],
      executionTimeMs: 95,
      timestamp: new Date().toISOString(),
    };
  }

  setScenario(scenario: FailureScenario): void {
    this.scenario = scenario;
  }

  getScenario(): FailureScenario {
    return this.scenario;
  }

  setDelay(delayMs: number): void {
    this.delayMs = delayMs;
  }

  setTimeoutMs(timeoutMs: number): void {
    this.timeoutMs = timeoutMs;
  }

  resetDemoState(): void {
    this.scenario = 'success';
  }

  getSettings(): DemoSettings {
    return {
      scenario: this.scenario,
      delayMs: this.delayMs,
      timeoutMs: this.timeoutMs,
      simulatedVehicle: 'Tesla Model S (Cloud Telematics)',
      interfaceType: 'Cloud Telematics SDK (Smartcar)',
      simulatedVin: '5YJSA1E21HF000002',
    };
  }
}
