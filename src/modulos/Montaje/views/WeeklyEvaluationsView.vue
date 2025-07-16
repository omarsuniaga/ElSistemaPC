<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">📅 Evaluaciones Semanales</h1>
          <p class="text-gray-600">{{ work.name }} - {{ work.composer }}</p>
          <p class="text-sm text-gray-500 mt-2">
            Registra el progreso semanal de los ensayos (cada sábado)
          </p>
        </div>
        <button
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          @click="showCreateModal = true"
        >
          ➕ Nueva Evaluación
        </button>
      </div>
    </div>

    <!-- Weekly Evaluations List -->
    <div class="space-y-4">
      <div
        v-for="evaluation in weeklyEvaluations"
        :key="evaluation.id"
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <!-- Week Info -->
          <div class="lg:w-64">
            <h3 class="text-lg font-bold text-gray-900 mb-1">
              Semana del {{ formatDate(evaluation.week) }}
            </h3>
            <p class="text-sm text-gray-500 mb-4">
              Registrado: {{ formatDate(evaluation.createdAt) }}
            </p>
            
            <div v-if="evaluation.comentarios" class="bg-gray-50 rounded-lg p-3">
              <h4 class="text-sm font-medium text-gray-700 mb-1">Comentarios:</h4>
              <p class="text-sm text-gray-600">{{ evaluation.comentarios }}</p>
            </div>
          </div>

          <!-- Evaluations Grid -->
          <div class="flex-1">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <!-- Ensayo General -->
              <div class="bg-blue-50 rounded-lg p-4">
                <h4 class="font-medium text-blue-800 mb-3 text-center">🎼 Ensayo General</h4>
                <div class="space-y-2">
                  <div 
                    v-for="(criterion, key) in EVALUATION_CRITERIA" 
                    :key="key"
                    class="flex justify-between items-center"
                  >
                    <span class="text-sm text-gray-700">{{ criterion.name }}:</span>
                    <div class="flex items-center gap-2">
                      <span 
                        class="text-sm font-medium px-2 py-1 rounded"
                        :class="getScoreColor(evaluation.ensayoGeneral[key])"
                      >
                        {{ evaluation.ensayoGeneral[key] || '-' }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="mt-3 pt-3 border-t border-blue-200">
                  <div class="text-center">
                    <div class="text-lg font-bold text-blue-600">
                      {{ getAverageScore(evaluation.ensayoGeneral).toFixed(1) }}
                    </div>
                    <div class="text-xs text-blue-500">Promedio</div>
                  </div>
                </div>
              </div>

              <!-- Ensayo Seccional -->
              <div class="bg-green-50 rounded-lg p-4">
                <h4 class="font-medium text-green-800 mb-3 text-center">🎵 Ensayo Seccional</h4>
                <div class="space-y-2">
                  <div 
                    v-for="(criterion, key) in EVALUATION_CRITERIA" 
                    :key="key"
                    class="flex justify-between items-center"
                  >
                    <span class="text-sm text-gray-700">{{ criterion.name }}:</span>
                    <div class="flex items-center gap-2">
                      <span 
                        class="text-sm font-medium px-2 py-1 rounded"
                        :class="getScoreColor(evaluation.ensayoSeccional[key])"
                      >
                        {{ evaluation.ensayoSeccional[key] || '-' }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="mt-3 pt-3 border-t border-green-200">
                  <div class="text-center">
                    <div class="text-lg font-bold text-green-600">
                      {{ getAverageScore(evaluation.ensayoSeccional).toFixed(1) }}
                    </div>
                    <div class="text-xs text-green-500">Promedio</div>
                  </div>
                </div>
              </div>

              <!-- Ensayo por Fila -->
              <div class="bg-purple-50 rounded-lg p-4">
                <h4 class="font-medium text-purple-800 mb-3 text-center">🎯 Ensayo por Fila</h4>
                <div class="space-y-2">
                  <div 
                    v-for="(criterion, key) in EVALUATION_CRITERIA" 
                    :key="key"
                    class="flex justify-between items-center"
                  >
                    <span class="text-sm text-gray-700">{{ criterion.name }}:</span>
                    <div class="flex items-center gap-2">
                      <span 
                        class="text-sm font-medium px-2 py-1 rounded"
                        :class="getScoreColor(evaluation.ensayoPorFila[key])"
                      >
                        {{ evaluation.ensayoPorFila[key] || '-' }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="mt-3 pt-3 border-t border-purple-200">
                  <div class="text-center">
                    <div class="text-lg font-bold text-purple-600">
                      {{ getAverageScore(evaluation.ensayoPorFila).toFixed(1) }}
                    </div>
                    <div class="text-xs text-purple-500">Promedio</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="lg:w-24 flex lg:flex-col gap-2">
            <button
              class="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              @click="editEvaluation(evaluation)"
            >
              ✏️ Editar
            </button>
            <button
              class="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
              @click="deleteEvaluation(evaluation.id)"
            >
              🗑️ Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="weeklyEvaluations.length === 0" class="text-center py-12">
      <div class="text-6xl mb-4">📅</div>
      <h3 class="text-xl font-semibold text-gray-700 mb-2">No hay evaluaciones semanales</h3>
      <p class="text-gray-500 mb-6">Comienza registrando tu primera evaluación semanal</p>
      <button
        class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
        @click="showCreateModal = true"
      >
        ➕ Primera Evaluación
      </button>
    </div>

    <!-- Create/Edit Modal -->
    <WeeklyEvaluationModal
      v-if="showCreateModal || editingEvaluation"
      :work="work"
      :evaluation="editingEvaluation"
      @evaluation-saved="onEvaluationSaved"
      @close="closeModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import WeeklyEvaluationModal from '../components/WeeklyEvaluationModal.vue';
import type { MusicalWork, WeeklyEvaluation } from '../types/heatmap';
import { EVALUATION_CRITERIA } from '../types/heatmap';

const props = defineProps<{
  work: MusicalWork
}>();

const weeklyEvaluations = ref<WeeklyEvaluation[]>([]);
const showCreateModal = ref(false);
const editingEvaluation = ref<WeeklyEvaluation | null>(null);

// Get color class based on score
const getScoreColor = (score: number): string => {
  if (score === 0 || !score) return 'bg-gray-100 text-gray-400';
  if (score <= 2) return 'bg-red-100 text-red-700';
  if (score === 3) return 'bg-yellow-100 text-yellow-700';
  if (score >= 4) return 'bg-green-100 text-green-700';
  return 'bg-gray-100 text-gray-600';
};

// Calculate average score for an evaluation type
const getAverageScore = (evaluationData: any): number => {
  const scores = Object.keys(EVALUATION_CRITERIA)
    .map(key => evaluationData[key])
    .filter(score => score > 0);
  
  if (scores.length === 0) return 0;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Edit evaluation
const editEvaluation = (evaluation: WeeklyEvaluation) => {
  editingEvaluation.value = evaluation;
};

// Delete evaluation
const deleteEvaluation = async (evaluationId: string) => {
  if (confirm('¿Estás seguro de que quieres eliminar esta evaluación semanal?')) {
    try {
      // Here you would delete from your backend/Firebase
      weeklyEvaluations.value = weeklyEvaluations.value.filter(e => e.id !== evaluationId);
      console.log('Evaluation deleted:', evaluationId);
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      alert('Error al eliminar la evaluación.');
    }
  }
};

// Handle evaluation saved
const onEvaluationSaved = (evaluation: WeeklyEvaluation) => {
  if (editingEvaluation.value) {
    // Update existing
    const index = weeklyEvaluations.value.findIndex(e => e.id === evaluation.id);
    if (index !== -1) {
      weeklyEvaluations.value[index] = evaluation;
    }
  } else {
    // Add new
    weeklyEvaluations.value.unshift(evaluation);
  }
  closeModal();
};

// Close modal
const closeModal = () => {
  showCreateModal.value = false;
  editingEvaluation.value = null;
};

// Load evaluations
const loadEvaluations = async () => {
  try {
    // Here you would load from your backend/Firebase
    // For now, we'll create some sample data
    weeklyEvaluations.value = [
      {
        id: 'eval1',
        workId: props.work.id,
        projectId: 'project_1',
        evaluatorId: 'user_1',
        week: '2024-01-13', // Saturday
        ensayoGeneral: {
          afinacion: 4,
          articulacion: 3,
          ritmo: 4,
          cohesion: 3,
          dinamica: 4,
          memorizacion: 2,
        },
        ensayoSeccional: {
          afinacion: 4,
          articulacion: 4,
          ritmo: 4,
          cohesion: 4,
          dinamica: 3,
          memorizacion: 3,
        },
        ensayoPorFila: {
          afinacion: 5,
          articulacion: 4,
          ritmo: 5,
          cohesion: 4,
          dinamica: 4,
          memorizacion: 3,
        },
        comentarios: 'Excelente progreso en la sección de cuerdas. Los vientos necesitan más trabajo en la memorización.',
        objectives: [],
        achievements: [],
        challenges: [],
        nextWeekGoals: [],
        attendanceRate: 0,
        overallMood: 0,
        energyLevel: 0,
        focusLevel: 0,
        createdAt: '2024-01-13T10:00:00Z',
        updatedAt: '2024-01-13T10:00:00Z',
      },
    ];
  } catch (error) {
    console.error('Error loading evaluations:', error);
  }
};

onMounted(() => {
  loadEvaluations();
});
</script>