import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, ScrollView, View, Text } from 'react-native';
import { ShieldAlert, Cpu, Layers, Bluetooth, Cloud, CheckCircle2 } from 'lucide-react-native';
import { Theme } from '../theme';

export default function ModalScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar style="dark" />

      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>ISO 14229-1 PRODUCTION HAL</Text>
        </View>
      </View>

      <Text style={styles.title}>Digital EV Doctor</Text>
      <Text style={styles.subtitle}>Production High-Voltage Diagnostic & Telematics Architecture</Text>

      {/* Real Car vs Simulation Explainer */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Bluetooth size={18} color={Theme.colors.electricBlue} />
          <Text style={styles.cardTitle}>Physical Car Connection (Real Hardware)</Text>
        </View>
        <Text style={styles.bodyText}>
          To connect to a physical electric vehicle, pair a standard Bluetooth OBD-II CAN adapter (e.g. OBDLink MX+, vLinker MC+, ELM327 BLE). The app initializes standard AT commands (ATSP6 500kbps CAN, ATSH 7E4 BMS ECU) and streams ISO 14229 UDS frames over pins 6 & 14 of the car's OBD-II port.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Cloud size={18} color={Theme.colors.purple} />
          <Text style={styles.cardTitle}>Connected Car Cloud SDK (Remote)</Text>
        </View>
        <Text style={styles.bodyText}>
          The application also supports direct OEM Telematics SDKs (Smartcar SDK, Tesla Fleet API, Enode) via OAuth 2.0. This allows reading live battery SoC, range, charge status, and issuing remote lock/preconditioning commands over the vehicle's onboard cellular modem without requiring physical OBD-II dongles.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Cpu size={18} color={Theme.colors.primary} />
          <Text style={styles.cardTitle}>Diagnostic Specifications</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Application Protocol:</Text>
          <Text style={styles.specValue}>ISO 14229-1 (UDS)</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Transport Protocol:</Text>
          <Text style={styles.specValue}>ISO 15765-2 (ISO-TP)</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Diagnostic Bus Rate:</Text>
          <Text style={styles.specValue}>500 kbps (High Speed CAN)</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Target ECU Subsystem:</Text>
          <Text style={styles.specValue}>BMS Master (0x7E4)</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Layers size={18} color={Theme.colors.success} />
          <Text style={styles.cardTitle}>Supported Diagnostic Services</Text>
        </View>
        <Text style={styles.serviceItem}>• 0x10: DiagnosticSessionControl (0x01 Default, 0x03 Extended)</Text>
        <Text style={styles.serviceItem}>• 0x19: ReadDTCInformation (0x02 reportDTCByStatusMask)</Text>
        <Text style={styles.serviceItem}>• 0x22: ReadDataByIdentifier (Live Pack DIDs 0xD100–0xD109)</Text>
        <Text style={styles.serviceItem}>• 0x27: SecurityAccess (Cryptographic Seed & Key Exchange)</Text>
        <Text style={styles.serviceItem}>• 0x31: RoutineControl (0x0215 BMS Contactor Reset & Check)</Text>
        <Text style={styles.serviceItem}>• 0x3E: TesterPresent (Zero-suppress session maintenance)</Text>
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
    padding: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xxxl,
  },
  badgeRow: {
    marginBottom: Theme.spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Theme.colors.surfaceSubtle,
    borderColor: Theme.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: Theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: Theme.spacing.lg,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.card,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    gap: 8,
    ...Theme.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  bodyText: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specLabel: {
    color: Theme.colors.textSecondary,
    fontSize: 11.5,
  },
  specValue: {
    color: Theme.colors.textPrimary,
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: Theme.typography.fontMono,
  },
  serviceItem: {
    color: Theme.colors.textSecondary,
    fontSize: 11.5,
    fontFamily: Theme.typography.fontMono,
    lineHeight: 20,
  },
});
