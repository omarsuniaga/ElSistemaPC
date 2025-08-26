<template>
  <nav class="breadcrumb flex" aria-label="Breadcrumb">
    <ol class="inline-flex items-center space-x-1 md:space-x-3">
      <li v-for="(item, index) in items" :key="item.path || index" class="inline-flex items-center">
        <!-- Home icon for first item -->
        <template v-if="index === 0">
          <router-link
            :to="item.path"
            class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <HomeIcon class="w-4 h-4 mr-2" />
            {{ item.name }}
          </router-link>
        </template>
        
        <!-- Regular breadcrumb items -->
        <template v-else>
          <div class="flex items-center">
            <ChevronRightIcon class="w-4 h-4 text-gray-400 mx-1" />
            <router-link
              v-if="item.path && !item.disabled"
              :to="item.path"
              class="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              {{ item.name }}
            </router-link>
            <span
              v-else
              class="ml-1 text-sm font-medium text-gray-500 dark:text-gray-400"
              :class="{ 'text-gray-900 dark:text-white': index === items.length - 1 }"
            >
              {{ item.name }}
            </span>
          </div>
        </template>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { HomeIcon, ChevronRightIcon } from '@heroicons/vue/24/outline';

interface BreadcrumbItem {
  name: string;
  path?: string;
  disabled?: boolean;
}

interface Props {
  items: BreadcrumbItem[];
}

defineProps<Props>();
</script>

<style scoped>
.breadcrumb ol {
  flex-wrap: wrap;
}

/* Hover effects */
a:hover {
  text-decoration: underline;
}

/* Truncate long breadcrumb names */
a, span {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  a, span {
    max-width: 120px;
  }
}
</style>