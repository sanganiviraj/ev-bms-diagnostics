import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  Sliders,
  Bug,
  Clock,
  RotateCcw,
  Cpu,
  Layers,
  Bluetooth,
  Cloud,
  CheckCircle2,
} from 'lucide-react-native';
import { Theme } from '../../theme';
import { useDiagnostic, ConnectionMode } from '../../services/diagnostic/DiagnosticContext';
import { FailureScenario } from '../../services/diagnostic/DiagnosticTypes';
import { SimulatedBanner } from '../../components/SimulatedBanner';
import { QuickActionPills } from '../../components/QuickActionPills';
import { BluetoothScannerCard } from '../../components/BluetoothScannerCard';

const SCENARIOS: Array<{
  id: FailureScenario;
  title: string;
  desc: string;
  badgeColor: string;
}> = [
  {
    id: 'success',
    title: 'Nominal Success (Default)',
    desc: 'All UDS requests return affirmative ISO 14229 responses (0x50, 0x62, 0x67, 0x71).',
    badgeColor: Theme.colors.success,
  },
  {
    id: 'negative_response',
    title: 'Negative UDS Response (0x7F)',
    desc: 'Simulates ECU rejection with NRC 0x22 (ConditionsNotCorrect) or 0x33 (SecurityAccessDenied).',
    badgeColor: Theme.colors.danger,
  },
  {
    id: 'timeout',
    title: 'ECU Communication Timeout',
    desc: 'Simulates bus non-responsiveness / P2* timer expiration beyond configured timeout.',
    badgeColor: Theme.colors.warning,
  },
  {
    id: 'failed_verification',
    title: 'Routine Failed Verification',
    desc: 'Reset routine begins, but post-routine verification fails due to persistent DTCs.',
    badgeColor: '#EC4899',
  },
];

const DELAY_OPTIONS = [
  { label: 'Fast (100ms)', value: 100 },
  { label: 'Normal (400ms)', value: 400 },
  { label: 'Realistic (800ms)', value: 800 },
  { label: 'High Latency (1500ms)', value: 1500 },
];

const TIMEOUT_OPTIONS = [
  { label: '1000ms', value: 1000 },
  { label: '3000ms', value: 3000 },
  { label: '5000ms', value: 5000 },
];

