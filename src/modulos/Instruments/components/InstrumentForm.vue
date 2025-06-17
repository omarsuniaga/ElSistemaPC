// Instruments/components/InstrumentForm.vue
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { Instrument } from '../types/instrumentsTypes';

// Props y Emits
const props = defineProps<{
  instrument?: Instrument;
  isCreating?: boolean;
}>();

// Estados locales
const instrumentForm = ref<Partial<Instrument>>({
  nombre: '',
  familia: '',
  tamaño: '',
  marca: '',
  modelo: '',
  serial: '',
  fechaIngreso: new Date().toISOString().split('T')[0],
  estado: 'bueno',
  detallesEstado: '',
  ubicacion: '',
  accesorios: [],
  estuche: {
    tiene: false,
    estado: 'bueno'
  },
  observaciones: '',
  activo: true
});

// Accesorio temporal
const newAccessory = ref({
  nombre: '',
  estado: 'bueno' as const,
  observacion: ''
});

// Controles de acordeón
const accordionOpen = ref({
  info: true,
  details: false,
  status: false,
  accessories: false
});

// Si se está editando un instrumento, cargar los datos
watch(() => props.instrument, (newInstrument) => {
  if (newInstrument) {
    instrumentForm.value = { ...newInstrument };
    
    // Asegurar que la estructura es correcta
    if (!instrumentForm.value.accesorios) instrumentForm.value.accesorios = [];
    if (!instrumentForm.value.estuche) {
      instrumentForm.value.estuche = {
        tiene: false,
        estado: 'bueno'
      };
    }
  }
}, { immediate: true });

// Métodos
const guardar = () => {
  // Implementar la lógica para guardar el instrumento
};

const cancelar = () => {
  // Implementar la lógica para cancelar la operación
};

const addAccessory = () => {
  if (!newAccessory.value.nombre) return;
  
  if (!instrumentForm.value.accesorios) {
    instrumentForm.value.accesorios = [];
  }
  
  instrumentForm.value.accesorios.push({
    nombre: newAccessory.value.nombre,
    estado: newAccessory.value.estado,
    observacion: newAccessory.value.observacion || ''
  });
  
  // Resetear formulario de accesorio
  newAccessory.value.nombre = '';
  newAccessory.value.estado = 'bueno';
  newAccessory.value.observacion = '';
};

const removeAccessory = (index: number) => {
  if (instrumentForm.value.accesorios) {
    instrumentForm.value.accesorios.splice(index, 1);
  }
};

// Obtener clase CSS según el estado
const getStatusClass = (status: string | undefined): string => {  const statusMap: Record<string, string> = {
    'excelente': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
    'bueno': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
    'regular': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
    'funcional': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
    'necesitaReparacion': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
    'malo': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
    'faltante': 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
  };
  
  return statusMap[status || ''] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
};
</script>

