<template>
  <PermissionGuard :required-resource="ResourceType.MANAGE_CLASSES" required-action="create">
    <form class="space-y-6" @submit.prevent="handleSubmit">
      <!-- Nombre de la clase -->
      <div>
        <label for="name" class="block text-sm font-medium text-gray-100">
          Nombre de la clase <span class="text-red-500">*</span>
        </label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          class="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-100 dark:text-black"
          :class="{'border-red-500': errors.name}"
        />
        <p v-if="errors.name" class="mt-1 text-sm text-red-500">{{ errors.name }}</p>
      </div>

      <!-- Descripción -->
      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Descripción
        </label>
        <textarea
          id="description"
          v-model="form.description"
          rows="3"
          class="dark:text-black mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-100"
        />
      </div>

      <!-- Nivel e Instrumento -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="level" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nivel <span class="text-red-500">*</span>
          </label>
          <select
            id="level"
            v-model="form.level"
            class="dark:text-black mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-100"
            :class="{'border-red-500': errors.level}"
          >
            <option v-for="level in levels" :key="level" :value="level">{{ level }}</option>
          </select>
          <p v-if="errors.level" class="mt-1 text-sm text-red-500">{{ errors.level }}</p>
        </div>

        <div>
          <label
            for="instrument"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Instrumento
          </label>
          <input
            id="instrument"
            v-model="form.instrument"
            type="text"
            class="dark:text-black mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-100"
          />
        </div>
      </div>

      <!-- Aula (removed Profesor) -->
      <div>
        <label for="classroom" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Aula
        </label>
        <input
          id="classroom"
          v-model="form.classroom"
          type="text"
          class="dark:text-black mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-100"
        />
      </div>
      <!-- Sección de Horarios -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Horarios <span class="text-red-500">*</span>
        </label>

        <!-- Indicador de validación -->
        <div
          v-if="isValidating"
          class="flex items-center gap-2 mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md"
        >
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
          <span class="text-sm text-blue-600 dark:text-blue-400">Validando horarios...</span>
        </div>

        <!-- Alertas de conflictos -->
        <div
          v-if="hasErrors && !isValidating"
          class="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
        >
          <div class="flex items-start">
            <svg class="h-5 w-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800 dark:text-red-400">
                Conflictos de Horario Detectados
              </h3>
              <div class="mt-2 text-sm text-red-700 dark:text-red-300">
                <ul class="list-disc pl-5 space-y-1">
                  <li v-for="error in errorMessages" :key="error">{{ error }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <!-- Alertas de advertencias -->
        <div
          v-if="hasWarnings && !isValidating"
          class="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md"
        >
          <div class="flex items-start">
            <svg class="h-5 w-5 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                Advertencias de Horario
              </h3>
              <div class="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <ul class="list-disc pl-5 space-y-1">
                  <li v-for="warning in warningMessages" :key="warning">{{ warning }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Indicador de validación de estudiantes -->
        <div
          v-if="isValidatingStudents"
          class="flex items-center gap-2 mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md"
        >
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
          <span class="text-sm text-blue-600 dark:text-blue-400"
            >Validando conflictos de estudiantes...</span
          >
        </div>

        <!-- Alertas específicas de conflictos de estudiantes -->
        <div
          v-if="hasStudentConflicts && !isValidatingStudents"
          class="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
        >
          <div class="flex items-start">
            <svg class="h-5 w-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800 dark:text-red-400">
                ⚠️ Conflictos de Estudiantes Detectados
              </h3>
              <p class="text-sm text-red-700 dark:text-red-300 mt-1 font-medium">
                {{ formatStudentConflictSummary }}
              </p>
              <div class="mt-2 text-sm text-red-700 dark:text-red-300">
                <ul class="list-disc pl-5 space-y-1">
                  <li v-for="message in studentConflictMessages" :key="message">{{ message }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Resumen de validación de estudiantes (cuando no hay conflictos) -->
        <div
          v-if="
            !hasStudentConflicts && !isValidatingStudents && props.classData?.studentIds?.length > 0
          "
          class="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md"
        >
          <div class="flex items-start">
            <svg class="h-5 w-5 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <div class="ml-3">
              <p class="text-sm text-green-700 dark:text-green-300 font-medium">
                {{ formatStudentConflictSummary }}
              </p>
            </div>
          </div>
        </div>

        <!-- Sugerencias de horarios alternativos -->
        <div
          v-if="showSuggestions && suggestions.length > 0"
          class="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md"
        >
          <h3 class="text-sm font-medium text-green-800 dark:text-green-400 mb-2">
            Horarios Alternativos Sugeridos
          </h3>
          <div class="space-y-2">
            <div
              v-for="(suggestion, index) in suggestions"
              :key="index"
              class="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border"
            >
              <span class="text-sm text-gray-700 dark:text-gray-300">
                {{ suggestion.day }} de {{ suggestion.startTime }} a {{ suggestion.endTime }}
              </span>
              <button
                type="button"
                class="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                @click="applySuggestionToForm(suggestion)"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>

        <div
          v-for="(slots, index) in form.schedule.slots"
          :key="index"
          class="flex items-center gap-2 mt-2"
        >
          <select
            v-model="slots.day"
            class="block w-1/4 p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-100 dark:text-black"
          >
            <option value="" disabled>Seleccione un día</option>
            <option v-for="day in days" :key="day" :value="day">{{ day }}</option>
          </select>
          <input
            v-model="slots.startTime"
            type="time"
            class="block w-1/4 p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-100 dark:text-black"
            placeholder="Inicio"
          />
          <input
            v-model="slots.endTime"
            type="time"
            class="block w-1/4 p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-100 dark:text-black"
            placeholder="Fin"
          />
          <button
            type="button"
            class="text-red-500 hover:text-red-700"
            @click="removeSession(index)"
          >
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
        <button
          type="button"
          class="mt-2 text-blue-600 hover:text-blue-800 text-sm"
          @click="addSession"
        >
          + Agregar horario
        </button>
        <p v-if="errors.schedule" class="mt-1 text-sm text-red-500">{{ errors.schedule }}</p>
      </div>

      <!-- Analizador detallado de conflictos de estudiantes -->
      <div
        v-if="
          props.classData?.studentIds?.length > 0 &&
          (hasStudentConflicts || (!isValidatingStudents && studentConflicts.size > 0))
        "
      >
        <StudentConflictAnalyzer
          :student-conflicts="studentConflicts"
          :conflict-summary="conflictSummary"
          :is-loading="isValidatingStudents"
          class="mt-4"
        />
      </div>

      <!-- Botones de Acción -->
      <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          @click="emit('cancel')"
        >
          Cancelar
        </button>
        <button
          type="submit"
          :disabled="isSubmitting || hasErrors || hasStudentConflicts"
          class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          :class="{
            'bg-red-600 hover:bg-red-700': hasErrors || hasStudentConflicts,
            'bg-yellow-600 hover:bg-yellow-700': hasWarnings && !hasErrors && !hasStudentConflicts,
          }"
        >
          <span v-if="isSubmitting">Guardando...</span>
          <span v-else-if="hasErrors">Resolver Conflictos de Horario</span>
          <span v-else-if="hasStudentConflicts">Resolver Conflictos de Estudiantes</span>
          <span v-else-if="hasWarnings">{{
            props.classData ? "Actualizar con Advertencias" : "Crear con Advertencias"
          }}</span>
          <span v-else>{{ props.classData ? "Actualizar" : "Crear" }}</span>
        </button>
      </div>
    </form>

    <template #fallback>
      <div class="text-center py-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p class="text-red-600 dark:text-red-400">
          No tienes permisos para {{ props.classData ? "editar" : "crear" }} clases.
        </p>
      </div>
    </template>
  </PermissionGuard>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { useTeachersStore } from '../../Teachers/store/teachers';
import { useAuthStore } from '../../../stores/auth';
import { useScheduleValidation } from '../composables/useScheduleValidation';
import { useStudentScheduleValidation } from '../composables/useStudentScheduleValidation';
import StudentConflictAnalyzer from './StudentConflictAnalyzer.vue';
import PermissionGuard from '@/modulos/Auth/components/PermissionGuard.vue';
import { ResourceType } from '@/modulos/Auth/types/permissions';

const props = defineProps({});
const emit = defineEmits(['save', 'cancel']);

// Stores
const teachersStore = useTeachersStore();
const authStore = useAuthStore();

// Validación de horarios
const {
  isValidating,
  hasErrors,
  hasWarnings,
  errorMessages,
  warningMessages,
  suggestions,
  showSuggestions,
  validateSchedule,
  clearValidation,
  applySuggestion,
  canSave,
} = useScheduleValidation();

// Validación específica de conflictos de estudiantes
const {
  isValidating: isValidatingStudents,
  hasStudentConflicts,
  studentConflicts,
  conflictSummary,
  validateStudentConflicts,
  clearStudentValidation,
  studentConflictMessages,
  totalStudentConflicts,
  formatStudentConflictSummary,
} = useStudentScheduleValidation();

// Estado del formulario
const form = ref({
  name: '',
  description: '',
  level: 'Principiante',
  instrument: '',
  teacherId: '', // This will be set with the current user's UID
  classroom: '',
  schedule: {
    slots: [
      { day: '', startTime: '', endTime: '' }, // Sesión vacía por defecto
    ],
  },
});

const levels = ['Principiante', 'Intermedio', 'Avanzado'];
const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const errors = ref({
  name: '',
  level: '',
  teacherId: '',
  schedule: '',
});

const isSubmitting = ref(false);

// Watch para validar horarios cuando cambien
watch(
  () => form.value.schedule.slots,
  async (newSlots) => {
    // Solo validar si hay slots completos
    const completeSlots = newSlots.filter((slot) => slot.day && slot.startTime && slot.endTime);

    if (completeSlots.length > 0) {
      // Validación general de horarios
      await validateSchedule({
        id: props.classData?.id,
        teacherId: form.value.teacherId,
        studentIds: props.classData?.studentIds || [],
        classroom: form.value.classroom,
        schedule: { slots: completeSlots },
      });

      // Validación específica de conflictos de estudiantes
      if (props.classData?.studentIds && props.classData.studentIds.length > 0) {
        await validateStudentConflicts({
          id: props.classData?.id,
          studentIds: props.classData.studentIds,
          schedule: { slots: completeSlots },
        });
      }
    } else {
      clearValidation();
      clearStudentValidation();
    }
  },
  { deep: true },
);

// Watch para validar cuando cambien otros campos relevantes
watch([() => form.value.teacherId, () => form.value.classroom], async () => {
  const completeSlots = form.value.schedule.slots.filter(
    (slot) => slot.day && slot.startTime && slot.endTime,
  );

  if (completeSlots.length > 0) {
    // Validación general de horarios
    await validateSchedule({
      id: props.classData?.id,
      teacherId: form.value.teacherId,
      studentIds: props.classData?.studentIds || [],
      classroom: form.value.classroom,
      schedule: { slots: completeSlots },
    });

    // Validación específica de conflictos de estudiantes
    if (props.classData?.studentIds && props.classData.studentIds.length > 0) {
      await validateStudentConflicts({
        id: props.classData?.id,
        studentIds: props.classData.studentIds,
        schedule: { slots: completeSlots },
      });
    }
  }
});

// Función para agregar una nueva sesión de horario
const addSession = () => {
  form.value.schedule.slots.push({ day: '', startTime: '', endTime: '' });
};

// Función para eliminar una sesión por índice
const removeSession = (index: number) => {
  form.value.schedule.slots.splice(index, 1);
};

// Función para aplicar sugerencia de horario
const applySuggestionToForm = (suggestion: any) => {
  // Reemplazar el primer slot incompleto o agregar uno nuevo
  const incompleteSlotIndex = form.value.schedule.slots.findIndex(
    (slot) => !slot.day || !slot.startTime || !slot.endTime,
  );

  if (incompleteSlotIndex !== -1) {
    form.value.schedule.slots[incompleteSlotIndex] = { ...suggestion };
  } else {
    form.value.schedule.slots.push({ ...suggestion });
  }

  // Cerrar sugerencias después de aplicar
  showSuggestions.value = false;
};

// Validación del formulario, incluyendo horarios
const validateForm = () => {
  let isValid = true;
  errors.value = {
    name: '',
    level: '',
    teacherId: '',
    schedule: '',
  };

  if (!form.value.name.trim()) {
    errors.value.name = 'El nombre de la clase es requerido';
    isValid = false;
  }

  if (!form.value.level) {
    errors.value.level = 'El nivel es requerido';
    isValid = false;
  }

  if (form.value.schedule.slots.length === 0) {
    errors.value.schedule = 'Agrega al menos un horario';
    isValid = false;
  } else {
    form.value.schedule.slots.forEach((session) => {
      if (!session.day || !session.startTime || !session.endTime) {
        errors.value.schedule = 'Completa todos los campos de cada horario';
        isValid = false;
      }
    });
  }

  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  // Verificar conflictos críticos antes de guardar
  if (hasErrors.value) {
    errors.value.schedule = 'Hay conflictos de horario que deben resolverse antes de guardar';
    return;
  }

  // Verificar conflictos específicos de estudiantes
  if (hasStudentConflicts.value) {
    errors.value.schedule =
      'Algunos estudiantes tendrían conflictos de horario. Ningún alumno puede estar en más de una clase al mismo tiempo.';
    return;
  }

  isSubmitting.value = true;
  try {
    emit('save', {
      ...form.value,
      studentIds: props.classData?.studentIds || [],
    });
  } catch (error) {
    console.error('Error al guardar la clase:', error);
  } finally {
    isSubmitting.value = false;
  }
};

// Inicializar formulario si se está editando
watch(
  () => props.classData,
  (newVal) => {
    if (newVal) {
      form.value = {
        name: newVal.name || '',
        description: newVal.description || '',
        level: newVal.level || 'Principiante',
        instrument: newVal.instrument || '',
        teacherId: newVal.teacherId || authStore.user?.uid || '', // Use existing or current user's UID
        classroom: newVal.classroom || '',
        schedule: {
          slots: Array.isArray(newVal.schedule?.slots)
            ? newVal.schedule.slots.map((slot) => ({
              day: slot.day || '',
              startTime: slot.startTime || '',
              endTime: slot.endTime || '',
            }))
            : [], // Default to empty array if not valid
        },
      };
    } else {
      // If creating a new class, set teacherId to current user's UID
      form.value.teacherId = authStore.user?.uid || '';
    }
  },
  { immediate: true },
);

onMounted(async () => {
  // Set the teacherId to the current user's UID if not already set
  if (!form.value.teacherId && authStore.user?.uid) {
    form.value.teacherId = authStore.user.uid;
  }
});
</script>

<style scoped>
/* Puedes agregar estilos personalizados aquí si es necesario */
</style>
