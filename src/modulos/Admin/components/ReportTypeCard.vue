<template>
  <div
    class="p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md"
    :class="[
      selected
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500',
      'bg-white dark:bg-gray-700',
    ]"
    @click="$emit('select', type.id)"
  >
    <div class="flex items-center space-x-3">
      <div class="w-12 h-12 rounded-lg flex items-center justify-center" :class="iconColorClass">
        <component :is="iconComponent" class="w-6 h-6 text-white" />
      </div>

      <div class="flex-1">
        <h4 class="font-semibold text-gray-900 dark:text-white">
          {{ type.title }}
        </h4>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {{ type.description }}
        </p>
      </div>

      <div v-if="selected" class="text-blue-500">
        <CheckCircleIcon class="w-6 h-6" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from "vue"
import {
  AcademicCapIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  UsersIcon,
  TableCellsIcon,
  CheckCircleIcon,
} from "@heroicons/vue/24/outline"

interface ReportType {
  id: string
  title: string
  description: string
  icon: string
  color: string
}

const props = defineProps<{
  type: ReportType
  selected: boolean
}>()

defineEmits<{
  select: [id: string]
}>()

const iconComponent = computed(() => {
  const iconMap = {
    AcademicCapIcon,
    UserGroupIcon,
    CalendarDaysIcon,
    UsersIcon,
    TableCellsIcon,
  }
  return iconMap[props.type.icon as keyof typeof iconMap] || UsersIcon
})

const iconColorClass = computed(() => {
  const colorMap = {
    blue: "bg-gradient-to-r from-blue-500 to-blue-600",
    green: "bg-gradient-to-r from-green-500 to-green-600",
    purple: "bg-gradient-to-r from-purple-500 to-purple-600",
    orange: "bg-gradient-to-r from-orange-500 to-orange-600",
    red: "bg-gradient-to-r from-red-500 to-red-600",
  }
  return colorMap[props.type.color as keyof typeof colorMap] || colorMap.blue
})
</script>
