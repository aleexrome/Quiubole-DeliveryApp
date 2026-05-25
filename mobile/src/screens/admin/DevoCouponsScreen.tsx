// ==========================================
// DEVOLÓN — Admin / Devo Cupones pendientes
//
// Lista clientes que cruzaron 100 puntos y están esperando que admin les
// asigne un cupón. Tap → modal con form (type, value, alcance, expiración).
// Al asignar, el cliente recibe push y el cupón pasa a 'active'.
// ==========================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { devoCouponsApi } from '../../services/api';
import { Card } from '../../components/ui';
import {
  colors,
  s,
  radius,
  shadows,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

type CouponType =
  | 'percentage'
  | 'fixed'
  | 'free_delivery'
  | 'product_discount';

interface PendingCoupon {
  id: string;
  code: string;
  userId: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    email: string;
    devoPointsLifetime?: number;
  };
}

export default function AdminDevoCouponsScreen() {
  const navigation = useNavigation<any>();
  const [pending, setPending] = useState<PendingCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal de asignación.
  const [active, setActive] = useState<PendingCoupon | null>(null);
  const [type, setType] = useState<CouponType>('percentage');
  const [value, setValue] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('30');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await devoCouponsApi.getPendingForAdmin();
      setPending(Array.isArray(data) ? data : []);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'No se pudieron cargar los cupones',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  const openModal = (coupon: PendingCoupon) => {
    setActive(coupon);
    setType('percentage');
    setValue('');
    setMaxDiscount('');
    setMinOrderAmount('');
    setDescription('');
    setExpiresInDays('30');
  };

  const handleAssign = async () => {
    if (!active) return;
    const numValue = Number(value);
    if (type !== 'free_delivery') {
      if (isNaN(numValue) || numValue <= 0) {
        Alert.alert('Valor inválido', 'Ingresa un valor numérico positivo.');
        return;
      }
      if (type === 'percentage' && (numValue < 1 || numValue > 100)) {
        Alert.alert('Valor inválido', 'El % debe estar entre 1 y 100.');
        return;
      }
    }

    const expiresAt = (() => {
      const days = parseInt(expiresInDays, 10);
      if (!days || isNaN(days)) return undefined;
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toISOString();
    })();

    try {
      setSaving(true);
      await devoCouponsApi.assign(active.id, {
        type,
        value: type === 'free_delivery' ? 0 : numValue,
        maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
        description: description.trim() || undefined,
        expiresAt,
      });
      Alert.alert('Cupón asignado', 'El cliente ya puede usarlo.');
      setActive(null);
      load();
    } catch (e: any) {
      Alert.alert(
        'No se pudo asignar',
        e?.response?.data?.message || 'Intenta de nuevo',
      );
    } finally {
      setSaving(false);
    }
  };

  const userName = (c: PendingCoupon) =>
    [c.user?.firstName, c.user?.lastName].filter(Boolean).join(' ') ||
    c.user?.name ||
    'Cliente';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>ADMIN · LEALTAD</Text>
          <Text style={styles.title}>Devo Cupones</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <Card variant="glass" padding={s.md} borderRadius={radius.lg} style={styles.intro}>
          <Ionicons name="gift" size={18} color={colors.primary} />
          <Text style={styles.introText}>
            {pending.length === 0
              ? 'No hay cupones pendientes por asignar.'
              : `${pending.length} cliente${pending.length === 1 ? '' : 's'} esperando un cupón Devo.`}
          </Text>
        </Card>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: s.xl }} />
        ) : (
          pending.map((c) => (
            <Card
              key={c.id}
              variant="raised"
              padding={s.lg}
              borderRadius={radius.xl}
              onPress={() => openModal(c)}
              style={styles.row}
            >
              <View style={styles.rowIcon}>
                <Ionicons name="person" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {userName(c)}
                </Text>
                <Text style={styles.rowEmail} numberOfLines={1}>
                  {c.user?.email}
                </Text>
                <Text style={styles.rowMeta}>
                  Acumulado de por vida:{' '}
                  {c.user?.devoPointsLifetime ?? '—'} pts
                </Text>
              </View>
              <View style={styles.rowAction}>
                <Text style={styles.rowActionText}>ASIGNAR</Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* MODAL — formulario de asignación */}
      <Modal
        visible={!!active}
        animationType="slide"
        transparent
        onRequestClose={() => setActive(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalEyebrow}>ASIGNAR CUPÓN</Text>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {active && userName(active)}
              </Text>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              {/* TIPO */}
              <Text style={styles.fieldLabel}>TIPO DE CUPÓN</Text>
              <View style={styles.typesRow}>
                {([
                  { key: 'percentage', label: '% Desc', icon: 'pricetag' },
                  { key: 'fixed', label: 'Monto fijo', icon: 'cash' },
                  { key: 'free_delivery', label: 'Envío gratis', icon: 'bicycle' },
                ] as const).map((t) => {
                  const active = type === t.key;
                  return (
                    <TouchableOpacity
                      key={t.key}
                      activeOpacity={0.85}
                      onPress={() => setType(t.key)}
                      style={[styles.typeChip, active && styles.typeChipActive]}
                    >
                      <Ionicons
                        name={t.icon as any}
                        size={14}
                        color={active ? colors.onPrimary : colors.primary}
                      />
                      <Text
                        style={[
                          styles.typeChipText,
                          active && styles.typeChipTextActive,
                        ]}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* VALOR */}
              {type !== 'free_delivery' && (
                <>
                  <Text style={styles.fieldLabel}>
                    {type === 'percentage'
                      ? 'PORCENTAJE (1-100)'
                      : 'MONTO EN PESOS'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={setValue}
                    keyboardType="number-pad"
                    placeholder={type === 'percentage' ? 'Ej: 20' : 'Ej: 50'}
                    placeholderTextColor={colors.textFaint}
                  />
                </>
              )}

              {/* TOPE MÁXIMO (solo %) */}
              {type === 'percentage' && (
                <>
                  <Text style={styles.fieldLabel}>
                    TOPE MÁXIMO (opcional, en pesos)
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={maxDiscount}
                    onChangeText={setMaxDiscount}
                    keyboardType="number-pad"
                    placeholder="Ej: 100"
                    placeholderTextColor={colors.textFaint}
                  />
                </>
              )}

              {/* MÍNIMO */}
              <Text style={styles.fieldLabel}>PEDIDO MÍNIMO (opcional)</Text>
              <TextInput
                style={styles.input}
                value={minOrderAmount}
                onChangeText={setMinOrderAmount}
                keyboardType="number-pad"
                placeholder="Ej: 200"
                placeholderTextColor={colors.textFaint}
              />

              {/* DESCRIPCIÓN */}
              <Text style={styles.fieldLabel}>
                DESCRIPCIÓN (lo que verá el cliente)
              </Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="Ej: 20% off en cualquier pedido"
                placeholderTextColor={colors.textFaint}
              />

              {/* EXPIRACIÓN */}
              <Text style={styles.fieldLabel}>EXPIRA EN (días)</Text>
              <TextInput
                style={styles.input}
                value={expiresInDays}
                onChangeText={setExpiresInDays}
                keyboardType="number-pad"
                placeholder="30"
                placeholderTextColor={colors.textFaint}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setActive(null)}
                disabled={saving}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.assignBtn, saving && { opacity: 0.5 }]}
                onPress={handleAssign}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={colors.onPrimary} size="small" />
                ) : (
                  <Text style={styles.assignText}>OTORGAR CUPÓN</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    paddingHorizontal: s.xl,
    paddingTop: s.sm,
    paddingBottom: s.md,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  title: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.5,
    marginTop: 2,
  },

  scroll: { paddingHorizontal: s.xl, paddingBottom: s['4xl'] },

  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    marginBottom: s.md,
  },
  introText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.md,
    marginBottom: s.sm,
  },
  rowIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    letterSpacing: -0.2,
  },
  rowEmail: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  rowMeta: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  rowAction: {
    paddingHorizontal: s.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    ...shadows.glow,
  },
  rowActionText: {
    color: colors.onPrimary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.wider,
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    maxHeight: '90%',
  },
  modalHeader: {
    paddingHorizontal: s.xl,
    paddingTop: s.lg,
    paddingBottom: s.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  modalTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  modalContent: { padding: s.xl, gap: s.sm },

  fieldLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
    marginTop: s.sm,
    marginBottom: 4,
  },
  input: {
    height: 50,
    paddingHorizontal: s.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },

  typesRow: {
    flexDirection: 'row',
    gap: s.xs,
    marginBottom: s.sm,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: s.sm,
    paddingVertical: s.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeChipText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },
  typeChipTextActive: { color: colors.onPrimary },

  modalActions: {
    flexDirection: 'row',
    gap: s.sm,
    paddingHorizontal: s.xl,
    paddingVertical: s.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
  },
  assignBtn: {
    flex: 2,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    ...shadows.glow,
  },
  assignText: {
    color: colors.onPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.wider,
  },
});
