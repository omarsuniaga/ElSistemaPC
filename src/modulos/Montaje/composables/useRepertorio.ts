import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRepertorioStore } from '../store/repertorio'
import type { 
  RepertoireItem,
  Participant,
  RepertoireMetrics,
  CreateRepertoireInput,
  UpdateParticipantInput,
  TipoInstrumento,
  DifficultyLevel,
  InstrumentType,
  RepertoireStatus
} from '../types'

/**
 * Composable para gestión del repertorio musical
 * Proporciona funcionalidades específicas para repertorio, participantes y métricas
 */
export function useRepertorio() {
  const repertorioStore = useRepertorioStore()
  const {
    repertoire,
    participants,
    metrics,
    loading,
    error
  } = storeToRefs(repertorioStore)

  // Estado local para filtros y búsqueda
  const searchQuery = ref('')
  const selectedInstrument = ref<TipoInstrumento | 'all'>('all')
  const selectedDifficulty = ref<DifficultyLevel | 'all'>('all')
  const selectedStatus = ref<RepertoireStatus | 'all'>('all')
  const selectedRepertoire = ref<RepertoireItem | null>(null)

  // Getters computados para filtrado
  const filteredRepertoire = computed(() => {
    let filtered = repertoire.value

    // Filtro por búsqueda
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter((item: RepertoireItem) =>
        item.nombre.toLowerCase().includes(query) ||
        (item.descripcion?.toLowerCase().includes(query) ?? false)
      )
    }

    // Filtro por instrumento
    // Filtro por instrumento (No aplicable directamente a Repertorio, se asume que se filtra por obras dentro del repertorio si fuera necesario)

    // Filtro por dificultad
    // Filtro por dificultad (No aplicable directamente a Repertorio)

    // Filtro por estado
    if (selectedStatus.value !== 'all') {
      filtered = filtered.filter((item: RepertoireItem) =>
        item.estado === selectedStatus.value
      )
    }

    return filtered
  })

  const activeRepertoire = computed(() =>
    repertoire.value.filter(item => item.estado === EstadoRepertorio.EN_MONTAJE)
  )

  const archivedRepertoire = computed(() =>
    repertoire.value.filter(item => item.estado === EstadoRepertorio.ARCHIVADO)
  )

  // No aplicable directamente a Repertorio, ya que Repertorio no tiene 'instruments'

  const participantsByInstrument = computed(() => {
    const grouped: Record<TipoInstrumento, Participant[]> = {} as any
    
    selectedRepertoire.value?.participantes.forEach(participant => {
      if (participant.instrumento) { // Check if instrumento exists
        if (!grouped[participant.instrumento]) {
          grouped[participant.instrumento] = []
        }
        grouped[participant.instrumento].push(participant)
      }
    })
    
    return grouped
  })

  const averageParticipantLevel = computed(() => {
    if (!selectedRepertoire.value || selectedRepertoire.value.participantes.length === 0) return 0
    
    // No hay una propiedad 'level' en ParticipanteRepertorio para calcular el promedio.
    // Si se añade 'nivel' a ParticipanteRepertorio, se podría calcular así:
    // const totalLevel = selectedRepertoire.value.participantes.reduce((sum, p) => sum + (p.level || 0), 0);
    // return totalLevel / selectedRepertoire.value.participantes.length;
    
    return 0 // Retorna 0 si no hay 'level' definido
  })

  // Repertoire management
  const createRepertoireItem = async (itemData: CreateRepertoireInput) => {
    try {
      const item = await repertorioStore.createRepertoireItem(itemData)
      selectedRepertoire.value = item
      return item
    } catch (error) {
      console.error('Error creating repertoire item:', error)
      throw error
    }
  }

  const updateRepertoireItem = async (itemId: string, updates: Partial<RepertoireItem>) => {
    try {
      await repertorioStore.updateRepertoireItem(itemId, updates)
      if (selectedRepertoire.value?.id === itemId) {
        Object.assign(selectedRepertoire.value, updates)
      }
    } catch (error) {
      console.error('Error updating repertoire item:', error)
      throw error
    }
  }

  const deleteRepertoireItem = async (itemId: string) => {
    try {
      await repertorioStore.deleteRepertoireItem(itemId)
      if (selectedRepertoire.value?.id === itemId) {
        selectedRepertoire.value = null
      }
    } catch (error) {
      console.error('Error deleting repertoire item:', error)
      throw error
    }
  }

  const duplicateRepertoireItem = async (itemId: string) => {
    try {
      const originalItem = repertoire.value.find(item => item.id === itemId)
      if (!originalItem) throw new Error('Item not found')

      const duplicateData: CreateRepertoireInput = {
        nombre: `${originalItem.nombre} (Copia)`,
        descripcion: originalItem.descripcion,
        // Asumiendo que estos campos existen o son opcionales
        // dificultad: originalItem.dificultad,
        // duracionEstimada: originalItem.duracionEstimada,
        // instrumentos: originalItem.instrumentos,
        // urlPartitura: originalItem.urlPartitura,
        // urlAudio: originalItem.urlAudio,
        // urlVideo: originalItem.urlVideo,
        // tags: originalItem.tags
      }
      // Llama a la función de creación del store con los datos duplicados
      await repertorioStore.createRepertoireItem(duplicateData);
    } catch (error) {
      console.error('Error duplicating repertoire item:', error);
      throw error;
    }
  }

  // Participant management
  const addParticipant = async (participantData: Omit<Participant, 'id' | 'joinedAt'>) => {
    try {
      return await repertorioStore.addParticipant(participantData)
    } catch (error) {
      console.error('Error adding participant:', error)
      throw error
    }
  }

  const updateParticipant = async (participantId: string, updates: UpdateParticipantInput) => {
    try {
      await repertorioStore.updateParticipant(participantId, updates)
    } catch (error) {
      console.error('Error updating participant:', error)
      throw error
    }
  }

  const removeParticipant = async (participantId: string) => {
    try {
      await repertorioStore.removeParticipant(participantId)
    } catch (error) {
      console.error('Error removing participant:', error)
      throw error
    }
  }

  const getParticipantProgress = (participantId: string) => {
    const participant = participants.value.find(p => p.id === participantId)
    if (!participant) return null

    // Calculate progress based on repertoire items they're working on
    const activeItems = activeRepertoire.value.filter(item =>
      item.instruments.includes(participant.instrument)
    )

    const completedItems = participant.repertoireProgress?.filter(progress =>
      progress.status === 'completed'
    ).length || 0

    return {
      participant,
      totalItems: activeItems.length,
      completedItems,
      progressPercentage: activeItems.length > 0 ? (completedItems / activeItems.length) * 100 : 0
    }
  }

  // Metrics and analytics
  const loadMetrics = async () => {
    try {
      await repertorioStore.loadMetrics()
    } catch (error) {
      console.error('Error loading metrics:', error)
      throw error
    }
  }

  const getRepertoireStatistics = () => {
    const totalItems = repertoire.value.length
    const activeItems = activeRepertoire.value.length
    const archivedItems = archivedRepertoire.value.length
    
    const difficultyDistribution = repertoire.value.reduce((acc, item) => {
      acc[item.difficulty] = (acc[item.difficulty] || 0) + 1
      return acc
    }, {} as Record<DifficultyLevel, number>)

    const instrumentDistribution = repertoire.value.reduce((acc, item) => {
      item.instruments.forEach(instrument => {
        acc[instrument] = (acc[instrument] || 0) + 1
      })
      return acc
    }, {} as Record<InstrumentType, number>)

    return {
      totalItems,
      activeItems,
      archivedItems,
      difficultyDistribution,
      instrumentDistribution,
      totalParticipants: participants.value.length,
      averageLevel: averageParticipantLevel.value
    }
  }

  // Search and filter utilities
  const clearFilters = () => {
    searchQuery.value = ''
    selectedInstrument.value = 'all'
    selectedDifficulty.value = 'all'
    selectedStatus.value = 'all'
  }

  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }

  const setInstrumentFilter = (instrument: InstrumentType | 'all') => {
    selectedInstrument.value = instrument
  }

  const setDifficultyFilter = (difficulty: DifficultyLevel | 'all') => {
    selectedDifficulty.value = difficulty
  }

  const setStatusFilter = (status: RepertoireStatus | 'all') => {
    selectedStatus.value = status
  }

  const selectRepertoire = (item: RepertoireItem) => {
    selectedRepertoire.value = item
  }

  const clearSelection = () => {
    selectedRepertoire.value = null
  }

  // Data loading
  const loadRepertoireData = async () => {
    try {
      await Promise.all([
        repertorioStore.loadRepertoire(),
        repertorioStore.loadParticipants(),
        repertorioStore.loadMetrics()
      ])
    } catch (error) {
      console.error('Error loading repertoire data:', error)
      throw error
    }
  }

  return {
    repertoire,
    selectedRepertoire,
    metrics,
    loading,
    error,
    searchQuery,
    selectedInstrument,
    selectedDifficulty,
    selectedStatus,
    filteredRepertoire,
    activeRepertoire,
    archivedRepertoire,
    participantsByInstrument,
    averageParticipantLevel,
    createRepertoireItem,
    updateRepertoireItem,
    deleteRepertoireItem,
    duplicateRepertoireItem,
    addParticipant: repertorioStore.addParticipant,
    updateParticipant: repertorioStore.updateParticipant,
    removeParticipant: repertorioStore.removeParticipant,
    loadMetrics: repertorioStore.cargarMetricas,
    loadRepertoire: repertorioStore.cargarRepertorio,
    loadRepertoires: repertorioStore.cargarRepertorios,
    applyFilters: repertorioStore.aplicarFiltros,
    clearFilters: repertorioStore.limpiarFiltros,
    searchRepertoires: repertorioStore.buscarRepertorios,
    clearState: repertorioStore.limpiarEstado,
    setSearchQuery,
    setInstrumentFilter,
    setDifficultyFilter,
    setStatusFilter,
    // Selection actions
    selectRepertoire,
    clearSelection,

    // Data actions
    loadRepertoireData
  }
}
