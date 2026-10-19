import { DiagnosticAdapter } from './DiagnosticAdapter';
import {
  ConnectionResult,
  DiagnosticResponse,
  DTCResponse,
  FailureScenario,
  DemoSettings,
  UdsServiceId,
  UdsNrc,
} from './DiagnosticTypes';
import { MOCK_PARAMETER_REGISTRY, bytesToHex } from '../../data/mockBatteryData';
import { INITIAL_MOCK_DTCS, POST_RESET_CLEARED_DTCS } from '../../data/mockDTCs';

export class MockDiagnosticAdapter implements DiagnosticAdapter {
  private connected: boolean = false;
  private scenario: FailureScenario = 'success';
  private delayMs: number = 400; // Simulated ECU roundtrip latency
  private timeoutMs: number = 3000;
  private dtcs = [...INITIAL_MOCK_DTCS];
  private isResetExecuted: boolean = false;
  private activeSession: number = 0x01; // Default session
  private securityUnlocked: boolean = false;

  private settings: DemoSettings = {
    scenario: 'success',
    delayMs: 400,
    timeoutMs: 3000,
    simulatedVehicle: 'Tesla — Demo Vehicle (Model 3/Y Mock Pack)',
    interfaceType: 'Simulated Diagnostic HAL (ISO 14229 / UDS Mock)',
    simulatedVin: '5YJ3E1EB7NF000DEMO',
  };

