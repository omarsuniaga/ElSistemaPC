<!--
  Ejemplo de Integración del Sistema de Permisos Granular
  Este componente demuestra cómo usar el nuevo sistema de permisos
  para controlar la visibilidad y acciones según el rol del usuario
-->

<template>
  <div class="space-y-6">
    <!-- ========== HEADER CON PERMISOS ========== -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            Panel de Gestión de Asistencia
          </h2>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            Rol actual: {{ userRole }} | Alcance: {{ hasGlobalScope ? "Global" : "Clase asignada" }}
          </p>
        </div>

        <!-- Acciones disponibles según permisos -->
        <div class="flex space-x-3">
          <!-- Solo Director puede generar reportes -->
          <PermissionGuard
            :resource="ResourceType.ATTENDANCE_REPORTS"
            :action="PermissionAction.GENERATE_REPORTS"
          >
            <button
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              @click="generateReport"
            >
              📊 Generar Reporte
            </button>
          </PermissionGuard>

          <!-- Solo Director puede ver información confidencial -->
          <PermissionGuard
            :resource="ResourceType.CONFIDENTIAL_INFO"
            :action="PermissionAction.READ"
          >
            <button
              class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              @click="viewConfidentialInfo"
            >
              🔒 Info Confidencial
            </button>
          </PermissionGuard>
        </div>
      </div>
    </div>

    <!-- ========== TABLA DE ASISTENCIA CON PERMISOS ========== -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div class="px-6 py-4 border-b dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Lista de Asistencia</h3>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
              >
                Alumno
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
              >
                Estado
              </th>
              <!-- Solo visible si puede editar asistencia -->
              <PermissionGuard
                :resource="ResourceType.DAILY_ATTENDANCE"
                :action="PermissionAction.UPDATE"
              >
                <th
                  class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  Acciones
                </th>
              </PermissionGuard>
              <!-- Solo Director puede ver información confidencial -->
              <PermissionGuard
                :resource="ResourceType.CONFIDENTIAL_INFO"
                :action="PermissionAction.READ"
              >
                <th
                  class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  Info Confidencial
                </th>
              </PermissionGuard>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="student in studentsToShow"
              :key="student.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div
                    class="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center"
                  >
                    {{ student.name.charAt(0) }}
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ student.name }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ student.instrument }}
                    </div>
                  </div>
                </div>
              </td>

              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="px-2 py-1 text-xs font-medium rounded-full"
                  :class="getStatusClass(student.status)"
                >
                  {{ student.status }}
                </span>
              </td>

              <!-- Acciones según permisos -->
              <PermissionGuard
                :resource="ResourceType.DAILY_ATTENDANCE"
                :action="PermissionAction.UPDATE"
              >
                <td class="px-6 py-4 whitespace-nowrap text-center">
                  <div class="flex justify-center space-x-2">
                    <button
                      class="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full hover:bg-green-200 transition-colors"
                      :disabled="!canEditAttendance(student.id)"
                      @click="markPresent(student.id)"
                    >
                      ✓ Presente
                    </button>
                    <button
                      class="px-3 py-1 bg-red-100 text-red-800 text-xs rounded-full hover:bg-red-200 transition-colors"
                      :disabled="!canEditAttendance(student.id)"
                      @click="markAbsent(student.id)"
                    >
                      ✗ Ausente
                    </button>
                  </div>
                </td>
              </PermissionGuard>

              <!-- Información confidencial solo para Director -->
              <PermissionGuard
                :resource="ResourceType.CONFIDENTIAL_INFO"
                :action="PermissionAction.READ"
              >
                <td class="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    class="text-purple-600 hover:text-purple-800 text-sm"
                    @click="viewStudentConfidential(student.id)"
                  >
                    Ver detalles
                  </button>
                </td>
              </PermissionGuard>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ========== PANEL DE OBSERVACIONES ========== -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Observaciones del Día
      </h3>

      <!-- Solo si puede crear observaciones -->
      <PermissionGuard :resource="ResourceType.OBSERVATIONS" :action="PermissionAction.CREATE">
        <div class="mb-4">
          <textarea
            v-model="newObservation"
            class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            rows="3"
            placeholder="Agregar nueva observación..."
          />
          <button
            class="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            :disabled="!newObservation.trim()"
            @click="addObservation"
          >
            Agregar Observación
          </button>
        </div>
      </PermissionGuard>

      <!-- Lista de observaciones -->
      <div class="space-y-3">
        <div
          v-for="observation in observations"
          :key="observation.id"
          class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <p class="text-gray-900 dark:text-white">{{ observation.text }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Por {{ observation.teacherName }} - {{ formatDate(observation.createdAt) }}
              </p>
            </div>

            <!-- Solo puede editar sus propias observaciones o Director puede editar todas -->
            <PermissionGuard
              v-if="canEditObservation(observation)"
              :resource="ResourceType.OBSERVATIONS"
              :action="PermissionAction.UPDATE"
            >
              <button
                class="ml-4 text-blue-600 hover:text-blue-800 text-sm"
                @click="editObservation(observation.id)"
              >
                Editar
              </button>
            </PermissionGuard>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== DEBUG INFO (Solo en desarrollo) ========== -->
    <div
      v-if="isDevelopment"
      class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
    >
      <h4 class="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
        Debug - Información de Permisos
      </h4>
      <div class="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
        <p><strong>Rol:</strong> {{ userRole }}</p>
        <p><strong>Alcance global:</strong> {{ hasGlobalScope ? "Sí" : "No" }}</p>
        <p><strong>Puede editar asistencia:</strong> {{ canEditDailyAttendance ? "Sí" : "No" }}</p>
        <p>
          <strong>Puede ver info confidencial:</strong> {{ canViewConfidentialInfo ? "Sí" : "No" }}
        </p>
        <p><strong>Puede generar reportes:</strong> {{ canGenerateReports ? "Sí" : "No" }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePermissions } from '../modulos/Auth/composables/usePermissions';
import { ResourceType, PermissionAction } from '../modulos/Auth/types/permissions';
import PermissionGuard from '../modulos/Auth/components/PermissionGuard.vue';

// ========== COMPOSABLES ==========
const { userRole, hasPermission, hasGlobalScope, canAccessModule } = usePermissions();

// ========== DATOS REACTIVOS ==========
const newObservation = ref('');
const isDevelopment = ref(import.meta.env.DEV);

// Datos de ejemplo
const students = ref([
  {
    id: '1',
    name: 'Ana García',
    instrument: 'Violín',
    status: 'Presente',
    classId: 'violin-basico',
    teacherId: 'teacher1',
  },
  {
    id: '2',
    name: 'Carlos López',
    instrument: 'Piano',
    status: 'Ausente',
    classId: 'piano-intermedio',
    teacherId: 'teacher2',
  },
  {
    id: '3',
    name: 'María Rodriguez',
    instrument: 'Guitarra',
    status: 'Tardanza',
    classId: 'guitarra-avanzado',
    teacherId: 'teacher1',
  },
]);

const observations = ref([
  {
    id: '1',
    text: 'Excelente progreso en la técnica de arco',
    teacherName: 'Prof. García',
    teacherId: 'teacher1',
    createdAt: new Date(),
  },
  {
    id: '2',
    text: 'Necesita practicar más las escalas',
    teacherName: 'Prof. Martínez',
    teacherId: 'teacher2',
    createdAt: new Date(Date.now() - 86400000), // Ayer
  },
]);

// ========== COMPUTED PROPERTIES ==========
const studentsToShow = computed(() => {
  // Si tiene alcance global (Director), muestra todos los estudiantes
  if (hasGlobalScope.value) {
    return students.value;
  }

  // Si es Maestro, solo muestra estudiantes de sus clases
  // En un caso real, esto vendría del contexto del usuario actual
  const currentTeacherId = 'teacher1'; // Simulado
  return students.value.filter((student) => student.teacherId === currentTeacherId);
});

// Permisos específicos computados
const canEditDailyAttendance = computed(() =>
  hasPermission(ResourceType.DAILY_ATTENDANCE, PermissionAction.UPDATE),
);

const canViewConfidentialInfo = computed(() =>
  hasPermission(ResourceType.CONFIDENTIAL_INFO, PermissionAction.READ),
);

const canGenerateReports = computed(() =>
  hasPermission(ResourceType.ATTENDANCE_REPORTS, PermissionAction.GENERATE_REPORTS),
);

// ========== MÉTODOS ==========
const canEditAttendance = (studentId: string): boolean => {
  // Lógica adicional para verificar si puede editar este estudiante específico
  const student = students.value.find((s) => s.id === studentId);
  if (!student) return false;

  // Si tiene alcance global, puede editar cualquier estudiante
  if (hasGlobalScope.value) return true;

  // Si es su estudiante, puede editarlo
  const currentTeacherId = 'teacher1'; // En caso real vendría del store de auth
  return student.teacherId === currentTeacherId;
};

const canEditObservation = (observation: any): boolean => {
  // Director puede editar cualquier observación
  if (hasGlobalScope.value) return true;

  // Maestro solo puede editar sus propias observaciones
  const currentTeacherId = 'teacher1'; // En caso real vendría del store de auth
  return observation.teacherId === currentTeacherId;
};

const markPresent = (studentId: string) => {
  if (!canEditAttendance(studentId)) return;

  const student = students.value.find((s) => s.id === studentId);
  if (student) {
    student.status = 'Presente';
    console.log(`✅ Marcado como presente: ${student.name}`);
  }
};

const markAbsent = (studentId: string) => {
  if (!canEditAttendance(studentId)) return;

  const student = students.value.find((s) => s.id === studentId);
  if (student) {
    student.status = 'Ausente';
    console.log(`❌ Marcado como ausente: ${student.name}`);
  }
};

const addObservation = () => {
  if (!hasPermission(ResourceType.OBSERVATIONS, PermissionAction.CREATE)) return;
  if (!newObservation.value.trim()) return;

  const observation = {
    id: Date.now().toString(),
    text: newObservation.value,
    teacherName: 'Prof. García', // En caso real vendría del store de auth
    teacherId: 'teacher1',
    createdAt: new Date(),
  };

  observations.value.unshift(observation);
  newObservation.value = '';
  console.log('📝 Observación agregada:', observation.text);
};

const editObservation = (observationId: string) => {
  const observation = observations.value.find((o) => o.id === observationId);
  if (observation && canEditObservation(observation)) {
    console.log('✏️ Editando observación:', observation.text);
    // Aquí iría la lógica de edición
  }
};

const generateReport = () => {
  if (!canGenerateReports.value) return;
  console.log('📊 Generando reporte de asistencia...');
  // Aquí iría la lógica de generación de reportes
};

const viewConfidentialInfo = () => {
  if (!canViewConfidentialInfo.value) return;
  console.log('🔒 Accediendo a información confidencial...');
  // Aquí iría la lógica para mostrar información confidencial
};

const viewStudentConfidential = (studentId: string) => {
  if (!canViewConfidentialInfo.value) return;
  const student = students.value.find((s) => s.id === studentId);
  console.log('👤 Viendo info confidencial de:', student?.name);
  // Aquí iría la lógica para mostrar información confidencial del estudiante
};

const getStatusClass = (status: string): string => {
  switch (status) {
  case 'Presente':
    return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
  case 'Ausente':
    return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
  case 'Tardanza':
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200';
  default:
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200';
  }
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
</script>

<style scoped>
/* Mejoras visuales */
.transition-colors {
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

/* Estados de botones deshabilitados */
button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .table-responsive {
    font-size: 0.875rem;
  }
}
</style>
