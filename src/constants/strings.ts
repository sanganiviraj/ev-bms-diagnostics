export const Strings = {
  app: {
    name: 'Digital EV Doctor',
    tagline: 'Tesla BMS Alert & Contactor Reset',
    menuSection: 'Menu - OBD2 Features',
    version: '1.0.0',
    isoCompliance: 'ISO 14229-1 (UDS) / ISO 15765-4 (CAN)',
  },
  tabs: {
    reset: 'BMS Reset',
    telemetry: 'Telemetry',
    canConsole: 'CAN Console',
  },
  alerts: {
    w107: {
      code: 'BMS_w107',
      name: 'Isolation Resistance Degraded',
      desc: 'HV isolation dropped below safety threshold (<500 kΩ). Contactors inhibited.',
    },
    u029: {
      code: 'BMS_u029',
      name: 'Contactor Open Request',
      desc: 'Contactor open requested due to pack voltage mismatch / pre-charge latch.',
    },
  },
  can: {
    requestCanId: '0x7E4',
    responseCanId: '0x7EC',
    broadcastCanId: '0x7DF',
    baudRate: '500 kbps',
    protocol: 'ISO 15765-4 High-Speed CAN',
  },
  commands: {
    step1: { tx: '19 02 FF', rx: '59 02 FF', name: 'Read Active Alert Codes' },
    step2: { tx: '10 03', rx: '50 03 00 32 01 F4', name: 'Extended Diagnostic Session' },
    step3: { tx: '27 01 -> 27 02', rx: '67 01 -> 67 02', name: 'Security Access Unlock' },
    step4: { tx: '14 FF FF FF', rx: '54', name: 'Clear Diagnostic Fault Memory' },
    step5: { tx: '31 01 02 15 00', rx: '71 01 02 15 00', name: 'Execute BMS Routine 0x0215' },
    step6: { tx: '19 02 FF', rx: '59 02 FF (0 Alerts)', name: 'Post-Reset Verification' },
  },
};
