<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg p-6 w-full max-w-7xl max-h-[95vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-2xl font-bold text-gray-900">📋 Centro de Evaluación</h3>
        <button
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          @click="$emit('close')"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- Navigation Tabs -->
      <div class="flex border-b border-gray-200 mb-6 overflow-x-auto">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="[
            'px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap',
            activeTab === tab.key
              ? 'border-blue-500 text-blue-600 bg-blue-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          ]"
          @click="activeTab = tab.key"
        >
          <span class="text-lg mr-2">{{ tab.icon }}</span>
          {{ tab.label }}
        </button>
      </div>

      <!-- Quick Evaluation Tab -->
      <div v-if="activeTab === 'quick'" class="space-y-8">
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <h4 class="text-xl font-bold text-blue-800 mb-2">⚡ Evaluación Rápida</h4>
          <p class="text-blue-600">Evalúa rápidamente el progreso de instrumentos específicos con una interfaz intuitiva</p>
        </div>

        <!-- Work Selection -->
        <div class="bg-white border border-gray-200 rounded-xl p-6">
          <h5 class="text-lg font-semibold text-gray-900 mb-4">🎼 Seleccionar Obra</h5>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              v-for="work in availableWorks"
              :key="work.id"
              :class="[
                'p-4 border-2 rounded-lg text-left transition-all duration-200 hover:shadow-md',
                quickEval.workId === work.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300'
              ]"
              @click="selectWork(work.id)"
            >
              <div class="font-semibold text-gray-900">{{ work.name }}</div>
              <div class="text-sm text-gray-600">{{ work.composer }}</div>
              <div class="text-xs text-gray-500 mt-1">{{ work.instruments.length }} instrumentos</div>
            </button>
          </div>
        </div>

        <!-- Instrument Selection -->
        <div v-if="quickEval.workId" class="bg-white border border-gray-200 rounded-xl p-6">
          <h5 class="text-lg font-semibold text-gray-900 mb-4">🎻 Seleccionar Instrumento</h5>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            <button
              v-for="instrument in selectedWorkInstruments"
              :key="instrument.id"
              :class="[
                'p-3 border-2 rounded-lg text-center transition-all duration-200 hover:shadow-md',
                quickEval.instrumentId === instrument.id
                  ? 'border-green-500 bg-green-50 shadow-md'
                  : 'border-gray-200 hover:border-green-300'
              ]"
              @click="selectInstrument(instrument.id)"
            >
              <div class="font-medium text-gray-900 text-sm">{{ instrument.name }}</div>
              <div class="text-xs text-gray-500">{{ instrument.family }}</div>
              <div v-if="instrument.quantity" class="text-xs text-blue-600 mt-1">
                {{ instrument.quantity }} {{ instrument.quantity === 1 ? 'músico' : 'músicos' }}
              </div>
            </button>
          </div>
        </div>

        <!-- Evaluation Criteria -->
        <div v-if="quickEval.workId && quickEval.instrumentId" class="bg-white border border-gray-200 rounded-xl p-6">
          <h5 class="text-lg font-semibold text-gray-900 mb-6">📊 Criterios de Evaluación</h5>
          
          <div class="space-y-6">
            <div 
              v-for="(criterion, key) in EVALUATION_CRITERIA" 
              :key="key"
              class="bg-gray-50 rounded-lg p-4"
            >
              <div class="flex items-center justify-between mb-3">
                <h6 class="font-medium text-gray-900">{{ criterion.name }}</h6>
                <span 
                  :class="[
                    'px-3 py-1 rounded-full text-sm font-medium',
                    getScoreColor(quickEval.scores[key])
                  ]"
                >
                  {{ quickEval.scores[key] > 0 ? `${quickEval.scores[key]}/5` : 'Sin evaluar' }}
                </span>
              </div>
              
              <div class="grid grid-cols-5 gap-2">
                <button
                  v-for="score in [1, 2, 3, 4, 5]"
                  :key="score"
                  :class="[
                    'p-3 rounded-lg border-2 transition-all duration-200 text-center hover:shadow-md',
                    quickEval.scores[key] === score
                      ? 'border-blue-500 bg-blue-500 text-white shadow-md'
                      : 'border-gray-200 hover:border-blue-300 bg-white'
                  ]"
                  @click="setScore(key, score)"
                >
                  <div class="font-bold text-lg">{{ score }}</div>
                  <div class="text-xs">{{ getScoreLabel(score) }}</div>
                </button>
              </div>
              
              <div class="mt-2 text-xs text-gray-600">
                {{ criterion.scales[quickEval.scores[key]] || 'Selecciona una puntuación' }}
              </div>
            </div>
          </div>

          <!-- Comments Section -->
          <div class="mt-6 bg-yellow-50 rounded-lg p-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">💬 Comentarios y Observaciones</label>
            <textarea
              v-model="quickEval.comments"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows="3"
              placeholder="Escribe observaciones, fortalezas, áreas de mejora, recomendaciones específicas..."
            ></textarea>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-4 mt-6">
            <button
              :disabled="!canSaveEvaluation || saving"
              :class="[
                'flex-1 px-6 py-3 rounded-lg font-medium transition-colors',
                canSaveEvaluation && !saving
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              ]"
              @click="saveQuickEvaluation"
            >
              <span v-if="saving" class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </span>
              <span v-else>💾 Guardar Evaluación</span>
            </button>
            
            <button
              class="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              @click="resetQuickEvaluation"
            >
              🔄 Reiniciar
            </button>
          </div>
        </div>

        <!-- Progress Indicator -->
        <div v-if="quickEval.workId || quickEval.instrumentId" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <div :class="quickEval.workId ? 'w-3 h-3 bg-green-500 rounded-full' : 'w-3 h-3 bg-gray-300 rounded-full'"></div>
              <span class="text-sm">Obra seleccionada</span>
            </div>
            <div class="flex items-center gap-2">
              <div :class="quickEval.instrumentId ? 'w-3 h-3 bg-green-500 rounded-full' : 'w-3 h-3 bg-gray-300 rounded-full'"></div>
              <span class="text-sm">Instrumento seleccionado</span>
            </div>
            <div class="flex items-center gap-2">
              <div :class="hasScores ? 'w-3 h-3 bg-green-500 rounded-full' : 'w-3 h-3 bg-gray-300 rounded-full'"></div>
              <span class="text-sm">Criterios evaluados</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Batch Evaluation Tab -->
      <div v-if="activeTab === 'batch'" class="space-y-8">
        <div class="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
          <h4 class="text-xl font-bold text-purple-800 mb-2">📊 Evaluación por Lotes</h4>
          <p class="text-purple-600">Evalúa múltiples instrumentos de una obra simultáneamente para mayor eficiencia</p>
        </div>

        <!-- Work Selection for Batch -->
        <div class="bg-white border border-gray-200 rounded-xl p-6">
          <h5 class="text-lg font-semibold text-gray-900 mb-4">🎼 Seleccionar Obra</h5>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              v-for="work in availableWorks"
              :key="work.id"
              :class="[
                'p-4 border-2 rounded-lg text-left transition-all duration-200 hover:shadow-md',
                batchEval.workId === work.id
                  ? 'border-purple-500 bg-purple-50 shadow-md'
                  : 'border-gray-200 hover:border-purple-300'
              ]"
              @click="selectBatchWork(work.id)"
            >
              <div class="font-semibold text-gray-900">{{ work.name }}</div>
              <div class="text-sm text-gray-600">{{ work.composer }}</div>
              <div class="text-xs text-gray-500 mt-1">{{ work.instruments.length }} instrumentos</div>
            </button>
          </div>
        </div>

        <!-- Instrument Selection for Batch -->
        <div v-if="batchEval.workId" class="bg-white border border-gray-200 rounded-xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h5 class="text-lg font-semibold text-gray-900">🎻 Seleccionar Instrumentos</h5>
            <div class="flex gap-2">
              <button 
                class="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm" 
                @click="selectAllInstruments"
              >
                Seleccionar Todos
              </button>
              <button 
                class="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm" 
                @click="clearInstrumentSelection"
              >
                Limpiar Selección
              </button>
            </div>
          </div>
          
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            <button
              v-for="instrument in selectedWorkInstruments"
              :key="instrument.id"
              :class="[
                'p-3 border-2 rounded-lg text-center transition-all duration-200 hover:shadow-md',
                selectedInstruments.includes(instrument.id)
                  ? 'border-purple-500 bg-purple-50 shadow-md'
                  : 'border-gray-200 hover:border-purple-300'
              ]"
              @click="toggleInstrumentSelection(instrument.id)"
            >
              <div class="font-medium text-gray-900 text-sm">{{ instrument.name }}</div>
              <div class="text-xs text-gray-500">{{ instrument.family }}</div>
              <div v-if="instrument.quantity" class="text-xs text-purple-600 mt-1">
                {{ instrument.quantity }} {{ instrument.quantity === 1 ? 'músico' : 'músicos' }}
              </div>
            </button>
          </div>
          
          <div v-if="selectedInstruments.length > 0" class="mt-4 bg-purple-50 rounded-lg p-3 text-sm text-purple-700">
            {{ selectedInstruments.length }} instrumentos seleccionados
          </div>
        </div>

        <!-- Batch Evaluation Criteria -->
        <div v-if="batchEval.workId && selectedInstruments.length > 0" class="bg-white border border-gray-200 rounded-xl p-6">
          <h5 class="text-lg font-semibold text-gray-900 mb-6">📊 Criterios de Evaluación en Lote</h5>
          
          <div class="space-y-6">
            <div 
              v-for="(criterion, key) in EVALUATION_CRITERIA" 
              :key="key"
              class="bg-gray-50 rounded-lg p-4"
            >
              <div class="flex items-center justify-between mb-3">
                <h6 class="font-medium text-gray-900">{{ criterion.name }}</h6>
                <span 
                  :class="[
                    'px-3 py-1 rounded-full text-sm font-medium',
                    getScoreColor(batchEval.currentScores[key])
                  ]"
                >
                  {{ batchEval.currentScores[key] > 0 ? `${batchEval.currentScores[key]}/5` : 'Sin evaluar' }}
                </span>
              </div>
              
              <div class="grid grid-cols-5 gap-2">
                <button
                  v-for="score in [1, 2, 3, 4, 5]"
                  :key="score"
                  :class="[
                    'p-3 rounded-lg border-2 transition-all duration-200 text-center hover:shadow-md',
                    batchEval.currentScores[key] === score
                      ? 'border-purple-500 bg-purple-500 text-white shadow-md'
                      : 'border-gray-200 hover:border-purple-300 bg-white'
                  ]"
                  @click="setBatchScore(key, score)"
                >
                  <div class="font-bold text-lg">{{ score }}</div>
                  <div class="text-xs">{{ getScoreLabel(score) }}</div>
                </button>
              </div>
              
              <div class="mt-2 text-xs text-gray-600">
                {{ criterion.scales[batchEval.currentScores[key]] || 'Selecciona una puntuación' }}
              </div>
            </div>
          </div>

          <!-- Comments Section for Batch -->
          <div class="mt-6 bg-purple-50 rounded-lg p-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">💬 Comentarios Generales para Todos los Instrumentos Seleccionados</label>
            <textarea
              v-model="batchEval.comments"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
              rows="3"
              placeholder="Escribe observaciones que apliquen a todos los instrumentos seleccionados..."
            ></textarea>
          </div>

          <!-- Action Buttons for Batch -->
          <div class="flex gap-4 mt-6">
            <button
              :disabled="!canApplyBatch || saving"
              :class="[
                'flex-1 px-6 py-3 rounded-lg font-medium transition-colors',
                canApplyBatch && !saving
                  ? 'bg-purple-500 text-white hover:bg-purple-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              ]"
              @click="applyBatchScores"
            >
              <span v-if="saving" class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Aplicando...
              </span>
              <span v-else>✓ Aplicar a {{ selectedInstruments.length }} instrumentos</span>
            </button>
            
            <button
              class="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              @click="resetBatchScores"
            >
              🔄 Reiniciar
            </button>
          </div>
        </div>

        <!-- Batch Evaluation Summary -->
        <div v-if="batchEval.workId && Object.keys(batchEval.scores).length > 0" class="bg-white border border-gray-200 rounded-xl p-6">
          <h5 class="text-lg font-semibold text-gray-900 mb-4">📋 Resumen de Evaluaciones</h5>
          
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instrumento</th>
                  <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Criterios Evaluados</th>
                  <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Promedio</th>
                  <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr 
                  v-for="instrumentId in Object.keys(batchEval.scores)"
                  :key="instrumentId"
                  class="hover:bg-gray-50"
                >
                  <td class="px-4 py-3 whitespace-nowrap">
                    <div class="font-medium text-gray-900">{{ getInstrumentName(instrumentId) }}</div>
                    <div class="text-xs text-gray-500">{{ getInstrumentFamily(instrumentId) }}</div>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <div class="flex justify-center gap-1">
                      <span 
                        v-for="(criterion, key) in EVALUATION_CRITERIA"
                        :key="key"
                        :class="[
                          'w-2 h-2 rounded-full',
                          batchEval.scores[instrumentId][key] > 0 ? 'bg-green-500' : 'bg-gray-300'
                        ]"
                        :title="criterion.name"
                      ></span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span 
                      :class="[
                        'px-2 py-1 rounded-full text-xs font-medium',
                        getScoreColor(getAverageScore(batchEval.scores[instrumentId]))
                      ]"
                    >
                      {{ getAverageScore(batchEval.scores[instrumentId]).toFixed(1) }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <button
                      class="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-xs mr-1"
                      @click="editBatchInstrument(instrumentId)"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      class="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-xs"
                      @click="removeBatchInstrument(instrumentId)"
                    >
                      🗑️ Quitar
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex gap-4 mt-6">
            <button
              :disabled="!canSaveBatch || saving"
              :class="[
                'flex-1 px-6 py-3 rounded-lg font-medium transition-colors',
                canSaveBatch && !saving
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              ]"
              @click="saveBatchEvaluation"
            >
              <span v-if="saving">Guardando...</span>
              <span v-else>💾 Guardar Todas las Evaluaciones</span>
            </button>
            
            <button
              class="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              @click="resetBatchEvaluation"
            >
              🔄 Reiniciar Todo
            </button>
          </div>
        </div>
      </div>

      <!-- Templates Tab -->
      <div v-if="activeTab === 'templates'" class="space-y-6">
        <div class="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <h4 class="text-xl font-bold text-green-800 mb-2">📋 Plantillas de Evaluación</h4>
          <p class="text-green-600">Crea y usa plantillas para evaluaciones recurrentes y estandariza tu proceso</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="template in evaluationTemplates"
            :key="template.id"
            class="bg-white border border-gray-200 rounded-xl p-6 hover:border-green-300 hover:shadow-md transition-all cursor-pointer"
            @click="useTemplate(template)"
          >
            <div class="flex items-center justify-between mb-4">
              <h5 class="font-semibold text-gray-900">{{ template.name }}</h5>
              <span class="text-2xl">📋</span>
            </div>
            <p class="text-sm text-gray-600 mb-4">{{ template.description }}</p>
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span>{{ template.criteria.length }} criterios</span>
              <span>{{ template.usageCount }} usos</span>
            </div>
            <button class="w-full mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
              Usar Plantilla
            </button>
          </div>

          <div 
            class="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center hover:border-green-400 hover:bg-green-50 transition-colors cursor-pointer"
            @click="showCreateTemplate = true"
          >
            <div class="text-4xl mb-4">➕</div>
            <span class="text-lg font-medium text-gray-600">Nueva Plantilla</span>
            <span class="text-sm text-gray-500 mt-2">Crear plantilla personalizada</span>
          </div>
        </div>
      </div>

      <!-- History Tab -->
      <div v-if="activeTab === 'history'" class="space-y-6">
        <div class="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6">
          <h4 class="text-xl font-bold text-orange-800 mb-2">📚 Historial de Evaluaciones</h4>
          <p class="text-orange-600">Revisa y analiza evaluaciones anteriores para seguimiento del progreso</p>
        </div>

        <div class="space-y-4">
          <div 
            v-for="evaluation in recentEvaluations"
            :key="evaluation.id"
            class="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
          >
            <div class="flex items-center justify-between mb-4">
              <div>
                <h5 class="font-semibold text-gray-900">{{ evaluation.workName }} - {{ evaluation.instrumentName }}</h5>
                <p class="text-sm text-gray-500">{{ formatDate(evaluation.date) }}</p>
              </div>
              <div class="flex gap-2">
                <button class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors">
                  👁️ Ver
                </button>
                <button class="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors">
                  📊 Comparar
                </button>
              </div>
            </div>
            
            <div class="grid grid-cols-3 md:grid-cols-6 gap-4">
              <div 
                v-for="(score, criterion) in evaluation.scores" 
                :key="criterion"
                class="text-center"
              >
                <div class="text-xs font-medium text-gray-600 mb-1">{{ getCriterionLabel(criterion) }}</div>
                <div 
                  :class="[
                    'text-lg font-bold px-2 py-1 rounded',
                    getScoreColor(score)
                  ]"
                >
                  {{ score }}/5
                </div>
              </div>
            </div>
            
            <div v-if="evaluation.comments" class="mt-4 p-3 bg-gray-50 rounded-lg">
              <p class="text-sm text-gray-700">{{ evaluation.comments }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue';
import { useMusicalWorks } from '../composables/useHeatMapProjects';
import { EVALUATION_CRITERIA } from '../types/heatmap';
import { doc, collection, addDoc, updateDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../firebase';

const emit = defineEmits<{
  close: []
}>();

const { works } = useMusicalWorks();
const activeTab = ref('quick');
const saving = ref(false);
const showCreateTemplate = ref(false);

const tabs = [
  { key: 'quick', label: 'Evaluación Rápida', icon: '⚡' },
  { key: 'batch', label: 'Por Lotes', icon: '📊' },
  { key: 'templates', label: 'Plantillas', icon: '📋' },
  { key: 'history', label: 'Historial', icon: '📚' },
];

// Quick evaluation state
const quickEval = reactive({
  workId: '',
  instrumentId: '',
  scores: {
    afinacion: 0,
    articulacion: 0,
    ritmo: 0,
    cohesion: 0,
    dinamica: 0,
    memorizacion: 0,
  },
  comments: '',
});

// Batch evaluation state
const batchEval = reactive({
  workId: '',
  currentScores: {
    afinacion: 0,
    articulacion: 0,
    ritmo: 0,
    cohesion: 0,
    dinamica: 0,
    memorizacion: 0,
  },
  scores: {} as Record<string, any>,
  comments: '',
});

const selectedInstruments = ref<string[]>([]);

const availableWorks = computed(() => works.value);

const selectedWorkInstruments = computed(() => {
  const workId = quickEval.workId || batchEval.workId;
  const work = works.value.find(w => w.id === workId);
  return work?.instruments || [];
});

const canSaveEvaluation = computed(() => {
  return quickEval.workId && 
         quickEval.instrumentId && 
         Object.values(quickEval.scores).some(score => score > 0);
});

const hasScores = computed(() => {
  return Object.values(quickEval.scores).some(score => score > 0);
});

const canApplyBatch = computed(() => {
  return batchEval.workId && 
         selectedInstruments.value.length > 0 &&
         Object.values(batchEval.currentScores).some(score => score > 0);
});

const canSaveBatch = computed(() => {
  return batchEval.workId && 
         Object.keys(batchEval.scores).length > 0 &&
         Object.values(batchEval.scores).some(instrumentScores => 
           Object.values(instrumentScores).some(score => score > 0),
         );
});

const evaluationTemplates = ref([
  {
    id: 'template1',
    name: 'Evaluación Estándar',
    description: 'Plantilla básica para evaluaciones regulares con todos los criterios',
    criteria: ['afinacion', 'articulacion', 'ritmo', 'cohesion'],
    usageCount: 15,
  },
  {
    id: 'template2',
    name: 'Evaluación Avanzada',
    description: 'Incluye todos los criterios y métricas detalladas para evaluaciones completas',
    criteria: ['afinacion', 'articulacion', 'ritmo', 'cohesion', 'dinamica', 'memorizacion'],
    usageCount: 8,
  },
  {
    id: 'template3',
    name: 'Evaluación de Ensayo',
    description: 'Enfocada en cohesión y trabajo en conjunto para ensayos grupales',
    criteria: ['cohesion', 'ritmo', 'dinamica'],
    usageCount: 12,
  },
]);

const recentEvaluations = ref([
  {
    id: 'eval1',
    workName: 'Sinfonía No. 40',
    instrumentName: 'Violín I',
    date: new Date(Date.now() - 86400000).toISOString(),
    scores: { afinacion: 4, articulacion: 3, ritmo: 4, cohesion: 3, dinamica: 4, memorizacion: 2 },
    comments: 'Buen progreso en afinación, necesita trabajo en memorización',
  },
  {
    id: 'eval2',
    workName: 'Concierto para Piano',
    instrumentName: 'Piano',
    date: new Date(Date.now() - 172800000).toISOString(),
    scores: { afinacion: 5, articulacion: 4, ritmo: 5, cohesion: 4, dinamica: 5, memorizacion: 4 },
    comments: 'Excelente interpretación, muy sólido en todos los aspectos',
  },
]);

// Quick evaluation functions
const selectWork = (workId: string) => {
  quickEval.workId = workId;
  quickEval.instrumentId = '';
  resetScores();
};

const selectInstrument = (instrumentId: string) => {
  quickEval.instrumentId = instrumentId;
  
  // Load existing evaluation if available
  loadExistingEvaluation(quickEval.workId, instrumentId);
};

const setScore = (criterion: string, score: number) => {
  quickEval.scores[criterion] = score;
};

const resetScores = () => {
  Object.keys(quickEval.scores).forEach(key => {
    quickEval.scores[key] = 0;
  });
  quickEval.comments = '';
};

const resetQuickEvaluation = () => {
  quickEval.workId = '';
  quickEval.instrumentId = '';
  quickEval.comments = '';
  resetScores();
};

// Batch evaluation functions
const selectBatchWork = (workId: string) => {
  batchEval.workId = workId;
  selectedInstruments.value = [];
  resetBatchScores();
};

const toggleInstrumentSelection = (instrumentId: string) => {
  const index = selectedInstruments.value.indexOf(instrumentId);
  if (index === -1) {
    selectedInstruments.value.push(instrumentId);
  } else {
    selectedInstruments.value.splice(index, 1);
  }
};

const selectAllInstruments = () => {
  selectedInstruments.value = selectedWorkInstruments.value.map(i => i.id);
};

const clearInstrumentSelection = () => {
  selectedInstruments.value = [];
};

const resetBatchScores = () => {
  Object.keys(batchEval.currentScores).forEach(key => {
    batchEval.currentScores[key] = 0;
  });
  batchEval.comments = '';
};

const setBatchScore = (criterion: string, score: number) => {
  batchEval.currentScores[criterion] = score;
};

const applyBatchScores = () => {
  // Apply current scores to all selected instruments
  selectedInstruments.value.forEach(instrumentId => {
    if (!batchEval.scores[instrumentId]) {
      batchEval.scores[instrumentId] = {};
    }
    
    // Only update criteria that have been scored
    Object.entries(batchEval.currentScores).forEach(([criterion, score]) => {
      if (score > 0) {
        batchEval.scores[instrumentId][criterion] = score;
      }
    });
    
    // Add comments if provided
    if (batchEval.comments) {
      batchEval.scores[instrumentId].comments = batchEval.comments;
    }
  });
  
  // Reset current scores and comments for next batch
  resetBatchScores();
  
  // Clear selection
  selectedInstruments.value = [];
};

const editBatchInstrument = (instrumentId: string) => {
  // Load this instrument's scores into current scores for editing
  const instrumentScores = batchEval.scores[instrumentId];
  if (instrumentScores) {
    Object.keys(batchEval.currentScores).forEach(key => {
      batchEval.currentScores[key] = instrumentScores[key] || 0;
    });
    batchEval.comments = instrumentScores.comments || '';
  }
  
  // Select only this instrument
  selectedInstruments.value = [instrumentId];
};

const removeBatchInstrument = (instrumentId: string) => {
  if (confirm('¿Estás seguro de que quieres quitar esta evaluación?')) {
    delete batchEval.scores[instrumentId];
  }
};

const resetBatchEvaluation = () => {
  batchEval.workId = '';
  batchEval.scores = {};
  resetBatchScores();
  selectedInstruments.value = [];
};

// Firestore functions
const loadExistingEvaluation = async (workId: string, instrumentId: string) => {
  try {
    // Query Firestore for existing evaluation
    const evaluationsRef = collection(db, 'instrument_evaluations');
    const q = query(
      evaluationsRef,
      where('workId', '==', workId),
      where('instrumentId', '==', instrumentId),
      orderBy('updatedAt', 'desc'),
      limit(1),
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const evaluationData = querySnapshot.docs[0].data();
      
      // Populate form with existing data
      Object.keys(quickEval.scores).forEach(key => {
        quickEval.scores[key] = evaluationData[key] || 0;
      });
      
      quickEval.comments = evaluationData.comments || '';
    }
  } catch (error) {
    console.error('Error loading existing evaluation:', error);
  }
};

// Save functions
const saveQuickEvaluation = async () => {
  if (!canSaveEvaluation.value) return;
  
  saving.value = true;
  try {
    const evaluationData = {
      workId: quickEval.workId,
      instrumentId: quickEval.instrumentId,
      ...quickEval.scores,
      comments: quickEval.comments,
      evaluatedAt: new Date().toISOString(),
      evaluatedBy: 'current_user_id',
      updatedAt: new Date().toISOString(),
    };
    
    // Save to Firestore
    await addDoc(collection(db, 'instrument_evaluations'), evaluationData);
    
    // Show success message
    alert('✅ Evaluación guardada exitosamente');
    
    // Reset form
    resetQuickEvaluation();
  } catch (error) {
    console.error('Error saving evaluation:', error);
    alert('❌ Error al guardar la evaluación');
  } finally {
    saving.value = false;
  }
};

const saveBatchEvaluation = async () => {
  if (!canSaveBatch.value) return;
  
  saving.value = true;
  try {
    const batch = [];
    
    // Prepare batch operations
    for (const [instrumentId, scores] of Object.entries(batchEval.scores)) {
      const evaluationData = {
        workId: batchEval.workId,
        instrumentId,
        ...scores,
        evaluatedAt: new Date().toISOString(),
        evaluatedBy: 'current_user_id',
        updatedAt: new Date().toISOString(),
      };
      
      batch.push(addDoc(collection(db, 'instrument_evaluations'), evaluationData));
    }
    
    // Execute all operations
    await Promise.all(batch);
    
    alert(`✅ ${batch.length} evaluaciones guardadas exitosamente`);
    resetBatchEvaluation();
  } catch (error) {
    console.error('Error saving batch evaluations:', error);
    alert('❌ Error al guardar las evaluaciones');
  } finally {
    saving.value = false;
  }
};

// Utility functions
const getScoreColor = (score: number): string => {
  if (score === 0) return 'bg-gray-100 text-gray-400';
  if (score <= 2) return 'bg-red-100 text-red-700';
  if (score === 3) return 'bg-yellow-100 text-yellow-700';
  if (score >= 4) return 'bg-green-100 text-green-700';
  return 'bg-gray-100 text-gray-600';
};

const getScoreLabel = (score: number): string => {
  const labels = ['', 'Muy Bajo', 'Bajo', 'Medio', 'Alto', 'Muy Alto'];
  return labels[score] || '';
};

const getCriterionLabel = (criterion: string): string => {
  const labels = {
    afinacion: 'Afinación',
    articulacion: 'Articulación',
    ritmo: 'Ritmo',
    cohesion: 'Cohesión',
    dinamica: 'Dinámica',
    memorizacion: 'Memorización',
  };
  return labels[criterion] || criterion;
};

const getInstrumentName = (instrumentId: string): string => {
  const instrument = selectedWorkInstruments.value.find(i => i.id === instrumentId);
  return instrument?.name || 'Instrumento';
};

const getInstrumentFamily = (instrumentId: string): string => {
  const instrument = selectedWorkInstruments.value.find(i => i.id === instrumentId);
  return instrument?.family || '';
};

const getAverageScore = (scores: Record<string, number>): number => {
  const validScores = Object.values(scores).filter(score => typeof score === 'number' && score > 0);
  if (validScores.length === 0) return 0;
  return validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
};

const useTemplate = (template: any) => {
  console.log('Using template:', template);
  // Apply template configuration
  alert(`📋 Plantilla "${template.name}" aplicada`);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Load recent evaluations from Firestore
const loadRecentEvaluations = async () => {
  try {
    const evaluationsRef = collection(db, 'instrument_evaluations');
    const q = query(
      evaluationsRef,
      orderBy('evaluatedAt', 'desc'),
      limit(10),
    );
    
    const querySnapshot = await getDocs(q);
    const evaluations = [];
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      const work = works.value.find(w => w.id === data.workId);
      const instrument = work?.instruments.find(i => i.id === data.instrumentId);
      
      if (work && instrument) {
        evaluations.push({
          id: doc.id,
          workName: work.name,
          instrumentName: instrument.name,
          date: data.evaluatedAt,
          scores: {
            afinacion: data.afinacion || 0,
            articulacion: data.articulacion || 0,
            ritmo: data.ritmo || 0,
            cohesion: data.cohesion || 0,
            dinamica: data.dinamica || 0,
            memorizacion: data.memorizacion || 0,
          },
          comments: data.comments || '',
        });
      }
    }
    
    recentEvaluations.value = evaluations;
  } catch (error) {
    console.error('Error loading recent evaluations:', error);
  }
};

onMounted(() => {
  // Load recent evaluations
  loadRecentEvaluations();
});
</script>