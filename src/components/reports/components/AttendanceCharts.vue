<template>
  <div class="space-y-6">
    <!-- Resumen de métricas -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white rounded-lg p-4 shadow-sm border">
        <div class="flex items-center">
          <div class="bg-green-100 p-2 rounded">
            <CheckCircleIcon class="h-6 w-6 text-green-600" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">Asistencias</p>
            <p class="text-2xl font-semibold text-gray-900">{{ stats.totalPresent }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg p-4 shadow-sm border">
        <div class="flex items-center">
          <div class="bg-red-100 p-2 rounded">
            <XCircleIcon class="h-6 w-6 text-red-600" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">Ausencias</p>
            <p class="text-2xl font-semibold text-gray-900">{{ stats.totalAbsent }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg p-4 shadow-sm border">
        <div class="flex items-center">
          <div class="bg-yellow-100 p-2 rounded">
            <ClockIcon class="h-6 w-6 text-yellow-600" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">Tardanzas</p>
            <p class="text-2xl font-semibold text-gray-900">{{ stats.totalLate }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Gráfico de barras simple -->
    <div class="bg-white rounded-lg p-6 shadow-sm border">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Asistencia por Clase</h3>
      <div class="space-y-4">
        <div v-for="(classData, index) in chartData" :key="index" class="flex items-center">
          <div class="w-32 text-sm text-gray-700 truncate">
            {{ classData.name }}
          </div>
          <div class="flex-1 mx-4">
            <div class="bg-gray-200 rounded-full h-6 relative">
              <div
                class="bg-green-500 h-6 rounded-full flex items-center justify-center text-xs text-white font-medium"
                :style="{width: `${classData.attendanceRate}%`}"
              >
                {{ classData.attendanceRate }}%
              </div>
            </div>
          </div>
          <div class="text-sm text-gray-500">{{ classData.present }}/{{ classData.total }}</div>
        </div>
      </div>
    </div>

    <!-- Tendencia temporal -->
    <div v-if="trendData.length > 0" class="bg-white rounded-lg p-6 shadow-sm border">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Tendencia de Asistencia</h3>
      <div class="h-64 flex items-end space-x-2">
        <div
          v-for="(day, index) in trendData"
          :key="index"
          class="flex-1 flex flex-col items-center"
        >
          <div class="w-full bg-gray-200 rounded-t" :style="{height: '200px'}">
            <div
              class="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-300"
              :style="{height: `${(day.rate / 100) * 200}px`}"
            />
          </div>
          <div class="text-xs text-gray-500 mt-2 text-center">
            <div>{{ formatDate(day.date) }}</div>
            <div class="text-blue-600 font-medium">{{ day.rate }}%</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {computed} from "vue"
import {CheckCircleIcon, XCircleIcon, ClockIcon} from "@heroicons/vue/24/outline"
import {format} from "date-fns"
import {es} from "date-fns/locale"

const props = defineProps({
  attendanceData: {
    type: Array,
    required: true,
  },
  dateRange: {
    type: Object,
    required: true,
  },
})

// Estadísticas generales
const stats = computed(() => {
  let totalPresent = 0
  let totalAbsent = 0
  let totalLate = 0

  props.attendanceData.forEach((classData) => {
    classData.students?.forEach((student) => {
      student.attendance?.forEach((record) => {
        switch (record.status) {
          case "present":
            totalPresent++
            break
          case "absent":
            totalAbsent++
            break
          case "late":
            totalLate++
            break
        }
      })
    })
  })

  return {
    totalPresent,
    totalAbsent,
    totalLate,
    total: totalPresent + totalAbsent + totalLate,
  }
})

// Datos para gráfico por clase
const chartData = computed(() => {
  return props.attendanceData.map((classData) => {
    let present = 0
    let total = 0

    classData.students?.forEach((student) => {
      student.attendance?.forEach((record) => {
        total++
        if (record.status === "present") {
          present++
        }
      })
    })

    return {
      name: classData.className || "Clase sin nombre",
      present,
      total,
      attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
    }
  })
})

// Datos de tendencia por día
const trendData = computed(() => {
  const dailyStats = new Map()

  // Agrupar por fecha
  props.attendanceData.forEach((classData) => {
    classData.students?.forEach((student) => {
      student.attendance?.forEach((record) => {
        const dateKey = format(new Date(record.date), "yyyy-MM-dd")

        if (!dailyStats.has(dateKey)) {
          dailyStats.set(dateKey, {present: 0, total: 0, date: record.date})
        }

        const dayData = dailyStats.get(dateKey)
        dayData.total++
        if (record.status === "present") {
          dayData.present++
        }
      })
    })
  })

  // Convertir a array y calcular porcentajes
  return Array.from(dailyStats.values())
    .map((day) => ({
      ...day,
      rate: day.total > 0 ? Math.round((day.present / day.total) * 100) : 0,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-10) // Últimos 10 días
})

const formatDate = (date) => {
  return format(new Date(date), "dd/MM", {locale: es})
}
</script>
