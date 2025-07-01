<template>
  <div
    class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800"
  >
    <!-- Header Principal -->
    <header
      class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-xl border-b border-gray-200 dark:border-gray-700"
    >
      <div class="px-6 py-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <h1
                class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent"
              >
                Dashboard Director
              </h1>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {{ currentDate }} • Monitoreo en tiempo real
              </p>
            </div>
          </div>

          <!-- Controles de Fecha y Acciones -->
          <div class="flex items-center space-x-4">
            <!-- Navegación de fechas -->
            <div
              class="flex items-center space-x-2 bg-white dark:bg-gray-700 rounded-lg px-4 py-2 shadow-md"
            >
              <button
                class="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
                @click="navigateDate(-1)"
              >
                <ChevronLeftIcon class="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <span
                class="text-sm font-medium text-gray-900 dark:text-white min-w-[120px] text-center"
              >
                {{ selectedDateFormatted }}
              </span>
              <button
                :disabled="isToday"
                class="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50"
                @click="navigateDate(1)"
              >
                <ChevronRightIcon class="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            <!-- Botón Reporte Semanal -->
            <button
              class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md"
              @click="generateWeeklyReport"
            >
              <DocumentArrowDownIcon class="w-5 h-5 mr-2" />
              Reporte Semanal
            </button>

            <!-- Actualizar datos -->
            <button
              :disabled="loading"
              class="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-md"
              @click="refreshDashboard"
            >
              <ArrowPathIcon class="w-5 h-5" :class="{'animate-spin': loading}" />
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Dashboard Principal -->
    <main class="px-6 py-8">
      <div class="max-w-7xl mx-auto space-y-8">
        <!-- KPIs del Día -->
        <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Clases del Día -->
          <div
            class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <AcademicCapIcon class="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span class="text-2xl font-bold text-gray-900 dark:text-white">{{
                todayStats.totalClasses
              }}</span>
            </div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Clases del Día
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-500">
              {{ todayStats.activeClasses }} activas • {{ todayStats.completedClasses }} completadas
            </p>
          </div>

          <!-- Maestros Esperados -->
          <div
            class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <UsersIcon class="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span class="text-2xl font-bold text-gray-900 dark:text-white">{{
                todayStats.expectedTeachers
              }}</span>
            </div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Maestros Esperados
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-500">
              {{ todayStats.presentTeachers }} presentes
            </p>
          </div>

          <!-- Estudiantes Esperados -->
          <div
            class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <UserGroupIcon class="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <span class="text-2xl font-bold text-gray-900 dark:text-white">{{
                todayStats.expectedStudents
              }}</span>
            </div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Estudiantes Esperados
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-500">
              {{ todayStats.presentStudents }} presentes
            </p>
          </div>

          <!-- Tasa de Asistencia -->
          <div
            class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                <ChartBarIcon class="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <span class="text-2xl font-bold text-gray-900 dark:text-white"
                >{{ todayStats.attendanceRate }}%</span
              >
            </div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Asistencia Hoy
            </h3>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                class="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500"
                :style="{width: `${todayStats.attendanceRate}%`}"
              />
            </div>
          </div>
        </section>

        <!-- Clases en Tiempo Real -->
        <section class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Lista de Clases del Día -->
          <div
            class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50"
          >
            <div class="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <ClockIcon class="w-6 h-6 mr-3 text-blue-600" />
                Clases del Día
              </h2>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Monitoreo en tiempo real de asistencias
              </p>
            </div>
            <div class="p-6 max-h-96 overflow-y-auto">
              <div class="space-y-4">
                <div
                  v-for="class_ in todayClasses"
                  :key="class_.id"
                  class="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200"
                  :class="{
                    'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800':
                      class_.status === 'active',
                    'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800':
                      class_.status === 'scheduled',
                    'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800':
                      class_.status === 'completed',
                  }"
                >
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center space-x-3">
                      <div
                        class="w-3 h-3 rounded-full"
                        :class="{
                          'bg-green-500 animate-pulse': class_.status === 'active',
                          'bg-blue-500': class_.status === 'scheduled',
                          'bg-gray-400': class_.status === 'completed',
                        }"
                      />
                      <h3 class="font-semibold text-gray-900 dark:text-white">{{ class_.name }}</h3>
                    </div>
                    <span class="text-sm text-gray-500 dark:text-gray-400">{{ class_.time }}</span>
                  </div>
                  <div class="flex items-center justify-between text-sm">
                    <div class="flex items-center space-x-4">
                      <span class="text-gray-600 dark:text-gray-400">
                        Maestro: <span class="font-medium">{{ class_.teacher }}</span>
                      </span>
                    </div>
                    <div class="flex items-center space-x-2">
                      <span class="font-medium text-gray-900 dark:text-white">
                        {{ class_.presentStudents }}/{{ class_.totalStudents }}
                      </span>
                      <div class="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          class="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                          :style="{
                            width: `${(class_.presentStudents / class_.totalStudents) * 100}%`,
                          }"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Estadísticas Rápidas -->
          <div
            class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50"
          >
            <div class="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <ChartPieIcon class="w-6 h-6 mr-3 text-purple-600" />
                Resumen del Día
              </h2>
            </div>
            <div class="p-6 space-y-4">
              <!-- Progreso de clases -->
              <div
                class="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
              >
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Progreso de Clases</span
                >
                <div class="flex items-center space-x-2">
                  <div class="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      class="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      :style="{
                        width: `${(todayStats.completedClasses / todayStats.totalClasses) * 100}%`,
                      }"
                    />
                  </div>
                  <span class="text-sm font-semibold text-gray-900 dark:text-white">
                    {{ Math.round((todayStats.completedClasses / todayStats.totalClasses) * 100) }}%
                  </span>
                </div>
              </div>

              <!-- Promedio de asistencia -->
              <div
                class="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
              >
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Promedio de Asistencia</span
                >
                <span class="text-lg font-bold text-green-600 dark:text-green-400">
                  {{ todayStats.attendanceRate }}%
                </span>
              </div>

              <!-- Instrumentos más activos -->
              <div class="space-y-2">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Instrumentos Más Activos</span
                >
                <div class="space-y-1">
                  <div
                    v-for="instrument in topInstruments"
                    :key="instrument.name"
                    class="flex items-center justify-between text-xs"
                  >
                    <span class="text-gray-600 dark:text-gray-400">{{ instrument.name }}</span>
                    <span class="font-medium text-gray-900 dark:text-white"
                      >{{ instrument.count }} clases</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Tabla de Estudiantes Críticos -->
        <section
          class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50"
        >
          <div class="p-6 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <ExclamationTriangleIcon class="w-6 h-6 mr-3 text-red-600" />
                  Estudiantes Críticos - Asistencias
                </h2>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Estudiantes que requieren atención inmediata por baja asistencia
                </p>
              </div>

              <!-- Filtros -->
              <div class="flex items-center space-x-3">
                <select
                  v-model="attendanceFilter"
                  class="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  @change="filterStudents"
                >
                  <option value="critical">Más Ausentes</option>
                  <option value="good">Más Presentes</option>
                  <option value="instrument">Por Instrumento</option>
                  <option value="age">Por Edad</option>
                  <option value="alphabetical">Alfabético</option>
                  <option value="classes">Por Clases</option>
                </select>

                <button
                  class="inline-flex items-center px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  @click="exportCriticalStudents"
                >
                  <DocumentArrowDownIcon class="w-4 h-4 mr-1" />
                  Exportar
                </button>
              </div>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Estudiante
                  </th>
                  <th
                    class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Instrumento
                  </th>
                  <th
                    class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Clases Asignadas
                  </th>
                  <th
                    class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Ausencias
                  </th>
                  <th
                    class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    % Asistencia
                  </th>
                  <th
                    class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Estado
                  </th>
                  <th
                    class="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr
                  v-for="student in filteredCriticalStudents"
                  :key="student.id"
                  class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td class="px-6 py-4">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10">
                        <img
                          :src="student.avatar || '/default-avatar.png'"
                          :alt="student.fullName"
                          class="h-10 w-10 rounded-full object-cover"
                        />
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          {{ student.fullName }}
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          {{ student.age }} años
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    >
                      {{ student.instrument }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {{ student.assignedClasses }}
                  </td>
                  <td class="px-6 py-4">
                    <button
                      class="text-sm font-bold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                      @click="openActionModal(student)"
                    >
                      {{ student.absences }}
                    </button>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center">
                      <div class="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                        <div
                          class="h-2 rounded-full transition-all duration-500"
                          :class="{
                            'bg-red-500': student.attendanceRate < 60,
                            'bg-yellow-500':
                              student.attendanceRate >= 60 && student.attendanceRate < 80,
                            'bg-green-500': student.attendanceRate >= 80,
                          }"
                          :style="{width: `${student.attendanceRate}%`}"
                        />
                      </div>
                      <span class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ student.attendanceRate }}%
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="{
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300':
                          student.status === 'critical',
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300':
                          student.status === 'warning',
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300':
                          student.status === 'good',
                      }"
                    >
                      {{ getStatusText(student.status) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right text-sm font-medium space-x-2">
                    <button
                      class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                      @click="openActionModal(student)"
                    >
                      Comunicar
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>

    <!-- Modal de Acciones de Comunicación -->
    <div
      v-if="showActionModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white">
                Acciones de Comunicación
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {{ selectedStudent?.fullName }} - {{ selectedStudent?.absences }} ausencias
              </p>
            </div>
            <button
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              @click="closeActionModal"
            >
              <XMarkIcon class="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Plantillas de Comunicación -->
            <button
              v-for="template in communicationTemplates"
              :key="template.id"
              class="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all duration-200"
              :class="{
                'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20':
                  selectedTemplate?.id === template.id,
              }"
              @click="selectTemplate(template)"
            >
              <div class="flex items-center mb-2">
                <component :is="template.icon" class="w-5 h-5 mr-2" :class="template.iconColor" />
                <h4 class="font-medium text-gray-900 dark:text-white">{{ template.title }}</h4>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ template.description }}</p>
            </button>
          </div>

          <!-- Vista Previa del Mensaje -->
          <div v-if="selectedTemplate" class="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 class="font-medium text-gray-900 dark:text-white mb-2">
              Vista Previa del Mensaje:
            </h4>
            <div class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {{ generateMessage(selectedTemplate, selectedStudent) }}
            </div>
          </div>

          <!-- Acciones -->
          <div class="mt-6 flex justify-end space-x-3">
            <button
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              @click="closeActionModal"
            >
              Cancelar
            </button>
            <button
              v-if="selectedTemplate"
              :disabled="sending"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
              @click="sendMessage"
            >
              <PaperAirplaneIcon class="w-4 h-4 mr-2" />
              {{ sending ? "Enviando..." : "Enviar por WhatsApp" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, onUnmounted, watch} from "vue"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  AcademicCapIcon,
  UsersIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
  ChartPieIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  PaperAirplaneIcon,
} from "@heroicons/vue/24/outline"

