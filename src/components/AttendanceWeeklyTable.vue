<template>
  <div
    class="attendance-panel bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 md:p-6 max-w-full w-full mx-auto transition-colors duration-300"
  >
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
      <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        Registro de Asistencia
      </h2>
      <div class="flex flex-wrap gap-2 items-center">
        <button
          class="flex items-center gap-1 px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          @click="showDateRangeModal = true"
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>{{ dateRangeText }}</span>
        </button>

        <div class="group relative">
          <button
            class="flex items-center gap-1 px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span>Filtros</span>
          </button>

          <!-- Dropdown menu -->
          <div
            class="absolute right-0 mt-1 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 z-10 hidden group-hover:block"
          >
            <div class="py-1" role="menu" aria-orientation="vertical">
              <div class="px-3 py-2">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300"
                  >Clase</label
                >
                <select
                  v-model="selectedClass"
                  class="mt-1 w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-200"
                  @change="handleClassChange"
                >
                  <option value="">Todas las clases</option>
                  <option v-for="classItem in classes" :key="classItem.id" :value="classItem.id">
                    {{ classItem.name }}
                  </option>
                </select>
              </div>
              <div class="px-3 py-2">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300"
                  >Estado</label
                >
                <div class="mt-1 space-y-1">
                  <div
                    v-for="(label, status) in statusLabels"
                    :key="status"
                    class="flex items-center"
                  >
                    <input
                      :id="`status-${status}`"
                      v-model="selectedStatuses"
                      type="checkbox"
                      :value="status"
                      class="w-3 h-3 text-blue-600 rounded"
                    />
                    <label
                      :for="`status-${status}`"
                      class="ml-2 text-xs text-gray-700 dark:text-gray-300"
                      >{{ label }}</label
                    >
                  </div>
                </div>
              </div>
              <div class="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  class="w-full text-center py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded"
                  @click="applyFilters"
                >
                  Aplicar filtros
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar estudiante..."
            class="pl-8 pr-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <select
          v-model="viewMode"
          class="px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-200"
          @change="changeViewMode"
        >
          <option value="week">Semana</option>
          <option value="biweek">Quincena</option>
          <option value="month">Mes</option>
          <option value="custom">Personalizado</option>
        </select>

        <button
          :disabled="isLoading || students.length === 0"
          class="flex items-center gap-1 px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-medium transition-colors"
          @click="exportToPdf"
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
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span class="hidden sm:inline">Exportar</span>
        </button>
      </div>
    </div>

    <!-- Summary Statistics -->
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
      <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <h4 class="text-xs font-medium text-green-800 dark:text-green-200">Asistencia</h4>
        <div class="mt-1 flex items-baseline justify-between">
          <span class="text-xl font-bold text-green-600 dark:text-green-400"
            >{{ attendanceStats.present }}%</span
          >
          <span class="text-xs text-green-600 dark:text-green-400"
            >{{ attendanceStats.presentCount }} estudiantes</span
          >
        </div>
        <div class="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div
            class="bg-green-500 h-1.5 rounded-full"
            :style="`width: ${attendanceStats.present}%`"
          />
        </div>
      </div>

      <div class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <h4 class="text-xs font-medium text-red-800 dark:text-red-200">Ausencias</h4>
        <div class="mt-1 flex items-baseline justify-between">
          <span class="text-xl font-bold text-red-600 dark:text-red-400"
            >{{ attendanceStats.absent }}%</span
          >
          <span class="text-xs text-red-600 dark:text-red-400"
            >{{ attendanceStats.absentCount }} estudiantes</span
          >
        </div>
        <div class="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div
            class="bg-red-500 h-1.5 rounded-full"
            :style="`width: ${attendanceStats.absent}%`"
          />
        </div>
      </div>

      <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
        <h4 class="text-xs font-medium text-purple-800 dark:text-purple-200">Tardanzas</h4>
        <div class="mt-1 flex items-baseline justify-between">
          <span class="text-xl font-bold text-purple-600 dark:text-purple-400"
            >{{ attendanceStats.late }}%</span
          >
          <span class="text-xs text-purple-600 dark:text-purple-400"
            >{{ attendanceStats.lateCount }} estudiantes</span
          >
        </div>
        <div class="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div
            class="bg-purple-500 h-1.5 rounded-full"
            :style="`width: ${attendanceStats.late}%`"
          />
        </div>
      </div>

      <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 class="text-xs font-medium text-blue-800 dark:text-blue-200">Justificados</h4>
        <div class="mt-1 flex items-baseline justify-between">
          <span class="text-xl font-bold text-blue-600 dark:text-blue-400"
            >{{ attendanceStats.justified }}%</span
          >
          <span class="text-xs text-blue-600 dark:text-blue-400"
            >{{ attendanceStats.justifiedCount }} estudiantes</span
          >
        </div>
        <div class="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div
            class="bg-blue-500 h-1.5 rounded-full"
            :style="`width: ${attendanceStats.justified}%`"
          />
        </div>
      </div>

      <!-- New card for Students Without Classes -->
      <div class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <h4 class="text-xs font-medium text-gray-700 dark:text-gray-300">Sin Clases</h4>
        <div class="mt-1 flex items-baseline justify-between">
          <span class="text-xl font-bold text-gray-600 dark:text-gray-400"
            >{{ studentsWithoutClassesStats.percentage }}%</span
          >
          <span class="text-xs text-gray-600 dark:text-gray-400"
            >{{ studentsWithoutClassesStats.count }} estudiantes</span
          >
        </div>
        <div class="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div
            class="bg-gray-500 h-1.5 rounded-full"
            :style="`width: ${studentsWithoutClassesStats.percentage}%`"
          />
        </div>
      </div>
    </div>

    <!-- Date navigation -->
    <div
      class="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 mb-3"
    >
      <button
        class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="Anterior"
        @click="navigatePrevious"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 text-gray-600 dark:text-gray-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
            clip-rule="evenodd"
          />
        </svg>
      </button>

      <div class="flex items-center gap-2 text-gray-700 dark:text-gray-300">
        <button
          class="text-xs px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          @click="goToToday"
        >
          Hoy
        </button>
        <span class="text-sm font-medium">{{ dateRangeText }}</span>
      </div>

      <button
        class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="Siguiente"
        @click="navigateNext"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 text-gray-600 dark:text-gray-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>

    <!-- Table -->
    <div v-if="isLoading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"/>
    </div>

    <div
      v-else-if="error"
      class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg p-3 text-sm flex items-center gap-2"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{{ error }}</span>
      <button
        class="ml-auto underline text-blue-600 dark:text-blue-400"
        @click="loadAttendanceData"
      >
        Reintentar
      </button>
    </div>

    <div
      v-else-if="filteredStudents.length === 0"
      class="flex flex-col items-center justify-center py-10 text-center text-gray-500 dark:text-gray-400"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-12 w-12 mb-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
      <p class="text-sm">No hay datos de asistencia para mostrar</p>
      <p class="text-xs mt-1">Intenta cambiar los filtros o el rango de fechas</p>
    </div>

    <div v-else class="overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
        <thead class="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
          <tr>
            <!-- Sortable header columns -->
            <th
              class="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 p-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="sortBy('name')"
            >
              <div class="flex items-center">
                <span>Estudiante</span>
                <svg
                  v-if="sortColumn === 'name'"
                  xmlns="http://www.w3.org/2000/svg"
                  class="ml-1 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    v-if="sortDirection === 'asc'"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 15l7-7 7 7"
                  />
                  <path
                    v-else
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </th>
            <th
              class="p-3 text-center text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="sortBy('attendance')"
            >
              <div class="flex items-center justify-center">
                <span>Asistencia</span>
                <svg
                  v-if="sortColumn === 'attendance'"
                  xmlns="http://www.w3.org/2000/svg"
                  class="ml-1 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    v-if="sortDirection === 'asc'"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 15l7-7 7 7"
                  />
                  <path
                    v-else
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </th>
            <th
              v-for="day in visibleDays"
              :key="day.getTime()"
              class="p-3 text-center text-xs font-medium whitespace-nowrap"
            >
              <div>{{ formatDayName(day) }}</div>
              <div class="font-bold">{{ formatDayNumber(day) }}</div>
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          <tr
            v-for="student in sortedStudents"
            :key="student.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <td
              class="sticky left-0 z-10 bg-white dark:bg-gray-900 p-3 whitespace-nowrap hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div class="flex items-center">
                <div
                  class="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs"
                >
                  <span>{{ getInitials(student.name) }}</span>
                </div>
                <div class="ml-3">
                  <div class="font-medium text-gray-900 dark:text-white">{{ student.name }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ student.classInfo || "Sin clase" }}
                  </div>
                </div>
              </div>
            </td>
            <td class="p-3 text-center">
              <div
