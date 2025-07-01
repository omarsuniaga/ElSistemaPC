import {describe, it, expect, beforeEach} from "vitest"
import {setActivePinia, createPinia} from "pinia"
import {useRepertorioStore} from "./repertorio"

describe("Repertorio Store", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it("debe inicializar con valores por defecto", () => {
    const store = useRepertorioStore()
    expect(store.repertorios).toEqual([])
    expect(store.loading).toBe(false)
  })

  it("debe manejar estados de carga", () => {
    const store = useRepertorioStore()
    store.setLoading(true)
    expect(store.loading).toBe(true)
  })

  it("debe agregar un repertorio", () => {
    const store = useRepertorioStore()
    const mockRepertorio = {
      id: "test-1",
      titulo: "Test Repertorio",
      participantes: [],
      fechaCreacion: new Date(),
      fechaActualizacion: new Date(),
      estado: "borrador" as const,
    }

    store.repertorios = [mockRepertorio]
    expect(store.repertorios).toHaveLength(1)
    expect(store.repertorios[0].titulo).toBe("Test Repertorio")
  })
})
