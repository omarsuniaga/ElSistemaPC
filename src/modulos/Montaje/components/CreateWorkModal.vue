<template>
  <div class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto h-full w-full flex justify-center items-start z-50 pt-8 pb-8">
    <div class="relative p-6 border w-full max-w-4xl mx-4 shadow-lg rounded-lg dark:bg-gray-700">
      <h3 class="text-2xl font-bold text-gray-100 mb-8">Crear Nueva Obra Musical</h3>
      
      <form class="space-y-6 w-full" @submit.prevent="handleSubmit">
        <div class="relative z-0 w-full group mb-6">
          <input
id="name" v-model="form.name" type="text" required
                 class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" 
                 placeholder=" " />
          <label
for="name" 
                 class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
            Nombre de la Obra
          </label>
        </div>

        <div class="relative z-0 w-full group mb-6">
          <input
id="composer" v-model="form.composer" type="text" required
                 class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" 
                 placeholder=" " />
          <label
for="composer" 
                 class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
            Compositor
          </label>
        </div>

        <div class="relative z-0 w-full group mb-6">
          <textarea
id="description" v-model="form.description" rows="3"
                    class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                    placeholder=" "></textarea>
          <label
for="description" 
                 class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
            Descripción
          </label>
        </div>

        <div class="grid md:grid-cols-2 md:gap-6">
          <div class="relative z-0 w-full group mb-6">
            <input
id="compas" v-model.number="form.compas" type="number" required min="1"
                   class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                   placeholder=" " />
            <label
for="compas" 
                   class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
              Total de Compases
            </label>
          </div>
          <div class="relative z-0 w-full group mb-6">
            <input
id="agruparEn" v-model.number="form.agruparEn" type="number" required min="1"
                   class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                   placeholder=" " />
            <label
for="agruparEn" 
                   class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
              Compases por fila
            </label>
          </div>
        </div>

        <div class="grid md:grid-cols-2 md:gap-6">
          <div class="relative z-0 w-full group mb-6">
            <input
id="key" v-model="form.key" type="text"
                   class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                   placeholder=" " />
            <label
for="key" 
                   class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
              Tonalidad
            </label>
          </div>
          <div class="relative z-0 w-full group mb-6">
            <input
id="tempo" v-model="form.tempo" type="text"
                   class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                   placeholder=" " />
            <label
for="tempo" 
                   class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
              Tempo
            </label>
          </div>
        </div>

        <div class="relative z-0 w-full group mb-6">
          <input
id="timeSignature" v-model="form.timeSignature" type="text"
                 class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                 placeholder=" " />
          <label
for="timeSignature" 
                 class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
            Compás
          </label>
        </div>

        <div class="grid md:grid-cols-2 md:gap-6">
          <div class="relative z-0 w-full group mb-6">
            <input
id="startDate" v-model="form.startDate" type="date"
                   class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                   placeholder=" " />
            <label
for="startDate" 
                   class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
              Fecha de Inicio
            </label>
          </div>
          <div class="relative z-0 w-full group mb-6">
            <input
id="endDate" v-model="form.endDate" 
                   type="date"
                   class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                   placeholder=" " />
            <label
for="endDate" 
                   class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
              Fecha de Fin (Opcional)
            </label>
          </div>
        </div>

        <!-- Sección de Instrumentos -->
        <div class="mt-6">
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Instrumentos</h3>
            <button
              type="button"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              @click="showInstrumentsModal = true"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Agregar Instrumentos
            </button>
          </div>
          
          <!-- Lista de instrumentos seleccionados -->
          <div v-if="form.instruments && form.instruments.length > 0" class="mt-2">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <div
v-for="(instrument, index) in form.instruments" :key="index" 
                   class="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                <span class="text-sm text-gray-800 dark:text-gray-200">
                  {{ instrument.name }} 
                  <span class="text-xs text-gray-500 dark:text-gray-400">(x{{ instrument.count }})</span>
                </span>
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-gray-500 dark:text-gray-400">
            No se han agregado instrumentos a esta obra.
          </p>
        </div>

        <div class="flex justify-end space-x-3 mt-8">
          <button
type="button" class="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600"
                  @click="$emit('close')">
            Cancelar
          </button>
          <button
type="submit"
                  class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
            Crear Obra
          </button>
        </div>
      </form>
    </div>
  </div>
    <!-- Modal de Instrumentos -->
    <InstrumentsModal 
      :is-open="showInstrumentsModal"
      :initial-instruments="form.instruments"
      @close="showInstrumentsModal = false"
      @save="handleInstrumentsUpdate"
    />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import InstrumentsModal from './InstrumentsModal.vue';
import { useMusicalWorks } from '../composables/useHeatMapProjects';
import type { MusicalWork, Instrument, LevelConfig } from '../type/heatmap';

