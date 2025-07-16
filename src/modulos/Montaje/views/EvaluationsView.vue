<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">📋 Evaluaciones por Instrumento</h1>
      <p class="text-gray-600">{{ work.name }} - {{ work.composer }}</p>
      <p class="text-sm text-gray-500 mt-2">
        Evalúa el progreso de cada instrumento en los diferentes criterios musicales
      </p>
    </div>

    <!-- Evaluation Table -->
    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                Sección/Instrumento
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                Obra(s) evaluada(s)
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                Compases evaluados
              </th>
              <th 
                v-for="(criterion, key) in EVALUATION_CRITERIA" 
                :key="key"
                class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]"
              >
                {{ criterion.name }}<br>
                <span class="text-xs font-normal">(1–5)</span>
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                Comentarios breves
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                Tiempo dedicado<br>
                <span class="text-xs font-normal">(1-5)</span>
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr 
              v-for="instrument in work.instruments" 
              :key="instrument.id"
              class="hover:bg-gray-50"
            >
              <!-- Instrument Name -->
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-200">
                {{ instrument.name }}
              </td>
              
              <!-- Work Name -->
              <td class="px-4 py-4 text-center">
                <span class="text-sm text-gray-600">{{ work.name }}</span>
              </td>
              
              <!-- Measures Count -->
              <td class="px-4 py-4 text-center">
                <span class="text-sm font-medium text-blue-600">{{ work.totalMeasures }}</span>
              </td>
              
              <!-- Evaluation Criteria -->
              <td 
                v-for="(criterion, key) in EVALUATION_CRITERIA" 
                :key="key"
                class="px-4 py-4 text-center"
              >
                <div class="flex justify-center gap-1">
                  <button
                    v-for="score in 5"
                    :key="score"
                    :class="[
                      'w-7 h-7 rounded-full text-xs font-bold border transition-colors',
                      evaluations[instrument.id][key] === score 
                        ? getScoreButtonColor(score) 
                        : 'border-gray-200 hover:bg-gray-100'
                    ]"
                    :title="criterion.scales[score]"
                    @click="setScore(instrument.id, key, score)"
                  >
                    {{ score }}
                  </button>
                </div>
              </td>
              
              <!-- Comments -->
              <td class="px-4 py-4">
                <div class="flex items-center gap-2">
                  <textarea
                    v-model="evaluations[instrument.id].comentarios"
                    class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="2"
                    placeholder="Comentarios..."
                    @blur="saveEvaluation(instrument.id, 'comentarios', evaluations[instrument.id].comentarios)"
                  ></textarea>
                  <button
                    class="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                    title="Comentarios detallados"
                    @click="openCommentsModal(instrument)"
                  >
                    📝
                  </button>
                </div>
              </td>
              
              <!-- Time Dedicated -->
              <td class="px-4 py-4 text-center">
                <div class="flex justify-center gap-1">
                  <button
                    v-for="score in 5"
                    :key="score"
                    :class="[
                      'w-7 h-7 rounded-full text-xs font-bold border transition-colors',
                      evaluations[instrument.id].tiempoDedicado === score 
                        ? getScoreButtonColor(score) 
                        : 'border-gray-200 hover:bg-gray-100'
                    ]"
                    :title="getTiempoDedicadoLabel(score)"
                    @click="setScore(instrument.id, 'tiempoDedicado', score)"
                  >
                    {{ score }}
                  </button>
                </div>
              </td>

              <!-- Actions -->
              <td class="px-4 py-4 text-center">
                <div class="flex flex-col gap-1">
                  <button
                    class="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
                    title="Evaluación detallada"
                    @click="openDetailModal(instrument)"
                  >
                    📊 Detalle
                  </button>
                  <button
                    class="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                    title="Limpiar evaluación"
                    @click="clearInstrumentEvaluation(instrument.id)"
                  >
                    🗑️ Limpiar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Summary Statistics -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h2 class="text-lg font-bold text-gray-900 mb-4">📊 Resumen de Evaluaciones</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="(criterion, key) in EVALUATION_CRITERIA" 
          :key="key"
          class="bg-gray-50 rounded-lg p-4"
        >
          <h3 class="font-medium text-gray-700 mb-2">{{ criterion.name }}</h3>
          <div class="text-2xl font-bold text-blue-600 mb-1">
            {{ getAverageScore(key).toFixed(1) }}
          </div>
          <div class="text-sm text-gray-500">Promedio general</div>
          
          <!-- Progress bar -->
          <div class="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              class="h-2 rounded-full transition-all duration-300"
              :class="getProgressBarColor(getAverageScore(key))"
              :style="{ width: `${(getAverageScore(key) / 5) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Criteria Legend -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h2 class="text-lg font-bold text-gray-900 mb-4">📖 Criterios de Evaluación</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          v-for="(criterion, key) in EVALUATION_CRITERIA" 
          :key="key"
          class="border border-gray-200 rounded-lg p-4"
        >
          <h3 class="font-medium text-gray-700 mb-2">{{ criterion.name }}</h3>
          <div class="space-y-1 text-sm">
            <div 
              v-for="(description, score) in criterion.scales" 
              :key="score"
              class="flex items-center gap-2"
            >
              <span class="font-medium text-gray-600 w-4">{{ score }}:</span>
              <span class="text-gray-700">{{ description }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Comments Modal -->
    <div v-if="showCommentsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <h3 class="text-lg font-bold mb-4">
          📝 Comentarios Detallados - {{ selectedInstrument?.name }}
        </h3>
        
        <div class="space-y-4">
          <!-- General Comments -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Comentarios Generales
            </label>
            <textarea
              v-model="detailedComments.general"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
              placeholder="Observaciones generales sobre el instrumento..."
            ></textarea>
          </div>

          <!-- Strengths -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Fortalezas
            </label>
            <textarea
              v-model="detailedComments.strengths"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="2"
              placeholder="Aspectos positivos y fortalezas..."
            ></textarea>
          </div>

          <!-- Areas for Improvement -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Áreas de Mejora
            </label>
            <textarea
              v-model="detailedComments.improvements"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="2"
              placeholder="Aspectos a mejorar y recomendaciones..."
            ></textarea>
          </div>

          <!-- Specific Notes -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Notas Específicas
            </label>
            <textarea
              v-model="detailedComments.specific"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="2"
              placeholder="Notas específicas sobre técnicas, pasajes difíciles, etc..."
            ></textarea>
          </div>
        </div>
        
        <div class="flex gap-3 mt-6">
          <button
            class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            @click="saveDetailedComments"
          >
            💾 Guardar Comentarios
          </button>
          <button
            class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            @click="closeCommentsModal"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="showDetailModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-bold mb-4">
          📊 Evaluación Detallada - {{ selectedInstrument?.name }}
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Current Scores -->
          <div class="bg-blue-50 rounded-lg p-4">
            <h4 class="font-medium text-blue-800 mb-3">Puntuaciones Actuales</h4>
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
                    :class="getScoreColor(evaluations[selectedInstrument?.id || ''][key])"
                  >
                    {{ evaluations[selectedInstrument?.id || ''][key] || '-' }}
                  </span>
                  <span class="text-xs text-gray-500">
                    {{ evaluations[selectedInstrument?.id || ''][key] ? 
                       EVALUATION_CRITERIA[key].scales[evaluations[selectedInstrument?.id || ''][key]] : 
                       'Sin evaluar' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Additional Information -->
          <div class="bg-green-50 rounded-lg p-4">
            <h4 class="font-medium text-green-800 mb-3">Información Adicional</h4>
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Tiempo Dedicado (horas por semana)
                </label>
                <input
                  v-model.number="detailedInfo.hoursPerWeek"
                  type="number"
                  min="0"
                  max="40"
                  step="0.5"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: 3.5"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Dificultad Percibida (1-10)
                </label>
                <input
                  v-model.number="detailedInfo.difficulty"
                  type="number"
                  min="1"
                  max="10"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="1 = Muy fácil, 10 = Muy difícil"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Progreso Esperado (%)
                </label>
                <input
                  v-model.number="detailedInfo.expectedProgress"
                  type="number"
                  min="0"
                  max="100"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: 75"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Próxima Fecha de Evaluación
                </label>
                <input
                  v-model="detailedInfo.nextEvaluation"
                  type="date"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex gap-3 mt-6">
          <button
            class="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            @click="saveDetailedInfo"
          >
            💾 Guardar Información
          </button>
          <button
            class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            @click="closeDetailModal"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import type { MusicalWork, Instrument } from '../types/heatmap';
import { EVALUATION_CRITERIA } from '../types/heatmap';

const props = defineProps<{
  work: MusicalWork
}>();

// Initialize evaluations for each instrument
const evaluations = reactive<Record<string, any>>({});

// Modal states
const showCommentsModal = ref(false);
const showDetailModal = ref(false);
const selectedInstrument = ref<Instrument | null>(null);

// Detailed comments
const detailedComments = reactive({
  general: '',
  strengths: '',
  improvements: '',
  specific: '',
});

// Detailed information
const detailedInfo = reactive({
  hoursPerWeek: 0,
  difficulty: 5,
  expectedProgress: 0,
  nextEvaluation: '',
});

// Initialize evaluations
const initializeEvaluations = () => {
  props.work.instruments.forEach(instrument => {
    evaluations[instrument.id] = {
      afinacion: 0,
      articulacion: 0,
      ritmo: 0,
      cohesion: 0,
      dinamica: 0,
      memorizacion: 0,
      comentarios: '',
      tiempoDedicado: 0,
      detailedComments: {
        general: '',
        strengths: '',
        improvements: '',
        specific: '',
      },
      detailedInfo: {
        hoursPerWeek: 0,
        difficulty: 5,
        expectedProgress: 0,
        nextEvaluation: '',
      },
    };
  });
};

// Initialize evaluations immediately during setup
initializeEvaluations();

// Set score for a specific criterion
const setScore = (instrumentId: string, criterion: string, score: number) => {
  evaluations[instrumentId][criterion] = score;
  saveEvaluation(instrumentId, criterion, score);
};

// Get color class based on score
const getScoreColor = (score: number): string => {
  if (score === 0) return 'text-gray-400';
  if (score <= 2) return 'text-red-600 bg-red-50';
  if (score === 3) return 'text-yellow-600 bg-yellow-50';
  if (score >= 4) return 'text-green-600 bg-green-50';
  return 'text-gray-600';
};

// Get button color based on score
const getScoreButtonColor = (score: number): string => {
  if (score <= 2) return 'bg-red-500 text-white border-red-500';
  if (score === 3) return 'bg-yellow-500 text-white border-yellow-500';
  if (score >= 4) return 'bg-green-500 text-white border-green-500';
  return 'bg-gray-500 text-white border-gray-500';
};

// Get progress bar color
const getProgressBarColor = (score: number): string => {
  if (score <= 2) return 'bg-red-500';
  if (score === 3) return 'bg-yellow-500';
  if (score >= 4) return 'bg-green-500';
  return 'bg-gray-500';
};

// Get tiempo dedicado label
const getTiempoDedicadoLabel = (score: number): string => {
  const labels = {
    1: 'Muy poco',
    2: 'Poco',
    3: 'Moderado',
    4: 'Bastante',
    5: 'Mucho',
  };
  return labels[score] || '';
};

// Calculate average score for a criterion
const getAverageScore = (criterion: string): number => {
  const scores = Object.values(evaluations)
    .map(evaluationItem => evaluationItem[criterion])
    .filter(score => score > 0);
  
  if (scores.length === 0) return 0;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
};

// Save evaluation (simulate API call)
const saveEvaluation = async (instrumentId: string, criterion: string, value: any) => {
  try {
    // Here you would save to your backend/Firebase
    console.log('Saving evaluation:', { instrumentId, criterion, value });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Show success feedback (optional)
    // You could add a toast notification here
  } catch (error) {
    console.error('Error saving evaluation:', error);
  }
};

// Clear instrument evaluation
const clearInstrumentEvaluation = (instrumentId: string) => {
  if (confirm('¿Estás seguro de que quieres limpiar toda la evaluación de este instrumento?')) {
    Object.keys(EVALUATION_CRITERIA).forEach(key => {
      evaluations[instrumentId][key] = 0;
    });
    evaluations[instrumentId].comentarios = '';
    evaluations[instrumentId].tiempoDedicado = 0;
    evaluations[instrumentId].detailedComments = {
      general: '',
      strengths: '',
      improvements: '',
      specific: '',
    };
    evaluations[instrumentId].detailedInfo = {
      hoursPerWeek: 0,
      difficulty: 5,
      expectedProgress: 0,
      nextEvaluation: '',
    };
  }
};

// Comments modal functions
const openCommentsModal = (instrument: Instrument) => {
  selectedInstrument.value = instrument;
  const instrumentEval = evaluations[instrument.id];
  if (instrumentEval.detailedComments) {
    Object.assign(detailedComments, instrumentEval.detailedComments);
  }
  showCommentsModal.value = true;
};

const closeCommentsModal = () => {
  showCommentsModal.value = false;
  selectedInstrument.value = null;
  Object.assign(detailedComments, {
    general: '',
    strengths: '',
    improvements: '',
    specific: '',
  });
};

const saveDetailedComments = async () => {
  if (!selectedInstrument.value) return;
  
  evaluations[selectedInstrument.value.id].detailedComments = { ...detailedComments };
  
  // Update the brief comments field with a summary
  const summary = [
    detailedComments.general,
    detailedComments.strengths ? `Fortalezas: ${detailedComments.strengths}` : '',
    detailedComments.improvements ? `Mejoras: ${detailedComments.improvements}` : '',
  ].filter(Boolean).join('. ').substring(0, 100) + '...';
  
  evaluations[selectedInstrument.value.id].comentarios = summary;
  
  await saveEvaluation(selectedInstrument.value.id, 'detailedComments', detailedComments);
  closeCommentsModal();
};

// Detail modal functions
const openDetailModal = (instrument: Instrument) => {
  selectedInstrument.value = instrument;
  const instrumentEval = evaluations[instrument.id];
  if (instrumentEval.detailedInfo) {
    Object.assign(detailedInfo, instrumentEval.detailedInfo);
  }
  showDetailModal.value = true;
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedInstrument.value = null;
  Object.assign(detailedInfo, {
    hoursPerWeek: 0,
    difficulty: 5,
    expectedProgress: 0,
    nextEvaluation: '',
  });
};

const saveDetailedInfo = async () => {
  if (!selectedInstrument.value) return;
  
  evaluations[selectedInstrument.value.id].detailedInfo = { ...detailedInfo };
  await saveEvaluation(selectedInstrument.value.id, 'detailedInfo', detailedInfo);
  closeDetailModal();
};
</script>

<style scoped>
/* Custom scrollbar for table */
.overflow-x-auto::-webkit-scrollbar {
  height: 8px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>