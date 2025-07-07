<template>
  <div class="space-y-6">
    <!-- Heat Map Grid -->
    <div class="bg-gray-50 rounded-lg p-4 overflow-x-auto relative">
      <div class="mb-4 text-center text-sm text-gray-600">
        Dimensiones: {{ work.rows }} filas × {{ work.cols }} columnas = {{ work.totalMeasures }} compases (1-{{ work.totalMeasures }})
      </div>
      
      <div 
        class="grid gap-1 mx-auto select-none"
        :style="{ 
          gridTemplateColumns: `repeat(${work.cols}, minmax(0, 1fr))`,
          maxWidth: `${work.cols * 2.5}rem`
        }"
      >
        <div
          v-for="cell in grid"
          :key="cell.id"
          @click="handleCellClick(cell.id, $event)"
          @mousedown="handleCellMouseDown(cell.id, $event)"
          @mouseenter="handleCellMouseEnter(cell.id)"
          :class="getCellClass(cell)"
          class="aspect-square flex items-center justify-center text-xs font-bold text-white text-shadow cursor-pointer border border-gray-300 rounded-sm shadow-sm hover:opacity-80 transition-all duration-200"
          :title="`Compás ${cell.measureNumber} - ${getLevelName(cell.level)}${cell.selected ? ' (Seleccionado)' : ''}`"
          :data-cell-id="cell.id"
        >
          {{ cell.measureNumber }}
        </div>
      </div>

      <!-- Floating Selection Controls -->
      <div 
        v-if="isMultiSelectionMode && selectedCells.size > 0"
        class="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-3"
        :style="{ top: `${floatingMenuPosition.y}px`, left: `${floatingMenuPosition.x}px` }"
      >
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-gray-700">{{ selectedCells.size }} compases seleccionados</span>
          <button 
            @click="exitMultiSelectionMode"
            class="text-gray-500 hover:text-gray-700"
            title="Cerrar selección"
          >
            ✕
          </button>
        </div>
        
        <div class="grid grid-cols-1 gap-2 mb-3">
          <button
            v-for="level in work.levels"
            :key="level.id"
            @click="setSelectedCellsLevel(level.id)"
            class="px-3 py-2 text-white font-bold rounded-lg hover:opacity-80 transition-all duration-200 text-sm flex items-center gap-2"
            :class="level.color"
          >
            <div class="w-4 h-4 rounded-sm" :class="level.color"></div>
            {{ level.name }}
          </button>
        </div>
        
        <div class="flex justify-between">
          <button
            @click="selectAll"
            class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
          >
            Seleccionar todo
          </button>
          <button
            @click="clearSelection"
            class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
          >
            Limpiar selección
          </button>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
      <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h3 class="text-lg font-semibold text-blue-800">Control de Niveles</h3>
        <button
          @click="toggleMultiSelectionMode"
          class="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-md text-sm"
        >
          {{ isMultiSelectionMode ? '🔄 Salir de Multiselección' : '✏️ Activar Multiselección' }}
        </button>
      </div>
      
      <!-- Level selection buttons -->
      <div class="mb-4">
        <h4 class="text-sm font-medium text-blue-700 mb-2">Establecer Nivel:</h4>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          <button
            v-for="level in work.levels"
            :key="level.id"
            @click="setSelectedCellsLevel(level.id)"
            class="px-3 py-2 text-white font-bold rounded-lg hover:opacity-80 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 text-sm"
            :class="level.color"
            :title="level.description"
          >
            {{ level.name }}
          </button>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex flex-wrap gap-2">
        <button
          @click="clearGrid"
          class="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 shadow-md text-sm"
        >
          🗑️ Limpiar Todo
        </button>
      </div>
    </div>

    <!-- Legend -->
    <div class="bg-white rounded-lg p-4 border border-gray-200">
      <h3 class="text-sm font-medium text-gray-700 mb-2">Leyenda de Niveles</h3>
      <div class="flex flex-wrap gap-3">
        <div 
          v-for="level in work.levels" 
          :key="level.id"
          class="flex items-center gap-2"
        >
          <div 
            class="w-6 h-6 rounded-sm border border-gray-300"
            :class="level.color"
          ></div>
          <span class="text-sm text-gray-600">{{ level.name }}</span>
          <span v-if="level.description" class="text-xs text-gray-400">({{ level.description }})</span>
        </div>
      </div>
    </div>

    <!-- Statistics -->
    <div class="bg-white rounded-lg p-4 border border-gray-200">
      <h3 class="text-sm font-medium text-gray-700 mb-3">Estadísticas - {{ instrument.name }}</h3>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-800">{{ stats.total }}</div>
          <div class="text-sm text-gray-500">Total Compases</div>
        </div>
        <div 
          v-for="(level, index) in work.levels" 
          :key="level.id"
          class="text-center"
        >
          <div class="text-2xl font-bold text-gray-800">{{ stats.levels[index] || 0 }}</div>
          <div class="text-sm text-gray-500">
            {{ level.name }} ({{ stats.percentages[index] || 0 }}%)
          </div>
          <div 
            class="w-4 h-4 mx-auto mt-1 rounded-sm"
            :class="level.color"
          ></div>
        </div>
      </div>
    </div>

    <!-- Instructions -->
    <div class="text-center text-sm text-gray-500 space-y-2">
      <p><strong>Clic simple:</strong> Cambia el nivel del compás individual</p>
      <p><strong>Multiselección:</strong> Activa el modo y selecciona múltiples compases</p>
      <p><strong>Arrastrar:</strong> Selecciona múltiples compases arrastrando el cursor</p>
      <p class="text-xs">Los cambios se sincronizan automáticamente</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { MusicalWork, Instrument, GridCell } from '../types/heatmap'

