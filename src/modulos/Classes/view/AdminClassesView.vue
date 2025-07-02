<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Container principal con responsive mejorado -->
    <div class="px-4 py-6 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <!-- Header con título y acciones - Mejorado responsive -->
        <div class="mb-6 lg:mb-8">
          <div
            class="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0"
          >
            <!-- Título section -->
            <div class="flex-1 min-w-0">
              <h1
                class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white transition-colors"
              >
                Administración de Clases
              </h1>
              <p
                class="mt-1 text-sm sm:text-base text-gray-500 dark:text-gray-400 transition-colors"
              >
                Gestiona todas las clases, horarios y asignaciones de la academia
              </p>

              <!-- Stats rápidas en mobile -->
              <div class="mt-3 flex items-center space-x-4 lg:hidden">
                <div class="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <AcademicCapIcon class="h-4 w-4 mr-1" />
                  <span>{{ classes.length }} clases</span>
                </div>
                <div class="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <UsersIcon class="h-4 w-4 mr-1" />
                  <span>{{ totalStudents }} estudiantes</span>
                </div>
              </div>
            </div>

            <!-- Action buttons - Responsive mejorado -->
            <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <!-- Botón de filtros (mobile) -->
              <button
                class="sm:hidden inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition-colors duration-200"
                @click="showFilters = !showFilters"
              >
                <FunnelIcon class="h-5 w-5 mr-2" />
                Filtros
              </button>

              <!-- Botón nueva clase -->
              <button
                class="inline-flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition-colors duration-200"
                @click="showCreateDialog = true"
              >
                <PlusIcon class="h-5 w-5 mr-2" />
                <span class="hidden sm:inline">Nueva Clase</span>
                <span class="sm:hidden">Nueva</span>
              </button>
            </div>
          </div>

          <!-- Stats desktop -->
          <div class="hidden lg:flex mt-4 space-x-6">
            <div class="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <AcademicCapIcon class="h-5 w-5 mr-2 text-indigo-500" />
              <span class="font-medium">{{ classes.length }}</span>
              <span class="ml-1">clases activas</span>
            </div>
            <div class="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <UsersIcon class="h-5 w-5 mr-2 text-green-500" />
              <span class="font-medium">{{ totalStudents }}</span>
              <span class="ml-1">estudiantes inscritos</span>
            </div>
            <div class="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <UserGroupIcon class="h-5 w-5 mr-2 text-purple-500" />
              <span class="font-medium">{{ activeTeachers }}</span>
              <span class="ml-1">maestros activos</span>
            </div>
          </div>
        </div>

        <!-- Filtros y pestañas mejorados -->
        <div class="space-y-4">
          <!-- Filtros (visible en mobile cuando se activa) -->
          <div :class="['lg:block', showFilters ? 'block' : 'hidden']">
            <div
              class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors"
            >
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Búsqueda -->
                <div class="relative">
                  <MagnifyingGlassIcon
                    class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                  />
                  <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Buscar clases..."
                    class="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>

                <!-- Filtro por instrumento -->
                <select
                  v-model="selectedInstrument"
                  class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                >
                  <option value="">Todos los instrumentos</option>
                  <option
                    v-for="instrument in availableInstruments"
                    :key="instrument"
                    :value="instrument"
                  >
                    {{ instrument }}
                  </option>
                </select>

                <!-- Filtro por maestro -->
                <select
                  v-model="selectedTeacher"
                  class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                >
                  <option value="">Todos los maestros</option>
                  <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
                    {{ teacher.name }}
                  </option>
                </select>

                <!-- Filtro por estado -->
                <select
                  v-model="selectedStatus"
                  class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                >
                  <option value="">Todos los estados</option>
                  <option value="active">Activas</option>
                  <option value="inactive">Inactivas</option>
                  <option value="shared">Compartidas</option>
                </select>
              </div>

              <!-- Filtros activos -->
              <div v-if="hasActiveFilters" class="mt-3 flex flex-wrap gap-2">
                <span class="text-xs text-gray-500 dark:text-gray-400">Filtros activos:</span>
                <button
                  v-if="searchQuery"
                  class="inline-flex items-center px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full"
                  @click="searchQuery = ''"
                >
                  "{{ searchQuery }}"
                  <XMarkIcon class="ml-1 h-3 w-3" />
                </button>
                <button
                  v-if="selectedInstrument"
                  class="inline-flex items-center px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full"
                  @click="selectedInstrument = ''"
                >
                  {{ selectedInstrument }}
                  <XMarkIcon class="ml-1 h-3 w-3" />
                </button>
                <button
                  class="inline-flex items-center px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                  @click="clearAllFilters"
                >
                  Limpiar todo
                </button>
              </div>
            </div>
          </div>

          <!-- Pestañas mejoradas -->
          <div
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
          >
            <div class="border-b border-gray-200 dark:border-gray-700">
              <nav class="flex overflow-x-auto" aria-label="Tabs">
                <button
                  :class="[
                    'whitespace-nowrap py-4 px-4 sm:px-6 border-b-2 font-medium text-sm flex items-center transition-colors',
                    tab === 'classes'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600',
                  ]"
                  @click="tab = 'classes'"
                >
                  <AcademicCapIcon class="mr-2 h-5 w-5" />
                  <span class="hidden sm:inline">Todas las Clases</span>
                  <span class="sm:hidden">Clases</span>
                  <span
                    v-if="filteredClasses.length > 0"
                    class="ml-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-xs font-medium px-2.5 py-0.5 rounded-full"
                  >
                    {{ filteredClasses.length }}
                  </span>
                </button>
                <button
                  :class="[
                    'whitespace-nowrap py-4 px-4 sm:px-6 border-b-2 font-medium text-sm flex items-center transition-colors',
                    tab === 'schedule'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600',
                  ]"
                  @click="tab = 'schedule'"
                >
                  <CalendarIcon class="mr-2 h-5 w-5" />
                  <span class="hidden sm:inline">Horarios</span>
                  <span class="sm:hidden">Agenda</span>
                </button>
                <button
                  :class="[
                    'whitespace-nowrap py-4 px-4 sm:px-6 border-b-2 font-medium text-sm flex items-center transition-colors',
                    tab === 'shared'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600',
                  ]"
                  @click="tab = 'shared'"
                >
                  <ShareIcon class="mr-2 h-5 w-5" />
                  <span class="hidden sm:inline">Clases Compartidas</span>
                  <span class="sm:hidden">Compartidas</span>
                  <span
                    v-if="sharedClasses.length > 0"
                    class="ml-2 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 text-xs font-medium px-2.5 py-0.5 rounded-full"
                  >
                    {{ sharedClasses.length }}
                  </span>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenido principal -->
      <div class="space-y-6">
        <!-- Estado de carga mejorado -->
        <div
          v-if="loading"
          class="flex justify-center items-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
        >
          <div class="text-center">
            <div
              class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"
            />
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Cargando clases...</p>
          </div>
        </div>

        <!-- Contenido principal mejorado -->
        <template v-else>
          <!-- Vista de clases -->
          <div v-if="tab === 'classes'">
            <!-- Lista vacía mejorada -->
            <div
              v-if="filteredClasses.length === 0"
              class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
            >
              <div class="text-center py-12 px-4">
                <div
                  class="mx-auto h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4"
                >
                  <AcademicCapIcon class="h-12 w-12 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {{ hasActiveFilters ? "No se encontraron clases" : "No hay clases registradas" }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {{
                    hasActiveFilters
                      ? "Intenta ajustar los filtros para encontrar las clases que buscas."
                      : "Comienza creando una nueva clase para organizar los estudiantes y horarios."
                  }}
                </p>
                <div class="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    v-if="hasActiveFilters"
                    class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    @click="clearAllFilters"
                  >
                    <XMarkIcon class="mr-2 h-4 w-4" />
                    Limpiar Filtros
                  </button>
                  <button
                    class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    @click="showCreateDialog = true"
                  >
                    <PlusIcon class="mr-2 h-4 w-4" />
                    Nueva Clase
                  </button>
                </div>
              </div>
            </div>

            <!-- Lista de clases mejorada -->
            <ClassList
              v-else
              :classes="filteredClasses"
              :loading="loading"
              class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
              @edit="editClass"
              @delete="confirmDelete"
              @view-schedule="viewSchedule"
              @manage-sharing="manageSharing"
            />
          </div>

          <!-- Vista de horarios -->
          <div
            v-else-if="tab === 'schedule'"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
          >
            <ClassScheduleView :classes="filteredClasses" />
          </div>

          <!-- Vista de clases compartidas -->
          <div v-else-if="tab === 'shared'" class="space-y-6">
            <SharedClassesList
              :classes="classes"
              @edit="editClass"
              @manage-permissions="managePermissions"
              @view-schedule="viewSchedule"
            />
          </div>
        </template>
      </div>
    </div>

    <!-- Diálogo de creación/edición -->
    <ClassFormDialog
      :open="showCreateDialog"
      :class-data="editingClass"
      @save="handleSave"
      @close="
        () => {
          showCreateDialog = false
          editingClass = null
        }
      "
    />

    <!-- Diálogo de confirmación de eliminación -->
    <div
      v-if="showDeleteDialog"
      class="fixed z-10 inset-0 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
      >
        <!-- Fondo del modal -->
        <div
          class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          @click="showDeleteDialog = false"
        />

        <!-- Espacio para evitar que el contenido se desplace -->
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true"
          >&#8203;</span
        >

        <!-- Contenido del modal -->
        <div
          class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
        >
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div
                class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"
              >
                <svg
                  class="h-6 w-6 text-red-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 id="modal-title" class="text-lg leading-6 font-medium text-gray-900">
                  Eliminar clase
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    ¿Estás seguro de que deseas eliminar la clase
                    <span class="font-medium">"{{ editingClass?.name }}"</span>? Esta acción no se
                    puede deshacer.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
              :disabled="deleting"
              @click="deleteClass"
            >
              <span v-if="deleting" class="flex items-center">
                <svg
                  class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Eliminando...
              </span>
              <span v-else>Eliminar</span>
            </button>
            <button
              type="button"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              :disabled="deleting"
              @click="showDeleteDialog = false"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Permissions Modal -->
  <div
    v-if="showPermissionsModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    @click="closePermissionsModal"
  >
    <div class="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full" @click.stop>
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Compartir Clase</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {{ selectedClassForPermissions?.name }}
            </p>
          </div>
          <button
            class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            @click="closePermissionsModal"
          >
            ✕
          </button>
        </div>
      </div>

      <div class="p-6">
        <div class="space-y-4">
          <div
            v-if="getSharedTeachers(selectedClassForPermissions).length === 0"
            class="text-center py-4 text-gray-500 dark:text-gray-400"
          >
            <p>Esta clase no está compartida con otros maestros.</p>
          </div>
          <div v-else>
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Maestros con acceso:
            </h4>
            <div class="space-y-3">
              <div
                v-for="teacherInfo in getSharedTeachers(selectedClassForPermissions)"
                :key="teacherInfo.id"
                class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ teacherInfo.name }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{
                      getPermissionText(
                        getTeacherPermissions(selectedClassForPermissions, teacherInfo.id)
                      )
                    }}
                  </p>
                </div>
                <select
                  :value="getPermissionLevel(selectedClassForPermissions, teacherInfo.id)"
                  class="ml-4 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  @change="
                    updatePermission(
                      teacherInfo.id,
                      ($event.target as HTMLSelectElement)?.value || 'read'
                    )
                  "
                >
                  <option value="read">Solo lectura</option>
                  <option value="write">Editor</option>
                  <option value="manage">Administrador</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end space-x-3">
          <button
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            @click="closePermissionsModal"
          >
            Cancelar
          </button>
          <button
            class="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            @click="savePermissions"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, computed} from "vue"