class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" 
                :class="getStudentAttendanceClass(student.id)"
              >
                {{ getStudentAttendanceRate(student.id) }}%
              </div>
            </td>
            <td v-for="day in visibleDays" :key="day.getTime()" class="p-3 text-center">
              <div
:class="getAttendanceClass(student.id, day) + ' inline-flex items-center justify-center h-7 w-7 rounded-full font-semibold'"
                "
                :title="getAttendanceTooltip(student.id, day)"
              >
                {{ getAttendanceStatus(student.id, day) }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-4 flex items-center justify-between">
      <div class="text-xs text-gray-500 dark:text-gray-400">
        Mostrando {{ (currentPage - 1) * pageSize + 1 }} a
        {{ Math.min(currentPage * pageSize, filteredStudents.length) }} de
        {{ filteredStudents.length }} estudiantes
      </div>
      <div class="flex items-center space-x-1">
        <button
          :disabled="currentPage === 1"
          class="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 disabled:opacity-50 text-xs"
          @click="changePage(1)"
        >
          &laquo;
        </button>
        <button
          :disabled="currentPage === 1"
          class="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 disabled:opacity-50 text-xs"
          @click="changePage(currentPage - 1)"
        >
          &lsaquo;
        </button>

        <div v-for="page in paginationRange" :key="page" class="hidden sm:block">
          <button
v-if="page !== '...'" :class="[currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300']" 
                  ]"
            class="px-2 py-1 rounded text-xs"
            @click="changePage(page)"
          >
            {{ page }}
          </button>
          <span v-else class="px-2 py-1 text-xs text-gray-600 dark:text-gray-400">...</span>
        </div>

        <button
          :disabled="currentPage === totalPages"
          class="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 disabled:opacity-50 text-xs"
          @click="changePage(currentPage + 1)"
        >
          &rsaquo;
        </button>
        <button
          :disabled="currentPage === totalPages"
          class="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 disabled:opacity-50 text-xs"
          @click="changePage(totalPages)"
        >
          &raquo;
        </button>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex flex-wrap gap-3 mt-4 text-xs justify-center">
      <div class="flex items-center gap-1">
        <span class="inline-block w-4 h-4 rounded-full bg-green-200 dark:bg-green-800"/>Presente
      </div>
      <div class="flex items-center gap-1">
        <span class="inline-block w-4 h-4 rounded-full bg-red-200 dark:bg-red-800"/>Ausente
      </div>
      <div class="flex items-center gap-1">
        <span class="inline-block w-4 h-4 rounded-full bg-purple-200 dark:bg-purple-800"/>Tarde
      </div>
      <div class="flex items-center gap-1">
        <span class="inline-block w-4 h-4 rounded-full bg-blue-200 dark:bg-blue-800"/>Justificado
      </div>
      <div class="flex items-center gap-1">
        <span class="inline-block w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700"/>Sin
        clase
      </div>
    </div>

    <!-- Date Range Modal -->
    <div
      v-if="showDateRangeModal"
      class="fixed inset-0 z-50 overflow-y-auto"
      aria-modal="true"
      role="dialog"
    >
      <div
        class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
      >
        <!-- Background overlay -->
        <div
          class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          aria-hidden="true"
          @click="showDateRangeModal = false"
        />

        <!-- Modal panel -->
        <div
          class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
        >
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
              Seleccionar rango de fechas
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Fecha de inicio</label
                >
                <input
                  v-model="customDateRange.start"
                  type="date"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Fecha de fin</label
                >
                <input
                  v-model="customDateRange.end"
                  type="date"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >Presets</label
              >
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  class="px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  @click="setPresetRange('week')"
                >
                  Esta semana
                </button>
                <button
                  class="px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  @click="setPresetRange('month')"
                >
                  Este mes
                </button>
                <button
                  class="px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  @click="setPresetRange('lastWeek')"
                >
                  Semana pasada
                </button>
                <button
                  class="px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  @click="setPresetRange('lastMonth')"
                >
                  Mes pasado
                </button>
              </div>
            </div>
          </div>

          <div
            class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 flex flex-col sm:flex-row-reverse gap-2"
          >
            <button
              type="button"
              class="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none"
              @click="applyCustomDateRange"
            >
              Aplicar
            </button>
            <button
              type="button"
              class="w-full sm:w-auto px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none"
              @click="showDateRangeModal = false"
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
import "jspdf-autotable"
import {jsPDF} from "jspdf"
import {es} from "date-fns/locale"
import {ref, computed, onMounted, watch} from "vue"
import {useClassesStore} from "../modulos/Classes/store/classes"
import {useStudentsStore} from "../modulos/Students/store/students"
import {useAttendanceStore} from "../modulos/Attendance/store/attendance"
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  parseISO,
  isValid,
  subDays,
  isWithinInterval,
} from "date-fns"

