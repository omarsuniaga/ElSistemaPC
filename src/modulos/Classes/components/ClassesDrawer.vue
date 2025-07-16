<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-30 z-40 flex justify-end"
    @click="emit('close')"
  >
    <div
      class="w-full max-w-md bg-white dark:bg-gray-800 h-full overflow-y-auto shadow-xl p-4 transform transition-transform duration-300 ease-in-out"
      @click.stop
    >
      <!-- Header -->
      <div
        class="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4 mb-4"
      >
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Detalles de la Clase</h2>
        <button
          class="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          @click="emit('close')"
        >
          <XMarkIcon class="h-6 w-6 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <!-- Content -->
      <div v-if="classItem" class="space-y-6">
        <!-- Basic Info -->
        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {{ classItem.name }}
          </h3>

          <div class="flex items-center text-gray-600 dark:text-gray-300 mb-1">
            <AcademicCapIcon class="h-5 w-5 mr-2" />
            <span>{{ classItem.instrument }} - {{ classItem.level }}</span>
          </div>

          <div class="flex items-center text-gray-600 dark:text-gray-300 mb-1">
            <UserGroupIcon class="h-5 w-5 mr-2" />
            <span>{{ getTeacherName(classItem.teacherId) }}</span>
          </div>

          <p v-if="classItem.description" class="mt-2 text-gray-600 dark:text-gray-400">
            {{ classItem.description }}
          </p>
        </div>

        <!-- Schedule -->
        <div>
          <h3 class="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
            <CalendarIcon class="h-5 w-5 mr-1" />
            Horario
          </h3>

          <div
            v-if="formattedSchedule.length > 0"
            class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden"
          >
            <div
              v-for="(slot, index) in formattedSchedule"
              :key="index"
              class="flex items-center p-3 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
            >
              <div class="flex-1">
                <div class="font-medium">{{ translateDay(slot.day) }}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">{{ slot.time }}</div>
              </div>
              <div class="flex items-center">
                <ClockIcon class="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
          </div>
          <div v-else class="text-gray-500 dark:text-gray-400 text-sm italic">
            No hay horarios configurados
          </div>
        </div>

        <!-- Students -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <h3 class="font-medium text-gray-900 dark:text-white flex items-center">
              <UserGroupIcon class="h-5 w-5 mr-1" />
              Estudiantes ({{ studentCount }})
            </h3>
            <button
              class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              @click="emit('manage-students', classItem.id)"
            >
              Administrar
            </button>
          </div>

          <div v-if="getStudents.length" class="space-y-2">
            <div
              v-for="student in getStudents"
              :key="student.id"
              class="flex items-center p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
            >
              <div
                class="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300 mr-3"
              >
                {{ `${student.nombre?.charAt(0) || ""}${student.apellido?.charAt(0) || ""}` }}
              </div>
              <div>
                <div class="font-medium text-gray-800 dark:text-gray-200">
                  {{ student.nombre }} {{ student.apellido }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ student.instrumento || "Sin instrumento" }}
                </div>
              </div>
            </div>
            <div
              class="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-primary-800/20 backdrop-blur-sm"
            />
            <div class="relative px-6 py-4">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <h2 class="text-2xl font-bold text-gray-900 dark:text-white group">
                    {{ classItem?.name || "Detalles de Clase" }}
                    <span class="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        class="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                        title="Editar nombre"
                        @click="$emit('edit', classItem!.id)"
                      >
                        <PencilIcon class="h-5 w-5" />
                      </button>
                    </span>
                  </h2>
                  <div
                    class="mt-1 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300"
                  >
                    <span class="flex items-center gap-1">
                      <MusicalNoteIcon class="h-4 w-4" />
                      {{ classItem?.instrument }}
                    </span>
                    <span class="text-gray-300 dark:text-gray-600">•</span>
                    <span class="flex items-center gap-1">
                      <AcademicCapIcon class="h-4 w-4" />
                      {{ classItem?.level }}
                    </span>
                  </div>
                </div>
                <button
                  class="rounded-full p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/10 transition-colors"
                  @click="closeDrawer"
                >
                  <XMarkIcon class="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto px-6 py-6">
            <!-- Loading State -->
            <div v-if="isLoading" class="flex justify-center items-center h-full">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>

            <!-- Class Details -->
            <div v-else-if="classItem" class="space-y-8">
              <!-- Teacher Section -->
              <section
                class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <h3
                  class="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4"
                >
                  <UserIcon class="h-5 w-5 text-primary-500" />
                  Profesor Asignado
                </h3>
                <div class="flex items-center gap-4">
                  <img
                    :src="teacherAvatar"
                    :alt="teacherName"
                    class="h-12 w-12 rounded-full object-cover border-2 border-primary-100 dark:border-primary-900"
                  />
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">{{ teacherName }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Profesor principal</p>
                  </div>
                </div>
              </section>

              <!-- Schedule Section -->
              <section
                class="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div
                  class="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600"
                >
                  <div class="flex items-center justify-between">
                    <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <CalendarIcon class="h-5 w-5 text-primary-500" />
                      Horario de Clases
                    </h3>
                    <button
                      class="text-primary-600 hover:text-primary-700 dark:text-primary-400 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      @click="editSchedule"
                    >
                      <PencilIcon class="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div class="p-4">
                  <div v-if="classItem.schedule?.days?.length" class="grid gap-3">
                    <div
                      v-for="(day, index) in classItem.schedule.days"
                      :key="index"
                      class="flex items-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg"
                    >
                      <div class="flex-1">
                        <h4 class="font-medium text-gray-900 dark:text-gray-100">
                          {{ formatDay(day) }}
                        </h4>
                        <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <ClockIcon class="h-4 w-4" />
                          {{ classItem.schedule.startTime }} - {{ classItem.schedule.endTime }}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-center py-3 text-gray-500 dark:text-gray-400">
                    No hay horarios definidos
                  </div>
                </div>
              </section>

              <!-- Students Section -->
              <section
                class="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div
                  class="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600"
                >
                  <div class="flex items-center justify-between">
                    <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <UserGroupIcon class="h-5 w-5 text-primary-500" />
                      Estudiantes Inscritos
                    </h3>
                    <span class="text-sm text-gray-500 dark:text-gray-400">
                      Total: {{ students.length }}
                    </span>
                  </div>
                </div>

                <div class="divide-y divide-gray-200 dark:divide-gray-700">
                  <div
                    v-if="students.length === 0"
                    class="p-6 text-center text-gray-500 dark:text-gray-400"
                  >
                    <UserGroupIcon class="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    No hay estudiantes inscritos en esta clase
                  </div>
                  <div v-else>
                    <div
                      v-for="student in students"
                      :key="student.id"
                      class="group cursor-pointer"
                      @click="goToStudentProfile(student.id)"
                    >
                      <div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div class="flex items-center gap-4">
                          <div class="relative">
                            <StudentAvatar
                              :first-name="student.nombre || ''"
                              :last-name="student.apellido || ''"
                              size="md"
                            />
                            <div
                              v-if="isStudentActive(student)"
                              class="absolute -bottom-1 -right-1 h-4 w-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-800"
                            />
                          </div>
                          <div class="flex-1 min-w-0">
                            <p
                              class="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
                            >
                              {{ student.nombre }} {{ student.apellido }}
                            </p>
                            <p
                              class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1"
                            >
                              <MusicalNoteIcon class="h-4 w-4" />
                              {{ student.instrumento || "Sin instrumento asignado" }}
                            </p>
                          </div>
                          <ChevronRightIcon
                            class="h-5 w-5 text-gray-400 group-hover:text-primary-500 dark:group-hover:text-primary-400 opacity-0 group-hover:opacity-100 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <!-- Error State -->
            <div v-else class="flex flex-col items-center justify-center h-full">
              <ExclamationCircleIcon class="h-12 w-12 text-gray-400" />
              <p class="mt-2 text-gray-500 dark:text-gray-400">
                No se pudo cargar la información de la clase
              </p>
            </div>
          </div>

          <!-- Footer with Actions -->
          <div
            class="absolute bottom-10 left-0 right-0 px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg"
          >
            <div class="flex items-center justify-between gap-4">
              <button
                class="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors gap-2"
                @click="$emit('manage-students', classItem!.id)"
              >
                <UserGroupIcon class="h-5 w-5" />
                Gestionar Estudiantes
              </button>
              <div class="flex gap-2">
                <button
                  class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors text-gray-700 dark:text-gray-200"
                  @click="$emit('edit', classItem!.id)"
                >
                  <PencilIcon class="h-5 w-5" />
                </button>
                <button
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors text-white"
                  @click="confirmDelete"
                >
                  <TrashIcon class="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation Modal -->
  <Modal :show="showDeleteConfirm" title="Eliminar Clase" @close="showDeleteConfirm = false">
    <div class="p-6">
      <div
        class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4"
      >
        <ExclamationTriangleIcon class="h-6 w-6 text-red-600" />
      </div>
      <h3 class="text-lg font-medium text-center text-gray-900 dark:text-gray-100 mb-2">
        ¿Estás seguro de eliminar esta clase?
      </h3>
      <p class="text-sm text-center text-gray-500 dark:text-gray-400">
        Esta acción no se puede deshacer y eliminará todos los registros asociados a esta clase.
      </p>
    </div>
    <div class="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex justify-end gap-3">
      <button
        class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        @click="showDeleteConfirm = false"
      >
        Cancelar
      </button>
      <button
        class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        @click="handleDelete"
      >
        Eliminar
      </button>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTeachersStore } from '../../../modulos/Teachers/store/teachers';
