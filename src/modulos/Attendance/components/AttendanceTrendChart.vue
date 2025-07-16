<template>
  <div class="h-full w-full">
    <canvas ref="chartCanvas" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch, PropType } from 'vue';
import Chart from 'chart.js/auto';
import { ChartData } from '../types/chartTypes';

export default defineComponent({
  name: 'AttendanceTrendChart',
  props: {
    data: {
      type: Object as PropType<ChartData>,
      required: true,
    },
  },
  setup(props) {
    const chartCanvas = ref<HTMLCanvasElement | null>(null);
    let chart: Chart | null = null;

    const createChart = () => {
      if (!chartCanvas.value) return;

      const ctx = chartCanvas.value.getContext('2d');
      if (!ctx) return;

      // Destroy existing chart if it exists
      if (chart) chart.destroy();

      chart = new Chart(ctx, {
        type: 'line',
        data: props.data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                callback(value) {
                  return value + '%'; // Añadir el símbolo de porcentaje a las etiquetas del eje Y
                },
              },
            },
          },
          plugins: {
            legend: { position: 'top' }, // Posición de la leyenda en la parte superior
            tooltip: {
              callbacks: {
                label(context) {
                  return `${context.dataset.label}: ${context.parsed.y}%`;
                },
              },
            },
          },
          interaction: {
            mode: 'index',
            intersect: false,
          },
          elements: {
            line: {
              tension: 0.4, // Líneas más suaves
            },
            point: {
              radius: 3,
              hoverRadius: 5,
            },
          },
        },
      });
    };

    onMounted(() => {
      createChart();
    });

    watch(
      () => props.data,
      () => {
        createChart();
      },
      { deep: true },
    );

    return {
      chartCanvas,
    };
  },
});
</script>

<style scoped>
/* Estilos para animaciones o personalizaciones del gráfico */
canvas {
  transition: all 0.3s ease;
}
</style>
