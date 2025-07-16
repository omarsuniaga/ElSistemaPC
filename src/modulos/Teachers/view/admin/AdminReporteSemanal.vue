<template>
  <div class="admin-reporte-semanal p-4 mb-16">
    <h1 class="text-2xl font-bold mb-6">Reporte Semanal de Clases</h1>

    <!-- Selector de semana -->
    <div class="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <div class="flex flex-wrap items-center gap-4">
        <button
          class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          :disabled="isLoading"
          @click="previousWeek"
        >
          <ChevronLeftIcon class="h-5 w-5" />
        </button>

        <div class="text-lg font-medium">
          {{ formattedWeekRange }}
        </div>

        <button
          class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          :disabled="isLoading"
          @click="nextWeek"
        >
          <ChevronRightIcon class="h-5 w-5" />
        </button>

        <button
          class="ml-auto px-3 py-1 bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 rounded-md hover:bg-primary-200 dark:hover:bg-primary-800"
          :disabled="isLoading"
          @click="setCurrentWeek"
        >
          Semana actual
        </button>
      </div>
    </div>

    <!-- Estado de carga -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>

    <!-- Mensaje de error -->
    <div
      v-else-if="error"
      class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg mb-6"
    >
      {{ error }}
    </div>

    <div v-else>
      <!-- Resumen general de la semana -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 class="text-lg font-medium mb-2">Total de clases</h3>
          <p class="text-3xl font-bold">{{ totalClases }}</p>
        </div>

        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 class="text-lg font-medium mb-2">Asistencia promedio</h3>
          <p class="text-3xl font-bold">{{ asistenciaPromedio }}%</p>
        </div>

        <div
          class="bg-orange-50 dark:bg-orange-900 p-4 rounded-lg shadow border border-orange-200 dark:border-orange-700"
        >
          <h3 class="text-lg font-medium mb-2 text-orange-800 dark:text-orange-200">
            Clases emergentes
          </h3>
          <p class="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {{ totalClasesEmergentes }}
          </p>
          <p class="text-sm text-orange-600 dark:text-orange-400">Esta semana</p>
        </div>

        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 class="text-lg font-medium mb-2">Total observaciones</h3>
          <p class="text-3xl font-bold">{{ totalObservaciones }}</p>
        </div>
      </div>
      <!-- Clases destacadas con validación segura -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 class="text-lg font-medium mb-2">Clase con más alumnos</h3>
          <p class="text-xl font-bold">{{ claseConMasAlumnos.nombre }}</p>
          <p v-if="claseConMasAlumnos.nombre">{{ claseConMasAlumnos.cantidad }} alumnos</p>
        </div>

        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 class="text-lg font-medium mb-2">Clase con menos alumnos</h3>
          <p class="text-xl font-bold">{{ claseConMenosAlumnos.nombre }}</p>
          <p v-if="claseConMenosAlumnos.nombre">{{ claseConMenosAlumnos.cantidad }} alumnos</p>
        </div>
      </div>

      <!-- Tabs para los días de la semana -->
      <div class="mb-6">
        <div class="border-b border-gray-200 dark:border-gray-700">
          <nav class="flex flex-wrap -mb-px">
            <button
              v-for="(dia, index) in diasSemana"
              :key="index"
              class="py-2 px-4 text-center border-b-2 font-medium text-sm"
              :class="
                selectedDay === index
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              "
              @click="selectedDay = index"
            >
              {{ dia }}
            </button>
          </nav>
        </div>
        <!-- Contenido del día seleccionado con validación segura -->
        <div class="mt-4">
          <!-- Resumen de asistencia por día -->
          <div class="mb-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 class="text-lg font-medium mb-2">
              Resumen de asistencia - {{ diasSemana[selectedDay] }}
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div class="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <h4 class="font-medium text-green-800 dark:text-green-300">Presentes</h4>
                <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                  {{ dayDataMap[daysMapReverse[selectedDay]]?.presentes || 0 }}
                </p>
              </div>
              <div class="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                <h4 class="font-medium text-red-800 dark:text-red-300">Ausentes</h4>
                <p class="text-2xl font-bold text-red-600 dark:text-red-400">
                  {{ dayDataMap[daysMapReverse[selectedDay]]?.ausentes || 0 }}
                </p>
              </div>
              <div class="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                <h4 class="font-medium text-yellow-800 dark:text-yellow-300">Tardanzas</h4>
                <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {{ dayDataMap[daysMapReverse[selectedDay]]?.tardanzas || 0 }}
                </p>
              </div>
              <div class="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <h4 class="font-medium text-blue-800 dark:text-blue-300">Justificados</h4>
                <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {{ dayDataMap[daysMapReverse[selectedDay]]?.justificados || 0 }}
                </p>
              </div>
            </div>
          </div>

          <div
            v-if="clasesPorDia && safeArrayLength(clasesPorDia[selectedDay] || []) > 0"
            class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
          >
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Clase
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Horario
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Alumnos
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Asistencia
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Maestro
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Observaciones
                  </th>
                </tr>
              </thead>
              <tbody
                class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
              >
                <tr
                  v-for="(clase, claseIndex) in clasesPorDia[selectedDay] || []"
                  :key="`${selectedDay}-${claseIndex}-${safeGet(clase, 'id', Math.random())}-${safeGet(clase, 'isEmergencyClass', false) ? 'emergency' : 'regular'}`"
                >
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="font-medium">
                      {{ safeGet(clase, "name", "Clase sin nombre") }}
                      <span
                        v-if="safeGet(clase, 'isEmergencyClass')"
                        class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                      >
                        🚨 Emergente
                      </span>
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{
                        safeGet(clase, "isEmergencyClass")
                          ? safeGet(clase, "reason", "Sin razón")
                          : safeGet(clase, "instrument", "Sin instrumento")
                      }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div>
                      {{ formatTime(safeGet(clase, "horario.startTime")) }} -
                      {{ formatTime(safeGet(clase, "horario.endTime")) }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ calcularDuracion(safeGet(clase, "horario", {})) }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div>{{ safeArrayLength(safeGet(clase, "studentIds", [])) }} alumnos</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div>
                      {{ safeGet(clase, "asistencia.presentes", 0) }} /
                      {{ safeArrayLength(safeGet(clase, "studentIds", [])) }}
                    </div>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-1">
                      <div
                        class="bg-primary-600 h-2.5 rounded-full"
                        :style="`width: ${calcularPorcentajeAsistenciaSafe(clase)}%`"
                      />
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div>{{ obtenerNombreMaestro(clase.teacherId) }}</div>
                    <div
                      class="text-sm"
                      :class="clase.maestroAsistio ? 'text-green-500' : 'text-red-500'"
                    >
                      {{ clase.maestroAsistio ? "Asistió" : "No registró" }}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <button
                      v-if="clase.observaciones?.length"
                      class="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                      @click="mostrarObservaciones(clase)"
                    >
                      Ver ({{ clase.observaciones.length }})
                    </button>
                    <span v-else class="text-gray-400">Sin observaciones</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
            <p class="text-gray-500 dark:text-gray-400">No hay clases programadas para este día</p>
          </div>
        </div>
      </div>

      <!-- Reporte completo de la semana -->
      <div class="mb-6">
        <h2 class="text-xl font-bold mb-4">Reporte completo de la semana</h2>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div
            class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"
          >
            <div>
              <span class="font-medium">Total de observaciones: </span>
              <span>{{ totalObservaciones }}</span>
            </div>

            <button
              class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              @click="exportarReporte"
            >
              Exportar reporte
            </button>
          </div>

          <div class="p-4">
            <h3 class="font-medium text-lg mb-2">Observaciones destacadas</h3>
            <ul class="space-y-2">
              <li
                v-for="(obs, index) in observacionesDestacadas"
                :key="index"
                class="p-3 bg-gray-50 dark:bg-gray-900 rounded-md"
              >
                <div class="flex justify-between">
                  <span class="font-medium">{{ obs.className }}</span>
                  <span class="text-sm text-gray-500">{{ formatDate(obs.date) }}</span>
                </div>
                <p class="mt-1">{{ obs.text }}</p>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Sistema de Notificaciones WhatsApp por Asistencia -->
      <div class="mb-6">
        <h2 class="text-xl font-bold mb-4">Sistema de Notificaciones WhatsApp</h2>

        <!-- Resumen de inasistencias mejorado -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <!-- Card Ausentes -->
          <div
            class="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg shadow border border-red-200 dark:border-red-700 cursor-pointer transition-all hover:shadow-lg"
            @click="toggleEstudiantesAusentes"
          >
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-medium mb-1 text-red-800 dark:text-red-200">Ausentes</h3>
                <p class="text-3xl font-bold text-red-600 dark:text-red-400">
                  {{ estudiantesAusentes.length }}
                </p>
                <p class="text-sm text-red-600 dark:text-red-400">Sin justificación</p>
              </div>
              <div class="text-red-500 dark:text-red-400">
                <ChevronDownIcon
                  class="h-5 w-5 transition-transform duration-200"
                  :class="{'rotate-180': showEstudiantesAusentes}"
                />
              </div>
            </div>
          </div>

          <!-- Card Tardíos -->
          <div
            class="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg shadow border border-yellow-200 dark:border-yellow-700 cursor-pointer transition-all hover:shadow-lg"
            @click="toggleEstudiantesTardios"
          >
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-medium mb-1 text-yellow-800 dark:text-yellow-200">
                  Tardíos
                </h3>
                <p class="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {{ estudiantesTardios.length }}
                </p>
                <p class="text-sm text-yellow-600 dark:text-yellow-400">Llegaron tarde</p>
              </div>
              <div class="text-yellow-500 dark:text-yellow-400">
                <ChevronDownIcon
                  class="h-5 w-5 transition-transform duration-200"
                  :class="{'rotate-180': showEstudiantesTardios}"
                />
              </div>
            </div>
          </div>

          <!-- Card Justificados -->
          <div
            class="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg shadow border border-blue-200 dark:border-blue-700 cursor-pointer transition-all hover:shadow-lg"
            @click="toggleEstudiantesJustificados"
          >
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-medium mb-1 text-blue-800 dark:text-blue-200">
                  Justificados
                </h3>
                <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {{ estudiantesJustificados.length }}
                </p>
                <p class="text-sm text-blue-600 dark:text-blue-400">Con justificación</p>
              </div>
              <div class="text-blue-500 dark:text-blue-400">
                <ChevronDownIcon
                  class="h-5 w-5 transition-transform duration-200"
                  :class="{'rotate-180': showEstudiantesJustificados}"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Listas desplegables optimizadas -->
        <div class="space-y-4 mb-6">
          <!-- Lista desplegable de Ausentes -->
          <div
            v-if="estudiantesAusentes.length > 0"
            class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-all duration-300"
          >
            <div
              class="px-6 py-4 bg-red-50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-700 cursor-pointer"
              @click="toggleEstudiantesAusentes"
            >
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-medium text-red-800 dark:text-red-200">
                  🔴 Estudiantes Ausentes ({{ estudiantesAusentes.length }})
                </h3>
                <ChevronDownIcon
                  class="h-5 w-5 text-red-600 dark:text-red-400 transition-transform duration-200"
                  :class="{'rotate-180': showEstudiantesAusentes}"
                />
              </div>
            </div>

            <div
              v-show="showEstudiantesAusentes"
              class="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto"
            >
              <div
                v-for="estudiante in estudiantesAusentes"
                :key="`ausente-${estudiante.id}`"
                class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="flex items-center space-x-3">
                      <div class="flex-shrink-0">
                        <div
                          class="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center"
                        >
                          <span class="text-red-600 dark:text-red-400 font-medium text-sm">
                            {{ estudiante.totalAusencias }}
                          </span>
                        </div>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {{ estudiante.firstName }} {{ estudiante.lastName }}
                        </p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {{ estudiante.instrument || "Sin instrumento" }} •
                          {{ estudiante.className || "Sin clase" }}
                        </p>
                        <div class="flex items-center space-x-2 mt-1">
                          <span
                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          >
                            {{ estudiante.totalAusencias }} ausencias esta semana
                          </span>
                          <span
                            :class="getNivelMensajeClass(estudiante.totalAusencias)"
                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          >
                            {{ getNivelMensajeTexto(estudiante.totalAusencias) }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <button
                      class="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors duration-150"
                      :disabled="isEnviandoNotificaciones"
                      @click="enviarWhatsAppIndividual(estudiante, 'ausente')"
                    >
                      📱 WhatsApp
                    </button>
                    <button
                      class="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-150"
                      @click="verDetalleEstudiante(estudiante)"
                    >
                      👁️ Detalle
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Lista desplegable de Tardíos -->
          <div
            v-if="estudiantesTardios.length > 0"
            class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-all duration-300"
          >
            <div
              class="px-6 py-4 bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-700 cursor-pointer"
              @click="toggleEstudiantesTardios"
            >
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-medium text-yellow-800 dark:text-yellow-200">
                  🟡 Estudiantes Tardíos ({{ estudiantesTardios.length }})
                </h3>
                <ChevronDownIcon
                  class="h-5 w-5 text-yellow-600 dark:text-yellow-400 transition-transform duration-200"
                  :class="{'rotate-180': showEstudiantesTardios}"
                />
              </div>
            </div>

            <div
              v-show="showEstudiantesTardios"
              class="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto"
            >
              <div
                v-for="estudiante in estudiantesTardios"
                :key="`tardio-${estudiante.id}`"
                class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="flex items-center space-x-3">
                      <div class="flex-shrink-0">
                        <div
                          class="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center"
                        >
                          <span class="text-yellow-600 dark:text-yellow-400 font-medium text-sm">
                            {{ estudiante.totalTardes }}
                          </span>
                        </div>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {{ estudiante.firstName }} {{ estudiante.lastName }}
                        </p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {{ estudiante.instrument || "Sin instrumento" }} •
                          {{ estudiante.className || "Sin clase" }}
                        </p>
                        <div class="flex items-center space-x-2 mt-1">
                          <span
                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          >
                            {{ estudiante.totalTardes }} tardanzas esta semana
                          </span>
                          <span
                            :class="getNivelMensajeClass(estudiante.totalTardes)"
                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          >
                            {{ getNivelMensajeTexto(estudiante.totalTardes) }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <button
                      class="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors duration-150"
                      :disabled="isEnviandoNotificaciones"
                      @click="enviarWhatsAppIndividual(estudiante, 'tarde')"
                    >
                      📱 WhatsApp
                    </button>
                    <button
                      class="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-150"
                      @click="verDetalleEstudiante(estudiante)"
                    >
                      👁️ Detalle
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Lista desplegable de Justificados -->
          <div
            v-if="estudiantesJustificados.length > 0"
            class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-all duration-300"
          >
            <div
              class="px-6 py-4 bg-blue-50 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-700 cursor-pointer"
              @click="toggleEstudiantesJustificados"
            >
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-medium text-blue-800 dark:text-blue-200">
                  🔵 Estudiantes Justificados ({{ estudiantesJustificados.length }})
                </h3>
                <ChevronDownIcon
                  class="h-5 w-5 text-blue-600 dark:text-blue-400 transition-transform duration-200"
                  :class="{'rotate-180': showEstudiantesJustificados}"
                />
              </div>
            </div>

            <div
              v-show="showEstudiantesJustificados"
              class="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto"
            >
              <div
                v-for="estudiante in estudiantesJustificados"
                :key="`justificado-${estudiante.id}`"
                class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="flex items-center space-x-3">
                      <div class="flex-shrink-0">
                        <div
                          class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center"
                        >
                          <span class="text-blue-600 dark:text-blue-400 font-medium text-sm">
                            {{ estudiante.totalJustificados }}
                          </span>
                        </div>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {{ estudiante.firstName }} {{ estudiante.lastName }}
                        </p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {{ estudiante.instrument || "Sin instrumento" }} •
                          {{ estudiante.className || "Sin clase" }}
                        </p>
                        <div class="flex items-center space-x-2 mt-1">
                          <span
                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          >
                            {{ estudiante.totalJustificados }} justificadas esta semana
                          </span>
                          <span
                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          >
                            Confirmación enviada
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <button
                      class="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors duration-150"
                      :disabled="isEnviandoNotificaciones"
                      @click="enviarWhatsAppIndividual(estudiante, 'justificado')"
                    >
                      📱 WhatsApp
                    </button>
                    <button
                      class="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-150"
                      @click="verDetalleEstudiante(estudiante)"
                    >
                      👁️ Detalle
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Controles de notificación -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 class="font-medium text-lg">Notificaciones Masivas</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Enviar mensajes personalizados según el tipo y frecuencia de inasistencias
              </p>
            </div>
            <div class="flex gap-2">
              <button
                v-if="estudiantesConInasistencias.length > 0"
                class="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-150"
                @click="toggleTodasLasListas"
              >
                {{ todasListasAbiertas ? "📂 Colapsar Todo" : "📁 Expandir Todo" }}
              </button>
              <button
                class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                :disabled="estudiantesConInasistencias.length === 0 || isEnviandoNotificaciones"
                @click="abrirModalSeleccionMasiva"
              >
                <span v-if="isEnviandoNotificaciones" class="flex items-center">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Enviando...
                </span>
                <span v-else class="flex items-center"> 📱 Enviar a Seleccionados </span>
              </button>
              <button
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-150"
                @click="verPlantillasMensajes"
              >
                📋 Ver Plantillas
              </button>
            </div>
          </div>
        </div>

        <!-- Mensaje cuando no hay inasistencias -->
        <div
          v-if="estudiantesConInasistencias.length === 0"
          class="bg-green-50 dark:bg-green-900/30 p-8 rounded-lg shadow text-center"
        >
          <div class="text-green-600 dark:text-green-400 text-6xl mb-4">🎉</div>
          <h3 class="text-lg font-medium text-green-800 dark:text-green-200 mb-2">
            ¡Excelente asistencia!
          </h3>
          <p class="text-green-600 dark:text-green-400">
            No hay estudiantes con inasistencias para notificar esta semana.
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal de observaciones -->
  <Dialog
    :open="showObservacionesModal"
    class="relative z-50"
    @close="showObservacionesModal = false"
  >
    <div class="fixed inset-0 bg-black/30" aria-hidden="true" />

    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel class="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
        <h3 class="text-lg font-medium mb-4">Observaciones de la clase</h3>

        <ul v-if="observacionesClaseSeleccionada.length" class="space-y-3 mb-4">
          <li
            v-for="(obs, index) in observacionesClaseSeleccionada"
            :key="index"
            class="p-3 bg-gray-50 dark:bg-gray-900 rounded-md"
          >
            <div class="flex justify-between">
              <span class="font-medium">{{ obs.author || "Sistema" }}</span>
              <span class="text-sm text-gray-500">{{ formatTime(obs.timestamp) }}</span>
            </div>
            <p class="mt-1">{{ obs.text }}</p>
          </li>
        </ul>
        <p v-else class="text-gray-500 mb-4">No hay observaciones para mostrar</p>

        <div class="flex justify-end">
          <button
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            @click="showObservacionesModal = false"
          >
            Cerrar
          </button>
        </div>
      </DialogPanel>
    </div>
  </Dialog>

  <!-- Modal de Selección Masiva -->
  <Dialog
    :open="showModalSeleccionMasiva"
    class="relative z-50"
    @close="showModalSeleccionMasiva = false"
  >
    <div class="fixed inset-0 bg-black/30" aria-hidden="true" />

    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel
        class="w-full max-w-4xl rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <h3 class="text-lg font-medium mb-4">Seleccionar Estudiantes para Notificación</h3>

        <div class="mb-4">
          <div class="flex items-center space-x-4">
            <button
              class="px-3 py-1 text-sm rounded-md border"
              :class="
                seleccionarTodos
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
              "
              @click="toggleSeleccionarTodos"
            >
              {{ seleccionarTodos ? "☑️ Deseleccionar Todos" : "☑️ Seleccionar Todos" }}
            </button>
            <span class="text-sm text-gray-500">
              {{ estudiantesSeleccionados.length }} de
              {{ estudiantesConInasistencias.length }} seleccionados
            </span>
          </div>
        </div>

        <div class="space-y-4 mb-6">
          <div
            v-for="estudiante in estudiantesConInasistencias"
            :key="estudiante.id"
            class="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
            :class="
              estudiantesSeleccionados.includes(estudiante.id)
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-600'
            "
          >
            <div class="flex items-center space-x-3">
              <input
                :id="`estudiante-${estudiante.id}`"
                v-model="estudiantesSeleccionados"
                type="checkbox"
                :value="estudiante.id"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <label :for="`estudiante-${estudiante.id}`" class="font-medium cursor-pointer">
                    {{ estudiante.name }}
                  </label>
                  <div class="flex items-center space-x-2">
                    <span
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      :class="getTipoInasistenciaClass(estudiante.tipo)"
                    >
                      {{ getTipoInasistenciaTexto(estudiante.tipo) }}
                    </span>
                    <span class="text-xs text-gray-500">
                      {{
                        getNivelMensajeTexto(
                          estudiante.faltasSemana || estudiante.tardesSemana || 1
                        )
                      }}
                    </span>
                  </div>
                </div>
                <p class="text-sm text-gray-500">
                  {{ estudiante.instrument }} - {{ estudiante.className }}
                </p>
                <p class="text-xs text-gray-400">
                  Tel: {{ estudiante.parentPhone || "No disponible" }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end space-x-3">
          <button
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            @click="showModalSeleccionMasiva = false"
          >
            Cancelar
          </button>
          <button
            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            :disabled="estudiantesSeleccionados.length === 0 || isEnviandoNotificaciones"
            @click="enviarNotificacionesMasivas"
          >
            <span v-if="isEnviandoNotificaciones" class="flex items-center">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Enviando...
            </span>
            <span v-else> 📱 Enviar a {{ estudiantesSeleccionados.length }} estudiantes </span>
          </button>
        </div>
      </DialogPanel>
    </div>
  </Dialog>

  <!-- Modal de Plantillas de Mensajes -->
  <Dialog :open="showModalPlantillas" class="relative z-50" @close="showModalPlantillas = false">
    <div class="fixed inset-0 bg-black/30" aria-hidden="true" />

    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel
        class="w-full max-w-3xl rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <h3 class="text-lg font-medium mb-4">Plantillas de Mensajes WhatsApp</h3>

        <div class="space-y-6">
          <!-- Mensajes para Ausentes -->
          <div>
            <h4 class="font-medium text-red-600 dark:text-red-400 mb-3">
              🔴 Mensajes para Ausentes
            </h4>
            <div class="space-y-3">
              <div
                v-for="(plantilla, index) in plantillasAusentes"
                :key="index"
                class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
              >
                <div class="flex justify-between items-start mb-2">
                  <span class="font-medium text-sm text-red-800 dark:text-red-200">
                    {{ plantilla.nivel }} ({{ plantilla.falta
                    }}{{ plantilla.falta > 1 ? "ª" : "ra" }} falta)
                  </span>
                  <span class="text-xs text-red-600 dark:text-red-400">{{ plantilla.tono }}</span>
                </div>
                <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {{ plantilla.mensaje }}
                </p>
              </div>
            </div>
          </div>

          <!-- Mensajes para Tardíos -->
          <div>
            <h4 class="font-medium text-yellow-600 dark:text-yellow-400 mb-3">
              🟡 Mensajes para Tardíos
            </h4>
            <div class="space-y-3">
              <div
                v-for="(plantilla, index) in plantillasTardios"
                :key="index"
                class="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
              >
                <div class="flex justify-between items-start mb-2">
                  <span class="font-medium text-sm text-yellow-800 dark:text-yellow-200">
                    {{ plantilla.nivel }} ({{ plantilla.falta
                    }}{{ plantilla.falta > 1 ? "ª" : "ra" }} tardanza)
                  </span>
                  <span class="text-xs text-yellow-600 dark:text-yellow-400">{{
                    plantilla.tono
                  }}</span>
                </div>
                <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {{ plantilla.mensaje }}
                </p>
              </div>
            </div>
          </div>

          <!-- Mensajes para Justificados -->
          <div>
            <h4 class="font-medium text-blue-600 dark:text-blue-400 mb-3">
              🔵 Mensajes para Justificados
            </h4>
            <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div class="flex justify-between items-start mb-2">
                <span class="font-medium text-sm text-blue-800 dark:text-blue-200"
                  >Confirmación</span
                >
                <span class="text-xs text-blue-600 dark:text-blue-400">Cordial</span>
              </div>
              <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {{ plantillaJustificado.mensaje }}
              </p>
            </div>
          </div>
        </div>

        <div class="flex justify-end mt-6">
          <button
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            @click="showModalPlantillas = false"
          >
            Cerrar
          </button>
        </div>
      </DialogPanel>
    </div>
  </Dialog>

  <!-- Modal de Detalle de Estudiante -->
  <Dialog
    :open="showModalDetalleEstudiante"
    class="relative z-50"
    @close="showModalDetalleEstudiante = false"
  >
    <div class="fixed inset-0 bg-black/30" aria-hidden="true" />

    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel class="w-full max-w-2xl rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
        <h3 class="text-lg font-medium mb-4">Detalle de Asistencia</h3>

        <div v-if="estudianteDetalle" class="space-y-4">
          <div class="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h4 class="font-medium text-lg">{{ estudianteDetalle.name }}</h4>
            <p class="text-gray-500">
              {{ estudianteDetalle.instrument }} - {{ estudianteDetalle.className }}
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-3">
              <h5 class="font-medium">Contacto</h5>
              <div class="text-sm space-y-1">
                <p>
                  <strong>Teléfono Padre:</strong>
                  {{ estudianteDetalle.fatherPhone || "No disponible" }}
                </p>
                <p>
                  <strong>Teléfono Madre:</strong>
                  {{ estudianteDetalle.motherPhone || "No disponible" }}
                </p>
                <p>
                  <strong>Teléfono Principal:</strong>
                  {{ estudianteDetalle.parentPhone || "No disponible" }}
                </p>
              </div>
            </div>

            <div class="space-y-3">
              <h5 class="font-medium">Estadísticas de Asistencia</h5>
              <div class="text-sm space-y-1">
                <p>
                  <strong>Faltas esta semana:</strong> {{ estudianteDetalle.faltasSemana || 0 }}
                </p>
                <p>
                  <strong>Tardanzas esta semana:</strong> {{ estudianteDetalle.tardesSemana || 0 }}
                </p>
                <p>
                  <strong>Justificadas esta semana:</strong>
                  {{ estudianteDetalle.justificadasSemana || 0 }}
                </p>
                <p>
                  <strong>Total faltas globales:</strong>
                  {{ estudianteDetalle.faltasGlobales || 0 }}
                </p>
                <p>
                  <strong>Total tardanzas globales:</strong>
                  {{ estudianteDetalle.tardesGlobales || 0 }}
                </p>
              </div>
            </div>
          </div>

          <div
            v-if="estudianteDetalle.motivoJustificacion"
            class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg"
          >
            <h5 class="font-medium text-blue-800 dark:text-blue-200 mb-1">Justificación</h5>
            <p class="text-sm text-blue-700 dark:text-blue-300">
              {{ estudianteDetalle.motivoJustificacion }}
            </p>
          </div>
        </div>

        <div class="flex justify-end mt-6">
          <button
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            @click="showModalDetalleEstudiante = false"
          >
            Cerrar
          </button>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  parseISO,
  differenceInMinutes,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/vue/24/outline';
import { Dialog, DialogPanel } from '@headlessui/vue';
import { useAttendanceStore } from '../../../Attendance/store/attendance';
import { useClassesStore } from '../../../Classes/store/classes';
import { useTeachersStore } from '../../store/teachers';
import { useStudentsStore } from '../../../Students/store/students';

import {
  safeGet,
  safeArrayLength,
  safeStoreAccess,
  safeFind,
  safeMath,
  isValidArray,
} from '@/utils/safeAccess';
import { useEmergencyClasses } from '@/composables/useEmergencyClasses';

// Emergency classes composable
const { fetchEmergencyClasses } = useEmergencyClasses();

// Stores
const attendanceStore = useAttendanceStore();
const classesStore = useClassesStore();
const teachersStore = useTeachersStore();
const studentsStore = useStudentsStore();

// Estado reactivo
const isLoading = ref(true);
const error = ref<string | null>(null);
const weekStart = ref(startOfWeek(new Date(), { weekStartsOn: 1 })); // Lunes como inicio de semana
const weekEnd = ref(endOfWeek(new Date(), { weekStartsOn: 1 })); // Domingo como fin de semana
const selectedDay = ref(0); // 0 = Lunes, 1 = Martes, etc.
const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const daysMapReverse = {
  0: 'lunes',
  1: 'martes',
  2: 'miercoles',
  3: 'jueves',
  4: 'viernes',
  5: 'sabado',
  6: 'domingo',
};
const clasesPorDia = ref<any[][]>(
  Array(7)
    .fill(null)
    .map(() => []),
);
const totalClases = ref(0);
const totalClasesEmergentes = ref(0);
const asistenciaPromedio = ref(0);
const diaMayorAsistencia = ref('');
const diaMenorAsistencia = ref('');
const claseMasAlumnos = ref<{nombre: string; cantidad: number}>({ nombre: '', cantidad: 0 });
const claseMenosAlumnos = ref<{nombre: string; cantidad: number}>({ nombre: '', cantidad: 0 });
const totalObservaciones = ref(0);
const observacionesDestacadas = ref<any[]>([]);
const showObservacionesModal = ref(false);
const observacionesClaseSeleccionada = ref<any[]>([]);

// Datos de asistencia por día
const dayDataMap = ref<
  Record<
    string,
    {registros: any[]; presentes: number; ausentes: number; tardanzas: number; justificados: number}
  >
>({
  lunes: { registros: [], presentes: 0, ausentes: 0, tardanzas: 0, justificados: 0 },
  martes: { registros: [], presentes: 0, ausentes: 0, tardanzas: 0, justificados: 0 },
  miercoles: { registros: [], presentes: 0, ausentes: 0, tardanzas: 0, justificados: 0 },
  jueves: { registros: [], presentes: 0, ausentes: 0, tardanzas: 0, justificados: 0 },
  viernes: { registros: [], presentes: 0, ausentes: 0, tardanzas: 0, justificados: 0 },
  sabado: { registros: [], presentes: 0, ausentes: 0, tardanzas: 0, justificados: 0 },
  domingo: { registros: [], presentes: 0, ausentes: 0, tardanzas: 0, justificados: 0 },
});

// Totales acumulados de la semana
const weekTotals = ref<{
  presentes: number
  ausentes: number
  tardanzas: number
  justificados: number
}>({
  presentes: 0,
  ausentes: 0,
  tardanzas: 0,
  justificados: 0,
});

// Estado para el sistema de notificaciones WhatsApp
const estudiantesAusentes = ref<any[]>([]);
const estudiantesTardios = ref<any[]>([]);
const estudiantesJustificados = ref<any[]>([]);
const estudiantesConInasistencias = computed(() => [
  ...estudiantesAusentes.value,
  ...estudiantesTardios.value,
  ...estudiantesJustificados.value,
]);

// Modales
const showModalSeleccionMasiva = ref(false);
const showModalPlantillas = ref(false);
const showModalDetalleEstudiante = ref(false);
const estudianteDetalle = ref<any>(null);

// Estado de envío
const isEnviandoNotificaciones = ref(false);
const estudiantesSeleccionados = ref<string[]>([]);
const seleccionarTodos = ref(false);

// Estados para listas desplegables
const showEstudiantesAusentes = ref(true); // Iniciamos con ausentes visible
const showEstudiantesTardios = ref(false);
const showEstudiantesJustificados = ref(false);

// Computed para saber si todas las listas están abiertas
const todasListasAbiertas = computed(() => {
  return (
    showEstudiantesAusentes.value &&
    showEstudiantesTardios.value &&
    showEstudiantesJustificados.value
  );
});

// Plantillas de mensajes WhatsApp
const plantillasAusentes = ref([
  {
    nivel: 'Informativo',
    falta: 1,
    tono: 'Cordial',
    mensaje: `Hola! 👋

Espero que esté bien. Le escribo para informarle que {nombre} no asistió a su clase de {instrumento} el día de hoy en {clase}.

Sabemos que pueden presentarse imprevistos. Si hay algún motivo particular o necesita reprogramar la clase, no dude en contactarnos.

¡Esperamos ver a {nombre} en la próxima clase! 🎵

Saludos cordiales,
Academia Musical`,
  },
  {
    nivel: 'Recordatorio',
    falta: 2,
    tono: 'Amable pero atento',
    mensaje: `Hola! 👋

Le escribo para informarle que {nombre} ha faltado a 2 clases de {instrumento} esta semana en {clase}.

Es importante mantener la continuidad en el aprendizaje musical. ¿Hay algún inconveniente que podamos ayudar a resolver?

Si necesita ajustar los horarios o tiene alguna consulta, estamos aquí para apoyarle.

Esperamos contar con la asistencia de {nombre} pronto. 🎵

Saludos,
Academia Musical`,
  },
  {
    nivel: 'Preocupación',
    falta: 3,
    tono: 'Preocupado',
    mensaje: `Estimado/a padre/madre de familia,

Nos dirigimos a usted con preocupación, ya que {nombre} ha faltado a 3 clases de {instrumento} esta semana en {clase}.

La constancia es fundamental para el progreso musical de su hijo/a. Las ausencias continuas pueden afectar significativamente su desarrollo y aprendizaje.

Le solicitamos que se comunique con nosotros para conversar sobre esta situación y encontrar la mejor solución para {nombre}.

Agradecemos su atención y esperamos su pronta respuesta.

Atentamente,
Academia Musical`,
  },
  {
    nivel: 'Formal',
    falta: 4,
    tono: 'Formal y estricto',
    mensaje: `Estimado/a padre/madre de familia,

Por medio de la presente, le informamos formalmente que {nombre} ha faltado a 4 o más clases de {instrumento} esta semana en {clase}.

Esta situación constituye una ausencia prolongada que compromete seriamente el proceso educativo musical de su hijo/a y afecta la dinámica del grupo.

Es necesario que se presente a la academia a la brevedad posible para discutir esta situación y definir las acciones a seguir.

Le recordamos que la asistencia regular es un compromiso adquirido al momento de la inscripción.

Sin otro particular,
Dirección Académica
Academia Musical`,
  },
]);

const plantillasTardios = ref([
  {
    nivel: 'Recordatorio',
    falta: 1,
    tono: 'Amable',
    mensaje: `Hola! 👋

Solo quería recordarle que {nombre} llegó tarde a su clase de {instrumento} hoy en {clase}.

Sabemos que a veces el tráfico o imprevistos pueden causar retrasos. Para aprovechar al máximo el tiempo de clase, le sugerimos llegar unos minutos antes.

¡Gracias por su comprensión! 🎵

Saludos,
Academia Musical`,
  },
  {
    nivel: 'Atención',
    falta: 2,
    tono: 'Cordial pero firme',
    mensaje: `Hola!

Le escribo porque {nombre} ha llegado tarde a 2 clases de {instrumento} esta semana en {clase}.

Las clases son más efectivas cuando comenzamos puntualmente. Esto ayuda a {nombre} y a sus compañeros a aprovechar todo el contenido programado.

¿Podríamos ajustar algo en los horarios para facilitar la puntualidad?

Agradecemos su colaboración. 🎵

Saludos,
Academia Musical`,
  },
  {
    nivel: 'Insistencia',
    falta: 3,
    tono: 'Firme',
    mensaje: `Estimado/a padre/madre de familia,

Nos vemos en la necesidad de comunicarle que {nombre} ha llegado tarde a 3 clases de {instrumento} esta semana en {clase}.

La puntualidad es esencial para el buen desarrollo de las clases y el respeto hacia el maestro y demás estudiantes.

Le solicitamos encarecidamente tomar las medidas necesarias para asegurar la puntualidad de {nombre}.

Esperamos su comprensión y colaboración.

Atentamente,
Academia Musical`,
  },
  {
    nivel: 'Formal',
    falta: 4,
    tono: 'Estricto',
    mensaje: `Estimado/a padre/madre de familia,

Por medio de la presente le comunicamos que {nombre} ha presentado tardanzas reiteradas (4 o más) en sus clases de {instrumento} en {clase} durante esta semana.

Esta situación interrumpe el desarrollo normal de las clases y afecta la calidad educativa para todos los estudiantes.

Es imperativo que tome las medidas correctivas necesarias de inmediato. De continuar esta situación, nos veremos obligados a tomar medidas administrativas adicionales.

Sin otro particular,
Dirección Académica
Academia Musical`,
  },
]);

const plantillaJustificado = ref({
  mensaje: `Hola! 👋

Recibimos la justificación por la ausencia de {nombre} a su clase de {instrumento} en {clase}.

Agradecemos que nos haya informado. Entendemos que {motivo}.

{nombre} puede ponerse al día en la próxima clase. Si necesita material adicional o tiene alguna consulta, no dude en contactarnos.

¡Esperamos ver a {nombre} en la siguiente clase! 🎵

Saludos cordiales,
Academia Musical`,
});

// Rango de fechas formateado
const formattedWeekRange = computed(() => {
  const start = format(weekStart.value, 'd \'de\' MMMM', { locale: es });
  const end = format(weekEnd.value, 'd \'de\' MMMM, yyyy', { locale: es });
  return `${start} - ${end}`;
});

// Computed properties para el template
const claseConMasAlumnos = computed(() => ({
  nombre: safeGet(claseMasAlumnos.value, 'nombre', ''),
  cantidad: safeGet(claseMasAlumnos.value, 'cantidad', 0),
}));

const claseConMenosAlumnos = computed(() => ({
  nombre: safeGet(claseMenosAlumnos.value, 'nombre', ''),
  cantidad: safeGet(claseMenosAlumnos.value, 'cantidad', 0),
}));

// Cambiar a la semana anterior
const previousWeek = () => {
  weekStart.value = subWeeks(weekStart.value, 1);
  weekEnd.value = subWeeks(weekEnd.value, 1);
  cargarDatosSemana();
};

// Cambiar a la semana siguiente
const nextWeek = () => {
  weekStart.value = addWeeks(weekStart.value, 1);
  weekEnd.value = addWeeks(weekEnd.value, 1);
  cargarDatosSemana();
};

// Volver a la semana actual
const setCurrentWeek = () => {
  weekStart.value = startOfWeek(new Date(), { weekStartsOn: 1 });
  weekEnd.value = endOfWeek(new Date(), { weekStartsOn: 1 });
  cargarDatosSemana();
};

// Formatear hora
const formatTime = (timeString: string) => {
  if (!timeString) return 'N/A';
  return timeString;
};

// Formatear fecha
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  try {
    return format(parseISO(dateString), 'd \'de\' MMMM', { locale: es });
  } catch (e) {
    return dateString;
  }
};

// Calcular duración de una clase
const calcularDuracion = (horario: any) => {
  if (!horario || !horario.startTime || !horario.endTime) return 'N/A';

  try {
    // Convertir las horas a objetos Date para calcular la diferencia
    const startDate = new Date(`2000-01-01T${horario.startTime}`);
    const endDate = new Date(`2000-01-01T${horario.endTime}`);

    const minutes = differenceInMinutes(endDate, startDate);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes > 0 ? remainingMinutes + 'min' : ''}`;
    } else {
      return `${minutes}min`;
    }
  } catch (e) {
    return 'N/A';
  }
};

// Calcular porcentaje de asistencia de forma segura
const calcularPorcentajeAsistenciaSafe = (clase: any) => {
  return safeMath(() => {
    const studentIds = safeGet(clase, 'studentIds', []);
    const totalStudents = safeArrayLength(studentIds);

    if (totalStudents === 0) return 0;

    const presentes = safeGet(clase, 'asistencia.presentes', 0);
    return Math.round((presentes * 100) / totalStudents);
  }, 0);
};

// Obtener nombre del maestro de forma segura
const obtenerNombreMaestro = (teacherId: string) => {
  if (!teacherId) return 'Sin asignar';

  const teachers = safeStoreAccess(teachersStore, 'teachers', []);
  const teacher = safeFind(teachers, (t: any) => safeGet(t, 'id') === teacherId);

  return teacher ? safeGet(teacher, 'name', 'Desconocido').trim() : 'Desconocido';
};

// Mostrar observaciones de una clase de forma segura
const mostrarObservaciones = (clase: any) => {
  const observaciones = safeGet(clase, 'observaciones', []);
  observacionesClaseSeleccionada.value = isValidArray(observaciones) ? observaciones : [];
  showObservacionesModal.value = true;
};

// Exportar reporte
const exportarReporte = () => {
  // Implementación de exportación (PDF, Excel, etc.)
  console.log('Exportando reporte...');
  // Aquí iría la lógica para generar y descargar el reporte
};

// Cargar datos de la semana seleccionada
// Funciones para el sistema de notificaciones WhatsApp
const obtenerDatosNotificaciones = async () => {
  try {
    isLoading.value = true;
    console.log('🔍 Obteniendo datos de notificaciones para la semana');

    // Formatear fechas para consultas
    const startDate = format(weekStart.value, 'yyyy-MM-dd');
    const endDate = format(weekEnd.value, 'yyyy-MM-dd');

    // 1. Obtener todos los estudiantes
    const estudiantes = studentsStore.items;
    console.log(`👥 Total estudiantes: ${estudiantes.length}`);

    // 2. Obtener todas las clases del rango de fechas
    await classesStore.fetchClasses();
    const clases = classesStore.classes;

    // 3. Obtener documentos de asistencia para la semana
    await attendanceStore.fetchAttendanceDocuments(startDate, endDate);
    const asistenciaDocs = attendanceStore.attendanceDocuments;
    console.log(`📊 Documentos de asistencia cargados: ${asistenciaDocs.length}`);

    // 4. Extraer todos los registros de asistencia
    const registrosAsistencia = await procesarDocumentosAsistencia(
      asistenciaDocs,
      clases,
      estudiantes,
    );
    console.log(`📝 Total registros de asistencia procesados: ${registrosAsistencia.length}`);

    // 5. Agrupar datos por día de la semana
    agruparAsistenciaPorDia(registrosAsistencia);

    // 6. Procesar datos para notificaciones
    procesarDatosAsistencia(estudiantes, clases, registrosAsistencia);
  } catch (error: any) {
    console.error('❌ Error obteniendo datos de notificaciones:', error);
    error.value = `Error al cargar notificaciones: ${error.message}`;
  } finally {
    isLoading.value = false;
  }
};

/**
 * Procesa los documentos de asistencia para extraer registros individuales
 * Similar al enfoque usado en el componente ReporteAsistenciaDiaria
 */
const procesarDocumentosAsistencia = async (
  asistenciaDocs: any[],
  clases: any[],
  _estudiantes: any[],
): Promise<any[]> => {
  console.log('🔄 Procesando documentos de asistencia...');
  const registrosAsistencia = [];
  const clasesMap = new Map();

  // Crear mapa de clases para acceso rápido
  clases.forEach((clase) => {
    clasesMap.set(clase.id, clase);
  });

  // Procesar cada documento de asistencia
  asistenciaDocs.forEach((doc) => {
    // Obtener información de la clase
    const claseInfo = clasesMap.get(doc.classId) || {
      name: 'Clase sin nombre',
      instrument: 'Instrumento desconocido',
    };

    // Procesar presentes
    if (doc.data.presentes && Array.isArray(doc.data.presentes)) {
      doc.data.presentes.forEach((studentId) => {
        registrosAsistencia.push({
          studentId,
          fecha: doc.fecha,
          classId: doc.classId,
          estado: 'presente',
          clase: {
            id: doc.classId,
            name: claseInfo.name,
            instrument: claseInfo.instrument,
          },
        });
      });
    }

    // Procesar ausentes
    if (doc.data.ausentes && Array.isArray(doc.data.ausentes)) {
      doc.data.ausentes.forEach((studentId) => {
        registrosAsistencia.push({
          studentId,
          fecha: doc.fecha,
          classId: doc.classId,
          estado: 'ausente',
          observaciones: '',
          clase: {
            id: doc.classId,
            name: claseInfo.name,
            instrument: claseInfo.instrument,
          },
        });
      });
    }

    // Procesar tardanzas
    if (doc.data.tarde && Array.isArray(doc.data.tarde)) {
      doc.data.tarde.forEach((studentId) => {
        registrosAsistencia.push({
          studentId,
          fecha: doc.fecha,
          classId: doc.classId,
          estado: 'tarde',
          minutosRetraso: 0, // Podría calcularse si se tiene la información
          clase: {
            id: doc.classId,
            name: claseInfo.name,
            instrument: claseInfo.instrument,
          },
        });
      });
    }

    // Procesar justificaciones
    if (doc.data.justificacion && Array.isArray(doc.data.justificacion)) {
      doc.data.justificacion.forEach((justificacion) => {
        // Extraer studentId del objeto de justificación
        const studentId = justificacion.studentId || justificacion.id;
        if (studentId) {
          registrosAsistencia.push({
            studentId,
            fecha: doc.fecha,
            classId: doc.classId,
            estado: 'justificado',
            observaciones: justificacion.reason || 'Sin motivo especificado',
            clase: {
              id: doc.classId,
              name: claseInfo.name,
              instrument: claseInfo.instrument,
            },
          });
        }
      });
    }
  });

  return registrosAsistencia;
};

/**
 * Agrupa los registros de asistencia por día de la semana
 */
const agruparAsistenciaPorDia = (registrosAsistencia: any[]): void => {
  console.log('📅 Agrupando asistencia por día de la semana...');

  // Inicializar datos por día
  dayDataMap.value = {
    lunes: { registros: [], presentes: 0, ausentes: 0, tardanzas: 0, justificados: 0 },
    martes: { registros: [], presentes: 0, ausentes: 0, tardanzas: 0, justificados: 0 },
    miercoles: { registros: [], presentes: 0, ausentes: 0, tardanzas: 0, justificados: 0 },
    jueves: { registros: [], presentes: 0, ausentes: 0, tardanzas: 0, justificados: 0 },
    viernes: { registros: [], presentes: 0, ausentes: 0, tardanzas: 0, justificados: 0 },
    sabado: { registros: [], presentes: 0, ausentes: 0, tardanzas: 0, justificados: 0 },
    domingo: { registros: [], presentes: 0, ausentes: 0, tardanzas: 0, justificados: 0 },
  };

  // Mapear días de la semana (0 = domingo, 1 = lunes, etc.)
  const daysMap: Record<number, string> = {
    0: 'domingo',
    1: 'lunes',
    2: 'martes',
    3: 'miercoles',
    4: 'jueves',
    5: 'viernes',
    6: 'sabado',
  };

  // Agrupar registros por día
  registrosAsistencia.forEach((registro) => {
    // Convertir fecha a Date si es string
    const fecha = typeof registro.fecha === 'string' ? new Date(registro.fecha) : registro.fecha;

    const diaSemana = fecha.getDay();
    const dia = daysMap[diaSemana];

    // Agregar registro al día correspondiente
    dayDataMap.value[dia].registros.push(registro);

    // Actualizar contadores
    if (registro.estado === 'presente') {
      dayDataMap.value[dia].presentes++;
    } else if (registro.estado === 'ausente') {
      dayDataMap.value[dia].ausentes++;
    } else if (registro.estado === 'tarde') {
      dayDataMap.value[dia].tardanzas++;
    } else if (registro.estado === 'justificado') {
      dayDataMap.value[dia].justificados++;
    }
  });

  // Calcular totales para la semana
  weekTotals.value = {
    presentes: Object.values(dayDataMap.value).reduce(
      (sum: number, day: any) => sum + day.presentes,
      0,
    ),
    ausentes: Object.values(dayDataMap.value).reduce(
      (sum: number, day: any) => sum + day.ausentes,
      0,
    ),
    tardanzas: Object.values(dayDataMap.value).reduce(
      (sum: number, day: any) => sum + day.tardanzas,
      0,
    ),
    justificados: Object.values(dayDataMap.value).reduce(
      (sum: number, day: any) => sum + day.justificados,
      0,
    ),
  };

  console.log('✅ Datos agrupados por día:', dayDataMap.value);
  console.log('📊 Totales de la semana:', weekTotals.value);
};

const procesarDatosAsistencia = (estudiantes: any[], clases: any[], asistencias: any[]) => {
  // Reiniciar arrays
  estudiantesAusentes.value = [];
  estudiantesTardios.value = [];
  estudiantesJustificados.value = [];

  // Agrupar asistencias por estudiante
  const asistenciasPorEstudiante = new Map();

  asistencias.forEach((asistencia: any) => {
    if (!asistencia.studentId) return;

    const estudianteId = asistencia.studentId;
    if (!asistenciasPorEstudiante.has(estudianteId)) {
      asistenciasPorEstudiante.set(estudianteId, {
        ausencias: [],
        tardanzas: [],
        justificaciones: [],
      });
    }

    const registrosEstudiante = asistenciasPorEstudiante.get(estudianteId);

    // Clasificar según el estado
    if (asistencia.estado === 'ausente') {
      registrosEstudiante.ausencias.push(asistencia);
    } else if (asistencia.estado === 'tarde') {
      registrosEstudiante.tardanzas.push(asistencia);
    } else if (asistencia.estado === 'justificado') {
      registrosEstudiante.justificaciones.push(asistencia);
    }
  });

  console.log(`👥 Estudiantes con registros de asistencia: ${asistenciasPorEstudiante.size}`);

  // Procesar cada estudiante
  estudiantes.forEach((estudiante: any) => {
    const estudianteId = estudiante.id;
    if (!asistenciasPorEstudiante.has(estudianteId)) return;

    const registros = asistenciasPorEstudiante.get(estudianteId);
    const ausentesTotales = registros.ausencias.length;
    const tardesTotales = registros.tardanzas.length;
    const justificadosTotales = registros.justificaciones.length;

    // Preparar detalles para cada tipo de asistencia
    const ausenciasDetalle = registros.ausencias.map((ausencia: any) => ({
      fecha: ausencia.fecha,
      clase: ausencia.clase?.name || 'Clase no encontrada',
      instrumento: ausencia.clase?.instrument || 'N/A',
      motivo: ausencia.observaciones || '',
    }));

    const tardesDetalle = registros.tardanzas.map((tardanza: any) => ({
      fecha: tardanza.fecha,
      clase: tardanza.clase?.name || 'Clase no encontrada',
      instrumento: tardanza.clase?.instrument || 'N/A',
      minutosRetraso: tardanza.minutosRetraso || 0,
    }));

    const justificadosDetalle = registros.justificaciones.map((justificacion: any) => ({
      fecha: justificacion.fecha,
      clase: justificacion.clase?.name || 'Clase no encontrada',
      instrumento: justificacion.clase?.instrument || 'N/A',
      motivo: justificacion.observaciones || 'Sin motivo especificado',
    }));

    // Obtener información completa del estudiante
    const infoEstudiante = {
      id: estudiante.id,
      firstName: estudiante.nombre || '',
      lastName: estudiante.apellido || '',
      name: `${estudiante.nombre || ''} ${estudiante.apellido || ''}`.trim(),
      instrument: estudiante.instrumento || 'N/A',
      className: estudiante.clase || '',
      parentPhone: estudiante.telefonoPadre || estudiante.telefonoMadre || '',
      fatherPhone: estudiante.telefonoPadre || '',
      motherPhone: estudiante.telefonoMadre || '',
      contacto: {
        telefono: estudiante.telefonoPadre || estudiante.telefonoMadre || '',
      },
      faltasSemana: ausentesTotales,
      tardesSemana: tardesTotales,
      justificadasSemana: justificadosTotales,
      faltasGlobales: estudiante.faltasGlobales || ausentesTotales,
      tardesGlobales: estudiante.tardesGlobales || tardesTotales,
    };

    // Agregar a las listas correspondientes si hay incidencias
    if (ausentesTotales > 0) {
      estudiantesAusentes.value.push({
        ...infoEstudiante,
        totalAusencias: ausentesTotales,
        ausenciasDetalle,
        nivelGravedad: obtenerNivelGravedad(ausentesTotales),
        plantillaSugerida: obtenerPlantillaSugerida('ausente', ausentesTotales),
        tipo: 'ausente',
      });
    }

    if (tardesTotales > 0) {
      estudiantesTardios.value.push({
        ...infoEstudiante,
        totalTardes: tardesTotales,
        tardesDetalle,
        nivelGravedad: obtenerNivelGravedad(tardesTotales),
        plantillaSugerida: obtenerPlantillaSugerida('tarde', tardesTotales),
        tipo: 'tarde',
      });
    }

    if (justificadosTotales > 0) {
      estudiantesJustificados.value.push({
        ...infoEstudiante,
        totalJustificados: justificadosTotales,
        justificadosDetalle,
        motivoJustificacion: justificadosDetalle.length > 0 ? justificadosDetalle[0].motivo : '',
        tipo: 'justificado',
      });
    }
  });

  // Ordenar por nivel de gravedad (más ausencias/tardes primero)
  estudiantesAusentes.value.sort((a: any, b: any) => b.totalAusencias - a.totalAusencias);
  estudiantesTardios.value.sort((a: any, b: any) => b.totalTardes - a.totalTardes);

  // Mostrar automáticamente las listas que tienen estudiantes
  showEstudiantesAusentes.value = estudiantesAusentes.value.length > 0;
  showEstudiantesTardios.value = estudiantesTardios.value.length > 0;
  showEstudiantesJustificados.value = estudiantesJustificados.value.length > 0;

  console.log(`🔴 Estudiantes ausentes: ${estudiantesAusentes.value.length}`);
  console.log(`🟡 Estudiantes tardíos: ${estudiantesTardios.value.length}`);
  console.log(`🔵 Estudiantes justificados: ${estudiantesJustificados.value.length}`);
};

const obtenerNivelGravedad = (cantidad: number): number => {
  if (cantidad <= 1) return 1; // Informativo
  if (cantidad === 2) return 2; // Recordatorio/Atención
  if (cantidad === 3) return 3; // Preocupación/Insistencia
  return 4; // Formal/Estricto
};

const obtenerPlantillaSugerida = (tipo: 'ausente' | 'tarde', cantidad: number) => {
  const nivel = obtenerNivelGravedad(cantidad);
  const plantillas = tipo === 'ausente' ? plantillasAusentes.value : plantillasTardios.value;
  return plantillas.find((p: any) => p.falta === nivel) || plantillas[0];
};

const personalizarMensaje = (plantilla: string, estudiante: any, detalles: any) => {
  return plantilla
    .replace(/{nombre}/g, estudiante.firstName + ' ' + estudiante.lastName)
    .replace(/{instrumento}/g, detalles.instrumento || 'N/A')
    .replace(/{clase}/g, detalles.clase || 'N/A')
    .replace(/{motivo}/g, detalles.motivo || 'Sin especificar');
};

const toggleSeleccionTodos = () => {
  if (seleccionarTodos.value) {
    estudiantesSeleccionados.value = estudiantesConInasistencias.value.map((e: any) => e.id);
  } else {
    estudiantesSeleccionados.value = [];
  }
};

const _toggleSeleccionEstudiante = (estudianteId: string) => {
  const index = estudiantesSeleccionados.value.indexOf(estudianteId);
  if (index > -1) {
    estudiantesSeleccionados.value.splice(index, 1);
  } else {
    estudiantesSeleccionados.value.push(estudianteId);
  }

  // Actualizar estado de seleccionar todos
  seleccionarTodos.value =
    estudiantesSeleccionados.value.length === estudiantesConInasistencias.value.length;
};

const abrirModalSeleccionMasiva = () => {
  showModalSeleccionMasiva.value = true;
};

const _abrirModalPlantillas = () => {
  showModalPlantillas.value = true;
};

const abrirDetalleEstudiante = (estudiante: any) => {
  estudianteDetalle.value = estudiante;
  showModalDetalleEstudiante.value = true;
};

const enviarNotificacionIndividual = async (estudiante: any) => {
  try {
    isEnviandoNotificaciones.value = true;

    // Determinar tipo de mensaje y plantilla
    let mensaje = '';
    if (estudiante.totalAusencias > 0) {
      const plantilla = estudiante.plantillaSugerida;
      mensaje = personalizarMensaje(plantilla.mensaje, estudiante, estudiante.ausenciasDetalle[0]);
    } else if (estudiante.totalTardes > 0) {
      const plantilla = estudiante.plantillaSugerida;
      mensaje = personalizarMensaje(plantilla.mensaje, estudiante, estudiante.tardesDetalle[0]);
    } else if (estudiante.totalJustificados > 0) {
      mensaje = personalizarMensaje(
        plantillaJustificado.value.mensaje,
        estudiante,
        estudiante.justificadosDetalle[0],
      );
    }

    // Aquí iría la integración con WhatsApp API
    await enviarMensajeWhatsApp(estudiante.contacto?.telefono, mensaje);

    console.log(`Mensaje enviado a ${estudiante.firstName} ${estudiante.lastName}`);
  } catch (error: any) {
    console.error('Error enviando notificación individual:', error);
  } finally {
    isEnviandoNotificaciones.value = false;
  }
};

const enviarNotificacionesMasivas = async () => {
  try {
    isEnviandoNotificaciones.value = true;

    const estudiantesAEnviar = estudiantesConInasistencias.value.filter((e: any) =>
      estudiantesSeleccionados.value.includes(e.id),
    );

    for (const estudiante of estudiantesAEnviar) {
      await enviarNotificacionIndividual(estudiante);
      // Pequeña pausa entre mensajes para no saturar
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    showModalSeleccionMasiva.value = false;
    estudiantesSeleccionados.value = [];
    seleccionarTodos.value = false;
  } catch (error: any) {
    console.error('Error enviando notificaciones masivas:', error);
  } finally {
    isEnviandoNotificaciones.value = false;
  }
};

const enviarMensajeWhatsApp = async (telefono: string, mensaje: string) => {
  // Placeholder para la integración con WhatsApp
  // Aquí se implementaría la conexión con WhatsApp Business API o Baileys
  console.log(`Enviando mensaje a ${telefono}:`, mensaje);

  // Simular envío
  return new Promise((resolve) => setTimeout(resolve, 500));
};

// Funciones de utilidad para la UI
const verPlantillasMensajes = () => {
  showModalPlantillas.value = true;
};

const verDetalleEstudiante = (estudiante: any) => {
  abrirDetalleEstudiante(estudiante);
};

const enviarWhatsAppIndividual = async (estudiante: any, _tipo: string) => {
  await enviarNotificacionIndividual(estudiante);
};

const toggleSeleccionarTodos = () => {
  toggleSeleccionTodos();
};

// Funciones para controlar listas desplegables
const toggleEstudiantesAusentes = () => {
  showEstudiantesAusentes.value = !showEstudiantesAusentes.value;
};

const toggleEstudiantesTardios = () => {
  showEstudiantesTardios.value = !showEstudiantesTardios.value;
};

const toggleEstudiantesJustificados = () => {
  showEstudiantesJustificados.value = !showEstudiantesJustificados.value;
};

const toggleTodasLasListas = () => {
  const nuevoEstado = !todasListasAbiertas.value;
  showEstudiantesAusentes.value = nuevoEstado;
  showEstudiantesTardios.value = nuevoEstado;
  showEstudiantesJustificados.value = nuevoEstado;
};

const getNivelMensajeClass = (cantidad: number): string => {
  const nivel = obtenerNivelGravedad(cantidad);
  const classes = {
    1: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    2: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    3: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    4: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return classes[nivel as keyof typeof classes] || classes[1];
};

const getNivelMensajeTexto = (cantidad: number): string => {
  const nivel = obtenerNivelGravedad(cantidad);
  const textos = {
    1: 'Informativo',
    2: 'Recordatorio',
    3: 'Preocupación',
    4: 'Formal',
  };
  return textos[nivel as keyof typeof textos] || textos[1];
};

const getTipoInasistenciaClass = (tipo: string): string => {
  const classes = {
    ausente: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    tarde: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    justificado: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  };
  return classes[tipo as keyof typeof classes] || classes.ausente;
};

const getTipoInasistenciaTexto = (tipo: string): string => {
  const textos = {
    ausente: 'Ausente',
    tarde: 'Tardío',
    justificado: 'Justificado',
  };
  return textos[tipo as keyof typeof textos] || 'Ausente';
};

// Funciones principales del reporte semanal
const cargarDatosSemana = async () => {
  try {
    isLoading.value = true;
    error.value = null;

    // Formatear fechas para consultas
    const startDate = format(weekStart.value, 'yyyy-MM-dd');
    const endDate = format(weekEnd.value, 'yyyy-MM-dd');

    // Cargar datos necesarios
    await Promise.all([
      classesStore.fetchClasses(),
      teachersStore.fetchTeachers(),
      studentsStore.fetchStudents(),
      attendanceStore.fetchAttendanceDocuments(startDate, endDate),
      fetchEmergencyClasses(), // Cargar clases emergentes
    ]);

    // Procesar clases por día de la semana
    procesarClasesPorDia();

    // Procesar clases emergentes para la semana
    await procesarClasesEmergentes();

    // Calcular estadísticas
    calcularEstadisticas();
  } catch (err: any) {
    console.error('Error al cargar datos de la semana:', err);
    error.value = `Error al cargar datos: ${err.message}`;
  } finally {
    isLoading.value = false;
  }
};

// Procesar clases por día de la semana
const procesarClasesPorDia = () => {
  // Reiniciar arrays
  clasesPorDia.value = Array(7)
    .fill(null)
    .map(() => []);

  // Obtener todas las clases programadas
  const clasesScheduled = classesStore.getScheduledClasses;

  // Procesar cada clase
  clasesScheduled.forEach((clase) => {
    if (!clase.schedule) return;

    // Procesar cada slot de horario - handle both single schedule and slots array
    const schedule = clase.schedule as any; // Type assertion to avoid complex type checking
    const slots = Array.isArray(schedule) ? schedule : schedule.slots ? schedule.slots : [schedule];

    slots.forEach((slot: any) => {
      // Determinar el día de la semana (0 = Lunes, 6 = Domingo)
      let dayIndex: number;

      if (typeof slot.day === 'string') {
        const dayMap: Record<string, number> = {
          lunes: 0,
          martes: 1,
          miércoles: 2,
          jueves: 3,
          viernes: 4,
          sábado: 5,
          domingo: 6,
        };
        dayIndex = dayMap[slot.day.toLowerCase()] ?? -1;
      } else if (typeof slot.day === 'number') {
        // Ajustar el índice si es necesario (si 0 = Domingo en el sistema)
        dayIndex = slot.day === 0 ? 6 : slot.day - 1;
      } else {
        return;
      }

      if (dayIndex < 0 || dayIndex > 6) return;

      // Crear objeto de clase con datos adicionales
      const claseConDatos = {
        ...clase,
        horario: {
          startTime: slot.startTime,
          endTime: slot.endTime,
        },
        asistencia: {
          presentes: 0,
          ausentes: 0,
        },
        maestroAsistio: false,
        observaciones: [] as any[],
      };

      // Buscar registros de asistencia para esta clase
      const fechaClase = format(addDays(weekStart.value, dayIndex), 'yyyy-MM-dd');
      const asistenciasClase = attendanceStore.attendanceDocuments.filter(
        (doc) => doc.classId === clase.id && doc.fecha === fechaClase,
      );

      // Si hay registros de asistencia, procesar datos
      if (asistenciasClase.length > 0) {
        const doc = asistenciasClase[0];

        // Contar presentes y ausentes
        let presentes = 0;
        let ausentes = 0;

        // Check data structure for attendance
        if (doc.data) {
          if (doc.data.presentes) presentes = doc.data.presentes.length;
          if (doc.data.ausentes) ausentes = doc.data.ausentes.length;
        }

        claseConDatos.asistencia = { presentes, ausentes };
        claseConDatos.maestroAsistio = true;

        // Obtener observaciones
        if (doc.data.observations) {
          claseConDatos.observaciones = doc.data.observations as any[];
        }
      }

      // Añadir a la lista del día correspondiente
      clasesPorDia.value[dayIndex].push(claseConDatos);
    });
  });
};

// Procesar clases emergentes para la semana
const procesarClasesEmergentes = async () => {
  try {
    // Obtener clases emergentes para el rango de fechas de la semana
    const startDate = format(weekStart.value, 'yyyy-MM-dd');
    const endDate = format(weekEnd.value, 'yyyy-MM-dd');

    console.log('🚨 [AdminReporte] Cargando clases emergentes del', startDate, 'al', endDate);

    // Obtener clases emergentes usando el composable
    const { getEmergencyClassesForDate } = useEmergencyClasses();

    // Recorrer cada día de la semana
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDate = format(addDays(weekStart.value, dayOffset), 'yyyy-MM-dd');

      try {
        const emergencyClasses = await getEmergencyClassesForDate(currentDate);

        console.log(
          `🚨 [AdminReporte] Día ${dayOffset} (${currentDate}): ${emergencyClasses.length} clases emergentes`,
        );

        // Procesar cada clase emergente
        emergencyClasses.forEach((emergencyClass) => {
          // Crear objeto de clase compatible con el formato de clases regulares
          const claseEmergente = {
            id: emergencyClass.id,
            name: emergencyClass.className || 'Clase Emergente',
            className: emergencyClass.className || 'Clase Emergente',
            teacherId: emergencyClass.teacherId,
            studentIds: emergencyClass.selectedStudents || [],
            horario: {
              startTime: emergencyClass.startTime || '00:00',
              endTime: emergencyClass.endTime || '23:59',
            },
            asistencia: {
              presentes: 0,
              ausentes: 0,
            },
            maestroAsistio: false,
            observaciones: [] as any[], // Tipado explícito para evitar errores
            isEmergencyClass: true, // Marcar como clase emergente
            reason: emergencyClass.reason || 'Sin razón especificada',
          };

          // Buscar registros de asistencia para esta clase emergente
          const attendanceDocs = attendanceStore.attendanceDocuments;
          const dayAttendanceDoc = attendanceDocs.find(
            (doc) => doc.fecha === currentDate && doc.classId === emergencyClass.id,
          );

          if (dayAttendanceDoc) {
            // Procesar datos de asistencia si existen
            const data = dayAttendanceDoc.data;
            if (data) {
              claseEmergente.asistencia.presentes = data.presentes?.length || 0;
              claseEmergente.asistencia.ausentes = data.ausentes?.length || 0;
              claseEmergente.maestroAsistio = !!(data as any).maestroAsistio;

              if (data.observations && Array.isArray(data.observations)) {
                claseEmergente.observaciones = data.observations;
              }
            }
          }

          // Añadir a la lista del día correspondiente
          clasesPorDia.value[dayOffset].push(claseEmergente);
        });
      } catch (error) {
        console.warn(
          `🚨 [AdminReporte] Error cargando clases emergentes para ${currentDate}:`,
          error,
        );
      }
    }

    console.log('🚨 [AdminReporte] Procesamiento de clases emergentes completado');
  } catch (error) {
    console.error('🚨 [AdminReporte] Error general en procesarClasesEmergentes:', error);
  }
};

// Calcular estadísticas generales
const calcularEstadisticas = () => {
  // Total de clases en la semana
  totalClases.value = clasesPorDia.value.reduce((sum, clases) => sum + clases.length, 0);

  // Contar clases emergentes
  totalClasesEmergentes.value = clasesPorDia.value.reduce((sum, clases) => {
    return sum + clases.filter((clase) => clase.isEmergencyClass).length;
  }, 0);

  // Asistencia promedio
  let totalPresentes = 0;
  let totalEstudiantes = 0;

  clasesPorDia.value.forEach((clases) => {
    clases.forEach((clase) => {
      totalPresentes += clase.asistencia?.presentes || 0;
      totalEstudiantes += clase.studentIds?.length || 0;
    });
  });

  asistenciaPromedio.value =
    totalEstudiantes > 0 ? Math.round((totalPresentes / totalEstudiantes) * 100) : 0;

  // Día con mayor y menor asistencia
  const asistenciaPorDia = clasesPorDia.value
    .map((clases, index) => {
      const presentes = clases.reduce((sum, clase) => sum + (clase.asistencia?.presentes || 0), 0);
      const total = clases.reduce((sum, clase) => sum + (clase.studentIds?.length || 0), 0);
      const porcentaje = total > 0 ? (presentes / total) * 100 : 0;

      return {
        dia: diasSemana[index],
        porcentaje,
        presentes,
        total,
      };
    })
    .filter((dia) => dia.total > 0); // Solo considerar días con clases

  if (asistenciaPorDia.length > 0) {
    const maxAsistencia = asistenciaPorDia.reduce(
      (max, dia) => (dia.porcentaje > max.porcentaje ? dia : max),
      asistenciaPorDia[0],
    );

    const minAsistencia = asistenciaPorDia.reduce(
      (min, dia) => (dia.porcentaje < min.porcentaje ? dia : min),
      asistenciaPorDia[0],
    );

    diaMayorAsistencia.value = maxAsistencia.dia;
    diaMenorAsistencia.value = minAsistencia.dia;
  } else {
    diaMayorAsistencia.value = 'N/A';
    diaMenorAsistencia.value = 'N/A';
  }

  // Clase con más y menos alumnos
  const todasLasClases = classesStore.classes.filter((c) => c.studentIds && c.studentIds.length > 0);

  if (todasLasClases.length > 0) {
    const maxAlumnos = todasLasClases.reduce(
      (max, clase) =>
        (clase.studentIds?.length || 0) > (max.studentIds?.length || 0) ? clase : max,
      todasLasClases[0],
    );

    const minAlumnos = todasLasClases.reduce(
      (min, clase) =>
        (clase.studentIds?.length || 0) < (min.studentIds?.length || 0) ? clase : min,
      todasLasClases[0],
    );

    claseMasAlumnos.value = {
      nombre: maxAlumnos.name,
      cantidad: maxAlumnos.studentIds?.length || 0,
    };

    claseMenosAlumnos.value = {
      nombre: minAlumnos.name,
      cantidad: minAlumnos.studentIds?.length || 0,
    };
  }

  // Procesar observaciones
  let todasObservaciones: any[] = [];

  clasesPorDia.value.forEach((clases) => {
    clases.forEach((clase) => {
      if (clase.observaciones && clase.observaciones.length > 0) {
        todasObservaciones = todasObservaciones.concat(
          clase.observaciones.map((obs: any) => ({
            ...obs,
            className: clase.name,
            classId: clase.id,
          })),
        );
      }
    });
  });

  totalObservaciones.value = todasObservaciones.length;

  // Seleccionar observaciones destacadas (limitamos a 5 para mostrar)
  observacionesDestacadas.value = todasObservaciones
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);
};

// Inicializar datos al montar el componente
onMounted(async () => {
  // Establecer el día seleccionado al día actual de la semana (0 = Lunes, 6 = Domingo)
  const today = new Date();
  const currentDayIndex = (today.getDay() + 6) % 7; // Convertir de Domingo=0 a Lunes=0
  selectedDay.value = currentDayIndex;

  console.log(`🗓️ Día actual: ${diasSemana[selectedDay.value]} (índice: ${selectedDay.value})`);

  await cargarDatosSemana();
  await obtenerDatosNotificaciones();
});

// Observar cambios en la semana seleccionada
watch([weekStart, weekEnd], () => {
  cargarDatosSemana();
});
</script>
