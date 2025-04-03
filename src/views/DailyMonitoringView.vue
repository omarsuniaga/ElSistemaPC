<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8">
    <!-- Header con título y controles principales -->
    <header class="mb-8">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 id="page-title" class="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
            Monitoreo Diario
          </h1>
          <p class="mt-1 text-gray-600 dark:text-gray-400 max-w-2xl">
            Seguimiento de asistencia y rendimiento de estudiantes en tiempo real
          </p>
        </div>

        <div class="flex flex-wrap gap-3 mt-4 sm:mt-0">
          <button 
            @click="toggleView"
            class="btn bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 
                  hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-primary-500 flex items-center gap-2"
            :aria-label="isListView ? 'Cambiar a vista de tarjetas' : 'Cambiar a vista de lista'"
          >
            <component :is="isListView ? ViewColumnsIcon : ViewListIcon" class="h-5 w-5" aria-hidden="true" />
            <span class="hidden sm:inline">{{ isListView ? 'Vista de tarjetas' : 'Vista de lista' }}</span>
          </button>
          
          <button 
            @click="openReportModal"
            class="btn bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500 flex items-center gap-2"
            aria-label="Generar reporte de monitoreo"
          >
            <DocumentTextIcon class="h-5 w-5" aria-hidden="true" />
            <span class="hidden sm:inline">Reporte</span>
          </button>
          
          <button 
            @click="openExportModal"
            class="btn bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500 flex items-center gap-2"
            aria-label="Exportar datos de monitoreo"
          >
            <ArrowDownTrayIcon class="h-5 w-5" aria-hidden="true" />
            <span class="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      <!-- Filtros responsivos -->
      <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Selector de fecha -->
        <div class="relative">
          <label for="date-selector" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fecha
          </label>
          <Datepicker
            id="date-selector"
            v-model="selectedDate"
            :format="dateFormat"
            :preview-format="dateFormat"
            :enable-time-picker="false"
            locale="es"
            class="w-full"
            input-class-name="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm
                            focus:outline-none focus:ring-primary-500 focus:border-primary-500 
                            dark:bg-gray-700 dark:text-white text-sm"
          />
          <p id="date-help" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Selecciona la fecha para ver el monitoreo
          </p>
        </div>

        <!-- Selector de clase -->
        <div>
          <label for="class-selector" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Clase
          </label>
          <select 
            id="class-selector"
            v-model="selectedClass"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm
                  focus:outline-none focus:ring-primary-500 focus:border-primary-500 
                  dark:bg-gray-700 dark:text-white text-sm"
            aria-describedby="class-help"
          >
            <option value="">Todas las clases</option>
            <option v-for="classItem in classes" :key="classItem.id" :value="classItem.id">
              {{ classItem.name }}
            </option>
          </select>
          <p id="class-help" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Filtra por una clase específica
          </p>
        </div>

        <!-- Selector de estado -->
        <div>
          <label for="status-selector" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Estado
          </label>
          <select 
            id="status-selector"
            v-model="selectedStatus"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm
                  focus:outline-none focus:ring-primary-500 focus:border-primary-500 
                  dark:bg-gray-700 dark:text-white text-sm"
            aria-describedby="status-help"
          >
            <option value="">Todos los estados</option>
            <option value="present">Presente</option>
            <option value="absent">Ausente</option>
            <option value="late">Tarde</option>
            <option value="justified">Justificado</option>
          </select>
          <p id="status-help" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Filtra por estado de asistencia
          </p>
        </div>
      </div>
    </header>

    <!-- Resumen de estadísticas -->
    <section aria-labelledby="stats-heading" class="mb-8">
      <h2 id="stats-heading" class="sr-only">Estadísticas de asistencia del día</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Estadística: Presentes -->
        <div class="card bg-white dark:bg-gray-800 relative overflow-hidden border-l-4 border-green-500">
          <div class="flex items-center">
            <div class="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
              <UserIcon aria-hidden="true" class="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Presentes</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.present }}</p>
              <p class="text-sm text-green-600 dark:text-green-400" aria-live="polite">
                {{ Math.round((stats.present / stats.total) * 100) || 0 }}%
              </p>
            </div>
          </div>
          <!-- Barra de progreso visual -->
          <div 
            class="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700"
            role="progressbar"
            :aria-valuenow="Math.round((stats.present / stats.total) * 100) || 0"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="`${Math.round((stats.present / stats.total) * 100) || 0}% de estudiantes presentes`"
          >
            <div 
              class="h-full bg-green-500"
              :style="{ width: `${(stats.present / stats.total) * 100 || 0}%` }"
            ></div>
          </div>
        </div>

        <!-- Estadística: Ausentes -->
        <div class="card bg-white dark:bg-gray-800 relative overflow-hidden border-l-4 border-red-500">
          <div class="flex items-center">
            <div class="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
              <UserMinusIcon aria-hidden="true" class="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Ausentes</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.absent }}</p>
              <p class="text-sm text-red-600 dark:text-red-400" aria-live="polite">
                {{ Math.round((stats.absent / stats.total) * 100) || 0 }}%
              </p>
            </div>
          </div>
          <div 
            class="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700"
            role="progressbar"
            :aria-valuenow="Math.round((stats.absent / stats.total) * 100) || 0"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="`${Math.round((stats.absent / stats.total) * 100) || 0}% de estudiantes ausentes`"
          >
            <div 
              class="h-full bg-red-500"
              :style="{ width: `${(stats.absent / stats.total) * 100 || 0}%` }"
            ></div>
          </div>
        </div>

        <!-- Estadística: Tarde -->
        <div class="card bg-white dark:bg-gray-800 relative overflow-hidden border-l-4 border-amber-500">
          <div class="flex items-center">
            <div class="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full">
              <ClockIcon aria-hidden="true" class="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Tarde</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.late }}</p>
              <p class="text-sm text-amber-600 dark:text-amber-400" aria-live="polite">
                {{ Math.round((stats.late / stats.total) * 100) || 0 }}%
              </p>
            </div>
          </div>
          <div 
            class="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700"
            role="progressbar"
            :aria-valuenow="Math.round((stats.late / stats.total) * 100) || 0"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="`${Math.round((stats.late / stats.total) * 100) || 0}% de estudiantes que llegaron tarde`"
          >
            <div 
              class="h-full bg-amber-500"
              :style="{ width: `${(stats.late / stats.total) * 100 || 0}%` }"
            ></div>
          </div>
        </div>

        <!-- Estadística: Justificados -->
        <div class="card bg-white dark:bg-gray-800 relative overflow-hidden border-l-4 border-blue-500">
          <div class="flex items-center">
            <div class="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
              <DocumentCheckIcon aria-hidden="true" class="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Justificados</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.justified }}</p>
              <p class="text-sm text-blue-600 dark:text-blue-400" aria-live="polite">
                {{ Math.round((stats.justified / stats.total) * 100) || 0 }}%
              </p>
            </div>
          </div>
          <div 
            class="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700"
            role="progressbar"
            :aria-valuenow="Math.round((stats.justified / stats.total) * 100) || 0"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="`${Math.round((stats.justified / stats.total) * 100) || 0}% de ausencias justificadas`"
          >
            <div 
              class="h-full bg-blue-500"
              :style="{ width: `${(stats.justified / stats.total) * 100 || 0}%` }"
            ></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Estados de carga y error -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" aria-hidden="true"></div>
      <span class="ml-3 text-gray-600 dark:text-gray-400">Cargando datos...</span>
      <span class="sr-only">Cargando, por favor espere...</span>
    </div>

    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-lg mb-4">
      <div class="flex items-start">
        <ExclamationTriangleIcon class="h-5 w-5 mt-0.5 flex-shrink-0" aria-hidden="true" />
        <div class="ml-3">
          <h3 class="text-sm font-medium">Error al cargar los datos</h3>
          <div class="mt-1 text-sm">{{ error }}</div>
        </div>
      </div>
    </div>

    <div v-else-if="filteredAttendance.length === 0" class="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-4 rounded-lg mb-4">
      <div class="flex items-start">
        <InformationCircleIcon class="h-5 w-5 mt-0.5 flex-shrink-0" aria-hidden="true" />
        <div class="ml-3">
          <h3 class="text-sm font-medium">No hay datos para mostrar</h3>
          <div class="mt-1 text-sm">Ajusta los filtros o selecciona otra fecha.</div>
        </div>
      </div>
    </div>

    <!-- Contenido principal: Vista de lista o tarjetas -->
    <main v-else aria-labelledby="attendance-heading">
      <h2 id="attendance-heading" class="sr-only">Registro de asistencia</h2>

      <!-- Vista de lista -->
      <div v-if="isListView" class="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <caption class="sr-only">Lista de estudiantes con estado de asistencia para el {{ formatDate(selectedDate) }}</caption>
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Estudiante
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Clase
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Estado
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Hora
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
            <tr v-for="record in filteredAttendance" :key="record.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <img 
                      :src="record.student.avatar || '/default-avatar.png'" 
                      :alt="`Foto de ${record.student.name}`" 
                      class="h-10 w-10 rounded-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {{ record.student.name }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ record.student.instrument || 'Sin instrumento' }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ record.className }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center"
                  :class="getStatusClasses(record.status)"
                >
                  <span 
                    class="w-2 h-2 rounded-full mr-1" 
                    :class="getStatusDotClass(record.status)"
                    aria-hidden="true"
                  ></span>
                  {{ getStatusLabel(record.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ formatTime(record.timestamp) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button 
                  @click="openDetails(record)"
                  class="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                  :aria-label="`Ver detalles de ${record.student.name}`"
                >
                  Ver
                </button>
                <button 
                  @click="editStatus(record)"
                  class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                  :aria-label="`Editar estado de ${record.student.name}`"
                >
                  Editar
                </button>
                <button 
                  v-if="record.status === 'absent'"
                  @click="justifyAbsence(record)"
                  class="text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
                  :aria-label="`Justificar ausencia de ${record.student.name}`"
                >
                  Justificar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Vista de tarjetas -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div 
          v-for="record in filteredAttendance" 
          :key="record.id" 
          class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-300"
          :class="['border-l-4', getStatusBorderClass(record.status)]"
        >
          <div class="p-4">
            <div class="flex items-center mb-4">
              <div class="flex-shrink-0 h-10 w-10">
                <img 
                  :src="record.student.avatar || '/default-avatar.png'" 
                  :alt="`Foto de ${record.student.name}`" 
                  class="h-10 w-10 rounded-full object-cover"
                  loading="lazy"
                />
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {{ record.student.name }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ record.student.instrument || 'Sin instrumento' }}
                </p>
              </div>
            </div>
            
            <div class="mb-3">
              <p class="text-xs text-gray-500 dark:text-gray-400">Clase:</p>
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ record.className }}</p>
            </div>
            
            <div class="flex justify-between items-center mt-4">
              <span
                class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center"
                :class="getStatusClasses(record.status)"
              >
                <span 
                  class="w-2 h-2 rounded-full mr-1" 
                  :class="getStatusDotClass(record.status)"
                  aria-hidden="true"
                ></span>
                {{ getStatusLabel(record.status) }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatTime(record.timestamp) }}
              </span>
            </div>
            
            <div class="flex justify-end mt-4 border-t border-gray-100 dark:border-gray-700 pt-3">
              <button 
                @click="openDetails(record)"
                class="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 text-sm mr-3"
                :aria-label="`Ver detalles de ${record.student.name}`"
              >
                Ver
              </button>
              <button 
                @click="editStatus(record)"
                class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm mr-3"
                :aria-label="`Editar estado de ${record.student.name}`"
              >
                Editar
              </button>
              <button 
                v-if="record.status === 'absent'"
                @click="justifyAbsence(record)"
                class="text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300 text-sm"
                :aria-label="`Justificar ausencia de ${record.student.name}`"
              >
                Justificar
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal de detalles -->
    <Modal 
      v-if="showDetailsModal"
      :title="`Detalles de Asistencia - ${selectedRecord?.student?.name || ''}`" 
      @close="showDetailsModal = false"
    >
      <div v-if="selectedRecord" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Estudiante</h4>
            <p class="text-base font-medium">{{ selectedRecord.student.name }}</p>
          </div>
          <div>
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Clase</h4>
            <p>{{ selectedRecord.className }}</p>
          </div>
          <div>
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha</h4>
            <p>{{ formatDate(selectedRecord.date) }}</p>
          </div>
          <div>
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Hora</h4>
            <p>{{ formatTime(selectedRecord.timestamp) }}</p>
          </div>
          <div class="col-span-2">
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Estado</h4>
            <span
              class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center mt-1"
              :class="getStatusClasses(selectedRecord.status)"
            >
              <span 
                class="w-2 h-2 rounded-full mr-1" 
                :class="getStatusDotClass(selectedRecord.status)"
                aria-hidden="true"
              ></span>
              {{ getStatusLabel(selectedRecord.status) }}
            </span>
          </div>
        </div>
        
        <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Observaciones</h4>
          <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {{ selectedRecord.observations || 'Sin observaciones' }}
          </p>
        </div>
        
        <div v-if="selectedRecord.justification" class="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Justificación</h4>
          <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {{ selectedRecord.justification }}
          </p>
        </div>
      </div>
    </Modal>

    <!-- Modal de editar estado -->
    <Modal
      v-if="showEditModal" 
      title="Editar Estado de Asistencia" 
      @close="showEditModal = false"
    >
      <div v-if="selectedRecord" class="space-y-4">
        <div>
          <label for="status-edit" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Estado
          </label>
          <select 
            id="status-edit"
            v-model="editForm.status"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm
                  focus:outline-none focus:ring-primary-500 focus:border-primary-500 
                  dark:bg-gray-700 dark:text-white"
          >
            <option value="present">Presente</option>
            <option value="absent">Ausente</option>
            <option value="late">Tarde</option>
            <option value="justified">Justificado</option>
          </select>
        </div>

        <div>
          <label for="observations-edit" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Observaciones
          </label>
          <textarea 
            id="observations-edit"
            v-model="editForm.observations"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm
                  focus:outline-none focus:ring-primary-500 focus:border-primary-500 
                  dark:bg-gray-700 dark:text-white resize-none"
            placeholder="Agregar observaciones..."
          ></textarea>
        </div>

        <div v-if="editForm.status === 'justified'" class="border-t border-gray-200 dark:border-gray-700 pt-4">
          <label for="justification-edit" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Justificación
          </label>
          <textarea 
            id="justification-edit"
            v-model="editForm.justification"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm
                  focus:outline-none focus:ring-primary-500 focus:border-primary-500 
                  dark:bg-gray-700 dark:text-white resize-none"
            placeholder="Agregar justificación..."
          ></textarea>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button 
            type="button" 
            class="btn btn-secondary"
            @click="showEditModal = false"
          >
            Cancelar
          </button>
          <button 
            type="button" 
            class="btn btn-primary"
            @click="saveEditedStatus"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </Modal>

    <!-- Modal de justificar ausencia -->
    <JustifiedAbsenceModal
      v-if="showJustificationModal"
      :student-name="selectedRecord?.student?.name || ''"
      :date="selectedRecord?.date || ''"
      @close="showJustificationModal = false"
      @save="saveJustification"
    />

    <!-- Modal de reportes -->
    <Modal
      v-if="showReportModal"
      title="Generar Reporte de Asistencia"
      @close="showReportModal = false"
    >
      <!-- Contenido del modal de reportes -->
      <div class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label for="report-start-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha Inicio
            </label>
            <Datepicker
              id="report-start-date"
              v-model="reportRange.startDate"
              :format="dateFormat"
              :enable-time-picker="false"
              locale="es"
              class="w-full"
              input-class-name="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm
                              focus:outline-none focus:ring-primary-500 focus:border-primary-500 
                              dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
          
          <div>
            <label for="report-end-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha Fin
            </label>
            <Datepicker
              id="report-end-date"
              v-model="reportRange.endDate"
              :format="dateFormat"
              :enable-time-picker="false"
              locale="es"
              class="w-full"
              input-class-name="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm
                              focus:outline-none focus:ring-primary-500 focus:border-primary-500 
                              dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
        </div>

        <div>
          <label for="report-type" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo de Reporte
          </label>
          <select 
            id="report-type"
            v-model="reportType"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm
                  focus:outline-none focus:ring-primary-500 focus:border-primary-500 
                  dark:bg-gray-700 dark:text-white"
          >
            <option value="summary">Resumen General</option>
            <option value="detailed">Detallado por Estudiante</option>
            <option value="class">Por Clase</option>
          </select>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button 
            type="button" 
            class="btn btn-secondary"
            @click="showReportModal = false"
          >
            Cancelar
          </button>
          <button 
            type="button" 
            class="btn btn-primary"
            @click="generateReport"
          >
            Generar Reporte
          </button>
        </div>
      </div>
    </Modal>

    <!-- Modal de exportación -->
    <Modal
      v-if="showExportModal"
      title="Exportar Datos de Monitoreo"
      @close="showExportModal = false"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label for="export-start-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha Inicio
            </label>
            <Datepicker
              id="export-start-date"
              v-model="exportRange.startDate"
              :format="dateFormat"
              :enable-time-picker="false"
              locale="es"
              class="w-full"
              input-class-name="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm
                              focus:outline-none focus:ring-primary-500 focus:border-primary-500 
                              dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
          
          <div>
            <label for="export-end-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha Fin
            </label>
            <Datepicker
              id="export-end-date"
              v-model="exportRange.endDate"
              :format="dateFormat"
              :enable-time-picker="false"
              locale="es"
              class="w-full"
              input-class-name="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm
                              focus:outline-none focus:ring-primary-500 focus:border-primary-500 
                              dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
        </div>

        <div>
          <label for="export-format" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Formato
          </label>
          <select 
            id="export-format"
            v-model="exportFormat"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm
                  focus:outline-none focus:ring-primary-500 focus:border-primary-500 
                  dark:bg-gray-700 dark:text-white"
          >
            <option value="excel">Excel (.xlsx)</option>
            <option value="csv">CSV (.csv)</option>
            <option value="pdf">PDF (.pdf)</option>
          </select>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button 
            type="button" 
            class="btn btn-secondary"
            @click="showExportModal = false"
          >
            Cancelar
          </button>
          <button 
            type="button" 
            class="btn btn-primary"
            @click="exportData"
          >
            Exportar Datos
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Datepicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { useFirestoreCollection } from '../composables/useFirestoreCollection';
import { where, QueryConstraint, Timestamp } from 'firebase/firestore';
import Modal from '../components/ConfirmModal.vue';
import JustifiedAbsenceModal from '../components/JustifiedAbsenceModal.vue';
import {
  ChartBarIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  Squares2X2Icon as ViewColumnsIcon,
  ListBulletIcon as ViewListIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  UserIcon,
  UserMinusIcon,
  ClockIcon,
  DocumentCheckIcon,
  UserCheckIcon // Added missing icon
} from '@heroicons/vue/24/outline';
import { jsPDF } from 'jspdf';
import ExcelJS from 'exceljs';

