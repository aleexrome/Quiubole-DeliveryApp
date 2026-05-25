// ==========================================
// DEVOLÓN — Editor / Mensajes
//
// Tab del editor. Lista los canales de chat 1-on-1 con los dueños de
// los restaurantes asignados. Cards glass con logo del restaurante,
// nombre + nombre del dueño, timestamp del último mensaje y chevron.
// Sin backend de unread aún → no pintamos badge (lo dejamos preparado
// como subtitulo del nombre, sin contador). El polling vive en el
// chat detail; aquí solo recargamos al enfocar.
// ==========================================

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { chatApi } from '../../services/api';
import { Card, EmptyState } from '../../components/ui';
import {
  colors,
  s,
  radius,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

interface ChatChannel {
  id: string;
  restaurantId: string;
  editorId: string;
  ownerId?: string;
  lastMessageAt?: string | null;
  restaurant?: {
    id: string;
    name: string;
    logo?: string;
  };
  owner?: {
    id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
  };
}

export default function EditorChatsScreen() {
  const navigation = useNavigation<any>();
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await chatApi.listChannels();
      setChannels(data);
    } catch (e) {
      // Silencioso — la lista queda vacía, el usuario ve el empty state.
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

  const ownerName = (ch: ChatChannel) => {
    if (!ch.owner) return 'Dueño del restaurante';
    const { name, firstName, lastName } = ch.owner;
    if (name) return name;
    return `${firstName || ''} ${lastName || ''}`.trim() || 'Dueño';
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    if (isToday) {
      return d.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  };

  const renderItem = ({ item }: { item: ChatChannel }) => {
    const time = formatDate(item.lastMessageAt);
    return (
      <Card
        variant="glass"
        onPress={() =>
          navigation.navigate('EditorChatDetail', {
            channelId: item.id,
            restaurantName: item.restaurant?.name || 'Chat',
            ownerName: ownerName(item),
          })
        }
        padding={s.sm}
        borderRadius={radius.xl}
        style={styles.card}
      >
        {item.restaurant?.logo ? (
          <Image source={{ uri: item.restaurant.logo }} style={styles.logo} />
        ) : (
          <View style={[styles.logo, styles.logoPlaceholder]}>
            <Ionicons
              name="chatbubbles"
              size={22}
              color={colors.primary}
            />
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {item.restaurant?.name || 'Restaurante'}
          </Text>
          <View style={styles.subRow}>
            <Ionicons
              name="person-outline"
              size={11}
              color={colors.textMuted}
            />
            <Text style={styles.sub} numberOfLines={1}>
              {ownerName(item)}
            </Text>
          </View>
        </View>

        <View style={styles.right}>
          {time ? <Text style={styles.time}>{time}</Text> : null}
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textMuted}
          />
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>EDITOR</Text>
        <Text style={styles.title}>Mensajes</Text>
        <Text style={styles.subtitle}>
          {channels.length} conversación{channels.length !== 1 ? 'es' : ''}
        </Text>
      </View>

      <FlatList
        data={channels}
        keyExtractor={(c) => c.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: s.xs }} />}
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
            icon="chatbubble-outline"
            title="Sin conversaciones"
            subtitle="Cuando el admin te asigne un restaurante, se abrirá automáticamente un canal con el dueño."
          />
        }
      />
    </SafeAreaView>
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

  // ============ HEADER ============
  header: {
    paddingHorizontal: s.xl,
    paddingTop: s.sm,
    paddingBottom: s.lg,
  },
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
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginTop: 4,
  },

  // ============ LIST ============
  listContent: {
    paddingHorizontal: s.xl,
    paddingBottom: s['3xl'],
    flexGrow: 1,
  },

  // ============ CARD ============
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
  },
  logoPlaceholder: {
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 3 },
  name: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sub: {
    flex: 1,
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  time: {
    color: colors.textFaint,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wide,
  },
});
