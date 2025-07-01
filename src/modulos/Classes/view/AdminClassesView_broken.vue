<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Container principal con responsive mejorado -->
    <div class="px-4 py-6 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <!-- Header con título y acciones -->
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

            <!-- Action buttons -->
            <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <!-- Botón de filtros (mobile) -->
              <button
                class="sm:hidden inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                @click="showFilters = !showFilters"
              >
                <FunnelIcon class="h-5 w-5 mr-2" />
                Filtros
              </button>

              <!-- Botón nueva clase -->
              <button
                class="inline-flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                @click="createNewClass"
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

        <!-- Filtros -->
        <div class="space-y-4">
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

          <!-- Pestañas -->
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
              </nav>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenido principal -->
      <div class="space-y-6">
        <!-- Estado de carga -->
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

        <!-- Contenido principal -->
        <template v-else>
          <!-- Vista de clases -->
          <div v-if="tab === 'classes'">
            <!-- Lista vacía -->
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
                    @click="createNewClass"
                  >
                    <PlusIcon class="mr-2 h-4 w-4" />
                    Nueva Clase
                  </button>
                </div>
              </div>
            </div>

            <!-- Lista de clases -->
            <div
              v-else
              class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
            >
              <div class="p-6">
                <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div
                    v-for="clase in filteredClasses"
                    :key="clase.id"
                    class="relative p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md transition-shadow"
                    :class="{
                      'bg-gray-50 dark:bg-gray-700 opacity-75': (clase.alumnos?.length || 0) === 0,
                      'bg-white dark:bg-gray-800': (clase.alumnos?.length || 0) > 0,
                    }"
                  >
                    <!-- Badge de estado -->
                    <div class="absolute top-2 right-2">
                      <span
                        :class="{
                          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200':
                            (clase.alumnos?.length || 0) > 0,
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200':
                            (clase.alumnos?.length || 0) === 0,
                        }"
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      >
                        {{
                          (clase.alumnos?.length || 0) > 0 ? "Con estudiantes" : "Sin estudiantes"
                        }}
                      </span>
                    </div>

                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 pr-16">
                      {{ clase.nombre }}
                    </h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <strong>Maestro(s):</strong> {{ getTeachersDisplay(clase) }}
                    </p>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <strong>Horario:</strong> {{ clase.horario?.dia || "Sin horario" }}
                      {{ clase.horario?.horaInicio || "" }}
                      {{ clase.horario?.horaInicio && clase.horario?.horaFin ? "-" : "" }}
                      {{ clase.horario?.horaFin || "" }}
                    </p>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <strong>Estudiantes:</strong> {{ clase.alumnos?.length || 0 }}
                    </p>
                    
                    <!-- Descripción corta -->
                    <p
                      v-if="clase.contenido"
                      class="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2"
                    >
                      {{ clase.contenido }}
                    </p>

                    <!-- Botones de acción -->
                    <div class="flex flex-wrap gap-2 mt-4">
                      <button
                        class="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors"
                        @click="editClass(clase)"
                      >
                        Editar
                      </button>
                      <button
                        class="px-3 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md transition-colors"
                        @click="editClass(clase)"
                      >
                        Gestionar Estudiantes
                      </button>
                      <button
                        class="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                        @click="confirmDelete(clase)"
                      >
                        Eliminar
                      </button>
                    </div>
                        @click="editClass(clase)"
                      >
                        Editar
                      </button>
                      <button
                        class="px-3 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md transition-colors"
                        @click="editClass(clase)"
                      >
                        Gestionar Estudiantes
                      </button>
                      <button
                        class="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                        @click="confirmDelete(clase)"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
                
                <!-- Paginación -->
                <div v-if="totalFilteredItems > itemsPerPage" class="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div class="flex-1 flex justify-between sm:hidden">
                    <button
                      :disabled="currentPage === 1"
                      class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      @click="currentPage = Math.max(1, currentPage - 1)"
                    >
                      Anterior
                    </button>
                    <button
                      :disabled="currentPage >= Math.ceil(totalFilteredItems / itemsPerPage)"
                      class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      @click="currentPage = Math.min(Math.ceil(totalFilteredItems / itemsPerPage), currentPage + 1)"
                    >
                      Siguiente
                    </button>
                  </div>
                  <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p class="text-sm text-gray-700 dark:text-gray-300">
                        Mostrando
                        <span class="font-medium">{{ (currentPage - 1) * itemsPerPage + 1 }}</span>
                        a
                        <span class="font-medium">{{ Math.min(currentPage * itemsPerPage, totalFilteredItems) }}</span>
                        de
                        <span class="font-medium">{{ totalFilteredItems }}</span>
                        resultados
                      </p>
                    </div>
                    <div>
                      <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          :disabled="currentPage === 1"
                          class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          @click="currentPage = Math.max(1, currentPage - 1)"
                        >
                          <span class="sr-only">Anterior</span>
                          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                          </svg>
                        </button>
                        <button
                          :disabled="currentPage >= Math.ceil(totalFilteredItems / itemsPerPage)"
                          class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          @click="currentPage = Math.min(Math.ceil(totalFilteredItems / itemsPerPage), currentPage + 1)"
                        >
                          <span class="sr-only">Siguiente</span>
                          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Vista de horarios -->
          <div
            v-else-if="tab === 'schedule'"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
          >
            <div class="p-6">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Vista de Horarios
              </h2>
              <p class="text-gray-600 dark:text-gray-400">
                Vista de horarios estará disponible próximamente.
              </p>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Modal de Creación/Edición de Clase usando ClassFormDialog -->
    <ClassFormDialog
      :open="showCreateDialog"
      :class-data="currentClassData"
      @close="closeCreateDialog"
      @save="handleSaveFromDialog"
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
                    <span class="font-medium">"{{ editingClass?.nombre }}"</span>? Esta acción no se
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
</template>