import {useRouter} from "vue-router"
import {storeToRefs} from "pinia"
import {useClassesStore} from "../store/classes"
import {useTeachersStore} from "../../Teachers/store/teachers"
import {useStudentsStore} from "../../Students/store/students"
import {defineAsyncComponent, type Component} from "vue"
import {useNotification} from "../../../composables/useNotification"

// Heroicons
import {
  AcademicCapIcon,
  UsersIcon,
  UserGroupIcon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CalendarIcon,
  ShareIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/outline"

// Tipos
import type {ClassData} from "../types/class"

// Helper function para async components
type ComponentModule = {default: Component}
type ComponentLoader = () => Promise<ComponentModule>

function createAsyncComponent(loader: ComponentLoader, delay = 200, timeout = 3000) {
  return defineAsyncComponent({
    loader: async () => {
      const component = await loader()
      return component
    },
    delay,
    timeout,
  })
}

// Componentes async
const ClassList = createAsyncComponent(() => import("../components/ClassList.vue"))

const ClassFormDialog = createAsyncComponent(() => import("../components/ClassFormDialog.vue"))

const ClassScheduleView = createAsyncComponent(() => import("../components/WeeklyScheduleView.vue"))

const SharedClassesList = createAsyncComponent(() => import("../components/SharedClassesList.vue"))

// Router y stores
const router = useRouter()
const classesStore = useClassesStore()
const teachersStore = useTeachersStore()
const studentsStore = useStudentsStore()

// Sistema de notificaciones simple
const showNotification = (
  message: string,
  type: "success" | "error" | "warning" | "info" = "info"
) => {
  // Crear una notificación temporal usando alert como fallback
  if (type === "error") {
    console.error("❌", message)
    alert(`Error: ${message}`)
  } else if (type === "success") {
    console.log("✅", message)
    alert(`Éxito: ${message}`)
  } else {
    console.log(message)
    alert(message)
  }
}

// Estado reactivo
const tab = ref<"classes" | "schedule" | "shared">("classes")
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const showFilters = ref(false)
const editingClass = ref<ClassData | null>(null)
const loading = ref(true)
const deleting = ref(false)

// Permissions modal
const showPermissionsModal = ref(false)
const selectedClassForPermissions = ref<ClassData | null>(null)
const tempPermissions = ref<Record<string, string[]>>({})

// Filtros
const searchQuery = ref("")
const selectedInstrument = ref("")
const selectedTeacher = ref("")
const selectedStatus = ref("")

// Obtener datos del store
const {classes} = storeToRefs(classesStore)
const {teachers} = storeToRefs(teachersStore)
const {students} = storeToRefs(studentsStore)

// Computed properties mejoradas
const filteredClasses = computed(() => {
  let filtered = [...classes.value]

  // Filtro por búsqueda
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (cls) =>
        cls.name?.toLowerCase().includes(query) ||
        cls.level?.toLowerCase().includes(query) ||
        cls.instrument?.toLowerCase().includes(query) ||
        getTeacherName(cls.teacherId).toLowerCase().includes(query)
    )
  }

  // Filtro por instrumento
  if (selectedInstrument.value) {
    filtered = filtered.filter((cls) => cls.instrument === selectedInstrument.value)
  }

  // Filtro por maestro
  if (selectedTeacher.value) {
    filtered = filtered.filter(
      (cls) =>
        cls.teacherId === selectedTeacher.value ||
        (cls.teachers &&
          Array.isArray(cls.teachers) &&
          cls.teachers.includes(selectedTeacher.value))
    )
  }

  // Filtro por estado
  if (selectedStatus.value) {
    switch (selectedStatus.value) {
      case "active":
        filtered = filtered.filter((cls) => cls.status === "active")
        break
      case "inactive":
        filtered = filtered.filter((cls) => cls.status === "inactive")
        break
      case "shared":
        filtered = filtered.filter(
          (cls) => cls.teachers && Array.isArray(cls.teachers) && cls.teachers.length > 0
        )
        break
    }
  }

  return filtered
})

