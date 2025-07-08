import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMontaje } from './useMontaje'
import { montajeService } from '../service/montajeService'
import type { MusicalWork, LevelConfig, Instrument } from '../types/heatmap'

export function useMusicalWorks() {
  const works = ref<MusicalWork[]>([])
  const currentWork = ref<MusicalWork | null>(null)
  const loading = ref(false)
  const { currentProject } = useMontaje()
  const authStore = useAuthStore()

  const defaultLevels: LevelConfig[] = [
    { id: 0, name: 'Muy Bajo', color: 'bg-red-500', description: 'Nivel mínimo' },
    { id: 1, name: 'Bajo', color: 'bg-orange-500', description: 'Nivel bajo' },
    { id: 2, name: 'Medio', color: 'bg-yellow-500', description: 'Nivel medio' },
    { id: 3, name: 'Alto', color: 'bg-lime-500', description: 'Nivel alto' },
    { id: 4, name: 'Muy Alto', color: 'bg-green-500', description: 'Nivel máximo' }
  ]

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

  const createWork = async (workData: Partial<MusicalWork> & Pick<MusicalWork, 'name' | 'composer'>): Promise<string> => {
    if (!authStore.user?.uid) throw new Error("Usuario no autenticado.")

    loading.value = true
    try {
      const newWorkData = {
        ...workData,
        // Usar repertorioIds en lugar de projectId para el nuevo modelo de datos
        repertorioIds: currentProject.value?.id ? [currentProject.value.id] : [],
        createdBy: authStore.user.uid,
        // Usamos el UID del usuario como sessionId
        sessionId: authStore.user.uid,
        instruments: workData.instruments?.length ? workData.instruments : getDefaultInstruments(),
        levels: workData.levels?.length ? workData.levels : defaultLevels,
      }

      // Ya no se pasa projectId como primer parámetro
      const docId = await montajeService.crearObra(newWorkData as any)
      // After successful creation, reload works to update the list
      await loadWorks()
      return docId
    } catch (error) {
      console.error("Error creando la obra:", error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const loadWorks = async () => {
    loading.value = true
    try {
      // Ya no necesitamos pasar el projectId
      const allWorks = await montajeService.obtenerObras()
      
      console.log('Obras obtenidas de Firestore:', allWorks)
      
      // Verificamos que tengamos obras
      if (allWorks.length === 0) {
        console.log('No se encontraron obras en Firestore')
        works.value = []
        return
      }
      
      // Si hay un proyecto seleccionado, filtramos las obras que pertenecen a ese proyecto
      if (currentProject.value?.id) {
        // Compatibilidad con modelo antiguo (projectId) y nuevo (repertorioIds)
        works.value = allWorks.filter(work => 
          work.repertorioIds?.includes(currentProject.value!.id) || 
          work.projectId === currentProject.value!.id
        )
        console.log('Obras filtradas por proyecto:', works.value)
      } else {
        works.value = allWorks
        console.log('Mostrando todas las obras:', works.value)
      }
    } catch (error) {
      console.error("Error cargando las obras:", error)
    } finally {
      loading.value = false
    }
  }

  const loadWork = async (workId: string) => {
    loading.value = true
    try {
      // Ya no necesitamos pasar el projectId
      const work = await montajeService.obtenerObra(workId)
      if (work) {
        currentWork.value = work
      }
    } catch (error) {
      console.error("Error cargando la obra:", error)
    } finally {
      loading.value = false
    }
  }

  const updateWork = async (work: MusicalWork) => {
    loading.value = true
    try {
      // Ya no necesitamos pasar el projectId
      await montajeService.actualizarObra(work.id, work)
      // Update local array after successful update
      const index = works.value.findIndex(w => w.id === work.id)
      if (index !== -1) works.value[index] = work
      if (currentWork.value?.id === work.id) currentWork.value = work
    } catch (error) {
      console.error("Error actualizando obra:", error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const deleteWork = async (workId: string) => {
    loading.value = true
    try {
      // Ya no necesitamos pasar el projectId
      await montajeService.eliminarObra(workId)
      works.value = works.value.filter(w => w.id !== workId)
      if (currentWork.value?.id === workId) currentWork.value = null
    } catch (error) {
      console.error("Error eliminando obra:", error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateLevelConfig = async (workId: string, levels: LevelConfig[]) => {
    const work = works.value.find(w => w.id === workId)
    if (work) {
      work.levels = levels
      await updateWork(work)
    }
  }

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