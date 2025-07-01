<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Overlay -->
    <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="closeModal" />

    <!-- Modal -->
    <div class="flex min-h-full items-center justify-center p-4">
      <div
        class="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <div class="flex items-center space-x-3">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center text-white"
              :class="getActionTypeClass(actionType)"
            >
              <svg
                class="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                v-html="getActionIcon(actionType)"
              />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">{{ getActionTitle(actionType) }}</h3>
              <p class="text-sm text-gray-500">
                {{ selectedItems.length }} elemento(s) seleccionado(s)
              </p>
            </div>
          </div>
          <button class="text-gray-400 hover:text-gray-600 transition-colors" @click="closeModal">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 max-h-96 overflow-y-auto">
          <!-- Selected items preview -->
          <div class="mb-6">
            <h4 class="text-sm font-medium text-gray-900 mb-3">Elementos seleccionados:</h4>
            <div class="space-y-2 max-h-32 overflow-y-auto">
              <div
                v-for="item in selectedItems"
                :key="item.id"
                class="flex items-center space-x-3 p-2 bg-gray-50 rounded-md"
              >
                <div class="flex-shrink-0">
                  <img
                    v-if="item.avatar"
                    :src="item.avatar"
                    :alt="item.name"
                    class="w-8 h-8 rounded-full object-cover"
                  />
                  <div
                    v-else
                    class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center"
                  >
                    <svg class="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fill-rule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ item.name }}</p>
                  <p class="text-xs text-gray-500 truncate">{{ item.email || item.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Action-specific form -->
          <div v-if="actionType === 'delete'" class="mb-6">
            <div class="bg-red-50 border border-red-200 rounded-md p-4">
              <div class="flex">
                <svg class="w-5 h-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  />
                </svg>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800">¡Atención!</h3>
                  <p class="text-sm text-red-700 mt-1">
                    Esta acción eliminará permanentemente los elementos seleccionados. Esta
                    operación no se puede deshacer.
                  </p>
                </div>
              </div>
            </div>

            <div class="mt-4">
              <label class="flex items-center">
                <input
                  v-model="confirmDelete"
                  type="checkbox"
                  class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <span class="ml-2 text-sm text-gray-900">
                  Confirmo que deseo eliminar estos elementos permanentemente
                </span>
              </label>
            </div>
          </div>

          <div v-if="actionType === 'export'" class="mb-6">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >Formato de exportación</label
                >
                <select
                  v-model="exportFormat"
                  class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="csv">CSV (Excel compatible)</option>
                  <option value="xlsx">Excel (.xlsx)</option>
                  <option value="pdf">PDF</option>
                  <option value="json">JSON</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Campos a incluir</label>
                <div class="space-y-2">
                  <label v-for="field in exportFields" :key="field.id" class="flex items-center">
                    <input
                      v-model="selectedExportFields"
                      :value="field.id"
                      type="checkbox"
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span class="ml-2 text-sm text-gray-900">{{ field.label }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div v-if="actionType === 'assign'" class="mb-6">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Asignar a</label>
                <select
                  v-model="assignTo"
                  class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar...</option>
                  <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
                    {{ teacher.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Fecha de inicio</label>
                <input
                  v-model="assignmentDate"
                  type="date"
                  class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Notas (opcional)</label>
                <textarea
                  v-model="assignmentNotes"
                  rows="3"
                  class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Notas adicionales sobre la asignación..."
                />
              </div>
            </div>
          </div>

          <div v-if="actionType === 'notify'" class="mb-6">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >Tipo de notificación</label
                >
                <select
                  v-model="notificationType"
                  class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="push">Notificación Push</option>
                  <option value="all">Todos los medios</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Asunto</label>
                <input
                  v-model="notificationSubject"
                  type="text"
                  class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Asunto de la notificación"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Mensaje</label>
                <textarea
                  v-model="notificationMessage"
                  rows="4"
                  class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Escribe tu mensaje aquí..."
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50"
        >
          <button
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            @click="closeModal"
          >
            Cancelar
          </button>
          <button
            :disabled="!canExecute"
            class="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors"
            :class="[
              canExecute
                ? `${getActionButtonClass(actionType)} hover:opacity-90`
                : 'bg-gray-300 cursor-not-allowed',
            ]"
            @click="executeAction"
          >
            {{ getActionButtonText(actionType) }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, watch} from "vue"

interface SelectedItem {
  id: string
  name: string
  email?: string
  description?: string
  avatar?: string
}

interface Teacher {
  id: string
  name: string
}

interface ExportField {
  id: string
  label: string
}

const props = defineProps<{
  isOpen: boolean
  actionType: "delete" | "export" | "assign" | "notify" | "archive"
  selectedItems: SelectedItem[]
  teachers?: Teacher[]
}>()

const emit = defineEmits<{
  close: []
  execute: [actionType: string, data: any]
}>()

// State
const confirmDelete = ref(false)
const exportFormat = ref("csv")
const selectedExportFields = ref<string[]>(["name", "email"])
const assignTo = ref("")
const assignmentDate = ref("")
const assignmentNotes = ref("")
const notificationType = ref("email")
const notificationSubject = ref("")
const notificationMessage = ref("")

const exportFields: ExportField[] = [
  {id: "name", label: "Nombre"},
  {id: "email", label: "Email"},
  {id: "phone", label: "Teléfono"},
  {id: "status", label: "Estado"},
  {id: "created_at", label: "Fecha de registro"},
  {id: "last_access", label: "Último acceso"},
]

// Computed
const canExecute = computed(() => {
  switch (props.actionType) {
    case "delete":
      return confirmDelete.value
    case "export":
      return selectedExportFields.value.length > 0
    case "assign":
      return assignTo.value && assignmentDate.value
    case "notify":
      return notificationSubject.value && notificationMessage.value
    default:
      return true
  }
})

// Methods
const closeModal = () => {
  resetForm()
  emit("close")
}

const executeAction = () => {
  if (!canExecute.value) return

  const data = {
    items: props.selectedItems,
    ...getActionData(),
  }

  emit("execute", props.actionType, data)
  closeModal()
}

const getActionData = () => {
  switch (props.actionType) {
    case "export":
      return {
        format: exportFormat.value,
        fields: selectedExportFields.value,
      }
    case "assign":
      return {
        teacherId: assignTo.value,
        startDate: assignmentDate.value,
        notes: assignmentNotes.value,
      }
    case "notify":
      return {
        type: notificationType.value,
        subject: notificationSubject.value,
        message: notificationMessage.value,
      }
    default:
      return {}
  }
}

const resetForm = () => {
  confirmDelete.value = false
  exportFormat.value = "csv"
  selectedExportFields.value = ["name", "email"]
  assignTo.value = ""
  assignmentDate.value = ""
  assignmentNotes.value = ""
  notificationType.value = "email"
  notificationSubject.value = ""
  notificationMessage.value = ""
}

const getActionTitle = (type: string) => {
  const titles = {
    delete: "Eliminar elementos",
    export: "Exportar datos",
    assign: "Asignar estudiantes",
    notify: "Enviar notificación",
    archive: "Archivar elementos",
  }
  return titles[type as keyof typeof titles] || "Acción masiva"
}

const getActionIcon = (type: string) => {
  const icons = {
    delete:
      '<path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>',
    export:
      '<path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>',
    assign:
      '<path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>',
    notify:
      '<path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>',
    archive:
      '<path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z"/><path fill-rule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clip-rule="evenodd"/>',
  }
  return icons[type as keyof typeof icons] || ""
}

const getActionTypeClass = (type: string) => {
  const classes = {
    delete: "bg-red-500",
    export: "bg-blue-500",
    assign: "bg-green-500",
    notify: "bg-purple-500",
    archive: "bg-yellow-500",
  }
  return classes[type as keyof typeof classes] || "bg-gray-500"
}

const getActionButtonClass = (type: string) => {
  const classes = {
    delete: "bg-red-600",
    export: "bg-blue-600",
    assign: "bg-green-600",
    notify: "bg-purple-600",
    archive: "bg-yellow-600",
  }
  return classes[type as keyof typeof classes] || "bg-gray-600"
}

const getActionButtonText = (type: string) => {
  const texts = {
    delete: "Eliminar",
    export: "Exportar",
    assign: "Asignar",
    notify: "Enviar",
    archive: "Archivar",
  }
  return texts[type as keyof typeof texts] || "Ejecutar"
}

// Watch for modal changes to reset form
watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
      resetForm()
    }
  }
)
</script>
