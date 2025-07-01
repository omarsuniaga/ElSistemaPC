import {describe, it, expect, beforeEach, vi, type Mock} from "vitest"
import {mount, VueWrapper} from "@vue/test-utils"
import InstrumentGroupSelector from "../components/InstrumentGroupSelector.vue"
import {TipoInstrumento} from "../types"

// Mock del store de Classes
const mockClassStore = {
  getClassById: vi.fn(),
  fetchClassById: vi.fn().mockResolvedValue(true),
}

vi.mock("@/modulos/Classes/store/classes", () => ({
  useClassesStore: () => mockClassStore,
}))

// Mock de datos de clase
const mockClass = {
  id: "clase-123",
  nombre: "Orquesta Junior",
  filas: [
    {
      id: "fila-1",
      nombre: "Primera Fila Violines",
      instrumentos: [TipoInstrumento.VIOLIN_I, TipoInstrumento.VIOLIN_II],
    },
    {
      id: "fila-2",
      nombre: "Violas",
      instrumentos: [TipoInstrumento.VIOLA],
    },
    {
      id: "fila-3",
      nombre: "Metales",
      instrumentos: [TipoInstrumento.TROMPETA, TipoInstrumento.TROMBON],
    },
  ],
}

describe("InstrumentGroupSelector", () => {
  let wrapper: VueWrapper<any>

  const defaultProps = {
    modelValue: [],
    showRows: false,
    classId: "",
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createWrapper = (props = {}) => {
    return mount(InstrumentGroupSelector, {
      props: {...defaultProps, ...props},
    })
  }

  describe("Renderizado básico", () => {
    it("debe renderizarse correctamente", () => {
      wrapper = createWrapper()

      expect(wrapper.find(".instrument-selector").exists()).toBe(true)
      expect(wrapper.find("h4").text()).toBe("Selección de instrumentos")
    })

    it("debe mostrar todas las familias de instrumentos", () => {
      wrapper = createWrapper()

      const familyButtons = wrapper
        .findAll("button")
        .filter((btn) =>
          [
            "Todos",
            "Cuerdas",
            "Vientos Madera",
            "Vientos Metal",
            "Percusión",
            "Teclados",
            "Otros",
          ].includes(btn.text())
        )

      expect(familyButtons.length).toBe(7)
    })

    it('debe mostrar instrumentos por defecto (familia "Todos")', () => {
      wrapper = createWrapper()

      const instrumentCheckboxes = wrapper.findAll('input[type="checkbox"]')
      expect(instrumentCheckboxes.length).toBeGreaterThan(0)
    })
  })

  describe("Selección de familias", () => {
    it("debe cambiar la familia seleccionada al hacer clic", async () => {
      wrapper = createWrapper()

      const cuerdasButton = wrapper.findAll("button").find((btn) => btn.text() === "Cuerdas")
      expect(cuerdasButton).toBeDefined()

      await cuerdasButton!.trigger("click")

      // Verificar que el botón tiene la clase activa
      expect(cuerdasButton!.classes()).toContain("bg-blue-600")
      expect(cuerdasButton!.classes()).toContain("text-white")
    })

    it("debe filtrar instrumentos según la familia seleccionada", async () => {
      wrapper = createWrapper()

      // Seleccionar familia "Cuerdas"
      const cuerdasButton = wrapper.findAll("button").find((btn) => btn.text() === "Cuerdas")
      await cuerdasButton!.trigger("click")

      // Verificar que solo se muestran instrumentos de cuerda
      const instrumentLabels = wrapper
        .findAll(".text-sm")
        .filter(
          (el) =>
            el.text().includes("Violín") ||
            el.text().includes("Viola") ||
            el.text().includes("Cello")
        )

      expect(instrumentLabels.length).toBeGreaterThan(0)
    })
  })

  describe("Selección de instrumentos", () => {
    it("debe permitir seleccionar un instrumento", async () => {
      wrapper = createWrapper()

      const firstCheckbox = wrapper.find('input[type="checkbox"]')
      await firstCheckbox.setChecked(true)

      // Verificar que se emite el evento de actualización
      expect(wrapper.emitted("update:modelValue")).toBeTruthy()
      expect(wrapper.emitted("selection-change")).toBeTruthy()
    })

    it("debe reflejar la selección inicial en el modelValue", () => {
      const initialSelection = [TipoInstrumento.VIOLIN_I, TipoInstrumento.VIOLA]
      wrapper = createWrapper({modelValue: initialSelection})

      const checkedBoxes = wrapper.findAll('input[type="checkbox"]:checked')
      expect(checkedBoxes.length).toBe(2)
    })

    it("debe permitir deseleccionar instrumentos", async () => {
      const initialSelection = [TipoInstrumento.VIOLIN_I]
      wrapper = createWrapper({modelValue: initialSelection})

      const checkedBox = wrapper.find('input[type="checkbox"]:checked')
      await checkedBox.setChecked(false)

      const updateEvents = wrapper.emitted("update:modelValue") as any[][]
      const lastEmission = updateEvents[updateEvents.length - 1][0]
      expect(lastEmission).not.toContain(TipoInstrumento.VIOLIN_I)
    })
  })

  describe("Funcionalidad de limpiar selección", () => {
    it("debe mostrar el botón de limpiar cuando hay instrumentos seleccionados", () => {
      wrapper = createWrapper({modelValue: [TipoInstrumento.VIOLIN_I]})

      const clearButton = wrapper
        .find("button")
        .filter((btn) => btn.text().includes("Limpiar selección"))
      expect(clearButton.exists()).toBe(true)
    })

    it("debe limpiar la selección al hacer clic en limpiar", async () => {
      wrapper = createWrapper({modelValue: [TipoInstrumento.VIOLIN_I, TipoInstrumento.VIOLA]})

      const clearButton = wrapper
        .find("button")
        .filter((btn) => btn.text().includes("Limpiar selección"))

      await clearButton.trigger("click")

      const updateEvents = wrapper.emitted("update:modelValue") as any[][]
      const lastEmission = updateEvents[updateEvents.length - 1][0]
      expect(lastEmission).toEqual([])
    })
  })

  describe("Integración con filas (showRows=true)", () => {
    beforeEach(() => {
      mockClassStore.getClassById.mockReturnValue(mockClass)
    })

    it("debe mostrar filas cuando showRows es true y hay classId", () => {
      wrapper = createWrapper({
        showRows: true,
        classId: "clase-123",
      })

      expect(wrapper.find("h4").text()).toContain("Filas de")
    })

    it("debe cargar la clase cuando se proporciona classId", async () => {
      wrapper = createWrapper({
        showRows: true,
        classId: "clase-nueva",
      })

      // Esperar a que se ejecute el watch
      await wrapper.vm.$nextTick()

      expect(mockClassStore.fetchClassById).toHaveBeenCalledWith("clase-nueva")
    })

    it("debe permitir seleccionar filas completas", async () => {
      wrapper = createWrapper({
        showRows: true,
        classId: "clase-123",
      })

      // Buscar el checkbox de la primera fila
      const firstRowCheckbox = wrapper.findAll('input[type="checkbox"]').find((input) => {
        const parent = input.element.closest(".flex")
        return parent?.textContent?.includes("Primera Fila Violines")
      })

      if (firstRowCheckbox) {
        await firstRowCheckbox.setChecked(true)

        // Verificar que se seleccionaron los instrumentos de la fila
        const updateEvents = wrapper.emitted("update:modelValue") as any[][]
        const lastEmission = updateEvents[updateEvents.length - 1][0]

        expect(lastEmission).toContain(TipoInstrumento.VIOLIN_I)
        expect(lastEmission).toContain(TipoInstrumento.VIOLIN_II)
      }
    })

    it("debe mostrar todas las filas de la clase", () => {
      wrapper = createWrapper({
        showRows: true,
        classId: "clase-123",
      })

      const rowTexts = wrapper.findAll(".text-sm").map((el) => el.text())

      expect(rowTexts).toContain("Primera Fila Violines")
      expect(rowTexts).toContain("Violas")
      expect(rowTexts).toContain("Metales")
    })
  })

  describe("Emisión de eventos", () => {
    it("debe emitir update:modelValue con la lista correcta", async () => {
      wrapper = createWrapper()

      // Simular selección de instrumento
      const firstCheckbox = wrapper.find('input[type="checkbox"]')
      await firstCheckbox.setChecked(true)

      const updateEvents = wrapper.emitted("update:modelValue") as any[][]
      expect(updateEvents).toBeTruthy()
      expect(Array.isArray(updateEvents[0][0])).toBe(true)
    })

    it("debe emitir selection-change con información detallada", async () => {
      wrapper = createWrapper()

      const firstCheckbox = wrapper.find('input[type="checkbox"]')
      await firstCheckbox.setChecked(true)

      const selectionEvents = wrapper.emitted("selection-change") as any[][]
      expect(selectionEvents).toBeTruthy()

      const eventData = selectionEvents[0][0]
      expect(eventData).toHaveProperty("instrumentos")
      expect(eventData).toHaveProperty("filas")
    })
  })

  describe("Sincronización con props", () => {
    it("debe actualizar la selección interna cuando cambia modelValue", async () => {
      wrapper = createWrapper({modelValue: []})

      // Cambiar prop externamente
      await wrapper.setProps({modelValue: [TipoInstrumento.VIOLIN_I]})

      const checkedBoxes = wrapper.findAll('input[type="checkbox"]:checked')
      expect(checkedBoxes.length).toBe(1)
    })

    it("debe mantener sincronización bidireccional", async () => {
      wrapper = createWrapper({modelValue: [TipoInstrumento.VIOLIN_I]})

      // Verificar estado inicial
      expect(wrapper.findAll('input[type="checkbox"]:checked').length).toBe(1)

      // Deseleccionar desde la UI
      const checkedBox = wrapper.find('input[type="checkbox"]:checked')
      await checkedBox.setChecked(false)

      // Verificar que se emitió el cambio
      const updateEvents = wrapper.emitted("update:modelValue") as any[][]
      const lastEmission = updateEvents[updateEvents.length - 1][0]
      expect(lastEmission).toEqual([])
    })
  })
})
