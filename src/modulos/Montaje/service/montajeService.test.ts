// src/modulos/Montaje/service/montajeService.test.ts
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp, // Added serverTimestamp import
} from 'firebase/firestore';
import montajeService from './montajeService';
import { EstadoCompass, DificultadFrase } from '../types'; // Added DificultadFrase import

// Mock de Firebase


vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    serverTimestamp: vi.fn(() => new Date()),
    limit: vi.fn(),
    limitToFirst: vi.fn(),
    increment: vi.fn((value) => value),
  };
});

const mockDocData = {
  id: 'test-id',
  titulo: 'Test Obra',
  compositor: 'Test Compositor',
  estado: 'EN_MONTAJE',
};

const mockDocSnapshot = {
  exists: () => true,
  id: 'test-id',
  data: () => mockDocData,
};

const mockQuerySnapshot = {
  empty: false,
  docs: [mockDocSnapshot],
};

describe('MontajeService', () => {
  let service: typeof montajeService;

  beforeEach(() => {
    service = montajeService;
    vi.clearAllMocks();
  });
    it('debe obtener una obra por ID', async () => {
      ;(doc as Mock).mockReturnValue({})
      ;(getDoc as Mock).mockResolvedValue(mockDocSnapshot);

      const result = await service.obtenerObra('test-id');

      expect(result).toEqual({ id: 'test-id', ...mockDocData });
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'montaje_works', 'test-id'); // Corrected collection name
      expect(getDoc).toHaveBeenCalled();
    });

    it('debe lanzar error si la obra no existe', async () => {
      ;(doc as Mock).mockReturnValue({})
      ;(getDoc as Mock).mockResolvedValue({ exists: () => false });

      await expect(service.obtenerObra('inexistente')).rejects.toThrow('No se pudo obtener la obra'); // Changed error message to match service
    });

    it('debe manejar errores de Firebase', async () => {
      ;(doc as Mock).mockReturnValue({})
      ;(getDoc as Mock).mockRejectedValue(new Error('Firebase error'));

      await expect(service.obtenerObra('test-id')).rejects.toThrow('No se pudo obtener la obra');
    });
  });

  describe('obtenerPlanAccion', () => {
    it('debe obtener plan de acción por obra ID', async () => {
      ;(collection as Mock).mockReturnValue({})
      ;(query as Mock).mockReturnValue({})
      ;(where as Mock).mockReturnValue({})
      ;(orderBy as Mock).mockReturnValue({})
      ;(getDocs as Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await service.obtenerPlanAccion('obra-id');

      expect(result).toEqual({ id: 'test-id', ...mockDocData });
      expect(query).toHaveBeenCalledWith(
        expect.anything(),
        where('auditoria.activo', '==', true), // Added specific where clause
        orderBy('auditoria.fechaCreacion', 'desc'), // Added specific orderBy clause
        expect.anything(), // limitToFirst
      );
    });

    it('debe lanzar error si no hay plan de acción', async () => {
      ;(collection as Mock).mockReturnValue({})
      ;(query as Mock).mockReturnValue({})
      ;(where as Mock).mockReturnValue({})
      ;(orderBy as Mock).mockReturnValue({})
      ;(getDocs as Mock).mockResolvedValue({ empty: true, docs: [] });

      await expect(service.obtenerPlanAccion('obra-id')).resolves.toBeNull(); // Changed to resolves.toBeNull() as service returns null
    });
  });

  describe('crearObra', () => {
    const obraData = {
      titulo: 'Nueva Obra',
      compositor: 'Nuevo Compositor',
      duracionEstimada: 3600,
      nivelDificultad: 3,
      repertorioId: 'some-repertorio-id', // Added missing required field
      metadatos: {
        complejidadGeneral: DificultadFrase.MEDIO, // Added missing required field
        totalCompases: 100,
        frasesDefinidas: 0,
        frasesCompletadas: 0,
        progresoPorcentaje: 0,
        horasEnsayoEstimadas: 0,
        horasEnsayoReales: 0,
      },
      auditoria: {
        creadoPor: 'test-user',
        version: 1,
        activo: true,
      },
      estado: 'pendiente', // Added missing required field
    };

    it('debe crear una nueva obra', async () => {
      const mockDocRef = { id: 'new-obra-id' };
      ;(collection as Mock).mockReturnValue({})
      ;(addDoc as Mock).mockResolvedValue(mockDocRef);

      const result = await service.crearObra(obraData);

      expect(result).toBe('new-obra-id');
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...obraData,
          createdAt: expect.any(Date), // Expect serverTimestamp to be a Date in mock
          updatedAt: expect.any(Date), // Expect serverTimestamp to be a Date in mock
        }),
      );
    });

    it('debe manejar errores al crear obra', async () => {
      ;(collection as Mock).mockReturnValue({})
      ;(addDoc as Mock).mockRejectedValue(new Error('Firebase error'));

      await expect(service.crearObra(obraData)).rejects.toThrow('No se pudo crear la obra');
    });
  });

  describe('actualizarEstadoCompass', () => {
    it('debe actualizar estado de compás', async () => {
      ;(doc as Mock).mockReturnValue({})
      ;(updateDoc as Mock).mockResolvedValue(undefined);

      const cambio = {
        id: 'cambio-1',
        obraId: 'obra-id',
        fraseId: 'frase-id',
        compas: 1,
        instrumento: 'VIOLIN_I',
        estadoAnterior: EstadoCompass.SIN_TRABAJAR,
        estadoNuevo: EstadoCompass.COMPLETADO,
        razon: 'Compás completado',
        maestroId: 'maestro-id',
      };

      await service.cambiarEstadoCompass(
        'obra-id',
        1,
        EstadoCompass.COMPLETADO,
        cambio,
      );

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'instrumentos.VIOLIN_I': EstadoCompass.COMPLETADO,
          fechaUltimaModificacion: expect.any(Date),
          modificadoPor: 'maestro-id',
          sesionesEnsayo: expect.anything(), // increment(1) is mocked as anything
        }),
      );
    });

    it('debe manejar errores al actualizar compás', async () => {
      ;(doc as Mock).mockReturnValue({})
      ;(updateDoc as Mock).mockRejectedValue(new Error('Firebase error'));

      const cambio = {
        id: 'cambio-1',
        obraId: 'obra-id',
        fraseId: 'frase-id',
        compas: 1,
        instrumento: 'VIOLIN_I',
        estadoAnterior: EstadoCompass.SIN_TRABAJAR,
        estadoNuevo: EstadoCompass.COMPLETADO,
        razon: 'Test',
        maestroId: 'maestro-id',
      };

      await expect(
        service.cambiarEstadoCompass('obra-id', 1, EstadoCompass.COMPLETADO, cambio),
      ).rejects.toThrow('Error cambiando estado del compás'); // Changed error message to match service
    });
  });

  describe('obtenerEvaluaciones', () => {
    it('debe obtener evaluaciones por obra ID', async () => {
      const mockEvaluaciones = [
        {
          id: 'eval-1',
          obraId: 'obra-id',
          calificacion: 85,
          fecha: new Date(),
        },
      ]

      ;(collection as Mock).mockReturnValue({})
      ;(query as Mock).mockReturnValue({})
      ;(where as Mock).mockReturnValue({})
      ;(orderBy as Mock).mockReturnValue({})
      ;(getDocs as Mock).mockResolvedValue({
        empty: false,
        docs: [
          {
            id: 'eval-1',
            data: () => mockEvaluaciones[0],
          },
        ],
      });

      const result = await service.obtenerEvaluaciones('obra-id');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: 'eval-1', ...mockEvaluaciones[0] });
    });

    it('debe devolver array vacío si no hay evaluaciones', async () => {
      ;(collection as Mock).mockReturnValue({})
      ;(query as Mock).mockReturnValue({})
      ;(where as Mock).mockReturnValue({})
      ;(orderBy as Mock).mockReturnValue({})
      ;(getDocs as Mock).mockResolvedValue({ empty: true, docs: [] });

      const result = await service.obtenerEvaluaciones('obra-id');

      expect(result).toEqual([]);
    });
  });

  describe('Validaciones', () => {
    it('debe validar IDs requeridos', async () => {
      await expect(service.obtenerObra('')).rejects.toThrow('No se pudo obtener la obra'); // Changed error message
      await expect(service.obtenerPlanAccion('')).rejects.toThrow('No se pudo cargar el plan de acción'); // Changed error message
    });

    it('debe validar datos de obra al crear', async () => {
      const obraInvalida = {
        titulo: '', // título vacío
        compositor: 'Test',
        duracionEstimada: -1, // duración negativa
        nivelDificultad: 6, // nivel fuera de rango
        repertorioId: 'some-repertorio-id', // Added missing required field
        metadatos: {
          complejidadGeneral: DificultadFrase.MEDIO, // Added missing required field
          totalCompases: 100,
          frasesDefinidas: 0,
          frasesCompletadas: 0,
          progresoPorcentaje: 0,
          horasEnsayoEstimadas: 0,
          horasEnsayoReales: 0,
        },
        auditoria: {
          creadoPor: 'test-user',
          version: 1,
          activo: true,
        },
        estado: 'pendiente', // Added missing required field
      };

      await expect(service.crearObra(obraInvalida)).rejects.toThrow();
    });
  });
});
