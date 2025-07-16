<!-- src/modulos/Admin/components/modals/ImportResultModal.vue -->
<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" class="relative z-50" @close="closeModal">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black bg-opacity-25" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel
              class="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all"
            >
              <DialogTitle
                as="h3"
                class="text-lg font-bold leading-6 text-gray-900 dark:text-white mb-4 flex items-center"
              >
                <component :is="resultIcon" :class="resultIconClass" class="w-6 h-6 mr-2" />
                Resultado de Importación
              </DialogTitle>

              <div class="modal-content">
                <!-- Summary Cards -->
                <div class="summary-section mb-6">
                  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                      <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {{ result.total }}
                      </div>
                      <div class="text-sm text-blue-700 dark:text-blue-300">Total Registros</div>
                    </div>

                    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                      <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                        {{ result.successful }}
                      </div>
                      <div class="text-sm text-green-700 dark:text-green-300">Importados</div>
                    </div>

                    <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
                      <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {{ result.warnings }}
                      </div>
                      <div class="text-sm text-yellow-700 dark:text-yellow-300">
                        Con Advertencias
                      </div>
                    </div>

                    <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                      <div class="text-2xl font-bold text-red-600 dark:text-red-400">
                        {{ result.errors }}
                      </div>
                      <div class="text-sm text-red-700 dark:text-red-300">Con Errores</div>
                    </div>
                  </div>
                </div>

                <!-- Progress Summary -->
                <div class="progress-section mb-6">
                  <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Progreso de Importación
                      </span>
                      <span class="text-sm text-gray-600 dark:text-gray-400">
                        {{ Math.round((result.successful / result.total) * 100) }}% exitoso
                      </span>
                    </div>
                    <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div class="flex h-2 rounded-full overflow-hidden">
                        <div
                          class="bg-green-500 transition-all duration-300"
                          :style="{width: `${(result.successful / result.total) * 100}%`}"
                        />
                        <div
                          class="bg-yellow-500 transition-all duration-300"
                          :style="{width: `${(result.warnings / result.total) * 100}%`}"
                        />
                        <div
                          class="bg-red-500 transition-all duration-300"
                          :style="{width: `${(result.errors / result.total) * 100}%`}"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Detailed Results Tabs -->
                <div class="details-section">
                  <div class="mb-4">
                    <nav class="flex space-x-4">
                      <button
                        v-for="tab in tabs"
                        :key="tab.id"
                        :class="[
                          'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                          activeTab === tab.id
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        ]"
                        @click="activeTab = tab.id"
                      >
                        {{ tab.label }}
                        <span
