<template>
  <div class="space-y-6">
    <!-- KPI Overview Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Total Works -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                class="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Obras Totales</p>
            <p class="text-2xl font-semibold text-gray-900">{{ analytics.totalWorks }}</p>
          </div>
        </div>
        <div class="mt-4">
          <div class="flex items-center text-sm">
            <span class="text-green-600 font-medium">{{ analytics.activeWorks }}</span>
            <span class="text-gray-500 ml-1">activas</span>
          </div>
        </div>
      </div>

      <!-- Average Progress -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                class="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Progreso Promedio</p>
            <p class="text-2xl font-semibold text-gray-900">
              {{ Math.round(analytics.averageProgress) }}%
            </p>
          </div>
        </div>
        <div class="mt-4">
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-green-600 h-2 rounded-full transition-all duration-300"
              :style="{width: `${analytics.averageProgress}%`}"
            />
          </div>
        </div>
      </div>

      <!-- Completed Phrases -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg
                class="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Frases Completadas</p>
            <p class="text-2xl font-semibold text-gray-900">{{ analytics.completedPhrases }}</p>
          </div>
        </div>
        <div class="mt-4">
          <div class="flex items-center text-sm">
            <span class="text-purple-600 font-medium">{{ analytics.totalPhrases }}</span>
            <span class="text-gray-500 ml-1">total</span>
          </div>
        </div>
      </div>

      <!-- Average Score -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg
                class="w-5 h-5 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Calificación Promedio</p>
            <p class="text-2xl font-semibold text-gray-900">
              {{ analytics.averageScore.toFixed(1) }}/10
            </p>
          </div>
        </div>
        <div class="mt-4">
          <div class="flex items-center text-sm">
            <span
              class="font-medium"
              :class="
                analytics.averageScore >= 7
                  ? 'text-green-600'
                  : analytics.averageScore >= 5
                    ? 'text-yellow-600'
                    : 'text-red-600'
              "
            >
              {{ getScoreLabel(analytics.averageScore) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Progress by Work Chart -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Progreso por Obra</h3>
        <div class="space-y-4">
          <div
            v-for="work in analytics.workProgress"
            :key="work.id"
            class="flex items-center justify-between"
          >
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900">{{ work.titulo }}</p>
              <p class="text-xs text-gray-500">{{ work.compositor }}</p>
            </div>
            <div class="flex items-center space-x-3 ml-4">
              <div class="w-24 bg-gray-200 rounded-full h-2">
                <div
                  class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  :style="{width: `${work.progress}%`}"
                />
              </div>
              <span class="text-sm font-medium text-gray-600 w-12 text-right">
                {{ Math.round(work.progress) }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Phrase Status Distribution -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Estado de Frases</h3>
        <div class="space-y-3">
          <div
            v-for="status in analytics.phraseStatusDistribution"
            :key="status.status"
            class="flex items-center justify-between"
          >
            <div class="flex items-center">
              <div class="w-3 h-3 rounded-full mr-3" :class="getStatusColor(status.status)" />
              <span class="text-sm font-medium text-gray-700">
                {{ getStatusLabel(status.status) }}
              </span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-600">{{ status.count }}</span>
              <span class="text-xs text-gray-500"> ({{ Math.round(status.percentage) }}%) </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
      <div class="space-y-4">
        <div
          v-for="activity in analytics.recentActivity"
          :key="activity.id"
          class="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0"
        >
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            :class="getActivityTypeColor(activity.type)"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                v-if="activity.type === 'evaluation'"
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
              <path
                v-else-if="activity.type === 'creation'"
                fill-rule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clip-rule="evenodd"
              />
              <path
                v-else
                fill-rule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900">{{ activity.description }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ formatDate(activity.timestamp) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Trends -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Tendencias de Rendimiento</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Weekly Progress -->
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600 mb-1">+{{ analytics.weeklyProgress }}%</div>
          <p class="text-sm text-gray-600">Progreso Semanal</p>
        </div>

        <!-- Monthly Evaluations -->
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600 mb-1">
            {{ analytics.monthlyEvaluations }}
          </div>
          <p class="text-sm text-gray-600">Evaluaciones este Mes</p>
        </div>

        <!-- Improvement Rate -->
        <div class="text-center">
          <div class="text-2xl font-bold text-purple-600 mb-1">
            {{ analytics.improvementRate }}%
          </div>
          <p class="text-sm text-gray-600">Tasa de Mejora</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from "vue"
import type {MontajeAnalytics} from "../types"
import {formatDate} from "../utils"

interface Props {
  analytics: MontajeAnalytics
}

const props = defineProps<Props>()

const getScoreLabel = (score: number) => {
  if (score >= 9) return "Excelente"
  if (score >= 7) return "Bueno"
  if (score >= 5) return "Regular"
  return "Necesita Mejora"
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case "no_iniciado":
      return "No Iniciado"
    case "en_proceso":
      return "En Proceso"
    case "en_revision":
      return "En Revisión"
    case "completado":
      return "Completado"
    case "necesita_trabajo":
      return "Necesita Trabajo"
    default:
      return status
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "no_iniciado":
      return "bg-gray-400"
    case "en_proceso":
      return "bg-blue-400"
    case "en_revision":
      return "bg-yellow-400"
    case "completado":
      return "bg-green-400"
    case "necesita_trabajo":
      return "bg-red-400"
    default:
      return "bg-gray-400"
  }
}

const getActivityTypeColor = (type: string) => {
  switch (type) {
    case "evaluation":
      return "bg-green-100 text-green-600"
    case "creation":
      return "bg-blue-100 text-blue-600"
    case "update":
      return "bg-yellow-100 text-yellow-600"
    default:
      return "bg-gray-100 text-gray-600"
  }
}
</script>
