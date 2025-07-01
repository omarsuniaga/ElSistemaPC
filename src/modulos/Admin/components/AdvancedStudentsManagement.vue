<template>
  <div class="max-w-7xl mx-auto p-6 space-y-6">
    <!-- Header -->
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
    >
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Gestión Avanzada de Estudiantes
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Herramientas completas para administrar estudiantes
          </p>
        </div>
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-500"
            >{{ studentsStore.students.length }} estudiantes total</span
          >
          <button
            :disabled="isLoading"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
            @click="refreshData"
          >
            <ArrowPathIcon class="w-4 h-4 mr-2" />
            Actualizar
          </button>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Importar Estudiantes
        </h3>
        <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">Carga masiva desde Excel o CSV</p>
        <input
          ref="fileInput"
          type="file"
          accept=".xlsx,.xls,.csv"
          class="hidden"
          @change="handleFileUpload"
        />
        <button
          class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
          @click="triggerFileInput"
        >
          <DocumentArrowUpIcon class="w-4 h-4 mr-2" />
          Seleccionar Archivo
        </button>
      </div>

      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Comunicación Masiva
        </h3>
        <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">
          Envía emails o WhatsApp a grupos
        </p>
        <div class="space-y-2">
          <button
            class="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
            @click="openBulkEmailModal"
          >
            <EnvelopeIcon class="w-4 h-4 mr-2" />
            Email Masivo
          </button>
          <button
            class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
            @click="openBulkWhatsAppModal"
          >
            <ChatBubbleLeftRightIcon class="w-4 h-4 mr-2" />
            WhatsApp Masivo
          </button>
        </div>
      </div>

      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Reportes y Análisis
        </h3>
        <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">
          Genera reportes y análisis predictivos
        </p>
        <div class="space-y-2">
          <button
            class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
            @click="generateProgressReport"
          >
            <ChartBarIcon class="w-4 h-4 mr-2" />
            Reporte de Progreso
          </button>
          <button
            class="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
            @click="performDropoutAnalysis"
          >
            <ExclamationTriangleIcon class="w-4 h-4 mr-2" />
            Análisis de Deserción
          </button>
        </div>
      </div>
    </div>

    <!-- Students Table -->
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
    >
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Lista de Estudiantes</h3>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                <input
                  type="checkbox"
                  :checked="allStudentsSelected"
                  class="rounded border-gray-300"
                  @change="toggleAllStudents"
                />
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Estudiante
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Contacto
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Estado
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Última Actividad
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="student in paginatedStudents"
              :key="student.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td class="px-6 py-4">
                <input
                  type="checkbox"
                  :checked="selectedStudents.includes(student.id)"
                  class="rounded border-gray-300"
                  @change="toggleStudent(student.id)"
                />
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div
                      class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center"
                    >
                      <span class="text-sm font-medium text-gray-700">
                        {{ student.nombre.charAt(0) + student.apellido.charAt(0) }}
                      </span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ student.nombre }} {{ student.apellido }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">ID: {{ student.id }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900 dark:text-white">{{ student.email }}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ student.phone || "Sin teléfono" }}
                </div>
              </td>
              <td class="px-6 py-4">
                <span
                  :class="{
                    'bg-green-100 text-green-800': student.activo,
                    'bg-red-100 text-red-800': !student.activo,
                  }"
                  class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                >
                  {{ student.activo ? "Activo" : "Inactivo" }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                {{ formatDate(student.updatedAt) }}
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center space-x-2">
                  <button class="text-blue-600 hover:text-blue-900" @click="editStudent(student)">
                    <PencilIcon class="w-4 h-4" />
                  </button>
                  <button
                    class="text-gray-600 hover:text-gray-900"
                    @click="viewStudentDetails(student)"
                  >
                    <EyeIcon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        class="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between"
      >
        <div class="text-sm text-gray-700 dark:text-gray-300">
          Mostrando {{ startIndex + 1 }} a {{ endIndex }} de
          {{ filteredStudents.length }} estudiantes
        </div>
        <div class="flex items-center space-x-2">
          <button
            :disabled="currentPage === 1"
            class="px-3 py-1 text-sm bg-white border border-gray-300 rounded disabled:opacity-50"
            @click="previousPage"
          >
            Anterior
          </button>
          <span class="px-3 py-1 text-sm"> Página {{ currentPage }} de {{ totalPages }} </span>
          <button
            :disabled="currentPage === totalPages"
            class="px-3 py-1 text-sm bg-white border border-gray-300 rounded disabled:opacity-50"
            @click="nextPage"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div
      v-if="isLoading"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 flex items-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4" />
        <span class="text-gray-900">{{ loadingMessage }}</span>
      </div>
    </div>

    <!-- Modals -->
    <BulkEmailModal
      v-if="showBulkEmailModal"
      :students="selectedStudentsList"
      @close="showBulkEmailModal = false"
      @send="handleBulkEmail"
    />

    <BulkWhatsAppModal
      v-if="showBulkWhatsAppModal"
      :students="selectedStudentsList"
      @close="showBulkWhatsAppModal = false"
      @send="handleBulkWhatsApp"
    />

    <ImportResultModal
      v-if="showImportResultModal"
      :result="importResult"
      @close="showImportResultModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {useAdminStudentsStore} from "../store/adminStudents"
import {AdvancedStudentsService, type ImportResult} from "../services/advancedStudents"
import type {Student} from "../../Students/types/student"
import {
  ArrowPathIcon,
  DocumentArrowUpIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  EyeIcon,
} from "@heroicons/vue/24/outline"

// Components
import BulkEmailModal from "./modals/BulkEmailModal.vue"
import BulkWhatsAppModal from "./modals/BulkWhatsAppModal.vue"
import ImportResultModal from "./modals/ImportResultModal.vue"

// Store
const studentsStore = useAdminStudentsStore()

// Service
const advancedService = new AdvancedStudentsService()

// Reactive data
const isLoading = ref(false)
const loadingMessage = ref("")
const selectedStudents = ref<string[]>([])
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Modal states
const showBulkEmailModal = ref(false)
const showBulkWhatsAppModal = ref(false)
const showImportResultModal = ref(false)

// Import result
const importResult = ref<ImportResult>({
  success: false,
  imported: 0,
  failed: 0,
  errors: [],
  duplicates: 0,
})

// File input ref
const fileInput = ref<HTMLInputElement>()

// Computed
const filteredStudents = computed(() => studentsStore.students)

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredStudents.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredStudents.value.length / itemsPerPage.value))

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value)

