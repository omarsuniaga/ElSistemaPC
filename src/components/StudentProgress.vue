<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
    <div class="mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Progresión de Estudiantes
      </h3>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Selecciona los estudiantes que están listos para avanzar al siguiente nivel
      </p>
    </div>

    <div v-if="!canProgress" class="text-center py-4 text-gray-500 dark:text-gray-400">
      No hay un nivel superior disponible para esta clase
    </div>

    <div v-else>
      <div class="space-y-2">
        <div
          v-for="student in students"
          :key="student.id"
          class="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
        >
          <div class="flex items-center">
            <button
              class="w-5 h-5 rounded border border-gray-300 dark:border-gray-600 mr-3 flex items-center justify-center"
              :class="{'bg-blue-500 border-blue-500': selectedStudents.includes(student.id)}"
              @click="toggleStudent(student.id)"
            >
              <CheckIcon v-if="selectedStudents.includes(student.id)" class="h-4 w-4 text-white" />
            </button>
            <span class="text-gray-900 dark:text-white">
              {{ student.nombre }} {{ student.apellido }}
            </span>
          </div>
        </div>
      </div>

      <div class="mt-4 flex justify-end">
        <button
          :disabled="selectedStudents.length === 0"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="progressStudents"
        >
          Promover al siguiente nivel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useClassesStore } from '../modulos/Classes/store/classes';
import { useStudentsStore } from '../modulos/Students/store/students';
import { CheckIcon, XMarkIcon } from '@heroicons/vue/24/outline';

const props = defineProps<{
  classId: string
}>();

const emit = defineEmits(['student-progressed']);

const classesStore = useClassesStore();
const studentsStore = useStudentsStore();

const selectedStudents = ref<string[]>([]);

const currentClass = computed(() => {
  return classesStore.classes.find((c) => c.id === props.classId);
});

const students = computed(() => {
  if (!currentClass.value?.studentIds) return [];
  return studentsStore.students.filter((s) => currentClass.value?.studentIds?.includes(s.id));
});

const nextLevelClass = computed(() => {
  if (!currentClass.value?.level) return null;

  const levelMap = {
    Principiante: 'Intermedio',
    Intermedio: 'Avanzado',
  };

  const nextLevel = levelMap[currentClass.value.level];
  if (!nextLevel) return null;

  // Find a class of the same instrument but next level
  return classesStore.classes.find(
    (c) => c.instrument === currentClass.value?.instrument && c.level === nextLevel,
  );
});

const canProgress = computed(() => {
  return nextLevelClass.value !== null;
});

const toggleStudent = (studentId: string) => {
  const index = selectedStudents.value.indexOf(studentId);
  if (index === -1) {
    selectedStudents.value.push(studentId);
  } else {
    selectedStudents.value.splice(index, 1);
  }
};

const progressStudents = async () => {
  if (!nextLevelClass.value || !currentClass.value) return;

  try {
    // Remove students from current class
    const updatedCurrentStudents = (currentClass.value.studentIds || []).filter(
      (id) => !selectedStudents.value.includes(id),
    );

    // Add students to next level class
    const updatedNextStudents = [
      ...(nextLevelClass.value.studentIds || []),
      ...selectedStudents.value,
    ];

    // Update both classes
    await Promise.all([
      classesStore.updateClass({
        id: currentClass.value.id,
        studentIds: updatedCurrentStudents,
      }),
      classesStore.updateClass({
        id: nextLevelClass.value.id,
        studentIds: updatedNextStudents,
      }),
    ]);

    emit('student-progressed');
    selectedStudents.value = [];
  } catch (error) {
    console.error('Error progressing students:', error);
  }
};
</script>
