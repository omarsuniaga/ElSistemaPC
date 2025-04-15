<template>
  <div class="max-w-3xl mx-auto p-6 bg-white rounded shadow">
    <h1 class="text-2xl font-bold mb-4">Perfil de Alumno e Instrumento</h1>
    <div v-if="student && instrument">
      <section class="mb-6">
        <h2 class="text-lg font-semibold mb-2">Datos del Alumno</h2>
        <div><b>Nombre:</b> {{ student.nombre }} {{ student.apellido }}</div>
        <div><b>Email:</b> {{ student.email }}</div>
        <div><b>Teléfono:</b> {{ student.phone }}</div>
        <!-- Agrega más campos si es necesario -->
      </section>
      <section class="mb-6">
        <h2 class="text-lg font-semibold mb-2">Datos del Instrumento</h2>
        <div><b>Nombre:</b> {{ instrument.nombre }}</div>
        <div><b>Serial:</b> {{ instrument.serial }}</div>
        <div><b>Marca:</b> {{ instrument.marca }}</div>
        <div><b>Estado:</b> {{ instrument.estado }}</div>
        <div><b>Fecha de Asignación:</b> {{ instrument.asignacion?.fechaAsignacion }}</div>
        <div v-if="instrument.asignacion?.contrato"><b>Contrato:</b> <a :href="instrument.asignacion.contrato" target="_blank">Ver PDF</a></div>
      </section>
      <section class="mb-6">
        <h2 class="text-lg font-semibold mb-2">Historial del Instrumento</h2>
        <div v-if="instrument">
          <ul class="list-disc ml-6">
            <!-- Asignación actual -->
            <li v-if="instrument.isAssign && instrument.asignacion">
              <div><b>Alumno actual:</b> {{ instrument.asignacion.nombreAlumno }}</div>
              <div><b>Fecha de asignación:</b> {{ instrument.asignacion.fechaAsignacion }}</div>
              <div v-if="instrument.asignacion.contrato"><b>Contrato:</b> <a :href="instrument.asignacion.contrato" target="_blank">Ver PDF</a></div>
              <div class="text-green-700 font-semibold">(Asignación vigente)</div>
            </li>
            <!-- Historial anterior -->
            <li v-for="(h, idx) in instrument.historial" :key="'hist-' + idx">
              <div><b>Alumno:</b> {{ h.nombreAlumno }}</div>
              <div><b>Período:</b> {{ h.periodo.from }} - {{ h.periodo.to }}</div>
              <div><b>Condiciones:</b> Entrega: {{ h.condiciones.entrega }}, Devolución: {{ h.condiciones.devolucion }}</div>
              <div v-if="h.observaciones"><b>Observaciones:</b> {{ h.observaciones }}</div>
              <div v-if="h.cambiosAccesorios && h.cambiosAccesorios.length">
                <b>Cambios de accesorios:</b>
                <ul>
                  <li v-for="(c, i) in h.cambiosAccesorios" :key="i">{{ c.accesorio }} - {{ c.detalle }} ({{ c.fecha }})</li>
                </ul>
              </div>
            </li>
          </ul>
          <div v-if="!instrument.isAssign && (!instrument.historial || !instrument.historial.length)" class="text-gray-500">Sin historial de instrumento.</div>
        </div>
      </section>
      <div class="flex gap-2">
        <button class="px-4 py-2 bg-blue-600 text-white rounded" @click="goToEdit">Reasignar Instrumento</button>
        <button class="px-4 py-2 bg-gray-300 rounded" @click="goBack">Volver</button>
      </div>
    </div>
    <div v-else class="text-red-500">No se encontraron datos del alumno o instrumento.</div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useInstrumentoStore } from '../../Instruments/store/instrumento';
import { useStudentsStore } from '../../Students/store/students';

const route = useRoute();
const router = useRouter();
const instrumentStore = useInstrumentoStore();
const studentsStore = useStudentsStore();

const student = ref<any>(null);
const instrument = ref<any>(null);

onMounted(async () => {
  const { studentId, instrumentId } = route.params;
  if (!studentsStore.students.length) await studentsStore.fetchStudents();
  if (!instrumentStore.instruments.length) await instrumentStore.fetchInstruments();
  student.value = studentsStore.students.find(s => s.id === studentId);
  instrument.value = instrumentStore.instruments.find(i => i.id === instrumentId);
});

function goToEdit() {
  router.push({ name: 'InstrumentAssign', params: { id: instrument.value.id } });
}
function goBack() {
  router.push({ name: 'InstrumentList' });
}
</script>
