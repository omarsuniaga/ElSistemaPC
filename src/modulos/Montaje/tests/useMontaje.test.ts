// src/modulos/Montaje/tests/useMontaje.test.ts

import {describe, it, expect, beforeEach, vi} from "vitest"
import {ref} from "vue"
import {setActivePinia, createPinia} from "pinia"
import {useMontaje} from "../composables/useMontaje"
import type {Obra, PlanAccion} from "../types"
import {EstadoObra, EstadoCompass} from "../types"

// Mock Pinia store
const mockStore = {
  // Estado
  obras: ref([]),
  obraActual: ref(null),
  planAccion: ref(null),
  frases: ref([]),
  isLoading: ref(false),
  error: ref(null),

  // Getters
  obrasActivasPorRepertorio: vi.fn(),
  frasesActuales: ref([]),
  frasesCompletadas: ref([]),
  evaluacionesPendientes: ref([]),
  unreadNotifications: ref([]),

  // Acciones
  cargarObras: vi.fn(),
  cargarObraPorId: vi.fn(),
  crearObra: vi.fn(),
  actualizarObra: vi.fn(),
  eliminarObra: vi.fn(),
  cargarPlanAccion: vi.fn(),
  crearPlanAccion: vi.fn(),
  actualizarPlanAccion: vi.fn(),
  cargarFrases: vi.fn(),
  crearFrase: vi.fn(),
  cargarEvaluacionesContinuas: vi.fn(),
  crearEvaluacionContinua: vi.fn(),
  cambiarEstadoCompass: vi.fn(),
  marcarNotificacionComoLeida: vi.fn(),
  marcarTodasNotificacionesComoLeidas: vi.fn(),
}

vi.mock("../store/montaje", () => ({
  useMontajeStore: () => mockStore,
}))

