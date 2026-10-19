import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  RefreshCw,
  Filter,
  CheckCircle,
  AlertTriangle,
  Info,
  ShieldAlert,
} from 'lucide-react-native';
import { Theme } from '../../theme';
import { useDiagnostic } from '../../services/diagnostic/DiagnosticContext';
import { SimulatedBanner } from '../../components/SimulatedBanner';
import { ParameterRow } from '../../components/ParameterRow';

type CategoryFilter = 'ALL' | 'CORE' | 'THERMAL' | 'SAFETY';

export default function BatteryDiagnosticsScreen() {
  const {
    batteryData,
    isRefreshingBattery,
    refreshBatteryData,
    connectionState,
    resetState,
  } = useDiagnostic();

  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('ALL');
  const isConnected = connectionState === 'connected';
  const isResetComplete = resetState.stepStatus === 'completed';

  const filteredParams =
    activeCategory === 'ALL'
      ? batteryData
      : batteryData.filter((p) => p.category === activeCategory);

  const categories: CategoryFilter[] = ['ALL', 'CORE', 'SAFETY', 'THERMAL'];

  const validCount = batteryData.filter((p) => p.validity === 'VALID').length;
  const degradedCount = batteryData.filter((p) => p.validity === 'DEGRADED').length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SimulatedBanner />

      {/* Header card with Refresh Action */}
      <View style={styles.controlHeader}>
        <View style={styles.controlLeft}>
          <Text style={styles.screenHeading}>Tesla BMS Alert Telemetry</Text>
          <Text style={styles.subHeading}>
            Polled via UDS Service 0x22 (CAN ID 0x7E4)
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.refreshButton,
            (!isConnected || isRefreshingBattery) && styles.disabledButton,
          ]}
          onPress={refreshBatteryData}
          disabled={!isConnected || isRefreshingBattery}
          activeOpacity={0.8}
        >
          {isRefreshingBattery ? (
            <ActivityIndicator size={14} color="#FFFFFF" />
          ) : (
            <RefreshCw size={14} color="#FFFFFF" />
          )}
          <Text style={styles.refreshText}>
            {isRefreshingBattery ? 'Reading DIDs...' : 'Poll Live DIDs'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* BMS_w107 & BMS_u029 Dedicated Metric Card */}
      <View style={styles.alertMetricCard}>
        <View style={styles.alertMetricHeader}>
          <ShieldAlert size={16} color={Theme.colors.primary} />
          <Text style={styles.alertMetricTitle}>Active Alert Subsystem Status</Text>
        </View>

        <View style={styles.alertMetricRow}>
          <View style={styles.alertMetricBox}>
            <Text style={styles.metricCodeLabel}>BMS_w107 METRIC</Text>
            <Text style={styles.metricName}>Isolation Resistance</Text>
            <Text
              style={[
                styles.metricValue,
                isResetComplete ? { color: Theme.colors.success } : { color: Theme.colors.warning },
              ]}
            >
              {isResetComplete ? '1,250 kΩ' : '450 kΩ'}
            </Text>
            <Text style={styles.metricSub}>
              {isResetComplete ? 'Safe (>1000 kΩ)' : 'Fault (<500 kΩ)'}
            </Text>
          </View>

          <View style={styles.alertMetricBox}>
            <Text style={styles.metricCodeLabel}>BMS_u029 METRIC</Text>
            <Text style={styles.metricName}>Contactor Interlock</Text>
            <Text
              style={[
                styles.metricValue,
                isResetComplete ? { color: Theme.colors.success } : { color: Theme.colors.danger },
              ]}
            >
              {isResetComplete ? 'Closed (Nominal)' : 'Open (Tripped)'}
            </Text>
            <Text style={styles.metricSub}>
              {isResetComplete ? 'Pre-charge Verified' : 'Voltage Mismatch Latch'}
            </Text>
          </View>
        </View>
      </View>

      {/* Diagnostic Validity Summary Bar */}
      <View style={styles.validityBar}>
        <View style={styles.validityItem}>
          <CheckCircle size={13} color={Theme.colors.success} />
          <Text style={styles.validityLabel}>Valid Parameters:</Text>
          <Text style={[styles.validityCount, { color: Theme.colors.success }]}>
            {validCount}
          </Text>
        </View>

        <View style={styles.validityItem}>
          <AlertTriangle
            size={13}
            color={isResetComplete ? Theme.colors.success : Theme.colors.warning}
          />
          <Text style={styles.validityLabel}>Alerts Present:</Text>
          <Text
            style={[
              styles.validityCount,
              { color: isResetComplete ? Theme.colors.success : Theme.colors.warning },
            ]}
          >
            {isResetComplete ? '0 (Nominal)' : '2 (BMS_w107, BMS_u029)'}
          </Text>
        </View>
      </View>

      {/* Category Pills Filter */}
      <View style={styles.filterRow}>
        <Filter size={13} color={Theme.colors.textSecondary} style={{ marginRight: 6 }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryPill,
                activeCategory === cat && styles.activeCategoryPill,
              ]}
              onPress={() => setActiveCategory(cat)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === cat && styles.activeCategoryText,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Parameters List */}
      <View style={styles.paramList}>
        {filteredParams.map((param) => (
          <ParameterRow key={param.id} param={param} />
        ))}
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
  controlHeader: {
    paddingHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  controlLeft: {
    flex: 1,
    minWidth: 180,
  },
  screenHeading: {
    color: Theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  subHeading: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  refreshButton: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Theme.borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...Theme.shadows.subtle,
  },
  disabledButton: {
    opacity: 0.5,
  },
  refreshText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  alertMetricCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.card,
    padding: Theme.spacing.md,
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    ...Theme.shadows.card,
  },
  alertMetricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Theme.spacing.sm,
  },
  alertMetricTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  alertMetricRow: {
    flexDirection: 'row',
    gap: 8,
  },
  alertMetricBox: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceSubtle,
    borderRadius: Theme.borderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
  },
  metricCodeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Theme.colors.electricBlue,
    fontFamily: Theme.typography.fontMono,
  },
  metricName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Theme.typography.fontMono,
    marginTop: 4,
  },
  metricSub: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  validityBar: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    gap: 16,
    ...Theme.shadows.subtle,
  },
  validityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  validityLabel: {
    color: Theme.colors.textSecondary,
    fontSize: 11.5,
    fontWeight: '500',
  },
  validityCount: {
    fontSize: 12,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    marginRight: 6,
  },
  activeCategoryPill: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  categoryText: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  activeCategoryText: {
    color: '#FFFFFF',
  },
  paramList: {
    paddingHorizontal: Theme.spacing.lg,
  },
});
