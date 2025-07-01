// src/modulos/Montaje/utils/index.test.ts
import {describe, it, expect} from "vitest"
import {formatDate, formatDuration, validateObra, calculateProgress} from "./index"
import {EstadoCompass} from "../types"

describe("Utilidades de Montaje", () => {
  describe("formatDate", () => {
    it("debe formatear fechas correctamente", () => {
      const fecha = new Date("2024-01-15T10:30:00")
      expect(formatDate(fecha)).toBe("15/01/2024")
    })

    it("debe manejar fechas nulas", () => {
      expect(formatDate(null)).toBe("N/A")
      expect(formatDate(undefined)).toBe("N/A")
    })

    it("debe manejar objetos Timestamp de Firebase", () => {
      const timestamp = {
        toDate: () => new Date("2024-01-15T10:30:00"),
      }
      expect(formatDate(timestamp)).toBe("15/01/2024")
    })
  })

  describe("formatDuration", () => {
    it("debe formatear duración en segundos", () => {
      expect(formatDuration(0)).toBe("0min")
      expect(formatDuration(60)).toBe("1min")
      expect(formatDuration(120)).toBe("2min")
      expect(formatDuration(3600)).toBe("60min")
    })

    it("debe formatear duración con horas y minutos", () => {
      expect(formatDuration(3661)).toBe("1h 1min") // 1 hora y 1 minuto
      expect(formatDuration(7200)).toBe("2h 0min") // 2 horas exactas
    })

    it("debe manejar valores negativos", () => {
      expect(formatDuration(-60)).toBe("0min")
    })

    it("debe manejar valores no numéricos", () => {
      expect(formatDuration(null)).toBe("0min")
      expect(formatDuration(undefined)).toBe("0min")
      expect(formatDuration("invalid")).toBe("0min")
    })
  })

  describe("validateObra", () => {
    const obraValida = {
      titulo: "Sinfonía Test",
      compositor: "Compositor Test",
      duracionEstimada: 3600,
      nivelDificultad: 4,
      descripcion: "Descripción válida",
    }

    it("debe validar obra correcta", () => {
      const result = validateObra(obraValida)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it("debe detectar título faltante", () => {
      const obraInvalida = {...obraValida, titulo: ""}
      const result = validateObra(obraInvalida)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Título es requerido")
    })

    it("debe detectar compositor faltante", () => {
      const obraInvalida = {...obraValida, compositor: ""}
      const result = validateObra(obraInvalida)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Compositor es requerido")
    })

    it("debe validar nivel de dificultad", () => {
      const obraConDificultadBaja = {...obraValida, nivelDificultad: 0}
      const obraConDificultadAlta = {...obraValida, nivelDificultad: 6}

      expect(validateObra(obraConDificultadBaja).isValid).toBe(false)
      expect(validateObra(obraConDificultadAlta).isValid).toBe(false)
      expect(validateObra(obraConDificultadBaja).errors).toContain(
        "Nivel de dificultad debe estar entre 1 y 5"
      )
    })

    it("debe validar duración positiva", () => {
      const obraConDuracionNegativa = {...obraValida, duracionEstimada: -100}
      const result = validateObra(obraConDuracionNegativa)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Duración debe ser positiva")
    })

    it("debe acumular múltiples errores", () => {
      const obraInvalida = {
        titulo: "",
        compositor: "",
        duracionEstimada: -100,
        nivelDificultad: 0,
      }
      const result = validateObra(obraInvalida)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
    })
  })

  describe("calculateProgress", () => {
    it("debe calcular progreso con Map de estados", () => {
      const estadosCompases = new Map([
        [1, {estado: EstadoCompass.COMPLETADO}],
        [2, {estado: EstadoCompass.EN_PROGRESO}],
        [3, {estado: EstadoCompass.NO_TRABAJADO}],
        [4, {estado: EstadoCompass.COMPLETADO}],
      ])

      const progress = calculateProgress(estadosCompases, 4)

      // 2 compases completados de 4 total = 50%
      expect(progress).toBe(50)
    })

    it("debe calcular progreso con array de compases", () => {
      const compases = [
        {estado: EstadoCompass.COMPLETADO},
        {estado: EstadoCompass.COMPLETADO},
        {estado: EstadoCompass.EN_PROGRESO},
        {estado: EstadoCompass.NO_TRABAJADO},
      ]

      const progress = calculateProgress(compases)

      // 2 compases completados de 4 total = 50%
      expect(progress).toBe(50)
    })

    it("debe manejar casos sin compases", () => {
      expect(calculateProgress(new Map(), 0)).toBe(0)
      expect(calculateProgress([], 0)).toBe(0)
      expect(calculateProgress(null, 0)).toBe(0)
    })

    it("debe manejar todos los compases completados", () => {
      const estadosCompases = new Map([
        [1, {estado: EstadoCompass.COMPLETADO}],
        [2, {estado: EstadoCompass.COMPLETADO}],
      ])

      const progress = calculateProgress(estadosCompases, 2)
      expect(progress).toBe(100)
    })

    it("debe manejar ningún compás completado", () => {
      const estadosCompases = new Map([
        [1, {estado: EstadoCompass.NO_TRABAJADO}],
        [2, {estado: EstadoCompass.EN_PROGRESO}],
      ])

      const progress = calculateProgress(estadosCompases, 2)
      expect(progress).toBe(0)
    })

    it("debe redondear decimales correctamente", () => {
      const estadosCompases = new Map([
        [1, {estado: EstadoCompass.COMPLETADO}],
        [2, {estado: EstadoCompass.NO_TRABAJADO}],
        [3, {estado: EstadoCompass.NO_TRABAJADO}],
      ])

      const progress = calculateProgress(estadosCompases, 3)

      // 1 de 3 = 33.33%, redondeado a 33%
      expect(progress).toBe(33)
    })
  })

  describe("Funciones de validación específicas", () => {
    it("debe validar números de compás", () => {
      const {isValidCompasNumber} = require("./index")

      expect(isValidCompasNumber(1)).toBe(true)
      expect(isValidCompasNumber(120)).toBe(true)
      expect(isValidCompasNumber(0)).toBe(false)
      expect(isValidCompasNumber(-1)).toBe(false)
      expect(isValidCompasNumber(null)).toBe(false)
    })

    it("debe validar estados de compás", () => {
      const {isValidEstadoCompass} = require("./index")

      expect(isValidEstadoCompass(EstadoCompass.COMPLETADO)).toBe(true)
      expect(isValidEstadoCompass(EstadoCompass.EN_PROGRESO)).toBe(true)
      expect(isValidEstadoCompass(EstadoCompass.NO_TRABAJADO)).toBe(true)
      expect(isValidEstadoCompass(EstadoCompass.CON_DIFICULTAD)).toBe(true)
      expect(isValidEstadoCompass("ESTADO_INVALIDO")).toBe(false)
      expect(isValidEstadoCompass(null)).toBe(false)
    })
  })

  describe("Transformadores de datos", () => {
    it("debe transformar datos de obra para UI", () => {
      const {transformObraForUI} = require("./index")

      const obraFirebase = {
        id: "obra-1",
        titulo: "Test",
        compositor: "Compositor",
        fechaCreacion: {toDate: () => new Date("2024-01-01")},
        metadatos: {
          progresoPorcentaje: 75,
        },
      }

      const obraUI = transformObraForUI(obraFirebase)

      expect(obraUI.fechaCreacionFormatted).toBe("01/01/2024")
      expect(obraUI.progresoColor).toBe("text-green-600") // >70% = verde
    })

    it("debe asignar colores de progreso correctamente", () => {
      const {getProgressColor} = require("./index")

      expect(getProgressColor(0)).toBe("text-red-600") // 0-30%
      expect(getProgressColor(50)).toBe("text-yellow-600") // 31-70%
      expect(getProgressColor(80)).toBe("text-green-600") // 71-100%
    })
  })
})
