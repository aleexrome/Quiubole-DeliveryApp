// ==========================================
// DEVOLÓN — Editor / Editar (o crear) producto
//
// Sub-screen del stack del editor (header nativo dark). Form denso con
// foto cuadrada (picker con halo amarillo), nombre, descripción, precio
// y switch de disponibilidad. CTA primario amarillo + danger "eliminar"
// abajo cuando es edición.
// ==========================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { productsApi, uploadsApi } from '../../services/api';
import { Product } from '../../types';
import { Card, Input, Button } from '../../components/ui';
import {
  colors,
  s,
  radius,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

export default function EditorProductEditScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { restaurantId, productId } = route.params || {};
  const isNew = !productId;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: isNew ? 'Nuevo producto' : 'Editar producto',
    });
    if (!isNew) loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      const p: Product = await productsApi.getById(productId);
      setName(p.name);
      setDescription(p.description || '');
      setPrice(String(p.price ?? ''));
      setImage(p.image || null);
      setIsAvailable((p as any).isAvailable ?? true);
    } catch (e: any) {
      Alert.alert(
        'Error',
        e?.response?.data?.message || 'No se pudo cargar el producto',
      );
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos acceso a tus fotos para subir imágenes.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    setUploading(true);
    try {
      const res = await uploadsApi.uploadProductImage(uri);
      // El backend actual solo guarda localmente y devuelve url/filename.
      // Adaptamos a los distintos shapes posibles:
      const uploadedUrl =
        res.url || res.secure_url || res.path || res.filename || uri;
      setImage(uploadedUrl);
    } catch (e: any) {
      Alert.alert(
        'No se pudo subir la foto',
        e?.response?.data?.message || String(e?.message || e),
      );
    } finally {
      setUploading(false);
    }
  };

  const validate = (): string | null => {
    if (!name.trim()) return 'El nombre es obligatorio';
    if (name.trim().length < 2) return 'El nombre es muy corto';
    const p = Number(price);
    if (isNaN(p) || p < 0) return 'El precio debe ser un número válido';
    return null;
  };

  const save = async () => {
    const err = validate();
    if (err) {
      Alert.alert('Revisa el formulario', err);
      return;
    }
    setSaving(true);
    try {
      const body: any = {
        name: name.trim(),
        description: description.trim() || undefined,
        price: Number(price),
        image: image || undefined,
        isAvailable,
      };
      if (isNew) {
        body.restaurantId = restaurantId;
        await productsApi.create(body);
      } else {
        await productsApi.update(productId, body);
      }
      // El backend pone isApproved=false en creación/edición de editor.
      // Aviso explícito para que el editor sepa que NO aparece en el menú
      // público hasta que admin valide.
      Alert.alert(
        isNew ? 'Producto enviado a revisión' : 'Cambios enviados a revisión',
        isNew
          ? `"${body.name}" se creó correctamente y está en espera de aprobación por admin. Cuando se apruebe, aparecerá en el menú del restaurante.`
          : 'Tus cambios necesitan ser validados por admin antes de actualizarse en el menú público.',
        [{ text: 'Entendido', onPress: () => navigation.goBack() }],
      );
    } catch (e: any) {
      Alert.alert(
        'No se pudo guardar',
        e?.response?.data?.message || 'Intenta de nuevo',
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Eliminar producto',
      '¿Seguro que quieres eliminarlo? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await productsApi.delete(productId);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert(
                'Error',
                e?.response?.data?.message || 'No se pudo eliminar',
              );
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ============ FOTO ============ */}
        <Text style={styles.eyebrow}>FOTO DEL PRODUCTO</Text>
        <TouchableOpacity
          style={styles.imagePicker}
          onPress={pickImage}
          disabled={uploading}
          activeOpacity={0.88}
        >
          {uploading ? (
            <ActivityIndicator color={colors.primary} />
          ) : image ? (
            <>
              <Image source={{ uri: image }} style={styles.image} />
              <View style={styles.imageEditBadge}>
                <Ionicons name="camera" size={14} color={colors.onPrimary} />
              </View>
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <View style={styles.imageHalo}>
                <Ionicons name="camera" size={28} color={colors.primary} />
              </View>
              <Text style={styles.imageHint}>Toca para agregar foto</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ============ DATOS ============ */}
        <Text style={[styles.eyebrow, { marginTop: s.xl }]}>
          INFORMACIÓN
        </Text>
        <Card variant="glass" padding={s.md} borderRadius={radius.xl}>
          <Input
            variant="filled"
            label="Nombre *"
            value={name}
            onChangeText={setName}
            placeholder="Ej. Taco al pastor"
            containerStyle={{ marginBottom: s.sm }}
          />
          <Input
            variant="filled"
            label="Descripción"
            value={description}
            onChangeText={setDescription}
            placeholder="Ingredientes, tamaño, notas..."
            multiline
            numberOfLines={3}
            containerStyle={{ marginBottom: s.sm }}
            style={{ minHeight: 80 } as any}
          />
          <Input
            variant="filled"
            label="Precio (MXN) *"
            value={price}
            onChangeText={setPrice}
            placeholder="25.00"
            keyboardType="decimal-pad"
            icon="pricetag-outline"
          />
        </Card>

        {/* ============ DISPONIBILIDAD ============ */}
        <Text style={[styles.eyebrow, { marginTop: s.xl }]}>
          DISPONIBILIDAD
        </Text>
        <Card variant="glass" padding={s.md} borderRadius={radius.xl}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>
                {isAvailable ? 'Disponible' : 'No disponible'}
              </Text>
              <Text style={styles.switchHint}>
                Si lo desactivas, no aparecerá en el menú del cliente.
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={setIsAvailable}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.text}
              ios_backgroundColor={colors.border}
            />
          </View>
        </Card>

        {/* ============ ACCIONES ============ */}
        <View style={styles.actions}>
          <Button
            label={isNew ? 'Crear producto' : 'Guardar cambios'}
            onPress={save}
            loading={saving}
            icon="checkmark"
            iconPosition="right"
            size="lg"
          />

          {!isNew && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={confirmDelete}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
              <Text style={styles.deleteBtnText}>Eliminar producto</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: s.xl,
    paddingBottom: s['3xl'],
  },

  // ============ EYEBROW ============
  eyebrow: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    marginBottom: s.xs,
    paddingLeft: s.xxs,
  },

  // ============ IMAGE PICKER ============
  imagePicker: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 240,
    borderRadius: radius.xl,
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.sm,
    padding: s.lg,
  },
  imageHalo: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  imageEditBadge: {
    position: 'absolute',
    right: s.sm,
    bottom: s.sm,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },

  // ============ SWITCH ROW ============
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.md,
  },
  switchTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  switchHint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
    lineHeight: 16,
  },

  // ============ ACTIONS ============
  actions: {
    marginTop: s['2xl'],
    gap: s.md,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: s.sm,
  },
  deleteBtnText: {
    color: colors.danger,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wide,
  },
});
