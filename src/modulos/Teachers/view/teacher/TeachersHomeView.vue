<template>
  <div class="teacher-dashboard px-4 md:px-6 lg:px-8 max-w-screen-xl mx-auto">
    <!-- Header: Sticky para navegación rápida -->
    <header class="dashboard-header bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 sticky top-0 z-10">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Panel de Control de Maestros
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">
        Aquí puedes gestionar y visualizar información relevante sobre tus clases y estudiantes.
      </p>
      <!-- Tabs de navegación con overflow para pantallas pequeñas -->
      <div class="flex mt-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button
          @click="setActiveTab('classes')"
          class="px-4 py-2 font-medium text-sm focus:outline-none whitespace-nowrap"
          :class="activeTab === 'classes' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
        >
          <div class="flex items-center gap-1">
            <BookOpenIcon class="h-4 w-4" />
            Mis Clases
          </div>
        </button>
        <button
          @click="setActiveTab('upcoming')"
          class="px-4 py-2 font-medium text-sm focus:outline-none whitespace-nowrap"
          :class="activeTab === 'upcoming' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
        >
          <div class="flex items-center gap-1">
            <ClockIcon class="h-4 w-4" />
            Próximas Clases
          </div>
        </button>
        <button
          @click="setActiveTab('overview')"
          class="px-4 py-2 font-medium text-sm focus:outline-none whitespace-nowrap"
          :class="activeTab === 'overview' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
        >
          <div class="flex items-center gap-1">
            <ChartBarSquareIcon class="h-4 w-4" />
            Panel General
          </div>
        </button>
      </div>
    </header>

    <!-- Estado de carga: Skeleton Loader -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="w-full max-w-md space-y-4 animate-pulse">
        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>

    <!-- Contenido principal -->
    <section v-else class="dashboard-content space-y-6">
      <!-- Vista General (Overview) -->
      <div v-if="activeTab === 'overview'" class="space-y-6">
        <!-- Tarjetas de métricas en grid responsivo -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="metric in dashboardMetrics"
            :key="metric.title"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-transform hover:scale-105"
          >
            <div class="flex items-center">
              <div :class="`${metric.color} p-3 rounded-lg`">
                <component :is="metric.icon" class="h-6 w-6" />
              </div>
              <div class="ml-4">
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ metric.title }}</p>
                <p class="text-xl font-bold">{{ metric.value }}</p>
              </div>
            </div>
          </div>
        </div>
        <!-- Notificaciones -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 class="text-lg font-semibold mb-3">Notificaciones</h2>
          <div v-if="notifications.length > 0" class="space-y-3">
            <div
              v-for="notification in notifications"
              :key="notification.id"
              class="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
              :class="{
                'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500': notification.type === 'info' && !notification.read,
                'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-l-amber-500': notification.type === 'reminder' && !notification.read
              }"
            >
              <div class="flex justify-between">
                <h3 class="font-medium">{{ notification.title }}</h3>
                <span class="text-xs text-gray-500">
                  {{ new Intl.DateTimeFormat('es-ES', { dateStyle: 'short' }).format(notification.date) }}
                </span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ notification.message }}</p>
            </div>
          </div>
          <p v-else class="text-center text-gray-500 dark:text-gray-400 py-3">No hay notificaciones.</p>
        </div>
        <!-- Botones de acción rápida -->
        <div class="flex flex-wrap gap-3">
          
        </div>
      </div>

      <!-- Vista del Horario Semanal -->
      <div v-if="activeTab === 'schedule'" class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 class="text-lg font-semibold mb-4 flex justify-between items-center">
          <span>Horario Semanal</span>
          <button
            @click="handleAddClass"
            class="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 focus:outline-none"
            aria-label="Crear nueva clase"
          >
            <PlusIcon class="w-4 h-4" />
            <span>Nueva Clase</span>
          </button>
        </h2>
        <TeacherWeeklySchedule :classes="teacherClasses" @view-class="handleViewClass" />
      </div>

      <!-- Vista de Listado de Clases -->
      <div v-if="activeTab === 'classes'" class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 class="text-lg font-semibold mb-1 flex justify-between items-center">
          <span>Mis Clases</span>
          <button
            @click="handleAddClass"
            class="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 focus:outline-none"
            aria-label="Crear nueva clase"
          >
            <PlusIcon class="w-4 h-4" />
            <span>Nueva Clase</span>
          </button>
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <template v-if="teacherClasses.length > 0">
            <TeacherClassesCard
              v-for="classItem in teacherClasses"
              :key="classItem.id"
              :class-data="classItem"
              @view="handleViewClass"
              @edit="handleEditClass"
              @delete="handleDeleteClass"
              @manage-students="handleManageStudents"
            />
          </template>
          <div v-else class="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">
            No tienes clases asignadas actualmente.
            <button @click="handleAddClass" class="ml-2 text-blue-500 hover:underline">
              Crear una nueva clase
            </button>
          </div>
        </div>
      </div>

      <!-- Vista de Próximas Clases -->
      <div v-if="activeTab === 'upcoming'" class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 class="text-lg font-semibold mb-4">Próximas Clases (24h)</h2>
        <div class="space-y-4">
          <template v-if="upcomingClasses.length > 0">
            <div
              v-for="classItem in upcomingClasses"
              :key="classItem.id"
              class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-4 border-l-4 border-blue-500 transition-all hover:shadow-xl"
            >
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="font-medium text-lg">{{ classItem.name }}</h3>
                  <p class="text-gray-600 dark:text-gray-400">
                    {{ classItem.level }} - {{ classItem.instrument || 'Sin instrumento' }}
                  </p>
                  <div class="mt-2 flex items-center text-sm">
                    <span class="font-medium mr-2">Próxima sesión:</span>
                    <span>{{ formatDateTime(getNextSession(classItem)) }}</span>
                  </div>
                  <p class="mt-1 text-sm text-gray-500">Aula: {{ classItem.classroom || 'Sin asignar' }}</p>
                  <p class="text-sm text-gray-500">Estudiantes: {{ classItem.studentIds?.length || 0 }}</p>
                </div>
                <div class="flex space-x-2">
                  <button
                    @click="handleEditClass(classItem.id)"
                    class="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-md focus:outline-none"
                    title="Editar clase"
                    aria-label="Editar clase"
                  >
                    <PencilIcon class="h-5 w-5" />
                  </button>
                  <button
                    @click="handleManageStudents(classItem.id)"
                    class="p-1 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-md focus:outline-none"
                    title="Gestionar estudiantes"
                    aria-label="Gestionar estudiantes"
                  >
                    <UserGroupIcon class="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </template>
          <div v-else class="py-12 text-center text-gray-500 dark:text-gray-400">
            No tienes clases programadas para las próximas 24 horas.
          </div>
        </div>
      </div>
    </section>

    <!-- Modal: Formulario de Clase -->
    <TransitionRoot appear :show="showForm">
      <Dialog as="div" class="fixed inset-0 z-50 overflow-y-auto" @close="showForm = false">
        <div class="min-h-screen px-4 text-center">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0"
            enter-to="opacity-100"
            leave="ease-in duration-200"
            leave-from="opacity-100"
            leave-to="opacity-0"
          >
            <DialogOverlay class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
          </TransitionChild>
          <span class="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-900 shadow-xl rounded-lg">
              <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                {{ isEditing ? 'Editar Clase' : 'Nueva Clase' }}
              </h2>
              <ClassForm
                :class-data="isEditing ? selectedClass : null"
                @save="handleSaveClass"
                @cancel="showForm = false"
              />
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Modal: Gestión de Estudiantes -->
    <TransitionRoot appear :show="showStudentManager && selectedClass !== null">
      <Dialog as="div" class="fixed inset-0 z-50 overflow-y-auto" @close="showStudentManager = false">
        <div class="min-h-screen px-4 text-center">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0"
            enter-to="opacity-100"
            leave="ease-in duration-200"
            leave-from="opacity-100"
            leave-to="opacity-0"
          >
            <DialogOverlay class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
          </TransitionChild>
          <span class="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-900 shadow-xl rounded-lg">
              <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Gestionar Estudiantes - {{ selectedClass?.name }}
              </h2>
              <ClassStudentManager
                :class-id="selectedClass ? selectedClass.id : ''"
                :student-ids="Array.isArray(selectedClass?.studentIds) ? selectedClass?.studentIds : []"
                @update="handleStudentChange"
                @close="showStudentManager = false"
              />
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useClassesStore } from '../../../../modulos/Classes/store/classes';
import { useTeachersStore } from '../../store/teachers';
import { useStudentsStore } from '../../../../modulos/Students/store/students';
import { useAuthStore } from '../../../../stores/auth';
import { useScheduleStore } from "../../../../modulos/Schedules/store/schedule";
import { 
  CalendarIcon, 
  BookOpenIcon, 
  ClockIcon, 
  UserGroupIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ChartBarSquareIcon 
} from '@heroicons/vue/24/outline';
import { useToast } from '../../../../components/ui/toast/use-toast';
import { Dialog, DialogPanel, DialogOverlay, TransitionRoot, TransitionChild } from '@headlessui/vue';
import TeacherWeeklySchedule from '../../components/TeacherWeeklySchedule.vue';
import TeacherClassesCard from '../../components/TeacherClassesCard.vue';
import ClassForm from '../../../../modulos/Classes/components/ClassForm.vue';
import ClassStudentManager from '../../../../modulos/Classes/components/ClassStudentManager.vue';

