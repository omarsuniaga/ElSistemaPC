// src/modulos/Montaje/tests/montajeStore.test.ts

import { vi, beforeEach, describe, it, expect, Mock } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useMontajeStore } from '../store/montaje';
import montajeService from '../../service/montajeService';
import { teacherService } from '../../service/teacherService'; // Importar teacherService
import { permissionsService } from '../../service/permissionsService'; // Importar permissionsService
import { compassStateService } from '../../service/compassStateService'; // Importar compassStateService
import { EstadoCompass, DificultadFrase, TipoInstrumento } from '../types'; // Importar tipos necesarios

// Mock de los servicios
vi.mock('../../service/montajeService', () => ({
  montajeService: {
    obtenerObras: vi.fn(),
    obtenerObraEnMultiplesColecciones: vi.fn(),
    obtenerPlanAccion: vi.fn(),
    crearPlanAccion: vi.fn(),
    actualizarPlanAccion: vi.fn(),
    cambiarEstadoCompass: vi.fn(),
    actualizarObra: vi.fn(),
    obtenerEstadosCompases: vi.fn(),
  },
}));

vi.mock('../../service/teacherService', () => ({
  teacherService: {
    getUserInstruments: vi.fn(),
  },
}));

vi.mock('../../service/permissionsService', () => ({
  permissionsService: {
    hasPermission: vi.fn(),
  },
}));

vi.mock('../../service/compassStateService', () => ({
  compassStateService: {
    obtenerEstadosCompasesPorInstrumento: vi.fn(),
    obtenerEstadisticas: vi.fn(),
    actualizarEstadoCompass: vi.fn(),
    actualizarMasivamente: vi.fn(),
  },
}));

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() })),
  },
}));

// Mock Auth Store
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    user: { uid: 'test-user-id' },
  })),
}));

// Mock Montaje Service
vi.mock('../service/montajeService', () => {
  return {
    montajeService: {
      obtenerObras: vi.fn().mockResolvedValue([]),
      crearObra: vi.fn().mockResolvedValue('obra-123'),
      actualizarObra: vi.fn().mockResolvedValue(undefined),
      eliminarObra: vi.fn().mockResolvedValue(undefined),
      obtenerPlanAccion: vi.fn().mockResolvedValue(null),
      crearPlanAccion: vi.fn().mockResolvedValue('plan-123'),
      actualizarPlanAccion: vi.fn().mockResolvedValue(undefined),
      obtenerFrases: vi.fn().mockResolvedValue([]),
      crearFrase: vi.fn().mockResolvedValue('frase-123'),
      obtenerEvaluacionesContinuas: vi.fn().mockResolvedValue([]),
      crearEvaluacionContinua: vi.fn().mockResolvedValue('eval-123'),
      marcarNotificacionLeida: vi.fn().mockResolvedValue(undefined),
      obtenerObra: vi.fn().mockResolvedValue({}),
    },
  };
});

