<script setup lang="ts">
import {ref, watch} from "vue"
import {ChevronUpIcon, ChevronDownIcon} from "@heroicons/vue/24/outline"

interface Section {
  label: string
  items: string[]
}

const props = defineProps<{
  modelValue: string
  placeholder?: string
  sections: Section[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
}>()

const isOpen = ref(false)
const expandedSections = ref<Set<string>>(new Set())

const toggleSection = (label: string) => {
  if (expandedSections.value.has(label)) {
    expandedSections.value.delete(label)
  } else {
    expandedSections.value.add(label)
  }
}

const selectItem = (item: string) => {
  emit("update:modelValue", item)
  isOpen.value = false
}

// Close dropdown when clicking outside
const dropdownRef = ref<HTMLElement | null>(null)
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

watch(
  () => isOpen.value,
  (newValue) => {
    if (newValue) {
      document.addEventListener("click", handleClickOutside)
    } else {
      document.removeEventListener("click", handleClickOutside)
    }
  }
)
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <!-- Selected value display -->
    <div
      class="form-input flex justify-between items-center cursor-pointer"
      :class="{'opacity-50 cursor-not-allowed': disabled}"
      @click="isOpen = !disabled && !isOpen"
    >
      <span :class="{'text-gray-400': !modelValue}">
        {{ modelValue || placeholder || "Select an option" }}
      </span>
      <ChevronDownIcon v-if="!isOpen" class="w-5 h-5 text-gray-400" />
      <ChevronUpIcon v-else class="w-5 h-5 text-gray-400" />
    </div>

    <!-- Dropdown panel -->
    <div
      v-if="isOpen"
      class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto"
    >
      <div
        v-for="section in sections"
        :key="section.label"
        class="border-b last:border-b-0 border-gray-200 dark:border-gray-700"
      >
        <!-- Section header -->
        <div
          class="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
          @click="toggleSection(section.label)"
        >
          <span class="font-medium text-gray-700 dark:text-gray-200">{{ section.label }}</span>
          <ChevronDownIcon
            v-if="!expandedSections.has(section.label)"
            class="w-4 h-4 text-gray-400"
          />
          <ChevronUpIcon v-else class="w-4 h-4 text-gray-400" />
        </div>

        <!-- Section items -->
        <div
          v-if="expandedSections.has(section.label)"
          class="border-t border-gray-200 dark:border-gray-700"
        >
          <div
            v-for="item in section.items"
            :key="item"
            class="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
            :class="{
              'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200':
                modelValue === item,
            }"
            @click="selectItem(item)"
          >
            {{ item }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-input {
  @apply block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700 dark:placeholder:text-gray-500;
}
</style>
