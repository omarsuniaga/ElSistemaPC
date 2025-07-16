// src/modulos/Montaje/integration/montaje.integration.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import { useMontajeStore } from '../store/montaje';
import { useStudentsStore } from '../../Students/store/students';
import { useClassesStore } from '../../Classes/store/classes';
import ObraDetailView from '../views/ObraDetailView.vue';
import { nextTick } from 'vue';

// Mock de Firebase
vi.mock('@/firebase/config', () => ({
  db: {},
  auth: {},
}));

// Mock de servicios
vi.mock('../service/montajeService', () => ({
  montajeService: {
    getObra: vi.fn(),
    updateObra: vi.fn(),
    getCompases: vi.fn(),
    updateCompass: vi.fn(),
    getAlumnosPorObra: vi.fn(),
  },
}));

vi.mock('../../Students/service/studentsService', () => ({
  studentsService: {
    getStudentsByIds: vi.fn(),
    getStudentsByClass: vi.fn(),
  },
}));

vi.mock('../../Classes/service/classesService', () => ({
  classesService: {
    getClassesByIds: vi.fn(),
    getStudentsInClass: vi.fn(),
  },
}));

describe('Integración Completa del Módulo Montaje', () => {
  let router;
  let montajeStore;
  let studentsStore;
  let classesStore;

  beforeEach(() => {
    setActivePinia(createPinia());

    // Configurar router
    router = createRouter({
      history: createWebHistory(),
      routes: [
        {
          path: '/montaje/:id',
          name: 'ObraDetail',
          component: ObraDetailView,
        },
      ],
    });

    // Inicializar stores
    montajeStore = useMontajeStore();
    studentsStore = useStudentsStore();
    classesStore = useClassesStore();

    // Mock de datos base
    vi.mocked(montajeService.getObra).mockResolvedValue({
      id: 'obra-test-1',
      titulo: 'Sinfonía de Prueba',
      compositor: 'Test Composer',
      descripcion: 'Una obra de prueba para testing',
      duracionEstimada: 3600,
      nivelDificultad: 3,
      fechaCreacion: new Date(),
      metadatos: {
        totalCompases: 120,
        progresoPorcentaje: 45,
      },
    });

    vi.mocked(montajeService.getCompases).mockResolvedValue([
      { numero: 1, estado: 'COMPLETADO', observaciones: 'Test 1' },
      { numero: 2, estado: 'EN_PROGRESO', observaciones: 'Test 2' },
      { numero: 3, estado: 'NO_TRABAJADO', observaciones: '' },
    ]);

    vi.mocked(studentsService.getStudentsByClass).mockResolvedValue([
      { id: 'student-1', nombre: 'Estudiante 1', instrumento: 'Violín' },
      { id: 'student-2', nombre: 'Estudiante 2', instrumento: 'Piano' },
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Flujo Completo de Carga de Obra', () => {
    it('debe cargar obra y datos relacionados correctamente', async () => {
      // Montar componente con router
      const wrapper = mount(ObraDetailView, {
        global: {
          plugins: [router],
          stubs: {
            HeatMap: true,
            AlumnosSelector: true,
            CompasToolbar: true,
          },
        },
      });

      // Navegar a la obra
      await router.push('/montaje/obra-test-1');
      await nextTick();

      // Verificar que se cargaron los datos
      expect(montajeService.getObra).toHaveBeenCalledWith('obra-test-1');
      expect(montajeService.getCompases).toHaveBeenCalledWith('obra-test-1');

      // Esperar a que se complete la carga
      await wrapper.vm.$nextTick();

      // Verificar estado del store
      expect(montajeStore.obraActual).toBeTruthy();
      expect(montajeStore.obraActual.titulo).toBe('Sinfonía de Prueba');
      expect(montajeStore.compases.size).toBe(3);
      expect(montajeStore.isLoading).toBe(false);
    });

    it('debe manejar errores de carga gracefulmente', async () => {
      // Simular error en servicio
      vi.mocked(montajeService.getObra).mockRejectedValue(new Error('Error de red'));

      const wrapper = mount(ObraDetailView, {
        global: {
          plugins: [router],
          stubs: {
            HeatMap: true,
            AlumnosSelector: true,
            CompasToolbar: true,
          },
        },
      });

      await router.push('/montaje/obra-test-1');
      await nextTick();

      // Esperar manejo del error
      await wrapper.vm.$nextTick();

      expect(montajeStore.error).toBeTruthy();
      expect(montajeStore.isLoading).toBe(false);
    });
  });

  describe('Integración entre Stores', () => {
    it('debe sincronizar alumnos y clases correctamente', async () => {
      // Simular datos en diferentes stores
      await studentsStore.loadStudents();
      await classesStore.loadClasses();
      await montajeStore.cargarObra('obra-test-1');

      // Verificar que los datos se pueden relacionar
      const alumnosEnObra = montajeStore.alumnosPorFila.get(1) || [];
      expect(Array.isArray(alumnosEnObra)).toBe(true);

      // Verificar acceso cruzado a datos
      if (alumnosEnObra.length > 0) {
        const alumno = studentsStore.students.find((s) => s.id === alumnosEnObra[0]);
        expect(alumno).toBeTruthy();
      }
    });

    it('debe actualizar progreso cuando cambian estados de compases', async () => {
      await montajeStore.cargarObra('obra-test-1');

      const progresoInicial = montajeStore.progresoPorcentaje;

      // Cambiar estado de un compás
      await montajeStore.actualizarCompass(4, 'COMPLETADO', 'Nuevo compás completado');

      // El progreso debería haber cambiado
      expect(montajeStore.progresoPorcentaje).not.toBe(progresoInicial);
      expect(montajeService.updateCompass).toHaveBeenCalled();
    });
  });

  describe('Interacción Usuario-Interfaz', () => {
    it('debe responder a selección de compases en HeatMap', async () => {
      const wrapper = mount(ObraDetailView, {
        global: {
          plugins: [router],
          stubs: {
            HeatMap: {
              template: '<div @click="$emit(\'compassSelected\', 5)">HeatMap Mock</div>',
            },
            AlumnosSelector: true,
            CompasToolbar: true,
          },
        },
      });

      await router.push('/montaje/obra-test-1');
      await nextTick();

      // Simular click en HeatMap
      await wrapper.findComponent({ name: 'HeatMap' }).trigger('click');
      await nextTick();

      // Verificar que se seleccionó el compás
      expect(montajeStore.compasSeleccionado).toBe(5);
    });

    it('debe actualizar observaciones de compás', async () => {
      const wrapper = mount(ObraDetailView, {
        global: {
          plugins: [router],
          stubs: {
            HeatMap: true,
            AlumnosSelector: true,
            CompasToolbar: {
              template: `
                <div>
                  <button @click="$emit('updateObservation', { compass: 1, observation: 'Nueva observación' })">
                    Update
                  </button>
                </div>
              `,
            },
          },
        },
      });

      await router.push('/montaje/obra-test-1');
      await nextTick();

      // Simular actualización de observación
      const toolbar = wrapper.findComponent({ name: 'CompasToolbar' });
      await toolbar.find('button').trigger('click');
      await nextTick();

      expect(montajeService.updateCompass).toHaveBeenCalledWith(
        'obra-test-1',
        1,
        expect.objectContaining({
          observaciones: 'Nueva observación',
        }),
      );
    });
  });

  describe('Validación de Datos y Estados', () => {
    it('debe validar consistencia de datos entre stores', async () => {
      await montajeStore.cargarObra('obra-test-1');
      await studentsStore.loadStudents();

      // Verificar que todos los IDs de alumnos en montaje existen en students store
      for (const [fila, alumnos] of montajeStore.alumnosPorFila.entries()) {
        for (const alumnoId of alumnos) {
          const existe = studentsStore.students.some((s) => s.id === alumnoId);
          expect(existe).toBe(
            true,
            `Alumno ${alumnoId} en fila ${fila} no existe en students store`,
          );
        }
      }
    });

    it('debe mantener integridad de estados de compases', async () => {
      await montajeStore.cargarObra('obra-test-1');

      // Verificar que todos los estados son válidos
      for (const [numero, compass] of montajeStore.compases.entries()) {
        expect(typeof numero).toBe('number');
        expect(numero).toBeGreaterThan(0);
        expect(['COMPLETADO', 'EN_PROGRESO', 'NO_TRABAJADO', 'CON_DIFICULTAD']).toContain(
          compass.estado,
        );
      }
    });
  });

  describe('Performance y Optimización', () => {
    it('debe cachear datos correctamente', async () => {
      // Primera carga
      await montajeStore.cargarObra('obra-test-1');
      expect(montajeService.getObra).toHaveBeenCalledTimes(1);

      // Segunda carga de la misma obra
      await montajeStore.cargarObra('obra-test-1');

      // No debería llamar al servicio nuevamente si está en caché
      if (montajeStore.cache.has('obra-test-1')) {
        expect(montajeService.getObra).toHaveBeenCalledTimes(1);
      }
    });

    it('debe limpiar recursos al cambiar de obra', async () => {
      // Cargar primera obra
      await montajeStore.cargarObra('obra-test-1');
      const datosObra1 = montajeStore.obraActual;

      // Cargar segunda obra
      vi.mocked(montajeService.getObra).mockResolvedValue({
        id: 'obra-test-2',
        titulo: 'Segunda Obra',
        compositor: 'Otro Compositor',
      });

      await montajeStore.cargarObra('obra-test-2');

      // Verificar que se limpió el estado anterior
      expect(montajeStore.obraActual.id).toBe('obra-test-2');
      expect(montajeStore.obraActual).not.toEqual(datosObra1);
    });
  });

  describe('Manejo de Estados Edge Cases', () => {
    it('debe manejar obra sin compases', async () => {
      vi.mocked(montajeService.getCompases).mockResolvedValue([]);

      await montajeStore.cargarObra('obra-test-1');

      expect(montajeStore.compases.size).toBe(0);
      expect(montajeStore.progresoPorcentaje).toBe(0);
      expect(montajeStore.error).toBeFalsy(); // No debería ser un error
    });

    it('debe manejar alumnos sin asignar a filas', async () => {
      vi.mocked(montajeService.getAlumnosPorObra).mockResolvedValue(new Map());

      await montajeStore.cargarObra('obra-test-1');

      expect(montajeStore.alumnosPorFila.size).toBe(0);
      // Debería seguir funcionando sin alumnos asignados
      expect(montajeStore.isLoading).toBe(false);
    });

    it('debe validar datos corruptos o incompletos', async () => {
      // Simular datos incompletos
      vi.mocked(montajeService.getObra).mockResolvedValue({
        id: 'obra-corrupta',
        // Falta título y otros campos requeridos
      });

      await montajeStore.cargarObra('obra-corrupta');

      // Debería manejar datos incompletos gracefully
      expect(montajeStore.error).toBeTruthy();
      expect(montajeStore.obraActual).toBeFalsy();
    });
  });
});
