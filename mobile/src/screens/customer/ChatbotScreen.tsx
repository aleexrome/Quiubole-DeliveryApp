// ==========================================
// CHATBOT SCREEN - Asistente de Recomendaciones
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
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

// Colores de Quiubole
const COLORS = {
  primary: '#FF6B35',
  secondary: '#2E4057',
  success: '#4CAF50',
  background: '#F8F9FA',
  white: '#FFFFFF',
  gray: '#6C757D',
  lightGray: '#E9ECEF',
  text: '#212529',
  textLight: '#6C757D',
};

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
      content: '¡Hola! 👋 Soy Quiu, tu asistente de Quiúbole.\n\n¿Qué se te antoja hoy? Puedo ayudarte a encontrar el lugar perfecto para comer.',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const typingAnimation = useRef(new Animated.Value(0)).current;

  // Sugerencias rápidas
  const quickSuggestions = [
    '🌶️ Algo picante',
    '💰 Económico',
    '🍕 Pizza',
    '🌮 Tacos',
    '🍔 Hamburguesa',
    '🥗 Saludable',
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
            toValue: 0,
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

    // Scroll al final
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Preparar historial de conversación (últimos 10 mensajes)
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

      // Mensaje de error amigable
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Ups, tuve un problema. ¿Podrías intentar de nuevo? 🙏',
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
      <View style={styles.messageContainer}>
        {/* Avatar */}
        {!isUser && (
          <View style={styles.avatarContainer}>
            <View style={styles.botAvatar}>
              <Text style={styles.botAvatarText}>Q</Text>
            </View>
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.assistantMessageText,
            ]}
          >
            {item.content}
          </Text>

          {/* Recomendaciones de restaurantes */}
          {item.recommendations?.restaurants && item.recommendations.restaurants.length > 0 && (
            <View style={styles.recommendationsContainer}>
              {item.recommendations.restaurants.map((restaurant, index) => (
                <TouchableOpacity
                  key={restaurant.id}
                  style={styles.restaurantCard}
                  onPress={() => handleRestaurantPress(restaurant.id, restaurant.name)}
                >
                  <View style={styles.restaurantInfo}>
                    <View style={styles.restaurantNumber}>
                      <Text style={styles.restaurantNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.restaurantDetails}>
                      <Text style={styles.restaurantName}>{restaurant.name}</Text>
                      <Text style={styles.restaurantReason}>{restaurant.reason}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={[styles.timestamp, isUser && styles.userTimestamp]}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {isUser && <View style={styles.avatarContainer} />}
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isLoading) return null;

    return (
      <View style={styles.messageContainer}>
        <View style={styles.avatarContainer}>
          <View style={styles.botAvatar}>
            <Text style={styles.botAvatarText}>Q</Text>
          </View>
        </View>
        <View style={[styles.messageBubble, styles.assistantBubble, styles.typingBubble]}>
          <Animated.View style={{ opacity: typingAnimation }}>
            <Text style={styles.typingText}>Quiu está escribiendo...</Text>
          </Animated.View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>Q</Text>
          </View>
          <View>
            <Text style={styles.headerName}>Quiu</Text>
            <Text style={styles.headerSubtitle}>Tu asistente de comida</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={renderTypingIndicator}
      />

      {/* Quick Suggestions */}
      {messages.length <= 2 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            horizontal
            data={quickSuggestions}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
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

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Escribe qué se te antoja..."
          placeholderTextColor={COLORS.gray}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          onSubmitEditing={() => sendMessage()}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={() => sendMessage()}
          disabled={!inputText.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Ionicons name="send" size={20} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerAvatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 32,
    marginRight: 8,
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botAvatarText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
    marginLeft: 'auto',
  },
  assistantBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
  },
  typingBubble: {
    paddingVertical: 16,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: COLORS.white,
  },
  assistantMessageText: {
    color: COLORS.text,
  },
  timestamp: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  typingText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  recommendationsContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: 12,
  },
  restaurantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  restaurantNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  restaurantNumberText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  restaurantDetails: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  restaurantReason: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  suggestionsContainer: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingVertical: 8,
  },
  suggestionsList: {
    paddingHorizontal: 16,
  },
  suggestionChip: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  suggestionText: {
    fontSize: 14,
    color: COLORS.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: 24,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 50,
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
    marginLeft: -48,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
});
