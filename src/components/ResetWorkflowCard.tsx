import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Key,
  ShieldCheck,
  Terminal,
  AlertOctagon,
  HelpCircle,
} from 'lucide-react-native';
import { Theme } from '../theme';
import { useDiagnostic } from '../services/diagnostic/DiagnosticContext';

const WORKFLOW_STEPS = [
  {
    step: 1,
    title: 'Pre-flight Connection Check',
    desc: 'Verify active simulated ISO 14229 interface',
    service: 'ISO-TP / CAN Link',
  },
  {
    step: 2,
    title: 'Read Active Fault Codes',
    desc: 'Query DTCs to identify underlying BMS warnings',
    service: 'UDS 0x19 0x02',
  },
  {
    step: 3,
    title: 'Extended Diagnostic Session',
    desc: 'Transition ECU from default to session 0x03',
    service: 'UDS 0x10 0x03',
  },
  {
    step: 4,
    title: 'Cryptographic Security Access',
    desc: 'Simulate Seed & Key challenge-response',
    service: 'UDS 0x27 0x01/02',
  },
  {
    step: 5,
    title: 'Execute BMS Reset Routine',
    desc: 'Simulate approved ECU routine control (RID 0x0215)',
    service: 'UDS 0x31 0x01',
  },
  {
    step: 6,
    title: 'Post-Reset Verification',
    desc: 'Re-interrogate fault memory and contactor state',
    service: 'UDS 0x19 Verification',
  },
];

