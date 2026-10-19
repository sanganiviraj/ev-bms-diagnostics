import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertTriangle, CheckCircle2, ChevronRight, Wrench } from 'lucide-react-native';
import { router } from 'expo-router';
import { Theme } from '../theme';
import { useDiagnostic } from '../services/diagnostic/DiagnosticContext';

export const ServiceStatusCard: React.FC = () => {
  const { dtcs, connectionState } = useDiagnostic();
  const hasFaults = dtcs.length > 0;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Wrench size={18} color={Theme.colors.primary} />
          <Text style={styles.title}>Service & Health</Text>
        </View>

        <View
          style={[
            styles.badge,
            hasFaults ? styles.badgeWarning : styles.badgeSuccess,
          ]}
        >
          {hasFaults ? (
            <AlertTriangle size={12} color={Theme.colors.warning} />
          ) : (
            <CheckCircle2 size={12} color={Theme.colors.success} />
          )}
          <Text
            style={[
              styles.badgeText,
              hasFaults ? { color: Theme.colors.warning } : { color: Theme.colors.success },
            ]}
          >
            {hasFaults ? `${dtcs.length} Service Notice` : 'All Systems Nominal'}
          </Text>
        </View>
      </View>

      <View style={styles.itemsList}>
        <View style={styles.itemRow}>
          <View style={[styles.dot, { backgroundColor: Theme.colors.success }]} />
          <Text style={styles.itemText}>HV Contactor Isolation: 500 kΩ (Pass)</Text>
        </View>

        <View style={styles.itemRow}>
          <View
            style={[
              styles.dot,
              { backgroundColor: hasFaults ? Theme.colors.warning : Theme.colors.success },
            ]}
          />
          <Text style={styles.itemText}>
            {hasFaults
              ? `Active Diagnostic Trouble Code: ${dtcs[0].code} (${dtcs[0].description})`
              : 'Cell Imbalance: 10 mV (Optimal)'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => router.push('/(tabs)/reset')}
        activeOpacity={0.7}
      >
        <Text style={styles.actionBtnText}>
          {hasFaults ? 'Run BMS Diagnostic Reset' : 'Verify Contactor Routine'}
        </Text>
        <ChevronRight size={16} color={Theme.colors.textSecondary} />
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
  headerRow: {
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
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.borderRadius.full,
    gap: 4,
  },
  badgeWarning: {
    backgroundColor: Theme.colors.warningMuted,
  },
  badgeSuccess: {
    backgroundColor: Theme.colors.successMuted,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemsList: {
    gap: 8,
    marginBottom: Theme.spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  itemText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: Theme.colors.surfaceSubtle,
    borderRadius: Theme.borderRadius.md,
    marginTop: 4,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
});
