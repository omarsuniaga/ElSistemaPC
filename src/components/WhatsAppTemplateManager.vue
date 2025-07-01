<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[95vh] overflow-hidden"
    >
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div
              class="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-4"
            >
              <span class="text-2xl">✏️</span>
            </div>
            <div>
              <h2 class="text-2xl font-bold">Gestión de Plantillas WhatsApp</h2>
              <p class="text-blue-100">Crear y editar mensajes personalizados</p>
            </div>
          </div>

          <button class="text-white hover:text-blue-200 transition-colors p-2" @click="closeModal">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex h-[calc(95vh-150px)]">
        <!-- Sidebar - Lista de plantillas -->
        <div class="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div class="p-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Plantillas</h3>
              <button
                class="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                @click="createNewTemplate"
              >
                <PlusIcon class="w-4 h-4 inline mr-1" />
                Nueva
              </button>
            </div>

            <!-- Filtros por categoría -->
            <div class="mb-4">
              <select
                v-model="selectedCategory"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todas las categorías</option>
                <option value="disciplinary">Disciplinarias</option>
                <option value="administrative">Administrativas</option>
                <option value="reminder">Recordatorios</option>
                <option value="custom">Personalizadas</option>
              </select>
            </div>

            <!-- Lista de plantillas -->
            <div class="space-y-2">
              <div
                v-for="template in filteredTemplates"
                :key="template.id"
                :class="[
                  'p-3 border rounded-lg cursor-pointer transition-all',
                  selectedTemplate?.id === template.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700',
                ]"
                @click="selectTemplate(template)"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="font-medium text-sm text-gray-900 dark:text-white">{{
                    template.name
                  }}</span>
                  <span
                    class="text-xs px-2 py-1 rounded-full"
                    :class="getCategoryClass(template.category)"
                  >
                    {{ getCategoryLabel(template.category) }}
                  </span>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {{ template.template.substring(0, 80) }}...
                </p>
                <div class="flex items-center justify-between mt-2">
                  <span class="text-xs text-gray-400">
                    {{ template.isSystem ? "Sistema" : "Personalizada" }}
                  </span>
                  <div class="flex space-x-1">
                    <button
                      v-if="!template.isSystem"
                      class="p-1 text-blue-600 hover:text-blue-800"
                      @click.stop="editTemplate(template)"
                    >
                      <PencilIcon class="w-3 h-3" />
                    </button>
                    <button
                      v-if="!template.isSystem"
                      class="p-1 text-red-600 hover:text-red-800"
                      @click.stop="deleteTemplate(template.id)"
                    >
                      <TrashIcon class="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content - Editor de plantillas -->
        <div class="flex-1 flex flex-col">
          <div class="p-6 overflow-y-auto">
            <div
              v-if="!selectedTemplate && !isCreating"
              class="text-center py-12 text-gray-500 dark:text-gray-400"
            >
              <span class="text-6xl mb-4 block">📝</span>
              <h3 class="text-lg font-medium mb-2">Selecciona una plantilla</h3>
              <p>Elige una plantilla de la lista para ver su contenido o crea una nueva.</p>
            </div>

            <!-- Editor de plantilla -->
            <div v-else class="space-y-6">
              <!-- Información básica -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre de la plantilla *
                  </label>
                  <input
                    v-model="templateForm.name"
                    type="text"
                    placeholder="Ej: Llamado de atención personalizado"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    :disabled="selectedTemplate?.isSystem && !isCreating"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Categoría *
                  </label>
                  <select
                    v-model="templateForm.category"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    :disabled="selectedTemplate?.isSystem && !isCreating"
                  >
                    <option value="disciplinary">Disciplinaria</option>
                    <option value="administrative">Administrativa</option>
                    <option value="reminder">Recordatorio</option>
                    <option value="custom">Personalizada</option>
                  </select>
                </div>
              </div>

              <!-- Variables disponibles -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Variables disponibles
                </label>
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Puedes usar estas variables en tu mensaje. Se reemplazarán automáticamente:
                  </p>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <button
                      v-for="variable in availableVariables"
                      :key="variable.key"
                      class="text-left p-2 bg-white dark:bg-gray-600 rounded border text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      :title="variable.description"
                      @click="insertVariable(variable.key)"
                    >
                      <code class="text-blue-600 dark:text-blue-400">{{ variable.key }}</code>
                      <br />
                      <span class="text-gray-500 dark:text-gray-400">{{ variable.label }}</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Editor de mensaje -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mensaje de la plantilla *
                </label>
                <textarea
                  ref="messageTextarea"
                  v-model="templateForm.template"
                  rows="12"
                  placeholder="Escribe tu mensaje aquí. Usa las variables como {studentName}, {className}, etc."
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white font-mono text-sm"
                  :disabled="selectedTemplate?.isSystem && !isCreating"
                />
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Usa formato WhatsApp: *negrita*, _cursiva_, ~tachado~
                </p>
              </div>

              <!-- Vista previa -->
              <div v-if="templateForm.template">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Vista previa
                </label>
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border">
                  <div class="bg-white dark:bg-gray-600 rounded-lg p-3 max-w-md">
                    <div class="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
                      {{ previewMessage }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Botones de acción -->
              <div
                class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700"
              >
                <button
                  class="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  @click="cancelEdit"
                >
                  Cancelar
                </button>
                <button
                  v-if="!selectedTemplate?.isSystem"
                  :disabled="!isFormValid || saving"
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  @click="saveTemplate"
                >
                  {{ saving ? "Guardando..." : isCreating ? "Crear Plantilla" : "Guardar Cambios" }}
                </button>
                <button
                  v-if="selectedTemplate?.isSystem"
                  class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  @click="duplicateTemplate"
                >
                  Duplicar como Personalizada
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, watch, nextTick} from "vue"
import {XMarkIcon, PlusIcon, PencilIcon, TrashIcon} from "@heroicons/vue/24/outline"
import {
  useWhatsAppPresets,
  type WhatsAppPreset,
  type MessageData,
} from "../composables/useWhatsAppPresets"

