// Instruments/components/InstrumentDetails.vue
<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Instrument } from '../types/instrumentsTypes';

const props = defineProps<{
  instrument: Instrument;
}>();

const emit = defineEmits<{
  (e: 'edit'): void;
  (e: 'delete'): void;
}>();

// Formatear fechas
const formatDate = (date: string | Date | undefined): string => {
  if (!date) return '-';
  try {
    return format(new Date(date), 'PPP', { locale: es });
  } catch (err) {
    return String(date);
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
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <div class="bg-indigo-600 p-4 text-white flex justify-between items-center">
      <h2 class="text-lg font-semibold">{{ instrument.nombre }}</h2>
      
      <div class="flex space-x-2">
        <button 
          @click="emit('edit')" 
          class="p-1 bg-white bg-opacity-20 rounded-md hover:bg-opacity-30"
          title="Editar"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
        </button>
        
        <button 
          @click="emit('delete')" 
          class="p-1 bg-white bg-opacity-20 rounded-md hover:bg-opacity-30"
          title="Eliminar"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
      </div>
    </div>
    
    <div class="p-4">
      <!-- Información básica -->
      <div class="mb-6">
        <h3 class="text-lg font-medium border-b pb-2 mb-3">Información General</h3>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-500">Familia</p>
            <p>{{ instrument.familia || '-' }}</p>
          </div>
          
          <div>
            <p class="text-sm text-gray-500">Tamaño</p>
            <p>{{ instrument.tamaño || '-' }}</p>
          </div>
          
          <div>
            <p class="text-sm text-gray-500">Marca</p>
            <p>{{ instrument.marca || '-' }}</p>
          </div>
          
          <div>
            <p class="text-sm text-gray-500">Modelo</p>
            <p>{{ instrument.modelo || '-' }}</p>
          </div>
          
          <div>
            <p class="text-sm text-gray-500">Número de Serie</p>
            <p>{{ instrument.serial || '-' }}</p>
          </div>
          
          <div>
            <p class="text-sm text-gray-500">Fecha de Ingreso</p>
            <p>{{ formatDate(instrument.fechaIngreso) }}</p>
          </div>
          
          <div>
            <p class="text-sm text-gray-500">Ubicación</p>
            <p>{{ instrument.ubicacion || '-' }}</p>
          </div>
          
          <div>
            <p class="text-sm text-gray-500">Estado</p>
            <p>
              <span 
                class="inline-block px-2 py-1 text-xs rounded-full"
                :class="getStatusClass(instrument.estado)"
              >
                {{ instrument.estado || 'No especificado' }}
              </span>
            </p>
          </div>
        </div>
        
        <div class="mt-3" v-if="instrument.detallesEstado">
          <p class="text-sm text-gray-500">Detalles del estado</p>
          <p class="text-sm bg-gray-50 p-2 rounded">{{ instrument.detallesEstado }}</p>
        </div>
      </div>
      
      <!-- Estuche -->
      <div class="mb-6" v-if="instrument.estuche">
        <h3 class="text-lg font-medium border-b pb-2 mb-3">Estuche</h3>
        
        <div v-if="instrument.estuche.tiene">
          <div class="flex items-center mb-2">
            <span 
              class="inline-block mr-2 px-2 py-1 text-xs rounded-full"
              :class="getStatusClass(instrument.estuche.estado)"
            >
              {{ instrument.estuche.estado || 'No especificado' }}
            </span>
            <span v-if="instrument.estuche.observacion" class="text-sm">
              {{ instrument.estuche.observacion }}
            </span>
          </div>
        </div>
        <p v-else class="text-sm text-gray-600">No incluye estuche</p>
      </div>
      
      <!-- Accesorios -->
      <div class="mb-6" v-if="instrument.accesorios && instrument.accesorios.length > 0">
        <h3 class="text-lg font-medium border-b pb-2 mb-3">Accesorios</h3>
        
        <div class="space-y-2">
          <div 
            v-for="(acc, idx) in instrument.accesorios" 
            :key="idx"
            class="flex justify-between p-2 border rounded"
          >
            <div>
              <span class="font-medium">{{ acc.nombre }}</span>
              <span v-if="acc.observacion" class="block text-sm text-gray-600">
                {{ acc.observacion }}
              </span>
            </div>
            <span 
              class="text-xs px-2 py-1 rounded-full"
              :class="getStatusClass(acc.estado)"
            >
              {{ acc.estado }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- Historial -->
      <div class="mb-6" v-if="instrument.historial && instrument.historial.length > 0">
        <h3 class="text-lg font-medium border-b pb-2 mb-3">Historial de Uso</h3>
        
        <div class="space-y-2">
          <div 
            v-for="(entry, idx) in instrument.historial" 
            :key="idx"
            class="p-2 border rounded"
          >
            <div class="flex justify-between">
              <span class="font-medium">{{ entry.nombreAlumno }}</span>
              <span class="text-xs text-gray-500">
                {{ formatDate(entry.fechaInicio) }} - {{ entry.fechaFin ? formatDate(entry.fechaFin) : 'Actual' }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Observaciones -->
      <div v-if="instrument.observaciones">
        <h3 class="text-lg font-medium border-b pb-2 mb-3">Observaciones</h3>
        <p class="text-sm bg-gray-50 p-3 rounded">{{ instrument.observaciones }}</p>
      </div>
    </div>
  </div>
</template>