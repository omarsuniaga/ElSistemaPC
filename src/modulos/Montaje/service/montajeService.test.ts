// src/modulos/Montaje/service/montajeService.test.ts
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy } from 'firebase/firestore'
import { MontajeService } from './montajeService'
import { EstadoCompass } from '../types'

// Mock de Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => new Date())
}))

vi.mock('@/firebase/config', () => ({
  db: {}
}))

const mockDocData = {
  id: 'test-id',
  titulo: 'Test Obra',
  compositor: 'Test Compositor',
  estado: 'EN_MONTAJE'
}

const mockDocSnapshot = {
  exists: () => true,
  id: 'test-id',
  data: () => mockDocData
}

const mockQuerySnapshot = {
  empty: false,
  docs: [mockDocSnapshot]
}

describe('MontajeService', () => {
  let service: MontajeService

  beforeEach(() => {
    service = new MontajeService()
    vi.clearAllMocks()
  })

  describe('obtenerObra', () => {
    it('debe obtener una obra por ID', async () => {
      (doc as Mock).mockReturnValue({})
      ;(getDoc as Mock).mockResolvedValue(mockDocSnapshot)

      const result = await service.obtenerObra('test-id')

      expect(result).toEqual({ id: 'test-id', ...mockDocData })
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'obras', 'test-id')
      expect(getDoc).toHaveBeenCalled()
    })

    it('debe lanzar error si la obra no existe', async () => {
      (doc as Mock).mockReturnValue({})
      ;(getDoc as Mock).mockResolvedValue({ exists: () => false })

      await expect(service.obtenerObra('inexistente')).rejects.toThrow('Obra no encontrada')
    })

    it('debe manejar errores de Firebase', async () => {
      (doc as Mock).mockReturnValue({})
      ;(getDoc as Mock).mockRejectedValue(new Error('Firebase error'))

      await expect(service.obtenerObra('test-id')).rejects.toThrow('No se pudo obtener la obra')
    })
  })

  describe('obtenerPlanAccion', () => {
    it('debe obtener plan de acción por obra ID', async () => {
      (collection as Mock).mockReturnValue({})
      ;(query as Mock).mockReturnValue({})
      ;(where as Mock).mockReturnValue({})
      ;(orderBy as Mock).mockReturnValue({})
      ;(getDocs as Mock).mockResolvedValue(mockQuerySnapshot)

      const result = await service.obtenerPlanAccion('obra-id')

      expect(result).toEqual({ id: 'test-id', ...mockDocData })
      expect(query).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(), // where clause
        expect.anything(), // where clause
        expect.anything()  // orderBy clause
      )
    })

    it('debe lanzar error si no hay plan de acción', async () => {
      (collection as Mock).mockReturnValue({})
      ;(query as Mock).mockReturnValue({})
      ;(where as Mock).mockReturnValue({})
      ;(orderBy as Mock).mockReturnValue({})
      ;(getDocs as Mock).mockResolvedValue({ empty: true, docs: [] })

      await expect(service.obtenerPlanAccion('obra-id')).rejects.toThrow('No se encontró plan de acción')
    })
  })

  describe('crearObra', () => {
    const obraData = {
      titulo: 'Nueva Obra',
      compositor: 'Nuevo Compositor',
      duracionEstimada: 3600,
      nivelDificultad: 3
    }

    it('debe crear una nueva obra', async () => {
      const mockDocRef = { id: 'new-obra-id' }
      ;(collection as Mock).mockReturnValue({})
      ;(addDoc as Mock).mockResolvedValue(mockDocRef)

      const result = await service.crearObra(obraData)

      expect(result).toBe('new-obra-id')
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...obraData,
          estado: 'BORRADOR',
          metadatos: expect.objectContaining({
            progresoPorcentaje: 0
          }),
          auditoria: expect.objectContaining({
            activo: true
          })
        })
      )
    })

    it('debe manejar errores al crear obra', async () => {
      (collection as Mock).mockReturnValue({})
      ;(addDoc as Mock).mockRejectedValue(new Error('Firebase error'))

      await expect(service.crearObra(obraData)).rejects.toThrow('No se pudo crear la obra')
    })
  })

  describe('actualizarEstadoCompass', () => {
    it('debe actualizar estado de compás', async () => {
      (doc as Mock).mockReturnValue({})
      ;(updateDoc as Mock).mockResolvedValue(undefined)

      const result = await service.actualizarEstadoCompass(
        'obra-id',
        1,
        EstadoCompass.COMPLETADO,
        'Compás completado'
      )

      expect(result).toEqual(expect.objectContaining({
        numero: 1,
        estado: EstadoCompass.COMPLETADO,
        observaciones: 'Compás completado'
      }))
      expect(updateDoc).toHaveBeenCalled()
    })

    it('debe manejar errores al actualizar compás', async () => {
      (doc as Mock).mockReturnValue({})
      ;(updateDoc as Mock).mockRejectedValue(new Error('Firebase error'))

      await expect(
        service.actualizarEstadoCompass('obra-id', 1, EstadoCompass.COMPLETADO, 'Test')
      ).rejects.toThrow('No se pudo actualizar el estado del compás')
    })
  })

  describe('obtenerEvaluaciones', () => {
    it('debe obtener evaluaciones por obra ID', async () => {
      const mockEvaluaciones = [
        {
          id: 'eval-1',
          obraId: 'obra-id',
          calificacion: 85,
          fecha: new Date()
        }
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
            data: () => mockEvaluaciones[0]
          }
        ]
      })

      const result = await service.obtenerEvaluaciones('obra-id')

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({ id: 'eval-1', ...mockEvaluaciones[0] })
    })

    it('debe devolver array vacío si no hay evaluaciones', async () => {
      (collection as Mock).mockReturnValue({})
      ;(query as Mock).mockReturnValue({})
      ;(where as Mock).mockReturnValue({})
      ;(orderBy as Mock).mockReturnValue({})
      ;(getDocs as Mock).mockResolvedValue({ empty: true, docs: [] })

      const result = await service.obtenerEvaluaciones('obra-id')

      expect(result).toEqual([])
    })
  })

  describe('Validaciones', () => {
    it('debe validar IDs requeridos', async () => {
      await expect(service.obtenerObra('')).rejects.toThrow('ID de obra es requerido')
      await expect(service.obtenerPlanAccion('')).rejects.toThrow('ID de obra es requerido')
    })

    it('debe validar datos de obra al crear', async () => {
      const obraInvalida = {
        titulo: '', // título vacío
        compositor: 'Test',
        duracionEstimada: -1, // duración negativa
        nivelDificultad: 6 // nivel fuera de rango
      }

      await expect(service.crearObra(obraInvalida)).rejects.toThrow()
    })
  })
})
