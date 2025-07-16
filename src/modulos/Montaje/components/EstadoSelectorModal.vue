<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    @click.self="cancelSelection"
  >
    <div class="bg-white rounded-lg shadow-lg p-6 w-96 max-w-full transform transition-all">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-900">Asignar estado</h3>
        <button class="text-gray-500 hover:text-gray-700" @click="cancelSelection">
          <span class="sr-only">Cerrar</span>
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div class="mb-4">
        <p class="text-sm text-gray-500 mb-2">
          {{ selectionSummary }}
        </p>

        <!-- Selector de estado -->
        <div class="grid grid-cols-2 gap-2 mt-4">
          <button
            v-for="estado in estadosDisponibles"
            :key="estado.valor"
            class="flex flex-col items-center justify-center p-3 rounded-md border transition-colors"
            :class="[
              selectedEstado === estado.valor
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50',
            ]"
            @click="selectEstado(estado.valor)"
          >
            <div class="w-8 h-8 rounded-md mb-2" :class="estado.clase" />
            <span class="text-sm">{{ estado.label }}</span>
          </button>
        </div>
      </div>

      <!-- Observaciones (solo para estado "con_dificultad") -->
      <div v-if="selectedEstado === 'con_dificultad'" class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1"> Observaciones </label>
        <textarea
          v-model="observacion"
          class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          rows="3"
          placeholder="Detalle las dificultades encontradas..."
        />
      </div>

      <!-- Selección de alumnos (si se incluye la prop alumnosDisponibles) -->
      <div v-if="alumnosDisponibles.length > 0" class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2"> Alumnos evaluados </label>

        <div class="flex justify-between mb-2">
          <div class="flex items-center">
            <input
              id="select-all"
              type="checkbox"
              :checked="alumnosDisponibles.length === alumnosSeleccionados.length"
              :indeterminate.prop="
                alumnosSeleccionados.length > 0 &&
                alumnosSeleccionados.length < alumnosDisponibles.length
              "
              class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              @change="toggleSelectAll"
            />
            <label for="select-all" class="ml-2 text-xs text-gray-700">Seleccionar todos</label>
          </div>
          <button
            v-if="showAttendanceFilter"
            class="text-xs text-blue-600 hover:text-blue-800"
            @click="filterByAttendance"
          >
            Solo presentes hoy
          </button>
        </div>

        <div class="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-1">
          <div
            v-for="alumno in alumnosDisponibles"
            :key="alumno.id"
            class="flex items-center px-2 py-1 hover:bg-gray-100 rounded-md cursor-pointer"
            :class="{'opacity-50': alumno.ausente}"
            @click="toggleAlumno(alumno.id)"
          >
            <input
              type="checkbox"
              :checked="alumnosSeleccionados.includes(alumno.id)"
              class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              @click.stop
            />
            <span class="ml-2 text-sm">{{ alumno.nombre }}</span>
            <span v-if="alumno.ausente" class="ml-auto text-xs text-red-500">Ausente</span>
          </div>
        </div>
      </div>

      <div class="flex justify-end space-x-3">
        <button
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          @click="cancelSelection"
        >
          Cancelar
        </button>
        <button
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
          :disabled="!selectedEstado"
          @click="confirmSelection"
        >
          Aplicar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, PropType, watch } from 'vue';
import { EstadoCompass } from '../types';
import { useAttendanceStore } from '@/modulos/Attendance/store/attendance';

// Definición de tipos
interface Alumno {
  id: string
  nombre: string
  ausente?: boolean
}

interface CompasSeleccionado {
  numero: number
  instrumento?: string
}

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  compasesSeleccionados: {
    type: Array as PropType<CompasSeleccionado[]>,
    default: () => [],
  },
  alumnosDisponibles: {
    type: Array as PropType<Alumno[]>,
    default: () => [],
  },
  alumnosPreseleccionados: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  classeId: {
    type: String,
    default: '',
  },
  showAttendanceFilter: {
    type: Boolean,
    default: true,
  },
  fechaSesion: {
    type: Date,
    default: () => new Date(),
  },
});

const emit = defineEmits(['update', 'close']);

// Estado
const selectedEstado = ref<EstadoCompass | ''>('');
const observacion = ref('');
const alumnosSeleccionados = ref<string[]>([...props.alumnosPreseleccionados]);
const attendanceStore = useAttendanceStore();