interface Props {
  isOpen: boolean
}

interface Emits {
  (e: "close"): void
  (e: "template-created", template: WhatsAppPreset): void
  (e: "template-updated", template: WhatsAppPreset): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const {
  presets,
  loading,
  error,
  loadPresets,
  addPreset,
  updatePreset,
  deletePreset,
  processTemplate,
} = useWhatsAppPresets()

// Estados del componente
const selectedTemplate = ref<WhatsAppPreset | null>(null)
const selectedCategory = ref<string>("")
const isCreating = ref(false)
const saving = ref(false)
const messageTextarea = ref<HTMLTextAreaElement>()

// Formulario de plantilla
const templateForm = ref({
  name: "",
  category: "custom" as "disciplinary" | "administrative" | "reminder" | "custom",
  template: "",
  isActive: true,
  order: 999,
})

// Variables disponibles
const availableVariables = [
  {
    key: "{studentName}",
    label: "Nombre del estudiante",
    description: "Nombre completo del estudiante",
  },
  {
    key: "{representanteName}",
    label: "Nombre del representante",
    description: "Nombre del padre/madre/representante",
  },
  {
    key: "{representantePhone}",
    label: "Teléfono",
    description: "Número de teléfono del representante",
  },
  {key: "{className}", label: "Clase", description: "Nombre de la clase o materia"},
  {key: "{date}", label: "Fecha", description: "Fecha actual"},
  {key: "{absences}", label: "Ausencias", description: "Número de ausencias"},
  {key: "{teacherName}", label: "Maestro", description: "Nombre del maestro"},
  {key: "{institutionName}", label: "Institución", description: "Nombre de la institución"},
  {key: "{startDate}", label: "Fecha de inicio", description: "Fecha de inicio del período"},
  {key: "{endDate}", label: "Fecha de fin", description: "Fecha de fin del período"},
  {
    key: "{attendanceRate}",
    label: "Porcentaje de asistencia",
    description: "Porcentaje de asistencia del estudiante",
  },
  {
    key: "{absenceDetails}",
    label: "Detalles de ausencias",
    description: "Detalles específicos de las ausencias",
  },
]

// Datos de ejemplo para vista previa
const sampleData: MessageData = {
  studentName: "Juan Pérez",
  representanteName: "María Pérez",
  representantePhone: "+58 412-123-4567",
  className: "Piano Intermedio",
  date: new Date().toLocaleDateString("es-ES"),
  absences: 3,
  teacherName: "Prof. García",
  institutionName: "Academia de Música",
  startDate: "01/01/2024",
  endDate: "31/03/2024",
  attendanceRate: 75,
  absenceDetails: "Ausencias: 05/01/2024, 12/01/2024, 19/01/2024",
}

// Computed properties
const filteredTemplates = computed(() => {
  if (!selectedCategory.value) return presets.value
  return presets.value.filter((template) => template.category === selectedCategory.value)
})

const previewMessage = computed(() => {
  if (!templateForm.value.template) return ""
  return processTemplate(templateForm.value.template, sampleData)
})

const isFormValid = computed(() => {
  return (
    templateForm.value.name.trim() &&
    templateForm.value.template.trim() &&
    templateForm.value.category
  )
})

// Métodos
const closeModal = () => {
  selectedTemplate.value = null
  isCreating.value = false
  resetForm()
  emit("close")
}

const createNewTemplate = () => {
  selectedTemplate.value = null
  isCreating.value = true
  resetForm()
}

const selectTemplate = (template: WhatsAppPreset) => {
  selectedTemplate.value = template
  isCreating.value = false
  fillForm(template)
}

const editTemplate = (template: WhatsAppPreset) => {
  if (template.isSystem) return
  selectTemplate(template)
}

const resetForm = () => {
  templateForm.value = {
    name: "",
    category: "custom" as "disciplinary" | "administrative" | "reminder" | "custom",
    template: "",
    isActive: true,
    order: 999,
  }
}

const fillForm = (template: WhatsAppPreset) => {
  templateForm.value = {
    name: template.name,
    category: template.category,
    template: template.template,
    isActive: template.isActive,
    order: template.order,
  }
}

const insertVariable = (variableKey: string) => {
  if (!messageTextarea.value) return

  const textarea = messageTextarea.value
  const startPos = textarea.selectionStart
  const endPos = textarea.selectionEnd
  const textBefore = templateForm.value.template.substring(0, startPos)
  const textAfter = templateForm.value.template.substring(endPos)

  templateForm.value.template = textBefore + variableKey + textAfter

  nextTick(() => {
    textarea.focus()
    textarea.setSelectionRange(startPos + variableKey.length, startPos + variableKey.length)
  })
}

const saveTemplate = async () => {
  if (!isFormValid.value) return

  saving.value = true

  try {
    const templateData = {
      name: templateForm.value.name,
      category: templateForm.value.category,
      template: templateForm.value.template,
      variables: extractVariables(templateForm.value.template),
      isActive: templateForm.value.isActive,
      isSystem: false,
      order: templateForm.value.order,
      createdBy: "",
    }

    if (isCreating.value) {
      await addPreset(templateData)
      emit("template-created", {
        ...templateData,
        id: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    } else if (selectedTemplate.value && !selectedTemplate.value.isSystem) {
      await updatePreset(selectedTemplate.value.id, templateData)
      emit("template-updated", {
        ...templateData,
        id: selectedTemplate.value.id,
        createdAt: selectedTemplate.value.createdAt,
        updatedAt: new Date(),
      })
    }

    isCreating.value = false
    selectedTemplate.value = null
    resetForm()
  } catch (err) {
    console.error("Error saving template:", err)
    alert("Error al guardar la plantilla")
  } finally {
    saving.value = false
  }
}

const duplicateTemplate = async () => {
  if (!selectedTemplate.value) return

  templateForm.value.name = `${selectedTemplate.value.name} (Copia)`
  isCreating.value = true
  selectedTemplate.value = null
}

const cancelEdit = () => {
  if (isCreating.value) {
    isCreating.value = false
    selectedTemplate.value = null
  } else if (selectedTemplate.value) {
    fillForm(selectedTemplate.value)
  }
  resetForm()
}

const deleteTemplate = async (templateId: string) => {
  if (!confirm("¿Estás seguro de que quieres eliminar esta plantilla?")) return

  try {
    await deletePreset(templateId)
    if (selectedTemplate.value?.id === templateId) {
      selectedTemplate.value = null
      resetForm()
    }
  } catch (err) {
    console.error("Error deleting template:", err)
    alert("Error al eliminar la plantilla")
  }
}

const extractVariables = (template: string): string[] => {
  const matches = template.match(/{[^}]+}/g)
  return matches ? [...new Set(matches)] : []
}

const getCategoryClass = (category: string) => {
  const classes = {
    disciplinary: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    administrative: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    reminder: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    custom: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  }
  return classes[category as keyof typeof classes] || classes.custom
}

const getCategoryLabel = (category: string) => {
  const labels = {
    disciplinary: "Disciplinaria",
    administrative: "Administrativa",
    reminder: "Recordatorio",
    custom: "Personalizada",
  }
  return labels[category as keyof typeof labels] || "Personalizada"
}

// Watchers
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      loadPresets()
    }
  }
)
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
