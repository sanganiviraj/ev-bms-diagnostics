import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BookOpen, ChevronDown, ChevronUp, AlertCircle, ArrowRight } from 'lucide-react-native';
import { UdsTraceExample } from '../services/diagnostic/UdsExamples';
import { Theme } from '../theme';

interface UdsExampleCardProps {
  example: UdsTraceExample;
  onSendSimulation?: (payload: string) => void;
}

export const UdsExampleCard: React.FC<UdsExampleCardProps> = ({ example, onSendSimulation }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.titleWrap}>
          <View style={styles.sidBadge}>
            <Text style={styles.sidText}>{example.serviceIdHex}</Text>
          </View>
          <View>
            <Text style={styles.serviceName}>{example.serviceName}</Text>
            <Text style={styles.standardText}>{example.isoStandard}</Text>
          </View>
        </View>

        <View style={styles.rightWrap}>
          {expanded ? (
            <ChevronUp size={16} color={Theme.colors.textMuted} />
          ) : (
            <ChevronDown size={16} color={Theme.colors.textMuted} />
          )}
        </View>
      </TouchableOpacity>

      <Text style={styles.descText}>{example.description}</Text>

      {/* Hex Stream Preview */}
      <View style={styles.traceStream}>
        <View style={styles.traceRow}>
          <Text style={styles.txTag}>TX REQ:</Text>
          <Text style={styles.txHex}>{example.requestPayload}</Text>
        </View>
        <View style={styles.traceRow}>
          <Text style={styles.rxTag}>RX RSP:</Text>
          <Text style={styles.rxHex}>{example.responsePayload}</Text>
        </View>
      </View>

      {expanded && (
        <View style={styles.expandedSection}>
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Request Byte Breakdown:</Text>
            {example.requestBreakdown.map((b, i) => (
              <Text key={i} style={styles.breakdownItem}>
                • {b}
              </Text>
            ))}
          </View>

          <View style={styles.block}>
            <Text style={styles.blockTitle}>Response Byte Breakdown:</Text>
            {example.responseBreakdown.map((b, i) => (
              <Text key={i} style={styles.breakdownItem}>
                • {b}
              </Text>
            ))}
          </View>

          <View style={styles.block}>
            <Text style={styles.blockTitle}>Protocol Significance:</Text>
            <Text style={styles.explanationText}>{example.explanation}</Text>
          </View>

          <View style={styles.warningBox}>
            <AlertCircle size={14} color={Theme.colors.warning} />
            <Text style={styles.warningText}>{example.teslaNotice}</Text>
          </View>

          {onSendSimulation && (
            <TouchableOpacity
              style={styles.testBtn}
              onPress={() => onSendSimulation(example.requestPayload)}
              activeOpacity={0.8}
            >
              <Text style={styles.testBtnText}>Simulate Dispatch in Live Log</Text>
              <ArrowRight size={13} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.card,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
    ...Theme.shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sidBadge: {
    backgroundColor: Theme.colors.electricBlueMuted,
    borderColor: Theme.colors.surfaceBorder,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.borderRadius.full,
  },
  sidText: {
    color: Theme.colors.electricBlue,
    fontSize: 12,
    fontWeight: '800',
    fontFamily: Theme.typography.fontMono,
  },
  serviceName: {
    color: Theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  standardText: {
    color: Theme.colors.textMuted,
    fontSize: 10,
  },
  rightWrap: {
    paddingLeft: 8,
  },
  descText: {
    color: Theme.colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 8,
  },
  traceStream: {
    backgroundColor: Theme.colors.surfaceSubtle,
    borderColor: Theme.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    padding: 8,
    gap: 4,
  },
  traceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txTag: {
    color: Theme.colors.electricBlue,
    fontSize: 10,
    fontFamily: Theme.typography.fontMono,
    fontWeight: '700',
    width: 55,
  },
  txHex: {
    color: Theme.colors.textPrimary,
    fontSize: 11,
    fontFamily: Theme.typography.fontMono,
    fontWeight: '600',
  },
  rxTag: {
    color: Theme.colors.rxColor,
    fontSize: 10,
    fontFamily: Theme.typography.fontMono,
    fontWeight: '700',
    width: 55,
  },
  rxHex: {
    color: Theme.colors.rxColor,
    fontSize: 11,
    fontFamily: Theme.typography.fontMono,
    fontWeight: '600',
  },
  expandedSection: {
    marginTop: Theme.spacing.md,
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.surfaceBorder,
    gap: 10,
  },
  block: {
    gap: 3,
  },
  blockTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  breakdownItem: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    fontFamily: Theme.typography.fontMono,
    lineHeight: 16,
  },
  explanationText: {
    color: Theme.colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 16,
  },
  warningBox: {
    backgroundColor: Theme.colors.warningMuted,
    borderColor: Theme.colors.warningBorder,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  warningText: {
    color: Theme.colors.warning,
    fontSize: 10.5,
    lineHeight: 14,
    flex: 1,
  },
  testBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Theme.borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
    ...Theme.shadows.subtle,
  },
  testBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
});