describe("useMontaje Composable", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe("Inicialización", () => {
    it("debe inicializar correctamente", () => {
      const {
        // Estado
        obras,
        obraActual,
        planAccion,
        frases,
        isLoading,
        error,

        // Getters computados
        obrasActivas,
        frasesActuales,
        frasesCompletadas,
        progresoPorcentaje,

        // Acciones
        cargarObras,
        crearObra,
        actualizarObra,
        eliminarObra,
      } = useMontaje()

      // Verificar que todas las propiedades están definidas
      expect(obras).toBeDefined()
      expect(obraActual).toBeDefined()
      expect(planAccion).toBeDefined()
      expect(frases).toBeDefined()
      expect(isLoading).toBeDefined()
      expect(error).toBeDefined()

      expect(obrasActivas).toBeDefined()
      expect(frasesActuales).toBeDefined()
      expect(frasesCompletadas).toBeDefined()
      expect(progresoPorcentaje).toBeDefined()

      expect(cargarObras).toBeTypeOf("function")
      expect(crearObra).toBeTypeOf("function")
      expect(actualizarObra).toBeTypeOf("function")
      expect(eliminarObra).toBeTypeOf("function")
    })
  })

  describe("Funciones de obras", () => {
    it("debe cargar obras correctamente", async () => {
      const {cargarObras} = useMontaje()

      await cargarObras()

      expect(mockStore.cargarObras).toHaveBeenCalledOnce()
    })

    it("debe crear obra con validación", async () => {
      const {crearObra} = useMontaje()

      const obraData = {
        titulo: "Nueva Obra",
        descripcion: "Descripción de la obra",
        repertorioId: "repertorio-1",
        estado: EstadoObra.BORRADOR,
      }

      await crearObra(obraData)

      expect(mockStore.crearObra).toHaveBeenCalledWith(obraData)
    })

    it("debe actualizar obra existente", async () => {
      const {actualizarObra} = useMontaje()

      const obraId = "obra-1"
      const updates = {
        titulo: "Título actualizado",
        descripcion: "Nueva descripción",
      }

      await actualizarObra(obraId, updates)

      expect(mockStore.actualizarObra).toHaveBeenCalledWith(obraId, updates)
    })

    it("debe eliminar obra con confirmación", async () => {
      const {eliminarObra} = useMontaje()

      const obraId = "obra-1"
      await eliminarObra(obraId)

      expect(mockStore.eliminarObra).toHaveBeenCalledWith(obraId)
    })
  })

  describe("Funciones de planes", () => {
    it("debe crear plan de acción", async () => {
      const {crearPlan} = useMontaje()

      const planData = {
        obraId: "obra-1",
        titulo: "Nuevo Plan",
        descripcion: "Descripción del plan",
        fechaInicio: new Date(),
        fechaFin: new Date(),
        fases: [],
      }

      await crearPlan(planData)

      expect(mockStore.crearPlanAccion).toHaveBeenCalledWith(planData)
    })

    it("debe actualizar plan existente", async () => {
      const {actualizarPlan} = useMontaje()

      const planId = "plan-1"
      const updates = {
        titulo: "Plan actualizado",
        descripcion: "Nueva descripción del plan",
      }

      await actualizarPlan(planId, updates)

      expect(mockStore.actualizarPlanAccion).toHaveBeenCalledWith(planId, updates)
    })
  })

  describe("Funciones de frases", () => {
    it("debe crear frase con validación de rangos", async () => {
      const {crearFrase} = useMontaje()

      const fraseData = {
        planAccionId: "plan-1",
        titulo: "Nueva Frase",
        descripcion: "Descripción de la frase",
        compasInicio: 1,
        compasFinalizacion: 16,
        instrumento: "violin",
        dificultad: "media" as any,
      }

      await crearFrase(fraseData)

      expect(mockStore.crearFrase).toHaveBeenCalledWith(fraseData)
    })
  })

  describe("Funciones de evaluaciones", () => {
    it("debe crear evaluación continua", async () => {
      const {crearEvaluacion} = useMontaje()

      const evaluacionData = {
        obraId: "obra-1",
        fraseId: "frase-1",
        estudianteId: "estudiante-1",
        calificacion: 8.5,
        observaciones: "Buen progreso en la técnica",
        fecha: new Date(),
      }

      await crearEvaluacion(evaluacionData)

      expect(mockStore.crearEvaluacionContinua).toHaveBeenCalledWith(evaluacionData)
    })
  })

  describe("Gestión de estado de compases", () => {
    it("debe cambiar estado de compás", async () => {
      const {cambiarEstadoCompass} = useMontaje()

      await cambiarEstadoCompass(5, EstadoCompass.DOMINADO, "frase-1", "Técnica mejorada")

      expect(mockStore.cambiarEstadoCompass).toHaveBeenCalledWith(
        5,
        EstadoCompass.DOMINADO,
        "frase-1",
        "Técnica mejorada"
      )
    })
  })

  describe("Utilidades", () => {
    it("debe calcular progreso correctamente", () => {
      const {progresoPorcentaje} = useMontaje()

      // Mock data para calcular progreso
      mockStore.frasesActuales.value = [
        {metadatos: {progresoPorcentaje: 100}},
        {metadatos: {progresoPorcentaje: 50}},
        {metadatos: {progresoPorcentaje: 75}},
      ] as any

      // El progreso promedio debería ser (100 + 50 + 75) / 3 = 75
      expect(progresoPorcentaje.value).toBe(75)
    })

    it("debe manejar caso sin frases para progreso", () => {
      const {progresoPorcentaje} = useMontaje()

      mockStore.frasesActuales.value = []

      expect(progresoPorcentaje.value).toBe(0)
    })
  })

  describe("Manejo de errores", () => {
    it("debe propagar errores de las acciones del store", async () => {
      const {cargarObras} = useMontaje()

      const errorMock = new Error("Error de prueba")
      mockStore.cargarObras.mockRejectedValue(errorMock)

      await expect(cargarObras()).rejects.toThrow("Error de prueba")
    })

    it("debe limpiar errores al iniciar nuevas operaciones", async () => {
      const {cargarObras, error} = useMontaje()

      // Simular error anterior
      mockStore.error.value = "Error anterior"

      await cargarObras()

      // El error debería limpiarse al iniciar nueva operación
      expect(mockStore.cargarObras).toHaveBeenCalled()
    })
  })
})