// Tipos
interface Student {
  id: string;
  name: string;
  avatar?: string;
  instrument?: string;
}

interface Class {
  id: string;
  name: string;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  className: string;
  date: string;
  timestamp: Timestamp;
  status: 'present' | 'absent' | 'late' | 'justified';
  observations?: string;
  justification?: string;
  student: Student;
}

// Estado reactivo
const isListView = ref(true);
const selectedDate = ref(new Date());
const selectedClass = ref('');
const selectedStatus = ref('');
const showDetailsModal = ref(false);
const showEditModal = ref(false);
const showJustificationModal = ref(false);
const showReportModal = ref(false);
const showExportModal = ref(false);
const selectedRecord = ref<AttendanceRecord | null>(null);
const dateFormat = 'dd/MM/yyyy';

// Formulario de edición
const editForm = ref({
  status: '',
  observations: '',
  justification: ''
});

// Rangos para reportes y exportación
const reportRange = ref({
  startDate: new Date(),
  endDate: new Date()
});

const exportRange = ref({
  startDate: new Date(),
  endDate: new Date()
});

const reportType = ref('summary');
const exportFormat = ref('excel');

// Crear restricciones para la consulta Firestore
const getQueryConstraints = computed<QueryConstraint[]>(() => {
  const dateStr = format(selectedDate.value, 'yyyy-MM-dd');
  const constraints: QueryConstraint[] = [where('date', '==', dateStr)];
  
  if (selectedClass.value) {
    constraints.push(where('classId', '==', selectedClass.value));
  }
  
  // No filtramos por status aquí, lo haremos en memoria para evitar múltiples índices
  return constraints;
});

