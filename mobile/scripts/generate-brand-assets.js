// ==========================================
// Generador de assets de marca Devolón — desde los PNG oficiales.
//
// Fuentes (autoridad de marca, NO modificar):
//   mobile/assets/brand/devolon-icon-source.png   1254×1254 — launcher icon
//   mobile/assets/brand/devolon-logo-source.png   1536×1024 — sticker logo
//
// Salida (regenerable, NO editar a mano):
//   mobile/assets/icon.png                   1024×1024  (Expo icon)
//   mobile/assets/adaptive-icon.png          1024×1024  (Android adaptive foreground)
//   mobile/assets/splash.png                 1024×height (Expo splash, sticker centrado)
//   mobile/assets/favicon.png                 48×48
//   android/.../mipmap-*/ic_launcher.webp           (5 densidades, icon completo)
//   android/.../mipmap-*/ic_launcher_round.webp     (5 densidades, icon completo)
//   android/.../mipmap-*/ic_launcher_foreground.webp (5 densidades, icon completo)
//   android/.../drawable-*/splashscreen_logo.png    (5 densidades, sticker)
//
// Uso:
//   cd mobile && node scripts/generate-brand-assets.js
// ==========================================

const sharp = require('sharp');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');
const BRAND = path.join(ASSETS, 'brand');
const RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');

const ICON_SRC = path.join(BRAND, 'devolon-icon-source.png');
const LOGO_SRC = path.join(BRAND, 'devolon-logo-source.png');
const ISOTYPE_SRC = path.join(BRAND, 'devolon-isotype.png'); // generado por extract-isotype.js

const YELLOW = '#FFC20E';

/* ---------------- Helpers ---------------- */

/**
 * Reescala el icon-source a `size`×`size` (PNG).
 * El icon-source ya es cuadrado con fondo amarillo: lo usamos tal cual.
 */
async function emitIconPng(size, outPath) {
  await sharp(ICON_SRC)
    .resize(size, size, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}

async function emitIconWebp(size, outPath) {
  await sharp(ICON_SRC)
    .resize(size, size, { fit: 'cover' })
    .webp({ quality: 92 })
    .toFile(outPath);
}

/**
 * Splash V2: isotipo "D" amarillo centrado sobre transparente.
 * El bg negro absoluto lo provee colors.xml + app.json.
 * NO incluye texto — el wordmark "DEVOLÓN" lo dibuja el JS splash overlay
 * (LoginScreen) durante la animación de fade-in, para continuidad visual.
 */
async function emitSplash(size, outPath) {
  // El isotipo ocupa ~38% del canvas (deja respiración premium alrededor).
  // Aspect del isotipo trimmed = 866/608 ≈ 1.42 (más ancho que alto).
  const innerH = Math.round(size * 0.38);
  const innerW = Math.round(innerH * (866 / 608));

  // Resize del isotipo blanco-opaco
  const isotypeMask = await sharp(ISOTYPE_SRC)
    .resize(innerW, innerH, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Capa amarilla del mismo tamaño
  const yellowFill = await sharp({
    create: { width: innerW, height: innerH, channels: 4, background: YELLOW },
  }).png().toBuffer();

  // Compose: amarillo mascarado por alpha del isotipo → D amarilla
  const yellowIsotype = await sharp(yellowFill)
    .composite([{ input: isotypeMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // Canvas final transparente con la D centrada
  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: yellowIsotype, gravity: 'center' }])
    .png()
    .toFile(outPath);
}

/* ---------------- Main ---------------- */

async function main() {
  console.log('• assets/ (Expo)');
  await emitIconPng(1024, path.join(ASSETS, 'icon.png'));
  // Adaptive foreground: usamos el icon completo (incluye su bg amarillo).
  // adaptiveIcon.backgroundColor en app.json se setea al mismo amarillo, así
  // si el sistema clipea en safe-zone el bleed es invisible.
  await emitIconPng(1024, path.join(ASSETS, 'adaptive-icon.png'));
  await emitSplash(1024, path.join(ASSETS, 'splash.png'));
  await emitIconPng(48, path.join(ASSETS, 'favicon.png'));

  // Android mipmaps por densidad
  const mipmaps = [
    { bucket: 'mipmap-mdpi', legacy: 48, foreground: 108 },
    { bucket: 'mipmap-hdpi', legacy: 72, foreground: 162 },
    { bucket: 'mipmap-xhdpi', legacy: 96, foreground: 216 },
    { bucket: 'mipmap-xxhdpi', legacy: 144, foreground: 324 },
    { bucket: 'mipmap-xxxhdpi', legacy: 192, foreground: 432 },
  ];
  for (const { bucket, legacy, foreground } of mipmaps) {
    console.log(`• res/${bucket}/`);
    const dir = path.join(RES, bucket);
    await emitIconWebp(legacy, path.join(dir, 'ic_launcher.webp'));
    await emitIconWebp(legacy, path.join(dir, 'ic_launcher_round.webp'));
    await emitIconWebp(foreground, path.join(dir, 'ic_launcher_foreground.webp'));
  }

  // Splash logo por densidad
  const splashes = [
    { bucket: 'drawable-mdpi', size: 200 },
    { bucket: 'drawable-hdpi', size: 300 },
    { bucket: 'drawable-xhdpi', size: 400 },
    { bucket: 'drawable-xxhdpi', size: 600 },
    { bucket: 'drawable-xxxhdpi', size: 800 },
  ];
  for (const { bucket, size } of splashes) {
    console.log(`• res/${bucket}/`);
    const dir = path.join(RES, bucket);
    await emitSplash(size, path.join(dir, 'splashscreen_logo.png'));
  }

  console.log('\n✓ Brand assets emitidos desde sources oficiales.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
