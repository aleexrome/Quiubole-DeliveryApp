// ==========================================
// GROUP ORDER SCREEN - PEDIDO GRUPAL
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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useGroupOrderStore } from '../../store/groupOrderStore';

const COLORS = {
  primary: '#FF6B35',
  secondary: '#2E4057',
  background: '#F8F9FA',
  white: '#FFFFFF',
  gray: '#6C757D',
  lightGray: '#E9ECEF',
  text: '#212529',
  success: '#4CAF50',
  warning: '#FFC107',
};

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
  const [showJoinModal, setShowJoinModal] = useState(false);
  const restaurantData = route.params?.restaurant;

  const handleCreateGroup = () => {
    if (restaurantData) {
      createGroupOrder(
        restaurantData.id,
        restaurantData.name,
        restaurantData.image
      );
    } else {
      Alert.alert('Error', 'Selecciona un restaurante primero');
    }
  };

  const handleJoinGroup = () => {
    if (joinCode.length !== 6) {
      Alert.alert('Error', 'El codigo debe tener 6 caracteres');
      return;
    }
    const success = joinGroupOrder(joinCode.toUpperCase(), 'Yo');
    if (success) {
      setShowJoinModal(false);
      setJoinCode('');
    } else {
      Alert.alert('Error', 'No se encontro el grupo');
    }
  };

  const handleShareCode = async () => {
    if (!activeGroupOrder) return;
    try {
      await Share.share({
        message: `Unete a mi pedido grupal en Quiubole!\n\nRestaurante: ${activeGroupOrder.restaurantName}\nCodigo: ${activeGroupOrder.code}\n\nDescarga la app: https://quiubole.mx`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      'Salir del grupo',
      'Seguro que quieres salir del pedido grupal?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: () => {
            leaveGroupOrder();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleToggleReady = () => {
    if (!activeGroupOrder) return;
    const currentUser = activeGroupOrder.members.find(
      (m) => m.id === 'current-user-id'
    );
    if (currentUser) {
      setMemberReady(currentUser.id, !currentUser.isReady);
    }
  };

  const allMembersReady =
    activeGroupOrder?.members.every((m) => m.isReady) ?? false;
  const isHost = activeGroupOrder?.hostId === 'current-user-id';
  const currentUserMember = activeGroupOrder?.members.find(
    (m) => m.id === 'current-user-id'
  );

  // Vista para crear o unirse a un grupo
  if (!activeGroupOrder) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pedido Grupal</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.heroSection}>
            <View style={styles.heroIcon}>
              <Ionicons name="people" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.heroTitle}>Pide con amigos!</Text>
            <Text style={styles.heroSubtitle}>
              Crea un pedido grupal y deja que cada quien agregue lo suyo. Divide
              la cuenta facilmente.
            </Text>
          </View>

          {restaurantData && (
            <View style={styles.restaurantCard}>
              <Ionicons name="restaurant" size={24} color={COLORS.primary} />
              <View style={styles.restaurantInfo}>
                <Text style={styles.restaurantName}>{restaurantData.name}</Text>
                <Text style={styles.restaurantLabel}>Restaurante seleccionado</Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.actionButton, !restaurantData && styles.disabledButton]}
            onPress={handleCreateGroup}
            disabled={!restaurantData}
          >
            <Ionicons name="add-circle" size={24} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Crear pedido grupal</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.joinSection}>
            <Text style={styles.joinTitle}>Unirte a un grupo existente</Text>
            <View style={styles.joinInputContainer}>
              <TextInput
                style={styles.joinInput}
                placeholder="Codigo de 6 digitos"
                placeholderTextColor={COLORS.gray}
                value={joinCode}
                onChangeText={(text) => setJoinCode(text.toUpperCase())}
                maxLength={6}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[
                  styles.joinButton,
                  joinCode.length !== 6 && styles.joinButtonDisabled,
                ]}
                onPress={handleJoinGroup}
                disabled={joinCode.length !== 6}
              >
                <Text style={styles.joinButtonText}>Unirse</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.features}>
            <Text style={styles.featuresTitle}>Como funciona</Text>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="share-social" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureLabel}>Comparte el codigo</Text>
                <Text style={styles.featureDesc}>
                  Invita a tus amigos con el codigo unico
                </Text>
              </View>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="restaurant" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureLabel}>Cada quien elige</Text>
                <Text style={styles.featureDesc}>
                  Todos agregan sus productos favoritos
                </Text>
              </View>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="card" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureLabel}>Divide la cuenta</Text>
                <Text style={styles.featureDesc}>
                  Paga lo tuyo o divide partes iguales
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Vista del pedido grupal activo
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pedido Grupal</Text>
        <TouchableOpacity onPress={handleLeaveGroup}>
          <Ionicons name="exit-outline" size={24} color={COLORS.gray} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Code Card */}
        <View style={styles.codeCard}>
          <View style={styles.codeHeader}>
            <Text style={styles.codeLabel}>Codigo del grupo</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {activeGroupOrder.status === 'open' ? 'Abierto' : 'Cerrado'}
              </Text>
            </View>
          </View>
          <Text style={styles.codeText}>{activeGroupOrder.code}</Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShareCode}>
            <Ionicons name="share-social" size={20} color={COLORS.white} />
            <Text style={styles.shareButtonText}>Compartir</Text>
          </TouchableOpacity>
        </View>

        {/* Restaurant Info */}
        <View style={styles.restaurantSection}>
          <Ionicons name="restaurant" size={20} color={COLORS.primary} />
          <Text style={styles.restaurantSectionName}>
            {activeGroupOrder.restaurantName}
          </Text>
        </View>

        {/* Split Method */}
        <View style={styles.splitSection}>
          <Text style={styles.splitTitle}>Division de cuenta</Text>
          <View style={styles.splitOptions}>
            <TouchableOpacity
              style={[
                styles.splitOption,
                activeGroupOrder.splitMethod === 'individual' &&
                  styles.splitOptionActive,
              ]}
              onPress={() => setSplitMethod('individual')}
            >
              <Ionicons
                name="person"
                size={20}
                color={
                  activeGroupOrder.splitMethod === 'individual'
                    ? COLORS.primary
                    : COLORS.gray
                }
              />
              <Text
                style={[
                  styles.splitOptionText,
                  activeGroupOrder.splitMethod === 'individual' &&
                    styles.splitOptionTextActive,
                ]}
              >
                Cada quien lo suyo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.splitOption,
                activeGroupOrder.splitMethod === 'equal' &&
                  styles.splitOptionActive,
              ]}
              onPress={() => setSplitMethod('equal')}
            >
              <Ionicons
                name="people"
                size={20}
                color={
                  activeGroupOrder.splitMethod === 'equal'
                    ? COLORS.primary
                    : COLORS.gray
                }
              />
              <Text
                style={[
                  styles.splitOptionText,
                  activeGroupOrder.splitMethod === 'equal' &&
                    styles.splitOptionTextActive,
                ]}
              >
                Partes iguales
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Members List */}
        <View style={styles.membersSection}>
          <Text style={styles.membersTitle}>
            Participantes ({activeGroupOrder.members.length})
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
                  <Text style={styles.memberName}>
                    {member.name} {member.isHost && '(Anfitrion)'}
                  </Text>
                  {member.isReady && (
                    <View style={styles.readyBadge}>
                      <Ionicons name="checkmark" size={12} color={COLORS.white} />
                      <Text style={styles.readyText}>Listo</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.memberItems}>
                  {member.items.length} productos - ${member.subtotal.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* My Items */}
        {currentUserMember && currentUserMember.items.length > 0 && (
          <View style={styles.myItemsSection}>
            <Text style={styles.myItemsTitle}>Mis productos</Text>
            {currentUserMember.items.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  <Text style={styles.itemPrice}>
                    ${item.price.toFixed(2)} x {item.quantity}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  ${(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Add Products Button */}
        <TouchableOpacity
          style={styles.addProductsButton}
          onPress={() =>
            navigation.navigate('RestaurantDetail', {
              restaurantId: activeGroupOrder.restaurantId,
              groupMode: true,
            })
          }
        >
          <Ionicons name="add" size={24} color={COLORS.primary} />
          <Text style={styles.addProductsText}>Agregar productos</Text>
        </TouchableOpacity>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total del grupo</Text>
            <Text style={styles.summaryValue}>
              ${activeGroupOrder.totalAmount.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tu parte</Text>
            <Text style={styles.summaryValueHighlight}>
              ${currentUserMember?.subtotal.toFixed(2) || '0.00'}
            </Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[
            styles.readyButton,
            currentUserMember?.isReady && styles.readyButtonActive,
          ]}
          onPress={handleToggleReady}
        >
          <Ionicons
            name={currentUserMember?.isReady ? 'checkmark-circle' : 'checkmark-circle-outline'}
            size={24}
            color={currentUserMember?.isReady ? COLORS.white : COLORS.primary}
          />
          <Text
            style={[
              styles.readyButtonText,
              currentUserMember?.isReady && styles.readyButtonTextActive,
            ]}
          >
            {currentUserMember?.isReady ? 'Listo!' : 'Estoy listo'}
          </Text>
        </TouchableOpacity>

        {isHost && (
          <TouchableOpacity
            style={[
              styles.orderButton,
              !allMembersReady && styles.orderButtonDisabled,
            ]}
            disabled={!allMembersReady}
            onPress={() => {
              lockGroupOrder();
              navigation.navigate('Checkout', { groupOrderId: activeGroupOrder.id });
            }}
          >
            <Text style={styles.orderButtonText}>
              {allMembersReady ? 'Ordenar' : 'Esperando a todos...'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  content: { flex: 1 },

  // Hero Section
  heroSection: { alignItems: 'center', padding: 32 },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  heroSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },

  // Restaurant Card
  restaurantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  restaurantInfo: { marginLeft: 12 },
  restaurantName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  restaurantLabel: { fontSize: 12, color: COLORS.gray, marginTop: 2 },

  // Action Button
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  disabledButton: { backgroundColor: COLORS.lightGray },
  actionButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.white },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24, marginHorizontal: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.lightGray },
  dividerText: { marginHorizontal: 16, color: COLORS.gray, fontSize: 14 },

  // Join Section
  joinSection: { marginHorizontal: 16 },
  joinTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  joinInputContainer: { flexDirection: 'row', gap: 12 },
  joinInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 4,
    textAlign: 'center',
  },
  joinButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  joinButtonDisabled: { backgroundColor: COLORS.lightGray },
  joinButtonText: { fontSize: 14, fontWeight: '700', color: COLORS.white },

  // Features
  features: { marginTop: 32, marginHorizontal: 16 },
  featuresTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  featureItem: { flexDirection: 'row', marginBottom: 16 },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: { flex: 1, marginLeft: 12 },
  featureLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  featureDesc: { fontSize: 12, color: COLORS.gray, marginTop: 2 },

  // Code Card
  codeCard: {
    backgroundColor: COLORS.primary,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  codeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  codeLabel: { fontSize: 14, color: COLORS.white, opacity: 0.9 },
  statusBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, color: COLORS.white, fontWeight: '600' },
  codeText: { fontSize: 36, fontWeight: '700', color: COLORS.white, letterSpacing: 6 },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
    gap: 8,
  },
  shareButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.white },

  // Restaurant Section
  restaurantSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  restaurantSectionName: { fontSize: 15, fontWeight: '600', color: COLORS.text },

  // Split Section
  splitSection: { marginTop: 16, marginHorizontal: 16 },
  splitTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  splitOptions: { flexDirection: 'row', gap: 12 },
  splitOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  splitOptionActive: { borderColor: COLORS.primary },
  splitOptionText: { fontSize: 12, fontWeight: '600', color: COLORS.gray },
  splitOptionTextActive: { color: COLORS.primary },

  // Members Section
  membersSection: { marginTop: 20, marginHorizontal: 16 },
  membersTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInitial: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memberName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  readyText: { fontSize: 10, fontWeight: '700', color: COLORS.white },
  memberItems: { fontSize: 12, color: COLORS.gray, marginTop: 2 },

  // My Items Section
  myItemsSection: { marginTop: 20, marginHorizontal: 16 },
  myItemsTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  itemPrice: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  itemTotal: { fontSize: 15, fontWeight: '700', color: COLORS.primary },

  // Add Products Button
  addProductsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    gap: 8,
  },
  addProductsText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },

  // Summary Card
  summaryCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: COLORS.gray },
  summaryValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  summaryValueHighlight: { fontSize: 18, fontWeight: '700', color: COLORS.primary },

  // Bottom Actions
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    flexDirection: 'row',
    gap: 12,
  },
  readyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    gap: 8,
  },
  readyButtonActive: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  readyButtonText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  readyButtonTextActive: { color: COLORS.white },
  orderButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  orderButtonDisabled: { backgroundColor: COLORS.lightGray },
  orderButtonText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
});
