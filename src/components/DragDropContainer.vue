```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { VueDraggableNext } from 'vue-draggable-plus'
import type { WorkspaceElement } from '../types'

const props = defineProps<{
  elements: WorkspaceElement[]
  group?: string
  animation?: number
  ghostClass?: string
  dragClass?: string
  dropClass?: string
}>()

const emit = defineEmits<{
  (e: 'update:elements', elements: WorkspaceElement[]): void
  (e: 'add', element: WorkspaceElement): void
  (e: 'remove', element: WorkspaceElement): void
  (e: 'start', event: any): void
  (e: 'end', event: any): void
}>()

const dragOptions = computed(() => ({
  animation: props.animation || 200,
  group: props.group || 'workspace',
  ghostClass: props.ghostClass || 'ghost',
  dragClass: props.dragClass || 'dragging',
  dropClass: props.dropClass || 'drop-zone'
}))

const handleChange = (event: any) => {
  emit('update:elements', event.target.value)
}

const handleAdd = (event: any) => {
  emit('add', event.item)
}

const handleRemove = (event: any) => {
  emit('remove', event.item)
}

const handleStart = (event: any) => {
  emit('start', event)
}

const handleEnd = (event: any) => {
  emit('end', event)
}
</script>

<template>
  <VueDraggableNext
    v-model="elements"
    v-bind="dragOptions"
    @change="handleChange"
    @add="handleAdd"
    @remove="handleRemove"
    @start="handleStart"
    @end="handleEnd"
    class="min-h-[100px] p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600"
  >
    <template #item="{ element }">
      <div
        class="p-4 mb-2 rounded-lg shadow-sm transition-all duration-200 cursor-move"
        :class="[
          element.color,
          'hover:shadow-md hover:scale-[1.01]'
        ]"
      >
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-medium text-white">{{ element.title }}</h3>
            <p v-if="element.description" class="text-sm text-white/80">
              {{ element.description }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span v-if="element.weight !== 100" class="text-sm text-white/80">
              {{ element.weight }}%
            </span>
            <span v-if="element.progress > 0" class="text-sm text-white/80">
              {{ element.progress }}%
            </span>
          </div>
        </div>
      </div>
    </template>

    <template #header>
      <slot name="header"></slot>
    </template>

    <template #footer>
      <slot name="footer"></slot>
    </template>
  </VueDraggableNext>
</template>

<style scoped>
.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

.dragging {
  opacity: 0.9;
}

.drop-zone {
  background: #eee;
}
</style>
```