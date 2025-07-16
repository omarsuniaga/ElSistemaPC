<template>
  <ul class="space-y-1">
    <li v-for="(item, index) in items" :key="index">
      <div
        v-if="item.children"
        class="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
        @click="toggleFolder(index)"
      >
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ item.title }}
        </span>
        <ChevronDownIcon
          class="h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform"
          :class="{'transform rotate-180': openFolders[index]}"
        />
      </div>

      <div
        v-else
        class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
        @click="selectItem(item, getParentChain(item))"
      >
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {{ item.title }}
          </span>
          <PlusIcon
            v-if="item.type === 'indicator'"
            class="h-4 w-4 text-blue-500 dark:text-blue-400"
          />
        </div>
      </div>

      <div
        v-if="item.children"
        class="ml-4 pl-2 border-l border-gray-200 dark:border-gray-700"
        :class="{hidden: !openFolders[index]}"
      >
        <RecursiveMenu
          :items="item.children"
          :parent-chain="getParentChain(item)"
          @item-selected="(item, chain) => $emit('item-selected', item, chain)"
        />
      </div>
    </li>
  </ul>
</template>

<script setup>
import { ref } from 'vue';
import { ChevronDownIcon, PlusIcon } from '@heroicons/vue/20/solid';

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  parentChain: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['item-selected']);

const openFolders = ref({});

const toggleFolder = (index) => {
  openFolders.value[index] = !openFolders.value[index];
};

const selectItem = (item, chain) => {
  if (item.type === 'indicator') {
    emit('item-selected', item, chain);
  }
};

const getParentChain = (item) => {
  return [...props.parentChain, item.title];
};
</script>

<style scoped>
/* Puedes ajustar estilos adicionales para el menú */
</style>
