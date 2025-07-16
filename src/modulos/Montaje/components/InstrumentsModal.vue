<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
    <div
class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 scale-95 opacity-0"
         :class="{ 'scale-100 opacity-100': isOpen }">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Instrumentos de la Obra</h3>
        <button class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" @click="closeModal">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 overflow-y-auto flex-1">
        <!-- Buscador con autocompletado -->
        <div class="relative mb-6">
          <div class="relative">
            <input
              ref="searchInput"
              v-model="searchTerm"
              type="text"
              class="w-full pl-4 pr-10 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Buscar instrumento..."
              @keyup.enter="addInstrument"
              @input="updateFilteredInstruments"
            />
            <div class="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <!-- Lista de sugerencias -->
          <div
v-if="filteredInstruments.length > 0 && searchTerm" 
               class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-72 overflow-auto transition-all duration-200 transform origin-top">
            <div
v-for="instrument in filteredInstruments"
                 :key="instrument"
                 class="px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer flex items-center group"
                 @click="selectInstrument(instrument)">
              <span class="text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {{ instrument }}
              </span>
            </div>
          </div>
        </div>

        <!-- Lista de instrumentos seleccionados -->
        <div class="space-y-2">
          <div v-if="selectedInstruments.length > 0" class="space-y-2">
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Instrumentos seleccionados</h4>
            <div class="flex flex-wrap gap-2">
              <div
v-for="(instrument, index) in selectedInstruments"
                   :key="index"
                   class="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 group">
                <span>{{ instrument }}</span>
                <button
class="ml-2 p-0.5 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors" 
                        @click="removeInstrument(index)">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <p v-else class="text-center py-4 text-gray-500 dark:text-gray-400">
            No se han agregado instrumentos. Comienza a escribir para buscar.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
        <button
          class="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          @click="closeModal"
        >
          Cancelar
        </button>
        <button
          class="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-md hover:shadow-lg"
          @click="saveInstruments"
        >
          Guardar Cambios
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';

type InstrumentItem = string;

interface MusicalWork {
  instruments?: string[];
  [key: string]: any;
}

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  initialInstruments: {
    type: Array as () => InstrumentItem[],
    default: () => [],
    required: false,
  },
});

const emit = defineEmits(['close', 'save']);

// Estado del componente
const searchTerm = ref('');
const selectedInstruments = ref<string[]>([]);
const allInstruments = ref<string[]>([]);
const searchInput = ref<HTMLInputElement | null>(null);

// Instrumentos por defecto para el autocompletado
const defaultInstruments = [
  'Violín I', 'Violín II', 'Viola', 'Violonchelo', 'Contrabajo',
  'Flauta', 'Flautín', 'Oboe', 'Corno Inglés', 'Clarinete en Sib', 'Clarinete Bajo',
  'Fagot', 'Contrafagot', 'Trompa en Fa', 'Trompeta en Sib', 'Trombón', 'Tuba',
  'Tímpani', 'Platillos', 'Bombo', 'Triángulo', 'Piano', 'Celesta',
];

// Cargar instrumentos guardados del localStorage
const loadInstruments = () => {
  // Cargar instrumentos guardados en localStorage
  const savedInstruments = localStorage.getItem('savedInstruments');
  
  // Cargar obras anteriores para el autocompletado
  const savedWorks = localStorage.getItem('musicalWorks');
  let instrumentsFromWorks: string[] = [];
  
  if (savedWorks) {
    try {
      const works = JSON.parse(savedWorks);
      // Extraer todos los instrumentos de las obras anteriores
      works.forEach((work: MusicalWork) => {
        if (work.instruments && Array.isArray(work.instruments)) {
          work.instruments?.forEach((inst: string) => {
            if (inst && !instrumentsFromWorks.includes(inst)) {
              instrumentsFromWorks.push(inst);
            }
          });
        }
      });
    } catch (e) {
      console.error('Error al cargar obras anteriores:', e);
    }
  }

  // Combinar con instrumentos guardados
  if (savedInstruments) {
    const parsed = JSON.parse(savedInstruments);
    // Asegurarse de que no hay duplicados
    allInstruments.value = [...new Set([...parsed, ...instrumentsFromWorks])];
  } else {
    // Instrumentos por defecto + los de obras anteriores
    const defaultInstruments = [
      'Flauta', 'Oboe', 'Clarinete', 'Fagot', 'Corno', 'Trompeta',
      'Trombón', 'Tuba', 'Tímpani', 'Platillos', 'Violín I', 'Violín II',
      'Viola', 'Violonchelo', 'Contrabajo', 'Piano',  'Clave',
    ];
    allInstruments.value = [...new Set([...defaultInstruments, ...instrumentsFromWorks])];
    saveInstrumentsToStorage();
  }
};