const endIndex = computed(() =>
  Math.min(startIndex.value + itemsPerPage.value, filteredStudents.value.length)
)

const allStudentsSelected = computed(
  () =>
    selectedStudents.value.length === paginatedStudents.value.length &&
    paginatedStudents.value.length > 0
)

const selectedStudentsList = computed(() =>
  studentsStore.students.filter((s) => selectedStudents.value.includes(s.id))
)

// Methods
const refreshData = async () => {
  isLoading.value = true
  loadingMessage.value = "Actualizando datos..."
  try {
    await studentsStore.fetchStudents()
  } finally {
    isLoading.value = false
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileUpload = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  isLoading.value = true
  loadingMessage.value = "Importando estudiantes..."

  try {
    const result = await advancedService.importStudents(file)
    importResult.value = result
    showImportResultModal.value = true

    if (result.success) {
      await refreshData()
    }
  } catch (error) {
    console.error("Error importing students:", error)
  } finally {
    isLoading.value = false
    if (fileInput.value) {
      fileInput.value.value = ""
    }
  }
}

const toggleStudent = (studentId: string) => {
  const index = selectedStudents.value.indexOf(studentId)
  if (index > -1) {
    selectedStudents.value.splice(index, 1)
  } else {
    selectedStudents.value.push(studentId)
  }
}

const toggleAllStudents = () => {
  if (allStudentsSelected.value) {
    selectedStudents.value = []
  } else {
    selectedStudents.value = paginatedStudents.value.map((s) => s.id)
  }
}

const openBulkEmailModal = () => {
  if (selectedStudents.value.length === 0) {
    alert("Selecciona al menos un estudiante")
    return
  }
  showBulkEmailModal.value = true
}

const openBulkWhatsAppModal = () => {
  if (selectedStudents.value.length === 0) {
    alert("Selecciona al menos un estudiante")
    return
  }
  showBulkWhatsAppModal.value = true
}

const handleBulkEmail = async (message: any) => {
  isLoading.value = true
  loadingMessage.value = "Enviando emails..."

  try {
    await advancedService.sendBulkEmail(selectedStudents.value, message)
    showBulkEmailModal.value = false
    selectedStudents.value = []
  } catch (error) {
    console.error("Error sending bulk email:", error)
  } finally {
    isLoading.value = false
  }
}

const handleBulkWhatsApp = async (message: string) => {
  isLoading.value = true
  loadingMessage.value = "Enviando mensajes de WhatsApp..."

  try {
    await advancedService.sendBulkWhatsApp(selectedStudents.value, message)
    showBulkWhatsAppModal.value = false
    selectedStudents.value = []
  } catch (error) {
    console.error("Error sending bulk WhatsApp:", error)
  } finally {
    isLoading.value = false
  }
}

const generateProgressReport = async () => {
  isLoading.value = true
  loadingMessage.value = "Generando reporte de progreso..."

  try {
    const report = await advancedService.generateProgressReport(selectedStudents.value)
    console.log("Progress report generated:", report)
    // TODO: Show report modal or download
  } catch (error) {
    console.error("Error generating progress report:", error)
  } finally {
    isLoading.value = false
  }
}

const performDropoutAnalysis = async () => {
  isLoading.value = true
  loadingMessage.value = "Realizando análisis de deserción..."

  try {
    const analysis = await advancedService.performDropoutAnalysis()
    console.log("Dropout analysis completed:", analysis)
    // TODO: Show analysis modal
  } catch (error) {
    console.error("Error performing dropout analysis:", error)
  } finally {
    isLoading.value = false
  }
}

const editStudent = (student: Student) => {
  console.log("Edit student:", student)
  // TODO: Open edit modal
}

const viewStudentDetails = (student: Student) => {
  console.log("View student details:", student)
  // TODO: Open details modal
}

const formatDate = (date: Date | string) => {
  if (!date) return "N/A"
  return new Date(date).toLocaleDateString("es-ES")
}

// Pagination
const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

// Lifecycle
onMounted(async () => {
  await refreshData()
})
</script>
