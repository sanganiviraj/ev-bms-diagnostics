import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  Car,
  CheckCircle2,
  AlertCircle,
  Bluetooth,
  Cloud,
  Cpu,
  Power,
  ChevronRight,
} from 'lucide-react-native';
import { Theme } from '../theme';
import { useDiagnostic, ConnectionMode } from '../services/diagnostic/DiagnosticContext';

export const ConnectionCard: React.FC = () => {
  const {
    connectionState,
    connectionMode,
    setConnectionMode,
    connect,
    disconnect,
    isRealHardware,
  } = useDiagnostic();

  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';

  const modes: Array<{ id: ConnectionMode; label: string; icon: any }> = [
    { id: 'simulation', label: 'Simulation Bench', icon: Cpu },
    { id: 'ble_obd', label: 'BLE OBD-II Dongle', icon: Bluetooth },
    { id: 'cloud_sdk', label: 'Cloud Car SDK', icon: Cloud },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Car size={18} color={Theme.colors.primary} />
          <Text style={styles.title}>Vehicle Diagnostic Interface</Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            isConnected
              ? styles.statusConnected
              : isConnecting
              ? styles.statusConnecting
              : styles.statusDisconnected,
          ]}
        >
          {isConnected ? (
            <CheckCircle2 size={12} color={Theme.colors.success} />
          ) : isConnecting ? (
            <ActivityIndicator size={10} color={Theme.colors.electricBlue} />
          ) : (
            <AlertCircle size={12} color={Theme.colors.textMuted} />
          )}
          <Text
            style={[
              styles.statusText,
              isConnected && { color: Theme.colors.success },
              isConnecting && { color: Theme.colors.electricBlue },
            ]}
          >
            {isConnected
              ? isRealHardware
                ? 'Hardware Active'
                : 'Demo Connected'
              : isConnecting
              ? 'Negotiating...'
              : 'Disconnected'}
          </Text>
        </View>
      </View>

      {/* Mode Selector Pills */}
      <Text style={styles.selectorLabel}>SELECT CONNECTION PROTOCOL / SDK</Text>
      <View style={styles.pillRow}>
        {modes.map((m) => {
          const IconComp = m.icon;
          const isSelected = connectionMode === m.id;
          return (
            <TouchableOpacity
              key={m.id}
              style={[styles.modePill, isSelected && styles.modePillSelected]}
              onPress={() => {
                if (isConnected) disconnect();
                setConnectionMode(m.id);
              }}
              activeOpacity={0.7}
            >
              <IconComp
                size={13}
                color={isSelected ? '#FFFFFF' : Theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.modePillText,
                  isSelected && styles.modePillTextSelected,
                ]}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Hardware / SDK Details Box */}
      <View style={styles.infoBox}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Transport Channel:</Text>
          <Text style={styles.detailValue}>
            {connectionMode === 'ble_obd'
              ? 'Bluetooth Low Energy (ELM327 / STN2120)'
              : connectionMode === 'cloud_sdk'
              ? 'Smartcar / OEM Telematics Cloud API'
              : 'In-Memory ISO-TP Loopback'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>ECU Bus Protocol:</Text>
          <Text style={styles.detailValue}>
            {connectionMode === 'cloud_sdk'
              ? 'RESTful JSON / OAuth 2.0 Vehicle Telemetry'
              : 'ISO 14229-1 UDS on ISO 15765-4 (500 kbps CAN)'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Target ECU Subsystem:</Text>
          <Text style={styles.detailValue}>BMS Master Gateway (CAN ID: 0x7E4)</Text>
        </View>
      </View>

      {/* Main Connect / Disconnect Action Button */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          isConnected ? styles.actionButtonDisconnect : styles.actionButtonConnect,
        ]}
        onPress={isConnected ? disconnect : connect}
        disabled={isConnecting}
        activeOpacity={0.8}
      >
        {isConnecting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Power size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>
              {isConnected
                ? 'Disconnect Diagnostic Link'
                : connectionMode === 'ble_obd'
                ? 'Connect Real Car (BLE OBD-II)'
                : connectionMode === 'cloud_sdk'
                ? 'Connect Vehicle Cloud SDK'
                : 'Initialize Simulation Bench'}
            </Text>
          </>
        )}
      </TouchableOpacity>
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
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.borderRadius.full,
    gap: 4,
  },
  statusConnected: {
    backgroundColor: Theme.colors.successMuted,
  },
  statusConnecting: {
    backgroundColor: Theme.colors.electricBlueMuted,
  },
  statusDisconnected: {
    backgroundColor: Theme.colors.surfaceSubtle,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textMuted,
  },
  selectorLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Theme.spacing.md,
  },
  modePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
  },
  modePillSelected: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  modePillText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  modePillTextSelected: {
    color: '#FFFFFF',
  },
  infoBox: {
    backgroundColor: Theme.colors.surfaceSubtle,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    gap: 6,
    marginBottom: Theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11.5,
    color: Theme.colors.textMuted,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 11.5,
    color: Theme.colors.textPrimary,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Theme.borderRadius.full,
    gap: 8,
    ...Theme.shadows.subtle,
  },
  actionButtonConnect: {
    backgroundColor: Theme.colors.primary,
  },
  actionButtonDisconnect: {
    backgroundColor: Theme.colors.danger,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
