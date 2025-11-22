// ==========================================
// PRIVACY SCREEN - POLITICA DE PRIVACIDAD
// ==========================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const COLORS = {
  primary: '#FF6B35',
  background: '#F8F9FA',
  white: '#FFFFFF',
  gray: '#6C757D',
  text: '#212529',
  lightGray: '#E9ECEF',
};

export default function PrivacyScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Politica de Privacidad</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdate}>Ultima actualizacion: Noviembre 2024</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Introduccion</Text>
          <Text style={styles.paragraph}>
            En Quiubole! ("nosotros", "nuestro" o "la App"), respetamos su privacidad y nos comprometemos
            a proteger sus datos personales. Esta Politica de Privacidad explica como recopilamos,
            usamos y protegemos su informacion.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Informacion que Recopilamos</Text>
          <Text style={styles.subSection}>Informacion que usted proporciona:</Text>
          <Text style={styles.bulletPoint}>• Nombre completo</Text>
          <Text style={styles.bulletPoint}>• Correo electronico</Text>
          <Text style={styles.bulletPoint}>• Numero de telefono</Text>
          <Text style={styles.bulletPoint}>• Direcciones de entrega</Text>
          <Text style={styles.bulletPoint}>• Informacion de pago (procesada de forma segura)</Text>

          <Text style={styles.subSection}>Informacion recopilada automaticamente:</Text>
          <Text style={styles.bulletPoint}>• Ubicacion (con su consentimiento)</Text>
          <Text style={styles.bulletPoint}>• Informacion del dispositivo</Text>
          <Text style={styles.bulletPoint}>• Historial de pedidos</Text>
          <Text style={styles.bulletPoint}>• Preferencias de uso</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Como Usamos su Informacion</Text>
          <Text style={styles.paragraph}>Utilizamos su informacion para:</Text>
          <Text style={styles.bulletPoint}>• Procesar y entregar sus pedidos</Text>
          <Text style={styles.bulletPoint}>• Mejorar nuestros servicios</Text>
          <Text style={styles.bulletPoint}>• Enviar notificaciones sobre su pedido</Text>
          <Text style={styles.bulletPoint}>• Comunicar promociones (si lo autoriza)</Text>
          <Text style={styles.bulletPoint}>• Prevenir fraudes y actividades ilegales</Text>
          <Text style={styles.bulletPoint}>• Cumplir con obligaciones legales</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Compartir Informacion</Text>
          <Text style={styles.paragraph}>
            Compartimos su informacion solo cuando es necesario:
          </Text>
          <Text style={styles.bulletPoint}>• Con restaurantes para preparar su pedido</Text>
          <Text style={styles.bulletPoint}>• Con repartidores para realizar la entrega</Text>
          <Text style={styles.bulletPoint}>• Con procesadores de pago para transacciones</Text>
          <Text style={styles.bulletPoint}>• Con autoridades cuando la ley lo requiera</Text>
          <Text style={styles.paragraph}>
            Nunca vendemos su informacion personal a terceros.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Seguridad de Datos</Text>
          <Text style={styles.paragraph}>
            Implementamos medidas de seguridad para proteger su informacion:
          </Text>
          <Text style={styles.bulletPoint}>• Encriptacion SSL/TLS para transmision de datos</Text>
          <Text style={styles.bulletPoint}>• Almacenamiento seguro de contrasenas (hash)</Text>
          <Text style={styles.bulletPoint}>• Acceso restringido a datos personales</Text>
          <Text style={styles.bulletPoint}>• Monitoreo continuo de seguridad</Text>
          <Text style={styles.bulletPoint}>• Procesamiento de pagos compatible con PCI-DSS</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Sus Derechos</Text>
          <Text style={styles.paragraph}>
            De acuerdo con la Ley Federal de Proteccion de Datos Personales, usted tiene derecho a:
          </Text>
          <Text style={styles.bulletPoint}>• Acceder a sus datos personales</Text>
          <Text style={styles.bulletPoint}>• Rectificar informacion incorrecta</Text>
          <Text style={styles.bulletPoint}>• Cancelar el uso de sus datos</Text>
          <Text style={styles.bulletPoint}>• Oponerse al tratamiento de sus datos</Text>
          <Text style={styles.paragraph}>
            Para ejercer estos derechos, contactenos en privacidad@quiubole.com
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Cookies y Tecnologias</Text>
          <Text style={styles.paragraph}>
            Utilizamos cookies y tecnologias similares para mejorar su experiencia, recordar sus
            preferencias y analizar el uso de la App. Puede gestionar las cookies en la configuracion
            de su dispositivo.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Retencion de Datos</Text>
          <Text style={styles.paragraph}>
            Conservamos sus datos mientras mantenga una cuenta activa o sea necesario para prestar
            nuestros servicios. Puede solicitar la eliminacion de su cuenta y datos asociados en
            cualquier momento.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Menores de Edad</Text>
          <Text style={styles.paragraph}>
            Nuestros servicios no estan dirigidos a menores de 18 anos. No recopilamos conscientemente
            informacion de menores. Si descubrimos que hemos recopilado datos de un menor, los
            eliminaremos inmediatamente.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Cambios a esta Politica</Text>
          <Text style={styles.paragraph}>
            Podemos actualizar esta politica periodicamente. Le notificaremos sobre cambios
            significativos a traves de la App o por correo electronico. Le recomendamos revisar
            esta politica regularmente.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Contacto</Text>
          <Text style={styles.paragraph}>
            Para preguntas sobre esta politica o el manejo de sus datos:
          </Text>
          <Text style={styles.contactInfo}>Email: privacidad@quiubole.com</Text>
          <Text style={styles.contactInfo}>Oficial de Privacidad: dpo@quiubole.com</Text>
          <Text style={styles.contactInfo}>Telefono: 55 1234 5678</Text>
          <Text style={styles.contactInfo}>
            Direccion: Av. Paseo de la Reforma 250, CDMX, Mexico
          </Text>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  lastUpdate: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  subSection: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 8,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 22,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 24,
    paddingLeft: 8,
  },
  contactInfo: {
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 4,
  },
});
