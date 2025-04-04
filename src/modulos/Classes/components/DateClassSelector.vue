<template>
  <div class="space-y-6" :class="customClass">
    <!-- Información de fecha seleccionada -->
    <div class="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-base font-medium text-blue-800 dark:text-blue-300">
            Fecha seleccionada
          </h3>
          <p class="text-sm text-blue-600 dark:text-blue-400">
            {{ formatDate(selectedDate) }}
          </p>
        </div>
        <button 
          @click="openCalendar"
          class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          <CalendarDaysIcon class="h-6 w-6" />
        </button>
      </div>
    </div>
    
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
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
    
    <!-- Mensaje de error -->
    <div v-else-if="error" class="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg text-red-700 dark:text-red-400">
      {{ error }}
    </div>
    
    <!-- Lista de clases filtradas -->
    <div v-else-if="filteredClasses.length > 0" class="space-y-3">
      <div class="text-sm text-gray-500 dark:text-gray-400">
        {{ filteredClasses.length }} clases disponibles para {{ formatDate(selectedDate) }}
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden divide-y divide-gray-200 dark:divide-gray-700">
        <div 
          v-for="class_ in filteredClasses" 
          :key="class_.id"
          class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
          @click="selectClass(class_)"
          :class="{'bg-blue-50 dark:bg-blue-900/20': modelValue === class_.id}"
        >
          <div class="flex justify-between items-center">
            <div class="flex-1">
              <h3 class="text-base font-medium text-gray-900 dark:text-white truncate">
                {{ class_.name }}
              </h3>
              <div class="flex flex-wrap items-center mt-1 gap-2">
                <span 
                  v-if="class_.instrument" 
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                >
                  {{ class_.instrument }}
                </span>
                <span 
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                >
                  {{ class_.level }}
                </span>
                <span 
                  v-if="class_.schedule && class_.schedule.startTime && class_.schedule.endTime" 
                  class="text-xs text-gray-500 dark:text-gray-400"
                >
                  {{ class_.schedule.startTime }} - {{ class_.schedule.endTime }}
                </span>
              </div>
            </div>
            <div class="flex items-center">
              <div v-if="isClassScheduledForDay(class_)" class="mr-3 text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full">
                Programada
              </div>
              <ChevronRightIcon class="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
      
      <!-- Botón continuar -->
      <!-- <div class="mt-6 flex justify-end">
        <button
          @click="handleContinue"
          :disabled="!modelValue || loading || isLoading"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-colors',
            modelValue 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
          ]"
        >
          Continuar
        </button>
      </div> -->
    </div>
    
    <!-- Estado vacío -->
    <div v-else class="text-center py-6">
      <div class="text-gray-400 dark:text-gray-500 mb-2">
        <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <h3 class="text-base font-medium text-gray-900 dark:text-gray-100">No hay clases disponibles</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        No se encontraron clases para el día seleccionado o con los filtros aplicados.
      </p>
    </div>
  </div>
  
  <!-- Modal de calendario para seleccionar fecha -->
  <div v-if="showCalendarModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-md w-full">
      <h3 class="text-lg font-semibold mb-4">Seleccionar Fecha</h3>
      <Calendar :selected-date="selectedDate" :marked-dates="availableClassDates" @select="handleCalendarSelect" />
      <div class="mt-4 text-right">
        <button @click="showCalendarModal = false" class="btn btn-secondary">Cancelar</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useClassesStore } from '../store/classes'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronRightIcon, CalendarDaysIcon } from '@heroicons/vue/24/outline'
import Calendar from '../../../components/Calendar.vue'
import { useRouter } from 'vue-router'

// Definir props correctamente para evitar advertencias de props extraños
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  selectedDate: {
    type: String,
    required: true
  },
  dayFilter: {
    type: Boolean,
    default: false
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  // Añadir una prop para recibir las clases CSS personalizadas
  class: {
    type: [String, Object, Array],
    default: ''
  }
})

// Crear una computed para manejar las clases personalizadas
const customClass = computed(() => props.class)

const emit = defineEmits([
  'update:modelValue',
  'update:selectedDate',
  'continue',
  'date-change'
])

const classesStore = useClassesStore()
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const showCalendarModal = ref(false)
const router = useRouter()

// Definir filteredClasses para resolver la advertencia
const filteredClasses = ref<any[]>([])

// Computed para obtener las fechas disponibles para clases
const availableClassDates = computed(() => {
  // Obtener todas las clases que tienen horario
  const scheduledClasses = classesStore.getScheduledClasses
  
  // Crear un conjunto para evitar duplicados
  const availableDates = new Set<string>()
  
  // Para cada clase, añadir sus días programados
  scheduledClasses.forEach(classItem => {
    if (classItem.schedule && classItem.schedule.slots && Array.isArray(classItem.schedule.slots)) {
      // Añadir los días de la semana de esta clase
      classItem.schedule.slots.forEach((slot: any) => {
        if (typeof slot.day === 'number') {
          // Convertir el índice del día a nombre de día
          const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
          if (slot.day >= 0 && slot.day < days.length) {
            availableDates.add(days[slot.day])
          }
        } else if (typeof slot.day === 'string') {
          availableDates.add(slot.day.toLowerCase())
        }
      })
    }
  })
  
  return Array.from(availableDates)
})

