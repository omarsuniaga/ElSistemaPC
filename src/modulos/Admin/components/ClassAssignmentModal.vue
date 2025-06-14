<template>
  <div v-if="isVisible && teacher" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b">
          <div>
            <h3 class="text-lg font-medium text-gray-900">
              Asignar Clases
            </h3>
            <p class="text-sm text-gray-600 mt-1">
              {{ teacher.nombre }} {{ teacher.apellido }}
            </p>
          </div>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>

        <!-- Content -->
        <div class="mt-6">
          <!-- Search and Filter -->
          <div class="mb-6">
            <div class="flex flex-col sm:flex-row gap-4">
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Buscar clases
                </label>
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Buscar por nombre de clase..."
                  class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Filtrar por
                </label>
                <select
                  v-model="filterType"
                  class="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="all">Todas las clases</option>
                  <option value="assigned">Asignadas</option>
                  <option value="available">Disponibles</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Classes List -->
          <div class="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
            <div class="divide-y divide-gray-200">
              <div
                v-for="classItem in filteredClasses"
                :key="classItem.id"
                class="p-4 hover:bg-gray-50 transition-colors"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <input
                      :id="`class-${classItem.id}`"
                      v-model="selectedClasses"
                      :value="classItem.id"
                      type="checkbox"
                      class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <label :for="`class-${classItem.id}`" class="flex-1 cursor-pointer">
                      <div class="text-sm font-medium text-gray-900">
                        {{ classItem.name }}
                      </div>
                      <div class="text-sm text-gray-500">
                        {{ classItem.description || 'Sin descripción' }}
                      </div>
                    </label>
                  </div>
                  
                  <div class="text-sm text-gray-500">
                    <span v-if="classItem.studentCount" class="mr-2">
                      {{ classItem.studentCount }} estudiantes
                    </span>
                    <span
                      :class="[
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                        isClassAssigned(classItem.id)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      ]"
                    >
                      {{ isClassAssigned(classItem.id) ? 'Asignada' : 'Disponible' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Empty state -->
              <div v-if="filteredClasses.length === 0" class="p-8 text-center text-gray-500">
                <AcademicCapIcon class="mx-auto h-12 w-12 text-gray-400" />
                <h3 class="mt-2 text-sm font-medium">No hay clases</h3>
                <p class="mt-1 text-sm">No se encontraron clases con los filtros aplicados.</p>
              </div>
            </div>
          </div>

          <!-- Summary -->
          <div v-if="selectedClasses.length > 0" class="mt-4 p-3 bg-blue-50 rounded-md">
            <p class="text-sm text-blue-700">
              <strong>{{ selectedClasses.length }}</strong> 
              {{ selectedClasses.length === 1 ? 'clase seleccionada' : 'clases seleccionadas' }}
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end space-x-3 pt-6 mt-6 border-t">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          <button
            @click="handleAssignment"
            :disabled="loading || selectedClasses.length === 0"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {{ loading ? 'Asignando...' : 'Asignar Clases' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { XMarkIcon, AcademicCapIcon } from '@heroicons/vue/24/outline'

// Props
const props = defineProps<{
  isVisible: boolean
  teacher?: any
  availableClasses?: any[]
}>()

// Emits
const emit = defineEmits<{
  'close': []
  'assign': [{ teacherId: string, classIds: string[] }]
}>()

// State
const loading = ref(false)
const searchQuery = ref('')
const filterType = ref('all')
const selectedClasses = ref<string[]>([])

// Get current teacher's assigned classes
const currentAssignedClasses = computed(() => {
  return props.teacher?.assignedClasses || props.teacher?.clases || []
})

// Reset when modal opens/closes
watch(() => props.isVisible, (newValue) => {
  if (newValue && props.teacher) {
    selectedClasses.value = [...currentAssignedClasses.value]
  } else {
    selectedClasses.value = []
    searchQuery.value = ''
    filterType.value = 'all'
  }
})

// Filter classes based on search and filter type
const filteredClasses = computed(() => {
  let classes = props.availableClasses || []
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    classes = classes.filter(c => 
      c.name?.toLowerCase().includes(query) ||
      c.description?.toLowerCase().includes(query)
    )
  }
  
  // Apply type filter
  if (filterType.value === 'assigned') {
    classes = classes.filter(c => isClassAssigned(c.id))
  } else if (filterType.value === 'available') {
    classes = classes.filter(c => !isClassAssigned(c.id))
  }
  
  return classes
})

// Check if a class is currently assigned to the teacher
const isClassAssigned = (classId: string) => {
  return currentAssignedClasses.value.includes(classId)
}

// Handle class assignment
const handleAssignment = async () => {
  try {
    loading.value = true
    
    emit('assign', {
      teacherId: props.teacher.id,
      classIds: selectedClasses.value
    })
  } catch (error) {
    console.error('Error assigning classes:', error)
  } finally {
    loading.value = false
  }
}
</script>
