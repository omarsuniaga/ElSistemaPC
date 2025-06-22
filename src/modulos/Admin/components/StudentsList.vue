<template>
  <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">{{ title }}</h3>
    <div class="space-y-3">
      <div 
        v-for="student in students" 
        :key="student.id" 
        class="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg hover:shadow-sm transition-shadow"
      >
        <div class="flex items-center">
          <div class="relative">
            <img 
              :src="getStudentAvatar(student)"
              :alt="getStudentName(student)"
              class="w-10 h-10 rounded-full object-cover"
              @error="handleImageError"
            />
            <div 
              v-if="student.activo === false" 
              class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"
              title="Estudiante inactivo"
            ></div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ getStudentName(student) }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ getStudentInstrument(student) }}
            </p>
            <p v-if="showClass && student.clase" class="text-xs text-blue-600 dark:text-blue-400">
              {{ student.clase }}
            </p>
          </div>
        </div>
        <div class="text-right">
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ formatDate(student.createdAt) }}
          </span>
          <div v-if="showStatus" class="mt-1">
            <span 
              :class="[
                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                student.activo 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              ]"
            >
              {{ student.activo ? 'Activo' : 'Inactivo' }}
            </span>
          </div>
        </div>
      </div>
      
      <div v-if="students.length === 0" class="text-center py-8">
        <UsersIcon class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
        <p class="text-gray-500 dark:text-gray-400">No hay estudiantes para mostrar</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UsersIcon } from '@heroicons/vue/24/outline'

interface Student {
  id: string
  nombre?: string
  apellido?: string
  instrumento?: string
  instrumentos?: string[]
  clase?: string
  activo?: boolean
  createdAt?: any
  avatar?: string
}

interface Props {
  students: Student[]
  title?: string
  showClass?: boolean
  showStatus?: boolean
}

withDefaults(defineProps<Props>(), {
  title: 'Estudiantes Recientes',
  showClass: false,
  showStatus: false
})

const getStudentName = (student: Student): string => {
  return `${student.nombre || ''} ${student.apellido || ''}`.trim() || 'Sin nombre'
}

const getStudentInstrument = (student: Student): string => {
  if (student.instrumento) return student.instrumento
  if (student.instrumentos?.length) return student.instrumentos.join(', ')
  return 'No asignado'
}

const getStudentAvatar = (student: Student): string => {
  if (student.avatar) return student.avatar
  const name = getStudentName(student)
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`
}

const formatDate = (date: any): string => {
  if (!date) return 'Sin fecha'
  try {
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleDateString('es-ES')
  } catch {
    return 'Fecha inválida'
  }
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.src = 'https://ui-avatars.com/api/?name=Usuario&background=6b7280&color=fff'
}
</script>
