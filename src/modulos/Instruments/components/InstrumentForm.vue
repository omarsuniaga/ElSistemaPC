// Instruments/components/InstrumentForm.vue
<script setup lang="ts">
import { ref, computed, onMounted, watch, defineProps, defineEmits } from 'vue';
import type { Instrument } from '../types/instrumentsTypes';

// Props y Emits
const props = defineProps<{
  instrument?: Instrument;
  isCreating?: boolean;
}>();

const emit = defineEmits<{
  (e: 'save', instrument: Partial<Instrument>): void;
  (e: 'cancel'): void;
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
  emit('save', instrumentForm.value);
};

const cancelar = () => {
  emit('cancel');
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
const getStatusClass = (status: string | undefined): string => {
  const statusMap: Record<string, string> = {
    'excelente': 'bg-green-100 text-green-800',
    'bueno': 'bg-blue-100 text-blue-800',
    'regular': 'bg-yellow-100 text-yellow-800',
    'funcional': 'bg-orange-100 text-orange-800',
    'necesitaReparacion': 'bg-red-100 text-red-800',
    'malo': 'bg-red-100 text-red-800',
    'faltante': 'bg-gray-100 text-gray-800'
  };
  
  return statusMap[status || ''] || 'bg-gray-100 text-gray-800';
};
</script>

<template>
  <form @submit.prevent="guardar" class="space-y-4">
    <!-- Acordeón: Información Básica -->
    <div class="border rounded-md overflow-hidden">
      <div 
        @click="accordionOpen.info = !accordionOpen.info"
        class="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
      >
        <h3 class="font-medium">Información Básica</h3>
        <svg class="w-5 h-5 transition-transform" :class="accordionOpen.info ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
      
      <div v-if="accordionOpen.info" class="p-3 border-t space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Nombre *</label>
            <input v-model="instrumentForm.nombre" type="text" required class="mt-1 block w-full border rounded-md px-3 py-2" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Familia</label>
            <input v-model="instrumentForm.familia" type="text" class="mt-1 block w-full border rounded-md px-3 py-2" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Tamaño/Tipo</label>
            <input v-model="instrumentForm.tamaño" type="text" class="mt-1 block w-full border rounded-md px-3 py-2" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Ubicación</label>
            <input v-model="instrumentForm.ubicacion" type="text" class="mt-1 block w-full border rounded-md px-3 py-2" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Fecha de Ingreso</label>
            <input v-model="instrumentForm.fechaIngreso" type="date" class="mt-1 block w-full border rounded-md px-3 py-2" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Estado</label>
            <select v-model="instrumentForm.activo" class="mt-1 block w-full border rounded-md px-3 py-2">
              <option :value="true">Activo</option>
              <option :value="false">Inactivo</option>
            </select>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Acordeón: Detalles Técnicos -->
    <div class="border rounded-md overflow-hidden">
      <div 
        @click="accordionOpen.details = !accordionOpen.details"
        class="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
      >
        <h3 class="font-medium">Detalles Técnicos</h3>
        <svg class="w-5 h-5 transition-transform" :class="accordionOpen.details ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
      
      <div v-if="accordionOpen.details" class="p-3 border-t space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Marca</label>
            <input v-model="instrumentForm.marca" type="text" class="mt-1 block w-full border rounded-md px-3 py-2" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Modelo</label>
            <input v-model="instrumentForm.modelo" type="text" class="mt-1 block w-full border rounded-md px-3 py-2" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Número de Serie</label>
            <input v-model="instrumentForm.serial" type="text" class="mt-1 block w-full border rounded-md px-3 py-2" />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Acordeón: Estado del Instrumento -->
    <div class="border rounded-md overflow-hidden">
      <div 
        @click="accordionOpen.status = !accordionOpen.status"
        class="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
      >
        <h3 class="font-medium">Estado del Instrumento</h3>
        <svg class="w-5 h-5 transition-transform" :class="accordionOpen.status ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
      
      <div v-if="accordionOpen.status" class="p-3 border-t space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700">Condición</label>
          <select v-model="instrumentForm.estado" class="mt-1 block w-full border rounded-md px-3 py-2">
            <option value="excelente">Excelente</option>
            <option value="bueno">Bueno</option>
            <option value="regular">Regular</option>
            <option value="funcional">Funcional</option>
            <option value="necesitaReparacion">Necesita reparación</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700">Detalles del estado</label>
          <textarea v-model="instrumentForm.detallesEstado" rows="3" class="mt-1 block w-full border rounded-md px-3 py-2"></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700">Observaciones generales</label>
          <textarea v-model="instrumentForm.observaciones" rows="3" class="mt-1 block w-full border rounded-md px-3 py-2"></textarea>
        </div>
      </div>
    </div>
    
    <!-- Acordeón: Accesorios y Estuche -->
    <div class="border rounded-md overflow-hidden">
      <div 
        @click="accordionOpen.accessories = !accordionOpen.accessories"
        class="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
      >
        <h3 class="font-medium">Accesorios y Estuche</h3>
        <svg class="w-5 h-5 transition-transform" :class="accordionOpen.accessories ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
      
      <div v-if="accordionOpen.accessories" class="p-3 border-t space-y-3">
        <!-- Estuche -->
        <div class="border-b pb-3">
          <h4 class="font-medium mb-2">Estuche</h4>
          <div class="flex items-center mb-2">
            <input type="checkbox" v-model="instrumentForm.estuche!.tiene" class="mr-2" />
            <label>Incluye estuche</label>
          </div>
          
          <div v-if="instrumentForm.estuche?.tiene">
            <label class="block text-sm font-medium text-gray-700">Estado del estuche</label>
            <select v-model="instrumentForm.estuche!.estado" class="mt-1 block w-full border rounded-md px-3 py-2">
              <option value="excelente">Excelente</option>
              <option value="bueno">Bueno</option>
              <option value="regular">Regular</option>
              <option value="malo">Malo</option>
            </select>
            
            <label class="block text-sm font-medium text-gray-700 mt-2">Observaciones</label>
            <input v-model="instrumentForm.estuche!.observacion" type="text" class="mt-1 block w-full border rounded-md px-3 py-2" />
          </div>
        </div>
        
        <!-- Accesorios -->
        <div>
          <h4 class="font-medium mb-2">Accesorios</h4>
          
          <!-- Lista de accesorios actuales -->
          <div v-if="instrumentForm.accesorios && instrumentForm.accesorios.length > 0" class="mb-4">
            <div 
              v-for="(acc, idx) in instrumentForm.accesorios" 
              :key="idx"
              class="flex justify-between items-center p-2 bg-gray-50 mb-1 rounded"
            >
              <div>
                <span class="font-medium">{{ acc.nombre }}</span>
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
                class="text-red-600 hover:text-red-800"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
          
          <!-- Formulario para agregar nuevo accesorio -->
          <div class="border p-3 rounded-md">
            <h5 class="text-sm font-medium mb-2">Agregar accesorio</h5>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
              <input v-model="newAccessory.nombre" type="text" placeholder="Nombre" class="px-3 py-1 border rounded-md" />
              
              <select v-model="newAccessory.estado" class="px-3 py-1 border rounded-md">
                <option value="excelente">Excelente</option>
                <option value="bueno">Bueno</option>
                <option value="regular">Regular</option>
                <option value="malo">Malo</option>
                <option value="faltante">Faltante</option>
              </select>
              
              <input v-model="newAccessory.observacion" type="text" placeholder="Observaciones" class="px-3 py-1 border rounded-md" />
            </div>
            
            <button 
              type="button" 
              @click="addAccessory" 
              class="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 w-full"
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
        class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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