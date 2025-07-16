<template>
  <div class="space-y-6">
    <div class="bg-green-50 border border-green-200 rounded-lg p-4">
      <h4 class="font-medium text-green-800 mb-2">🎵 Plantilla de Ensayo Seccional</h4>
      <p class="text-sm text-green-600">Esta plantilla está diseñada para evaluar el rendimiento por familias de instrumentos durante ensayos seccionales.</p>
    </div>

    <!-- Información Básica -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Fecha del Ensayo</label>
        <input
          type="date"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Director/Instructor</label>
        <input
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          placeholder="Nombre del director"
        >
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Duración (minutos)</label>
        <input
          type="number"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          placeholder="90"
        >
      </div>
    </div>

    <!-- Selección de Familia de Instrumentos -->
    <div>
      <h4 class="font-medium text-gray-900 mb-3">Familia de Instrumentos</h4>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          v-for="family in instrumentFamilies"
          :key="family.id"
          :class="[
            'p-4 border-2 rounded-lg text-center transition-all duration-200 hover:shadow-md',
            selectedFamily === family.id
              ? 'border-green-500 bg-green-50 shadow-md'
              : 'border-gray-200 hover:border-green-300'
          ]"
          @click="selectFamily(family.id)"
        >
          <div class="text-2xl mb-2">{{ family.icon }}</div>
          <div class="font-medium text-gray-900">{{ family.name }}</div>
          <div class="text-xs text-gray-500 mt-1">{{ family.count }} instrumentos</div>
        </button>
      </div>
    </div>

    <!-- Criterios de Evaluación Seccional -->
    <div v-if="selectedFamily" class="space-y-4">
      <h4 class="font-medium text-gray-900">Evaluación de {{ getFamilyName(selectedFamily) }}</h4>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Columna 1: Criterios Técnicos -->
        <div class="space-y-4">
          <div class="bg-gray-50 rounded-lg p-4">
            <h5 class="font-medium text-gray-800 mb-3">Aspectos Técnicos</h5>
            
            <div class="space-y-3">
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Afinación Seccional</label>
                  <span class="text-sm text-green-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-green-50 hover:border-green-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Precisión Rítmica</label>
                  <span class="text-sm text-green-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-green-50 hover:border-green-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Articulación</label>
                  <span class="text-sm text-green-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-green-50 hover:border-green-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Técnica Instrumental</label>
                  <span class="text-sm text-green-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-green-50 hover:border-green-300 transition-colors"
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
                  <label class="text-sm font-medium text-gray-700">Cohesión Seccional</label>
                  <span class="text-sm text-green-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-green-50 hover:border-green-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Balance Sonoro</label>
                  <span class="text-sm text-green-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-green-50 hover:border-green-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Expresividad</label>
                  <span class="text-sm text-green-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-green-50 hover:border-green-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Homogeneidad</label>
                  <span class="text-sm text-green-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-green-50 hover:border-green-300 transition-colors"
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

    <!-- Pasajes Trabajados -->
    <div v-if="selectedFamily">
      <h4 class="font-medium text-gray-900 mb-3">Pasajes Trabajados</h4>
      
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
              <span class="ml-1 font-medium">20 min</span>
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
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              rows="2"
              placeholder="Observaciones específicas sobre este pasaje..."
            ></textarea>
          </div>
        </div>
        
        <button class="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors">
          + Agregar Pasaje
        </button>
      </div>
    </div>

    <!-- Problemas Técnicos Específicos -->
    <div v-if="selectedFamily">
      <h4 class="font-medium text-gray-900 mb-3">Problemas Técnicos Específicos</h4>
      
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <input type="checkbox" class="rounded text-green-500 focus:ring-green-500">
          <label class="text-sm text-gray-700">Digitación/posiciones</label>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" class="rounded text-green-500 focus:ring-green-500">
          <label class="text-sm text-gray-700">Respiración/fraseo</label>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" class="rounded text-green-500 focus:ring-green-500">
          <label class="text-sm text-gray-700">Golpes de arco/articulación</label>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" class="rounded text-green-500 focus:ring-green-500">
          <label class="text-sm text-gray-700">Vibrato/expresión</label>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" class="rounded text-green-500 focus:ring-green-500">
          <label class="text-sm text-gray-700">Pasajes rápidos/agilidad</label>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" class="rounded text-green-500 focus:ring-green-500">
          <label class="text-sm text-gray-700">Cambios de posición/registro</label>
        </div>
        
        <div class="mt-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Otros problemas técnicos</label>
          <textarea
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            rows="2"
            placeholder="Describa otros problemas técnicos específicos..."
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Observaciones y Plan de Acción -->
    <div v-if="selectedFamily">
      <h4 class="font-medium text-gray-900 mb-3">Observaciones y Plan de Acción</h4>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Fortalezas de la Sección</label>
          <textarea
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            rows="2"
            placeholder="Aspectos positivos de esta sección..."
          ></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Áreas de Mejora</label>
          <textarea
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            rows="2"
            placeholder="Aspectos a mejorar en esta sección..."
          ></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Ejercicios Recomendados</label>
          <textarea
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            rows="2"
            placeholder="Ejercicios específicos para trabajar..."
          ></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Plan para Próximo Ensayo</label>
          <textarea
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            rows="2"
            placeholder="Objetivos para el próximo ensayo seccional..."
          ></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const instrumentFamilies = [
  { id: 'strings', name: 'Cuerdas', icon: '🎻', count: 42 },
  { id: 'woodwinds', name: 'Viento-Madera', icon: '🎷', count: 12 },
  { id: 'brass', name: 'Viento-Metal', icon: '🎺', count: 10 },
  { id: 'percussion', name: 'Percusión', icon: '🥁', count: 6 },
  { id: 'keyboard', name: 'Teclados', icon: '🎹', count: 2 },
  { id: 'voices', name: 'Voces', icon: '🎤', count: 24 },
];

const selectedFamily = ref(null);

const selectFamily = (familyId) => {
  selectedFamily.value = familyId;
};

const getFamilyName = (familyId) => {
  const family = instrumentFamilies.find(f => f.id === familyId);
  return family ? family.name : '';
};
</script>