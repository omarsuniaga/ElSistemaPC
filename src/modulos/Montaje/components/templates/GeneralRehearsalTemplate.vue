<template>
  <div class="space-y-6">
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 class="font-medium text-blue-800 mb-2">🎼 Plantilla de Ensayo General</h4>
      <p class="text-sm text-blue-600">Esta plantilla está diseñada para evaluar el rendimiento general de toda la orquesta o coro durante un ensayo completo.</p>
    </div>

    <!-- Información Básica -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Fecha del Ensayo</label>
        <input
          type="date"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Director</label>
        <input
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Nombre del director"
        >
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Duración (minutos)</label>
        <input
          type="number"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="120"
        >
      </div>
    </div>

    <!-- Criterios de Evaluación -->
    <div class="space-y-4">
      <h4 class="font-medium text-gray-900">Criterios de Evaluación General</h4>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Columna 1: Criterios Técnicos -->
        <div class="space-y-4">
          <div class="bg-gray-50 rounded-lg p-4">
            <h5 class="font-medium text-gray-800 mb-3">Aspectos Técnicos</h5>
            
            <div class="space-y-3">
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Afinación General</label>
                  <span class="text-sm text-blue-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Precisión Rítmica</label>
                  <span class="text-sm text-blue-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Articulación</label>
                  <span class="text-sm text-blue-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Dinámica</label>
                  <span class="text-sm text-blue-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
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
                  <label class="text-sm font-medium text-gray-700">Cohesión de Conjunto</label>
                  <span class="text-sm text-blue-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Expresividad</label>
                  <span class="text-sm text-blue-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Interpretación Estilística</label>
                  <span class="text-sm text-blue-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    {{ score }}
                  </button>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700">Respuesta a la Dirección</label>
                  <span class="text-sm text-blue-600">0/5</span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-for="score in 5"
                    :key="score"
                    class="flex-1 py-2 border-2 border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
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

    <!-- Evaluación por Obras -->
    <div class="space-y-4">
      <h4 class="font-medium text-gray-900">Obras Trabajadas</h4>
      
      <div class="space-y-4">
        <div class="border border-gray-200 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h5 class="font-medium text-gray-800">Obra 1</h5>
              <p class="text-sm text-gray-600">Compositor</p>
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
              <span class="text-gray-600">Tiempo dedicado:</span>
              <span class="ml-1 font-medium">30 min</span>
            </div>
            <div>
              <span class="text-gray-600">Progreso:</span>
              <span class="ml-1 font-medium">65%</span>
            </div>
            <div>
              <span class="text-gray-600">Compases:</span>
              <span class="ml-1 font-medium">1-45</span>
            </div>
            <div>
              <span class="text-gray-600">Calificación:</span>
              <span class="ml-1 font-medium">4/5</span>
            </div>
          </div>
          
          <div class="mt-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="2"
              placeholder="Observaciones específicas sobre esta obra..."
            ></textarea>
          </div>
        </div>
        
        <button class="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
          + Agregar Obra
        </button>
      </div>
    </div>

    <!-- Observaciones Generales -->
    <div>
      <h4 class="font-medium text-gray-900 mb-3">Observaciones Generales</h4>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Fortalezas</label>
          <textarea
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="2"
            placeholder="Aspectos positivos del ensayo..."
          ></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Áreas de Mejora</label>
          <textarea
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="2"
            placeholder="Aspectos a mejorar..."
          ></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Plan para Próximo Ensayo</label>
          <textarea
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="2"
            placeholder="Objetivos para el próximo ensayo..."
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Asistencia -->
    <div>
      <h4 class="font-medium text-gray-900 mb-3">Asistencia</h4>
      
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-gray-600">Total de miembros:</span>
          <span class="ml-1 font-medium">45</span>
        </div>
        <div>
          <span class="text-gray-600">Asistentes:</span>
          <span class="ml-1 font-medium">42 (93%)</span>
        </div>
      </div>
      
      <div class="mt-3">
        <label class="block text-sm font-medium text-gray-700 mb-1">Ausencias Notables</label>
        <textarea
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows="2"
          placeholder="Registrar ausencias importantes y sus motivos..."
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Lógica específica para la plantilla de ensayo general
</script>