<template>
  <div>
    <!-- Sección de clases del profesor -->
    <div class="mb-8">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold flex items-center">
          <BookOpenIcon class="h-5 w-5 mr-2" />
          Mis Clases
        </h2>
        <button class="btn-primary flex items-center text-sm" @click="handleAddClass">
          <PlusIcon class="h-4 w-4 mr-1" />
          Nueva Clase
        </button>
      </div>

      <!-- Grid de tarjetas de clases -->
      <div
        v-if="sortedClasses.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <div
          v-for="classItem in sortedClasses"
          :key="classItem.id"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
        >
          <!-- Cabecera de la tarjeta -->
          <div
            class="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
          >
            <div class="flex justify-between items-start">
              <h3 class="font-semibold text-lg truncate" :title="classItem.name">
                {{ classItem.name }}
              </h3>
              <div class="flex space-x-1">
                <button
                  class="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                  title="Ver detalles"
                  @click="handleViewClassDetail(classItem.id)"
                >
                  <EyeIcon class="h-5 w-5" />
                </button>
                <button
                  class="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                  title="Editar clase"
                  @click="handleEditClass(classItem)"
                >
                  <PencilIcon class="h-5 w-5" />
                </button>
                <button
                  class="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                  title="Eliminar clase"
                  @click="handleDeleteClass(classItem)"
                >
                  <TrashIcon class="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <!-- Cuerpo de la tarjeta -->
          <div class="p-4">
            <!-- Nivel e instrumento -->
            <div class="flex items-center mb-3 text-sm">
              <AcademicCapIcon class="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
              <span class="mr-2">{{ classItem.level }}</span>

              <MusicalNoteIcon
                v-if="classItem.instrument"
                class="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400"
              />
              <span v-if="classItem.instrument">{{ classItem.instrument }}</span>
            </div>

            <!-- Horario -->
            <div class="flex items-start mb-3 text-sm">
              <CalendarIcon class="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400 mt-0.5" />
              <div>
                <div v-for="(slot, index) in classItem.schedule?.slots" :key="index">
                  {{ slot.day }}: {{ slot.startTime }} - {{ slot.endTime }}
                </div>
              </div>
            </div>

            <!-- Aula -->
            <div v-if="classItem.classroom" class="flex items-center mb-3 text-sm">
              <MapPinIcon class="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
              <span>{{ classItem.classroom }}</span>
            </div>

            <!-- Estudiantes -->
            <div class="flex items-start mb-3 text-sm">
              <UserGroupIcon class="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400 mt-0.5" />
              <div>
                <div v-if="classItem.studentIds && classItem.studentIds.length > 0">
                  <div class="flex justify-between">
                    <span>{{ classItem.studentIds.length }} estudiantes</span>
                    <button
                      class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs"
                      @click="handleManageStudents(classItem)"
                    >
                      Gestionar
                    </button>
                  </div>
                  <ul class="mt-1 space-y-1">
                    <li
                      v-for="student in getClassStudents(classItem).slice(0, 3)"
                      :key="student.id"
                      class="truncate"
                    >
                      {{ student.name }}
                    </li>
                    <li
                      v-if="classItem.studentIds.length > 3"
                      class="text-gray-500 dark:text-gray-400 italic"
                    >
                      Y {{ classItem.studentIds.length - 3 }} más...
                    </li>
                  </ul>
                </div>
                <div v-else class="flex justify-between">
                  <span>No hay estudiantes</span>
                  <button
                    class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs"
                    @click="handleManageStudents(classItem)"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mensaje cuando no hay clases -->
      <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
        <p class="text-gray-500 dark:text-gray-400 mb-4">No tienes clases asignadas actualmente.</p>
        <button class="btn-primary flex items-center mx-auto" @click="handleAddClass">
          <PlusIcon class="h-4 w-4 mr-1" />
          Crear mi primera clase
        </button>
      </div>
    </div>

    <!-- Modal para crear/editar clase -->
    <Dialog :open="showClassForm" class="relative z-50" @close="showClassForm = false">
      <div class="fixed inset-0 flex items-center justify-center p-4">
        <DialogOverlay class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <DialogPanel
              class="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all"
            >
              <h3 class="text-lg font-medium leading-6 mb-4">
                {{ isEditingClass ? "Editar Clase" : "Nueva Clase" }}
              </h3>

              <ClassForm
                :class-data="selectedClass"
                @save="saveClass"
                @cancel="showClassForm = false"
              />
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>

    <!-- Modal para gestionar estudiantes -->
    <Dialog :open="showStudentManager" class="relative z-50" @close="showStudentManager = false">
      <div class="fixed inset-0 flex items-center justify-center p-4">
        <DialogOverlay class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <DialogPanel
              class="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all"
            >
              <h3 class="text-lg font-medium leading-6 mb-4">
                Gestionar Estudiantes - {{ selectedClass?.name }}
              </h3>

              <ClassStudentManager
                :class-id="selectedClass?.id"
                :selected-student-ids="selectedClass?.studentIds || []"
                @save="saveStudents"
                @cancel="showStudentManager = false"
              />
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>

    <!-- Modal de confirmación para eliminar clase -->
    <Dialog :open="showDeleteConfirm" class="relative z-50" @close="showDeleteConfirm = false">
      <div class="fixed inset-0 flex items-center justify-center p-4">
        <DialogOverlay class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <DialogPanel
              class="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all"
            >
              <h3 class="text-lg font-medium leading-6 mb-4 text-red-600 dark:text-red-400">
                Eliminar Clase
              </h3>

              <p class="mb-4">
                ¿Estás seguro de que deseas eliminar la clase
                <strong>{{ classToDelete?.name }}</strong
                >? Esta acción no se puede deshacer.
              </p>

              <div class="flex justify-end space-x-3">
                <button class="btn-secondary" @click="showDeleteConfirm = false">Cancelar</button>
                <button class="btn-danger" @click="confirmDeleteClass">Eliminar</button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useClassesStore } from '../../../modulos/Classes/store/classes';
