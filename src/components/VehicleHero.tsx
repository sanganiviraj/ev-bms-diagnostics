import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Lock, Unlock, RefreshCw, Zap, ShieldCheck } from 'lucide-react-native';
import { Theme } from '../theme';
import { useDiagnostic } from '../services/diagnostic/DiagnosticContext';
import { Strings } from '../constants/strings';

export const VehicleHero: React.FC = () => {
  const { connectionState, connectionMode, batteryData, isRefreshingBattery, refreshBatteryData } = useDiagnostic();
  const [isLocked, setIsLocked] = useState(true);
  const [viewMode, setViewMode] = useState<'side' | 'top'>('side');

  const socParam = batteryData.find((p) => p.id === 'SOC');
  const socVal = typeof socParam?.decodedValue === 'number' ? Math.round(socParam.decodedValue) : 80;
  const isConnected = connectionState === 'connected';

  const modeBadge =
    connectionMode === 'ble_obd'
      ? 'BLE OBD-II (Real)'
      : connectionMode === 'cloud_sdk'
      ? 'Cloud SDK (Real)'
      : 'Simulation';

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.makeLabel}>TESLA MOTOR CORP</Text>
          <Text style={styles.modelTitle}>Model S Plaid</Text>
          <View style={styles.modeRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isConnected ? Theme.colors.success : Theme.colors.warning },
              ]}
            />
            <Text style={styles.modeText}>{modeBadge}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.iconButton, isLocked && styles.iconButtonActive]}
            onPress={() => setIsLocked(!isLocked)}
            activeOpacity={0.7}
          >
            {isLocked ? (
              <Lock size={16} color={Theme.colors.primary} />
            ) : (
              <Unlock size={16} color={Theme.colors.electricBlue} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={refreshBatteryData}
            disabled={isRefreshingBattery}
            activeOpacity={0.7}
          >
            <RefreshCw
              size={16}
              color={isRefreshingBattery ? Theme.colors.textMuted : Theme.colors.textPrimary}
            />
          </TouchableOpacity>

          <View style={styles.batteryPill}>
            <Zap size={14} color="#FFFFFF" />
            <Text style={styles.batteryPillText}>{socVal}%</Text>
          </View>
        </View>
      </View>

      <View style={styles.imageContainer}>
        {viewMode === 'side' ? (
          <Image
            source={require('../../assets/images/car_hero.jpg')}
            style={styles.carImageSide}
            resizeMode="contain"
          />
        ) : (
          <Image
            source={require('../../assets/images/car_top.jpg')}
            style={styles.carImageTop}
            resizeMode="contain"
          />
        )}
      </View>

      <View style={styles.viewToggleRow}>
        <TouchableOpacity
          style={[styles.togglePill, viewMode === 'side' && styles.togglePillActive]}
          onPress={() => setViewMode('side')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.togglePillText,
              viewMode === 'side' && styles.togglePillTextActive,
            ]}
          >
            Exterior Studio
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.togglePill, viewMode === 'top' && styles.togglePillActive]}
          onPress={() => setViewMode('top')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.togglePillText,
              viewMode === 'top' && styles.togglePillTextActive,
            ]}
          >
            Chassis Overhead
          </Text>
        </TouchableOpacity>
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  makeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    letterSpacing: 1.2,
  },
  modelTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  modeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  batteryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.electricBlue,
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  batteryPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Theme.spacing.sm,
    height: 180,
  },
  carImageSide: {
    width: '100%',
    height: 180,
  },
  carImageTop: {
    width: '100%',
    height: 180,
  },
  viewToggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
  },
  togglePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
  },
  togglePillActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  togglePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  togglePillTextActive: {
    color: '#FFFFFF',
  },
});