<template>  <form @submit.prevent="guardar" class="space-y-4">
    <!-- Acordeón: Información Básica -->
    <div class="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
      <div 
        @click="accordionOpen.info = !accordionOpen.info"
        class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 cursor-pointer"
      >
        <h3 class="font-medium text-gray-900 dark:text-white">Información Básica</h3>
        <svg class="w-5 h-5 transition-transform text-gray-600 dark:text-gray-400" :class="accordionOpen.info ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
      
      <div v-if="accordionOpen.info" class="p-3 border-t border-gray-200 dark:border-gray-600 space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre *</label>
            <input v-model="instrumentForm.nombre" type="text" required class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Familia</label>
            <input v-model="instrumentForm.familia" type="text" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Tamaño/Tipo</label>
            <input v-model="instrumentForm.tamaño" type="text" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Ubicación</label>
            <input v-model="instrumentForm.ubicacion" type="text" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Ingreso</label>
            <input v-model="instrumentForm.fechaIngreso" type="date" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
            <select v-model="instrumentForm.activo" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option :value="true">Activo</option>
              <option :value="false">Inactivo</option>
            </select>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Acordeón: Detalles Técnicos -->
    <div class="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
      <div 
        @click="accordionOpen.details = !accordionOpen.details"
        class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 cursor-pointer"
      >
        <h3 class="font-medium text-gray-900 dark:text-white">Detalles Técnicos</h3>
        <svg class="w-5 h-5 transition-transform text-gray-600 dark:text-gray-400" :class="accordionOpen.details ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
      
      <div v-if="accordionOpen.details" class="p-3 border-t border-gray-200 dark:border-gray-600 space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Marca</label>
            <input v-model="instrumentForm.marca" type="text" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Modelo</label>
            <input v-model="instrumentForm.modelo" type="text" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Número de Serie</label>
            <input v-model="instrumentForm.serial" type="text" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Acordeón: Estado del Instrumento -->
    <div class="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">      <div 
        @click="accordionOpen.status = !accordionOpen.status"
        class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 cursor-pointer"
      >
        <h3 class="font-medium text-gray-900 dark:text-white">Estado del Instrumento</h3>
        <svg class="w-5 h-5 transition-transform text-gray-600 dark:text-gray-400" :class="accordionOpen.status ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
      
      <div v-if="accordionOpen.status" class="p-3 border-t border-gray-200 dark:border-gray-600 space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Condición</label>
          <select v-model="instrumentForm.estado" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option value="excelente">Excelente</option>
            <option value="bueno">Bueno</option>
            <option value="regular">Regular</option>
            <option value="funcional">Funcional</option>
            <option value="necesitaReparacion">Necesita reparación</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Detalles del estado</label>
          <textarea v-model="instrumentForm.detallesEstado" rows="3" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones generales</label>
          <textarea v-model="instrumentForm.observaciones" rows="3" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
        </div>
      </div>
    </div>
    
    <!-- Acordeón: Accesorios y Estuche -->
    <div class="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
      <div 
        @click="accordionOpen.accessories = !accordionOpen.accessories"
        class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 cursor-pointer"
      >
        <h3 class="font-medium text-gray-900 dark:text-white">Accesorios y Estuche</h3>
        <svg class="w-5 h-5 transition-transform text-gray-600 dark:text-gray-400" :class="accordionOpen.accessories ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
      
      <div v-if="accordionOpen.accessories" class="p-3 border-t border-gray-200 dark:border-gray-600 space-y-3">
        <!-- Estuche -->
        <div class="border-b border-gray-200 dark:border-gray-600 pb-3">
          <h4 class="font-medium mb-2 text-gray-900 dark:text-white">Estuche</h4>
          <div class="flex items-center mb-2">
            <input type="checkbox" v-model="instrumentForm.estuche!.tiene" class="mr-2 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded" />
            <label class="text-gray-700 dark:text-gray-300">Incluye estuche</label>
          </div>
          
          <div v-if="instrumentForm.estuche?.tiene">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado del estuche</label>
            <select v-model="instrumentForm.estuche!.estado" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="excelente">Excelente</option>
              <option value="bueno">Bueno</option>
              <option value="regular">Regular</option>
              <option value="malo">Malo</option>
            </select>
            
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">Observaciones</label>
            <input v-model="instrumentForm.estuche!.observacion" type="text" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
        </div>
        
        <!-- Accesorios -->
        <div>
          <h4 class="font-medium mb-2 text-gray-900 dark:text-white">Accesorios</h4>
          
          <!-- Lista de accesorios actuales -->
          <div v-if="instrumentForm.accesorios && instrumentForm.accesorios.length > 0" class="mb-4">
            <div 
              v-for="(acc, idx) in instrumentForm.accesorios" 
              :key="idx"
              class="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 mb-1 rounded"
            >
              <div>
                <span class="font-medium text-gray-900 dark:text-white">{{ acc.nombre }}</span>
                <span 
                  class="ml-2 text-xs px-2 py-0.5 rounded-full"
                  :class="getStatusClass(acc.estado)"
                >
                  {{ acc.estado }}
                </span>
              </div>
              <button 
                type="button" 
                @click="removeAccessory(idx)" 
                class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
          
          <!-- Formulario para agregar nuevo accesorio -->
          <div class="border border-gray-300 dark:border-gray-600 p-3 rounded-md">
            <h5 class="text-sm font-medium mb-2 text-gray-900 dark:text-white">Agregar accesorio</h5>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
              <input v-model="newAccessory.nombre" type="text" placeholder="Nombre" class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              
              <select v-model="newAccessory.estado" class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="excelente">Excelente</option>
                <option value="bueno">Bueno</option>
                <option value="regular">Regular</option>
                <option value="malo">Malo</option>
                <option value="faltante">Faltante</option>
              </select>
              
              <input v-model="newAccessory.observacion" type="text" placeholder="Observaciones" class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            
            <button 
              type="button" 
              @click="addAccessory" 
              class="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 w-full disabled:opacity-50"
              :disabled="!newAccessory.nombre"
            >
              Agregar
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Botones de acción -->
    <div class="flex justify-end space-x-3 mt-6">
      <button 
        type="button" 
        @click="cancelar" 
        class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800"
      >
        Cancelar
      </button>
      
      <button 
        type="submit" 
        class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
      >
        {{ props.isCreating ? 'Crear' : 'Actualizar' }}
      </button>
    </div>
  </form>
</template>