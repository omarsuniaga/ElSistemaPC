<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTeachersStore } from '../stores/teachers'
import { uploadFile } from '../services/storage'
import FileUpload from '../components/FileUpload.vue'
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

const teacherId = route.params.id as string
const teacher = computed(() => teachersStore.teachers.find(t => t.id === teacherId))

const isUploading = ref(false)

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
  // Use optional chaining since clases might be undefined
  for (const clase of teacher.value.clases || []) {
    const classStudents = await teachersStore.getClassStudents(clase)
    totalStudents += classStudents.length
  }

  statistics.value = {
    totalStudents,
    averageAttendance: teachersStore.getTeacherAttendanceRate(teacherId),
    classesGiven: teachersStore.getTeacherClassesCount(teacherId),
    activeClasses: teacher.value.clases?.length || 0,
    lastUpdated: new Date().toISOString()
  }
}

onMounted(() => {
  loadStatistics()
})

const handleProfilePhotoUpload = async (files: FileList) => {
  if (!teacher.value || !files.length) return
  
  isUploading.value = true
  try {
    const file = files[0]
    const path = `photos/teachers/${teacher.value.id}/${Date.now()}-${file.name}`
    const result = await uploadFile(file, path, "images")
    
    await teachersStore.updateTeacher(teacherId, {
      ...teacher.value,
      avatar: result.url
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

const handleDelete = () => {
  router.push(`/teachers/${teacherId}/delete`)
}

</script>

<template>
  <div v-if="teacher" class="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header con foto e información principal -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div class="relative h-32 sm:h-48 bg-gradient-to-r from-primary-600 to-primary-800">
        <!-- Overlay para efecto visual -->
        <div class="absolute inset-0 bg-black/20"></div>
      </div>
      
      <div class="relative px-4 sm:px-6 pb-6">
        <!-- Foto y acciones -->
        <div class="flex justify-between items-start -mt-16 sm:-mt-20 mb-4 relative z-10">
          <div class="flex items-end">
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
            <div class="ml-4">
              <h1 class="text-2xl sm:text-3xl font-bold">
                {{ teacher.nombre }} {{ teacher.apellido }}
              </h1>
              <p class="text-gray-600 dark:text-gray-400 mt-1">
                {{ teacher.titulo || 'Profesor de Música' }}
              </p>
            </div>
          </div>
          
          <div class="flex gap-3">
            <button
              @click="handleEdit"
              class="btn bg-primary-600 text-white hover:bg-primary-700 transition-colors"
            >
              <PencilIcon class="w-5 h-5 mr-2" />
              Editar Perfil
            </button>
            <button
              @click="handleDelete"
              class="btn bg-red-600 text-white hover:bg-red-700 transition-colors"
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
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Columna 1: Información Personal -->
          <div class="space-y-6">
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
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
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
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
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
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
          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
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
</template>

<style scoped>
.btn {
  @apply px-4 py-2 rounded-lg text-sm font-medium flex items-center shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors;
}
</style>