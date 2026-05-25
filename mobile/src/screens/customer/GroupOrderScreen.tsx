// ==========================================
// DEVOLÓN — GroupOrderScreen
//
// Pedido grupal: dos vistas según hay grupo activo o no.
//
// Vista vacía: hero glass + "Crear grupo" + join input + features list.
// Vista activa: hero card amarillo con código pill, lista de miembros
// glass, división de cuenta toggle, items propios y footer sticky de
// estado/ordenar.
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useGroupOrderStore } from '../../store/groupOrderStore';
import { Header, Button } from '../../components/ui';
import {
  colors,
  s,
  radius,
  shadows,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

export default function GroupOrderScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {
    activeGroupOrder,
    createGroupOrder,
    joinGroupOrder,
    leaveGroupOrder,
    setMemberReady,
    lockGroupOrder,
    setSplitMethod,
  } = useGroupOrderStore();

  const [joinCode, setJoinCode] = useState('');
  const restaurantData = route.params?.restaurant;

  const handleCreateGroup = () => {
    if (restaurantData) {
      createGroupOrder(restaurantData.id, restaurantData.name, restaurantData.image);
    } else {
      Alert.alert('Error', 'Selecciona un restaurante primero.');
    }
  };

  const handleJoinGroup = () => {
    if (joinCode.length !== 6) {
      Alert.alert('Error', 'El código debe tener 6 caracteres.');
      return;
    }
    const success = joinGroupOrder(joinCode.toUpperCase(), 'Yo');
    if (success) {
      setJoinCode('');
    } else {
      Alert.alert('Error', 'No se encontró el grupo.');
    }
  };

  const handleShareCode = async () => {
    if (!activeGroupOrder) return;
    try {
      await Share.share({
        message: `Únete a mi pedido grupal en Devolón.\n\nRestaurante: ${activeGroupOrder.restaurantName}\nCódigo: ${activeGroupOrder.code}\n\nDescarga la app: https://devolon.mx`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert('Salir del grupo', '¿Seguro que quieres salir del pedido grupal?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: () => {
          leaveGroupOrder();
          navigation.goBack();
        },
      },
    ]);
  };

  const handleToggleReady = () => {
    if (!activeGroupOrder) return;
    const currentUser = activeGroupOrder.members.find((m) => m.id === 'current-user-id');
    if (currentUser) {
      setMemberReady(currentUser.id, !currentUser.isReady);
    }
  };

  const allMembersReady = activeGroupOrder?.members.every((m) => m.isReady) ?? false;
  const isHost = activeGroupOrder?.hostId === 'current-user-id';
  const currentUserMember = activeGroupOrder?.members.find((m) => m.id === 'current-user-id');

  // ============ VISTA: CREAR / UNIRSE ============
  if (!activeGroupOrder) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Header title="Pedido grupal" eyebrow="DEVOLÓN" />

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO */}
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="people" size={32} color={colors.primary} />
            </View>
            <Text style={styles.heroEyebrow}>COMER JUNTOS</Text>
            <Text style={styles.heroTitle}>Pide con amigos</Text>
            <Text style={styles.heroSubtitle}>
              Crea un pedido grupal y deja que cada quien agregue lo suyo. Divide la cuenta fácilmente.
            </Text>
          </View>

          {restaurantData && (
            <View style={styles.restaurantBanner}>
              <View style={styles.restaurantBannerIcon}>
                <Ionicons name="restaurant" size={18} color={colors.primary} />
              </View>
              <View style={styles.restaurantBannerInfo}>
                <Text style={styles.restaurantBannerEyebrow}>RESTAURANTE</Text>
                <Text style={styles.restaurantBannerName} numberOfLines={1}>
                  {restaurantData.name}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.ctaWrap}>
            <Button
              label="CREAR PEDIDO GRUPAL"
              icon="add-circle"
              iconPosition="left"
              onPress={handleCreateGroup}
              disabled={!restaurantData}
            />
          </View>

          {/* DIVIDER */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* JOIN */}
          <View style={styles.joinBlock}>
            <Text style={styles.joinEyebrow}>UNIRTE A UN GRUPO</Text>
            <View style={styles.joinRow}>
              <TextInput
                style={styles.joinInput}
                placeholder="CÓDIGO"
                placeholderTextColor={colors.textFaint}
                value={joinCode}
                onChangeText={(text) => setJoinCode(text.toUpperCase())}
                maxLength={6}
                autoCapitalize="characters"
                selectionColor={colors.primary}
              />
              <TouchableOpacity
                activeOpacity={0.88}
                style={[
                  styles.joinButton,
                  joinCode.length !== 6 && styles.joinButtonDisabled,
                ]}
                onPress={handleJoinGroup}
                disabled={joinCode.length !== 6}
              >
                <Text style={styles.joinButtonText}>UNIRSE</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* FEATURES */}
          <View style={styles.features}>
            <Text style={styles.featuresEyebrow}>CÓMO FUNCIONA</Text>
            {[
              {
                icon: 'share-social' as const,
                label: 'Comparte el código',
                desc: 'Invita a tus amigos con el código único del grupo.',
              },
              {
                icon: 'restaurant' as const,
                label: 'Cada quien elige',
                desc: 'Todos agregan sus productos favoritos al pedido.',
              },
              {
                icon: 'card' as const,
                label: 'Divide la cuenta',
                desc: 'Paga lo tuyo o divide partes iguales al final.',
              },
            ].map((f, i) => (
              <View key={i} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon} size={18} color={colors.primary} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureLabel}>{f.label}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ============ VISTA: GRUPO ACTIVO ============
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header
        title="Pedido grupal"
        eyebrow="DEVOLÓN"
        rightIcon="exit-outline"
        onRightPress={handleLeaveGroup}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.activeScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* CODE CARD */}
        <View style={styles.codeCard}>
          <View style={styles.codeHeader}>
            <Text style={styles.codeEyebrow}>CÓDIGO DEL GRUPO</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusBadgeText}>
                {activeGroupOrder.status === 'open' ? 'ABIERTO' : 'CERRADO'}
              </Text>
            </View>
          </View>
          <Text style={styles.codeText}>{activeGroupOrder.code}</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.shareButton}
            onPress={handleShareCode}
          >
            <Ionicons name="share-social" size={18} color={colors.onPrimary} />
            <Text style={styles.shareButtonText}>COMPARTIR</Text>
          </TouchableOpacity>
        </View>

        {/* RESTAURANT */}
        <View style={styles.restaurantSection}>
          <View style={styles.restaurantSectionIcon}>
            <Ionicons name="restaurant" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.restaurantSectionEyebrow}>RESTAURANTE</Text>
            <Text style={styles.restaurantSectionName} numberOfLines={1}>
              {activeGroupOrder.restaurantName}
            </Text>
          </View>
        </View>

        {/* SPLIT METHOD */}
        <View style={styles.splitSection}>
          <Text style={styles.splitEyebrow}>DIVISIÓN DE CUENTA</Text>
          <View style={styles.splitOptions}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.splitOption,
                activeGroupOrder.splitMethod === 'individual' && styles.splitOptionActive,
              ]}
              onPress={() => setSplitMethod('individual')}
            >
              <Ionicons
                name="person"
                size={18}
                color={
                  activeGroupOrder.splitMethod === 'individual'
                    ? colors.primary
                    : colors.textMuted
                }
              />
              <Text
                style={[
                  styles.splitOptionText,
                  activeGroupOrder.splitMethod === 'individual' && styles.splitOptionTextActive,
                ]}
              >
                Cada quien lo suyo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.splitOption,
                activeGroupOrder.splitMethod === 'equal' && styles.splitOptionActive,
              ]}
              onPress={() => setSplitMethod('equal')}
            >
              <Ionicons
                name="people"
                size={18}
                color={
                  activeGroupOrder.splitMethod === 'equal' ? colors.primary : colors.textMuted
                }
              />
              <Text
                style={[
                  styles.splitOptionText,
                  activeGroupOrder.splitMethod === 'equal' && styles.splitOptionTextActive,
                ]}
              >
                Partes iguales
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* MEMBERS */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionEyebrow}>
            PARTICIPANTES ({activeGroupOrder.members.length})
          </Text>
          {activeGroupOrder.members.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberInitial}>
                  {member.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <View style={styles.memberHeader}>
                  <Text style={styles.memberName} numberOfLines={1}>
                    {member.name}
                    {member.isHost && <Text style={styles.memberHost}>  · ANFITRIÓN</Text>}
                  </Text>
                  {member.isReady && (
                    <View style={styles.readyBadge}>
                      <Ionicons name="checkmark" size={11} color={colors.bg} />
                      <Text style={styles.readyText}>LISTO</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.memberItems}>
                  {member.items.length} productos · ${member.subtotal.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* MY ITEMS */}
        {currentUserMember && currentUserMember.items.length > 0 && (
          <View style={styles.myItemsSection}>
            <Text style={styles.sectionEyebrow}>MIS PRODUCTOS</Text>
            {currentUserMember.items.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.productName}</Text>
                  <Text style={styles.itemPrice}>
                    ${item.price.toFixed(2)} × {item.quantity}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  ${(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ADD PRODUCTS */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.addProductsButton}
          onPress={() =>
            navigation.navigate('RestaurantDetail', {
              restaurantId: activeGroupOrder.restaurantId,
              groupMode: true,
            })
          }
        >
          <Ionicons name="add" size={20} color={colors.primary} />
          <Text style={styles.addProductsText}>AGREGAR PRODUCTOS</Text>
        </TouchableOpacity>

        {/* SUMMARY */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>TOTAL DEL GRUPO</Text>
            <Text style={styles.summaryValue}>
              ${activeGroupOrder.totalAmount.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>TU PARTE</Text>
            <Text style={styles.summaryValueHighlight}>
              ${currentUserMember?.subtotal.toFixed(2) || '0.00'}
            </Text>
          </View>
        </View>

        <View style={{ height: s['2xl'] }} />
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footerActions}>
        <TouchableOpacity
          activeOpacity={0.88}
          style={[
            styles.readyButton,
            currentUserMember?.isReady && styles.readyButtonActive,
          ]}
          onPress={handleToggleReady}
        >
          <Ionicons
            name={currentUserMember?.isReady ? 'checkmark-circle' : 'checkmark-circle-outline'}
            size={20}
            color={currentUserMember?.isReady ? colors.bg : colors.primary}
          />
          <Text
            style={[
              styles.readyButtonText,
              currentUserMember?.isReady && styles.readyButtonTextActive,
            ]}
          >
            {currentUserMember?.isReady ? '¡LISTO!' : 'ESTOY LISTO'}
          </Text>
        </TouchableOpacity>

        {isHost && (
          <View style={{ flex: 1 }}>
            <Button
              label={allMembersReady ? 'ORDENAR' : 'ESPERANDO…'}
              onPress={() => {
                lockGroupOrder();
                navigation.navigate('Checkout', { groupOrderId: activeGroupOrder.id });
              }}
              disabled={!allMembersReady}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: s.xl,
    paddingTop: s.md,
    paddingBottom: s['3xl'],
  },
  activeScrollContent: {
    paddingTop: s.md,
    paddingBottom: s['2xl'],
  },

  // ============ HERO (empty state) ============
  hero: {
    alignItems: 'center',
    paddingVertical: s.xl,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s.md,
  },
  heroEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  heroTitle: {
    color: colors.text,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.8,
    textAlign: 'center',
    marginTop: s.xs,
  },
  heroSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    marginTop: s.xs,
    lineHeight: 20,
    paddingHorizontal: s.md,
  },

  // ============ RESTAURANT BANNER ============
  restaurantBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: s.md,
    borderRadius: radius.xl,
    marginBottom: s.md,
  },
  restaurantBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantBannerInfo: { flex: 1 },
  restaurantBannerEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  restaurantBannerName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
    marginTop: 2,
  },

  ctaWrap: { marginBottom: s.lg },

  // ============ DIVIDER ============
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: s.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    marginHorizontal: s.sm,
  },

  // ============ JOIN ============
  joinBlock: {},
  joinEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    marginBottom: s.xs,
  },
  joinRow: {
    flexDirection: 'row',
    gap: s.xs,
  },
  joinInput: {
    flex: 1,
    height: 56,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: s.md,
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.wider,
    textAlign: 'center',
  },
  joinButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: s.lg,
    height: 56,
    borderRadius: radius.lg,
    justifyContent: 'center',
    ...shadows.glow,
  },
  joinButtonDisabled: {
    backgroundColor: colors.surfaceStrong,
    opacity: 0.6,
  },
  joinButtonText: {
    color: colors.onPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.widest,
  },

  // ============ FEATURES ============
  features: { marginTop: s['2xl'] },
  featuresEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    marginBottom: s.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: s.sm,
    marginBottom: s.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: { flex: 1 },
  featureLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  featureDesc: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginTop: 2,
    lineHeight: 18,
  },

  // ============ CODE CARD (active group) ============
  codeCard: {
    marginHorizontal: s.xl,
    marginBottom: s.lg,
    padding: s.xl,
    borderRadius: radius['2xl'],
    backgroundColor: colors.primary,
    alignItems: 'center',
    ...shadows.glow,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.xs,
    marginBottom: s.sm,
  },
  codeEyebrow: {
    color: colors.onPrimary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    opacity: 0.7,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: s.xs,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.bg,
  },
  statusBadgeText: {
    color: colors.onPrimary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.wider,
  },
  codeText: {
    color: colors.onPrimary,
    fontSize: 40,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.wider,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.18)',
    paddingHorizontal: s.md,
    paddingVertical: s.xs + 2,
    borderRadius: radius.pill,
    marginTop: s.md,
  },
  shareButtonText: {
    color: colors.onPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.wider,
  },

  // ============ RESTAURANT SECTION ============
  restaurantSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: s.xl,
    padding: s.md,
    borderRadius: radius.xl,
  },
  restaurantSectionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantSectionEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  restaurantSectionName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
    marginTop: 2,
  },

  // ============ SPLIT ============
  splitSection: {
    marginHorizontal: s.xl,
    marginTop: s.lg,
  },
  splitEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    marginBottom: s.xs,
  },
  splitOptions: {
    flexDirection: 'row',
    gap: s.xs,
  },
  splitOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: s.sm,
    borderRadius: radius.xl,
  },
  splitOptionActive: {
    backgroundColor: 'rgba(255,194,14,0.08)',
    borderColor: colors.primary,
  },
  splitOptionText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
  },
  splitOptionTextActive: { color: colors.primary },

  // ============ MEMBERS ============
  membersSection: {
    marginHorizontal: s.xl,
    marginTop: s.lg,
  },
  sectionEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    marginBottom: s.sm,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: s.sm,
    borderRadius: radius.xl,
    marginBottom: s.xs,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitial: {
    color: colors.onPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
  },
  memberInfo: { flex: 1 },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.xs,
  },
  memberName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
    flex: 1,
  },
  memberHost: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.wider,
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  readyText: {
    color: colors.bg,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.wider,
  },
  memberItems: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
  },

  // ============ MY ITEMS ============
  myItemsSection: {
    marginHorizontal: s.xl,
    marginTop: s.lg,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: s.sm,
    borderRadius: radius.xl,
    marginBottom: s.xs,
  },
  itemInfo: { flex: 1 },
  itemName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  itemPrice: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
  },
  itemTotal: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    letterSpacing: -0.3,
  },

  // ============ ADD PRODUCTS ============
  addProductsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: s.xl,
    marginTop: s.md,
    padding: s.md,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255,194,14,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.4)',
    borderStyle: 'dashed',
  },
  addProductsText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.widest,
  },

  // ============ SUMMARY ============
  summaryCard: {
    marginHorizontal: s.xl,
    marginTop: s.lg,
    padding: s.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: s.sm,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  summaryValue: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  summaryValueHighlight: {
    color: colors.primary,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.5,
  },

  // ============ FOOTER ============
  footerActions: {
    flexDirection: 'row',
    gap: s.xs,
    paddingHorizontal: s.xl,
    paddingTop: s.sm,
    paddingBottom: s.sm,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  readyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: s.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  readyButtonActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  readyButtonText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.widest,
  },
  readyButtonTextActive: { color: colors.bg },
});
