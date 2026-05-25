# 🟡 Devolón — Sistema visual

> **Status:** Vigente — reemplaza por completo `PALETA-COLORES-QUIUBOLE.md` (rebrand Quiúbole → Devolón).

Devolón es una plataforma de entrega rápida con identidad **negra + amarilla, premium, tecnológica y urbana**. Cualquier pantalla nueva debe leerse igual de fuerte que el login: dark-first, jerarquía clara, una sola voz cromática.

---

## 1. Marca

| | |
|---|---|
| **Nombre** | Devolón |
| **Slogan principal** | MÁS RÁPIDO, IMPOSIBLE. |
| **Tono** | Veloz, confiable, técnico, sin folclor. |
| **Referencias visuales** | Uber, FedEx, Arc Browser, Linear, modern logistics dashboards. |

---

## 2. Color

### Paleta primaria (estricta)

| Token | HEX | Pantone | Uso |
|---|---|---|---|
| `colors.primary` | `#FFC20E` | 123 C | **Único acento.** CTAs, focus, eyebrows, iconos clave, halo. |
| `colors.bg` | `#000000` | — | Fondo absoluto, dark mode permanente. |
| `colors.text` | `#FFFFFF` | — | Texto principal. |

### Superficies oscuras

| Token | HEX / RGBA | Uso |
|---|---|---|
| `colors.bgRaised` | `#0A0A0A` | Containers sutiles sobre `bg`. |
| `colors.surface` | `rgba(255,255,255,0.04)` | Cards glassmorphism ligero. |
| `colors.surfaceStrong` | `rgba(255,255,255,0.08)` | Cards activas, hover. |
| `colors.inputBg` | `#0E0E0E` | Inputs y botones secundarios. |

### Bordes

| Token | Uso |
|---|---|
| `colors.border` `rgba(255,255,255,0.08)` | Default — separa sin gritar. |
| `colors.borderStrong` `rgba(255,255,255,0.14)` | Énfasis. |
| `colors.borderFocus` `#FFC20E` | Focus de inputs SIEMPRE en amarillo. |

### Texto

| Token | Uso |
|---|---|
| `colors.text` `#FFFFFF` | Headers, body principal. |
| `colors.textMuted` `rgba(255,255,255,0.55)` | Labels secundarios, subtítulos. |
| `colors.textFaint` `rgba(255,255,255,0.35)` | Placeholders, legal. |
| `colors.textOnYellow` `#000000` | SIEMPRE negro sobre amarillo. |

### Semánticos (úsalos al mínimo)

| Token | HEX | Cuándo |
|---|---|---|
| `colors.success` | `#1FAE6F` | Estados positivos discretos. |
| `colors.warning` | `#FFC20E` | Unificado con brand — algo que requiere atención = amarillo. |
| `colors.danger` | `#E5484D` | Error destructivo. |
| `colors.info` | `#2E90FA` | Tooltips, info neutral. |

### Reglas duras

- ❌ **Sin gradientes multicolor.** Lo más cercano permitido: `colors.primaryGlow` como sombra del CTA.
- ❌ **Sin naranja, rosa, pastel** — esos colores son de la marca vieja.
- ❌ **Sin texto blanco sobre amarillo** ni viceversa al revés (`onPrimary` = negro siempre).
- ✅ Una sola pantalla puede usar `primary` solo en: 1 eyebrow + 1 CTA + acentos pequeños (iconos focus, dot pulsante, halo). Más amarillo = ruido.

---

## 3. Tipografía

**Stack:** System (Roboto Black en Android, SF Pro Display Heavy en iOS). Sin `expo-font` por ahora — cero costo de carga, pesos heavy nativos.

### Escala (`fontSize`)

```
xxs  10   xs   11   sm   12   base 13   md   14
lg   15   xl   18   2xl  22   3xl  28   4xl  36
hero 54
```

### Pesos (`fontWeight`)

```
regular 400 | medium 500 | semibold 600 | bold 700 | heavy 800 | black 900
```

Reglas:
- **Black (900)** solo para wordmark hero y CTA principal.
- **Heavy (800)** para títulos de pantalla y eyebrows.
- **Semibold (600)** para subtítulos y labels.
- **Medium (500)** para body.

### Composiciones reutilizables (`textStyles`)

| Token | Uso |
|---|---|
| `textStyles.hero` | Wordmark `DEVOLÓN` (54/900, tracking −2.2). |
| `textStyles.title` | Título de pantalla / card (22/800, tracking −0.4). |
| `textStyles.subtitle` | Subtítulo (15/600). |
| `textStyles.eyebrow` | Mini-label sobre títulos (11/800, tracking +2.5, CAPS). |
| `textStyles.slogan` | "MÁS RÁPIDO, IMPOSIBLE." (13/800, tracking +2.8, CAPS). |
| `textStyles.body` | Texto base (14/500). |
| `textStyles.bodyStrong` | Body con énfasis (14/600). |
| `textStyles.caption` | Pies / descripciones cortas (12/600). |
| `textStyles.cta` | Texto de botón primario (14/900, tracking +2.5, CAPS). |
| `textStyles.legal` | Términos y privacidad (11/400). |

### Tracking (`tracking`)

```
tighter -2.2   tight -0.4   normal 0   wide 0.5
wider   1.6    widest 2.5   hyper 2.8
```

---

## 4. Spacing (base 4)

```
spacing['1']=4   ['2']=8   ['3']=12  ['4']=16  ['5']=20
        ['6']=24 ['7']=28  ['8']=32  ['10']=40 ['12']=48
        ['14']=56 ['16']=64 ['20']=80
```

