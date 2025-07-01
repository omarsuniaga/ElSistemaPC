<template>
  <div class="space-y-4">
    <div
      v-for="activity in activities"
      :key="activity.id"
      class="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
    >
      <div
        :class="[
          `bg-${activity.color}-100 dark:bg-${activity.color}-900`,
          `text-${activity.color}-600 dark:text-${activity.color}-400`,
        ]"
        class="p-2 rounded-full"
      >
        <component :is="getIcon(activity.icon)" class="w-4 h-4" />
      </div>

      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 dark:text-white">
          {{ activity.title }}
        </p>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ activity.description }}
        </p>
      </div>

      <div class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {{ activity.time }}
      </div>
    </div>

    <div v-if="activities.length === 0" class="text-center py-8">
      <div class="text-gray-400 dark:text-gray-500">
        <ClockIcon class="w-12 h-12 mx-auto mb-2" />
        <p>No hay actividad reciente</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ClockIcon} from "@heroicons/vue/24/outline"
import * as HeroIcons from "@heroicons/vue/24/outline"

interface Activity {
  id: number
  type: string
  title: string
  description: string
  time: string
  icon: string
  color: string
}

interface Props {
  activities: Activity[]
}

defineProps<Props>()

const getIcon = (iconName: string) => {
  return (HeroIcons as any)[iconName] || HeroIcons.InformationCircleIcon
}
</script>
