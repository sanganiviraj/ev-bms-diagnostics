import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BatteryCharging, Gauge, Fan, Plus, Minus, Zap } from 'lucide-react-native';
import { Theme } from '../theme';
import { useDiagnostic } from '../services/diagnostic/DiagnosticContext';
import { calculateEstimatedRange } from '../utils';

export const MinimalMetricCards: React.FC = () => {
  const { batteryData } = useDiagnostic();
  const [cabinTemp, setCabinTemp] = useState(21);

  const socParam = batteryData.find((p) => p.id === 'SOC');
  const voltParam = batteryData.find((p) => p.id === 'PACK_VOLTAGE');
  const tempParam = batteryData.find((p) => p.id === 'PACK_TEMP_AVG');

  const socVal = typeof socParam?.decodedValue === 'number' ? socParam.decodedValue : 80;
  const voltageVal = typeof voltParam?.decodedValue === 'number' ? voltParam.decodedValue : 400;
  const packTempVal = typeof tempParam?.decodedValue === 'number' ? tempParam.decodedValue : 25;

  const { total, electric } = calculateEstimatedRange(socVal, 540);

  return (
    <View style={styles.container}>
      {/* Top Range Hero Pill Card */}
      <View style={styles.rangeCard}>
        <View style={styles.rangeHeader}>
          <Text style={styles.rangeSub}>ESTIMATED VEHICLE RANGE</Text>
          <Text style={styles.rangeBig}>{total} <Text style={styles.rangeUnit}>km</Text></Text>
        </View>

        <View style={styles.rangeBarTrack}>
          <View style={[styles.rangeBarFill, { width: `${Math.min(100, Math.max(10, socVal))}%` }]} />
        </View>

        <View style={styles.rangeSplitRow}>
          <View style={styles.splitItem}>
            <Text style={styles.splitLabel}>Electric Range</Text>
            <Text style={styles.splitValue}>{electric} km</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.splitItem}>
            <Text style={styles.splitLabel}>Pack Voltage</Text>
            <Text style={styles.splitValue}>{voltageVal.toFixed(1)} V</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.splitItem}>
            <Text style={styles.splitLabel}>Module Temp</Text>
            <Text style={styles.splitValue}>{packTempVal}°C</Text>
          </View>
        </View>
      </View>

      {/* Two Column Luxury EV Card Grid */}
      <View style={styles.gridRow}>
        {/* Battery Telemetry Widget */}
        <View style={styles.gridCard}>
          <View style={styles.cardHeader}>
            <BatteryCharging size={18} color={Theme.colors.electricBlue} />
            <Text style={styles.cardTitle}>HV Battery</Text>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.batterySegments}>
              {[1, 2, 3, 4, 5].map((seg) => {
                const isFilled = (socVal / 100) * 5 >= seg - 0.5;
                return (
                  <View
                    key={seg}
                    style={[
                      styles.segmentBar,
                      isFilled && { backgroundColor: Theme.colors.success },
                    ]}
                  />
                );
              })}
            </View>
            <Text style={styles.batteryPercentText}>{Math.round(socVal)}%</Text>
          </View>

          <Text style={styles.widgetCaption}>DC Fast Charge Ready (180 kW)</Text>
        </View>

        {/* Cabin Climate Widget */}
        <View style={styles.gridCard}>
          <View style={styles.cardHeader}>
            <Fan size={18} color={Theme.colors.primary} />
            <Text style={styles.cardTitle}>Cabin Climate</Text>
          </View>

          <View style={styles.climateRow}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setCabinTemp((t) => Math.max(16, t - 1))}
              activeOpacity={0.7}
            >
              <Minus size={14} color={Theme.colors.textPrimary} />
            </TouchableOpacity>

            <Text style={styles.tempText}>{cabinTemp}°C</Text>

            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setCabinTemp((t) => Math.min(30, t + 1))}
              activeOpacity={0.7}
            >
              <Plus size={14} color={Theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.widgetCaption}>Preconditioning Idle</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.md,
  },
  rangeCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.card,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    ...Theme.shadows.card,
  },
  rangeHeader: {
    marginBottom: Theme.spacing.sm,
  },
  rangeSub: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    letterSpacing: 1,
  },
  rangeBig: {
    fontSize: 34,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  rangeUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  rangeBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.surfaceSubtle,
    overflow: 'hidden',
    marginVertical: Theme.spacing.md,
  },
  rangeBarFill: {
    height: '100%',
    backgroundColor: Theme.colors.electricBlue,
    borderRadius: 3,
  },
  rangeSplitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Theme.spacing.xs,
  },
  splitItem: {
    flex: 1,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: Theme.colors.surfaceBorder,
    marginHorizontal: 8,
  },
  splitLabel: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    fontWeight: '500',
  },
  splitValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    marginTop: Theme.spacing.md,
  },
  gridCard: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.card,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    ...Theme.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Theme.spacing.sm,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: Theme.spacing.xs,
  },
  batterySegments: {
    flexDirection: 'row',
    gap: 3,
  },
  segmentBar: {
    width: 8,
    height: 18,
    borderRadius: 2,
    backgroundColor: Theme.colors.surfaceSubtle,
  },
  batteryPercentText: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  climateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: Theme.spacing.xs,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tempText: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  widgetCaption: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    fontWeight: '500',
    marginTop: 4,
  },
});
