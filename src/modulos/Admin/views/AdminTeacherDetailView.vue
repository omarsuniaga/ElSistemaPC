<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header with breadcrumb and actions -->
    <header
      class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700"
    >
      <div class="px-6 py-4">
        <!-- Breadcrumb -->
        <nav class="flex mb-4" aria-label="Breadcrumb">
          <ol class="inline-flex items-center space-x-1 md:space-x-3">
            <li class="inline-flex items-center">
              <router-link
                to="/admin"
                class="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
              >
                <HomeIcon class="w-4 h-4 mr-2" />
                Admin
              </router-link>
            </li>
            <li>
              <div class="flex items-center">
                <ChevronRightIcon class="w-4 h-4 text-gray-400" />
                <router-link
                  to="/admin/teachers"
                  class="ml-1 text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                >
                  Maestros
                </router-link>
              </div>
            </li>
            <li>
              <div class="flex items-center">
                <ChevronRightIcon class="w-4 h-4 text-gray-400" />
                <span class="ml-1 text-gray-500 dark:text-gray-400">{{
                  teacher?.name || "Cargando..."
                }}</span>
              </div>
            </li>
          </ol>
        </nav>

        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <!-- Teacher Avatar and Basic Info -->
            <div class="flex items-center space-x-4">
              <div class="relative">
                <img
                  v-if="teacher?.photoURL"
                  :src="teacher.photoURL"
                  :alt="teacher.name"
                  class="w-16 h-16 rounded-full object-cover"
                />
                <div
                  v-else
                  class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
                >
                  <span class="text-2xl font-bold text-white">
                    {{ teacher?.name?.charAt(0) || "T" }}
                  </span>
                </div>

                <!-- Status Badge -->
                <div class="absolute -bottom-1 -right-1">
                  <div
                    class="w-5 h-5 rounded-full border-2 border-white dark:border-gray-800"
                    :class="statusColors[teacher?.status] || 'bg-gray-500'"
                  />
                </div>
              </div>

              <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ teacher?.name || "Cargando..." }}
                </h1>
                <div class="flex items-center space-x-4 mt-1">
                  <span class="text-sm text-gray-600 dark:text-gray-400">
                    {{ teacher?.email }}
                  </span>
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="statusBadgeColors[teacher?.status] || 'bg-gray-100 text-gray-800'"
                  >
                    {{ getStatusLabel(teacher?.status) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center space-x-3">
            <router-link
              to="/admin/teachers"
              class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <ArrowLeftIcon class="w-4 h-4 mr-2" />
              Volver a Lista
            </router-link>

            <button
              v-if="canEditTeacher"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PencilIcon class="w-4 h-4 mr-2" />
              Editar
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>

    <!-- Main Content -->
    <main v-else-if="teacher" class="p-6">
      <div class="max-w-6xl mx-auto">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left Column - Basic Info -->
          <div class="lg:col-span-1 space-y-6">
            <!-- Personal Information Card -->
            <div
              class="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center"
              >
                <UserIcon class="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Información Personal
              </h3>

              <div class="space-y-4">
                <div>
                  <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre</label>
                  <p class="text-sm text-gray-900 dark:text-white">{{ teacher.name }}</p>
                </div>

                <div>
                  <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                  <p class="text-sm text-gray-900 dark:text-white">{{ teacher.email }}</p>
                </div>

                <div v-if="teacher.phone">
                  <label class="text-sm font-medium text-gray-500 dark:text-gray-400"
                    >Teléfono</label
                  >
                  <p class="text-sm text-gray-900 dark:text-white">{{ teacher.phone }}</p>
                </div>

                <div v-if="teacher.address">
                  <label class="text-sm font-medium text-gray-500 dark:text-gray-400"
                    >Dirección</label
                  >
                  <p class="text-sm text-gray-900 dark:text-white">{{ teacher.address }}</p>
                </div>

                <div v-if="teacher.hireDate">
                  <label class="text-sm font-medium text-gray-500 dark:text-gray-400"
                    >Fecha de Contratación</label
                  >
                  <p class="text-sm text-gray-900 dark:text-white">
                    {{ formatDate(teacher.hireDate) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Specialties Card -->
            <div
              class="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center"
              >
                <MusicalNoteIcon class="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                Especialidades
              </h3>

              <div class="flex flex-wrap gap-2">
                <span
                  v-for="specialty in teacher.specialties"
                  :key="specialty"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                >
                  {{ specialty }}
                </span>
              </div>
            </div>

            <!-- Quick Stats Card -->
            <div
              class="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center"
              >
                <ChartBarIcon class="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                Estadísticas Rápidas
              </h3>

              <div class="grid grid-cols-2 gap-4">
                <div class="text-center">
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">
                    {{ teacherStats.totalClasses }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Clases Totales</p>
                </div>
                <div class="text-center">
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">
                    {{ teacherStats.totalStudents }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Estudiantes</p>
                </div>
                <div class="text-center">
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">
                    {{ teacherStats.weeklyHours }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Horas/Semana</p>
                </div>
                <div v-if="teacher.hourlyRate" class="text-center">
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">
                    ${{ teacher.hourlyRate }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Tarifa/Hora</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column - Detailed Info -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Biography Card -->
            <div
              v-if="teacher.biography"
              class="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center"
              >
                <DocumentTextIcon class="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Biografía
              </h3>
              <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
                {{ teacher.biography }}
              </p>
            </div>

            <!-- Qualifications Card -->
            <div
              v-if="teacher.qualifications && teacher.qualifications.length > 0"
              class="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center"
              >
                <StarIcon class="w-5 h-5 mr-2 text-yellow-600 dark:text-yellow-400" />
                Calificaciones y Títulos
              </h3>

              <div class="space-y-4">
                <div
                  v-for="qualification in teacher.qualifications"
                  :key="qualification.title"
                  class="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                >
                  <h4 class="font-medium text-gray-900 dark:text-white">
                    {{ qualification.title }}
                  </h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ qualification.institution }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-500">{{ qualification.year }}</p>
                </div>
              </div>
            </div>

            <!-- Schedule Card -->
            <div
              class="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center"
              >
                <CalendarIcon class="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Horario de Clases
              </h3>

              <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <CalendarIcon class="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Horario no disponible</p>
                <p class="text-sm">Los horarios se mostrarán aquí cuando estén disponibles</p>
              </div>
            </div>

            <!-- Activity Timeline Card -->
            <div
              class="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center"
              >
                <ClockIcon class="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" />
                Actividad Reciente
              </h3>

              <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <ClockIcon class="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay actividad reciente</p>
                <p class="text-sm">La actividad del maestro se mostrará aquí</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Error State -->
    <div v-else class="flex items-center justify-center py-12">
      <div class="text-center">
        <ExclamationTriangleIcon class="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Maestro no encontrado
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          El maestro que buscas no existe o ha sido eliminado.
        </p>
        <router-link
          to="/admin/teachers"
          class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Volver a Lista de Maestros
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {useRoute} from "vue-router"
import {
  HomeIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  UserIcon,
  MusicalNoteIcon,
  ChartBarIcon,
  DocumentTextIcon,
  StarIcon,
  CalendarIcon,
  ClockIcon,
  PencilIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/outline"
import {useRBACStore} from "../../../stores/rbacStore"
import {useTeachersStore} from "../../../stores/teachers"
import {TeacherStatus, type Teacher} from "../../../modulos/Teachers/types/teachers"

// Router and stores
const route = useRoute()
const rbacStore = useRBACStore()
const teachersStore = useTeachersStore()

// State
const teacher = ref<Teacher | null>(null)
const isLoading = ref(true)

// Computed
const canEditTeacher = computed(() => rbacStore.canAccess("teachers", "edit"))

// Mock stats - in a real app, this would come from the store or API
const teacherStats = computed(() => ({
  // TODO: Obtener estadísticas reales del maestro del store o API
  totalClasses: 0,
  totalStudents: 0,
  weeklyHours: 0,
}))

// Colors and styling
const statusColors = {
  active: "bg-green-500",
  on_leave: "bg-yellow-500",
  inactive: "bg-red-500",
}

const statusBadgeColors = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  on_leave: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  inactive: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

// Methods
const getStatusLabel = (status: TeacherStatus | undefined): string => {
  switch (status) {
    case TeacherStatus.ACTIVE:
      return "Activo"
    case TeacherStatus.ON_LEAVE:
      return "En Licencia"
    case TeacherStatus.INACTIVE:
      return "Inactivo"
    default:
      return "Desconocido"
  }
}

const formatDate = (date: Date | any): string => {
  if (!date) return ""

  // Handle Firestore Timestamp or Date object
  const dateObj = date.toDate ? date.toDate() : new Date(date)
  return dateObj.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

const loadTeacher = async () => {
  try {
    isLoading.value = true
    const teacherId = route.params.id as string
    teacher.value = await teachersStore.fetchTeacherById(teacherId)
  } catch (error) {
    console.error("Error loading teacher:", error)
    teacher.value = null
  } finally {
    isLoading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadTeacher()
})
</script>

<style scoped>
/* Custom styles can be added here if needed */
</style>
