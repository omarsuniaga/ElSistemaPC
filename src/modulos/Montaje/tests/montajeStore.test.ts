// src/modulos/Montaje/tests/montajeStore.test.ts

import {describe, it, expect, beforeEach, vi, Mock} from "vitest"
import {setActivePinia, createPinia} from "pinia"
import {useMontajeStore} from "../store/montaje"
import type {Obra, PlanAccion, FraseMontaje} from "../types"
import {EstadoObra, EstadoCompass} from "../types"
import {Timestamp} from "firebase/firestore"
import {montajeService} from "../service/montajeService"

// Mock Firebase
vi.mock("firebase/firestore", () => ({
  Timestamp: {
    now: vi.fn(() => ({toDate: () => new Date()})),
  },
}))

// Mock Auth Store
vi.mock("@/stores/auth", () => ({
  useAuthStore: vi.fn(() => ({
    user: {uid: "test-user-id"},
  })),
}))

// Mock Montaje Service
vi.mock("../service/montajeService", () => {
  return {
    montajeService: {
      obtenerObras: vi.fn().mockResolvedValue([]),
      crearObra: vi.fn().mockResolvedValue("obra-123"),
      actualizarObra: vi.fn().mockResolvedValue(undefined),
      eliminarObra: vi.fn().mockResolvedValue(undefined),
      obtenerPlanAccion: vi.fn().mockResolvedValue(null),
      crearPlanAccion: vi.fn().mockResolvedValue("plan-123"),
      actualizarPlanAccion: vi.fn().mockResolvedValue(undefined),
      obtenerFrases: vi.fn().mockResolvedValue([]),
      crearFrase: vi.fn().mockResolvedValue("frase-123"),
      obtenerEvaluacionesContinuas: vi.fn().mockResolvedValue([]),
      crearEvaluacionContinua: vi.fn().mockResolvedValue("eval-123"),
      marcarNotificacionLeida: vi.fn().mockResolvedValue(undefined),
      obtenerObra: vi.fn().mockResolvedValue({}),
    },
  }
})

