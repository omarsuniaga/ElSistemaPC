<template>
  <aside
    :class="[
      'transition-transform duration-300 ease-in-out z-20 fixed lg:relative',
      'lg:w-1/4 p-4 border-l border-gray-200 dark:border-gray-700',
      'bg-white dark:bg-gray-800 shadow-lg lg:shadow-none',
      'top-0 bottom-0',
      expanded ? 'translate-x-0' : 'translate-x-full lg:w-0 lg:p-0',
      isMobile ? 'w-[65%] left-1/2 -translate-x-1/2' : '',
    ]"
  >
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold dark:text-white" :class="{'hidden lg:hidden': !expanded}">
        Contenidos
      </h2>
      <button
        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        :title="expanded ? 'Contraer panel' : 'Expandir panel'"
        @click="$emit('toggle-panel')"
      >
        <XMarkIcon v-if="isMobile" class="h-5 w-5 text-gray-500 dark:text-gray-400" />
        <ChevronRightIcon v-else-if="expanded" class="h-5 w-5 text-gray-500 dark:text-gray-400" />
        <ChevronLeftIcon v-else class="h-5 w-5 text-gray-500 dark:text-gray-400" />
      </button>
    </div>

    <div v-if="expanded" class="overflow-y-auto h-[calc(100vh-180px)]">
      <RecursiveMenu
        :items="contents"
        @item-selected="(item, chain) => $emit('select-content', item, chain)"
      />
    </div>

    <div v-if="!expanded" class="flex flex-col items-center gap-4">
      <button
        v-for="(item, index) in contents"
        :key="index"
        class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
        :title="item.title"
        @click="$emit('toggle-panel')"
      >
        {{ item.title.charAt(0) }}
      </button>
      <button
        class="text-gray-500 dark:text-gray-400 text-xs hover:text-blue-500 dark:hover:text-blue-400 mt-2"
        @click="$emit('toggle-panel')"
      >
        Expandir
      </button>
    </div>
  </aside>
</template>

<script setup>
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/20/solid';
import RecursiveMenu from './RecursiveMenu.vue';

defineProps({
  contents: {
    type: Array,
    required: true,
  },
  expanded: {
    type: Boolean,
    default: false,
  },
  isMobile: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['toggle-panel', 'select-content']);
</script>