// Interfaces
interface TodayStats {
  totalClasses: number
  activeClasses: number
  completedClasses: number
  expectedTeachers: number
  presentTeachers: number
  expectedStudents: number
  presentStudents: number
  attendanceRate: number
}

interface ClassData {
  id: string
  name: string
  time: string
  teacher: string
  status: "active" | "scheduled" | "completed"
  presentStudents: number
  totalStudents: number
}

interface CriticalStudent {
  id: string
  fullName: string
  age: number
  instrument: string
  assignedClasses: number
  absences: number
  attendanceRate: number
  status: "critical" | "warning" | "good"
  avatar?: string
  parentPhone?: string
}

interface CommunicationTemplate {
  id: string
  title: string
  description: string
  icon: any
  iconColor: string
  severity: "low" | "medium" | "high"
  template: string
}

// State
const loading = ref(false)
const selectedDate = ref(new Date())
const attendanceFilter = ref("critical")
const showActionModal = ref(false)
const selectedStudent = ref<CriticalStudent | null>(null)
const selectedTemplate = ref<CommunicationTemplate | null>(null)
const sending = ref(false)

// Mock data - En producción esto vendría de una API/store
const todayStats = ref<TodayStats>({
  totalClasses: 12,
  activeClasses: 3,
  completedClasses: 7,
  expectedTeachers: 8,
  presentTeachers: 7,
  expectedStudents: 85,
  presentStudents: 78,
  attendanceRate: 92,
})

