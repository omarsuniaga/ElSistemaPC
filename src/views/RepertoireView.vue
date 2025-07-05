<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {useRepertoireStore} from "../stores/repertoire"
import {useStudentsStore} from "../modulos/Students/store/students"
import type {Repertoire, MusicalWork, Measure} from "../types/repertoire"
import {INSTRUMENT_SECTIONS} from "../types/repertoire"
import {
  PlusCircleIcon,
  MusicalNoteIcon,
  TagIcon,
  ClockIcon,
  ChartBarIcon,
  BellIcon,
  ShareIcon,
  InformationCircleIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/vue/24/outline"
import RepertoireForm from "../components/RepertoireForm.vue"
import WorkForm from "../components/WorkForm.vue"
import ConfirmModal from "../components/ConfirmModal.vue"
import WorkProgress from "../components/WorkProgress.vue"

const repertoireStore = useRepertoireStore()
const studentsStore = useStudentsStore()

// Refs reactivos
const uiState = ref({
  selectedRepertoire: null as number | null,
  selectedWork: null as number | null,
  showHeatmap: true,
  showLegend: false,
  searchQuery: "",
  selectedCategory: "",
  selectedTag: "",
  showRepertoireForm: false,
  showWorkForm: false,
  showDeleteModal: false,
  itemToDelete: null as {type: "repertoire" | "work"; id: number} | null,
  editingItem: null as {type: "repertoire" | "work"; data: any} | null,
  viewMode: "general" as "general" | "student" | "section",
  selectedStudent: null as string | null,
  selectedSection: null as "strings" | "woodwinds" | "brass" | "percussion" | "other" | null,
})

const isLoading = ref(true)
const error = ref("")
const selectedMeasures = ref<number[]>([])
const isMultiSelectMode = ref(false)

// Status definitions
const measureStatuses = [
  {name: "No leído", color: "bg-red-500", description: "Compás no estudiado aún"},
  {
    name: "Leído con Dificultad",
    color: "bg-orange-500",
    description: "Compás estudiado pero con dificultades significativas",
  },
  {
    name: "Leído Parcialmente",
    color: "bg-yellow-500",
    description: "Compás estudiado con algunas dificultades menores",
  },
  {name: "Fluido", color: "bg-blue-500", description: "Compás estudiado y ejecutado con fluidez"},
  {
    name: "Dominado",
    color: "bg-green-500",
    description: "Compás completamente dominado y memorizado",
  },
]

const sections = INSTRUMENT_SECTIONS

const filteredRepertoires = computed(() => {
  let result = [...repertoireStore.repertoires]

  if (uiState.value.searchQuery) {
    const query = uiState.value.searchQuery.toLowerCase()
    result = result.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query) ||
        r.works.some(
          (w) => w.title.toLowerCase().includes(query) || w.composer.toLowerCase().includes(query)
        )
    )
  }

  if (uiState.value.selectedCategory) {
    result = result.filter((r) => r.category === uiState.value.selectedCategory)
  }

  if (uiState.value.selectedTag) {
    result = result.filter((r) => r.tags.includes(uiState.value.selectedTag))
  }

  return result
})

// Computed properties for views
const worksBySection = computed(() => {
  if (!uiState.value.selectedSection) return []
  return filteredRepertoires.value.flatMap((r) =>
    r.works.filter((w) => w.instruments.some((i) => i.section === uiState.value.selectedSection))
  )
})

const worksByStudent = computed(() => {
  if (!uiState.value.selectedStudent) return []
  return filteredRepertoires.value.flatMap((r) =>
    r.works.filter((w) =>
      w.instruments.some((i) => i.studentProgress?.[uiState.value.selectedStudent!] !== undefined)
    )
  )
})

const students = computed(() => studentsStore.students)

