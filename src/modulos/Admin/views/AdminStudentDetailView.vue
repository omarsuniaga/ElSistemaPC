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
                  to="/admin/students"
                  class="ml-1 text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                >
                  Estudiantes
                </router-link>
              </div>
            </li>
            <li>
              <div class="flex items-center">
                <ChevronRightIcon class="w-4 h-4 text-gray-400" />
                <span class="ml-1 text-gray-500 dark:text-gray-400">{{
                  student?.name || "Cargando..."
                }}</span>
              </div>
            </li>
          </ol>
        </nav>

        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <!-- Student Avatar and Basic Info -->
            <div class="flex items-center space-x-4">
              <div class="relative">
                <img
                  v-if="student?.avatar"
                  :src="student.avatar"
                  :alt="student.name"
                  class="w-16 h-16 rounded-full object-cover"
                />
                <div
                  v-else
                  class="w-16 h-16 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-xl"
                >
                  {{ getInitials(student?.name || "") }}
                </div>

                <!-- Status indicator -->
                <div
                  v-if="student"
                  :class="[
                    'absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-gray-800',
                    statusColors[student.status],
                  ]"
                />
              </div>

              <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ student?.name || "Cargando..." }}
                </h1>
                <div
                  class="flex items-center space-x-4 mt-1 text-sm text-gray-600 dark:text-gray-400"
                >
                  <span>{{ student?.email }}</span>
                  <span>•</span>
                  <span>{{ formatPhone(student?.phone || "") }}</span>
                  <span>•</span>
                  <span
                    v-if="student"
                    :class="statusBadgeColors[student.status]"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  >
                    {{ getStatusName(student.status) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center space-x-3">
            <router-link
              to="/admin/students"
              class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <ArrowLeftIcon class="w-4 h-4 mr-2" />
              Volver a Lista
            </router-link>

            <button
              v-if="canEditStudent && student"
              class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              @click="editStudent"
            >
              <PencilIcon class="w-4 h-4 mr-2" />
              Editar
            </button>

            <button
              v-if="canEditStudent && student"
              :class="[
                'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2',
                student.status === 'active'
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  : 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
              ]"
              @click="toggleStatus"
            >
              <component
                :is="student.status === 'active' ? PauseIcon : PlayIcon"
                class="w-4 h-4 mr-2"
              />
              {{ student.status === "active" ? "Desactivar" : "Activar" }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main v-if="student" class="p-6">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left Column - Main Info -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Personal Information -->
            <div
              class="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <UserIcon class="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Información Personal
                </h2>
              </div>
              <div class="p-6">
                <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Nombre Completo
                    </dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ student.name }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Correo Electrónico
                    </dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ student.email }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Teléfono</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                      {{ formatPhone(student.phone) }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Fecha de Nacimiento
                    </dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                      {{ formatDate(student.birthDate) }}
                    </dd>
                  </div>
                  <div class="sm:col-span-2">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Dirección</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                      {{ student.address || "No especificada" }}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <!-- Parent/Guardian Information -->
            <div
              class="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <UsersIcon class="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                  Información del Padre/Tutor
                </h2>
              </div>
              <div class="p-6">
                <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                      {{ student.parentName }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Teléfono</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                      {{ formatPhone(student.parentPhone) }}
                    </dd>
                  </div>
                  <div class="sm:col-span-2">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Correo Electrónico
                    </dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                      {{ student.parentEmail || "No especificado" }}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <!-- Academic Information -->
            <div
              class="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <AcademicCapIcon class="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                  Información Académica
                </h2>
              </div>
              <div class="p-6">
                <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Nivel</dt>
                    <dd class="mt-1">
                      <span
                        :class="gradeColors[student.grade]"
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      >
                        {{ getGradeName(student.grade) }}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Fecha de Inscripción
                    </dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                      {{ formatDate(student.enrollmentDate) }}
                    </dd>
                  </div>
                  <div class="sm:col-span-2">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Instrumentos
                    </dt>
                    <dd class="mt-2 flex flex-wrap gap-2">
                      <span
                        v-for="instrument in student.instruments"
                        :key="instrument"
                        class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        <MusicalNoteIcon class="w-4 h-4 mr-1" />
                        {{ getInstrumentName(instrument) }}
                      </span>
                    </dd>
                  </div>
                  <div v-if="student.notes" class="sm:col-span-2">
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Notas</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ student.notes }}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          <!-- Right Column - Quick Stats and Actions -->
          <div class="space-y-6">
            <!-- Quick Stats -->
            <div
              class="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Estadísticas Rápidas
                </h2>
              </div>
              <div class="p-6 space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500 dark:text-gray-400">Clases Inscritas</span>
                  <span class="text-lg font-semibold text-gray-900 dark:text-white">{{
                    student.classes?.length || 0
                  }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500 dark:text-gray-400">Instrumentos</span>
                  <span class="text-lg font-semibold text-gray-900 dark:text-white">{{
                    student.instruments.length
                  }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500 dark:text-gray-400">Estado</span>
                  <span
                    :class="statusBadgeColors[student.status]"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  >
                    {{ getStatusName(student.status) }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500 dark:text-gray-400">Tiempo Inscrito</span>
                  <span class="text-sm text-gray-900 dark:text-white">{{
                    getTimeEnrolled(student.enrollmentDate)
                  }}</span>
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div
              class="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Acciones Rápidas
                </h2>
              </div>
              <div class="p-6 space-y-3">
                <button
                  v-if="canEditStudent"
                  class="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  @click="editStudent"
                >
                  <PencilIcon class="w-4 h-4 mr-2" />
                  Editar Información
                </button>

                <button
                  v-if="canEditStudent"
                  class="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  @click="assignToClass"
                >
                  <AcademicCapIcon class="w-4 h-4 mr-2" />
                  Asignar a Clase
                </button>

                <button
                  class="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  @click="viewAttendance"
                >
                  <ClipboardDocumentCheckIcon class="w-4 h-4 mr-2" />
                  Ver Asistencias
                </button>

                <button
                  class="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  @click="viewProgress"
                >
                  <ChartBarIcon class="w-4 h-4 mr-2" />
                  Ver Progreso
                </button>
              </div>
            </div>

            <!-- Timeline/Activity -->
            <div
              class="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Actividad Reciente
                </h2>
              </div>
              <div class="p-6">
                <div class="flow-root">
                  <ul class="-mb-8">
                    <li>
                      <div class="relative pb-8">
                        <div class="relative flex space-x-3">
                          <div>
                            <span
                              class="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white dark:ring-gray-800"
                            >
                              <UserIcon class="h-4 w-4 text-white" />
                            </span>
                          </div>
                          <div class="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p class="text-sm text-gray-500 dark:text-gray-400">
                                Estudiante inscrito
                              </p>
                            </div>
                            <div
                              class="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400"
                            >
                              {{ formatDate(student.enrollmentDate) }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>

    <!-- Error State -->
    <div v-else class="text-center py-12">
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
        Estudiante no encontrado
      </h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        El estudiante que buscas no existe o no tienes permisos para verlo.
      </p>
      <div class="mt-6">
        <router-link
          to="/admin/students"
          class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Volver a Lista
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {useRoute, useRouter} from "vue-router"
import {useRBACStore} from "../../../stores/rbacStore"
import {useAdminStudentsStore} from "../store/adminStudents"
import {
  HomeIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  PencilIcon,
  UserIcon,
  UsersIcon,
  AcademicCapIcon,
  MusicalNoteIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  PlayIcon,
  PauseIcon,
} from "@heroicons/vue/24/outline"
import type {Student} from "../store/adminStudents"

// Router and stores
const route = useRoute()
const router = useRouter()
const rbacStore = useRBACStore()
const studentsStore = useAdminStudentsStore()

// State
const student = ref<Student | null>(null)
const isLoading = ref(true)

// Computed
const canEditStudent = computed(() => rbacStore.canAccess("students", "edit"))

// Colors and styling
const statusColors = {
  active: "bg-green-500",
  inactive: "bg-red-500",
  pending: "bg-yellow-500",
}

const statusBadgeColors = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  inactive: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
}

const gradeColors = {
  beginner: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  intermediate: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  advanced: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
}

// Methods
const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .substring(0, 2)
    .toUpperCase()
}

const formatPhone = (phone: string): string => {
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3")
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

const getInstrumentName = (instrument: string): string => {
  const instruments: Record<string, string> = {
    piano: "Piano",
    guitar: "Guitarra",
    violin: "Violín",
    drums: "Batería",
    voice: "Canto",
    bass: "Bajo",
    flute: "Flauta",
    saxophone: "Saxofón",
    trumpet: "Trompeta",
    cello: "Violonchelo",
  }
  return instruments[instrument] || instrument
}

const getGradeName = (grade: string): string => {
  const grades: Record<string, string> = {
    beginner: "Principiante",
    intermediate: "Intermedio",
    advanced: "Avanzado",
  }
  return grades[grade] || grade
}

const getStatusName = (status: string): string => {
  const statuses: Record<string, string> = {
    active: "Activo",
    inactive: "Inactivo",
    pending: "Pendiente",
  }
  return statuses[status] || status
}

const getTimeEnrolled = (enrollmentDate: Date): string => {
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - enrollmentDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 30) {
    return `${diffDays} días`
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `${months} mes${months !== 1 ? "es" : ""}`
  } else {
    const years = Math.floor(diffDays / 365)
    return `${years} año${years !== 1 ? "s" : ""}`
  }
}

// Event handlers
const editStudent = () => {
  // Open edit modal or navigate to edit page
  console.log("Edit student:", student.value?.id)
}

const toggleStatus = async () => {
  if (student.value) {
    const newStatus = student.value.status === "active" ? "inactive" : "active"
    await studentsStore.updateStudentStatus(student.value.id, newStatus)
    student.value.status = newStatus
  }
}

const assignToClass = () => {
  console.log("Assign to class:", student.value?.id)
}

const viewAttendance = () => {
  console.log("View attendance:", student.value?.id)
}

const viewProgress = () => {
  console.log("View progress:", student.value?.id)
}

// Load student data
const loadStudent = async () => {
  try {
    isLoading.value = true
    const studentId = route.params.id as string
    student.value = await studentsStore.getStudent(studentId)
  } catch (error) {
    console.error("Error loading student:", error)
  } finally {
    isLoading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadStudent()
})
</script>

<style scoped>
/* Component-specific styles */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
