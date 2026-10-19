import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Theme } from '../../theme';
import { useDiagnostic } from '../../services/diagnostic/DiagnosticContext';
import { SimulatedBanner } from '../../components/SimulatedBanner';
import { VehicleHero } from '../../components/VehicleHero';
import { TeslaBmsResetCard } from '../../components/TeslaBmsResetCard';
import { LogItemCard } from '../../components/LogItemCard';

export default function DashboardScreen() {
  const { logs } = useDiagnostic();
  const recentLogs = logs.slice(0, 3);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SimulatedBanner />

      {/* Vehicle Hero showing Model & SoC */}
      <VehicleHero />

      {/* Dedicated Client Assignment: Tesla BMS Reset & Alert Codes (BMS_w107, BMS_u029) */}
      <TeslaBmsResetCard />

      {/* Live CAN Bus Activity */}
      <View style={styles.logsSection}>
        <View style={styles.logsHeader}>
          <Text style={styles.sectionTitle}>Recent CAN Bus Frames</Text>
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => router.push('/(tabs)/logs')}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>Open CAN Console</Text>
            <ChevronRight size={14} color={Theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.logList}>
          {recentLogs.map((log) => (
            <LogItemCard key={log.id} log={log} />
          ))}
        </View>
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
  logsSection: {
    marginHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.lg,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  logList: {
    gap: 6,
  },
});
