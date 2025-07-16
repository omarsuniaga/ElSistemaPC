<template>
  <div class="space-y-6">
    <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <h4 class="font-medium text-amber-800 mb-2">🎻 Plantilla de Ensayo Orquestal</h4>
      <p class="text-sm text-amber-600">Esta plantilla está diseñada para evaluar el rendimiento de la orquesta completa con enfoque en balance y cohesión.</p>
    </div>

    <!-- Información Básica -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Fecha del Ensayo</label>
        <input
          type="date"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        >
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Director</label>
        <input
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          placeholder="Nombre del director"
        >
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Duración (minutos)</label>
        <input
          type="number"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          placeholder="120"
        >
      </div>
    </div>

    <!-- Repertorio del Ensayo -->
    <div>
      <h4 class="font-medium text-gray-900 mb-3">Repertorio del Ensayo</h4>
      
      <div class="space-y-4">
        <div class="border border-gray-200 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h5 class="font-medium text-gray-800">Sinfonía No. 40</h5>
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
              <span class="text-gray-600">Movimientos:</span>
              <span class="ml-1 font-medium">I, II</span>
            </div>
            <div>
              <span class="text-gray-600">Tiempo:</span>
              <span class="ml-1 font-medium">45 min</span>
            </div>
            <div>
              <span class="text-gray-600">Compases:</span>
              <span class="ml-1 font-medium">1-120</span>
            </div>
            <div>
              <span class="text-gray-600">Progreso:</span>
              <span class="ml-1 font-medium">75%</span>
            </div>
          </div>
          
          <div class="mt-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              rows="2"
              placeholder="Observaciones específicas sobre esta obra..."
            ></textarea>
          </div>
        </div>
        
        <button class="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-amber-300 hover:bg-amber-50 transition-colors">
          + Agregar Obra
        </button>
      </div>
    </div>

    <!-- Evaluación por Secciones -->
    <div>
      <h4 class="font-medium text-gray-900 mb-3">Evaluación por Secciones</h4>
      
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sección</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Afinación</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ritmo</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Articulación</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Observaciones</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="section in orchestraSections" :key="section.id">
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="font-medium text-gray-900">{{ section.name }}</div>
                <div class="text-sm text-gray-500">{{ section.count }} músicos</div>
              </td>
              <td class="px-4 py-3">
                <div class="flex justify-center gap-1">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="w-7 h-7 rounded-full text-xs font-bold border border-gray-200 hover:bg-amber-100 hover:border-amber-300 transition-colors"
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
                    class="w-7 h-7 rounded-full text-xs font-bold border border-gray-200 hover:bg-amber-100 hover:border-amber-300 transition-colors"
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
                    class="w-7 h-7 rounded-full text-xs font-bold border border-gray-200 hover:bg-amber-100 hover:border-amber-300 transition-colors"
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
                    class="w-7 h-7 rounded-full text-xs font-bold border border-gray-200 hover:bg-amber-100 hover:border-amber-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </td>
              <td class="px-4 py-3">
                <input
                  type="text"
                  class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  placeholder="Observaciones..."
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Evaluación de Aspectos Orquestales -->
    <div>
      <h4 class="font-medium text-gray-900 mb-3">Aspectos Orquestales</h4>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Columna 1: Aspectos Técnicos -->
        <div class="space-y-4">
          <div class="bg-gray-50 rounded-lg p-4">
            <h5 class="font-medium text-gray-800 mb-3">Aspectos Técnicos</h5>
            
            <div class="space-y-3">
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Balance Orquestal</label>
                  <span class="text-sm text-amber-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-amber-50 hover:border-amber-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Precisión de Entradas</label>
                  <span class="text-sm text-amber-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-amber-50 hover:border-amber-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Estabilidad del Tempo</label>
                  <span class="text-sm text-amber-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-amber-50 hover:border-amber-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Articulación Unificada</label>
                  <span class="text-sm text-amber-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-amber-50 hover:border-amber-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Columna 2: Aspectos Musicales -->
        <div class="space-y-4">
          <div class="bg-gray-50 rounded-lg p-4">
            <h5 class="font-medium text-gray-800 mb-3">Aspectos Musicales</h5>
            
            <div class="space-y-3">
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Expresividad</label>
                  <span class="text-sm text-amber-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-amber-50 hover:border-amber-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Dinámica</label>
                  <span class="text-sm text-amber-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-amber-50 hover:border-amber-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Fraseo</label>
                  <span class="text-sm text-amber-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-amber-50 hover:border-amber-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Estilo Interpretativo</label>
                  <span class="text-sm text-amber-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-amber-50 hover:border-amber-300 transition-colors"
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

    <!-- Pasajes Críticos -->
    <div>
      <h4 class="font-medium text-gray-900 mb-3">Pasajes Críticos</h4>
      
      <div class="space-y-4">
        <div class="border border-gray-200 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h5 class="font-medium text-gray-800">Pasaje 1: Desarrollo (Sinfonía No. 40)</h5>
              <p class="text-sm text-gray-600">Compases 123-156</p>
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
          
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div>
              <span class="text-gray-600">Tiempo dedicado:</span>
              <span class="ml-1 font-medium">15 min</span>
            </div>
            <div>
              <span class="text-gray-600">Dificultad:</span>
              <span class="ml-1 font-medium">Alta</span>
            </div>
            <div>
              <span class="text-gray-600">Progreso:</span>
              <span class="ml-1 font-medium">60%</span>
            </div>
          </div>
          
          <div class="mt-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Problemas Identificados</label>
            <textarea
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              rows="2"
              placeholder="Problemas específicos en este pasaje..."
            ></textarea>
          </div>
          
          <div class="mt-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Soluciones Propuestas</label>
            <textarea
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              rows="2"
              placeholder="Soluciones y estrategias para este pasaje..."
            ></textarea>
          </div>
        </div>
        
        <button class="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-amber-300 hover:bg-amber-50 transition-colors">
          + Agregar Pasaje Crítico
        </button>
      </div>
    </div>

    <!-- Observaciones y Plan de Acción -->
    <div>
      <h4 class="font-medium text-gray-900 mb-3">Observaciones y Plan de Acción</h4>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Fortalezas del Ensayo</label>
          <textarea
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            rows="2"
            placeholder="Aspectos positivos del ensayo orquestal..."
          ></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Áreas de Mejora</label>
          <textarea
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            rows="2"
            placeholder="Aspectos a mejorar en la orquesta..."
          ></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Estrategias de Ensayo</label>
          <textarea
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            rows="2"
            placeholder="Estrategias efectivas utilizadas o a implementar..."
          ></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Plan para Próximo Ensayo</label>
          <textarea
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            rows="2"
            placeholder="Objetivos para el próximo ensayo orquestal..."
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Asistencia y Puntualidad -->
    <div>
      <h4 class="font-medium text-gray-900 mb-3">Asistencia y Puntualidad</h4>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span class="text-gray-600">Total de músicos:</span>
          <span class="ml-1 font-medium">65</span>
        </div>
        <div>
          <span class="text-gray-600">Asistentes:</span>
          <span class="ml-1 font-medium">62 (95%)</span>
        </div>
        <div>
          <span class="text-gray-600">Puntuales:</span>
          <span class="ml-1 font-medium">58 (89%)</span>
        </div>
        <div>
          <span class="text-gray-600">Ausencias justificadas:</span>
          <span class="ml-1 font-medium">2</span>
        </div>
      </div>
      
      <div class="mt-3">
        <label class="block text-sm font-medium text-gray-700 mb-1">Observaciones de Asistencia</label>
        <textarea
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          rows="2"
          placeholder="Observaciones sobre asistencia y puntualidad..."
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const orchestraSections = [
  { id: 'strings', name: 'Cuerdas', count: 42 },
  { id: 'woodwinds', name: 'Viento-Madera', count: 12 },
  { id: 'brass', name: 'Viento-Metal', count: 10 },
  { id: 'percussion', name: 'Percusión', count: 6 },
  { id: 'keyboard', name: 'Teclados', count: 2 },
];
</script>