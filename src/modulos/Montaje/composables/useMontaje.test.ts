// src/modulos/Montaje/composables/useMontaje.test.ts
import {describe, it, expect, beforeEach, vi, type Mock} from "vitest"
import {useMontaje} from "./useMontaje"
import {useMontajeStore} from "../store/montaje"
import {EstadoCompass} from "../types"

// Mock del store
vi.mock("../store/montaje", () => ({
  useMontajeStore: vi.fn(),
}))

// Mock de las utilidades
vi.mock("../utils", () => ({
  formatDate: vi.fn((date) => date?.toISOString().split("T")[0] || ""),
  formatDuration: vi.fn((seconds) => `${Math.floor(seconds / 60)}min`),
}))

const mockStore = {
  cargarObra: vi.fn(),
  cargarPlanAccion: vi.fn(),
  cargarFrases: vi.fn(),
  cargarEvaluacionesContinuas: vi.fn(),
  cargarEstadosCompases: vi.fn(),
  actualizarEstadoCompass: vi.fn(),
  crearObra: vi.fn(),
  actualizarObra: vi.fn(),
  isLoading: false,
  error: null,
  obraActual: null,
  obras: [],
  planAccion: null,
  frases: [],
  evaluacionesContinuas: [],
  estadosCompases: new Map(),
}

