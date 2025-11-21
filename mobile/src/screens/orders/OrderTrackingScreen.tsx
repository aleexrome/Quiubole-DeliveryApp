import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from '../../utils/reanimatedShim';
import { colors, spacing, borderRadius, shadows, typography } from '../../utils/theme';

const TRACKING_STEPS = [
  { id: 1, title: 'Pedido confirmado', time: '14:30', completed: true },
  { id: 2, title: 'Preparando tu pedido', time: '14:35', completed: true },
  { id: 3, title: 'En camino', time: '14:50', completed: true },
  { id: 4, title: 'Entregado', time: '', completed: false },
];

const OrderTrackingScreen = ({ navigation, route }: any) => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seguir pedido</Text>
        <View style={styles.headerRight} />
      </View>

      <Animated.View style={styles.content} entering={FadeIn.duration(400)}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapEmoji}>🗺️</Text>
          <Text style={styles.mapText}>Mapa de seguimiento</Text>
        </View>

        <View style={styles.trackingCard}>
          <Text style={styles.etaLabel}>Tiempo estimado</Text>
          <Text style={styles.etaValue}>15-20 min</Text>

          <View style={styles.timeline}>
            {TRACKING_STEPS.map((step, index) => (
              <Animated.View
                key={step.id}
                style={styles.timelineItem}
                entering={FadeInDown.delay(index * 150).duration(400)}
              >
                <View style={styles.timelineLeft}>
                  <View style={[styles.dot, step.completed && styles.dotCompleted]} />
                  {index < TRACKING_STEPS.length - 1 && (
                    <View style={[styles.line, step.completed && styles.lineCompleted]} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.stepTitle, step.completed && styles.stepTitleCompleted]}>
                    {step.title}
                  </Text>
                  {step.time && <Text style={styles.stepTime}>{step.time}</Text>}
                </View>
              </Animated.View>
            ))}
          </View>
        </View>

        <View style={styles.driverCard}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverEmoji}>🚴</Text>
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>Carlos R.</Text>
            <Text style={styles.driverRole}>Tu repartidor</Text>
          </View>
          <TouchableOpacity style={styles.callButton}>
            <Ionicons name="call" size={20} color={colors.textInverse} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg },
  backButton: { width: 40, height: 40, borderRadius: borderRadius.full, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  headerTitle: { ...typography.h3, color: colors.text },
  headerRight: { width: 40 },
  content: { flex: 1, padding: spacing.lg },
  mapPlaceholder: { height: 200, backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.xl, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  mapEmoji: { fontSize: 50 },
  mapText: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },
  trackingCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.lg, ...shadows.md },
  etaLabel: { ...typography.caption, color: colors.textSecondary },
  etaValue: { ...typography.h2, color: colors.primary, marginBottom: spacing.lg },
  timeline: { marginTop: spacing.md },
  timelineItem: { flexDirection: 'row', minHeight: 50 },
  timelineLeft: { alignItems: 'center', width: 24 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.border },
  dotCompleted: { backgroundColor: colors.primary },
  line: { width: 2, flex: 1, backgroundColor: colors.border, marginTop: 4 },
  lineCompleted: { backgroundColor: colors.primary },
  timelineContent: { flex: 1, marginLeft: spacing.md, paddingBottom: spacing.md },
  stepTitle: { ...typography.body, color: colors.textSecondary },
  stepTitleCompleted: { color: colors.text, fontWeight: '600' },
  stepTime: { ...typography.small, color: colors.textLight, marginTop: 2 },
  driverCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.md, ...shadows.md },
  driverAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primaryLight + '20', alignItems: 'center', justifyContent: 'center' },
  driverEmoji: { fontSize: 24 },
  driverInfo: { flex: 1, marginLeft: spacing.md },
  driverName: { ...typography.bodyBold, color: colors.text },
  driverRole: { ...typography.caption, color: colors.textSecondary },
  callButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});

export default OrderTrackingScreen;
