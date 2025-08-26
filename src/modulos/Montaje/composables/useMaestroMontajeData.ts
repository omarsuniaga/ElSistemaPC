import { ref, onMounted, computed } from 'vue';
import { useMontajeStore } from '../store/montaje';
import { useAuthStore } from '@/stores/auth';
import { useClassesStore } from '@/stores/classes'; // Importar el store de clases
import type { Obra, PlanAccion, ObservacionPedagogica } from '../types';

export function useMaestroMontajeData() {
  const montajeStore = useMontajeStore();
  const authStore = useAuthStore();
  const classesStore = useClassesStore(); // Instanciar el store de clases

  const isLoadingData = ref(false);
  const errorData = ref<string | null>(null);

  // Ref para la próxima clase pendiente
  const proximaClasePendiente = ref<any | null>(null);

  // Datos específicos del maestro (simulados por ahora)
  const maestroPlanSemanal = ref<PlanAccion | null>(null);
  const maestroObservacionesDirector = ref<ObservacionPedagogica[]>([]);
  const maestroActividadHoy = ref({ obrasTrabajas: 0, compasesCompletados: 0, tiempoDedicado: 0 });
  const maestroProximasTareas = ref<any[]>([]);

  const loadMaestroData = async () => {
    isLoadingData.value = true;
    errorData.value = null;
    try {
      if (!authStore.user?.uid) {
        throw new Error('Usuario no autenticado para cargar datos del maestro.');
      }

      // Cargar obras para el maestro
      await montajeStore.cargarObrasParaMaestro();

      // Cargar clases
      await classesStore.fetchClasses(); // Asegurarse de que las clases están cargadas

      // Encontrar la próxima clase pendiente de asistencia
      const proximaClase = classesStore.findNextUpcomingClassForTeacher(authStore.user.uid);
      proximaClasePendiente.value = proximaClase;

      // TODO: Cargar los datos reales del plan semanal, observaciones, etc.

    } catch (error: any) {
      console.error('Error cargando datos del maestro:', error);
      errorData.value = error.message || 'Error al cargar datos del maestro.';
    } finally {
      isLoadingData.value = false;
    }
  };

  onMounted(() => {
    loadMaestroData();
  });

  return {
    isLoadingData,
    errorData,
    maestroPlanSemanal,
    maestroObservacionesDirector,
    maestroActividadHoy,
    maestroProximasTareas,
    proximaClasePendiente, // Exponer la próxima clase
    obras: computed(() => montajeStore.obras),
    estadosCompasesPorObra: computed(() => montajeStore.estadosCompases),
    loadMaestroData,
  };
}