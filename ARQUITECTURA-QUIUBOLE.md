# Arquitectura Completa de Quiúbole! - Guía para Desarrollo

> **IMPORTANTE**: Este documento contiene toda la información necesaria para continuar el desarrollo de la app Quiúbole! en futuras sesiones de chat. Léelo completo antes de hacer cambios.

---

## 1. Descripción del Proyecto

**Quiúbole!** es una aplicación de delivery de comida similar a Rappi/Uber Eats/DiDi Food, diseñada para el mercado mexicano.

### Características Principales:
- **4 tipos de usuarios**: Cliente, Restaurante, Repartidor, Admin
- **Modelo Uber-style**: Repartidores independientes que se conectan cuando quieren
- **Chatbot con IA (Quiu)**: Recomendaciones personalizadas usando GPT-4
- **Pagos**: Tarjeta (Stripe), OXXO Pay, Efectivo
- **Control de calidad**: Admin aprueba restaurantes, repartidores y productos

---

## 2. Stack Tecnológico

### Backend (NestJS)
```
backend-code/
├── src/
│   ├── admin/          # Panel de administración
│   ├── ai/             # Chatbot con OpenAI
│   ├── auth/           # Autenticación JWT
│   ├── chat/           # WebSocket chat
│   ├── drivers/        # Lógica de repartidores
│   ├── email/          # SendGrid emails
│   ├── maps/           # Google Maps
│   ├── notifications/  # Firebase push
│   ├── orders/         # Gestión de pedidos
│   ├── payments/       # Stripe pagos
│   └── uploads/        # Cloudinary imágenes
```

### Mobile (React Native + Expo)
```
mobile-code/
├── src/
│   ├── hooks/          # useNotifications, etc.
│   ├── navigation/     # AppNavigator (role-based)
│   ├── screens/
│   │   ├── admin/      # Dashboard, Users, Finance, etc.
│   │   ├── auth/       # Login, Register, Verify
│   │   ├── customer/   # Home, Checkout, Tracking, Chatbot
│   │   ├── driver/     # Home, ActiveDelivery, Earnings
│   │   └── restaurant/ # Dashboard, Orders, Menu
│   ├── services/       # API, chat, images, location, notifications, payments
│   ├── store/          # Zustand (authStore)
│   └── types/          # TypeScript interfaces
```

---

## 3. Integraciones Implementadas

### ✅ Firebase Push Notifications
**Archivos clave:**
- `backend-code/src/notifications/notifications.service.ts`
- `mobile-code/src/services/notifications.ts`
- `mobile-code/src/hooks/useNotifications.ts`

**Configuración requerida:**
```env
FIREBASE_PROJECT_ID=quiubole-app
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```

**Tipos de notificaciones:**
- `new_order` - Restaurante: nuevo pedido
- `order_accepted` - Cliente: pedido aceptado
- `driver_assigned` - Cliente: repartidor asignado
- `new_delivery_available` - Repartidores: pedido disponible (broadcast)
- `settlement_reminder` - Repartidor: liquidación pendiente

---

### ✅ Stripe Payments
**Archivos clave:**
- `backend-code/src/payments/payments.service.ts`
- `mobile-code/src/services/payments.ts`
- `mobile-code/src/screens/customer/CheckoutScreen.tsx`

**Configuración requerida:**
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Métodos de pago:**
1. **Tarjeta** - Proceso directo con PaymentIntent
2. **OXXO Pay** - Genera voucher para pagar en tienda
3. **Efectivo** - Repartidor cobra y liquida diariamente

**Flujo de efectivo:**
```
1. Cliente paga en efectivo al repartidor
2. Repartidor acumula comisiones (15% del pedido)
3. Al final del día, transfiere a cuenta de Quiubole
4. Si no liquida → cuenta bloqueada
```

---

### ✅ Google Maps
**Archivos clave:**
- `backend-code/src/maps/maps.service.ts`
- `mobile-code/src/services/location.ts`
- `mobile-code/src/screens/customer/OrderTrackingScreen.tsx`

**Configuración requerida:**
```env
GOOGLE_MAPS_API_KEY=AIza...
```

**Funcionalidades:**
- Cálculo de distancias y tiempos
- Geocodificación/reverse geocoding
- Búsqueda de lugares (Places API)
- Direcciones y rutas
- Tracking en tiempo real del repartidor

**Cálculo de tarifa de envío:**
```typescript
// Primeros 3 km: $20 base
// Después: $5 por km adicional
// Mínimo $20, máximo $100
```

