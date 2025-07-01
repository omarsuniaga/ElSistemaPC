<template>
  <div class="relative">
    <img
      :src="src"
      :alt="alt"
      :class="['object-cover', {'rounded-full': rounded, rounded: !rounded}, imgClass]"
      v-bind="$attrs"
      @error="handleError"
    />
    <div
      v-if="showFallback"
      :class="[
        'flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
        {'rounded-full': rounded, rounded: !rounded},
        imgClass,
      ]"
    >
      <slot name="fallback">
        <svg
          class="h-1/2 w-1/2"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref} from "vue"

const props = defineProps({
  src: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    default: "Image",
  },
  rounded: {
    type: Boolean,
    default: false,
  },
  imgClass: {
    type: String,
    default: "w-full h-full",
  },
})

const showFallback = ref(false)

const handleError = () => {
  showFallback.value = true
}
</script>
