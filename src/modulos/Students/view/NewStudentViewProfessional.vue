<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
    <!-- Header profesional -->
    <div class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-4">
            <button
              class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              @click="router.push({name: 'Students'})"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Volver a Alumnos
            </button>
            <div class="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
            <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ isEditingExistingStudent ? 'Editar Alumno' : 'Nuevo Alumno' }}
            </h1>
          </div>
          <div class="flex items-center space-x-3">
            <div v-if="isEditingExistingStudent" class="flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
              <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Modo Edición
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Notification toast -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 transform translate-y-2 scale-95"
      enter-to-class="opacity-100 transform translate-y-0 scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 transform translate-y-0 scale-100"
      leave-to-class="opacity-0 transform translate-y-2 scale-95"
    >
      <div
        v-if="notification.show"
        :class="[
          'fixed top-20 right-4 px-6 py-4 rounded-xl shadow-2xl z-50 max-w-md',
          notification.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
            : notification.type === 'warning'
            ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'
            : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
        ]"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg v-if="notification.type === 'success'" class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <svg v-else-if="notification.type === 'warning'" class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <svg v-else class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <p class="text-sm font-medium">{{ notification.message }}</p>
          </div>
          <button
            class="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            @click="notification.show = false"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Contenedor principal -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <form class="space-y-8" @submit.prevent="handleSubmit">
        <!-- Indicador de progreso -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Progreso del Formulario</h2>
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ completionPercentage }}% completado</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              class="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
              :style="{ width: completionPercentage + '%' }"
            ></div>
          </div>
        </div>

        <!-- Información Personal -->
        <StudentPersonalInfo
          v-model:student="newStudent"
          :validation-errors="validationErrors"
          :available-grupos="availableGrupo"
        />

        <!-- Información de Contacto -->
        <StudentContactInfo
          v-model:student="newStudent"
          :validation-errors="validationErrors"
        />

        <!-- Información Adicional -->
        <StudentAdditionalInfo
          v-model:student="newStudent"
          :validation-errors="validationErrors"
        />

        <!-- Error global -->
        <div
          v-if="error"
          class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-xl"
        >
          <div class="flex items-center">
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            {{ error }}
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="flex justify-between items-center pt-6">
          <button 
            type="button" 
            class="px-6 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            @click="router.push({name: 'Students'})"
          >
            Cancelar
          </button>

          <button
            type="submit"
            :disabled="isLoading || !isFormValid"
            class="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
          >
            <svg v-if="isLoading" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            <span>{{ isEditingExistingStudent ? 'Actualizar Alumno' : 'Crear Alumno' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStudentsStore } from '../store/students'
import type { Student } from '../types/student'
import StudentPersonalInfo from '../components/StudentPersonalInfo.vue'
import StudentContactInfo from '../components/StudentContactInfo.vue'
import StudentAdditionalInfo from '../components/StudentAdditionalInfo.vue'
import { useStudentForm } from '../composables/useStudentForm'
import { useStudentValidation } from '../composables/useStudentValidation'

const router = useRouter()
const studentsStore = useStudentsStore()

// Composables
const {
  newStudent,
  isEditingExistingStudent,
  matchedStudent,
  isLoading,
  error,
  notification,
  showNotification,
  handleSubmit,
  clearForm
} = useStudentForm()

const {
  validationErrors,
  isFormValid,
  validateField,
  validateForm
} = useStudentValidation(newStudent)

// Computed properties
const completionPercentage = computed(() => {
  const fields = ['nombre', 'apellido', 'instrumento', 'edad', 'tlf', 'email', 'direccion']
  const filledFields = fields.filter(field => newStudent.value[field as keyof typeof newStudent.value])
  return Math.round((filledFields.length / fields.length) * 100)
})

const availableGrupo = computed(() => {
  const grupoSet = new Set<string>()
  
  studentsStore.students.forEach((student) => {
    if (student.grupo) {
      try {
        if (Array.isArray(student.grupo)) {
          student.grupo.forEach((group) => {
            const cleanValue = cleanGroupValue(group)
            if (cleanValue) grupoSet.add(cleanValue)
          })
        } else if (typeof student.grupo === 'string') {
          const grupoStr = student.grupo as string
          if (grupoStr.startsWith('[') && grupoStr.endsWith(']')) {
            try {
              const parsedGroup = JSON.parse(grupoStr)
              if (Array.isArray(parsedGroup)) {
                parsedGroup.forEach((group) => {
                  const cleanValue = cleanGroupValue(group)
                  if (cleanValue) grupoSet.add(cleanValue)
                })
              } else {
                const cleanValue = cleanGroupValue(grupoStr)
                if (cleanValue) grupoSet.add(cleanValue)
              }
            } catch {
              const cleanValue = cleanGroupValue(grupoStr)
              if (cleanValue) grupoSet.add(cleanValue)
            }
          } else {
            const cleanValue = cleanGroupValue(grupoStr)
            if (cleanValue) grupoSet.add(cleanValue)
          }
        }
      } catch (error) {
        console.error('Error procesando grupo:', error, student.grupo)
      }
    }
  })

  const defaultGroups = ['Coro', 'Orquesta', 'Solfeo', 'Teoría', 'Ensamble']
  if (grupoSet.size < 3) {
    defaultGroups.forEach((group) => grupoSet.add(group))
  }

  return Array.from(grupoSet).sort()
})

// Helper functions
const cleanGroupValue = (group: string): string => {
  if (!group || typeof group !== 'string') return ''

  let cleanValue = group
    .trim()
    .replace(/[[\]"',{}()]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleanValue) return ''

  cleanValue = cleanValue
    .split(' ')
    .map((word) => {
      if (!word) return ''
      if (/^[IVX]+$/i.test(word)) {
        return word.toUpperCase()
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .filter(word => word.length > 0)
    .join(' ')

  return cleanValue
}

// Lifecycle
onMounted(async () => {
  await studentsStore.fetchStudents()
})

// Watchers
watch([() => newStudent.value.nombre, () => newStudent.value.apellido], () => {
  validateField('nombre')
  validateField('apellido')
})
</script>
