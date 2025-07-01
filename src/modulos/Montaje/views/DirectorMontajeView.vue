<template>
  <div class="director-montaje-container">
    <!-- Header -->
    <div class="header-section bg-white shadow-sm border-b border-gray-200 p-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Panel de Director - Montaje</h1>
          <p class="text-gray-600 mt-1">Gestión completa de repertorio y supervisión de maestros</p>
        </div>
        <div class="flex items-center space-x-4">
          <button
            class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
            @click="crearPlanSemanal"
          >
            📋 Crear Plan Semanal
          </button>
          <button
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
            @click="abrirModalRepertorio"
          >
            ➕ Nuevo Repertorio
          </button>
        </div>
      </div>
    </div>

    <!-- Navegación por pestañas -->
    <div class="tab-navigation bg-white border-b border-gray-200">
      <div class="px-6">
        <nav class="flex space-x-8">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            ]"
            @click="activeTab = tab.id"
          >
            {{ tab.icon }} {{ tab.label }}
          </button>
        </nav>
      </div>
    </div>

    <!-- Contenido de pestañas -->
    <div class="tab-content p-6">
      <!-- Pestaña: Repertorio y Obras -->
      <div v-if="activeTab === 'repertorio'" class="space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Gestión de Repertorio -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-semibold text-gray-900">📚 Repertorios</h2>
              <button
                class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                @click="abrirModalRepertorio"
              >
                + Agregar
              </button>
            </div>
            <div class="space-y-3">
              <div
                v-for="repertorio in repertorios"
                :key="repertorio.id"
                class="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                @click="seleccionarRepertorio(repertorio)"
              >
                <div class="flex justify-between items-start">
                  <div>
                    <h3 class="font-medium text-gray-900">{{ repertorio.nombre }}</h3>
                    <p class="text-sm text-gray-600 mt-1">{{ repertorio.descripcion }}</p>
                    <p class="text-xs text-gray-500 mt-2">
                      {{ repertorio.metadatos.totalObras }} obras
                    </p>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span
                      class="px-2 py-1 text-xs rounded-full"
                      :class="getEstadoRepertorioClass(repertorio.estado)"
                    >
                      {{ repertorio.estado }}
                    </span>
                    <button
                      class="text-gray-400 hover:text-gray-600"
                      @click.stop="editarRepertorio(repertorio)"
                    >
                      ✏️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Gestión de Obras -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-semibold text-gray-900">🎼 Obras</h2>
              <button
                class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                :disabled="!repertorioSeleccionado"
                @click="abrirModalObra"
              >
                + Agregar Obra
              </button>
            </div>
            <div v-if="repertorioSeleccionado" class="space-y-3">
              <div
                v-for="obra in obrasDelRepertorio"
                :key="obra.id"
                class="p-4 border border-gray-200 rounded-lg"
              >
                <div class="flex justify-between items-start mb-2">
                  <div>
                    <h3 class="font-medium text-gray-900">{{ obra.titulo }}</h3>
                    <p class="text-sm text-gray-600">{{ obra.compositor }}</p>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span class="text-sm font-medium text-gray-700">
                      {{ obra.metadatos.progresoPorcentaje }}%
                    </span>
                    <button
                      class="text-blue-600 hover:text-blue-800 text-sm"
                      @click="verDetalleObra(obra)"
                    >
                      Ver
                    </button>
                  </div>
                </div>

                <!-- Instrumentación -->
                <div class="mb-3">
                  <h4 class="text-xs font-medium text-gray-700 mb-1">Instrumentación:</h4>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="instrumento in obra.instrumentosRequeridos.slice(0, 3)"
                      :key="instrumento.id"
                      class="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded"
                    >
                      {{ instrumento.nombre }}
                    </span>
                    <span
                      v-if="obra.instrumentosRequeridos.length > 3"
                      class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      +{{ obra.instrumentosRequeridos.length - 3 }} más
                    </span>
                  </div>
                </div>

                <!-- Acciones rápidas -->
                <div class="flex justify-between items-center pt-2 border-t border-gray-100">
                  <button
                    class="text-orange-600 hover:text-orange-800 text-sm font-medium"
                    @click="definirFrases(obra)"
                  >
                    📝 Definir Frases
                  </button>
                  <button
                    class="text-green-600 hover:text-green-800 text-sm font-medium"
                    @click="agregarObservacion(obra)"
                  >
                    💬 Observación
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="text-gray-500 text-center py-8">
              Selecciona un repertorio para ver las obras
            </div>
          </div>
        </div>
      </div>

      <!-- Pestaña: Gestión de Maestros -->
      <div v-if="activeTab === 'maestros'" class="space-y-6">
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <!-- Lista de Maestros -->
          <div class="xl:col-span-2">
            <div class="bg-white rounded-lg shadow-sm p-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">👨‍🏫 Gestión de Maestros</h2>
              <div class="space-y-4">
                <div
                  v-for="maestro in maestros"
                  :key="maestro.id"
                  class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  :class="{'ring-2 ring-blue-500': maestroSeleccionado?.id === maestro.id}"
                  @click="seleccionarMaestro(maestro)"
                >
                  <div class="flex justify-between items-start mb-3">
                    <div>
                      <h3 class="font-medium text-gray-900">{{ maestro.nombre }}</h3>
                      <p class="text-sm text-gray-600">{{ maestro.email }}</p>
                    </div>
                    <div class="flex items-center space-x-2">
                      <div
                        class="h-3 w-3 rounded-full"
                        :class="maestro.activo ? 'bg-green-500' : 'bg-red-500'"
                      />
                      <span class="text-xs text-gray-500">
                        {{ maestro.activo ? "Activo" : "Inactivo" }}
                      </span>
                    </div>
                  </div>

                  <!-- Estadísticas del maestro -->
                  <div class="grid grid-cols-3 gap-4 mb-3">
                    <div class="text-center">
                      <div class="text-lg font-bold text-blue-600">
                        {{ maestro.estadisticas.obrasAsignadas }}
                      </div>
                      <div class="text-xs text-gray-500">Obras</div>
                    </div>
                    <div class="text-center">
                      <div class="text-lg font-bold text-green-600">
                        {{ maestro.estadisticas.progresoProm }}%
                      </div>
                      <div class="text-xs text-gray-500">Progreso</div>
                    </div>
                    <div class="text-center">
                      <div class="text-lg font-bold text-purple-600">
                        {{ maestro.estadisticas.horasTrabajo }}
                      </div>
                      <div class="text-xs text-gray-500">Horas</div>
                    </div>
                  </div>

                  <!-- Obras trabajadas recientemente -->
                  <div>
                    <h4 class="text-xs font-medium text-gray-700 mb-1">
                      Últimas obras trabajadas:
                    </h4>
                    <div class="flex flex-wrap gap-1">
                      <span
                        v-for="obra in maestro.obrasRecientes.slice(0, 2)"
                        :key="obra"
                        class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                      >
                        {{ obra }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Panel de detalles del maestro seleccionado -->
          <div v-if="maestroSeleccionado" class="space-y-6">
            <!-- Resumen de actividad -->
            <div class="bg-white rounded-lg shadow-sm p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">
                📊 Actividad de {{ maestroSeleccionado.nombre }}
              </h3>

              <!-- Mapa de calor general -->
              <div class="mb-4">
                <h4 class="text-sm font-medium text-gray-700 mb-2">Mapa de Calor General</h4>
                <MapaCalorGeneral :maestro-id="maestroSeleccionado.id" />
              </div>

              <!-- Asistencia -->
              <div class="mb-4">
                <div class="flex justify-between items-center mb-2">
                  <h4 class="text-sm font-medium text-gray-700">Asistencia del Día</h4>
                  <button
                    class="text-blue-600 hover:text-blue-800 text-xs"
                    @click="verAsistencia(maestroSeleccionado)"
                  >
                    Ver detalle
                  </button>
                </div>
                <div class="flex items-center space-x-2">
                  <div
                    class="h-4 w-4 rounded-full"
                    :class="maestroSeleccionado.asistenciaHoy ? 'bg-green-500' : 'bg-red-500'"
                  />
                  <span class="text-sm">
                    {{ maestroSeleccionado.asistenciaHoy ? "Presente" : "Ausente" }}
                  </span>
                </div>
              </div>

              <!-- Observaciones del maestro -->
              <div class="mb-4">
                <div class="flex justify-between items-center mb-2">
                  <h4 class="text-sm font-medium text-gray-700">Observaciones de Clase</h4>
                  <span class="text-xs text-gray-500"
                    >{{ maestroSeleccionado.observacionesClase.length }} total</span
                  >
                </div>
                <div class="space-y-2 max-h-32 overflow-y-auto">
                  <div
                    v-for="obs in maestroSeleccionado.observacionesClase.slice(0, 3)"
                    :key="obs.id"
                    class="p-2 bg-gray-50 rounded text-sm"
                  >
                    <p class="text-gray-800">{{ obs.contenido.substring(0, 80) }}...</p>
                    <span class="text-xs text-gray-500">{{ formatDate(obs.fecha) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Acciones rápidas -->
            <div class="bg-white rounded-lg shadow-sm p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">⚡ Acciones Rápidas</h3>
              <div class="space-y-3">
                <button
                  class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium"
                  @click="enviarObservacion(maestroSeleccionado)"
                >
                  💬 Enviar Observación
                </button>
                <button
                  class="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium"
                  @click="asignarObras(maestroSeleccionado)"
                >
                  🎼 Asignar Obras
                </button>
                <button
                  class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm font-medium"
                  @click="marcarComoRevisado(maestroSeleccionado)"
                >
                  ✅ Marcar como Revisado
                </button>
              </div>
            </div>
          </div>

          <div v-else class="bg-white rounded-lg shadow-sm p-6 flex items-center justify-center">
            <p class="text-gray-500">Selecciona un maestro para ver los detalles</p>
          </div>
        </div>
      </div>

      <!-- Pestaña: Planes de Acción -->
      <div v-if="activeTab === 'planes'" class="space-y-6">
        <div class="bg-white rounded-lg shadow-sm p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-lg font-semibold text-gray-900">📋 Planes de Acción Semanales</h2>
            <button
              class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
              @click="crearPlanSemanal"
            >
              + Crear Plan
            </button>
          </div>

          <!-- Filtros de planes -->
          <div class="mb-6 flex space-x-4">
            <select v-model="filtroSemana" class="px-3 py-2 border border-gray-300 rounded-md">
              <option value="">Todas las semanas</option>
              <option v-for="semana in semanasDisponibles" :key="semana" :value="semana">
                Semana {{ semana }}
              </option>
            </select>
            <select v-model="filtroMaestro" class="px-3 py-2 border border-gray-300 rounded-md">
              <option value="">Todos los maestros</option>
              <option v-for="maestro in maestros" :key="maestro.id" :value="maestro.id">
                {{ maestro.nombre }}
              </option>
            </select>
          </div>

          <!-- Lista de planes -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              v-for="plan in planesFiltrados"
              :key="plan.id"
              class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div class="flex justify-between items-start mb-3">
                <div>
                  <h3 class="font-medium text-gray-900">Semana {{ plan.semana }}</h3>
                  <p class="text-sm text-gray-600">{{ plan.maestro.nombre }}</p>
                </div>
                <span
                  class="px-2 py-1 text-xs rounded-full"
                  :class="getEstadoPlanClass(plan.estado)"
                >
                  {{ plan.estado }}
                </span>
              </div>

              <div class="mb-3">
                <h4 class="text-xs font-medium text-gray-700 mb-1">Objetivos:</h4>
                <ul class="text-sm text-gray-600 space-y-1">
                  <li v-for="objetivo in plan.objetivos.slice(0, 2)" :key="objetivo">
                    • {{ objetivo }}
                  </li>
                </ul>
              </div>

              <div class="flex justify-between items-center pt-3 border-t border-gray-100">
                <span class="text-xs text-gray-500">
                  {{ formatDate(plan.fechaCreacion) }}
                </span>
                <div class="flex space-x-2">
                  <button
                    class="text-blue-600 hover:text-blue-800 text-sm"
                    @click="editarPlan(plan)"
                  >
                    Editar
                  </button>
                  <button
                    class="text-green-600 hover:text-green-800 text-sm"
                    @click="duplicarPlan(plan)"
                  >
                    Duplicar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pestaña: Analytics -->
      <div v-if="activeTab === 'analytics'" class="space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
          <!-- KPIs principales -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span class="text-white text-sm font-medium">📚</span>
                </div>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-medium text-gray-900">{{ analytics.totalRepertorios }}</h3>
                <p class="text-sm text-gray-600">Repertorios</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="h-8 w-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span class="text-white text-sm font-medium">🎼</span>
                </div>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-medium text-gray-900">{{ analytics.totalObras }}</h3>
                <p class="text-sm text-gray-600">Obras</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="h-8 w-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span class="text-white text-sm font-medium">👥</span>
                </div>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-medium text-gray-900">{{ analytics.maestrosActivos }}</h3>
                <p class="text-sm text-gray-600">Maestros Activos</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="h-8 w-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <span class="text-white text-sm font-medium">📊</span>
                </div>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-medium text-gray-900">{{ analytics.progresoPromedio }}%</h3>
                <p class="text-sm text-gray-600">Progreso Promedio</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Gráficos y análisis detallado -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">📈 Progreso por Obra</h3>
            <!-- Aquí iría un componente de gráfico -->
            <div class="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <span class="text-gray-500">Gráfico de progreso por obra</span>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">🎯 Rendimiento de Maestros</h3>
            <!-- Aquí iría un componente de gráfico -->
            <div class="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <span class="text-gray-500">Gráfico de rendimiento de maestros</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modales -->
    <ModalRepertorio
      v-if="showModalRepertorio"
      :repertorio="repertorioEditando"
      @close="cerrarModalRepertorio"
      @guardar="guardarRepertorio"
    />

    <ModalObra
      v-if="showModalObra"
      :obra="obraEditando"
      :repertorio-id="repertorioSeleccionado?.id"
      @close="cerrarModalObra"
      @guardar="guardarObra"
    />

    <ModalPlanSemanal
      v-if="showModalPlan"
      :plan="planEditando"
      @close="cerrarModalPlan"
      @guardar="guardarPlan"
    />
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {useRouter} from "vue-router"
import {useMontajeStore} from "../store/montaje"
import {useAuthStore} from "@/stores/auth"
import type {Repertorio, Obra, PlanAccion} from "../types"

// Componentes (crear estos después)
import MapaCalorGeneral from "../components/MapaCalorGeneral.vue"
import ModalRepertorio from "../components/ModalRepertorio.vue"
import ModalObra from "../components/ModalObra.vue"
import ModalPlanSemanal from "../components/ModalPlanSemanal.vue"

// Stores
const router = useRouter()
const montajeStore = useMontajeStore()
const authStore = useAuthStore()

// Estado reactivo
const activeTab = ref("repertorio")
const showModalRepertorio = ref(false)
const showModalObra = ref(false)
const showModalPlan = ref(false)
const repertorioSeleccionado = ref<Repertorio | null>(null)
const maestroSeleccionado = ref<any>(null)
const repertorioEditando = ref<Repertorio | null>(null)
const obraEditando = ref<Obra | null>(null)
const planEditando = ref<PlanAccion | null>(null)
const filtroSemana = ref("")
const filtroMaestro = ref("")

// Pestañas
const tabs = [
  {id: "repertorio", label: "Repertorio y Obras", icon: "🎼"},
  {id: "maestros", label: "Gestión de Maestros", icon: "👥"},
  {id: "planes", label: "Planes de Acción", icon: "📋"},
  {id: "analytics", label: "Analytics", icon: "📊"},
]

// Datos simulados (reemplazar con datos reales)
const repertorios = ref<Repertorio[]>([])
const maestros = ref([
  {
    id: "1",
    nombre: "María González",
    email: "maria@academia.com",
    activo: true,
    estadisticas: {
      obrasAsignadas: 5,
      progresoProm: 78,
      horasTrabajo: 45,
    },
    obrasRecientes: ["Sinfonía No. 9", "Concierto para Piano"],
    asistenciaHoy: true,
    observacionesClase: [
      {
        id: "1",
        contenido: "Excelente trabajo con la sección de cuerdas en el movimiento III.",
        fecha: new Date(),
      },
    ],
  },
])

const planesSemanales = ref([
  {
    id: "1",
    semana: 45,
    maestro: {nombre: "María González"},
    estado: "activo",
    objetivos: ["Mejorar articulación", "Sincronizar metales"],
    fechaCreacion: new Date(),
  },
])

const analytics = ref({
  totalRepertorios: 8,
  totalObras: 24,
  maestrosActivos: 6,
  progresoPromedio: 72,
})

// Computed
const obrasDelRepertorio = computed(() => {
  if (!repertorioSeleccionado.value) return []
  return montajeStore.obras.filter((obra) => obra.repertorioId === repertorioSeleccionado.value!.id)
})

const semanasDisponibles = computed(() => {
  return Array.from(new Set(planesSemanales.value.map((p) => p.semana))).sort()
})

const planesFiltrados = computed(() => {
  let planes = planesSemanales.value

  if (filtroSemana.value) {
    planes = planes.filter((p) => p.semana.toString() === filtroSemana.value)
  }

  if (filtroMaestro.value) {
    planes = planes.filter((p) => p.maestro.id === filtroMaestro.value)
  }

  return planes
})

// Métodos
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function getEstadoRepertorioClass(estado: string): string {
  switch (estado) {
    case "planificando":
      return "bg-yellow-100 text-yellow-800"
    case "en_montaje":
      return "bg-blue-100 text-blue-800"
    case "finalizado":
      return "bg-green-100 text-green-800"
    case "archivado":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

function getEstadoPlanClass(estado: string): string {
  switch (estado) {
    case "activo":
      return "bg-green-100 text-green-800"
    case "completado":
      return "bg-blue-100 text-blue-800"
    case "pendiente":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

function seleccionarRepertorio(repertorio: Repertorio) {
  repertorioSeleccionado.value = repertorio
}

function seleccionarMaestro(maestro: any) {
  maestroSeleccionado.value = maestro
}

function abrirModalRepertorio() {
  repertorioEditando.value = null
  showModalRepertorio.value = true
}

function editarRepertorio(repertorio: Repertorio) {
  repertorioEditando.value = repertorio
  showModalRepertorio.value = true
}

function cerrarModalRepertorio() {
  showModalRepertorio.value = false
  repertorioEditando.value = null
}

function guardarRepertorio(repertorio: Repertorio) {
  // Lógica para guardar repertorio
  console.log("Guardando repertorio:", repertorio)
  cerrarModalRepertorio()
}

function abrirModalObra() {
  if (!repertorioSeleccionado.value) {
    alert("Selecciona un repertorio primero")
    return
  }
  obraEditando.value = null
  showModalObra.value = true
}

function cerrarModalObra() {
  showModalObra.value = false
  obraEditando.value = null
}

function guardarObra(obra: Obra) {
  // Lógica para guardar obra
  console.log("Guardando obra:", obra)
  cerrarModalObra()
}

function verDetalleObra(obra: Obra) {
  router.push(`/montaje/obras/${obra.id}`)
}

function definirFrases(obra: Obra) {
  router.push(`/montaje/obras/${obra.id}/frases`)
}

function agregarObservacion(obra: Obra) {
  // Lógica para agregar observación
  console.log("Agregando observación a obra:", obra.titulo)
}

function crearPlanSemanal() {
  planEditando.value = null
  showModalPlan.value = true
}

function editarPlan(plan: any) {
  planEditando.value = plan
  showModalPlan.value = true
}

function cerrarModalPlan() {
  showModalPlan.value = false
  planEditando.value = null
}

function guardarPlan(plan: PlanAccion) {
  // Lógica para guardar plan
  console.log("Guardando plan:", plan)
  cerrarModalPlan()
}

function duplicarPlan(plan: any) {
  // Lógica para duplicar plan
  console.log("Duplicando plan:", plan)
}

function enviarObservacion(maestro: any) {
  // Lógica para enviar observación
  console.log("Enviando observación a:", maestro.nombre)
}

function asignarObras(maestro: any) {
  // Lógica para asignar obras
  console.log("Asignando obras a:", maestro.nombre)
}

function marcarComoRevisado(maestro: any) {
  // Lógica para marcar como revisado
  console.log("Marcando como revisado:", maestro.nombre)
}

function verAsistencia(maestro: any) {
  router.push(`/attendance/teacher/${maestro.id}`)
}

// Lifecycle
onMounted(async () => {
  // Cargar datos iniciales
  // await montajeStore.cargarRepertorios()
  // await montajeStore.cargarMaestros()
  // Simular datos por ahora
  repertorios.value = [
    {
      id: "1",
      nombre: "Concierto de Primavera 2024",
      descripcion: "Repertorio clásico para el concierto de temporada",
      estado: "en_montaje",
      metadatos: {
        totalObras: 4,
        totalCompases: 800,
        horasEstimadas: 120,
        progresoPorcentaje: 65,
      },
    },
    {
      id: "2",
      nombre: "Festival de Invierno 2024",
      descripcion: "Repertorio moderno y contemporáneo",
      estado: "planificando",
      metadatos: {
        totalObras: 3,
        totalCompases: 600,
        horasEstimadas: 90,
        progresoPorcentaje: 25,
      },
    },
  ]

  maestros.value = [
    {
      id: "1",
      nombre: "Carlos González",
      email: "carlos.gonzalez@academia.com",
      activo: true,
      asistenciaHoy: true,
      estadisticas: {
        obrasAsignadas: 3,
        progresoProm: 78,
        horasTrabajo: 24,
      },
      obrasRecientes: ["Sinfonía No. 9", "Concierto para Piano"],
      observacionesClase: [
        {
          id: "1",
          contenido:
            "Excelente trabajo con la sección de cuerdas en la parte adagio. Los estudiantes muestran gran progreso en la afinación.",
          fecha: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          id: "2",
          contenido:
            "Necesario trabajar más la sincronización en los compases 45-60. Se sugiere práctica individual antes del ensayo.",
          fecha: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      ],
    },
    {
      id: "2",
      nombre: "María Rodriguez",
      email: "maria.rodriguez@academia.com",
      activo: true,
      asistenciaHoy: false,
      estadisticas: {
        obrasAsignadas: 2,
        progresoProm: 85,
        horasTrabajo: 18,
      },
      obrasRecientes: ["Bolero", "Danza Húngara"],
      observacionesClase: [
        {
          id: "3",
          contenido:
            "Trabajo excepcional con los vientos. La articulación ha mejorado notablemente esta semana.",
          fecha: new Date(Date.now() - 3 * 60 * 60 * 1000),
        },
      ],
    },
  ]

  planesSemanales.value = [
    {
      id: "1",
      semana: 12,
      maestro: maestros.value[0],
      objetivos: [
        "Perfeccionar articulación en compases 45-60",
        "Trabajar dinámicas en sección B",
        "Sincronizar entrada de metales",
      ],
      estado: "activo",
      fechaCreacion: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: "2",
      semana: 11,
      maestro: maestros.value[1],
      objetivos: ["Mejorar tempo en allegro", "Pulir transiciones entre movimientos"],
      estado: "completado",
      fechaCreacion: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
  ]
})
</script>

<style scoped>
.director-montaje-container {
  @apply min-h-screen bg-gray-50;
}

.transition-shadow {
  transition: box-shadow 0.3s ease;
}

.transition-colors {
  transition:
    color 0.2s ease,
    border-color 0.2s ease;
}
</style>
