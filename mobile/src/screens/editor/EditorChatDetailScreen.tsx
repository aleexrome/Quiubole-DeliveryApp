// ==========================================
// DEVOLÓN — Editor Chat Detail (editor ↔ dueño)
//
// Lista de mensajes en burbujas dark, composer dark con send pill
// amarillo. Preserva polling cada 8s, optimistic update y revert.
// El header lo provee el stack nativo (AppNavigator headerShown:true).
// ==========================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { chatApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { colors, s, radius, shadows, fontSize, fontWeight, tracking } from '../../theme';

interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export default function EditorChatDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { channelId, restaurantName, ownerName } = route.params || {};
  const { user } = useAuthStore();
  const myId = user?.id;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    navigation.setOptions({ headerTitle: restaurantName || 'Chat' });
  }, [navigation, restaurantName]);

  const load = useCallback(async () => {
    try {
      const data = await chatApi.getMessages(channelId, { limit: 100 });
      setMessages(data);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'No se pudo cargar el chat');
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    load();
  }, [load]);

  // Poll cada 8s mientras la pantalla esté visible.
  useEffect(() => {
    const interval = setInterval(() => {
      chatApi
        .getMessages(channelId, { limit: 100 })
        .then((data) => setMessages(data))
        .catch(() => {});
    }, 8000);
    return () => clearInterval(interval);
  }, [channelId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages.length]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      channelId,
      senderId: myId || 'me',
      body,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setText('');
    try {
      const saved = await chatApi.sendMessage(channelId, body);
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? saved : m)));
    } catch (e: any) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setText(body);
      Alert.alert('No se pudo enviar', e?.response?.data?.message || 'Intenta de nuevo');
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const mine = item.senderId === myId;
    const time = new Date(item.createdAt).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return (
      <View style={[styles.bubbleRow, { justifyContent: mine ? 'flex-end' : 'flex-start' }]}>
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.bubbleText, mine && { color: colors.onPrimary }]}>{item.body}</Text>
          <Text style={[styles.bubbleTime, mine && { color: 'rgba(0,0,0,0.6)' }]}>{time}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        {ownerName ? (
          <View style={styles.contextBar}>
            <Ionicons name="person-circle-outline" size={14} color={colors.primary} />
            <Text style={styles.contextText}>
              Conversando con <Text style={styles.contextNameStrong}>{ownerName}</Text>
            </Text>
          </View>
        ) : null}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.textFaint} />
              <Text style={styles.emptyTitle}>Sin mensajes aún</Text>
              <Text style={styles.emptyText}>
                Escribe el primer mensaje. El dueño recibirá una notificación.
              </Text>
            </View>
          }
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Escribe un mensaje…"
            placeholderTextColor={colors.textFaint}
            selectionColor={colors.primary}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (sending || !text.trim()) && styles.sendBtnDisabled]}
            onPress={send}
            disabled={sending || !text.trim()}
            activeOpacity={0.85}
          >
            {sending ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Ionicons
                name="send"
                size={18}
                color={text.trim() ? colors.onPrimary : colors.textMuted}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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

  contextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: s.lg,
    paddingVertical: s.xs + 2,
    backgroundColor: 'rgba(255,194,14,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,194,14,0.18)',
  },
  contextText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  contextNameStrong: {
    color: colors.primary,
    fontWeight: fontWeight.heavy,
  },

  list: { padding: s.md, paddingBottom: s.xs, gap: s.xs, flexGrow: 1 },

  bubbleRow: { flexDirection: 'row', marginBottom: s.xs },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: s.md,
    paddingVertical: 10,
    borderRadius: radius.xl,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.sm,
  },
  bubbleTheirs: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.sm,
  },
  bubbleText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    lineHeight: 20,
  },
  bubbleTime: {
    color: colors.textFaint,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.semibold,
    marginTop: 4,
    alignSelf: 'flex-end',
  },

  empty: {
    alignItems: 'center',
    paddingVertical: s['3xl'],
    gap: s.xs,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.3,
    marginTop: s.sm,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    paddingHorizontal: s.xl,
    lineHeight: 19,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: s.sm,
    paddingVertical: s.sm,
    paddingBottom: Platform.OS === 'ios' ? s.lg : s.sm,
    gap: s.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 40,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingHorizontal: s.md,
    paddingVertical: 10,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
  sendBtnDisabled: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
