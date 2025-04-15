<template>
  <div class="max-w-3xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-4">Detalle del Instrumento</h1>
    <div v-if="instrument">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 class="text-xl font-semibold">{{ instrument.nombre }}</h2>
            <p class="text-gray-600 dark:text-gray-300">{{ instrument.marca }} {{ instrument.modelo }} | Serial: {{ instrument.serial }}</p>
            <p class="text-sm text-gray-500 mt-1">Estado: <span class="font-medium">{{ instrument.estado }}</span></p>
            <p class="text-sm text-gray-500">Familia: {{ instrument.familia }} | Tamaño: {{ instrument.tamaño }}</p>
            <p class="text-sm text-gray-500">Ubicación: {{ instrument.ubicacion }}</p>
          </div>
          <div class="flex gap-2">
            <button class="btn bg-blue-600 text-white" @click="showEdit = true">Modificar</button>
            <button class="btn bg-yellow-500 text-white" @click="quitarAsignacion" :disabled="!alumnoActual">Quitar asignación</button>
            <button class="btn bg-green-600 text-white" @click="reasignarInstrumento">Reasignar</button>
          </div>
        </div>
        <div class="mt-4">
          <h3 class="font-semibold mb-2">Alumno asignado</h3>
          <div v-if="alumnoActual">
            <p><span class="font-medium">{{ alumnoActual.nombre }} {{ alumnoActual.apellido }}</span></p>
            <p class="text-sm text-gray-500">Asignado desde: {{ fechaAsignacion }}</p>
            <p class="text-sm text-gray-500">Nivel: {{ nivelAsignado }}</p>
          </div>
          <div v-else class="text-gray-400">No hay alumno asignado actualmente.</div>
        </div>
        <div class="mt-4">
          <h3 class="font-semibold mb-2">Accesorios</h3>
          <ul v-if="instrument.accesorios && instrument.accesorios.length">
            <li v-for="(acc, i) in instrument.accesorios" :key="i">
              {{ acc.nombre }} ({{ acc.estado }}) <span v-if="acc.observacion">- {{ acc.observacion }}</span>
            </li>
          </ul>
          <div v-else class="text-gray-400">Sin accesorios registrados.</div>
        </div>
        <div class="mt-4">
          <h3 class="font-semibold mb-2">Observaciones</h3>
          <p>{{ instrument.observaciones || 'Sin observaciones.' }}</p>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 class="font-semibold mb-2">Historial de Asignaciones</h3>
        <ul v-if="instrument.historial && instrument.historial.length">
          <li v-for="(h, i) in instrument.historial" :key="i" class="mb-1">
            <span class="font-medium">{{ h.nombreAlumno }}</span> -
            {{ h.fechaInicio }}<span v-if="h.fechaFin"> a {{ h.fechaFin }}</span>
          </li>
        </ul>
        <div v-else class="text-gray-400">Sin historial.</div>
      </div>
    </div>
    <div v-else class="text-center text-gray-500">Cargando instrumento...</div>
    <!-- Modal de edición -->
    <InstrumentForm v-if="showEdit" :instrument="instrument" @save="guardarCambios" @cancel="showEdit = false" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useInstrumentoStore } from '../store/instrumento';
import { useStudentsStore } from '../../Students/store/students';
import InstrumentForm from '../components/InstrumentForm.vue';

const route = useRoute();
const instrumentoStore = useInstrumentoStore();
const studentsStore = useStudentsStore();

const instrument = ref<any>(null);
const showEdit = ref(false);

// Cargar instrumento al montar
onMounted(async () => {
  const id = route.params.id as string;
  await instrumentoStore.fetchInstruments();
  instrument.value = instrumentoStore.getInstrumentByIdGetters(id);
  if (!studentsStore.students.length) await studentsStore.$patch({ students: await studentsStore.$state.students });
});

// Alumno actual asignado
const alumnoActual = computed(() => {
  if (!instrument.value?.historial) return null;
  const actual = instrument.value.historial.find((h: any) => !h.fechaFin);
  if (!actual) return null;
  return studentsStore.getStudentById(actual.alumnoId) || { nombre: actual.nombreAlumno, apellido: '' };
});

const fechaAsignacion = computed(() => {
  if (!instrument.value?.historial) return '';
  const actual = instrument.value.historial.find((h: any) => !h.fechaFin);
  return actual ? actual.fechaInicio : '';
});

const nivelAsignado = computed(() => {
  // Si el historial tiene nivel, úsalo. Si no, puedes buscarlo en la clase del alumno.
  if (!instrument.value?.historial) return '';
  const actual = instrument.value.historial.find((h: any) => !h.fechaFin);
  return actual?.nivel || 'No especificado';
});

function guardarCambios(updated: any) {
  // Aquí deberías llamar a la acción real de updateInstrument
  Object.assign(instrument.value, updated);
  showEdit.value = false;
}

function quitarAsignacion() {
  // Aquí deberías implementar la lógica real para quitar la asignación
  alert('Funcionalidad de quitar asignación pendiente de implementación.');
}

function reasignarInstrumento() {
  // Aquí deberías implementar la lógica real para reasignar el instrumento
  alert('Funcionalidad de reasignar instrumento pendiente de implementación.');
}
</script>

<style scoped>
.btn {
  @apply px-4 py-2 rounded font-semibold shadow hover:opacity-90 transition;
}
</style>
