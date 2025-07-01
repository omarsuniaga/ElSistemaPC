<template>
  <div class="maestro-montaje-container min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header con información del usuario y notificaciones -->
    <div
      class="header-section bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-6"
    >
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Panel de Maestro - Montaje
          </h1>
          <p class="text-gray-600 dark:text-gray-300 mt-1">
            Gestión de obras y seguimiento de progreso
          </p>
        </div>
        <div class="flex items-center space-x-4">
          <!-- Toggle de tema oscuro/claro -->
          <button
            class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            :title="isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
            @click="toggleDarkMode"
          >
            <SunIcon v-if="isDarkMode" class="w-5 h-5 text-yellow-500" />
            <MoonIcon v-else class="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          <!-- Indicador de supervisión del director -->
          <div v-if="directorReviewed" class="flex items-center space-x-2">
            <div class="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
            <span class="text-sm text-green-700 dark:text-green-400 font-medium"
              >Revisado por Director</span
            >
          </div>

          <!-- Botón de asistencia diaria -->
          <button
            class="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            @click="irAAsistencia"
          >
            📅 Asistencia Diaria
            <span v-if="asistenciaPendiente" class="bg-red-500 text-white rounded-full w-2 h-2" />
          </button>

          <!-- Indicador de progreso semanal -->
          <div class="text-right">
            <div class="text-sm text-gray-600 dark:text-gray-400">Progreso Semanal</div>
            <div class="text-lg font-bold text-green-600 dark:text-green-400">
              {{ progresoSemanalPorcentaje }}%
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Sección de Plan de Acción Semanal -->
    <div
      class="plan-section bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-6 mx-6 mt-6 rounded-r-lg"
    >
      <h2 class="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3">
        📋 Plan de Acción - Semana {{ currentWeek }}
      </h2>
      <div v-if="planSemanal" class="space-y-3">
        <p class="text-blue-800 dark:text-blue-300">{{ planSemanal.descripcion }}</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <h3 class="font-medium text-gray-900 dark:text-white mb-2">Obras Asignadas</h3>
            <ul class="space-y-1">
              <li
                v-for="obra in planSemanal.obrasAsignadas"
                :key="obra.id"
                class="text-sm text-gray-700 dark:text-gray-300"
              >
                • {{ obra.titulo }}
              </li>
            </ul>
          </div>
          <div class="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <h3 class="font-medium text-gray-900 dark:text-white mb-2">Objetivos</h3>
            <ul class="space-y-1">
              <li
                v-for="objetivo in planSemanal.objetivos"
                :key="objetivo"
                class="text-sm text-gray-700 dark:text-gray-300"
              >
                • {{ objetivo }}
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div v-else class="text-blue-700 dark:text-blue-300">
        No hay plan de acción asignado para esta semana.
      </div>
    </div>

    <!-- Sección Principal: Repertorio y Obras -->
    <div class="main-content mx-6 mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
      <!-- Columna izquierda: Lista de Obras -->
      <div class="xl:col-span-2 space-y-6">
        <!-- Filtros y Búsqueda -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div class="flex flex-wrap gap-4 items-center">
            <input
              v-model="searchTerm"
              type="text"
              placeholder="Buscar obras..."
              class="flex-1 min-w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            <select
              v-model="filtroEstado"
              class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todos los estados</option>
              <option value="sin_trabajar">Sin trabajar</option>
              <option value="en_progreso">En progreso</option>
              <option value="completado">Completado</option>
            </select>
          </div>
        </div>

        <!-- Lista de Obras -->
        <div class="space-y-4">
          <div
            v-for="obra in obrasFiltradas"
            :key="obra.id"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div class="p-6">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ obra.titulo }}
                  </h3>
                  <p class="text-gray-600 dark:text-gray-300">{{ obra.compositor }}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {{ obra.totalCompases }} compases • {{ obra.duracionEstimada }} min
                  </p>
                </div>
                <div class="text-right">
                  <div
                    class="text-2xl font-bold"
                    :class="getProgresoColorClass(obra.metadatos.progresoPorcentaje)"
                  >
                    {{ obra.metadatos.progresoPorcentaje }}%
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">Progreso</div>
                </div>
              </div>

              <!-- Barra de progreso -->
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                <div
                  class="h-2 rounded-full transition-all duration-300"
                  :class="getProgresoBarClass(obra.metadatos.progresoPorcentaje)"
                  :style="{width: obra.metadatos.progresoPorcentaje + '%'}"
                />
              </div>

              <!-- Selector de instrumentos para filtrar el mapa de calor -->
              <div class="mb-2 flex items-center justify-between">
                <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mapa de Calor - Compases
                </h4>
                <select
                  v-model="instrumentoSeleccionado[obra.id]"
                  class="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  @change="filtrarPorInstrumento(obra.id)"
                >
                  <option value="">Todos los instrumentos</option>
                  <option
                    v-for="instrumento in obra.instrumentosRequeridos"
                    :key="instrumento.instrumentoId"
                    :value="instrumento.instrumentoId"
                  >
                    {{ instrumento.nombre }}
                  </option>
                </select>
              </div>
              <div>
                <MapaCalorCompases
                  :obra-id="obra.id"
                  :total-compases="obra.totalCompases"
                  :estados-compases="estadosCompasesPorObra[obra.id] || {}"
                  :editable="true"
                  @update-estado="actualizarEstadoCompass"
                />
              </div>

              <!-- Instrumentos asignados -->
              <div class="mb-4">
                <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Instrumentos
                </h4>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="instrumento in obra.instrumentosRequeridos"
                    :key="instrumento.instrumentoId"
                    class="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs rounded-full"
                  >
                    {{ instrumento.nombre }}
                  </span>
                </div>
              </div>

              <!-- Acciones -->
              <div
                class="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700"
              >
                <button
                  class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-sm"
                  @click="verDetalleObra(obra)"
                >
                  Ver Detalle
                </button>
                <div class="flex space-x-2">
                  <button
                    class="bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
                    @click="abrirModalObservaciones(obra)"
                  >
                    💬 Observaciones
                  </button>
                  <button
                    class="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                    @click="abrirModalEvaluacion(obra)"
                  >
                    ⭐ Evaluar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Columna derecha: Observaciones del Director e Historial -->
      <div class="space-y-6">
        <!-- Observaciones del Director -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            🎯 Observaciones del Director
          </h3>
          <div v-if="observacionesDirector.length > 0" class="space-y-3">
            <div
              v-for="observacion in observacionesDirector"
              :key="observacion.id"
              class="p-3 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 dark:border-amber-500 rounded-r-lg"
            >
              <div class="flex justify-between items-start mb-2">
                <h4 class="font-medium text-amber-900 dark:text-amber-200">
                  {{ observacion.obra.titulo }}
                </h4>
                <span class="text-xs text-amber-700 dark:text-amber-300">{{
                  formatDate(observacion.fecha)
                }}</span>
              </div>
              <p class="text-amber-800 dark:text-amber-300 text-sm">{{ observacion.contenido }}</p>
              <div v-if="observacion.tipo" class="mt-2">
                <span
                  class="px-2 py-1 bg-amber-200 dark:bg-amber-800/50 text-amber-800 dark:text-amber-200 text-xs rounded-full"
                >
                  {{ observacion.tipo }}
                </span>
              </div>
            </div>
          </div>
          <div v-else class="text-gray-500 dark:text-gray-400 text-center py-4">
            No hay observaciones del director.
          </div>
        </div>

        <!-- Historial de Trabajo -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📊 Resumen de Actividad
          </h3>
          <div class="space-y-4">
            <div
              class="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
            >
              <span class="text-blue-900 dark:text-blue-200 font-medium">Obras Trabajadas Hoy</span>
              <span class="text-blue-700 dark:text-blue-300 font-bold">{{
                actividadHoy.obrasTrabajas
              }}</span>
            </div>
            <div
              class="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
            >
              <span class="text-green-900 dark:text-green-200 font-medium"
                >Compases Completados</span
              >
              <span class="text-green-700 dark:text-green-300 font-bold">{{
                actividadHoy.compasesCompletados
              }}</span>
            </div>
            <div
              class="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
            >
              <span class="text-purple-900 dark:text-purple-200 font-medium">Tiempo Dedicado</span>
              <span class="text-purple-700 dark:text-purple-300 font-bold"
                >{{ actividadHoy.tiempoDedicado }}h</span
              >
            </div>
          </div>
        </div>

        <!-- Próximas Tareas -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            ⏭️ Próximas Tareas
          </h3>
          <div v-if="proximasTareas.length > 0" class="space-y-2">
            <div
              v-for="tarea in proximasTareas"
              :key="tarea.id"
              class="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <div class="flex justify-between items-start">
                <div>
                  <h4 class="font-medium text-gray-900 dark:text-white">{{ tarea.titulo }}</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-300">{{ tarea.descripcion }}</p>
                </div>
                <span class="text-xs text-gray-500 dark:text-gray-400">{{
                  formatDate(tarea.fechaLimite)
                }}</span>
              </div>
            </div>
          </div>
          <div v-else class="text-gray-500 dark:text-gray-400 text-center py-4">
            No hay tareas pendientes.
          </div>
        </div>
      </div>
    </div>

    <!-- Modales -->
    <ModalObservaciones
      v-if="showModalObservaciones"
      :obra="obraSeleccionada"
      @close="cerrarModalObservaciones"
      @guardar="guardarObservacion"
    />

    <ModalEvaluacion
      v-if="showModalEvaluacion"
      :obra="obraSeleccionada"
      @close="cerrarModalEvaluacion"
      @guardar="guardarEvaluacion"
    />
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {useRouter} from "vue-router"
import {useMontajeStore} from "../store/montaje"
import {useAuthStore} from "../../../stores/auth"
import {useTheme} from "../../../contexts/ThemeContext"
import {SunIcon, MoonIcon} from "@heroicons/vue/24/outline"
import type {Obra, ObservacionPedagogica, EvaluacionContinua} from "../types"
import {DificultadFrase} from "../types"
import MapaCalorCompases from "../components/MapaCalorCompases.vue"
import ModalObservaciones from "../components/ModalObservaciones.vue"
import ModalEvaluacion from "../components/ModalEvaluacion.vue"

