import { ref, computed } from 'vue'
import type { MusicalWork, LevelConfig, Instrument } from '../types/heatmap'

export function useMusicalWorks() {
  const works = ref<MusicalWork[]>([])
  const currentWork = ref<MusicalWork | null>(null)
  const loading = ref(true)

  // Default level configurations
  const defaultLevels: LevelConfig[] = [
    { id: 0, name: 'Muy Bajo', color: 'bg-red-500', description: 'Nivel mínimo' },
    { id: 1, name: 'Bajo', color: 'bg-orange-500', description: 'Nivel bajo' },
    { id: 2, name: 'Medio', color: 'bg-yellow-500', description: 'Nivel medio' },
    { id: 3, name: 'Alto', color: 'bg-lime-500', description: 'Nivel alto' },
    { id: 4, name: 'Muy Alto', color: 'bg-green-500', description: 'Nivel máximo' }
  ]

  // Default instruments for orchestral works
  const getDefaultInstruments = (): Instrument[] => {
    return [
      { id: 'violin1', name: 'Violín I', family: 'Cuerda', quantity: 16 },
      { id: 'violin2', name: 'Violín II', family: 'Cuerda', quantity: 14 },
      { id: 'viola', name: 'Viola', family: 'Cuerda', quantity: 12 },
      { id: 'cello', name: 'Violonchelo', family: 'Cuerda', quantity: 10 },
      { id: 'bass', name: 'Contrabajo', family: 'Cuerda', quantity: 8 },
      { id: 'flute', name: 'Flauta', family: 'Viento-madera', quantity: 2 },
      { id: 'oboe', name: 'Oboe', family: 'Viento-madera', quantity: 2 },
      { id: 'clarinet', name: 'Clarinete', family: 'Viento-madera', quantity: 2 },
      { id: 'bassoon', name: 'Fagot', family: 'Viento-madera', quantity: 2 },
      { id: 'horn', name: 'Trompa', family: 'Viento-metal', quantity: 4 },
      { id: 'trumpet', name: 'Trompeta', family: 'Viento-metal', quantity: 2 },
      { id: 'trombone', name: 'Trombón', family: 'Viento-metal', quantity: 3 },
      { id: 'tuba', name: 'Tuba', family: 'Viento-metal', quantity: 1 },
      { id: 'timpani', name: 'Timbales', family: 'Percusión', quantity: 1 }
    ]
  }

  // Local storage fallback functions
  const saveToLocalStorage = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.warn('Could not save to localStorage:', error)
    }
  }

  const loadFromLocalStorage = (key: string) => {
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.warn('Could not load from localStorage:', error)
      return null
    }
  }

  // Create a new musical work with local storage fallback
  const createWork = async (
    name: string,
    composer: string,
    description: string = '',
    rows: number = 12,
    cols: number = 18,
    key: string = 'Do Mayor',
    tempo: string = 'Moderato',
    timeSignature: string = '4/4',
    requirements: string = '',
    techniques: string = '',
    startDate: string = new Date().toISOString().split('T')[0],
    endDate: string = '',
    instruments: Instrument[] = []
  ): Promise<string> => {
    const workId = `work_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const totalMeasures = rows * cols
    
    const newWork: MusicalWork = {
      id: workId,
      projectId: 'current_project_id',
      name,
      composer,
      description,
      genre: '',
      difficulty: 3,
      duration: 0,
      rows,
      cols,
      totalMeasures,
      key,
      tempo,
      timeSignature,
      requirements,
      techniques,
      startDate,
      endDate,
      instruments: instruments.length > 0 ? instruments : getDefaultInstruments(),
      levels: [...defaultLevels],
      sections: [],
      resources: [],
      milestones: [],
      status: 'planning',
      priority: 1,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current_user_id'
    }

    // Always add to local array first for immediate feedback
    works.value.push(newWork)
    
    // Save to localStorage as primary storage
    const allWorks = [...works.value]
    saveToLocalStorage('musical_works', allWorks)

    return workId
  }

  // Load all works with local storage fallback
  const loadWorks = async () => {
    loading.value = true
    
    try {
      // Try to load from localStorage for immediate response
      const localWorks = loadFromLocalStorage('musical_works')
      if (localWorks && Array.isArray(localWorks)) {
        works.value = localWorks
      }
      
      // If no local works exist, create a default one
      if (works.value.length === 0) {
        await createWork('Sinfonía No. 40', 'Wolfgang Amadeus Mozart', 'Sinfonía en Sol menor, K. 550')
      }
    } finally {
      loading.value = false
    }
  }

  // Load specific work with local storage fallback
  const loadWork = async (workId: string) => {
    try {
      // First check local works
      const localWork = works.value.find(w => w.id === workId)
      if (localWork) {
        currentWork.value = localWork
      }
    } catch (error) {
      console.warn('Could not load work, using local copy:', error)
      
      // Fallback to local work if available
      if (!currentWork.value) {
        const localWork = works.value.find(w => w.id === workId)
        if (localWork) {
          currentWork.value = localWork
        }
      }
    }
  }

  // Update work with local storage fallback
  const updateWork = async (work: MusicalWork) => {
    const updatedWork = {
      ...work,
      totalMeasures: work.rows * work.cols,
      updatedAt: new Date().toISOString()
    }

    // Update local copy immediately
    const index = works.value.findIndex(w => w.id === work.id)
    if (index !== -1) {
      works.value[index] = updatedWork
    }
    
    if (currentWork.value?.id === work.id) {
      currentWork.value = updatedWork
    }
    
    saveToLocalStorage('musical_works', works.value)
  }

  // Delete work with local storage fallback
  const deleteWork = async (workId: string) => {
    // Remove from local array immediately
    works.value = works.value.filter(w => w.id !== workId)
    saveToLocalStorage('musical_works', works.value)
    
    if (currentWork.value?.id === workId) {
      currentWork.value = null
    }
  }

  // Update level configuration
  const updateLevelConfig = async (workId: string, levels: LevelConfig[]) => {
    const work = works.value.find(w => w.id === workId)
    if (work) {
      work.levels = levels
      await updateWork(work)
    }
  }

  // Get level by id
  const getLevelConfig = (levelId: number): LevelConfig | undefined => {
    return currentWork.value?.levels.find(l => l.id === levelId)
  }

  return {
    works: computed(() => works.value),
    currentWork: computed(() => currentWork.value),
    loading: computed(() => loading.value),
    createWork,
    loadWorks,
    loadWork,
    updateWork,
    deleteWork,
    updateLevelConfig,
    getLevelConfig,
    defaultLevels,
    getDefaultInstruments
  }
}