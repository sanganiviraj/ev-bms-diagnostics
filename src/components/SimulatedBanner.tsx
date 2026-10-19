import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle, CheckCircle2, Cloud, Bluetooth, Cpu } from 'lucide-react-native';
import { Theme } from '../theme';
import { useDiagnostic } from '../services/diagnostic/DiagnosticContext';

interface SimulatedBannerProps {
  compact?: boolean;
}

export const SimulatedBanner: React.FC<SimulatedBannerProps> = ({ compact = false }) => {
  const { connectionMode } = useDiagnostic();

  const isReal = connectionMode !== 'simulation';
  const isBle = connectionMode === 'ble_obd';

  return (
    <View
      style={[
        styles.container,
        isReal ? styles.containerReal : styles.containerSim,
        compact && styles.compactContainer,
      ]}
    >
      <View style={styles.iconWrap}>
        {isBle ? (
          <Bluetooth size={compact ? 13 : 15} color={Theme.colors.success} />
        ) : isReal ? (
          <Cloud size={compact ? 13 : 15} color={Theme.colors.electricBlue} />
        ) : (
          <Cpu size={compact ? 13 : 15} color={Theme.colors.textMuted} />
        )}
      </View>
      <View style={styles.textWrap}>
        <Text
          style={[
            styles.mainText,
            isReal ? styles.mainTextReal : styles.mainTextSim,
            compact && styles.compactText,
          ]}
        >
          {isBle
            ? 'PHYSICAL OBD-II INTERFACE CONFIGURED (CAN 500k)'
            : isReal
            ? 'CLOUD TELEMATICS SDK CONFIGURED (OEM API)'
            : 'SIMULATION BENCH MODE'}
        </Text>
      </View>
      <View
        style={[
          styles.badge,
          isReal ? styles.badgeReal : styles.badgeSim,
        ]}
      >
        <Text
          style={[
            styles.badgeText,
            isReal ? styles.badgeTextReal : styles.badgeTextSim,
          ]}
        >
          {isReal ? 'REAL CAR' : 'SIMULATOR'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.xs,
    borderWidth: 1,
  },
  containerSim: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.surfaceBorder,
  },
  containerReal: {
    backgroundColor: Theme.colors.successMuted,
    borderColor: Theme.colors.successBorder,
  },
  compactContainer: {
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: Theme.spacing.sm,
  },
  iconWrap: {
    marginRight: Theme.spacing.sm,
  },
  textWrap: {
    flex: 1,
  },
  mainText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  mainTextSim: {
    color: Theme.colors.textSecondary,
  },
  mainTextReal: {
    color: Theme.colors.success,
  },
  compactText: {
    fontSize: 9.5,
  },
  badge: {
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
  },
  badgeSim: {
    backgroundColor: Theme.colors.surfaceSubtle,
    borderColor: Theme.colors.surfaceBorder,
  },
  badgeReal: {
    backgroundColor: '#FFFFFF',
    borderColor: Theme.colors.success,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeTextSim: {
    color: Theme.colors.textMuted,
  },
  badgeTextReal: {
    color: Theme.colors.success,
  },
});
