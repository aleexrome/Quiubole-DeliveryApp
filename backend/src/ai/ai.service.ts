// ==========================================
// AI SERVICE - OpenAI + Recomendaciones
// ==========================================

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';

// Interfaces
interface Restaurant {
  id: string;
  name: string;
  description: string;
  category: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  deliveryTime: string;
  tags: string[];
  isOpen: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  restaurantId: string;
  restaurantName: string;
  rating: number;
  tags: string[];
}

interface RecommendationResult {
  restaurants: {
    id: string;
    name: string;
    reason: string;
    matchScore: number;
  }[];
  products: {
    id: string;
    name: string;
    restaurantName: string;
    reason: string;
    price: number;
  }[];
  message: string;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI | null = null;
  private isConfigured = false;

  // Cache de datos para contexto
  private restaurantsCache: Restaurant[] = [];
  private productsCache: Product[] = [];

  onModuleInit() {
    this.initializeOpenAI();
  }

  private initializeOpenAI() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      this.logger.warn('OpenAI API key not configured - AI features will be simulated');
      return;
    }

    this.openai = new OpenAI({ apiKey });
    this.isConfigured = true;
    this.logger.log('OpenAI initialized successfully');
  }

  // ==========================================
  // CHATBOT DE RECOMENDACIONES
  // ==========================================

  async chat(
    userMessage: string,
    conversationHistory: ChatMessage[] = [],
    userPreferences?: {
      location?: { lat: number; lng: number };
      previousOrders?: string[];
      favoriteCategories?: string[];
    },
  ): Promise<{ response: string; recommendations?: RecommendationResult }> {
    // Construir contexto del sistema
    const systemContext = this.buildSystemContext(userPreferences);

    // Construir historial de conversación
    const messages: ChatMessage[] = [
      { role: 'system', content: systemContext },
      ...conversationHistory.slice(-10), // Últimos 10 mensajes
      { role: 'user', content: userMessage },
    ];

    if (!this.isConfigured) {
      return this.simulateResponse(userMessage);
    }

    try {
      // Primero, analizar la intención del usuario
      const intent = await this.analyzeIntent(userMessage);

      // Si busca comida, obtener recomendaciones
      let recommendations: RecommendationResult | undefined;
      if (intent.type === 'food_search' || intent.type === 'recommendation') {
        recommendations = await this.getRecommendations(intent.criteria);
      }

      // Generar respuesta conversacional
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        max_tokens: 500,
        temperature: 0.7,
      });

      let aiResponse = response.choices[0]?.message?.content || 'Lo siento, no pude procesar tu solicitud.';

      // Si hay recomendaciones, enriquecerlas en la respuesta
      if (recommendations && recommendations.restaurants.length > 0) {
        aiResponse = this.enrichResponseWithRecommendations(aiResponse, recommendations);
      }

      return { response: aiResponse, recommendations };
    } catch (error) {
      this.logger.error('Error in AI chat:', error);
      return this.simulateResponse(userMessage);
    }
  }

  private buildSystemContext(userPreferences?: any): string {
    const restaurantsList = this.restaurantsCache
      .slice(0, 20)
      .map((r) => `- ${r.name} (${r.category}): ${r.rating}⭐, ${r.priceRange}, ${r.deliveryTime}`)
      .join('\n');

    return `Eres el asistente de Quiúbole!, una app de delivery de comida en México.
Tu nombre es "Quiu" y tu personalidad es amigable, mexicana y conocedora de comida.

RESTAURANTES DISPONIBLES:
${restaurantsList || 'Cargando restaurantes...'}

INSTRUCCIONES:
- Ayuda a los usuarios a encontrar comida basándote en sus antojos, preferencias y estado de ánimo
- Usa expresiones mexicanas naturales (pero no exageres)
- Si el usuario busca algo específico (ej: "algo picante"), recomienda opciones relevantes
- Menciona precios aproximados y tiempos de entrega cuando sea relevante
- Si no entiendes algo, pregunta para clarificar
- Sé conciso pero útil

${userPreferences?.favoriteCategories ? `Categorías favoritas del usuario: ${userPreferences.favoriteCategories.join(', ')}` : ''}
`;
  }

  private async analyzeIntent(message: string): Promise<{
    type: 'food_search' | 'recommendation' | 'question' | 'greeting' | 'other';
    criteria: {
      foodType?: string;
      priceRange?: string;
      mood?: string;
      dietary?: string[];
      keywords: string[];
    };
  }> {
    if (!this.isConfigured) {
      return {
        type: 'food_search',
        criteria: { keywords: message.toLowerCase().split(' ') },
      };
    }

    try {
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Analiza el mensaje del usuario y extrae la intención y criterios de búsqueda de comida.
Responde SOLO con JSON válido, sin markdown ni explicaciones.
Formato: {"type": "food_search|recommendation|question|greeting|other", "criteria": {"foodType": "...", "priceRange": "barato|medio|caro", "mood": "...", "dietary": ["vegetariano", "sin gluten"], "keywords": ["palabra1", "palabra2"]}}`,
          },
          { role: 'user', content: message },
        ],
        max_tokens: 200,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content || '{}';
      return JSON.parse(content);
    } catch (error) {
      this.logger.error('Error analyzing intent:', error);
      return {
        type: 'food_search',
        criteria: { keywords: message.toLowerCase().split(' ') },
      };
    }
  }

  private async getRecommendations(criteria: any): Promise<RecommendationResult> {
    // Filtrar restaurantes basados en criterios
    let filteredRestaurants = [...this.restaurantsCache];

    // Filtrar por keywords en nombre, descripción o tags
    if (criteria.keywords?.length > 0) {
      const keywords = criteria.keywords.map((k: string) => k.toLowerCase());
      filteredRestaurants = filteredRestaurants.filter((r) => {
        const searchText = `${r.name} ${r.description} ${r.category} ${r.tags.join(' ')}`.toLowerCase();
        return keywords.some((k: string) => searchText.includes(k));
      });
    }

    // Filtrar por tipo de comida
    if (criteria.foodType) {
      filteredRestaurants = filteredRestaurants.filter(
        (r) =>
          r.category.toLowerCase().includes(criteria.foodType.toLowerCase()) ||
          r.tags.some((t) => t.toLowerCase().includes(criteria.foodType.toLowerCase())),
      );
    }

    // Ordenar por rating
    filteredRestaurants.sort((a, b) => b.rating - a.rating);

    // Tomar los mejores 5
    const topRestaurants = filteredRestaurants.slice(0, 5);

    return {
      restaurants: topRestaurants.map((r, index) => ({
        id: r.id,
        name: r.name,
        reason: this.generateRecommendationReason(r, criteria),
        matchScore: 100 - index * 10,
      })),
      products: [],
      message: topRestaurants.length > 0
        ? `Encontré ${topRestaurants.length} opciones que te pueden gustar`
        : 'No encontré restaurantes que coincidan exactamente, pero te muestro opciones similares',
    };
  }

  private generateRecommendationReason(restaurant: Restaurant, criteria: any): string {
    const reasons: string[] = [];

    if (restaurant.rating >= 4.5) {
      reasons.push('Excelentes reseñas');
    }

    if (criteria.priceRange && restaurant.priceRange.includes(criteria.priceRange)) {
      reasons.push('Dentro de tu presupuesto');
    }

    if (restaurant.deliveryTime?.includes('rápido') || restaurant.deliveryTime?.includes('15')) {
      reasons.push('Entrega rápida');
    }

    return reasons.join(' • ') || 'Coincide con tu búsqueda';
  }

  private enrichResponseWithRecommendations(response: string, recommendations: RecommendationResult): string {
    if (recommendations.restaurants.length === 0) {
      return response;
    }

    const restaurantList = recommendations.restaurants
      .map((r, i) => `${i + 1}. **${r.name}** - ${r.reason}`)
      .join('\n');

    return `${response}\n\n🍽️ **Mis recomendaciones:**\n${restaurantList}\n\n¿Te gustaría ver el menú de alguno?`;
  }

  // ==========================================
  // ACTUALIZACIÓN DE CACHE
  // ==========================================

  updateRestaurantsCache(restaurants: Restaurant[]) {
    this.restaurantsCache = restaurants;
    this.logger.log(`Updated restaurants cache: ${restaurants.length} items`);
  }

  updateProductsCache(products: Product[]) {
    this.productsCache = products;
    this.logger.log(`Updated products cache: ${products.length} items`);
  }

  // ==========================================
  // SIMULACIÓN (cuando no hay API key)
  // ==========================================

  private simulateResponse(message: string): { response: string; recommendations?: RecommendationResult } {
    const lowerMessage = message.toLowerCase();

    // Respuestas simuladas basadas en palabras clave
    if (lowerMessage.includes('hola') || lowerMessage.includes('hey')) {
      return {
        response: '¡Hola! 👋 Soy Quiu, tu asistente de Quiúbole. ¿Qué se te antoja hoy? Puedo ayudarte a encontrar el lugar perfecto para comer.',
      };
    }

    if (lowerMessage.includes('picante') || lowerMessage.includes('picoso')) {
      return {
        response: '🌶️ ¡Te gusta el picante! Tengo opciones perfectas para ti.',
        recommendations: {
          restaurants: [
            { id: '1', name: 'Tacos El Güero', reason: 'Famosos por su salsa habanero', matchScore: 95 },
            { id: '2', name: 'La Diabla Wings', reason: 'Alitas extra picantes', matchScore: 90 },
            { id: '3', name: 'Thai Express', reason: 'Curry rojo nivel 🔥🔥🔥', matchScore: 85 },
          ],
          products: [],
          message: 'Encontré 3 opciones picantes',
        },
      };
    }

    if (lowerMessage.includes('barato') || lowerMessage.includes('económico')) {
      return {
        response: '💰 ¡Entiendo! Aquí hay opciones económicas y deliciosas.',
        recommendations: {
          restaurants: [
            { id: '4', name: 'Tortas Don Juan', reason: 'Tortas desde $35', matchScore: 95 },
            { id: '5', name: 'Tacos de Canasta', reason: 'Tacos a $8', matchScore: 92 },
            { id: '6', name: 'Quesadillas Doña Mary', reason: 'Combo económico $45', matchScore: 88 },
          ],
          products: [],
          message: 'Encontré 3 opciones económicas',
        },
      };
    }

    if (lowerMessage.includes('pizza') || lowerMessage.includes('italiana')) {
      return {
        response: '🍕 ¡Pizza! Excelente elección.',
        recommendations: {
          restaurants: [
            { id: '7', name: 'Pizza Napolitana', reason: '4.9⭐ - La mejor pizza de la zona', matchScore: 98 },
            { id: '8', name: 'Dominos', reason: 'Promoción 2x1 hoy', matchScore: 85 },
            { id: '9', name: 'Little Caesars', reason: 'Entrega en 15 min', matchScore: 80 },
          ],
          products: [],
          message: 'Encontré 3 pizzerías',
        },
      };
    }

    // Respuesta genérica
    return {
      response: '🤔 Hmm, déjame pensar... ¿Podrías ser más específico? Por ejemplo:\n\n- "Algo picante pero no tan caro"\n- "Comida rápida cerca de mí"\n- "Algo dulce para el postre"\n\n¿Qué tipo de comida se te antoja?',
    };
  }
}