const todayClasses = ref<ClassData[]>([
  {
    id: "1",
    name: "Violín Intermedio",
    time: "09:00 - 10:00",
    teacher: "María González",
    status: "completed",
    presentStudents: 8,
    totalStudents: 10,
  },
  {
    id: "2",
    name: "Piano Principiante",
    time: "10:30 - 11:30",
    teacher: "Carlos López",
    status: "active",
    presentStudents: 12,
    totalStudents: 15,
  },
  {
    id: "3",
    name: "Guitarra Avanzado",
    time: "14:00 - 15:00",
    teacher: "Ana Martínez",
    status: "scheduled",
    presentStudents: 0,
    totalStudents: 8,
  },
])

const criticalStudents = ref<CriticalStudent[]>([
  {
    id: "1",
    fullName: "Juan Pérez García",
    age: 15,
    instrument: "Violín",
    assignedClasses: 20,
    absences: 8,
    attendanceRate: 60,
    status: "critical",
    parentPhone: "+58412345678",
  },
  {
    id: "2",
    fullName: "María Rodríguez",
    age: 12,
    instrument: "Piano",
    assignedClasses: 18,
    absences: 6,
    attendanceRate: 67,
    status: "warning",
    parentPhone: "+58424567890",
  },
  {
    id: "3",
    fullName: "Carlos Mendoza",
    age: 17,
    instrument: "Guitarra",
    assignedClasses: 22,
    absences: 12,
    attendanceRate: 45,
    status: "critical",
    parentPhone: "+58416789012",
  },
])