// Stores
const classesStore = useClassesStore();
const teachersStore = useTeachersStore();
const studentsStore = useStudentsStore();
const authStore = useAuthStore();
const scheduleStore = useScheduleStore();
const { toast } = useToast();

// Estados reactivos
const loading = ref(true);
const activeTab = ref<'overview' | 'schedule' | 'classes' | 'upcoming' | 'statistics'>('classes');
const selectedClassId = ref('');
const showForm = ref(false);
const showStudentManager = ref(false);
const isEditing = ref(false);

// Computar el ID del maestro actual
const currentTeacherId = computed(() => authStore.user?.uid);

// Computar las clases del maestro actual
const teacherClasses = computed(() =>
  classesStore.classes.filter(classItem => classItem.teacherId === currentTeacherId.value)
);

// Clase seleccionada a partir del ID seleccionado
const selectedClass = computed(() => {
  if (!selectedClassId.value) return null;
  return classesStore.getClassById(selectedClassId.value);
});

// Métricas para el dashboard
const dashboardMetrics = computed(() => {
  const classes = teacherClasses.value;
  const totalStudents = classes.reduce((acc, curr) => acc + (curr.studentIds?.length || 0), 0);
  const totalHours = classes.reduce((acc, curr) => {
    if (!curr.schedule || !curr.schedule.slots) return acc;
    return acc + curr.schedule.slots.reduce((slotAcc, slot) => {
      const [startHours, startMinutes] = slot.startTime.split(':').map(Number);
      const [endHours, endMinutes] = slot.endTime.split(':').map(Number);
      const hours = endHours - startHours;
      const minutes = endMinutes - startMinutes;
      return slotAcc + hours + (minutes / 60);
    }, 0);
  }, 0);
  return [
    {
      title: 'Clases Asignadas',
      value: classes.length,
      icon: BookOpenIcon,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      title: 'Total Estudiantes',
      value: totalStudents,
      icon: UserGroupIcon,
      color: 'bg-purple-100 text-purple-800'
    },
    {
      title: 'Horas Semanales',
      value: Math.round(totalHours * 10) / 10,
      icon: ClockIcon,
      color: 'bg-green-100 text-green-800'
    },
    {
      title: 'Clases Hoy',
      value: upcomingClasses.value.length,
      icon: CalendarIcon,
      color: 'bg-amber-100 text-amber-800'
    }
  ];
});

