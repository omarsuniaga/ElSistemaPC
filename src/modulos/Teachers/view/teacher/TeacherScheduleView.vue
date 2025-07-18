<template>
  <div class="p-4 max-w-5xl mx-auto">
    <!-- Header con título y botones -->
    <div class="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
      <div>
        <h1
          class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2"
        >
          <CalendarIcon class="h-7 w-7 text-primary-600" />
          Horario de Clases
        </h1>
        <p v-if="teacher" class="text-gray-600 dark:text-gray-400 mt-1 text-lg">
          {{ teacher.name }}
        </p>
      </div>
      <div class="flex gap-2">
        <button
          class="btn btn-primary flex items-center gap-2 transition-all hover:scale-105"
          @click="downloadPDF"
        >
          <DocumentArrowDownIcon class="w-5 h-5" />
          PDF
        </button>
        <button
          class="btn btn-outline flex items-center gap-2 transition-all hover:scale-105"
          @click="shareSchedule"
        >
          <ShareIcon class="w-5 h-5" />
          Compartir
        </button>
        <button
          class="btn btn-secondary flex items-center gap-2 transition-all hover:scale-105"
          @click="printSchedule"
        >
          <i class="fas fa-print" />
          Imprimir
        </button>
      </div>
    </div>

    <!-- Estado de carga y errores -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
    <div
      v-else-if="error"
      class="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg text-red-700 dark:text-red-400"
    >
      {{ error }}
      <button class="ml-2 underline" @click="loadData">Reintentar</button>
    </div>

    <!-- Contenido PDF para descarga -->
    <div
      v-else-if="teacher && !isLoading && !error"
      id="schedule-pdf"
      class="bg-white text-black p-6 sm:p-8 rounded-lg shadow-lg mx-auto"
      style="min-height: 297mm; width: 210mm; max-width: 100%"
    >
      <!-- Encabezado del PDF -->
      <div class="flex justify-between items-start border-b-2 border-gray-300 pb-4 mb-6">
        <div class="flex items-center gap-2">
          <img src="@/assets/ElSistemaPCLogo.jpeg" alt="Logo Academia" class="h-12 w-auto" />
          <div>
            <h1 class="text-2xl font-bold text-primary-700">Academia de Música</h1>
            <p class="text-gray-600">Horario de Clases - Maestro</p>
          </div>
        </div>
        <div class="text-right">
          <p class="font-semibold text-gray-700">{{ getCurrentFormattedDate() }}</p>
          <p class="text-sm text-gray-500">Año Académico {{ new Date().getFullYear() }}</p>
        </div>
      </div>

      <!-- Información del Maestro -->
      <div class="mb-8">
        <div
          class="flex items-center gap-2 bg-primary-50 p-3 rounded-t-lg border-b-2 border-primary-200"
        >
          <UserIcon class="h-5 w-5 text-primary-700" />
          <h2 class="text-lg font-bold text-primary-700">Información del Maestro</h2>
        </div>
        <div class="bg-gray-50 p-4 rounded-b-lg shadow-sm">
          <div class="flex items-center gap-4">
            <img
              :src="
                teacher.photoURL ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher.name}`
              "
              :alt="teacher.name"
              class="w-16 h-16 rounded-full"
            />
            <div>
              <h3 class="text-xl font-bold">{{ teacher.name }}</h3>
              <div class="flex flex-wrap gap-1 mt-1">
                <span
                  v-for="specialty in teacher.specialties || []"
                  :key="specialty"
                  class="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full"
                >
                  {{ specialty }}
                </span>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm mt-4">
            <div>
              <span class="text-gray-500">Teléfono:</span>
              <span class="ml-1 font-medium">{{ teacher.phone || "No disponible" }}</span>
            </div>
            <div class="col-span-2">
              <span class="text-gray-500">Email:</span>
              <span class="ml-1 font-medium">{{ teacher.email || "No disponible" }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Horario de Clases -->
      <div class="mb-8">
        <div
          class="flex items-center gap-2 bg-primary-50 p-3 rounded-t-lg border-b-2 border-primary-200"
        >
          <CalendarIcon class="h-5 w-5 text-primary-700" />
          <h2 class="text-lg font-bold text-primary-700">Horario de Clases</h2>
        </div>
        <div class="bg-gray-50 p-4 rounded-b-lg shadow-sm">
          <div v-if="teacherClasses.length > 0" class="space-y-4">
            <!-- Stats summary -->
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <div class="text-sm text-gray-500">Clases Asignadas</div>
                <div class="text-xl font-semibold">{{ teacherClasses.length }}</div>
              </div>
              <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <div class="text-sm text-gray-500">Horas Semanales</div>
                <div class="text-xl font-semibold">{{ formatHours(getWeeklyHours) }}</div>
              </div>
            </div>

            <!-- Schedule display -->
            <div class="print:hidden">
              <TeacherWeeklySchedule v-if="viewMode === 'interactive'" :teacher-id="teacherId" />
            </div>
            <div>
              <WeeklySchedulePrint :teacher-id="teacherId" />
            </div>
          </div>
          <div v-else class="text-center py-4 text-gray-500">No hay clases asignadas</div>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-8 pt-4 border-t text-center text-sm text-gray-500">
        <p>
          Este horario puede estar sujeto a cambios. Para más información, contacte con la
          Administración.
        </p>
        <p class="mt-1">
          © {{ new Date().getFullYear() }} El Sistema Punta Cana - Todos los derechos reservados
        </p>
      </div>
    </div>

    <!-- En caso de no encontrar el maestro -->
    <div v-else class="text-center py-12 text-gray-500">No se encontró información del maestro</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useTeachersStore } from '../../store/teachers';
import { useClassesStore } from '../../../Classes/store/classes';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import TeacherWeeklySchedule from '../../components/TeacherWeeklySchedule.vue';
import WeeklySchedulePrint from '../../components/WeeklySchedulePrint.vue';
import html2pdf from 'html2pdf.js';
import { getAuth } from 'firebase/auth';
import { CalendarIcon, DocumentArrowDownIcon, ShareIcon, UserIcon } from '@heroicons/vue/24/outline';

// Tipos para mejorar el tipado de maestro
interface Teacher {
  id: string
  name: string
  photoURL?: string
  specialties?: string[]
  experiencia?: string
  phone?: string
  email?: string
}

const route = useRoute();
const auth = getAuth();
const teachersStore = useTeachersStore();
const classesStore = useClassesStore();

const isLoading = ref(true);
const error = ref<string | null>(null);

// Obtenemos el teacherId: si hay usuario autenticado lo usamos, si no, usamos el ID de la ruta
const teacherId = computed(() => {
  return auth.currentUser?.uid || (route.params.id as string);
});

// Propiedad para almacenar la información del maestro
const teacher = ref<Teacher | null>(null);

// Computed para obtener las clases del maestro a partir del store de clases
const teacherClasses = computed(() => {
  if (!teacherId.value) return [];
  return classesStore.classes.filter((classItem) => classItem.teacherId === teacherId.value);
});

const viewMode = ref<'interactive' | 'print'>('interactive');

// Computed para calcular las horas semanales
const getWeeklyHours = computed(() => {
  let total = 0;
  const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  weekDays.forEach((day) => {
    const dayClasses = classesStore.getClassByDaysAndTeacher(teacherId.value, day);
    dayClasses.forEach((classItem) => {
      const scheduleForDay = classItem.schedule?.slots.find((slot) => slot.day === day);
      if (scheduleForDay) {
        const [startHour, startMinute] = scheduleForDay.startTime.split(':').map(Number);
        const [endHour, endMinute] = scheduleForDay.endTime.split(':').map(Number);
        const duration = endHour - startHour + (endMinute - startMinute) / 60;
        total += duration;
      }
    });
  });

  return total;
});

// PDF y compartir (sin cambios significativos)
const downloadPDF = (): void => {
  const element = document.getElementById('schedule-pdf');
  if (!element || !teacher.value) return;

  const options = {
    margin: 10,
    filename: `horario_${teacher.value.name}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  };

  html2pdf().from(element).set(options).save();
};

