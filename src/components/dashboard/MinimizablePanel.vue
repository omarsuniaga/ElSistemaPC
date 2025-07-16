<template>
  <div class="panel-card bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-8">
    <!-- Header - clickable for minimize/maximize -->
    <div
      class="flex justify-between items-center p-4 cursor-pointer bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 border-b border-gray-200 dark:border-gray-700"
      @click="toggleMinimize"
    >
      <div class="flex items-center">
        <div :class="`rounded-full p-2 shadow-sm mr-3 ${iconClass} dark:bg-opacity-20`">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="iconPath" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ title }}</h3>
      </div>

      <!-- Navegación de días (si está habilitada) -->
      <div v-if="enableDayNavigation" class="flex items-center mr-4">
        <button
          class="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
          title="Día anterior"
          @click.stop="goToPreviousDay"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-gray-600 dark:text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <span class="mx-2 text-sm text-gray-600 dark:text-gray-400">{{ formattedDate }}</span>
        <button
          class="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
          title="Día siguiente"
          @click.stop="goToNextDay"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-gray-600 dark:text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      <!-- Indicator for expandable state -->
      <div class="text-gray-400 dark:text-gray-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            v-if="!isMinimized"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
          <path
            v-else
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </div>

    <!-- Panel content - can be minimized -->
    <div v-if="!isMinimized" class="panel-content bg-white dark:bg-gray-800">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  panelId: {
    type: String,
    default: () => `panel-${Math.random().toString(36).substring(2, 9)}`,
  },
  iconClass: {
    type: String,
    default: 'text-blue-500 bg-blue-100',
  },
  iconPath: {
    type: String,
    default:
      'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  enableDayNavigation: {
    type: Boolean,
    default: false,
  },
  initialDate: {
    type: [Date, String],
    default: () => new Date(),
  },
});

const emit = defineEmits(['dayChanged']);

const isMinimized = ref(false);
const currentDate = ref(new Date());

// Inicializar la fecha actual con la fecha inicial proporcionada
onMounted(() => {
  if (props.initialDate) {
    if (typeof props.initialDate === 'string') {
      currentDate.value = new Date(props.initialDate);
    } else {
      currentDate.value = props.initialDate;
    }
  }

  // Emitir el evento inicial para cargar los datos del día actual
  if (props.enableDayNavigation) {
    emit('dayChanged', currentDate.value);
  }

  // Restaurar estado desde localStorage
  const savedState = localStorage.getItem(`panel-${props.panelId}-minimized`);
  if (savedState) {
    isMinimized.value = savedState === 'true';
  }
});

const formattedDate = computed(() => {
  return currentDate.value.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

// Formato de fecha para uso en consultas (YYYY-MM-DD)
const formattedDateISO = computed(() => {
  return format(currentDate.value, 'yyyy-MM-dd');
});

const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value;
  localStorage.setItem(`panel-${props.panelId}-minimized`, isMinimized.value.toString());
};

const goToPreviousDay = () => {
  const newDate = new Date(currentDate.value);
  newDate.setDate(newDate.getDate() - 1);
  currentDate.value = newDate;
  emit('dayChanged', currentDate.value, formattedDateISO.value);
};

const goToNextDay = () => {
  const newDate = new Date(currentDate.value);
  newDate.setDate(newDate.getDate() + 1);
  currentDate.value = newDate;
  emit('dayChanged', currentDate.value, formattedDateISO.value);
};
</script>

<style scoped>
.panel-card {
  transition: all 0.3s ease;
}
</style>
