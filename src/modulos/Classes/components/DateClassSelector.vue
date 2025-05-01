<template>
  <!-- modulos/Classes/components/DateClassSelector.vue -->
  <div>
    <div class="space-y-6" :class="customClass">
      <!-- Búsqueda - Uncommented and improved -->
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por nombre, instrumento o nivel..."
          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        <div v-if="searchQuery" 
             @click="searchQuery = ''" 
             class="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      </div>

      <!-- Estado de carga -->
      <div v-if="loading || isLoading" class="flex justify-center py-4">
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
        ></div>
      </div>

      <!-- Mensaje de error -->
      <div
        v-else-if="error"
        class="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg text-red-700 dark:text-red-400"
      >
        {{ error }}
      </div>

      <!-- Lista de clases filtradas -->
      <!-- Dentro del template, en la sección del listado de clases -->
      <div v-else-if="filteredClasses.length > 0" class="space-y-3">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ filteredClasses.length }} clases disponibles para
          {{ formatDate(selectedDate) }}
        </div>

        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden divide-y divide-gray-200 dark:divide-gray-700"
        >
          <div
            v-for="class_ in filteredClasses"
            :key="class_.id"
            class="p-4 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
            :class="{
              'bg-blue-50 dark:bg-blue-900/20': modelValue === class_.id,
            }"
            @click="selectClass(class_)"
          >
            <div class="flex justify-between items-center">
              <div class="flex-1">
                <h3
                  class="text-base font-medium text-gray-900 dark:text-gray-100"
                >
                  {{ class_.name }}
                </h3>
                <div
                  class="flex gap-2 flex-wrap text-xs text-gray-500 dark:text-gray-400"
                >
                  <span v-if="class_.instrument">{{ class_.instrument }}</span>
                  <span v-if="class_.level">· {{ class_.level }}</span>
                  <span
                    v-if="
                      class_.schedule?.startTime && class_.schedule?.endTime
                    "
                  >
                    · {{ class_.schedule.startTime }} -
                    {{ class_.schedule.endTime }}
                  </span>
                </div>
              </div>

              <!-- Indicador "Asistencia Lista" para clases con asistencia registrada -->
              <div class="flex items-center space-x-2">
                <div
                  v-if="hasAttendanceRecord(class_.id, props.selectedDate)"
                  class="mr-3 text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-full flex items-center"
                >
                  <svg
                    class="w-3 h-3 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  Asistencia Lista
                </div>
                <ChevronRightIcon class="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado vacío -->
      <div v-else class="text-center py-6">
        <div class="text-gray-400 dark:text-gray-500 mb-2">
          <svg
            class="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 class="text-base font-medium text-gray-900 dark:text-gray-100">
          No tienes clases asignadas
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          No se encontraron clases asignadas a ti para
          {{ formatDate(selectedDate) }}.
        </p>
      </div>
    </div>

    <!-- Modal de calendario para seleccionar fecha -->
    <div
      v-if="showCalendarModal"
      class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
    >
      <div
        class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-md w-full"
      >
        <h3 class="text-lg font-semibold mb-4">Seleccionar Fecha</h3>
        <Calendar
          :selected-date="selectedDate"
          :date-statuses="availableClassDates"
          :marked-dates="markedDates"
          @select="handleCalendarSelect"
        />
        <div class="mt-4 text-right">
          <button @click="showCalendarModal = false" class="btn btn-secondary">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<!-- Added TypeScript interfaces -->
<script lang="ts">
// These interfaces are defined outside the component for reuse
export interface ClassScheduleSlot {
  day: number | string;
  startTime?: string;
  endTime?: string;
}

export interface ClassSchedule {
  startTime?: string; // Format: "HH:MM" (24-hour format)
  endTime?: string; // Format: "HH:MM" (24-hour format)
  slots?: ClassScheduleSlot[]; // Array of scheduled time slots for the class
}