const sharedClasses = computed(() => {
  // Usar la nueva lógica con la propiedad 'teachers' de Firestore
  const shared = classes.value.filter(
    (cls) => cls.teachers && Array.isArray(cls.teachers) && cls.teachers.length > 0
  )

  console.log("🔗 AdminClassesView - Clases compartidas encontradas:", shared.length)
  shared.forEach((cls) => {
    console.log(`- ${cls.name}: teachers = [${cls.teachers?.join(", ")}]`)
  })

  return shared
})

const availableInstruments = computed(() => {
  const instruments = new Set(classes.value.map((cls) => cls.instrument).filter(Boolean))
  return Array.from(instruments).sort()
})

const totalStudents = computed(() => {
  return classes.value.reduce((total, cls) => total + (cls.studentIds?.length || 0), 0)
})

const activeTeachers = computed(() => {
  const teacherIds = new Set(classes.value.map((cls) => cls.teacherId).filter(Boolean))
  return teacherIds.size
})

const hasActiveFilters = computed(() => {
  return !!(
    searchQuery.value ||
    selectedInstrument.value ||
    selectedTeacher.value ||
    selectedStatus.value
  )
})

// Métodos auxiliares
const getTeacherName = (teacherId?: string): string => {
  if (!teacherId) return "Sin asignar"
  const teacher = teachers.value.find((t) => t.id === teacherId)
  return teacher ? teacher.name : "Maestro no encontrado"
}