// Stores
const router = useRouter()
const montajeStore = useMontajeStore()
const authStore = useAuthStore()

// Contexto de tema
const {isDarkMode, toggleDarkMode} = useTheme()

// Estado reactivo
const searchTerm = ref("")
const filtroEstado = ref("")
const showModalObservaciones = ref(false)
const showModalEvaluacion = ref(false)
const obraSeleccionada = ref<Obra | null>(null)
const directorReviewed = ref(false)
const currentWeek = ref(getCurrentWeek())
const asistenciaPendiente = ref(true)
const instrumentoSeleccionado = ref<Record<string, string>>({})
const progresoSemanalPorcentaje = ref(65)

// Datos simulados (reemplazar con datos reales del store)
const planSemanal = ref({
  descripcion:
    "Esta semana enfócate en perfeccionar la articulación en los pasajes rápidos y trabajar la sincronización entre vientos y cuerdas.",
  obrasAsignadas: [
    {id: "1", titulo: "Sinfonía No. 9 - Mov. I"},
    {id: "2", titulo: "Concierto para Piano"},
  ],
  objetivos: [
    "Mejorar articulación en compases 45-60",
    "Sincronizar entrada de metales en compás 120",
    "Trabajar dinámicas en sección B",
  ],
})

const observacionesDirector = ref([
  {
    id: "1",
    obra: {titulo: "Sinfonía No. 9"},
    contenido:
      "Excelente trabajo en la sección de cuerdas. Continúa enfocándote en los crescendos del movimiento III.",
    tipo: "Felicitación",
    fecha: new Date(),
  },
  {
    id: "2",
    obra: {titulo: "Concierto para Piano"},
    contenido: "Necesita más trabajo en la sincronización entre piano y orquesta en el compás 145.",
    tipo: "Sugerencia",
    fecha: new Date(),
  },
])

