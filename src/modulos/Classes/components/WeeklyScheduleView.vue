<template>
  <div class="weekly-schedule-view bg-white dark:bg-gray-900 min-h-screen">
    <!-- Header -->
    <div class="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Horarios de Clases</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Vista semanal de todos los horarios registrados
          </p>
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

        <!-- Teacher Filter -->
        <div>
          <select
            v-model="selectedTeacher"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Todos los maestros</option>
            <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
              {{ teacher.name }}
            </option>
          </select>
        </div>

        <!-- Instrument Filter -->
        <div>
          <select
            v-model="selectedInstrument"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Todos los instrumentos</option>
            <option v-for="instrument in instruments" :key="instrument" :value="instrument">
              {{ instrument }}
            </option>
          </select>
        </div>
        <!-- Program Filter -->
        <div>
          <select
            v-model="selectedProgram"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Todos los programas</option>
            <option value="preparatoria">Preparatoria</option>
            <option value="teoria-musical">Teoría Musical</option>
            <option value="coro">Coro</option>
            <option value="orquesta">Orquesta</option>
            <option value="otros">Otros</option>
          </select>
        </div>
      </div>

      <!-- Additional Filters Row -->
      <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Shared Classes Filter -->
        <div>
          <select
            v-model="filterType"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">Todas las clases</option>
            <option value="owned">Mis clases</option>
            <option value="shared-with-me">Compartidas conmigo</option>
            <option value="shared-owned">Mis clases compartidas</option>
          </select>
        </div>

        <!-- Quick Actions -->
        <div class="flex space-x-2">
          <button
            :disabled="isLoading"
            class="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
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
            <div class="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-800 rounded-full" />
            <div
              class="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"
            />
          </div>
          <div class="text-center">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Generando horarios...</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{ loadingMessage }}
            </p>
          </div>
        </div>
      </div>

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
            class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm mb-8"
          >
            <!-- Days Header -->
            <div class="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
              <div
                class="p-4 text-center font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700"
              >
                Hora
              </div>
              <div
                v-for="day in weekDays"
                :key="day.key"
                class="p-4 text-center font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
              >
                <div class="text-sm font-semibold">{{ day.name }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {{ day.date }}
                </div>
              </div>
            </div>

            <!-- Time Slots Grid -->
            <div class="relative">
              <!-- Time Row Headers -->
              <div
                v-for="timeSlot in timeSlots"
                :key="timeSlot"
                class="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700 last:border-b-0 min-h-[80px]"
              >
                <!-- Hour Label -->
                <div
                  class="flex items-center justify-center p-3 text-sm font-medium text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                >
                  {{ formatTimeSlot(timeSlot) }}
                </div>
                <!-- Day Columns -->
                <div
                  v-for="day in weekDays"
                  :key="`${day.key}-${timeSlot}`"
                  class="relative border-r border-gray-200 dark:border-gray-700 last:border-r-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors min-h-[80px]"
                >
                  <!-- Classes for this time slot -->
                  <template v-if="timeConfig.viewMode === 'standard'">
                    <!-- Standard view: one class per slot -->
                    <div
                      v-for="classItem in getClassesForTimeSlot(day.key, timeSlot)"
                      :key="classItem.id"
                      :class="[
                        'absolute inset-2 rounded-lg p-3 cursor-pointer transition-all hover:shadow-lg transform hover:-translate-y-1',
                        getClassColorByInstrument(classItem.instrument),
                        'border border-white/20',
                      ]"
                      @click="openClassDetails(classItem)"
                    >
                      <div class="text-xs font-bold text-white truncate mb-1">
                        {{ classItem.name }}
                        <!-- Shared Class Indicator -->
                        <span
                          v-if="isSharedWithMe(classItem)"
                          class="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white"
                        >
                          👥
                        </span>
                        <span
                          v-else-if="isMySharedClass(classItem)"
                          class="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white"
                        >
                          📤
                        </span>
                      </div>
                      <div class="text-xs text-white/90 truncate mb-1">
                        {{ getClassTimeRange(classItem) }}
                      </div>
                      <div class="text-xs text-white/75 truncate">
                        {{ getTeacherName(classItem.teacherId) }}
                      </div>
                      <div
                        class="text-xs text-white/60 truncate mt-1 flex items-center justify-between"
                      >
                        <span>👥 {{ classItem.studentIds?.length || 0 }}</span>
                        <button
                          v-if="canManagePermissions(classItem)"
                          class="opacity-75 hover:opacity-100 text-white/80 hover:text-white transition-all"
                          title="Compartir y permisos"
                          @click.stop="openShareModal(classItem)"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6.002l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </template>

                  <template v-else>
                    <!-- Overlap view: multiple classes stacked -->
                    <div class="space-y-1 p-1">
                      <div
                        v-for="(classItem, index) in getClassesForTimeSlot(day.key, timeSlot)"
                        :key="classItem.id"
                        :class="[
                          'rounded-md p-2 cursor-pointer transition-all hover:shadow-md text-xs',
                          getClassColorByInstrument(classItem.instrument),
                          'border border-white/20',
                        ]"
                        :style="{
                          transform: `translateY(${index * 2}px)`,
                          zIndex: getClassesForTimeSlot(day.key, timeSlot).length - index,
                        }"
                        @click="openClassDetails(classItem)"
                      >
                        <div class="font-bold text-white truncate">
                          {{ classItem.name }}
                          <!-- Shared Class Indicator -->
                          <span
                            v-if="isSharedWithMe(classItem)"
                            class="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white"
                          >
                            👥
                          </span>
                          <span
                            v-else-if="isMySharedClass(classItem)"
                            class="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white"
                          >
                            📤
                          </span>
                        </div>
                        <div class="text-white/75 truncate flex items-center justify-between">
                          <span>{{ getTeacherName(classItem.teacherId) }}</span>
                          <button
                            v-if="canManagePermissions(classItem)"
                            class="opacity-75 hover:opacity-100 text-white/80 hover:text-white transition-all ml-1"
                            title="Compartir y permisos"
                            @click.stop="openShareModal(classItem)"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              class="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6.002l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </template>

                  <!-- Empty state for time slot -->
                  <div
                    v-if="getClassesForTimeSlot(day.key, timeSlot).length === 0"
                    class="flex items-center justify-center h-full text-gray-300 dark:text-gray-600"
                  >
                    <div class="text-xs">-</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- List View -->
        <div v-else-if="viewMode === 'list'" class="space-y-4 mb-8">
          <div
            v-for="day in weekDays"
            :key="day.key"
            class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm mb-6"
          >
            <div
              class="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700"
            >
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ day.name }} - {{ day.date }}
              </h3>
            </div>

            <div class="p-6">
              <div
                v-if="getClassesForDay(day.key).length === 0"
                class="text-center py-8 text-gray-500 dark:text-gray-400"
              >
                <div class="text-4xl mb-2">📅</div>
                <p>No hay clases programadas para este día</p>
              </div>

              <div v-else class="space-y-3">
                <div
                  v-for="classItem in getClassesForDay(day.key)"
                  :key="classItem.id"
                  :class="[
                    'p-4 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-md mb-4',
                    getClassBorderColor(classItem.instrument),
                  ]"
                  @click="openClassDetails(classItem)"
                >
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center space-x-2">
                        <h4 class="font-semibold text-gray-900 dark:text-white">
                          {{ classItem.name }}
                        </h4>
                        <!-- Shared Class Indicators -->
                        <span
                          v-if="isSharedWithMe(classItem)"
                          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400"
                        >
                          👥 Compartida conmigo
                        </span>
                        <span
                          v-else-if="isMySharedClass(classItem)"
                          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400"
                        >
                          📤 Mi clase compartida
                        </span>
                      </div>
                      <div
                        class="flex items-center space-x-4 mt-2 text-sm text-gray-600 dark:text-gray-400"
                      >
                        <span class="flex items-center">
                          🕐 {{ getClassTimeRange(classItem) }}
                        </span>
                        <span class="flex items-center">
                          👨‍🏫 {{ getTeacherName(classItem.teacherId) }}
                        </span>
                        <span class="flex items-center"> 🎵 {{ classItem.instrument }} </span>
                        <span class="flex items-center">
                          📚 {{ getProgramName(classItem.level) }}
                        </span>
                        <!-- Permissions indicator for shared classes -->
                        <span v-if="isSharedWithMe(classItem)" class="flex items-center">
                          🔐 {{ getPermissionText(getMyPermissions(classItem)) }}
                        </span>
                      </div>
                    </div>
                    <div class="flex items-center space-x-2">
                      <span
                        :class="[
                          'px-2 py-1 rounded-full text-xs font-medium',
                          getStatusColor(classItem.status),
                        ]"
                      >
                        {{ getStatusText(classItem.status) }}
                      </span>
                      <span class="text-xs text-gray-500 dark:text-gray-400">
                        {{ classItem.studentIds?.length || 0 }} estudiantes
                      </span>
                      <!-- Action Buttons -->
                      <button
                        class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        title="Editar clase"
                        @click.stop="editClass(classItem)"
                      >
                        Editar
                      </button>
                      <button
                        v-if="canManagePermissions(classItem)"
                        class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                        title="Compartir y permisos"
                        @click.stop="openShareModal(classItem)"
                      >
                        Compartir
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Class Details Modal -->
      <div
        v-if="selectedClass"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        @click="closeClassDetails"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          @click.stop
        >
          <div class="p-6 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                  {{ selectedClass.name }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {{ selectedClass.description || "Sin descripción" }}
                </p>
              </div>
              <button
                class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                @click="closeClassDetails"
              >
                ✕
              </button>
            </div>
          </div>

          <div class="p-6 space-y-6">
            <!-- Class Info -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Instrumento</label
                >
                <p class="mt-1 text-sm text-gray-900 dark:text-white">
                  {{ selectedClass.instrument }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Programa</label
                >
                <p class="mt-1 text-sm text-gray-900 dark:text-white">
                  {{ getProgramName(selectedClass.level) }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Maestro</label
                >
                <p class="mt-1 text-sm text-gray-900 dark:text-white">
                  {{ getTeacherName(selectedClass.teacherId) }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Capacidad</label
                >
                <p class="mt-1 text-sm text-gray-900 dark:text-white">
                  {{ selectedClass.capacity || "No definida" }}
                </p>
              </div>
            </div>

            <!-- Schedules -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
                >Horarios</label
              >
              <div class="space-y-2">
                <div
                  v-for="(schedule, index) in getClassSchedules(selectedClass)"
                  :key="index"
                  class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <span class="text-sm text-gray-900 dark:text-white">
                    {{ getDayName(schedule.day) }}
                  </span>
                  <span class="text-sm text-gray-600 dark:text-gray-400">
                    {{ formatTime(schedule.startTime) }} - {{ formatTime(schedule.endTime) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Students -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Estudiantes ({{ selectedClass.studentIds?.length || 0 }})
              </label>
              <div class="max-h-32 overflow-y-auto space-y-1">
                <div
                  v-for="studentId in selectedClass.studentIds"
                  :key="studentId"
                  class="text-sm text-gray-600 dark:text-gray-400"
                >
                  {{ getStudentName(studentId) }}
                </div>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, inject} from "vue"
import {useTeachersStore} from "../../Teachers/store/teachers"
import {useStudentsStore} from "../../Students/store/students"
import {useClassesStore} from "../store/classes"
import {useAuthStore} from "../../../stores/auth"
import {getAppConfig, setAppConfig, type AppConfig} from "../service/appConfig"
import ScheduleStatsBar from "./ScheduleStatsBar.vue"
import type {ClassData} from "../types/class"

// Extend Window interface for demo system
declare global {
  interface Window {
    demoScheduleSystem?: any
  }
}

interface Props {
  classes?: ClassData[]
}

const props = defineProps<Props>()

const teachersStore = useTeachersStore()
const studentsStore = useStudentsStore()
const classesStore = useClassesStore()
const authStore = useAuthStore()

// Get current teacher ID from injection or auth
const currentTeacherId = inject<string>("currentTeacherId") || authStore.user?.uid || ""

// Reactive data
const viewMode = ref<"week" | "list">("week")
const searchTerm = ref("")
const selectedTeacher = ref("")
const selectedInstrument = ref("")
const selectedProgram = ref("")
const filterType = ref<"all" | "owned" | "shared-with-me" | "shared-owned">("all")
const selectedClass = ref<ClassData | null>(null)
const currentWeekStart = ref(new Date())
const isLoading = ref(false)
const loadingMessage = ref("Cargando datos...")

// Permissions modal
const showPermissionsModal = ref(false)
const selectedClassForPermissions = ref<ClassData | null>(null)
const tempPermissions = ref<Record<string, string[]>>({})

// Time configuration
const timeConfig = ref<AppConfig>({
  esTemprano: true,
  esTarde: true,
  esNoche: true,
  viewMode: "standard",
})

// Computed properties
const allClasses = computed(() => {
  return props.classes || classesStore.classes || []
})

const teachers = computed(() => {
  return teachersStore.teachers || []
})

const students = computed(() => {
  return studentsStore.students || []
})

const instruments = computed(() => {
  const instrumentSet = new Set<string>()
  allClasses.value.forEach((classItem) => {
    if (classItem.instrument) {
      instrumentSet.add(classItem.instrument)
    }
  })
  return Array.from(instrumentSet).sort()
})

const filteredClasses = computed(() => {
  let classes = allClasses.value

  // Apply search filter
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    classes = classes.filter(
      (classItem) =>
        classItem.name?.toLowerCase().includes(term) ||
        classItem.instrument?.toLowerCase().includes(term) ||
        classItem.description?.toLowerCase().includes(term)
    )
  }

  // Apply teacher filter
  if (selectedTeacher.value) {
    classes = classes.filter((classItem) => classItem.teacherId === selectedTeacher.value)
  }

  // Apply instrument filter
  if (selectedInstrument.value) {
    classes = classes.filter((classItem) => classItem.instrument === selectedInstrument.value)
  }

  // Apply program filter
  if (selectedProgram.value) {
    classes = classes.filter((classItem) => classItem.level === selectedProgram.value)
  }

  // Apply shared classes filter
  if (filterType.value !== "all") {
    switch (filterType.value) {
      case "owned":
        classes = classes.filter((classItem) => classItem.teacherId === currentTeacherId)
        break
      case "shared-with-me":
        classes = classes.filter((classItem) => isSharedWithMe(classItem))
        break
      case "shared-owned":
        classes = classes.filter((classItem) => isMySharedClass(classItem))
        break
    }
  }

  // Apply time period filters
  if (!timeConfig.value.esTemprano || !timeConfig.value.esTarde || !timeConfig.value.esNoche) {
    classes = classes.filter((classItem) => {
      const schedules = getClassSchedules(classItem)
      return schedules.some((schedule) => {
        if (!schedule.startTime) return true
        
        const [hours] = schedule.startTime.split(":").map(Number)
        
        // Check if class falls within active time periods
        if (timeConfig.value.esTemprano && hours >= 7 && hours < 14) return true
        if (timeConfig.value.esTarde && hours >= 14 && hours < 19) return true
        if (timeConfig.value.esNoche && hours >= 19 && hours < 23) return true
        
        return false
      })
    })
  }

  return classes
})

const weekDays = computed(() => {
  const days = []
  for (let i = 0; i < 6; i++) {
    const date = new Date(currentWeekStart.value)
    date.setDate(currentWeekStart.value.getDate() + i)
    
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const dayNamesSpanish = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ]
    
    days.push({
      key: dayNames[date.getDay()],
      name: dayNamesSpanish[date.getDay()],
      date: date.toLocaleDateString("es-ES", {day: "numeric", month: "short"}),
      fullDate: date,
    })
  }
  return days
})

const timeSlots = computed(() => {
  const slots = []
  
  // Generate time slots based on active periods
  if (timeConfig.value.esTemprano) {
    for (let hour = 7; hour < 14; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`)
    }
  }
  
  if (timeConfig.value.esTarde) {
    for (let hour = 14; hour < 19; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`)
    }
  }
  
  if (timeConfig.value.esNoche) {
    for (let hour = 19; hour < 23; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`)
    }
  }
  
  // If no periods are selected, show all day
  if (!timeConfig.value.esTemprano && !timeConfig.value.esTarde && !timeConfig.value.esNoche) {
    for (let hour = 7; hour < 23; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`)
    }
  }
  
  return slots
})

