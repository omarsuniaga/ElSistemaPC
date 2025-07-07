<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
      <h3 class="text-lg font-bold mb-4">
        {{ evaluation ? 'Editar' : 'Nueva' }} Evaluación Semanal
      </h3>
      
      <div class="space-y-6">
        <!-- Week Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Semana (Sábado) *
          </label>
          <input
            v-model="formData.week"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
          <p class="text-xs text-gray-500 mt-1">Selecciona el sábado de la semana a evaluar</p>
        </div>

        <!-- Plantillas de Evaluación -->
        <div class="bg-blue-50 rounded-lg p-4">
          <h4 class="font-medium text-blue-800 mb-2">Plantillas de Evaluación</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              v-for="template in evaluationTemplates"
              :key="template.id"
              @click="applyTemplate(template.id)"
              class="p-3 border-2 border-blue-200 rounded-lg text-left hover:bg-blue-100 transition-colors"
            >
              <div class="flex items-center gap-2">
                <span class="text-xl">{{ template.icon }}</span>
                <div>
                  <div class="font-medium text-gray-900">{{ template.name }}</div>
                  <div class="text-xs text-gray-600">{{ template.description }}</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Evaluation Sections -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Ensayo General -->
          <div class="bg-blue-50 rounded-lg p-4">
            <h4 class="font-medium text-blue-800 mb-4 text-center">🎼 Ensayo General</h4>
            <div class="space-y-3">
              <div 
                v-for="(criterion, key) in EVALUATION_CRITERIA" 
                :key="key"
              >
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  {{ criterion.name }}
                </label>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    @click="setScore('ensayoGeneral', key, score)"
                    :class="[
                      'flex-1 py-2 border-2 rounded-md transition-colors',
                      formData.ensayoGeneral[key] === score
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    ]"
                  >
                    {{ score }}
                  </button>
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  {{ criterion.scales[formData.ensayoGeneral[key]] || 'Sin evaluar' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Ensayo Seccional -->
          <div class="bg-green-50 rounded-lg p-4">
            <h4 class="font-medium text-green-800 mb-4 text-center">🎵 Ensayo Seccional</h4>
            <div class="space-y-3">
              <div 
                v-for="(criterion, key) in EVALUATION_CRITERIA" 
                :key="key"
              >
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  {{ criterion.name }}
                </label>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    @click="setScore('ensayoSeccional', key, score)"
                    :class="[
                      'flex-1 py-2 border-2 rounded-md transition-colors',
                      formData.ensayoSeccional[key] === score
                        ? 'bg-green-500 text-white border-green-500'
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                    ]"
                  >
                    {{ score }}
                  </button>
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  {{ criterion.scales[formData.ensayoSeccional[key]] || 'Sin evaluar' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Ensayo por Fila -->
          <div class="bg-purple-50 rounded-lg p-4">
            <h4 class="font-medium text-purple-800 mb-4 text-center">🎯 Ensayo por Fila</h4>
            <div class="space-y-3">
              <div 
                v-for="(criterion, key) in EVALUATION_CRITERIA" 
                :key="key"
              >
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  {{ criterion.name }}
                </label>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    @click="setScore('ensayoPorFila', key, score)"
                    :class="[
                      'flex-1 py-2 border-2 rounded-md transition-colors',
                      formData.ensayoPorFila[key] === score
                        ? 'bg-purple-500 text-white border-purple-500'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    ]"
                  >
                    {{ score }}
                  </button>
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  {{ criterion.scales[formData.ensayoPorFila[key]] || 'Sin evaluar' }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Comments -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Comentarios Generales
          </label>
          <textarea
            v-model="formData.comentarios"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="4"
            placeholder="Observaciones, logros, áreas de mejora, etc..."
          ></textarea>
        </div>

        <!-- Objetivos y Logros -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Objetivos Alcanzados
            </label>
            <textarea
              v-model="formData.achievements"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
              placeholder="Logros y objetivos alcanzados esta semana..."
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Objetivos para la Próxima Semana
            </label>
            <textarea
              v-model="formData.nextWeekGoals"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
              placeholder="Objetivos para la próxima semana..."
            ></textarea>
          </div>
        </div>
      </div>
      
      <div class="flex gap-3 mt-6">
        <button
          @click="saveEvaluation"
          :disabled="saving || !formData.week"
          class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {{ saving ? 'Guardando...' : (evaluation ? 'Actualizar' : 'Guardar') }} Evaluación
        </button>
        <button
          @click="$emit('close')"
          :disabled="saving"
          class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import type { MusicalWork, WeeklyEvaluation } from '../types/heatmap'
import { EVALUATION_CRITERIA } from '../types/heatmap'

const props = defineProps<{
  work: MusicalWork
  evaluation?: WeeklyEvaluation | null
}>()

const emit = defineEmits<{
  evaluationSaved: [evaluation: WeeklyEvaluation]
  close: []
}>()

const saving = ref(false)

const formData = reactive({
  week: '',
  ensayoGeneral: {
    afinacion: 0,
    articulacion: 0,
    ritmo: 0,
    cohesion: 0,
    dinamica: 0,
    memorizacion: 0
  },
  ensayoSeccional: {
    afinacion: 0,
    articulacion: 0,
    ritmo: 0,
    cohesion: 0,
    dinamica: 0,
    memorizacion: 0
  },
  ensayoPorFila: {
    afinacion: 0,
    articulacion: 0,
    ritmo: 0,
    cohesion: 0,
    dinamica: 0,
    memorizacion: 0
  },
  comentarios: '',
  achievements: '',
  challenges: '',
  nextWeekGoals: ''
})

const evaluationTemplates = [
  {
    id: 'orquesta',
    name: 'Orquesta Sinfónica',
    icon: '🎻',
    description: 'Evaluación para orquesta completa'
  },
  {
    id: 'coro',
    name: 'Coro',
    icon: '🎵',
    description: 'Evaluación para coro'
  },
  {
    id: 'banda',
    name: 'Banda',
    icon: '🎺',
    description: 'Evaluación para banda'
  }
]

// Get next Saturday date
const getNextSaturday = (): string => {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const daysUntilSaturday = (6 - dayOfWeek) % 7
  const nextSaturday = new Date(today)
  nextSaturday.setDate(today.getDate() + daysUntilSaturday)
  return nextSaturday.toISOString().split('T')[0]
}

// Set score for a specific evaluation type and criterion
const setScore = (evaluationType: string, criterion: string, score: number) => {
  formData[evaluationType][criterion] = score
}

// Apply template presets
const applyTemplate = (templateId: string) => {
  if (templateId === 'orquesta') {
    // Preset for orchestra
    formData.ensayoGeneral = {
      afinacion: 0,
      articulacion: 0,
      ritmo: 0,
      cohesion: 0,
      dinamica: 0,
      memorizacion: 0
    }
    formData.ensayoSeccional = {
      afinacion: 0,
      articulacion: 0,
      ritmo: 0,
      cohesion: 0,
      dinamica: 0,
      memorizacion: 0
    }
    formData.ensayoPorFila = {
      afinacion: 0,
      articulacion: 0,
      ritmo: 0,
      cohesion: 0,
      dinamica: 0,
      memorizacion: 0
    }
  } else if (templateId === 'coro') {
    // Preset for choir
    formData.ensayoGeneral = {
      afinacion: 0,
      articulacion: 0,
      ritmo: 0,
      cohesion: 0,
      dinamica: 0,
      memorizacion: 0
    }
    formData.ensayoSeccional = {
      afinacion: 0,
      articulacion: 0,
      ritmo: 0,
      cohesion: 0,
      dinamica: 0,
      memorizacion: 0
    }
    formData.ensayoPorFila = {
      afinacion: 0,
      articulacion: 0,
      ritmo: 0,
      cohesion: 0,
      dinamica: 0,
      memorizacion: 0
    }
  } else if (templateId === 'banda') {
    // Preset for band
    formData.ensayoGeneral = {
      afinacion: 0,
      articulacion: 0,
      ritmo: 0,
      cohesion: 0,
      dinamica: 0,
      memorizacion: 0
    }
    formData.ensayoSeccional = {
      afinacion: 0,
      articulacion: 0,
      ritmo: 0,
      cohesion: 0,
      dinamica: 0,
      memorizacion: 0
    }
    formData.ensayoPorFila = {
      afinacion: 0,
      articulacion: 0,
      ritmo: 0,
      cohesion: 0,
      dinamica: 0,
      memorizacion: 0
    }
  }
}

// Save evaluation
const saveEvaluation = async () => {
  if (!formData.week) return
  
  saving.value = true
  
  try {
    const evaluationData: WeeklyEvaluation = {
      id: props.evaluation?.id || `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workId: props.work.id,
      projectId: 'current_project_id',
      evaluatorId: 'current_user_id',
      week: formData.week,
      ensayoGeneral: { ...formData.ensayoGeneral },
      ensayoSeccional: { ...formData.ensayoSeccional },
      ensayoPorFila: { ...formData.ensayoPorFila },
      comentarios: formData.comentarios,
      objectives: [],
      achievements: formData.achievements.split('\n').filter(Boolean),
      challenges: formData.challenges.split('\n').filter(Boolean),
      nextWeekGoals: formData.nextWeekGoals.split('\n').filter(Boolean),
      attendanceRate: 0,
      overallMood: 0,
      energyLevel: 0,
      focusLevel: 0,
      createdAt: props.evaluation?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // Here you would save to your backend/Firebase
    console.log('Saving weekly evaluation:', evaluationData)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    emit('evaluationSaved', evaluationData)
  } catch (error) {
    console.error('Error saving evaluation:', error)
    alert('Error al guardar la evaluación. Por favor, intenta de nuevo.')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (props.evaluation) {
    // Edit mode - populate form with existing data
    Object.assign(formData, {
      week: props.evaluation.week,
      ensayoGeneral: { ...props.evaluation.ensayoGeneral },
      ensayoSeccional: { ...props.evaluation.ensayoSeccional },
      ensayoPorFila: { ...props.evaluation.ensayoPorFila },
      comentarios: props.evaluation.comentarios,
      achievements: props.evaluation.achievements?.join('\n') || '',
      challenges: props.evaluation.challenges?.join('\n') || '',
      nextWeekGoals: props.evaluation.nextWeekGoals?.join('\n') || ''
    })
  } else {
    // Create mode - set default week to next Saturday
    formData.week = getNextSaturday()
  }
})
</script>