import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Theme } from '../theme';
import { BatteryCharging, RotateCcw, Terminal, Sliders, ShieldCheck } from 'lucide-react-native';

interface ActionPillProps {
  activeTab?: string;
}

export const QuickActionPills: React.FC<ActionPillProps> = ({ activeTab }) => {
  const items = [
    { id: 'dashboard', label: 'Overview', icon: ShieldCheck, path: '/(tabs)' },
    { id: 'battery', label: 'Battery Telemetry', icon: BatteryCharging, path: '/(tabs)/battery' },
    { id: 'reset', label: 'BMS Reset', icon: RotateCcw, path: '/(tabs)/reset' },
    { id: 'logs', label: 'CAN Bus UDS', icon: Terminal, path: '/(tabs)/logs' },
    { id: 'settings', label: 'Adapter Config', icon: Sliders, path: '/(tabs)/settings' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => {
          const IconComp = item.icon;
          const isActive = activeTab === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => router.push(item.path as any)}
              activeOpacity={0.7}
            >
              <IconComp
                size={14}
                color={isActive ? '#FFFFFF' : Theme.colors.textSecondary}
              />
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Theme.spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Theme.spacing.lg,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    ...Theme.shadows.subtle,
  },
  pillActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
});
