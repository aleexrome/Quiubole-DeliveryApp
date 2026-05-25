// ==========================================
// Extrae el ISOTIPO "D" desde devolon-icon-source.png
//
// Estrategia: thresholdear la luminancia del PNG fuente. Píxeles oscuros
// (la D + las streaks de velocidad) → blanco opaco. Todo lo demás (el
// fondo amarillo) → transparente.
//
// Salida: PNG con la D + streaks en BLANCO sobre transparente,
// recortado tight con `.trim()`. Luego se usa desde RN con `tintColor`
// para renderizarlo en cualquier color de marca (amarillo, blanco, etc.)
// sin re-procesar.
//
// Reglas de marca:
//   - NO redibujar — solo extraemos píxeles existentes.
//   - El resultado preserva 100% la silueta del isotipo oficial.
//
// Uso:
//   cd mobile && node scripts/extract-isotype.js
// ==========================================

const sharp = require('sharp');
const path = require('path');

const SRC = path.resolve(__dirname, '../assets/brand/devolon-icon-source.png');
const OUT = path.resolve(__dirname, '../assets/brand/devolon-isotype.png');

const THRESHOLD = 90; // luminancia 0-255; pixel oscuro si está por debajo

async function main() {
  const { data, info } = await sharp(SRC)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels; // 4 con ensureAlpha
  const out = Buffer.alloc(info.width * info.height * 4);

  let kept = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const o = (y * info.width + x) * 4;
      if (a > 128 && lum < THRESHOLD) {
        // Píxel parte del isotipo: blanco opaco (color irrelevante, lo tintea RN).
        out[o] = 255;
        out[o + 1] = 255;
        out[o + 2] = 255;
        out[o + 3] = 255;
        kept++;
      } else {
        out[o] = 0;
        out[o + 1] = 0;
        out[o + 2] = 0;
        out[o + 3] = 0;
      }
    }
  }

  // Generar PNG y luego trim (crop transparente alrededor) para que el
  // contenido quede tight contra los bordes.
  const rawBuf = await sharp(out, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();

  await sharp(rawBuf)
    .trim()
    .png({ compressionLevel: 9 })
    .toFile(OUT);

  const finalMeta = await sharp(OUT).metadata();
  console.log(
    `✓ Isotipo extraído: ${OUT}\n  source: ${info.width}×${info.height}` +
    `  → trimmed: ${finalMeta.width}×${finalMeta.height}` +
    `  (${kept} píxeles preservados)`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
