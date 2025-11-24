// ==========================================
// PANTALLA DE ESTADO DE CUENTA (ADMIN)
// Todas las ordenes, pagos y comisiones
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../services/api';

type Period = 'today' | 'week' | 'month' | 'custom';

interface FinancialSummary {
  // Ingresos
  totalSales: number;              // Total de ventas
  totalOrders: number;             // Numero de ordenes

  // Comisiones generadas
  restaurantCommissions: number;   // Comision cobrada a restaurantes
  serviceFeesCollected: number;    // Tarifa de servicio cobrada a clientes
  deliveryFeesCollected: number;   // Tarifas de envio

  // Pagos pendientes
  owedToRestaurants: number;       // Lo que debemos a restaurantes
  owedToDrivers: number;           // Lo que debemos a repartidores
  pendingFromDrivers: number;      // Efectivo pendiente de liquidar

  // Ganancia neta
  netProfit: number;

  // Por metodo de pago
  cardPayments: number;
  cashPayments: number;
}

interface Transaction {
  id: string;
  type: 'order' | 'driver_payout' | 'restaurant_payout' | 'driver_settlement' | 'refund';
  orderNumber?: string;
  description: string;
  amount: number;
  fee: number;
  net: number;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod?: 'card' | 'cash';
  restaurant?: string;
  driver?: string;
  customer?: string;
  createdAt: Date;
}

