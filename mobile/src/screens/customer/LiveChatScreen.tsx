// ==========================================
// DEVOLÓN — Customer Live Chat (soporte)
//
// Header con avatar de soporte (Devo) + estado online, lista de
// mensajes en burbujas dark, quick replies como pills amarillas y
// composer estilo iMessage dark.
// ==========================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
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
  text: string;
  sender: 'user' | 'support' | 'system';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'read';
}

interface QuickReply {
  id: string;
  text: string;
}

const QUICK_REPLIES: QuickReply[] = [
  { id: '1', text: '¿Dónde está mi pedido?' },
  { id: '2', text: 'Quiero cancelar mi pedido' },
  { id: '3', text: 'Tengo un problema con mi pedido' },
  { id: '4', text: 'Quiero hablar con un agente' },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'welcome',
    text: '¡Hola! Soy Devo, tu asistente virtual. ¿Cómo puedo ayudarte hoy?',
    sender: 'support',
    timestamp: new Date(),
  },
];

const getBotResponse = (userMessage: string): string => {
  const m = userMessage.toLowerCase();
  if (m.includes('pedido') && m.includes('donde'))
    return 'Veo que tienes un pedido activo. Está siendo preparado y llegará en ~25 minutos. ¿Quieres ver el seguimiento en tiempo real?';
  if (m.includes('cancelar'))
    return 'Entiendo. Si el restaurante ya empezó a prepararlo, podría haber un cargo de cancelación. ¿Deseas continuar?';
  if (m.includes('problema') || m.includes('ayuda'))
    return 'Lamento escucharlo. ¿Podrías describir con más detalle qué sucedió? Así puedo ayudarte mejor o conectarte con un agente.';
  if (m.includes('agente') || m.includes('humano') || m.includes('persona'))
    return 'Por supuesto. Te conecto con un agente. Tiempo estimado: 2 minutos.';
  if (m.includes('gracias') || m.includes('ok') || m.includes('listo'))
    return '¡De nada! ¿Hay algo más en lo que pueda ayudarte?';
  if (m.includes('hola') || m.includes('buenas'))
    return '¡Hola! ¿En qué puedo ayudarte hoy?';
  return 'Entiendo. Déjame buscar más información. Si prefieres, puedo conectarte con un agente humano.';
};

export default function LiveChatScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const orderId = route.params?.orderId;

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (orderId) {
      const ctx: Message = {
        id: `ctx-${Date.now()}`,
        text: `Veo que tienes una consulta sobre el pedido #${orderId}. ¿En qué puedo ayudarte?`,
        sender: 'support',
        timestamp: new Date(),
      };
      setTimeout(() => setMessages((p) => [...p, ctx]), 1000);
    }
  }, [orderId]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const user: Message = {
      id: `msg-${Date.now()}`,
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
      status: 'sent',
    };
    setMessages((p) => [...p, user]);
    setInputText('');
    setShowQuickReplies(false);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const bot: Message = {
        id: `msg-${Date.now()}-bot`,
        text: getBotResponse(text),
        sender: 'support',
        timestamp: new Date(),
      };
      setMessages((p) => [...p, bot]);
    }, 1500 + Math.random() * 1000);
  };

  const formatTime = (date: Date) =>
    new Date(date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    const isSystem = item.sender === 'system';

    if (isSystem) {
      return (
        <View style={styles.systemRow}>
          <Text style={styles.systemText}>{item.text}</Text>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.msgRow,
          isUser ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' },
        ]}
      >
        {!isUser && (
          <View style={styles.supportAvatar}>
            <Ionicons name="sparkles" size={14} color={colors.onPrimary} />
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isUser ? styles.bubbleMine : styles.bubbleTheirs,
          ]}
        >
          <Text style={[styles.bubbleText, isUser && { color: colors.onPrimary }]}>
            {item.text}
          </Text>
          <View style={styles.bubbleFooter}>
            <Text style={[styles.bubbleTime, isUser && { color: 'rgba(0,0,0,0.55)' }]}>
              {formatTime(item.timestamp)}
            </Text>
            {isUser && item.status === 'read' && (
              <Ionicons name="checkmark-done" size={12} color="rgba(0,0,0,0.6)" />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.iconBtn}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Ionicons name="sparkles" size={18} color={colors.onPrimary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Soporte Devolón</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>EN LÍNEA</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        {isTyping && (
          <View style={styles.typingRow}>
            <View style={styles.supportAvatar}>
              <Ionicons name="sparkles" size={14} color={colors.onPrimary} />
            </View>
            <View style={styles.typingBubble}>
              <View style={styles.typingDots}>
                <View style={[styles.typingDot, { opacity: 0.4 }]} />
                <View style={[styles.typingDot, { opacity: 0.7 }]} />
                <View style={[styles.typingDot, { opacity: 1 }]} />
              </View>
            </View>
          </View>
        )}

        {showQuickReplies && (
          <View style={styles.quickReplies}>
            {QUICK_REPLIES.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={styles.qrBtn}
                onPress={() => sendMessage(r.text)}
                activeOpacity={0.85}
              >
                <Text style={styles.qrText}>{r.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.attachBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="attach" size={22} color={colors.textMuted} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Escribe tu mensaje…"
            placeholderTextColor={colors.textFaint}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            selectionColor={colors.primary}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim()}
            activeOpacity={0.85}
          >
            <Ionicons name="send" size={18} color={inputText.trim() ? colors.onPrimary : colors.textMuted} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s.md,
    paddingVertical: s.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: s.sm,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 999, backgroundColor: colors.success },
  statusText: {
    color: colors.success,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },

  messagesList: { padding: s.md, paddingBottom: s.xs, gap: s.xs },

  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: s.xs,
    gap: 6,
  },
  supportAvatar: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '75%',
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
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  bubbleTime: {
    color: colors.textFaint,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.semibold,
  },

  systemRow: { alignItems: 'center', marginVertical: s.md },
  systemText: {
    color: colors.textFaint,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
    backgroundColor: colors.surface,
    paddingHorizontal: s.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },

  typingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingHorizontal: s.md,
    paddingBottom: s.xs,
  },
  typingBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: s.md,
    paddingVertical: s.sm,
    borderRadius: radius.xl,
    borderBottomLeftRadius: radius.sm,
  },
  typingDots: { flexDirection: 'row', gap: 4 },
  typingDot: { width: 6, height: 6, borderRadius: 999, backgroundColor: colors.textMuted },

  quickReplies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: s.md,
    paddingVertical: s.xs,
    gap: s.xs,
  },
  qrBtn: {
    paddingHorizontal: s.md,
    paddingVertical: s.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.32)',
  },
  qrText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.2,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: s.sm,
    paddingVertical: s.sm,
    paddingBottom: Platform.OS === 'ios' ? s.lg : s.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
    gap: s.xs,
  },
  attachBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingHorizontal: s.md,
    paddingVertical: 10,
    maxHeight: 100,
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
