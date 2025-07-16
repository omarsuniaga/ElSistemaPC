<template>
  <div class="maestro-montaje-container min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <MaestroMontajeHeader
      :is-dark-mode="isDarkMode"
      :director-reviewed="directorReviewed"
      :asistencia-pendiente="asistenciaPendiente"
      :progreso-semanal-porcentaje="progresoSemanalPorcentaje"
      @toggle-dark-mode="toggleDarkMode"
      @ir-a-asistencia="irAAsistencia"
    />

    <!-- Sección de Plan de Acción Semanal -->
    <MaestroPlanAccionSemanal
      :current-week="currentWeek"
      :plan-semanal="maestroPlanSemanal"
    />

    <!-- Sección Principal: Repertorio y Obras -->
    <div class="main-content mx-6 mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
      <!-- Columna izquierda: Lista de Obras -->
      <MaestroListaObras
        :obras="obras"
        :estados-compases-por-obra="estadosCompasesPorObra"
        :search-term="searchTerm"
        :filtro-estado="filtroEstado"
        :instrumento-seleccionado="instrumentoSeleccionado"
        :get-progreso-color-class="getProgresoColorClass"
        :get-progreso-bar-class="getProgresoBarClass"
        @update:search-term="searchTerm = $event"
        @update:filtro-estado="filtroEstado = $event"
        @update:instrumento-seleccionado="instrumentoSeleccionado = $event"
        @ver-detalle-obra="verDetalleObra"
        @filtrar-por-instrumento="filtrarPorInstrumento"
        @actualizar-estado-compass="actualizarEstadoCompass"
        @abrir-modal-observaciones="abrirModalObservaciones"
        @abrir-modal-evaluacion="abrirModalEvaluacion"
      />

      <!-- Columna derecha: Observaciones del Director e Historial -->
      <div class="space-y-6">
        <!-- Observaciones del Director -->
        <MaestroPanelObservaciones
          :observaciones-director="maestroObservacionesDirector"
          :format-date="formatDate"
        />

        <!-- Historial de Trabajo -->
        <MaestroResumenActividad :actividad-hoy="maestroActividadHoy" />

        <!-- Próximas Tareas -->
        <MaestroProximasTareas
          :proximas-tareas="maestroProximasTareas"
          :format-date="formatDate"
        />

        <!-- Configuración del Aula -->
        <MaestroConfiguracionAula @ir-a-configuracion-aula="irAConfiguracionAula" />
      </div>
    </div>

    <!-- Modales -->
    <ModalObservaciones
      v-if="showModalObservaciones"
      :obra="obraSeleccionada"
      @close="cerrarModalObservaciones"
      @guardar="guardarObservacion"
    />

    <ModalEvaluacion
      v-if="showModalEvaluacion"
      :obra="obraSeleccionada"
      @close="cerrarModalEvaluacion"
      @guardar="guardarEvaluacion"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useTheme } from '../../../contexts/ThemeContext';

// Composables
import { useMaestroMontajeData } from '../composables/useMaestroMontajeData';
import { useMaestroMontajeUI } from '../composables/useMaestroMontajeUI';
import { useMontajePermissions } from '../composables/useMontajePermissions';

// Componentes
import MaestroMontajeHeader from '../components/MaestroMontajeHeader.vue';
import MaestroPlanAccionSemanal from '../components/MaestroPlanAccionSemanal.vue';
import MaestroListaObras from '../components/MaestroListaObras.vue';
import MaestroPanelObservaciones from '../components/MaestroPanelObservaciones.vue';
import MaestroResumenActividad from '../components/MaestroResumenActividad.vue';
import MaestroProximasTareas from '../components/MaestroProximasTareas.vue';
import MaestroConfiguracionAula from '../components/MaestroConfiguracionAula.vue';
import ModalObservaciones from '../components/ModalObservaciones.vue';
import ModalEvaluacion from '../components/ModalEvaluacion.vue';

// Router
const router = useRouter();

// Contexto de tema
const { isDarkMode, toggleDarkMode } = useTheme();

// Composables de datos y UI
const { 
  isLoadingData,
  errorData,
  maestroPlanSemanal,
  maestroObservacionesDirector,
  maestroActividadHoy,
  maestroProximasTareas,
  obras,
  estadosCompasesPorObra,
} = useMaestroMontajeData();

const { 
  searchTerm,
  filtroEstado,
  showModalObservaciones,
  showModalEvaluacion,
  obraSeleccionada,
  instrumentoSeleccionado,
  obrasFiltradas,
  getCurrentWeek,
  formatDate,
  getProgresoColorClass,
  getProgresoBarClass,
  abrirModalObservaciones,
  cerrarModalObservaciones,
  abrirModalEvaluacion,
  cerrarModalEvaluacion,
  filtrarPorInstrumento,
} = useMaestroMontajeUI(obras);

// Composables de permisos (para uso futuro en la UI si es necesario)
const { hasPermission, canUpdateWorkProgress } = useMontajePermissions();

// Estado reactivo local (mantener si no se mueve a composables)
const directorReviewed = ref(false); // Esto podría venir de los datos del maestro
const asistenciaPendiente = ref(true); // Esto podría venir de un store de asistencia
const progresoSemanalPorcentaje = ref(65); // Esto podría ser calculado o venir de los datos del maestro

// Métodos que interactúan con el router o lógica de negocio específica de la vista
function irAAsistencia() {
  router.push('/attendance/calendar');
}

function verDetalleObra(obra: any) { // Tipo Obra
  router.push(`/montaje/obras/${obra.id}`);
}

function actualizarEstadoCompass(obraId: string, compas: number, estado: string) {
  // Lógica para actualizar el estado del compás
  console.log('Actualizando compás:', { obraId, compas, estado });
  // Aquí se llamaría a una acción del store de montaje para actualizar el estado en Firebase
  // montajeStore.actualizarEstadoCompass(obraId, compas, estado)
}

function guardarObservacion(observacion: any) { // Tipo ObservacionPedagogica
  // Lógica para guardar observación
  console.log('Guardando observación:', observacion);
  cerrarModalObservaciones();
}

function guardarEvaluacion(evaluacion: any) { // Tipo EvaluacionContinua
  // Lógica para guardar evaluación
  console.log('Guardando evaluación:', evaluacion);
  cerrarModalEvaluacion();
}

function irAConfiguracionAula() {
  // Lógica para navegar a la configuración del aula
  console.log('Navegando a configuración del aula');
  // router.push('/montaje/configuracion-aula');
}
</script>

<style scoped>
.transition-all {
  transition: all 0.3s ease;
}
</style>