Aliases (`s`): `xxs=4 · xs=8 · sm=12 · md=16 · lg=20 · xl=24 · 2xl=32 · 3xl=48 · 4xl=64`.

Convenciones:
- Padding lateral de pantallas: **`s.lg` (20)** o **`s.md` (16)**.
- Padding interno de cards: **`s.xl` (24)** o **`s.lg` (20)**.
- Gap entre secciones en una pantalla: **`s['2xl']` (32)**.
- Gap entre inputs: **`s.sm` (12)**.

---

## 5. Border radius

```
none 0  sm 8  md 12  lg 14  xl 18  2xl 22  3xl 28  pill 999
```

Convenciones:
- Inputs y botones: **`radius.lg` (14)**.
- Cards: **`radius['2xl']` (22)**.
- Pills/badges: **`radius.pill`**.
- Hojas/sheets: **`radius['3xl']` (28)** en esquinas superiores.

---

## 6. Sombras / elevación

| Token | Cuándo |
|---|---|
| `shadows.sm` | Cards en reposo. |
| `shadows.md` | Modales, sheets, dropdowns. |
| `shadows.lg` | Overlays flotantes (FAB). |
| `shadows.glow` | **Reservado al CTA primario.** Amarillo. |

Nota: en Android la sombra solo soporta color negro (limitación de `elevation`). El glow amarillo se ve pleno en iOS y como elevación neutra en Android — aceptable.

---

## 7. Componentes base recomendados (a construir)

Cuando empieces a rediseñar más pantallas, primero subir estos a `mobile/src/components/ui/`:

- `Screen` — wrapper con bg, safe area, scroll opcional. Aplica `colors.bg` automáticamente.
- `Card` — `surface` + `border` + `radius['2xl']` + `padding`.
- `Input` — input con focus amarillo + ícono.
- `Button` — variants `primary` (yellow), `secondary` (outline), `ghost`. Con loading state.
- `Eyebrow` — texto small caps + tracking amplio.
- `Pill` — chip pequeño con borde + opcional dot color.
- `Divider` — línea + texto centrado.

Mantener cada uno por debajo de 80 LOC y consumir SIEMPRE desde `theme`.

---

## 8. Iconografía

- **Set:** `@expo/vector-icons` → **Ionicons** (`-outline` variants por defecto).
- **Color por defecto:** `colors.textMuted`.
- **En foco / activo:** `colors.primary`.
- Tamaños: 16 (chips), 18 (inputs), 20 (nav), 24 (hero icons).

---

## 9. Motion (micro)

- Punto pulsante de "EN VIVO": `Animated.loop` 1.1s ease-in-out, opacity 0.4↔1, scale 1↔1.35.
- Transiciones de pantalla: defaults de React Navigation (no custom todavía).
- Press feedback de botones: `activeOpacity={0.85}` (yellow CTA), `0.7` (ghost).

**Nada de animaciones decorativas en el background**. La marca es velocidad, no glitter.

---

## 10. Identidad de marca en assets

### Logo
- Construcción: **chevron amarillo apuntando a la derecha** (play / forward) + wordmark **DEVOLÓN** en weight black.
- Placeholder en código: `mobile/src/components/DevolonLogo.tsx`.
- Cuando llegue el logo oficial (PNG/SVG), reemplazar el cuerpo de ese componente; no tocar el contrato de props.

### App icon
- Generado por `mobile/scripts/generate-brand-assets.js`.
- Fondo negro, chevron amarillo centrado + barra acento debajo, esquinas suaves (~22% radius).
- Densidades Android: mdpi → xxxhdpi.

### Splash
- Fondo `#000000`, logo centrado (chevron + barra acento), sin texto.
- `resizeMode: contain` en `app.json`.

---

## 11. Migración pendiente (rebrand)

Hecho en esta pasada:
- ✅ Theme tokens (`mobile/src/theme/`)
- ✅ Assets icon/splash regenerados
- ✅ `app.json` (nombre, bg colors, copy de permisos)
- ✅ `strings.xml`, `colors.xml`, `styles.xml`
- ✅ `LoginScreen` migrado a tokens
- ✅ Strings visibles "Quiubole" → "Devolón" en Register / RoleSelection

Diferido (migración coordinada, NO hacer aislado):
- ⏳ `com.quiubole.app` → `com.devolon.app` (afecta `app.json`, `build.gradle`, `MainActivity.kt`, `MainApplication.kt`, ruta de carpetas Kotlin)
- ⏳ URL scheme `quiubole://` → `devolon://` (afecta `app.json`, `AndroidManifest.xml`, `linking.ts`)
- ⏳ Notification channel IDs (`quiubole_*` → `devolon_*`) — cambiar crea canales huérfanos en devices ya instalados, hacer durante una release coordinada
- ⏳ Backend: copy de emails de verificación, push notifications con nombre marca
- ⏳ Redesign del resto de pantallas (63 screens) — siguiente fase

---

## 12. Checklist al diseñar una pantalla nueva

- [ ] `bg` viene de `theme.colors.bg`, NUNCA `'#000'` literal.
- [ ] Cero gradientes multicolor.
- [ ] Amarillo aparece máximo en: 1 eyebrow + 1 CTA + 1-2 acentos pequeños.
- [ ] Tipografía consumida desde `textStyles.*` (no hardcodear `fontSize`/`fontWeight`).
- [ ] Spacing siempre desde `s.*` o `spacing[...]`, nunca `padding: 17`.
- [ ] Inputs heredan focus amarillo.
- [ ] CTA primario con `shadows.glow`.
- [ ] Texto sobre amarillo: SIEMPRE `colors.onPrimary` (negro).
- [ ] No introducir hex nuevos. Si necesitas un matiz, súbelo a `palette` primero.