export const ResetWorkflowCard: React.FC = () => {
  const {
    connectionState,
    resetState,
    dtcs,
    startBmsReset,
    cancelBmsReset,
    resetDemoState,
    settings,
  } = useDiagnostic();

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const isRunning = resetState.stepStatus === 'running';
  const isConnected = connectionState === 'connected';

  const handleStartWorkflow = () => {
    setConfirmModalVisible(false);
    startBmsReset();
  };

  return (
    <View style={styles.card}>
      {/* Header and Status */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <RotateCcw size={18} color={Theme.colors.primary} />
          <Text style={styles.headerTitle}>BMS Diagnostic Reset Workflow</Text>
        </View>
        <View style={styles.simBadge}>
          <Text style={styles.simBadgeText}>WORKFLOW SIMULATION</Text>
        </View>
      </View>

      {/* Safety & Protocol Banner */}
      <View style={styles.noticeBox}>
        <AlertTriangle size={14} color={Theme.colors.warning} />
        <Text style={styles.noticeText}>
          Demonstration workflow only. Simulates ISO 14229 UDS sequences without transmitting
          commands to a real vehicle or High-Voltage ECU.
        </Text>
      </View>

      {/* ECU Session & Security Tiers */}
      <View style={styles.metaRow}>
        <View style={styles.metaBox}>
          <Text style={styles.metaLabel}>ECU SESSION</Text>
          <Text style={[styles.metaValue, resetState.sessionActive && { color: Theme.colors.success }]}>
            {resetState.sessionActive ? '0x03 Extended' : '0x01 Default'}
          </Text>
        </View>

        <View style={styles.metaBox}>
          <Text style={styles.metaLabel}>SECURITY ACCESS</Text>
          <View style={styles.inlineValue}>
            {resetState.securityAuthorized ? (
              <>
                <Unlock size={12} color={Theme.colors.success} />
                <Text style={[styles.metaValue, { color: Theme.colors.success }]}>Authorized</Text>
              </>
            ) : (
              <>
                <Lock size={12} color={Theme.colors.textMuted} />
                <Text style={styles.metaValue}>Locked (Level 0)</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.metaBox}>
          <Text style={styles.metaLabel}>ACTIVE FAULTS</Text>
          <Text
            style={[
              styles.metaValue,
              dtcs.length > 0 ? { color: Theme.colors.warning } : { color: Theme.colors.success },
            ]}
          >
            {dtcs.length} DTC(s)
          </Text>
        </View>
      </View>

      {/* Active Fault Codes Preview if any */}
      {dtcs.length > 0 && (
        <View style={styles.dtcSection}>
          <Text style={styles.dtcSectionTitle}>Reported Diagnostic Trouble Codes (Simulated):</Text>
          {dtcs.map((dtc) => (
            <View key={dtc.code} style={styles.dtcItem}>
              <View style={styles.dtcCodeWrap}>
                <Text style={styles.dtcCode}>{dtc.code}</Text>
                <Text style={styles.dtcSeverity}>{dtc.severity}</Text>
              </View>
              <Text style={styles.dtcDesc}>{dtc.description}</Text>
              <Text style={styles.dtcStatus}>Status Byte: {dtc.statusByte} ({dtc.statusText})</Text>
            </View>
          ))}
        </View>
      )}

      {/* 6-Step Workflow Progression */}
      <View style={styles.stepsContainer}>
        <Text style={styles.stepsTitle}>Diagnostic Procedure Steps:</Text>
        {WORKFLOW_STEPS.map((s) => {
          const isCurrent = resetState.currentStep === s.step && isRunning;
          const isDone =
            resetState.currentStep > s.step ||
            (resetState.currentStep === 6 && resetState.stepStatus === 'completed');
          const isFailed =
            resetState.currentStep === s.step && resetState.stepStatus === 'failed';

          return (
            <View key={s.step} style={styles.stepRow}>
              {/* Step indicator circle */}
              <View
                style={[
                  styles.stepIconCircle,
                  isDone && styles.stepIconDone,
                  isCurrent && styles.stepIconCurrent,
                  isFailed && styles.stepIconFailed,
                ]}
              >
                {isCurrent ? (
                  <ActivityIndicator size={12} color="#FFFFFF" />
                ) : isDone ? (
                  <CheckCircle2 size={14} color="#FFFFFF" />
                ) : isFailed ? (
                  <XCircle size={14} color="#FFFFFF" />
                ) : (
                  <Text style={styles.stepNumberText}>{s.step}</Text>
                )}
              </View>

              {/* Step information */}
              <View style={styles.stepInfo}>
                <View style={styles.stepTitleRow}>
                  <Text
                    style={[
                      styles.stepTitle,
                      isCurrent && { color: Theme.colors.primary },
                      isDone && { color: Theme.colors.textHighlight },
                      isFailed && { color: Theme.colors.danger },
                    ]}
                  >
                    Step {s.step}: {s.title}
                  </Text>
                  <Text style={styles.serviceTag}>{s.service}</Text>
                </View>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Final Verification Banner */}
      {resetState.stepStatus === 'completed' && (
        <View style={styles.resultBannerSuccess}>
          <ShieldCheck size={20} color={Theme.colors.success} />
          <View style={styles.resultTextWrap}>
            <Text style={styles.resultTitleSuccess}>Simulated Reset Completed</Text>
            <Text style={styles.resultSubSuccess}>
              All mock DTCs cleared. Simulated High-Voltage BMS self-check verification passed.
            </Text>
          </View>
        </View>
      )}

      {resetState.stepStatus === 'failed' && (
        <View style={styles.resultBannerFailed}>
          <AlertOctagon size={20} color={Theme.colors.danger} />
          <View style={styles.resultTextWrap}>
            <Text style={styles.resultTitleFailed}>Workflow Aborted / Failed</Text>
            <Text style={styles.resultSubFailed}>
              {resetState.errorDetails || 'Negative response or precondition violation.'}
            </Text>
          </View>
        </View>
      )}

      {/* Live Step Event Log Feed */}
      {resetState.stepLogs.length > 0 && (
        <View style={styles.liveLogSection}>
          <View style={styles.liveLogHeader}>
            <Terminal size={12} color={Theme.colors.primary} />
            <Text style={styles.liveLogTitle}>Workflow Trace Output:</Text>
          </View>
          <ScrollView style={styles.liveLogScroll} nestedScrollEnabled>
            {resetState.stepLogs.map((log, index) => (
              <View key={index} style={styles.logLine}>
                <Text style={styles.logTime}>{log.timestamp}</Text>
                <Text
                  style={[
                    styles.logMsg,
                    log.type === 'success' && { color: Theme.colors.success },
                    log.type === 'warn' && { color: Theme.colors.warning },
                    log.type === 'error' && { color: Theme.colors.danger },
                  ]}
                >
                  {log.message}
                </Text>
                {log.rawHex && <Text style={styles.logHex}>[{log.rawHex}]</Text>}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controlsRow}>
        {!isRunning ? (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.primaryButton,
              !isConnected && styles.disabledButton,
            ]}
            onPress={() => setConfirmModalVisible(true)}
            disabled={!isConnected}
            activeOpacity={0.8}
          >
            <RotateCcw size={15} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>
              {resetState.stepStatus === 'completed'
                ? 'Re-run Simulated Reset'
                : 'Start BMS Reset Workflow'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={cancelBmsReset}
            activeOpacity={0.8}
          >
            <XCircle size={15} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Cancel Workflow</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={resetDemoState}
          disabled={isRunning}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>Reset Demo State</Text>
        </TouchableOpacity>
      </View>

      {/* Confirmation Modal */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <AlertTriangle size={24} color={Theme.colors.warning} />
              <Text style={styles.modalTitle}>Confirm Simulated BMS Reset</Text>
            </View>

            <Text style={styles.modalBody}>
              You are about to initiate the simulated 6-step diagnostic reset workflow:
            </Text>

            <View style={styles.modalBulletList}>
              <Text style={styles.modalBullet}>• Tests UDS Session transition to 0x03</Text>
              <Text style={styles.modalBullet}>• Simulates Security Access 0x27 Seed-Key challenge</Text>
              <Text style={styles.modalBullet}>• Dispatches Routine Control 0x31 (RID: 0x0215)</Text>
              <Text style={styles.modalBullet}>• Verifies post-routine clearing of fault registers</Text>
            </View>

            <View style={styles.modalWarningBox}>
              <Text style={styles.modalWarningText}>
                NOTE: This will execute entirely inside the simulated adapter HAL without affecting
                any real hardware.
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleStartWorkflow}
              >
                <Text style={styles.modalConfirmText}>Proceed with Demo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.card,
    padding: Theme.spacing.lg,
    marginHorizontal: Theme.spacing.lg,
    marginVertical: Theme.spacing.xs,
    ...Theme.shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  simBadge: {
    backgroundColor: Theme.colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
  },
  simBadgeText: {
    color: Theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  noticeBox: {
    backgroundColor: Theme.colors.warningMuted,
    borderColor: Theme.colors.warningBorder,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Theme.spacing.md,
  },
  noticeText: {
    color: Theme.colors.warning,
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Theme.spacing.md,
  },
  metaBox: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceSubtle,
    padding: 10,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
  },
  metaLabel: {
    color: Theme.colors.textMuted,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: {
    color: Theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Theme.typography.fontMono,
  },
  inlineValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dtcSection: {
    backgroundColor: Theme.colors.surfaceSubtle,
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    marginBottom: Theme.spacing.md,
  },
  dtcSectionTitle: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  dtcItem: {
    backgroundColor: Theme.colors.surface,
    padding: 10,
    borderRadius: Theme.borderRadius.sm,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.warning,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
  },
  dtcCodeWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  dtcCode: {
    color: Theme.colors.warning,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Theme.typography.fontMono,
  },
  dtcSeverity: {
    color: Theme.colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
  },
  dtcDesc: {
    color: Theme.colors.textPrimary,
    fontSize: 11.5,
    lineHeight: 15,
  },
  dtcStatus: {
    color: Theme.colors.textSecondary,
    fontSize: 10,
    fontFamily: Theme.typography.fontMono,
    marginTop: 2,
  },
  stepsContainer: {
    backgroundColor: Theme.colors.surfaceSubtle,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    marginBottom: Theme.spacing.md,
  },
  stepsTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  stepIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepIconDone: {
    backgroundColor: Theme.colors.success,
    borderColor: Theme.colors.success,
  },
  stepIconCurrent: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  stepIconFailed: {
    backgroundColor: Theme.colors.danger,
    borderColor: Theme.colors.danger,
  },
  stepNumberText: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  stepInfo: {
    flex: 1,
  },
  stepTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  serviceTag: {
    color: Theme.colors.electricBlue,
    fontSize: 9,
    fontFamily: Theme.typography.fontMono,
    backgroundColor: Theme.colors.electricBlueMuted,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  stepDesc: {
    color: Theme.colors.textMuted,
    fontSize: 10.5,
    marginTop: 1,
  },
  resultBannerSuccess: {
    backgroundColor: Theme.colors.successMuted,
    borderColor: Theme.colors.successBorder,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Theme.spacing.md,
  },
  resultTextWrap: {
    flex: 1,
  },
  resultTitleSuccess: {
    color: Theme.colors.success,
    fontSize: 13,
    fontWeight: '700',
  },
  resultSubSuccess: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  resultBannerFailed: {
    backgroundColor: Theme.colors.dangerMuted,
    borderColor: Theme.colors.dangerBorder,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Theme.spacing.md,
  },
  resultTitleFailed: {
    color: Theme.colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  resultSubFailed: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  liveLogSection: {
    backgroundColor: Theme.colors.surfaceSubtle,
    borderColor: Theme.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  liveLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.surfaceBorder,
    paddingBottom: 4,
  },
  liveLogTitle: {
    color: Theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Theme.typography.fontMono,
  },
  liveLogScroll: {
    maxHeight: 120,
  },
  logLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginVertical: 2,
    flexWrap: 'wrap',
  },
  logTime: {
    color: Theme.colors.textMuted,
    fontSize: 9,
    fontFamily: Theme.typography.fontMono,
  },
  logMsg: {
    color: Theme.colors.textSecondary,
    fontSize: 10,
    fontFamily: Theme.typography.fontMono,
    flex: 1,
  },
  logHex: {
    color: Theme.colors.electricBlue,
    fontSize: 9,
    fontFamily: Theme.typography.fontMono,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: Theme.borderRadius.full,
    gap: 6,
    ...Theme.shadows.subtle,
  },
  primaryButton: {
    backgroundColor: Theme.colors.primary,
  },
  cancelButton: {
    backgroundColor: Theme.colors.danger,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceSubtle,
    borderColor: Theme.colors.surfaceBorder,
    borderWidth: 1,
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.card,
    padding: Theme.spacing.xl,
    width: '100%',
    maxWidth: 420,
    ...Theme.shadows.floating,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Theme.spacing.md,
  },
  modalTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  modalBody: {
    color: Theme.colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Theme.spacing.sm,
  },
  modalBulletList: {
    gap: 4,
    marginBottom: Theme.spacing.md,
  },
  modalBullet: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  modalWarningBox: {
    backgroundColor: Theme.colors.warningMuted,
    borderColor: Theme.colors.warningBorder,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.sm,
    padding: 8,
    marginBottom: Theme.spacing.lg,
  },
  modalWarningText: {
    color: Theme.colors.warning,
    fontSize: 11,
    lineHeight: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    alignItems: 'center',
  },
  modalCancelText: {
    color: Theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  modalConfirmBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
