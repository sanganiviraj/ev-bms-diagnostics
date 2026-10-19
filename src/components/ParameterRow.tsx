import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react-native';
import { BatteryParameter } from '../services/diagnostic/DiagnosticTypes';
import { Theme } from '../theme';

interface ParameterRowProps {
  param: BatteryParameter;
}

export const ParameterRow: React.FC<ParameterRowProps> = ({ param }) => {
  const [expanded, setExpanded] = useState(false);

  const getValidityBadge = () => {
    switch (param.validity) {
      case 'VALID':
        return (
          <View style={[styles.badge, styles.validBadge]}>
            <CheckCircle size={10} color={Theme.colors.success} />
            <Text style={[styles.badgeText, { color: Theme.colors.success }]}>VALID</Text>
          </View>
        );
      case 'DEGRADED':
        return (
          <View style={[styles.badge, styles.degradedBadge]}>
            <AlertTriangle size={10} color={Theme.colors.warning} />
            <Text style={[styles.badgeText, { color: Theme.colors.warning }]}>DEGRADED</Text>
          </View>
        );
      case 'OUT_OF_RANGE':
      case 'INVALID':
      default:
        return (
          <View style={[styles.badge, styles.invalidBadge]}>
            <XCircle size={10} color={Theme.colors.danger} />
            <Text style={[styles.badgeText, { color: Theme.colors.danger }]}>{param.validity}</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.mainRow}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.nameSection}>
          <Text style={styles.paramName}>{param.name}</Text>
          <View style={styles.subMeta}>
            <Text style={styles.didTag}>{param.didHex} (Illustrative DID)</Text>
            {getValidityBadge()}
          </View>
        </View>

        <View style={styles.valueSection}>
          <View style={styles.valueRow}>
            <Text style={styles.decodedValue}>
              {param.decodedValue}
            </Text>
            {param.unit ? <Text style={styles.unitText}>{param.unit}</Text> : null}
          </View>
          <View style={styles.toggleWrap}>
            <Text style={styles.rawPreview}>Raw: {param.rawHex}</Text>
            {expanded ? (
              <ChevronUp size={14} color={Theme.colors.textMuted} />
            ) : (
              <ChevronDown size={14} color={Theme.colors.textMuted} />
            )}
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Scaling / Decode Formula:</Text>
            <Text style={styles.detailCode}>{param.formula}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Raw Payload Hex:</Text>
            <Text style={styles.detailHex}>{param.rawHex}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Telemetry Category:</Text>
            <Text style={styles.detailValue}>{param.category}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Last Query Timestamp:</Text>
            <Text style={styles.detailValue}>{param.lastUpdated}</Text>
          </View>

          {param.notes ? (
            <View style={styles.notesWrap}>
              <Info size={12} color={Theme.colors.textSecondary} />
              <Text style={styles.notesText}>{param.notes}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.surfaceCard,
    borderColor: Theme.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.sm,
    overflow: 'hidden',
  },
  mainRow: {
    padding: Theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameSection: {
    flex: 1,
    marginRight: Theme.spacing.sm,
  },
  paramName: {
    color: Theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  subMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  didTag: {
    color: Theme.colors.primary,
    fontSize: 10,
    fontFamily: Theme.typography.fontMono,
    backgroundColor: Theme.colors.primaryMuted,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Theme.borderRadius.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
  },
  validBadge: {
    backgroundColor: Theme.colors.successMuted,
    borderColor: Theme.colors.successBorder,
  },
  degradedBadge: {
    backgroundColor: Theme.colors.warningMuted,
    borderColor: Theme.colors.warningBorder,
  },
  invalidBadge: {
    backgroundColor: Theme.colors.dangerMuted,
    borderColor: Theme.colors.dangerBorder,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  valueSection: {
    alignItems: 'flex-end',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  decodedValue: {
    color: Theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Theme.typography.fontMono,
  },
  unitText: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  toggleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  rawPreview: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontFamily: Theme.typography.fontMono,
  },
  expandedDetails: {
    backgroundColor: Theme.colors.surfaceSubtle,
    padding: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.surfaceBorder,
    gap: 6,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
  },
  detailCode: {
    color: Theme.colors.electricBlue,
    fontSize: 11,
    fontFamily: Theme.typography.fontMono,
    maxWidth: '60%',
    textAlign: 'right',
  },
  detailHex: {
    color: Theme.colors.rxColor,
    fontSize: 11,
    fontFamily: Theme.typography.fontMono,
    fontWeight: '600',
  },
  detailValue: {
    color: Theme.colors.textPrimary,
    fontSize: 11,
  },
  notesWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.colors.surface,
    padding: 6,
    borderRadius: Theme.borderRadius.sm,
    marginTop: 4,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
  },
  notesText: {
    color: Theme.colors.textSecondary,
    fontSize: 10,
    flex: 1,
  },
});
