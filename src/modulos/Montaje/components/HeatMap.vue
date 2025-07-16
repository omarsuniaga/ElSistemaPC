<template>
  <div class="heat-map">
    <div class="heat-map-header flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold">Mapa de Progreso por Compás</h3>
      <div class="flex items-center space-x-4">
        <select
          v-model="currentSection"
          class="border border-gray-300 rounded-md px-3 py-1 text-sm"
          :disabled="!hasSections"
        >
          <option v-if="!hasSections" value="">Sin secciones</option>
          <option v-else value="">Todas las secciones</option>
          <option v-for="section in sections" :key="section" :value="section">
            Sección {{ section }}
          </option>
        </select>

        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-600">Leyenda:</span>
          <div class="flex items-center space-x-1">
            <span class="inline-block w-4 h-4 rounded bg-pink-300" />
            <span class="text-xs text-gray-600">Sin trabajar</span>
          </div>
          <div class="flex items-center space-x-1">
            <span class="inline-block w-4 h-4 rounded bg-orange-300" />
            <span class="text-xs text-gray-600">Leído</span>
          </div>
          <div class="flex items-center space-x-1">
            <span class="inline-block w-4 h-4 rounded bg-yellow-300" />
            <span class="text-xs text-gray-600">Con dificultad</span>
          </div>
          <div class="flex items-center space-x-1">
            <span class="inline-block w-4 h-4 rounded bg-green-300" />
            <span class="text-xs text-gray-600">Logrado</span>
          </div>
        </div>
      </div>
    </div>

    <div class="mb-4">
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-medium">Progreso General: {{ progressPercentage }}%</span>
        <span class="text-sm text-gray-500"
          >{{ completedMeasures }}/{{ totalMeasures }} compases</span
        >
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div class="bg-blue-600 h-2 rounded-full" :style="{width: `${progressPercentage}%`}" />
      </div>
    </div>

    <div class="bg-white border border-gray-200 rounded-lg p-4">
      <div v-if="isLoading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
      </div>
      <div v-else-if="filteredMeasures.length === 0" class="text-center py-8 text-gray-500">
        No hay compases definidos para esta obra.
        <button
          class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          @click="initializeMeasures"
        >
          Inicializar Compases
        </button>
      </div>
      <template v-else>
        <div v-if="currentSection" class="mb-4">
          <h4 class="font-medium">Sección {{ currentSection }}</h4>
        </div>
        <div class="grid gap-2" :style="gridStyle">
          <div
            v-for="measure in filteredMeasures"
            :key="measure.numero"
            class="aspect-square border rounded-md flex flex-col items-center justify-center cursor-pointer transition-colors relative"
            :class="getMeasureStateClass(measure.estado)"
            @click="toggleMeasureState(measure)"
          >
            <span class="text-sm font-medium">{{ measure.numero }}</span>
            <span
              v-if="measure.teacherInitial"
              class="absolute top-0 right-0 text-xs font-bold px-1 rounded-full bg-blue-600 text-white"
            >
              {{ measure.teacherInitial }}
            </span>
            <div v-if="measure.observacion" class="relative group">
              <span class="text-xs mt-1">📝</span>
              <div
                class="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 z-10 w-32"
              >
                {{ measure.observacion }}
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Modal para observaciones -->
    <div
      v-if="showObservationModal"
      class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg shadow-lg p-6 w-96 max-w-full">
        <h4 class="text-lg font-semibold mb-4">
          Observación para Compás {{ selectedMeasure?.numero }}
        </h4>
        <textarea
          v-model="observationText"
          rows="4"
          class="w-full border border-gray-300 rounded-md p-2 mb-4"
          placeholder="Escribe tu observación aquí..."
        />
        <div class="flex justify-end space-x-3">
          <button
            class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            @click="cancelObservation"
          >
            Cancelar
          </button>
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            @click="saveObservation"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, PropType, watch } from 'vue';
import { useMontaje } from '../composables/useMontaje';

// Definir tipos
interface Compas {
  numero: number
  estado: 'sin_trabajar' | 'leido' | 'con_dificultad' | 'logrado'
  observacion?: string
  ultimaActualizacion?: Date
  seccion?: string
  autoId?: string
  teacherInitial?: string
  maestroId?: string
}

const props = defineProps({
  obraId: {
    type: String,
    required: true,
  },
  totalCompases: {
    type: Number,
    required: true,
  },
  initialMeasures: {
    type: Array as PropType<Compas[]>,
    default: () => [],
  },
});

const emit = defineEmits(['update:measures', 'progress-change']);

// Estado
const measures = ref<Compas[]>(props.initialMeasures);
const isLoading = ref(false);
const currentSection = ref('');
const showObservationModal = ref(false);
const selectedMeasure = ref<Compas | null>(null);
const observationText = ref('');
const { cargarCompases, guardarCompas, cargarUsuario } = useMontaje();

// Cargar datos iniciales
const loadMeasures = async () => {
  if (measures.value.length === 0) {
    isLoading.value = true;
    try {
      const loadedMeasures = await cargarCompases(props.obraId);
      measures.value = loadedMeasures || [];

      // Si no hay compases y tenemos totalCompases, inicializamos
      if (measures.value.length === 0 && props.totalCompases > 0) {
        // No inicializamos automáticamente, esperamos que el usuario lo decida
      }
    } catch (error) {
      console.error('Error al cargar compases:', error);
    } finally {
      isLoading.value = false;
    }
  }
};