// Próximas clases (24h)
const upcomingClasses = computed(() => {
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setHours(now.getHours() + 24);
  
  return teacherClasses.value
    .filter(classItem => {
      if (!classItem.schedule || !classItem.schedule.slots) return false;
      return classItem.schedule.slots.some(slot => {
        const slotDate = getNextClassDate(slot.day, slot.startTime);
        return slotDate >= now && slotDate <= tomorrow;
      });
    })
    .sort((a, b) => getNextSession(a).getTime() - getNextSession(b).getTime());
});

// Notificaciones de prueba
const notifications = ref([
  {
    id: 1,
    title: 'Nueva clase asignada',
    message: 'Se te ha asignado la clase de Piano Intermedio',
    date: new Date(),
    read: false,
    type: 'info'
  },
  {
    id: 2,
    title: 'Recordatorio',
    message: 'Recuerda actualizar la lista de asistencia',
    date: new Date(Date.now() - 86400000),
    read: true,
    type: 'reminder'
  }
]);

/* ------------------ Helpers ------------------ */

/**
 * mapDayNameToIndex: Convierte el nombre del día en español a su índice numérico.
 * Domingo = 0, Lunes = 1, ..., Sábado = 6.
 */
function mapDayNameToIndex(day: string): number {
  const mapping: Record<string, number> = {
    'Domingo': 0,
    'Lunes': 1,
    'Martes': 2,
    'Miércoles': 3,
    'Jueves': 4,
    'Viernes': 5,
    'Sábado': 6
  };
  return mapping[day] ?? 1;
}

