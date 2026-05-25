// ==========================================
// DEVOLÓN — ScheduleOrderScreen
//
// Calendario semanal horizontal + grid de slots horarios + repeat options.
// Footer sticky con CTA primario amarillo (Button). Day-card seleccionado
// se rellena de amarillo; los disabled van en glass atenuado.
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Header, Button } from '../../components/ui';
import {
  colors,
  s,
  radius,
  shadows,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

interface TimeSlot {
  time: string;
  label: string;
  available: boolean;
}

const generateTimeSlots = (selectedDate: Date): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const now = new Date();
  const isToday = selectedDate.toDateString() === now.toDateString();

  for (let hour = 8; hour <= 22; hour++) {
    for (const minutes of ['00', '30']) {
      const time = `${hour.toString().padStart(2, '0')}:${minutes}`;
      let available = true;

      if (isToday) {
        const slotTime = new Date(selectedDate);
        slotTime.setHours(hour, parseInt(minutes));
        available = slotTime.getTime() > now.getTime() + 3600000;
      }

      slots.push({
        time,
        label:
          hour >= 12
            ? `${hour > 12 ? hour - 12 : hour}:${minutes} PM`
            : `${hour}:${minutes} AM`,
        available,
      });
    }
  }
  return slots;
};

const getNextSevenDays = (): Date[] => {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    days.push(date);
  }
  return days;
};

type RepeatOption = 'none' | 'weekly' | 'daily';