// Estados disponibles con clases visuales
const estadosDisponibles = [
  {
    valor: EstadoCompass.SIN_TRABAJAR,
    label: 'Sin trabajar',
    clase: 'bg-pink-300',
  },
  {
    valor: EstadoCompass.LEIDO,
    label: 'Leído',
    clase: 'bg-blue-300',
  },
  {
    valor: EstadoCompass.CON_DIFICULTAD,
    label: 'Con dificultad',
    clase: 'bg-yellow-300',
  },
  {
    valor: EstadoCompass.LOGRADO,
    label: 'Logrado',
    clase: 'bg-green-300',
  },
];

// Computed properties
const selectionSummary = computed(() => {
  const count = props.compasesSeleccionados.length;

  if (count === 0) return 'No hay compases seleccionados';

  if (count === 1) {
    const compas = props.compasesSeleccionados[0];
    const instrumentoText = compas.instrumento ? ` (${compas.instrumento})` : '';
    return `Compás ${compas.numero}${instrumentoText}`;
  }

  // Agrupar por instrumento si hay varios compases
  const porInstrumento: Record<string, number> = {};

  props.compasesSeleccionados.forEach((c) => {
    const key = c.instrumento || 'sin_instrumento';
    porInstrumento[key] = (porInstrumento[key] || 0) + 1;
  });

  if (Object.keys(porInstrumento).length === 1) {
    const instrumento = Object.keys(porInstrumento)[0];
    const texto = instrumento !== 'sin_instrumento' ? ` del instrumento ${instrumento}` : '';
    return `${count} compases${texto} seleccionados`;
  }

  return `${count} compases de ${Object.keys(porInstrumento).length} instrumentos seleccionados`;
});

// Métodos
const selectEstado = (estado: EstadoCompass) => {
  selectedEstado.value = estado;

  // Limpiar observación si no es "con dificultad"
  if (estado !== EstadoCompass.CON_DIFICULTAD) {
    observacion.value = '';
  }
};

const toggleSelectAll = () => {
  if (alumnosSeleccionados.value.length === props.alumnosDisponibles.length) {
    alumnosSeleccionados.value = [];
  } else {
    alumnosSeleccionados.value = props.alumnosDisponibles.map((a) => a.id);
  }
};

const toggleAlumno = (alumnoId: string) => {
  const index = alumnosSeleccionados.value.indexOf(alumnoId);
  if (index === -1) {
    alumnosSeleccionados.value.push(alumnoId);
  } else {
    alumnosSeleccionados.value.splice(index, 1);
  }
};

const filterByAttendance = async () => {
  if (!props.classeId) return;

  try {
    // Cargar asistencia para la fecha actual
    await attendanceStore.fetchAttendanceForSession(props.classeId, props.fechaSesion);

    // Obtener el listado de presentes
    const presentes = attendanceStore.getPresentStudentIds(props.classeId, props.fechaSesion);

    // Filtrar y seleccionar solo los presentes
    alumnosSeleccionados.value = props.alumnosDisponibles
      .filter((alumno) => presentes.includes(alumno.id))
      .map((alumno) => alumno.id);
  } catch (error) {
    console.error('Error al filtrar por asistencia:', error);
  }
};

const confirmSelection = () => {
  if (!selectedEstado.value) return;

  emit('update', {
    estado: selectedEstado.value,
    observacion: observacion.value,
    alumnosIds: alumnosSeleccionados.value,
    compases: props.compasesSeleccionados,
  });

  resetForm();
  emit('close');
};

const cancelSelection = () => {
  resetForm();
  emit('close');
};

const resetForm = () => {
  selectedEstado.value = '';
  observacion.value = '';
  alumnosSeleccionados.value = [...props.alumnosPreseleccionados];
};

// Sincronizar con props al abrir el modal
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      alumnosSeleccionados.value = [...props.alumnosPreseleccionados];
    }
  },
);

// Cargar datos de asistencia al abrir si se solicita
watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen && props.showAttendanceFilter && props.classeId) {
      try {
        await attendanceStore.fetchAttendanceForSession(props.classeId, props.fechaSesion);
      } catch (error) {
        console.error('Error al cargar datos de asistencia:', error);
      }
    }
  },
);
</script>

<style scoped>
/* Estilos para checkboxes indeterminados */
input[type="checkbox"]:indeterminate {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3crect width='8' height='2' x='4' y='7' fill='%23fff'/%3e%3c/svg%3e");
}
</style>
