import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  bytesToHex,
  getInitialMockBatteryParameters,
  MOCK_PARAMETER_REGISTRY,
} from '../../data/mockBatteryData';
import { INITIAL_MOCK_DTCS } from '../../data/mockDTCs';
import {
  DiagnosticAdapter,
} from './DiagnosticAdapter';
import {
  BatteryParameter,
  BMSResetState,
  ConnectionState,
  DemoSettings,
  DiagnosticLogEntry,
  DiagnosticTroubleCode,
  FailureScenario,
  ResetWorkflowStep,
} from './DiagnosticTypes';
import { MockDiagnosticAdapter } from './MockDiagnosticAdapter';

import { BluetoothObdAdapter } from './BluetoothObdAdapter';
import { CloudVehicleAdapter } from './CloudVehicleAdapter';

export type ConnectionMode = 'simulation' | 'ble_obd' | 'cloud_sdk';

interface DiagnosticContextValue {
  adapter: DiagnosticAdapter;
  connectionState: ConnectionState;
  connectionMode: ConnectionMode;
  setConnectionMode: (mode: ConnectionMode) => void;
  isRealHardware: boolean;
  isDemoMode: boolean;
  batteryData: BatteryParameter[];
  isRefreshingBattery: boolean;
  dtcs: DiagnosticTroubleCode[];
  logs: DiagnosticLogEntry[];
  resetState: BMSResetState;
  settings: DemoSettings;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBatteryData: () => Promise<void>;
  startBmsReset: () => Promise<void>;
  cancelBmsReset: () => void;
  resetDemoState: () => void;
  clearLogs: () => void;
  setScenario: (scenario: FailureScenario) => void;
  updateSettings: (newSettings: Partial<DemoSettings>) => void;
  sendRawCommand: (payloadHex: string) => Promise<void>;
}

const DiagnosticContext = createContext<DiagnosticContextValue | null>(null);

const initialResetState: BMSResetState = {
  currentStep: 0,
  stepStatus: 'idle',
  securityAuthorized: false,
  sessionActive: false,
  resetRoutineExecuted: false,
  verificationPassed: null,
  errorDetails: null,
  stepLogs: [],
};

