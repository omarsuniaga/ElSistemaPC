import {ref, computed, Ref} from "vue"
import {useFirestore} from "@/composables/useFirestore"
import {useMontajeStore} from "../store/montaje"
import {EstadoCompass, TipoInstrumento} from "../types"

import {doc, updateDoc} from "firebase/firestore"
// Tipos para el tracking de la selección
interface CompasSeleccionado {
  obraId: string
  numero: number
  instrumento?: TipoInstrumento
  estado?: EstadoCompass
  observacion?: string
  seccion?: string
  alumnosIds?: string[]
}

interface AreaSeleccionada {
  inicio: {x: number; y: number}
  fin: {x: number; y: number}
}

interface UltimaAccion {
  tipo: "seleccion" | "cambio-estado"
  compases: CompasSeleccionado[]
  estado?: EstadoCompass
}

export function useHeatmapTracking(obraId: string | Ref<string>) {
  // Store de Montaje
  const montajeStore = useMontajeStore()
  const {addDocument, updateDocument, runBatch} = useFirestore()

  // Estado reactivo
  const compasesSeleccionados = ref<CompasSeleccionado[]>([])
  const seleccionado = ref<{[key: string]: boolean}>({})
  const seleccionIniciada = ref(false)
  const areaSeleccion = ref<AreaSeleccionada | null>(null)
  const historialAcciones = ref<UltimaAccion[]>([])
  const dragSelectionActive = ref(false)

  // Obtener el ID de la obra
  const getObraId = computed(() => {
    return typeof obraId === "string" ? obraId : obraId.value
  })

  // Métodos para manejo de selección
  const iniciarSeleccion = (compas: number, instrumento: TipoInstrumento, evt: MouseEvent) => {
    // Detectar si se está usando la tecla Ctrl/Cmd para selección múltiple
    const isMultiSelect = evt.ctrlKey || evt.metaKey

    if (!isMultiSelect) {
      // Limpiar selección previa si no es multi-selección
      limpiarSeleccion()
    }

    const key = `${getObraId.value}-${compas}-${instrumento}`

    if (seleccionado.value[key]) {
      // Si ya está seleccionado y es multi-selección, deseleccionar
      if (isMultiSelect) {
        eliminarDeSeleccion(compas, instrumento)
      }
    } else {
      // Añadir a la selección
      agregarASeleccion(compas, instrumento)
    }

    // Iniciar posible selección por arrastre
    seleccionIniciada.value = true
  }

  // Iniciar selección por arrastre (drag select)
  const iniciarDragSelection = (x: number, y: number) => {
    dragSelectionActive.value = true
    areaSeleccion.value = {
      inicio: {x, y},
      fin: {x, y},
    }
  }

  // Actualizar selección por arrastre
  const actualizarDragSelection = (x: number, y: number) => {
    if (!dragSelectionActive.value || !areaSeleccion.value) return

    areaSeleccion.value.fin = {x, y}
  }

  // Finalizar selección por arrastre
  const finalizarDragSelection = (
    compases: {numero: number; instrumento: TipoInstrumento; x: number; y: number}[]
  ) => {
    if (!areaSeleccion.value) return

    // Calcular rectángulo de selección
    const {inicio, fin} = areaSeleccion.value

    // Determinar esquinas del rectángulo (inicio puede ser mayor que fin)
    const x1 = Math.min(inicio.x, fin.x)
    const y1 = Math.min(inicio.y, fin.y)
    const x2 = Math.max(inicio.x, fin.x)
    const y2 = Math.max(inicio.y, fin.y)

    // Identificar todos los compases dentro del rectángulo
    const compasesEnArea = compases.filter((c) => c.x >= x1 && c.x <= x2 && c.y >= y1 && c.y <= y2)

    // Seleccionar todos los compases encontrados
    limpiarSeleccion()
    compasesEnArea.forEach((c) => {
      agregarASeleccion(c.numero, c.instrumento)
    })

    // Limpiar estado de drag selection
    dragSelectionActive.value = false
    areaSeleccion.value = null

    // Registrar acción en historial
    registrarAccion("seleccion", compasesSeleccionados.value)
  }

  // Agregar un compás a la selección
  const agregarASeleccion = (compas: number, instrumento: TipoInstrumento) => {
    const key = `${getObraId.value}-${compas}-${instrumento}`

    if (seleccionado.value[key]) return // Evitar duplicados

    seleccionado.value[key] = true

    // Obtener información del compás si existe en el store
    const infoCompas = montajeStore.getCompasInfo(getObraId.value, compas, instrumento)

    compasesSeleccionados.value.push({
      obraId: getObraId.value,
      numero: compas,
      instrumento,
      estado: (infoCompas?.estado as EstadoCompass) || EstadoCompass.SIN_TRABAJAR,
      observacion: infoCompas?.observacion,
      seccion: infoCompas?.seccion,
      alumnosIds: infoCompas?.alumnosIds,
    })
  }

  // Eliminar un compás de la selección
  const eliminarDeSeleccion = (compas: number, instrumento: TipoInstrumento) => {
    const key = `${getObraId.value}-${compas}-${instrumento}`

    if (!seleccionado.value[key]) return

    delete seleccionado.value[key]

    compasesSeleccionados.value = compasesSeleccionados.value.filter(
      (c) => !(c.obraId === getObraId.value && c.numero === compas && c.instrumento === instrumento)
    )
  }

  // Limpiar toda la selección
  const limpiarSeleccion = () => {
    seleccionado.value = {}
    compasesSeleccionados.value = []
  }

  // Cambiar estado para todos los compases seleccionados
  const cambiarEstadoSeleccionados = async (
    estado: EstadoCompass,
    observacion?: string,
    alumnosIds?: string[]
  ) => {
    if (compasesSeleccionados.value.length === 0) return

    try {
      // Preparar batch para actualización en Firestore
      const batch = []
      const timestamp = new Date()
      const userId = montajeStore.getUserId

      // Actualizar cada compás seleccionado
      const compasesActualizados = compasesSeleccionados.value.map((compas) => {
        const compasActualizado = {
          ...compas,
          estado,
          observacion:
            estado === EstadoCompass.CON_DIFICULTAD ? observacion || compas.observacion : "",
          alumnosIds: alumnosIds || compas.alumnosIds || [],
          ultimaActualizacion: timestamp,
          evaluadorId: userId,
        }

        // Añadir actualización al batch
        batch.push({
          collection: "compases",
          docId: `${compas.obraId}_${compas.numero}_${compas.instrumento}`,
          data: compasActualizado,
        })

        return compasActualizado
      })

      // Ejecutar batch en Firestore
      await runBatch(batch)

      // Actualizar en el store
      montajeStore.setCompasesEstado(compasesActualizados)

      // Registrar acción en historial
      registrarAccion("cambio-estado", compasesActualizados, estado)

      return compasesActualizados
    } catch (error) {
      console.error("Error al cambiar estado de compases:", error)
      throw error
    }
  }

  // Registrar acción en el historial
  const registrarAccion = (
    tipo: "seleccion" | "cambio-estado",
    compases: CompasSeleccionado[],
    estado?: EstadoCompass
  ) => {
    historialAcciones.value.push({
      tipo,
      compases: [...compases],
      estado,
    })

    // Limitar historial a las últimas 20 acciones
    if (historialAcciones.value.length > 20) {
      historialAcciones.value.shift()
    }
  }

  // Deshacer última acción
  const deshacerUltimaAccion = async () => {
    const ultimaAccion = historialAcciones.value.pop()

    if (!ultimaAccion) return

    if (ultimaAccion.tipo === "cambio-estado") {
      // Obtener estados previos de los compases
      const compasesIds = ultimaAccion.compases.map(
        (c) => `${c.obraId}_${c.numero}_${c.instrumento}`
      )

      // Recuperar estados previos de la base de datos o store
      const compasesPrevios = await montajeStore.getCompasesHistorial(compasesIds)

      if (compasesPrevios.length > 0) {
        // Restaurar estados previos
        await montajeStore.restaurarCompasesEstado(compasesPrevios)
      }
    } else if (ultimaAccion.tipo === "seleccion") {
      // Restaurar selección previa
      limpiarSeleccion()
      ultimaAccion.compases.forEach((c) => {
        agregarASeleccion(c.numero, c.instrumento as TipoInstrumento)
      })
    }
  }

  return {
    // Estado
    compasesSeleccionados,
    seleccionado,
    dragSelectionActive,
    areaSeleccion,

    // Métodos de selección
    iniciarSeleccion,
    agregarASeleccion,
    eliminarDeSeleccion,
    limpiarSeleccion,

    // Drag selection
    iniciarDragSelection,
    actualizarDragSelection,
    finalizarDragSelection,

    // Cambio de estado
    cambiarEstadoSeleccionados,

    // Historial y deshacer
    historialAcciones,
    deshacerUltimaAccion,
  }
}
