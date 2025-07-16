<template>
  <Teleport to="body">
    <div 
      v-if="modelValue"
      class="fixed inset-0 z-50 overflow-y-auto"
      @click="handleBackdropClick"
    >
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-200"></div>
      
      <!-- Modal Container -->
      <div
:class="[
        'flex min-h-full items-center justify-center',
        modalClasses.container
      ]">
        <div 
          :class="[
            'relative w-full rounded-lg shadow-xl transition-all duration-200 transform',
            modalClasses.content,
            modalClasses.padding,
            themeClasses.surface,
            maxWidth
          ]"
          @click.stop
        >
          <!-- Header -->
          <div 
            v-if="$slots.header || title || showClose"
            :class="[
              'flex items-center justify-between mb-4',
              !$slots.default && !$slots.content && 'mb-0'
            ]"
          >
            <div v-if="title" class="flex items-center gap-2">
              <span v-if="icon" class="text-xl">{{ icon }}</span>
              <h3 :class="[textClasses.title, 'font-bold', themeClasses.text.primary]">
                {{ title }}
              </h3>
            </div>
            <slot name="header" />
            
            <button
              v-if="showClose"
              :class="[
                'p-2 rounded-lg transition-colors',
                themeClasses.hover,
                themeClasses.text.secondary
              ]"
              @click="close"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div v-if="$slots.default || $slots.content" :class="contentClasses">
            <slot name="content">
              <slot />
            </slot>
          </div>

          <!-- Footer -->
          <div 
            v-if="$slots.footer"
            :class="[
              'flex items-center justify-end gap-3 mt-6 pt-4 border-t',
              themeClasses.border,
              formClasses.button === 'w-full' ? 'flex-col' : 'flex-row'
            ]"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from '../composables/useTheme';
import { useResponsive } from '../composables/useResponsive';

interface Props {
  modelValue: boolean
  title?: string
  icon?: string
  showClose?: boolean
  closeOnBackdrop?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  contentClasses?: string
}

const props = withDefaults(defineProps<Props>(), {
  showClose: true,
  closeOnBackdrop: true,
  size: 'md',
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>();

const { themeClasses } = useTheme();
const { modalClasses, textClasses, formClasses } = useResponsive();

const maxWidth = computed(() => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-4',
  };
  return sizes[props.size];
});

const contentClasses = computed(() => {
  return props.contentClasses || 'max-h-[60vh] overflow-y-auto';
});

const close = () => {
  emit('update:modelValue', false);
};

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    close();
  }
};
</script>