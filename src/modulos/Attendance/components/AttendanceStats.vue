<template>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div class="bg-blue-50 p-4 rounded-lg">
      <h3 class="text-lg font-semibold text-blue-800">Asistencia Total</h3>
      <p class="text-2xl font-bold text-blue-600">{{ stats.totalAttendance }}%</p>
    </div>
    <div class="bg-green-50 p-4 rounded-lg">
      <h3 class="text-lg font-semibold text-green-800">Presentes</h3>
      <p class="text-2xl font-bold text-green-600">{{ stats.presentCount }}</p>
    </div>
    <div class="bg-red-50 p-4 rounded-lg">
      <h3 class="text-lg font-semibold text-red-800">Ausentes</h3>
      <p class="text-2xl font-bold text-red-600">{{ stats.absentCount }}</p>
    </div>
    <div class="bg-yellow-50 p-4 rounded-lg">
      <h3 class="text-lg font-semibold text-yellow-800">Justificados</h3>
      <p class="text-2xl font-bold text-yellow-600">{{ stats.justifiedCount }}</p>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    stats: {
      type: Object,
      required: true
    }
  }
};
</script>