export default function ScheduleOrderScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [repeatOption, setRepeatOption] = useState<RepeatOption>('none');

  const days = getNextSevenDays();
  const timeSlots = generateTimeSlots(selectedDate);
  const orderId = route.params?.orderId;

  const formatDayName = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'HOY';
    if (date.toDateString() === tomorrow.toDateString()) return 'MAÑANA';
    return date.toLocaleDateString('es-MX', { weekday: 'short' }).toUpperCase();
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

  const handleConfirmSchedule = () => {
    if (!selectedTime) {
      Alert.alert('Selecciona una hora', 'Por favor selecciona el horario de entrega.');
      return;
    }

    const scheduledDateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':');
    scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));

    Alert.alert(
      'Pedido programado',
      `Tu pedido será entregado el ${formatDate(selectedDate)} a las ${selectedTime}.`,
      [
        {
          text: 'Perfecto',
          onPress: () =>
            navigation.navigate('Checkout', {
              scheduledDate: scheduledDateTime.toISOString(),
              repeatOption,
            }),
        },
      ],
    );
  };

  const repeatOptions: { id: RepeatOption; label: string }[] = [
    { id: 'none', label: 'Solo esta vez' },
    { id: 'weekly', label: 'Cada semana' },
    { id: 'daily', label: 'Cada día' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title="Programar entrega" eyebrow="DEVOLÓN" />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* INFO CARD */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons name="time" size={20} color={colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Recibe cuando quieras</Text>
            <Text style={styles.infoDesc}>
              Programa tu pedido con anticipación y lo recibirás justo a tiempo.
            </Text>
          </View>
        </View>

        {/* DAY */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>SELECCIONA EL DÍA</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysRow}
          >
            {days.map((date, index) => {
              const isSelected = date.toDateString() === selectedDate.toDateString();
              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.85}
                  style={[styles.dayCard, isSelected && styles.dayCardSelected]}
                  onPress={() => {
                    setSelectedDate(date);
                    setSelectedTime(null);
                  }}
                >
                  <Text style={[styles.dayName, isSelected && styles.dayTextSelected]}>
                    {formatDayName(date)}
                  </Text>
                  <Text style={[styles.dayNumber, isSelected && styles.dayTextSelected]}>
                    {date.getDate()}
                  </Text>
                  <Text style={[styles.dayMonth, isSelected && styles.dayTextSelected]}>
                    {date.toLocaleDateString('es-MX', { month: 'short' }).toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* TIME */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>SELECCIONA LA HORA</Text>
          <Text style={styles.sectionSubtitle}>{formatDate(selectedDate)}</Text>
          <View style={styles.timeSlotsGrid}>
            {timeSlots.map((slot) => {
              const isSelected = selectedTime === slot.time;
              return (
                <TouchableOpacity
                  key={slot.time}
                  activeOpacity={0.85}
                  style={[
                    styles.timeSlot,
                    isSelected && styles.timeSlotSelected,
                    !slot.available && styles.timeSlotDisabled,
                  ]}
                  onPress={() => slot.available && setSelectedTime(slot.time)}
                  disabled={!slot.available}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      isSelected && styles.timeSlotTextSelected,
                      !slot.available && styles.timeSlotTextDisabled,
                    ]}
                  >
                    {slot.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* REPEAT */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>REPETIR PEDIDO</Text>
          <View style={styles.repeatOptions}>
            {repeatOptions.map((opt) => {
              const active = repeatOption === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  activeOpacity={0.85}
                  style={[styles.repeatOption, active && styles.repeatOptionActive]}
                  onPress={() => setRepeatOption(opt.id)}
                >
                  <Ionicons
                    name={active ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={active ? colors.primary : colors.textFaint}
                  />
                  <Text style={[styles.repeatOptionText, active && styles.repeatOptionTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {repeatOption !== 'none' && (
            <View style={styles.repeatInfo}>
              <Ionicons name="information-circle" size={14} color={colors.primary} />
              <Text style={styles.repeatInfoText}>
                Podrás cancelar o modificar en cualquier momento desde tu historial.
              </Text>
            </View>
          )}
        </View>

        {/* SUMMARY */}
        {selectedTime && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryEyebrow}>ENTREGA PROGRAMADA</Text>
              <Text style={styles.summaryDate} numberOfLines={2}>
                {formatDate(selectedDate)} · {selectedTime}
              </Text>
              {repeatOption !== 'none' && (
                <Text style={styles.summaryRepeat}>
                  Se repetirá {repeatOption === 'weekly' ? 'cada semana' : 'cada día'}
                </Text>
              )}
            </View>
          </View>
        )}

        <View style={{ height: s['3xl'] }} />
      </ScrollView>

      {/* STICKY FOOTER */}
      <View style={styles.footer}>
        <Button
          label="CONFIRMAR HORARIO"
          icon="checkmark-circle"
          iconPosition="left"
          onPress={handleConfirmSchedule}
          disabled={!selectedTime}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scrollContent: {
    paddingTop: s.md,
    paddingBottom: s['2xl'],
  },

  // ============ INFO CARD ============
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    backgroundColor: 'rgba(255,194,14,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.25)',
    marginHorizontal: s.xl,
    padding: s.md,
    borderRadius: radius.xl,
    marginBottom: s.lg,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: { flex: 1 },
  infoTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  infoDesc: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginTop: 2,
    lineHeight: 18,
  },

  // ============ SECTIONS ============
  section: {
    marginBottom: s.xl,
    paddingHorizontal: s.xl,
  },
  sectionEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    marginBottom: s.xs,
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: s.md,
    textTransform: 'capitalize',
  },

  // ============ DAYS ============
  daysRow: {
    gap: s.xs,
    paddingRight: s.lg,
  },
  dayCard: {
    width: 68,
    paddingVertical: s.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    alignItems: 'center',
  },
  dayCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.glow,
  },
  dayName: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  dayNumber: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.5,
    marginVertical: 2,
  },
  dayMonth: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  dayTextSelected: { color: colors.onPrimary },

  // ============ TIME SLOTS ============
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s.xs,
  },
  timeSlot: {
    width: '23.5%',
    paddingVertical: s.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeSlotDisabled: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
    opacity: 0.35,
  },
  timeSlotText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
  },
  timeSlotTextSelected: { color: colors.onPrimary },
  timeSlotTextDisabled: { color: colors.textMuted },

  // ============ REPEAT ============
  repeatOptions: { gap: s.xs },
  repeatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: s.md,
    borderRadius: radius.xl,
  },
  repeatOptionActive: {
    backgroundColor: 'rgba(255,194,14,0.08)',
    borderColor: colors.primary,
  },
  repeatOptionText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  repeatOptionTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.heavy,
  },
  repeatInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: s.sm,
  },
  repeatInfoText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: 16,
  },

  // ============ SUMMARY ============
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.4)',
    marginHorizontal: s.xl,
    padding: s.md,
    borderRadius: radius.xl,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryContent: { flex: 1 },
  summaryEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  summaryDate: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  summaryRepeat: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    marginTop: 2,
  },

  // ============ FOOTER ============
  footer: {
    paddingHorizontal: s.xl,
    paddingTop: s.sm,
    paddingBottom: s.sm,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