// Filtrar clases según el día seleccionado
const filterClassesByDay = (date: string) => {
  try {
    const localDate = new Date(date + 'T00:00:00');
    const dayName = format(localDate, 'EEEE', { locale: es }).toLowerCase();
    const dayIndex = getDayIndex(dayName);
    
    // Filtrar clases que tienen actividad en el día seleccionado
    const classesForDay = classesStore.classes.filter(c => {
      if (!c.schedule?.slots || !Array.isArray(c.schedule.slots)) return false;
      
      return c.schedule.slots.some(slot => {
        if (typeof slot.day === 'number') {
          return slot.day === dayIndex;
        } else if (typeof slot.day === 'string') {
          return slot.day.toLowerCase() === dayName;
        }
        return false;
      });
    });

    // Solo retornar las clases si hay actividad ese día
    return classesForDay;
  } catch (err) {
    console.error('Error al filtrar clases por día:', err);
    return [];
  }
}

// Verificar si una clase está programada para el día de la fecha seleccionada
const isClassScheduledForDay = (classItem: any) => {
  try {
    // Force date to be parsed as local midnight to prevent timezone issues
    const localDate = new Date(props.selectedDate + 'T00:00:00');
    const dayName = format(localDate, 'EEEE', { locale: es }).toLowerCase();
    const dayIndex = getDayIndex(dayName);
    
    return classItem.schedule && 
           classItem.schedule.slots && 
           Array.isArray(classItem.schedule.slots) &&
           classItem.schedule.slots.some(slot => {
             if (typeof slot.day === 'number') {
               return slot.day === dayIndex
             } else if (typeof slot.day === 'string') {
               return slot.day.toLowerCase() === dayName
             }
             return false
           })
  } catch (err) {
    console.error('Error al verificar si la clase está programada:', err)
    return false
  }
}

// Función helper para convertir nombre de día a índice
const getDayIndex = (dayName: string): number => {
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  return days.indexOf(dayName)
}

// Cargar datos
const loadData = async () => {
  loading.value = true
  error.value = ''
  
  try {
    // Si aún no tenemos clases, cargarlas
    if (classesStore.classes.length === 0) {
      await classesStore.fetchClasses()
    }
    
    // Filtrar clases por día y búsqueda
    const filtered = filterClassesByDay(props.selectedDate)
    filteredClasses.value = filtered.filter(c => {
      // Filtrar por texto de búsqueda
      if (!searchQuery.value) return true
      
      const query = searchQuery.value.toLowerCase()
      const name = c.name?.toLowerCase() || ''
      const instrument = c.instrument?.toLowerCase() || ''
      const level = c.level?.toLowerCase() || ''
      
      return name.includes(query) || instrument.includes(query) || level.includes(query)
    })
  } catch (err) {
    console.error('Error al cargar datos:', err)
    error.value = 'Error al cargar las clases. Inténtalo de nuevo.'
  } finally {
    loading.value = false
  }
}

// Formatear fecha
const formatDate = (date: string) => {
  try {
    // Use UTC to prevent timezone issues - force midnight in local timezone
    const dateObj = new Date(date + 'T00:00:00');
    return format(dateObj, "EEEE d 'de' MMMM", { locale: es });
  } catch {
    return date;
  }
}

// Seleccionar una clase
const selectClass = (classItem: any) => {
  emit('update:modelValue', classItem.id)
  
  // Navegar automáticamente al seleccionar una clase, sin esperar el botón continuar
  if (classItem.id && props.selectedDate) {
    // Formatear la fecha para la URL (remover los guiones)
    const formattedDate = props.selectedDate.replace(/-/g, '');
    
    // Usar router.push para navegar a la vista de asistencia
    router.push({
      name: 'attendance',
      params: {
        date: formattedDate,
        classId: classItem.id
      },
      replace: true // Reemplazar la entrada actual en el historial
    }).then(() => {
      // Emitir evento para notificar que se continuó al siguiente paso
      emit('continue');
    }).catch(error => {
      console.error('Error navigating to attendance page:', error);
    });
  }
}

// Abrir el modal de calendario
const openCalendar = () => {
  showCalendarModal.value = true
}

// Manejar la selección de fecha en el calendario
const handleCalendarSelect = (date: string) => {
  showCalendarModal.value = false
  emit('update:selectedDate', date)
  emit('date-change', date)
}

// Continuar al siguiente paso
const handleContinue = async () => {
  try {
    if (!props.modelValue || !props.selectedDate) {
      return;
    }
    
    // Formatear la fecha para la URL (remover los guiones)
    const formattedDate = props.selectedDate.replace(/-/g, '');
    
    // Usar router.push con replace: true para evitar que el usuario regrese a la selección
    await router.push({
      name: 'attendance',
      params: {
        date: formattedDate,
        classId: props.modelValue
      },
      replace: true // Esto reemplazará la entrada actual en el historial
    });
    
    emit('continue');
  } catch (error) {
    console.error('Error navigating to attendance page:', error);
  }
}

// Observar cambios en fecha y filtro
watch(() => props.selectedDate, loadData, { immediate: true })
watch(searchQuery, loadData)

// Cargar datos al montar
onMounted(loadData)
</script>
