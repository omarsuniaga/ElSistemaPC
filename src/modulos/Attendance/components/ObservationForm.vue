<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ClassObservation } from '../types/attendance';
import { useAttendanceStore } from '../store/attendance';
import { useAuthStore } from '../../../stores/auth';
import { useTeachersStore } from '../../Teachers/store/teachers';
import { useRBACStore } from '../../../stores/rbacStore';

const props = defineProps<{
  classId: string;
  date: string;
}>();

const emit = defineEmits(['saved', 'cancel']);

const attendanceStore = useAttendanceStore();
const authStore = useAuthStore();
const teachersStore = useTeachersStore();
const rbacStore = useRBACStore();

// RBAC permissions
const canObserve = computed(() => rbacStore.hasPermission('attendance_observe'));

// Estado del formulario
const observationType = ref<ClassObservation['type']>('general');
const observationText = ref('');
const bulletPoints = ref<string[]>(['']);
const taggedStudents = ref<string[]>([]);
const works = ref<Array<{ title: string; composer?: string; notes?: string }>>([]);
const classDynamics = ref<Array<{ type: string; description: string; effectiveness?: 'alta' | 'media' | 'baja' }>>([]);
const priority = ref<'alta' | 'media' | 'baja'>('media');
const requiresFollowUp = ref(false);

// Computed para validación
const isValid = computed(() => {
  return observationText.value.trim().length > 0 || 
         bulletPoints.value.some(point => point.trim().length > 0) ||
         works.value.length > 0 ||
         classDynamics.value.length > 0;
});

// Function to get teacher name by ID
const getTeacherName = async (teacherId: string): Promise<string> => {
  try {
    // First check if teachers are already loaded
    if (teachersStore.teachers.length === 0) {
      await teachersStore.fetchTeachers();
    }
    
    // Find teacher by ID (uid)
    const teacher = teachersStore.teachers.find(t => t.uid === teacherId);
    if (teacher) {
      return teacher.name;
    }
    
    // If not found by uid, try by id
    const teacherById = teachersStore.teachers.find(t => t.id === teacherId);
    if (teacherById) {
      return teacherById.name;
    }
    
    // Fallback to email if teacher not found
    return authStore.user?.email || 'Usuario del Sistema';
  } catch (error) {
    console.error('Error getting teacher name:', error);
    return authStore.user?.email || 'Usuario del Sistema';
  }
};

// Métodos para manejar el formulario
const addBulletPoint = () => {
  bulletPoints.value.push('');
};

const removeBulletPoint = (index: number) => {
  bulletPoints.value.splice(index, 1);
};

const addWork = () => {
  works.value.push({ title: '' });
};

const removeWork = (index: number) => {
  works.value.splice(index, 1);
};

const addClassDynamic = () => {
  classDynamics.value.push({ type: '', description: '' });
};

const removeClassDynamic = (index: number) => {
  classDynamics.value.splice(index, 1);
};

const saveObservation = async () => {
  if (!isValid.value || !canObserve.value) return;

  // Get teacher name instead of UID
  const currentUserId = authStore.user?.uid;
  const teacherName = currentUserId ? await getTeacherName(currentUserId) : 'Usuario del Sistema';

  const observation: Omit<ClassObservation, 'id' | 'createdAt' | 'updatedAt'> = {
    classId: props.classId,
    date: props.date,
    authorId: currentUserId || '', // Required field
    type: observationType.value,
    content: {
      text: observationText.value,
      bulletPoints: bulletPoints.value.filter(point => point.trim().length > 0),
      taggedStudents: taggedStudents.value,
      works: works.value,
      classDynamics: classDynamics.value
    },
    author: teacherName, // Using teacher name instead of UID
    text: observationText.value, // Required field
    priority: priority.value,
    requiresFollowUp: requiresFollowUp.value
  };

  try {
    await attendanceStore.addObservationToHistory(observation);
    emit('saved');
  } catch (error) {
    console.error('Error saving observation:', error);
  }
};
</script>