const props = defineProps<{
  work: MusicalWork
  instrument: Instrument
}>()

const loading = ref(false)
const grid = ref<GridCell[]>([])
const selectedCells = ref<Set<string>>(new Set())
const isMultiSelectionMode = ref(false)
const isDragging = ref(false)
const dragStartCell = ref<string | null>(null)

// Floating menu position
const floatingMenuPosition = ref({ x: 0, y: 0 })

// Initialize grid with measure numbers
const initializeGrid = () => {
  const newGrid: GridCell[] = []
  let measureNumber = 1
  
  for (let row = 0; row < props.work.rows; row++) {
    for (let col = 0; col < props.work.cols; col++) {
      newGrid.push({
        id: `${row}-${col}`,
        level: 0, // Start with lowest level
        row,
        col,
        selected: false,
        measureNumber: measureNumber
      })
      measureNumber++
    }
  }
  
  return newGrid
}

// Get color class from work configuration
const getCellClass = (cell: GridCell): string => {
  const levelConfig = props.work.levels.find(l => l.id === cell.level)
  const baseColor = levelConfig?.color || 'bg-gray-500'
  const selectedClass = cell.selected ? 'ring-4 ring-blue-400 ring-opacity-75 scale-105' : ''
  return `${baseColor} ${selectedClass}`
}

// Get level name from work configuration
const getLevelName = (level: number): string => {
  const levelConfig = props.work.levels.find(l => l.id === level)
  return levelConfig?.name || `Nivel ${level}`
}

// Handle cell click
const handleCellClick = (cellId: string, event: MouseEvent) => {
  // If we're in multi-selection mode, handle selection
  if (isMultiSelectionMode.value) {
    toggleCellSelection(cellId)
    updateFloatingMenuPosition(event)
    return
  }
  
  // Otherwise, cycle the cell level
  cycleCellLevel(cellId)
}

// Toggle multi-selection mode
const toggleMultiSelectionMode = () => {
  isMultiSelectionMode.value = !isMultiSelectionMode.value
  
  // Clear selection when exiting multi-selection mode
  if (!isMultiSelectionMode.value) {
    clearSelection()
  }
}

// Exit multi-selection mode
const exitMultiSelectionMode = () => {
  isMultiSelectionMode.value = false
  clearSelection()
}

// Handle cell mouse down (for drag selection)
const handleCellMouseDown = (cellId: string, event: MouseEvent) => {
  if (!isMultiSelectionMode.value) return
  
  // Start drag selection
  isDragging.value = true
  dragStartCell.value = cellId
  
  // Select the cell
  const cell = grid.value.find(c => c.id === cellId)
  if (cell) {
    // Clear previous selection unless Shift is pressed
    if (!event.shiftKey) {
      clearSelection()
    }
    
    selectedCells.value.add(cellId)
    cell.selected = true
  }
  
  // Update floating menu position
  updateFloatingMenuPosition(event)
}

