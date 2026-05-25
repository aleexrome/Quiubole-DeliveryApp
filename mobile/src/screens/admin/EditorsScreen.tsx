// ==========================================
// DEVOLÓN — Admin Editors
//
// Sub-pantalla del stack. Lista editores, asigna/quita restaurantes,
// degrada a cliente. Modal bottom-sheet dark con selector múltiple.
// ==========================================
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { adminApi, restaurantsApi } from '../../services/api';
import { Restaurant, User } from '../../types';
import { Card, Header, Input, Button, EmptyState } from '../../components/ui';
import {
  colors,
  s,
  radius,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

type EditorWithRestaurants = User & {
  editedRestaurants?: Restaurant[];
};

export default function AdminEditorsScreen() {
  const [editors, setEditors] = useState<EditorWithRestaurants[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignTarget, setAssignTarget] =
    useState<EditorWithRestaurants | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await adminApi.listEditors();
      setEditors(data);
    } catch (e: any) {
      Alert.alert(
        'Error',
        e?.response?.data?.message || 'No se pudieron cargar los editores',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const confirmDemote = (editor: EditorWithRestaurants) => {
    Alert.alert(
      'Degradar editor',
      `¿Convertir a ${editor.name || editor.email} en cliente? Se quitarán todas sus asignaciones.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Degradar',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminApi.demoteEditor(editor.id);
              load();
            } catch (e: any) {
              Alert.alert(
                'Error',
                e?.response?.data?.message || 'No se pudo degradar',
              );
            }
          },
        },
      ],
    );
  };

  const unassign = (editor: EditorWithRestaurants, restaurantId: string) => {
    Alert.alert('Quitar asignación', '¿Retirar este restaurante del editor?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminApi.unassignEditorRestaurant(editor.id, restaurantId);
            load();
          } catch (e: any) {
            Alert.alert(
              'Error',
              e?.response?.data?.message || 'No se pudo quitar',
            );
          }
        },
      },
    ]);
  };

  const handleApprove = (editor: EditorWithRestaurants) => {
    Alert.alert('Aprobar editor', `¿Aprobar a ${editor.name || editor.email}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Aprobar',
        onPress: async () => {
          try {
            await adminApi.approveUser(editor.id);
            load();
          } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message || 'No se pudo aprobar');
          }
        },
      },
    ]);
  };

  const handleReject = (editor: EditorWithRestaurants) => {
    Alert.alert(
      'Rechazar editor',
      `¿Rechazar a ${editor.name || editor.email}? Su cuenta se marcará como rechazada.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminApi.rejectUser(editor.id, 'No cumple requisitos');
              load();
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.message || 'No se pudo rechazar');
            }
          },
        },
      ],
    );
  };

  const renderEditor = ({ item }: { item: EditorWithRestaurants }) => {
    const assigned = item.editedRestaurants ?? [];
    const isPending = (item as any).isApproved === false;
    return (
      <Card variant="glass" padding={s.md} borderRadius={radius.xl}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Ionicons name="create-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name ||
                `${(item as any).firstName ?? ''} ${(item as any).lastName ?? ''}`.trim() ||
                'Editor'}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {item.email}
            </Text>
            {isPending && (
              <View style={styles.pendingBadge}>
                <View style={styles.pendingDot} />
                <Text style={styles.pendingText}>EN REVISIÓN</Text>
              </View>
            )}
          </View>
          {!isPending && (
            <TouchableOpacity
              style={styles.demoteBtn}
              onPress={() => confirmDemote(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="arrow-down-circle-outline"
                size={20}
                color={colors.danger}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Si está pending, mostramos acciones aprobar/rechazar en vez
            de la sección de asignaciones. Una vez aprobado, sigue el
            flow normal (asignar restaurantes / degradar). */}
        {isPending && (
          <View style={styles.approvalRow}>
            <View style={{ flex: 1 }}>
              <Button
                label="RECHAZAR"
                variant="secondary"
                size="sm"
                onPress={() => handleReject(item)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label="APROBAR"
                variant="primary"
                size="sm"
                icon="checkmark"
                iconPosition="left"
                onPress={() => handleApprove(item)}
              />
            </View>
          </View>
        )}

        {isPending && <View style={{ height: s.xs }} />}

        <Text style={styles.sectionLabel}>
          RESTAURANTES ASIGNADOS ({assigned.length})
        </Text>

        {assigned.length === 0 ? (
          <Text style={styles.emptyAssigned}>
            Aún sin asignaciones. Toca "Asignar" para agregar.
          </Text>
        ) : (
          <View style={styles.chipsRow}>
            {assigned.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={styles.chip}
                onPress={() => unassign(item, r.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.chipText} numberOfLines={1}>
                  {r.name}
                </Text>
                <Ionicons name="close" size={12} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.assignBtn}
          onPress={() => setAssignTarget(item)}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
          <Text style={styles.assignBtnText}>Asignar restaurante(s)</Text>
        </TouchableOpacity>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <Header eyebrow="DEVOLÓN · ADMIN" title="Editores" />
        <View style={styles.centerInner}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header eyebrow="DEVOLÓN · ADMIN" title="Editores" />

      <View style={styles.subheader}>
        <Text style={styles.subtitle}>
          {editors.length} editor{editors.length !== 1 ? 'es' : ''} activos
        </Text>
      </View>

      <FlatList
        data={editors}
        keyExtractor={(e) => e.id}
        renderItem={renderEditor}
        contentContainerStyle={{
          paddingHorizontal: s.xl,
          paddingBottom: s['4xl'],
        }}
        ItemSeparatorComponent={() => <View style={{ height: s.sm }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="create-outline"
            title="Aún no hay editores"
            subtitle="Promueve usuarios desde la pantalla de Usuarios para convertirlos en editores."
          />
        }
      />

      <AssignRestaurantsModal
        editor={assignTarget}
        onClose={() => setAssignTarget(null)}
        onSaved={() => {
          setAssignTarget(null);
          load();
        }}
      />
    </SafeAreaView>
  );
}

// ==========================================
// MODAL — selector múltiple de restaurantes (dark)
// ==========================================
function AssignRestaurantsModal({
  editor,
  onClose,
  onSaved,
}: {
  editor: EditorWithRestaurants | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const visible = !!editor;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  React.useEffect(() => {
    if (!visible) return;
    setSelected(new Set());
    setSearch('');
    setLoading(true);
    restaurantsApi
      .getAll()
      .then((data) => setRestaurants(data))
      .catch((e: any) => {
        Alert.alert(
          'Error',
          e?.response?.data?.message ||
            'No se pudo cargar la lista de restaurantes',
        );
      })
      .finally(() => setLoading(false));
  }, [visible]);

  const alreadyAssignedIds = new Set(
    (editor?.editedRestaurants ?? []).map((r) => r.id),
  );

  const available = restaurants.filter(
    (r) =>
      !alreadyAssignedIds.has(r.id) &&
      (search.trim() === '' ||
        r.name.toLowerCase().includes(search.toLowerCase())),
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = async () => {
    if (!editor || selected.size === 0) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      await adminApi.assignEditorRestaurants(editor.id, Array.from(selected));
      onSaved();
    } catch (e: any) {
      Alert.alert(
        'Error',
        e?.response?.data?.message || 'No se pudieron asignar',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalEyebrow}>ASIGNAR</Text>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {editor?.name || editor?.email}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={{ marginBottom: s.sm }}>
            <Input
              variant="filled"
              icon="search"
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar restaurante…"
            />
          </View>

          {loading ? (
            <View style={{ padding: s['2xl'], alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 420 }}>
              {available.length === 0 ? (
                <Text style={styles.modalEmpty}>
                  No hay restaurantes disponibles para asignar.
                </Text>
              ) : (
                available.map((r) => {
                  const isSelected = selected.has(r.id);
                  return (
                    <TouchableOpacity
                      key={r.id}
                      style={styles.restaurantRow}
                      onPress={() => toggle(r.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={isSelected ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={isSelected ? colors.primary : colors.textFaint}
                      />
                      <View style={{ flex: 1, marginLeft: s.sm }}>
                        <Text style={styles.restaurantName} numberOfLines={1}>
                          {r.name}
                        </Text>
                        <Text
                          style={styles.restaurantAddress}
                          numberOfLines={1}
                        >
                          {typeof r.address === 'string'
                            ? r.address
                            : (r.address as any)?.street || '—'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          )}

          <View style={styles.modalActions}>
            <View style={{ flex: 1 }}>
              <Button
                label="Cancelar"
                variant="secondary"
                size="md"
                onPress={onClose}
              />
            </View>
            <View style={{ flex: 2 }}>
              <Button
                label={
                  selected.size > 0 ? `Asignar (${selected.size})` : 'Asignar'
                }
                variant="primary"
                size="md"
                onPress={save}
                loading={saving}
                disabled={selected.size === 0}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centerInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ============ SUBHEADER ============
  subheader: {
    paddingHorizontal: s.xl,
    paddingTop: s.xs,
    paddingBottom: s.md,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },

  // ============ CARD ============
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  email: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  pendingText: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  approvalRow: {
    flexDirection: 'row',
    gap: s.xs,
    marginTop: s.md,
    paddingTop: s.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  demoteBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'rgba(229,72,77,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229,72,77,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
    marginTop: s.md,
    marginBottom: s.xs,
    textTransform: 'uppercase',
  },
  emptyAssigned: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    fontStyle: 'italic',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: 220,
  },
  chipText: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: s.sm,
    paddingVertical: s.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.32)',
    backgroundColor: 'rgba(255,194,14,0.08)',
  },
  assignBtnText: {
    color: colors.primary,
    fontWeight: fontWeight.heavy,
    fontSize: fontSize.sm,
    letterSpacing: 0.3,
  },

  // ============ MODAL ============
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.bgRaised,
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: s.lg,
    paddingTop: s.sm,
    paddingBottom: s.xl,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: s.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: s.md,
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
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  modalEmpty: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    paddingVertical: s['2xl'],
  },
  restaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: s.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  restaurantName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  restaurantAddress: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: s.xs,
    marginTop: s.md,
  },
});