<script setup lang="ts">
import {ref, onMounted, computed, watch, onUnmounted} from "vue"
import {storeToRefs} from "pinia"
import {debounce} from "lodash-es"
import {useClassesStore} from "@/stores/classes"
import {useTeachersStore} from "@/stores/teachers"
import {useStudentsStore} from "@/modulos/Students/store/students"
import {useNotificationsStore} from "@/stores/notifications"
import ClassFormDialog from "@/modulos/Classes/components/ClassFormDialog.vue"
import type {ClassData} from "@/modulos/Classes/types/class"

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
} from "@heroicons/vue/24/outline"

// Tipos
interface Clase {
  id: string
  nombre: string
  teacherId: string // Maestro titular (compatibilidad)
  maestros?: {
    titular: string
    colaboradores: string[]
  }
  horario: {
    dia: string
    horaInicio: string
    horaFin: string
  }
  alumnos: string[]
  contenido?: string
  temas?: Array<{
    id: string
    titulo: string
    descripcion?: string
  }>
}

interface ClassForm {
  id?: string
  nombre: string
  teacherId: string // Maestro titular principal
  maestros: {
    titular: string
    colaboradores: string[]
  }
  horario: {
    dia: string
    horaInicio: string
    horaFin: string
  }
  alumnos: string[]
  contenido: string
  activa: boolean
}

// Stores
const classesStore = useClassesStore()
const teachersStore = useTeachersStore()
const studentsStore = useStudentsStore()
const notificationsStore = useNotificationsStore()

// Estado reactivo
const tab = ref<"classes" | "schedule">("classes")
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const showFilters = ref(false)
const editingClass = ref<Clase | null>(null)
const currentClassData = ref<ClassData | null>(null)
const loading = ref(true)
const deleting = ref(false)
const saving = ref(false)

// Paginación y rendimiento
const currentPage = ref(1)
const itemsPerPage = ref(12)

// Form para crear/editar clases
const classForm = ref<ClassForm>({
  nombre: "",
  teacherId: "",
  maestros: {
    titular: "",
    colaboradores: [],
  },
  horario: {
    dia: "",
    horaInicio: "",
    horaFin: "",
  },
  alumnos: [],
  contenido: "",
  activa: true,
})

// Filtros con debounce para optimizar rendimiento
const searchQuery = ref("")
const debouncedSearchQuery = ref("")
const selectedInstrument = ref("")
const selectedTeacher = ref("")
const selectedStatus = ref("")

// Debounce para búsqueda (mejora rendimiento)
const debouncedSearch = debounce((value: string) => {
  debouncedSearchQuery.value = value
  currentPage.value = 1 // Reset página en nueva búsqueda
}, 300)

// Watch para aplicar debounce
watch(searchQuery, (newValue) => {
  debouncedSearch(newValue)
})

// Obtener datos del store
const {classes} = storeToRefs(classesStore)
const {teachers} = storeToRefs(teachersStore)

