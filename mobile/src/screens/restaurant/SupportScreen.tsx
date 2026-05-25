// ==========================================
// DEVOLÓN — Restaurant Support
//
// Centro de ayuda con FAQ desplegable + canales de contacto directo
// (WhatsApp, email, llamada). Sin backend — todo es info estática útil.
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Card } from '../../components/ui';
import { colors, s, radius, fontSize, fontWeight, tracking } from '../../theme';

interface Faq {
  q: string;
  a: string;
}

const FAQS: Faq[] = [
  {
    q: '¿Cómo recibo pedidos?',
    a: 'Cuando un cliente hace un pedido, te llega una notificación al instante. Desde la tab Pedidos puedes aceptarlo, prepararlo y marcarlo como listo para que el repartidor lo recoja.',
  },
  {
    q: '¿Quién edita mi menú?',
    a: 'Tu editor asignado por Devolón se encarga de actualizar precios, fotos, descripciones y agregar productos nuevos. Tú puedes activar o desactivar productos cuando no haya disponibilidad.',
  },
  {
    q: '¿Cuándo recibo mis pagos?',
    a: 'Los pagos con tarjeta se acumulan toda la semana y se depositan los lunes en tu cuenta bancaria. Los pagos en efectivo se cobran al cliente directamente.',
  },
  {
    q: '¿Qué pasa si cancelo un pedido?',
    a: 'Si cancelas un pedido después de aceptarlo, el cliente recibe un reembolso automático y tu rating puede verse afectado. Solo cancela si es estrictamente necesario.',
  },
  {
    q: '¿Cómo cambio mi horario?',
    a: 'Ve a Ajustes del negocio → Horarios de atención y configura los días y horas que tu negocio recibe pedidos.',
  },
  {
    q: '¿Puedo pausar mi negocio temporalmente?',
    a: 'Sí, desde el Dashboard usa el toggle "Recibiendo pedidos" para cerrar/abrir tu negocio en cualquier momento sin perder tu cuenta.',
  },
];

const CONTACT_PHONE = '5512345678';
const CONTACT_WHATSAPP = '5215512345678';
const CONTACT_EMAIL = 'soporte@devolon.com';

export default function RestaurantSupportScreen() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const openWhatsApp = async () => {
    const msg = encodeURIComponent(
      'Hola Devolón, necesito ayuda con mi negocio.',
    );
    const url = `https://wa.me/${CONTACT_WHATSAPP}?text=${msg}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert('WhatsApp', 'No se pudo abrir WhatsApp en este dispositivo.');
    } catch {
      Alert.alert('Error', 'No se pudo abrir WhatsApp.');
    }
  };

  const openEmail = () => {
    Linking.openURL(
      `mailto:${CONTACT_EMAIL}?subject=Ayuda%20-%20Devol%C3%B3n%20Negocio`,
    );
  };

  const openPhone = () => {
    Linking.openURL(`tel:${CONTACT_PHONE}`);
  };

  return (
    <Screen padded={false}>
      <Header title="Ayuda y soporte" eyebrow="NEGOCIO" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ============ CONTACTO DIRECTO ============ */}
        <Text style={styles.sectionEyebrow}>CONTACTO DIRECTO</Text>
        <Text style={styles.sectionTitle}>¿Necesitas ayuda urgente?</Text>

        <View style={styles.contactGrid}>
          <Card
            variant="glass"
            onPress={openWhatsApp}
            padding={s.lg}
            borderRadius={radius.xl}
            style={styles.contactCard}
          >
            <View style={[styles.contactIcon, styles.contactIconWa]}>
              <Ionicons name="logo-whatsapp" size={22} color={colors.success} />
            </View>
            <Text style={styles.contactLabel}>WhatsApp</Text>
            <Text style={styles.contactValue}>Chat directo</Text>
          </Card>

          <Card
            variant="glass"
            onPress={openPhone}
            padding={s.lg}
            borderRadius={radius.xl}
            style={styles.contactCard}
          >
            <View style={[styles.contactIcon, styles.contactIconPhone]}>
              <Ionicons name="call" size={22} color={colors.primary} />
            </View>
            <Text style={styles.contactLabel}>Llamada</Text>
            <Text style={styles.contactValue}>55 1234 5678</Text>
          </Card>
        </View>

        <Card
          variant="glass"
          onPress={openEmail}
          padding={s.md}
          borderRadius={radius.lg}
          style={styles.emailCard}
        >
          <View style={[styles.contactIcon, styles.contactIconEmail]}>
            <Ionicons name="mail" size={20} color={colors.info} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.emailLabel}>EMAIL</Text>
            <Text style={styles.emailValue}>{CONTACT_EMAIL}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Card>

        {/* ============ FAQ ============ */}
        <Text style={[styles.sectionEyebrow, { marginTop: s['2xl'] }]}>
          PREGUNTAS FRECUENTES
        </Text>
        <Text style={styles.sectionTitle}>Resuelve tus dudas</Text>

        <Card variant="glass" padding={0} borderRadius={radius.xl}>
          {FAQS.map((f, idx) => {
            const isOpen = openFaq === idx;
            return (
              <React.Fragment key={idx}>
                {idx > 0 && <View style={styles.faqDivider} />}
                <TouchableOpacity
                  style={styles.faqRow}
                  onPress={() => setOpenFaq(isOpen ? null : idx)}
                  activeOpacity={0.85}
                >
                  <View style={styles.faqHeader}>
                    <Text style={styles.faqQuestion}>{f.q}</Text>
                    <Ionicons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={isOpen ? colors.primary : colors.textMuted}
                    />
                  </View>
                  {isOpen && (
                    <Text style={styles.faqAnswer}>{f.a}</Text>
                  )}
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </Card>

        <Text style={styles.hint}>
          Horario de soporte: lunes a domingo, 8 AM a 11 PM.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: s.xl,
    paddingBottom: s['4xl'],
    paddingTop: s.sm,
  },
  sectionEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    letterSpacing: -0.3,
    marginTop: 2,
    marginBottom: s.md,
  },

  // ============ Contacto ============
  contactGrid: {
    flexDirection: 'row',
    gap: s.xs,
    marginBottom: s.xs,
  },
  contactCard: { flex: 1, alignItems: 'flex-start' },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s.sm,
  },
  contactIconWa: {
    backgroundColor: 'rgba(31,174,111,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(31,174,111,0.32)',
  },
  contactIconPhone: {
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.32)',
  },
  contactIconEmail: {
    backgroundColor: 'rgba(46,144,250,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(46,144,250,0.32)',
  },
  contactLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  contactValue: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  emailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    marginTop: s.sm,
  },
  emailLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  emailValue: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
    marginTop: 2,
  },

  // ============ FAQ ============
  faqRow: { paddingVertical: s.md, paddingHorizontal: s.md },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: s.sm,
  },
  faqQuestion: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  faqAnswer: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: 20,
    marginTop: s.sm,
  },
  faqDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: s.md,
  },

  hint: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    marginTop: s.xl,
    paddingHorizontal: s.lg,
  },
});
