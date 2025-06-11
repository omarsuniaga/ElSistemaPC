// src/modulos/Montaje/tests/montajeStore.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useMontajeStore } from '../store/montaje';
import type { Obra, PlanAccion, FraseMontaje } from '../types';
import { EstadoObra, EstadoCompass } from '../types';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() }))
  }
}));

// Mock Auth Store
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    user: { uid: 'test-user-id' }
  }))
}));

// Mock Montaje Service
vi.mock('../service/montajeService', () => ({
  montajeService: {
    obtenerObras: vi.fn(),
    crearObra: vi.fn(),
    actualizarObra: vi.fn(),
    eliminarObra: vi.fn(),
    obtenerPlanAccion: vi.fn(),
    crearPlanAccion: vi.fn(),
    actualizarPlanAccion: vi.fn(),
    obtenerFrases: vi.fn(),
    crearFrase: vi.fn(),
    obtenerEvaluacionesContinuas: vi.fn(),
    crearEvaluacionContinua: vi.fn()
  }
}));

describe('Montaje Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('Estado inicial', () => {
    it('debe tener el estado inicial correcto', () => {
      const store = useMontajeStore();
      
      expect(store.obras).toEqual([]);
      expect(store.obraActual).toBeNull();
      expect(store.planAccion).toBeNull();
      expect(store.frases).toEqual([]);
      expect(store.fraseActual).toBeNull();
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  describe('Getters', () => {
    it('debe filtrar obras activas por repertorio', () => {
      const store = useMontajeStore();
      
      // Agregar obras de prueba
      store.obras = [
        {
          id: '1',
          titulo: 'Obra 1',
          repertorioId: 'repertorio-1',
          estado: EstadoObra.EN_PROGRESO
        } as Obra,
        {
          id: '2',
          titulo: 'Obra 2',
          repertorioId: 'repertorio-2',
          estado: EstadoObra.EN_PROGRESO
        } as Obra,
        {
          id: '3',
          titulo: 'Obra 3',
          repertorioId: 'repertorio-1',
          estado: EstadoObra.COMPLETADA
        } as Obra
      ];

      const obrasRepertorio1 = store.obrasActivasPorRepertorio('repertorio-1');
      expect(obrasRepertorio1).toHaveLength(2);
      expect(obrasRepertorio1.map(o => o.id)).toEqual(['1', '3']);
    });

    it('debe calcular frases actuales correctamente', () => {
      const store = useMontajeStore();
      
      store.planAccion = { id: 'plan-1' } as PlanAccion;
      store.frases = [
        { id: '1', planAccionId: 'plan-1' } as FraseMontaje,
        { id: '2', planAccionId: 'plan-2' } as FraseMontaje,
        { id: '3', planAccionId: 'plan-1' } as FraseMontaje
      ];

      expect(store.frasesActuales).toHaveLength(2);
      expect(store.frasesActuales.map(f => f.id)).toEqual(['1', '3']);
    });

    it('debe calcular frases completadas correctamente', () => {
      const store = useMontajeStore();
      
      store.planAccion = { id: 'plan-1' } as PlanAccion;
      store.frases = [
        { 
          id: '1', 
          planAccionId: 'plan-1',
          metadatos: { progresoPorcentaje: 100 }
        } as FraseMontaje,
        { 
          id: '2', 
          planAccionId: 'plan-1',
          metadatos: { progresoPorcentaje: 50 }
        } as FraseMontaje,
        { 
          id: '3', 
          planAccionId: 'plan-1',
          metadatos: { progresoPorcentaje: 100 }
        } as FraseMontaje
      ];

      expect(store.frasesCompletadas).toHaveLength(2);
      expect(store.frasesCompletadas.map(f => f.id)).toEqual(['1', '3']);
    });
  });

  describe('Acciones', () => {
    it('debe manejar loading state durante operaciones async', async () => {
      const store = useMontajeStore();
      
      expect(store.isLoading).toBe(false);
      
      // Simular operación async
      const promiseObras = store.cargarObras();
      expect(store.isLoading).toBe(true);
      
      await promiseObras;
      expect(store.isLoading).toBe(false);
    });

    it('debe manejar errores correctamente', async () => {
      const store = useMontajeStore();
      
      // Mock error en el servicio
      const { montajeService } = await import('../service/montajeService');
      vi.mocked(montajeService.obtenerObras).mockRejectedValue(new Error('Test error'));
      
      expect(store.error).toBeNull();
      
      try {
        await store.cargarObras();
      } catch (error) {
        // Error esperado
      }
      
      expect(store.error).toBe('No se pudieron cargar las obras');
    });

    it('debe crear plan de acción con datos completos', async () => {
      const store = useMontajeStore();
      
      const planData = {
        obraId: 'obra-1',
        titulo: 'Plan de prueba',
        descripcion: 'Descripción de prueba',
        fechaInicio: Timestamp.now(),
        fechaFin: Timestamp.now(),
        fases: [],
        metadatos: {
          horasEstimadas: 10
        }
      };

      const planId = await store.crearPlanAccion(planData);
      
      expect(planId).toBeDefined();
      expect(planId).toMatch(/^plan-\d+$/);
    });

    it('debe cambiar estado de compás correctamente', async () => {
      const store = useMontajeStore();
      
      store.obraActual = { id: 'obra-1' } as Obra;
      
      await store.cambiarEstadoCompass(
        1, 
        EstadoCompass.EN_PROGRESO, 
        'frase-1', 
        'Trabajando en la técnica'
      );
      
      // Verificar que no haya errores
      expect(store.error).toBeNull();
    });
  });

  describe('Validaciones', () => {
    it('debe validar datos requeridos antes de crear obra', async () => {
      const store = useMontajeStore();
      
      const obraInvalida = {
        titulo: '', // Título vacío
        descripcion: 'Descripción válida',
        repertorioId: 'repertorio-1'
      };

      try {
        await store.crearObra(obraInvalida as any);
        expect.fail('Debería haber lanzado error por título vacío');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
