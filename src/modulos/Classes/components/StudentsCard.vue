<template>
  <div class="students-card bg-white shadow-lg rounded-lg p-6 dark:bg-gray-800">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200">Estudiantes Inscritos</h3>
      <span
        class="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full"
      >
        Total: {{ students.length }}
      </span>
    </div>

    <div v-if="students && students.length > 0">
      <ul class="space-y-3">
        <li
          v-for="(student, index) in students"
          :key="student.id"
          class="flex items-start space-x-3 p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors duration-200 cursor-pointer"
          @click="openStudentModal(student)"
        >
          <!-- Número de orden -->
          <div
            class="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center"
          >
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
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
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
      <svg
        class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        No hay estudiantes inscritos en esta clase.
      </p>
    </div>

    <!-- Botones de acción -->
    <div class="mt-6 flex flex-col sm:flex-row gap-3">
      <button
        class="flex items-center justify-center gap-1 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium transition-colors"
        :disabled="!students.length"
        @click="downloadStudentsList"
      >
        <DocumentArrowDownIcon class="w-5 h-5" />
        <span>Lista de Estudiantes</span>
      </button>

      <button
        class="flex items-center justify-center gap-1 px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-medium transition-colors"
        :disabled="!students.length"
        @click="downloadDetailedPDF"
      >
        <ClipboardDocumentListIcon class="w-5 h-5" />
        <span>Reporte Completo</span>
      </button>
    </div>

    <!-- Button to add students (replacing router-link) -->
    <div class="mt-4">
      <button
        class="w-full flex items-center justify-center gap-1 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
        @click="addNewStudent"
      >
        <PlusIcon class="w-5 h-5" />
        <span>Añadir Estudiante a la Clase</span>
      </button>
    </div>

    <!-- Modal del perfil de estudiante -->
    <StudentProfileModal
      v-if="selectedStudent"
      :student="selectedStudent"
      :show="isModalOpen"
      @close="closeStudentModal"
      @view-profile="handleViewProfile"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { generateClassDetailsPDF, generateStudentListPDF } from '@/utils/studentsListPdfExport';
import { DocumentArrowDownIcon, ClipboardDocumentListIcon, PlusIcon } from '@heroicons/vue/24/outline';
import StudentProfileModal from '@/modulos/Students/components/StudentProfileModal.vue';

interface Student {
  id: string
  name: string
  age?: number // Edad del estudiante (opcional)
  instrument?: string // Instrumento del estudiante (opcional)
}

const props = defineProps<{
  students: Student[]
  classId: string
  className: string
  weeklyHours: number
  teacherName: string
}>();

const router = useRouter();

// Estado para manejar el modal
const selectedStudent = ref<Student | null>(null);
const isModalOpen = ref(false);

// Abrir el modal con la información del estudiante seleccionado
const openStudentModal = (student: Student) => {
  selectedStudent.value = student;
  isModalOpen.value = true;
};

// Cerrar el modal
const closeStudentModal = () => {
  isModalOpen.value = false;
  // Reset the selected student after a slight delay to allow for the closing animation
  setTimeout(() => {
    selectedStudent.value = null;
  }, 300);
};

// Handle view profile from modal
const handleViewProfile = (studentId: string) => {
  // Here you can emit an event to the parent or handle navigation differently
  console.log(`Requested to view profile for student: ${studentId}`);
  // Close the modal
  closeStudentModal();
};

// Handle add student navigation safely
const addNewStudent = () => {
  try {
    alert(
      'Esta función será implementada próximamente. Por ahora, utilice la interfaz de administración de estudiantes para añadir nuevos estudiantes a la clase.',
    );

    // Commented out problematic navigation attempts
    /*
    router.push({ 
      name: 'AddStudentToClass', 
      params: { classId: props.classId } 
    }).catch(() => {
      router.push({ 
        name: 'Students/Add', 
        query: { classId: props.classId } 
      }).catch(() => {
        router.push({ 
          name: 'StudentsManagement',
          query: { action: 'add', classId: props.classId } 
        }).catch(error => {
          console.error('Navigation error:', error);
          alert('No se pudo navegar a la página para añadir estudiantes. Por favor, verifique la configuración de rutas.');
        });
      });
    });
    */
  } catch (error) {
    console.error('Error navigating to add student:', error);
  }
};

// Descargar PDF con la lista básica de estudiantes
const downloadStudentsList = async () => {
  try {
    await generateStudentListPDF({
      className: props.className,
      teacherName: props.teacherName,
      students: props.students,
    });
  } catch (error) {
    console.error('Error generating student list PDF:', error);
  }
};

// Descargar PDF detallado con información de la clase
const downloadDetailedPDF = async () => {
  try {
    // Get current date for the attendance report
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    await generateClassDetailsPDF(
      props.className,
      props.teacherName,
      props.weeklyHours,
      props.students,
      today, // Pass today's date
    );
  } catch (error) {
    console.error('Error generating detailed PDF:', error);
  }
};
</script>

<style scoped>
.students-card {
  /* Styling for the students card container */
  /* Example: transition for smooth theme changes */
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}

/* Hover effect for student items */
li {
  transition: all 0.2s ease;
  cursor: pointer;
}

li:hover {
  transform: translateX(4px);
  background-color: rgba(59, 130, 246, 0.1);
}

/* Make sure disabled buttons look properly disabled */
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
