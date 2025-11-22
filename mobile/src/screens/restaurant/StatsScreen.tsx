// ==========================================
// PANTALLA DE ESTADISTICAS DEL RESTAURANTE
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { restaurantsApi } from '../../services/api';

const { width } = Dimensions.get('window');

type Period = 'day' | 'week' | 'month';

export default function RestaurantStatsScreen() {
  const [period, setPeriod] = useState<Period>('week');
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    topProducts: [] as { name: string; quantity: number; revenue: number }[],
    revenueByDay: [] as { day: string; revenue: number }[],
  });

  useEffect(() => {
    loadStats();
  }, [period]);

  const loadStats = async () => {
    try {
      const data = await restaurantsApi.getStats(period);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const getMaxRevenue = () => {
    if (!stats.revenueByDay.length) return 1;
    return Math.max(...stats.revenueByDay.map(d => d.revenue));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Estadisticas</Text>
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

        {/* Main Stats */}
        <View style={styles.mainStats}>
          <View style={styles.mainStatCard}>
            <Ionicons name="cash" size={32} color="#22C55E" />
            <Text style={styles.mainStatValue}>{formatCurrency(stats.totalRevenue)}</Text>
            <Text style={styles.mainStatLabel}>Ventas Totales</Text>
          </View>
          <View style={styles.mainStatCard}>
            <Ionicons name="receipt" size={32} color="#FF6B35" />
            <Text style={styles.mainStatValue}>{stats.totalOrders}</Text>
            <Text style={styles.mainStatLabel}>Pedidos</Text>
          </View>
        </View>

        {/* Secondary Stats */}
        <View style={styles.secondaryStats}>
          <View style={styles.secondaryStatCard}>
            <Text style={styles.secondaryStatLabel}>Ticket Promedio</Text>
            <Text style={styles.secondaryStatValue}>
              {formatCurrency(stats.averageOrderValue)}
            </Text>
          </View>
          <View style={styles.secondaryStatCard}>
            <Text style={styles.secondaryStatLabel}>Completados</Text>
            <Text style={[styles.secondaryStatValue, { color: '#22C55E' }]}>
              {stats.completedOrders}
            </Text>
          </View>
          <View style={styles.secondaryStatCard}>
            <Text style={styles.secondaryStatLabel}>Cancelados</Text>
            <Text style={[styles.secondaryStatValue, { color: '#EF4444' }]}>
              {stats.cancelledOrders}
            </Text>
          </View>
        </View>

        {/* Revenue Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ventas por Dia</Text>
          <View style={styles.chartContainer}>
            {stats.revenueByDay.map((day, index) => (
              <View key={index} style={styles.chartBar}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${(day.revenue / getMaxRevenue()) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{day.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Top Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Productos Mas Vendidos</Text>
          {stats.topProducts.length === 0 ? (
            <View style={styles.emptyProducts}>
              <Text style={styles.emptyText}>Sin datos disponibles</Text>
            </View>
          ) : (
            stats.topProducts.map((product, index) => (
              <View key={index} style={styles.productRow}>
                <View style={styles.productRank}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productQuantity}>
                    {product.quantity} vendidos
                  </Text>
                </View>
                <Text style={styles.productRevenue}>
                  {formatCurrency(product.revenue)}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Consejos para Mejorar</Text>
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={24} color="#EAB308" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Agrega mas productos</Text>
              <Text style={styles.tipText}>
                Los restaurantes con mas variedad reciben 30% mas pedidos
              </Text>
            </View>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="camera" size={24} color="#EC4899" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Mejora tus fotos</Text>
              <Text style={styles.tipText}>
                Productos con buenas fotos se venden 2x mas
              </Text>
            </View>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="time" size={24} color="#22C55E" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Responde rapido</Text>
              <Text style={styles.tipText}>
                Acepta pedidos en menos de 2 minutos para mejor ranking
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
  mainStats: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  mainStatCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  mainStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 12,
  },
  mainStatLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  secondaryStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  secondaryStatCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  secondaryStatLabel: {
    fontSize: 12,
    color: '#666',
  },
  secondaryStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 150,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  barContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 8,
  },
  emptyProducts: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  productRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  productQuantity: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  productRevenue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  tipsSection: {
    padding: 16,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
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