/**
 * calculateDuration: Calcula la duración en minutos entre dos tiempos en formato "HH:mm".
 */
 function calculateDuration(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  return (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
}
// ---------------------------
// Helpers: Funciones de mapeo y formateo
// ---------------------------
/**
 * mapDayNameToNumber: Convierte un nombre de día (ej. "Lunes") a su índice numérico (0-6).
 */
function mapDayNameToNumber(day: string): number {
  const mapping: Record<string, number> = {
    'Domingo': 0,
    'Lunes': 1,
    'Martes': 2,
    'Miércoles': 3,
    'Miercoles': 3, // en caso de omitir acento
    'Jueves': 4,
    'Viernes': 5,
    'Sábado': 6,
    'Sabado': 6
  };
  return mapping[day] ?? -1;
}
/**
 * getNextClassDate: Calcula la fecha del próximo día en que se imparte la clase.
 * @param day - Puede ser un número o un nombre de día.
 * @param time - Hora de inicio en formato "HH:mm".
 */
function getNextClassDate(day: number | string, time: string): Date {
  const today = new Date();
  let targetDay: number;
  if (typeof day === 'string') {
    targetDay = mapDayNameToNumber(day);
  } else {
    targetDay = day;
  }
  const currentDay = today.getDay();
  let daysUntilClass = (targetDay - currentDay + 7) % 7;
  const classDate = new Date(today);
  classDate.setDate(today.getDate() + daysUntilClass);
  const [hours, minutes] = time.split(':').map(Number);
  classDate.setHours(hours, minutes, 0, 0);
  if (daysUntilClass === 0 && classDate < today) {
    classDate.setDate(classDate.getDate() + 7);
  }
  return classDate;
}

/**
 * getNextSession: Calcula la próxima sesión de una clase basándose en sus slots.
 */
function getNextSession(classItem: any): Date {
  const now = new Date();
  let closestDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  if (classItem.schedule?.slots) {
    classItem.schedule.slots.forEach((slot: any) => {
      const slotDate = getNextClassDate(slot.day, slot.startTime);
      if (slotDate >= now && slotDate < closestDate) {
        closestDate = slotDate;
      }
    });
  }
  return closestDate;
}

/**
 * cleanData: Elimina propiedades vacías o nulas de un objeto.
 */
function cleanData(obj: any): any {
  const cleaned: any = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value === null || value === undefined) return;
    if (typeof value === 'string' && value.trim() === '') return;
    if (Array.isArray(value) && value.length === 0) return;
    if (typeof value === 'object' && !Array.isArray(value)) {
      const cleanedValue = cleanData(value);
      if (Object.keys(cleanedValue).length > 0) {
        cleaned[key] = cleanedValue;
      }
      return;
    }
    cleaned[key] = value;
  });
  return cleaned;
}

