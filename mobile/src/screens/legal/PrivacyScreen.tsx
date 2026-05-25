// ==========================================
// DEVOLÓN — Política de privacidad
//
// Mismo lenguaje editorial premium que TermsScreen. Numeración amarilla,
// secciones con subtítulos consistentes, bullets tipográficos.
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Screen, Header } from '../../components/ui';
import { colors, s, fontSize, fontWeight, tracking } from '../../theme';

type Section = {
  number: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  subSections?: { title: string; bullets: string[] }[];
};

const SECTIONS: Section[] = [
  {
    number: '01',
    title: 'Introducción',
    paragraphs: [
      'En Devolón respetamos tu privacidad y nos comprometemos a proteger tus datos personales. Esta política explica cómo recopilamos, usamos y protegemos tu información.',
    ],
  },
  {
    number: '02',
    title: 'Información que recopilamos',
    subSections: [
      {
        title: 'Información que tú proporcionas',
        bullets: [
          'Nombre completo',
          'Correo electrónico',
          'Número de teléfono',
          'Direcciones de entrega',
          'Información de pago (procesada de forma segura)',
        ],
      },
      {
        title: 'Información recopilada automáticamente',
        bullets: [
          'Ubicación (con tu consentimiento)',
          'Información del dispositivo',
          'Historial de pedidos',
          'Preferencias de uso',
        ],
      },
    ],
  },
  {
    number: '03',
    title: 'Cómo usamos tu información',
    paragraphs: ['Utilizamos tu información para:'],
    bullets: [
      'Procesar y entregar tus pedidos',
      'Mejorar nuestros servicios',
      'Enviar notificaciones sobre tu pedido',
      'Comunicar promociones (si lo autorizas)',
      'Prevenir fraudes y actividades ilegales',
      'Cumplir con obligaciones legales',
    ],
  },
  {
    number: '04',
    title: 'Compartir información',
    paragraphs: ['Compartimos tu información solo cuando es necesario:'],
    bullets: [
      'Con restaurantes para preparar tu pedido',
      'Con repartidores para realizar la entrega',
      'Con procesadores de pago para transacciones',
      'Con autoridades cuando la ley lo requiera',
    ],
  },
  {
    number: '05',
    title: 'Seguridad de datos',
    paragraphs: ['Implementamos medidas de seguridad para proteger tu información:'],
    bullets: [
      'Encriptación SSL/TLS para transmisión de datos',
      'Almacenamiento seguro de contraseñas (hash)',
      'Acceso restringido a datos personales',
      'Monitoreo continuo de seguridad',
      'Procesamiento de pagos compatible con PCI-DSS',
    ],
  },
  {
    number: '06',
    title: 'Tus derechos',
    paragraphs: [
      'De acuerdo con la Ley Federal de Protección de Datos Personales, tienes derecho a:',
    ],
    bullets: [
      'Acceder a tus datos personales',
      'Rectificar información incorrecta',
      'Cancelar el uso de tus datos',
      'Oponerte al tratamiento de tus datos',
    ],
  },
  {
    number: '07',
    title: 'Cookies y tecnologías',
    paragraphs: [
      'Utilizamos cookies y tecnologías similares para mejorar tu experiencia, recordar tus preferencias y analizar el uso de la App. Puedes gestionarlas en la configuración de tu dispositivo.',
    ],
  },
  {
    number: '08',
    title: 'Retención de datos',
    paragraphs: [
      'Conservamos tus datos mientras mantengas una cuenta activa o sea necesario para prestar nuestros servicios. Puedes solicitar la eliminación de tu cuenta y datos asociados en cualquier momento.',
    ],
  },
  {
    number: '09',
    title: 'Menores de edad',
    paragraphs: [
      'Nuestros servicios no están dirigidos a menores de 18 años. No recopilamos conscientemente información de menores. Si descubrimos que recopilamos datos de un menor, los eliminaremos de inmediato.',
    ],
  },
  {
    number: '10',
    title: 'Cambios a esta política',
    paragraphs: [
      'Podemos actualizar esta política periódicamente. Te notificaremos cambios significativos a través de la App o por correo electrónico.',
    ],
  },
  {
    number: '11',
    title: 'Contacto',
    paragraphs: ['Para preguntas sobre esta política o el manejo de tus datos:'],
    bullets: [
      'Email: privacidad@devolon.com',
      'Oficial de privacidad: dpo@devolon.com',
      'Teléfono: 55 1234 5678',
      'Dirección: Av. Paseo de la Reforma 250, CDMX, México',
    ],
  },
];

export default function PrivacyScreen() {
  return (
    <Screen padded={false}>
      <Header title="Privacidad" eyebrow="LEGAL" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>Última actualización: noviembre 2024</Text>
        <Text style={styles.heroTitle}>
          Tus datos,{'\n'}bajo tu control.
        </Text>

        {SECTIONS.map((section) => (
          <View key={section.number} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionNumber}>{section.number}</Text>
              <View style={styles.sectionTitleBlock}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.sectionDivider} />
              </View>
            </View>
            {section.paragraphs?.map((p, i) => (
              <Text key={i} style={styles.paragraph}>
                {p}
              </Text>
            ))}
            {section.bullets?.map((b, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.bullet}>{b}</Text>
              </View>
            ))}
            {section.subSections?.map((sub, i) => (
              <View key={i} style={styles.subSection}>
                <Text style={styles.subSectionTitle}>{sub.title}</Text>
                {sub.bullets.map((b, j) => (
                  <View key={j} style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bullet}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ))}

        <View style={{ height: s['3xl'] }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: s.xl, paddingTop: s.md },
  intro: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    textTransform: 'uppercase',
    marginBottom: s.sm,
  },
  heroTitle: {
    color: colors.text,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.8,
    lineHeight: 36,
    marginBottom: s['2xl'],
  },
  section: { marginBottom: s['2xl'] },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: s.md,
    marginBottom: s.sm,
  },
  sectionNumber: {
    color: colors.primary,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.4,
    width: 36,
  },
  sectionTitleBlock: { flex: 1, paddingTop: 2 },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.3,
    marginBottom: s.xs,
  },
  sectionDivider: { height: 1, backgroundColor: colors.border },
  paragraph: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    lineHeight: 22,
    marginTop: s.xs,
    paddingLeft: 52,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: s.sm,
    marginTop: s.xs,
    paddingLeft: 52,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.primary,
    marginTop: 9,
  },
  bullet: {
    flex: 1,
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    lineHeight: 22,
  },
  subSection: { marginTop: s.sm, paddingLeft: 52 },
  subSectionTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.2,
    marginTop: s.xs,
    marginBottom: s.xs,
  },
});
