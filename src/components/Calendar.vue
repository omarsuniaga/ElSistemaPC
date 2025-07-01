<script setup lang="ts">
import {ref, computed, watch} from "vue"
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isToday,
  isSameMonth,
  isSameDay,
  parseISO,
  addMonths,
  subMonths,
} from "date-fns"
import {es} from "date-fns/locale"

type MarkedDateStyle = "dot" | "circle" | "highlight" | "custom"

interface MarkedDate {
  date: string // Formato 'yyyy-MM-dd'
  style?: MarkedDateStyle
  color?: string
  class?: string
  tooltip?: string
}

const props = withDefaults(
  defineProps<{
    /** Fecha actualmente seleccionada */
    modelValue?: string | null
    /** Fechas marcadas con estilos personalizados */
    markedDates?: (string | MarkedDate)[]
    /** Mes que se muestra actualmente */
    currentMonth?: Date
    /** Primer día de la semana (0: Domingo, 1: Lunes, etc.) */
    firstDayOfWeek?: number
    /** Estilo por defecto para fechas marcadas */
    defaultMarkedStyle?: MarkedDateStyle
    /** Color por defecto para fechas marcadas */
    defaultMarkedColor?: string
    /** Si se permite la navegación entre meses */
    navigable?: boolean
    /** Si se muestra el selector de mes/año */
    showMonthYearSelector?: boolean
  }>(),
  {
    modelValue: null,
    markedDates: () => [],
    currentMonth: () => new Date(),
    firstDayOfWeek: 1 as 0 | 1 | 2 | 3 | 4 | 5 | 6, // Lunes por defecto
    defaultMarkedStyle: "dot",
    defaultMarkedColor: "#3b82f6",
    navigable: true,
    showMonthYearSelector: false,
  }
)

const emit = defineEmits<{
  /** Se dispara cuando se selecciona una fecha */
  (e: "update:modelValue", date: string): void
  /** Se dispara cuando hace clic en un día */
  (e: "day-click", date: string, event: Event): void
  /** Se dispara cuando cambia el mes mostrado */
  (e: "month-change", date: Date): void
  /** Se dispara cuando se hace clic en una fecha marcada */
  (e: "marked-day-click", date: string, event: Event): void
  /** Se dispara cuando cambia la fecha (nuevo) */
  (e: "date-change", date: string): void
  /** Se dispara cuando se selecciona una fecha (para AttendanceView) */
  (e: "select", date: string): void
}>()

// Estado interno
const currentMonth = ref<Date>(props.currentMonth || new Date())
const selectedDate = ref<string | null>(props.modelValue || null)

// Observar cambios en las props
watch(
  () => props.currentMonth,
  (newMonth) => {
    if (newMonth) currentMonth.value = newMonth
  }
)

watch(
  () => props.modelValue,
  (newValue) => {
    selectedDate.value = newValue || null
  }
)

// Formatear fechas marcadas para un acceso rápido
const markedDatesMap = computed(() => {
  const map = new Map<string, MarkedDate>()
  const dates = Array.isArray(props.markedDates) ? props.markedDates : []

  dates.forEach((mark) => {
    if (typeof mark === "string") {
      map.set(mark, {
        date: mark,
        style: props.defaultMarkedStyle,
        color: props.defaultMarkedColor,
      })
    } else if (mark && typeof mark === "object") {
      map.set(mark.date, {
        date: mark.date,
        style: mark.style || props.defaultMarkedStyle,
        color: mark.color || props.defaultMarkedColor,
        class: mark.class || "",
        tooltip: mark.tooltip,
      })
    }
  })

  return map
})

// Verificar si una fecha está marcada
const isDateMarked = (dateStr: string): boolean => {
  return markedDatesMap.value.has(dateStr)
}

// Generar la grilla del calendario
const calendarDays = computed(() => {
  console.log("Generando calendario para mes:", currentMonth.value)

  // Trabajar directamente con fechas en zona horaria local
  const currentMonthLocal = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth(),
    1
  )

  // Inicio y fin del mes en zona local
  const monthStart = new Date(currentMonthLocal.getFullYear(), currentMonthLocal.getMonth(), 1)
  const monthEnd = new Date(currentMonthLocal.getFullYear(), currentMonthLocal.getMonth() + 1, 0)

  // Inicio y fin de la semana (usando date-fns pero con fechas locales)
  const start = startOfWeek(monthStart, {
    weekStartsOn: props.firstDayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6,
  })
  const end = endOfWeek(monthEnd, {weekStartsOn: props.firstDayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6})

  console.log("Rango del calendario:", format(start, "yyyy-MM-dd"), "a", format(end, "yyyy-MM-dd"))

  const days: {
    date: string
    dayOfMonth: number
    isCurrentMonth: boolean
    isToday: boolean
    isSelected: boolean
    isMarked: boolean
    markedInfo?: MarkedDate
  }[] = []

  const currentDate = new Date(start)

  while (currentDate <= end) {
    // Crear fecha local específica para evitar problemas de zona horaria
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const day = currentDate.getDate()
    const localDate = new Date(year, month, day)

    // Usar localDate para todo el procesamiento
    const dateStr = format(localDate, "yyyy-MM-dd")
    const markedInfo = markedDatesMap.value.get(dateStr)

    // Debug para verificar la correspondencia
    if (day >= 20 && day <= 25) {
      console.log(`Día ${day} -> fecha: ${dateStr}`)
    }

    days.push({
      date: dateStr,
      dayOfMonth: day, // Usar el día directamente de currentDate
      isCurrentMonth: month === currentMonthLocal.getMonth(),
      isToday: isToday(localDate),
      isSelected: selectedDate.value === dateStr,
      isMarked: markedInfo !== undefined,
      markedInfo,
    })

    // Avanzar un día
    currentDate.setDate(currentDate.getDate() + 1)
  }

  console.log(
    "Días generados:",
    days.slice(20, 30).map((d) => ({day: d.dayOfMonth, date: d.date}))
  )

  return days
})

