// ==========================================
// PERFIL DEL REPARTIDOR
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { Driver } from '../../types';

export default function DriverProfileScreen() {
  const { user, logout } = useAuthStore();
  const driver = user as Driver;

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

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

  const vehicleIcons: Record<string, string> = {
    bicycle: 'bicycle',
    motorcycle: 'speedometer',
    car: 'car',
  };

  const vehicleNames: Record<string, string> = {
    bicycle: 'Bicicleta',
    motorcycle: 'Motocicleta',
    car: 'Automovil',
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mi Perfil</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image
            source={{ uri: driver?.avatar || 'https://via.placeholder.com/100' }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{driver?.name}</Text>
          <Text style={styles.email}>{driver?.email}</Text>

          {driver?.isApproved ? (
            <View style={styles.approvedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
              <Text style={styles.approvedText}>Repartidor Verificado</Text>
            </View>
          ) : (
            <View style={styles.pendingBadge}>
              <Ionicons name="time" size={16} color="#EAB308" />
              <Text style={styles.pendingText}>En revision</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="star" size={24} color="#EAB308" />
            <Text style={styles.statValue}>{driver?.rating?.toFixed(1) || '0.0'}</Text>
            <Text style={styles.statLabel}>Calificacion</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="bicycle" size={24} color="#FF6B35" />
            <Text style={styles.statValue}>{driver?.totalDeliveries || 0}</Text>
            <Text style={styles.statLabel}>Entregas</Text>
          </View>
        </View>

        {/* Vehicle Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mi Vehiculo</Text>
          <View style={styles.vehicleCard}>
            <Ionicons
              name={vehicleIcons[driver?.vehicleType || 'bicycle'] as any}
              size={32}
              color="#FF6B35"
            />
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleType}>
                {vehicleNames[driver?.vehicleType || 'bicycle']}
              </Text>
              {driver?.vehiclePlate && (
                <Text style={styles.vehiclePlate}>{driver.vehiclePlate}</Text>
              )}
            </View>
            <TouchableOpacity>
              <Ionicons name="chevron-forward" size={24} color="#ccc" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis Documentos</Text>
          <View style={styles.documentsGrid}>
            {[
              { key: 'idCard', label: 'INE', icon: 'card' },
              { key: 'driverLicense', label: 'Licencia', icon: 'document' },
              { key: 'vehicleCard', label: 'Tarjeta Circulacion', icon: 'car' },
              { key: 'proofOfAddress', label: 'Comprobante Domicilio', icon: 'home' },
            ].map((doc) => (
              <TouchableOpacity key={doc.key} style={styles.documentCard}>
                <Ionicons name={doc.icon as any} size={24} color="#FF6B35" />
                <Text style={styles.documentLabel}>{doc.label}</Text>
                <Ionicons
                  name={driver?.documents?.[doc.key as keyof typeof driver.documents] ? 'checkmark-circle' : 'cloud-upload'}
                  size={16}
                  color={driver?.documents?.[doc.key as keyof typeof driver.documents] ? '#22C55E' : '#666'}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuracion</Text>
          <View style={styles.settingsList}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications" size={24} color="#666" />
                <Text style={styles.settingLabel}>Notificaciones</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#E5E5E5', true: '#FF6B35' }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="volume-high" size={24} color="#666" />
                <Text style={styles.settingLabel}>Sonido de pedidos</Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: '#E5E5E5', true: '#FF6B35' }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="card-outline" size={24} color="#666" />
            <Text style={styles.menuItemText}>Metodos de Pago</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#666" />
            <Text style={styles.menuItemText}>Seguro y Beneficios</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={24} color="#666" />
            <Text style={styles.menuItemText}>Centro de Ayuda</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="document-text-outline" size={24} color="#666" />
            <Text style={styles.menuItemText}>Terminos y Condiciones</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          <Text style={styles.logoutText}>Cerrar Sesion</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>Quiubole! Repartidor v1.0.0</Text>
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
  profileCard: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E5E5',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 12,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  approvedText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEFCE8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  pendingText: {
    color: '#EAB308',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: 12,
  },
  vehicleType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  vehiclePlate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  documentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  documentCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  documentLabel: {
    fontSize: 12,
    color: '#0F172A',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  settingsList: {
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: '#0F172A',
    marginLeft: 12,
  },
  menuSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    marginLeft: 12,
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