---

### ✅ Cloudinary (Imágenes)
**Archivos clave:**
- `backend-code/src/uploads/uploads.service.ts`
- `mobile-code/src/services/images.ts`

**Configuración requerida:**
```env
CLOUDINARY_CLOUD_NAME=quiubole
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

**Carpetas de imágenes:**
- `products` - Fotos de productos (800x800)
- `restaurants` - Logos y banners (1200x600)
- `users` - Fotos de perfil (400x400)
- `drivers` - Fotos de repartidores (400x400)
- `documents` - INE, licencia, etc.
- `reviews` - Fotos en reseñas

---

### ✅ WebSocket Chat
**Archivos clave:**
- `backend-code/src/chat/chat.gateway.ts`
- `mobile-code/src/services/chat.ts`

**Eventos:**
```typescript
// Cliente → Servidor
'joinChat'      - Unirse a sala de chat
'sendMessage'   - Enviar mensaje
'typing'        - Indicador de escritura
'updateLocation'- Actualizar ubicación (repartidor)

// Servidor → Cliente
'newMessage'    - Nuevo mensaje recibido
'userTyping'    - Usuario escribiendo
'driverLocation'- Ubicación del repartidor
'orderUpdate'   - Actualización de pedido
```

---

### ✅ SendGrid Emails
**Archivos clave:**
- `backend-code/src/email/email.service.ts`

**Configuración requerida:**
```env
SENDGRID_API_KEY=SG.xxx...
EMAIL_FROM=noreply@quiubole.com
EMAIL_FROM_NAME=Quiúbole!
```

**Emails implementados:**
- `sendVerificationEmail()` - Código de 6 dígitos
- `sendPasswordResetEmail()` - Link de recuperación
- `sendWelcomeEmail()` - Bienvenida post-verificación
- `sendOrderConfirmation()` - Confirmación de pedido
- `sendOrderDelivered()` - Pedido entregado
- `sendRestaurantApproved()` - Restaurante aprobado
- `sendDriverApproved()` - Repartidor aprobado
- `sendSettlementReminder()` - Recordatorio de liquidación

---

### ✅ Chatbot IA (Quiu)
**Archivos clave:**
- `backend-code/src/ai/ai.service.ts`
- `mobile-code/src/screens/customer/ChatbotScreen.tsx`

**Configuración requerida:**
```env
OPENAI_API_KEY=sk-...
```

**Funcionalidades:**
1. Análisis de intención del usuario
2. Recomendaciones basadas en:
   - Tipo de comida
   - Rango de precio
   - Estado de ánimo
   - Restricciones dietéticas
3. Respuestas conversacionales naturales
4. Integración con lista de restaurantes

**Ejemplo de uso:**
```
Usuario: "Se me antoja algo picante pero no tan caro"
Quiu: "🌶️ ¡Te gusta el picante! Tengo opciones perfectas..."
[Lista de restaurantes con razones de recomendación]
```

---

## 4. Flujo de Pedidos

```
┌──────────────┐
│   CLIENTE    │
│  Hace pedido │
└──────┬───────┘
       │
       ▼
┌──────────────┐     Push notification
│  RESTAURANTE │ ◄── "¡Nuevo Pedido!"
│   Acepta     │
└──────┬───────┘
       │
       ▼
┌──────────────┐     Broadcast a repartidores cercanos
│ REPARTIDORES │ ◄── "Pedido disponible en [Restaurante]"
│  Disponibles │
└──────┬───────┘
       │ Primero en aceptar
       ▼
┌──────────────┐
│  REPARTIDOR  │
│   Asignado   │
└──────┬───────┘
       │
       ▼
┌──────────────┐     Push: "Tu pedido va en camino"
│   CLIENTE    │ ◄── Tracking en tiempo real
│   Recibe     │
└──────────────┘
```

---

## 5. Roles y Permisos

### Cliente (`customer`)
- Ver restaurantes y productos
- Hacer pedidos
- Tracking en tiempo real
- Chatbot de recomendaciones
- Calificar pedidos

### Restaurante (`restaurant`)
- Dashboard con estadísticas
- Gestionar menú (productos)
- Aceptar/rechazar pedidos
- Ver historial de ventas
- Toggle de disponibilidad

### Repartidor (`driver`)
- Toggle online/offline
- Ver pedidos disponibles (Uber-style)
- Aceptar entregas
- Navegación a restaurante y cliente
- Ver ganancias
- Liquidar efectivo

### Admin (`admin`)
- Dashboard general
- Aprobar/rechazar restaurantes
- Aprobar/rechazar repartidores
- Aprobar/rechazar productos
- Estado de cuenta financiero
- Gestión de cupones
- Envío de promociones

---

## 6. Base de Datos (Entidades Principales)

```typescript
User {
  id, email, password, name, phone, role,
  isVerified, isApproved, createdAt
}