// Enhanced types and interfaces
const statusLabels = {
  P: "Presente",
  A: "Ausente",
  T: "Tarde",
  J: "Justificado",
}

interface AttendanceRecord {
  studentId: string
  date: string
  status: AttendanceStatusType
}

type AttendanceStatusType = "P" | "A" | "T" | "J" | ""

interface Student {
  id: string
  name: string
  photoURL?: string
  classInfo?: string
  classIds?: string[]
}

interface Class {
  id: string
  name: string
  studentIds?: string[]
}

interface ClassSchedule {
  studentId: string
  dayOfWeek: number // 0 = domingo, 1 = lunes, ... 6 = sábado
  time: string
}

// Update type for color arrays
const createColorArray = (r: number, g: number, b: number): [number, number, number] => [r, g, b]

// Fix the setFillColorForCell function being undefined
function setFillColorForCell(doc: jsPDF, color: [number, number, number]) {
  doc.setFillColor(color[0], color[1], color[2])
}

// Import stores
const classesStore = useClassesStore()
const studentsStore = useStudentsStore()
const attendanceStore = useAttendanceStore()

// State - Adding the missing variables
const isLoading = ref(true)
const error = ref<string | null>(null)
const students = ref<Student[]>([])
const allStudents = ref<Student[]>([])
const classes = ref<Class[]>([])
const attendance = ref<AttendanceRecord[]>([])
const classSchedules = ref<ClassSchedule[]>([])
const currentDate = ref(new Date())
const viewMode = ref<"week" | "biweek" | "month" | "custom">("week")
const selectedClass = ref<string>("")

