// ==========================================
// TERMS SCREEN - TERMINOS Y CONDICIONES
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

export default function TermsScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terminos y Condiciones</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdate}>Ultima actualizacion: Noviembre 2024</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Aceptacion de los Terminos</Text>
          <Text style={styles.paragraph}>
            Al acceder y utilizar la aplicacion Quiubole! ("la App"), usted acepta estar sujeto a estos
            Terminos y Condiciones. Si no esta de acuerdo con alguna parte de estos terminos, no podra
            acceder al servicio.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Descripcion del Servicio</Text>
          <Text style={styles.paragraph}>
            Quiubole! es una plataforma de intermediacion que conecta usuarios con restaurantes y
            repartidores independientes para facilitar la entrega de alimentos a domicilio. Quiubole!
            no es un servicio de entrega directo ni un restaurante.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Registro y Cuenta</Text>
          <Text style={styles.paragraph}>
            Para utilizar nuestros servicios, debe crear una cuenta proporcionando informacion veraz
            y actualizada. Usted es responsable de mantener la confidencialidad de su cuenta y contrasena.
          </Text>
          <Text style={styles.bulletPoint}>• Debe ser mayor de 18 anos para crear una cuenta</Text>
          <Text style={styles.bulletPoint}>• La informacion proporcionada debe ser precisa</Text>
          <Text style={styles.bulletPoint}>• No puede compartir su cuenta con terceros</Text>
          <Text style={styles.bulletPoint}>• Debe notificar cualquier uso no autorizado</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Uso del Servicio</Text>
          <Text style={styles.paragraph}>
            Al usar Quiubole!, usted acepta:
          </Text>
          <Text style={styles.bulletPoint}>• Usar el servicio solo para fines legales</Text>
          <Text style={styles.bulletPoint}>• No interferir con el funcionamiento de la plataforma</Text>
          <Text style={styles.bulletPoint}>• No crear cuentas falsas o fraudulentas</Text>
          <Text style={styles.bulletPoint}>• Respetar a los restaurantes y repartidores</Text>
          <Text style={styles.bulletPoint}>• Proporcionar direcciones de entrega precisas</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Pedidos y Pagos</Text>
          <Text style={styles.paragraph}>
            Los precios mostrados incluyen impuestos aplicables. La tarifa de envio y servicio se
            calcula segun la distancia y otros factores. Los pedidos son finales una vez confirmados
            por el restaurante.
          </Text>
          <Text style={styles.subSection}>Metodos de pago aceptados:</Text>
          <Text style={styles.bulletPoint}>• Tarjeta de credito/debito</Text>
          <Text style={styles.bulletPoint}>• Pago en OXXO</Text>
          <Text style={styles.bulletPoint}>• Efectivo (sujeto a disponibilidad)</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Cancelaciones y Reembolsos</Text>
          <Text style={styles.paragraph}>
            Puede cancelar un pedido sin cargo antes de que el restaurante confirme la preparacion.
            Una vez que el pedido esta siendo preparado, las cancelaciones pueden estar sujetas a
            cargos parciales o totales.
          </Text>
          <Text style={styles.paragraph}>
            Los reembolsos se procesan en un plazo de 5-10 dias habiles al metodo de pago original.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Calidad de los Productos</Text>
          <Text style={styles.paragraph}>
            Quiubole! no es responsable de la calidad, presentacion o sabor de los alimentos, ya que
            estos son preparados por restaurantes independientes. Cualquier queja sobre la comida
            debe dirigirse al restaurante correspondiente a traves de nuestra plataforma.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Propiedad Intelectual</Text>
          <Text style={styles.paragraph}>
            Todo el contenido de la App, incluyendo logos, disenos, textos y software, es propiedad
            de Quiubole! o sus licenciantes. No puede copiar, modificar o distribuir ningun contenido
            sin autorizacion previa.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Limitacion de Responsabilidad</Text>
          <Text style={styles.paragraph}>
            Quiubole! no sera responsable por danos indirectos, incidentales o consecuentes que
            surjan del uso del servicio. Nuestra responsabilidad maxima se limita al monto pagado
            por el pedido en cuestion.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Modificaciones</Text>
          <Text style={styles.paragraph}>
            Nos reservamos el derecho de modificar estos terminos en cualquier momento. Los cambios
            entraran en vigor al publicarse en la App. El uso continuado del servicio constituye
            aceptacion de los terminos modificados.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Ley Aplicable</Text>
          <Text style={styles.paragraph}>
            Estos terminos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier disputa
            sera sometida a los tribunales competentes de la Ciudad de Mexico.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Contacto</Text>
          <Text style={styles.paragraph}>
            Para preguntas sobre estos terminos, contactenos en:
          </Text>
          <Text style={styles.contactInfo}>Email: legal@quiubole.com</Text>
          <Text style={styles.contactInfo}>Telefono: 55 1234 5678</Text>
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
