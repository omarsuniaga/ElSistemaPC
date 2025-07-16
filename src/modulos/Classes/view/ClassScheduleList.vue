<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">Gestión de Horarios</h1>
    <ScheduleNavigation />

    <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
      <h2 class="text-xl font-semibold mb-4">Lista de Clases Programadas</h2>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-700">Nombre de la Clase</th>
              <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-700">Nivel</th>
              <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-700">Horario</th>
              <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-700">Aula</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="class_ in classesStore.classes"
              :key="class_.id"
              class="border-b dark:border-gray-700"
            >
              <td class="px-4 py-2">{{ class_.name }}</td>
              <td class="px-4 py-2">{{ class_.level }}</td>
              <td class="px-4 py-2">{{ class_.schedule }}</td>
              <td class="px-4 py-2">{{ class_.classroom || "No asignada" }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ScheduleNavigation } from '../../Schedules/components/ScheduleNavigation.vue';
import { useClassesStore } from '../store/classes';

const classesStore = useClassesStore();
</script>