// Computed properties optimizados con memoización
const allFilteredClasses = computed(() => {
  let filtered = [...classes.value]

  // Filtro por búsqueda (usando debounced query)
  if (debouncedSearchQuery.value.trim()) {
    const query = debouncedSearchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (cls) =>
        cls.nombre?.toLowerCase().includes(query) ||
        cls.contenido?.toLowerCase().includes(query) ||
        getTeacherName(cls.teacherId).toLowerCase().includes(query)
    )
  }

  // Filtro por instrumento (usando contenido como proxy)
  if (selectedInstrument.value) {
    filtered = filtered.filter((cls) =>
      cls.contenido?.toLowerCase().includes(selectedInstrument.value.toLowerCase())
    )
  }

  // Filtro por maestro
  if (selectedTeacher.value) {
    filtered = filtered.filter((cls) => cls.teacherId === selectedTeacher.value)
  }

  // Filtro por estado
  if (selectedStatus.value) {
    switch (selectedStatus.value) {
      case "active":
        // Todos son activos por defecto
        break
      case "inactive":
        // Filtrar por clases que no tienen alumnos
        filtered = filtered.filter((cls) => !cls.alumnos || cls.alumnos.length === 0)
        break
    }
  }

  return filtered
})

const filteredClasses = computed(() => {
  const filtered = allFilteredClasses.value
  // Paginación para mejorar rendimiento
  const startIndex = (currentPage.value - 1) * itemsPerPage.value
  const endIndex = startIndex + itemsPerPage.value
  return filtered.slice(startIndex, endIndex)
})

const totalFilteredItems = computed(() => allFilteredClasses.value.length)

const availableInstruments = computed(() => {
  // Usar contenido para extraer instrumentos
  const instruments = new Set(
    classes.value
      .map((cls) => cls.contenido)
      .filter(Boolean)
      .map((content) => {
        // Extraer palabras que podrían ser instrumentos
        const words = content!.toLowerCase().split(/\s+/)
        const instrumentList = ["piano", "guitarra", "violin", "flauta", "canto", "bateria", "bajo"]
        return words.find((word) => instrumentList.some((inst) => word.includes(inst)))
      })
      .filter(Boolean)
  )
  return Array.from(instruments).sort()
})

const totalStudents = computed(() => {
  return classes.value.reduce((total, cls) => total + (cls.alumnos?.length || 0), 0)
})

const activeTeachers = computed(() => {
  const teacherIds = new Set(classes.value.map((cls) => cls.teacherId).filter(Boolean))
  return teacherIds.size
})

const hasActiveFilters = computed(() => {
  return !!(
    debouncedSearchQuery.value ||
    selectedInstrument.value ||
    selectedTeacher.value ||
    selectedStatus.value
  )
})

// Métodos auxiliares con caché para mejorar rendimiento
const teacherNameCache = new Map<string, string>()

const getTeacherName = (teacherId?: string): string => {
  if (!teacherId) return "Sin asignar"
  
  // Verificar caché primero
  if (teacherNameCache.has(teacherId)) {
    return teacherNameCache.get(teacherId)!
  }
  
  const teacher = teachers.value?.find((t) => t.id === teacherId)
  const name = teacher ? teacher.name : "Maestro no encontrado"
  
  // Guardar en caché
  teacherNameCache.set(teacherId, name)
  
  // Limpiar caché si es muy grande (prevenir memory leaks)
  if (teacherNameCache.size > 100) {
    const firstKey = teacherNameCache.keys().next().value
    if (firstKey) teacherNameCache.delete(firstKey)
  }
  
  return name
}

const getTeachersDisplay = (clase: Clase): string => {
  // Priorizar el nuevo formato con maestros
  if (clase.maestros) {
    const titular = getTeacherName(clase.maestros.titular)
    const colaboradores = clase.maestros.colaboradores
      .map((id) => getTeacherName(id))
      .filter((name) => name !== "Maestro no encontrado")
    
    if (colaboradores.length > 0) {
      return `${titular} + ${colaboradores.length} colaborador${colaboradores.length > 1 ? "es" : ""}`
    }
    return titular
  }
  
  // Fallback al formato anterior
  return getTeacherName(clase.teacherId)
}

