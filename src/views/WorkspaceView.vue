<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useClassesStore } from '../stores/classes'
import { useStudentsStore } from '../stores/students'
import { useContentsStore } from '../stores/contents'
import { format } from 'date-fns'
import {
  UserGroupIcon,
  AcademicCapIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  BookOpenIcon,
  TrashIcon,
  BeakerIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/vue/24/outline'
import type { WorkspaceElement, Student, Class } from '../types'
import { useFirestoreStore } from '../stores/firestore'

const classesStore = useClassesStore()
const studentsStore = useStudentsStore()
const contentsStore = useContentsStore()
const firestoreStore = useFirestoreStore()

// State
const selectedClass = ref('')
const selectedDate = ref(format(new Date(), 'yyyy-MM-dd'))
const selectedContent = ref<number | null>(null)
const selectedTheme = ref<number | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)
const showWeightModal = ref(false)
const selectedElementForWeight = ref<WorkspaceElement | null>(null)

// Container state using reactive to ensure proper reactivity
const container = reactive({
  elements: [] as WorkspaceElement[]
})

// Update the students ref to handle async data properly
const studentsList = ref<Student[]>([])

// Computed
const classes = computed(() => classesStore.classes.map((c: Class) => c.name))

// Load students when class changes and keep them in the ref
const loadStudents = async () => {
  if (!selectedClass.value) {
    studentsList.value = []
    return
  }
  try {
    const students = await firestoreStore.getStudentsByClass(selectedClass.value)
    studentsList.value = students as Student[]
  } catch (error) {
    console.error('Error fetching students:', error)
    studentsList.value = []
  }
}

watch(() => selectedClass.value, loadStudents)

const contents = computed(() => 
  contentsStore.getContentsByClass(selectedClass.value)
)

const ElementTypes = {
  student: 'student',
  theme: 'theme',
  indicator: 'indicator'
} as const

type ElementType = typeof ElementTypes[keyof typeof ElementTypes]

// Update color mapping with proper type
const elementColors: Record<ElementType, string> = {
  student: 'bg-blue-500',
  theme: 'bg-green-500',
  indicator: 'bg-purple-500'
}

const getElementColor = (type: ElementType): string => {
  return elementColors[type] || 'bg-gray-500'
}

// Methods
const handleClassSelect = async (event: Event) => {
  const select = event.target as HTMLSelectElement
  const className = select.value
  selectedClass.value = className
  container.elements = []
  selectedContent.value = null
  selectedTheme.value = null

  if (className) {
    isLoading.value = true
    error.value = null
    try {
      await Promise.all([
        studentsStore.fetchStudents(),
        contentsStore.fetchContents(),
        loadStudents()
      ])
    } catch (err) {
      error.value = 'Error al cargar los datos'
      console.error('Error loading data:', err)
    } finally {
      isLoading.value = false
    }
  }
}

