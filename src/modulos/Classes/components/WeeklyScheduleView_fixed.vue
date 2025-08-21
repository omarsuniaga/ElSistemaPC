<template>
  <div class="weekly-schedule-view bg-white dark:bg-gray-900 min-h-screen">
    <div class="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Horarios de Clases</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Vista semanal de todos los horarios registrados</p>
        </div>

        <div class="flex items-center space-x-3">
          <!-- View Toggle -->
          <div class="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
            <button
              :class="[
                'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                viewMode === 'week'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
              ]"
              @click="viewMode = 'week'"
            >
              📅 Semana
            </button>
            <button
              :class="[
                'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
              ]"
              @click="viewMode = 'list'"
            >
              📋 Lista
            </button>
          </div>

          <!-- Export Button -->
          <button
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            @click="exportSchedule"
          >
            📥 Exportar PDF
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Search -->
        <div>
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Buscar clases..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div class="flex space-x-2">
          <button
            class="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            @click="refreshData"
          >
            <svg
              v-if="isLoading"
              class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500"
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
            <span v-else>🔄</span>
            {{ isLoading ? "Cargando..." : "Actualizar" }}
          </button>
          <button
            class="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            @click="resetAllFilters"
          >
            🧹 Limpiar
          </button>
        </div>
      </div>

      <!-- Time Filters and View Mode -->
      <div
        class="mt-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
      >
        <div class="flex flex-wrap gap-6 items-center justify-between">
          <!-- Time Period Filters -->
          <div class="flex flex-wrap gap-4 items-center">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
              >Períodos del día:</span
            >
            <label class="flex items-center space-x-2">
              <input
                v-model="timeConfig.esTemprano"
                type="checkbox"
                class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                @change="saveTimeConfig"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">Mañana (7am-2pm)</span>
            </label>
            <label class="flex items-center space-x-2">
              <input
                v-model="timeConfig.esTarde"
                type="checkbox"
                class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                @change="saveTimeConfig"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">Tarde (2pm-7pm)</span>
            </label>
            <label class="flex items-center space-x-2">
              <input
                v-model="timeConfig.esNoche"
                type="checkbox"
                class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                @change="saveTimeConfig"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">Noche (7pm-11pm)</span>
            </label>
          </div>

          <!-- Schedule View Mode -->
          <div class="flex gap-4 items-center">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
              >Vista de horarios:</span
            >
            <label class="flex items-center space-x-2">
              <input
                v-model="timeConfig.viewMode"
                type="radio"
                value="standard"
                class="text-indigo-600 focus:ring-indigo-500"
                @change="saveTimeConfig"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">Estándar</span>
            </label>
            <label class="flex items-center space-x-2">
              <input
                v-model="timeConfig.viewMode"
                type="radio"
                value="overlap"
                class="text-indigo-600 focus:ring-indigo-500"
                @change="saveTimeConfig"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">Con solapamiento</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-6">
      <!-- Loading Spinner -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <div class="flex flex-col items-center space-y-4">
          <div class="relative">
            <div class="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-800 rounded-full"></div>
            <div
              class="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"
            ></div>
          </div>
          <div class="text-center">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Generando horarios...</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{ loadingMessage }}
            </p>
          </div>
        </div>
      </div>

      <!-- Edit Class Modal -->
      <ClassEditModal
        v-if="editFormVisible"
        :edit-form="editForm"
        :errors="editFormErrors"
        :teachers="teachers"
        @update:edit-form="editForm = $event"
        @save="saveClassEdits"
        @cancel="cancelEdit"
      />

      <!-- Content when not loading -->
      <div v-else>
        <!-- Schedule Stats -->
        <ScheduleStatsBar
          :config="timeConfig"
          :visible-classes="filteredClasses.length"
          :on-reset-filters="resetAllFilters"
          :on-show-all-day="showAllDay"
        />

        <!-- Week View -->
        <div v-if="viewMode === 'week'" class="space-y-6">
          <!-- Week Navigation -->
          <div class="flex items-center justify-between">
            <button
              class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              @click="previousWeek"
            >
              ← Semana Anterior
            </button>

            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ getWeekRange() }}
            </h2>

            <button
              class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              @click="nextWeek"
            >
              Semana Siguiente →
            </button>
          </div>

          <!-- Calendar Grid -->
          <div
            class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg mb-8"
          >
            <!-- Days Header -->
            <div class="grid grid-cols-8 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 border-b-2 border-indigo-200 dark:border-gray-600">
              <div
                class="p-4 text-center font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-gray-800 border-r border-indigo-200 dark:border-gray-600 sticky left-0 z-10"
              >
                <div class="text-sm font-bold">HORA</div>
                <div class="text-xs text-indigo-600 dark:text-indigo-400 mt-1">TIEMPO</div>
              </div>
              <div
                v-for="day in weekDays"
                :key="day.key"
                class="p-4 text-center font-bold text-gray-800 dark:text-white bg-gradient-to-b from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 border-r border-indigo-200 dark:border-gray-600 last:border-r-0"
              >
                <div class="text-lg font-bold text-indigo-700 dark:text-indigo-300">{{ day.name.toUpperCase() }}</div>
                <div class="text-sm font-semibold text-gray-600 dark:text-gray-300 mt-1">
                  {{ day.date }}
                </div>
              </div>
            </div>

            <!-- Time Slots Grid with Hour Labels -->
            <div class="relative">
              <div class="grid grid-cols-8">
                <!-- Time column -->
                <div class="bg-indigo-50 dark:bg-gray-800 border-r-2 border-indigo-200 dark:border-gray-600 sticky left-0 z-10">
                  <div v-for="slot in timeSlots" :key="slot" class="h-20 border-b border-indigo-200 dark:border-gray-600 flex items-center justify-center bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
                    <div class="text-center">
                      <div class="text-sm font-bold text-indigo-700 dark:text-indigo-300">{{ slot }}</div>
                      <div class="text-xs text-indigo-600 dark:text-indigo-400">{{ slot.replace(':', 'h') }}</div>
                    </div>
                  </div>
                </div>

                <!-- Day columns with enhanced blocks -->
                <div v-for="day in weekDays" :key="`col-${day.key}`" class="relative border-r border-gray-200 dark:border-gray-600 last:border-r-0 bg-gray-50/30 dark:bg-gray-900/30" :style="{ height: calendarHeight }">
                  <!-- Hour grid lines -->
                  <div class="absolute inset-0">
                    <div v-for="slot in timeSlots" :key="slot" class="h-20 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors"></div>
                  </div>

                  <!-- Enhanced class blocks -->
                  <div class="relative w-full h-full">
                    <template v-for="block in getClassBlocksForDay(day.key)" :key="block.classItem.id + '-' + block.slot.startTime + '-' + block.slot.endTime">
                      <div
                        class="enhanced-class-block absolute rounded-lg shadow-lg cursor-pointer overflow-hidden transform hover:scale-105 transition-all duration-200 border-2 border-white/30"
                        :class="[getClassColorByInstrument(block.classItem.instrument)]"
                        :style="{ top: block.top, height: block.height, left: block.left, width: block.width }"
                        @click="openClassDetails(block.classItem)"
                      >
                        <!-- Class header with time -->
                        <div class="bg-black/20 px-3 py-1 border-b border-white/20">
                          <div class="flex justify-between items-center">
                            <div class="text-xs font-bold text-white">{{ block.slot.startTime }}</div>
                            <div class="text-xs font-bold text-white">{{ block.slot.endTime }}</div>
                          </div>
                        </div>
                        
                        <!-- Class content -->
                        <div class="p-3 flex flex-col justify-center h-full">
                          <!-- Class name -->
                          <div class="text-sm font-bold text-white mb-1 line-clamp-2 leading-tight">
                            {{ block.classItem.name }}
                          </div>
                          
                          <!-- Teacher -->
                          <div class="flex items-center mb-1">
                            <svg class="w-3 h-3 mr-1 text-white/80" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                            </svg>
                            <div class="text-xs font-semibold text-white/90 truncate">
                              {{ getTeacherName(block.classItem.teacherId) }}
                            </div>
                          </div>
                          
                          <!-- Instrument -->
                          <div class="flex items-center mb-1">
                            <svg class="w-3 h-3 mr-1 text-white/80" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" clip-rule="evenodd" />
                            </svg>
                            <div class="text-xs font-medium text-white/80 truncate">
                              {{ block.classItem.instrument }}
                            </div>
                          </div>
                          
                          <!-- Student count -->
                          <div class="flex items-center">
                            <svg class="w-3 h-3 mr-1 text-white/80" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                            </svg>
                            <div class="text-xs font-medium text-white/80">
                              {{ (block.classItem.studentIds || []).length }} estudiantes
                            </div>
                          </div>
                        </div>
                        
                        <!-- Status indicator -->
                        <div class="absolute top-2 right-2">
                          <div class="w-2 h-2 bg-white/90 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </template>
                    
                    <!-- Empty state with better design -->
                    <template v-if="getClassBlocksForDay(day.key).length === 0">
                      <div class="absolute inset-0 flex items-center justify-center">
                        <div class="text-center">
                          <svg class="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <div class="text-xs text-gray-400 dark:text-gray-500 font-medium">Sin clases</div>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Enhanced List View -->
        <div v-if="viewMode === 'list'" class="space-y-6 mb-8">
          <div v-for="day in weekDays" :key="day.key" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <!-- Day Header -->
            <div class="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-bold text-white">{{ day.name.toUpperCase() }}</h3>
                  <p class="text-indigo-200 text-sm font-medium">{{ day.date }}</p>
                </div>
                <div class="text-right">
                  <div class="text-2xl font-bold text-white">{{ getClassesForDay(day.key).length }}</div>
                  <div class="text-indigo-200 text-xs">clases</div>
                </div>
              </div>
            </div>
            
            <!-- Classes List -->
            <div class="p-6">
              <div v-if="getClassesForDay(day.key).length === 0" class="text-center py-12">
                <svg class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div class="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">No hay clases programadas</div>
                <div class="text-sm text-gray-400 dark:text-gray-500">Este día está libre de actividades</div>
              </div>
              
              <div v-else class="grid gap-4">
                <div 
                  v-for="classItem in getClassesForDay(day.key)" 
                  :key="classItem.id" 
                  class="enhanced-class-card bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-6 hover:shadow-xl cursor-pointer transform hover:scale-105 transition-all duration-200"
                  :class="[getClassColorByInstrument(classItem.instrument)]"
                  @click="openClassDetails(classItem)"
                >
                  <div class="flex items-start justify-between mb-4">
                    <!-- Class Info -->
                    <div class="flex-1">
                      <div class="flex items-center mb-2">
                        <h4 class="text-xl font-bold text-gray-900 dark:text-white mr-3">{{ classItem.name }}</h4>
                        <span class="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-semibold">
                          {{ classItem.instrument }}
                        </span>
                      </div>
                      
                      <!-- Time -->
                      <div class="flex items-center mb-2">
                        <svg class="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                        </svg>
                        <span class="text-lg font-semibold text-gray-700 dark:text-gray-300">
                          {{ classItem.schedule?.[0]?.startTime || 'No definido' }} - {{ classItem.schedule?.[0]?.endTime || 'No definido' }}
                        </span>
                      </div>
                      
                      <!-- Teacher -->
                      <div class="flex items-center mb-2">
                        <svg class="w-5 h-5 mr-2 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                        </svg>
                        <span class="text-base font-medium text-gray-700 dark:text-gray-300">
                          {{ getTeacherName(classItem.teacherId) }}
                        </span>
                      </div>
                    </div>
                    
                    <!-- Student Count -->
                    <div class="text-right ml-4">
                      <div class="bg-blue-100 dark:bg-blue-900 rounded-xl p-4">
                        <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ (classItem.studentIds || []).length }}</div>
                        <div class="text-sm font-medium text-blue-600 dark:text-blue-400">estudiantes</div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Additional Info -->
                  <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div class="flex items-center space-x-4">
                      <!-- Room/Location if available -->
                      <div class="flex items-center">
                        <svg class="w-4 h-4 mr-1 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                        </svg>
                        <span class="text-sm text-gray-600 dark:text-gray-400">
                          {{ classItem.room || 'Aula por asignar' }}
                        </span>
                      </div>
                    </div>
                    
                    <!-- Status indicator -->
                    <div class="flex items-center">
                      <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse mr-2"></div>
                      <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Activa</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Class Details Modal -->
      <ClassDetailsModal
        v-if="selectedClass"
        :class-item="selectedClass"
        :teachers="teachers"
        :students="students"
        @close="closeClassDetails"
        @edit="handleEditFromDetails"
      />

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
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ClassData } from '../types/class';

