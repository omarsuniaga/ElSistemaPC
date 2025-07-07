<template>
  <div class="space-y-6">
    <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
      <h4 class="font-medium text-indigo-800 mb-2">🎵 Plantilla de Ensayo Coral</h4>
      <p class="text-sm text-indigo-600">Esta plantilla está diseñada para evaluar el rendimiento de coros y ensambles vocales.</p>
    </div>

    <!-- Información Básica -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Fecha del Ensayo</label>
        <input
          type="date"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Director Coral</label>
        <input
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Nombre del director"
        >
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Duración (minutos)</label>
        <input
          type="number"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="90"
        >
      </div>
    </div>

    <!-- Selección de Tipo de Ensayo -->
    <div>
      <h4 class="font-medium text-gray-900 mb-3">Tipo de Ensayo</h4>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          v-for="type in rehearsalTypes"
          :key="type.id"
          :class="[
            'p-4 border-2 rounded-lg text-center transition-all duration-200 hover:shadow-md',
            selectedType === type.id
              ? 'border-indigo-500 bg-indigo-50 shadow-md'
              : 'border-gray-200 hover:border-indigo-300'
          ]"
          @click="selectType(type.id)"
        >
          <div class="text-2xl mb-2">{{ type.icon }}</div>
          <div class="font-medium text-gray-900">{{ type.name }}</div>
          <div class="text-xs text-gray-500 mt-1">{{ type.description }}</div>
        </button>
      </div>
    </div>

    <!-- Selección de Voces -->
    <div v-if="selectedType">
      <h4 class="font-medium text-gray-900 mb-3">Voces Evaluadas</h4>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          v-for="voice in voices"
          :key="voice.id"
          :class="[
            'p-3 border-2 rounded-lg text-center transition-all duration-200 hover:shadow-md',
            selectedVoices.includes(voice.id)
              ? 'border-indigo-500 bg-indigo-50 shadow-md'
              : 'border-gray-200 hover:border-indigo-300'
          ]"
          @click="toggleVoice(voice.id)"
        >
          <div class="font-medium text-gray-900">{{ voice.name }}</div>
          <div class="text-xs text-gray-500 mt-1">{{ voice.range }}</div>
          <div class="text-xs text-indigo-600 mt-1">{{ voice.count }} cantantes</div>
        </button>
      </div>
    </div>

    <!-- Criterios de Evaluación Coral -->
    <div v-if="selectedType && selectedVoices.length > 0" class="space-y-4">
      <h4 class="font-medium text-gray-900">Evaluación Vocal</h4>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Columna 1: Criterios Técnicos -->
        <div class="space-y-4">
          <div class="bg-gray-50 rounded-lg p-4">
            <h5 class="font-medium text-gray-800 mb-3">Aspectos Técnicos</h5>
            
            <div class="space-y-3">
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Afinación</label>
                  <span class="text-sm text-indigo-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Dicción</label>
                  <span class="text-sm text-indigo-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Precisión Rítmica</label>
                  <span class="text-sm text-indigo-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Respiración</label>
                  <span class="text-sm text-indigo-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Columna 2: Criterios Musicales -->
        <div class="space-y-4">
          <div class="bg-gray-50 rounded-lg p-4">
            <h5 class="font-medium text-gray-800 mb-3">Aspectos Musicales</h5>
            
            <div class="space-y-3">
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Blend Vocal</label>
                  <span class="text-sm text-indigo-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Expresividad</label>
                  <span class="text-sm text-indigo-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Dinámica</label>
                  <span class="text-sm text-indigo-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Fraseo</label>
                  <span class="text-sm text-indigo-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Repertorio Trabajado -->
    <div v-if="selectedType && selectedVoices.length > 0">
      <h4 class="font-medium text-gray-900 mb-3">Repertorio Trabajado</h4>
      
      <div class="space-y-4">
        <div class="border border-gray-200 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h5 class="font-medium text-gray-800">Ave Verum Corpus</h5>
              <p class="text-sm text-gray-600">W. A. Mozart</p>
            </div>
            <div class="flex gap-2">
              <button class="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors">
                Editar
              </button>
              <button class="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors">
                Eliminar
              </button>
            </div>
          </div>
          
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span class="text-gray-600">Tiempo:</span>
              <span class="ml-1 font-medium">25 min</span>
            </div>
            <div>
              <span class="text-gray-600">Idioma:</span>
              <span class="ml-1 font-medium">Latín</span>
            </div>
            <div>
              <span class="text-gray-600">Dificultad:</span>
              <span class="ml-1 font-medium">Media</span>
            </div>
            <div>
              <span class="text-gray-600">Progreso:</span>
              <span class="ml-1 font-medium">85%</span>
            </div>
          </div>
          
          <div class="mt-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows="2"
              placeholder="Observaciones específicas sobre esta obra..."
            ></textarea>
          </div>
        </div>
        
        <button class="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
          + Agregar Obra
        </button>
      </div>
    </div>

    <!-- Aspectos Vocales Específicos -->
    <div v-if="selectedType && selectedVoices.length > 0">
      <h4 class="font-medium text-gray-900 mb-3">Aspectos Vocales Específicos</h4>
      
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <input type="checkbox" class="rounded text-indigo-500 focus:ring-indigo-500">
          <label class="text-sm text-gray-700">Colocación vocal</label>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" class="rounded text-indigo-500 focus:ring-indigo-500">
          <label class="text-sm text-gray-700">Respiración y apoyo</label>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" class="rounded text-indigo-500 focus:ring-indigo-500">
          <label class="text-sm text-gray-700">Dicción y articulación</label>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" class="rounded text-indigo-500 focus:ring-indigo-500">
          <label class="text-sm text-gray-700">Homogeneidad de vocales</label>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" class="rounded text-indigo-500 focus:ring-indigo-500">
          <label class="text-sm text-gray-700">Resonancia y proyección</label>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" class="rounded text-indigo-500 focus:ring-indigo-500">
          <label class="text-sm text-gray-700">Registros vocales</label>
        </div>
        
        <div class="mt-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Otros aspectos vocales</label>
          <textarea
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows="2"
            placeholder="Describa otros aspectos vocales trabajados..."
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Observaciones y Plan de Acción -->
    <div v-if="selectedType && selectedVoices.length > 0">
      <h4 class="font-medium text-gray-900 mb-3">Observaciones y Plan de Acción</h4>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Fortalezas</label>
          <textarea
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows="2"
            placeholder="Aspectos positivos del ensayo coral..."
          ></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Áreas de Mejora</label>
          <textarea
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows="2"
            placeholder="Aspectos a mejorar en el coro..."
          ></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Ejercicios Vocales Recomendados</label>
          <textarea
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows="2"
            placeholder="Ejercicios vocales específicos para trabajar..."
          ></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Plan para Próximo Ensayo</label>
          <textarea
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows="2"
            placeholder="Objetivos para el próximo ensayo coral..."
          ></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const rehearsalTypes = [
  { 
    id: 'full_choir', 
    name: 'Coro Completo', 
    icon: '👥', 
    description: 'Ensayo con todas las voces' 
  },
  { 
    id: 'sectional', 
    name: 'Seccional', 
    icon: '🎵', 
    description: 'Ensayo por cuerdas vocales' 
  },
  { 
    id: 'technique', 
    name: 'Técnica Vocal', 
    icon: '🎤', 
    description: 'Enfoque en técnica' 
  }
]

const voices = [
  { id: 'soprano', name: 'Soprano', range: 'Do4-La5', count: 12 },
  { id: 'mezzo', name: 'Mezzosoprano', range: 'La3-Fa5', count: 8 },
  { id: 'alto', name: 'Alto', range: 'Fa3-Re5', count: 10 },
  { id: 'tenor', name: 'Tenor', range: 'Do3-La4', count: 8 },
  { id: 'baritone', name: 'Barítono', range: 'La2-Fa4', count: 6 },
  { id: 'bass', name: 'Bajo', range: 'Mi2-Do4', count: 6 }
]

const selectedType = ref(null)
const selectedVoices = ref([])

const selectType = (typeId) => {
  selectedType.value = typeId
  selectedVoices.value = []
}

const toggleVoice = (voiceId) => {
  const index = selectedVoices.value.indexOf(voiceId)
  if (index === -1) {
    selectedVoices.value.push(voiceId)
  } else {
    selectedVoices.value.splice(index, 1)
  }
}
</script>