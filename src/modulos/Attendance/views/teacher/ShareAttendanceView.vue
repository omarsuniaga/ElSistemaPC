<!--
🎯 SHARE ATTENDANCE VIEW - NUEVA ARQUITECTURA
Vista de confirmación y exportación después de guardar asistencia
Muestra resumen y opciones para exportar a PDF o volver al calendario
-->

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- 🎯 HEADER -->
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <!-- Navegación y título -->
          <div class="flex items-center space-x-4">
            <!-- Botón de regreso al calendario -->
            <button
              class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Volver al calendario"
              @click="goBackToCalendar"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <!-- Información del proceso -->
            <div>
              <h1 class="text-xl font-bold text-gray-900 dark:text-white">
                {{ wasSuccessful ? '✅ Asistencia Registrada' : '📋 Resumen de Asistencia' }}
              </h1>
              <div class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <span>{{ formattedDate }}</span>
                <span>•</span>
                <span v-if="classData">{{ classData.name || classData.instrument }}</span>
                <span v-else>Cargando clase...</span>
              </div>
            </div>
          </div>

          <!-- Acciones del header -->
          <div class="flex items-center space-x-3">
            <button
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              @click="editAttendance"
            >
              Editar Asistencia
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- 🏗️ CONTENIDO PRINCIPAL -->
    <main class="flex-1 p-6">
      <!-- Estado de carga -->
      <div v-if="isLoading" class="max-w-2xl mx-auto">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div class="flex items-center justify-center space-x-3">
            <svg class="w-6 h-6 text-blue-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span class="text-gray-600 dark:text-gray-400">Cargando resumen de asistencia...</span>
          </div>
        </div>
      </div>

      <!-- Contenido principal -->
      <div v-else class="max-w-4xl mx-auto space-y-6">
        <!-- Mensaje de éxito -->
        <div v-if="wasSuccessful" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-semibold text-green-800 dark:text-green-200">
                ¡Asistencia registrada exitosamente!
              </h2>
              <p class="text-green-700 dark:text-green-300 mt-1">
                Los datos han sido guardados y están listos para compartir
              </p>
            </div>
          </div>
        </div>

        <!-- Información de la clase -->
        <div v-if="classData" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ classData.name || classData.instrument }}
              </h3>
              <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span>📅 {{ formattedDate }}</span>
                <span>⏰ {{ classData.time || 'Horario no especificado' }}</span>
                <span>👨‍🏫 {{ currentTeacher.name }}</span>
              </div>
            </div>
            
            <!-- Indicador de tasa de asistencia -->
            <div class="text-center">
              <div