// Guardar instrumentos en localStorage
const saveInstrumentsToStorage = () => {
  localStorage.setItem('savedInstruments', JSON.stringify(allInstruments.value));
};

// Función para actualizar la lista filtrada de instrumentos
const updateFilteredInstruments = () => {
  // El filtrado se maneja en la propiedad computada filteredInstruments
};

// Filtrar instrumentos según el término de búsqueda
const filteredInstruments = computed(() => {
  if (!searchTerm.value) return [];
  const term = searchTerm.value.toLowerCase().trim();
  
  return allInstruments.value
    .filter(instrument => {
      // Primero buscar coincidencias al inicio del nombre
      const startsWithTerm = instrument.toLowerCase().startsWith(term);
      // Luego buscar coincidencias en cualquier parte
      const includesTerm = instrument.toLowerCase().includes(term);
      
      // Verificar que no esté ya seleccionado
      const notSelected = !selectedInstruments.value.some(
        sel => sel.toLowerCase() === instrument.toLowerCase(),
      );
      
      return (startsWithTerm || includesTerm) && notSelected;
    })
    .sort((a, b) => {
      // Ordenar primero las coincidencias al inicio
      const aStartsWith = a.toLowerCase().startsWith(term);
      const bStartsWith = b.toLowerCase().startsWith(term);
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      // Si ambos empiezan o no con el término, ordenar alfabéticamente
      return a.localeCompare(b);
    });
});

// Agregar un nuevo instrumento
const addInstrument = () => {
  const instrumentName = searchTerm.value.trim();
  if (!instrumentName) return;

  // Verificar si el instrumento ya existe
  const normalizedSearch = instrumentName.toLowerCase();
  const exists = selectedInstruments.value.some(
    inst => inst.toLowerCase() === normalizedSearch,
  );

  if (!exists) {
    // Agregar nuevo instrumento
    selectedInstruments.value.push(instrumentName);
    
    // Agregar a la lista de instrumentos si no existe
    if (!allInstruments.value.some(inst => inst.toLowerCase() === normalizedSearch)) {
      allInstruments.value.push(instrumentName);
      saveInstrumentsToStorage();
    }
  }

  searchTerm.value = '';
};

// Seleccionar instrumento de la lista
const selectInstrument = (instrument: string) => {
  // Verificar si ya está seleccionado (insensible a mayúsculas)
  const normalizedSearch = instrument.toLowerCase();
  const exists = selectedInstruments.value.some(
    inst => inst.toLowerCase() === normalizedSearch,
  );

  if (!exists) {
    selectedInstruments.value.push(instrument);
    
    // Agregar a la lista de instrumentos si no existe
    if (!allInstruments.value.some(inst => inst.toLowerCase() === normalizedSearch)) {
      allInstruments.value.push(instrument);
      saveInstrumentsToStorage();
    }
  }
  
  // Limpiar y enfocar el campo de búsqueda
  searchTerm.value = '';
  searchInput.value?.focus();
};

// Eliminar instrumento
const removeInstrument = (index: number) => {
  selectedInstruments.value.splice(index, 1);
  // Enfocar el campo de búsqueda después de eliminar
  nextTick(() => {
    searchInput.value?.focus();
  });
};

// Editar instrumento
const editInstrument = (index: number) => {
  const instrument = selectedInstruments.value[index];
  selectedInstruments.value.splice(index, 1);
  searchTerm.value = instrument;
  searchInput.value?.focus();
};

// Guardar cambios
const saveInstruments = () => {
  emit('save', selectedInstruments.value);
  closeModal();
};

// Cerrar el modal
const closeModal = () => {
  searchTerm.value = '';
  emit('close');
};

// Inicializar
onMounted(() => {
  loadInstruments();
  if (props.initialInstruments) {
    selectedInstruments.value = [...props.initialInstruments];
  }
});

// Resetear cuando se abre el modal
watch(() => props.isOpen, (newVal: boolean) => {
  if (newVal) {
    selectedInstruments.value = props.initialInstruments ? [...props.initialInstruments] : [];
    // Recargar instrumentos para incluir los de nuevas obras
    loadInstruments();
    // Enfocar el campo de búsqueda al abrir
    nextTick(() => {
      searchInput.value?.focus();
    });
  }
});
</script>
