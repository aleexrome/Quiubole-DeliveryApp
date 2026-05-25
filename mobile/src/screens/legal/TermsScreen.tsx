// ==========================================
// DEVOLÓN — Términos y condiciones
//
// Layout editorial premium en dark mode: numeración grande amarilla por
// sección, párrafos claros, bullets tipográficos consistentes.
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
    title: 'Aceptación de los términos',
    paragraphs: [
      'Al acceder y utilizar la aplicación Devolón ("la App"), aceptas estar sujeto a estos Términos y Condiciones. Si no estás de acuerdo con alguna parte, no podrás acceder al servicio.',
    ],
  },
  {
    number: '02',
    title: 'Descripción del servicio',
    paragraphs: [
      'Devolón es una plataforma que conecta usuarios con restaurantes y repartidores independientes para facilitar la entrega de alimentos a domicilio. Devolón no es un servicio de entrega directo ni un restaurante.',
    ],
  },
  {
    number: '03',
    title: 'Registro y cuenta',
    paragraphs: [
      'Para usar nuestros servicios debes crear una cuenta con información veraz y actualizada. Eres responsable de mantener la confidencialidad de tu cuenta y contraseña.',
    ],
    bullets: [
      'Debes ser mayor de 18 años para crear una cuenta',
      'La información proporcionada debe ser precisa',
      'No puedes compartir tu cuenta con terceros',
      'Debes notificar cualquier uso no autorizado',
    ],
  },
  {
    number: '04',
    title: 'Uso del servicio',
    paragraphs: ['Al usar Devolón, aceptas:'],
    bullets: [
      'Usar el servicio solo para fines legales',
      'No interferir con el funcionamiento de la plataforma',
      'No crear cuentas falsas o fraudulentas',
      'Respetar a los restaurantes y repartidores',
      'Proporcionar direcciones de entrega precisas',
    ],
  },
  {
    number: '05',
    title: 'Pedidos y pagos',
    paragraphs: [
      'Los precios mostrados incluyen impuestos aplicables. La tarifa de envío y servicio se calcula según la distancia y otros factores. Los pedidos son finales una vez confirmados por el restaurante.',
    ],
    subSections: [
      {
        title: 'Métodos de pago aceptados',
        bullets: ['Tarjeta de crédito/débito', 'Pago en OXXO', 'Efectivo (sujeto a disponibilidad)'],
      },
    ],
  },
  {
    number: '06',
    title: 'Cancelaciones y reembolsos',
    paragraphs: [
      'Puedes cancelar un pedido sin cargo antes de que el restaurante confirme la preparación. Una vez en preparación, las cancelaciones pueden estar sujetas a cargos parciales o totales.',
      'Los reembolsos se procesan en un plazo de 5–10 días hábiles al método de pago original.',
    ],
  },
  {
    number: '07',
    title: 'Calidad de los productos',
    paragraphs: [
      'Devolón no es responsable de la calidad, presentación o sabor de los alimentos, ya que estos son preparados por restaurantes independientes. Cualquier queja sobre la comida debe dirigirse al restaurante correspondiente a través de nuestra plataforma.',
    ],
  },
  {
    number: '08',
    title: 'Propiedad intelectual',
    paragraphs: [
      'Todo el contenido de la App, incluyendo logos, diseños, textos y software, es propiedad de Devolón o sus licenciantes. No puedes copiar, modificar o distribuir ningún contenido sin autorización previa.',
    ],
  },
  {
    number: '09',
    title: 'Limitación de responsabilidad',
    paragraphs: [
      'Devolón no será responsable por daños indirectos, incidentales o consecuentes que surjan del uso del servicio. Nuestra responsabilidad máxima se limita al monto pagado por el pedido en cuestión.',
    ],
  },
  {
    number: '10',
    title: 'Modificaciones',
    paragraphs: [
      'Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor al publicarse en la App. El uso continuado del servicio constituye aceptación de los términos modificados.',
    ],
  },
  {
    number: '11',
    title: 'Ley aplicable',
    paragraphs: [
      'Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier disputa será sometida a los tribunales competentes de la Ciudad de México.',
    ],
  },
  {
    number: '12',
    title: 'Contacto',
    paragraphs: ['Para preguntas sobre estos términos, contáctanos:'],
    bullets: ['Email: legal@devolon.com', 'Teléfono: 55 1234 5678'],
  },
];

export default function TermsScreen() {
  return (
    <Screen padded={false}>
      <Header title="Términos" eyebrow="LEGAL" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Última actualización: noviembre 2024
        </Text>
        <Text style={styles.heroTitle}>
          Reglas claras{'\n'}para una entrega justa.
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
  section: {
    marginBottom: s['2xl'],
  },
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
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
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
  subSection: {
    marginTop: s.sm,
    paddingLeft: 52,
  },
  subSectionTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.2,
    marginTop: s.xs,
    marginBottom: s.xs,
  },
});