// New reactive state
const searchQuery = ref("")
const selectedStatuses = ref(["P", "A", "T", "J"])
const sortColumn = ref("name")
const sortDirection = ref<"asc" | "desc">("asc")
const showDateRangeModal = ref(false)
const customDateRange = ref({
  start: format(subDays(new Date(), 7), "yyyy-MM-dd"),
  end: format(new Date(), "yyyy-MM-dd"),
})

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

// Filtered students by selected class
const filteredStudents = computed(() => {
  if (!selectedClass.value) {
    return students.value
  }

  return students.value.filter((student) => student.classIds?.includes(selectedClass.value))
})

// Students on current page
const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value

  // First filter by search query
  const searchFiltered = searchFilteredStudents.value

  return searchFiltered.slice(start, end)
})

// Total pages
const totalPages = computed(() =>
  Math.max(1, Math.ceil(searchFilteredStudents.value.length / pageSize.value))
)

// Pagination range with ellipsis
const paginationRange = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const range = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      range.push(i)
    }
  } else {
    if (current <= 3) {
      for (let i = 1; i <= 5; i++) {
        range.push(i)
      }
      range.push("...", total)
    } else if (current >= total - 2) {
      range.push(1, "...")
      for (let i = total - 4; i <= total; i++) {
        range.push(i)
      }
    } else {
      range.push(1, "...")
      for (let i = current - 1; i <= current + 1; i++) {
        range.push(i)
      }
      range.push("...", total)
    }
  }

  return range
})

// Go to today function
function goToToday() {
  currentDate.value = new Date()
  loadAttendanceData()
}

// Sort functions
function sortBy(column: string) {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc"
  } else {
    sortColumn.value = column
    sortDirection.value = "asc"
  }
}

// Set preset date range
function setPresetRange(preset: string) {
  const today = new Date()

  switch (preset) {
    case "week":
      customDateRange.value.start = format(startOfWeek(today, {weekStartsOn: 1}), "yyyy-MM-dd")
      customDateRange.value.end = format(endOfWeek(today, {weekStartsOn: 1}), "yyyy-MM-dd")
      break
    case "month":
      customDateRange.value.start = format(startOfMonth(today), "yyyy-MM-dd")
      customDateRange.value.end = format(endOfMonth(today), "yyyy-MM-dd")
      break
    case "lastWeek":
      const lastWeekStart = subWeeks(startOfWeek(today, {weekStartsOn: 1}), 1)
      customDateRange.value.start = format(lastWeekStart, "yyyy-MM-dd")
      customDateRange.value.end = format(addDays(lastWeekStart, 6), "yyyy-MM-dd")
      break
    case "lastMonth":
      const lastMonth = subMonths(today, 1)
      customDateRange.value.start = format(startOfMonth(lastMonth), "yyyy-MM-dd")
      customDateRange.value.end = format(endOfMonth(lastMonth), "yyyy-MM-dd")
      break
  }
}

// Apply custom date range
function applyCustomDateRange() {
  // Validate dates
  const startDate = parseISO(customDateRange.value.start)
  const endDate = parseISO(customDateRange.value.end)

  if (!isValid(startDate) || !isValid(endDate)) {
    alert("Por favor ingrese fechas válidas")
    return
  }

  if (endDate < startDate) {
    alert("La fecha de fin debe ser posterior a la fecha de inicio")
    return
  }

  viewMode.value = "custom"
  currentDate.value = new Date(customDateRange.value.start)
  showDateRangeModal.value = false
  loadAttendanceData()
}

// Apply filters
function applyFilters() {
  // Reset to first page when filters change
  currentPage.value = 1
  loadAttendanceData()
}

// Enhanced computed properties

// Filter students with search query
const searchFilteredStudents = computed(() => {
  if (!searchQuery.value.trim()) {
    return filteredStudents.value
  }

  const query = searchQuery.value.toLowerCase().trim()
  return filteredStudents.value.filter(
    (student) =>
      student.name.toLowerCase().includes(query) || student.classInfo?.toLowerCase().includes(query)
  )
})