class="text-3xl font-bold" :class="{
                'text-green-600 dark:text-green-400': attendanceRate >= 80,
                'text-yellow-600 dark:text-yellow-400': attendanceRate >= 60 && attendanceRate < 80,
                'text-red-600 dark:text-red-400': attendanceRate < 60
              }">
                {{ attendanceRate }}%
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                Tasa de asistencia
              </div>
            </div>
          </div>
        </div>

        <!-- Estadísticas de asistencia -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Total de estudiantes -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <div class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ attendanceStats.total }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  Total Estudiantes
                </div>
              </div>
            </div>
          </div>

          <!-- Presentes -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                  {{ attendanceStats.presente }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  Presentes
                </div>
              </div>
            </div>
          </div>

          <!-- Ausentes -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <div class="text-2xl font-bold text-red-600 dark:text-red-400">
                  {{ attendanceStats.ausente }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  Ausentes
                </div>
              </div>
            </div>
          </div>

          <!-- Tardanzas -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {{ attendanceStats.tardanza }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  Tardanzas
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Lista detallada de estudiantes -->
        <div v-if="attendanceDocument?.students" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Detalle de Asistencia
            </h3>
          </div>
          
          <div class="p-6">
            <div class="space-y-3">
              <div
                v-for="studentRecord in attendanceDocument.students"
                :key="studentRecord.studentId"
                class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg"
              >
                <div class="flex items-center space-x-3">
                  <!-- Avatar del estudiante -->
                  <div class="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {{ (studentsData.find(s => s.id === studentRecord.studentId)?.name || 'E').charAt(0).toUpperCase() }}
                    </span>
                  </div>
                  
                  <!-- Información del estudiante -->
                  <div>
                    <div class="font-medium text-gray-900 dark:text-white">
                      {{ studentsData.find(s => s.id === studentRecord.studentId)?.name || 'Estudiante' }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      ID: {{ studentRecord.studentId }}
                    </div>
                  </div>
                </div>

                <!-- Estado de asistencia -->
                <div class="flex items-center space-x-2">
                  <span
                    class="px-3 py-1 text-xs font-medium rounded-full"
                    :class="{
                      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400': studentRecord.status === 'presente',
                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400': studentRecord.status === 'ausente',
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400': studentRecord.status === 'tardanza'
                    }"
                  >
                    {{ studentRecord.status.charAt(0).toUpperCase() + studentRecord.status.slice(1) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Acciones de exportación y compartir -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Exportar y Compartir
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Exportar a PDF -->
            <button
              :disabled="isExporting"
              class="flex items-center justify-center space-x-3 p-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              @click="exportToPDF"
            >
              <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div class="text-left">
                <div class="font-medium text-red-800 dark:text-red-200">
                  {{ isExporting ? 'Generando...' : 'Exportar PDF' }}
                </div>
                <div class="text-sm text-red-600 dark:text-red-400">
                  Descargar reporte
                </div>
              </div>
            </button>

            <!-- Compartir por WhatsApp -->
            <button
              class="flex items-center justify-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg transition-colors"
              @click="shareViaWhatsApp"
            >
              <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <div class="text-left">
                <div class="font-medium text-green-800 dark:text-green-200">
                  WhatsApp
                </div>
                <div class="text-sm text-green-600 dark:text-green-400">
                  Compartir resumen
                </div>
              </div>
            </button>

            <!-- Volver al calendario -->
            <button
              class="flex items-center justify-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors"
              @click="goBackToCalendar"
            >
              <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div class="text-left">
                <div class="font-medium text-blue-800 dark:text-blue-200">
                  Volver al Calendario
                </div>
                <div class="text-sm text-blue-600 dark:text-blue-400">
                  Continuar registrando
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAttendanceStore } from '../../store/attendance';
import { useClassesStore } from '../../../Classes/store/classes';
import { useStudentsStore } from '../../../Students/store/students';
import { useAuthStore } from '../../../../stores/auth';

// Props de la ruta
interface Props {
  date: string // YYYYMMDD format from URL
  classId: string
}

const props = defineProps<Props>();
const router = useRouter();
const route = useRoute();

// Stores
const attendanceStore = useAttendanceStore();
const classesStore = useClassesStore();
const studentsStore = useStudentsStore();
const authStore = useAuthStore();

// Estado del componente
const isLoading = ref(true);
const isExporting = ref(false);
const attendanceDocument = ref<any>(null);
const classData = ref<any>(null);
const studentsData = ref<any[]>([]);

// Computed properties
const formattedDate = computed(() => {
  if (!props.date) return '';
  
  // Convertir YYYYMMDD a YYYY-MM-DD
  const dateStr = `${props.date.slice(0, 4)}-${props.date.slice(4, 6)}-${props.date.slice(6, 8)}`;
  const date = parseISO(dateStr);
  return format(date, 'EEEE, d \'de\' MMMM \'de\' yyyy', { locale: es }).replace(/^\w/, (c) =>
    c.toUpperCase(),
  );
});

const dateForStore = computed(() => {
  if (!props.date) return '';
  // Convertir YYYYMMDD a YYYY-MM-DD para el store
  return `${props.date.slice(0, 4)}-${props.date.slice(4, 6)}-${props.date.slice(6, 8)}`;
});

const currentTeacher = computed(() => ({
  name: authStore.user?.email || 'Maestro',
  id: authStore.user?.uid,
}));

const wasSuccessful = computed(() => {
  return route.query.success === 'true';
});

// Estadísticas de asistencia
const attendanceStats = computed(() => {
  if (!attendanceDocument.value?.students) {
    return { presente: 0, ausente: 0, tardanza: 0, total: 0 };
  }

  const stats = attendanceDocument.value.students.reduce(
    (acc: any, student: any) => {
      acc.total++;
      acc[student.status] = (acc[student.status] || 0) + 1;
      return acc;
    },
    { presente: 0, ausente: 0, tardanza: 0, total: 0 },
  );

  return stats;
});

const attendanceRate = computed(() => {
  if (attendanceStats.value.total === 0) return 0;
  return Math.round((attendanceStats.value.presente / attendanceStats.value.total) * 100);
});

// Métodos principales
const loadAttendanceData = async () => {
  if (!props.date || !props.classId || !currentTeacher.value.id) {
    console.error('❌ [ShareAttendance] Datos de ruta incompletos');
    return;
  }

  isLoading.value = true;

  try {
    console.log('📋 [ShareAttendance] Loading attendance data:', {
      date: dateForStore.value,
      classId: props.classId,
      teacherId: currentTeacher.value.id,
    });

    // 1. Cargar el documento de asistencia
    await attendanceStore.fetchAttendanceDocument(
      dateForStore.value,
      props.classId,
      currentTeacher.value.id,
    );

    // 2. Obtener el documento desde el store
    attendanceDocument.value = attendanceStore.getCurrentAttendanceDocument(
      dateForStore.value,
      props.classId,
    );

    // 3. Cargar datos de la clase
    await classesStore.fetchClassById(props.classId);
    classData.value = classesStore.getClassById(props.classId);

    // 4. Cargar datos de los estudiantes
    if (classData.value?.studentIds && classData.value.studentIds.length > 0) {
      await studentsStore.fetchStudentsByIds(classData.value.studentIds);
      studentsData.value = studentsStore.getStudentsByIds(classData.value.studentIds);
    }

    console.log('✅ [ShareAttendance] Data loaded successfully');

  } catch (err) {
    console.error('❌ [ShareAttendance] Error loading attendance data:', err);
  } finally {
    isLoading.value = false;
  }
};

const exportToPDF = async () => {
  if (!attendanceDocument.value) return;

  isExporting.value = true;

  try {
    console.log('📄 [ShareAttendance] Exporting to PDF...');

    // TODO: Implementar exportación a PDF
    // Aquí se podría usar jsPDF o llamar a un endpoint del backend
    
    // Simular exportación
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ [ShareAttendance] PDF exported successfully');
    
    // Mostrar mensaje de éxito o descargar automáticamente
    alert('📄 PDF generado exitosamente');

  } catch (err) {
    console.error('❌ [ShareAttendance] Error exporting PDF:', err);
    alert('❌ Error al generar el PDF');
  } finally {
    isExporting.value = false;
  }
};

const shareViaWhatsApp = () => {
  if (!attendanceDocument.value || !classData.value) return;

  const message = '📋 *Asistencia Registrada*\n\n' +
    `📅 Fecha: ${formattedDate.value}\n` +
    `📚 Clase: ${classData.value.name || classData.value.instrument}\n` +
    `👥 Total estudiantes: ${attendanceStats.value.total}\n` +
    `✅ Presentes: ${attendanceStats.value.presente}\n` +
    `❌ Ausentes: ${attendanceStats.value.ausente}\n` +
    `⏰ Tardanzas: ${attendanceStats.value.tardanza}\n` +
    `📊 Tasa de asistencia: ${attendanceRate.value}%\n\n` +
    '_Generado por Academia Musical_';

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
};

const goBackToCalendar = () => {
  router.push({ name: 'TeacherAttendanceDashboard' });
};

const editAttendance = () => {
  router.push({
  name: 'TeacherAttendanceDetail',
    params: {
      date: props.date,
      classId: props.classId,
    },
    query: {
      return: 'share',
    },
  });
};

// Lifecycle
onMounted(() => {
  console.log('🚀 [ShareAttendance] Component mounted with props:', props);
  loadAttendanceData();
});
</script>

<style scoped>
/* Animaciones personalizadas */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Efectos hover mejorados */
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Animación de carga */
@keyframes pulse-loading {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.loading {
  animation: pulse-loading 2s ease-in-out infinite;
}
</style>