// Set current week to start of week (Monday)
const setCurrentWeekStart = () => {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  monday.setHours(0, 0, 0, 0)
  currentWeekStart.value = monday
}

// Save time configuration to Firestore
const saveTimeConfig = async () => {
  try {
    await setAppConfig(timeConfig.value)
    console.log("Configuración de tiempo guardada")
  } catch (error) {
    console.error("Error al guardar configuración de tiempo:", error)
  }
}

// Load time configuration from Firestore
const loadTimeConfig = async () => {
  try {
    const config = await getAppConfig()
    timeConfig.value = config
    console.log("Configuración de tiempo cargada:", config)
  } catch (error) {
    console.error("Error al cargar configuración de tiempo:", error)
  }
}

// Shared classes helper functions
const isSharedWithMe = (classItem: ClassData): boolean => {
  if (!classItem.teachers || !Array.isArray(classItem.teachers)) return false

  const isInTeachers = classItem.teachers.some((teacherItem) => {
    if (typeof teacherItem === "string") {
      return teacherItem === currentTeacherId
    } else if (typeof teacherItem === "object" && teacherItem.teacherId) {
      return teacherItem.teacherId === currentTeacherId
    }
    return false
  })

  return isInTeachers && classItem.teacherId !== currentTeacherId
}

const isMySharedClass = (classItem: ClassData): boolean => {
  if (!classItem.teachers || !Array.isArray(classItem.teachers)) return false

  return classItem.teacherId === currentTeacherId && classItem.teachers.length > 1
}