// Sorted students based on column and direction
const sortedStudents = computed(() => {
  // Start with paginated students that are filtered by search query
  const students = [...paginatedStudents.value]

  // Define status priority order: Present > Late > Justified > Absent > No classes
  const attendancePriority = {P: 1, T: 2, J: 3, A: 4, "-": 5, "": 6}

  // First group students by their predominant attendance status
  students.sort((a, b) => {
    // Get predominant status for each student
    const getStudentMainStatus = (student) => {
      // Count status occurrences
      const statusCounts = {P: 0, T: 0, J: 0, A: 0, "-": 0, "": 0}

      for (const day of visibleDays.value) {
        const status = getAttendanceStatus(student.id, day)
        if (status in statusCounts) {
          statusCounts[status]++
        }
      }

      // Find status with highest priority that has any occurrences
      for (const status of ["P", "T", "J", "A", "-", ""]) {
        if (statusCounts[status] > 0) {
          return status
        }
      }

      return ""
    }

    const statusA = getStudentMainStatus(a)
    const statusB = getStudentMainStatus(b)

    // Compare by status priority first
    const priorityDiff = attendancePriority[statusA] - attendancePriority[statusB]
    if (priorityDiff !== 0) return priorityDiff

    // If same status group, then apply the selected sort within the group
    if (sortColumn.value === "name") {
      // Sort alphabetically by name within the same status group
      const comparison = a.name.localeCompare(b.name)
      return sortDirection.value === "asc" ? comparison : -comparison
    } else if (sortColumn.value === "attendance") {
      // Sort by attendance rate within the same status group
      const rateA = getStudentAttendanceRate(a.id)
      const rateB = getStudentAttendanceRate(b.id)
      const comparison = rateA - rateB
      return sortDirection.value === "asc" ? comparison : -comparison
    }

    return 0
  })

  return students
})

// Days visible based on view mode or custom range
const visibleDays = computed(() => {
  let start: Date
  let end: Date

  if (viewMode.value === "custom") {
    start = parseISO(customDateRange.value.start)
    end = parseISO(customDateRange.value.end)
  } else {
    switch (viewMode.value) {
      case "week":
        start = startOfWeek(currentDate.value, {weekStartsOn: 1})
        end = endOfWeek(currentDate.value, {weekStartsOn: 1})
        break
      case "biweek":
        start = startOfWeek(currentDate.value, {weekStartsOn: 1})
        end = addDays(endOfWeek(currentDate.value, {weekStartsOn: 1}), 7)
        break
      case "month":
        start = startOfMonth(currentDate.value)
        end = endOfMonth(currentDate.value)
        break
      default:
        start = startOfWeek(currentDate.value, {weekStartsOn: 1})
        end = endOfWeek(currentDate.value, {weekStartsOn: 1})
    }
  }

  // Limit the number of days to display (max 31 days)
  const allDays = eachDayOfInterval({start, end})
  if (allDays.length > 31) {
    return allDays.slice(0, 31)
  }
  return allDays
})

// Texto para mostrar el rango de fechas actual
const dateRangeText = computed(() => {
  const firstDay = visibleDays.value[0]
  const lastDay = visibleDays.value[visibleDays.value.length - 1]

  const firstMonth = format(firstDay, "MMMM", {locale: es})
  const lastMonth = format(lastDay, "MMMM", {locale: es})

  if (firstMonth === lastMonth) {
    return `${format(firstDay, "d", {locale: es})} - ${format(lastDay, "d", {locale: es})} ${firstMonth}`
  } else {
    return `${format(firstDay, "d MMM", {locale: es})} - ${format(lastDay, "d MMM", {locale: es})}`
  }
})

// Formatear nombre de día
function formatDayName(date: Date): string {
  return format(date, "EEE", {locale: es})
}

// Formatear número de día
function formatDayNumber(date: Date): string {
  return format(date, "d", {locale: es})
}

// Obtener iniciales para avatar
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

// Obtener estado de asistencia
function getAttendanceStatus(studentId: string, date: Date): string {
  const dateStr = format(date, "yyyy-MM-dd")
  const record = attendance.value.find((a) => a.studentId === studentId && a.date === dateStr)

  if (!record) {
    const dayOfWeek = date.getDay()
    const hasClass = classSchedules.value.some(
      (s) => s.studentId === studentId && s.dayOfWeek === dayOfWeek
    )
    return hasClass ? "-" : ""
  }

  return record.status
}

// Obtener clase CSS para celda de asistencia
function getAttendanceClass(studentId: string, date: Date): string {
  const dateStr = format(date, "yyyy-MM-dd")
  const record = attendance.value.find((a) => a.studentId === studentId && a.date === dateStr)

  // Si no hay registro pero ese día de la semana tiene clase programada, muestra gris
  if (!record) {
    const dayOfWeek = date.getDay()
    const hasClass = classSchedules.value.some(
      (s) => s.studentId === studentId && s.dayOfWeek === dayOfWeek
    )

    return hasClass
      ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-600"
      : ""
  }

  switch (record.status) {
    case "P":
      return "bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800"
    case "A":
      return "bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800"
    case "T":
      return "bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800"
    case "J":
      return "bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800"
    default:
      return ""
  }
}