const shareSchedule = async (): Promise<void> => {
  if (!teacher.value) return;

  try {
    const element = document.getElementById('schedule-pdf');
    if (!element) return;

    const options = {
      margin: 10,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };
    const pdfBlob = await html2pdf().from(element).set(options).outputPdf('blob');
    const file = new File([pdfBlob], `horario_${teacher.value.name}.pdf`, { type: 'application/pdf' });

    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `Horario de ${teacher.value.name}`,
        text: 'Aquí está el horario de clases',
      });
    } else {
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    }
  } catch (error) {
    console.error('Error al compartir:', error);
  }
};

const getCurrentFormattedDate = (): string => {
  return format(new Date(), 'EEEE, d \'de\' MMMM \'de\' yyyy', { locale: es });
};

const formatHours = (hours: number): string => {
  return `${Math.floor(hours)} h ${Math.round((hours % 1) * 60)} min`;
};

// Cargar datos del maestro, clases y schedules
const loadData = async () => {
  try {
    isLoading.value = true;
    error.value = null;

    await Promise.all([teachersStore.fetchTeachers(), classesStore.fetchClasses()]);

    const fetchedTeacher = teachersStore.getTeacherById(teacherId.value);
    if (fetchedTeacher) {
      teacher.value = {
        id: fetchedTeacher.id,
        name: fetchedTeacher.name,
        photoURL: fetchedTeacher.photoURL,
        specialties: fetchedTeacher.specialties,
        experiencia: fetchedTeacher.experiencia,
        phone: fetchedTeacher.phone,
        email: fetchedTeacher.email,
      };
    } else {
      teacher.value = null;
      throw new Error('Maestro no encontrado');
    }
  } catch (err: any) {
    console.error('Error cargando datos:', err);
    error.value = err.message || 'Error cargando datos';
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  await loadData();
});

// Watch para recargar datos si cambia el teacherId
watch(teacherId, async () => {
  await loadData();
});

const printSchedule = () => {
  viewMode.value = 'print';
  nextTick(() => {
    window.print();
    viewMode.value = 'interactive';
  });
};
</script>

<style scoped>
@media print {
  body {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    forced-color-adjust: none !important;
  }
  #schedule-pdf {
    margin: 0;
    padding: 15mm;
    box-shadow: none;
  }
  .no-print {
    display: none !important;
  }
}

.btn {
  transition: all 0.3s ease;
}

#schedule-pdf [class*="bg-"] {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

#schedule-pdf [class*="bg-"]:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>
