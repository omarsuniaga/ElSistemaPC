<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Campos a Incluir</h3>
      <div class="flex space-x-2">
        <button
          class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          @click="selectAll"
        >
          Seleccionar todos
        </button>
        <button
          class="text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium"
          @click="deselectAll"
        >
          Deseleccionar todos
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
      <label
        v-for="field in availableFields"
        :key="field"
        class="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
      >
        <input
          type="checkbox"
          :value="field"
          :checked="selectedFields.includes(field)"
          class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          @change="toggleField(field)"
        />
        <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ getFieldLabel(field) }}
        </span>
      </label>
    </div>

    <div
      v-if="selectedFields.length === 0"
      class="p-4 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg"
    >
      <DocumentIcon class="w-8 h-8 mx-auto mb-2 text-gray-400" />
      <p class="text-sm">Selecciona al menos un campo para incluir en el reporte</p>
    </div>

    <div
      v-if="selectedFields.length > 0"
      class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
    >
      <div class="flex items-center space-x-2 mb-2">
        <CheckCircleIcon class="w-4 h-4 text-blue-600" />
        <span class="text-sm font-medium text-blue-900 dark:text-blue-100">
          Campos seleccionados ({{ selectedFields.length }})
        </span>
      </div>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="field in selectedFields"
          :key="field"
          class="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded-full"
        >
          {{ getFieldLabel(field) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from "vue"
import {DocumentIcon, CheckCircleIcon} from "@heroicons/vue/24/outline"
import {usePDFReportTypes} from "../../composables/usePDFReportTypes"

// Props
interface Props {
  selectedReportType: string
  selectedFields: string[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  "update:selectedFields": [value: string[]]
}>()

// Composables
const {getFieldLabel} = usePDFReportTypes()

// Computed
const availableFields = computed(() => {
  const fieldMap: {[key: string]: string[]} = {
    students: [
      "name",
      "age",
      "instrument",
      "teacher",
      "class",
      "schedule",
      "enrollmentDate",
      "status",
      "phone",
      "email",
    ],
    classes: ["name", "teacher", "instrument", "schedule", "students", "capacity", "status"],
    teachers: ["name", "instrument", "classes", "students", "phone", "email", "status"],
    attendance: ["student", "class", "date", "status", "observations"],
    performance: ["student", "class", "evaluation", "score", "date", "comments"],
  }

  return fieldMap[props.selectedReportType] || []
})

// Funciones
const toggleField = (field: string) => {
  const newFields = props.selectedFields.includes(field)
    ? props.selectedFields.filter((f) => f !== field)
    : [...props.selectedFields, field]

  emit("update:selectedFields", newFields)
}

const selectAll = () => {
  emit("update:selectedFields", [...availableFields.value])
}

const deselectAll = () => {
  emit("update:selectedFields", [])
}
</script>

<script lang="ts">
import {defineComponent} from "vue"

export default defineComponent({
  name: "FieldsSelector",
})
</script>
