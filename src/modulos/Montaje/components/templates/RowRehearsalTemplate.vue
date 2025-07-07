<template>
  <div class="space-y-6">
    <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <h4 class="font-medium text-purple-800 mb-2">🎻 Plantilla de Ensayo por Filas</h4>
      <p class="text-sm text-purple-600">Esta plantilla está diseñada para evaluar el rendimiento de instrumentos específicos durante ensayos por filas.</p>
    </div>

    <!-- Información Básica -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Fecha del Ensayo</label>
        <input
          type="date"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        >
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Director/Instructor</label>
        <input
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          placeholder="Nombre del director"
        >
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Duración (minutos)</label>
        <input
          type="number"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          placeholder="60"
        >
      </div>
    </div>

    <!-- Selección de Instrumento -->
    <div>
      <h4 class="font-medium text-gray-900 mb-3">Instrumento</h4>
      
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <button
          v-for="instrument in instruments"
          :key="instrument.id"
          :class="[
            'p-4 border-2 rounded-lg text-center transition-all duration-200 hover:shadow-md',
            selectedInstrument === instrument.id
              ? 'border-purple-500 bg-purple-50 shadow-md'
              : 'border-gray-200 hover:border-purple-300'
          ]"
          @click="selectInstrument(instrument.id)"
        >
          <div class="font-medium text-gray-900">{{ instrument.name }}</div>
          <div class="text-xs text-gray-500 mt-1">{{ instrument.family }}</div>
          <div class="text-xs text-purple-600 mt-1">{{ instrument.count }} músicos</div>
        </button>
      </div>
    </div>

    <!-- Criterios de Evaluación por Fila -->
    <div v-if="selectedInstrument" class="space-y-4">
      <h4 class="font-medium text-gray-900">Evaluación de {{ getInstrumentName(selectedInstrument) }}</h4>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Columna 1: Criterios Técnicos -->
        <div class="space-y-4">
          <div class="bg-gray-50 rounded-lg p-4">
            <h5 class="font-medium text-gray-800 mb-3">Aspectos Técnicos</h5>
            
            <div class="space-y-3">
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Afinación</label>
                  <span class="text-sm text-purple-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-purple-50 hover:border-purple-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Precisión Rítmica</label>
                  <span class="text-sm text-purple-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-purple-50 hover:border-purple-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Articulación</label>
                  <span class="text-sm text-purple-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-purple-50 hover:border-purple-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Técnica Específica</label>
                  <span class="text-sm text-purple-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-purple-50 hover:border-purple-300 transition-colors"
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
                  <label class="text-sm font-medium text-gray-700">Cohesión de Fila</label>
                  <span class="text-sm text-purple-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-purple-50 hover:border-purple-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Expresividad</label>
                  <span class="text-sm text-purple-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-purple-50 hover:border-purple-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Dinámica</label>
                  <span class="text-sm text-purple-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-purple-50 hover:border-purple-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Memorización</label>
                  <span class="text-sm text-purple-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-purple-50 hover:border-purple-300 transition-colors"
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

    <!-- Evaluación Individual -->
    <div v-if="selectedInstrument">
      <h4 class="font-medium text-gray-900 mb-3">Evaluación Individual</h4>
      
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Músico</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Técnica</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Musicalidad</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Preparación</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Observaciones</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="musician in musicians" :key="musician.id">
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="font-medium text-gray-900">{{ musician.name }}</div>
                <div class="text-sm text-gray-500">{{ musician.position }}</div>
              </td>
              <td class="px-4 py-3">
                <div class="flex justify-center gap-1">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="w-7 h-7 rounded-full text-xs font-bold border border-gray-200 hover:bg-purple-100 hover:border-purple-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="flex justify-center gap-1">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="w-7 h-7 rounded-full text-xs font-bold border border-gray-200 hover:bg-purple-100 hover:border-purple-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="flex justify-center gap-1">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="w-7 h-7 rounded-full text-xs font-bold border border-gray-200 hover:bg-purple-100 hover:border-purple-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </td>
              <td class="px-4 py-3">
                <input
                  type="text"
                  class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  placeholder="Observaciones..."
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pasajes Específicos -->
    <div v-if="selectedInstrument">
      <h4 class="font-medium text-gray-900 mb-3">Pasajes Específicos</h4>
      
      <div class="space-y-4">
        <div class="border border-gray-200 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h5 class="font-medium text-gray-800">Pasaje 1</h5>
              <p class="text-sm text-gray-600">Obra: Sinfonía No. 40</p>
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
              <span class="text-gray-600">Compases:</span>
              <span class="ml-1 font-medium">25-42</span>
            </div>
            <div>
              <span class="text-gray-600">Tiempo:</span>
              <span class="ml-1 font-medium">15 min</span>
            </div>
            <div>
              <span class="text-gray-600">Dificultad:</span>
              <span class="ml-1 font-medium">Alta</span>
            </div>
            <div>
              <span class="text-gray-600">Progreso:</span>
              <span class="ml-1 font-medium">70%</span>
            </div>
          </div>
          
          <div class="mt-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              rows="2"
              placeholder="Observaciones específicas sobre este pasaje..."
            ></textarea>
          </div>
        </div>
        
        <button class="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors">
          + Agregar Pasaje
        </button>
      </div>
    </div>

    <!-- Técnicas Específicas -->
    <div v-if="selectedInstrument">
      <h4 class="font-medium text-gray-900 mb-3">Técnicas Específicas</h4>
      
      <div class="space-y-3">
        <div v-for="(technique, index) in getInstrumentTechniques(selectedInstrument)" :key="index" class="flex items-center gap-2">
          <input type="checkbox" class="rounded text-purple-500 focus:ring-purple-500">
          <label class="text-sm text-gray-700">{{ technique }}</label>
        </div>
        
        <div class="mt-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Otras técnicas trabajadas</label>
          <textarea
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            rows="2"
            placeholder="Describa otras técnicas específicas trabajadas..."
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Observaciones y Plan de Acción -->
    <div v-if="selectedInstrument">
      <h4 class="font-medium text-gray-900 mb-3">Observaciones y Plan de Acción</h4>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Fortalezas</label>
          <textarea
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            rows="2"
            placeholder="Aspectos positivos de esta fila..."
          ></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Áreas de Mejora</label>
          <textarea
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            rows="2"
            placeholder="Aspectos a mejorar en esta fila..."
          ></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Ejercicios Recomendados</label>
          <textarea
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            rows="2"
            placeholder="Ejercicios específicos para esta fila..."
          ></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Plan para Próximo Ensayo</label>
          <textarea
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            rows="2"
            placeholder="Objetivos para el próximo ensayo de esta fila..."
          ></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const instruments = [
  { id: 'violin1', name: 'Violín I', family: 'Cuerdas', count: 16 },
  { id: 'violin2', name: 'Violín II', family: 'Cuerdas', count: 14 },
  { id: 'viola', name: 'Viola', family: 'Cuerdas', count: 12 },
  { id: 'cello', name: 'Violonchelo', family: 'Cuerdas', count: 10 },
  { id: 'bass', name: 'Contrabajo', family: 'Cuerdas', count: 8 },
  { id: 'flute', name: 'Flauta', family: 'Viento-Madera', count: 3 },
  { id: 'oboe', name: 'Oboe', family: 'Viento-Madera', count: 2 },
  { id: 'clarinet', name: 'Clarinete', family: 'Viento-Madera', count: 3 },
  { id: 'bassoon', name: 'Fagot', family: 'Viento-Madera', count: 2 },
  { id: 'horn', name: 'Trompa', family: 'Viento-Metal', count: 4 },
  { id: 'trumpet', name: 'Trompeta', family: 'Viento-Metal', count: 3 },
  { id: 'trombone', name: 'Trombón', family: 'Viento-Metal', count: 3 },
  { id: 'tuba', name: 'Tuba', family: 'Viento-Metal', count: 1 },
  { id: 'percussion', name: 'Percusión', family: 'Percusión', count: 4 },
  { id: 'harp', name: 'Arpa', family: 'Cuerdas', count: 1 },
  { id: 'piano', name: 'Piano', family: 'Teclados', count: 1 },
  { id: 'soprano', name: 'Soprano', family: 'Voces', count: 12 },
  { id: 'alto', name: 'Alto', family: 'Voces', count: 10 },
  { id: 'tenor', name: 'Tenor', family: 'Voces', count: 8 },
  { id: 'bass_voice', name: 'Bajo', family: 'Voces', count: 8 }
]

