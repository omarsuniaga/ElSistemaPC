<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useContentsStore } from '../stores/contents'
import { 
  PlusCircleIcon, 
  FunnelIcon, 
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  MusicalNoteIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'
// import BaseCard from '../components/BaseCard.vue'
import ContentForm from '../components/ContentForm.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import type { Content } from '../types'
import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'

const router = useRouter()
const contentsStore = useContentsStore()
const showForm = ref(false)
const showDeleteModal = ref(false)
const selectedContent = ref<Content | null>(null)
const expandedContent = ref<number | null>(null)
// const expandedTheme = ref<number | null>(null)
const isEditing = ref(false)
const isLoading = ref(true)
const error = ref('')

// Filters
const searchQuery = ref('')
const filterLevel = ref('')
const filterClass = ref('')
const sortBy = ref('title')
const sortOrder = ref<'asc' | 'desc'>('asc')

const levels = ['Principiante', 'Intermedio', 'Avanzado']
const classes = ['Piano - Nivel 1', 'Violín - Nivel 1', 'Guitarra - Nivel 1']

const filteredContents = computed(() => {
  let result = [...contentsStore.contents]

  // Apply filters
  if (filterLevel.value) {
    result = result.filter(c => c.level === filterLevel.value)
  }

  if (filterClass.value) {
    result = result.filter(c => c.class === filterClass.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(c => 
      c.title.toLowerCase().includes(query) ||
      c.description.toLowerCase().includes(query)
    )
  }

  // Apply sorting
  result.sort((a, b) => {
    let comparison = 0
    switch (sortBy.value) {
      case 'title':
        comparison = a.title.localeCompare(b.title)
        break
      case 'level':
        comparison = a.level.localeCompare(b.level)
        break
      case 'class':
        comparison = a.class.localeCompare(b.class)
        break
      case 'date':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
    }
    return sortOrder.value === 'desc' ? -comparison : comparison
  })

  return result
})

const handleNew = () => {
  selectedContent.value = null
  isEditing.value = false
  showForm.value = true
}

const handleEdit = (content: Content) => {
  selectedContent.value = content
  isEditing.value = true
  showForm.value = true
}

const handleDelete = (content: Content) => {
  selectedContent.value = content
  showDeleteModal.value = true
}

const handleFormSubmit = async (data: Partial<Content>) => {
  try {
    if (isEditing.value && selectedContent.value) {
      await contentsStore.updateContent(selectedContent.value.id, data)
    } else {
      await contentsStore.addContent(data as Omit<Content, "id" | "createdAt" | "updatedAt">)
    }
    showForm.value = false
    error.value = ''
  } catch (err) {
    error.value = 'Error al guardar el contenido'
  }
}

const handleFormCancel = () => {
  showForm.value = false
  selectedContent.value = null
  isEditing.value = false
}

const confirmDelete = async () => {
  if (selectedContent.value) {
    try {
      await contentsStore.deleteContent(selectedContent.value.id)
      showDeleteModal.value = false
      selectedContent.value = null
      error.value = ''
    } catch (err) {
      error.value = 'Error al eliminar el contenido'
    }
  }
}

const exportToPDF = () => {
  const doc = new jsPDF()
  let y = 20

  // Title
  doc.setFontSize(16)
  doc.text('Contenidos', 20, y)
  y += 10

  // Contents
  doc.setFontSize(12)
  filteredContents.value.forEach((content, index) => {
    if (y > 270) {
      doc.addPage()
      y = 20
    }

    doc.setFont('helvetica', 'bold')
    doc.text(`${index + 1}. ${content.title}`, 20, y)
    y += 7

    doc.setFont('helvetica', 'normal')
    doc.text(`Nivel: ${content.level}`, 25, y)
    y += 7
    doc.text(`Clase: ${content.class}`, 25, y)
    y += 7
    doc.text(`Duración: ${content.duration}`, 25, y)
    y += 10
  })

  doc.save('contenidos.pdf')
}

const exportToExcel = () => {
  const data = filteredContents.value.map(content => ({
    'Título': content.title,
    'Descripción': content.description,
    'Nivel': content.level,
    'Clase': content.class,
    'Duración': content.duration,
    'Objetivos': content.objectives.join(', '),
    'Prerequisitos': content.prerequisites.join(', ')
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Contenidos')
  XLSX.writeFile(wb, 'contenidos.xlsx')
}

const clearFilters = () => {
  searchQuery.value = ''
  filterLevel.value = ''
  filterClass.value = ''
  sortBy.value = 'title'
  sortOrder.value = 'asc'
}

onMounted(async () => {
  try {
    await contentsStore.fetchContents()
  } catch (err) {
    error.value = 'Error al cargar los contenidos'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="py-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Contenidos</h1>
      <div class="flex flex-wrap gap-2">
        <button 
          @click="exportToPDF"
          class="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
          title="Exportar a PDF"
        >
          <ArrowDownTrayIcon class="w-5 h-5" />
          <span class="hidden sm:inline">PDF</span>
        </button>
        <button 
          @click="exportToExcel"
          class="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
          title="Exportar a Excel"
        >
          <ArrowDownTrayIcon class="w-5 h-5" />
          <span class="hidden sm:inline">Excel</span>
        </button>
        <button 
          @click="router.push('/repertoire')"
          class="btn bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
          title="Repertorio"
        >
          <MusicalNoteIcon class="w-5 h-5" />
          <span class="hidden sm:inline">Repertorio</span>
        </button>
        <button 
          @click="handleNew"
          class="btn btn-primary flex items-center gap-2"
          title="Nuevo Contenido"
        >
          <PlusCircleIcon class="w-5 h-5" />
          <span class="hidden sm:inline">Nuevo Contenido</span>
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="card mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <input
            v-model="searchQuery"
            type="text"
            class="input"
            placeholder="Buscar contenidos..."
          />
        </div>
        <div>
          <select v-model="filterLevel" class="input">
            <option value="">Todos los niveles</option>
            <option
              v-for="level in levels"
              :key="level"
              :value="level"
            >
              {{ level }}
            </option>
          </select>
        </div>
        <div>
          <select v-model="filterClass" class="input">
            <option value="">Todas las clases</option>
            <option
              v-for="class_ in classes"
              :key="class_"
              :value="class_"
            >
              {{ class_ }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <!-- Error State -->
    <div 
      v-else-if="error" 
      class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg mb-4"
    >
      {{ error }}
    </div>

    <!-- Content List -->
    <div v-else class="space-y-4">
      <div
        v-for="content in filteredContents"
        :key="content.id"
        class="card"
      >
        <!-- Content Header -->
        <div 
          class="flex items-start justify-between cursor-pointer p-4"
          @click="expandedContent = expandedContent === content.id ? null : content.id"
        >
          <div class="flex items-center gap-4">
            <DocumentTextIcon class="w-6 h-6 text-primary-600" />
            <div>
              <h3 class="text-lg font-semibold">{{ content.title }}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ content.description }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex gap-2">
              <span class="px-2 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full">
                {{ content.level }}
              </span>
              <span class="px-2 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full">
                {{ content.class }}
              </span>
            </div>
            <component
              :is="expandedContent === content.id ? ChevronDownIcon : ChevronRightIcon"
              class="w-5 h-5"
            />
          </div>
        </div>

        <!-- Content Details -->
        <div v-if="expandedContent === content.id" class="border-t dark:border-gray-700">
          <div class="p-4 space-y-6">
            <!-- General Information -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 class="text-sm font-medium text-gray-600 dark:text-gray-400">Duración</h4>
                <p>{{ content.duration }}</p>
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-600 dark:text-gray-400">Objetivos</h4>
                <ul class="list-disc list-inside">
                  <li v-for="objective in content.objectives" :key="objective">
                    {{ objective }}
                  </li>
                </ul>
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-600 dark:text-gray-400">Prerequisitos</h4>
                <ul class="list-disc list-inside">
                  <li v-for="prerequisite in content.prerequisites" :key="prerequisite">
                    {{ prerequisite }}
                  </li>
                </ul>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3">
              <button
                @click="handleEdit(content)"
                class="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                title="Editar"
              >
                <PencilSquareIcon class="w-5 h-5" />
                <span class="hidden sm:inline">Editar</span>
              </button>
              <button
                @click="handleDelete(content)"
                class="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
                title="Eliminar"
              >
                <TrashIcon class="w-5 h-5" />
                <span class="hidden sm:inline">Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div 
        v-if="filteredContents.length === 0" 
        class="text-center py-12 text-gray-500 dark:text-gray-400"
      >
        {{ searchQuery || filterLevel || filterClass ? 
          'No se encontraron contenidos con los filtros seleccionados' : 
          'No hay contenidos registrados' }}
      </div>
    </div>

    <!-- Content Form Modal -->
    <ContentForm
      v-if="showForm"
      :initial-data="selectedContent || undefined"
      @submit="handleFormSubmit"
      @cancel="handleFormCancel"
    />

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      :show="showDeleteModal"
      title="Eliminar Contenido"
      message="¿Estás seguro que deseas eliminar este contenido? Esta acción no se puede deshacer."
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>