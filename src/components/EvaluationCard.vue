<template>
  <div
    class="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-4 relative border border-gray-200 dark:border-gray-700"
  >
    <!-- Status badge -->
    <div class="absolute top-4 right-4 flex items-center">
      <span
        class="text-xs rounded-full px-2 py-1 flex items-center gap-1"
        :class="
          card.locked
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        "
      >
        <LockClosedIcon v-if="card.locked" class="h-3 w-3" />
        <LockOpenIcon v-else class="h-3 w-3" />
        {{ card.locked ? "Guardado" : "En edición" }}
      </span>
    </div>

    <!-- Título y Subtítulo -->
    <div class="pr-24">
      <h2 class="text-lg font-bold dark:text-white">
        {{ card.contentTitle || "Contenido no seleccionado" }}
      </h2>
      <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">
        {{ card.contentSubtitle || "Tema - Indicador" }}
      </p>
    </div>

    <!-- Grupo de Avatares y Promedio -->
    <div
      class="flex flex-col lg:flex-row justify-between items-center mb-4 space-y-4 lg:space-y-0 pb-4 border-b border-gray-200 dark:border-gray-700"
    >
      <div class="flex -space-x-3">
        <template v-for="(student, index) in sortedStudents" :key="student.id">
          <img
            v-if="index < 6"
            :src="student.avatar"
            :alt="student.nombre"
            class="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 cursor-pointer"
            :title="!card.locked ? 'Click para remover: ' + student.nombre : student.nombre"
            @click="$emit('remove-student', student)"
          />
        </template>
        <div
          v-if="card.group.length > 6"
          class="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-xs font-semibold border-2 border-white dark:border-gray-800 cursor-pointer"
          @click="$emit('show-extra-students')"
        >
          +{{ card.group.length - 6 }}
        </div>
      </div>
      <div class="flex items-center gap-2 w-full lg:w-auto">
        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Promedio:</span>
        <div class="relative flex-1 lg:w-32">
          <div class="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              class="h-full transition-all duration-300 relative rounded-full"
              :class="getScoreColorClass(average)"
              :style="{width: `${average}%`}"
            >
              <span
                class="absolute inset-0 flex items-center justify-center text-xs font-bold text-white"
              >
                {{ average }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sección Calificadora: Para cada indicador -->
    <div class="mb-4">
      <div class="flex justify-between items-center mb-3">
        <span class="font-medium text-sm text-gray-700 dark:text-gray-300"
          >Indicadores de Evaluación</span
        >
        <div class="flex gap-2">
          <button
            v-if="card.locked"
            class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
            @click="$emit('toggle-progress')"
          >
            <template v-if="card.hideProgress">
              <EyeIcon class="h-4 w-4" />
              <span class="hidden md:inline">Mostrar</span>
            </template>
            <template v-else>
              <EyeSlashIcon class="h-4 w-4" />
              <span class="hidden md:inline">Ocultar</span>
            </template>
          </button>
          <button
            class="text-sm hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
            :class="
              card.locked
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-green-600 dark:text-green-400'
            "
            @click="$emit('toggle-edit')"
          >
            <template v-if="card.locked">
              <PencilIcon class="h-4 w-4" />
              <span class="hidden md:inline">Editar</span>
            </template>
            <template v-else>
              <CheckIcon class="h-4 w-4" />
              <span class="hidden md:inline">Guardar</span>
            </template>
          </button>
          <button
            class="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1"
            @click="$emit('delete')"
          >
            <TrashIcon class="h-4 w-4" />
            <span class="hidden md:inline">Eliminar</span>
          </button>
        </div>
      </div>

      <div v-show="!card.locked || !card.hideProgress" class="space-y-4">
        <div
          v-for="indicator in card.indicators"
          :key="indicator.uniqueId"
          class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          <div class="flex justify-between items-center">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ indicator.label }}
            </label>
            <span
              class="text-xs font-semibold px-2 py-1 rounded-full"
              :class="getScoreColorClass(indicator.score, 'badge')"
            >
              {{ indicator.score }}%
            </span>
          </div>

          <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 my-2">
            <div
              class="h-2 rounded-full"
              :class="getScoreColorClass(indicator.score)"
              :style="{width: indicator.score + '%'}"
            />
          </div>

          <input
            v-model.number="indicator.score"
            type="range"
            min="0"
            max="100"
            :disabled="card.locked"
            class="w-full accent-blue-500"
          />
        </div>
      </div>

      <!-- Mensaje cuando los indicadores están ocultos -->
      <div
        v-if="card.locked && card.hideProgress"
        class="p-4 text-center text-gray-500 dark:text-gray-400 text-sm"
      >
        Los indicadores están ocultos. Haz click en "Mostrar" para verlos.
      </div>
    </div>

    <!-- Sección de comentarios -->
    <div class="pt-3 border-t border-gray-200 dark:border-gray-700">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Comentarios
      </label>
      <textarea
        v-model="card.comments"
        :disabled="card.locked"
        placeholder="Añade comentarios sobre el desempeño..."
        rows="2"
        class="input w-full resize-y"
      />
    </div>
  </div>
</template>

<script setup>
import {computed} from "vue"
import {
  LockClosedIcon,
  LockOpenIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  CheckIcon,
  TrashIcon,
} from "@heroicons/vue/20/solid"

const props = defineProps({
  card: {
    type: Object,
    required: true,
  },
})

defineEmits(["toggle-progress", "toggle-edit", "delete", "remove-student", "show-extra-students"])

const sortedStudents = computed(() => {
  return [...props.card.group].sort((a, b) => {
    const nameA = a.nombre || a.name || ""
    const nameB = b.nombre || b.name || ""
    return nameA.localeCompare(nameB)
  })
})

const average = computed(() => {
  if (!props.card.indicators.length) return 0
  const total = props.card.indicators.reduce((sum, indicator) => sum + indicator.score, 0)
  return Math.round(total / props.card.indicators.length)
})

const getScoreColorClass = (score, type = "bar") => {
  if (type === "bar") {
    if (score >= 90) return "bg-green-500"
    if (score >= 75) return "bg-blue-500"
    if (score >= 60) return "bg-yellow-500"
    return "bg-red-500"
  } else if (type === "badge") {
    if (score >= 90) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    if (score >= 75) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    if (score >= 60) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  }
}
</script>

<style scoped>
.input {
  @apply px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white;
}
</style>