export interface Class {
  id: string;
  name: string;
  instrument?: string;
  level: string;
  teacherId?: string;
  schedule?: ClassSchedule;
}
</script>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useClassesStore } from "../store/classes";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronRightIcon, CalendarDaysIcon } from "@heroicons/vue/24/outline";
import Calendar from "../../../components/Calendar.vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../../stores/auth"; // Ajusta la ruta según tu estructura
// Definir props correctamente para evitar advertencias de props extraños
const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  selectedDate: {
    type: String,
    required: true,
  },
  dayFilter: {
    type: Boolean,
    default: false,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  // Añadir una prop para recibir las clases CSS personalizadas
  class: {
    type: [String, Object, Array],
    default: "",
  },
  // Nueva prop para identificar clases con registros
  classesWithRecords: {
    type: Array as () => Array<{ classId: string; date: string }>,
    default: () => [],
  },
  // Prop para fechas marcadas en el calendario
  markedDates: {
    type: Array as () => string[],
    default: () => [],
  },
});
const authStore = useAuthStore();

// Crear una computed para manejar las clases personalizadas
const customClass = computed(() => props.class);

const emit = defineEmits([
  "update:modelValue",
  "update:selectedDate",
  "continue",
  "date-change",
]);

const classesStore = useClassesStore();
const loading = ref(false);
const error = ref("");
const searchQuery = ref("");
const showCalendarModal = ref(false);
const router = useRouter();

// Definir filteredClasses para resolver la advertencia
const filteredClasses = ref<any[]>([]);

// Computed para obtener las fechas disponibles para clases con su estado de registro
const availableClassDates = computed(() => {
  // Obtener todas las clases que tienen horario
  const scheduledClasses = classesStore.getScheduledClasses;
  
  // Obtener las clases del maestro actual
  const currentTeacherId = authStore.user?.uid;
  const teacherClasses = classesStore.classes.filter(c => c.teacherId === currentTeacherId);
  
  // Crear un mapa para almacenar las fechas y su estado
  const dateStatusMap = new Map<string, { date: string, status: 'registered' | 'none' | 'partial' }>();
  
  // Obtener la fecha actual en formato ISO
  const today = new Date();
  const currentDate = format(today, 'yyyy-MM-dd');
  
  // Para cada clase, añadir sus días programados
  teacherClasses.forEach(classItem => {
    if (classItem.schedule && classItem.schedule.slots && Array.isArray(classItem.schedule.slots)) {
      // Procesar cada slot de horario
      classItem.schedule.slots.forEach((slot: any) => {
        let dayName = '';
        
        if (typeof slot.day === 'number') {
          // Convertir el índice del día a nombre de día
          const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
          if (slot.day >= 0 && slot.day < days.length) {
            dayName = days[slot.day];
          }
        } else if (typeof slot.day === 'string') {
          dayName = slot.day.toLowerCase();
        }
        
        if (dayName) {
          // Generar una fecha ISO para este día en el mes actual
          // Esto es simplificado, en una implementación real necesitarías generar fechas reales
          // basadas en el calendario actual
          const dayIndex = getDayIndex(dayName);
          
          // Calcular fechas para este día en el mes actual
          const daysToAdd = (dayIndex - today.getDay() + 7) % 7;
          const nextOccurrence = new Date(today);
          nextOccurrence.setDate(today.getDate() + daysToAdd);
          
          // Formatear la fecha como ISO
          const dateStr = format(nextOccurrence, 'yyyy-MM-dd');
          
          // Verificar si esta clase tiene registro de asistencia
          const hasRecord = hasAttendanceRecord(classItem.id, dateStr);
          
          // Si la fecha ya existe en el mapa, actualizar su estado
          if (dateStatusMap.has(dateStr)) {
            const currentStatus = dateStatusMap.get(dateStr)!.status;
            
            // Si alguna clase no tiene registro, el estado es 'partial'
            if (!hasRecord && currentStatus === 'registered') {
              dateStatusMap.set(dateStr, { date: dateStr, status: 'partial' });
            }
            // Si todas las clases tienen registro hasta ahora, mantener 'registered'
          } else {
            // Si es la primera clase para esta fecha
            let status: 'registered' | 'none' | 'partial' = 'none';
            
            // Si tiene registro, marcar como 'registered'
            if (hasRecord) {
              status = 'registered';
            } 
            // Si no tiene registro y la fecha ya pasó, marcar como 'none' (rojo)
            else if (dateStr < currentDate) {
              status = 'none';
            }
            // Si no tiene registro pero es hoy o futuro, no mostrar indicador
            
            dateStatusMap.set(dateStr, { date: dateStr, status });
          }
        }
      });
    }
  });
  
  // Convertir el mapa a un array de objetos con fecha y estado
  return Array.from(dateStatusMap.values());
});

