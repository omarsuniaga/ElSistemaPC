// src/modulos/Montaje/store/montaje.test.ts
import {describe, it, expect, beforeEach, vi, type Mock} from "vitest"
import {setActivePinia, createPinia} from "pinia"
import {useMontajeStore} from "./montaje"
import {montajeService} from "../service/montajeService"
import {EstadoCompass} from "../types"

// Mock del servicio
vi.mock("../service/montajeService", () => ({
  montajeService: {
    obtenerObras: vi.fn(),
    obtenerObra: vi.fn(),
    crearObra: vi.fn(),
    actualizarObra: vi.fn(),
    eliminarObra: vi.fn(),
    obtenerPlanAccion: vi.fn(),
    crearPlanAccion: vi.fn(),
    actualizarPlanAccion: vi.fn(),
    obtenerFrases: vi.fn(),
    crearFrase: vi.fn(),
    actualizarFrase: vi.fn(),
    obtenerEvaluaciones: vi.fn(),
    crearEvaluacionContinua: vi.fn(),
    crearEvaluacionFinal: vi.fn(),
    obtenerNotificaciones: vi.fn(),
    marcarNotificacionLeida: vi.fn(),
    obtenerEstadosCompases: vi.fn(),
    cambiarEstadoCompass: vi.fn(),
    obtenerEstadisticasObra: vi.fn(),
    buscarObras: vi.fn(),
  },
}))

// Mock del store de auth
vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({
    user: {id: "test-user", role: "maestro"},
  }),
}))

const mockObraData = {
  id: "obra-test-1",
  titulo: "Sinfonía Test",
  compositor: "Compositor Test",
  duracionEstimada: 3600,
  nivelDificultad: 4,
  estado: "EN_MONTAJE" as const,
  repertorioId: "repertorio-test-1",
  descripcion: "Una obra para testing",
  metadatos: {
    totalCompases: 120,
    complejidadGeneral: "MEDIO" as const,
    progresoPorcentaje: 45,
    instrumentosRequeridos: ["VIOLIN", "PIANO"],
    observacionesGenerales: "Obra de prueba",
  },
  fechaCreacion: new Date(),
  auditoria: {
    creadoPor: "test-user",
    fechaCreacion: new Date(),
    modificadoPor: "test-user",
    fechaModificacion: new Date(),
    activo: true,
  },
}

const mockPlanData = {
  id: "plan-test-1",
  obraId: "obra-test-1",
  titulo: "Plan Test",
  descripcion: "Plan de acción de prueba",
  fechaInicio: new Date(),
  fechaFin: new Date(),
  estado: "ACTIVO" as const,
  objetivos: ["Objetivo 1", "Objetivo 2"],
  fases: [],
  auditoria: {
    creadoPor: "test-user",
    fechaCreacion: new Date(),
    modificadoPor: "test-user",
    fechaModificacion: new Date(),
    activo: true,
  },
}