const canManagePermissions = (classItem: ClassData): boolean => {
  // Only the owner can manage permissions, or users with 'manage' permission
  if (classItem.teacherId === currentTeacherId) return true

  const myPermissions = getMyPermissions(classItem)
  return myPermissions.includes("manage")
}

const getMyPermissions = (classItem: ClassData): string[] => {
  if (!classItem.permissions || typeof classItem.permissions !== "object") return ["read"]

  return classItem.permissions[currentTeacherId] || ["read"]
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

// Permissions modal functions
const openShareModal = (classItem: ClassData) => {
  selectedClassForPermissions.value = classItem
  tempPermissions.value = {...(classItem.permissions || {})}
  showPermissionsModal.value = true
}

const editClass = (classItem: ClassData) => {
  // Placeholder for navigation logic
  console.log(`Navegar a la edición de la clase: ${classItem.id}`)
  // Example with vue-router:
  // router.push({ name: 'admin-class-edit', params: { id: classItem.id } });
}

const closePermissionsModal = () => {
  showPermissionsModal.value = false
  selectedClassForPermissions.value = null
  tempPermissions.value = {}
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
    isLoading.value = true
    loadingMessage.value = "Guardando permisos..."

    // Update the class with new permissions
    const updatedClass = {
      ...selectedClassForPermissions.value,
      permissions: tempPermissions.value,
    }

    await classesStore.updateClass(updatedClass)

    closePermissionsModal()

    // Refresh data to reflect changes
    await refreshData()
  } catch (error) {
    console.error("Error al guardar permisos:", error)
  } finally {
    isLoading.value = false
  }
}

