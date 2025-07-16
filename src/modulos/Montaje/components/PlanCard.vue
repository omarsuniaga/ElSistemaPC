<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <!-- Plan Header -->
    <div class="flex items-start justify-between mb-4">
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-gray-900 mb-1">
          {{ plan.nombre }}
        </h3>
        <p v-if="plan.descripcion" class="text-sm text-gray-600 mb-2">
          {{ plan.descripcion }}
        </p>
        <div class="flex items-center space-x-4 text-sm text-gray-500">
          <span class="flex items-center">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {{ formatDate(plan.fechaInicio) }} - {{ formatDate(plan.fechaFin) }}
          </span>
          <span class="flex items-center">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {{ daysRemaining }} días restantes
          </span>
        </div>
      </div>

      <!-- Status Badge -->
      <div class="ml-4">
        <span
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          :class="statusClasses"
        >
          {{ statusText }}
        </span>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-700">Progreso General</span>
        <span class="text-sm text-gray-500">{{ Math.round(progressPercentage) }}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div
          class="bg-blue-600 h-2 rounded-full transition-all duration-300"
          :style="{width: `${progressPercentage}%`}"
        />
      </div>
    </div>

    <!-- Objectives -->
    <div v-if="plan.objetivos.length > 0" class="mb-6">
      <h4 class="text-sm font-medium text-gray-700 mb-3">Objetivos</h4>
      <ul class="space-y-2">
        <li v-for="(objetivo, index) in plan.objetivos" :key="index" class="flex items-start">
          <svg
            class="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
          <span class="text-sm text-gray-600">{{ objetivo }}</span>
        </li>
      </ul>
    </div>

    <!-- Phases -->
    <div v-if="plan.fases.length > 0" class="mb-6">
      <h4 class="text-sm font-medium text-gray-700 mb-3">Fases del Plan</h4>
      <div class="space-y-3">
        <div
          v-for="fase in sortedPhases"
          :key="fase.orden"
          class="border border-gray-200 rounded-lg p-3"
        >
          <div class="flex items-center justify-between mb-2">
            <h5 class="text-sm font-medium text-gray-900">
              Fase {{ fase.orden }}: {{ fase.nombre }}
            </h5>
            <span
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              :class="getPhaseStatusClasses(fase)"
            >
              {{ getPhaseStatus(fase) }}
            </span>
          </div>
          <p v-if="fase.descripcion" class="text-xs text-gray-600 mb-2">
            {{ fase.descripcion }}
          </p>
          <div class="flex items-center text-xs text-gray-500">
            <span>{{ formatDate(fase.fechaInicio) }} - {{ formatDate(fase.fechaFin) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-between pt-4 border-t border-gray-200">
      <div class="flex items-center space-x-2 text-sm text-gray-500">
        <span>Última actualización:</span>
        <span>{{ formatDate(plan.fechaActualizacion) }}</span>
      </div>

      <div class="flex items-center space-x-2">
        <button
          class="inline-flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-300 rounded-md transition-colors"
          @click="$emit('view-details', plan)"
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          Ver Detalles
        </button>

        <button
          class="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 hover:border-gray-300 rounded-md transition-colors"
          @click="$emit('edit', plan)"
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Editar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PlanMontaje } from '../types';
import { formatDate } from '../utils';

interface Props {
  plan: PlanMontaje
}

interface Emits {
  (e: 'edit', plan: PlanMontaje): void
  (e: 'view-details', plan: PlanMontaje): void
}

const props = defineProps<Props>();
defineEmits<Emits>();

const sortedPhases = computed(() => {
  return [...props.plan.fases].sort((a, b) => a.orden - b.orden);
});

const progressPercentage = computed(() => {
  if (props.plan.fases.length === 0) return 0;

  const completedPhases = props.plan.fases.filter((fase) => {
    const now = new Date();
    const endDate = new Date(fase.fechaFin);
    return endDate <= now;
  }).length;

  return (completedPhases / props.plan.fases.length) * 100;
});

const daysRemaining = computed(() => {
  const now = new Date();
  const endDate = new Date(props.plan.fechaFin);
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

const statusText = computed(() => {
  const now = new Date();
  const startDate = new Date(props.plan.fechaInicio);
  const endDate = new Date(props.plan.fechaFin);

  if (now < startDate) return 'Pendiente';
  if (now > endDate) return 'Finalizado';
  return 'En Progreso';
});

const statusClasses = computed(() => {
  const status = statusText.value;
  switch (status) {
  case 'Pendiente':
    return 'bg-yellow-100 text-yellow-800';
  case 'En Progreso':
    return 'bg-blue-100 text-blue-800';
  case 'Finalizado':
    return 'bg-green-100 text-green-800';
  default:
    return 'bg-gray-100 text-gray-800';
  }
});

const getPhaseStatus = (fase: any) => {
  const now = new Date();
  const startDate = new Date(fase.fechaInicio);
  const endDate = new Date(fase.fechaFin);

  if (now < startDate) return 'Pendiente';
  if (now > endDate) return 'Completada';
  return 'Activa';
};

const getPhaseStatusClasses = (fase: any) => {
  const status = getPhaseStatus(fase);
  switch (status) {
  case 'Pendiente':
    return 'bg-gray-100 text-gray-800';
  case 'Activa':
    return 'bg-blue-100 text-blue-800';
  case 'Completada':
    return 'bg-green-100 text-green-800';
  default:
    return 'bg-gray-100 text-gray-800';
  }
};
</script>