  constructor() {
    this.scenario = 'success';
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public async connect(): Promise<ConnectionResult> {
    await this.simulateDelay(600);
    this.connected = true;
    return {
      success: true,
      interfaceName: this.settings.interfaceType,
      vehicleName: this.settings.simulatedVehicle,
      protocol: 'ISO 14229-1 (UDS over Simulated ISO-TP)',
      timestamp: new Date().toLocaleTimeString(),
      isSimulated: true,
      message: 'Demo connection established to simulated vehicle bus.',
    };
  }

  public async disconnect(): Promise<void> {
    await this.simulateDelay(200);
    this.connected = false;
    this.activeSession = 0x01;
    this.securityUnlocked = false;
  }

  public async setDiagnosticSession(sessionType: number): Promise<DiagnosticResponse> {
    this.checkConnection();
    const startTime = Date.now();

    if (this.scenario === 'timeout') {
      await this.simulateTimeout();
      return this.createTimeoutResponse(UdsServiceId.DIAGNOSTIC_SESSION_CONTROL, startTime);
    }

    if (this.scenario === 'negative_response') {
      await this.simulateDelay(this.delayMs);
      return this.createNegativeResponse(
        UdsServiceId.DIAGNOSTIC_SESSION_CONTROL,
        UdsNrc.CONDITIONS_NOT_CORRECT,
        'ConditionsNotCorrect: Vehicle speed > 0 or Park interlock disengaged',
        startTime
      );
    }

    await this.simulateDelay(this.delayMs);
    this.activeSession = sessionType;

    const sessionHex = sessionType.toString(16).padStart(2, '0').toUpperCase();
    const payload = `50 ${sessionHex} 00 32 01 F4`;

    return {
      success: true,
      serviceId: UdsServiceId.DIAGNOSTIC_SESSION_CONTROL,
      positiveResponseSid: 0x50,
      rawPayload: payload,
      dataBytes: [0x50, sessionType, 0x00, 0x32, 0x01, 0xf4],
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  public async requestSecurityAccess(securityLevel: number): Promise<DiagnosticResponse> {
    this.checkConnection();
    const startTime = Date.now();

    if (this.scenario === 'timeout') {
      await this.simulateTimeout();
      return this.createTimeoutResponse(UdsServiceId.SECURITY_ACCESS, startTime);
    }

    if (this.scenario === 'negative_response') {
      await this.simulateDelay(this.delayMs);
      return this.createNegativeResponse(
        UdsServiceId.SECURITY_ACCESS,
        UdsNrc.SECURITY_ACCESS_DENIED,
        'SecurityAccessDenied: Challenge validation failed or invalid token tier',
        startTime
      );
    }

    await this.simulateDelay(this.delayMs);

    if (securityLevel === 0x01) {
      // Step A: Request Seed
      const payload = '67 01 4B 8A 1C 9F';
      return {
        success: true,
        serviceId: UdsServiceId.SECURITY_ACCESS,
        positiveResponseSid: 0x67,
        rawPayload: payload,
        dataBytes: [0x67, 0x01, 0x4b, 0x8a, 0x1c, 0x9f],
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toLocaleTimeString(),
      };
    } else {
      // Step B: Send Key
      this.securityUnlocked = true;
      const payload = '67 02';
      return {
        success: true,
        serviceId: UdsServiceId.SECURITY_ACCESS,
        positiveResponseSid: 0x67,
        rawPayload: payload,
        dataBytes: [0x67, 0x02],
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toLocaleTimeString(),
      };
    }
  }

  public async readDataByIdentifier(didHex: string): Promise<DiagnosticResponse> {
    this.checkConnection();
    const cleanDid = didHex.replace(/^0x/i, '').toUpperCase();
    const startTime = Date.now();

    if (this.scenario === 'timeout') {
      await this.simulateTimeout();
      return this.createTimeoutResponse(UdsServiceId.READ_DATA_BY_IDENTIFIER, startTime);
    }

    if (this.scenario === 'negative_response') {
      await this.simulateDelay(this.delayMs);
      return this.createNegativeResponse(
        UdsServiceId.READ_DATA_BY_IDENTIFIER,
        UdsNrc.REQUEST_OUT_OF_RANGE,
        `RequestOutOfRange: DID 0x${cleanDid} is not supported or restricted in session 0x${this.activeSession.toString(16)}`,
        startTime
      );
    }

    await this.simulateDelay(this.delayMs);

    // Look up in parameter registry
    const paramDef = Object.values(MOCK_PARAMETER_REGISTRY).find(
      (p) => p.didHex.toUpperCase() === cleanDid
    );

    if (!paramDef) {
      return this.createNegativeResponse(
        UdsServiceId.READ_DATA_BY_IDENTIFIER,
        UdsNrc.REQUEST_OUT_OF_RANGE,
        `DID 0x${cleanDid} not recognized in mock registry`,
        startTime
      );
    }

    // Slightly vary parameters to simulate live data stream
    const dataBytes = this.getSimulatedDataBytes(paramDef.id, paramDef.rawBytes);
    const didByte1 = parseInt(cleanDid.substring(0, 2), 16);
    const didByte2 = parseInt(cleanDid.substring(2, 4), 16);
    const fullBytes = [0x62, didByte1, didByte2, ...dataBytes];

    return {
      success: true,
      serviceId: UdsServiceId.READ_DATA_BY_IDENTIFIER,
      positiveResponseSid: 0x62,
      rawPayload: bytesToHex(fullBytes),
      dataBytes: fullBytes,
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  public async readDTCs(): Promise<DTCResponse> {
    this.checkConnection();
    const startTime = Date.now();

    if (this.scenario === 'timeout') {
      await this.simulateTimeout();
      throw new Error(`UDS Service 0x19 request timed out after ${this.timeoutMs} ms`);
    }

    if (this.scenario === 'negative_response') {
      await this.simulateDelay(this.delayMs);
      throw new Error(`UDS Negative Response (NRC 0x22): ConditionsNotCorrect`);
    }

    await this.simulateDelay(this.delayMs);

    const activeDtcs = this.isResetExecuted ? POST_RESET_CLEARED_DTCS : this.dtcs;
    const rawPayload = activeDtcs.length > 0
      ? `59 02 FF ${activeDtcs.map(() => '0A 0F 2F').join(' ')}`
      : '59 02 FF (NO_DTCS_PRESENT)';

    return {
      success: true,
      dtcs: activeDtcs,
      rawPayload,
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  public async executeRoutine(
    routineIdHex: string,
    subFunction: number = 0x01,
    _optionData?: string
  ): Promise<DiagnosticResponse> {
    this.checkConnection();
    const cleanRid = routineIdHex.replace(/^0x/i, '').toUpperCase();
    const startTime = Date.now();

    if (this.scenario === 'timeout') {
      await this.simulateTimeout();
      return this.createTimeoutResponse(UdsServiceId.ROUTINE_CONTROL, startTime);
    }

    if (this.scenario === 'negative_response') {
      await this.simulateDelay(this.delayMs);
      return this.createNegativeResponse(
        UdsServiceId.ROUTINE_CONTROL,
        UdsNrc.CONDITIONS_NOT_CORRECT,
        'ConditionsNotCorrect: High-voltage contactors cannot cycle under load',
        startTime
      );
    }

    if (!this.securityUnlocked) {
      await this.simulateDelay(this.delayMs);
      return this.createNegativeResponse(
        UdsServiceId.ROUTINE_CONTROL,
        UdsNrc.SECURITY_ACCESS_DENIED,
        'SecurityAccessDenied: Routine requires Security Level 1 authorization',
        startTime
      );
    }

    await this.simulateDelay(this.delayMs + 300); // routines take slightly longer

    if (this.scenario === 'failed_verification') {
      // In failed verification, routine reports failure code in output
      const rid1 = parseInt(cleanRid.substring(0, 2), 16);
      const rid2 = parseInt(cleanRid.substring(2, 4), 16);
      const payload = `71 ${subFunction.toString(16).padStart(2, '0')} ${cleanRid} 03 (ROUTINE_SELF_TEST_FAILED)`;
      return {
        success: false,
        serviceId: UdsServiceId.ROUTINE_CONTROL,
        positiveResponseSid: 0x71,
        rawPayload: payload,
        dataBytes: [0x71, subFunction, rid1, rid2, 0x03],
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toLocaleTimeString(),
        errorMessage: 'Routine completed with status code 0x03: Internal BMS Self-Test Precondition Failure',
      };
    }

    // Success path
    this.isResetExecuted = true;
    this.dtcs = []; // Cleared upon successful reset
    const rid1 = parseInt(cleanRid.substring(0, 2), 16);
    const rid2 = parseInt(cleanRid.substring(2, 4), 16);
    const payload = `71 ${subFunction.toString(16).padStart(2, '0')} ${cleanRid} 00 (ROUTINE_SUCCESS)`;

    return {
      success: true,
      serviceId: UdsServiceId.ROUTINE_CONTROL,
      positiveResponseSid: 0x71,
      rawPayload: payload,
      dataBytes: [0x71, subFunction, rid1, rid2, 0x00],
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  public async sendTesterPresent(): Promise<DiagnosticResponse> {
    this.checkConnection();
    const startTime = Date.now();
    await this.simulateDelay(50);
    return {
      success: true,
      serviceId: UdsServiceId.TESTER_PRESENT,
      positiveResponseSid: 0x7e,
      rawPayload: '7E 00',
      dataBytes: [0x7e, 0x00],
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  public async sendRawUds(payloadHex: string): Promise<DiagnosticResponse> {
    this.checkConnection();
    const startTime = Date.now();
    const bytes = payloadHex
      .trim()
      .split(/\s+/)
      .map((b) => parseInt(b, 16))
      .filter((n) => !isNaN(n));

    if (bytes.length === 0) {
      throw new Error('Payload cannot be empty');
    }

    const sid = bytes[0];
    await this.simulateDelay(this.delayMs);

    // If SID has a standard positive echo: sid + 0x40
    const posSid = sid + 0x40;
    const posHex = posSid.toString(16).padStart(2, '0').toUpperCase();
    const echoSub = bytes.length > 1 ? bytes[1].toString(16).padStart(2, '0').toUpperCase() : '';
    const rawPayload = `${posHex} ${echoSub} 00`.trim();

    return {
      success: true,
      serviceId: sid,
      positiveResponseSid: posSid,
      rawPayload,
      dataBytes: [posSid, bytes[1] || 0, 0],
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  public setScenario(scenario: FailureScenario): void {
    this.scenario = scenario;
    this.settings.scenario = scenario;
  }

  public getScenario(): FailureScenario {
    return this.scenario;
  }

  public setDelay(delayMs: number): void {
    this.delayMs = delayMs;
    this.settings.delayMs = delayMs;
  }

  public setTimeoutMs(timeoutMs: number): void {
    this.timeoutMs = timeoutMs;
    this.settings.timeoutMs = timeoutMs;
  }

  public getSettings(): DemoSettings {
    return { ...this.settings };
  }

  public resetDemoState(): void {
    this.isResetExecuted = false;
    this.dtcs = [...INITIAL_MOCK_DTCS];
    this.activeSession = 0x01;
    this.securityUnlocked = false;
  }

  private checkConnection(): void {
    if (!this.connected) {
      throw new Error('Diagnostic adapter disconnected. Please connect before dispatching UDS requests.');
    }
  }

  private async simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async simulateTimeout(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, Math.min(this.timeoutMs, 1500)));
  }

  private createTimeoutResponse(serviceId: number, startTime: number): DiagnosticResponse {
    return {
      success: false,
      serviceId,
      positiveResponseSid: 0,
      rawPayload: 'TIMEOUT',
      dataBytes: [],
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date().toLocaleTimeString(),
      errorMessage: `Request Timeout: ECU did not respond within ${this.timeoutMs}ms`,
    };
  }

  private createNegativeResponse(
    serviceId: number,
    nrc: UdsNrc,
    nrcDescription: string,
    startTime: number
  ): DiagnosticResponse {
    const sidHex = serviceId.toString(16).padStart(2, '0').toUpperCase();
    const nrcHex = nrc.toString(16).padStart(2, '0').toUpperCase();
    const rawPayload = `7F ${sidHex} ${nrcHex}`;

    return {
      success: false,
      serviceId,
      positiveResponseSid: 0,
      nrc,
      nrcDescription,
      rawPayload,
      dataBytes: [0x7f, serviceId, nrc],
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date().toLocaleTimeString(),
      errorMessage: `UDS Negative Response (NRC 0x${nrcHex}): ${nrcDescription}`,
    };
  }

  private getSimulatedDataBytes(paramId: string, baseBytes: number[]): number[] {
    // Add micro jitter to make live telemetry feel responsive and authentic
    const bytes = [...baseBytes];
    if (paramId === 'BMS_PACK_VOLTAGE' && bytes.length === 2) {
      // 382.4V +- 0.3V
      const jitter = Math.floor(Math.random() * 7) - 3;
      let val = (bytes[0] << 8) | bytes[1];
      val = Math.max(3700, Math.min(3900, val + jitter));
      bytes[0] = (val >> 8) & 0xff;
      bytes[1] = val & 0xff;
    } else if (paramId === 'BMS_PACK_CURRENT' && bytes.length === 2) {
      // -14.2A +- 0.5A
      const jitter = Math.floor(Math.random() * 9) - 4;
      let val = (bytes[0] << 8) | bytes[1];
      val += jitter;
      bytes[0] = (val >> 8) & 0xff;
      bytes[1] = val & 0xff;
    }
    return bytes;
  }
}
