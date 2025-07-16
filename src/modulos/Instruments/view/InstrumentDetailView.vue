<template>
  <div class="max-w-3xl mx-auto p-6">
    <h1 class="text-3xl font-bold mb-6 text-center">Detalle del Instrumento</h1>

    <div v-if="instrument" class="space-y-6">
      <!-- Información General y Estado -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
          <div>
            <h2 class="text-2xl font-semibold mb-1">{{ instrument.nombre }}</h2>
            <p class="text-gray-700 dark:text-gray-300">
              {{ instrument.marca }} {{ instrument.modelo }}
            </p>
            <p class="text-sm text-gray-500">Serial: {{ instrument.serial }}</p>
          </div>
          <div class="flex gap-2 mt-2 md:mt-0 flex-wrap">
            <button class="btn bg-blue-600 text-white" @click="showEdit = true">Modificar</button>
            <button
              class="btn bg-yellow-500 text-white"
              :disabled="!alumnoActual"
              @click="quitarAsignacion"
            >
              Quitar asignación
            </button>
            <button class="btn bg-green-600 text-white" @click="reasignarInstrumento">
              Reasignar
            </button>
          </div>
        </div>
        <hr class="my-4 dark:border-gray-600" />
        <div>
          <h3 class="text-lg font-semibold mb-2">Detalles</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <p>
              <span class="font-medium text-gray-600 dark:text-gray-400">Estado:</span>
              {{ instrument.estado }}
            </p>
            <p>
              <span class="font-medium text-gray-600 dark:text-gray-400">Familia:</span>
              {{ instrument.familia }}
            </p>
            <p>
              <span class="font-medium text-gray-600 dark:text-gray-400">Tamaño:</span>
              {{ instrument.tamaño }}
            </p>
            <p>
              <span class="font-medium text-gray-600 dark:text-gray-400">Ubicación:</span>
              {{ instrument.ubicacion }}
            </p>
            <!-- Añadir aquí más detalles si existen, ej: Fecha de Adquisición, Valor, etc. -->
          </div>
        </div>
      </div>

      <!-- Alumno Asignado -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-3">Alumno Asignado Actualmente</h3>
        <div v-if="alumnoActual">
          <p class="text-xl font-medium">{{ alumnoActual.nombre }} {{ alumnoActual.apellido }}</p>
          <p class="text-sm text-gray-500 mt-1">
            Asignado desde: <span class="font-medium">{{ fechaAsignacion }}</span>
          </p>
          <p class="text-sm text-gray-500">
            Nivel durante asignación: <span class="font-medium">{{ nivelAsignado }}</span>
          </p>
          <!-- Podrías añadir un enlace al perfil del alumno si tienes rutas para ello -->
        </div>
        <div v-else class="text-gray-500 italic">No hay alumno asignado actualmente.</div>
      </div>

      <!-- Accesorios -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-3">Accesorios Registrados</h3>
        <ul
          v-if="instrument.accesorios && instrument.accesorios.length"
          class="list-disc list-inside space-y-1 text-sm"
        >
          <li v-for="(acc, i) in instrument.accesorios" :key="i">
            <span class="font-medium">{{ acc.nombre }}</span> ({{ acc.estado }})
            <span v-if="acc.observacion" class="text-gray-600 dark:text-gray-400"
              >- {{ acc.observacion }}</span
            >
          </li>
        </ul>
        <div v-else class="text-gray-500 italic">Sin accesorios registrados.</div>
      </div>

      <!-- Observaciones y Mantenimiento -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-3">Observaciones y Mantenimiento</h3>
        <p class="text-sm whitespace-pre-wrap">
          {{
            instrument.observaciones ||
            "Sin observaciones ni historial de mantenimiento detallado registrado."
          }}
        </p>
        <!-- Si tuvieras un array 'reparaciones' o 'mantenimientos', lo listarías aquí -->
        <!-- Ejemplo:
        <h4 class="font-semibold mt-4 mb-2">Historial de Mantenimiento</h4>
        <ul v-if="instrument.reparaciones && instrument.reparaciones.length">
          <li v-for="rep in instrument.reparaciones" :key="rep.id"> {{ rep.fecha }}: {{ rep.descripcion }}</li>
        </ul>
        <p v-else>No hay registros de mantenimiento.</p>
        -->
      </div>

      <!-- Historial de Asignaciones -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-3">Historial de Asignaciones Anteriores</h3>
        <ul v-if="historialPasado && historialPasado.length" class="space-y-2 text-sm">
          <li
            v-for="(h, i) in historialPasado"
            :key="i"
            class="border-b border-gray-200 dark:border-gray-700 pb-1"
          >
            <span class="font-medium">{{ h.nombreAlumno }}</span>
            <span class="text-gray-600 dark:text-gray-400">
              ({{ h.fechaInicio }} a {{ h.fechaFin }})</span
            >
            <span v-if="h.nivel" class="text-gray-500"> - Nivel: {{ h.nivel }}</span>
          </li>
        </ul>
        <div v-else class="text-gray-500 italic">Sin historial de asignaciones anteriores.</div>
      </div>
    </div>
    <div v-else class="text-center text-gray-500 mt-10">Cargando detalles del instrumento...</div>

    <!-- Modal de edición -->
    <InstrumentForm
      v-if="showEdit"
      :instrument="instrument"
      @save="guardarCambios"
      @cancel="showEdit = false"
    />
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
  // Asegurarse que los instrumentos están cargados
  if (!instrumentoStore.instruments.length) {
    await instrumentoStore.fetchInstruments();
  }
  instrument.value = instrumentoStore.getInstrumentByIdGetters(id);

  // Asegurarse que los estudiantes están cargados si hay historial
  if (instrument.value?.historial?.length && !studentsStore.students.length) {
    // Asumiendo que tienes una acción para cargar estudiantes si no están
    // await studentsStore.fetchStudents(); // O la acción que uses
    // La línea original parece intentar cargar desde el estado, lo cual podría ser problemático si está vacío
    await studentsStore.$patch({ students: await studentsStore.$state.students }); // Mantengo tu lógica original por si tiene un propósito específico
  }
});

