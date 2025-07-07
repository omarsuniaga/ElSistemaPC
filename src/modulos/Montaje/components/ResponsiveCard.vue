<template>
  <div :class="[
    'rounded-lg shadow-sm border transition-colors duration-200',
    cardClasses.padding,
    themeClasses.surface,
    themeClasses.border,
    hover && themeClasses.hover,
    clickable && 'cursor-pointer',
    className
  ]"
  @click="clickable && $emit('click')"
  >
    <!-- Card Header -->
    <div 
      v-if="$slots.header || title"
      :class="[
        'flex items-center justify-between mb-4',
        !$slots.default && !$slots.content && 'mb-0'
      ]"
    >
      <div v-if="title" class="flex items-center gap-2">
        <span v-if="icon" class="text-xl">{{ icon }}</span>
        <h3 :class="[textClasses.subtitle, 'font-semibold', themeClasses.text.primary]">
          {{ title }}
        </h3>
      </div>
      <slot name="header" />
    </div>

    <!-- Card Content -->
    <div v-if="$slots.default || $slots.content">
      <slot name="content">
        <slot />
      </slot>
    </div>

    <!-- Card Footer -->
    <div 
      v-if="$slots.footer"
      :class="[
        'mt-4 pt-4 border-t',
        themeClasses.border
      ]"
    >
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '../composables/useTheme'
import { useResponsive } from '../composables/useResponsive'

interface Props {
  title?: string
  icon?: string
  hover?: boolean
  clickable?: boolean
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  hover: false,
  clickable: false
})

defineEmits<{
  click: []
}>()

const { themeClasses } = useTheme()
const { cardClasses, textClasses } = useResponsive()
</script>