v-if="tab.count > 0" :class="[
                          :class="['ml-2 px-2 py-0.5 text-xs rounded-full', tab.color]"
                        >
                          {{ tab.count }}
                        </span>
                      </button>
                    </nav>
                  </div>

                  <!-- Successful Imports -->
                  <div v-if="activeTab === 'successful'" class="tab-content">
                    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <h4 class="text-sm font-medium text-green-800 dark:text-green-200 mb-3">
                        ✅ Estudiantes Importados Exitosamente
                      </h4>
                      <div class="max-h-64 overflow-y-auto">
                        <div class="space-y-2">
                          <div
                            v-for="(student, index) in result.successfulRecords"
                            :key="index"
                            class="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border"
                          >
                            <div class="flex items-center space-x-3">
                              <div
                                class="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center"
                              >
                                <CheckIcon class="w-4 h-4 text-green-600 dark:text-green-400" />
                              </div>
                              <div>
                                <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {{ student.firstName }} {{ student.lastName }}
                                </div>
                                <div class="text-xs text-gray-500 dark:text-gray-400">
                                  {{ student.email }}
                                </div>
                              </div>
                            </div>
                            <div class="text-xs text-green-600 dark:text-green-400">
                              Fila {{ student.row }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Warnings -->
                  <div v-if="activeTab === 'warnings'" class="tab-content">
                    <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                      <h4 class="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-3">
                        ⚠️ Registros con Advertencias
                      </h4>
                      <div class="max-h-64 overflow-y-auto">
                        <div class="space-y-3">
                          <div
                            v-for="(warning, index) in result.warningRecords"
                            :key="index"
                            class="p-3 bg-white dark:bg-gray-800 rounded border border-yellow-200 dark:border-yellow-800"
                          >
                            <div class="flex items-start space-x-3">
                              <ExclamationTriangleIcon
                                class="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0"
                              />
                              <div class="flex-1">
                                <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {{ warning.record.firstName }} {{ warning.record.lastName }}
                                  <span class="text-xs text-gray-500 ml-2"
                                    >(Fila {{ warning.row }})</span
                                  >
                                </div>
                                <div class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                  {{ warning.message }}
                                </div>
                                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Importado con valores por defecto
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Errors -->
                  <div v-if="activeTab === 'errors'" class="tab-content">
                    <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                      <h4 class="text-sm font-medium text-red-800 dark:text-red-200 mb-3">
                        ❌ Registros con Errores
                      </h4>
                      <div class="max-h-64 overflow-y-auto">
                        <div class="space-y-3">
                          <div
                            v-for="(error, index) in result.errorRecords"
                            :key="index"
                            class="p-3 bg-white dark:bg-gray-800 rounded border border-red-200 dark:border-red-800"
                          >
                            <div class="flex items-start space-x-3">
                              <XCircleIcon class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                              <div class="flex-1">
                                <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  Fila {{ error.row }}
                                  <span v-if="error.record" class="text-gray-500 ml-2">
                                    - {{ error.record.firstName || "N/A" }}
                                    {{ error.record.lastName || "N/A" }}
                                  </span>
                                </div>
                                <div class="text-sm text-red-700 dark:text-red-300 mt-1">
                                  {{ error.message }}
                                </div>
                                <div
                                  v-if="error.details"
                                  class="text-xs text-gray-500 dark:text-gray-400 mt-1"
                                >
                                  {{ error.details }}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Summary -->
                  <div v-if="activeTab === 'summary'" class="tab-content">
                    <div class="space-y-4">
                      <!-- File Info -->
                      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h4 class="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">
                          📄 Información del Archivo
                        </h4>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span class="text-gray-600 dark:text-gray-400">Nombre:</span>
                            <span class="text-gray-900 dark:text-gray-100 ml-2">{{
                              result.fileName
                            }}</span>
                          </div>
                          <div>
                            <span class="text-gray-600 dark:text-gray-400">Tamaño:</span>
                            <span class="text-gray-900 dark:text-gray-100 ml-2">{{
                              formatFileSize(result.fileSize)
                            }}</span>
                          </div>
                          <div>
                            <span class="text-gray-600 dark:text-gray-400">Tipo:</span>
                            <span class="text-gray-900 dark:text-gray-100 ml-2">{{
                              result.fileType
                            }}</span>
                          </div>
                          <div>
                            <span class="text-gray-600 dark:text-gray-400">Procesado:</span>
                            <span class="text-gray-900 dark:text-gray-100 ml-2">{{
                              formatDate(result.processedAt)
                            }}</span>
                          </div>
                        </div>
                      </div>

                      <!-- Processing Time -->
                      <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <h4 class="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">
                          ⏱️ Tiempo de Procesamiento
                        </h4>
                        <div class="text-sm text-gray-700 dark:text-gray-300">
                          <div>
                            Tiempo total:
                            <strong>{{ formatDuration(result.processingTime) }}</strong>
                          </div>
                          <div>
                            Promedio por registro:
                            <strong>{{
                              formatDuration(result.processingTime / result.total)
                            }}</strong>
                          </div>
                        </div>
                      </div>

                      <!-- Recommendations -->
                      <div
                        v-if="recommendations.length > 0"
                        class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4"
                      >
                        <h4 class="text-sm font-medium text-purple-800 dark:text-purple-200 mb-3">
                          💡 Recomendaciones
                        </h4>
                        <ul class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                          <li
                            v-for="(rec, index) in recommendations"
                            :key="index"
                            class="flex items-start space-x-2"
                          >
                            <span class="text-purple-500 mt-0.5">•</span>
                            <span>{{ rec }}</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div
                class="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600"
              >
                <div class="flex space-x-2">
                  <button
                    v-if="result.errors > 0"
                    class="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-200 dark:hover:bg-red-800/30 flex items-center space-x-2"
                    @click="downloadErrorReport"
                  >
                    <DocumentArrowDownIcon class="w-4 h-4" />
                    <span>Descargar Errores</span>
                  </button>

                  <button
                    class="px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/30 flex items-center space-x-2"
                    @click="downloadFullReport"
                  >
                    <DocumentTextIcon class="w-4 h-4" />
                    <span>Reporte Completo</span>
                  </button>
                </div>

                <div class="flex space-x-3">
                  <button
                    class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
                    @click="closeModal"
                  >
                    Cerrar
                  </button>
                  <button
                    v-if="result.successful > 0"
                    class="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 flex items-center space-x-2"
                    @click="viewImportedStudents"
                  >
                    <EyeIcon class="w-4 h-4" />
                    <span>Ver Estudiantes</span>
                  </button>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue';
import {
  CheckIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
  EyeIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline';

interface ImportResult {
  total: number
  successful: number
  warnings: number
  errors: number
  fileName: string
  fileSize: number
  fileType: string
  processedAt: Date
  processingTime: number
  successfulRecords: any[]
  warningRecords: any[]
  errorRecords: any[]
}

interface Props {
  isOpen: boolean
  result: ImportResult
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: []
  viewStudents: [studentIds: string[]]
}>();

// Estado local
const activeTab = ref('successful');

// Computed
const resultIcon = computed(() => {
  if (props.result.errors > props.result.successful) return XMarkIcon;
  if (props.result.warnings > 0) return ExclamationTriangleIcon;
  return CheckCircleIcon;
});

const resultIconClass = computed(() => {
  if (props.result.errors > props.result.successful) return 'text-red-500';
  if (props.result.warnings > 0) return 'text-yellow-500';
  return 'text-green-500';
});

const tabs = computed(() => [
  {
    id: 'successful',
    label: 'Exitosos',
    count: props.result.successful,
    color: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
  },
  {
    id: 'warnings',
    label: 'Advertencias',
    count: props.result.warnings,
    color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
  },
  {
    id: 'errors',
    label: 'Errores',
    count: props.result.errors,
    color: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
  },
  {
    id: 'summary',
    label: 'Resumen',
    count: 0,
    color: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
  },
]);

const recommendations = computed(() => {
  const recs: string[] = [];

  if (props.result.errors > 0) {
    recs.push('Revisa los errores y corrige el archivo antes de importar nuevamente');
  }

  if (props.result.warnings > 0) {
    recs.push('Los registros con advertencias fueron importados con valores por defecto');
  }

  if (props.result.successful > 0) {
    recs.push('Verifica que todos los estudiantes importados tengan la información correcta');
  }

  const errorRate = (props.result.errors / props.result.total) * 100;
  if (errorRate > 20) {
    recs.push('Alta tasa de errores: considera revisar el formato del archivo');
  }

  return recs;
});

// Methods
const closeModal = () => {
  emit('close');
};

const viewImportedStudents = () => {
  const studentIds = props.result.successfulRecords.map((record) => record.id);
  emit('viewStudents', studentIds);
  closeModal();
};

const downloadErrorReport = () => {
  // TODO: Implementar descarga de reporte de errores
  console.log('Descargando reporte de errores...', props.result.errorRecords);
};

const downloadFullReport = () => {
  // TODO: Implementar descarga de reporte completo
  console.log('Descargando reporte completo...', props.result);
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (date: Date): string => {
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  const seconds = (ms / 1000).toFixed(1);
  return `${seconds}s`;
};
</script>

<style scoped>
.tab-content {
  min-height: 200px;
}
</style>