const actividadHoy = ref({
  obrasTrabajas: 3,
  compasesCompletados: 24,
  tiempoDedicado: 2.5,
})

const proximasTareas = ref([
  {
    id: "1",
    titulo: "Revisar compases 80-100 Sinfonía No. 9",
    descripcion: "Enfocarse en la articulación de las cuerdas",
    fechaLimite: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  },
])

const estadosCompasesPorObra = ref<Record<string, Record<number, string>>>({})

// Computed
const obrasFiltradas = computed(() => {
  let obras = montajeStore.obras

  if (searchTerm.value) {
    obras = obras.filter(
      (obra) =>
        obra.titulo.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
        obra.compositor?.toLowerCase().includes(searchTerm.value.toLowerCase())
    )
  }

  if (filtroEstado.value) {
    obras = obras.filter((obra) => {
      const progreso = obra.metadatos.progresoPorcentaje
      switch (filtroEstado.value) {
        case "sin_trabajar":
          return progreso === 0
        case "en_progreso":
          return progreso > 0 && progreso < 100
        case "completado":
          return progreso === 100
        default:
          return true
      }
    })
  }

  return obras
})

// Métodos
function getCurrentWeek(): number {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const diffInTime = now.getTime() - startOfYear.getTime()
  const diffInWeeks = Math.ceil(diffInTime / (7 * 24 * 60 * 60 * 1000))
  return diffInWeeks
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function getProgresoColorClass(progreso: number): string {
  if (progreso >= 80) return "text-green-600 dark:text-green-400"
  if (progreso >= 50) return "text-yellow-600 dark:text-yellow-400"
  return "text-red-600 dark:text-red-400"
}

function getProgresoBarClass(progreso: number): string {
  if (progreso >= 80) return "bg-green-500 dark:bg-green-400"
  if (progreso >= 50) return "bg-yellow-500 dark:bg-yellow-400"
  return "bg-red-500 dark:bg-red-400"
}

function irAAsistencia() {
  router.push("/attendance/calendar")
}

function verDetalleObra(obra: Obra) {
  router.push(`/montaje/obras/${obra.id}`)
}

function abrirModalObservaciones(obra: Obra) {
  obraSeleccionada.value = obra
  showModalObservaciones.value = true
}

function cerrarModalObservaciones() {
  showModalObservaciones.value = false
  obraSeleccionada.value = null
}

function abrirModalEvaluacion(obra: Obra) {
  obraSeleccionada.value = obra
  showModalEvaluacion.value = true
}

function cerrarModalEvaluacion() {
  showModalEvaluacion.value = false
  obraSeleccionada.value = null
}

function actualizarEstadoCompass(obraId: string, compas: number, estado: string) {
  // Lógica para actualizar el estado del compás
  console.log("Actualizando compás:", {obraId, compas, estado})
  // montajeStore.actualizarEstadoCompass(obraId, compas, estado)
}

function filtrarPorInstrumento(obraId: string) {
  const instrumentoId = instrumentoSeleccionado.value[obraId]
  console.log("Filtrando por instrumento:", {obraId, instrumentoId})
  // Aquí iría la lógica para filtrar el mapa de calor por instrumento
  // montajeStore.filtrarMapaCalorPorInstrumento(obraId, instrumentoId)
}

function guardarObservacion(observacion: ObservacionPedagogica) {
  // Lógica para guardar observación
  console.log("Guardando observación:", observacion)
  cerrarModalObservaciones()
}

function guardarEvaluacion(evaluacion: EvaluacionContinua) {
  // Lógica para guardar evaluación
  console.log("Guardando evaluación:", evaluacion)
  cerrarModalEvaluacion()
}

// Lifecycle
onMounted(async () => {
  // Cargar datos iniciales
  // await montajeStore.cargarObras()
  // await montajeStore.cargarPlanSemanal()

  // Simular datos por ahora
  montajeStore.obras = [
    {
      id: "1",
      titulo: "Sinfonía No. 9 en Re menor",
      compositor: "Ludwig van Beethoven",
      totalCompases: 200,
      duracionEstimada: 45,
      instrumentosRequeridos: [
        {
          instrumentoId: "1",
          nombre: "Violín I",
          cantidad: 8,
          nivel: "avanzado" as const,
          esObligatorio: true,
        },
        {
          instrumentoId: "2",
          nombre: "Violín II",
          cantidad: 6,
          nivel: "intermedio" as const,
          esObligatorio: true,
        },
        {
          instrumentoId: "3",
          nombre: "Viola",
          cantidad: 4,
          nivel: "intermedio" as const,
          esObligatorio: true,
        },
        {
          instrumentoId: "4",
          nombre: "Cello",
          cantidad: 4,
          nivel: "avanzado" as const,
          esObligatorio: true,
        },
      ],
      repertorioId: "rep1",
      fechaCreacion: {seconds: Math.floor(Date.now() / 1000), nanoseconds: 0} as any,
      metadatos: {
        complejidadGeneral: DificultadFrase.MEDIO,
        frasesDefinidas: 8,
        frasesCompletadas: 3,
        progresoPorcentaje: 37,
      },
      auditoria: {
        creadoPor: "director1",
        fechaCreacion: {seconds: Math.floor(Date.now() / 1000), nanoseconds: 0} as any,
        modificadoPor: "director1",
        fechaModificacion: {seconds: Math.floor(Date.now() / 1000), nanoseconds: 0} as any,
        version: 1,
        activo: true,
      },
    },
  ]
})
</script>

<style scoped>
.transition-all {
  transition: all 0.3s ease;
}

/* Animaciones para el progreso */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
