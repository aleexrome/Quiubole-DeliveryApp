# Configuración de Stripe para Quiúbole!

Esta guía explica cómo configurar Stripe para procesar pagos con tarjeta en México.

## 1. Crear Cuenta de Stripe

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com/register)
2. Registra tu cuenta con email empresarial
3. Completa la verificación de identidad (KYC)
4. Para México, necesitarás:
   - RFC de la empresa
   - CLABE bancaria
   - Identificación oficial del representante legal

## 2. Obtener API Keys

1. En el Dashboard, ve a **Developers → API Keys**
2. Copia las keys:
   - **Publishable key**: `pk_test_...` (para el frontend)
   - **Secret key**: `sk_test_...` (para el backend)

### Modo Test vs Live

- **Test mode**: Usa tarjetas de prueba, no cobra dinero real
- **Live mode**: Cobra dinero real a tarjetas reales

## 3. Configurar Variables de Entorno

```bash
# backend-code/.env

# Stripe - Modo Test
STRIPE_SECRET_KEY=sk_test_51ABC...
STRIPE_PUBLISHABLE_KEY=pk_test_51ABC...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe - Modo Live (producción)
# STRIPE_SECRET_KEY=sk_live_51ABC...
# STRIPE_PUBLISHABLE_KEY=pk_live_51ABC...
```

## 4. Configurar Webhooks

Los webhooks notifican al backend cuando un pago se completa/falla.

1. Ve a **Developers → Webhooks**
2. Click "Add endpoint"
3. URL: `https://tu-dominio.com/api/payments/webhook`
4. Eventos a escuchar:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `customer.subscription.created` (si usas suscripciones)

5. Copia el **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### Testing webhooks localmente

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Escuchar eventos
stripe listen --forward-to localhost:3001/api/payments/webhook
```

## 5. Tarjetas de Prueba

| Número | Descripción |
|--------|-------------|
| 4242 4242 4242 4242 | Pago exitoso |
| 4000 0000 0000 0002 | Tarjeta declinada |
| 4000 0000 0000 9995 | Fondos insuficientes |
| 4000 0025 0000 3155 | Requiere 3D Secure |
| 4000 0000 0000 0077 | Pago asíncrono (OXXO) |

- **Fecha**: Cualquier fecha futura (ej: 12/25)
- **CVC**: Cualquier 3 dígitos (ej: 123)
- **CP**: Cualquier código postal válido (ej: 06600)

## 6. Flujo de Pago Implementado

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   App Móvil     │────>│   Backend       │────>│   Stripe API    │
│                 │     │   (NestJS)      │     │                 │
│  1. Checkout    │     │  2. Crear       │     │  3. Procesar    │
│     Screen      │     │     Payment     │     │     Pago        │
│                 │     │     Intent      │     │                 │
│  4. Confirmar   │<────│  5. Webhook     │<────│  6. Notificar   │
│     al usuario  │     │     recibido    │     │     resultado   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 7. Métodos de Pago Soportados

### Tarjetas (Implementado)
- Visa, Mastercard, American Express
- 3D Secure automático
- Guardado de tarjetas para pagos futuros

### OXXO Pay (Implementado)
- Cliente recibe voucher con código de barras
- Paga en cualquier OXXO en 24-48 horas
- Webhook notifica cuando se completa el pago

### Futuros (Posibles)
- SPEI (transferencia bancaria)
- Apple Pay / Google Pay
- PayPal

## 8. Comisiones de Stripe México

| Concepto | Comisión |
|----------|----------|
| Tarjetas nacionales | 3.6% + $3 MXN |
| Tarjetas internacionales | 4.5% + $3 MXN |
| OXXO Pay | 3% + $10 MXN |
| Reembolsos | Sin costo |

## 9. Seguridad

### En el Backend
- Nunca expongas el `STRIPE_SECRET_KEY`
- Valida siempre la firma de webhooks
- Usa HTTPS en producción
- Implementa rate limiting

### En el Frontend
- Usa el SDK oficial de Stripe
- Nunca almacenes números de tarjeta
- Solo usa el `clientSecret` del PaymentIntent

## 10. Integración con React Native

Para la app móvil, puedes usar:

### Opción A: @stripe/stripe-react-native (Recomendado)

```bash
npx expo install @stripe/stripe-react-native
```

```typescript
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';

// En App.tsx
<StripeProvider publishableKey="pk_test_...">
  <App />
</StripeProvider>

// En CheckoutScreen
const { confirmPayment } = useStripe();

const handlePay = async () => {
  const { error } = await confirmPayment(clientSecret, {
    paymentMethodType: 'Card',
  });

  if (error) {
    Alert.alert('Error', error.message);
  } else {
    // Pago exitoso
  }
};
```

### Opción B: WebView (Implementación actual)

La implementación actual usa el backend para procesar pagos directamente,
lo cual funciona pero es menos fluido para el usuario.

## 11. Checklist de Producción

- [ ] Cambiar a API keys de producción (`sk_live_...`)
- [ ] Configurar webhook de producción
- [ ] Activar verificación 3D Secure
- [ ] Configurar notificaciones de disputas
- [ ] Probar flujo completo con tarjeta real
- [ ] Configurar manejo de errores y reintentos
- [ ] Implementar logging de transacciones
- [ ] Configurar alertas de fraude

## 12. Troubleshooting

### "Your card was declined"
- Usar tarjeta de prueba 4242...
- Verificar que estás en modo test

### "Invalid API Key"
- Verificar que usas la key correcta (test/live)
- Verificar que la key está en .env

### Webhook no llega
- Verificar URL del webhook
- Verificar que el servidor está accesible
- Usar Stripe CLI para debug local

### Error de CORS
- Los webhooks no usan CORS
- Si tienes problemas, verifica la configuración de NestJS

---

## Comandos Útiles

```bash
# Verificar configuración de Stripe
curl https://api.stripe.com/v1/charges \
  -u sk_test_YOUR_KEY:

# Crear un pago de prueba
stripe payment_intents create \
  --amount=10000 \
  --currency=mxn \
  -d "payment_method_types[]"=card

# Ver logs de webhooks
stripe logs tail

# Reenviar un evento de webhook
stripe events resend evt_xxx
```
