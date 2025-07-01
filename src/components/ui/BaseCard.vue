<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
  hoverable?: boolean
  clickable?: boolean
  variant?: "default" | "outlined" | "elevated"
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  subtitle: "",
  hoverable: false,
  clickable: false,
  variant: "default",
})

const emit = defineEmits<{
  (e: "click"): void
}>()

const handleClick = () => {
  if (props.clickable) {
    emit("click")
  }
}
</script>

<template>
  <div
    :class="[
      'card',
      `card-${variant}`,
      hoverable && 'card-hoverable',
      clickable && 'card-clickable',
    ]"
    @click="handleClick"
  >
    <div v-if="title || subtitle || $slots.header" class="card-header">
      <slot name="header">
        <h3 v-if="title" class="card-title">{{ title }}</h3>
        <p v-if="subtitle" class="card-subtitle">{{ subtitle }}</p>
      </slot>
    </div>

    <div class="card-body">
      <slot />
    </div>

    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.card {
  background-color: white;
  border-radius: 0.5rem;
  overflow: hidden;
  transition: all 0.3s ease;
}

.card-default {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-outlined {
  border: 1px solid #e2e8f0;
}

.card-elevated {
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.08);
}

.card-hoverable:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.card-clickable {
  cursor: pointer;
}

.card-header {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
}

.card-subtitle {
  font-size: 0.875rem;
  color: #718096;
  margin: 0;
}

.card-body {
  padding: 1rem;
}

.card-footer {
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
  background-color: #f7fafc;
}
</style>
