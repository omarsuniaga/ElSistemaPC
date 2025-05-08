<template>
  <div class="students-card bg-white shadow-lg rounded-lg p-6 dark:bg-gray-800">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200">Estudiantes Inscritos</h3>
      <span class="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full">
        Total: {{ students.length }}
      </span>
    </div>
    
    <div v-if="students && students.length > 0">
      <ul class="space-y-3">
        <li v-for="(student, index) in students" 
            :key="student.id" 
            class="flex items-start space-x-3 p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors duration-200">
          <!-- Número de orden -->
          <div class="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <span class="text-blue-800 dark:text-blue-200 font-medium">{{ index + 1 }}</span>
          </div>
          
          <!-- Información del estudiante -->
          <div class="flex-grow min-w-0">
            <p class="font-medium text-gray-900 dark:text-gray-100">{{ student.name }}</p>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              <span v-if="student.age !== undefined">Edad: {{ student.age }} años</span>
              <span v-if="student.age !== undefined && student.instrument" class="mx-1">|</span>
              <span v-if="student.instrument">
                <span class="inline-flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                  </svg>
                  {{ student.instrument }}
                </span>
              </span>
            </div>
          </div>
        </li>
      </ul>
    </div>
    <div v-else class="text-center py-8">
      <svg class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <p class="mt-2 text-gray-600 dark:text-gray-400">No hay estudiantes inscritos en esta clase.</p>
    </div>

    <!-- Botón para descargar PDF -->
    <div class="mt-4">
      <button
        @click="handleDownloadPDF"
        class="flex items-center gap-1 px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium transition-colors"
        title="Descargar PDF"
      >
        <DocumentArrowDownIcon class="w-4 h-4" />
        <span>Descargar PDF</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// defineProps is auto-imported in <script setup>
import { generateClassDetailsPDF } from '@/utils/pdfExport';
import { DocumentArrowDownIcon } from '@heroicons/vue/24/outline';

interface Student {
  id: string;
  name: string;
  age?: number;       // Edad del estudiante (opcional)
  instrument?: string; // Instrumento del estudiante (opcional)
}

defineProps<{
  students: Student[];
  classId: string;
  className: string;
  weeklyHours: number;
  teacherName: string;
}>();

const handleDownloadPDF = async () => {
  try {
    await generateClassDetailsPDF(
      props.className,
      props.teacherName,
      props.weeklyHours,
      props.students
    );
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
};
</script>

<style scoped>
.students-card {
  /* Styling for the students card container */
  /* Example: transition for smooth theme changes */
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Hover effect for student items */
li {
  transition: all 0.2s ease;
}

li:hover {
  transform: translateX(4px);
}
</style>
