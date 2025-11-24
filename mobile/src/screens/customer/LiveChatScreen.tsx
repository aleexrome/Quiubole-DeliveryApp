// ==========================================
// LIVE CHAT SCREEN - CHAT EN VIVO
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
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const COLORS = {
  primary: '#FF6B35',
  secondary: '#2E4057',
  background: '#F8F9FA',
  white: '#FFFFFF',
  gray: '#6C757D',
  lightGray: '#E9ECEF',
  text: '#212529',
  success: '#4CAF50',
  myMessage: '#FF6B35',
  theirMessage: '#E9ECEF',
};

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
  { id: '1', text: 'Donde esta mi pedido?' },
  { id: '2', text: 'Quiero cancelar mi pedido' },
  { id: '3', text: 'Tengo un problema con mi pedido' },
  { id: '4', text: 'Quiero hablar con un agente' },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'welcome',
    text: 'Hola! Soy QuiuBot, tu asistente virtual. Como puedo ayudarte hoy?',
    sender: 'support',
    timestamp: new Date(),
  },
];

// Respuestas automaticas del bot
const getBotResponse = (userMessage: string): string => {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('pedido') && lowerMessage.includes('donde')) {
    return 'Puedo ver que tienes un pedido activo. Tu pedido esta siendo preparado y llegara en aproximadamente 25 minutos. Quieres ver el seguimiento en tiempo real?';
  }
  if (lowerMessage.includes('cancelar')) {
    return 'Entiendo que quieres cancelar tu pedido. Por favor, ten en cuenta que si el restaurante ya empezo a prepararlo, podria haber un cargo de cancelacion. Deseas continuar con la cancelacion?';
  }
  if (lowerMessage.includes('problema') || lowerMessage.includes('ayuda')) {
    return 'Lamento escuchar que tienes un problema. Podrias describir con mas detalle que sucedio? Asi podre ayudarte mejor o conectarte con un agente humano.';
  }
  if (lowerMessage.includes('agente') || lowerMessage.includes('humano') || lowerMessage.includes('persona')) {
    return 'Por supuesto! Te estoy conectando con uno de nuestros agentes. El tiempo de espera estimado es de 2 minutos. Por favor, espera un momento...';
  }
  if (lowerMessage.includes('gracias') || lowerMessage.includes('ok') || lowerMessage.includes('listo')) {
    return 'De nada! Hay algo mas en lo que pueda ayudarte?';
  }
  if (lowerMessage.includes('hola') || lowerMessage.includes('buenas')) {
    return 'Hola! Que gusto saludarte. En que puedo ayudarte hoy?';
  }

  return 'Entiendo. Dejame buscar mas informacion sobre esto. Si prefieres, puedo conectarte con un agente humano para asistencia personalizada.';
};

export default function LiveChatScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const orderId = route.params?.orderId;

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (orderId) {
      // Si viene de un pedido especifico, agregar contexto
      const contextMessage: Message = {
        id: `ctx-${Date.now()}`,
        text: `Veo que tienes una consulta sobre el pedido #${orderId}. En que puedo ayudarte?`,
        sender: 'support',
        timestamp: new Date(),
      };
      setTimeout(() => {
        setMessages((prev) => [...prev, contextMessage]);
      }, 1000);
    }
  }, [orderId]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
      status: 'sent',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setShowQuickReplies(false);
    setIsTyping(true);

    // Simular respuesta del bot
    setTimeout(() => {
      setIsTyping(false);
      const botResponse: Message = {
        id: `msg-${Date.now()}-bot`,
        text: getBotResponse(text),
        sender: 'support',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1500 + Math.random() * 1000);
  };

  const handleQuickReply = (reply: QuickReply) => {
    sendMessage(reply.text);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    const isSystem = item.sender === 'system';

    if (isSystem) {
      return (
        <View style={styles.systemMessage}>
          <Text style={styles.systemMessageText}>{item.text}</Text>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.supportMessageContainer,
        ]}
      >
        {!isUser && (
          <View style={styles.supportAvatar}>
            <Ionicons name="chatbubble-ellipses" size={16} color={COLORS.white} />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.supportBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.supportMessageText,
            ]}
          >
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                isUser ? styles.userMessageTime : styles.supportMessageTime,
              ]}
            >
              {formatTime(item.timestamp)}
            </Text>
            {isUser && item.status === 'read' && (
              <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.7)" />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <Ionicons name="headset" size={20} color={COLORS.white} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Soporte Quiubole</Text>
            <View style={styles.statusContainer}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>En linea</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={20} color={COLORS.gray} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          showsVerticalScrollIndicator={false}
        />

        {/* Typing Indicator */}
        {isTyping && (
          <View style={styles.typingContainer}>
            <View style={styles.supportAvatar}>
              <Ionicons name="chatbubble-ellipses" size={16} color={COLORS.white} />
            </View>
            <View style={styles.typingBubble}>
              <View style={styles.typingDots}>
                <View style={[styles.typingDot, styles.typingDot1]} />
                <View style={[styles.typingDot, styles.typingDot2]} />
                <View style={[styles.typingDot, styles.typingDot3]} />
              </View>
            </View>
          </View>
        )}

        {/* Quick Replies */}
        {showQuickReplies && (
          <View style={styles.quickRepliesContainer}>
            {QUICK_REPLIES.map((reply) => (
              <TouchableOpacity
                key={reply.id}
                style={styles.quickReplyButton}
                onPress={() => handleQuickReply(reply)}
              >
                <Text style={styles.quickReplyText}>{reply.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="attach" size={24} color={COLORS.gray} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Escribe tu mensaje..."
            placeholderTextColor={COLORS.gray}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? COLORS.white : COLORS.gray}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  statusContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
  statusText: { fontSize: 12, color: COLORS.success },
  menuButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },

  chatContainer: { flex: 1 },
  messagesList: { padding: 16, paddingBottom: 8 },

  // Messages
  messageContainer: { marginBottom: 12, flexDirection: 'row', alignItems: 'flex-end' },
  userMessageContainer: { justifyContent: 'flex-end' },
  supportMessageContainer: { justifyContent: 'flex-start' },
  supportAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: COLORS.myMessage,
    borderBottomRightRadius: 4,
  },
  supportBubble: {
    backgroundColor: COLORS.theirMessage,
    borderBottomLeftRadius: 4,
  },
  messageText: { fontSize: 15, lineHeight: 20 },
  userMessageText: { color: COLORS.white },
  supportMessageText: { color: COLORS.text },
  messageFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4, gap: 4 },
  messageTime: { fontSize: 11 },
  userMessageTime: { color: 'rgba(255,255,255,0.7)' },
  supportMessageTime: { color: COLORS.gray },

  systemMessage: { alignItems: 'center', marginVertical: 16 },
  systemMessageText: { fontSize: 12, color: COLORS.gray, backgroundColor: COLORS.lightGray, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },

  // Typing
  typingContainer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingBottom: 8 },
  typingBubble: { backgroundColor: COLORS.theirMessage, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, borderBottomLeftRadius: 4 },
  typingDots: { flexDirection: 'row', gap: 4 },
  typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.gray },
  typingDot1: { opacity: 0.4 },
  typingDot2: { opacity: 0.6 },
  typingDot3: { opacity: 0.8 },

  // Quick Replies
  quickRepliesContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  quickReplyButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  quickReplyText: { fontSize: 13, color: COLORS.primary, fontWeight: '500' },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  attachButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: COLORS.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: { backgroundColor: COLORS.lightGray },
});
