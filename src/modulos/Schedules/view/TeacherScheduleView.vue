<template>
  <div class="p-4 max-w-5xl mx-auto">
    <div class="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <CalendarIcon class="h-7 w-7" />
          Horario de Clases
        </h1>
        <p class="text-gray-500 text-sm mt-1">
          {{ getCurrentFormattedDate() }}
        </p>
      </div>

      <div class="flex gap-2">
        <button @click="downloadPDF" 
          class="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
          <DocumentArrowDownIcon class="h-5 w-5" />
          PDF
        </button>
        <button @click="shareSchedule"
          class="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
          <ShareIcon class="h-5 w-5" />
          Compartir
        </button>
      </div>
    </div>

    <!-- Pantalla de carga -->
    <div v-if="isLoading" class="flex justify-center py-10">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>

    <!-- Mensaje de error -->
    <div v-else-if="error" class="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
      <p class="text-red-700">{{ error }}</p>
    </div>

    <!-- Contenido principal del horario -->
    <div v-else-if="teacher" id="schedule-pdf" class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <!-- Encabezado con información del profesor -->
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-start gap-4">
          <div class="bg-gray-100 dark:bg-gray-700 p-3 rounded-full">
            <UserIcon class="h-8 w-8 text-gray-500 dark:text-gray-300" />
          </div>
          <div>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ teacher.name }}
            </h2>
            <p class="text-gray-500 dark:text-gray-400">
              {{ teacher.instrument || 'Profesor' }}
            </p>
            <div class="mt-2 text-sm text-gray-500 dark:text-gray-400">
              <p class="font-semibold">Carga horaria semanal: 
                <span class="font-normal">{{ formatHours(calculateWeeklyHours()) }}</span>
              </p>
              <p class="font-semibold mt-1">Disponibilidad declarada:</p>
              <ul class="list-disc list-inside">
                <li v-for="(slot, index) in getFormattedAvailability()" :key="index">
                  {{ slot }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Horario organizado por días -->
      <div class="p-6 bg-gray-50 dark:bg-gray-900">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Horario de Clases Semanal
        </h3>
        
        <!-- Mostrar cuando no hay clases -->
        <div v-if="Object.keys(schedulesByDay).length === 0" 
          class="text-center py-10 text-gray-500 bg-white dark:bg-gray-800 rounded-lg">
          <CalendarIcon class="h-12 w-12 mx-auto text-gray-400" />
          <p class="mt-2">No hay clases asignadas para este profesor</p>
        </div>
        
        <!-- Clases organizadas por día -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div v-for="(classes, day) in schedulesByDay" :key="day" 
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h4 class="font-medium text-lg text-gray-900 dark:text-white border-b pb-2 mb-3">
              {{ day }}
            </h4>
            
            <div v-if="classes.length === 0" class="text-sm text-gray-500 py-2">
              Sin clases programadas
            </div>
            
            <div v-else class="space-y-3">
              <div v-for="(class_, index) in classes" :key="index" 
                class="p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700">
                <div class="flex justify-between">
                  <h5 class="font-semibold text-gray-800 dark:text-white">
                    {{ class_.name }}
                  </h5>
                  <span class="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {{ formatClassTime(class_.schedule) }}
                  </span>
                </div>
                
                <div class="mt-1">
                  <span class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                    {{ class_.level || 'Nivel no especificado' }}
                  </span>
                  
                  <p v-if="class_.location" class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Ubicación: {{ class_.location }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useClassesStore } from '@/stores/classes';
import { useTeachersStore } from '@/stores/teachers';
import html2pdf from 'html2pdf.js';
import { CalendarIcon, UserIcon, DocumentArrowDownIcon, ShareIcon } from '@heroicons/vue/24/outline';

// Stores
const classesStore = useClassesStore();
const teachersStore = useTeachersStore();
const route = useRoute();

// State
const teacher = ref(null);
const teacherClasses = ref([]);
const isLoading = ref(true);
const error = ref(null);
const timeBlocks = ref([]);

// Helper para formatear los horarios
const formatSchedule = (schedule) => {
  if (!schedule || typeof schedule !== 'string') return null;
  
  // Patrón para extraer días y horarios (flexible para diferentes formatos)
  const scheduleParts = schedule.split(/\s+/);
  let days = [];
  let startTime = '';
  let endTime = '';
  
  // Días de la semana en español para identificación
  const weekdaysES = ['lunes', 'martes', 'miércoles', 'miercoles', 'jueves', 'viernes', 'sábado', 'sabado', 'domingo'];
  
  // Identificar días de la semana
  scheduleParts.forEach(part => {
    const lowerPart = part.toLowerCase().replace(/,/g, '');
    if (weekdaysES.some(day => lowerPart.includes(day))) {
      days.push(lowerPart);
    }
  });
  
  // Buscar patrones de hora (HH:MM - HH:MM)
  const timePattern = /(\d{1,2}:\d{2})(?:\s*-\s*(\d{1,2}:\d{2}))?/;
  const timeMatch = schedule.match(timePattern);
  
  if (timeMatch) {
    startTime = timeMatch[1];
    endTime = timeMatch[2] || '';
  }
  
  return {
    days: days.length > 0 ? days : '',
    startTime,
    endTime
  };
};

// Computed para agrupar las clases por día de la semana
const schedulesByDay = computed(() => {
  if (!teacherClasses.value || !teacherClasses.value.length) return {};
  
  // Mapeo de días en español a valor numérico para ordenación
  const dayOrder = {
    'lunes': 1,
    'martes': 2,
    'miercoles': 3,
    'miércoles': 3,
    'jueves': 4,
    'viernes': 5,
    'sabado': 6,
    'sábado': 6,
    'domingo': 7
  };
  
  // Objeto para agrupar clases por día
  const groupedClasses = {};
  
  teacherClasses.value.forEach(class_ => {
    const scheduleInfo = formatSchedule(class_.schedule);
    if (scheduleInfo && scheduleInfo.days) {
      // Para cada día mencionado en el horario
      scheduleInfo.days.forEach(day => {
        // Normalizar el día (quitar acentos para consistencia)
        const normalizedDay = day.toLowerCase()
          .replace('á', 'a')
          .replace('é', 'e')
          .replace('í', 'i')
          .replace('ó', 'o')
          .replace('ú', 'u');
        
        // Inicializar el array para este día si no existe
        if (!groupedClasses[normalizedDay]) {
          groupedClasses[normalizedDay] = [];
        }
        
        // Añadir clase al día correspondiente
        groupedClasses[normalizedDay].push({
          ...class_,
          timeInfo: scheduleInfo
        });
      });
    }
  });
  
  // Ordenar clases dentro de cada día por hora de inicio
  Object.keys(groupedClasses).forEach(day => {
    groupedClasses[day].sort((a, b) => {
      if (a.timeInfo && b.timeInfo) {
        const timeA = a.timeInfo.startTime;
        const timeB = b.timeInfo.startTime;
        return timeA.localeCompare(timeB);
      }
      return 0;
    });
  });
  
  // Ordenar los días según el orden establecido
  const sortedSchedules = {};
  Object.keys(groupedClasses)
    .sort((a, b) => (dayOrder[a] || 999) - (dayOrder[b] || 999))
    .forEach(day => {
      // Capitalizar el nombre del día para mostrar
      const capitalizedDay = day.charAt(0).toUpperCase() + day.slice(1);
      sortedSchedules[capitalizedDay] = groupedClasses[day];
    });
  
  return sortedSchedules;
});

// Helper para formatear el día de una clase
const formatClassDay = (schedule) => {
  const info = formatSchedule(schedule);
  if (info && info.days && info.days.length > 0) {
    // Tomar el primer día mencionado y capitalizarlo
    const day = info.days[0];
    return day.charAt(0).toUpperCase() + day.slice(1);
  }
  return 'No especificado';
};

// Helper para formatear el tiempo de una clase
const formatClassTime = (schedule) => {
  const info = formatSchedule(schedule);
  if (info && info.startTime) {
    return info.endTime ? `${info.startTime} - ${info.endTime}` : info.startTime;
  }
  return 'Horario no especificado';
};

// Calcular las horas semanales totales
const calculateWeeklyHours = () => {
  let totalMinutes = 0;
  
  teacherClasses.value.forEach(class_ => {
    const info = formatSchedule(class_.schedule);
    if (info && info.startTime && info.endTime) {
      // Convertir horas a minutos para calcular la diferencia
      const [startHour, startMin] = info.startTime.split(':').map(Number);
      const [endHour, endMin] = info.endTime.split(':').map(Number);
      
      let start = startHour * 60 + startMin;
      let end = endHour * 60 + endMin;
      
      // Manejar casos donde la clase termina al día siguiente
      if (end < start) {
        end += 24 * 60;
      }
      
      // Duración en minutos para esta clase
      const duration = end - start;
      
      // Multiplicar por la cantidad de días a la semana
      const daysCount = info.days ? info.days.length : 1;
      totalMinutes += duration * daysCount;
    }
  });
  
  // Convertir minutos totales a horas
  return totalMinutes / 60;
};

// Formatear horas para mostrar
const formatHours = (hours) => {
  if (isNaN(hours) || hours === 0) return '0h';
  
  const integerHours = Math.floor(hours);
  const minutes = Math.round((hours - integerHours) * 60);
  
  if (minutes === 0) {
    return `${integerHours}h`;
  } else {
    return `${integerHours}h ${minutes}m`;
  }
};

// Obtener la fecha actual formateada
const getCurrentFormattedDate = () => {
  const now = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return now.toLocaleDateString('es-ES', options);
};

// Verificar si un día está disponible para el maestro
const isAvailableDay = (dayIndex) => {
  if (!teacher.value || !teacher.value.availability) return false;
  
  // Convertir el índice de día (0-6, DOM-SAB) al formato de disponibilidad
  const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const dayName = days[dayIndex];
  
  // Verificar si este día aparece en la disponibilidad
  return teacher.value.availability.some(slot => 
    slot.toLowerCase().includes(dayName)
  );
};

// Obtener la disponibilidad formateada
const getFormattedAvailability = () => {
  if (!teacher.value || !teacher.value.availability) return [];
  
  return teacher.value.availability.map(slot => {
    const info = formatSchedule(slot);
    if (info && info.days && info.days.length > 0) {
      const days = info.days.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ');
      if (info.startTime) {
        return `${days}: ${info.startTime}${info.endTime ? ` - ${info.endTime}` : ''}`;
      }
      return days;
    }
    return slot;
  });
};

// Descargar el horario como PDF
const downloadPDF = () => {
  const element = document.getElementById('schedule-pdf');
  const opt = {
    margin: 10,
    filename: `horario_${teacher.value?.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  
  html2pdf().set(opt).from(element).save();
};

// Compartir el horario
const shareSchedule = async () => {
  if (!navigator.share) {
    alert('Lo sentimos, la funcionalidad de compartir no está disponible en este navegador.');
    return;
  }
  
  try {
    await navigator.share({
      title: `Horario de ${teacher.value?.name}`,
      text: `Horario de clases para ${teacher.value?.name} en El Sistema Punta Cana`,
      url: window.location.href
    });
  } catch (error) {
    console.error('Error al compartir:', error);
  }
};

// Cargar datos del profesor y sus clases
const loadData = async (teacherId) => {
  isLoading.value = true;
  error.value = null;
  
  try {
    // Obtener información del profesor
    const teacherData = await teachersStore.getTeacherById(teacherId);
    if (!teacherData) {
      error.value = 'No se encontró información del profesor.';
      isLoading.value = false;
      return;
    }
    
    teacher.value = teacherData;
    
    // Cargar clases del profesor
    await classesStore.fetchClasses();
    teacherClasses.value = classesStore.classes.filter(c => c.teacherId === teacherId);
    
  } catch (err) {
    console.error('Error al cargar datos:', err);
    error.value = 'Error al cargar información. Por favor, intente de nuevo.';
  } finally {
    isLoading.value = false;
  }
};

// Cargar datos al montar el componente
onMounted(async () => {
  const teacherId = route.params.id;
  if (teacherId) {
    await loadData(teacherId);
  }
});
</script>

<style scoped>
@media print {
  body {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  #schedule-pdf {
    margin: 0;
    padding: 15mm;
    box-shadow: none;
  }
}
.btn {
  @apply px-4 py-2 rounded font-medium;
  transition: all 0.3s ease;
}
.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700;
}
.btn-secondary {
  @apply bg-gray-600 text-white hover:bg-gray-700;
}
.btn-outline {
  @apply border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800;
}
#schedule-pdf [class*="bg-"] {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
#schedule-pdf [class*="bg-"]:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

/* Estilos para la sección del perfil */
.profile-section {
  transition: all 0.3s ease;
}
.profile-section:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

/* Mejoras para la disponibilidad */
.availability-day {
  transition: all 0.2s ease;
}
.availability-day:hover {
  transform: scale(1.05);
}
</style>
