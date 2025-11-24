// ==========================================
// PANTALLA DE PERFIL DEL RESTAURANTE
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { restaurantsApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Restaurant } from '../../types';

export default function RestaurantProfileScreen() {
  const { logout } = useAuthStore();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    name: '',
    description: '',
    phone: '',
    deliveryTime: '',
    minimumOrder: '',
  });

  useEffect(() => {
    loadRestaurant();
  }, []);

  const loadRestaurant = async () => {
    try {
      const data = await restaurantsApi.getMyRestaurant();
      setRestaurant(data);
      setEditedData({
        name: data.name,
        description: data.description,
        phone: data.phone,
        deliveryTime: data.deliveryTime,
        minimumOrder: data.minimumOrder.toString(),
      });
    } catch (error) {
      console.error('Error loading restaurant:', error);
    }
  };

  const handleSave = async () => {
    try {
      await restaurantsApi.updateMyRestaurant({
        ...editedData,
        minimumOrder: parseFloat(editedData.minimumOrder),
      });
      setIsEditing(false);
      loadRestaurant();
      Alert.alert('Exito', 'Datos actualizados');
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar los cambios');
    }
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mi Negocio</Text>
          <TouchableOpacity
            onPress={() => isEditing ? handleSave() : setIsEditing(true)}
          >
            <Text style={styles.editBtn}>{isEditing ? 'Guardar' : 'Editar'}</Text>
          </TouchableOpacity>
        </View>

        {/* Cover Image */}
        <View style={styles.coverContainer}>
          <Image
            source={{ uri: restaurant?.coverImage || 'https://via.placeholder.com/400x200' }}
            style={styles.coverImage}
          />
          {isEditing && (
            <TouchableOpacity style={styles.changeCoverBtn}>
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={styles.changeCoverText}>Cambiar portada</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={{ uri: restaurant?.logo || 'https://via.placeholder.com/100' }}
            style={styles.logo}
          />
          {isEditing && (
            <TouchableOpacity style={styles.changeLogoBtn}>
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Status */}
        <View style={styles.statusContainer}>
          {restaurant?.isApproved ? (
            <View style={styles.approvedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
              <Text style={styles.approvedText}>Negocio Verificado</Text>
            </View>
          ) : (
            <View style={styles.pendingBadge}>
              <Ionicons name="time" size={16} color="#EAB308" />
              <Text style={styles.pendingText}>Pendiente de Aprobacion</Text>
            </View>
          )}
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre del Negocio</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editedData.name}
                onChangeText={(text) => setEditedData({ ...editedData, name: text })}
              />
            ) : (
              <Text style={styles.value}>{restaurant?.name}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripcion</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editedData.description}
                onChangeText={(text) => setEditedData({ ...editedData, description: text })}
                multiline
                numberOfLines={3}
              />
            ) : (
              <Text style={styles.value}>{restaurant?.description}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefono</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editedData.phone}
                onChangeText={(text) => setEditedData({ ...editedData, phone: text })}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.value}>{restaurant?.phone}</Text>
            )}
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Tiempo de Entrega</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={editedData.deliveryTime}
                  onChangeText={(text) => setEditedData({ ...editedData, deliveryTime: text })}
                  placeholder="30-45 min"
                />
              ) : (
                <Text style={styles.value}>{restaurant?.deliveryTime}</Text>
              )}
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>Pedido Minimo</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={editedData.minimumOrder}
                  onChangeText={(text) => setEditedData({ ...editedData, minimumOrder: text })}
                  keyboardType="decimal-pad"
                  placeholder="$0.00"
                />
              ) : (
                <Text style={styles.value}>${restaurant?.minimumOrder}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Tu Rendimiento</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="star" size={24} color="#EAB308" />
              <Text style={styles.statValue}>{restaurant?.rating?.toFixed(1) || '0.0'}</Text>
              <Text style={styles.statLabel}>Calificacion</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="chatbubbles" size={24} color="#3B82F6" />
              <Text style={styles.statValue}>{restaurant?.totalReviews || 0}</Text>
              <Text style={styles.statLabel}>Resenas</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="time-outline" size={24} color="#666" />
            <Text style={styles.menuItemText}>Horarios de Atencion</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="location-outline" size={24} color="#666" />
            <Text style={styles.menuItemText}>Direccion del Negocio</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="card-outline" size={24} color="#666" />
            <Text style={styles.menuItemText}>Metodos de Pago</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="notifications-outline" size={24} color="#666" />
            <Text style={styles.menuItemText}>Notificaciones</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={24} color="#666" />
            <Text style={styles.menuItemText}>Ayuda y Soporte</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          <Text style={styles.logoutText}>Cerrar Sesion</Text>
        </TouchableOpacity>
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
  editBtn: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  coverContainer: {
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#E5E5E5',
  },
  changeCoverBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  changeCoverText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 6,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: -50,
    marginBottom: 16,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#E5E5E5',
  },
  changeLogoBtn: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
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
  },
  pendingText: {
    color: '#EAB308',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  form: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#0F172A',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  value: {
    fontSize: 16,
    color: '#0F172A',
  },
  row: {
    flexDirection: 'row',
  },
  statsSection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
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
});