const communicationTemplates = ref<CommunicationTemplate[]>([
  {
    id: "warning",
    title: "Amonestación",
    description: "Llamado de atención por ausencias",
    icon: ExclamationTriangleIcon,
    iconColor: "text-yellow-500",
    severity: "low",
    template: `Estimado/a representante,

Le informamos que el estudiante {{studentName}} ha acumulado {{absences}} ausencias de un total de {{totalClasses}} clases asignadas.

Le solicitamos tomar las medidas necesarias para mejorar la asistencia del estudiante.

Atentamente,
Academia de Música`,
  },
  {
    id: "reflection",
    title: "Llamado a la Reflexión",
    description: "Falta leve y reflexión",
    icon: ExclamationTriangleIcon,
    iconColor: "text-orange-500",
    severity: "medium",
    template: `Estimado/a representante,

El estudiante {{studentName}} ha mostrado un patrón de ausencias que requiere atención inmediata.

Ausencias: {{absences}}/{{totalClasses}}
Instrumento: {{instrument}}

Solicitamos una reunión para discutir estrategias de mejora.

Academia de Música`,
  },
  {
    id: "expulsion",
    title: "Carta de Expulsión",
    description: "Proceso de expulsión por ausencias",
    icon: XMarkIcon,
    iconColor: "text-red-500",
    severity: "high",
    template: `Estimado/a representante,

Lamentamos informarle que debido al alto número de ausencias ({{absences}}/{{totalClasses}}) del estudiante {{studentName}}, se ha iniciado el proceso de expulsión de la academia.

Tiene 48 horas para presentar su descargo.

Dirección Académica`,
  },
  {
    id: "instrument",
    title: "Entrega de Instrumento",
    description: "Solicitud de devolución de instrumento",
    icon: AcademicCapIcon,
    iconColor: "text-blue-500",
    severity: "medium",
    template: `Estimado/a representante,

Debido a las ausencias reiteradas del estudiante {{studentName}}, solicitamos la devolución del instrumento {{instrument}} prestado por la academia.

Favor coordinar la entrega en horario administrativo.

Departamento de Inventario`,
  },
  {
    id: "citation",
    title: "Citación al Representante",
    description: "Citación formal para reunión",
    icon: DocumentArrowDownIcon,
    iconColor: "text-purple-500",
    severity: "medium",
    template: `Estimado/a representante,

Se le cita formalmente para una reunión el día {{date}} a las {{time}} para tratar el tema de las ausencias del estudiante {{studentName}}.

Asunto: {{absences}} ausencias de {{totalClasses}} clases
Instrumento: {{instrument}}

Dirección Académica`,
  },
])