// Navegar al período anterior
function navigatePrevious() {
  switch (viewMode.value) {
    case "week":
      currentDate.value = subWeeks(currentDate.value, 1)
      break
    case "biweek":
      currentDate.value = subWeeks(currentDate.value, 2)
      break
    case "month":
      currentDate.value = subMonths(currentDate.value, 1)
      break
  }
  loadAttendanceData()
}

// Navegar al período siguiente
function navigateNext() {
  switch (viewMode.value) {
    case "week":
      currentDate.value = addWeeks(currentDate.value, 1)
      break
    case "biweek":
      currentDate.value = addWeeks(currentDate.value, 2)
      break
    case "month":
      currentDate.value = addMonths(currentDate.value, 1)
      break
  }
  loadAttendanceData()
}

// Cambiar modo de visualización
function changeViewMode() {
  if (viewMode.value === "custom") {
    // When switching to custom, show the date picker modal
    showDateRangeModal.value = true
  } else {
    // For standard modes, just load the data
    loadAttendanceData()
  }
}

// Cambiar clase seleccionada
function handleClassChange() {
  // Resetear paginación cuando cambia la clase
  currentPage.value = 1
  loadAttendanceData()
}

// Cambiar página actual
function changePage(page: string | number) {
  if (typeof page === "string") {
    return
  }
  currentPage.value = page
}

// Get student attendance rate
function getStudentAttendanceRate(studentId: string): number {
  // Count total days the student should attend
  let totalDays = 0
  let presentDays = 0

  visibleDays.value.forEach((day) => {
    const dateStr = format(day, "yyyy-MM-dd")
    const record = attendance.value.find((a) => a.studentId === studentId && a.date === dateStr)

    // Check if student has a class scheduled for this day
    const dayOfWeek = day.getDay()
    const hasClass = classSchedules.value.some(
      (s) => s.studentId === studentId && s.dayOfWeek === dayOfWeek
    )

    if (hasClass) {
      totalDays++

      if (record && (record.status === "P" || record.status === "T" || record.status === "J")) {
        presentDays++
      }
    }
  })

  return totalDays ? Math.round((presentDays / totalDays) * 100) : 0
}

// Get CSS class for student attendance percentage
function getStudentAttendanceClass(studentId: string): string {
  const rate = getStudentAttendanceRate(studentId)

  if (rate >= 90) return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
  if (rate >= 75) return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
  if (rate >= 50) return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"
  return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
}

// Get tooltip for attendance cell
function getAttendanceTooltip(studentId: string, date: Date): string {
  const status = getAttendanceStatus(studentId, date)
  const dateFormatted = format(date, "PPP", {locale: es})

  switch (status) {
    case "P":
      return `Presente el ${dateFormatted}`
    case "A":
      return `Ausente el ${dateFormatted}`
    case "T":
      return `Tarde el ${dateFormatted}`
    case "J":
      return `Justificado el ${dateFormatted}`
    case "-":
      return `Sin registro el ${dateFormatted}`
    default:
      return `Sin clase el ${dateFormatted}`
  }
}

// Calculate attendance statistics
const attendanceStats = computed(() => {
  let presentCount = 0
  let absentCount = 0
  let lateCount = 0
  let justifiedCount = 0
  let totalRecords = 0

  // Count all records by status
  attendance.value.forEach((record) => {
    // Only count if we have a selected student
    const isStudentInFilteredList = filteredStudents.value.some((s) => s.id === record.studentId)
    if (!isStudentInFilteredList) return

    // Check if date is within visible range
    const recordDate = parseISO(record.date)
    const isDateInRange = visibleDays.value.some((day) => format(day, "yyyy-MM-dd") === record.date)

    if (isDateInRange) {
      totalRecords++

      switch (record.status) {
        case "P":
          presentCount++
          break
        case "A":
          absentCount++
          break
        case "T":
          lateCount++
          break
        case "J":
          justifiedCount++
          break
      }
    }
  })

  // Avoid division by zero
  const total = totalRecords || 1

  return {
    presentCount,
    absentCount,
    lateCount,
    justifiedCount,
    present: Math.round((presentCount / total) * 100),
    absent: Math.round((absentCount / total) * 100),
    late: Math.round((lateCount / total) * 100),
    justified: Math.round((justifiedCount / total) * 100),
  }
})

// Calculate statistics for students without classes in the visible range
const studentsWithoutClassesStats = computed(() => {
  // Count students without any classes in the visible days
  const studentsWithoutClasses = students.value.filter((student) => {
    // Check if this student has any scheduled class on any visible day
    const hasClassInVisibleDays = visibleDays.value.some((day) => {
      const dayOfWeek = day.getDay()
      return classSchedules.value.some(
        (schedule) => schedule.studentId === student.id && schedule.dayOfWeek === dayOfWeek
      )
    })

    // If they don't have classes, include them in the count
    return !hasClassInVisibleDays
  })

  const count = studentsWithoutClasses.length
  const total = students.value.length || 1 // Avoid division by zero
  const percentage = Math.round((count / total) * 100)

  return {
    count,
    percentage,
  }
})