/**
 * formatDateTime: Formatea una fecha a una cadena legible en español.
 */
const formatDateTime = (date: Date): string =>
  date.toLocaleString('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });

/* ------------------ Handlers ------------------ */

const handleAddClass = () => {
  isEditing.value = false;
  selectedClassId.value = '';
  showForm.value = true;
};

const handleViewClass = (classId: string) => {
  selectedClassId.value = classId;
  activeTab.value = 'classes';
};

const handleEditClass = (classId: string) => {
  selectedClassId.value = classId;
  isEditing.value = true;
  showForm.value = true;
};

const handleDeleteClass = async (classId: string) => {
  if (confirm('¿Estás seguro de que deseas eliminar esta clase?')) {
    try {
      if (typeof classesStore.removeClass === 'function') {
        await classesStore.removeClass(classId);
      } else if (typeof classesStore.deleteClass === 'function') {
        await classesStore.deleteClass(classId);
      } else if (typeof classesStore.updateClass === 'function') {
        await classesStore.updateClass({ id: classId, status: 'inactive' });
      } else {
        console.error('No method available to delete or update classes');
        throw new Error('No method available to delete or update classes');
      }
      toast({
        title: "Clase Eliminada",
        description: "La clase ha sido eliminada exitosamente."
      });
      if (selectedClassId.value === classId) {
        selectedClassId.value = '';
      }
    } catch (error) {
      console.error('Error al eliminar la clase:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la clase. Intente nuevamente.",
        variant: "destructive"
      });
    }
  }
};

const handleManageStudents = (classId: string) => {
  selectedClassId.value = classId;
  showStudentManager.value = true;
};
const handleSaveClass = async (classData: any) => {
  try {
    // Validación mínima
    if (!classData.name || !classData.level) {
      toast({
        title: "Error",
        description: "El nombre y nivel son obligatorios",
        variant: "destructive"
      });
      return;
    }

    // Añadir automáticamente el ID del maestro actual
    classData.teacherId = currentTeacherId.value;

    // Preparar datos y limpiar propiedades vacías
    const preparedData = cleanData({
      name: classData.name.trim(),
      description: classData.description?.trim(),
      level: classData.level,
      teacherId: classData.teacherId,
      classroom: classData.classroom?.trim(),
      instrument: classData.instrument?.trim(),
      schedule: {
        slots: (classData.schedule?.slots || []).map((slot: any) =>
          cleanData({
            day: slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime
          })
        )
      },
      studentIds: classData.studentIds
    }) as { name: string; [key: string]: any };

    let classId: string = '';

    if (isEditing.value) {
      // Actualizar clase existente
      await classesStore.updateClass({ ...preparedData, id: selectedClassId.value });
      toast({
        title: "Clase Actualizada",
        description: `La clase "${preparedData.name}" ha sido actualizada exitosamente.`
      });
      classId = selectedClassId.value;
    } else {
      // Crear nueva clase
      const newClass = await classesStore.addClass(preparedData);
      toast({
        title: "Clase Creada",
        description: `La clase "${preparedData.name}" ha sido creada exitosamente.`
      });
      classId = newClass.id;
      selectedClassId.value = newClass.id;
    }
    
    // Crear el módulo de schedule para la clase recién creada
    if (classData.schedule?.slots && classData.schedule.slots.length > 0) {
      console.log('📅 Schedule data structure:', classData.schedule.slots);
      for (const slot of classData.schedule.slots) {
        const scheduleRequest: ScheduleCreationRequest = {
          classId: classId,
          teacherId: classData.teacherId,
          roomId: classData.classroom, // o se puede tener un valor por defecto
          studentIds: classData.studentIds || [],
          dayOfWeek: slot.day, // Se asume que slot.day es válido
          timeSlot: {
            startTime: slot.startTime,
            endTime: slot.endTime,
            duration: calculateDuration(slot.startTime, slot.endTime)
          }
        };
        console.log('➕ Creando schedule con datos:', scheduleRequest);
        await scheduleStore.createSchedule(scheduleRequest);
      }
      
      // Actualizar el listado de horarios
      const allSchedules = await scheduleStore.fetchAllSchedules();
      console.log('📋 Horarios después de la creación:', allSchedules);
    }
    
    showForm.value = false;
  } catch (error) {
    console.error('Error al guardar la clase:', error);
    toast({
      title: "Error",
      description: "No se pudo guardar la clase. Intente nuevamente.",
      variant: "destructive"
    });
  }
};


