<template>
  <div class="bg-white rounded-lg shadow-sm p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
      🕐 Análisis de Horarios
    </h3>

    <div v-if="loading" class="space-y-4">
      <div v-for="i in 4" :key="i" class="animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-1/3 mb-2" />
        <div class="h-20 bg-gray-200 rounded" />
      </div>
    </div>

    <div v-else class="space-y-6">
      <!-- Horarios más Populares -->
      <div>
        <h4 class="text-sm font-medium text-gray-700 mb-3">Horarios con Mayor Demanda</h4>
        <div class="grid grid-cols-2 gap-3">
          <div
            v-for="slot in popularSlots"
            :key="slot.time"
            class="p-3 border border-gray-200 rounded-lg"
          >
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium">{{ slot.time }}</span>
              <span class="text-xs text-gray-500">{{ slot.attendance }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                class="bg-blue-600 h-2 rounded-full transition-all duration-500"
                :style="{width: slot.attendance + '%'}"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Horarios Problemáticos -->
      <div>
        <h4 class="text-sm font-medium text-gray-700 mb-3">Horarios con Baja Asistencia</h4>
        <div class="space-y-2">
          <div
            v-for="slot in lowAttendanceSlots"
            :key="slot.time"
            class="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <div>
              <span class="text-sm font-medium text-red-900">{{ slot.time }}</span>
              <span class="text-xs text-red-600 ml-2">{{ slot.attendance }}% asistencia</span>
            </div>
            <button
              class="text-xs text-red-600 hover:text-red-800 font-medium"
              @click="suggestImprovement(slot)"
            >
              💡 Sugerir Mejora
            </button>
          </div>
        </div>
      </div>

      <!-- Distribución Semanal -->
      <div>
        <h4 class="text-sm font-medium text-gray-700 mb-3">Distribución por Día</h4>
        <div class="grid grid-cols-7 gap-1">
          <div v-for="day in weeklyDistribution" :key="day.name" class="text-center">
            <div class="text-xs text-gray-500 mb-1">{{ day.name }}</div>
            <div
              class="h-16 rounded mx-auto relative"
              :class="getDayColor(day.efficiency)"
              :style="{height: Math.max(day.efficiency * 64, 8) + 'px'}"
            >
              <div class="absolute inset-x-0 bottom-0 text-xs text-white font-medium">
                {{ Math.round(day.efficiency * 100) }}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recomendaciones de Optimización -->
      <div>
        <h4 class="text-sm font-medium text-gray-700 mb-3">Recomendaciones</h4>
        <div class="space-y-2">
          <div
            v-for="recommendation in recommendations"
            :key="recommendation.id"
            class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
          >
            <div class="flex items-start space-x-2">
              <span class="text-lg">{{ recommendation.icon }}</span>
              <div class="flex-1">
                <p class="text-sm font-medium text-yellow-900">{{ recommendation.title }}</p>
                <p class="text-xs text-yellow-700 mt-1">{{ recommendation.description }}</p>
                <span
                  class="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full mt-2 inline-block"
                >
                  Impacto: {{ recommendation.impact }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Métricas de Eficiencia -->
      <div class="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div class="text-center">
          <div class="text-lg font-bold text-blue-600">
            {{ Math.round(overallEfficiency * 100) }}%
          </div>
          <div class="text-xs text-gray-500">Eficiencia Global</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-bold text-green-600">{{ optimalSlots }}</div>
          <div class="text-xs text-gray-500">Horarios Óptimos</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-bold text-orange-600">{{ improvableSlots }}</div>
          <div class="text-xs text-gray-500">Para Mejorar</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from "vue"

interface TimeSlot {
  time: string
  attendance: number
  efficiency: number
}

interface WeekDay {
  name: string
  efficiency: number
}

interface Recommendation {
  id: string
  icon: string
  title: string
  description: string
  impact: string
}

interface Props {
  timeSlots: TimeSlot[]
  loading?: boolean
}

const props = defineProps<Props>()

// Horarios más populares
const popularSlots = computed(() => {
  return props.timeSlots
    .filter((slot) => slot.attendance >= 80)
    .sort((a, b) => b.attendance - a.attendance)
    .slice(0, 4)
})

// Horarios con baja asistencia
const lowAttendanceSlots = computed(() => {
  return props.timeSlots
    .filter((slot) => slot.attendance < 60)
    .sort((a, b) => a.attendance - b.attendance)
})

// Distribución semanal simulada
const weeklyDistribution = computed<WeekDay[]>(() => [
  {name: "L", efficiency: 0.75},
  {name: "M", efficiency: 0.85},
  {name: "X", efficiency: 0.9},
  {name: "J", efficiency: 0.82},
  {name: "V", efficiency: 0.68},
  {name: "S", efficiency: 0.55},
  {name: "D", efficiency: 0.45},
])

// Recomendaciones inteligentes
const recommendations = computed<Recommendation[]>(() => [
  {
    id: "1",
    icon: "🕒",
    title: "Consolidar horarios de baja demanda",
    description: "Combinar clases de horarios con < 60% de asistencia",
    impact: "Alto",
  },
  {
    id: "2",
    icon: "📈",
    title: "Promocionar horarios populares",
    description: "Duplicar clases en horarios con > 90% de asistencia",
    impact: "Medio",
  },
  {
    id: "3",
    icon: "💡",
    title: "Optimizar fines de semana",
    description: "Crear actividades especiales para sábados y domingos",
    impact: "Alto",
  },
])

// Métricas calculadas
const overallEfficiency = computed(() => {
  if (props.timeSlots.length === 0) return 0
  const total = props.timeSlots.reduce((sum, slot) => sum + slot.efficiency, 0)
  return total / props.timeSlots.length
})

const optimalSlots = computed(() => {
  return props.timeSlots.filter((slot) => slot.efficiency >= 0.8).length
})

const improvableSlots = computed(() => {
  return props.timeSlots.filter((slot) => slot.efficiency < 0.6).length
})

function getDayColor(efficiency: number): string {
  if (efficiency >= 0.8) return "bg-green-500"
  if (efficiency >= 0.6) return "bg-yellow-500"
  return "bg-red-500"
}

function suggestImprovement(slot: TimeSlot) {
  console.log("Sugiriendo mejoras para:", slot.time)
  // Implementar lógica de mejoras específicas
}
</script>

<style scoped>
/* Animaciones suaves para las barras */
.transition-all {
  transition: all 0.5s ease-in-out;
}

/* Efectos hover mejorados */
.hover\:text-red-800:hover {
  transition: color 0.2s ease;
}
</style>
