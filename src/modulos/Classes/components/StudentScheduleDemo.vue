<template>
  <div class="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        🎓 Validación de Horarios: Perspectiva del Estudiante
      </h2>
      <p class="text-gray-600 dark:text-gray-400">
        <strong>Regla fundamental:</strong> Ningún alumno puede estar en más de una clase al mismo tiempo.
      </p>
    </div>

    <!-- Selector de estudiante para demostración -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Seleccionar estudiante para análisis:
      </label>
      <select 
        v-model="selectedStudentId"
        class="block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-100 dark:text-black"
        @change="analyzeStudent"
      >
        <option value="">Seleccione un estudiante...</option>
        <option v-for="student in mockStudents" :key="student.id" :value="student.id">
          {{ student.name }}
        </option>
      </select>
    </div>

    <!-- Horario actual del estudiante -->
    <div v-if="selectedStudentSchedule" class="mb-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
        📅 Horario Actual de {{ selectedStudentSchedule.studentName }}
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="class_ in selectedStudentSchedule.classes" :key="class_.id" 
             class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
          <h4 class="font-medium text-blue-900 dark:text-blue-100">{{ class_.name }}</h4>
          <p class="text-sm text-blue-700 dark:text-blue-300">{{ class_.instrument }} - {{ class_.level }}</p>
          <div class="mt-2 space-y-1">
            <div v-for="slot in class_.schedule.slots" :key="`${slot.day}-${slot.startTime}`"
                 class="text-xs text-blue-600 dark:text-blue-400">
              {{ slot.day }}: {{ slot.startTime }} - {{ slot.endTime }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Simulador de nueva clase -->
    <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
        ➕ Simular Nueva Clase
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <select v-model="newClass.day" class="p-2 border rounded dark:bg-gray-100 dark:text-black">
          <option value="">Seleccionar día</option>
          <option v-for="day in days" :key="day" :value="day">{{ day }}</option>
        </select>
        <input 
          type="time" 
          v-model="newClass.startTime" 
          class="p-2 border rounded dark:bg-gray-100 dark:text-black"
        />
        <input 
          type="time" 
          v-model="newClass.endTime" 
          class="p-2 border rounded dark:bg-gray-100 dark:text-black"
        />
      </div>
      <button 
        @click="checkConflict"
        :disabled="!newClass.day || !newClass.startTime || !newClass.endTime || !selectedStudentId"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Verificar Conflicto
      </button>
    </div>

    <!-- Resultado de la validación -->
    <div v-if="validationResult" class="mb-6">
      <div v-if="validationResult.hasConflict" 
           class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
        <div class="flex items-start">
          <svg class="h-5 w-5 text-red-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
          </svg>
          <div>
            <h4 class="text-red-800 dark:text-red-400 font-medium">⚠️ CONFLICTO DETECTADO</h4>
            <p class="text-red-700 dark:text-red-300 mt-1">
              <strong>{{ selectedStudentSchedule?.studentName }}</strong> ya tiene una clase en este horario:
            </p>
            <div class="mt-2 p-2 bg-red-100 dark:bg-red-800/30 rounded text-sm">
              <strong>{{ validationResult.conflictingClass.name }}</strong><br>
              {{ validationResult.conflictingClass.day }}: {{ validationResult.conflictingClass.startTime }} - {{ validationResult.conflictingClass.endTime }}
            </div>
            <p class="text-red-700 dark:text-red-300 mt-2 font-medium">
              💡 Ningún alumno puede estar en más de una clase al mismo tiempo.
            </p>
          </div>
        </div>
      </div>

      <div v-else 
           class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
        <div class="flex items-start">
          <svg class="h-5 w-5 text-green-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          <div>
            <h4 class="text-green-800 dark:text-green-400 font-medium">✅ SIN CONFLICTOS</h4>
            <p class="text-green-700 dark:text-green-300 mt-1">
              <strong>{{ selectedStudentSchedule?.studentName }}</strong> puede ser inscrito en este horario.
            </p>
            <p class="text-green-700 dark:text-green-300 mt-1 text-sm">
              {{ newClass.day }}: {{ newClass.startTime }} - {{ newClass.endTime }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Explicación de la regla -->
    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
        📋 ¿Por qué es importante esta validación?
      </h3>
      <ul class="text-blue-800 dark:text-blue-300 text-sm space-y-2">
        <li>• <strong>Evita confusión:</strong> Los estudiantes saben exactamente dónde deben estar</li>
        <li>• <strong>Optimiza recursos:</strong> Profesores y aulas se utilizan eficientemente</li>
        <li>• <strong>Garantiza calidad:</strong> Cada estudiante recibe atención completa en su clase</li>
        <li>• <strong>Simplifica administración:</strong> Reduce errores y conflictos de programación</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { TimeSlot } from '../../../utils/scheduleConflicts';
import { timeSlotsOverlap } from '../../../utils/scheduleConflicts';

// Datos de demostración
const mockStudents = ref([
  { id: '1', name: 'Ana García' },
  { id: '2', name: 'Carlos López' },
  { id: '3', name: 'María Rodríguez' },
  { id: '4', name: 'Diego Martínez' }
]);

const mockClasses = ref([
  {
    id: 'class1',
    name: 'Piano Principiante',
    instrument: 'Piano',
    level: 'Principiante',
    studentIds: ['1', '2'],
    schedule: {
      slots: [
        { day: 'Lunes', startTime: '10:00', endTime: '11:00' },
        { day: 'Miércoles', startTime: '10:00', endTime: '11:00' }
      ]
    }
  },
  {
    id: 'class2',
    name: 'Guitarra Intermedio',
    instrument: 'Guitarra',
    level: 'Intermedio',
    studentIds: ['1', '3'],
    schedule: {
      slots: [
        { day: 'Martes', startTime: '14:00', endTime: '15:30' },
        { day: 'Jueves', startTime: '14:00', endTime: '15:30' }
      ]
    }
  },
  {
    id: 'class3',
    name: 'Violín Avanzado',
    instrument: 'Violín',
    level: 'Avanzado',
    studentIds: ['2', '4'],
    schedule: {
      slots: [
        { day: 'Lunes', startTime: '16:00', endTime: '17:30' },
        { day: 'Miércoles', startTime: '16:00', endTime: '17:30' }
      ]
    }
  }
]);

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// Estado del componente
const selectedStudentId = ref('');
const selectedStudentSchedule = ref<any>(null);
const newClass = ref({
  day: '',
  startTime: '',
  endTime: ''
});
const validationResult = ref<any>(null);

// Analizar el horario de un estudiante
const analyzeStudent = () => {
  if (!selectedStudentId.value) {
    selectedStudentSchedule.value = null;
    return;
  }

  const student = mockStudents.value.find(s => s.id === selectedStudentId.value);
  const studentClasses = mockClasses.value.filter(c => 
    c.studentIds.includes(selectedStudentId.value)
  );

  selectedStudentSchedule.value = {
    studentName: student?.name,
    classes: studentClasses
  };

  // Limpiar resultado anterior
  validationResult.value = null;
};

// Verificar conflicto con nueva clase
const checkConflict = () => {
  if (!selectedStudentSchedule.value || !newClass.value.day || !newClass.value.startTime || !newClass.value.endTime) {
    return;
  }

  const newSlot: TimeSlot = {
    day: newClass.value.day,
    startTime: newClass.value.startTime,
    endTime: newClass.value.endTime
  };

  let conflictFound = false;
  let conflictingClass: any = null;

  // Verificar conflictos con cada clase existente del estudiante
  for (const class_ of selectedStudentSchedule.value.classes) {
    for (const existingSlot of class_.schedule.slots) {
      if (timeSlotsOverlap(newSlot, existingSlot)) {
        conflictFound = true;
        conflictingClass = {
          name: class_.name,
          day: existingSlot.day,
          startTime: existingSlot.startTime,
          endTime: existingSlot.endTime
        };
        break;
      }
    }
    if (conflictFound) break;
  }

  validationResult.value = {
    hasConflict: conflictFound,
    conflictingClass
  };
};

onMounted(() => {
  // Seleccionar primer estudiante por defecto para demostración
  selectedStudentId.value = '1';
  analyzeStudent();
});
</script>

<style scoped>
/* Estilos específicos para la demostración */
</style>