const handleStudentChange = async (studentIds: any) => {
  try {
    console.log('handleStudentChange recibido:', {
      tipo: typeof studentIds,
      esArray: Array.isArray(studentIds),
      valor: studentIds
    });
    const validStudentIds = Array.isArray(studentIds) ? [...studentIds] : [];
    console.log('Actualizando clase:', selectedClassId.value);
    const currentClass = classesStore.getClassById(selectedClassId.value);
    console.log('Clase actual antes de actualizar:', currentClass);
    await classesStore.updateClass({ id: selectedClassId.value, studentIds: validStudentIds });
    toast({
      title: "Estudiantes Actualizados",
      description: "La lista de estudiantes ha sido actualizada exitosamente."
    });
    showStudentManager.value = false;
  } catch (error) {
    console.error('Error al actualizar estudiantes:', error);
    toast({
      title: "Error",
      description: "No se pudieron actualizar los estudiantes. Intente nuevamente.",
      variant: "destructive"
    });
  }
};

const setActiveTab = (tab: 'overview' | 'schedule' | 'classes' | 'upcoming' | 'statistics') => {
  activeTab.value = tab;
};

onMounted(async () => {
  loading.value = true;
  try {
    const promises: Promise<any>[] = [];
    if (typeof classesStore.forceSync === 'function') {
      console.log('📚 Forzando sincronización de clases desde Firebase...');
      promises.push(classesStore.forceSync());
    } else if (typeof classesStore.fetchClasses === 'function') {
      console.log('📚 Cargando clases...');
      promises.push(classesStore.fetchClasses());
    } else {
      console.warn('⚠️ El método fetchClasses no está disponible en classesStore');
    }
    if (typeof teachersStore.fetchTeachers === 'function') {
      console.log('👨‍🏫 Cargando profesores...');
      promises.push(teachersStore.fetchTeachers());
    } else {
      console.warn('⚠️ El método fetchTeachers no está disponible en teachersStore');
    }
    if (typeof studentsStore.fetchStudents === 'function') {
      console.log('👨‍🎓 Cargando estudiantes...');
      promises.push(studentsStore.fetchStudents());
    } else {
      console.warn('⚠️ El método fetchStudents no está disponible en studentsStore');
    }
    await Promise.all(promises);
    if (classesStore.classes.length === 0) {
      console.log('⚠️ No se encontraron clases, intentando nuevamente...');
      if (typeof classesStore.forceSync === 'function') {
        await classesStore.forceSync();
        console.log(`   - Clases (reintento): ${classesStore.classes.length}`);
      }
    }
  } catch (error) {
    console.error('❌ Error cargando datos:', error);
    toast({
      title: "Error",
      description: "No se pudieron cargar los datos. Por favor, intente nuevamente.",
      variant: "destructive"
    });
  } finally {
    loading.value = false;
  }
});

watch(
  [currentTeacherId, () => classesStore.classes.length],
  async ([newTeacherId, classesCount], [oldTeacherId, oldClassesCount]) => {
    if (newTeacherId !== oldTeacherId || (classesCount === 0 && oldClassesCount === 0)) {
      console.log('🔄 Detectado cambio en el profesor o en las clases. Actualizando datos...');
      try {
        if (typeof classesStore.forceSync === 'function') {
          const classes = await classesStore.forceSync();
          console.log(`✅ Clases actualizadas: ${classes.length} total, ${teacherClasses.value.length} del profesor`);
        }
      } catch (error) {
        console.error('❌ Error al actualizar clases:', error);
      }
    }
  }
);
</script>

<style scoped>
.teacher-dashboard {
  max-width: 1200px;
  margin: 0 auto;
}
.dashboard-header {
  margin-bottom: 2rem;
}
.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>
