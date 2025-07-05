<template>
  <div class="bg-white rounded-lg shadow-sm p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 flex items-center">
        ⚠️ Estudiantes en Riesgo
      </h3>
      <span class="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
        {{ students.length }} estudiantes
      </span>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="animate-pulse">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-gray-200 rounded-full" />
          <div class="flex-1">
            <div class="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div class="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="students.length === 0" class="text-center py-8">
      <div class="text-4xl mb-2">🎉</div>
      <p class="text-gray-500">¡Excelente! No hay estudiantes en riesgo</p>
    </div>

    <div v-else class="space-y-3 max-h-96 overflow-y-auto">
      <div
        v-for="student in students.slice(0, 10)"
        :key="student.studentId"
        class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div class="flex items-center space-x-3">
          <!-- Risk Level Indicator -->
          <div
            class="w-3 h-3 rounded-full flex-shrink-0"
            :class="getRiskColor(student.riskScore)"
          />

          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-gray-900 truncate">
              {{ student.studentName }}
            </p>
            <div class="flex items-center space-x-2 text-xs text-gray-500">
              <span>Riesgo: {{ (student.riskScore * 100).toFixed(0) }}%</span>
              <span>•</span>
              <span>Última asistencia: {{ formatDate(student.lastAttendance) }}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <!-- Prediction Badge -->
          <span
            class="px-2 py-1 text-xs font-medium rounded-full"
            :class="getPredictionColor(student.prediction)"
          >
            {{ getPredictionText(student.prediction) }}
          </span>

          <!-- Actions Dropdown -->
          <div class="relative">
            <button
              class="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              @click="toggleActions(student.studentId)"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 5v.01M12 12v.01M12 19v.01"
                />
              </svg>
            </button>

            <!-- Actions Menu -->
            <div
              v-if="activeStudent === student.studentId"
              class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
            >
              <button
                v-for="action in student.actions"
                :key="action"
                class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                @click="executeAction(student, action)"
              >
                {{ action }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Ver más estudiantes -->
      <div v-if="students.length > 10" class="text-center pt-3 border-t border-gray-200">
        <button
          class="text-sm text-blue-600 hover:text-blue-800 font-medium"
          @click="showAll = !showAll"
        >
          {{ showAll ? "Ver menos" : `Ver ${students.length - 10} estudiantes más` }}
        </button>
      </div>
    </div>

    <!-- Quick Actions -->
    <div v-if="students.length > 0" class="mt-4 pt-4 border-t border-gray-200">
      <div class="flex space-x-2">
        <button
          class="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors"
          @click="contactAllRiskStudents"
        >
          📞 Contactar Todos
        </button>
        <button
          class="flex-1 bg-gray-600 text-white text-sm font-medium py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors"
          @click="generateRiskReport"
        >
          📊 Generar Reporte
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref} from "vue"
import type {RiskStudent} from "@/analytics/composables/useAdvancedAnalytics"

interface Props {
  students: RiskStudent[]
  loading?: boolean
}

defineProps<Props>()

const activeStudent = ref<string | null>(null)
const showAll = ref(false)

function getRiskColor(riskScore: number): string {
  if (riskScore >= 0.7) return "bg-red-500"
  if (riskScore >= 0.4) return "bg-yellow-500"
  return "bg-green-500"
}

function getPredictionColor(prediction: string): string {
  const colorMap = {
    likely_absent: "bg-red-100 text-red-800",
    uncertain: "bg-yellow-100 text-yellow-800",
    likely_present: "bg-green-100 text-green-800",
  }
  return colorMap[prediction as keyof typeof colorMap] || "bg-gray-100 text-gray-800"
}

function getPredictionText(prediction: string): string {
  const textMap = {
    likely_absent: "Probablemente ausente",
    uncertain: "Incierto",
    likely_present: "Probablemente presente",
  }
  return textMap[prediction as keyof typeof textMap] || "Desconocido"
}

function formatDate(dateString: string): string {
  if (dateString === "Nunca") return dateString

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    })
  } catch {
    return dateString
  }
}

function toggleActions(studentId: string) {
  activeStudent.value = activeStudent.value === studentId ? null : studentId
}

function executeAction(student: RiskStudent, action: string) {
  console.log(`Ejecutando acción "${action}" para estudiante:`, student.studentName)

  // Aquí implementarías las acciones específicas
  switch (action) {
    case "Contactar al estudiante":
      // Abrir modal de contacto o WhatsApp
      break
    case "Reunión con padres":
      // Programar reunión
      break
    case "Plan de recuperación":
      // Crear plan personalizado
      break
  }

  activeStudent.value = null
}

function contactAllRiskStudents() {
  console.log("Contactando a todos los estudiantes en riesgo...")
  // Implementar contacto masivo
}

function generateRiskReport() {
  console.log("Generando reporte de estudiantes en riesgo...")
  // Implementar generación de reporte
}
</script>

<style scoped>
/* Animación para el indicador de riesgo */
.bg-red-500 {
  animation: pulse-red 2s infinite;
}

@keyframes pulse-red {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Scroll personalizado */
.max-h-96::-webkit-scrollbar {
  width: 4px;
}

.max-h-96::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.max-h-96::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.max-h-96::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>
