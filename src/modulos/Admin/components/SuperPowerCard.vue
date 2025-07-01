<template>
  <div
    class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 group"
    @click="$emit('action', id)"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <!-- Icon with gradient background -->
        <div
          :class="[
            'p-3 rounded-lg bg-gradient-to-r',
            gradient,
            'transform group-hover:scale-110 transition-transform duration-200',
          ]"
        >
          <component :is="iconComponent" class="w-6 h-6 text-white" />
        </div>

        <div>
          <h3
            class="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
          >
            {{ title }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{ description }}
          </p>
        </div>
      </div>

      <!-- Arrow indicator -->
      <ChevronRightIcon
        class="w-5 h-5 text-gray-400 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all duration-200"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from "vue"
import {ChevronRightIcon} from "@heroicons/vue/24/outline"
import * as HeroIcons from "@heroicons/vue/24/outline"

interface Props {
  id: string
  title: string
  description: string
  icon: string
  gradient: string
}

const props = defineProps<Props>()

defineEmits<{
  action: [id: string]
}>()

const iconComponent = computed(() => {
  return HeroIcons[props.icon] || HeroIcons.CogIcon
})
</script>

<style scoped>
.bg-gradient-to-r {
  background: linear-gradient(to right, var(--tw-gradient-stops));
}
</style>
