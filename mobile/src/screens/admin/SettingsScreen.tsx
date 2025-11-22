// ==========================================
// CONFIGURACION (ADMIN)
// ==========================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

export default function AdminSettingsScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesion',
      '¿Estas seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesion', style: 'destructive', onPress: logout },
      ]
    );
  };

  const settingsSections = [
    {
      title: 'General',
      items: [
        { icon: 'business', label: 'Informacion del negocio', screen: 'BusinessInfo' },
        { icon: 'location', label: 'Zonas de cobertura', screen: 'CoverageZones' },
        { icon: 'time', label: 'Horarios de operacion', screen: 'OperatingHours' },
      ],
    },
    {
      title: 'Finanzas',
      items: [
        { icon: 'cash', label: 'Comisiones', screen: 'Commissions' },
        { icon: 'card', label: 'Metodos de pago', screen: 'PaymentMethods' },
        { icon: 'wallet', label: 'Payouts a repartidores', screen: 'DriverPayouts' },
      ],
    },
    {
      title: 'Promociones',
      items: [
        { icon: 'pricetag', label: 'Cupones y codigos', screen: 'Coupons' },
        { icon: 'gift', label: 'Promociones activas', screen: 'Promotions' },
        { icon: 'people', label: 'Programa de referidos', screen: 'Referrals' },
      ],
    },
    {
      title: 'Notificaciones',
      items: [
        { icon: 'notifications', label: 'Push notifications', screen: 'PushNotifications' },
        { icon: 'mail', label: 'Email templates', screen: 'EmailTemplates' },
        { icon: 'chatbubbles', label: 'SMS/WhatsApp', screen: 'SmsSettings' },
      ],
    },
    {
      title: 'Sistema',
      items: [
        { icon: 'shield-checkmark', label: 'Seguridad', screen: 'Security' },
        { icon: 'analytics', label: 'Reportes automaticos', screen: 'AutoReports' },
        { icon: 'cloud-upload', label: 'Backups', screen: 'Backups' },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Configuracion</Text>
        </View>

        {/* Admin Info */}
        <View style={styles.adminCard}>
          <View style={styles.adminAvatar}>
            <Ionicons name="person" size={32} color="#FF6B35" />
          </View>
          <View style={styles.adminInfo}>
            <Text style={styles.adminName}>{user?.name}</Text>
            <Text style={styles.adminRole}>Administrador</Text>
          </View>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#22C55E" />
          </View>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex < section.items.length - 1 && styles.settingItemBorder,
                  ]}
                >
                  <View style={styles.settingLeft}>
                    <View style={styles.settingIcon}>
                      <Ionicons name={item.icon as any} size={20} color="#FF6B35" />
                    </View>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado del Sistema</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statDot, { backgroundColor: '#22C55E' }]} />
              <Text style={styles.statLabel}>API</Text>
              <Text style={styles.statValue}>Online</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statDot, { backgroundColor: '#22C55E' }]} />
              <Text style={styles.statLabel}>Base de datos</Text>
              <Text style={styles.statValue}>Online</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statDot, { backgroundColor: '#22C55E' }]} />
              <Text style={styles.statLabel}>Pagos</Text>
              <Text style={styles.statValue}>Activo</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statDot, { backgroundColor: '#22C55E' }]} />
              <Text style={styles.statLabel}>Push</Text>
              <Text style={styles.statValue}>Activo</Text>
            </View>
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Soporte</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.supportItem}>
              <Ionicons name="help-circle" size={24} color="#3B82F6" />
              <View style={styles.supportInfo}>
                <Text style={styles.supportTitle}>Centro de ayuda</Text>
                <Text style={styles.supportText}>Documentacion y guias</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.supportItem}>
              <Ionicons name="chatbubbles" size={24} color="#22C55E" />
              <View style={styles.supportInfo}>
                <Text style={styles.supportTitle}>Soporte tecnico</Text>
                <Text style={styles.supportText}>Contactar equipo</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          <Text style={styles.logoutText}>Cerrar Sesion</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>Quiubole! Admin v1.0.0</Text>
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
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 1,
  },
  adminAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminInfo: {
    flex: 1,
    marginLeft: 12,
  },
  adminName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  adminRole: {
    fontSize: 14,
    color: '#666',
  },
  adminBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: '#fff',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#0F172A',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    padding: 8,
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 4,
  },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  supportInfo: {
    marginLeft: 12,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  supportText: {
    fontSize: 14,
    color: '#666',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  version: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginBottom: 32,
  },
});
