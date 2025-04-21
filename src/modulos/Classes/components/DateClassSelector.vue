<template>
  <!-- modulos/Classes/components/DateClassSelector.vue -->
  <div>
    <div class="space-y-6" :class="customClass">
      <!-- Búsqueda -->
      <!-- <div class="relative">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar por nombre, instrumento o nivel..."
        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      />
    </div> -->

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
                  v-if="hasAttendanceRecord(class_.id)"
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
                    ></path>
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
          const hasRecord = hasAttendanceRecord(classItem.id);
          
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
    const localDate = new Date(date + "T00:00:00");
    const dayName = format(localDate, "EEEE", { locale: es }).toLowerCase();
    const dayIndex = getDayIndex(dayName);

    // Obtener ID del maestro autenticado
    const currentTeacherId = authStore.user?.uid;

    // Filtrar clases que tienen actividad en el día seleccionado Y que pertenecen al maestro actual
    const classesForDay = classesStore.classes.filter((c) => {
      // Primero verificar si la clase pertenece al maestro actual
      if (c.teacherId !== currentTeacherId) return false;

      // Luego verificar si está programada para este día
      if (!c.schedule?.slots || !Array.isArray(c.schedule.slots)) return false;

      return c.schedule.slots.some((slot) => {
        if (typeof slot.day === "number") {
          return slot.day === dayIndex;
        } else if (typeof slot.day === "string") {
          return slot.day.toLowerCase() === dayName;
        }
        return false;
      });
    });

    return classesForDay;
  } catch (err) {
    console.error("Error al filtrar clases por día y maestro:", err);
    return [];
  }
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

// Verificar si una clase ya tiene un registro de asistencia
const hasAttendanceRecord = (classId: string) => {
  // Asegurarse de que props.classesWithRecords es un array antes de llamar a includes()
  return (
    Array.isArray(props.classesWithRecords) &&
    props.classesWithRecords.includes(classId)
  );
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
    // Si aún no tenemos clases, cargarlas
    if (classesStore.classes.length === 0) {
      await classesStore.fetchClasses();
    }

    // Filtrar clases por día y búsqueda
    const filtered = filterClassesByDay(props.selectedDate);
    filteredClasses.value = filtered.filter((c) => {
      // Filtrar por texto de búsqueda
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
  } catch (err) {
    console.error("Error al cargar datos:", err);
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
  emit("update:modelValue", classItem.id);
  emit("continue"); // Esto fuerza el cambio de vista en el padre
  // Navegar automáticamente al seleccionar una clase, sin esperar el botón continuar
  if (classItem.id && props.selectedDate) {
    // Formatear la fecha para la URL (remover los guiones)
    const formattedDate = props.selectedDate.replace(/-/g, "");

    // Usar router.push para navegar a la vista de asistencia
    router
      .push({
        name: "TeacherAttendanceDetail",
        params: {
          date: formattedDate,
          classId: classItem.id,
        },
        replace: true,
      })
      .then(() => {
        // Emitir evento para notificar que se continuó al siguiente paso
        emit("continue");
      })
      .catch((error) => {
        console.error("Error navigating to attendance page:", error);
      });
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

// Cargar datos al montar
onMounted(loadData);
</script>
