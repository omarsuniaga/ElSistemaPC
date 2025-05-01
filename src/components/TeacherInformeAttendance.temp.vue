<template>
  <div class="p-4 space-y-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow">
    <h2 class="text-xl font-bold mb-4 text-primary-600 dark:text-primary-400">Informe de Asistencia</h2>

    <!-- Controles de fecha -->
    <div class="flex flex-wrap gap-2 items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div class="flex items-center">
        <span class="mr-2 text-sm">Desde:</span>
        <input 
          type="date" 
          v-model="from" 
          class="border rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" 
        />
      </div>
      <div class="flex items-center">
        <span class="mx-2 text-sm">Hasta:</span>
        <input 
          type="date" 
          v-model="to" 
          class="border rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" 
        />
      </div>
    </div>

    <!-- Estado de carga -->
    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-500">Cargando datos...</p>
    </div>

    <div v-else-if="error" class="text-red-500 p-4">
      {{ error }}
    </div>

    <div v-else>
      <div v-for="(classData, index) in classReports" :key="index" class="mb-8">
        <h3 class="text-lg font-semibold mb-4">{{ classData.className }}</h3>
        
        <!-- Tabla de asistencias -->
        <div class="overflow-x-auto">
          <table class="w-full table-auto border-collapse">
            <thead>
              <tr>
                <th class="border p-2">Alumno</th>
                <th v-for="date in classData.relevantDates" :key="date" class="border p-2">
                  {{ formatDateShort(date) }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in classData.students" :key="student.id">
                <td class="border p-2">{{ student.name }}</td>
                <td v-for="date in classData.relevantDates" :key="date" class="border p-2 text-center">
                  <span :class="getStatusClass(student.attendance[date])">
                    {{ getStatusSymbol(student.attendance[date]) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Observaciones -->
        <div v-if="classData.observations?.length" class="mt-4">
          <h4 class="font-medium mb-2">Observaciones:</h4>
          <div v-for="obs in sortedObservations(classData.observations)" 
               :key="obs.date" 
               class="mb-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <div class="text-sm text-gray-600 dark:text-gray-300">
              {{ formatDate(obs.date) }}
            </div>
            <div class="mt-1">{{ obs.text }}</div>
          </div>
        </div>
      </div>

      <!-- Mensaje cuando no hay datos -->
      <div v-if="classReports.length === 0" class="text-center py-8">
        <p class="text-gray-500">No hay datos para mostrar.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ...existing script content...
</script>
