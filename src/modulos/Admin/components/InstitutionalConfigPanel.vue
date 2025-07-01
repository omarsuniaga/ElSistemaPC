<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center">
        <BuildingOfficeIcon class="w-6 h-6 mr-2 text-blue-500" />
        Configuración Institucional
      </h3>

      <button
        :disabled="isLoading || isUploading"
        class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
        @click="resetToDefaults"
      >
        Restaurar por defecto
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div
        class="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
      />
      <span class="ml-3 text-gray-600 dark:text-gray-400">Cargando configuración...</span>
    </div>

    <!-- Configuration Form -->
    <div v-else class="space-y-6">
      <!-- Institutional Title -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nombre de la Institución
        </label>
        <div class="relative">
          <input
            v-model="localTitle"
            type="text"
            placeholder="ACADEMIA DE MÚSICA"
            class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            :disabled="isUploading"
            @blur="updateTitleIfChanged"
            @keyup.enter="updateTitleIfChanged"
          />
          <div v-if="isSavingTitle" class="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div
              class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
            />
          </div>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Este nombre aparecerá en los PDFs y documentos oficiales
        </p>
      </div>

      <!-- Logo Upload -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Logo Institucional
        </label>

        <!-- Current Logo Display -->
        <div
          v-if="institutionalLogoUrl"
          class="mb-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"
        >
          <div class="flex items-center space-x-4">
            <img
              :src="institutionalLogoUrl"
              alt="Logo institucional"
              class="w-16 h-16 object-contain border border-gray-200 dark:border-gray-600 rounded-lg bg-white"
            />
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-white">Logo actual</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Se usa en PDFs y documentos</p>
            </div>
            <button
              :disabled="isUploading"
              class="px-3 py-2 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
              @click="removeCurrentLogo"
            >
              Eliminar
            </button>
          </div>
        </div>

        <!-- Upload Area -->
        <div
          class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
          :class="{'border-blue-500 bg-blue-50 dark:bg-blue-900/20': isDragging}"
          @drop="handleDrop"
          @dragover.prevent
          @dragenter.prevent
        >
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFileSelect"
          />

          <div v-if="!isUploading" class="space-y-2">
            <PhotoIcon class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500" />
            <div>
              <button
                class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                @click="$refs.fileInput?.click()"
              >
                Seleccionar archivo
              </button>
              <span class="text-gray-500 dark:text-gray-400"> o arrastra aquí</span>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF hasta 5MB</p>
          </div>

          <div v-else class="space-y-2">
            <div
              class="w-8 h-8 mx-auto border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
            />
            <p class="text-sm text-blue-600 dark:text-blue-400">Subiendo logo...</p>
          </div>
        </div>
      </div>

      <!-- Preview Section -->
      <div
        v-if="institutionalTitle || institutionalLogoUrl"
        class="border-t border-gray-200 dark:border-gray-700 pt-6"
      >
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Vista Previa</h4>
        <div
          class="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"
        >
          <div class="flex items-center space-x-4">
            <div v-if="institutionalLogoUrl" class="flex-shrink-0">
              <img
                :src="institutionalLogoUrl"
                alt="Logo preview"
                class="w-12 h-12 object-contain border border-gray-200 dark:border-gray-600 rounded bg-white"
              />
            </div>
            <div>
              <h5 class="font-bold text-lg text-gray-900 dark:text-white">
                {{ institutionalTitle || "ACADEMIA DE MÚSICA" }}
              </h5>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Así aparecerá en los documentos PDF
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Save Status -->
      <div v-if="saveMessage" class="flex items-center space-x-2 text-sm">
        <CheckCircleIcon v-if="saveMessage.type === 'success'" class="w-4 h-4 text-green-500" />
        <ExclamationCircleIcon v-else class="w-4 h-4 text-red-500" />
        <span
          :class="{
            'text-green-600 dark:text-green-400': saveMessage.type === 'success',
            'text-red-600 dark:text-red-400': saveMessage.type === 'error',
          }"
        >
          {{ saveMessage.text }}
        </span>
      </div>
    </div>

    <!-- Error Display -->
    <div
      v-if="error"
      class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
    >
      <div class="flex items-center space-x-2">
        <ExclamationCircleIcon class="w-5 h-5 text-red-500" />
        <p class="text-sm text-red-700 dark:text-red-400">{{ error }}</p>
        <button
          class="ml-auto text-red-500 hover:text-red-700 dark:hover:text-red-300"
          @click="clearError"
        >
          <XMarkIcon class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, watch} from "vue"