export default function SettingsScreen() {
  const {
    settings,
    setScenario,
    updateSettings,
    resetDemoState,
    connectionMode,
    setConnectionMode,
    disconnect,
    connectionState,
  } = useDiagnostic();

  const isConnected = connectionState === 'connected';

  const modes: Array<{ id: ConnectionMode; label: string; desc: string; icon: any }> = [
    {
      id: 'simulation',
      label: 'Simulation Bench (ISO 14229 Loopback)',
      desc: 'Local in-memory UDS engine for offline UI testing and fault injection.',
      icon: Cpu,
    },
    {
      id: 'ble_obd',
      label: 'Bluetooth OBD-II Dongle (ELM327 / STN)',
      desc: 'Direct physical CAN bus link via OBDLink MX+, vLinker MC+, or ELM327 BLE dongle.',
      icon: Bluetooth,
    },
    {
      id: 'cloud_sdk',
      label: 'Cloud Telematics SDK (Smartcar / OEM API)',
      desc: 'OAuth 2.0 Connected Car Telematics gateway for Tesla, Volvo, BMW, and other EVs.',
      icon: Cloud,
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SimulatedBanner />

      <QuickActionPills activeTab="settings" />

      {/* Target Connection Mode Switcher */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Sliders size={18} color={Theme.colors.primary} />
          <Text style={styles.sectionTitle}>Automotive Connection Interface</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Select which hardware driver or telematics cloud SDK this mobile application connects to.
        </Text>

        <View style={styles.modeList}>
          {modes.map((m) => {
            const IconComp = m.icon;
            const isSelected = connectionMode === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.modeCard, isSelected && styles.modeCardActive]}
                onPress={() => {
                  if (isConnected) disconnect();
                  setConnectionMode(m.id);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.modeCardHeader}>
                  <View style={styles.modeCardLeft}>
                    <IconComp
                      size={18}
                      color={isSelected ? Theme.colors.primary : Theme.colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.modeCardTitle,
                        isSelected && styles.modeCardTitleActive,
                      ]}
                    >
                      {m.label}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={styles.activePill}>
                      <CheckCircle2 size={12} color="#FFFFFF" />
                      <Text style={styles.activePillText}>ACTIVE</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.modeCardDesc}>{m.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Physical Bluetooth OBD Scanner & Device Pairing */}
      <BluetoothScannerCard />

      {/* Developer Scenario Fault Injection */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Bug size={18} color={Theme.colors.warning} />
          <Text style={styles.sectionTitle}>ECU Response Scenarios & Testing</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Configure simulated ECU conditions to test how the diagnostic application handles various ISO 14229 NRC codes and timeouts.
        </Text>

        <View style={styles.scenarioList}>
          {SCENARIOS.map((sc) => {
            const isSelected = settings.scenario === sc.id;
            return (
              <TouchableOpacity
                key={sc.id}
                style={[
                  styles.scenarioCard,
                  isSelected && styles.scenarioCardActive,
                ]}
                onPress={() => setScenario(sc.id)}
                activeOpacity={0.7}
              >
                <View style={styles.scenarioTop}>
                  <View style={styles.scenarioRadioRow}>
                    <View
                      style={[
                        styles.radioOuter,
                        isSelected && { borderColor: sc.badgeColor },
                      ]}
                    >
                      {isSelected && (
                        <View
                          style={[
                            styles.radioInner,
                            { backgroundColor: sc.badgeColor },
                          ]}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.scenarioTitle,
                        isSelected && { color: Theme.colors.textPrimary },
                      ]}
                    >
                      {sc.title}
                    </Text>
                  </View>
                  {isSelected && (
                    <View
                      style={[
                        styles.activeBadge,
                        { backgroundColor: `${sc.badgeColor}20` },
                      ]}
                    >
                      <Text style={[styles.activeBadgeText, { color: sc.badgeColor }]}>
                        ENABLED
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.scenarioDesc}>{sc.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Latency & Timing Controls */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Clock size={18} color={Theme.colors.primary} />
          <Text style={styles.sectionTitle}>Bus Latency & Timeout Configuration</Text>
        </View>

        <Text style={styles.label}>Simulated ECU Roundtrip Delay:</Text>
        <View style={styles.chipRow}>
          {DELAY_OPTIONS.map((d) => (
            <TouchableOpacity
              key={d.value}
              style={[
                styles.chip,
                settings.delayMs === d.value && styles.chipActive,
              ]}
              onPress={() => updateSettings({ delayMs: d.value })}
            >
              <Text
                style={[
                  styles.chipText,
                  settings.delayMs === d.value && styles.chipTextActive,
                ]}
              >
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { marginTop: 14 }]}>Diagnostic Request Timeout:</Text>
        <View style={styles.chipRow}>
          {TIMEOUT_OPTIONS.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[
                styles.chip,
                settings.timeoutMs === t.value && styles.chipActive,
              ]}
              onPress={() => updateSettings({ timeoutMs: t.value })}
            >
              <Text
                style={[
                  styles.chipText,
                  settings.timeoutMs === t.value && styles.chipTextActive,
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Reset State Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.resetDemoBtn}
          onPress={resetDemoState}
          activeOpacity={0.8}
        >
          <RotateCcw size={16} color="#FFFFFF" />
          <Text style={styles.resetDemoBtnText}>Restore Default Nominal State</Text>
        </TouchableOpacity>
      </View>

      {/* App Information */}
      <View style={styles.footer}>
        <Text style={styles.appName}>Digital EV Doctor</Text>
        <Text style={styles.appVersion}>Version 1.0.0 • Mobile Production HAL</Text>
        <Text style={styles.appCopyright}>Unified Diagnostic Services (ISO 14229 / ISO 15765)</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    paddingBottom: 96,
  },
  section: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.card,
    padding: Theme.spacing.lg,
    marginHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.md,
    ...Theme.shadows.card,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: Theme.colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: Theme.spacing.md,
  },
  modeList: {
    gap: 8,
  },
  modeCard: {
    backgroundColor: Theme.colors.surfaceSubtle,
    borderRadius: Theme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
  },
  modeCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: Theme.colors.primary,
    borderWidth: 1.5,
  },
  modeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modeCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  modeCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    flex: 1,
  },
  modeCardTitleActive: {
    color: Theme.colors.primary,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.borderRadius.full,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modeCardDesc: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    lineHeight: 15,
    marginTop: 2,
  },
  scenarioList: {
    gap: 8,
  },
  scenarioCard: {
    backgroundColor: Theme.colors.surfaceSubtle,
    borderColor: Theme.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    padding: 12,
  },
  scenarioCardActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: '#FFFFFF',
  },
  scenarioTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  scenarioRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  radioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Theme.colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scenarioTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 12.5,
    fontWeight: '700',
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.full,
  },
  activeBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  scenarioDesc: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    marginLeft: 24,
  },
  label: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: Theme.colors.surfaceSubtle,
    borderColor: Theme.colors.surfaceBorder,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Theme.borderRadius.full,
  },
  chipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  chipText: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  resetDemoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Theme.colors.primary,
    paddingVertical: 14,
    borderRadius: Theme.borderRadius.full,
    ...Theme.shadows.subtle,
  },
  resetDemoBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
    gap: 2,
  },
  appName: {
    color: Theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  appVersion: {
    color: Theme.colors.textSecondary,
    fontSize: 11.5,
  },
  appCopyright: {
    color: Theme.colors.textMuted,
    fontSize: 10.5,
  },
});