import { useStudentsStore } from '../../../modulos/Students/store/students';
import { useAuthStore } from '../../../stores/auth';
import {
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  MapPinIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MusicalNoteIcon,
  ChartBarSquareIcon,
  BookOpenIcon,
  AcademicCapIcon,
} from '@heroicons/vue/24/outline';

import { useToast } from '../../../components/ui/toast/use-toast';
import { Dialog, DialogPanel, DialogOverlay, TransitionRoot, TransitionChild } from '@headlessui/vue';
import ClassForm from '@/modulos/Classes/components/ClassForm.vue';
import ClassStudentManager from '@/modulos/Classes/components/ClassStudentManager.vue';

// Stores
const classesStore = useClassesStore();
const studentsStore = useStudentsStore();
const authStore = useAuthStore();
const router = useRouter();
const { toast } = useToast();

// Estados
const selectedClass = ref(null);
const showClassForm = ref(false);
const isEditingClass = ref(false);
const showStudentManager = ref(false);
const showDeleteConfirm = ref(false);
const classToDelete = ref(null);

// Obtener el ID del profesor actual
const currentTeacherId = computed(() => authStore.user?.uid);

// Obtener el día actual (0-6, donde 0 es domingo)
const currentDayIndex = computed(() => new Date().getDay());

// Colores para los días de la semana
const dayColors = {
  0: 'bg-red-500', // Domingo
  1: 'bg-blue-500', // Lunes
  2: 'bg-green-500', // Martes
  3: 'bg-purple-500', // Miércoles
  4: 'bg-yellow-500', // Jueves
  5: 'bg-pink-500', // Viernes
  6: 'bg-orange-500', // Sábado
};

// Nombres de los días
const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Filtrar las clases del profesor actual
const teacherClasses = computed(() => {
  return classesStore.classes.filter((classItem) => classItem.teacherId === currentTeacherId.value);
});

// Función para obtener el índice del día (0-6)
function getDayIndex(day) {
  if (typeof day === 'number' && day >= 0 && day <= 6) {
    return day;
  }

  if (typeof day === 'string') {
    return dayNames.findIndex((d) => d.toLowerCase() === day.toLowerCase());
  }

  return 0; // Por defecto domingo
}

// Función para obtener el color del día
function getDayColor(day) {
  const index = getDayIndex(day);
  return dayColors[index] || 'bg-gray-500';
}