describe('Montaje Store', () => {
  let store: ReturnType<typeof useMontajeStore>;

  beforeEach(() => {
    // Crear y activar una nueva instancia de Pinia para cada test
    const pinia = createPinia();
    setActivePinia(pinia);
    // Crear una nueva instancia del store
    store = useMontajeStore();
    // Limpiar todos los mocks antes de cada test
    vi.clearAllMocks();
  });

  describe('Estado inicial', () => {
    it('debe tener el estado inicial correcto', () => {
      expect(store.obras).toEqual([]);
      expect(store.obraActual).toBeNull();
      expect(store.planAccion).toBeNull();
      expect(store.frases).toEqual([]);
      expect(store.estadosCompases).toBeInstanceOf(Map);
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.teacherInstruments).toEqual([]); // Nuevo
      expect(store.isLoadingInstruments).toBe(false); // Nuevo
      expect(store.selectedInstrument).toBeNull(); // Nuevo
      expect(store.instrumentCompassStates).toEqual([]); // Nuevo
      expect(store.instrumentStatistics).toBeNull(); // Nuevo
      expect(store.isLoadingInstrumentStates).toBe(false); // Nuevo
      expect(store.hasInstrumentStatePermission).toBe(false); // Nuevo
    });
  });

  describe('Getters', () => {
    // Importar EstadoObra para usarlo en los mocks
    const EstadoObra = {
      EN_PROGRESO: 'en_progreso',
      COMPLETADA: 'completada',
      PENDIENTE: 'pendiente',
    };

    beforeEach(() => {
      store.obras = [
        {
          id: 'obra-1',
          titulo: 'Obra 1',
          repertorioId: 'repertorio-1',
          estado: EstadoObra.EN_PROGRESO,
          instrumentacion: [{ instrumentoId: TipoInstrumento.VIOLIN_I, nombre: 'Violín I' }],
        } as Obra,
        {
          id: 'obra-2',
          titulo: 'Obra 2',
          repertorioId: 'repertorio-1',
          estado: EstadoObra.COMPLETADA,
          instrumentacion: [{ instrumentoId: TipoInstrumento.CELLO, nombre: 'Cello' }],
        } as Obra,
        {
          id: 'obra-3',
          titulo: 'Obra 3',
          repertorioId: 'repertorio-2',
          estado: EstadoObra.PENDIENTE,
          instrumentacion: [{ instrumentoId: TipoInstrumento.VIOLIN_I, nombre: 'Violín I' }],
        } as Obra,
      ];
      store.teacherInstruments = [TipoInstrumento.VIOLIN_I]; // Mock de instrumentos del maestro
    });

    it('debe filtrar obras activas por repertorio', () => {
      const obrasActivas = store.obrasActivasPorRepertorio('repertorio-1');
      expect(obrasActivas).toHaveLength(2);
      expect(obrasActivas.every((o) => o.repertorioId === 'repertorio-1')).toBe(true);
    });

    it('debe filtrar obras por instrumentos del maestro', () => {
      const obrasFiltradas = store.obrasFiltradasPorMaestro;
      expect(obrasFiltradas).toHaveLength(2); // Obra 1 y Obra 3 tienen Violín I
      expect(obrasFiltradas.some((o) => o.id === 'obra-1')).toBe(true);
      expect(obrasFiltradas.some((o) => o.id === 'obra-3')).toBe(true);
      expect(obrasFiltradas.some((o) => o.id === 'obra-2')).toBe(false);
    });

    it('debe calcular frases actuales correctamente', () => {
      store.frases = [
        {
          id: 'frase-1',
          planAccionId: 'plan-test-1',
          metadatos: { progresoPorcentaje: 100, estadosCompases: {} },
        } as FraseMontaje,
        {
          id: 'frase-2',
          planAccionId: 'plan-test-1',
          metadatos: { progresoPorcentaje: 50, estadosCompases: {} },
        } as FraseMontaje,
        {
          id: 'frase-3',
          planAccionId: 'otro-plan',
          metadatos: { progresoPorcentaje: 75, estadosCompases: {} },
        } as FraseMontaje,
      ];
      store.planAccion = { id: 'plan-test-1' } as PlanAccion;

      const frasesActuales = store.frasesActuales;
      expect(frasesActuales).toHaveLength(2);
      expect(frasesActuales.every((f) => f.planAccionId === 'plan-test-1')).toBe(true);
    });

    it('debe calcular frases completadas correctamente', () => {
      store.frases = [
        {
          id: 'frase-1',
          planAccionId: 'plan-test-1',
          metadatos: { progresoPorcentaje: 100, estadosCompases: {} },
        } as FraseMontaje,
        {
          id: 'frase-2',
          planAccionId: 'plan-test-1',
          metadatos: { progresoPorcentaje: 50, estadosCompases: {} },
        } as FraseMontaje,
      ];
      store.planAccion = { id: 'plan-test-1' } as PlanAccion;

      const frasesCompletadas = store.frasesCompletadas;
      expect(frasesCompletadas).toHaveLength(1);
      expect(frasesCompletadas[0].metadatos.progresoPorcentaje).toBe(100);
    });
  });

  describe('Acciones', () => {
    it('debe manejar loading state durante operaciones async', async () => {
      expect(store.isLoading).toBe(false);

      // Simular operación async con parámetro requerido
      const promiseObras = store.cargarObras('repertorio-test');
      expect(store.isLoading).toBe(true);

      await promiseObras;
      expect(store.isLoading).toBe(false);
    });

    it('debe manejar errores correctamente', async () => {
      // Mock error en el servicio
      ;(montajeService.obtenerObras as Mock).mockRejectedValueOnce(new Error('Test error'));

      expect(store.error).toBeNull();

      try {
        await store.cargarObras('repertorio-test');
      } catch (error) {
        // Error esperado
      }

      expect(store.error).toBe('No se pudieron cargar las obras');
    });

    it('debe crear plan de acción con datos completos', async () => {
      // Configurar estado inicial simulado
      store.obraActual = {
        id: 'obra-test',
        titulo: 'Obra Test',
      } as Obra;

      const datosNuevoPlan = {
        obraId: 'obra-test',
        nombre: 'Plan de Acción Test',
        descripcion: 'Descripción de prueba',
        fechaInicio: Timestamp.now(),
        fechaFinalizacion: Timestamp.now(),
        estado: 'activo',
        fases: [],
        objetivos: [
          { id: 'obj-1', descripcion: 'Objetivo 1', completado: false },
          { id: 'obj-2', descripcion: 'Objetivo 2', completado: false },
        ],
        responsableId: 'test-user-id',
        metadatos: {
          progresoPorcentaje: 0,
          fasesCompletadas: 0,
          totalFases: 3,
          horasEstimadas: 14,
          horasReales: 0,
          prioridad: 'alta',
        },
      };

      // Usando unknown como intermediario para evitar error de tipos
      const planId = await montajeService.crearPlanAccion(datosCompletos);
        datosNuevoPlan as unknown as Omit<PlanAccion, 'id' | 'auditoria'>,
      );

      // Verificar que el servicio fue llamado con los datos correctos
      expect(montajeService.crearPlanAccion).toHaveBeenCalledWith(datosNuevoPlan);
      expect(planId).toBe('plan-123'); // Verificar que se retorna el ID esperado
    });

    it('debe cambiar estado de compás correctamente', async () => {
      store.obraActual = { id: 'obra-1' } as Obra;

      await store.cambiarEstadoCompass(
        1,
        EstadoCompass.EN_PROGRESO,
        'frase-1',
        'Trabajando en la técnica',
      );

      // Verificar que no haya errores
      expect(store.error).toBeNull();
    });
  });

  describe('Validaciones', () => {
    it('debe validar datos requeridos antes de crear obra', async () => {
      // Mock del servicio para simular validación
      ;(montajeService.crearObra as Mock).mockRejectedValueOnce(new Error('Título requerido'));

      const obraInvalida = {
        titulo: '', // Título vacío
        descripcion: 'Descripción válida',
        repertorioId: 'repertorio-1',
      };

      try {
        await store.crearObra(obraInvalida as any);
        expect.fail('Debería haber lanzado error por título vacío');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('debe limpiar el estado correctamente', () => {
      // Rellenamos el estado con algunos datos
      store.obras = [{ id: 'obra-1' } as Obra];
      store.obraActual = { id: 'obra-1' } as Obra;
      store.error = 'Error previo';

      // Ejecutamos la acción
      store.limpiarEstado();

      // Verificamos que el estado se haya limpiado
      expect(store.obras).toEqual([]);
      expect(store.obraActual).toBeNull();
      expect(store.error).toBeNull();
      expect(store.isLoading).toBe(false);
    });
  });
});