Restaurant {
  id, name, description, address, lat, lng,
  category, rating, isApproved, isActive, ownerId
}

Product {
  id, name, description, price, image,
  category, isAvailable, isApproved, restaurantId
}

Order {
  id, orderNumber, status, total, subtotal,
  deliveryFee, serviceFee, tip,
  paymentMethod, paymentStatus,
  customerId, restaurantId, driverId,
  deliveryAddressId, createdAt, deliveredAt
}

OrderItem {
  id, orderId, productId, quantity, price, options
}

Address {
  id, userId, name, street, number, neighborhood,
  city, state, postalCode, lat, lng, isDefault
}
```

---

## 7. Pantallas Implementadas

### Auth
- [x] `LoginScreen.tsx` - Login con email/password
- [x] `RegisterScreen.tsx` - Registro con selección de rol
- [x] `VerifyEmailScreen.tsx` - Verificación con código 6 dígitos
- [x] `ForgotPasswordScreen.tsx` - Recuperación de contraseña
- [x] `RoleSelectionScreen.tsx` - Selección visual de rol

### Customer
- [x] `HomeScreen.tsx` - Restaurantes, categorias, busqueda, banner Quiu
- [x] `RestaurantDetailScreen.tsx` - Menu del restaurante con opciones de producto
- [x] `CartScreen.tsx` - Carrito con cupones y resumen
- [x] `CheckoutScreen.tsx` - Proceso de pago completo
- [x] `OrderTrackingScreen.tsx` - Tracking con mapa
- [x] `OrderHistoryScreen.tsx` - Historial con filtros y estados
- [x] `ProfileScreen.tsx` - Perfil, configuracion, menu de opciones
- [x] `ChatbotScreen.tsx` - Asistente Quiu
- [x] `RateOrderScreen.tsx` - Calificar pedidos con estrellas y tags

### Restaurant
- [x] `DashboardScreen.tsx` - Stats y pedidos pendientes
- [x] `OrdersScreen.tsx` - Gestión de pedidos
- [x] `MenuScreen.tsx` - CRUD de productos
- [x] `StatsScreen.tsx` - Estadísticas
- [x] `ProfileScreen.tsx` - Configuración

### Driver
- [x] `HomeScreen.tsx` - Toggle online + pedidos disponibles
- [x] `ActiveDeliveryScreen.tsx` - Entrega activa
- [x] `EarningsScreen.tsx` - Ganancias
- [x] `DeliveriesScreen.tsx` - Historial
- [x] `ProfileScreen.tsx` - Documentos y config

### Admin
- [x] `DashboardScreen.tsx` - KPIs
- [x] `UsersScreen.tsx` - Gestión de usuarios
- [x] `RestaurantsScreen.tsx` - Aprobar restaurantes
- [x] `OrdersScreen.tsx` - Monitoreo de pedidos
- [x] `ProductsScreen.tsx` - Aprobar productos
- [x] `SettingsScreen.tsx` - Configuración
- [x] `FinanceScreen.tsx` - Estado de cuenta

---

## 8. Variables de Entorno Requeridas

```env
# Servidor
PORT=3001
NODE_ENV=development

# Base de datos
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=quiubole_db
DATABASE_USER=quiubole_user
DATABASE_PASSWORD=tu_password

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro
JWT_EXPIRES_IN=7d

# Firebase
FIREBASE_PROJECT_ID=quiubole-app
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Google Maps
GOOGLE_MAPS_API_KEY=AIza...

# Cloudinary
CLOUDINARY_CLOUD_NAME=quiubole
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# SendGrid
SENDGRID_API_KEY=SG.xxx...
EMAIL_FROM=noreply@quiubole.com

# OpenAI
OPENAI_API_KEY=sk-...

# URLs
FRONTEND_URL=http://localhost:3000
MOBILE_SCHEME=quiubole
```

---

## 9. Configuración del Servidor y Base de Datos

### PostgreSQL - Crear Base de Datos
```bash
# Conectar a PostgreSQL
sudo -u postgres psql

