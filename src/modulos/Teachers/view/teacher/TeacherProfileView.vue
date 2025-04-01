<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTeachersStore } from '../../store/teachers'
import { uploadFile } from '../../../../services/storage'
import FileUpload from '../../../../components/FileUpload.vue'
import { 
  UserIcon, 
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  CameraIcon,
  ChartBarIcon,
  PencilIcon,
  CalendarIcon,
  BriefcaseIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  SunIcon,
  MoonIcon,
  BookOpenIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const teachersStore = useTeachersStore()

import { getAuth, onAuthStateChanged } from 'firebase/auth'
const auth = getAuth()

// Get teacher ID from route params, localStorage or current user
const teacherId = ref(localStorage.getItem('teacherId') || auth.currentUser?.uid || '')
// Load teacher data when teacherId changes
watch(teacherId, async () => {
  teacher.value = await loadTeacher()
})

onMounted(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      teacherId.value = user.uid
      localStorage.setItem('teacherId', user.uid)
      loadTeacher()
    } else {
      teacherId.value = ''
      localStorage.removeItem('teacherId')
    }
  })
  
  return () => unsubscribe()
})

// Store teacher ID in localStorage when it changes
watch(teacherId, (newId) => {
  if (newId) {
    localStorage.setItem('teacherId', newId)
  } else {
    localStorage.removeItem('teacherId')
  }
}, { immediate: true })

// Add this new watch to reload teacher data when auth state changes
watch(() => auth.currentUser?.uid, async (newUid) => {
  if (newUid) {
    teacherId.value = newUid
    await teachersStore.fetchTeachers()
  }
}, { immediate: true })
const isLoading = ref(true)
const error = ref<string | null>(null)
const teacher = ref<any>(null)

const loadTeacher = async () => {
  if (!teacherId.value) return
  
  // First try to find in store
  const foundTeacher = teachersStore.teachers.find((t: { id: string; [key: string]: any }) => t.id === teacherId.value)
  
  // If not found, try to load from store
  if (!foundTeacher) {
    await teachersStore.fetchTeachers()
    return teachersStore.teachers.find((t: { id: string; [key: string]: any }) => t.id === teacherId.value)
  }
  
  return foundTeacher
}

// Watch for teacherId changes to reload teacher data
watch(teacherId, async () => {
  teacher.value = await loadTeacher()
}, { immediate: true })

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
  router.push(`/teachers/${teacherId.value}/edit`)
}

const handleEditEnrollment = () => {
  router.push(`/teachers/${teacherId}/edit-enrollment`)
}

const handleCompleteForm = () => {
  // Navegar al formulario sin afectar el tema
  router.push({
    path: '/teacher',
    query: { 
      teacherId: String(teacherId.value),
      mode: 'edit'
    },
    replace: true // Evita que se acumule en el historial
  })
}


const isDark = ref(false)
const selectedTimezone = ref('America/New_York')
const timezones = ref([
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'UTC'
])

const toggleDarkMode = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('darkMode', String(isDark.value))
  
  // Update in Firestore if teacher exists
  if (teacher.value) {
    teachersStore.updateTeacher(String(teacherId.value), {
      ...teacher.value,
      preferences: {
        ...teacher.value.preferences,
        darkMode: isDark.value
      }
    }).catch(err => {
      console.error('Error updating dark mode preference:', err)
    })
  }
}

// Load saved preferences on mounted
onMounted(() => {
  const savedDarkMode = localStorage.getItem('darkMode') === 'true'
  const savedTimezone = localStorage.getItem('timezone') || 'America/New_York'
  
  // Check if teacher has darkMode preference in Firestore
  if (teacher.value?.preferences?.darkMode !== undefined) {
    isDark.value = teacher.value.preferences.darkMode
    localStorage.setItem('darkMode', String(isDark.value))
  } else {
    isDark.value = savedDarkMode
  }
  
  selectedTimezone.value = savedTimezone
  document.documentElement.classList.toggle('dark', isDark.value)
})
const updateTimezone = () => {
  localStorage.setItem('timezone', selectedTimezone.value)
}

const handleLogout = async () => {
  try {
    await auth.signOut()
    router.push('/login')
  } catch (error) {
    console.error('Error logging out:', error)
  }
}
</script>