// Navegación entre meses
const previousMonth = () => {
  currentMonth.value = subMonths(currentMonth.value, 1)
  emit("month-change", currentMonth.value)
}

const nextMonth = () => {
  currentMonth.value = addMonths(currentMonth.value, 1)
  emit("month-change", currentMonth.value)
}

const goToToday = () => {
  const today = new Date()
  const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  currentMonth.value = localToday
  selectedDate.value = format(localToday, "yyyy-MM-dd")
  emit("update:modelValue", selectedDate.value)
  emit("month-change", currentMonth.value)
}

// Manejar clic en un día
const handleDayClick = (day: (typeof calendarDays.value)[0], event: Event) => {
  selectedDate.value = day.date
  console.log("=== CALENDAR CLICK DEBUG ===")
  console.log("Calendar: Click en día visual:", day.dayOfMonth)
  console.log("Calendar: Fecha generada:", day.date)
  console.log("Calendar: Objeto day completo:", day)
  console.log("Calendar: Event:", event)
  console.log("============================")

  // Emitir todos los eventos necesarios incluido select que es el que está escuchando AttendanceView
  emit("update:modelValue", selectedDate.value)
  emit("day-click", day.date, event)
  emit("select", day.date) // IMPORTANTE: Este evento es el que AttendanceView está escuchando

  if (day.isMarked && day.markedInfo) {
    emit("marked-day-click", day.date, event)
  }
}

// Formatear el mes y año para mostrar
const formattedMonthYear = computed(() => {
  return format(currentMonth.value, "MMMM yyyy", {locale: es})
})

// Días de la semana
const weekdays = computed(() => {
  const start = startOfWeek(new Date(), {
    weekStartsOn: props.firstDayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6,
  })
  const days = []

  for (let i = 0; i < 7; i++) {
    const day = addDays(start, i)
    days.push({
      short: format(day, "EEEEEE", {locale: es}),
      long: format(day, "EEEE", {locale: es}),
    })
  }

  return days
})

// Clases CSS para los días del calendario
const dayClasses = (day: (typeof calendarDays.value)[0]) => {
  const classes = [
    "text-center p-2 rounded-full transition-colors",
    "hover:bg-gray-100 dark:hover:bg-gray-700",
    "cursor-pointer select-none",
    {
      "text-gray-400 dark:text-gray-500": !day.isCurrentMonth,
      "font-semibold text-blue-600 dark:text-blue-400": day.isToday,
      "bg-blue-100 dark:bg-blue-900/30": day.isSelected,
      "text-blue-600 dark:text-blue-400": day.isSelected,
    },
  ]

  if (day.isMarked && day.markedInfo) {
    const markedClass = getMarkedDayClass(day.markedInfo)
    if (markedClass) {
      classes.push(markedClass)
    }
  }

  return classes
}

// Obtener la clase CSS para un día marcado
const getMarkedDayClass = (markedInfo: MarkedDate) => {
  if (markedInfo.class) return markedInfo.class

  switch (markedInfo.style) {
    case "dot":
      return 'relative after:content-[""] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-blue-500'
    case "circle":
      return "border-2 border-blue-500"
    case "highlight":
      return "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
    case "custom":
      return ""
    default:
      return 'relative after:content-[""] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-blue-500'
  }
}

// Estilo en línea para marcadores personalizados
const markedDayStyle = (markedInfo: MarkedDate) => {
  if (markedInfo.style === "custom" && markedInfo.color) {
    return {backgroundColor: markedInfo.color}
  }
  return {}
}

// Make sure the component is exported as default
defineExpose({})
if (import.meta.env?.PROD === false) {
  // @ts-ignore - This ensures the component has a default export
  // which helps with certain bundlers and IDE tooling
  const _default = {}
}
</script>

<template>
  <div class="calendar bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
    <!-- Encabezado con navegación -->
    <div class="flex justify-between items-center mb-4">
      <button
        v-if="navigable"
        class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
        title="Mes anterior"
        @click="previousMonth"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <div v-else />

      <div class="flex items-center">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ formattedMonthYear }}
        </h2>
        <button
          class="ml-2 px-3 py-1 text-sm rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/50"
          @click="goToToday"
        >
          Hoy
        </button>
      </div>

      <button
        v-if="navigable"
        class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
        title="Mes siguiente"
        @click="nextMonth"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <div v-else />
    </div>

    <!-- Días de la semana -->
    <div class="grid grid-cols-7 gap-1 mb-2">
      <div
        v-for="day in weekdays"
        :key="day.long"
        class="text-center text-sm font-medium text-gray-500 dark:text-gray-400"
        :title="day.long"
      >
        {{ day.short }}
      </div>
    </div>

    <!-- Días del mes -->
    <div class="grid grid-cols-7 gap-1">
      <button
        v-for="day in calendarDays"
        :key="day.date"
        type="button"
        :class="dayClasses(day)"
        :style="day.markedInfo?.style === 'custom' ? markedDayStyle(day.markedInfo) : {}"
        :title="day.markedInfo?.tooltip || ''"
        @click="handleDayClick(day, $event)"
      >
        <span class="relative z-10">
          {{ day.dayOfMonth }}
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.calendar {
  min-width: 300px;
  max-width: 100%;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
