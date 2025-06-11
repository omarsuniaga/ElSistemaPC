import { ref, computed } from 'vue'
import type { 
  HistorialCambio, 
  TipoCambio, 
  Obra, 
  Plan, 
  Frase,
  ControlVersion 
} from '../types'
import { montajeService } from '../service/montajeService'

export function useHistoryTracker() {
  const historyRecords = ref<HistorialCambio[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Filtros
  const filterType = ref<TipoCambio | ''>('')
  const filterDateFrom = ref('')
  const filterDateTo = ref('')
  const filterUser = ref('')
  const searchQuery = ref('')

  const filteredHistory = computed(() => {
    return historyRecords.value.filter(record => {
      const matchesType = !filterType.value || record.tipoCambio === filterType.value
      const matchesDateFrom = !filterDateFrom.value || 
        new Date(record.fechaCambio) >= new Date(filterDateFrom.value)
      const matchesDateTo = !filterDateTo.value || 
        new Date(record.fechaCambio) <= new Date(filterDateTo.value)
      const matchesUser = !filterUser.value || 
        record.usuario.toLowerCase().includes(filterUser.value.toLowerCase())
      const matchesSearch = !searchQuery.value ||
        record.descripcion.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        record.entidadTipo.toLowerCase().includes(searchQuery.value.toLowerCase())

      return matchesType && matchesDateFrom && matchesDateTo && matchesUser && matchesSearch
    })
  })

  const groupedHistory = computed(() => {
    const groups: { [key: string]: HistorialCambio[] } = {}
    
    filteredHistory.value.forEach(record => {
      const date = new Date(record.fechaCambio).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(record)
    })

    return Object.entries(groups)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([date, records]) => ({
        date,
        records: records.sort((a, b) => 
          new Date(b.fechaCambio).getTime() - new Date(a.fechaCambio).getTime()
        )
      }))
  })

  const loadHistory = async (
    entidadId?: string, 
    entidadTipo?: string,
    limit = 100
  ) => {
    loading.value = true
    error.value = null

    try {
      historyRecords.value = await montajeService.getHistorialCambios(
        entidadId, 
        entidadTipo, 
        limit
      )
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error loading history'
      console.error('Error loading history:', err)
    } finally {
      loading.value = false
    }
  }

  const trackChange = async (
    entidadId: string,
    entidadTipo: string,
    tipoCambio: TipoCambio,
    descripcion: string,
    detalles?: any,
    usuario?: string
  ) => {
    try {
      const cambio: Omit<HistorialCambio, 'id'> = {
        entidadId,
        entidadTipo,
        tipoCambio,
        descripcion,
        detalles,
        usuario: usuario || 'Sistema', // Obtener del contexto de auth
        fechaCambio: new Date()
      }

      const newRecord = await montajeService.createHistorialCambio(cambio)
      historyRecords.value.unshift(newRecord)
      
      return newRecord
    } catch (err) {
      console.error('Error tracking change:', err)
      throw err
    }
  }

  const getEntityHistory = async (entidadId: string) => {
    return historyRecords.value.filter(record => record.entidadId === entidadId)
  }

  const getUserActivity = async (usuario: string, dateFrom?: Date, dateTo?: Date) => {
    const userRecords = historyRecords.value.filter(record => {
      const matchesUser = record.usuario === usuario
      const matchesDateFrom = !dateFrom || new Date(record.fechaCambio) >= dateFrom
      const matchesDateTo = !dateTo || new Date(record.fechaCambio) <= dateTo
      
      return matchesUser && matchesDateFrom && matchesDateTo
    })

    return userRecords.sort((a, b) => 
      new Date(b.fechaCambio).getTime() - new Date(a.fechaCambio).getTime()
    )
  }

  const getChangeStats = computed(() => {
    const stats = {
      total: historyRecords.value.length,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      byType: {} as { [key in TipoCambio]: number },
      byUser: {} as { [key: string]: number }
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000))
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    historyRecords.value.forEach(record => {
      const recordDate = new Date(record.fechaCambio)
      
      if (recordDate >= today) stats.today++
      if (recordDate >= weekStart) stats.thisWeek++
      if (recordDate >= monthStart) stats.thisMonth++

      stats.byType[record.tipoCambio] = (stats.byType[record.tipoCambio] || 0) + 1
      stats.byUser[record.usuario] = (stats.byUser[record.usuario] || 0) + 1
    })

    return stats
  })

  const exportHistory = (format: 'csv' | 'json' = 'csv') => {
    if (format === 'csv') {
      const headers = ['Fecha', 'Usuario', 'Tipo', 'Entidad', 'Descripción']
      const rows = filteredHistory.value.map(record => [
        new Date(record.fechaCambio).toLocaleString(),
        record.usuario,
        record.tipoCambio,
        record.entidadTipo,
        record.descripcion
      ])

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `historial_montaje_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const jsonContent = JSON.stringify(filteredHistory.value, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `historial_montaje_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const clearFilters = () => {
    filterType.value = ''
    filterDateFrom.value = ''
    filterDateTo.value = ''
    filterUser.value = ''
    searchQuery.value = ''
  }

  return {
    // State
    historyRecords,
    loading,
    error,
    
    // Filters
    filterType,
    filterDateFrom,
    filterDateTo,
    filterUser,
    searchQuery,
    
    // Computed
    filteredHistory,
    groupedHistory,
    getChangeStats,
    
    // Methods
    loadHistory,
    trackChange,
    getEntityHistory,
    getUserActivity,
    exportHistory,
    clearFilters
  }
}

export function useVersionControl() {
  const versions = ref<ControlVersion[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const createVersion = async (
    entidadId: string,
    entidadTipo: string,
    datos: any,
    descripcion: string,
    usuario?: string
  ) => {
    loading.value = true
    error.value = null

    try {
      const version: Omit<ControlVersion, 'id'> = {
        entidadId,
        entidadTipo,
        numeroVersion: await getNextVersionNumber(entidadId),
        datos,
        descripcion,
        usuario: usuario || 'Sistema',
        fechaCreacion: new Date()
      }

      const newVersion = await montajeService.createVersion(version)
      versions.value.unshift(newVersion)
      
      return newVersion
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error creating version'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getVersions = async (entidadId: string) => {
    loading.value = true
    error.value = null

    try {
      versions.value = await montajeService.getVersiones(entidadId)
      return versions.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error loading versions'
      throw err
    } finally {
      loading.value = false
    }
  }

  const restoreVersion = async (versionId: string) => {
    try {
      const version = versions.value.find(v => v.id === versionId)
      if (!version) {
        throw new Error('Version not found')
      }

      return version.datos
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error restoring version'
      throw err
    }
  }

  const compareVersions = (version1Id: string, version2Id: string) => {
    const v1 = versions.value.find(v => v.id === version1Id)
    const v2 = versions.value.find(v => v.id === version2Id)

    if (!v1 || !v2) {
      throw new Error('One or both versions not found')
    }

    return {
      version1: v1,
      version2: v2,
      differences: findDifferences(v1.datos, v2.datos)
    }
  }

  const getNextVersionNumber = async (entidadId: string): Promise<number> => {
    const entityVersions = versions.value.filter(v => v.entidadId === entidadId)
    if (entityVersions.length === 0) return 1
    
    const maxVersion = Math.max(...entityVersions.map(v => v.numeroVersion))
    return maxVersion + 1
  }

  const findDifferences = (obj1: any, obj2: any, path = ''): Array<{
    path: string
    old: any
    new: any
  }> => {
    const differences: Array<{ path: string, old: any, new: any }> = []

    const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})])

    keys.forEach(key => {
      const currentPath = path ? `${path}.${key}` : key
      const val1 = obj1?.[key]
      const val2 = obj2?.[key]

      if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null) {
        differences.push(...findDifferences(val1, val2, currentPath))
      } else if (val1 !== val2) {
        differences.push({
          path: currentPath,
          old: val1,
          new: val2
        })
      }
    })

    return differences
  }

  return {
    versions,
    loading,
    error,
    createVersion,
    getVersions,
    restoreVersion,
    compareVersions
  }
}
