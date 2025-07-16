<template>
  <div class="measure-manager-view p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
    <div v-if="montajeStore.isLoading" class="text-center text-gray-600 dark:text-gray-400">
      Cargando compases...
    </div>
    <div v-else-if="montajeStore.error" class="text-center text-red-600 dark:text-red-400">
      Error: {{ montajeStore.error }}
    </div>
    <div v-else-if="!montajeStore.obraActual" class="text-center text-gray-600 dark:text-gray-400">
      Obra no encontrada.
    </div>
    <div v-else class="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Gestión de Compases para {{ montajeStore.obraActual.titulo }} ({{ selectedInstrumentName }})
      </h1>
      <p class="text-gray-600 dark:text-gray-300 mb-4">
        Aquí puedes gestionar el estado de cada compás para el instrumento seleccionado.
      </p>

      <!-- Controles de estado de compás -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <div
          v-for="estado in Object.values(EstadoCompass)"
          :key="estado"
          class="p-3 rounded-lg text-center cursor-pointer"
          :class="getCompassStatusClass(estado)"
          @click="setGlobalStatus(estado)"
        >
          {{ estado }}
        </div>
      </div>

      <!-- Lista de Compases -->
      <div class="grid grid-cols-8 gap-2">
        <div
          v-for="compasNum in totalCompases"
          :key="compasNum"
          class="p-2 border rounded text-center text-sm cursor-pointer"
          :class="getCompassClass(compasNum)"
          @click="cycleCompassStatus(compasNum)"
        >
          {{ compasNum }}
        </div>
      </div>

      <!-- Observación de la clase -->
      <div class="mt-6">
        <label for="class-observation" class="block text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Observación de la Clase
        </label>
        <textarea
          id="class-observation"
          v-model="classObservation"
          rows="4"
          class="input w-full"
          placeholder="Añade una observación sobre el trabajo de la clase..."
        ></textarea>
      </div>

      <!-- Botón Guardar -->
      <div class="mt-6 text-right">
        <button class="btn btn-primary" @click="saveChanges">
          Guardar Cambios y Observación
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMontajeStore } from '../store/montaje';
import { EstadoCompass, TipoInstrumento, EstadoCompassDetalle, CambioEstadoCompass } from '../types/montaje';

const route = useRoute();
const router = useRouter();
const montajeStore = useMontajeStore();

const obraId = route.params.obraId as string;
const instrumentoId = route.params.instrumentoId as TipoInstrumento;

const totalCompases = ref(0);
const currentCompassStates = ref<Map<number, EstadoCompassDetalle>>(new Map());
const classObservation = ref('');

// Computed para el nombre del instrumento seleccionado
const selectedInstrumentName = computed(() => {
  const obra = montajeStore.obraActual;
  if (obra && obra.instrumentosRequeridos) {
    const instrumento = obra.instrumentosRequeridos.find(
      (inst) => inst.instrumentoId === instrumentoId
    );
    return instrumento ? instrumento.nombre : instrumentoId;
  }
  return instrumentoId;
});

onMounted(async () => {
  if (obraId) {
    await montajeStore.cargarObra(obraId);
    await montajeStore.cargarEstadosCompases(obraId); // Cargar estados de compases de la obra
    if (montajeStore.obraActual) {
      totalCompases.value = montajeStore.obraActual.totalCompases;
      // Inicializar currentCompassStates con los estados existentes o SIN_TRABAJAR
      for (let i = 1; i <= totalCompases.value; i++) {
        const existingState = montajeStore.estadosCompases.get(i);
        if (existingState) {
          currentCompassStates.value.set(i, existingState);
        } else {
          currentCompassStates.value.set(i, {
            compas: i,
            estado: EstadoCompass.SIN_TRABAJAR,
            instrumentos: {}, // Se llenará con el estado del instrumento actual
            observaciones: [],
            fechaUltimaModificacion: null,
            modificadoPor: '',
            sesionesEnsayo: 0,
            dificultadesEspecificas: [],
          });
        }
      }
    }
  }
});

// Watch para actualizar currentCompassStates si los estados del store cambian
watch(
  () => montajeStore.estadosCompases,
  (newStates) => {
    newStates.forEach((value, key) => {
      currentCompassStates.value.set(key, value);
    });
  },
  { deep: true }
);

const getCompassStatusClass = (estado: EstadoCompass) => {
  switch (estado) {
    case EstadoCompass.SIN_TRABAJAR: return 'bg-gray-200 text-gray-800';
    case EstadoCompass.LEIDO: return 'bg-blue-200 text-blue-800';
    case EstadoCompass.EN_PROGRESO: return 'bg-yellow-200 text-yellow-800';
    case EstadoCompass.CON_DIFICULTAD: return 'bg-red-200 text-red-800';
    case EstadoCompass.LOGRADO: return 'bg-green-200 text-green-800';
    case EstadoCompass.DOMINADO: return 'bg-purple-200 text-purple-800';
    case EstadoCompass.COMPLETADO: return 'bg-teal-200 text-teal-800';
    case EstadoCompass.NO_TRABAJADO: return 'bg-gray-400 text-white';
    default: return 'bg-gray-200 text-gray-800';
  }
};

