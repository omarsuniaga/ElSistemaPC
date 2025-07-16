<template>
  <div class="space-y-6 repertoire-analysis">
    <div class="space-y-2 analysis-header">
      <h4 class="text-lg font-semibold text-gray-900 dark:text-white analysis-title">
        Análisis de Repertorio
      </h4>
      <p class="text-gray-600 dark:text-gray-400 analysis-description">
        Evaluación del progreso en piezas musicales y técnica instrumental
      </p>
    </div>

    <div class="space-y-6 analysis-content">
      <!-- Quick Stats -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3 stats-grid">
        <div class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg stat-card">
          <MusicalNoteIcon class="w-8 h-8 text-purple-500" />
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white stat-value">
              {{ data?.piecesLearned || 5 }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 stat-label">Piezas Aprendidas</p>
          </div>
        </div>

        <div class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg stat-card">
          <ArrowTrendingUpIcon class="w-8 h-8 text-green-500" />
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white stat-value">
              {{ data?.progressRate || 78 }}%
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 stat-label">Progreso General</p>
          </div>
        </div>

        <div class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg stat-card">
          <StarIcon class="w-8 h-8 text-yellow-500" />
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white stat-value">
              {{ data?.difficulty || "Intermedio" }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 stat-label">Nivel Actual</p>
          </div>
        </div>
      </div>

      <!-- Current Pieces -->
      <div class="space-y-4 pieces-section">
        <h5 class="text-base font-semibold text-gray-900 dark:text-white section-title">
          Repertorio Actual
        </h5>

        <div class="space-y-4 pieces-list">
          <div
            v-for="piece in currentPieces"
            :key="piece.id"
            class="p-4 space-y-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700 piece-card"
          >
            <div class="flex items-start justify-between piece-header">
              <div>
                <h6 class="font-semibold text-gray-900 dark:text-white piece-title">
                  {{ piece.title }}
                </h6>
                <p class="text-sm text-gray-600 dark:text-gray-400 piece-composer">
                  {{ piece.composer }}
                </p>
              </div>
              <div class="flex-shrink-0 piece-status">
                <span
                  :class="[
                    'status-badge px-2 py-1 text-xs font-medium rounded-full',
                    piece.status === 'completed'
                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                      : piece.status === 'in-progress'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
                  ]"
                >
                  {{ getStatusLabel(piece.status) }}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-3 piece-progress">
              <div
                class="flex-1 h-2 overflow-hidden bg-gray-200 rounded-full dark:bg-gray-700 progress-bar"
              >
                <div
                  class="h-full transition-all duration-300 bg-blue-500 progress-fill"
                  :style="{width: `${piece.progress}%`}"
                />
              </div>
              <span class="text-sm font-medium text-gray-600 dark:text-gray-400 progress-text"
                >{{ piece.progress }}%</span
              >
            </div>

            <div class="flex gap-6 text-sm text-gray-600 dark:text-gray-400 piece-details">
              <div class="flex items-center gap-1 detail-item">
                <CalendarIcon class="w-4 h-4" />
                <span>Iniciado: {{ formatDate(piece.startDate) }}</span>
              </div>
              <div class="flex items-center gap-1 detail-item">
                <ClockIcon class="w-4 h-4" />
                <span>Tiempo estimado: {{ piece.estimatedTime }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Skill Development -->
      <div class="space-y-4 skills-section">
        <h5 class="text-base font-semibold text-gray-900 dark:text-white section-title">
          Desarrollo de Habilidades
        </h5>

        <div class="space-y-4 skills-grid">
          <div v-for="skill in skills" :key="skill.name" class="space-y-2 skill-item">
            <div class="flex items-center justify-between skill-header">
              <span class="font-medium text-gray-900 dark:text-white skill-name">{{
                skill.name
              }}</span>
              <span class="text-sm font-semibold text-gray-600 dark:text-gray-400 skill-score"
                >{{ skill.score }}/10</span
              >
            </div>

            <div
              class="w-full h-2 overflow-hidden bg-gray-200 rounded-full dark:bg-gray-700 skill-bar"
            >
              <div
                class="h-full transition-all duration-300 skill-fill"
                :style="{
                  width: `${skill.score * 10}%`,
                  backgroundColor: getSkillColor(skill.score),
                }"
              />
            </div>

            <p class="text-sm text-gray-600 dark:text-gray-400 skill-note">{{ skill.note }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  MusicalNoteIcon,
  StarIcon,
  CalendarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/vue/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface RepertoireAnalysisData {
  piecesLearned: number
  progressRate: number
  difficulty: string
}

defineProps<{
  studentId: string
  data?: RepertoireAnalysisData
}>();

// Mock data
const currentPieces = [
  {
    id: 1,
    title: 'Für Elise',
    composer: 'L. van Beethoven',
    status: 'completed',
    progress: 100,
    startDate: new Date('2024-01-15'),
    estimatedTime: '6 semanas',
  },
  {
    id: 2,
    title: 'Moonlight Sonata (1er mov.)',
    composer: 'L. van Beethoven',
    status: 'in-progress',
    progress: 75,
    startDate: new Date('2024-02-01'),
    estimatedTime: '8 semanas',
  },
  {
    id: 3,
    title: 'Canon en Re',
    composer: 'J. Pachelbel',
    status: 'pending',
    progress: 25,
    startDate: new Date('2024-03-01'),
    estimatedTime: '4 semanas',
  },
];

const skills = [
  {
    name: 'Técnica',
    score: 7,
    note: 'Buen control de digitación, trabajar en velocidad',
  },
  {
    name: 'Interpretación',
    score: 8,
    note: 'Excelente expresión musical',
  },
  {
    name: 'Lectura',
    score: 6,
    note: 'Mejorar lectura a primera vista',
  },
  {
    name: 'Ritmo',
    score: 9,
    note: 'Excelente sentido rítmico',
  },
];

const getStatusLabel = (status: string): string => {
  switch (status) {
  case 'completed':
    return 'Completado';
  case 'in-progress':
    return 'En Progreso';
  case 'pending':
    return 'Pendiente';
  default:
    return status;
  }
};

const getSkillColor = (score: number): string => {
  if (score >= 8) return '#10b981'; // green-500
  if (score >= 6) return '#f59e0b'; // amber-500
  if (score >= 4) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
};

const formatDate = (date: Date): string => {
  return format(date, 'dd MMM yyyy', { locale: es });
};
</script>

<style scoped>
/* All @apply rules have been moved to the template directly or are handled by Tailwind's base/component styles. */
</style>
