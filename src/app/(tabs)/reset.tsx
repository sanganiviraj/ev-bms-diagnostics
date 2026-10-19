import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Theme } from '../../theme';
import { SimulatedBanner } from '../../components/SimulatedBanner';
import { QuickActionPills } from '../../components/QuickActionPills';
import { ResetWorkflowCard } from '../../components/ResetWorkflowCard';

export default function BmsResetScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SimulatedBanner />
      <QuickActionPills activeTab="reset" />
      <ResetWorkflowCard />
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
});