# Crear usuario y base de datos
CREATE USER quiubole_user WITH PASSWORD 'tu_password_seguro';
CREATE DATABASE quiubole_db OWNER quiubole_user;
GRANT ALL PRIVILEGES ON DATABASE quiubole_db TO quiubole_user;
\q
```

### TypeORM - Archivo de Configuración
**Ubicación:** `backend-code/src/config/database.config.ts`
```typescript
// Las entidades se sincronizan automáticamente en desarrollo
// En producción usar migraciones
{
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: process.env.NODE_ENV === 'development',
}
```

### URLs de la API
```typescript
// Desarrollo local
const API_URL = 'http://localhost:3001/api';

// Para emulador Android
const API_URL = 'http://10.0.2.2:3001/api';

// Para dispositivo físico (usar IP de tu computadora)
const API_URL = 'http://192.168.x.x:3001/api';

// Producción (ejemplo)
const API_URL = 'https://api.quiubole.com/api';
```

### Archivo API Service
**Ubicación:** `mobile-code/src/services/api.ts`
- Axios configurado con interceptors
- Manejo automático de tokens JWT
- Base URL configurable

---

## 10. Comandos para Desarrollo

```bash
# Backend
cd backend-code
npm install
npm run start:dev     # Desarrollo con hot-reload
npm run start:prod    # Producción
npm run build         # Compilar a JavaScript

# Mobile
cd mobile-code
npm install
npx expo start        # Iniciar Expo
npx expo start --android  # Directo a Android
npx expo start --ios      # Directo a iOS

# Regenerar proyecto nativo (después de cambiar plugins)
npx expo prebuild

# Build para producción
eas build --platform android
eas build --platform ios
```

---

## 11. Tareas Pendientes

### ✅ Completado
- [x] Pantallas completas del cliente (Home, Cart, RestaurantDetail, Profile, OrderHistory, RateOrder)
- [x] Sistema de calificaciones y reseñas (backend + mobile)
- [x] `app.module.ts` principal que importa todos los módulos
- [x] `main.ts` entry point del servidor

### 🟡 Importante
- [ ] Tests unitarios y de integración
- [ ] Términos y condiciones / Política de privacidad
- [ ] Mejorar manejo de errores en el frontend
- [ ] Actualizar navegación para incluir nuevas pantallas

### 🟢 Nice to have
- [ ] Modo oscuro
- [ ] Soporte para múltiples idiomas
- [ ] Animaciones y transiciones mejoradas

---

## 12. Estructura de Commits

Los commits siguen este patrón:
```
Add [feature] for [purpose]

- Backend: [backend changes]
- Mobile: [mobile changes]
- [Additional details]
```

Ejemplo:
```
Add Firebase push notifications integration

- Backend: notifications module with firebase-admin SDK
- Mobile: expo-notifications service with permission handling
- Added useNotifications hook for easy integration
```

---

## 13. Guías de Configuración Adicionales

Ver estos archivos para configuración detallada:
- `SETUP-FIREBASE.md` - Configuración de Firebase
- `SETUP-STRIPE.md` - Configuración de Stripe
- `GUIA-INSTALACION-QUIUBOLE.md` - Instalación general
- `PALETA-COLORES-QUIUBOLE.md` - Diseño y colores

---

## 14. Colores de la Marca

```typescript
const COLORS = {
  primary: '#FF6B35',    // Naranja Quiubole
  secondary: '#2E4057',  // Azul oscuro
  success: '#4CAF50',    // Verde
  warning: '#FFC107',    // Amarillo
  danger: '#F44336',     // Rojo
  background: '#F8F9FA', // Gris claro
  white: '#FFFFFF',
  gray: '#6C757D',
  lightGray: '#E9ECEF',
  text: '#212529',
  textLight: '#6C757D',
};
```

---

## 15. Notas Importantes

1. **Sin API keys**: El código funciona en modo simulación cuando no hay API keys configuradas.

2. **Modelo de efectivo**: Los repartidores cobran efectivo y liquidan diariamente. Si no liquidan, su cuenta se bloquea.

3. **Aprobación de contenido**: Todo (restaurantes, repartidores, productos) requiere aprobación del admin antes de ser visible.

4. **Chatbot Quiu**: Funciona con respuestas simuladas si no hay OPENAI_API_KEY.

5. **WebSockets**: El chat usa Socket.IO en el namespace `/chat`.

---

*Última actualización: Noviembre 2024*
*Versión: 1.0.0*
