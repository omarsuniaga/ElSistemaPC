<template>
  <div class="animate-pulse space-y-6 p-4">
    <!-- Header Skeleton -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <div class="h-4 bg-gray-300 rounded w-32 mb-2" />
        <div class="h-8 bg-gray-300 rounded w-64" />
      </div>
      <div class="flex space-x-2">
        <div class="h-10 bg-gray-300 rounded w-20" />
        <div class="h-10 bg-gray-300 rounded w-20" />
      </div>
    </div>

    <div class="grid md:grid-cols-3 gap-6">
      <!-- Main Content Skeleton -->
      <div class="md:col-span-2 space-y-6">
        <!-- Summary Skeleton -->
        <div class="bg-white p-6 rounded-lg shadow">
          <div class="h-6 bg-gray-300 rounded w-3/4 mb-4" />
          <div class="h-4 bg-gray-300 rounded w-1/2 mb-2" />
          <div class="h-4 bg-gray-300 rounded w-1/3" />
        </div>

        <!-- Tabs Skeleton -->
        <div class="bg-white p-6 rounded-lg shadow">
          <div class="flex space-x-4 border-b mb-4">
            <div class="h-8 bg-gray-300 rounded w-24" />
            <div class="h-8 bg-gray-300 rounded w-24" />
            <div class="h-8 bg-gray-300 rounded w-24" />
          </div>
          <div class="space-y-4">
            <div class="h-4 bg-gray-300 rounded w-full" />
            <div class="h-4 bg-gray-300 rounded w-5/6" />
            <div class="h-4 bg-gray-300 rounded w-3/4" />
          </div>
        </div>
      </div>

      <!-- Sidebar Skeleton -->
      <div class="space-y-6">
        <div class="bg-white p-6 rounded-lg shadow">
          <div class="h-6 bg-gray-300 rounded w-1/2 mb-4" />
          <div class="h-4 bg-gray-300 rounded w-3/4 mb-2" />
          <div class="h-4 bg-gray-300 rounded w-2/3" />
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <div class="h-6 bg-gray-300 rounded w-1/2 mb-4" />
          <div class="h-4 bg-gray-300 rounded w-3/4 mb-2" />
          <div class="h-4 bg-gray-300 rounded w-2/3" />
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <div class="h-6 bg-gray-300 rounded w-1/2 mb-4" />
          <div class="h-4 bg-gray-300 rounded w-full mb-2" />
          <div class="h-4 bg-gray-300 rounded w-full mb-2" />
          <div class="h-4 bg-gray-300 rounded w-5/6" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// No script logic needed for a simple skeleton loader
</script>

<style scoped>
/* Add any specific styles if needed, though Tailwind handles most of it */
</style>
