import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Terminal,
  Cpu,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react-native';
import { Theme } from '../theme';
import { useDiagnostic } from '../services/diagnostic/DiagnosticContext';

interface CommandStep {
  step: number;
  title: string;
  txCommand: string;
  expectedRx: string;
  description: string;
  service: string;
}

const BMS_RESET_COMMAND_STEPS: CommandStep[] = [
  {
    step: 1,
    title: 'Interrogate Active Tesla Alert Codes',
    txCommand: '19 02 FF',
    expectedRx: '59 02 FF [BMS_w107, BMS_u029]',
    description: 'Reads active alert memory by status mask 0xFF to log latch state.',
    service: 'UDS 0x19 0x02',
  },
  {
    step: 2,
    title: 'Switch to Extended Diagnostic Session',
    txCommand: '10 03',
    expectedRx: '50 03 00 32 01 F4',
    description: 'Elevates BMS gateway session to permit privileged routines.',
    service: 'UDS 0x10 0x03',
  },
  {
    step: 3,
    title: 'Security Access Challenge & Unlock',
    txCommand: '27 01 -> 27 02 <Key>',
    expectedRx: '67 01 <Seed> -> 67 02',
    description: 'Performs cryptographic challenge-response to authorize reset.',
    service: 'UDS 0x27',
  },
  {
    step: 4,
    title: 'Clear Stored Fault Records',
    txCommand: '14 FF FF FF',
    expectedRx: '54',
    description: 'Clears all latching diagnostic trouble codes across all groups.',
    service: 'UDS 0x14',
  },
  {
    step: 5,
    title: 'Execute BMS Contactor & Isolation Routine',
    txCommand: '31 01 02 15 00',
    expectedRx: '71 01 02 15 00',
    description: 'Triggers internal routine RID 0x0215 to cycle HV pre-charge & contactors.',
    service: 'UDS 0x31 0x01',
  },
  {
    step: 6,
    title: 'Post-Reset Alert Verification',
    txCommand: '19 02 FF',
    expectedRx: '59 02 FF (0 Alerts)',
    description: 'Confirms BMS_w107 and BMS_u029 are cleared and vehicle can drive.',
    service: 'UDS 0x19 0x02',
  },
];