import ClassDetailsModal from './ClassDetailsModal.vue';
import ClassEditModal from './ClassEditModal.vue';
import ScheduleStatsBar from './ScheduleStatsBar.vue';
import { useWeeklySchedule } from './WeeklyScheduleView';

const props = defineProps<{ classes?: ClassData[] }>();

const {
  // UI state
  viewMode,
  searchTerm,
  isLoading,
  loadingMessage,
  timeConfig,

  // data
  teachers,
  students,
  selectedClass,
  filteredClasses,

  // navigation / week
  weekDays,
  previousWeek,
  nextWeek,
  getWeekRange,

  // actions
  refreshData,
  resetAllFilters,
  showAllDay,
  exportSchedule,
  saveTimeConfig,

  // layout
  timeSlots,
  calendarHeight,

  // class helpers
  getClassBlocksForDay,
  getClassesForDay,
  getTeacherName,
  getPermissionText,
  getClassColorByInstrument,
  getTeacherPermissions,
  getPermissionLevel,

  // details / edit
  openClassDetails,
  closeClassDetails,
  handleEditFromDetails,
  editFormVisible,
  editForm,
  editFormErrors,
  saveClassEdits,
  cancelEdit,

  // permissions
  showPermissionsModal,
  selectedClassForPermissions,
  getSharedTeachers,
  updatePermission,
  savePermissions,
  closePermissionsModal,
} = useWeeklySchedule(props as unknown as Record<string, unknown>);
</script>

<style scoped src="./WeeklyScheduleView.css"></style>