export default function AdminFinanceScreen() {
  const [period, setPeriod] = useState<Period>('today');
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'transactions' | 'pending'>('summary');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      // En produccion estos serian endpoints reales
      const [summaryData, transactionsData] = await Promise.all([
        adminApi.getFinancialSummary(period),
        adminApi.getTransactions(period),
      ]);
      setSummary(summaryData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading financial data:', error);
      // Datos de ejemplo para mostrar la UI
      setSummary({
        totalSales: 45680.50,
        totalOrders: 234,
        restaurantCommissions: 6852.08,
        serviceFeesCollected: 3654.44,
        deliveryFeesCollected: 5850.00,
        owedToRestaurants: 38828.42,
        owedToDrivers: 4680.00,
        pendingFromDrivers: 2340.00,
        netProfit: 8016.52,
        cardPayments: 32500.00,
        cashPayments: 13180.50,
      });
      setTransactions([
        {
          id: '1',
          type: 'order',
          orderNumber: 'QUB-ABC123',
          description: 'Pedido completado',
          amount: 285.00,
          fee: 42.75,
          net: 42.75,
          status: 'completed',
          paymentMethod: 'card',
          restaurant: 'Tacos El Güero',
          driver: 'Juan Pérez',
          customer: 'María García',
          createdAt: new Date(),
        },
        // ... más transacciones
      ]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) =>
    `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleString('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'order': return { icon: 'receipt', color: '#22C55E' };
      case 'driver_payout': return { icon: 'bicycle', color: '#8B5CF6' };
      case 'restaurant_payout': return { icon: 'restaurant', color: '#EC4899' };
      case 'driver_settlement': return { icon: 'cash', color: '#3B82F6' };
      case 'refund': return { icon: 'arrow-undo', color: '#EF4444' };
      default: return { icon: 'help', color: '#666' };
    }
  };

  const renderSummary = () => (
    <ScrollView style={styles.tabContent}>
      {/* Resumen Principal */}
      <View style={styles.mainCard}>
        <Text style={styles.mainCardTitle}>Resumen del Día</Text>
        <Text style={styles.mainCardDate}>
          {new Date().toLocaleDateString('es-MX', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          })}
        </Text>

        <View style={styles.mainStats}>
          <View style={styles.mainStat}>
            <Text style={styles.mainStatLabel}>Ventas Totales</Text>
            <Text style={styles.mainStatValue}>
              {formatCurrency(summary?.totalSales || 0)}
            </Text>
          </View>
          <View style={styles.mainStatDivider} />
          <View style={styles.mainStat}>
            <Text style={styles.mainStatLabel}>Pedidos</Text>
            <Text style={styles.mainStatValue}>{summary?.totalOrders || 0}</Text>
          </View>
        </View>
      </View>

      {/* Ingresos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="trending-up" size={18} color="#22C55E" /> Ingresos
        </Text>
        <View style={styles.financeCard}>
          <View style={styles.financeRow}>
            <Text style={styles.financeLabel}>Comisión restaurantes (15%)</Text>
            <Text style={[styles.financeValue, styles.positive]}>
              +{formatCurrency(summary?.restaurantCommissions || 0)}
            </Text>
          </View>
          <View style={styles.financeRow}>
            <Text style={styles.financeLabel}>Tarifa de servicio (8%)</Text>
            <Text style={[styles.financeValue, styles.positive]}>
              +{formatCurrency(summary?.serviceFeesCollected || 0)}
            </Text>
          </View>
          <View style={styles.financeRow}>
            <Text style={styles.financeLabel}>Parte de envíos</Text>
            <Text style={[styles.financeValue, styles.positive]}>
              +{formatCurrency((summary?.deliveryFeesCollected || 0) * 0.3)}
            </Text>
          </View>
          <View style={[styles.financeRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Ingresos</Text>
            <Text style={[styles.totalValue, styles.positive]}>
              {formatCurrency(
                (summary?.restaurantCommissions || 0) +
                (summary?.serviceFeesCollected || 0) +
                ((summary?.deliveryFeesCollected || 0) * 0.3)
              )}
            </Text>
          </View>
        </View>
      </View>

      {/* Pagos Pendientes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="time" size={18} color="#EAB308" /> Por Pagar
        </Text>
        <View style={styles.financeCard}>
          <View style={styles.financeRow}>
            <Text style={styles.financeLabel}>A restaurantes</Text>
            <Text style={[styles.financeValue, styles.negative]}>
              -{formatCurrency(summary?.owedToRestaurants || 0)}
            </Text>
          </View>
          <View style={styles.financeRow}>
            <Text style={styles.financeLabel}>A repartidores</Text>
            <Text style={[styles.financeValue, styles.negative]}>
              -{formatCurrency(summary?.owedToDrivers || 0)}
            </Text>
          </View>
          <View style={[styles.financeRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total por Pagar</Text>
            <Text style={[styles.totalValue, styles.negative]}>
              {formatCurrency(
                (summary?.owedToRestaurants || 0) +
                (summary?.owedToDrivers || 0)
              )}
            </Text>
          </View>
        </View>
      </View>

      {/* Efectivo Pendiente */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="cash" size={18} color="#FF6B35" /> Efectivo
        </Text>
        <View style={styles.financeCard}>
          <View style={styles.financeRow}>
            <Text style={styles.financeLabel}>Cobrado en efectivo</Text>
            <Text style={styles.financeValue}>
              {formatCurrency(summary?.cashPayments || 0)}
            </Text>
          </View>
          <View style={styles.financeRow}>
            <Text style={styles.financeLabel}>Pendiente de liquidar</Text>
            <Text style={[styles.financeValue, styles.warning]}>
              {formatCurrency(summary?.pendingFromDrivers || 0)}
            </Text>
          </View>
          <View style={styles.financeRow}>
            <Text style={styles.financeLabel}>Cobrado con tarjeta</Text>
            <Text style={styles.financeValue}>
              {formatCurrency(summary?.cardPayments || 0)}
            </Text>
          </View>
        </View>
      </View>

      {/* Ganancia Neta */}
      <View style={styles.profitCard}>
        <View style={styles.profitHeader}>
          <Ionicons name="wallet" size={32} color="#fff" />
          <Text style={styles.profitTitle}>Ganancia Neta</Text>
        </View>
        <Text style={styles.profitValue}>
          {formatCurrency(summary?.netProfit || 0)}
        </Text>
        <Text style={styles.profitSubtext}>
          Después de pagar a restaurantes y repartidores
        </Text>
      </View>
    </ScrollView>
  );

  const renderTransactions = () => (
    <FlatList
      data={transactions}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.transactionsList}
      renderItem={({ item }) => {
        const { icon, color } = getTransactionIcon(item.type);
        return (
          <TouchableOpacity style={styles.transactionCard}>
            <View style={[styles.transactionIcon, { backgroundColor: color + '20' }]}>
              <Ionicons name={icon as any} size={20} color={color} />
            </View>
            <View style={styles.transactionInfo}>
              <View style={styles.transactionHeader}>
                <Text style={styles.transactionTitle}>
                  {item.orderNumber || item.description}
                </Text>
                <Text style={[
                  styles.transactionAmount,
                  item.type === 'refund' ? styles.negative : styles.positive
                ]}>
                  {item.type === 'refund' ? '-' : '+'}
                  {formatCurrency(item.net)}
                </Text>
              </View>
              <Text style={styles.transactionDetails}>
                {item.restaurant && `${item.restaurant} • `}
                {item.paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'}
              </Text>
              <Text style={styles.transactionTime}>
                {formatDate(item.createdAt)}
              </Text>
            </View>
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={48} color="#E5E5E5" />
          <Text style={styles.emptyText}>No hay transacciones</Text>
        </View>
      }
    />
  );

  const renderPending = () => (
    <ScrollView style={styles.tabContent}>
      {/* Liquidaciones Pendientes de Repartidores */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Liquidaciones Pendientes</Text>

        <View style={styles.pendingCard}>
          <View style={styles.pendingHeader}>
            <View style={styles.pendingDriver}>
              <View style={styles.driverAvatar}>
                <Ionicons name="person" size={20} color="#FF6B35" />
              </View>
              <View>
                <Text style={styles.driverName}>Juan Pérez</Text>
                <Text style={styles.driverPhone}>55 1234 5678</Text>
              </View>
            </View>
            <View style={styles.pendingAmount}>
              <Text style={styles.pendingLabel}>Debe</Text>
              <Text style={styles.pendingValue}>$850.00</Text>
            </View>
          </View>
          <View style={styles.pendingDetails}>
            <Text style={styles.pendingDetailText}>
              8 pedidos en efectivo • Último: hace 2 horas
            </Text>
          </View>
          <View style={styles.pendingActions}>
            <TouchableOpacity style={styles.reminderBtn}>
              <Ionicons name="notifications" size={16} color="#FF6B35" />
              <Text style={styles.reminderBtnText}>Recordar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn}>
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={styles.confirmBtnText}>Confirmar Pago</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.pendingCard}>
          <View style={styles.pendingHeader}>
            <View style={styles.pendingDriver}>
              <View style={styles.driverAvatar}>
                <Ionicons name="person" size={20} color="#FF6B35" />
              </View>
              <View>
                <Text style={styles.driverName}>Carlos López</Text>
                <Text style={styles.driverPhone}>55 9876 5432</Text>
              </View>
            </View>
            <View style={styles.pendingAmount}>
              <Text style={styles.pendingLabel}>Debe</Text>
              <Text style={styles.pendingValue}>$420.00</Text>
            </View>
          </View>
          <View style={styles.pendingDetails}>
            <Text style={styles.pendingDetailText}>
              4 pedidos en efectivo • Último: hace 5 horas
            </Text>
          </View>
          <View style={styles.pendingActions}>
            <TouchableOpacity style={styles.reminderBtn}>
              <Ionicons name="notifications" size={16} color="#FF6B35" />
              <Text style={styles.reminderBtnText}>Recordar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn}>
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={styles.confirmBtnText}>Confirmar Pago</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Pagos a Restaurantes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pagos a Restaurantes (Semanal)</Text>

        <View style={styles.payoutCard}>
          <View style={styles.payoutHeader}>
            <Ionicons name="restaurant" size={24} color="#EC4899" />
            <View style={styles.payoutInfo}>
              <Text style={styles.payoutName}>Tacos El Güero</Text>
              <Text style={styles.payoutOrders}>47 pedidos esta semana</Text>
            </View>
            <Text style={styles.payoutAmount}>{formatCurrency(8450.00)}</Text>
          </View>
          <TouchableOpacity style={styles.payoutBtn}>
            <Text style={styles.payoutBtnText}>Marcar como Pagado</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.payoutCard}>
          <View style={styles.payoutHeader}>
            <Ionicons name="restaurant" size={24} color="#EC4899" />
            <View style={styles.payoutInfo}>
              <Text style={styles.payoutName}>Pizzería Roma</Text>
              <Text style={styles.payoutOrders}>32 pedidos esta semana</Text>
            </View>
            <Text style={styles.payoutAmount}>{formatCurrency(6280.00)}</Text>
          </View>
          <TouchableOpacity style={styles.payoutBtn}>
            <Text style={styles.payoutBtnText}>Marcar como Pagado</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Estado de Cuenta</Text>
        <TouchableOpacity style={styles.exportBtn}>
          <Ionicons name="download-outline" size={20} color="#FF6B35" />
          <Text style={styles.exportBtnText}>Exportar</Text>
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['today', 'week', 'month'] as Period[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p === 'today' ? 'Hoy' : p === 'week' ? 'Semana' : 'Mes'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'summary' && styles.tabActive]}
          onPress={() => setActiveTab('summary')}
        >
          <Ionicons
            name="stats-chart"
            size={18}
            color={activeTab === 'summary' ? '#FF6B35' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'summary' && styles.tabTextActive]}>
            Resumen
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'transactions' && styles.tabActive]}
          onPress={() => setActiveTab('transactions')}
        >
          <Ionicons
            name="list"
            size={18}
            color={activeTab === 'transactions' ? '#FF6B35' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'transactions' && styles.tabTextActive]}>
            Movimientos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Ionicons
            name="time"
            size={18}
            color={activeTab === 'pending' ? '#FF6B35' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            Pendientes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'summary' && renderSummary()}
      {activeTab === 'transactions' && renderTransactions()}
      {activeTab === 'pending' && renderPending()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  exportBtnText: {
    color: '#FF6B35',
    fontWeight: '600',
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#FF6B35',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  mainCard: {
    backgroundColor: '#0F172A',
    margin: 16,
    padding: 24,
    borderRadius: 16,
  },
  mainCardTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  mainCardDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  mainStats: {
    flexDirection: 'row',
    marginTop: 24,
  },
  mainStat: {
    flex: 1,
  },
  mainStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  mainStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  mainStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  financeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  financeLabel: {
    fontSize: 14,
    color: '#666',
  },
  financeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  positive: {
    color: '#22C55E',
  },
  negative: {
    color: '#EF4444',
  },
  warning: {
    color: '#EAB308',
  },
  totalRow: {
    borderBottomWidth: 0,
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#F5F5F5',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profitCard: {
    backgroundColor: '#22C55E',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  profitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profitTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  profitValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  profitSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  transactionsList: {
    padding: 16,
  },
  transactionCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  transactionTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  pendingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pendingDriver: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  driverPhone: {
    fontSize: 12,
    color: '#666',
  },
  pendingAmount: {
    alignItems: 'flex-end',
  },
  pendingLabel: {
    fontSize: 12,
    color: '#666',
  },
  pendingValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  pendingDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  pendingDetailText: {
    fontSize: 12,
    color: '#666',
  },
  pendingActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  reminderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
    gap: 6,
  },
  reminderBtnText: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    gap: 6,
  },
  confirmBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  payoutCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  payoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payoutInfo: {
    flex: 1,
    marginLeft: 12,
  },
  payoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  payoutOrders: {
    fontSize: 12,
    color: '#666',
  },
  payoutAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  payoutBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  payoutBtnText: {
    color: '#666',
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    color: '#666',
    marginTop: 12,
  },
});