const clearAllFilters = () => {
  searchQuery.value = ""
  selectedInstrument.value = ""
  selectedTeacher.value = ""
  selectedStatus.value = ""
  showFilters.value = false
}

// Cargar datos iniciales
const loadInitialData = async () => {
  loading.value = true
  try {
    // Forzar recarga de datos desde Firestore
    await classesStore.forceSync()

    // Si aún no hay clases, intentar cargarlas de nuevo
    if (classesStore.getAllClasses.length === 0) {
      await classesStore.fetchClasses()
    }

    // Mostrar notificación si hay clases cargadas
    if (classesStore.getAllClasses.length > 0) {
      console.log(`Cargadas ${classesStore.getAllClasses.length} clases`)
    }
  } catch (error) {
    console.error("Error cargando clases:", error)
    showNotification("Error al cargar las clases. Por favor, inténtalo de nuevo.", "error")
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(loadInitialData)

// Métodos de la UI
const editClass = (classItem: ClassData) => {
  editingClass.value = {...classItem}
  showCreateDialog.value = true
}

const confirmDelete = (classItem: ClassData) => {
  editingClass.value = {...classItem}
  showDeleteDialog.value = true
}

const viewSchedule = (classItem: ClassData) => {
  tab.value = "schedule"
  // Aquí podrías añadir lógica para resaltar el horario de la clase seleccionada
}

const manageSharing = (classItem: ClassData) => {
  // Implementar gestión de compartir clases
  editingClass.value = {...classItem}
  selectedClassForPermissions.value = classItem
  tempPermissions.value = {...classItem.permissions} || {}
  showPermissionsModal.value = true
}

const managePermissions = (classItem: ClassData) => {
  // Implementar gestión de permisos para clases compartidas
  editingClass.value = {...classItem}
  selectedClassForPermissions.value = classItem
  tempPermissions.value = {...classItem.permissions} || {}
  showPermissionsModal.value = true
}

// Funciones de gestión de permisos
const closePermissionsModal = () => {
  showPermissionsModal.value = false
  selectedClassForPermissions.value = null
  tempPermissions.value = {}
}

const getSharedTeachers = (classItem: ClassData | null) => {
  if (!classItem?.teachers || !Array.isArray(classItem.teachers)) return []

  return classItem.teachers
    .filter((teacherItem) => {
      const teacherId = typeof teacherItem === "string" ? teacherItem : teacherItem.teacherId
      return teacherId !== classItem.teacherId // Exclude the owner
    })
    .map((teacherItem) => {
      const teacherId = typeof teacherItem === "string" ? teacherItem : teacherItem.teacherId
      const teacher = teachers.value?.find((t) => t.id === teacherId)
      return {
        id: teacherId,
        name: teacher?.name || `Maestro ${teacherId}`,
      }
    })
}

const getTeacherPermissions = (classItem: ClassData | null, teacherId: string): string[] => {
  if (!classItem?.permissions || typeof classItem.permissions !== "object") return ["read"]

  return classItem.permissions[teacherId] || ["read"]
}

const getPermissionText = (permissions: string[]): string => {
  if (!permissions || permissions.length === 0) return "Sin permisos"

  if (permissions.includes("manage")) return "Administrador"
  if (permissions.includes("write")) return "Editor"
  if (permissions.includes("read")) return "Solo lectura"

  return "Permisos personalizados"
}

const getPermissionLevel = (classItem: ClassData | null, teacherId: string): string => {
  const permissions = getTeacherPermissions(classItem, teacherId)

  if (permissions.includes("manage")) return "manage"
  if (permissions.includes("write")) return "write"
  return "read"
}

const updatePermission = (teacherId: string, level: string) => {
  switch (level) {
    case "read":
      tempPermissions.value[teacherId] = ["read"]
      break
    case "write":
      tempPermissions.value[teacherId] = ["read", "write"]
      break
    case "manage":
      tempPermissions.value[teacherId] = ["read", "write", "manage"]
      break
    default:
      tempPermissions.value[teacherId] = ["read"]
  }
}

const savePermissions = async () => {
  if (!selectedClassForPermissions.value) return

  try {
    loading.value = true

    // Update the class with new permissions
    const updatedClass = {
      ...selectedClassForPermissions.value,
      permissions: tempPermissions.value,
    }

    await classesStore.updateClass(selectedClassForPermissions.value.id, updatedClass)

    closePermissionsModal()

    // Refresh data to reflect changes
    await loadInitialData()
  } catch (error) {
    console.error("Error al guardar permisos:", error)
  } finally {
    loading.value = false
  }
}

const closeDialog = () => {
  showCreateDialog.value = false
  editingClass.value = null
}

// Métodos CRUD mejorados
const handleSave = async (classData: ClassData) => {
  try {
    loading.value = true

    // Validar datos mínimos
    if (!classData.name?.trim() || !classData.instrument || !classData.teacherId) {
      showNotification("Por favor complete todos los campos requeridos", "error")
      loading.value = false
      return
    }

    // Preparar datos para guardar
    const classToSave = {
      ...classData,
      name: classData.name.trim(),
      description: classData.description?.trim() || "",
      status: classData.status || "active",
      studentIds: classData.studentIds || [],
      sharedWith: classData.sharedWith || [],
      schedule: classData.schedule || {slots: []},
      updatedAt: new Date().toISOString(),
    }

    // Debug: Verificar el horario recibido
    console.log("📅 Datos de horario recibidos:", {
      schedule: classToSave.schedule,
      slots: classToSave.schedule?.slots,
      slotsLength: classToSave.schedule?.slots?.length,
    })

    if (editingClass.value?.id) {
      // Actualizar clase existente - No validar horario para actualizaciones
      await classesStore.updateClass(editingClass.value.id, {
        ...classToSave,
        // Mantener el ID y la fecha de creación originales
        id: editingClass.value.id,
        createdAt: editingClass.value.createdAt || new Date().toISOString(),
        // Mantener el historial de cambios si existe
        changeHistory: [
          ...(editingClass.value.changeHistory || []),
          {timestamp: new Date().toISOString(), changes: "Actualización de la clase"},
        ],
      })

      showNotification(`✅ Clase "${classToSave.name}" actualizada exitosamente`, "success")
    } else {
      // Crear nueva clase - Validar horario solo para clases nuevas
      const now = new Date().toISOString()

      // Excluir el campo 'id' para nuevas clases ya que Firestore lo genera automáticamente
      const {id, createdAt, updatedAt, ...classDataWithoutId} = classToSave

      const newClass = {
        ...classDataWithoutId,
        // Configurar valores por defecto para nueva clase
        createdAt: now,
        permissions: classToSave.teacherId
          ? {
              [classToSave.teacherId]: ["read", "write", "manage"],
            }
          : {},
        // Inicializar historial de cambios
        changeHistory: [{timestamp: now, changes: "Creación de la clase"}],
      }

      // Validar que tenga al menos un horario SOLO para clases nuevas
      if (!newClass.schedule?.slots?.length || newClass.schedule.slots.length === 0) {
        console.warn("⚠️ Validación de horario falló:", {
          schedule: newClass.schedule,
          slots: newClass.schedule?.slots,
          hasSlots: Boolean(newClass.schedule?.slots?.length),
        })
        showNotification("Debe agregar al menos un horario para la clase", "error")
        loading.value = false
        return // No cerrar el modal, solo salir de la función
      }

      // Debug: Verificar que no se incluya el campo 'id' para nuevas clases
      console.log("🆕 Datos de nueva clase (sin id):", newClass)
      console.log("🔍 ¿Incluye campo id?", "id" in newClass ? "SÍ - ERROR" : "NO - CORRECTO")

      // Guardar la nueva clase
      const savedClass = await classesStore.addClass(newClass)
      console.log("✅ Clase guardada en Firestore:", savedClass)

      // Verificar que la clase aparezca en el listado inmediatamente
      console.log("📋 Total de clases después de crear:", classes.value.length)
      const justCreated = classes.value.find((c) => c.id === savedClass.id)
      console.log("🔍 Clase recién creada encontrada en el listado:", justCreated ? "SÍ" : "NO")

      showNotification(`✅ Clase "${newClass.name}" creada exitosamente`, "success")
    }

    // Solo cerrar diálogo si no hubo errores (no necesitamos recargar datos ya que el store se actualiza automáticamente)
    closeDialog()
  } catch (error) {
    console.error("❌ Error al guardar la clase:", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    showNotification(`❌ Error al guardar la clase: ${errorMessage}`, "error")

    // Debug: Verificar estado después del error
    console.log("📊 Estado después del error:", {
      totalClasses: classes.value.length,
      editingClassId: editingClass.value?.id,
      isCreatingNew: !editingClass.value?.id,
    })

    // No cerrar el modal en caso de error
  } finally {
    loading.value = false
  }
}

const deleteClass = async () => {
  if (!editingClass.value?.id) return

  const classToDelete = editingClass.value
  const classId = classToDelete.id
  deleting.value = true

  try {
    // Eliminar de Firestore y actualizar el store local automáticamente
    await classesStore.removeClass(classId)

    // Verificar que la clase se eliminó correctamente del store
    const stillExists = classes.value.find((c) => c.id === classId)
    if (stillExists) {
      console.warn("La clase aún existe en el store local, forzando actualización...")
      await classesStore.fetchClasses()
    }

    // Mostrar notificación de éxito
    showNotification(`✅ Clase "${classToDelete.name}" eliminada exitosamente`, "success")

    // Cerrar diálogo inmediatamente
    showDeleteDialog.value = false
    editingClass.value = null
  } catch (error) {
    console.error("Error al eliminar la clase:", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    showNotification(`❌ Error al eliminar la clase: ${errorMessage}`, "error")
  } finally {
    deleting.value = false
  }
}

const closeDeleteDialog = (): void => {
  showDeleteDialog.value = false
  editingClass.value = null
}
</script>

<style scoped>
/* Estilos globales para los diálogos modales */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
