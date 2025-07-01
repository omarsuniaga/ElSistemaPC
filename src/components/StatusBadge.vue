<template>
  <div
    class="status-badge inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold"
    :class="statusClasses"
    role="status"
    :aria-label="ariaLabel"
  >
    <span v-if="showDot" class="w-2 h-2 rounded-full mr-1" :class="dotClass" aria-hidden="true" />
    {{ label }}
  </div>
</template>

<script setup lang="ts">
import {computed} from "vue"

const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: (value) => ["present", "absent", "late", "justified"].includes(value),
  },
  showDot: {
    type: Boolean,
    default: true,
  },
  size: {
    type: String,
    default: "sm",
    validator: (value) => ["sm", "md", "lg"].includes(value),
  },
})

const label = computed(() => {
  const labels = {
    present: "Presente",
    absent: "Ausente",
    late: "Tarde",
    justified: "Justificado",
  }
  return labels[props.status] || "Desconocido"
})

const statusClasses = computed(() => {
  // Clases base para todos los estados
  let classes = ""

  // Clases específicas por estado
  const statusStyles = {
    present: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    absent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    late: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    justified: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  }

  classes += statusStyles[props.status] || ""

  // Tamaños
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-2.5 py-1.5",
    lg: "text-base px-3 py-2",
  }

  classes += " " + sizeClasses[props.size]

  return classes
})

const dotClass = computed(() => {
  const dotClasses = {
    present: "bg-green-500",
    absent: "bg-red-500",
    late: "bg-amber-500",
    justified: "bg-blue-500",
  }
  return dotClasses[props.status] || ""
})

const ariaLabel = computed(() => `Estado: ${label.value}`)
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  transition: all 0.2s ease;
}

/* Para usuarios que prefieran movimiento reducido */
@media (prefers-reduced-motion: reduce) {
  .status-badge {
    transition: none;
  }
}
</style>
