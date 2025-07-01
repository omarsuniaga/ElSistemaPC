<template>
  <div class="mapa-calor-general">
    <h4 class="text-sm font-medium text-gray-700 mb-3">Mapa de Calor General</h4>

    <!-- Heatmap por días -->
    <div class="grid grid-cols-7 gap-1 mb-4">
      <div v-for="(dia, index) in ultimosSieteDias" :key="index" class="text-center">
        <div class="text-xs text-gray-500 mb-1">{{ dia.label }}</div>
        <div
          class="h-8 w-full rounded cursor-pointer transition-all duration-200 hover:scale-105"
          :class="getIntensidadClass(dia.intensidad)"
          :title="`${dia.fecha}: ${dia.actividad} actividades, ${dia.horasTrabajas}h trabajadas`"
          @click="seleccionarDia(dia)"
        />
        <div class="text-xs text-gray-600 mt-1">{{ dia.actividad }}</div>
      </div>
    </div>

    <!-- Mapa de obras por progreso -->
    <div class="obras-progreso mb-4">
      <h5 class="text-xs font-medium text-gray-700 mb-2">Progreso por Obra</h5>
      <div class="space-y-2">
        <div v-for="obra in obrasProgreso" :key="obra.id" class="flex items-center space-x-2">
          <div class="flex-1 bg-gray-200 rounded-full h-2">
            <div
              class="h-2 rounded-full transition-all duration-300"
              :class="getProgresoBarClass(obra.progreso)"
              :style="{width: obra.progreso + '%'}"
            />
          </div>
          <span class="text-xs text-gray-600 w-12">{{ obra.progreso }}%</span>
          <span class="text-xs text-gray-500 w-20 truncate">{{ obra.titulo }}</span>
        </div>
      </div>
    </div>

    <!-- Estadísticas rápidas -->
    <div class="grid grid-cols-2 gap-4 text-sm">
      <div class="text-center p-2 bg-blue-50 rounded">
        <div class="font-medium text-blue-700">{{ estadisticas.obrasActivas }}</div>
        <div class="text-blue-600">Obras Activas</div>
      </div>
      <div class="text-center p-2 bg-green-50 rounded">
        <div class="font-medium text-green-700">{{ estadisticas.progresoSemana }}%</div>
        <div class="text-green-600">Progreso Semanal</div>
      </div>
    </div>

    <!-- Alertas y notificaciones -->
    <div v-if="alertas.length > 0" class="alertas mt-4">
      <h5 class="text-xs font-medium text-gray-700 mb-2">Alertas</h5>
      <div class="space-y-1">
        <div
          v-for="alerta in alertas"
          :key="alerta.id"
          class="text-xs p-2 rounded"
          :class="getAlertaClass(alerta.tipo)"
        >
          {{ alerta.mensaje }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, ref} from "vue"

interface Props {
  maestroId: string
}

defineProps<Props>()

// Estado reactivo
const diaSeleccionado = ref<any>(null)

// Datos simulados (reemplazar con datos reales)
const ultimosSieteDias = computed(() => {
  const dias = []
  const hoy = new Date()

  for (let i = 6; i >= 0; i--) {
    const fecha = new Date(hoy)
    fecha.setDate(fecha.getDate() - i)

    // Simular actividad
    const actividad = Math.floor(Math.random() * 10)

    dias.push({
      fecha: fecha.toLocaleDateString("es-ES", {day: "2-digit", month: "2-digit"}),
      label: fecha.toLocaleDateString("es-ES", {weekday: "short"}),
      actividad,
      intensidad: getIntensidad(actividad),
      horasTrabajas: Math.floor(Math.random() * 8),
    })
  }

  return dias
})

const obrasProgreso = computed(() => [
  {id: "1", titulo: "Sinfonía No. 9", progreso: 78},
  {id: "2", titulo: "Concierto Piano", progreso: 45},
  {id: "3", titulo: "Bolero", progreso: 92},
])

const estadisticas = computed(() => ({
  obrasActivas: 3,
  progresoSemana: 78,
}))

const alertas = computed(() => [
  {
    id: "1",
    tipo: "warning",
    mensaje: 'Obra "Concierto Piano" requiere atención - progreso bajo',
  },
  {
    id: "2",
    tipo: "success",
    mensaje: "Bolero casi completado - excelente trabajo",
  },
])

// Métodos
function getIntensidad(actividad: number): string {
  if (actividad === 0) return "baja"
  if (actividad <= 3) return "media"
  return "alta"
}

function getIntensidadClass(intensidad: string): string {
  switch (intensidad) {
    case "baja":
      return "bg-gray-200"
    case "media":
      return "bg-blue-300"
    case "alta":
      return "bg-blue-500"
    default:
      return "bg-gray-200"
  }
}

function getProgresoBarClass(progreso: number): string {
  if (progreso >= 80) return "bg-green-500"
  if (progreso >= 50) return "bg-yellow-500"
  return "bg-red-500"
}

function getAlertaClass(tipo: string): string {
  switch (tipo) {
    case "warning":
      return "bg-yellow-100 text-yellow-800 border border-yellow-200"
    case "error":
      return "bg-red-100 text-red-800 border border-red-200"
    case "success":
      return "bg-green-100 text-green-800 border border-green-200"
    case "info":
      return "bg-blue-100 text-blue-800 border border-blue-200"
    default:
      return "bg-gray-100 text-gray-800 border border-gray-200"
  }
}

function seleccionarDia(dia: any) {
  diaSeleccionado.value = dia
  console.log("Día seleccionado:", dia)
  // Emitir evento o mostrar detalles del día
}
</script>
