import { ref, computed } from 'vue';
import type { Obra } from '../types';

export function useMaestroMontajeUI(obras: Ref<Obra[]>) {
  const searchTerm = ref('');
  const filtroEstado = ref('');
  const showModalObservaciones = ref(false);
  const showModalEvaluacion = ref(false);
  const obraSeleccionada = ref<Obra | null>(null);
  const instrumentoSeleccionado = ref<Record<string, string>>({});

  const obrasFiltradas = computed(() => {
    let filteredObras = obras.value;

    if (searchTerm.value) {
      filteredObras = filteredObras.filter(
        (obra) =>
          obra.titulo.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
          obra.compositor?.toLowerCase().includes(searchTerm.value.toLowerCase()),
      );
    }

    if (filtroEstado.value) {
      filteredObras = filteredObras.filter((obra) => {
        const progreso = obra.metadatos.progresoPorcentaje;
        switch (filtroEstado.value) {
          case 'sin_trabajar':
            return progreso === 0;
          case 'en_progreso':
            return progreso > 0 && progreso < 100;
          case 'completado':
            return progreso === 100;
          default:
            return true;
        }
      });
    }

    return filteredObras;
  });

  function getCurrentWeek(): number {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const diffInTime = now.getTime() - startOfYear.getTime();
    const diffInWeeks = Math.ceil(diffInTime / (7 * 24 * 60 * 60 * 1000));
    return diffInWeeks;
  }

  function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  function getProgresoColorClass(progreso: number): string {
    if (progreso >= 80) return 'text-green-600 dark:text-green-400';
    if (progreso >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  }

  function getProgresoBarClass(progreso: number): string {
    if (progreso >= 80) return 'bg-green-500 dark:bg-green-400';
    if (progreso >= 50) return 'bg-yellow-500 dark:bg-yellow-400';
    return 'bg-red-500 dark:bg-red-400';
  }

  function abrirModalObservaciones(obra: Obra) {
    obraSeleccionada.value = obra;
    showModalObservaciones.value = true;
  }

  function cerrarModalObservaciones() {
    showModalObservaciones.value = false;
    obraSeleccionada.value = null;
  }

  function abrirModalEvaluacion(obra: Obra) {
    obraSeleccionada.value = obra;
    showModalEvaluacion.value = true;
  }

  function cerrarModalEvaluacion() {
    showModalEvaluacion.value = false;
    obraSeleccionada.value = null;
  }

  function filtrarPorInstrumento(obraId: string) {
    const instrumentoId = instrumentoSeleccionado.value[obraId];
    console.log('Filtrando por instrumento:', { obraId, instrumentoId });
    // Aquí iría la lógica para filtrar el mapa de calor por instrumento
    // montajeStore.filtrarMapaCalorPorInstrumento(obraId, instrumentoId)
  }

  return {
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
  };
}