// Función para convertir Clase a ClassData
const convertToClassData = (clase: Clase): ClassData => {
  return {
    id: clase.id,
    name: clase.nombre,
    description: clase.contenido,
    teacherId: clase.maestros?.titular || clase.teacherId,
    studentIds: clase.alumnos,
    sharedWith: clase.maestros?.colaboradores || [],
    status: "active",
    schedule: clase.horario
      ? {
          day: clase.horario.dia,
          startTime: clase.horario.horaInicio,
          endTime: clase.horario.horaFin,
        }
      : undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

// Función para convertir ClassData a Clase
const convertFromClassData = (classData: Partial<ClassData>): Clase => {
  const schedule = classData.schedule
  const horario =
    schedule && "day" in schedule
      ? {
          dia: schedule.day,
          horaInicio: schedule.startTime,
          horaFin: schedule.endTime,
        }
      : {
          dia: "",
          horaInicio: "",
          horaFin: "",
        }

  return {
    id: classData.id || "",
    nombre: classData.name || "",
    teacherId: classData.teacherId || "",
    maestros: {
      titular: classData.teacherId || "",
      colaboradores: classData.sharedWith || [],
    },
    horario,
    alumnos: classData.studentIds || [],
    contenido: classData.description,
  }
}

const clearAllFilters = () => {
  searchQuery.value = ""
  selectedInstrument.value = ""
  selectedTeacher.value = ""
  selectedStatus.value = ""
  showFilters.value = false
  currentPage.value = 1 // Reset página al limpiar filtros
}

// Cargar datos iniciales con lazy loading optimizado
const loadInitialData = async () => {
  loading.value = true
  try {
    // Cargar datos en paralelo pero con prioridades
    const [classesPromise, teachersPromise, studentsPromise] = [
      classesStore.fetchClasses(),
      teachersStore.fetchTeachers(),
      studentsStore.fetchStudents(),
    ]
    
    // Esperar las clases primero (datos más importantes)
    await classesPromise
    
    // Luego cargar maestros y estudiantes en background
    await Promise.allSettled([teachersPromise, studentsPromise])
  } catch (error) {
    console.error("Error cargando datos iniciales:", error)
    notificationsStore.notify.error(
      "Error",
      "Error al cargar los datos. Por favor, inténtalo de nuevo."
    )
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(loadInitialData)

// Limpieza de memoria al desmontar el componente
onUnmounted(() => {
  // Limpiar caché de nombres de maestros
  teacherNameCache.clear()
  
  // Cancelar debounce pendiente
  debouncedSearch.cancel()
})

// Métodos de la UI
const editClass = (classItem: Clase) => {
  // Convertir a ClassData para el modal
  currentClassData.value = convertToClassData(classItem)
  showCreateDialog.value = true
}

const createNewClass = () => {
  currentClassData.value = null
  showCreateDialog.value = true
}

const confirmDelete = (classItem: Clase) => {
  editingClass.value = {...classItem}
  showDeleteDialog.value = true
}

const closeCreateDialog = () => {
  showCreateDialog.value = false
  currentClassData.value = null
  resetForm()
}

const handleSaveFromDialog = async (classData: Partial<ClassData>) => {
  if (!classData.name?.trim() || !classData.teacherId) {
    notificationsStore.notify.error("Error", "Por favor completa los campos obligatorios")
    return
  }

  saving.value = true
  try {
    // Convertir ClassData a Clase para usar con el store existente
    const claseData = convertFromClassData(classData)

    if (classData.id) {
      await classesStore.updateClass(classData.id, claseData)
      notificationsStore.notify.success("Éxito", "Clase actualizada correctamente")
    } else {
      await classesStore.addClass(claseData)
      notificationsStore.notify.success("Éxito", "Clase creada correctamente")
    }

    closeCreateDialog()
    await loadInitialData()
  } catch (error) {
    console.error("Error al guardar la clase:", error)
    notificationsStore.notify.error(
      "Error",
      classData.id ? "Error al actualizar la clase" : "Error al crear la clase"
    )
  } finally {
    saving.value = false
  }
}

const resetForm = () => {
  classForm.value = {
    nombre: "",
    teacherId: "",
    maestros: {
      titular: "",
      colaboradores: [],
    },
    horario: {
      dia: "",
      horaInicio: "",
      horaFin: "",
    },
    alumnos: [],
    contenido: "",
    activa: true,
  }
}

const deleteClass = async () => {
  if (!editingClass.value?.id) return

  deleting.value = true
  try {
    await classesStore.deleteClass(editingClass.value.id)
    notificationsStore.notify.success(
      "Éxito",
      `La clase "${editingClass.value.nombre}" ha sido eliminada.`
    )
    showDeleteDialog.value = false
    editingClass.value = null
    await loadInitialData()
  } catch (error) {
    console.error("Error al eliminar la clase:", error)
    notificationsStore.notify.error("Error", "Error al eliminar la clase.")
  } finally {
    deleting.value = false
  }
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
