// ==========================================
// PANTALLA DE GANANCIAS DEL REPARTIDOR
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { driverApi } from '../../services/api';

type Period = 'day' | 'week' | 'month';

interface DeliveryHistory {
  id: string;
  orderNumber: string;
  restaurantName: string;
  customerName: string;
  earnings: number;
  tip: number;
  distance: number;
  completedAt: Date;
}

export default function DriverEarningsScreen() {
  const [period, setPeriod] = useState<Period>('week');
  const [earnings, setEarnings] = useState({
    total: 0,
    deliveryFees: 0,
    tips: 0,
    bonus: 0,
    deliveries: 0,
    avgPerDelivery: 0,
    pendingPayout: 0,
  });
  const [history, setHistory] = useState<DeliveryHistory[]>([]);

  useEffect(() => {
    loadEarnings();
    loadHistory();
  }, [period]);

  const loadEarnings = async () => {
    try {
      const data = await driverApi.getEarnings(period);
      setEarnings(data);
    } catch (error) {
      console.error('Error loading earnings:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await driverApi.getDeliveryHistory(1);
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderHistoryItem = ({ item }: { item: DeliveryHistory }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyIcon}>
        <Ionicons name="bicycle" size={20} color="#FF6B35" />
      </View>
      <View style={styles.historyInfo}>
        <Text style={styles.historyRestaurant}>{item.restaurantName}</Text>
        <Text style={styles.historyDetails}>
          #{item.orderNumber} - {item.distance.toFixed(1)}km
        </Text>
        <Text style={styles.historyDate}>{formatDate(item.completedAt)}</Text>
      </View>
      <View style={styles.historyEarnings}>
        <Text style={styles.historyTotal}>{formatCurrency(item.earnings + item.tip)}</Text>
        {item.tip > 0 && (
          <Text style={styles.historyTip}>+{formatCurrency(item.tip)} propina</Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Ganancias</Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['day', 'week', 'month'] as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p === 'day' ? 'Hoy' : p === 'week' ? 'Semana' : 'Mes'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main Earnings Card */}
        <View style={styles.mainCard}>
          <Text style={styles.mainLabel}>Ganancias Totales</Text>
          <Text style={styles.mainValue}>{formatCurrency(earnings.total)}</Text>
          <View style={styles.mainStats}>
            <View style={styles.mainStat}>
              <Text style={styles.mainStatValue}>{earnings.deliveries}</Text>
              <Text style={styles.mainStatLabel}>Entregas</Text>
            </View>
            <View style={styles.mainStatDivider} />
            <View style={styles.mainStat}>
              <Text style={styles.mainStatValue}>{formatCurrency(earnings.avgPerDelivery)}</Text>
              <Text style={styles.mainStatLabel}>Promedio</Text>
            </View>
          </View>
        </View>

        {/* Earnings Breakdown */}
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Desglose</Text>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.breakdownDot, { backgroundColor: '#FF6B35' }]} />
              <Text style={styles.breakdownLabel}>Tarifas de entrega</Text>
            </View>
            <Text style={styles.breakdownValue}>{formatCurrency(earnings.deliveryFees)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.breakdownDot, { backgroundColor: '#22C55E' }]} />
              <Text style={styles.breakdownLabel}>Propinas</Text>
            </View>
            <Text style={styles.breakdownValue}>{formatCurrency(earnings.tips)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.breakdownDot, { backgroundColor: '#8B5CF6' }]} />
              <Text style={styles.breakdownLabel}>Bonos</Text>
            </View>
            <Text style={styles.breakdownValue}>{formatCurrency(earnings.bonus)}</Text>
          </View>
        </View>

        {/* Pending Payout */}
        <View style={styles.payoutCard}>
          <View style={styles.payoutInfo}>
            <Ionicons name="wallet" size={24} color="#FF6B35" />
            <View style={styles.payoutText}>
              <Text style={styles.payoutLabel}>Pago pendiente</Text>
              <Text style={styles.payoutValue}>{formatCurrency(earnings.pendingPayout)}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.payoutBtn}>
            <Text style={styles.payoutBtnText}>Ver detalles</Text>
          </TouchableOpacity>
        </View>

        {/* History */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Historial de Entregas</Text>
          {history.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Ionicons name="bicycle-outline" size={48} color="#E5E5E5" />
              <Text style={styles.emptyText}>No hay entregas todavia</Text>
            </View>
          ) : (
            <FlatList
              data={history}
              renderItem={renderHistoryItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Gana mas</Text>
          <View style={styles.tipCard}>
            <Ionicons name="time" size={24} color="#FF6B35" />
            <View style={styles.tipContent}>
              <Text style={styles.tipHeader}>Horas pico</Text>
              <Text style={styles.tipText}>
                12:00-14:00 y 19:00-21:00 tienen mas pedidos
              </Text>
            </View>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="star" size={24} color="#EAB308" />
            <View style={styles.tipContent}>
              <Text style={styles.tipHeader}>Buen servicio = mas propinas</Text>
              <Text style={styles.tipText}>
                Entrega rapido y con buena actitud para recibir mejores propinas
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: '#FF6B35',
  },
  periodText: {
    fontSize: 14,
    color: '#666',
  },
  periodTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  mainCard: {
    backgroundColor: '#FF6B35',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  mainLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  mainValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  mainStats: {
    flexDirection: 'row',
    marginTop: 24,
    width: '100%',
  },
  mainStat: {
    flex: 1,
    alignItems: 'center',
  },
  mainStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  mainStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  mainStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  breakdownCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666',
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  payoutCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  payoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payoutText: {
    marginLeft: 12,
  },
  payoutLabel: {
    fontSize: 12,
    color: '#666',
  },
  payoutValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  payoutBtn: {
    backgroundColor: '#FFF5F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  payoutBtnText: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  historySection: {
    padding: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  historyRestaurant: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  historyDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  historyDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  historyEarnings: {
    alignItems: 'flex-end',
  },
  historyTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  historyTip: {
    fontSize: 10,
    color: '#22C55E',
    marginTop: 2,
  },
  emptyHistory: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyText: {
    color: '#666',
    marginTop: 12,
  },
  tipsSection: {
    padding: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  tipText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