// Update the async function to handle custom date ranges
async function loadAttendanceData() {
  isLoading.value = true
  error.value = null

  try {
    // Get the current date range
    let startDate: string, endDate: string

    if (viewMode.value === "custom") {
      startDate = customDateRange.value.start
      endDate = customDateRange.value.end
    } else {
      startDate = format(visibleDays.value[0], "yyyy-MM-dd")
      endDate = format(visibleDays.value[visibleDays.value.length - 1], "yyyy-MM-dd")
    }

    // Filter students by selected class if needed
    if (selectedClass.value) {
      students.value = allStudents.value.filter((student) =>
        student.classIds?.includes(selectedClass.value)
      )
    } else {
      students.value = [...allStudents.value]
    }

    // Load attendance data from the store
    await attendanceStore.fetchAttendanceByDateRange(startDate, endDate)

    // Map the records from the store to the format we need
    const attendanceRecords: AttendanceRecord[] = []

    // Get records from the store
    const records = attendanceStore.records

    for (const record of records) {
      // Skip records without a date or student ID
      if (!record.Fecha || !record.studentId) {
        continue
      }

      // Only include records for the filtered students
      const isStudentInFilteredList = students.value.some((s) => s.id === record.studentId)
      if (!isStudentInFilteredList) continue

      // Only include records for the selected class if one is selected
      if (selectedClass.value && record.classId !== selectedClass.value) continue

      // Convert attendance status to display format
      let status: AttendanceStatusType

      switch (record.status) {
        case "Presente":
          status = "P"
          break
        case "Ausente":
          status = "A"
          break
        case "Tardanza":
          status = "T"
          break
        case "Justificado":
          status = "J"
          break
        default:
          status = ""
      }

      attendanceRecords.push({
        studentId: record.studentId,
        date: record.Fecha,
        status,
      })
    }

    // Update the local state with the processed records
    attendance.value = attendanceRecords

    // Load class schedules to show the gray cells
    await loadClassSchedules()
  } catch (err: any) {
    error.value = `Error al cargar los datos de asistencia: ${err.message}`
    console.error("Error cargando datos de asistencia:", err)
  } finally {
    isLoading.value = false
  }
}

// Cargar horarios de clase
async function loadClassSchedules() {
  // Limpiar horarios anteriores
  classSchedules.value = []

  try {
    // Para cada estudiante, obtener sus horarios de clase
    for (const student of students.value) {
      // Obtener las clases a las que pertenece el estudiante
      const studentClassIds = student.classIds || []

      // Si hay una clase seleccionada, filtrar solo por esa
      const classesToProcess = selectedClass.value
        ? studentClassIds.filter((id) => id === selectedClass.value)
        : studentClassIds

      // Para cada clase del estudiante
      for (const classId of classesToProcess) {
        // Buscar la clase en el store
        const classData = classesStore.getClassById(classId)
        if (!classData || !classData.schedule || !classData.schedule.slots) continue

        // Procesar los slots de horario de la clase
        for (const slot of classData.schedule.slots) {
          // Convertir día de semana de texto a número (0 = domingo, 1 = lunes, etc.)
          const days = {
            lunes: 1,
            martes: 2,
            miércoles: 3,
            jueves: 4,
            viernes: 5,
            sábado: 6,
            domingo: 0,
          }

          const dayOfWeek = days[slot.day.toLowerCase() as keyof typeof days]

          // Agregar el horario de clase
          classSchedules.value.push({
            studentId: student.id,
            dayOfWeek,
            time: slot.startTime,
          })
        }
      }
    }
  } catch (error) {
    console.error("Error al cargar horarios de clase:", error)
  }
}

// Cargar datos iniciales
async function loadData() {
  isLoading.value = true
  error.value = null

  try {
    // Cargar clases, estudiantes y configuraciones desde los stores
    await Promise.all([
      classesStore.fetchClasses(),
      studentsStore.fetchStudents(),
      // Aquí irían más llamadas para cargar datos iniciales
    ])

    // Obtener clases del store
    classes.value = classesStore.classes.map((cls) => ({
      id: cls.id,
      name: cls.name,
      studentIds: cls.studentIds || [],
    }))

    // Preparar estudiantes con información de clases
    const allStudentsData = studentsStore.students.map((student) => {
      // Encontrar clases a las que pertenece el estudiante
      const studentClasses = classes.value.filter((cls) => cls.studentIds?.includes(student.id))

      // Agregar información de clase
      return {
        id: student.id,
        name: `${student.nombre || ""} ${student.apellido || ""}`.trim(),
        photoURL: student.photoURL,
        classIds: studentClasses.map((c) => c.id),
        classInfo: studentClasses.map((c) => c.name).join(", "),
      }
    })

    // Guardar todos los estudiantes
    allStudents.value = allStudentsData

    // Aplicar filtro inicial
    if (selectedClass.value) {
      students.value = allStudentsData.filter((student) =>
        student.classIds?.includes(selectedClass.value)
      )
    } else {
      students.value = allStudentsData
    }

    // Cargar datos de asistencia
    await loadAttendanceData()
  } catch (err: any) {
    console.error("Error al cargar datos iniciales:", err)
    error.value = `Error al cargar datos: ${err.message}`
  } finally {
    isLoading.value = false
  }
}

