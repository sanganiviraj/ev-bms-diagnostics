import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {
  Search,
  Trash2,
  Terminal,
  BookOpen,
} from 'lucide-react-native';
import { Theme } from '../../theme';
import { useDiagnostic } from '../../services/diagnostic/DiagnosticContext';
import { SimulatedBanner } from '../../components/SimulatedBanner';
import { QuickActionPills } from '../../components/QuickActionPills';
import { LogItemCard } from '../../components/LogItemCard';
import { UdsExampleCard } from '../../components/UdsExampleCard';
import { UDS_EDUCATIONAL_EXAMPLES } from '../../services/diagnostic/UdsExamples';

type SubView = 'LOGS' | 'ACADEMY';
type DirectionFilter = 'ALL' | 'TX' | 'RX' | 'SYSTEM' | 'ERROR';

export default function DiagnosticLogsScreen() {
  const { logs, clearLogs, sendRawCommand } = useDiagnostic();
  const [activeTab, setActiveTab] = useState<SubView>('LOGS');
  const [filterDirection, setFilterDirection] = useState<DirectionFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [clearModalVisible, setClearModalVisible] = useState(false);

  const filteredLogs = logs.filter((log) => {
    if (filterDirection === 'TX' && log.direction !== 'TX') return false;
    if (filterDirection === 'RX' && log.direction !== 'RX') return false;
    if (filterDirection === 'SYSTEM' && log.direction !== 'SYSTEM') return false;
    if (filterDirection === 'ERROR' && log.status !== 'ERROR') return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchSummary = log.summary.toLowerCase().includes(q);
      const matchService = log.service.toLowerCase().includes(q);
      const matchHex = log.rawHex.toLowerCase().includes(q);
      return matchSummary || matchService || matchHex;
    }

    return true;
  });

  const handleSimulateDispatch = (payloadHex: string) => {
    sendRawCommand(payloadHex);
    setActiveTab('LOGS');
  };

  return (
    <View style={styles.container}>
      <SimulatedBanner compact />

      <QuickActionPills activeTab="logs" />

      {/* View Switcher: Live Logs vs UDS Academy */}
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          style={[styles.switcherBtn, activeTab === 'LOGS' && styles.switcherBtnActive]}
          onPress={() => setActiveTab('LOGS')}
          activeOpacity={0.7}
        >
          <Terminal size={14} color={activeTab === 'LOGS' ? '#FFFFFF' : Theme.colors.textSecondary} />
          <Text
            style={[styles.switcherText, activeTab === 'LOGS' && styles.switcherTextActive]}
          >
            Live Diagnostic Log ({logs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.switcherBtn, activeTab === 'ACADEMY' && styles.switcherBtnActive]}
          onPress={() => setActiveTab('ACADEMY')}
          activeOpacity={0.7}
        >
          <BookOpen size={14} color={activeTab === 'ACADEMY' ? '#FFFFFF' : Theme.colors.textSecondary} />
          <Text
            style={[styles.switcherText, activeTab === 'ACADEMY' && styles.switcherTextActive]}
          >
            UDS Protocol Academy
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'LOGS' ? (
        <ScrollView style={styles.contentScroll} contentContainerStyle={styles.scrollContent}>
          {/* Search and Clear toolbar */}
          <View style={styles.toolbar}>
            <View style={styles.searchBar}>
              <Search size={14} color={Theme.colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search service, hex, or message..."
                placeholderTextColor={Theme.colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
            </View>

            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => setClearModalVisible(true)}
              activeOpacity={0.7}
            >
              <Trash2 size={13} color={Theme.colors.danger} />
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          </View>

          {/* Direction filters */}
          <View style={styles.filtersRow}>
            {(['ALL', 'TX', 'RX', 'SYSTEM', 'ERROR'] as DirectionFilter[]).map((dir) => (
              <TouchableOpacity
                key={dir}
                style={[
                  styles.filterPill,
                  filterDirection === dir && styles.filterPillActive,
                ]}
                onPress={() => setFilterDirection(dir)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterText,
                    filterDirection === dir && styles.filterTextActive,
                  ]}
                >
                  {dir}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Logs List */}
          <View style={styles.logsList}>
            {filteredLogs.length === 0 ? (
              <View style={styles.emptyState}>
                <Terminal size={32} color={Theme.colors.textMuted} />
                <Text style={styles.emptyTitle}>No Diagnostic Events</Text>
                <Text style={styles.emptyDesc}>
                  Execute a battery refresh, run the BMS reset workflow, or connect an adapter to generate UDS frames.
                </Text>
              </View>
            ) : (
              filteredLogs.map((log) => <LogItemCard key={log.id} log={log} />)
            )}
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.contentScroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.academyHeader}>
            <Text style={styles.academyHeading}>ISO 14229 Standard Protocol Reference</Text>
            <Text style={styles.academySub}>
              Interactive diagnostic frames illustrating standard UDS service requests and ECU responses.
            </Text>
          </View>

          {UDS_EDUCATIONAL_EXAMPLES.map((example) => (
            <UdsExampleCard
              key={example.id}
              example={example}
              onSendSimulation={handleSimulateDispatch}
            />
          ))}
        </ScrollView>
      )}

      {/* Confirmation Modal for Clearing Logs */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={clearModalVisible}
        onRequestClose={() => setClearModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Clear Diagnostic Trace?</Text>
            <Text style={styles.modalBody}>
              This will remove all buffered UDS request and response frames from the live monitor view.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setClearModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={() => {
                  clearLogs();
                  setClearModalVisible(false);
                }}
              >
                <Text style={styles.modalConfirmText}>Clear Trace</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    marginHorizontal: Theme.spacing.lg,
    marginVertical: Theme.spacing.sm,
    padding: 4,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    ...Theme.shadows.subtle,
  },
  switcherBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Theme.borderRadius.full,
    gap: 6,
  },
  switcherBtnActive: {
    backgroundColor: Theme.colors.primary,
  },
  switcherText: {
    color: Theme.colors.textSecondary,
    fontSize: 11.5,
    fontWeight: '700',
  },
  switcherTextActive: {
    color: '#FFFFFF',
  },
  contentScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: 96,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Theme.spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
    ...Theme.shadows.subtle,
  },
  searchInput: {
    flex: 1,
    color: Theme.colors.textPrimary,
    fontSize: 12,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.colors.dangerMuted,
    borderWidth: 1,
    borderColor: Theme.colors.dangerBorder,
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: 14,
    height: 40,
  },
  clearBtnText: {
    color: Theme.colors.danger,
    fontSize: 11.5,
    fontWeight: '700',
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Theme.spacing.md,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
  },
  filterPillActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  filterText: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  logsList: {
    gap: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 8,
  },
  emptyTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  emptyDesc: {
    color: Theme.colors.textMuted,
    fontSize: 11.5,
    textAlign: 'center',
    maxWidth: 280,
  },
  academyHeader: {
    marginBottom: Theme.spacing.md,
  },
  academyHeading: {
    color: Theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  academySub: {
    color: Theme.colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.card,
    padding: Theme.spacing.xl,
    width: '100%',
    maxWidth: 380,
    ...Theme.shadows.floating,
  },
  modalTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalBody: {
    color: Theme.colors.textSecondary,
    fontSize: 12.5,
    lineHeight: 17,
    marginBottom: Theme.spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    alignItems: 'center',
  },
  modalCancelText: {
    color: Theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.danger,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