describe("Montaje Store", () => {
  let store: ReturnType<typeof useMontajeStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useMontajeStore()
    vi.clearAllMocks()
  })
  describe("Estado inicial", () => {
    it("debe tener el estado inicial correcto", () => {
      expect(store.obras).toEqual([])
      expect(store.obraActual).toBeNull()
      expect(store.planAccion).toBeNull()
      expect(store.frases).toEqual([])
      expect(store.estadosCompases).toBeInstanceOf(Map)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe("Cargar obra", () => {
    it("debe cargar una obra correctamente", async () => {
      ;(montajeService.obtenerObra as Mock).mockResolvedValue(mockObraData)

      await store.cargarObra("obra-test-1")

      expect(store.isLoading).toBe(false)
      expect(store.obraActual).toEqual(mockObraData)
      expect(store.error).toBeNull()
      expect(montajeService.obtenerObra).toHaveBeenCalledWith("obra-test-1")
    })

    it("debe manejar errores al cargar obra", async () => {
      const errorMessage = "Obra no encontrada"
      ;(montajeService.obtenerObra as Mock).mockRejectedValue(new Error(errorMessage))

      await store.cargarObra("obra-inexistente")

      expect(store.isLoading).toBe(false)
      expect(store.obraActual).toBeNull()
      expect(store.error).toBe(errorMessage)
    })

    it("debe establecer loading durante la carga", async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      ;(montajeService.obtenerObra as Mock).mockReturnValue(promise)

      const loadPromise = store.cargarObra("obra-test-1")
      expect(store.isLoading).toBe(true)

      resolvePromise!(mockObraData)
      await loadPromise

      expect(store.isLoading).toBe(false)
    })
  })

  describe("Cargar plan de acción", () => {
    it("debe cargar un plan de acción correctamente", async () => {
      ;(montajeService.obtenerPlanAccion as Mock).mockResolvedValue(mockPlanData)

      await store.cargarPlanAccion("obra-test-1")

      expect(store.planAccion).toEqual(mockPlanData)
      expect(montajeService.obtenerPlanAccion).toHaveBeenCalledWith("obra-test-1")
    })

    it("debe manejar errores al cargar plan de acción", async () => {
      const errorMessage = "Plan no encontrado"
      ;(montajeService.obtenerPlanAccion as Mock).mockRejectedValue(new Error(errorMessage))

      await store.cargarPlanAccion("obra-inexistente")

      expect(store.planAccion).toBeNull()
      expect(store.error).toBe(errorMessage)
    })
  })

  describe("Actualizar estado de compás", () => {
    beforeEach(() => {
      store.obraActual = mockObraData
    })

    it("debe actualizar estado de compás correctamente", async () => {
      const compasData = {
        numero: 1,
        estado: EstadoCompass.COMPLETADO,
        observaciones: "Compás completado",
        fechaUltimaModificacion: new Date(),
      }

      ;(montajeService.actualizarEstadoCompass as Mock).mockResolvedValue(compasData)

      await store.actualizarEstadoCompass(
        "obra-test-1",
        1,
        EstadoCompass.COMPLETADO,
        "Compás completado"
      )

      expect(store.estadosCompases.get(1)).toEqual(
        expect.objectContaining({
          estado: EstadoCompass.COMPLETADO,
          observaciones: "Compás completado",
        })
      )
      expect(montajeService.actualizarEstadoCompass).toHaveBeenCalledWith(
        "obra-test-1",
        1,
        EstadoCompass.COMPLETADO,
        "Compás completado"
      )
    })

    it("debe manejar errores al actualizar compás", async () => {
      const errorMessage = "Error al actualizar compás"
      ;(montajeService.actualizarEstadoCompass as Mock).mockRejectedValue(new Error(errorMessage))

      await store.actualizarEstadoCompass("obra-test-1", 1, EstadoCompass.COMPLETADO, "Test")

      expect(store.error).toBe(errorMessage)
    })
  })

  describe("Getters computados", () => {
    beforeEach(() => {
      // Configurar datos de prueba
      store.frases = [
        {
          id: "frase-1",
          planAccionId: "plan-test-1",
          titulo: "Frase 1",
          metadatos: {progresoPorcentaje: 100, estadosCompases: {}},
        },
        {
          id: "frase-2",
          planAccionId: "plan-test-1",
          titulo: "Frase 2",
          metadatos: {progresoPorcentaje: 50, estadosCompases: {}},
        },
        {
          id: "frase-3",
          planAccionId: "otro-plan",
          titulo: "Frase 3",
          metadatos: {progresoPorcentaje: 75, estadosCompases: {}},
        },
      ]
      store.planAccion = mockPlanData
    })

    it("debe calcular frases actuales correctamente", () => {
      const frasesActuales = store.frasesActuales
      expect(frasesActuales).toHaveLength(2)
      expect(frasesActuales.every((f) => f.planAccionId === "plan-test-1")).toBe(true)
    })

    it("debe calcular frases completadas correctamente", () => {
      const frasesCompletadas = store.frasesCompletadas
      expect(frasesCompletadas).toHaveLength(1)
      expect(frasesCompletadas[0].metadatos.progresoPorcentaje).toBe(100)
    })

    it("debe calcular frases pendientes correctamente", () => {
      const frasesPendientes = store.frasesPendientes
      expect(frasesPendientes).toHaveLength(1)
      expect(frasesPendientes[0].metadatos.progresoPorcentaje).toBe(50)
    })
  })

  describe("Resetear store", () => {
    it("debe resetear el estado correctamente", () => {
      // Establecer algunos datos
      store.obraActual = mockObraData
      store.planAccion = mockPlanData
      store.frases = [{id: "test"} as any]
      store.error = "Test error"

      store.$reset()

      expect(store.obraActual).toBeNull()
      expect(store.planAccion).toBeNull()
      expect(store.frases).toEqual([])
      expect(store.error).toBeNull()
      expect(store.estadosCompases.size).toBe(0)
    })
  })
})