// Filtrar clases según el día seleccionado

// Filtrar clases según el día seleccionado y el maestro actual
const filterClassesByDay = (date: string) => {
  try {
    if (!date) {
      console.warn('Date is empty in filterClassesByDay');
      return [];
    }

    // Ensure date is in correct format (yyyy-MM-dd)
    let formattedDate = date;
    if (!date.includes('-') && date.length === 8) {
      // Handle date in format YYYYMMDD
      formattedDate = `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`;
    }

    console.log('Filtering classes for date:', formattedDate);
    
    // Create a proper Date object with time set to midnight
    const localDate = new Date(`${formattedDate}T00:00:00`);
    if (isNaN(localDate.getTime())) {
      console.error('Invalid date:', formattedDate);
      return [];
    }
    
    const dayName = format(localDate, "EEEE", { locale: es }).toLowerCase();
    console.log('Day name:', dayName);
    const dayIndex = getDayIndex(dayName);
    console.log('Day index:', dayIndex);

    // Obtener ID del maestro autenticado
    const currentTeacherId = authStore.user?.uid;
    if (!currentTeacherId) {
      console.warn('No teacher ID found');
    }

    // Filtrar clases que tienen actividad en el día seleccionado Y que pertenecen al maestro actual
    const classesForDay = classesStore.classes.filter((c) => {
      // Debug info
      if (!c.teacherId) console.log('Class without teacher ID:', c.id, c.name);
      if (!c.schedule?.slots) console.log('Class without schedule slots:', c.id, c.name);

      // Primero verificar si la clase pertenece al maestro actual
      if (c.teacherId !== currentTeacherId) return false;

      // Luego verificar si está programada para este día
      if (!c.schedule?.slots || !Array.isArray(c.schedule.slots)) return false;

      return c.schedule.slots.some((slot) => {
        // Handle different types of day representation
        if (typeof slot.day === "number") {
          // For numeric representation (0-6)
          const slotDayIndex = slot.day === 0 ? 6 : slot.day - 1; // Convert Sunday=0 to Sunday=6
          return slotDayIndex === dayIndex;
        } else if (typeof slot.day === "string") {
          // For string representation (name of day)
          const normalizedSlotDay = slot.day.toLowerCase().trim();
          return normalizedSlotDay === dayName || 
                 getDayAbbreviation(normalizedSlotDay) === getDayAbbreviation(dayName);
        }
        return false;
      });
    });

    console.log(`Found ${classesForDay.length} classes for ${dayName}`);
    return classesForDay;
  } catch (err) {
    console.error("Error filtering classes by day:", err);
    return [];
  }
};

// Helper function to get day abbreviation for comparison
const getDayAbbreviation = (dayName: string): string => {
  const abbreviations: Record<string, string> = {
    'domingo': 'dom', 'sunday': 'dom', 
    'lunes': 'lun', 'monday': 'lun',
    'martes': 'mar', 'tuesday': 'mar',
    'miércoles': 'mie', 'miercoles': 'mie', 'wednesday': 'mie',
    'jueves': 'jue', 'thursday': 'jue',
    'viernes': 'vie', 'friday': 'vie',
    'sábado': 'sab', 'sabado': 'sab', 'saturday': 'sab'
  };
  
  return abbreviations[dayName] || dayName.substring(0, 3);
};

// Verificar si una clase está programada para el día de la fecha seleccionada
const isClassScheduledForDay = (classItem: Class): boolean => {
  try {
    // Force date to be parsed as local midnight to prevent timezone issues
    const localDate = new Date(props.selectedDate + "T00:00:00");
    const dayName = format(localDate, "EEEE", { locale: es }).toLowerCase();
    const dayIndex = getDayIndex(dayName);

    return !!(
      classItem.schedule &&
      classItem.schedule.slots &&
      Array.isArray(classItem.schedule.slots) &&
      classItem.schedule.slots.some((slot: ClassScheduleSlot) => {
        if (typeof slot.day === "number") {
          return slot.day === dayIndex;
        } else if (typeof slot.day === "string") {
          return slot.day.toLowerCase() === dayName;
        }
        return false;
      })
    );
  } catch (err) {
    console.error("Error al verificar si la clase está programada:", err);
    return false;
  }
};

