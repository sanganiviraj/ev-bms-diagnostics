import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowUpRight, ArrowDownLeft, Terminal, ChevronDown, ChevronUp } from 'lucide-react-native';
import { DiagnosticLogEntry } from '../services/diagnostic/DiagnosticTypes';
import { Theme } from '../theme';

interface LogItemCardProps {
  entry?: DiagnosticLogEntry;
  log?: DiagnosticLogEntry;
}

export const LogItemCard: React.FC<LogItemCardProps> = ({ entry, log }) => {
  const item = entry || log;
  const [expanded, setExpanded] = useState(false);

  if (!item) return null;

  const getDirectionIcon = () => {
    switch (item.direction) {
      case 'TX':
        return <ArrowUpRight size={12} color={Theme.colors.txColor} />;
      case 'RX':
        return <ArrowDownLeft size={12} color={Theme.colors.rxColor} />;
      case 'SYSTEM':
      default:
        return <Terminal size={12} color={Theme.colors.systemColor} />;
    }
  };

  const getStatusColor = () => {
    switch (item.status) {
      case 'SUCCESS':
        return Theme.colors.success;
      case 'WARNING':
        return Theme.colors.warning;
      case 'ERROR':
        return Theme.colors.danger;
      case 'INFO':
      default:
        return Theme.colors.primary;
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.leftMeta}>
          <View
            style={[
              styles.dirBadge,
              item.direction === 'TX' && styles.txBadge,
              item.direction === 'RX' && styles.rxBadge,
              item.direction === 'SYSTEM' && styles.systemBadge,
            ]}
          >
            {getDirectionIcon()}
            <Text
              style={[
                styles.dirText,
                item.direction === 'TX' && { color: Theme.colors.txColor },
                item.direction === 'RX' && { color: Theme.colors.rxColor },
                item.direction === 'SYSTEM' && { color: Theme.colors.systemColor },
              ]}
            >
              {item.direction}
            </Text>
          </View>

          <Text style={styles.serviceText}>{item.service}</Text>
          <Text style={styles.timeText}>{item.timestamp}</Text>
        </View>

        <View style={styles.rightMeta}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          {expanded ? (
            <ChevronUp size={14} color={Theme.colors.textMuted} />
          ) : (
            <ChevronDown size={14} color={Theme.colors.textMuted} />
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>{item.summary}</Text>
      </View>

      {item.rawHex && item.rawHex !== '--' && (
        <View style={styles.hexRow}>
          <Text style={styles.hexLabel}>HEX:</Text>
          <Text style={styles.hexText}>{item.rawHex}</Text>
        </View>
      )}

      {expanded && item.details ? (
        <View style={styles.expandedDetails}>
          <Text style={styles.detailsLabel}>Diagnostics Detail:</Text>
          <Text style={styles.detailsText}>{item.details}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: 6,
    ...Theme.shadows.subtle,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  leftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  dirBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
  },
  txBadge: {
    backgroundColor: Theme.colors.electricBlueMuted,
    borderColor: Theme.colors.surfaceBorder,
  },
  rxBadge: {
    backgroundColor: Theme.colors.successMuted,
    borderColor: Theme.colors.successBorder,
  },
  systemBadge: {
    backgroundColor: Theme.colors.purpleMuted,
    borderColor: Theme.colors.surfaceBorder,
  },
  dirText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  serviceText: {
    color: Theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  timeText: {
    color: Theme.colors.textMuted,
    fontSize: 10.5,
  },
  rightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  summaryRow: {
    marginVertical: 2,
  },
  summaryText: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  hexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.sm,
    marginTop: 6,
    gap: 6,
  },
  hexLabel: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  hexText: {
    color: Theme.colors.electricBlue,
    fontSize: 11,
    fontFamily: Theme.typography.fontMono,
    flex: 1,
  },
  expandedDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.surfaceBorder,
  },
  detailsLabel: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  detailsText: {
    color: Theme.colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 16,
  },
});
