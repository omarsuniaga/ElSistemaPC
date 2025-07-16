import { ref, onMounted } from 'vue';
import { useMontajeStore } from '../store/montaje';
import { useAuthStore } from '@/stores/auth';
import type { Obra, PlanAccion, ObservacionPedagogica, MontajeProject } from '../types';

export function useMaestroMontajeData() {
  const montajeStore = useMontajeStore();
  const authStore = useAuthStore();

  const isLoadingData = ref(false);
  const errorData = ref<string | null>(null);

  // Datos específicos del maestro que se cargarán
  // TODO: Implementar la carga real de estos datos desde el store/servicio
  const maestroPlanSemanal = ref<PlanAccion | null>({
    descripcion:
      'Esta semana enfócate en perfeccionar la articulación en los pasajes rápidos y trabajar la sincronización entre vientos y cuerdas.',
    obrasAsignadas: [
      { id: '1', titulo: 'Sinfonía No. 9 - Mov. I' },
      { id: '2', titulo: 'Concierto para Piano' },
    ],
    objetivos: [
      'Mejorar articulación en compases 45-60',
      'Sincronizar entrada de metales en compás 120',
      'Trabajar dinámicas en sección B',
    ],
  } as any); // Temporal, hasta que se cargue de verdad

  // TODO: Implementar la carga real de observaciones del director
  const maestroObservacionesDirector = ref<ObservacionPedagogica[]>([
    {
      id: '1',
      obra: { titulo: 'Sinfonía No. 9' },
      contenido:
        'Excelente trabajo en la sección de cuerdas. Continúa enfocándote en los crescendos del movimiento III.',
      tipo: 'Felicitación',
      fecha: new Date(),
    },
    {
      id: '2',
      obra: { titulo: 'Concierto para Piano' },
      contenido: 'Necesita más trabajo en la sincronización entre piano y orquesta en el compás 145.',
      tipo: 'Sugerencia',
      fecha: new Date(),
    },
  ] as any); // Temporal

  // TODO: Implementar la carga real de actividad de hoy
  const maestroActividadHoy = ref({
    obrasTrabajas: 3,
    compasesCompletados: 24,
    tiempoDedicado: 2.5,
  });

  // TODO: Implementar la carga real de próximas tareas
  const maestroProximasTareas = ref([
    {
      id: '1',
      titulo: 'Revisar compases 80-100 Sinfonía No. 9',
      descripcion: 'Enfocarse en la articulación de las cuerdas',
      fechaLimite: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
  ]);

  const loadMaestroData = async () => {
    isLoadingData.value = true;
    errorData.value = null;
    try {
      if (!authStore.user?.uid) {
        throw new Error('Usuario no autenticado para cargar datos del maestro.');
      }

      // Cargar obras filtradas por instrumento del profesor
      // Asumiendo que el repertorioId se gestiona a nivel de proyecto o es global para el maestro
      await montajeStore.cargarObrasPorInstrumentoProfesor(''); 

      // Las siguientes cargas de datos son simuladas por ahora.
      // Se requiere implementar la lógica en el store/servicio para obtener datos reales.
      // Por ejemplo, para el plan semanal, se necesitaría una función que obtenga el plan
      // activo para el maestro o el proyecto actual.
      // Para las observaciones del director, se necesitaría una función que filtre las observaciones
      // por tipo 'director' y por el maestro actual.
      // Para la actividad de hoy y próximas tareas, se necesitarían funciones de agregación
      // o consultas específicas en el servicio.

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
    obras: montajeStore.obras, // Las obras ya se cargan en el store
    estadosCompasesPorObra: montajeStore.estadosCompases, // Asumiendo que esto se mapea correctamente
    loadMaestroData,
  };
}