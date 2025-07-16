<template>
  <!-- PDFGeneratorModal v2.0 - Refactored without preview -->
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
    >
      <!-- Header -->
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <DocumentTextIcon class="w-6 h-6 mr-2 text-emerald-500" />
            Generador de PDFs - Reportes de Academia
          </h2>
          <button
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            @click="$emit('close')"
          >
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Generar reportes personalizados con diferentes filtros y formatos profesionales
        </p>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Report Type Selection -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <CogIcon class="w-5 h-5 mr-2 text-blue-500" />
            Tipo de Reporte
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="type in reportTypes"
              :key="type.id"
              class="p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md"
              :class="[
                selectedReportType === type.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500',
                'bg-white dark:bg-gray-700',
              ]"
              @click="selectedReportType = type.id"
            >
              <div class="flex items-center space-x-3">
                <div
                  class="w-12 h-12 rounded-lg flex items-center justify-center"
                  :class="getIconColor(type.color)"
                >
                  <component :is="type.icon" class="w-6 h-6 text-white" />
                </div>

                <div class="flex-1">
                  <h4 class="font-semibold text-gray-900 dark:text-white">
                    {{ type.title }}
                  </h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {{ type.description }}
                  </p>
                </div>

                <div v-if="selectedReportType === type.id" class="text-blue-500">
                  <CheckCircleIcon class="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Filter Options -->
        <div v-if="selectedReportType">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <FunnelIcon class="w-5 h-5 mr-2 text-purple-500" />
            Filtros de Datos
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Class Filter -->
            <div v-if="showClassFilter">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Clase Específica
              </label>
              <select
                v-model="selectedClass"
                class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas las clases</option>
                <option v-for="cls in availableClasses" :key="cls.id" :value="cls.id">
                  {{ cls.name }} - {{ cls.instrument }}
                </option>
              </select>
            </div>

            <!-- Teacher Filter -->
            <div v-if="showTeacherFilter">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maestro Específico
              </label>
              <select
                v-model="selectedTeacher"
                class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los maestros</option>
                <option v-for="teacher in availableTeachers" :key="teacher.id" :value="teacher.id">
                  {{ teacher.name }}
                </option>
              </select>
            </div>

            <!-- Day Filter -->
            <div v-if="showDayFilter">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Día de la Semana
              </label>
              <select
                v-model="selectedDay"
                class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los días</option>
                <option value="lunes">Lunes</option>
                <option value="martes">Martes</option>
                <option value="miercoles">Miércoles</option>
                <option value="jueves">Jueves</option>
                <option value="viernes">Viernes</option>
                <option value="sabado">Sábado</option>
                <option value="domingo">Domingo</option>
              </select>
            </div>

            <!-- Age Range Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rango de Edad
              </label>
              <div class="flex space-x-2">
                <input
                  v-model.number="ageRange.min"
                  type="number"
                  placeholder="Min"
                  min="0"
                  max="100"
                  class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  v-model.number="ageRange.max"
                  type="number"
                  placeholder="Max"
                  min="0"
                  max="100"
                  class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <!-- Active Status Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado del Alumno
              </label>
              <select
                v-model="selectedStatus"
                class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Data Fields Selection -->
        <div v-if="selectedReportType">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <ClipboardDocumentListIcon class="w-5 h-5 mr-2 text-green-500" />
            Campos a Incluir
          </h3>

          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <label
              v-for="field in availableFields"
              :key="field.id"
              class="flex items-center space-x-2 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              :class="{
                'bg-blue-50 dark:bg-blue-900/20 border-blue-500': selectedFields.includes(field.id),
              }"
            >
              <input
                v-model="selectedFields"
                type="checkbox"
                :value="field.id"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{
                field.label
              }}</span>
            </label>
          </div>
        </div>

        <!-- PDF Format Options -->
        <div v-if="selectedReportType">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <DocumentIcon class="w-5 h-5 mr-2 text-orange-500" />
            Opciones de Formato
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Orientación
              </label>
              <select
                v-model="pdfOptions.orientation"
                class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="portrait">Vertical (Portrait)</option>
                <option value="landscape">Horizontal (Landscape)</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tamaño de Página
              </label>
              <select
                v-model="pdfOptions.pageSize"
                class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="letter">Carta (Letter)</option>
                <option value="a4">A4</option>
                <option value="legal">Legal</option>
                <option value="tabloid">Tabloid</option>
              </select>
            </div>

            <div class="md:col-span-2">
              <label class="flex items-center space-x-2">
                <input
                  v-model="pdfOptions.includeHeader"
                  type="checkbox"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Incluir encabezado con logo y título
                </span>
              </label>
            </div>

            <div class="md:col-span-2">
              <label class="flex items-center space-x-2">
                <input
                  v-model="pdfOptions.includeDate"
                  type="checkbox"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Incluir fecha de generación
                </span>
              </label>
            </div>
          </div>
        </div>

        <!-- Advanced Options -->
        <div v-if="selectedReportType">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <CogIcon class="w-5 h-5 mr-2 text-indigo-500" />
            Opciones Avanzadas
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Include Photos -->
            <div class="flex items-center space-x-3">
              <input
                id="includePhotos"
                v-model="pdfOptions.includePhotos"
                type="checkbox"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                for="includePhotos"
                class="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Incluir fotos de estudiantes
              </label>
            </div>

            <!-- Group by Class -->
            <div v-if="selectedReportType === 'all_students'" class="flex items-center space-x-3">
              <input
                id="groupByClass"
                v-model="pdfOptions.groupByClass"
                type="checkbox"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                for="groupByClass"
                class="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Agrupar por clase
              </label>
            </div>
            <!-- Include Statistics -->
            <div class="flex items-center space-x-3">
              <input
                id="includeStats"
                v-model="pdfOptions.includeStatistics"
                type="checkbox"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                for="includeStats"
                class="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Incluir estadísticas resumen
              </label>
            </div>

            <!-- Include Logo -->
            <div class="flex items-center space-x-3">
              <input
                id="includeLogo"
                v-model="pdfOptions.includeLogo"
                type="checkbox"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label for="includeLogo" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Incluir logo en encabezado
              </label>
            </div>

            <!-- Sort Options -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ordenar por
              </label>
              <select
                v-model="pdfOptions.sortBy"
                class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="name">Nombre</option>
                <option value="age">Edad</option>
                <option value="class">Clase</option>
                <option value="instrument">Instrumento</option>
                <option value="enrollment">Fecha de Inscripción</option>
              </select>
            </div>
          </div>
          <!-- Header Customization -->
          <div v-if="pdfOptions.includeHeader" class="mt-6">
            <h4 class="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <DocumentTextIcon class="w-4 h-4 mr-2 text-purple-500" />
              Personalización de Encabezado
            </h4>

            <div class="grid grid-cols-1 gap-4">
              <!-- Institutional Configuration Info -->
              <div
                class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
              >
                <div class="flex items-start space-x-3">
                  <div v-if="hasInstitutionalLogo" class="flex-shrink-0">
                    <img
                      :src="institutionalLogoUrl"
                      alt="Logo institucional"
                      class="w-12 h-12 object-contain border border-gray-200 dark:border-gray-600 rounded bg-white"
                    />
                  </div>
                  <div class="flex-1">
                    <h5 class="font-medium text-gray-900 dark:text-white">
                      {{ institutionalTitle }}
                    </h5>
                    <p class="text-sm text-blue-600 dark:text-blue-400 mt-1">
                      Configuración institucional desde Firebase
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Esta información se carga automáticamente y se puede modificar desde la
                      configuración del sistema
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Información del Reporte Seleccionado -->
        <div v-if="selectedReportType" class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div class="flex items-center">
            <component
              :is="getReportTypes().find((r) => r.id === selectedReportType)?.icon"
              class="w-5 h-5 mr-2 text-blue-500"
            />
            <div>
              <h3 class="text-sm font-medium text-blue-900 dark:text-blue-100">
                {{ getReportTypes().find((r) => r.id === selectedReportType)?.title }}
              </h3>
              <p class="text-xs text-blue-700 dark:text-blue-300">
                {{ getReportTypes().find((r) => r.id === selectedReportType)?.description }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-700 dark:bg-gray-750">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-600 dark:text-gray-100">
            <span v-if="selectedReportType">
              Reporte: {{ getReportTypes().find((r) => r.id === selectedReportType)?.title }}
            </span>
          </div>
          <div class="flex space-x-3">
            <button
              class="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              @click="$emit('close')"
            >
              Cancelar
            </button>

            <button
              :disabled="!selectedReportType || isGenerating"
              class="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center"
              @click="generatePDF"
            >
              <DocumentArrowDownIcon v-if="!isGenerating" class="w-4 h-4 mr-2" />
              <div
                v-else
                class="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"
              />
              {{ isGenerating ? "Generando..." : "Generar PDF" }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Toast -->
    <div
      v-if="showSuccessToast"
      class="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center"
    >
      <CheckCircleIcon class="w-5 h-5 mr-2" />
      PDF generado exitosamente
    </div>

    <!-- Error Toast -->
    <div
      v-if="showErrorToast"
      class="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center"
    >
      <XMarkIcon class="w-5 h-5 mr-2" />
      Error al generar PDF: {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  DocumentTextIcon,
  XMarkIcon,
  CogIcon,
  FunnelIcon,
  ClipboardDocumentListIcon,
  DocumentIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  UsersIcon,
  TableCellsIcon,
} from '@heroicons/vue/24/outline';
import { usePDFGenerator } from '../composables/usePDFGenerator';

// Emits
defineEmits<{
  close: []
  generate: [options: any]
}>();

const {
  // State
  selectedReportType,
  selectedClass,
  selectedTeacher,
  selectedDay,
  selectedStatus,
  ageRange,
  selectedFields,
  isGenerating,
  isLoading,
  showSuccessToast,
  showErrorToast,
  errorMessage,
  pdfOptions,

  // Computed
  availableClasses,
  availableTeachers,
  showClassFilter,
  showTeacherFilter,
  showDayFilter,
  institutionalTitle,
  institutionalLogoUrl,
  hasInstitutionalLogo,

  // Methods
  generatePDF,
  getIconColor,
  showToast,
  getReportTypes,
} = usePDFGenerator();

const reportTypes = getReportTypes();

// Available Fields for PDF
const availableFields = ref([
  { id: 'contador', label: 'N°' },
  { id: 'nombre', label: 'Nombre' },
  { id: 'apellido', label: 'Apellido' },
  { id: 'edad', label: 'Edad' },
  { id: 'fechaNacimiento', label: 'Fecha de Nacimiento' },
  { id: 'telefono', label: 'Teléfono' },
  { id: 'email', label: 'Email' },
  { id: 'direccion', label: 'Dirección' },
  { id: 'madre', label: 'Madre' },
  { id: 'padre', label: 'Padre' },
  { id: 'clase', label: 'Clase' },
  { id: 'instrumento', label: 'Instrumento' },
  { id: 'maestro', label: 'Maestro' },
  { id: 'horario', label: 'Horario' },
  { id: 'fechaInscripcion', label: 'Fecha de Inscripción' },
]);
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Dark mode improvements */
.dark .bg-gray-750 {
  background-color: #374151;
}

/* Focus styles for better accessibility */
input:focus,
select:focus {
  outline: none;
  box-shadow: 0 0 0 2px #3b82f6;
  border-color: #3b82f6;
}

/* Custom scrollbar for preview section */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.dark .overflow-y-auto::-webkit-scrollbar-track {
  background: #374151;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: #6b7280;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Transition animations */
.transition-colors {
  transition-property: color, background-color, border-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* Button hover effects */
button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* Toast animations */
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.fixed.bottom-4.right-4 {
  animation: slideInRight 0.3s ease-out;
}
</style>
