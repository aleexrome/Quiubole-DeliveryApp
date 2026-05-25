// ==========================================
// DEVOLÓN — Chat por pedido (compartido customer / driver / restaurant)
//
// Burbujas dark-mode estilo iMessage. Polling cada 3s mientras está
// abierta para detectar mensajes nuevos sin necesitar WebSocket.
// Auto-scroll al último mensaje. KeyboardAvoidingView para que el
// input no se tape con el teclado.
//
// Navegación: navigate('Chat', {
//   orderId, otherUserId, otherUserName?, otherUserRole?, orderNumber?
// })
// ==========================================

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { messagesApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import {
  colors,
  s,
  radius,
  shadows,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

interface Message {
  id: string;
  orderId: string;
  fromUserId: string;
  toUserId: string;
  text: string;
  readAt: string | null;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  customer: 'Cliente',
  driver: 'Repartidor',
  restaurant: 'Restaurante',
};

const ROLE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  customer: 'person',
  driver: 'bicycle',
  restaurant: 'restaurant',
};

export default function ChatScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuthStore();
  const meId = user?.id;

  const {
    orderId,
    otherUserId,
    otherUserName,
    otherUserRole,
    orderNumber,
  } = (route.params || {}) as {
    orderId: string;
    otherUserId: string;
    otherUserName?: string;
    otherUserRole?: 'customer' | 'driver' | 'restaurant';
    orderNumber?: string;
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  // Carga inicial + polling cada 3 seg.
  const load = useCallback(async () => {
    try {
      const data = await messagesApi.getByOrder(orderId, otherUserId);
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, [orderId, otherUserId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [load]);

  // Auto-scroll al final cuando hay mensajes nuevos.
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      orderId,
      fromUserId: meId || '',
      toUserId: otherUserId,
      text: trimmed,
      readAt: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setText('');
    try {
      const saved = await messagesApi.send(orderId, otherUserId, trimmed);
      // Reemplaza el optimistic por el real (con id del backend).
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? saved : m)),
      );
    } catch (error: any) {
      // Quita el optimistic en error.
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      Alert.alert(
        'No se envió',
        error?.response?.data?.message ||
          'Revisa tu conexión e intenta de nuevo.',
      );
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const isMine = item.fromUserId === meId;
    const prev = messages[index - 1];
    const showTimeSeparator =
      !prev ||
      new Date(item.createdAt).getTime() - new Date(prev.createdAt).getTime() >
        15 * 60 * 1000;

    return (
      <>
        {showTimeSeparator && (
          <Text style={styles.timeSeparator}>{formatTime(item.createdAt)}</Text>
        )}
        <View
          style={[
            styles.bubbleWrap,
            isMine ? styles.bubbleWrapMine : styles.bubbleWrapTheirs,
          ]}
        >
          <View
            style={[
              styles.bubble,
              isMine ? styles.bubbleMine : styles.bubbleTheirs,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                isMine && styles.bubbleTextMine,
              ]}
            >
              {item.text}
            </Text>
          </View>
          {isMine && item.readAt && (
            <Text style={styles.readMark}>visto</Text>
          )}
        </View>
      </>
    );
  };

  const roleLabel =
    (otherUserRole && ROLE_LABELS[otherUserRole]) || 'Conversación';
  const roleIcon =
    (otherUserRole && ROLE_ICONS[otherUserRole]) || 'chatbubbles';

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
        <View style={styles.headerAvatar}>
          <Ionicons name={roleIcon} size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerEyebrow}>
            {roleLabel}
            {orderNumber ? ` · ${orderNumber}` : ''}
          </Text>
          <Text style={styles.headerName} numberOfLines={1}>
            {otherUserName || 'Sin nombre'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyHalo}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={32}
                color={colors.textMuted}
              />
            </View>
            <Text style={styles.emptyTitle}>Sin mensajes aún</Text>
            <Text style={styles.emptySub}>
              Inicia la conversación sobre el pedido.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: false })
            }
          />
        )}

        {/* INPUT */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Escribe un mensaje…"
            placeholderTextColor={colors.textFaint}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSend}
            disabled={!text.trim() || sending}
            style={[
              styles.sendBtn,
              (!text.trim() || sending) && styles.sendBtnDisabled,
            ]}
          >
            {sending ? (
              <ActivityIndicator color={colors.onPrimary} size="small" />
            ) : (
              <Ionicons name="send" size={18} color={colors.onPrimary} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    paddingHorizontal: s.md,
    paddingTop: s.xs,
    paddingBottom: s.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  headerName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    letterSpacing: -0.2,
    marginTop: 2,
  },

  // LIST
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s.xl,
  },
  emptyHalo: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s.md,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: s.md,
    paddingVertical: s.md,
  },
  timeSeparator: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
    marginVertical: s.sm,
  },

  // BUBBLE
  bubbleWrap: {
    marginBottom: 6,
    maxWidth: '80%',
  },
  bubbleWrapMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleWrapTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: {
    paddingHorizontal: s.md,
    paddingVertical: s.sm,
    borderRadius: radius.lg,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    lineHeight: 20,
  },
  bubbleTextMine: { color: colors.onPrimary },
  readMark: {
    color: colors.textFaint,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
    marginRight: 4,
  },

  // INPUT
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: s.xs,
    paddingHorizontal: s.md,
    paddingVertical: s.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: s.md,
    paddingVertical: s.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
  sendBtnDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
});