<template>
  <div v-if="!isLoading" class="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
    <!-- Header with utility buttons -->
    <div class="flex justify-between items-center mb-6">
      <div class="flex space-x-4">
        <button 
          @click="toggleDarkMode"
          class="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          <SunIcon v-if="isDark" class="w-5 h-5" />
          <MoonIcon v-else class="w-5 h-5" />
        </button>
      </div>
      <div class="flex space-x-4">
        <select 
          v-model="selectedTimezone" 
          @change="updateTimezone"
          class="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option v-for="tz in timezones" :key="tz" :value="tz">{{ tz }}</option>
        </select>
      </div>
    </div>
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
            <!-- Contenidos -->
            <button
              @click="router.push('/contents')"
              class="btn bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center justify-center"
            >
              <BookOpenIcon class="w-5 h-5 mr-2" />
              Contenidos
            </button>

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
          <!-- Cerrar sesion -->
            <button
              @click="handleLogout"
              class="btn bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center justify-center"
            >
              <ArrowLeftOnRectangleIcon class="w-5 h-5 mr-2" />
              Cerrar sesión
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
                <div v-if="teacher.edad = null " class="flex items-center gap-2">
                  <CalendarIcon class="w-4 h-4 text-gray-500" />
                  <p>{{ teacher.edad }} años</p>
                </div>
              </div>
            </div>

            <!-- Experiencia -->
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 shadow-sm transition-all duration-300 hover:shadow-md" v-if="teacher.experiencia">
              <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
                <BriefcaseIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
                Experiencia Profesional
              </h2>
              <div class="space-y-4">
                <div class="flex items-start gap-4">
                  <div class="w-1/3">
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Institución</p>
                    <p class="text-base font-medium">{{ teacher.experiencia.institution }}</p>
                  </div>
                  <div class="w-1/3">
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Rol</p>
                    <p class="text-base font-medium">{{ teacher.experiencia.role }}</p>
                  </div>
                  <div class="w-1/3">
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Periodo</p>
                    <p class="text-base">{{ new Date(teacher.experiencia.startDate).toLocaleDateString() }} - {{ teacher.experiencia.endDate ? new Date(teacher.experiencia.endDate).toLocaleDateString() : 'Presente' }}</p>
                  </div>
                </div>
                <div class="mt-4">
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Descripción</p>
                  <p class="text-gray-600 dark:text-gray-400 whitespace-pre-line">{{ teacher.experiencia.description }}</p>
                </div>
              </div>
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
              {{ teacher.biography }}
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
  @apply px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors;
}

/* Responsive grid adjustments */
@media (max-width: 768px) {
  .grid-cols-1 {
    grid-template-columns: 1fr;
  }
  
  .grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  
  .flex-col {
    flex-direction: column;
  }
  
  .flex-wrap {
    flex-wrap: wrap;
  }
  
  .space-y-6 > * + * {
    margin-top: 1.5rem;
  }
  
  .px-4 {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .py-8 {
    padding-top: 2rem;
    padding-bottom: 2rem;
  }
}

/* Touch-friendly elements */
button, [role="button"] {
  min-height: 44px;
  min-width: 44px;
}

/* Improved mobile header */
@media (max-width: 640px) {
  .flex.justify-between {
    flex-direction: column;
    gap: 1rem;
  }
  
  .flex.space-x-4 {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  select {
    width: 100%;
    margin-bottom: 0.5rem;
  }
}

/* Profile section adjustments */
@media (max-width: 640px) {
  .flex.flex-col.sm\:flex-row {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .ml-0.sm\:ml-4 {
    margin-left: 0;
    margin-top: 1rem;
  }
  
  .flex.flex-wrap.gap-2.sm\:gap-3 {
    justify-content: center;
  }
}

/* Action buttons spacing */
@media (max-width: 640px) {
  .flex.flex-wrap.gap-2.sm\:gap-3 {
    gap: 0.5rem;
  }
  
  .btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }
}

/* Specialties chips */
@media (max-width: 640px) {
  .flex.flex-wrap.gap-2 {
    justify-content: center;
  }
}

/* Stats cards */
@media (max-width: 640px) {
  .grid.grid-cols-2.gap-4 {
    gap: 0.5rem;
  }
  
  .text-center.p-3 {
    padding: 0.75rem;
  }
  
  .text-2xl {
    font-size: 1.25rem;
  }
}

/* Preserve theme class */
.preserve-theme {
  color-scheme: inherit;
}
</style>