// Methods
const getStatusColor = (progress: number) => {
  if (progress <= 20) return measureStatuses[0].color
  if (progress <= 40) return measureStatuses[1].color
  if (progress <= 60) return measureStatuses[2].color
  if (progress <= 80) return measureStatuses[3].color
  return measureStatuses[4].color
}

const getStatusName = (progress: number) => {
  if (progress <= 20) return measureStatuses[0].name
  if (progress <= 40) return measureStatuses[1].name
  if (progress <= 60) return measureStatuses[2].name
  if (progress <= 80) return measureStatuses[3].name
  return measureStatuses[4].name
}

const handleMeasureClick = async (
  repertoireId: number,
  workId: number,
  instrumentId: number,
  measure: Measure
) => {
  if (isMultiSelectMode.value) {
    // Toggle measure selection
    const index = selectedMeasures.value.indexOf(measure.id)
    if (index === -1) {
      selectedMeasures.value.push(measure.id)
    } else {
      selectedMeasures.value.splice(index, 1)
    }
    return
  }

  // Calculate next status
  let newProgress = Math.floor(measure.progress / 20) * 20 + 20
  if (newProgress > 100) newProgress = 0

  try {
    await repertoireStore.updateMeasureProgress(
      repertoireId,
      workId,
      instrumentId,
      measure.id,
      newProgress
    )
  } catch (err) {
    error.value = "Error al actualizar el estado del compás"
    console.error("Error updating measure:", err)
  }
}

const updateSelectedMeasures = async (
  repertoireId: number,
  workId: number,
  instrumentId: number,
  newProgress: number
) => {
  try {
    for (const measureId of selectedMeasures.value) {
      await repertoireStore.updateMeasureProgress(
        repertoireId,
        workId,
        instrumentId,
        measureId,
        newProgress
      )
    }
    selectedMeasures.value = []
  } catch (err) {
    error.value = "Error al actualizar los compases seleccionados"
    console.error("Error updating measures:", err)
  }
}

const toggleMultiSelect = () => {
  isMultiSelectMode.value = !isMultiSelectMode.value
  if (!isMultiSelectMode.value) {
    selectedMeasures.value = []
  }
}

const handleShare = (repertoire: Repertoire) => {
  // Implement sharing functionality
}

const handleNewRepertoire = () => {
  uiState.value.editingItem = null
  uiState.value.showRepertoireForm = true
}

const handleEditRepertoire = (repertoire: Repertoire) => {
  uiState.value.editingItem = {type: "repertoire", data: repertoire}
  uiState.value.showRepertoireForm = true
}

const handleDeleteRepertoire = (id: number) => {
  uiState.value.itemToDelete = {type: "repertoire", id}
  uiState.value.showDeleteModal = true
}

const handleNewWork = (repertoireId: number) => {
  uiState.value.editingItem = {type: "work", data: {repertoireId}}
  uiState.value.showWorkForm = true
}

const handleEditWork = (repertoireId: number, work: MusicalWork) => {
  uiState.value.editingItem = {type: "work", data: {...work, repertoireId}}
  uiState.value.showWorkForm = true
}

const handleDeleteWork = (repertoireId: number, workId: number) => {
  uiState.value.itemToDelete = {type: "work", id: workId}
  uiState.value.showDeleteModal = true
}

const handleRepertoireSubmit = async (data: Partial<Repertoire>) => {
  try {
    if (uiState.value.editingItem?.type === "repertoire") {
      await repertoireStore.updateRepertoire(uiState.value.editingItem.data.id, data)
    } else {
      await repertoireStore.createRepertoire(data)
    }
    uiState.value.showRepertoireForm = false
  } catch (err) {
    error.value = "Error al guardar el repertorio"
    console.error("Error saving repertoire:", err)
  }
}

