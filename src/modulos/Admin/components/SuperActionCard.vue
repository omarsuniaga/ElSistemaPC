<template>
  <div
    class="bg-gradient-to-r p-6 rounded-xl shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
    :class="[`${gradient}`, 'text-white']"
    @click="$emit('click')"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="bg-white bg-opacity-20 p-2 rounded-lg">
          <component :is="iconComponent" class="w-6 h-6" />
        </div>
        <div>
          <h3 class="font-bold text-lg">{{ title }}</h3>
          <p class="text-sm opacity-90">{{ description }}</p>
        </div>
      </div>
      <div class="bg-white bg-opacity-20 p-2 rounded-full">
        <ChevronRightIcon class="w-5 h-5" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ChevronRightIcon } from '@heroicons/vue/24/outline';
import * as HeroIcons from '@heroicons/vue/24/outline';

interface Props {
  title: string
  description: string
  icon: string
  gradient: string
}

const props = defineProps<Props>();

const emit = defineEmits<{
  click: []
}>();

const iconComponent = computed(() => {
  // Safe fallback approach with proper component checking
  const IconComponent = (HeroIcons as any)[props.icon];
  return IconComponent && typeof IconComponent === 'function' ? IconComponent : HeroIcons.CogIcon;
});
</script>
