<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-5">
    <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-3">Filtro de Período</h3>

    <div class="flex flex-wrap gap-3 mb-4">
      <!-- Botones rápidos de período -->
      <button
        v-for="period in quickPeriods"
        :key="period.id"
        :class="[
          'px-4 py-2 rounded-md text-sm font-medium transition-colors',
          activePeriod === period.id
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900',
        ]"
        @click="selectQuickPeriod(period.id)"
      >
        {{ period.label }}
      </button>
    </div>

    <!-- Selector de fechas personalizadas -->
    <div v-if="activePeriod === 'custom'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >Fecha inicial</label
        >
        <input
          v-model="customStartDate"
          type="date"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >Fecha final</label
        >
        <input
          v-model="customEndDate"
          type="date"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
    </div>

    <!-- Comparación con período anterior -->
    <div class="mt-4 flex items-center">
      <input
        id="compare-previous"
        v-model="compareWithPrevious"
        type="checkbox"
        class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
      />
      <label for="compare-previous" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
        Comparar con período anterior
      </label>
    </div>

    <!-- Botón para aplicar filtros -->
    <div class="mt-4">
      <button
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
        @click="applyFilters"
      >
        Aplicar filtros
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  subWeeks,
} from "date-fns"
import {es} from "date-fns/locale"
import {useAnalyticsStore} from "../store/analytics"

const analyticsStore = useAnalyticsStore()

// Estado local
const activePeriod = ref("last7days")
const customStartDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"))
const customEndDate = ref(format(new Date(), "yyyy-MM-dd"))
const compareWithPrevious = ref(false)

// Definición de períodos rápidos
const quickPeriods = [
  {id: "today", label: "Hoy"},
  {id: "last7days", label: "Últimos 7 días"},
  {id: "thisWeek", label: "Esta semana"},
  {id: "thisMonth", label: "Este mes"},
  {id: "last30days", label: "Últimos 30 días"},
  {id: "last3Months", label: "Últimos 3 meses"},
  {id: "custom", label: "Personalizado"},
]

// Fechas calculadas según el período seleccionado
const dateRange = computed(() => {
  const now = new Date()

  switch (activePeriod.value) {
    case "today":
      return {
        start: new Date(now.setHours(0, 0, 0, 0)),
        end: new Date(),
      }

    case "last7days":
      return {
        start: subDays(now, 7),
        end: now,
      }

    case "thisWeek":
      return {
        start: startOfWeek(now, {locale: es}),
        end: endOfWeek(now, {locale: es}),
      }

    case "thisMonth":
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      }

    case "last30days":
      return {
        start: subDays(now, 30),
        end: now,
      }

    case "last3Months":
      return {
        start: subMonths(now, 3),
        end: now,
      }

    case "custom":
      return {
        start: new Date(customStartDate.value),
        end: new Date(customEndDate.value),
      }

    default:
      return {
        start: subDays(now, 7),
        end: now,
      }
  }
})

// Seleccionar un período rápido
function selectQuickPeriod(periodId: string) {
  activePeriod.value = periodId
}

// Aplicar los filtros
async function applyFilters() {
  try {
    const {start, end} = dateRange.value

    // Calcular el período anterior para comparación si está habilitado
    let previousStart, previousEnd

    if (compareWithPrevious.value) {
      const duration = end.getTime() - start.getTime()
      previousEnd = new Date(start)
      previousStart = new Date(start.getTime() - duration)
    }

    // Emitir evento con los datos del filtro
    emit("filter-changed", {
      startDate: start,
      endDate: end,
      compareWithPrevious: compareWithPrevious.value,
      previousStartDate: previousStart,
      previousEndDate: previousEnd,
      periodType: activePeriod.value,
    })

    // También actualizar en el store
    await analyticsStore.updateTimeRanges({
      currentRange: {start, end},
      previousRange: compareWithPrevious.value ? {start: previousStart, end: previousEnd} : null,
    })
  } catch (error) {
    console.error("Error al aplicar filtros temporales:", error)
  }
}

// Propiedades y eventos
const props = defineProps({
  initialPeriod: {
    type: String,
    default: "last7days",
  },
})

const emit = defineEmits(["filter-changed"])

// Inicialización
onMounted(() => {
  activePeriod.value = props.initialPeriod
  // Aplicar filtros iniciales automáticamente
  applyFilters()
})
</script>
