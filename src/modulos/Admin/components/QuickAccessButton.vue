<template>
  <button
    :class="[
      'w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:shadow-md',
      colorClasses,
    ]"
    @click="$emit('click')"
  >
    <div class="flex items-center space-x-3">
      <div class="bg-white bg-opacity-20 p-2 rounded-lg">
        <component :is="iconComponent" class="w-4 h-4" />
      </div>
      <span class="font-medium text-sm">{{ title }}</span>
    </div>

    <ChevronRightIcon class="w-4 h-4 opacity-70" />
  </button>
</template>

<script setup lang="ts">
import {computed} from "vue"
import {ChevronRightIcon} from "@heroicons/vue/24/outline"
import * as HeroIcons from "@heroicons/vue/24/outline"

interface Props {
  title: string
  icon: string
  color: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: []
}>()

const iconComponent = computed(() => {
  return (HeroIcons as any)[props.icon] || HeroIcons.CogIcon
})

const colorClasses = computed(() => {
  const colors = {
    red: "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700",
    blue: "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700",
    green:
      "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700",
    purple:
      "bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700",
    orange:
      "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700",
  }

  return colors[props.color as keyof typeof colors] || colors.blue
})
</script>
