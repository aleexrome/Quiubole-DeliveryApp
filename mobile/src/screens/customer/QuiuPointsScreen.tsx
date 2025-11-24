// ==========================================
// QUIUPOINTS SCREEN - PROGRAMA DE LEALTAD
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { usePointsStore, AVAILABLE_REWARDS } from '../../store/pointsStore';

const COLORS = {
  primary: '#FF6B35',
  secondary: '#2E4057',
  background: '#F8F9FA',
  white: '#FFFFFF',
  gray: '#6C757D',
  lightGray: '#E9ECEF',
  text: '#212529',
  gold: '#FFD700',
  success: '#4CAF50',
};

export default function QuiuPointsScreen() {
  const navigation = useNavigation<any>();
  const { totalPoints, lifetimePoints, transactions, redeemedRewards, redeemReward, getAvailableRewards } = usePointsStore();

  const [activeTab, setActiveTab] = useState<'rewards' | 'history' | 'available'>('rewards');
  const availableUserRewards = getAvailableRewards();

  const handleRedeemReward = (reward: typeof AVAILABLE_REWARDS[0]) => {
    if (totalPoints < reward.pointsCost) {
      Alert.alert(
        'Puntos insuficientes',
        `Necesitas ${reward.pointsCost - totalPoints} puntos mas para canjear esta recompensa`
      );
      return;
    }

    Alert.alert(
      'Canjear recompensa',
      `Quieres canjear "${reward.name}" por ${reward.pointsCost} puntos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Canjear',
          onPress: () => {
            const result = redeemReward(reward);
            if (result) {
              Alert.alert(
                'Recompensa canjeada!',
                `Tu codigo es: ${result.code}\n\nUsalo en tu proximo pedido. Expira en ${reward.expiresInDays} dias.`
              );
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderRewardCard = (reward: typeof AVAILABLE_REWARDS[0]) => {
    const canRedeem = totalPoints >= reward.pointsCost;
    return (
      <TouchableOpacity
        key={reward.id}
        style={[styles.rewardCard, !canRedeem && styles.rewardCardDisabled]}
        onPress={() => handleRedeemReward(reward)}
        disabled={!canRedeem}
      >
        <View style={styles.rewardIcon}>
          <Text style={styles.rewardEmoji}>{reward.icon}</Text>
        </View>
        <View style={styles.rewardInfo}>
          <Text style={styles.rewardName}>{reward.name}</Text>
          <Text style={styles.rewardDescription}>{reward.description}</Text>
        </View>
        <View style={styles.rewardCost}>
          <Text style={[styles.rewardPoints, !canRedeem && styles.rewardPointsDisabled]}>
            {reward.pointsCost}
          </Text>
          <Text style={styles.rewardPtsLabel}>pts</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTransaction = ({ item }: { item: typeof transactions[0] }) => (
    <View style={styles.transactionItem}>
      <View style={[styles.transactionIcon, item.type === 'earn' ? styles.earnIcon : styles.redeemIcon]}>
        <Ionicons
          name={item.type === 'earn' ? 'add' : 'gift'}
          size={16}
          color={item.type === 'earn' ? COLORS.success : COLORS.primary}
        />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDesc}>{item.description}</Text>
        <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <Text style={[styles.transactionAmount, item.type === 'earn' ? styles.earnAmount : styles.redeemAmount]}>
        {item.type === 'earn' ? '+' : ''}{item.amount}
      </Text>
    </View>
  );

  const renderAvailableReward = ({ item }: { item: typeof availableUserRewards[0] }) => (
    <View style={styles.availableRewardCard}>
      <View style={styles.availableRewardHeader}>
        <Text style={styles.availableRewardEmoji}>{item.reward.icon}</Text>
        <View style={styles.availableRewardInfo}>
          <Text style={styles.availableRewardName}>{item.reward.name}</Text>
          <Text style={styles.availableRewardDesc}>{item.reward.description}</Text>
        </View>
      </View>
      <View style={styles.codeContainer}>
        <Text style={styles.codeLabel}>Tu codigo:</Text>
        <Text style={styles.codeText}>{item.code}</Text>
      </View>
      <Text style={styles.expiresText}>Expira: {formatDate(item.expiresAt)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QuiuPoints</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Points Card */}
      <View style={styles.pointsCard}>
        <View style={styles.pointsCardContent}>
          <Text style={styles.pointsLabel}>Tus puntos</Text>
          <View style={styles.pointsRow}>
            <Ionicons name="star" size={32} color={COLORS.gold} />
            <Text style={styles.pointsValue}>{totalPoints.toLocaleString()}</Text>
          </View>
          <Text style={styles.lifetimeText}>
            Total acumulado: {lifetimePoints.toLocaleString()} pts
          </Text>
        </View>
        <View style={styles.pointsInfo}>
          <Text style={styles.pointsInfoText}>Gana 1 punto por cada $10</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rewards' && styles.tabActive]}
          onPress={() => setActiveTab('rewards')}
        >
          <Text style={[styles.tabText, activeTab === 'rewards' && styles.tabTextActive]}>Canjear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.tabActive]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, activeTab === 'available' && styles.tabTextActive]}>
            Mis cupones ({availableUserRewards.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>Historial</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'rewards' && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Recompensas disponibles</Text>
          {AVAILABLE_REWARDS.map(renderRewardCard)}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {activeTab === 'available' && (
        <FlatList
          data={availableUserRewards}
          keyExtractor={item => item.id}
          renderItem={renderAvailableReward}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="gift-outline" size={64} color={COLORS.lightGray} />
              <Text style={styles.emptyTitle}>Sin cupones</Text>
              <Text style={styles.emptySubtitle}>Canjea tus puntos por recompensas</Text>
            </View>
          }
        />
      )}

      {activeTab === 'history' && (
        <FlatList
          data={transactions}
          keyExtractor={item => item.id}
          renderItem={renderTransaction}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color={COLORS.lightGray} />
              <Text style={styles.emptyTitle}>Sin historial</Text>
              <Text style={styles.emptySubtitle}>Tus puntos ganados y canjeados apareceran aqui</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  pointsCard: {
    backgroundColor: COLORS.primary,
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  pointsCardContent: { padding: 24, alignItems: 'center' },
  pointsLabel: { fontSize: 14, color: COLORS.white, opacity: 0.9 },
  pointsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  pointsValue: { fontSize: 48, fontWeight: '700', color: COLORS.white },
  lifetimeText: { fontSize: 12, color: COLORS.white, opacity: 0.8, marginTop: 8 },
  pointsInfo: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 12, alignItems: 'center' },
  pointsInfoText: { fontSize: 13, color: COLORS.white },
  tabs: { flexDirection: 'row', backgroundColor: COLORS.white, paddingHorizontal: 16 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  tabTextActive: { color: COLORS.primary },
  content: { flex: 1, padding: 16 },
  listContent: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  rewardCardDisabled: { opacity: 0.5 },
  rewardIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center' },
  rewardEmoji: { fontSize: 24 },
  rewardInfo: { flex: 1, marginLeft: 12 },
  rewardName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  rewardDescription: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  rewardCost: { alignItems: 'center' },
  rewardPoints: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  rewardPointsDisabled: { color: COLORS.gray },
  rewardPtsLabel: { fontSize: 10, color: COLORS.gray },
  availableRewardCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  availableRewardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  availableRewardEmoji: { fontSize: 32 },
  availableRewardInfo: { marginLeft: 12 },
  availableRewardName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  availableRewardDesc: { fontSize: 12, color: COLORS.gray },
  codeContainer: { backgroundColor: COLORS.lightGray, borderRadius: 8, padding: 12, alignItems: 'center' },
  codeLabel: { fontSize: 11, color: COLORS.gray },
  codeText: { fontSize: 20, fontWeight: '700', color: COLORS.primary, letterSpacing: 2, marginTop: 4 },
  expiresText: { fontSize: 11, color: COLORS.gray, textAlign: 'center', marginTop: 8 },
  transactionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  transactionIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  earnIcon: { backgroundColor: `${COLORS.success}20` },
  redeemIcon: { backgroundColor: `${COLORS.primary}20` },
  transactionInfo: { flex: 1, marginLeft: 12 },
  transactionDesc: { fontSize: 14, color: COLORS.text },
  transactionDate: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  transactionAmount: { fontSize: 16, fontWeight: '700' },
  earnAmount: { color: COLORS.success },
  redeemAmount: { color: COLORS.primary },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: COLORS.gray, marginTop: 8, textAlign: 'center' },
});