// Build a reactive Set for constant‑time lookup (clave compuesta classId|date)
const attendanceSet = computed(() =>
  new Set(props.classesWithRecords.map(r => `${r.classId}|${r.date}`))
);

// Optimized check for attendance record (ahora depende de classId y fecha)
const hasAttendanceRecord = (classId: string, date: string) => {
  return attendanceSet.value.has(`${classId}|${date}`);
};

// Función helper para convertir nombre de día a índice
const getDayIndex = (dayName: string): number => {
  const days = [
    "domingo",
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
  ];
  return days.indexOf(dayName);
};

// Cargar datos
const loadData = async () => {
  loading.value = true;
  error.value = "";

  try {
    console.log("Loading data for date:", props.selectedDate);
    
    // Si aún no tenemos clases, cargarlas
    if (classesStore.classes.length === 0) {
      console.log("Fetching classes as store is empty");
      await classesStore.fetchClasses();
    }

    // Filtrar clases por día y búsqueda
    const filtered = filterClassesByDay(props.selectedDate);
    console.log(`Found ${filtered.length} classes before search filtering`);
    
    filteredClasses.value = filtered.filter((c) => {
      // Si no hay búsqueda, mostrar todas las clases filtradas por día
      if (!searchQuery.value) return true;

      const query = searchQuery.value.toLowerCase();
      const name = c.name?.toLowerCase() || "";
      const instrument = c.instrument?.toLowerCase() || "";
      const level = c.level?.toLowerCase() || "";

      return (
        name.includes(query) ||
        instrument.includes(query) ||
        level.includes(query)
      );
    });
    
    console.log(`Displaying ${filteredClasses.value.length} classes after search filtering`);
  } catch (err) {
    console.error("Error loading class data:", err);
    error.value = "Error al cargar las clases. Inténtalo de nuevo.";
  } finally {
    loading.value = false;
  }
};

// Formatear fecha
const formatDate = (date: string) => {
  try {
    // Use UTC to prevent timezone issues - force midnight in local timezone
    const dateObj = new Date(date + "T00:00:00");
    return format(dateObj, "EEEE d 'de' MMMM", { locale: es });
  } catch {
    return date;
  }
};

// Seleccionar una clase
const selectClass = (classItem: any) => {
  if (!classItem || !classItem.id) {
    console.error("Invalid class selected:", classItem);
    return;
  }

  emit("update:modelValue", classItem.id);
  emit("continue");

  if (props.selectedDate) {
    try {
      // Format date for URL and ensure it's in correct format
      let formattedDate = props.selectedDate.replace(/-/g, "");
      
      // Debug info
      console.log("Navigating to attendance with:", {
        date: formattedDate,
        classId: classItem.id,
        className: classItem.name
      });

      // Use router.push with a more robust approach
      router.push({
        path: `/attendance/${formattedDate}/${classItem.id}`
      }).catch((error) => {
        // If named route fails, try direct path
        console.error("Route navigation error:", error);
        router.push(`/attendance/${formattedDate}/${classItem.id}`);
      });
    } catch (error) {
      console.error("Error in class selection navigation:", error);
      // Show a user-friendly error message here if needed
    }
  } else {
    console.error("No date selected");
  }
};

// Abrir el modal de calendario
const openCalendar = () => {
  showCalendarModal.value = true;
};

// Manejar la selección de fecha en el calendario
const handleCalendarSelect = (date: string) => {
  showCalendarModal.value = false;
  emit("update:selectedDate", date);
  emit("date-change", date);
};

// Observar cambios en fecha y filtro
watch(() => props.selectedDate, loadData, { immediate: true });
watch(searchQuery, loadData);

// Re-run loadData when selectedDate or classesWithRecords changes
watch([() => props.selectedDate, () => props.classesWithRecords], loadData, {
  immediate: true
});

// Cargar datos al montar
onMounted(loadData);
</script>
