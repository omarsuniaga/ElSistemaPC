<script setup lang="ts">
/**
 * HeaderActions.vue – Botonera reutilizable para el header de asistencia
 *
 * Props:
 *  - role: 'admin' | 'teacher' → controla visibilidad de Exportar / Clase Emergente
 * Emits:
 *  - analytics, report, export, emergency
 */
import {computed} from "vue"

interface Props {
  role?: "admin" | "teacher"
}
const props = withDefaults(defineProps<Props>(), {role: "teacher"})

const emit = defineEmits<{
  (e: "analytics"): void
  (e: "report"): void
  (e: "export"): void
  (e: "emergency"): void
}>()

/* Permisos básicos */
const canExport = computed(() => props.role === "admin")
const canEmergency = computed(() => props.role === "admin")
</script>

<template>
  <div class="flex flex-wrap gap-2 w-full sm:w-auto">
    <button class="btn btn-secondary text-xs sm:text-sm" @click="emit('analytics')">
      <i class="fa-solid fa-chart-pie mr-1 sm:mr-2" />
      <span class="hidden xs:inline">Análisis</span>
      <span class="xs:hidden">A</span>
    </button>

    <button class="btn btn-secondary text-xs sm:text-sm" @click="emit('report')">
      <i class="fa-solid fa-file-alt mr-1 sm:mr-2" />
      <span class="hidden xs:inline">Informe</span>
      <span class="xs:hidden">I</span>
    </button>

    <button v-if="canExport" class="btn btn-secondary text-xs sm:text-sm" @click="emit('export')">
      <i class="fa-solid fa-file-export mr-1 sm:mr-2" />
      <span class="hidden xs:inline">Exportar</span>
      <span class="xs:hidden">E</span>
    </button>

    <button
      v-if="canEmergency"
      class="btn btn-secondary text-xs sm:text-sm"
      @click="emit('emergency')"
    >
      <i class="fa-solid fa-circle-exclamation mr-1 sm:mr-2" />
      <span class="hidden xs:inline">Clase Emergente</span>
      <span class="xs:hidden">CE</span>
    </button>
  </div>
</template>

<style scoped>
/* sin estilos extra: usa utilidades Tailwind/Shadcn */
</style>