// Inicializar compases
const initializeMeasures = async () => {
  isLoading.value = true;
  try {
    // Crear array de compases inicial
    const newMeasures: Compas[] = [];
    for (let i = 1; i <= props.totalCompases; i++) {
      newMeasures.push({
        numero: i,
        estado: 'sin_trabajar',
        ultimaActualizacion: new Date(),
        seccion: determineSection(i), // Función para determinar la sección basado en el número de compás
      });
    }
    measures.value = newMeasures;

    // Guardar todos los compases
    for (const measure of newMeasures) {
      await guardarCompas(props.obraId, measure);
    }

    emit('update:measures', measures.value);
  } catch (error) {
    console.error('Error al inicializar compases:', error);
  } finally {
    isLoading.value = false;
  }
};

// Determinar sección basado en el número de compás (lógica simplificada)
const determineSection = (measureNumber: number): string => {
  // Ejemplo de lógica para asignar secciones, ajustar según necesidades reales
  if (measureNumber <= props.totalCompases / 3) return 'A';
  if (measureNumber <= (props.totalCompases / 3) * 2) return 'B';
  return 'C';
};

// Compases filtrados por sección
const filteredMeasures = computed(() => {
  if (!currentSection.value) return measures.value;
  return measures.value.filter((m) => m.seccion === currentSection.value);
});

// Secciones disponibles
const sections = computed(() => {
  const uniqueSections = new Set<string>();
  measures.value.forEach((m) => {
    if (m.seccion) uniqueSections.add(m.seccion);
  });
  return Array.from(uniqueSections).sort();
});

const hasSections = computed(() => sections.value.length > 0);

// Estadísticas
const totalMeasures = computed(() => props.totalCompases);
const completedMeasures = computed(
  () => measures.value.filter((m) => m.estado === 'logrado').length,
);
const progressPercentage = computed(() => {
  return Math.round((completedMeasures.value / totalMeasures.value) * 100) || 0;
});

// Determinar el estilo de la rejilla para mostrar exactamente los compases necesarios
const gridStyle = computed(() => {
  // Por defecto, agrupar en 10 columnas o según la configuración de la obra
  // Podríamos obtener este valor de la configuración de la obra si estuviera disponible
  const columnsPerRow = 10;
  return {
    'grid-template-columns': `repeat(${columnsPerRow}, minmax(0, 1fr))`,
    // Asegurar que solo se muestren tantas celdas como compases haya definidos
    'grid-template-areas': '"."',
  };
});

// Cambiar estado de compás
const toggleMeasureState = (measure: Compas) => {
  // Si tiene doble-click, mostrar modal de observación
  if (measure.estado === 'con_dificultad') {
    selectedMeasure.value = measure;
    observationText.value = measure.observacion || '';
    showObservationModal.value = true;
    return;
  }

  // Ciclo de estados: sin_trabajar -> leido -> con_dificultad -> logrado -> sin_trabajar
  let newState: Compas['estado'];
  switch (measure.estado) {
  case 'sin_trabajar':
    newState = 'leido';
    break;
  case 'leido':
    newState = 'con_dificultad';
    break;
  case 'con_dificultad':
    newState = 'logrado';
    break;
  case 'logrado':
    newState = 'sin_trabajar';
    break;
  default:
    newState = 'sin_trabajar';
  }

  updateMeasureState(measure, newState);
};

// Actualizar estado de compás
const updateMeasureState = async (measure: Compas, newState: Compas['estado']) => {
  try {
    const user = await cargarUsuario();
    const updatedMeasure = {
      ...measure,
      estado: newState,
      ultimaActualizacion: new Date(),
      maestroId: user?.uid || '',
      teacherInitial: user?.displayName ? user.displayName.charAt(0).toUpperCase() : '?',
    };

    // Actualizar en el estado local
    const index = measures.value.findIndex((m) => m.numero === measure.numero);
    if (index !== -1) {
      measures.value[index] = updatedMeasure;
    }

    // Guardar en Firestore
    await guardarCompas(props.obraId, updatedMeasure);

    // Emitir eventos de actualización
    emit('update:measures', measures.value);
    emit('progress-change', progressPercentage.value);
  } catch (error) {
    console.error('Error al actualizar compás:', error);
  }
};

// Modal de observaciones
const saveObservation = async () => {
  if (selectedMeasure.value) {
    const updatedMeasure = {
      ...selectedMeasure.value,
      observacion: observationText.value,
      ultimaActualizacion: new Date(),
    };

    const index = measures.value.findIndex((m) => m.numero === selectedMeasure.value?.numero);
    if (index !== -1) {
      measures.value[index] = updatedMeasure;
    }

    await guardarCompas(props.obraId, updatedMeasure);
    emit('update:measures', measures.value);
  }

  showObservationModal.value = false;
  selectedMeasure.value = null;
  observationText.value = '';
};

const cancelObservation = () => {
  showObservationModal.value = false;
  selectedMeasure.value = null;
  observationText.value = '';
};

// Clases CSS para estados
const getMeasureStateClass = (state: string) => {
  switch (state) {
  case 'sin_trabajar':
    return 'bg-pink-100 border-pink-300 hover:bg-pink-200';
  case 'leido':
    return 'bg-orange-100 border-orange-300 hover:bg-orange-200';
  case 'con_dificultad':
    return 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200';
  case 'logrado':
    return 'bg-green-100 border-green-300 hover:bg-green-200';
  default:
    return 'bg-gray-100 border-gray-300 hover:bg-gray-200';
  }
};

// Inicialización
watch(
  () => props.obraId,
  () => {
    loadMeasures();
  },
  { immediate: true },
);

watch(
  () => props.initialMeasures,
  (newMeasures) => {
    if (newMeasures.length > 0) {
      measures.value = newMeasures;
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.heat-map {
  width: 100%;
}
</style>
