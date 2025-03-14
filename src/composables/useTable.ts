import { ref, computed, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import type { 
  TableState, 
  TableColumn, 
  FilterOption, 
  SortOption,
  PaginationState,
  TablePreferences,
  ExportOptions 
} from '../types'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

export function useTable(
  items: any[],
  columns: TableColumn[],
  options = {
    storageKey: '',
    defaultPageSize: 10,
    exportFileName: 'export'
  }
) {
  // State
  const state = ref<TableState>({
    columns: columns.map(col => ({ ...col, visible: true })),
    pageSize: options.defaultPageSize,
    currentPage: 1,
    sortBy: '',
    sortOrder: 'asc',
    filters: {},
    selectedRows: [],
    columnOrder: columns.map(col => col.id)
  })

  // Load saved preferences
  const savedPreferences = useLocalStorage<TablePreferences>(
    `table-preferences-${options.storageKey}`,
    {
      pageSize: options.defaultPageSize,
      visibleColumns: columns.map(col => col.id),
      columnOrder: columns.map(col => col.id),
      defaultSort: {
        key: '',
        order: 'asc'
      },
      filters: {}
    }
  )

  // Apply saved preferences
  if (options.storageKey) {
    state.value.pageSize = savedPreferences.value.pageSize
    state.value.columns = columns.map(col => ({
      ...col,
      visible: savedPreferences.value.visibleColumns.includes(col.id)
    }))
    state.value.columnOrder = savedPreferences.value.columnOrder
    state.value.sortBy = savedPreferences.value.defaultSort.key
    state.value.sortOrder = savedPreferences.value.defaultSort.order
    state.value.filters = savedPreferences.value.filters
  }

  // Computed
  const filteredItems = computed(() => {
    let result = [...items]

    // Apply filters
    Object.entries(state.value.filters).forEach(([key, value]) => {
      if (!value) return

      const column = state.value.columns.find(col => col.key === key)
      if (!column) return

      result = result.filter(item => {
        const itemValue = item[key]
        if (Array.isArray(value)) {
          return value.includes(itemValue)
        }
        if (typeof value === 'string') {
          return itemValue.toLowerCase().includes(value.toLowerCase())
        }
        return itemValue === value
      })
    })

    // Apply sorting
    if (state.value.sortBy) {
      const column = state.value.columns.find(col => col.key === state.value.sortBy)
      if (column) {
        result.sort((a, b) => {
          const aValue = a[column.key]
          const bValue = b[column.key]
          if (aValue < bValue) return state.value.sortOrder === 'asc' ? -1 : 1
          if (aValue > bValue) return state.value.sortOrder === 'asc' ? 1 : -1
          return 0
        })
      }
    }

    return result
  })

  const paginatedItems = computed(() => {
    const start = (state.value.currentPage - 1) * state.value.pageSize
    const end = start + state.value.pageSize
    return filteredItems.value.slice(start, end)
  })

  const pagination = computed<PaginationState>(() => ({
    currentPage: state.value.currentPage,
    pageSize: state.value.pageSize,
    total: filteredItems.value.length
  }))

  const totalPages = computed(() => 
    Math.ceil(filteredItems.value.length / state.value.pageSize)
  )

  const visibleColumns = computed(() => 
    state.value.columnOrder
      .map(id => state.value.columns.find(col => col.id === id))
      .filter((col): col is TableColumn => col !== undefined && col.visible)
  )

  // Methods
  const setPage = (page: number) => {
    state.value.currentPage = Math.max(1, Math.min(page, totalPages.value))
  }

  const setPageSize = (size: number) => {
    state.value.pageSize = size
    state.value.currentPage = 1
    if (options.storageKey) {
      savePreferences()
    }
  }

  const setSort = (key: string) => {
    if (state.value.sortBy === key) {
      state.value.sortOrder = state.value.sortOrder === 'asc' ? 'desc' : 'asc'
    } else {
      state.value.sortBy = key
      state.value.sortOrder = 'asc'
    }
    if (options.storageKey) {
      savePreferences()
    }
  }

  const setFilter = (key: string, value: any) => {
    state.value.filters[key] = value
    state.value.currentPage = 1
    if (options.storageKey) {
      savePreferences()
    }
  }

  const clearFilters = () => {
    state.value.filters = {}
    state.value.currentPage = 1
    if (options.storageKey) {
      savePreferences()
    }
  }

  const toggleColumn = (columnId: string) => {
    const column = state.value.columns.find(col => col.id === columnId)
    if (column) {
      column.visible = !column.visible
      if (options.storageKey) {
        savePreferences()
      }
    }
  }

  const reorderColumns = (newOrder: string[]) => {
    state.value.columnOrder = newOrder
    if (options.storageKey) {
      savePreferences()
    }
  }

  const savePreferences = () => {
    if (!options.storageKey) return

    const preferences: TablePreferences = {
      pageSize: state.value.pageSize,
      visibleColumns: state.value.columns
        .filter(col => col.visible)
        .map(col => col.id),
      columnOrder: state.value.columnOrder,
      defaultSort: {
        key: state.value.sortBy,
        order: state.value.sortOrder
      },
      filters: state.value.filters
    }

    localStorage.setItem(
      `table-preferences-${options.storageKey}`,
      JSON.stringify(preferences)
    )
  }

  const exportData = async (exportOptions: ExportOptions) => {
    const data = filteredItems.value.map(item => {
      const row: Record<string, any> = {}
      visibleColumns.value.forEach(col => {
        if (!exportOptions.columns || exportOptions.columns.includes(col.id)) {
          row[col.label] = col.format ? col.format(item[col.key]) : item[col.key]
        }
      })
      return row
    })

    const fileName = exportOptions.fileName || options.exportFileName

    switch (exportOptions.format) {
      case 'excel':
        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.json_to_sheet(data)
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
        XLSX.writeFile(wb, `${fileName}.xlsx`)
        break

      case 'csv':
        const csv = Papa.unparse(data)
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `${fileName}.csv`
        link.click()
        break

      case 'pdf':
        const doc = new jsPDF()
        const headers = visibleColumns.value.map(col => col.label)
        const rows = data.map(item => headers.map(header => item[header]))
        
        doc.autoTable({
          head: [headers],
          body: rows,
          startY: 20,
          margin: { top: 20 }
        })
        doc.save(`${fileName}.pdf`)
        break
    }
  }

  // Watch for changes that should reset pagination
  watch(
    () => state.value.filters,
    () => {
      state.value.currentPage = 1
    },
    { deep: true }
  )

  return {
    state,
    filteredItems,
    paginatedItems,
    pagination,
    totalPages,
    visibleColumns,
    setPage,
    setPageSize,
    setSort,
    setFilter,
    clearFilters,
    toggleColumn,
    reorderColumns,
    exportData
  }
}