// ==========================================
// DEVOLÓN — Restaurant Profile
// Info del negocio: cover, logo, status, form editable, performance,
// accesos a horarios/dirección y cerrar sesión.
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { restaurantsApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Restaurant } from '../../types';
import { Card, Input, Button } from '../../components/ui';
import {
  colors,
  s,
  radius,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

export default function RestaurantProfileScreen() {
  const navigation = useNavigation<any>();
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
      Alert.alert('Listo', 'Datos actualizados');
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar los cambios');
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: s['4xl'] }}
      >
        {/* ============ HEADER ============ */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.eyebrow}>DEVOLÓN · NEGOCIO</Text>
            <Text style={styles.title}>Mi negocio</Text>
          </View>
          <TouchableOpacity
            onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.editAction}>
              {isEditing ? 'Guardar' : 'Editar'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ============ COVER + LOGO ============ */}
        <View style={styles.coverContainer}>
          <Image
            source={{
              uri:
                restaurant?.coverImage || 'https://via.placeholder.com/400x200',
            }}
            style={styles.coverImage}
          />
          <View style={styles.coverOverlay} />
          {isEditing && (
            <TouchableOpacity style={styles.changeCoverBtn} activeOpacity={0.85}>
              <Ionicons name="camera" size={14} color={colors.text} />
              <Text style={styles.changeCoverText}>Cambiar portada</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.logoContainer}>
          <View style={styles.logoRing}>
            <Image
              source={{
                uri: restaurant?.logo || 'https://via.placeholder.com/100',
              }}
              style={styles.logo}
            />
          </View>
          {isEditing && (
            <TouchableOpacity style={styles.changeLogoBtn} activeOpacity={0.85}>
              <Ionicons name="camera" size={14} color={colors.onPrimary} />
            </TouchableOpacity>
          )}
        </View>

        {/* ============ STATUS BADGE ============ */}
        <View style={styles.statusContainer}>
          {restaurant?.isApproved ? (
            <View style={[styles.statusBadge, styles.statusApproved]}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={colors.success}
              />
              <Text
                style={[styles.statusBadgeText, { color: colors.success }]}
              >
                Negocio verificado
              </Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, styles.statusPending]}>
              <Ionicons name="time" size={14} color={colors.primary} />
              <Text
                style={[styles.statusBadgeText, { color: colors.primary }]}
              >
                Pendiente de aprobación
              </Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          {/* ============ FORM ============ */}
          <Card variant="glass" padding={s.lg} borderRadius={radius.xl} style={styles.formCard}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>NOMBRE DEL NEGOCIO</Text>
              {isEditing ? (
                <Input
                  variant="filled"
                  value={editedData.name}
                  onChangeText={(text) =>
                    setEditedData({ ...editedData, name: text })
                  }
                />
              ) : (
                <Text style={styles.fieldValue}>{restaurant?.name}</Text>
              )}
            </View>

            <View style={styles.fieldDivider} />

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>DESCRIPCIÓN</Text>
              {isEditing ? (
                <Input
                  variant="filled"
                  value={editedData.description}
                  onChangeText={(text) =>
                    setEditedData({ ...editedData, description: text })
                  }
                  multiline
                  numberOfLines={3}
                />
              ) : (
                <Text style={styles.fieldValue}>{restaurant?.description}</Text>
              )}
            </View>

            <View style={styles.fieldDivider} />

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>TELÉFONO</Text>
              {isEditing ? (
                <Input
                  variant="filled"
                  value={editedData.phone}
                  onChangeText={(text) =>
                    setEditedData({ ...editedData, phone: text })
                  }
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.fieldValue}>{restaurant?.phone}</Text>
              )}
            </View>

            <View style={styles.fieldDivider} />

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>TIEMPO ENTREGA</Text>
                {isEditing ? (
                  <Input
                    variant="filled"
                    value={editedData.deliveryTime}
                    onChangeText={(text) =>
                      setEditedData({ ...editedData, deliveryTime: text })
                    }
                    placeholder="30-45 min"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{restaurant?.deliveryTime}</Text>
                )}
              </View>
              <View style={[styles.field, { flex: 1, marginLeft: s.sm }]}>
                <Text style={styles.fieldLabel}>PEDIDO MÍNIMO</Text>
                {isEditing ? (
                  <Input
                    variant="filled"
                    value={editedData.minimumOrder}
                    onChangeText={(text) =>
                      setEditedData({ ...editedData, minimumOrder: text })
                    }
                    keyboardType="decimal-pad"
                    placeholder="$0.00"
                  />
                ) : (
                  <Text style={styles.fieldValue}>${restaurant?.minimumOrder}</Text>
                )}
              </View>
            </View>
          </Card>

          {/* ============ PERFORMANCE ============ */}
          <Text style={styles.sectionEyebrow}>RENDIMIENTO</Text>
          <Text style={styles.sectionTitle}>Tu desempeño</Text>
          <View style={styles.statsGrid}>
            <Card
              variant="glass"
              padding={s.lg}
              borderRadius={radius.xl}
              style={styles.statCard}
            >
              <View style={styles.statIcon}>
                <Ionicons name="star" size={16} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>
                {(Number(restaurant?.rating) || 0).toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>CALIFICACIÓN</Text>
            </Card>
            <Card
              variant="glass"
              padding={s.lg}
              borderRadius={radius.xl}
              style={styles.statCard}
            >
              <View style={[styles.statIcon, styles.statIconInfo]}>
                <Ionicons
                  name="chatbubbles"
                  size={16}
                  color={colors.info}
                />
              </View>
              <Text style={styles.statValue}>
                {restaurant?.totalReviews || 0}
              </Text>
              <Text style={styles.statLabel}>RESEÑAS</Text>
            </Card>
          </View>

          {/* ============ MENU ITEMS ============ */}
          <Text style={[styles.sectionEyebrow, { marginTop: s.xl }]}>
            CONFIGURACIÓN
          </Text>
          <Text style={styles.sectionTitle}>Ajustes del negocio</Text>
          <Card variant="glass" padding={0} borderRadius={radius.xl}>
            <MenuRow
              icon="time-outline"
              label="Horarios de atención"
              onPress={() => navigation.navigate('RestaurantHours')}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="location-outline"
              label="Dirección del negocio"
              onPress={() => navigation.navigate('RestaurantAddress')}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="card-outline"
              label="Métodos de pago"
              onPress={() => navigation.navigate('RestaurantPayments')}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="notifications-outline"
              label="Notificaciones"
              onPress={() => navigation.navigate('RestaurantNotifications')}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="help-circle-outline"
              label="Ayuda y soporte"
              onPress={() => navigation.navigate('RestaurantSupport')}
            />
          </Card>

          {/* ============ LOGOUT ============ */}
          <View style={styles.logoutWrap}>
            <Button
              label="Cerrar sesión"
              variant="danger"
              icon="log-out-outline"
              iconPosition="left"
              onPress={handleLogout}
            />
          </View>

          <View style={styles.versionWrap}>
            <Text style={styles.versionText}>DEVOLÓN · v1.0.0</Text>
            <Text style={styles.versionSubtext}>Hecho en México</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.menuRow}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // ============ HEADER ============
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s.xl,
    paddingTop: s.sm,
    paddingBottom: s.md,
  },
  headerLeft: { flex: 1 },
  eyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  title: {
    color: colors.text,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.6,
    marginTop: 2,
  },
  editAction: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },

  // ============ COVER ============
  coverContainer: {
    position: 'relative',
    marginHorizontal: s.xl,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  coverImage: {
    width: '100%',
    height: 140,
    backgroundColor: colors.bgRaised,
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  changeCoverBtn: {
    position: 'absolute',
    bottom: s.sm,
    right: s.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.overlay,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: s.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  changeCoverText: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },

  // ============ LOGO ============
  logoContainer: {
    alignItems: 'center',
    marginTop: -42,
    marginBottom: s.sm,
  },
  logoRing: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    borderWidth: 3,
    borderColor: colors.bg,
    backgroundColor: colors.bg,
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.bgRaised,
  },
  changeLogoBtn: {
    position: 'absolute',
    bottom: 0,
    right: '38%',
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ============ STATUS BADGE ============
  statusContainer: {
    alignItems: 'center',
    marginBottom: s.lg,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: s.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  statusApproved: {
    backgroundColor: 'rgba(31,174,111,0.12)',
    borderColor: 'rgba(31,174,111,0.32)',
  },
  statusPending: {
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderColor: 'rgba(255,194,14,0.32)',
  },
  statusBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },

  // ============ BODY ============
  body: {
    paddingHorizontal: s.xl,
  },

  // ============ FORM ============
  formCard: {
    marginBottom: s.xl,
  },
  field: {
    marginBottom: 0,
  },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    marginBottom: s.xs,
  },
  fieldValue: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    lineHeight: 20,
  },
  fieldDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: s.md,
  },
  row: {
    flexDirection: 'row',
  },

  // ============ SECTION ============
  sectionEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.4,
    marginTop: 2,
    marginBottom: s.md,
  },

  // ============ STATS ============
  statsGrid: {
    flexDirection: 'row',
    gap: s.sm,
  },
  statCard: {
    flex: 1,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconInfo: {
    backgroundColor: 'rgba(46,144,250,0.12)',
    borderColor: 'rgba(46,144,250,0.32)',
  },
  statValue: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.3,
    marginTop: s.sm,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
    marginTop: 2,
  },

  // ============ MENU ROWS ============
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: s.md,
    paddingHorizontal: s.md,
    gap: s.sm,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: s.md,
  },

  // ============ LOGOUT ============
  logoutWrap: {
    marginTop: s.xl,
  },

  // ============ VERSION ============
  versionWrap: {
    alignItems: 'center',
    paddingVertical: s.xl,
  },
  versionText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  versionSubtext: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
});
