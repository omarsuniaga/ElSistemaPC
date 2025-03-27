<!-- Nuevo componente para vista de calendario -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useSchedule } from '../composables/useSchedule';
import { format, startOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

const props = defineProps({
  classes: {
    type: Array,
    required: true
  }
});

// Estados
const currentWeek = ref(new Date());
const timeSlots = generateTimeSlots();
const weekDays = generateWeekDays();

// Generar slots de tiempo de 30 minutos
function generateTimeSlots() {
  const slots = [];
  for (let hour = 7; hour <= 21; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  return slots;
}

// Generar días de la semana
function generateWeekDays() {
  const start = startOfWeek(currentWeek.value, { locale: es });
  return Array.from({ length: 6 }, (_, i) => {
    const day = addDays(start, i + 1); // +1 para empezar en lunes
    return {
      date: day,
      name: format(day, 'EEEE', { locale: es }),
      shortName: format(day, 'EEE', { locale: es })
    };
  });
}

// Computed para organizar las clases por día y hora
const classesByDayAndTime = computed(() => {
  const schedule: Record<string, Record<string, any[]>> = {};
  weekDays.value.forEach(day => {
    schedule[day.name] = {};
    timeSlots.value.forEach(time => {
      schedule[day.name][time] = [];
    });
  });

  props.classes.forEach((class_: any) => {
    if (!class_.schedule) return;

    const schedule_ = typeof class_.schedule === 'string'
      ? { days: [class_.schedule.split(' ')[0]], startTime: class_.schedule.split(' ')[1], endTime: class_.schedule.split(' ')[3] }
      : class_.schedule;

    schedule_.days.forEach((day: string) => {
      const normalizedDay = day.toLowerCase();
      timeSlots.value.forEach(time => {
        if (isTimeInRange(time, schedule_.startTime, schedule_.endTime)) {
          if (schedule[normalizedDay]?.[time]) {
            schedule[normalizedDay][time].push(class_);
          }
        }
      });
    });
  });

  return schedule;
});

// Verificar si un horario está en un rango
function isTimeInRange(time: string, start: string, end: string) {
  return time >= start && time < end;
}

// Navegar entre semanas
const previousWeek = () => {
  currentWeek.value = addDays(currentWeek.value, -7);
};

const nextWeek = () => {
  currentWeek.value = addDays(currentWeek.value, 7);
};

onMounted(() => {
  // Inicializar con la semana actual
  currentWeek.value = new Date();
});
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
    <!-- Navegación del calendario -->
    <div class="flex justify-between items-center mb-4">
      <button 
        @click="previousWeek"
        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <i class="fas fa-chevron-left"></i>
      </button>
      <h3 class="text-lg font-medium">
        {{ format(currentWeek, 'MMMM yyyy', { locale: es }) }}
      </h3>
      <button 
        @click="nextWeek"
        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>

    <!-- Calendario -->
    <div class="overflow-x-auto">
      <div class="inline-block min-w-full">
        <div class="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
          <!-- Columna de horas -->
          <div class="bg-gray-50 dark:bg-gray-800 p-2 text-sm font-medium">
            Hora
          </div>
          <!-- Cabeceras de días -->
          <div
            v-for="day in weekDays"
            :key="day.name"
            class="bg-gray-50 dark:bg-gray-800 p-2 text-sm font-medium text-center"
          >
            <div class="hidden sm:block">{{ day.name }}</div>
            <div class="sm:hidden">{{ day.shortName }}</div>
          </div>

          <!-- Celdas de horarios -->
          <template v-for="time in timeSlots" :key="time">
            <!-- Hora -->
            <div class="bg-white dark:bg-gray-900 p-2 text-sm border-t border-gray-200 dark:border-gray-700">
              {{ time }}
            </div>
            <!-- Clases por día -->
            <div
              v-for="day in weekDays"
              :key="day.name + '-' + time"
              class="bg-white dark:bg-gray-900 p-1 border-t border-l border-gray-200 dark:border-gray-700 relative min-h-[3rem]"
            >
              <div
                v-for="class_ in classesByDayAndTime[day.name][time]"
                :key="class_.id"
                class="absolute inset-1 rounded-md text-xs p-1 overflow-hidden"
                :class="{
                  'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200': !class_.teacherId,
                  'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200': class_.teacherId && class_.studentIds?.length,
                  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200': class_.teacherId && !class_.studentIds?.length
                }"
              >
                <div class="font-medium">{{ class_.name }}</div>
                <div>{{ class_.teacherName || 'Sin profesor' }}</div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid {
  grid-template-columns: auto repeat(6, 1fr);
}
</style>