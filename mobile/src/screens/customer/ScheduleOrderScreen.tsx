// ==========================================
// SCHEDULE ORDER SCREEN - PROGRAMAR PEDIDO
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

const COLORS = {
  primary: '#FF6B35',
  secondary: '#2E4057',
  background: '#F8F9FA',
  white: '#FFFFFF',
  gray: '#6C757D',
  lightGray: '#E9ECEF',
  text: '#212529',
  success: '#4CAF50',
};

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
        // Debe ser al menos 1 hora en el futuro
        available = slotTime.getTime() > now.getTime() + 3600000;
      }

      slots.push({
        time,
        label: hour >= 12 ? `${hour > 12 ? hour - 12 : hour}:${minutes} PM` : `${hour}:${minutes} AM`,
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

export default function ScheduleOrderScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [repeatOption, setRepeatOption] = useState<'none' | 'weekly' | 'daily'>('none');

  const days = getNextSevenDays();
  const timeSlots = generateTimeSlots(selectedDate);
  const orderId = route.params?.orderId;

  const formatDayName = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Hoy';
    if (date.toDateString() === tomorrow.toDateString()) return 'Manana';
    return date.toLocaleDateString('es-MX', { weekday: 'short' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const handleConfirmSchedule = () => {
    if (!selectedTime) {
      Alert.alert('Selecciona una hora', 'Por favor selecciona el horario de entrega');
      return;
    }

    const scheduledDateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':');
    scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));

    Alert.alert(
      'Pedido programado!',
      `Tu pedido sera entregado el ${formatDate(selectedDate)} a las ${selectedTime}`,
      [
        {
          text: 'Perfecto',
          onPress: () => {
            navigation.navigate('Checkout', {
              scheduledDate: scheduledDateTime.toISOString(),
              repeatOption,
            });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Programar entrega</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="time" size={24} color={COLORS.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Recibe cuando quieras</Text>
            <Text style={styles.infoDesc}>
              Programa tu pedido con anticipacion y lo recibiras justo a tiempo
            </Text>
          </View>
        </View>

        {/* Day Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selecciona el dia</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.daysScroll}
          >
            {days.map((date, index) => {
              const isSelected = date.toDateString() === selectedDate.toDateString();
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.dayCard, isSelected && styles.dayCardSelected]}
                  onPress={() => {
                    setSelectedDate(date);
                    setSelectedTime(null);
                  }}
                >
                  <Text
                    style={[
                      styles.dayName,
                      isSelected && styles.dayTextSelected,
                    ]}
                  >
                    {formatDayName(date)}
                  </Text>
                  <Text
                    style={[
                      styles.dayNumber,
                      isSelected && styles.dayTextSelected,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                  <Text
                    style={[
                      styles.dayMonth,
                      isSelected && styles.dayTextSelected,
                    ]}
                  >
                    {date.toLocaleDateString('es-MX', { month: 'short' })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selecciona la hora</Text>
          <Text style={styles.sectionSubtitle}>{formatDate(selectedDate)}</Text>
          <View style={styles.timeSlotsGrid}>
            {timeSlots.map((slot) => (
              <TouchableOpacity
                key={slot.time}
                style={[
                  styles.timeSlot,
                  selectedTime === slot.time && styles.timeSlotSelected,
                  !slot.available && styles.timeSlotDisabled,
                ]}
                onPress={() => slot.available && setSelectedTime(slot.time)}
                disabled={!slot.available}
              >
                <Text
                  style={[
                    styles.timeSlotText,
                    selectedTime === slot.time && styles.timeSlotTextSelected,
                    !slot.available && styles.timeSlotTextDisabled,
                  ]}
                >
                  {slot.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Repeat Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Repetir pedido</Text>
          <View style={styles.repeatOptions}>
            <TouchableOpacity
              style={[
                styles.repeatOption,
                repeatOption === 'none' && styles.repeatOptionSelected,
              ]}
              onPress={() => setRepeatOption('none')}
            >
              <Ionicons
                name={repeatOption === 'none' ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={repeatOption === 'none' ? COLORS.primary : COLORS.gray}
              />
              <Text
                style={[
                  styles.repeatOptionText,
                  repeatOption === 'none' && styles.repeatOptionTextSelected,
                ]}
              >
                Solo esta vez
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.repeatOption,
                repeatOption === 'weekly' && styles.repeatOptionSelected,
              ]}
              onPress={() => setRepeatOption('weekly')}
            >
              <Ionicons
                name={repeatOption === 'weekly' ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={repeatOption === 'weekly' ? COLORS.primary : COLORS.gray}
              />
              <Text
                style={[
                  styles.repeatOptionText,
                  repeatOption === 'weekly' && styles.repeatOptionTextSelected,
                ]}
              >
                Cada semana
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.repeatOption,
                repeatOption === 'daily' && styles.repeatOptionSelected,
              ]}
              onPress={() => setRepeatOption('daily')}
            >
              <Ionicons
                name={repeatOption === 'daily' ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={repeatOption === 'daily' ? COLORS.primary : COLORS.gray}
              />
              <Text
                style={[
                  styles.repeatOptionText,
                  repeatOption === 'daily' && styles.repeatOptionTextSelected,
                ]}
              >
                Cada dia
              </Text>
            </TouchableOpacity>
          </View>
          {repeatOption !== 'none' && (
            <View style={styles.repeatInfo}>
              <Ionicons name="information-circle" size={16} color={COLORS.primary} />
              <Text style={styles.repeatInfoText}>
                Podras cancelar o modificar en cualquier momento desde tu historial de pedidos
              </Text>
            </View>
          )}
        </View>

        {/* Selected Summary */}
        {selectedTime && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons name="calendar" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryTitle}>Entrega programada</Text>
              <Text style={styles.summaryDate}>
                {formatDate(selectedDate)} a las {selectedTime}
              </Text>
              {repeatOption !== 'none' && (
                <Text style={styles.summaryRepeat}>
                  Se repetira {repeatOption === 'weekly' ? 'cada semana' : 'cada dia'}
                </Text>
              )}
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[styles.confirmButton, !selectedTime && styles.confirmButtonDisabled]}
          onPress={handleConfirmSchedule}
          disabled={!selectedTime}
        >
          <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
          <Text style={styles.confirmButtonText}>Confirmar horario</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
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
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  content: { flex: 1 },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    backgroundColor: `${COLORS.primary}10`,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  infoDesc: { fontSize: 13, color: COLORS.gray, marginTop: 4, lineHeight: 18 },

  // Section
  section: { marginBottom: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  sectionSubtitle: { fontSize: 13, color: COLORS.gray, marginBottom: 12 },

  // Days
  daysScroll: { marginLeft: -8 },
  dayCard: {
    width: 72,
    paddingVertical: 12,
    marginHorizontal: 4,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayName: { fontSize: 12, fontWeight: '600', color: COLORS.gray },
  dayNumber: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginVertical: 4 },
  dayMonth: { fontSize: 11, color: COLORS.gray },
  dayTextSelected: { color: COLORS.white },

  // Time Slots
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    width: '23%',
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeSlotSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeSlotDisabled: {
    backgroundColor: COLORS.lightGray,
    opacity: 0.5,
  },
  timeSlotText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  timeSlotTextSelected: { color: COLORS.white },
  timeSlotTextDisabled: { color: COLORS.gray },

  // Repeat Options
  repeatOptions: { gap: 8 },
  repeatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  repeatOptionSelected: {
    backgroundColor: `${COLORS.primary}10`,
  },
  repeatOptionText: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  repeatOptionTextSelected: { color: COLORS.primary, fontWeight: '600' },
  repeatInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    gap: 8,
  },
  repeatInfoText: { flex: 1, fontSize: 12, color: COLORS.gray, lineHeight: 16 },

  // Summary Card
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContent: { flex: 1, marginLeft: 12 },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  summaryDate: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  summaryRepeat: { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginTop: 4 },

  // Bottom Section
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  confirmButtonDisabled: { backgroundColor: COLORS.lightGray },
  confirmButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
});