// Computed
const currentDate = computed(() => {
  return new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
})

const selectedDateFormatted = computed(() => {
  return selectedDate.value.toLocaleDateString("es-ES", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
})

const isToday = computed(() => {
  const today = new Date()
  return selectedDate.value.toDateString() === today.toDateString()
})

const topInstruments = computed(() => [
  {name: "Piano", count: 5},
  {name: "Violín", count: 3},
  {name: "Guitarra", count: 2},
  {name: "Flauta", count: 2},
])

const filteredCriticalStudents = computed(() => {
  let filtered = [...criticalStudents.value]

  switch (attendanceFilter.value) {
    case "critical":
      filtered = filtered.filter((s) => s.status === "critical")
      break
    case "good":
      filtered = filtered.filter((s) => s.attendanceRate >= 80)
      break
    case "instrument":
      filtered = filtered.sort((a, b) => a.instrument.localeCompare(b.instrument))
      break
    case "age":
      filtered = filtered.sort((a, b) => a.age - b.age)
      break
    case "alphabetical":
      filtered = filtered.sort((a, b) => a.fullName.localeCompare(b.fullName))
      break
    case "classes":
      filtered = filtered.sort((a, b) => b.assignedClasses - a.assignedClasses)
      break
  }

  return filtered
})

// Methods
const navigateDate = (direction: number) => {
  const newDate = new Date(selectedDate.value)
  newDate.setDate(newDate.getDate() + direction)
  selectedDate.value = newDate
  refreshDashboard()
}

const refreshDashboard = async () => {
  loading.value = true
  try {
    // Simular carga de datos
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Aquí iría la lógica real para cargar datos del API
    console.log("Refreshing dashboard for date:", selectedDate.value)
  } catch (error) {
    console.error("Error refreshing dashboard:", error)
  } finally {
    loading.value = false
  }
}

const generateWeeklyReport = async () => {
  loading.value = true
  try {
    // Lógica para generar el reporte semanal
    console.log("Generating weekly report...")

    // Simular generación de PDF
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Aquí iría la lógica real para generar y descargar el PDF
    alert("Reporte semanal generado exitosamente")
  } catch (error) {
    console.error("Error generating weekly report:", error)
  } finally {
    loading.value = false
  }
}

const filterStudents = () => {
  // La lógica de filtrado está en el computed filteredCriticalStudents
  console.log("Filtering students by:", attendanceFilter.value)
}

const exportCriticalStudents = () => {
  // Lógica para exportar la lista de estudiantes críticos
  console.log("Exporting critical students...")
}

const openActionModal = (student: CriticalStudent) => {
  selectedStudent.value = student
  selectedTemplate.value = null
  showActionModal.value = true
}

const closeActionModal = () => {
  showActionModal.value = false
  selectedStudent.value = null
  selectedTemplate.value = null
}

const selectTemplate = (template: CommunicationTemplate) => {
  selectedTemplate.value = template
}

const generateMessage = (template: CommunicationTemplate, student: CriticalStudent | null) => {
  if (!student) return ""

  let message = template.template
  message = message.replace("{{studentName}}", student.fullName)
  message = message.replace("{{absences}}", student.absences.toString())
  message = message.replace("{{totalClasses}}", student.assignedClasses.toString())
  message = message.replace("{{instrument}}", student.instrument)
  message = message.replace("{{date}}", new Date().toLocaleDateString("es-ES"))
  message = message.replace("{{time}}", "2:00 PM")

  return message
}

const sendMessage = async () => {
  if (!selectedTemplate.value || !selectedStudent.value) return

  sending.value = true
  try {
    const message = generateMessage(selectedTemplate.value, selectedStudent.value)
    const phone = selectedStudent.value.parentPhone

    // Lógica para enviar por WhatsApp
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")

    // Simular envío
    await new Promise((resolve) => setTimeout(resolve, 1000))

    alert("Mensaje enviado exitosamente")
    closeActionModal()
  } catch (error) {
    console.error("Error sending message:", error)
    alert("Error al enviar el mensaje")
  } finally {
    sending.value = false
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case "critical":
      return "Crítico"
    case "warning":
      return "Alerta"
    case "good":
      return "Bueno"
    default:
      return "Desconocido"
  }
}

// Lifecycle
onMounted(async () => {
  await refreshDashboard()
})

// Watchers
watch(selectedDate, () => {
  refreshDashboard()
})

// Auto-refresh every 5 minutes
let refreshInterval: number
onMounted(() => {
  refreshInterval = setInterval(
    () => {
      if (isToday.value) {
        refreshDashboard()
      }
    },
    5 * 60 * 1000
  ) // 5 minutes
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
/* Dashboard Director Styles */
.min-h-screen {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.dark .min-h-screen {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
}

/* Backdrop blur effects */
.backdrop-blur-lg {
  backdrop-filter: blur(16px);
}

.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}

/* Custom animations */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-in-up {
  animation: slideInUp 0.3s ease-out;
}

/* KPI Cards hover effects */
.bg-white\/90:hover {
  transform: translateY(-2px);
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Status indicators */
.status-indicator {
  position: relative;
}

.status-indicator::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
}

/* Table hover effects */
.table-row:hover {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.05));
}

/* Modal backdrop */
.modal-backdrop {
  backdrop-filter: blur(8px);
  background: rgba(0, 0, 0, 0.4);
}

/* Communication templates grid */
.template-grid button:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.05));
}

