<!-- Editor de Plantillas de Mensajes -->
<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              🎨 Editor de Plantillas
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-2">
              Gestiona y personaliza las plantillas de mensajes para notificaciones
            </p>
          </div>
          <button
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            @click="showCreateModal = true"
          >
            ➕ Nueva Plantilla
          </button>
        </div>
      </div>

      <!-- Filtros y búsqueda -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6"
      >
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex-1 min-w-64">
            <input
              v-model="searchTerm"
              type="text"
              placeholder="Buscar plantillas..."
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <select
            v-model="selectedCategory"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todas las categorías</option>
            <option value="tardanza">Tardanza</option>
            <option value="ausencia_justificada">Ausencia Justificada</option>
            <option value="inasistencia">Inasistencia</option>
            <option value="general">General</option>
            <option value="custom">Personalizada</option>
          </select>
          <select
            v-model="selectedStatus"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
            <option value="system">Del Sistema</option>
            <option value="custom">Personalizadas</option>
          </select>
        </div>
      </div>

      <!-- Lista de plantillas -->
      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div
          v-for="template in filteredTemplates"
          :key="template.id"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
        >
          <!-- Header de la tarjeta -->
          <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 dark:text-white text-sm">
                  {{ template.name }}
                </h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {{ template.description }}
                </p>
              </div>
              <div class="flex items-center space-x-2 ml-3">
                <!-- Badge de categoría -->
                <span
                  :class="getCategoryBadgeClass(template.category)"
                  class="px-2 py-1 text-xs font-medium rounded-full"
                >
                  {{ getCategoryLabel(template.category) }}
                </span>
                <!-- Badge de sistema -->
                <span
                  v-if="template.isSystem"
                  class="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                >
                  Sistema
                </span>
              </div>
            </div>
          </div>

          <!-- Contenido de la tarjeta -->
          <div class="p-4">
            <!-- Preview del contenido -->
            <div class="mb-4">
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Vista previa:</p>
              <div class="bg-gray-50 dark:bg-gray-700 rounded-md p-3 text-xs">
                <p class="text-gray-700 dark:text-gray-300 line-clamp-3">
                  {{ getPreviewText(template) }}
                </p>
              </div>
            </div>

            <!-- Estadísticas -->
            <div class="grid grid-cols-2 gap-4 mb-4 text-xs">
              <div>
                <p class="text-gray-500 dark:text-gray-400">Enviados</p>
                <p class="font-semibold text-gray-900 dark:text-white">
                  {{ template.usage.totalSent }}
                </p>
              </div>
              <div>
                <p class="text-gray-500 dark:text-gray-400">Éxito</p>
                <p class="font-semibold text-gray-900 dark:text-white">
                  {{ (template.usage.successRate * 100).toFixed(1) }}%
                </p>
              </div>
            </div>

            <!-- Escalación -->
            <div v-if="template.escalationLevel" class="mb-4">
              <div class="flex items-center space-x-2">
                <span class="text-xs text-gray-500 dark:text-gray-400">Nivel:</span>
                <div class="flex space-x-1">
                  <div
                    v-for="level in 4"
                    :key="level"
                    :class="
                      level <= template.escalationLevel
                        ? 'bg-red-500'
                        : 'bg-gray-200 dark:bg-gray-600'
                    "
                    class="w-2 h-2 rounded-full"
                  />
                </div>
                <span class="text-xs font-medium text-red-600">
                  Nivel {{ template.escalationLevel }}
                </span>
              </div>
            </div>

            <!-- Estado -->
            <div class="flex items-center justify-between mb-4">
              <span
                :class="
                  template.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                "
                class="px-2 py-1 text-xs font-medium rounded-full"
              >
                {{ template.isActive ? "Activa" : "Inactiva" }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ template.variables.length }} variables
              </span>
            </div>
          </div>

          <!-- Acciones -->
          <div class="px-4 pb-4">
            <div class="flex space-x-2">
              <button
                class="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-md text-xs font-medium transition-colors"
                @click="editTemplate(template)"
              >
                ✏️ Editar
              </button>
              <button
                class="bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-md text-xs font-medium transition-colors"
                @click="previewTemplate(template)"
              >
                👁️ Preview
              </button>
              <button
                class="bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-2 rounded-md text-xs font-medium transition-colors"
                @click="duplicateTemplate(template)"
              >
                📋 Copiar
              </button>
              <button
                v-if="!template.isSystem"
                class="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-md text-xs font-medium transition-colors"
                @click="deleteTemplate(template)"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado vacío -->
      <div v-if="filteredTemplates.length === 0" class="text-center py-12">
        <div class="text-gray-500 dark:text-gray-400">
          <span class="text-4xl mb-4 block">📄</span>
          <h3 class="text-lg font-medium mb-2">No se encontraron plantillas</h3>
          <p class="text-sm">Crea una nueva plantilla o ajusta los filtros de búsqueda.</p>
        </div>
      </div>
    </div>

    <!-- Modal de creación/edición -->
    <TemplateEditorModal
      v-if="showCreateModal || editingTemplate"
      :template="editingTemplate"
      :is-editing="!!editingTemplate"
      @close="closeModal"
      @save="handleSave"
    />

    <!-- Modal de preview -->
    <TemplatePreviewModal
      v-if="previewingTemplate"
      :template="previewingTemplate"
      @close="previewingTemplate = null"
    />
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {templateManager, type MessageTemplate} from "../../services/templates/templateManager"
import TemplateEditorModal from "./TemplateEditorModal.vue"
import TemplatePreviewModal from "./TemplatePreviewModal.vue"