import { useStudentsStore } from '../../../modulos/Students/store/students';
import {
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  AcademicCapIcon,
  ExclamationCircleIcon,
  UserIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline';
import Modal from '../../../shared/Modal.vue';
import StudentAvatar from '../../Students/components/StudentAvatar.vue';

const props = defineProps({
  show: Boolean,
  classItem: Object,
});

const showDeleteConfirm = ref(false);

const emit = defineEmits(['close', 'edit', 'delete', 'manage-students']);

const teachersStore = useTeachersStore();
const studentsStore = useStudentsStore();

const getTeacherName = (teacherId) => {
  if (!teacherId) return 'Sin profesor asignado';
  const teacher = teachersStore.teachers.find((t) => t.id === teacherId);
  return teacher?.name ?? 'Profesor no encontrado';
};

const teacherAvatar = computed(() => {
  if (!props.classItem?.teacherId) return '';
  const teacher = teachersStore.teachers.find((t) => t.id === props.classItem.teacherId);
  return teacher?.avatar || '';
});

const teacherName = computed(() => getTeacherName(props.classItem?.teacherId));

const students = computed(() => {
  if (!props.classItem?.studentIds) return [];
  return studentsStore.students.filter((s) => props.classItem.studentIds.includes(s.id));
});

const studentCount = computed(() => {
  return props.classItem?.studentIds?.length || 0;
});

const formattedSchedule = computed(() => {
  if (!props.classItem?.schedule?.slots?.length) {
    return [];
  }

  return props.classItem.schedule.slots.map((slot) => ({
    day: slot.day || '',
    time: `${slot.startTime || ''} - ${slot.endTime || ''}`,
  }));
});

const daysOfWeek = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

const translateDay = (day) => {
  return daysOfWeek[day.toLowerCase()] || day;
};

const getStudents = computed(() => {
  if (!props.classItem?.studentIds) return [];
  return studentsStore.students.filter((s) => props.classItem.studentIds.includes(s.id)).slice(0, 5); // Only show first 5 students
});
</script>
