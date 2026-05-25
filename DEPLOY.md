# Deploy a producción — guía paso a paso

Esta guía te lleva desde **localhost** hasta tener Devolón corriendo en stores. Sigue los sprints en orden.

> ⚠️ Antes de empezar: ten a la mano una **tarjeta de débito/crédito internacional**. La vas a usar para Railway ($5/mes), Apple Developer ($99/año) y Google Play ($25 una vez).

---

## SPRINT 1 — Backend en producción + dominio (1 día)

### 1.1 Subir el código a GitHub

Si aún no está:

```bash
cd C:\Users\aleex\Quiubole-DeliveryApp
git init
git add .
git commit -m "Initial: production-ready"
# Crea un repo nuevo en https://github.com/new (privado), luego:
git remote add origin https://github.com/TU_USUARIO/quiubole-deliveryapp.git
git branch -M main
git push -u origin main
```

### 1.2 Crear cuenta Railway

1. Ve a **https://railway.app**
2. Click **Login** → **Login with GitHub**
3. Autoriza
4. Te darán **$5 USD de crédito gratis** para empezar

### 1.3 Crear el proyecto de backend

1. En el dashboard de Railway click **+ New Project** → **Deploy from GitHub repo**
2. Selecciona tu repo `quiubole-deliveryapp`
3. Railway detectará un monorepo. Cuando pregunte "Which directory contains the service?" → escribe **`backend`**
4. Click **Deploy** — empezará el primer build. Va a fallar porque falta la DB; lo arreglamos abajo.

### 1.4 Agregar Postgres

1. Dentro del proyecto, click **+ New** → **Database** → **Add PostgreSQL**
2. Railway auto-crea la DB y la variable `DATABASE_URL` queda disponible en el proyecto.
3. Click en el servicio del **backend** → tab **Variables** → click **+ New Variable** → **Add Reference** → selecciona `DATABASE_URL` del Postgres. Esto crea un link entre los dos servicios.

### 1.5 Configurar variables de entorno (backend)

En el tab **Variables** del backend, agrega:

| Variable | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `DB_SYNCHRONIZE` | `true` (solo primer deploy — apágalo después) |
| `JWT_SECRET` | genera una string aleatoria larga ([generador](https://www.random.org/strings/?num=10&len=32&digits=on&loweralpha=on&upperalpha=on)) |
| `JWT_EXPIRES_IN` | `7d` |
| `CORS_ORIGIN` | déjalo vacío por ahora (acepta todo) |

> Si vas a usar Stripe, Cloudinary, Resend, etc., añádelos también aquí. Ver `backend/.env.example` para la lista completa.

### 1.6 Re-deploy

1. Click **Deployments** → el último deploy → **Redeploy** (o solo haz push a `main` y Railway re-buildea automáticamente).
2. Espera 2-3 minutos. Cuando termine debe quedar **verde**.
3. Click el servicio del backend → **Settings** → **Networking** → **Generate Domain** — te da una URL tipo `quiubole-backend-production-xyz.up.railway.app`.

### 1.7 Verifica que el backend funciona

Abre en navegador:
```
https://quiubole-backend-production-xyz.up.railway.app/health
```

Debe responder:
```json
{ "status": "ok", "timestamp": "...", "env": "production", "uptimeSeconds": 42 }
```

✅ Si ves eso, el backend está vivo en producción.

### 1.8 Comprar dominio (opcional pero recomendado)

Las URLs de Railway son largas y feas. Compra un dominio:
- **Namecheap** ($10/año) — recomendado, fácil
- **GoDaddy** ($12/año)
- **Cloudflare Registrar** ($9/año, sin markup)

Ejemplo: `devolon.mx` o `devolonapp.com`

Después en Railway: **Settings → Networking → Custom Domain** → escribe `api.devolon.mx` → Railway te dará un CNAME → ve a tu registrar y crea el record CNAME apuntando a Railway. Tarda 5-30 min en propagar.

### 1.9 Subir páginas legales a Vercel

1. Crea un nuevo repo en GitHub `devolon-legal`
2. Sube el contenido de la carpeta `legal/` (privacy-policy.md, terms.md)
3. Ve a **https://vercel.com**, login con GitHub, **Add New → Project**, selecciona el repo
4. Framework Preset: **Other** (Vercel detecta markdown como sitio estático)
5. Deploy — te da una URL tipo `devolon-legal.vercel.app`
6. Pon los links de **Privacidad** y **Términos** en tu app apuntando a esas URLs

> **IMPORTANTE**: en los archivos `privacy-policy.md` y `terms.md` reemplaza los `[RAZÓN SOCIAL]`, `[EMAIL]`, `[DIRECCIÓN]` con tus datos reales antes de subir. Apple/Google rechazan páginas con placeholders.

### 1.10 Actualizar el mobile con la URL del backend

Edita `mobile/eas.json`:

```json
"preview": {
  "env": {
    "EXPO_PUBLIC_API_URL": "https://api.devolon.mx/api"
  }
},
"production": {
  "env": {
    "EXPO_PUBLIC_API_URL": "https://api.devolon.mx/api"
  }
}
```

Si no tienes dominio aún, usa la URL de Railway:
```
"EXPO_PUBLIC_API_URL": "https://quiubole-backend-production-xyz.up.railway.app/api"
```

✅ **Sprint 1 completo**.

---

## SPRINT 2 — Cuentas + Build Android internal (1-2 días)

### 2.1 Crear cuenta Expo (gratis)

```bash
npm install -g eas-cli
eas login
```

Si no tienes cuenta, ve a **https://expo.dev/signup** primero.

### 2.2 Configurar el proyecto

```bash
cd mobile
eas build:configure
```

Esto:
- Crea el proyecto en tu cuenta de Expo
- Te asigna un `projectId` que va automáticamente al `app.json`

### 2.3 Cuenta Google Play Console — $25 USD una vez

1. Ve a **https://play.google.com/console**
2. Paga los $25 USD con tarjeta
3. Identidad: foto INE/pasaporte, dirección
4. Tarda **~48 horas** en activar la cuenta
5. Mientras esperas → puedes hacer el build APK abajo

### 2.4 Cuenta Apple Developer — $99 USD/año

1. Ve a **https://developer.apple.com/programs/enroll**
2. Necesitas un **Apple ID** primero (gratis, [appleid.apple.com](https://appleid.apple.com))
3. Habilita 2FA (obligatorio para developer)
4. Inscríbete como **Individual** (más rápido) o **Organization** (necesitas D-U-N-S Number, tarda 1-2 semanas)
5. Apple verifica identidad — **1-3 días hábiles**
6. Cuando esté lista: tendrás un **Apple Team ID** que va a `eas.json`

### 2.5 Build APK Android para testers

Mientras la cuenta de Google se activa, ya puedes generar APKs para mandar por WhatsApp/link:

```bash
cd mobile
eas build --profile preview --platform android
```

Esto:
- Sube tu código a los servidores de Expo
- Compila el APK en la nube (~15-20 min)
- Te da un **link directo** al APK
- Mándalo por WhatsApp a tus beta testers — instalan tap-tap

✅ Estás en campo con Android.

### 2.6 Build iOS (cuando Apple verifique)

```bash
eas build --profile preview --platform ios
```

Te pedirá:
- Apple ID
- Apple Team ID
- App-specific password (genera en [appleid.apple.com](https://appleid.apple.com) → Sign-In and Security → App-Specific Passwords)

Después del build, sube a TestFlight (siguiente sprint).

---

## SPRINT 3 — Stores públicas (3-7 días)

### 3.1 Pre-flight: assets de tienda

Antes de submit necesitas:

**Ícono 1024×1024 PNG** (sin esquinas redondeadas — Apple las redondea solo)

**Screenshots** (mínimo 4-5 por tienda):
- iPhone 6.7" (1290×2796) — iPhone 15 Pro Max
- iPhone 6.5" (1242×2688) — iPhone 11 Pro Max
- Android phone (1080×1920 mínimo)

Tip: usa el simulador de Xcode o emulador Android para capturar.

**Descripción corta** (80 caracteres) — ej. "Comida a tu puerta en minutos"

**Descripción larga** (4000 caracteres) — explica qué hace la app, beneficios.

**Keywords** (App Store, separados por coma):
```
delivery, comida, restaurantes, pedidos, repartidor, tenancingo, devolon
```

**Categoría**: Food & Drink (ambas tiendas)

**Edad mínima**: 17+ (porque acepta pagos)

### 3.2 Build de producción

```bash
cd mobile

# Android — genera AAB (no APK) para Play Store
eas build --profile production --platform android

# iOS
eas build --profile production --platform ios
```

### 3.3 Submit a Google Play

```bash
eas submit --platform android --profile production
```

La primera vez te pide:
- **Service Account JSON** — descarga desde Google Play Console → Setup → API access → Service Accounts → Crea uno y descarga el JSON. Guárdalo como `mobile/google-service-account.json` (ya está en `.gitignore`).

EAS sube el AAB al track **internal** primero. En Google Play Console:
1. Llena el listing (descripción, screenshots, etc.)
2. Test → Internal testing → Add testers (emails)
3. Promueve a **Closed testing** cuando estés listo
4. Promueve a **Production** cuando todo esté validado

Tiempo de review de Google: **1-3 días**.

### 3.4 Submit a App Store

```bash
eas submit --platform ios --profile production
```

Sube el IPA a App Store Connect automáticamente.

En **App Store Connect** (https://appstoreconnect.apple.com):
1. Llena el listing (igual que arriba)
2. **TestFlight**: añade testers internos (hasta 100 sin review) o externos (hasta 10,000, requieren beta app review).
3. **App Review**: cuando estés listo, envía para review.
4. Apple tarda **1-7 días** la primera vez. Pueden pedir cambios.

### 3.5 OTA Updates (después del primer release)

Después del primer release, los cambios de JS/UI pueden enviarse sin re-submit:

```bash
eas update --channel production --message "Fix: corrige cálculo de propina"
```

Los usuarios reciben la actualización al abrir la app, sin pasar por stores. **Cambios nativos (permisos nuevos, paquetes nativos) sí requieren nuevo build**.

---

## Checklist pre-submit

- [ ] Backend deployado en Railway con dominio HTTPS
- [ ] `/health` responde 200 desde internet
- [ ] `EXPO_PUBLIC_API_URL` en `eas.json` apunta al backend de prod
- [ ] Privacy Policy y Terms en URL pública (Vercel)
- [ ] Todos los placeholders `[RAZÓN SOCIAL]`, `[EMAIL]`, `[DIRECCIÓN]` reemplazados en los legales
- [ ] Bundle IDs en `app.json` (`mx.devolon.app`) coinciden con stores
- [ ] Ícono 1024×1024
- [ ] Splash screen verificado en build de prueba
- [ ] Stripe en modo live con webhooks configurados (si vas a aceptar pagos reales)
- [ ] WhatsApp del soporte real en `SUPPORT_PHONE` (ahora `525555555555` placeholder)
- [ ] Probar APK en mínimo 3 teléfonos físicos diferentes
- [ ] Política de privacidad enviada a Apple/Google
- [ ] Cuenta de prueba para reviewers de Apple/Google (un email + password que ellos puedan usar)

---

## Troubleshooting común

**Build falla con "Application target requires a privacy manifest"**: añade `PrivacyInfo.xcprivacy` (Apple lo pide desde 2024).

**Apple rechaza por "Guideline 5.1.1 — Data Collection and Storage"**: usualmente falta declarar uso de notificaciones push o explicar mejor el uso de ubicación. Edita `app.json` y los `NSLocationWhenInUseUsageDescription`.

**Google rechaza por "Family Policy"**: marca tu app como NO dirigida a menores en Play Console.

**El emulador conecta pero el APK no**: verifica que `EXPO_PUBLIC_API_URL` en `eas.json` apunta al dominio público (HTTPS), no a `10.0.2.2`.

---

## Costos resumen

| Año 1 | Total |
|---|---|
| Railway ($5/mes × 12) | $60 |
| Dominio | $10 |
| Apple Developer | $99 |
| Google Play | $25 |
| **TOTAL** | **~$194 USD** |

A partir del año 2: $60 (Railway) + $10 (dominio) + $99 (Apple) = **$169/año**.