// Exportar a PDF
async function exportToPdf() {
  if (students.value.length === 0) return

  try {
    // Crear documento PDF con la importación corregida
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    })

    // Título del documento
    doc.setFontSize(16)
    doc.text("Historial de Asistencia", 14, 15)

    // Período de fechas
    doc.setFontSize(10)
    doc.text(`Período: ${dateRangeText.value}`, 14, 22)

    // Clase seleccionada
    if (selectedClass.value) {
      const className = classes.value.find((c) => c.id === selectedClass.value)?.name || ""
      doc.text(`Clase: ${className}`, 14, 28)
    }

    // Fecha de generación
    doc.text(`Generado el: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 34)

    // Preparar datos para la tabla
    const tableHeaders = [
      "Estudiante",
      ...visibleDays.value.map((day) => format(day, "EEE d", {locale: es})),
    ]

    const tableBody = students.value.map((student) => {
      const row = [student.name]

      visibleDays.value.forEach((day) => {
        const status = getAttendanceStatus(student.id, day)
        row.push(status || "-")
      })

      return row
    })

    // Generar tabla con autoTable
    doc.autoTable({
      startY: 40,
      head: [tableHeaders],
      body: tableBody,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [70, 130, 180],
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        0: {cellWidth: 40}, // Ancho para la columna de nombres
      },
      // Update didDrawCell function to handle color arrays properly
      didDrawCell: (data: any) => {
        // Colorear celdas según estado
        if (data.section === "body" && data.column.index > 0) {
          const status = data.cell.text[0]
          let fillColor: [number, number, number] | undefined

          switch (status) {
            case "P":
              fillColor = [200, 250, 200]
              break
            case "A":
              fillColor = [250, 200, 200]
              break
            case "T":
              fillColor = [230, 200, 250]
              break
            case "J":
              fillColor = [200, 220, 250]
              break
          }

          if (fillColor && status !== "-") {
            setFillColorForCell(doc, fillColor)
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, "F")
            doc.setTextColor(0)
            doc.text(
              status,
              data.cell.x + data.cell.width / 2,
              data.cell.y + data.cell.height / 2,
              {
                align: "center",
                baseline: "middle",
              }
            )
          }
        }
      },
    })

    // Agregar leyenda
    const legendY = (doc as any).lastAutoTable.finalY + 10

    doc.setFontSize(8)
    doc.text("Leyenda:", 14, legendY)

    const legends = [
      {text: "P: Presente", color: createColorArray(200, 250, 200)},
      {text: "A: Ausente", color: createColorArray(250, 200, 200)},
      {text: "T: Tarde", color: createColorArray(230, 200, 250)},
      {text: "J: Justificado", color: createColorArray(200, 220, 250)},
      {text: "-: Sin clase", color: createColorArray(240, 240, 240)},
    ]

    legends.forEach((item, index) => {
      const x = 14 + index * 30
      const y = legendY + 6

      // Dibujar rectángulo de color
      doc.setFillColor(...item.color)
      doc.rect(x, y - 4, 5, 5, "F")

      // Texto
      doc.text(item.text, x + 7, y)
    })

    // Nombre del archivo
    const fileName = `asistencia_${format(new Date(), "yyyy-MM-dd")}.pdf`

    // Guardar archivo
    doc.save(fileName)
  } catch (error) {
    console.error("Error al generar PDF:", error)
    alert("Error al generar el PDF. Por favor, intente de nuevo.")
  }
}

// Cargar datos iniciales cuando el componente se monta
onMounted(() => {
  loadData()
})

// Vigilar cambios en la clase seleccionada
watch(selectedClass, () => {
  handleClassChange()
})
</script>

<style scoped>
/* Tailwind handles most styles, just add any specific customizations here */
.attendance-panel {
  max-height: calc(100vh - 2rem);
  display: flex;
  flex-direction: column;
}

/* Add smooth transitions */
.transition-transform {
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

/* Add hover lift effect to cards */
.attendance-panel .bg-green-50,
.attendance-panel .bg-red-50,
.attendance-panel .bg-purple-50,
.attendance-panel .bg-blue-50 {
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.attendance-panel .bg-green-50:hover,
.attendance-panel .bg-red-50:hover,
.attendance-panel .bg-purple-50:hover,
.attendance-panel .bg-blue-50:hover {
  transform: translateY(-2px);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>
