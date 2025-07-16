<template>
  <div 
    class="work-progress-actions" 
    :class="{ 'flex-col': vertical, 'flex-row': !vertical }"
  >
    <!-- Botones mostrados según permisos -->
    <div v-if="isLoading" class="loading">
      <div class="spinner-border spinner-border-sm" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>
    
    <div
v-else :class="{ 
      'flex gap-2': !vertical,
      'flex flex-col gap-2': vertical
    }">
      <!-- Progreso por instrumento (para maestros) -->
      <button
        v-if="canViewInstrumentProgress"
        class="btn"
        :class="buttonClass"
        @click="navigateToInstrumentProgress"
      >
        <i class="bi bi-music-note-list"></i>
        <span v-if="showLabels" class="ml-1">Progreso por Instrumento</span>
      </button>
      
      <!-- Dashboard de director -->
      <button
        v-if="canViewDirectorDashboard"
        class="btn"
        :class="buttonClass"
        @click="navigateToDirectorDashboard"
      >
        <i class="bi bi-bar-chart-fill"></i>
        <span v-if="showLabels" class="ml-1">Dashboard Director</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useMontajeStore } from '../store/montaje';
import { permissionsService } from '../service/permissionsService';
import { MontajePermission } from '../types/permissions';

// Props
const props = defineProps({
  obraId: {
    type: String,
    required: true,
  },
  buttonStyle: {
    type: String,
    default: 'primary',
    validator: (value: string) => ['primary', 'secondary', 'outline', 'text'].includes(value),
  },
  showLabels: {
    type: Boolean,
    default: true,
  },
  vertical: {
    type: Boolean,
    default: false,
  },
});

// Variables
const router = useRouter();
const montajeStore = useMontajeStore();
const canViewInstrumentProgress = ref(false);
const canViewDirectorDashboard = ref(false);
const isLoading = ref(true);

// Calcular clase para botones según estilo
const buttonClass = computed(() => {
  switch (props.buttonStyle) {
  case 'secondary': return 'btn-secondary';
  case 'outline': return 'btn-outline-primary';
  case 'text': return 'btn-link';
  default: return 'btn-primary';
  }
});

// Verificar permisos
async function checkPermissions() {
  try {
    isLoading.value = true;
    
    // Verificar permiso para ver progreso por instrumento
    const hasInstrumentPermission = await permissionsService.hasPermission(
      MontajePermission.VIEW_INSTRUMENT_COMPASS_STATES,
    );
    canViewInstrumentProgress.value = hasInstrumentPermission;
    
    // Verificar permiso para ver dashboard de director
    const hasDirectorPermission = await permissionsService.hasPermission(
      MontajePermission.VIEW_AGGREGATED_REPORTS,
    );
    canViewDirectorDashboard.value = hasDirectorPermission;
    
  } catch (error) {
    console.error('Error al verificar permisos:', error);
  } finally {
    isLoading.value = false;
  }
}

// Navegar a la vista de progreso por instrumento
function navigateToInstrumentProgress() {
  router.push({
    name: 'montaje-instrument-progress',
    params: { id: props.obraId },
  });
}

// Navegar al dashboard de director
function navigateToDirectorDashboard() {
  router.push({
    name: 'montaje-director-dashboard',
    params: { id: props.obraId },
  });
}

// Al montar el componente
onMounted(checkPermissions);
</script>

<style scoped>
.work-progress-actions {
  @apply flex items-center;
}

.loading {
  @apply py-2 px-4;
}
</style>