const emit = defineEmits(['close', 'workCreated']);
const { createWork, getDefaultInstruments, defaultLevels } = useMusicalWorks();

interface WorkForm {
  name: string
  composer: string
  description: string
  compas: number
  agruparEn: number
  key: string
  tempo?: string
  timeSignature?: string
  requirements: string
  techniques: string
  startDate: string
  endDate: string
  instruments: Array<{ name: string; count: number }>
  levels: LevelConfig[]
}

// Función para formatear fechas a YYYY-MM-DD (formato input date)
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Función para sumar meses a una fecha
const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const form = ref<WorkForm>({
  name: '',
  composer: '',
  description: '',
  compas: 30, // Número total de compases
  agruparEn: 10, // Agrupar en X compases por fila
  key: 'Do Mayor',
  tempo: 'Moderato',
  timeSignature: '4/4',
  requirements: '',
  techniques: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  instruments: getDefaultInstruments(),
  levels: defaultLevels,
});

// Bloquear y desbloquear scroll del body
const lockBodyScroll = () => {
  document.body.style.overflow = 'hidden';
  document.body.style.paddingRight = '15px'; // Compensar el ancho de la barra de desplazamiento
};

const unlockBodyScroll = () => {
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
};

// Manejar el cierre con la tecla Escape
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    emit('close');
  }
};

// Inicializar fechas al montar el componente
const initializeDates = () => {
  const today = new Date();
  
  // Establecer fecha de inicio a hoy si no hay una establecida
  if (!form.value.startDate) {
    form.value.startDate = formatDate(today);
  }
  
  // Establecer fecha de fin a 6 meses después de la fecha de inicio
  if (!form.value.endDate) {
    const startDate = form.value.startDate ? new Date(form.value.startDate) : today;
    const endDate = addMonths(startDate, 6);
    form.value.endDate = formatDate(endDate);
  }
};

onMounted(() => {
  lockBodyScroll();
  document.addEventListener('keydown', handleEscape);
  initializeDates();
});

const userModifiedEndDate = ref(false);
const showInstrumentsModal = ref(false);

const handleInstrumentsUpdate = (instruments: Array<{ name: string; count: number }>) => {
  form.value.instruments = instruments;
};

// Función para establecer la fecha de fin por defecto (6 meses después de la fecha de inicio)
const setDefaultEndDate = () => {
  if (form.value.startDate && !userModifiedEndDate.value) {
    const startDate = new Date(form.value.startDate);
    const endDate = addMonths(startDate, 6);
    form.value.endDate = formatDate(endDate);
  }
};

// Watcher para actualizar la fecha de fin cuando cambia la fecha de inicio
watch(() => form.value.startDate, (newStartDate) => {
  if (newStartDate && !userModifiedEndDate.value) {
    const startDate = new Date(newStartDate);
    const endDate = addMonths(startDate, 6);
    form.value.endDate = formatDate(endDate);
  }
});

// Manejar cambios manuales en la fecha de fin
const handleEndDateChange = () => {
  userModifiedEndDate.value = true;
};

onBeforeUnmount(() => {
  unlockBodyScroll();
  document.removeEventListener('keydown', handleEscape);
});

const handleSubmit = async () => {
  try {
    // Solo enviamos las propiedades requeridas y las que vienen del formulario
    const workData: Partial<MusicalWork> & Pick<MusicalWork, 'name' | 'composer'> = {
      name: form.value.name,
      composer: form.value.composer,
      description: form.value.description,
      compas: form.value.compas || 30,
      agruparEn: form.value.agruparEn || 10,
      key: form.value.key || 'Do Mayor',
      tempo: form.value.tempo,
      timeSignature: form.value.timeSignature,
      requirements: form.value.requirements || '',
      techniques: form.value.techniques || '',
      startDate: form.value.startDate || new Date().toISOString().split('T')[0],
      endDate: form.value.endDate,
      instruments: form.value.instruments?.length ? form.value.instruments : getDefaultInstruments(),
      levels: form.value.levels?.length ? form.value.levels : defaultLevels,
      // Valores por defecto
      genre: 'Clásico',
      difficulty: 2,
      duration: 5,
      totalMeasures: form.value.compas || 30,
      status: 'planning',
      priority: 1,
      tags: [],
      sections: [],
      resources: [],
      milestones: [],
    };

    const newWorkId = await createWork(workData);
    emit('workCreated', newWorkId);
    emit('close');
  } catch (error) {
    console.error('Error al crear la obra:', error);
    alert('Error al crear la obra. Consulta la consola para más detalles.');
  }
};
</script>

<style scoped>
/* Puedes añadir estilos específicos del modal aquí si es necesario */
</style>