const handleWorkSubmit = async (data: Partial<MusicalWork>) => {
  try {
    if (uiState.value.editingItem?.type === "work") {
      const {repertoireId} = uiState.value.editingItem.data
      await repertoireStore.updateWork(repertoireId, uiState.value.editingItem.data.id, data)
    } else if (uiState.value.editingItem?.data.repertoireId) {
      await repertoireStore.addWork(uiState.value.editingItem.data.repertoireId, data)
    }
    uiState.value.showWorkForm = false
  } catch (err) {
    error.value = "Error al guardar la obra"
    console.error("Error saving work:", err)
  }
}

const handleConfirmDelete = async () => {
  if (!uiState.value.itemToDelete) return

  try {
    if (uiState.value.itemToDelete.type === "repertoire") {
      await repertoireStore.deleteRepertoire(uiState.value.itemToDelete.id)
    } else {
      const repertoire = repertoireStore.repertoires.find((r) =>
        r.works.some((w) => w.id === uiState.value.itemToDelete?.id)
      )
      if (repertoire) {
        await repertoireStore.deleteWork(repertoire.id, uiState.value.itemToDelete.id)
      }
    }
  } catch (err) {
    error.value = `Error al eliminar ${uiState.value.itemToDelete.type === "repertoire" ? "el repertorio" : "la obra"}`
    console.error("Error deleting item:", err)
  } finally {
    uiState.value.showDeleteModal = false
    uiState.value.itemToDelete = null
  }
}

const exportProgress = (format: "pdf" | "excel") => {
  // Implement export functionality
}