<template>
  <div class="p-4 space-y-4">
    <!-- Tipo de observación -->
    <div>
      <label class="block text-sm font-medium text-gray-700">Tipo de Observación</label>
      <select v-model="observationType" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
        <option value="general">General</option>
        <option value="comportamiento">Comportamiento</option>
        <option value="logro">Logro</option>
        <option value="contenido">Contenido</option>
        <option value="dinamica">Dinámica de Clase</option>
      </select>
    </div>

    <!-- Texto principal -->
    <div>
      <label class="block text-sm font-medium text-gray-700">Observación Principal</label>
      <textarea
        v-model="observationText"
        rows="4"
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        placeholder="Escribe tu observación principal aquí..."
      ></textarea>
    </div>

    <!-- Viñetas -->
    <div>
      <label class="block text-sm font-medium text-gray-700">Viñetas</label>
      <div v-for="(point, index) in bulletPoints" :key="index" class="flex gap-2 mt-2">
        <input
          v-model="bulletPoints[index]"
          type="text"
          class="flex-1 rounded-md border-gray-300 shadow-sm"
          placeholder="Agregar punto..."
        />
        <button
          @click="removeBulletPoint(index)"
          class="text-red-600 hover:text-red-800"
          :disabled="bulletPoints.length === 1"
        >
          Eliminar
        </button>
      </div>
      <button
        @click="addBulletPoint"
        class="mt-2 text-blue-600 hover:text-blue-800"
      >
        + Agregar viñeta
      </button>
    </div>

    <!-- Obras trabajadas -->
    <div v-if="observationType === 'contenido'">
      <label class="block text-sm font-medium text-gray-700">Obras Trabajadas</label>
      <div v-for="(work, index) in works" :key="index" class="mt-2 space-y-2">
        <input
          v-model="work.title"
          type="text"
          class="w-full rounded-md border-gray-300 shadow-sm"
          placeholder="Título de la obra"
        />
        <input
          v-model="work.composer"
          type="text"
          class="w-full rounded-md border-gray-300 shadow-sm"
          placeholder="Compositor"
        />
        <textarea
          v-model="work.notes"
          rows="2"
          class="w-full rounded-md border-gray-300 shadow-sm"
          placeholder="Notas adicionales"
        ></textarea>
        <button
          @click="removeWork(index)"
          class="text-red-600 hover:text-red-800"
        >
          Eliminar obra
        </button>
      </div>
      <button
        @click="addWork"
        class="mt-2 text-blue-600 hover:text-blue-800"
      >
        + Agregar obra
      </button>
    </div>

    <!-- Dinámicas de clase -->
    <div v-if="observationType === 'dinamica'">
      <label class="block text-sm font-medium text-gray-700">Dinámicas de Clase</label>
      <div v-for="(dynamic, index) in classDynamics" :key="index" class="mt-2 space-y-2">
        <input
          v-model="dynamic.type"
          type="text"
          class="w-full rounded-md border-gray-300 shadow-sm"
          placeholder="Tipo de dinámica"
        />
        <textarea
          v-model="dynamic.description"
          rows="2"
          class="w-full rounded-md border-gray-300 shadow-sm"
          placeholder="Descripción"
        ></textarea>
        <select
          v-model="dynamic.effectiveness"
          class="w-full rounded-md border-gray-300 shadow-sm"
        >
          <option value="">Seleccionar efectividad</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
        <button
          @click="removeClassDynamic(index)"
          class="text-red-600 hover:text-red-800"
        >
          Eliminar dinámica
        </button>
      </div>
      <button
        @click="addClassDynamic"
        class="mt-2 text-blue-600 hover:text-blue-800"
      >
        + Agregar dinámica
      </button>
    </div>

    <!-- Prioridad y seguimiento -->
    <div class="flex gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700">Prioridad</label>
        <select v-model="priority" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
        </select>
      </div>
      <div class="flex items-center">
        <input
          v-model="requiresFollowUp"
          type="checkbox"
          class="rounded border-gray-300 text-blue-600 shadow-sm"
        />
        <label class="ml-2 text-sm text-gray-700">Requiere seguimiento</label>
      </div>
    </div>

    <!-- Botones de acción -->
    <div class="flex justify-end gap-4 mt-4">
      <button
        @click="emit('cancel')"
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
      >
        Cancelar
      </button>      <button
        @click="saveObservation"
        :disabled="!isValid || !canObserve"
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
        :title="!canObserve ? 'No tienes permisos para crear observaciones' : ''"
      >
        Guardar Observación
      </button>
    </div>
  </div>
</template>