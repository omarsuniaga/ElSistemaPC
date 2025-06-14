<template>
  <div class="overflow-hidden">
    <!-- Table Header -->
    <div class="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-b border-gray-200 dark:border-gray-600">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white">
          Lista de Maestros
        </h3>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ teachers.length }} maestro{{ teachers.length !== 1 ? 's' : '' }}
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <!-- Name -->
            <th
              @click="handleSort('name')"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
            >
              <div class="flex items-center space-x-1">
                <span>Nombre</span>
                <ChevronUpDownIcon 
                  v-if="sortField !== 'name'"
                  class="w-4 h-4 text-gray-400" 
                />
                <ChevronUpIcon 
                  v-else-if="sortOrder === 'asc'"
                  class="w-4 h-4 text-blue-500" 
                />
                <ChevronDownIcon 
                  v-else
                  class="w-4 h-4 text-blue-500" 
                />
              </div>
            </th>

            <!-- Contact -->
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Contacto
            </th>

            <!-- Specialties -->
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Especialidades
            </th>

            <!-- Classes -->
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Clases
            </th>

            <!-- Status -->
            <th
              @click="handleSort('activo')"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
            >
              <div class="flex items-center space-x-1">
                <span>Estado</span>
                <ChevronUpDownIcon 
                  v-if="sortField !== 'activo'"
                  class="w-4 h-4 text-gray-400" 
                />
                <ChevronUpIcon 
                  v-else-if="sortOrder === 'asc'"
                  class="w-4 h-4 text-blue-500" 
                />
                <ChevronDownIcon 
                  v-else
                  class="w-4 h-4 text-blue-500" 
                />
              </div>
            </th>

            <!-- Actions -->
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>

        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
          <tr
            v-for="teacher in sortedTeachers"
            :key="teacher.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
          >
            <!-- Name -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10">
                  <div class="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <span class="text-sm font-medium text-blue-600 dark:text-blue-300">
                      {{ getInitials(teacher.nombre, teacher.apellido) }}
                    </span>
                  </div>
                </div>
                <div class="ml-4">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ teacher.nombre }} {{ teacher.apellido }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    ID: {{ teacher.id }}
                  </div>
                </div>
              </div>
            </td>

            <!-- Contact -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900 dark:text-white">
                <div v-if="teacher.email">
                  <a :href="`mailto:${teacher.email}`" class="text-blue-600 hover:text-blue-800">
                    {{ teacher.email }}
                  </a>
                </div>
                <div v-if="teacher.telefono" class="text-gray-500 dark:text-gray-400">
                  {{ teacher.telefono }}
                </div>
              </div>
            </td>

            <!-- Specialties -->
            <td class="px-6 py-4">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="specialty in getTeacherSpecialties(teacher)"
                  :key="specialty"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                >
                  {{ specialty }}
                </span>
                <span v-if="!getTeacherSpecialties(teacher).length" class="text-sm text-gray-400">
                  Sin especialidades
                </span>
              </div>
            </td>

            <!-- Classes -->
            <td class="px-6 py-4">
              <div class="text-sm text-gray-900 dark:text-white">
                <span class="font-medium">{{ getTeacherClassCount(teacher) }}</span>
                <span class="text-gray-500 dark:text-gray-400"> clases</span>
              </div>
            </td>

            <!-- Status -->
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  teacher.activo
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                ]"
              >
                <span
                  :class="[
                    'w-1.5 h-1.5 rounded-full mr-1.5',
                    teacher.activo ? 'bg-green-400' : 'bg-red-400'
                  ]"
                ></span>
                {{ teacher.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>

            <!-- Actions -->
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex items-center justify-end space-x-2">
                <button
                  @click="$emit('view-teacher', teacher)"
                  class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  title="Ver detalles"
                >
                  <EyeIcon class="w-4 h-4" />
                </button>
                <button
                  @click="$emit('edit-teacher', teacher)"
                  class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                  title="Editar"
                >
                  <PencilIcon class="w-4 h-4" />
                </button>
                <button
                  @click="$emit('assign-classes', teacher)"
                  class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                  title="Asignar clases"
                >
                  <AcademicCapIcon class="w-4 h-4" />
                </button>
                <button
                  @click="$emit('toggle-status', teacher)"
                  :class="[
                    teacher.activo
                      ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'
                      : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                  ]"
                  :title="teacher.activo ? 'Desactivar' : 'Activar'"
                >
                  <component :is="teacher.activo ? XMarkIcon : CheckIcon" class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>

          <!-- Empty state -->
          <tr v-if="teachers.length === 0">
            <td colspan="6" class="px-6 py-12 text-center">
              <div class="text-gray-500 dark:text-gray-400">
                <AcademicCapIcon class="mx-auto h-12 w-12 text-gray-400" />
                <h3 class="mt-2 text-sm font-medium">No hay maestros</h3>
                <p class="mt-1 text-sm">Comienza agregando un nuevo maestro.</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  EyeIcon,
  PencilIcon,
  AcademicCapIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/vue/24/outline'

// Props
const props = defineProps<{
  teachers: any[]
  loading?: boolean
}>()

// Emits
defineEmits<{
  'view-teacher': [teacher: any]
  'edit-teacher': [teacher: any]
  'assign-classes': [teacher: any]
  'toggle-status': [teacher: any]
}>()

// Sorting
const sortField = ref<string>('nombre')
const sortOrder = ref<'asc' | 'desc'>('asc')

const handleSort = (field: string) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'asc'
  }
}

const sortedTeachers = computed(() => {
  const teachers = [...props.teachers]
  
  return teachers.sort((a, b) => {
    let aValue: any = a[sortField.value]
    let bValue: any = b[sortField.value]
    
    // Handle specific field types
    if (sortField.value === 'name') {
      aValue = `${a.nombre} ${a.apellido}`.toLowerCase()
      bValue = `${b.nombre} ${b.apellido}`.toLowerCase()
    }
    
    if (aValue < bValue) {
      return sortOrder.value === 'asc' ? -1 : 1
    }
    if (aValue > bValue) {
      return sortOrder.value === 'asc' ? 1 : -1
    }
    return 0
  })
})

// Helper functions
const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
}

const getTeacherSpecialties = (teacher: any) => {
  // This should be adapted based on your teacher data structure
  return teacher.especialidades || teacher.instruments || []
}

const getTeacherClassCount = (teacher: any) => {
  // This should be adapted based on your teacher data structure
  return teacher.clases?.length || teacher.classCount || 0
}
</script>
