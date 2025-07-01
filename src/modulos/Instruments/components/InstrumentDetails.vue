// Instruments/components/InstrumentDetails.vue
<script setup lang="ts">
import {format} from "date-fns"
import {es} from "date-fns/locale"
import type {Instrument} from "../types/instrumentsTypes"

const props = defineProps<{
  instrument: Instrument
}>()

// Formatear fechas
const formatDate = (date: string | Date | undefined): string => {
  if (!date) return "-"
  try {
    return format(new Date(date), "PPP", {locale: es})
  } catch (err) {
    return String(date)
  }
}

// Obtener clase CSS según el estado
const getStatusClass = (status: string | undefined): string => {
  const statusMap: Record<string, string> = {
    excelente: "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300",
    bueno: "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300",
    regular: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300",
    funcional: "bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300",
    necesitaReparacion: "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300",
    malo: "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300",
    faltante: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300",
  }

  return statusMap[status || ""] || "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
}
</script>

<template>
  <div v-if="instrument" class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
    <div
      class="bg-indigo-600 dark:bg-indigo-700 p-4 text-white flex flex-col sm:flex-row justify-between items-center gap-2"
    >
      <h2 class="text-lg font-semibold truncate max-w-xs sm:max-w-md">{{ instrument.nombre }}</h2>
      <div class="flex space-x-2">
        <button
          class="p-1 bg-white bg-opacity-20 rounded-md hover:bg-opacity-30"
          title="Editar"
          @click="emit('edit')"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
        <button
          class="p-1 bg-white bg-opacity-20 rounded-md hover:bg-opacity-30"
          title="Eliminar"
          @click="emit('delete')"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
    <div class="p-4">
      <!-- Información básica -->
      <div class="mb-6">
        <h3
          class="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-3"
        >
          Información General
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Familia</p>
            <p class="text-gray-900 dark:text-white">{{ instrument.familia || "-" }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Tamaño</p>
            <p class="text-gray-900 dark:text-white">{{ instrument.tamaño || "-" }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Marca</p>
            <p class="text-gray-900 dark:text-white">{{ instrument.marca || "-" }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Modelo</p>
            <p class="text-gray-900 dark:text-white">{{ instrument.modelo || "-" }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Número de Serie</p>
            <p class="text-gray-900 dark:text-white">{{ instrument.serial || "-" }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Fecha de Ingreso</p>
            <p class="text-gray-900 dark:text-white">{{ formatDate(instrument.fechaIngreso) }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Ubicación</p>
            <p class="text-gray-900 dark:text-white">{{ instrument.ubicacion || "-" }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Estado</p>
            <span
              class="inline-block px-2 py-1 text-xs rounded-full"
              :class="getStatusClass(instrument.estado)"
            >
              {{ instrument.estado || "No especificado" }}
            </span>
          </div>
        </div>
        <div v-if="instrument.detallesEstado" class="mt-3">
          <p class="text-sm text-gray-500 dark:text-gray-400">Detalles del estado</p>
          <p class="text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded">
            {{ instrument.detallesEstado }}
          </p>
        </div>
      </div>
      <!-- Estuche -->
      <div v-if="instrument.estuche" class="mb-6">
        <h3
          class="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-3"
        >
          Estuche
        </h3>
        <div v-if="instrument.estuche.tiene">
          <div class="flex items-center mb-2">
            <span
              class="inline-block mr-2 px-2 py-1 text-xs rounded-full"
              :class="getStatusClass(instrument.estuche.estado)"
            >
              {{ instrument.estuche.estado || "No especificado" }}
            </span>
            <span
              v-if="instrument.estuche.observacion"
              class="text-sm text-gray-900 dark:text-white"
            >
              {{ instrument.estuche.observacion }}
            </span>
          </div>
        </div>
        <p v-else class="text-sm text-gray-600 dark:text-gray-400">No incluye estuche</p>
      </div>
      <!-- Accesorios -->
      <div v-if="instrument.accesorios && instrument.accesorios.length > 0" class="mb-6">
        <h3
          class="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-3"
        >
          Accesorios
        </h3>
        <div class="space-y-2">
          <div
            v-for="(acc, idx) in instrument.accesorios"
            :key="idx"
            class="flex justify-between p-2 border border-gray-200 dark:border-gray-700 rounded"
          >
            <div>
              <span class="font-medium text-gray-900 dark:text-white">{{ acc.nombre }}</span>
              <span v-if="acc.observacion" class="block text-sm text-gray-600 dark:text-gray-400">
                {{ acc.observacion }}
              </span>
            </div>
            <span class="text-xs px-2 py-1 rounded-full" :class="getStatusClass(acc.estado)">
              {{ acc.estado }}
            </span>
          </div>
        </div>
      </div>
      <!-- Historial -->
      <div v-if="instrument.historial && instrument.historial.length > 0" class="mb-6">
        <h3
          class="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-3"
        >
          Historial de Uso
        </h3>
        <div class="space-y-2">
          <div
            v-for="(entry, idx) in instrument.historial"
            :key="idx"
            class="p-2 border border-gray-200 dark:border-gray-700 rounded"
          >
            <div class="flex flex-col sm:flex-row sm:justify-between">
              <span class="font-medium text-gray-900 dark:text-white">{{
                entry.nombreAlumno
              }}</span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatDate(entry.fechaInicio) }} -
                {{ entry.fechaFin ? formatDate(entry.fechaFin) : "Actual" }}
              </span>
            </div>
            <div v-if="entry.observaciones" class="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {{ entry.observaciones }}
            </div>
          </div>
        </div>
      </div>
      <!-- Observaciones -->
      <div v-if="instrument.observaciones">
        <h3
          class="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-3"
        >
          Observaciones
        </h3>
        <p class="text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded">
          {{ instrument.observaciones }}
        </p>
      </div>
    </div>
  </div>
  <div v-else class="p-6 text-center text-gray-400">
    <span class="material-icons text-6xl mb-2">inventory_2</span>
    <div class="text-lg font-semibold">No se encontró información del instrumento.</div>
  </div>
</template>
