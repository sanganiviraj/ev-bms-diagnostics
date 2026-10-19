import React from 'react';
import { Tabs, Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  RotateCcw,
  BatteryCharging,
  Terminal,
  Info,
} from 'lucide-react-native';
import { Theme } from '../../theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: Theme.colors.surface,
          borderBottomColor: Theme.colors.surfaceBorder,
          borderBottomWidth: 1,
        },
        headerTitleStyle: {
          color: Theme.colors.textPrimary,
          fontSize: 16,
          fontWeight: '800',
        },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: Theme.colors.surface,
          borderTopColor: Theme.colors.surfaceBorder,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
          marginHorizontal: 16,
          marginBottom: 12,
          borderRadius: Theme.borderRadius.full,
          position: 'absolute',
          ...Theme.shadows.floating,
        },
        tabBarActiveTintColor: Theme.colors.primary,
        tabBarInactiveTintColor: Theme.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'OBD2 BMS Reset',
          tabBarLabel: 'BMS Reset',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconWrap, focused && styles.tabIconActive]}>
              <RotateCcw size={18} color={focused ? '#FFFFFF' : color} />
            </View>
          ),
          headerTitle: 'Digital EV Doctor — OBD2 Features',
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable style={styles.headerRightBtn}>
                <Info size={20} color={Theme.colors.textPrimary} />
              </Pressable>
            </Link>
          ),
        }}
      />

      <Tabs.Screen
        name="battery"
        options={{
          title: 'BMS Alerts & Telemetry',
          tabBarLabel: 'Telemetry',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconWrap, focused && styles.tabIconActive]}>
              <BatteryCharging size={18} color={focused ? '#FFFFFF' : color} />
            </View>
          ),
          headerTitle: 'Tesla BMS Alert Telemetry (BMS_w107, BMS_u029)',
        }}
      />

      <Tabs.Screen
        name="logs"
        options={{
          title: 'CAN Console',
          tabBarLabel: 'CAN Console',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconWrap, focused && styles.tabIconActive]}>
              <Terminal size={18} color={focused ? '#FFFFFF' : color} />
            </View>
          ),
          headerTitle: 'CAN Bus UDS Monitor (Commands & Responses)',
        }}
      />

      {/* Hidden legacy tab routes kept for route compatibility */}
      <Tabs.Screen
        name="reset"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerRightBtn: {
    marginRight: 16,
    padding: 6,
  },
  tabIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: {
    backgroundColor: Theme.colors.primary,
  },
});