// Alumno actual asignado
const asignacionActual = computed(() => {
  if (!instrument.value?.historial) return null;
  return instrument.value.historial.find((h: any) => !h.fechaFin);
});

const alumnoActual = computed(() => {
  const actual = asignacionActual.value;
  if (!actual) return null;
  // Intenta obtener el estudiante completo desde el store
  const studentData = studentsStore.getStudentById(actual.alumnoId);
  if (studentData) return studentData;
  // Fallback si el estudiante no se encuentra en el store (quizás fue eliminado)
  return { nombre: actual.nombreAlumno, apellido: '' }; // Asume que nombreAlumno contiene nombre y apellido o solo nombre
});

const fechaAsignacion = computed(() => {
  return asignacionActual.value ? asignacionActual.value.fechaInicio : '';
});

const nivelAsignado = computed(() => {
  // Prioriza el nivel guardado en el historial.
  const nivelHistorial = asignacionActual.value?.nivel;
  if (nivelHistorial) return nivelHistorial;

  // Si no hay nivel en el historial, intenta buscarlo en los datos del alumno (si existen)
  // Esto requeriría que el objeto 'alumnoActual' tenga información de nivel/clase
  // Ejemplo: return alumnoActual.value?.nivelActual || 'No especificado';
  return 'No especificado'; // Fallback
});

// Historial pasado (excluyendo la asignación actual)
const historialPasado = computed(() => {
  if (!instrument.value?.historial) return [];
  return instrument.value.historial.filter((h: any) => h.fechaFin); // Solo los que tienen fecha de fin
});

function guardarCambios(updated: any) {
  // Idealmente, llamarías a una acción del store para persistir el cambio
  // await instrumentoStore.updateInstrument(instrument.value.id, updated);
  console.log('Guardando cambios (simulado):', updated);
  Object.assign(instrument.value, updated); // Actualiza localmente para reflejar en UI
  instrument.value = { ...instrument.value, ...updated }; // Otra forma de asegurar reactividad
  showEdit.value = false;
  // Podrías querer recargar el instrumento desde el store para asegurar consistencia
  // instrument.value = instrumentoStore.getInstrumentByIdGetters(route.params.id as string);
}

async function quitarAsignacion() {
  if (!asignacionActual.value) return;

  // Confirmación
  if (
    !confirm(
      `¿Estás seguro de quitar la asignación de ${instrument.value.nombre} a ${alumnoActual.value?.nombre} ${alumnoActual.value?.apellido}?`,
    )
  ) {
    return;
  }

  try {
    // Lógica para actualizar el historial en el store/backend
    // Esto implica encontrar la asignación actual en instrument.historial y ponerle una fechaFin
    const hoy = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    // await instrumentoStore.endInstrumentAssignment(instrument.value.id, asignacionActual.value.alumnoId, hoy);
    alert('Funcionalidad de quitar asignación pendiente de implementación en el store.');

    // Actualizar UI (simulado hasta implementar store)
    const historialActualizado = instrument.value.historial.map((h: any) => {
      if (h.alumnoId === asignacionActual.value.alumnoId && !h.fechaFin) {
        return { ...h, fechaFin: hoy };
      }
      return h;
    });
    instrument.value.historial = historialActualizado;
  } catch (error) {
    console.error('Error al quitar asignación:', error);
    alert('Error al quitar la asignación.');
  }
}

function reasignarInstrumento() {
  // Esto probablemente debería navegar a una vista diferente o abrir un modal
  // donde se pueda seleccionar un nuevo alumno y fecha de inicio.
  alert(
    'Funcionalidad de reasignar instrumento pendiente de implementación. Debería llevar a un formulario de asignación.',
  );
  // Ejemplo: router.push({ name: 'asignarInstrumento', params: { instrumentoId: instrument.value.id } });
}
</script>

<style scoped>
.btn {
  @apply px-4 py-2 rounded font-semibold shadow hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed;
}
/* Añade otros estilos si son necesarios */
</style>
