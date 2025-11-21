import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, typography } from '../../utils/theme';
import { useAuthStore } from '../../context/store';

const EditProfileScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar perfil</Text>
        <TouchableOpacity><Text style={styles.saveButton}>Guardar</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.avatarContainer}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{firstName[0] || 'U'}</Text></View>
          <Text style={styles.changePhoto}>Cambiar foto</Text>
        </TouchableOpacity>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="Tu nombre" />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Apellido</Text>
          <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Tu apellido" />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Teléfono</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Tu teléfono" keyboardType="phone-pad" />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={[styles.input, styles.inputDisabled]} value={user?.email || ''} editable={false} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg },
  backButton: { width: 40, height: 40, borderRadius: borderRadius.full, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  headerTitle: { ...typography.h3, color: colors.text },
  saveButton: { ...typography.bodyBold, color: colors.primary },
  content: { padding: spacing.lg },
  avatarContainer: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 40, color: colors.textInverse, fontWeight: '700' },
  changePhoto: { ...typography.body, color: colors.primary, marginTop: spacing.md },
  inputContainer: { marginBottom: spacing.md },
  label: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  input: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.md, ...typography.body, color: colors.text, borderWidth: 1, borderColor: colors.border },
  inputDisabled: { backgroundColor: colors.surfaceVariant, color: colors.textSecondary },
});

export default EditProfileScreen;