export const DiagnosticProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mockAdapter = useMemo(() => new MockDiagnosticAdapter(), []);
  const bleAdapter = useMemo(() => new BluetoothObdAdapter(), []);
  const cloudAdapter = useMemo(() => new CloudVehicleAdapter(), []);

  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('simulation');

  const adapter = useMemo(() => {
    if (connectionMode === 'ble_obd') return bleAdapter;
    if (connectionMode === 'cloud_sdk') return cloudAdapter;
    return mockAdapter;
  }, [connectionMode, mockAdapter, bleAdapter, cloudAdapter]);

  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [batteryData, setBatteryData] = useState<BatteryParameter[]>(() =>
    getInitialMockBatteryParameters()
  );
  const [isRefreshingBattery, setIsRefreshingBattery] = useState<boolean>(false);
  const [dtcs, setDtcs] = useState<DiagnosticTroubleCode[]>([...INITIAL_MOCK_DTCS]);
  const [logs, setLogs] = useState<DiagnosticLogEntry[]>([
    {
      id: 'log-init-1',
      timestamp: new Date().toLocaleTimeString(),
      direction: 'SYSTEM',
      service: 'HAL_INIT',
      rawHex: '--',
      summary: 'Diagnostic Link Engine initialized',
      details: 'Ready to connect via Bluetooth OBD-II, Cloud Telematics, or Simulation Bench.',
      status: 'INFO',
    },
  ]);
  const [resetState, setResetState] = useState<BMSResetState>(initialResetState);
  const [settings, setSettingsState] = useState<DemoSettings>(adapter.getSettings());

  const addLog = useCallback(
    (
      direction: 'TX' | 'RX' | 'SYSTEM',
      service: string,
      rawHex: string,
      summary: string,
      status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO' = 'INFO',
      details?: string
    ) => {
      const entry: DiagnosticLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toLocaleTimeString(),
        direction,
        service,
        rawHex,
        summary,
        status,
        details,
      };
      setLogs((prev) => [entry, ...prev.slice(0, 99)]);
    },
    []
  );

  const connect = useCallback(async () => {
    try {
      setConnectionState('connecting');
      const modeLabel =
        connectionMode === 'ble_obd'
          ? 'Bluetooth OBD-II / CAN bus physical adapter'
          : connectionMode === 'cloud_sdk'
            ? 'Cloud Vehicle Telematics SDK (Smartcar / OEM)'
            : 'Simulated Diagnostic Adapter';

      addLog('SYSTEM', 'LINK_INIT', 'PHY_INIT', `Connecting via ${modeLabel}...`, 'INFO');

      const result = await adapter.connect();
      setConnectionState('connected');
      addLog(
        'RX',
        'HAL_CONNECT',
        'LINK_ACTIVE',
        `Connected: ${result.vehicleName}`,
        'SUCCESS',
        result.message
      );
    } catch (err: any) {
      setConnectionState('error');
      addLog('SYSTEM', 'CONNECT_FAIL', '--', err.message || 'Connection failed', 'ERROR');
    }
  }, [adapter, connectionMode, addLog]);

  const disconnect = useCallback(async () => {
    try {
      await adapter.disconnect();
      setConnectionState('disconnected');
      addLog(
        'SYSTEM',
        'HAL_DISCONNECT',
        'LINK_DOWN',
        'Disconnected from simulated vehicle bus.',
        'WARNING'
      );
    } catch (err: any) {
      addLog('SYSTEM', 'DISCONNECT_ERR', '--', err.message, 'ERROR');
    }
  }, [adapter, addLog]);

  const refreshBatteryData = useCallback(async () => {
    if (!adapter.isConnected()) {
      addLog(
        'SYSTEM',
        'REFRESH_ERROR',
        '--',
        'Cannot refresh: Adapter disconnected. Connect demo first.',
        'WARNING'
      );
      return;
    }

    setIsRefreshingBattery(true);
    addLog(
      'TX',
      'UDS 0x22 (ReadDID)',
      '22 D1 00 ... D1 09',
      'Polling HV Battery telemetry DIDs...',
      'INFO'
    );

    try {
      const updatedParams: BatteryParameter[] = [];
      const paramKeys = Object.keys(MOCK_PARAMETER_REGISTRY);

      for (const key of paramKeys) {
        const def = MOCK_PARAMETER_REGISTRY[key];
        const res = await adapter.readDataByIdentifier(def.didHex);

        if (!res.success) {
          addLog(
            'RX',
            `0x22 DID 0x${def.didHex}`,
            res.rawPayload,
            res.errorMessage || 'Read DID Failed',
            'ERROR'
          );
          // Preserve previous or mark degraded
          updatedParams.push({
            id: def.id,
            name: def.name,
            didHex: `0x${def.didHex}`,
            rawHex: res.rawPayload,
            decodedValue: 'ERR',
            unit: def.unit,
            formula: def.formula,
            validity: 'INVALID',
            category: def.category,
            lastUpdated: new Date().toLocaleTimeString(),
            notes: res.errorMessage,
          });
        } else {
          // Extract data bytes without the 3-byte header [0x62, DID_HI, DID_LO]
          const payloadBytes = res.dataBytes.slice(3);
          const decoded = def.decode(payloadBytes.length > 0 ? payloadBytes : def.rawBytes);

          updatedParams.push({
            id: def.id,
            name: def.name,
            didHex: `0x${def.didHex}`,
            rawHex: bytesToHex(payloadBytes.length > 0 ? payloadBytes : def.rawBytes),
            decodedValue: decoded.value,
            unit: def.unit,
            formula: def.formula,
            validity: decoded.validity,
            category: def.category,
            lastUpdated: new Date().toLocaleTimeString(),
            notes: def.notes,
          });
        }
      }

      setBatteryData(updatedParams);
      addLog(
        'RX',
        'UDS 0x22 (Positive)',
        '62 D1 .. 10 DIDs OK',
        'High-Voltage battery telemetry successfully updated.',
        'SUCCESS'
      );
    } catch (err: any) {
      addLog('SYSTEM', 'REFRESH_EXCEPTION', '--', err.message || 'Telemetry read error', 'ERROR');
    } finally {
      setIsRefreshingBattery(false);
    }
  }, [adapter, addLog]);

  // BMS Reset workflow step machine
  const startBmsReset = useCallback(async () => {
    let cancelled = false;

    // Reset workflow state
    setResetState({
      currentStep: 1,
      stepStatus: 'running',
      securityAuthorized: false,
      sessionActive: false,
      resetRoutineExecuted: false,
      verificationPassed: null,
      errorDetails: null,
      stepLogs: [
        {
          timestamp: new Date().toLocaleTimeString(),
          step: 1,
          message: 'Initiating Step 1: Pre-flight connection validation...',
          type: 'info',
        },
      ],
    });

    const appendStepLog = (
      step: ResetWorkflowStep,
      message: string,
      type: 'info' | 'success' | 'warn' | 'error',
      rawHex?: string
    ) => {
      setResetState((prev) => ({
        ...prev,
        stepLogs: [
          ...prev.stepLogs,
          {
            timestamp: new Date().toLocaleTimeString(),
            step,
            message,
            type,
            rawHex,
          },
        ],
      }));
    };

    try {
      // Step 1: Check demo connection
      if (!adapter.isConnected()) {
        throw new Error('Pre-flight check failed: Simulated Diagnostic Adapter is not connected.');
      }
      appendStepLog(1, 'Demo connection verified (Protocol: ISO 14229-1 UDS).', 'success');
      addLog('SYSTEM', 'BMS_RESET', 'STEP_1', 'Pre-flight check: Adapter connected.', 'SUCCESS');

      // Step 2: Read simulated DTCs
      setResetState((prev) => ({ ...prev, currentStep: 2 }));
      appendStepLog(2, 'Step 2: Interrogating ECU for active Diagnostic Trouble Codes (UDS 0x19)...', 'info');
      addLog('TX', 'UDS 0x19 0x02', '19 02 FF', 'Querying BMS active faults by status mask...', 'INFO');

      const dtcRes = await adapter.readDTCs();
      setDtcs(dtcRes.dtcs);
      appendStepLog(
        2,
        `Retrieved ${dtcRes.dtcs.length} active DTC(s): ${dtcRes.dtcs.map((d) => d.code).join(', ') || 'None'}`,
        dtcRes.dtcs.length > 0 ? 'warn' : 'info',
        dtcRes.rawPayload
      );
      addLog('RX', 'UDS 0x59 0x02', dtcRes.rawPayload, `DTCs read: ${dtcRes.dtcs.length} found.`, 'INFO');

      // Step 3: Extended Diagnostic Session (0x10 0x03)
      setResetState((prev) => ({ ...prev, currentStep: 3 }));
      appendStepLog(3, 'Step 3: Requesting Extended Diagnostic Session (UDS 0x10 0x03)...', 'info');
      addLog('TX', 'UDS 0x10 0x03', '10 03', 'Entering extendedDiagnosticSession...', 'INFO');

      const sessionRes = await adapter.setDiagnosticSession(0x03);
      if (!sessionRes.success) {
        throw new Error(sessionRes.errorMessage || 'ECU rejected extended diagnostic session.');
      }
      setResetState((prev) => ({ ...prev, sessionActive: true }));
      appendStepLog(3, 'Extended Diagnostic Session active (Timing P2=50ms, P2*=5000ms).', 'success', sessionRes.rawPayload);
      addLog('RX', 'UDS 0x50 0x03', sessionRes.rawPayload, 'Diagnostic Session 0x03 opened.', 'SUCCESS');

      // Step 4: Security Authorization (0x27 0x01 / 0x02)
      setResetState((prev) => ({ ...prev, currentStep: 4 }));
      appendStepLog(4, 'Step 4: Initiating Cryptographic Security Access Handshake (UDS 0x27)...', 'info');
      addLog('TX', 'UDS 0x27 0x01', '27 01', 'Requesting Seed for Security Level 1...', 'INFO');

      const seedRes = await adapter.requestSecurityAccess(0x01);
      if (!seedRes.success) {
        throw new Error(seedRes.errorMessage || 'Security Access request denied.');
      }
      appendStepLog(4, `Seed challenge received from BMS ECU: ${seedRes.rawPayload}`, 'info');

      addLog('TX', 'UDS 0x27 0x02', '27 02 [COMPUTED_KEY]', 'Sending simulated authorization key...', 'INFO');
      const keyRes = await adapter.requestSecurityAccess(0x02);
      if (!keyRes.success) {
        throw new Error(keyRes.errorMessage || 'Invalid security authorization key.');
      }
      setResetState((prev) => ({ ...prev, securityAuthorized: true }));
      appendStepLog(4, 'Security Access Level 1 unlocked (Privileged routine control enabled).', 'success', keyRes.rawPayload);
      addLog('RX', 'UDS 0x67 0x02', keyRes.rawPayload, 'Security Access granted.', 'SUCCESS');

      // Step 5: Routine Control (0x31 0x01 0x02 0x15)
      setResetState((prev) => ({ ...prev, currentStep: 5 }));
      appendStepLog(5, 'Step 5: Executing BMS Diagnostic Reset Routine (UDS 0x31 0x01 RID: 0x0215)...', 'info');
      addLog('TX', 'UDS 0x31 0x01', '31 01 02 15 00', 'Starting BMS Diagnostic Reset Routine...', 'INFO');

      const routineRes = await adapter.executeRoutine('0215', 0x01);
      if (!routineRes.success) {
        throw new Error(routineRes.errorMessage || 'BMS Reset Routine execution failed.');
      }
      setResetState((prev) => ({ ...prev, resetRoutineExecuted: true }));
      appendStepLog(5, 'BMS Reset Routine executed successfully by ECU.', 'success', routineRes.rawPayload);
      addLog('RX', 'UDS 0x71 0x01', routineRes.rawPayload, 'Routine 0x0215 execution completed.', 'SUCCESS');

      // Step 6: Post-Reset Verification & Re-check Status
      setResetState((prev) => ({ ...prev, currentStep: 6 }));
      appendStepLog(6, 'Step 6: Verifying post-reset state and clearing residual fault codes...', 'info');
      addLog('TX', 'UDS 0x19 0x02', '19 02 FF', 'Verifying post-reset DTC status...', 'INFO');

      const verifyDtcRes = await adapter.readDTCs();
      setDtcs(verifyDtcRes.dtcs);

      if (verifyDtcRes.dtcs.length > 0) {
        setResetState((prev) => ({
          ...prev,
          stepStatus: 'failed',
          verificationPassed: false,
          errorDetails: `Verification Failed: ${verifyDtcRes.dtcs.length} DTC(s) still active after reset routine.`,
        }));
        appendStepLog(
          6,
          `Verification Failed: Found persistent DTCs (${verifyDtcRes.dtcs.map((d) => d.code).join(', ')}).`,
          'error'
        );
        addLog('SYSTEM', 'RESET_FAIL', 'VERIFY_FAIL', 'Post-reset verification failed.', 'ERROR');
      } else {
        setResetState((prev) => ({
          ...prev,
          stepStatus: 'completed',
          verificationPassed: true,
          errorDetails: null,
        }));
        appendStepLog(6, 'Verification Passed: All simulated fault flags cleared, BMS counters refreshed.', 'success');
        addLog('SYSTEM', 'RESET_SUCCESS', 'VERIFY_OK', 'Simulated BMS Reset workflow completed successfully.', 'SUCCESS');
      }
    } catch (err: any) {
      setResetState((prev) => ({
        ...prev,
        stepStatus: 'failed',
        verificationPassed: false,
        errorDetails: err.message || 'Workflow aborted due to diagnostic error',
      }));
      appendStepLog(
        6,
        `Workflow halted: ${err.message || 'Unknown diagnostic fault'}`,
        'error'
      );
      addLog('SYSTEM', 'RESET_HALTED', '--', err.message || 'Reset workflow error', 'ERROR');
    }
  }, [adapter, addLog]);

  const cancelBmsReset = useCallback(() => {
    setResetState((prev) => ({
      ...prev,
      stepStatus: 'cancelled',
      errorDetails: 'Reset workflow cancelled by technician.',
      stepLogs: [
        ...prev.stepLogs,
        {
          timestamp: new Date().toLocaleTimeString(),
          step: prev.currentStep,
          message: 'Workflow manually cancelled.',
          type: 'warn',
        },
      ],
    }));
    addLog('SYSTEM', 'BMS_RESET', 'CANCEL', 'BMS reset workflow cancelled by user.', 'WARNING');
  }, [addLog]);

  const resetDemoState = useCallback(() => {
    (adapter as any).resetDemoState?.();
    setResetState(initialResetState);
    setDtcs([...INITIAL_MOCK_DTCS]);
    setBatteryData(getInitialMockBatteryParameters());
    addLog(
      'SYSTEM',
      'DEMO_RESET',
      'STATE_RESET',
      'Simulated vehicle faults and battery telemetry restored to initial demo state.',
      'INFO'
    );
  }, [adapter, addLog]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const setScenario = useCallback(
    (scenario: FailureScenario) => {
      adapter.setScenario(scenario);
      setSettingsState(adapter.getSettings());
      addLog(
        'SYSTEM',
        'CONFIG_SCENARIO',
        scenario.toUpperCase(),
        `Developer scenario set to: ${scenario.toUpperCase()}`,
        'INFO'
      );
    },
    [adapter, addLog]
  );

  const updateSettings = useCallback(
    (newSettings: Partial<DemoSettings>) => {
      if (newSettings.scenario) adapter.setScenario(newSettings.scenario);
      if (newSettings.delayMs !== undefined) adapter.setDelay(newSettings.delayMs);
      if (newSettings.timeoutMs !== undefined) adapter.setTimeoutMs(newSettings.timeoutMs);
      setSettingsState(adapter.getSettings());
    },
    [adapter]
  );

  const sendRawCommand = useCallback(
    async (payloadHex: string) => {
      if (!adapter.isConnected()) {
        addLog('SYSTEM', 'TX_FAIL', '--', 'Adapter not connected', 'WARNING');
        return;
      }
      addLog('TX', 'UDS RAW', payloadHex, 'Transmitting custom UDS frame...', 'INFO');
      try {
        const res = await adapter.sendRawUds(payloadHex);
        addLog(
          res.success ? 'RX' : 'SYSTEM',
          `UDS 0x${res.serviceId.toString(16).toUpperCase()}`,
          res.rawPayload,
          res.success ? 'Positive Response received' : res.errorMessage || 'Negative response',
          res.success ? 'SUCCESS' : 'ERROR'
        );
      } catch (err: any) {
        addLog('SYSTEM', 'RAW_EXCEPTION', '--', err.message, 'ERROR');
      }
    },
    [adapter, addLog]
  );

  const value = useMemo(
    () => ({
      adapter,
      connectionState,
      connectionMode,
      setConnectionMode,
      isRealHardware: connectionMode !== 'simulation',
      isDemoMode: connectionMode === 'simulation',
      batteryData,
      isRefreshingBattery,
      dtcs,
      logs,
      resetState,
      settings,
      connect,
      disconnect,
      refreshBatteryData,
      startBmsReset,
      cancelBmsReset,
      resetDemoState,
      clearLogs,
      setScenario,
      updateSettings,
      sendRawCommand,
    }),
    [
      adapter,
      connectionState,
      connectionMode,
      batteryData,
      isRefreshingBattery,
      dtcs,
      logs,
      resetState,
      settings,
      connect,
      disconnect,
      refreshBatteryData,
      startBmsReset,
      cancelBmsReset,
      resetDemoState,
      clearLogs,
      setScenario,
      updateSettings,
      sendRawCommand,
    ]
  );

  return <DiagnosticContext.Provider value={value}>{children}</DiagnosticContext.Provider>;
};

export const useDiagnostic = () => {
  const context = useContext(DiagnosticContext);
  if (!context) {
    throw new Error('useDiagnostic must be used within a DiagnosticProvider');
  }
  return context;
};
