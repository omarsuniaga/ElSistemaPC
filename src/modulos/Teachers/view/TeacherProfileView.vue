<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTeachersStore } from '../store/teachers'
import { uploadFile } from '../../../services/storage'
import FileUpload from '../../../components/FileUpload.vue'
import { 
  UserIcon, 
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  CameraIcon,
  ChartBarIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  BriefcaseIcon,
  ChevronRightIcon,
  DocumentTextIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const teachersStore = useTeachersStore()

import { getAuth } from 'firebase/auth'
const auth = getAuth()
// Get teacher ID from route params, localStorage or current user
const teacherId = ref(route.params.id as string || localStorage.getItem('teacherId') || auth.currentUser?.uid || '')

// Store teacher ID in localStorage when it changes
watch(teacherId, (newId) => {
  if (newId) {
    localStorage.setItem('teacherId', newId)
  } else {
    localStorage.removeItem('teacherId')
  }
}, { immediate: true })
const isLoading = ref(true)
const error = ref<string | null>(null)
const teacher = computed(() => teachersStore.teachers.find((t: { id: string; [key: string]: any }) => t.id === teacherId.value))

const isUploading = ref(false)

// Watch for teacher changes to handle loading state
watch(teacher, (newTeacher) => {
  if (newTeacher) {
    isLoading.value = false
    error.value = null
  } else {
    error.value = 'No se pudo cargar la información del profesor'
    isLoading.value = false
  }
}, { immediate: true })

const statistics = ref({
  totalStudents: 0,
  averageAttendance: 0,
  classesGiven: 0,
  activeClasses: 0,
  lastUpdated: new Date().toISOString()
})

const loadStatistics = async () => {
  if (!teacher.value) return

  let totalStudents = 0
  try {
    // Use optional chaining since clases might be undefined
    for (const clase of teacher.value.clases || []) {
      const classStudents = await teachersStore.getStudentsForClass(clase)

      totalStudents += classStudents.length
    }
  } catch (err) {
    console.error('Error loading class students:', err)
    throw err
  }

  statistics.value = {
    totalStudents,
    averageAttendance: 0, // TODO: Implement attendance calculation when API method is available
    classesGiven: (await teachersStore.getTeacherClasses(teacherId.value))?.length || 0,
    activeClasses: teacher.value.clases?.length || 0,
    lastUpdated: new Date().toISOString()
  }
}

onMounted(() => {
  loadStatistics().catch(err => {
    console.error('Error loading statistics:', err)
    error.value = 'Error al cargar estadísticas'
  })
})

const handleProfilePhotoUpload = async (files: FileList) => {
  if (!teacher.value || !files.length) return
  
  isUploading.value = true
  try {
    const file = files[0]
    const path = `photos/teachers/${teacher.value.id}/${Date.now()}-${file.name}`
    const result = await uploadFile({ file, path })
    
    await teachersStore.updateTeacher(String(teacherId.value), {
      ...teacher.value,
      avatar: result
    })
  } catch (error) {
    console.error('Error uploading profile photo:', error)
  } finally {
    isUploading.value = false
  }
}

const handleEdit = () => {
  router.push(`/teachers/${teacherId}/edit`)
}

const handleEditEnrollment = () => {
  router.push(`/teachers/${teacherId}/edit-enrollment`)
}

const handleCompleteForm = () => {
  // Navegar al formulario sin afectar el tema
  router.push({
    path: '/complete-profile',
    query: { 
      teacherId: String(teacherId.value),
      mode: 'edit'
    },
    replace: true // Evita que se acumule en el historial
  })
}

const handleDelete = () => {
  router.push(`/teachers/${teacherId}/delete`)
}

</script>

<template>
  <div v-if="!isLoading" class="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
    <div v-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg">
      <p class="font-medium">{{ error }}</p>
    </div>
    <div v-if="teacher" class="space-y-6">
    <!-- Header con foto e información principal -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
      <div class="relative h-40 sm:h-56 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700">
        <!-- Overlay para efecto visual -->
        <div class="absolute inset-0 bg-black/20"></div>
      </div>
      
      <div class="relative px-4 sm:px-6 pb-6">
        <!-- Foto y acciones -->
        <div class="flex flex-col sm:flex-row justify-between items-start gap-4 -mt-16 sm:-mt-20 mb-4 relative z-10">
          <div class="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div class="relative">
              <img
                :src="teacher.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher.name}`"
                :alt="teacher.name"
                class="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-800 object-cover shadow-lg"
              />
              <div class="absolute -bottom-2 -right-2">
                <FileUpload
                  accept="image/*"
                  label=""
                  @select="handleProfilePhotoUpload"
                >
                  <template #default>
                    <button
                      type="button"
                      class="p-2 rounded-full bg-white dark:bg-gray-700 shadow-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      :disabled="isUploading"
                    >
                      <CameraIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                  </template>
                </FileUpload>
              </div>
            </div>
            <div class="ml-0 sm:ml-4">
              <h1 class="text-2xl sm:text-3xl font-bold">
                {{ teacher.nombre }} {{ teacher.apellido }}
              </h1>
              <p class="text-gray-600 dark:text-gray-400 mt-1">
                {{ teacher.titulo || 'Profesor de Música' }}
              </p>
            </div>
          </div>
          
          <!-- Botones de acción -->
          <div class="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            <button
              @click="handleEdit"
              class="btn bg-primary-600 text-white hover:bg-primary-700 transition-colors flex items-center justify-center"
            >
              <PencilIcon class="w-5 h-5 mr-2" />
              Editar Perfil
            </button>
            <button
              @click="handleEditEnrollment"
              class="btn bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <DocumentTextIcon class="w-5 h-5 mr-2" />
              Editar Ficha
            </button>
            <button
              @click="handleCompleteForm"
              class="btn bg-green-600 text-white hover:bg-green-700 transition-colors preserve-theme flex items-center justify-center"
            >
              <DocumentTextIcon class="w-5 h-5 mr-2" />
              Completar
            </button>
            <button
              @click="handleDelete"
              class="btn bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center justify-center"
            >
              <TrashIcon class="w-5 h-5 mr-2" />
              Eliminar
            </button>
          </div>
        </div>

        <!-- Especialidades -->
        <div class="flex flex-wrap gap-2 mb-6">
          <span 
            v-for="esp in teacher.especialidad"
            :key="esp"
            class="px-3 py-1 text-sm bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 rounded-full"
          >
            {{ esp }}
          </span>
        </div>

        <!-- Grid de información -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Columna 1: Información Personal -->
          <div class="space-y-6">
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 shadow-sm transition-all duration-300 hover:shadow-md">
              <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
                <UserIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
                Información Personal
              </h2>
              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <PhoneIcon class="w-4 h-4 text-gray-500" />
                  <p>{{ teacher.phone }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <EnvelopeIcon class="w-4 h-4 text-gray-500" />
                  <p>{{ teacher.email }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <CalendarIcon class="w-4 h-4 text-gray-500" />
                  <p>{{ teacher.edad }} años</p>
                </div>
              </div>
            </div>

            <!-- Experiencia -->
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4" v-if="teacher.experiencia">
              <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
                <BriefcaseIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
                Experiencia
              </h2>
              <p class="text-gray-600 dark:text-gray-400">
                {{ teacher.experiencia }}
              </p>
            </div>
          </div>

          <!-- Columna 2: Estadísticas y Métricas -->
          <div class="space-y-6">
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 shadow-sm transition-all duration-300 hover:shadow-md">
              <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
                <ChartBarIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
                Estadísticas
              </h2>
              <div class="grid grid-cols-2 gap-4">
                <div class="text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <p class="text-2xl font-bold text-primary-600">{{ statistics.activeClasses }}</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Clases Activas</p>
                </div>
                <div class="text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <p class="text-2xl font-bold text-primary-600">{{ statistics.totalStudents }}</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Estudiantes</p>
                </div>
                <div class="text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <p class="text-2xl font-bold text-primary-600">{{ statistics.averageAttendance }}%</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Asistencia</p>
                </div>
                <div class="text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <p class="text-2xl font-bold text-primary-600">{{ statistics.classesGiven }}</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Clases Impartidas</p>
                </div>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                Última actualización: {{ new Date(statistics.lastUpdated).toLocaleDateString() }}
              </p>
            </div>
          </div>

          <!-- Columna 3: Clases y Horarios -->
          <div class="space-y-6">
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 shadow-sm transition-all duration-300 hover:shadow-md">
              <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
                <ClockIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
                Clases Actuales
              </h2>
              <div class="space-y-3">
                <div
                  v-for="clase in teacher.clases"
                  :key="clase"
                  class="p-3 bg-white dark:bg-gray-800 rounded-lg shadow flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                  @click="router.push(`/classes/${clase}`)"
                >
                  <div>
                    <p class="font-medium">{{ clase }}</p>
                  </div>
                  <ChevronRightIcon class="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Descripción/Biografía -->
        <div class="mt-6" v-if="teacher.descripcion">
          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 shadow-sm transition-all duration-300 hover:shadow-md">
            <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
              <DocumentTextIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
              Biografía
            </h2>
            <p class="text-gray-600 dark:text-gray-400 whitespace-pre-line">
              {{ teacher.descripcion }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
    <div v-else class="py-6 text-center">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <p class="text-gray-600 dark:text-gray-400">Maestro no encontrado</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.btn {
  @apply px-4 py-2 rounded-lg text-sm font-medium flex items-center shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors;
}

/* Clase para preservar el tema */
.preserve-theme {
  color-scheme: inherit;
}
</style>