export const TeslaBmsResetCard: React.FC = () => {
  const {
    connectionState,
    connect,
    resetState,
    dtcs,
    startBmsReset,
    cancelBmsReset,
    resetDemoState,
  } = useDiagnostic();

  const [requestCanId, setRequestCanId] = useState('0x7E4');
  const [responseCanId, setResponseCanId] = useState('0x7EC');
  const [activeTab, setActiveTab] = useState<'flow' | 'terminal'>('flow');

  const isRunning = resetState.stepStatus === 'running';
  const isCompleted = resetState.stepStatus === 'completed';
  const isFailed = resetState.stepStatus === 'failed';
  const isConnected = connectionState === 'connected';

  const handleExecute = async () => {
    if (!isConnected) {
      await connect();
    }
    startBmsReset();
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <RotateCcw size={18} color={Theme.colors.primary} />
          <View>
            <Text style={styles.featureTag}>MENU: OBD2 FEATURES</Text>
            <Text style={styles.headerTitle}>Tesla BMS Alert & Contactor Reset</Text>
          </View>
        </View>
        <View style={styles.protocolBadge}>
          <Text style={styles.protocolBadgeText}>ISO 14229 / CAN</Text>
        </View>
      </View>

      {/* Target Tesla Alert Codes Overview */}
      <View style={styles.alertsContainer}>
        <Text style={styles.sectionHeading}>TARGETED TESLA BMS ALERT CODES</Text>

        <View style={styles.alertCardsRow}>
          {/* BMS_w107 Alert */}
          <View style={[styles.alertCard, isCompleted && styles.alertCardResolved]}>
            <View style={styles.alertTop}>
              <Text style={styles.alertCode}>BMS_w107</Text>
              <View
                style={[
                  styles.alertBadge,
                  isCompleted ? styles.alertBadgeResolved : styles.alertBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.alertBadgeText,
                    isCompleted ? styles.alertBadgeTextResolved : styles.alertBadgeTextActive,
                  ]}
                >
                  {isCompleted ? 'RESOLVED' : 'ACTIVE FAULT'}
                </Text>
              </View>
            </View>
            <Text style={styles.alertTitle}>Isolation Resistance Degraded</Text>
            <Text style={styles.alertDesc}>
              {isCompleted
                ? 'Isolation restored to >1000 kΩ. High-voltage interlock closed.'
                : 'Isolation measured <500 kΩ. Contactors inhibited from closing.'}
            </Text>
          </View>

          {/* BMS_u029 Alert */}
          <View style={[styles.alertCard, isCompleted && styles.alertCardResolved]}>
            <View style={styles.alertTop}>
              <Text style={styles.alertCode}>BMS_u029</Text>
              <View
                style={[
                  styles.alertBadge,
                  isCompleted ? styles.alertBadgeResolved : styles.alertBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.alertBadgeText,
                    isCompleted ? styles.alertBadgeTextResolved : styles.alertBadgeTextActive,
                  ]}
                >
                  {isCompleted ? 'RESOLVED' : 'ACTIVE FAULT'}
                </Text>
              </View>
            </View>
            <Text style={styles.alertTitle}>Contactor Open Request</Text>
            <Text style={styles.alertDesc}>
              {isCompleted
                ? 'Pre-charge cycle complete. High-voltage contactors closed.'
                : 'Contactor open requested due to pack voltage mismatch latch.'}
            </Text>
          </View>
        </View>
      </View>

      {/* CAN ID & Protocol Configuration */}
      <View style={styles.canConfigBox}>
        <View style={styles.canHeaderRow}>
          <Cpu size={14} color={Theme.colors.primary} />
          <Text style={styles.canHeaderTitle}>CAN ID & Bus Configuration</Text>
        </View>

        <View style={styles.canInputsRow}>
          <View style={styles.canInputWrap}>
            <Text style={styles.inputLabel}>REQUEST CAN ID</Text>
            <TextInput
              style={styles.canInput}
              value={requestCanId}
              onChangeText={setRequestCanId}
              placeholder="0x7E4"
              placeholderTextColor={Theme.colors.textMuted}
            />
          </View>

          <View style={styles.canInputWrap}>
            <Text style={styles.inputLabel}>RESPONSE CAN ID</Text>
            <TextInput
              style={styles.canInput}
              value={responseCanId}
              onChangeText={setResponseCanId}
              placeholder="0x7EC"
              placeholderTextColor={Theme.colors.textMuted}
            />
          </View>

          <View style={styles.canInputWrap}>
            <Text style={styles.inputLabel}>BAUD RATE</Text>
            <View style={styles.canStaticPill}>
              <Text style={styles.canStaticText}>500 kbps</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tab Selector: Commands & Expected Response Flow vs Live CAN Log */}
      <View style={styles.subTabRow}>
        <TouchableOpacity
          style={[styles.subTabBtn, activeTab === 'flow' && styles.subTabBtnActive]}
          onPress={() => setActiveTab('flow')}
          activeOpacity={0.7}
        >
          <Text style={[styles.subTabText, activeTab === 'flow' && styles.subTabTextActive]}>
            Command & Expected Response Flow
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabBtn, activeTab === 'terminal' && styles.subTabBtnActive]}
          onPress={() => setActiveTab('terminal')}
          activeOpacity={0.7}
        >
          <Text style={[styles.subTabText, activeTab === 'terminal' && styles.subTabTextActive]}>
            Live Execution Trace ({resetState.stepLogs.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'flow' ? (
        <View style={styles.stepsList}>
          {BMS_RESET_COMMAND_STEPS.map((s) => {
            const isCurrent = resetState.currentStep === s.step && isRunning;
            const isDone =
              resetState.currentStep > s.step || (isCompleted && s.step <= 6);
            const isStepFailed = resetState.currentStep === s.step && isFailed;

            return (
              <View key={s.step} style={styles.stepItem}>
                <View style={styles.stepHeaderRow}>
                  <View
                    style={[
                      styles.stepBadge,
                      isDone && styles.stepBadgeDone,
                      isCurrent && styles.stepBadgeCurrent,
                      isStepFailed && styles.stepBadgeFailed,
                    ]}
                  >
                    {isCurrent ? (
                      <ActivityIndicator size={12} color="#FFFFFF" />
                    ) : isDone ? (
                      <CheckCircle2 size={12} color="#FFFFFF" />
                    ) : (
                      <Text style={styles.stepBadgeText}>{s.step}</Text>
                    )}
                  </View>

                  <Text style={styles.stepTitleText}>{s.title}</Text>
                  <Text style={styles.serviceText}>{s.service}</Text>
                </View>

                {/* Commands & Expected Responses Payload Box */}
                <View style={styles.commandRow}>
                  <View style={styles.payloadBox}>
                    <Text style={styles.payloadLabel}>TX COMMAND:</Text>
                    <Text style={styles.payloadTxHex}>{s.txCommand}</Text>
                  </View>

                  <View style={styles.payloadBox}>
                    <Text style={styles.payloadLabel}>EXPECTED RX:</Text>
                    <Text style={styles.payloadRxHex}>{s.expectedRx}</Text>
                  </View>
                </View>

                <Text style={styles.stepDescText}>{s.description}</Text>
              </View>
            );
          })}
        </View>
      ) : (
        <ScrollView style={styles.liveLogSection} nestedScrollEnabled>
          {resetState.stepLogs.length === 0 ? (
            <Text style={styles.emptyLogText}>
              Press "Execute Tesla BMS Reset Routine" below to start the CAN command sequence.
            </Text>
          ) : (
            resetState.stepLogs.map((log, idx) => (
              <View key={idx} style={styles.logRow}>
                <Text style={styles.logTime}>{log.timestamp}</Text>
                <Text
                  style={[
                    styles.logMsg,
                    log.type === 'success' && { color: Theme.colors.success },
                    log.type === 'error' && { color: Theme.colors.danger },
                  ]}
                >
                  {log.message}
                </Text>
                {log.rawHex && <Text style={styles.logHex}>[{log.rawHex}]</Text>}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Result Status Banner */}
      {isCompleted && (
        <View style={styles.resultBannerSuccess}>
          <CheckCircle2 size={18} color={Theme.colors.success} />
          <View style={styles.resultTextWrap}>
            <Text style={styles.resultTitleSuccess}>BMS Reset Completed Successfully</Text>
            <Text style={styles.resultSubSuccess}>
              Alert codes BMS_w107 and BMS_u029 cleared from ECU memory. HV contactors enabled.
            </Text>
          </View>
        </View>
      )}

      {isFailed && (
        <View style={styles.resultBannerFailed}>
          <AlertTriangle size={18} color={Theme.colors.danger} />
          <View style={styles.resultTextWrap}>
            <Text style={styles.resultTitleFailed}>BMS Reset Routine Failed</Text>
            <Text style={styles.resultSubFailed}>
              {resetState.errorDetails || 'ECU rejected reset routine.'}
            </Text>
          </View>
        </View>
      )}

      {/* Action Controls */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[
            styles.executeButton,
            isRunning && styles.executeButtonRunning,
          ]}
          onPress={handleExecute}
          disabled={isRunning}
          activeOpacity={0.8}
        >
          {isRunning ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <RotateCcw size={16} color="#FFFFFF" />
              <Text style={styles.executeButtonText}>
                {isCompleted ? 'Re-run Tesla BMS Reset Routine' : 'Execute Tesla BMS Reset Routine'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {isCompleted && (
          <TouchableOpacity
            style={styles.restoreBtn}
            onPress={resetDemoState}
            activeOpacity={0.7}
          >
            <Text style={styles.restoreBtnText}>Reset Faults to Test Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.card,
    padding: Theme.spacing.lg,
    marginHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    ...Theme.shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  featureTag: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.electricBlue,
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  protocolBadge: {
    backgroundColor: Theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  protocolBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  alertsContainer: {
    marginBottom: Theme.spacing.md,
  },
  sectionHeading: {
    fontSize: 10.5,
    fontWeight: '800',
    color: Theme.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  alertCardsRow: {
    gap: 8,
  },
  alertCard: {
    backgroundColor: Theme.colors.warningMuted,
    borderRadius: Theme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Theme.colors.warningBorder,
  },
  alertCardResolved: {
    backgroundColor: Theme.colors.successMuted,
    borderColor: Theme.colors.successBorder,
  },
  alertTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertCode: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontMono,
  },
  alertBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.borderRadius.full,
  },
  alertBadgeActive: {
    backgroundColor: Theme.colors.warning,
  },
  alertBadgeResolved: {
    backgroundColor: Theme.colors.success,
  },
  alertBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  alertBadgeTextActive: {
    color: '#FFFFFF',
  },
  alertBadgeTextResolved: {
    color: '#FFFFFF',
  },
  alertTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  alertDesc: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  canConfigBox: {
    backgroundColor: Theme.colors.surfaceSubtle,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    marginBottom: Theme.spacing.md,
  },
  canHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  canHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  canInputsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  canInputWrap: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    marginBottom: 4,
  },
  canInput: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    borderRadius: Theme.borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontMono,
  },
  canStaticPill: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    borderRadius: Theme.borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  canStaticText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  subTabRow: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surfaceSubtle,
    borderRadius: Theme.borderRadius.full,
    padding: 3,
    marginBottom: Theme.spacing.md,
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: Theme.borderRadius.full,
  },
  subTabBtnActive: {
    backgroundColor: Theme.colors.surface,
    ...Theme.shadows.subtle,
  },
  subTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textMuted,
  },
  subTabTextActive: {
    color: Theme.colors.textPrimary,
    fontWeight: '700',
  },
  stepsList: {
    gap: 8,
    marginBottom: Theme.spacing.md,
  },
  stepItem: {
    backgroundColor: Theme.colors.surfaceSubtle,
    borderRadius: Theme.borderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  stepBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeDone: {
    backgroundColor: Theme.colors.success,
    borderColor: Theme.colors.success,
  },
  stepBadgeCurrent: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  stepBadgeFailed: {
    backgroundColor: Theme.colors.danger,
    borderColor: Theme.colors.danger,
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.textSecondary,
  },
  stepTitleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    flex: 1,
  },
  serviceText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: Theme.colors.electricBlue,
    fontFamily: Theme.typography.fontMono,
  },
  commandRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 4,
  },
  payloadBox: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
  },
  payloadLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: Theme.colors.textMuted,
  },
  payloadTxHex: {
    fontSize: 10.5,
    fontFamily: Theme.typography.fontMono,
    fontWeight: '700',
    color: Theme.colors.electricBlue,
    marginTop: 2,
  },
  payloadRxHex: {
    fontSize: 10.5,
    fontFamily: Theme.typography.fontMono,
    fontWeight: '700',
    color: Theme.colors.rxColor,
    marginTop: 2,
  },
  stepDescText: {
    fontSize: 10.5,
    color: Theme.colors.textSecondary,
    lineHeight: 14,
    marginTop: 2,
  },
  liveLogSection: {
    maxHeight: 220,
    backgroundColor: Theme.colors.surfaceSubtle,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
  },
  emptyLogText: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 2,
  },
  logTime: {
    fontSize: 9,
    fontFamily: Theme.typography.fontMono,
    color: Theme.colors.textMuted,
  },
  logMsg: {
    fontSize: 10.5,
    color: Theme.colors.textPrimary,
    flex: 1,
  },
  logHex: {
    fontSize: 9.5,
    fontFamily: Theme.typography.fontMono,
    color: Theme.colors.electricBlue,
  },
  resultBannerSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Theme.colors.successMuted,
    borderWidth: 1,
    borderColor: Theme.colors.successBorder,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  resultTextWrap: {
    flex: 1,
  },
  resultTitleSuccess: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.colors.success,
  },
  resultSubSuccess: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  resultBannerFailed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Theme.colors.dangerMuted,
    borderWidth: 1,
    borderColor: Theme.colors.dangerBorder,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  resultTitleFailed: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.colors.danger,
  },
  resultSubFailed: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  actionsRow: {
    gap: 8,
  },
  executeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Theme.colors.primary,
    paddingVertical: 14,
    borderRadius: Theme.borderRadius.full,
    ...Theme.shadows.subtle,
  },
  executeButtonRunning: {
    opacity: 0.7,
  },
  executeButtonText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  restoreBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
});
