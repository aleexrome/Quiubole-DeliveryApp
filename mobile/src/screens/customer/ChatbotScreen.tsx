// ==========================================
// DEVOLÓN — ChatbotScreen
//
// Asistente IA "Devo". Layout dark con header sticky (avatar amarillo +
// status online), feed de burbujas (usuario amarillo, bot glass) y
// composer inferior tipo input filled. Quick suggestions en pills glass.
// ==========================================

import React, { useState, useRef, useEffect } from 'react';
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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
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
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  recommendations?: {
    restaurants: {
      id: string;
      name: string;
      reason: string;
      matchScore: number;
    }[];
  };
}

interface ChatbotScreenProps {
  navigation: any;
}

export default function ChatbotScreen({ navigation }: ChatbotScreenProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        'Soy Devo, tu asistente Devolón.\n\n¿Qué se te antoja hoy? Te ayudo a encontrar el lugar perfecto.',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const typingAnimation = useRef(new Animated.Value(0)).current;

  const quickSuggestions = [
    'Algo picante',
    'Económico',
    'Pizza',
    'Tacos',
    'Hamburguesa',
    'Saludable',
  ];

  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(typingAnimation, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      typingAnimation.setValue(0);
    }
  }, [isLoading]);

  const sendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    setInputText('');
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const conversationHistory = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await api.post('/ai/chat', {
        message: messageText,
        conversationHistory,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(response.data.timestamp),
        recommendations: response.data.recommendations,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Tuve un problema al procesar tu mensaje. ¿Intentamos de nuevo?',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleRestaurantPress = (restaurantId: string, restaurantName: string) => {
    navigation.navigate('RestaurantDetail', { restaurantId, restaurantName });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        {!isUser && (
          <View style={styles.botAvatar}>
            <Ionicons name="sparkles" size={14} color={colors.onPrimary} />
          </View>
        )}

        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              isUser ? styles.userBubbleText : styles.assistantBubbleText,
            ]}
          >
            {item.content}
          </Text>

          {item.recommendations?.restaurants && item.recommendations.restaurants.length > 0 && (
            <View style={styles.recommendations}>
              {item.recommendations.restaurants.map((restaurant, index) => (
                <TouchableOpacity
                  key={restaurant.id}
                  activeOpacity={0.88}
                  style={styles.recCard}
                  onPress={() => handleRestaurantPress(restaurant.id, restaurant.name)}
                >
                  <View style={styles.recBadge}>
                    <Text style={styles.recBadgeText}>{index + 1}</Text>
                  </View>
                  <View style={styles.recBody}>
                    <Text style={styles.recName} numberOfLines={1}>{restaurant.name}</Text>
                    <Text style={styles.recReason} numberOfLines={2}>{restaurant.reason}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={[styles.timestamp, isUser && styles.userTimestamp]}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isLoading) return null;

    return (
      <View style={styles.messageRow}>
        <View style={styles.botAvatar}>
          <Ionicons name="sparkles" size={14} color={colors.onPrimary} />
        </View>
        <View style={[styles.bubble, styles.assistantBubble, styles.typingBubble]}>
          <Animated.View style={{ opacity: typingAnimation }}>
            <Text style={styles.typingText}>Devo está pensando…</Text>
          </Animated.View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.iconBtn}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerIdentity}>
          <View style={styles.headerAvatar}>
            <Ionicons name="sparkles" size={18} color={colors.onPrimary} />
          </View>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerEyebrow}>ASISTENTE IA</Text>
            <View style={styles.headerStatusRow}>
              <Text style={styles.headerName}>Devo</Text>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>En línea</Text>
            </View>
          </View>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderTypingIndicator}
        />

        {/* QUICK SUGGESTIONS */}
        {messages.length <= 2 && (
          <View style={styles.suggestionsWrap}>
            <Text style={styles.suggestionsEyebrow}>SUGERENCIAS</Text>
            <FlatList
              horizontal
              data={quickSuggestions}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.suggestionChip}
                  onPress={() => sendMessage(item)}
                >
                  <Text style={styles.suggestionText}>{item}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.suggestionsList}
            />
          </View>
        )}

        {/* COMPOSER */}
        <View style={styles.composer}>
          <View style={styles.inputField}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Escribe qué se te antoja…"
              placeholderTextColor={colors.textFaint}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              onSubmitEditing={() => sendMessage()}
              returnKeyType="send"
              selectionColor={colors.primary}
            />
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <Ionicons name="arrow-up" size={20} color={colors.onPrimary} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },

  // ============ HEADER ============
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s.md,
    paddingVertical: s.xs,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
  headerTitleBlock: { flex: 1 },
  headerEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  headerName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    letterSpacing: -0.3,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.success,
    marginLeft: 4,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },

  // ============ MESSAGES ============
  messagesList: {
    padding: s.md,
    paddingBottom: s.xs,
    gap: s.sm,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: s.xs,
    maxWidth: '100%',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: s.md,
    paddingVertical: s.sm,
    borderRadius: radius.xl,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  typingBubble: {
    paddingVertical: s.md,
  },
  bubbleText: {
    fontSize: fontSize.md,
    lineHeight: 20,
    fontWeight: fontWeight.medium,
  },
  userBubbleText: {
    color: colors.onPrimary,
    fontWeight: fontWeight.semibold,
  },
  assistantBubbleText: {
    color: colors.text,
  },
  timestamp: {
    fontSize: fontSize.xxs,
    color: colors.textFaint,
    fontWeight: fontWeight.semibold,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: 'rgba(0,0,0,0.55)',
  },
  typingText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
    fontStyle: 'italic',
  },

  // ============ RECOMMENDATIONS ============
  recommendations: {
    marginTop: s.sm,
    paddingTop: s.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: s.xs,
  },
  recCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.border,
    padding: s.sm,
    borderRadius: radius.md,
  },
  recBadge: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.15)',
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recBadgeText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.black,
  },
  recBody: { flex: 1 },
  recName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  recReason: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginTop: 2,
    lineHeight: 16,
  },

  // ============ SUGGESTIONS ============
  suggestionsWrap: {
    paddingTop: s.xs,
    paddingBottom: s.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  suggestionsEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    paddingHorizontal: s.md,
    marginBottom: s.xs,
  },
  suggestionsList: {
    paddingHorizontal: s.md,
    gap: s.xs,
  },
  suggestionChip: {
    paddingHorizontal: s.md,
    paddingVertical: s.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: s.xs,
  },
  suggestionText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },

  // ============ COMPOSER ============
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: s.xs,
    paddingHorizontal: s.md,
    paddingTop: s.sm,
    paddingBottom: s.sm,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputField: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingHorizontal: s.md,
    paddingVertical: s.sm,
    minHeight: 48,
    maxHeight: 120,
    justifyContent: 'center',
  },
  input: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    paddingVertical: 0,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceStrong,
    opacity: 0.6,
  },
});