// Methods
const getWeekRange = () => {
  const endDate = new Date(currentWeekStart.value)
  endDate.setDate(currentWeekStart.value.getDate() + 5) // Saturday

  const startStr = currentWeekStart.value.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  })
  const endStr = endDate.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  })

  return `${startStr} - ${endStr}`
}

const previousWeek = () => {
  const newDate = new Date(currentWeekStart.value)
  newDate.setDate(currentWeekStart.value.getDate() - 7)
  currentWeekStart.value = newDate
}

const nextWeek = () => {
  const newDate = new Date(currentWeekStart.value)
  newDate.setDate(currentWeekStart.value.getDate() + 7)
  currentWeekStart.value = newDate
}

const formatTimeSlot = (timeSlot: string) => {
  const [hours, minutes] = timeSlot.split(":")
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? "PM" : "AM"
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

const formatTime = (time: string) => {
  if (!time) return ""
  const [hours, minutes] = time.split(":")
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? "PM" : "AM"
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

const getDayName = (day: string) => {
  const dayNames: Record<string, string> = {
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miércoles",
    thursday: "Jueves",
    friday: "Viernes",
    saturday: "Sábado",
  }
  return dayNames[day] || day
}

const getProgramName = (level?: string) => {
  if (!level) return "Sin programa"
  const programs: Record<string, string> = {
    preparatoria: "Preparatoria",
    "teoria-musical": "Teoría Musical",
    coro: "Coro",
    orquesta: "Orquesta",
    otros: "Otros",
  }
  return programs[level] || level
}

const getTeacherName = (teacherId?: string) => {
  if (!teacherId) return "Sin asignar"
  const teacher = teachers.value.find((t) => t.id === teacherId)
  return teacher?.name || "Sin asignar"
}

const getStudentName = (studentId: string) => {
  const student = students.value.find((s) => s.id === studentId)
  return student ? `${student.nombre} ${student.apellido}` : "Estudiante no encontrado"
}

const getClassSchedules = (classItem: ClassData) => {
  if (!classItem.schedule) {
    console.log(`Clase "${classItem.name}" no tiene horario definido`)
    return []
  }

  // Manejar formato con slots múltiples
  if ("slots" in classItem.schedule && Array.isArray(classItem.schedule.slots)) {
    // console.log(`Clase "${classItem.name}" tiene ${classItem.schedule.slots.length} slots de horario:`, classItem.schedule.slots);
    return classItem.schedule.slots
  }

  // Manejar formato directo (legacy)
  if ("day" in classItem.schedule && classItem.schedule.day) {
    const singleSlot = {
      day: classItem.schedule.day,
      startTime: classItem.schedule.startTime || "",
      endTime: classItem.schedule.endTime || "",
    }
    console.log(`Clase "${classItem.name}" tiene formato directo de horario:`, singleSlot)
    return [singleSlot]
  }

  console.log(
    `Clase "${classItem.name}" tiene horario en formato no reconocido:`,
    classItem.schedule
  )
  return []
}

const getClassesForDay = (day: string) => {
  const classes = filteredClasses.value
    .filter((classItem) => {
      const schedules = getClassSchedules(classItem)
      return schedules.some((schedule) => {
        const normalizedScheduleDay = normalizeDayName(schedule.day)
        const normalizedTargetDay = normalizeDayName(day)
        return normalizedScheduleDay === normalizedTargetDay
      })
    })
    .sort((a, b) => {
      const aSchedule = getClassSchedules(a).find(
        (s) => normalizeDayName(s.day) === normalizeDayName(day)
      )
      const bSchedule = getClassSchedules(b).find(
        (s) => normalizeDayName(s.day) === normalizeDayName(day)
      )
      if (!aSchedule || !bSchedule) return 0
      return aSchedule.startTime.localeCompare(bSchedule.startTime)
    })

  console.log(
    `Clases para ${day}:`,
    classes.map((c) => c.name)
  )
  return classes
}

const getClassesForTimeSlot = (day: string, timeSlot: string) => {
  const classes = filteredClasses.value.filter((classItem) => {
    const schedules = getClassSchedules(classItem)

    return schedules.some((schedule) => {
      // Normalizar el día para comparación
      const normalizedScheduleDay = normalizeDayName(schedule.day)
      const normalizedTargetDay = normalizeDayName(day)

      if (normalizedScheduleDay !== normalizedTargetDay) return false

      // Convertir tiempos a minutos para comparación más precisa
      const [slotHours, slotMinutes] = timeSlot.split(":").map(Number)
      const slotTime = slotHours * 60 + slotMinutes

      const [startHours, startMinutes] = schedule.startTime.split(":").map(Number)
      const startTime = startHours * 60 + startMinutes

      const [endHours, endMinutes] = schedule.endTime.split(":").map(Number)
      const endTime = endHours * 60 + endMinutes

      // The class must be active during this time slot
      const isActiveInSlot = slotTime >= startTime && slotTime < endTime

      //   if (isActiveInSlot) {
      //     console.log(`Clase "${classItem.name}" activa en ${day} ${timeSlot} (${schedule.startTime}-${schedule.endTime})`);
      //   }

      return isActiveInSlot
    })
  })

  // In standard mode, show only one class per slot
  if (timeConfig.value.viewMode === "standard") {
    return classes.slice(0, 1)
  }

  // In overlap mode, show all classes
  return classes
}

// Función auxiliar para normalizar nombres de días
const normalizeDayName = (day: string): string => {
  const dayMapping: Record<string, string> = {
    // Días en español
    lunes: "monday",
    martes: "tuesday",
    miércoles: "wednesday",
    miercoles: "wednesday",
    jueves: "thursday",
    viernes: "friday",
    sábado: "saturday",
    sabado: "saturday",
    domingo: "sunday",
    // Días en inglés (ya normalizados)
    monday: "monday",
    tuesday: "tuesday",
    wednesday: "wednesday",
    thursday: "thursday",
    friday: "friday",
    saturday: "saturday",
    sunday: "sunday",
  }

  return dayMapping[day.toLowerCase()] || day.toLowerCase()
}

const getClassTimeRange = (classItem: ClassData) => {
  const schedules = getClassSchedules(classItem)
  if (schedules.length === 0) return ""
  const schedule = schedules[0] // For display, use first schedule
  return `${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}`
}

const getClassColorByInstrument = (instrument?: string) => {
  if (!instrument) return "bg-gray-500 text-white"
  const colors: Record<string, string> = {
    Piano: "bg-blue-500 text-white",
    Guitarra: "bg-green-500 text-white",
    Violín: "bg-purple-500 text-white",
    Flauta: "bg-yellow-500 text-white",
    Cello: "bg-red-500 text-white",
    Batería: "bg-gray-700 text-white",
    Canto: "bg-pink-500 text-white",
  }
  return colors[instrument] || "bg-indigo-500 text-white"
}

const getClassBorderColor = (instrument?: string) => {
  if (!instrument) return "border-gray-500 bg-gray-50 dark:bg-gray-900/20"
  const colors: Record<string, string> = {
    Piano: "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
    Guitarra: "border-green-500 bg-green-50 dark:bg-green-900/20",
    Violín: "border-purple-500 bg-purple-50 dark:bg-purple-900/20",
    Flauta: "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20",
    Cello: "border-red-500 bg-red-50 dark:bg-red-900/20",
    Batería: "border-gray-500 bg-gray-50 dark:bg-gray-900/20",
    Canto: "border-pink-500 bg-pink-50 dark:bg-pink-900/20",
  }
  return colors[instrument] || "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
}

const getStatusColor = (status?: string) => {
  if (!status) return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
    suspended: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  }
  return colors[status] || "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
}

const getStatusText = (status?: string) => {
  if (!status) return "Sin estado"
  const texts: Record<string, string> = {
    active: "Activa",
    inactive: "Inactiva",
    suspended: "Suspendida",
  }
  return texts[status] || "Sin estado"
}

const openClassDetails = (classItem: ClassData) => {
  selectedClass.value = classItem
}

const closeClassDetails = () => {
  selectedClass.value = null
}

const resetAllFilters = async () => {
  // Resetear filtros de búsqueda
  searchTerm.value = ""
  selectedTeacher.value = ""
  selectedInstrument.value = ""
  selectedProgram.value = ""
  filterType.value = "all"

  // Resetear configuración de tiempo a valores por defecto
  timeConfig.value = {
    esTemprano: true,
    esTarde: true,
    esNoche: true,
    viewMode: "standard",
  }

  await saveTimeConfig()
}

const showAllDay = async () => {
  timeConfig.value.esTemprano = true
  timeConfig.value.esTarde = true
  timeConfig.value.esNoche = true

  await saveTimeConfig()
}

const exportSchedule = () => {
  // TODO: Implement PDF export functionality
  console.log("Exporting schedule...")
}

// Data refresh function
const refreshData = async () => {
  try {
    isLoading.value = true
    loadingMessage.value = "Actualizando datos..."

    // Reload all necessary data
    await Promise.all([
      classesStore.fetchClasses(),
      teachersStore.fetchTeachers(),
      studentsStore.fetchStudents(),
    ])
  } catch (error) {
    console.error("Error al actualizar datos:", error)
  } finally {
    isLoading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  setCurrentWeekStart()

  try {
    isLoading.value = true
    loadingMessage.value = "Cargando configuración..."

    // Cargar configuración de tiempo
    await loadTimeConfig()

    loadingMessage.value = "Cargando clases..."

    // Cargar datos de las clases si no se proporcionaron como props
    if (!props.classes) {
      await classesStore.fetchClasses()
    }

    loadingMessage.value = "Cargando maestros y estudiantes..."

    // Cargar maestros y estudiantes
    await Promise.all([teachersStore.fetchTeachers(), studentsStore.fetchStudents()])

    console.log("WeeklyScheduleView mounted with", allClasses.value.length, "classes")
    console.log("Current teacher ID:", currentTeacherId)

    // Debug en desarrollo
    if (process.env.NODE_ENV === "development") {
      setTimeout(() => {
        debugClasses()
        loadDemoData()
      }, 1000) // Esperar un segundo para que todo se cargue
    }
  } catch (error) {
    console.error("Error loading data:", error)
  } finally {
    isLoading.value = false
  }
})

// Load demo data from external script
const loadDemoData = () => {
  try {
    if (window.demoScheduleSystem) {
      console.log("🎵 Sistema de demostración disponible!")
      console.log("💡 Usa runFullDemo() en consola para ver ejemplos")

      // Check if we need to inject demo classes
      if (allClasses.value.length === 0) {
        console.log("📝 No hay clases - considera usar createLocalStorageData() para pruebas")
      }
    }
  } catch (error) {
    console.log("Sistema de demo no cargado")
  }
}

// Debug function to log class information
const debugClasses = () => {
  //   console.log('=== DEBUG: Estado de clases ===');
  //   console.log(`Total de clases: ${allClasses.value.length}`);
  //   console.log(`Clases filtradas: ${filteredClasses.value.length}`);
  //   allClasses.value.forEach((classItem, index) => {
  //     console.log(`Clase ${index + 1}:`, {
  //       id: classItem.id,
  //       name: classItem.name,
  //       instrument: classItem.instrument,
  //       teacherId: classItem.teacherId,
  //       schedule: classItem.schedule,
  //       studentIds: classItem.studentIds?.length || 0
  //     });
  //   });
  //   console.log('Configuración de tiempo:', timeConfig.value);
  //   console.log('========================');
}
</script>

<style scoped>
.weekly-schedule-view {
  font-family:
    "Inter",
    system-ui,
    -apple-system,
    sans-serif;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.dark .weekly-schedule-view {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

.event-item {
  overflow: hidden;
  line-height: 1.2;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.event-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

/* Enhanced loading spinner */
@keyframes pulse-glow {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7);
  }
  50% {
    box-shadow: 0 0 0 20px rgba(99, 102, 241, 0);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Professional card styling */
.class-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dark .class-card {
  background: rgba(31, 41, 55, 0.9);
  border: 1px solid rgba(75, 85, 99, 0.3);
}

.class-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.dark .class-card:hover {
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

/* Enhanced time grid */
.time-grid-cell {
  position: relative;
  transition: all 0.2s ease;
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
}

.dark .time-grid-cell {
  background: linear-gradient(145deg, #1f2937 0%, #111827 100%);
}

.time-grid-cell:hover {
  background: linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 100%);
  transform: scale(1.02);
}

.dark .time-grid-cell:hover {
  background: linear-gradient(145deg, #374151 0%, #1f2937 100%);
}

/* Shared class indicators */
.shared-indicator {
  position: relative;
  overflow: hidden;
}

.shared-indicator::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #8b5cf6, #06b6d4);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* Permission badges */
.permission-badge {
  position: relative;
  overflow: hidden;
}

.permission-badge::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  animation: slide 2s infinite;
}

@keyframes slide {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #cbd5e1, #94a3b8);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.dark .overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #64748b, #475569);
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #94a3b8, #64748b);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #475569, #334155);
}

/* Modal enhancements */
.modal-backdrop {
  backdrop-filter: blur(8px);
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
}

.dark .modal-content {
  background: rgba(31, 41, 55, 0.95);
  border: 1px solid rgba(75, 85, 99, 0.3);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}

/* Button enhancements */
.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.35);
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #5856eb 0%, #7c3aed 100%);
  box-shadow: 0 6px 20px 0 rgba(99, 102, 241, 0.45);
  transform: translateY(-2px);
}

.btn-secondary {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 1px solid rgba(203, 213, 225, 0.5);
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%);
  transform: translateY(-1px);
}

.dark .btn-secondary {
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
  border: 1px solid rgba(75, 85, 99, 0.5);
}

.dark .btn-secondary:hover {
  background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
}

/* Filter section styling */
.filter-section {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.dark .filter-section {
  background: rgba(31, 41, 55, 0.8);
  border: 1px solid rgba(75, 85, 99, 0.3);
}

/* Responsive enhancements */
@media (max-width: 768px) {
  .weekly-schedule-view {
    padding: 1rem;
  }

  .class-card {
    margin-bottom: 1rem;
  }

  .filter-section {
    padding: 1rem;
  }
}

/* Focus states */
.focus\:ring-2:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  border-color: #6366f1;
}

/* Enhanced transitions */
* {
  transition-property:
    color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow,
    transform, filter, backdrop-filter;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}
</style>
