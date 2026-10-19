import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BatteryCharging, Zap, Thermometer, HeartPulse, Gauge } from 'lucide-react-native';
import { Theme } from '../theme';
import { useDiagnostic } from '../services/diagnostic/DiagnosticContext';

export const BatteryOverviewCard: React.FC = () => {
  const { batteryData, connectionState } = useDiagnostic();
  const isConnected = connectionState === 'connected';

  // Extract key values
  const socParam = batteryData.find((p) => p.id === 'BMS_SOC');
  const voltParam = batteryData.find((p) => p.id === 'BMS_PACK_VOLTAGE');
  const tempParam = batteryData.find((p) => p.id === 'BMS_BATT_TEMP');
  const sohParam = batteryData.find((p) => p.id === 'BMS_SOH');
  const capParam = batteryData.find((p) => p.id === 'BMS_REMAINING_CAPACITY');
  const currentParam = batteryData.find((p) => p.id === 'BMS_PACK_CURRENT');

  const socValue = typeof socParam?.decodedValue === 'number' ? socParam.decodedValue : 78.4;
  const sohValue = typeof sohParam?.decodedValue === 'number' ? sohParam.decodedValue : 94.8;
  const voltageValue = voltParam?.decodedValue ?? '382.4';
  const tempValue = tempParam?.decodedValue ?? '27.5';
  const capValue = capParam?.decodedValue ?? '71.2';
  const currentValue = currentParam?.decodedValue ?? '-14.2';

  const socColor =
    socValue > 50
      ? Theme.colors.success
      : socValue > 20
      ? Theme.colors.warning
      : Theme.colors.danger;

  return (
    <View style={styles.card}>
      {/* Gauge and Main SOC Display */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <BatteryCharging size={18} color={Theme.colors.primary} />
          <Text style={styles.cardTitle}>High-Voltage Battery Pack</Text>
        </View>
        <View style={styles.simBadge}>
          <Text style={styles.simBadgeText}>MOCK DID MODEL</Text>
        </View>
      </View>

      {/* Main SoC Visual Bar */}
      <View style={styles.socSection}>
        <View style={styles.socValueRow}>
          <View>
            <Text style={styles.socLabel}>STATE OF CHARGE</Text>
            <View style={styles.socNumberRow}>
              <Text style={[styles.socNumber, { color: isConnected ? socColor : Theme.colors.textMuted }]}>
                {isConnected ? `${socValue}` : '--'}
              </Text>
              <Text style={styles.socPercent}>%</Text>
            </View>
          </View>

          <View style={styles.sohBox}>
            <View style={styles.sohLabelRow}>
              <HeartPulse size={12} color={Theme.colors.success} />
              <Text style={styles.sohLabel}>STATE OF HEALTH</Text>
            </View>
            <Text style={styles.sohValue}>
              {isConnected ? `${sohValue}%` : '--'}
            </Text>
            <Text style={styles.sohSub}>Optimal Grade</Text>
          </View>
        </View>

        {/* Level Indicator Bar */}
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: isConnected ? `${Math.min(100, Math.max(0, socValue))}%` : '0%',
                backgroundColor: socColor,
              },
            ]}
          />
        </View>
        <View style={styles.barTicks}>
          <Text style={styles.tickText}>0%</Text>
          <Text style={styles.tickText}>25%</Text>
          <Text style={styles.tickText}>50%</Text>
          <Text style={styles.tickText}>75%</Text>
          <Text style={styles.tickText}>100%</Text>
        </View>
      </View>

      {/* 4-Box Telemetry Matrix */}
      <View style={styles.telemetryGrid}>
        <View style={styles.telemetryCard}>
          <View style={styles.telemetryHeader}>
            <Zap size={14} color={Theme.colors.primary} />
            <Text style={styles.telemetryLabel}>Pack Voltage</Text>
          </View>
          <Text style={styles.telemetryValue}>
            {isConnected ? `${voltageValue} V` : '--'}
          </Text>
          <Text style={styles.telemetrySub}>Nominal: 350-403V</Text>
        </View>

        <View style={styles.telemetryCard}>
          <View style={styles.telemetryHeader}>
            <Gauge size={14} color="#38BDF8" />
            <Text style={styles.telemetryLabel}>Current Draw</Text>
          </View>
          <Text style={styles.telemetryValue}>
            {isConnected ? `${currentValue} A` : '--'}
          </Text>
          <Text style={styles.telemetrySub}>Standby draw</Text>
        </View>

        <View style={styles.telemetryCard}>
          <View style={styles.telemetryHeader}>
            <Thermometer size={14} color={Theme.colors.warning} />
            <Text style={styles.telemetryLabel}>Battery Temp</Text>
          </View>
          <Text style={styles.telemetryValue}>
            {isConnected ? `${tempValue} °C` : '--'}
          </Text>
          <Text style={styles.telemetrySub}>Avg 16 NTC sensors</Text>
        </View>

        <View style={styles.telemetryCard}>
          <View style={styles.telemetryHeader}>
            <BatteryCharging size={14} color={Theme.colors.success} />
            <Text style={styles.telemetryLabel}>Usable Energy</Text>
          </View>
          <Text style={styles.telemetryValue}>
            {isConnected ? `${capValue} kWh` : '--'}
          </Text>
          <Text style={styles.telemetrySub}>75.0 kWh nominal</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.surfaceCard,    borderColor: Theme.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.card,
    padding: Theme.spacing.lg,
    marginHorizontal: Theme.spacing.lg,
    marginVertical: Theme.spacing.xs,
    ...Theme.shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
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
    fontSize: 9.5,
    fontWeight: '700',
  },
  socSection: {
    backgroundColor: Theme.colors.surfaceSubtle,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
    borderColor: Theme.colors.surfaceBorder,
    borderWidth: 1,
  },
  socValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.sm,
  },
  socLabel: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  socNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  socNumber: {
    fontSize: 38,
    fontWeight: '800',
    fontFamily: Theme.typography.fontMono,
    letterSpacing: -1,
  },
  socPercent: {
    color: Theme.colors.textSecondary,
    fontSize: 18,
    fontWeight: '700',
  },
  sohBox: {
    backgroundColor: Theme.colors.successMuted,
    borderColor: Theme.colors.successBorder,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'flex-end',
  },
  sohLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sohLabel: {
    color: Theme.colors.textSecondary,
    fontSize: 9.5,
    fontWeight: '700',
  },
  sohValue: {
    color: Theme.colors.success,
    fontSize: 18,
    fontWeight: '800',
    fontFamily: Theme.typography.fontMono,
    marginTop: 2,
  },
  sohSub: {
    color: Theme.colors.textMuted,
    fontSize: 9.5,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.full,
    overflow: 'hidden',
    borderColor: Theme.colors.surfaceBorder,
    borderWidth: 1,
    marginTop: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Theme.borderRadius.full,
  },
  barTicks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  tickText: {
    color: Theme.colors.textMuted,
    fontSize: 9.5,
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  telemetryCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Theme.colors.surfaceSubtle,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
  },
  telemetryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  telemetryLabel: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  telemetryValue: {
    color: Theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Theme.typography.fontMono,
  },
  telemetrySub: {
    color: Theme.colors.textMuted,
    fontSize: 9.5,
    marginTop: 2,
  },
});;
