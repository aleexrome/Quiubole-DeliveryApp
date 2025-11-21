# Configuración de Firebase para Quiúbole!

Esta guía explica cómo configurar Firebase Cloud Messaging para notificaciones push.

## 1. Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Click en "Agregar proyecto"
3. Nombre: `quiubole-app`
4. Desactiva Google Analytics (opcional)
5. Click "Crear proyecto"

## 2. Configurar Firebase para Android

1. En Firebase Console, click en el ícono de Android
2. Nombre del paquete: `com.quiubole.app`
3. Apodo: `Quiubole Android`
4. Descarga `google-services.json`
5. Coloca el archivo en: `mobile-code/google-services.json`

## 3. Configurar Firebase para iOS

1. En Firebase Console, click en el ícono de iOS
2. Bundle ID: `com.quiubole.app`
3. Apodo: `Quiubole iOS`
4. Descarga `GoogleService-Info.plist`
5. Coloca el archivo en: `mobile-code/ios/GoogleService-Info.plist`

### Configuración adicional de iOS

Para que las notificaciones funcionen en iOS, necesitas:

1. **Apple Developer Account** ($99/año)
2. **Certificado APNs** o **APNs Key**:
   - Ve a [Apple Developer Portal](https://developer.apple.com/)
   - Certificates, Identifiers & Profiles
   - Keys → Create a Key
   - Habilita "Apple Push Notifications service (APNs)"
   - Descarga el archivo .p8

3. **Subir la Key a Firebase**:
   - Firebase Console → Project Settings → Cloud Messaging
   - iOS app configuration → APNs Authentication Key
   - Sube el archivo .p8
   - Ingresa el Key ID y Team ID

## 4. Generar Credenciales del Servidor (Service Account)

1. Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Guarda el archivo JSON de forma segura
4. **NUNCA** subas este archivo a git

## 5. Configurar Variables de Entorno (Backend)

### Opción A: JSON completo (recomendado)

```bash
# .env
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"quiubole-app","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@quiubole-app.iam.gserviceaccount.com",...}'
```

### Opción B: Valores individuales

```bash
# .env
FIREBASE_PROJECT_ID=quiubole-app
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@quiubole-app.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"
```

## 6. Configurar la App Móvil

### Actualizar app.json

```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "plugins": [
      "expo-notifications"
    ]
  }
}
```

### Actualizar eas.json (para builds)

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "resourceClass": "m1-medium"
      }
    }
  }
}
```

## 7. Probar Notificaciones

### Desde Firebase Console

1. Firebase Console → Cloud Messaging
2. "Send your first message"
3. Ingresa título y texto
4. Target: App (selecciona tu app)
5. Send test message
6. Ingresa el FCM token del dispositivo

### Desde el Backend (API)

```bash
# Enviar notificación de prueba
curl -X POST http://localhost:3001/api/notifications/test \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json"
```

### Desde la App

```typescript
import { useNotifications } from '../hooks/useNotifications';

function TestScreen() {
  const { sendTestNotification } = useNotifications();

  return (
    <Button onPress={sendTestNotification} title="Probar Notificación" />
  );
}
```

## 8. Troubleshooting

### Las notificaciones no llegan en Android

1. Verifica que `google-services.json` esté en la raíz de `mobile-code/`
2. Ejecuta `npx expo prebuild` para regenerar nativos
3. Verifica que el token se registre correctamente en el backend

### Las notificaciones no llegan en iOS

1. Verifica la configuración de APNs en Firebase
2. Las notificaciones push NO funcionan en simulador, usa dispositivo físico
3. Verifica que el certificado/key APNs esté activo

### Error "messaging/registration-token-not-registered"

El token expiró o el usuario desinstaló la app. El backend automáticamente limpia estos tokens.

### Error "Firebase app already initialized"

Ya hay una instancia de Firebase. El código maneja esto automáticamente.

## 9. Arquitectura de Notificaciones

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   App Móvil     │────>│   Backend       │────>│   Firebase      │
│                 │     │   (NestJS)      │     │   Cloud         │
│  - Obtiene token│     │  - Almacena     │     │   Messaging     │
│  - Registra     │     │    tokens       │     │                 │
│  - Escucha      │     │  - Envía        │     │  - Enruta       │
│    notif.       │     │    notif.       │     │  - Entrega      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
    Dispositivo            Base de Datos           APNs / FCM
      Usuario               PostgreSQL              (Google)
```

## 10. Tipos de Notificaciones Implementadas

| Tipo | Destinatario | Descripción |
|------|--------------|-------------|
| `new_order` | Restaurante | Nuevo pedido recibido |
| `order_accepted` | Cliente | Restaurante aceptó pedido |
| `order_preparing` | Cliente | Preparando pedido |
| `order_ready` | Repartidor | Pedido listo para recoger |
| `driver_assigned` | Cliente | Repartidor asignado |
| `driver_picked_up` | Cliente | Repartidor recogió pedido |
| `driver_nearby` | Cliente | Repartidor cerca |
| `order_delivered` | Cliente | Pedido entregado |
| `order_cancelled` | Todos | Pedido cancelado |
| `new_delivery_available` | Repartidores | Nuevo pedido disponible |
| `payment_received` | Restaurante | Pago recibido |
| `promotion` | Clientes | Promoción |
| `chat_message` | Usuario | Mensaje de chat |
| `settlement_reminder` | Repartidor | Recordatorio de liquidación |

---

## Comandos Útiles

```bash
# Instalar dependencias del backend
cd backend-code && npm install

# Instalar dependencias del móvil
cd mobile-code && npm install

# Regenerar proyecto nativo (necesario después de cambiar plugins)
cd mobile-code && npx expo prebuild

# Ejecutar en desarrollo
cd mobile-code && npx expo start

# Build para Android
cd mobile-code && eas build --platform android

# Build para iOS
cd mobile-code && eas build --platform ios
```