// Handle cell mouse enter (for drag selection)
const handleCellMouseEnter = (cellId: string) => {
  if (!isMultiSelectionMode.value || !isDragging.value || !dragStartCell.value) return
  
  // Select cells between drag start and current cell
  selectCellsBetween(dragStartCell.value, cellId)
}

// Handle document mouse up (end drag selection)
const handleDocumentMouseUp = (event: MouseEvent) => {
  if (isDragging.value) {
    isDragging.value = false
    dragStartCell.value = null
    
    // Update floating menu position
    if (selectedCells.value.size > 0) {
      updateFloatingMenuPosition(event)
    }
  }
}

// Select cells between two cells
const selectCellsBetween = (startCellId: string, endCellId: string) => {
  const startCell = grid.value.find(c => c.id === startCellId)
  const endCell = grid.value.find(c => c.id === endCellId)
  
  if (!startCell || !endCell) return
  
  // Calculate the rectangle to select
  const minRow = Math.min(startCell.row, endCell.row)
  const maxRow = Math.max(startCell.row, endCell.row)
  const minCol = Math.min(startCell.col, endCell.col)
  const maxCol = Math.max(startCell.col, endCell.col)
  
  // Select all cells in the rectangle
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const cell = grid.value.find(c => c.row === row && c.col === col)
      if (cell) {
        selectedCells.value.add(cell.id)
        cell.selected = true
      }
    }
  }
}

// Update floating menu position
const updateFloatingMenuPosition = (event: MouseEvent) => {
  // Position the menu near the mouse but ensure it stays in viewport
  const padding = 10
  const menuWidth = 200
  const menuHeight = 300
  
  let x = event.clientX + padding
  let y = event.clientY + padding
  
  // Adjust if would go off screen
  if (x + menuWidth > window.innerWidth) {
    x = event.clientX - menuWidth - padding
  }
  
  if (y + menuHeight > window.innerHeight) {
    y = event.clientY - menuHeight - padding
  }
  
  // Ensure we don't go negative
  x = Math.max(padding, x)
  y = Math.max(padding, y)
  
  floatingMenuPosition.value = { x, y }
}

// Toggle cell selection
const toggleCellSelection = (cellId: string) => {
  const cell = grid.value.find(c => c.id === cellId)
  if (!cell) return

  if (selectedCells.value.has(cellId)) {
    selectedCells.value.delete(cellId)
    cell.selected = false
  } else {
    selectedCells.value.add(cellId)
    cell.selected = true
  }
}

// Cycle through levels for a single cell
const cycleCellLevel = (cellId: string) => {
  const cell = grid.value.find(c => c.id === cellId)
  if (!cell) return

  const maxLevel = props.work.levels.length - 1
  cell.level = (cell.level + 1) % (maxLevel + 1)
}

// Set level for selected cells
const setSelectedCellsLevel = (level: number) => {
  selectedCells.value.forEach(cellId => {
    const cell = grid.value.find(c => c.id === cellId)
    if (cell) {
      cell.level = level
    }
  })
  
  // Don't clear selection in multi-selection mode
  if (!isMultiSelectionMode.value) {
    clearSelection()
  }
}

// Clear selection
const clearSelection = () => {
  selectedCells.value.clear()
  grid.value.forEach(cell => {
    cell.selected = false
  })
}

// Select all cells
const selectAll = () => {
  selectedCells.value.clear()
  grid.value.forEach(cell => {
    selectedCells.value.add(cell.id)
    cell.selected = true
  })
}

// Clear all levels
const clearGrid = () => {
  grid.value.forEach(cell => {
    cell.level = 0
  })
  clearSelection()
}

// Statistics
const stats = computed(() => {
  const totalCells = grid.value.length
  const levelCounts = props.work.levels.map(level => 
    grid.value.filter(cell => cell.level === level.id).length
  )
  
  return {
    total: totalCells,
    levels: levelCounts,
    percentages: levelCounts.map(count => 
      totalCells > 0 ? Math.round((count / totalCells) * 100) : 0
    )
  }
})

onMounted(() => {
  // Initialize grid
  grid.value = initializeGrid()
  
  // Add document event listeners
  document.addEventListener('mouseup', handleDocumentMouseUp)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      exitMultiSelectionMode()
    }
  })
})

onUnmounted(() => {
  // Remove document event listeners
  document.removeEventListener('mouseup', handleDocumentMouseUp)
})
</script>

<style scoped>
.text-shadow {
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.select-none {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>