const handleDragStart = (event: DragEvent, type: ElementType, item: any) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', JSON.stringify({
      type,
      item: {
        id: item.id,
        title: type === 'student' ? `${item.nombre} ${item.apellido}` : item.title || item.name,
        description: item.description,
        weight: type === 'indicator' ? item.weight : 100
      }
    }))
    event.dataTransfer.effectAllowed = 'copy'
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  
  if (!event.dataTransfer) return
  
  try {
    const data = JSON.parse(event.dataTransfer.getData('text/plain'))
    const { type, item } = data

    const newElement: WorkspaceElement = {
      id: item.id,
      type,
      title: item.title,
      description: item.description,
      weight: item.weight,
      progress: 0,
      color: getElementColor(type)
    }

    if (!container.elements.some(el => el.id === newElement.id && el.type === type)) {
      container.elements.push(newElement)
    }
  } catch (err) {
    console.error('Error handling drop:', err)
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

const updateProgress = (element: WorkspaceElement, inputEvent: Event) => {
  const input = inputEvent.target as HTMLInputElement
  const value = parseInt(input.value)
  element.progress = Math.min(100, Math.max(0, value))
}

const removeElement = (id: number, type: string) => {
  const index = container.elements.findIndex(el => el.id === id && el.type === type)
  if (index !== -1) {
    container.elements.splice(index, 1)
  }
}

const openWeightModal = (element: WorkspaceElement) => {
  selectedElementForWeight.value = element
  showWeightModal.value = true
}

const updateWeight = async () => {
  if (!selectedElementForWeight.value) return

  const element = selectedElementForWeight.value
  
  if (element.type === 'theme' && selectedContent.value) {
    await contentsStore.updateThemeWeight(selectedContent.value, element.id, element.weight)
  } else if (element.type === 'indicator' && selectedContent.value && selectedTheme.value) {
    await contentsStore.updateIndicatorWeight(
      selectedContent.value,
      selectedTheme.value,
      element.id,
      element.weight
    )
  }

  showWeightModal.value = false
  selectedElementForWeight.value = null
}

const totalProgress = computed(() => {
  if (!container.elements.length) return 0
  const weightedSum = container.elements.reduce((sum, el) => 
    sum + (el.progress * el.weight), 0
  )
  const totalWeight = container.elements.reduce((sum, el) => sum + el.weight, 0)
  return Math.round(weightedSum / totalWeight)
})

const saveProgress = async () => {
  try {
    // Save to database
    const progressData = {
      date: selectedDate.value,
      class: selectedClass.value,
      elements: container.elements,
      totalProgress: totalProgress.value,
      createdAt: new Date().toISOString()
    }

    console.log('Progress saved:', progressData)
  } catch (err) {
    error.value = 'Error al guardar el progreso'
    console.error('Error saving progress:', err)
  }
}

// Load initial data
onMounted(async () => {
  try {
    await Promise.all([
      classesStore.fetchClasses(),
      studentsStore.fetchStudents(),
      contentsStore.fetchContents()
    ])
  } catch (err) {
    error.value = 'Error al cargar los datos iniciales'
    console.error('Error loading initial data:', err)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="py-6">
    <h1 class="text-2xl font-bold mb-6">Lienzo de Trabajo</h1>

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

    <div v-else class="grid grid-cols-12 gap-6">
      <!-- Left Sidebar: Configuration and Students -->
      <div class="col-span-3 space-y-4">
        <!-- Configuration -->
        <div class="card">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <AcademicCapIcon class="w-5 h-5 text-primary-600" />
            Configuración
          </h2>
          
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">Clase</label>
            <select 
              v-model="selectedClass"
              class="input"
              @change="handleClassSelect"
            >
              <option value="">Seleccionar clase</option>
              <option
                v-for="class_ in classes"
                :key="class_"
                :value="class_"
              >
                {{ class_ }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Fecha</label>
            <input
              v-model="selectedDate"
              type="date"
              class="input"
            />
          </div>
        </div>

        <!-- Students List -->
        <div class="card">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <UserGroupIcon class="w-5 h-5 text-primary-600" />
            Alumnos
          </h2>
          
          <div class="space-y-3">
            <div
              v-for="student in studentsList"
              :key="student.id"
              class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-move"
              draggable="true"
              @dragstart="event => handleDragStart(event, 'student', student)"
            >
              <img
                :src="student.avatar"
                :alt="student.nombre"
                class="w-8 h-8 rounded-full"
              />
              <div>
                <p class="font-medium">{{ student.nombre }} {{ student.apellido }}</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ student.instrumento }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Central Area: Progress Cylinder -->
      <div class="col-span-6">
        <div class="card min-h-[600px] flex flex-col">
          <!-- Progress Cylinder -->
          <div 
            class="flex-1 relative"
            @dragover="handleDragOver"
            @drop="handleDrop"
          >
            <!-- Cylinder Container -->
            <div class="absolute inset-4 rounded-2xl border-4 border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-900/50">
              <!-- Cylinder Icon -->
              <div class="absolute top-4 left-4">
                <BeakerIcon class="w-6 h-6 text-gray-400 dark:text-gray-600" />
              </div>

              <!-- Progress Elements -->
              <div class="relative h-full">
                <TransitionGroup 
                  name="progress"
                  tag="div"
                  class="absolute inset-0 flex flex-col-reverse"
                >
                  <div
                    v-for="element in container.elements"
                    :key="`${element.type}-${element.id}`"
                    :class="[
                      element.color,
                      'transition-all duration-500 ease-out relative'
                    ]"
                    :style="{
                      height: `${element.progress}%`,
                      opacity: 0.9
                    }"
                  >
                    <!-- Element Content -->
                    <div class="absolute inset-0 p-2 flex flex-col justify-between backdrop-blur-sm">
                      <div class="flex justify-between items-start">
                        <div>
                          <p class="font-medium text-white">{{ element.title }}</p>
                          <p class="text-sm text-white/80">
                            {{ element.type.charAt(0).toUpperCase() + element.type.slice(1) }}
                            <span v-if="element.weight !== 100">
                              ({{ element.weight }}%)
                            </span>
                          </p>
                        </div>
                        <div class="flex gap-1">
                          <button 
                            v-if="element.type !== 'student'"
                            @click="openWeightModal(element)"
                            class="p-1 hover:bg-white/20 rounded transition-colors"
                          >
                            <AdjustmentsHorizontalIcon class="w-4 h-4 text-white" />
                          </button>
                          <button 
                            @click="removeElement(element.id, element.type)"
                            class="p-1 hover:bg-white/20 rounded transition-colors"
                          >
                            <TrashIcon class="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <input
                          type="number"
                          v-model="element.progress"
                          min="0"
                          max="100"
                          class="w-16 px-2 py-1 rounded bg-white/20 text-white text-center"
                          @input="event => updateProgress(element, event)"
                        />
                        <span class="text-white">%</span>
                      </div>
                    </div>

                    <!-- Progress Animation -->
                    <div 
                      class="absolute inset-0 bg-white/20"
                      :style="{
                        transform: `translateY(${100 - element.progress}%)`
                      }"
                    ></div>
                  </div>
                </TransitionGroup>
              </div>

              <!-- Empty State -->
              <div 
                v-if="!container.elements.length"
                class="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-600"
              >
                <p class="text-center">
                  Arrastra elementos aquí para<br>visualizar el progreso
                </p>
              </div>
            </div>
          </div>

          <!-- Progress Footer -->
          <div class="p-4 border-t dark:border-gray-700">
            <div class="flex justify-between items-center">
              <div>
                <p class="text-lg font-semibold">Progreso Total</p>
                <div class="flex items-center gap-2">
                  <p class="text-3xl font-bold text-primary-600">{{ totalProgress }}%</p>
                  <div class="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-primary-600 transition-all duration-500"
                      :style="{ width: `${totalProgress}%` }"
                    ></div>
                  </div>
                </div>
              </div>
              <button
                @click="saveProgress"
                class="btn btn-primary"
                :disabled="!container.elements.length"
              >
                Guardar Progreso
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Sidebar: Content Menu -->
      <div class="col-span-3">
        <div class="card">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpenIcon class="w-5 h-5 text-primary-600" />
            Contenido
          </h2>

          <!-- Contents -->
          <div class="space-y-2">
            <div
              v-for="content in contents"
              :key="content.id"
              class="border dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <!-- Content Header -->
              <div
                class="p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                @click="selectedContent = content.id === selectedContent ? null : content.id"
              >
                <div class="flex items-center justify-between">
                  <span class="font-medium">{{ content.title }}</span>
                  <component
                    :is="selectedContent === content.id ? ChevronDownIcon : ChevronRightIcon"
                    class="w-5 h-5"
                  />
                </div>
              </div>

              <!-- Themes -->
              <div v-if="selectedContent === content.id" class="p-2 space-y-2">
                <div
                  v-for="theme in content.themes"
                  :key="theme.id"
                  class="border dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  <!-- Theme Header -->
                  <div
                    class="p-2 bg-gray-50 dark:bg-gray-800 cursor-move hover:bg-gray-100 dark:hover:bg-gray-700"
                    draggable="true"
                    @dragstart="event => handleDragStart(event, 'theme', theme)"
                    @click="selectedTheme = theme.id === selectedTheme ? null : theme.id"
                  >
                    <div class="flex items-center justify-between">
                      <div>
                        <span class="font-medium text-sm">{{ theme.title }}</span>
                        <span class="text-sm text-gray-600 dark:text-gray-400 ml-2">
                          ({{ theme.weight }}%)
                        </span>
                      </div>
                      <component
                        :is="selectedTheme === theme.id ? ChevronDownIcon : ChevronRightIcon"
                        class="w-4 h-4"
                      />
                    </div>
                  </div>

                  <!-- Indicators -->
                  <div v-if="selectedTheme === theme.id" class="p-2 space-y-1">
                    <div
                      v-for="indicator in theme.indicators"
                      :key="indicator.id"
                      class="p-2 bg-gray-50 dark:bg-gray-800 rounded cursor-move hover:bg-gray-100 dark:hover:bg-gray-700"
                      draggable="true"
                      @dragstart="event => handleDragStart(event, 'indicator', indicator)"
                    >
                      <div class="flex justify-between items-start">
                        <div>
                          <p class="text-sm font-medium">{{ indicator.name }}</p>
                          <p class="text-xs text-gray-600 dark:text-gray-400">
                            Peso: {{ indicator.weight }}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Weight Configuration Modal -->
    <div
      v-if="showWeightModal && selectedElementForWeight"
      class="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h3 class="text-lg font-semibold mb-4">
          Configurar Ponderación
        </h3>
        
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">
            Peso para "{{ selectedElementForWeight.title }}"
          </label>
          <input
            v-model="selectedElementForWeight.weight"
            type="number"
            min="0"
            max="100"
            class="input"
          />
        </div>

        <div class="flex justify-end gap-3">
          <button
            @click="showWeightModal = false"
            class="btn bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button
            @click="updateWeight"
            class="btn btn-primary"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.progress-enter-active,
.progress-leave-active {
  transition: all 0.5s ease;
}

.progress-enter-from,
.progress-leave-to {
  height: 0;
  opacity: 0;
  transform: translateY(20px);
}

.progress-move {
  transition: transform 0.5s ease;
}
</style>