/* Progress bars */
.progress-bar {
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Scrollbar styling */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.5);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.7);
}

/* Dark mode scrollbar */
.dark .custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(147, 51, 234, 0.5);
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(147, 51, 234, 0.7);
}

/* Responsive text scaling */
@media (max-width: 640px) {
  .text-3xl {
    font-size: 1.875rem;
  }

  .text-2xl {
    font-size: 1.5rem;
  }
}

/* Print styles */
@media print {
  .no-print {
    display: none !important;
  }

  .bg-gradient-to-br {
    background: white !important;
  }

  .shadow-xl,
  .shadow-md {
    box-shadow: none !important;
    border: 1px solid #e5e7eb !important;
  }
}

/* Loading animation */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.loading-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Critical student row highlighting */
.critical-row {
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.05), transparent);
  border-left: 4px solid #ef4444;
}

.warning-row {
  background: linear-gradient(90deg, rgba(245, 158, 11, 0.05), transparent);
  border-left: 4px solid #f59e0b;
}

/* Button hover states */
.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #1d4ed8, #1e40af);
  transform: translateY(-1px);
  box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.4);
}

.btn-secondary {
  background: linear-gradient(135deg, #6b7280, #4b5563);
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #4b5563, #374151);
  transform: translateY(-1px);
}

/* Status badges */
.badge-critical {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.badge-warning {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.badge-good {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
</style>