// Usar el composable para obtener datos de Firestore
const { 
  items: attendance, 
  loading, 
  error 
} = useFirestoreCollection<AttendanceRecord>('attendance', getQueryConstraints);

// Obtener clases para el selector
const { items: classes } = useFirestoreCollection<Class>('classes', []);

// Filtrar por estado si es necesario
const filteredAttendance = computed(() => {
  if (!selectedStatus.value) return attendance.value;
  return attendance.value.filter(record => record.status === selectedStatus.value);
});

// Calcular estadísticas
const stats = computed(() => {
  const total = attendance.value.length;
  const present = attendance.value.filter(record => record.status === 'present').length;
  const absent = attendance.value.filter(record => record.status === 'absent').length;
  const late = attendance.value.filter(record => record.status === 'late').length;
  const justified = attendance.value.filter(record => record.status === 'justified').length;
  
  return { total, present, absent, late, justified };
});

// Métodos para mostrar etiquetas y clases según el estado
const getStatusLabel = (status: string) => {
  const labels = {
    present: 'Presente',
    absent: 'Ausente',
    late: 'Tarde',
    justified: 'Justificado'
  };
  return labels[status] || 'Desconocido';
};

const getStatusClasses = (status: string) => {
  const statusClasses = {
    present: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    absent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    late: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    justified: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
  };
  return statusClasses[status] || '';
};

const getStatusDotClass = (status: string) => {
  const dotClasses = {
    present: 'bg-green-500',
    absent: 'bg-red-500',
    late: 'bg-amber-500',
    justified: 'bg-blue-500'
  };
  return dotClasses[status] || '';
};

const getStatusBorderClass = (status: string) => {
  const borderClasses = {
    present: 'border-green-500',
    absent: 'border-red-500',
    late: 'border-amber-500',
    justified: 'border-blue-500'
  };
  return borderClasses[status] || '';
};
</script>