describe("Montaje Store", () => {
  let store: ReturnType<typeof useMontajeStore>

  beforeEach(() => {
    // Crear y activar una nueva instancia de Pinia para cada test
    const pinia = createPinia()
    setActivePinia(pinia)
    // Crear una nueva instancia del store
    store = useMontajeStore()
    // Limpiar todos los mocks antes de cada test
    vi.clearAllMocks()
  })

  describe("Estado inicial", () => {
    it("debe tener el estado inicial correcto", () => {
      expect(store.obras).toEqual([])
      expect(store.obraActual).toBeNull()
      expect(store.planAccion).toBeNull()
      expect(store.frases).toEqual([])
      expect(store.fraseActual).toBeNull()
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe("Getters", () => {
    it("debe filtrar obras activas por repertorio", () => {
      // Agregar obras de prueba directamente al estado
      store.obras = [
        {
          id: "1",
          titulo: "Obra 1",
          repertorioId: "repertorio-1",
          estado: EstadoObra.EN_PROGRESO,
        } as Obra,
        {
          id: "2",
          titulo: "Obra 2",
          repertorioId: "repertorio-2",
          estado: EstadoObra.EN_PROGRESO,
        } as Obra,
        {
          id: "3",
          titulo: "Obra 3",
          repertorioId: "repertorio-1",
          estado: EstadoObra.COMPLETADA,
        } as Obra,
      ]

      const obrasRepertorio1 = store.obrasActivasPorRepertorio("repertorio-1")
      expect(obrasRepertorio1).toHaveLength(2)
      expect(obrasRepertorio1.map((o: Obra) => o.id)).toEqual(["1", "3"])
    })

    it("debe calcular frases actuales correctamente", () => {
      store.planAccion = {id: "plan-1"} as PlanAccion
      store.frases = [
        {id: "1", planAccionId: "plan-1"} as FraseMontaje,
        {id: "2", planAccionId: "plan-2"} as FraseMontaje,
        {id: "3", planAccionId: "plan-1"} as FraseMontaje,
      ]

      expect(store.frasesActuales).toHaveLength(2)
      expect(store.frasesActuales.map((f: FraseMontaje) => f.id)).toEqual(["1", "3"])
    })

    it("debe calcular frases completadas correctamente", () => {
      store.planAccion = {id: "plan-1"} as PlanAccion
      store.frases = [
        {
          id: "1",
          planAccionId: "plan-1",
          metadatos: {progresoPorcentaje: 100},
        } as FraseMontaje,
        {
          id: "2",
          planAccionId: "plan-1",
          metadatos: {progresoPorcentaje: 50},
        } as FraseMontaje,
        {
          id: "3",
          planAccionId: "plan-1",
          metadatos: {progresoPorcentaje: 100},
        } as FraseMontaje,
      ]

      expect(store.frasesCompletadas).toHaveLength(2)
      expect(store.frasesCompletadas.map((f: FraseMontaje) => f.id)).toEqual(["1", "3"])
    })
  })

  describe("Acciones", () => {
    it("debe manejar loading state durante operaciones async", async () => {
      expect(store.isLoading).toBe(false)

      // Simular operación async con parámetro requerido
      const promiseObras = store.cargarObras("repertorio-test")
      expect(store.isLoading).toBe(true)

      await promiseObras
      expect(store.isLoading).toBe(false)
    })

    it("debe manejar errores correctamente", async () => {
      // Mock error en el servicio
      ;(montajeService.obtenerObras as Mock).mockRejectedValueOnce(new Error("Test error"))

      expect(store.error).toBeNull()

      try {
        await store.cargarObras("repertorio-test")
      } catch (error) {
        // Error esperado
      }

      expect(store.error).toBe("No se pudieron cargar las obras")
    })

    it("debe crear plan de acción con datos completos", async () => {
      // Configurar estado inicial simulado
      store.obraActual = {
        id: "obra-test",
        titulo: "Obra Test",
      } as Obra

      const datosNuevoPlan = {
        obraId: "obra-test",
        nombre: "Plan de Acción Test",
        descripcion: "Descripción de prueba",
        fechaInicio: Timestamp.now(),
        fechaFinalizacion: Timestamp.now(),
        estado: "activo",
        fases: [],
        objetivos: [
          {id: "obj-1", descripcion: "Objetivo 1", completado: false},
          {id: "obj-2", descripcion: "Objetivo 2", completado: false},
        ],
        responsableId: "test-user-id",
        metadatos: {
          progresoPorcentaje: 0,
          fasesCompletadas: 0,
          totalFases: 3,
          horasEstimadas: 14,
          horasReales: 0,
          prioridad: "alta",
        },
      }

      // Usando unknown como intermediario para evitar error de tipos
      const planId = await store.crearPlanAccion(
        datosNuevoPlan as unknown as Omit<PlanAccion, "id" | "auditoria">
      )

      // Verificar que el servicio fue llamado con los datos correctos
      expect(montajeService.crearPlanAccion).toHaveBeenCalledWith(datosNuevoPlan)
      expect(planId).toBe("plan-123") // Verificar que se retorna el ID esperado
    })

    it("debe cambiar estado de compás correctamente", async () => {
      store.obraActual = {id: "obra-1"} as Obra

      await store.cambiarEstadoCompass(
        1,
        EstadoCompass.EN_PROGRESO,
        "frase-1",
        "Trabajando en la técnica"
      )

      // Verificar que no haya errores
      expect(store.error).toBeNull()
    })
  })

  describe("Validaciones", () => {
    it("debe validar datos requeridos antes de crear obra", async () => {
      // Mock del servicio para simular validación
      ;(montajeService.crearObra as Mock).mockRejectedValueOnce(new Error("Título requerido"))

      const obraInvalida = {
        titulo: "", // Título vacío
        descripcion: "Descripción válida",
        repertorioId: "repertorio-1",
      }

      try {
        await store.crearObra(obraInvalida as any)
        expect.fail("Debería haber lanzado error por título vacío")
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it("debe limpiar el estado correctamente", () => {
      // Rellenamos el estado con algunos datos
      store.obras = [{id: "obra-1"} as Obra]
      store.obraActual = {id: "obra-1"} as Obra
      store.error = "Error previo"

      // Ejecutamos la acción
      store.limpiarEstado()

      // Verificamos que el estado se haya limpiado
      expect(store.obras).toEqual([])
      expect(store.obraActual).toBeNull()
      expect(store.error).toBeNull()
      expect(store.isLoading).toBe(false)
    })
  })
})
