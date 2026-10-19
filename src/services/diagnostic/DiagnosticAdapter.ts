import {
  ConnectionResult,
  DiagnosticResponse,
  DTCResponse,
  FailureScenario,
  DemoSettings,
} from './DiagnosticTypes';

/**
 * DiagnosticAdapter is the hardware abstraction layer (HAL) interface.
 * Decouples the UI and application layer from actual vehicle bus communication.
 * A real hardware adapter (e.g. SocketCAN, Pass-Thru J2534, ELM327/OBDLink, or DoIP)
 * would implement this exact contract.
 */
export interface DiagnosticAdapter {
  /** Connect to the diagnostic interface / vehicle bus */
  connect(): Promise<ConnectionResult>;

  /** Disconnect from the diagnostic interface */
  disconnect(): Promise<void>;

  /** Check if the adapter is currently connected */
  isConnected(): boolean;

  /**
   * UDS Service 0x22: ReadDataByIdentifier
   * @param didHex Hex identifier string (e.g. "D100")
   */
  readDataByIdentifier(didHex: string): Promise<DiagnosticResponse>;

  /**
   * UDS Service 0x19: ReadDTCInformation
   * Reads diagnostic trouble codes currently reported by the BMS ECU.
   */
  readDTCs(): Promise<DTCResponse>;

  /**
   * UDS Service 0x10: DiagnosticSessionControl
   * @param sessionType 0x01 (Default), 0x02 (Programming), 0x03 (Extended)
   */
  setDiagnosticSession(sessionType: number): Promise<DiagnosticResponse>;

  /**
   * UDS Service 0x27: SecurityAccess
   * Simulates Seed & Key challenge-response exchange.
   * @param securityLevel 0x01 (Request Seed), 0x02 (Send Key)
   */
  requestSecurityAccess(securityLevel: number): Promise<DiagnosticResponse>;

  /**
   * UDS Service 0x31: RoutineControl
   * @param routineIdHex Hex string for routine identifier (e.g. "0215")
   * @param subFunction 0x01 (Start), 0x02 (Stop), 0x03 (RequestResults)
   * @param optionData Hex string of additional option bytes
   */
  executeRoutine(
    routineIdHex: string,
    subFunction?: number,
    optionData?: string
  ): Promise<DiagnosticResponse>;

  /**
   * UDS Service 0x3E: TesterPresent
   * Keeps active diagnostic sessions from timing out.
   */
  sendTesterPresent(): Promise<DiagnosticResponse>;

  /**
   * Raw UDS dispatch for trace experiments and learning
   * @param payloadHex Hex string (e.g. "10 03" or "22 D1 00")
   */
  sendRawUds(payloadHex: string): Promise<DiagnosticResponse>;

  /** Set testing scenario for developer fault injection */
  setScenario(scenario: FailureScenario): void;
  getScenario(): FailureScenario;

  /** Update simulation delay in milliseconds */
  setDelay(delayMs: number): void;

  /** Update request timeout in milliseconds */
  setTimeoutMs(timeoutMs: number): void;

  /** Get current demo configuration */
  getSettings(): DemoSettings;
}