// Estado reactivo
const templates = ref<MessageTemplate[]>([])
const loading = ref(false)
const searchTerm = ref("")
const selectedCategory = ref("")
const selectedStatus = ref("")
const showCreateModal = ref(false)
const editingTemplate = ref<MessageTemplate | null>(null)
const previewingTemplate = ref<MessageTemplate | null>(null)

// Computed
const filteredTemplates = computed(() => {
  let filtered = templates.value

  // Filtro por búsqueda
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    filtered = filtered.filter(
      (template) =>
        template.name.toLowerCase().includes(term) ||
        template.description.toLowerCase().includes(term) ||
        template.content.toLowerCase().includes(term)
    )
  }

  // Filtro por categoría
  if (selectedCategory.value) {
    filtered = filtered.filter((template) => template.category === selectedCategory.value)
  }

  // Filtro por estado
  if (selectedStatus.value) {
    switch (selectedStatus.value) {
      case "active":
        filtered = filtered.filter((template) => template.isActive)
        break
      case "inactive":
        filtered = filtered.filter((template) => !template.isActive)
        break
      case "system":
        filtered = filtered.filter((template) => template.isSystem)
        break
      case "custom":
        filtered = filtered.filter((template) => !template.isSystem)
        break
    }
  }

  return filtered
})

// Métodos
const loadTemplates = async (): Promise<void> => {
  loading.value = true
  try {
    templates.value = await templateManager.getAllTemplates()
  } catch (error) {
    console.error("Error cargando plantillas:", error)
  } finally {
    loading.value = false
  }
}

const getCategoryBadgeClass = (category: string): string => {
  switch (category) {
    case "tardanza":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    case "ausencia_justificada":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    case "inasistencia":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    case "general":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  }
}

const getCategoryLabel = (category: string): string => {
  switch (category) {
    case "tardanza":
      return "Tardanza"
    case "ausencia_justificada":
      return "Justificada"
    case "inasistencia":
      return "Inasistencia"
    case "general":
      return "General"
    case "custom":
      return "Personalizada"
    default:
      return "Otra"
  }
}

const getPreviewText = (template: MessageTemplate): string => {
  // Reemplazar variables con valores de ejemplo para preview
  let preview = template.content
  preview = preview.replace(/\{studentName\}/g, "María González")
  preview = preview.replace(/\{className\}/g, "Violín Intermedio")
  preview = preview.replace(/\{date\}/g, new Date().toLocaleDateString("es-ES"))
  preview = preview.replace(/\{academyName\}/g, "Academia Musical El Sistema")

  return preview.length > 150 ? preview.substring(0, 150) + "..." : preview
}

const editTemplate = (template: MessageTemplate): void => {
  editingTemplate.value = {...template}
}

const previewTemplate = (template: MessageTemplate): void => {
  previewingTemplate.value = template
}

const duplicateTemplate = async (template: MessageTemplate): Promise<void> => {
  try {
    const newId = await templateManager.duplicateTemplate(template.id!)
    if (newId) {
      await loadTemplates()
      alert("✅ Plantilla duplicada exitosamente")
    }
  } catch (error) {
    console.error("Error duplicando plantilla:", error)
    alert("❌ Error duplicando plantilla")
  }
}

const deleteTemplate = async (template: MessageTemplate): Promise<void> => {
  if (!confirm(`¿Eliminar la plantilla "${template.name}"? Esta acción no se puede deshacer.`)) {
    return
  }

  try {
    const success = await templateManager.deleteTemplate(template.id!)
    if (success) {
      await loadTemplates()
      alert("✅ Plantilla eliminada exitosamente")
    }
  } catch (error) {
    console.error("Error eliminando plantilla:", error)
    alert("❌ Error eliminando plantilla")
  }
}

const closeModal = (): void => {
  showCreateModal.value = false
  editingTemplate.value = null
}

const handleSave = async (): Promise<void> => {
  await loadTemplates()
  closeModal()
}

// Lifecycle
onMounted(async () => {
  await templateManager.initializeDefaultTemplates()
  await loadTemplates()
})
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