import {
  BuildingOfficeIcon,
  PhotoIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XMarkIcon,
} from "@heroicons/vue/24/outline"
import {useInstitutionalConfigStore} from "../store/institutionalConfig"

// Store
const configStore = useInstitutionalConfigStore()

// Local state
const localTitle = ref("")
const isSavingTitle = ref(false)
const isDragging = ref(false)
const saveMessage = ref<{type: "success" | "error"; text: string} | null>(null)

// Computed
const institutionalTitle = computed(() => configStore.institutionalTitle)
const institutionalLogoUrl = computed(() => configStore.institutionalLogoUrl)
const isLoading = computed(() => configStore.isLoading)
const isUploading = computed(() => configStore.isUploading)
const error = computed(() => configStore.error)

// File input ref
const fileInput = ref<HTMLInputElement>()

// Methods
const updateTitleIfChanged = async () => {
  const trimmedTitle = localTitle.value.trim()

  if (trimmedTitle === institutionalTitle.value) {
    return // No cambios
  }

  if (!trimmedTitle) {
    localTitle.value = institutionalTitle.value
    return
  }

  isSavingTitle.value = true

  try {
    const success = await configStore.updateTitle(trimmedTitle)
    if (success) {
      showSaveMessage("success", "Título actualizado correctamente")
    } else {
      showSaveMessage("error", "Error al actualizar el título")
      localTitle.value = institutionalTitle.value // Revertir
    }
  } catch (error) {
    showSaveMessage("error", "Error al actualizar el título")
    localTitle.value = institutionalTitle.value // Revertir
  } finally {
    isSavingTitle.value = false
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    uploadLogo(file)
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false

  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    uploadLogo(files[0])
  }
}

const uploadLogo = async (file: File) => {
  try {
    const success = await configStore.uploadLogo(file)
    if (success) {
      showSaveMessage("success", "Logo subido correctamente")
      // Limpiar input
      if (fileInput.value) {
        fileInput.value.value = ""
      }
    } else {
      showSaveMessage("error", "Error al subir el logo")
    }
  } catch (error) {
    showSaveMessage("error", "Error al subir el logo")
  }
}

const removeCurrentLogo = async () => {
  if (confirm("¿Estás seguro de que quieres eliminar el logo actual?")) {
    try {
      const success = await configStore.removeLogo()
      if (success) {
        showSaveMessage("success", "Logo eliminado correctamente")
      } else {
        showSaveMessage("error", "Error al eliminar el logo")
      }
    } catch (error) {
      showSaveMessage("error", "Error al eliminar el logo")
    }
  }
}

const resetToDefaults = async () => {
  if (
    confirm(
      "¿Estás seguro de que quieres restaurar la configuración por defecto? Esto eliminará el logo actual."
    )
  ) {
    try {
      const success = await configStore.resetConfig()
      if (success) {
        localTitle.value = configStore.institutionalTitle
        showSaveMessage("success", "Configuración restaurada por defecto")
      } else {
        showSaveMessage("error", "Error al restaurar la configuración")
      }
    } catch (error) {
      showSaveMessage("error", "Error al restaurar la configuración")
    }
  }
}

const showSaveMessage = (type: "success" | "error", text: string) => {
  saveMessage.value = {type, text}
  setTimeout(() => {
    saveMessage.value = null
  }, 3000)
}

const clearError = () => {
  configStore.clearError()
}

// Watchers
watch(institutionalTitle, (newTitle) => {
  if (localTitle.value !== newTitle) {
    localTitle.value = newTitle
  }
})

// Drag and drop event handlers
const onDragEnter = () => {
  isDragging.value = true
}

const onDragLeave = (event: DragEvent) => {
  if (!(event.target as Element)?.closest(".border-dashed")) {
    isDragging.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await configStore.loadConfig()
  localTitle.value = institutionalTitle.value
})
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

/* Drag and drop visual feedback */
.border-dashed {
  transition: all 0.2s ease;
}

/* File input styling */
input[type="file"]::-webkit-file-upload-button {
  visibility: hidden;
}

input[type="file"]::before {
  content: "Seleccionar archivo";
  display: inline-block;
  background: linear-gradient(top, #f9f9f9, #e3e3e3);
  border: 1px solid #999;
  border-radius: 3px;
  padding: 5px 8px;
  outline: none;
  white-space: nowrap;
  cursor: pointer;
  text-shadow: 1px 1px #fff;
  font-weight: 700;
  font-size: 10pt;
}

input[type="file"]:hover::before {
  border-color: black;
}

input[type="file"]:active::before {
  background: -webkit-linear-gradient(top, #e3e3e3, #f9f9f9);
}
</style>