// Ordenar las clases comenzando por el día actual
const sortedClasses = computed(() => {
  if (!teacherClasses.value.length) return [];

  return [...teacherClasses.value].sort((a, b) => {
    // Si no hay horario, colocar al final
    if (!a.schedule?.slots?.length) return 1;
    if (!b.schedule?.slots?.length) return -1;

    // Obtener el primer día de cada clase
    const aDayIndex = getDayIndex(a.schedule.slots[0].day);
    const bDayIndex = getDayIndex(b.schedule.slots[0].day);

    // Calcular la distancia desde el día actual
    const aDistance = (aDayIndex - currentDayIndex.value + 7) % 7;
    const bDistance = (bDayIndex - currentDayIndex.value + 7) % 7;

    // Ordenar por distancia (el día actual primero)
    return aDistance - bDistance;
  });
});

// Obtener los estudiantes de una clase
const getClassStudents = (classItem) => {
  if (!classItem.studentIds || !classItem.studentIds.length) return [];
  return classItem.studentIds
    .map((id) => studentsStore.students.find((s) => s.id === id))
    .filter((s) => s); // Filtrar valores nulos
};

// Formatear horario para mostrar
const formatSchedule = (schedule) => {
  if (!schedule || !schedule.slots || !schedule.slots.length) return 'Sin horario';

  return schedule.slots
    .map((slot) => {
      return `${slot.day} ${slot.startTime} - ${slot.endTime}`;
    })
    .join(', ');
};

// Métodos para gestionar clases
const handleAddClass = () => {
  isEditingClass.value = false;
  selectedClass.value = null;
  showClassForm.value = true;
};

const handleEditClass = (classItem) => {
  selectedClass.value = classItem;
  isEditingClass.value = true;
  showClassForm.value = true;
};

const handleViewClassDetail = (classId) => {
  router.push(`/teacher/classes/${classId}`);
};

const handleManageStudents = (classItem) => {
  selectedClass.value = classItem;
  showStudentManager.value = true;
};

const handleDeleteClass = (classItem) => {
  classToDelete.value = classItem;
  showDeleteConfirm.value = true;
};

const confirmDeleteClass = async () => {
  if (!classToDelete.value) return;

  try {
    await classesStore.deleteClass(classToDelete.value.id);
    toast({
      title: 'Clase eliminada',
      description: `La clase ${classToDelete.value.name} ha sido eliminada correctamente.`,
      variant: 'success',
    });
    showDeleteConfirm.value = false;
    classToDelete.value = null;
  } catch (error) {
    toast({
      title: 'Error',
      description: `No se pudo eliminar la clase: ${error.message}`,
      variant: 'destructive',
    });
  }
};

const saveClass = async (classData) => {
  try {
    if (isEditingClass.value) {
      await classesStore.updateClass({
        ...classData,
        id: selectedClass.value.id,
      });
      toast({
        title: 'Clase actualizada',
        description: 'La clase ha sido actualizada correctamente.',
        variant: 'success',
      });
    } else {
      await classesStore.addClass({
        ...classData,
        teacherId: currentTeacherId.value,
      });
      toast({
        title: 'Clase creada',
        description: 'La clase ha sido creada correctamente.',
        variant: 'success',
      });
    }
    showClassForm.value = false;
  } catch (error) {
    toast({
      title: 'Error',
      description: `No se pudo guardar la clase: ${error.message}`,
      variant: 'destructive',
    });
  }
};

const saveStudents = async (studentIds) => {
  if (!selectedClass.value) return;

  try {
    await classesStore.updateClass({
      ...selectedClass.value,
      studentIds,
    });
    toast({
      title: 'Estudiantes actualizados',
      description: 'Los estudiantes de la clase han sido actualizados correctamente.',
      variant: 'success',
    });
    showStudentManager.value = false;
  } catch (error) {
    toast({
      title: 'Error',
      description: `No se pudieron actualizar los estudiantes: ${error.message}`,
      variant: 'destructive',
    });
  }
};

// Cargar datos iniciales
onMounted(async () => {
  try {
    await Promise.all([classesStore.fetchClasses(), studentsStore.fetchStudents()]);
  } catch (error) {
    toast({
      title: 'Error',
      description: `No se pudieron cargar los datos: ${error.message}`,
      variant: 'destructive',
    });
  }
});
</script>

<style scoped>
.class-cards-container {
  padding: 1rem;
}

.no-classes {
  text-align: center;
  padding: 2rem;
  color: #666;
  background: #f9f9f9;
  border-radius: 8px;
}

.class-card {
  display: flex;
  flex-direction: column;
  transition: transform 0.2s;
}

.class-card:hover {
  transform: translateY(-2px);
}
</style>