const getCompassClass = (compasNum: number) => {
  const estadoDetalle = currentCompassStates.value.get(compasNum);
  const estado = estadoDetalle?.instrumentos[instrumentoId] || EstadoCompass.SIN_TRABAJAR;
  return getCompassStatusClass(estado);
};

const cycleCompassStatus = (compasNum: number) => {
  const currentState = currentCompassStates.value.get(compasNum)?.instrumentos[instrumentoId] || EstadoCompass.SIN_TRABAJAR;
  let nextState: EstadoCompass;

  switch (currentState) {
    case EstadoCompass.SIN_TRABAJAR: nextState = EstadoCompass.LEIDO; break;
    case EstadoCompass.LEIDO: nextState = EstadoCompass.EN_PROGRESO; break;
    case EstadoCompass.EN_PROGRESO: nextState = EstadoCompass.CON_DIFICULTAD; break;
    case EstadoCompass.CON_DIFICULTAD: nextState = EstadoCompass.LOGRADO; break;
    case EstadoCompass.LOGRADO: nextState = EstadoCompass.DOMINADO; break;
    case EstadoCompass.DOMINADO: nextState = EstadoCompass.COMPLETADO; break;
    case EstadoCompass.COMPLETADO: nextState = EstadoCompass.SIN_TRABAJAR; break;
    default: nextState = EstadoCompass.SIN_TRABAJAR; break;
  }

  // Actualizar estado localmente
  const updatedEstadoDetalle = currentCompassStates.value.get(compasNum) || {
    compas: compasNum,
    estado: EstadoCompass.SIN_TRABAJAR, // Estado general de la frase, no del instrumento
    instrumentos: {},
    observaciones: [],
    fechaUltimaModificacion: null,
    modificadoPor: '',
    sesionesEnsayo: 0,
    dificultadesEspecificas: [],
  };
  updatedEstadoDetalle.instrumentos[instrumentoId] = nextState;
  currentCompassStates.value.set(compasNum, updatedEstadoDetalle);
};

const setGlobalStatus = (estado: EstadoCompass) => {
  for (let i = 1; i <= totalCompases.value; i++) {
    const updatedEstadoDetalle = currentCompassStates.value.get(i) || {
      compas: i,
      estado: EstadoCompass.SIN_TRABAJAR,
      instrumentos: {},
      observaciones: [],
      fechaUltimaModificacion: null,
      modificadoPor: '',
      sesionesEnsayo: 0,
      dificultadesEspecificas: [],
    };
    updatedEstadoDetalle.instrumentos[instrumentoId] = estado;
    currentCompassStates.value.set(i, updatedEstadoDetalle);
  }
};

const saveChanges = async () => {
  if (!montajeStore.obraActual) return;

  // Recopilar cambios y enviarlos al store
  for (let i = 1; i <= totalCompases.value; i++) {
    const estadoDetalle = currentCompassStates.value.get(i);
    if (estadoDetalle && estadoDetalle.instrumentos[instrumentoId]) {
      const nuevoEstado = estadoDetalle.instrumentos[instrumentoId];
      // Solo enviar si el estado ha cambiado o si es un estado inicial
      // TODO: Comparar con el estado original cargado desde Firebase
      await montajeStore.cambiarEstadoCompass(
        i,
        nuevoEstado,
        // Aquí necesitamos el fraseId. Esto es un problema.
        // La gestión de compases es por obra, no por frase en este punto.
        // Necesitamos revisar cómo se mapean los compases a las frases.
        // Por ahora, pasaremos un string vacío o un placeholder.
        '', // Placeholder para fraseId
        classObservation.value // La observación se pasa como razón del cambio
      );
    }
  }

  // Guardar la observación de la clase
  if (classObservation.value.trim() !== '') {
    // Aquí se llamaría a un método en el store para guardar la observación
    // montajeStore.crearObservacion({
    //   obraId: montajeStore.obraActual.id,
    //   maestroId: authStore.user?.uid, // Necesitamos authStore aquí
    //   contenido: classObservation.value,
    //   tipo: 'general',
    //   recomendaciones: [],
    //   resuelto: false,
    // });
    console.log('Observación de la clase guardada:', classObservation.value);
  }

  alert('Cambios guardados y observación registrada.');
  router.back(); // Volver a la vista anterior
};
</script>

<style scoped>
/* Estilos específicos para MeasureManagerView */
.input {
  @apply p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500;
}
.btn-primary {
  @apply bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>