const musicians = [
  { id: 1, name: 'María García', position: 'Principal' },
  { id: 2, name: 'Juan Pérez', position: 'Asistente' },
  { id: 3, name: 'Ana Rodríguez', position: 'Fila' },
  { id: 4, name: 'Carlos López', position: 'Fila' },
  { id: 5, name: 'Laura Martínez', position: 'Fila' }
]

const selectedInstrument = ref(null)

const selectInstrument = (instrumentId) => {
  selectedInstrument.value = instrumentId
}

const getInstrumentName = (instrumentId) => {
  const instrument = instruments.find(i => i.id === instrumentId)
  return instrument ? instrument.name : ''
}

const getInstrumentTechniques = (instrumentId) => {
  // Técnicas específicas por tipo de instrumento
  const techniques = {
    'violin1': ['Golpes de arco', 'Vibrato', 'Cambios de posición', 'Dobles cuerdas', 'Trinos'],
    'violin2': ['Golpes de arco', 'Vibrato', 'Cambios de posición', 'Dobles cuerdas', 'Trinos'],
    'viola': ['Golpes de arco', 'Vibrato', 'Cambios de posición', 'Dobles cuerdas', 'Trinos'],
    'cello': ['Golpes de arco', 'Vibrato', 'Cambios de posición', 'Dobles cuerdas', 'Extensiones'],
    'bass': ['Golpes de arco', 'Pizzicato', 'Cambios de posición', 'Extensiones'],
    'flute': ['Respiración', 'Articulación', 'Vibrato', 'Armónicos', 'Trinos'],
    'oboe': ['Respiración', 'Articulación', 'Vibrato', 'Control de caña', 'Trinos'],
    'clarinet': ['Respiración', 'Articulación', 'Registro agudo', 'Legato', 'Staccato'],
    'bassoon': ['Respiración', 'Articulación', 'Control de caña', 'Registro agudo', 'Legato'],
    'horn': ['Respiración', 'Articulación', 'Transposición', 'Bouché', 'Legato'],
    'trumpet': ['Respiración', 'Articulación', 'Registro agudo', 'Staccato', 'Flexibilidad'],
    'trombone': ['Respiración', 'Articulación', 'Glissando', 'Legato', 'Flexibilidad'],
    'tuba': ['Respiración', 'Articulación', 'Registro grave', 'Legato', 'Flexibilidad'],
    'percussion': ['Redoble', 'Articulación', 'Cambios de baquetas', 'Dinámica', 'Precisión'],
    'harp': ['Cambios de pedal', 'Glissando', 'Articulación', 'Apagados', 'Armónicos'],
    'piano': ['Pedal', 'Articulación', 'Dinámica', 'Legato', 'Voces'],
    'soprano': ['Respiración', 'Colocación', 'Registro agudo', 'Dicción', 'Proyección'],
    'alto': ['Respiración', 'Colocación', 'Registro medio', 'Dicción', 'Proyección'],
    'tenor': ['Respiración', 'Colocación', 'Passaggio', 'Dicción', 'Proyección'],
    'bass_voice': ['Respiración', 'Colocación', 'Registro grave', 'Dicción', 'Proyección']
  }
  
  return techniques[instrumentId] || ['Técnica general', 'Articulación', 'Expresión', 'Dinámica']
}
</script>