onMounted(async () => {
  try {
    await repertoireStore.fetchRepertoires()
  } catch (err) {
    error.value = "Error al cargar los repertorios"
    console.error("Error loading repertoires:", err)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="py-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Repertorios</h1>
      <div class="flex flex-wrap gap-2">
        <button
          class="btn bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
          title="Leyenda"
          @click="uiState.showLegend = !uiState.showLegend"
        >
          <InformationCircleIcon class="w-5 h-5" />
          <span class="hidden sm:inline">Leyenda</span>
        </button>
        <button
          class="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
          title="Mapa de calor"
          @click="uiState.showHeatmap = !uiState.showHeatmap"
        >
          <ChartBarIcon class="w-5 h-5" />
          <span class="hidden sm:inline">{{
            uiState.showHeatmap ? "Ocultar Mapa" : "Mostrar Mapa"
          }}</span>
        </button>
        <button
          class="btn btn-primary flex items-center gap-2"
          title="Nuevo Repertorio"
          @click="handleNewRepertoire"
        >
          <PlusCircleIcon class="w-5 h-5" />
          <span class="hidden sm:inline">Nuevo Repertorio</span>
        </button>
      </div>
    </div>

    <!-- Status Legend -->
    <div v-if="uiState.showLegend" class="card mb-6">
      <h3 class="text-lg font-semibold mb-4">Estados de los Compases</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div v-for="status in measureStatuses" :key="status.name" class="flex items-center gap-3">
          <div :class="[status.color, 'w-6 h-6 rounded']" />
          <div>
            <p class="font-medium">{{ status.name }}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ status.description }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <input
            v-model="uiState.searchQuery"
            type="text"
            class="input"
            placeholder="Buscar repertorios..."
          />
        </div>
        <div>
          <select v-model="uiState.selectedCategory" class="input">
            <option value="">Todas las categorías</option>
            <option value="Classical">Clásica</option>
            <option value="Jazz">Jazz</option>
            <option value="Popular">Popular</option>
          </select>
        </div>
        <div>
          <select v-model="uiState.selectedTag" class="input">
            <option value="">Todos los tags</option>
            <option value="piano">Piano</option>
            <option value="violin">Violín</option>
            <option value="guitar">Guitarra</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg mb-4"
    >
      {{ error }}
    </div>

    <!-- Repertoire List -->
    <div v-else class="space-y-6">
      <div v-for="repertoire in filteredRepertoires" :key="repertoire.id" class="card">
        <!-- Repertoire Header -->
        <div class="flex justify-between items-start mb-4">
          <div>
            <h2 class="text-xl font-semibold">{{ repertoire.name }}</h2>
            <p class="text-gray-600 dark:text-gray-400">{{ repertoire.description }}</p>
            <div class="flex items-center gap-2 mt-2">
              <span
                v-for="tag in repertoire.tags"
                :key="tag"
                class="px-2 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full"
              >
                {{ tag }}
              </span>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button
              class="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
              title="Editar"
              @click="handleEditRepertoire(repertoire)"
            >
              <PencilSquareIcon class="w-5 h-5" />
              <span class="hidden sm:inline">Editar</span>
            </button>
            <button
              class="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
              title="Eliminar"
              @click="handleDeleteRepertoire(repertoire.id)"
            >
              <TrashIcon class="w-5 h-5" />
              <span class="hidden sm:inline">Eliminar</span>
            </button>
            <button
              class="btn bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
              title="Compartir"
              @click="handleShare(repertoire)"
            >
              <ShareIcon class="w-5 h-5" />
            </button>
            <button
              class="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
              title="Agregar Obra"
              @click="handleNewWork(repertoire.id)"
            >
              <PlusCircleIcon class="w-5 h-5" />
              <span class="hidden sm:inline">Agregar Obra</span>
            </button>
            <div class="text-right">
              <p class="text-2xl font-bold">{{ repertoire.progress }}%</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Progreso</p>
            </div>
          </div>
        </div>

        <!-- Musical Works -->
        <div class="space-y-4">
          <div
            v-for="work in repertoire.works"
            :key="work.id"
            class="border dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <!-- Work Header -->
            <div class="p-4 bg-gray-50 dark:bg-gray-800">
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="font-semibold">{{ work.title }}</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ work.composer }}
                  </p>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <button
                    class="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                    title="Editar"
                    @click="handleEditWork(repertoire.id, work)"
                  >
                    <PencilSquareIcon class="w-5 h-5" />
                    <span class="hidden sm:inline">Editar</span>
                  </button>
                  <button
                    class="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
                    title="Eliminar"
                    @click="handleDeleteWork(repertoire.id, work.id)"
                  >
                    <TrashIcon class="w-5 h-5" />
                    <span class="hidden sm:inline">Eliminar</span>
                  </button>
                  <div class="flex items-center gap-2">
                    <ClockIcon class="w-4 h-4" />
                    <span>{{ work.duration }}</span>
                  </div>
                  <div class="text-right ml-auto">
                    <p class="text-xl font-bold">{{ work.progress }}%</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Progreso</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Progress View -->
            <div class="p-4">
              <WorkProgress :work="work" :repertoire-id="repertoire.id" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Forms and Modals -->
    <RepertoireForm
      v-if="uiState.showRepertoireForm"
      :initial-data="
        uiState.editingItem?.type === 'repertoire' ? uiState.editingItem.data : undefined
      "
      @submit="handleRepertoireSubmit"
      @cancel="uiState.showRepertoireForm = false"
    />

    <WorkForm
      v-if="uiState.showWorkForm"
      :initial-data="uiState.editingItem?.type === 'work' ? uiState.editingItem.data : undefined"
      @submit="handleWorkSubmit"
      @cancel="uiState.showWorkForm = false"
    />

    <ConfirmModal
      :is-open="uiState.showDeleteModal"
      :title="`Eliminar ${uiState.itemToDelete?.type === 'repertoire' ? 'Repertorio' : 'Obra'}`"
      :message="`¿Estás seguro que deseas eliminar ${uiState.itemToDelete?.type === 'repertoire' ? 'este repertorio' : 'esta obra'}? Esta acción no se puede deshacer.`"
      @confirm="handleConfirmDelete"
      @cancel="uiState.showDeleteModal = false"
    />
  </div>
</template>

<style scoped>
.heatmap-tooltip {
  @apply absolute z-10 p-2 bg-white dark:bg-gray-800 rounded shadow-lg text-sm;
  min-width: 200px;
}
</style>
