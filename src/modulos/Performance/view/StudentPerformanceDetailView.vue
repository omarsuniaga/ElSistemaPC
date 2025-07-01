<template>
  <div class="performance-detail-view bg-gray-50 dark:bg-gray-900 min-h-screen">
    <!-- Header -->
    <div
      class="header bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10"
    >
      <div class="header-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <button
          class="back-button inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          @click="$router.back()"
        >
          <ArrowLeftIcon class="w-5 h-5" />
          Volver
        </button>

        <div class="header-info space-y-4">
          <h1 class="title text-2xl font-bold text-gray-900 dark:text-white">
            Análisis de Rendimiento
          </h1>
          <div v-if="student" class="student-info flex items-center">
            <StudentAvatar
              v-if="student.nombre && student.apellido"
              :first-name="student.nombre"
              :last-name="student.apellido"
              size="sm"
              class="mr-3"
            />
            <div>
              <h2 class="student-name text-lg font-semibold text-gray-900 dark:text-white">
                {{ student.nombre }} {{ student.apellido }}
              </h2>
              <p class="student-meta text-sm text-gray-600 dark:text-gray-400">
                {{ student.instrumento }} • {{ student.clase }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="loading" class="loading-state text-center py-12">
        <div
          class="spinner animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
        />
        <p>Cargando análisis de rendimiento...</p>
      </div>

      <div v-else-if="error" class="error-state text-center py-12">
        <ExclamationTriangleIcon class="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Error al cargar los datos
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">{{ error }}</p>
        <button
          class="btn-primary px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          @click="refresh"
        >
          Reintentar
        </button>
      </div>

      <div v-else-if="performance" class="performance-content space-y-8">
        <!-- Overall Performance Summary -->
        <div
          class="summary-card bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3
            class="section-title flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-6"
          >
            <ChartBarIcon class="w-5 h-5" />
            Resumen General
          </h3>

          <div class="performance-overview grid lg:grid-cols-2 gap-8">
            <div class="score-display flex items-center gap-6">
              <div class="score-circle relative w-24 h-24">
                <div
                  class="score-fill w-full h-full rounded-full relative"
                  :style="{
                    background: `conic-gradient(${getScoreColor(performance.scores?.overallScore || 0)} ${(performance.scores?.overallScore || 0) * 3.6}deg, #e5e7eb 0deg)`,
                  }"
                >
                  <div
                    class="score-inner absolute inset-2 bg-white dark:bg-gray-800 rounded-full flex flex-col items-center justify-center"
                  >
                    <span class="score-value text-2xl font-bold text-gray-900 dark:text-white">{{
                      Math.round(performance.scores?.overallScore || 0)
                    }}</span>
                    <span class="score-label text-sm text-gray-600 dark:text-gray-400">%</span>
                  </div>
                </div>
              </div>
              <div class="score-info space-y-1">
                <h4 class="score-title text-lg font-semibold text-gray-900 dark:text-white">
                  Rendimiento General
                </h4>
                <p class="score-description text-gray-600 dark:text-gray-400">
                  {{ getPerformanceLevel(performance.scores?.overallScore || 0) }}
                </p>
              </div>
            </div>

            <div class="metrics-grid grid grid-cols-2 gap-4">
              <div
                class="metric-item flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <CalendarIcon class="w-6 h-6 text-blue-500" />
                <div>
                  <p class="metric-label text-sm text-gray-600 dark:text-gray-400">Asistencia</p>
                  <p class="metric-value text-lg font-semibold text-gray-900 dark:text-white">
                    {{ Math.round(performance.attendance?.attendanceRate || 0) }}%
                  </p>
                </div>
              </div>

              <div
                class="metric-item flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <MusicalNoteIcon class="w-6 h-6 text-green-500" />
                <div>
                  <p class="metric-label text-sm text-gray-600 dark:text-gray-400">Repertorio</p>
                  <p class="metric-value text-lg font-semibold text-gray-900 dark:text-white">
                    {{ Math.round(performance.repertoire?.averageScore || 0) }}%
                  </p>
                </div>
              </div>

              <div
                class="metric-item flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <UserGroupIcon class="w-6 h-6 text-purple-500" />
                <div>
                  <p class="metric-label text-sm text-gray-600 dark:text-gray-400">Trabajo</p>
                  <p class="metric-value text-lg font-semibold text-gray-900 dark:text-white">
                    {{ Math.round(performance.scores?.workScore || 0) }}%
                  </p>
                </div>
              </div>

              <div
                class="metric-item flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <StarIcon class="w-6 h-6 text-yellow-500" />
                <div>
                  <p class="metric-label text-sm text-gray-600 dark:text-gray-400">
                    Retroalimentación
                  </p>
                  <p class="metric-value text-lg font-semibold text-gray-900 dark:text-white">
                    {{ Math.round(performance.scores?.behaviorScore || 0) }}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Detailed Analysis Tabs -->
        <div
          class="analysis-tabs bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div class="tab-nav flex border-b border-gray-200 dark:border-gray-700">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              :class="[
                'tab-button flex items-center gap-2 px-6 py-4 text-sm font-medium text-gray-600 dark:text-gray-400 border-b-2 border-transparent hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600 transition-colors',
                {'active text-blue-600 dark:text-blue-400 border-blue-500': activeTab === tab.id},
              ]"
              @click="activeTab = tab.id"
            >
              <component :is="tab.icon" class="w-5 h-5" />
              {{ tab.label }}
            </button>
          </div>

          <div class="tab-content p-6">
            <!-- Attendance Analysis -->
            <div v-if="activeTab === 'attendance'" class="tab-panel">
              <AttendanceAnalysis :student-id="studentId" :data="attendanceData" />
            </div>

            <!-- Repertoire Analysis -->
            <div v-if="activeTab === 'repertoire'" class="tab-panel">
              <RepertoireAnalysis :student-id="studentId" :data="repertoireData" />
            </div>

            <!-- Work Analysis -->
            <div v-if="activeTab === 'work'" class="tab-panel">
              <WorkAnalysis :student-id="studentId" :data="performance.work" />
            </div>

            <!-- Feedback Analysis -->
            <div v-if="activeTab === 'feedback'" class="tab-panel">
              <FeedbackAnalysis :student-id="studentId" :data="performance.observations" />
            </div>

            <!-- Trends -->
            <div v-if="activeTab === 'trends'" class="tab-panel">
              <PerformanceTrends :student-id="studentId" :data="performance.trends" />
            </div>
          </div>
        </div>
        <!-- Recommendations -->
        <div
          class="recommendations-card bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3
            class="section-title flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-6"
          >
            <LightBulbIcon class="w-5 h-5" />
            Recomendaciones
          </h3>

          <div v-if="generatedRecommendations.length" class="recommendations-list space-y-4">
            <div
              v-for="(recommendation, index) in generatedRecommendations"
              :key="index"
              class="recommendation-item flex gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div
                class="recommendation-icon flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400"
              >
                <component :is="getRecommendationIcon(recommendation.type)" class="w-5 h-5" />
              </div>
              <div class="recommendation-content flex-1 space-y-2">
                <h4 class="recommendation-title font-semibold text-gray-900 dark:text-white">
                  {{ recommendation.title }}
                </h4>
                <p class="recommendation-description text-gray-600 dark:text-gray-400">
                  {{ recommendation.description }}
                </p>
                <div
                  v-if="recommendation.actions?.length"
                  class="recommendation-actions flex gap-2 mt-3"
                >
                  <button
                    v-for="action in recommendation.actions"
                    :key="action.id"
                    class="action-button px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    @click="executeAction(action)"
                  >
                    {{ action.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="no-recommendations text-center py-8">
            <CheckCircleIcon class="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p class="text-gray-600 dark:text-gray-400">
              ¡Excelente! No hay recomendaciones específicas en este momento.
            </p>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-12">
        <p>No se encontraron datos de rendimiento para este estudiante.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {useRoute, useRouter} from "vue-router"
import {
  ArrowLeftIcon,
  ChartBarIcon,
  CalendarIcon,
  MusicalNoteIcon,
  UserGroupIcon,
  StarIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/vue/24/outline"
import {ArrowTrendingUpIcon} from "@heroicons/vue/24/solid"
import {useStudentsStore} from "../../Students/store/students"
import {useStudentPerformance} from "../composables/useStudentPerformance"
import StudentAvatar from "../../Students/components/StudentAvatar.vue"
import AttendanceAnalysis from "../components/AttendanceAnalysis.vue"
import RepertoireAnalysis from "../components/RepertoireAnalysis.vue"
import WorkAnalysis from "../components/WorkAnalysis.vue"
import FeedbackAnalysis from "../components/FeedbackAnalysis.vue"
import PerformanceTrends from "../components/PerformanceTrends.vue"

const route = useRoute()
const router = useRouter()
const studentsStore = useStudentsStore()

const studentId = route.params.id as string
const student = computed(() => studentsStore.students.find((s) => s.id === studentId))

const {
  performance, // Use 'performance' as returned by the composable
  loading,
  error,
  refresh,
} = useStudentPerformance(studentId)

const activeTab = ref("attendance")

const tabs = [
  {id: "attendance", label: "Asistencia", icon: CalendarIcon},
  {id: "repertoire", label: "Repertorio", icon: MusicalNoteIcon},
  {id: "work", label: "Trabajo", icon: UserGroupIcon},
  {id: "feedback", label: "Retroalimentación", icon: StarIcon},
  {id: "trends", label: "Tendencias", icon: ArrowTrendingUpIcon},
]

const getScoreColor = (score: number): string => {
  if (score >= 85) return "#10b981" // green-500
  if (score >= 70) return "#f59e0b" // amber-500
  if (score >= 50) return "#f97316" // orange-500
  return "#ef4444" // red-500
}

const getPerformanceLevel = (score: number): string => {
  if (score >= 85) return "Excelente"
  if (score >= 70) return "Bueno"
  if (score >= 50) return "Regular"
  return "Necesita Mejora"
}

const generatedRecommendations = computed(() => {
  if (!performance.value) return []

  const recommendations = []
  const scores = performance.value.scores
  const attendance = performance.value.attendance
  const repertoire = performance.value.repertoire

  // Attendance recommendations
  if (attendance.attendanceRate < 80) {
    recommendations.push({
      type: "attendance",
      title: "Mejorar Asistencia",
      description:
        "Se recomienda mejorar la asistencia a clases para obtener mejor aprovechamiento.",
      actions: [
        {id: "schedule-meeting", label: "Programar Reunión"},
        {id: "reminder-setup", label: "Configurar Recordatorios"},
      ],
    })
  }

  // Practice recommendations
  if (scores.repertoireScore < 70) {
    recommendations.push({
      type: "practice",
      title: "Incrementar Práctica",
      description:
        "Se sugiere aumentar las horas de práctica individual para mejorar el rendimiento en repertorio.",
      actions: [
        {id: "practice-plan", label: "Plan de Práctica"},
        {id: "technique-exercises", label: "Ejercicios Técnicos"},
      ],
    })
  }

  // Participation recommendations
  if (scores.workScore < 70) {
    recommendations.push({
      type: "participation",
      title: "Mejorar Participación",
      description: "Se recomienda una mayor participación en actividades grupales y colaborativas.",
      actions: [
        {id: "group-activities", label: "Actividades Grupales"},
        {id: "leadership-roles", label: "Roles de Liderazgo"},
      ],
    })
  }

  return recommendations
})

// Data adapters for analysis components
const attendanceData = computed(() => {
  if (!performance.value) return undefined
  const attendance = performance.value.attendance
  return {
    attendanceRate: attendance.attendanceRate,
    punctualityRate: attendance.punctuality,
    absences: attendance.totalClasses - attendance.attendedClasses,
    trend:
      performance.value.trends.direction === "mejorando"
        ? "improving"
        : performance.value.trends.direction === "decayendo"
          ? "declining"
          : "stable",
  }
})

const repertoireData = computed(() => {
  if (!performance.value) return undefined
  const repertoire = performance.value.repertoire
  const difficultyScore = Math.round(
    (repertoire.technicalProficiency + repertoire.musicalExpression) / 2
  )

  let difficultyLevel = "Básico"
  if (difficultyScore >= 80) difficultyLevel = "Avanzado"
  else if (difficultyScore >= 60) difficultyLevel = "Intermedio"

  return {
    piecesLearned: repertoire.completedMontajes,
    progressRate: repertoire.averageScore,
    difficulty: difficultyLevel,
  }
})

const getRecommendationIcon = (type: string) => {
  switch (type) {
    case "attendance":
      return CalendarIcon
    case "practice":
      return MusicalNoteIcon
    case "participation":
      return UserGroupIcon
    case "feedback":
      return StarIcon
    default:
      return LightBulbIcon
  }
}

const executeAction = (action: any) => {
  // Handle recommendation actions
  console.log("Executing action:", action)
  // TODO: Implement action handlers
}

onMounted(() => {
  if (!student.value) {
    studentsStore.fetchStudents()
  }
  // Ensure performance data is fetched when component mounts or studentId changes
  if (studentId) {
    refresh()
  }
})

// Watch for changes in studentId if the component can be reused for different students
// watch(() => studentId, (newId) => {
//   if (newId) {
//     refresh();
//   }
// });
</script>

<style scoped>
/* All @apply rules have been removed and styles are applied directly in the template using Tailwind CSS classes. */
</style>