describe("useMontaje Composable", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useMontajeStore as Mock).mockReturnValue(mockStore)
  })

  describe("Inicialización", () => {
    it("debe retornar todas las funciones y propiedades necesarias", () => {
      const composable = useMontaje()

      expect(composable).toHaveProperty("cargarObra")
      expect(composable).toHaveProperty("guardarCompas")
      expect(composable).toHaveProperty("cargarCompases")
      expect(composable).toHaveProperty("generarReporteObra")
      expect(composable).toHaveProperty("crearObra")
      expect(composable).toHaveProperty("actualizarObra")
      expect(composable).toHaveProperty("isLoading")
      expect(composable).toHaveProperty("error")
    })

    it("debe exponer propiedades reactivas del store", () => {
      const {isLoading, error} = useMontaje()

      expect(isLoading.value).toBe(false)
      expect(error.value).toBeNull()
    })
  })

  describe("cargarObra", () => {
    it("debe llamar al método del store con el ID correcto", async () => {
      const {cargarObra} = useMontaje()

      await cargarObra("obra-test-1")

      expect(mockStore.cargarObra).toHaveBeenCalledWith("obra-test-1")
    })

    it("debe manejar errores del store", async () => {
      mockStore.cargarObra.mockRejectedValue(new Error("Obra no encontrada"))
      const {cargarObra} = useMontaje()

      await expect(cargarObra("obra-inexistente")).rejects.toThrow("Obra no encontrada")
    })
  })

  describe("guardarCompas", () => {
    const compasData = {
      numero: 1,
      estado: EstadoCompass.COMPLETADO,
      observaciones: "Compás completado",
      obraId: "obra-test-1",
    }

    it("debe actualizar estado de compás correctamente", async () => {
      mockStore.actualizarEstadoCompass.mockResolvedValue(compasData)
      const {guardarCompas} = useMontaje()

      const result = await guardarCompas("obra-test-1", compasData)

      expect(mockStore.actualizarEstadoCompass).toHaveBeenCalledWith(
        "obra-test-1",
        1,
        EstadoCompass.COMPLETADO,
        "Compás completado"
      )
      expect(result).toEqual(compasData)
    })

    it("debe validar datos del compás", async () => {
      const {guardarCompas} = useMontaje()
      const compasInvalido = {
        numero: 0, // número inválido
        estado: "ESTADO_INVALIDO",
        observaciones: "",
        obraId: "obra-test-1",
      }

      await expect(guardarCompas("obra-test-1", compasInvalido)).rejects.toThrow()
    })

    it("debe requerir obraId", async () => {
      const {guardarCompas} = useMontaje()

      await expect(guardarCompas("", compasData)).rejects.toThrow("ID de obra es requerido")
    })
  })

  describe("crearObra", () => {
    const obraData = {
      titulo: "Nueva Obra",
      compositor: "Compositor Test",
      duracionEstimada: 3600,
      nivelDificultad: 4,
      descripcion: "Descripción de prueba",
    }

    it("debe crear obra con datos válidos", async () => {
      mockStore.crearObra.mockResolvedValue("nueva-obra-id")
      const {crearObra} = useMontaje()

      const result = await crearObra(obraData)

      expect(mockStore.crearObra).toHaveBeenCalledWith(obraData)
      expect(result).toBe("nueva-obra-id")
    })

    it("debe validar datos requeridos", async () => {
      const {crearObra} = useMontaje()
      const obraInvalida = {
        titulo: "", // título requerido
        compositor: "Test",
        duracionEstimada: 0,
        nivelDificultad: 1,
      }

      await expect(crearObra(obraInvalida)).rejects.toThrow("Título es requerido")
    })

    it("debe validar rango de dificultad", async () => {
      const {crearObra} = useMontaje()
      const obraConDificultadInvalida = {
        ...obraData,
        nivelDificultad: 6, // fuera del rango 1-5
      }

      await expect(crearObra(obraConDificultadInvalida)).rejects.toThrow(
        "Nivel de dificultad debe estar entre 1 y 5"
      )
    })
  })

  describe("generarReporteObra", () => {
    beforeEach(() => {
      mockStore.obraActual = {
        id: "obra-test-1",
        titulo: "Test Obra",
        compositor: "Test Compositor",
        metadatos: {
          progresoPorcentaje: 75,
          totalCompases: 120,
        },
      }
      mockStore.frases = [
        {
          id: "frase-1",
          titulo: "Frase 1",
          metadatos: {progresoPorcentaje: 100},
        },
        {
          id: "frase-2",
          titulo: "Frase 2",
          metadatos: {progresoPorcentaje: 50},
        },
      ]
      mockStore.evaluacionesContinuas = [
        {
          id: "eval-1",
          calificacion: 85,
          fecha: new Date("2024-01-15"),
        },
      ]
    })

    it("debe generar reporte con datos completos", async () => {
      const {generarReporteObra} = useMontaje()

      const reporte = await generarReporteObra("obra-test-1")

      expect(reporte).toEqual(
        expect.objectContaining({
          obra: expect.objectContaining({
            titulo: "Test Obra",
            compositor: "Test Compositor",
          }),
          progreso: expect.objectContaining({
            porcentajeGeneral: 75,
            frasesCompletadas: 1,
            frasesTotales: 2,
          }),
          evaluaciones: expect.objectContaining({
            total: 1,
            promedioCalificacion: 85,
          }),
        })
      )
    })

    it("debe requerir obra cargada", async () => {
      mockStore.obraActual = null
      const {generarReporteObra} = useMontaje()

      await expect(generarReporteObra("obra-test-1")).rejects.toThrow("Obra no encontrada")
    })

    it("debe generar reporte incluso sin evaluaciones", async () => {
      mockStore.evaluacionesContinuas = []
      const {generarReporteObra} = useMontaje()

      const reporte = await generarReporteObra("obra-test-1")

      expect(reporte.evaluaciones.total).toBe(0)
      expect(reporte.evaluaciones.promedioCalificacion).toBe(0)
    })
  })

  describe("Manejo de errores", () => {
    it("debe propagar errores del store", async () => {
      const errorMessage = "Error de conexión"
      mockStore.cargarObra.mockRejectedValue(new Error(errorMessage))
      const {cargarObra} = useMontaje()

      await expect(cargarObra("obra-test-1")).rejects.toThrow(errorMessage)
    })

    it("debe manejar errores de validación", async () => {
      const {crearObra} = useMontaje()

      await expect(crearObra({})).rejects.toThrow()
    })
  })

  describe("Estados de carga", () => {
    it("debe reflejar estado de carga del store", () => {
      mockStore.isLoading = true
      const {isLoading} = useMontaje()

      expect(isLoading.value).toBe(true)
    })

    it("debe reflejar errores del store", () => {
      mockStore.error = "Error de prueba"
      const {error} = useMontaje()

      expect(error.value).toBe("Error de prueba")
    })
  })
})
