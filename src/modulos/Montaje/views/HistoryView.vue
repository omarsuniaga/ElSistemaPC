<template>
  <div class="history-view">
    <!-- Header -->
    <div class="view-header">
      <div class="header-content">
        <h1 class="view-title">Historial y Versiones</h1>
        <p class="view-description">
          Explora el historial de cambios y gestiona versiones de tus obras
        </p>
      </div>
      <div class="header-actions">
        <button @click="createSnapshot" class="btn-primary">
          <i class="fas fa-camera"></i>
          Crear Snapshot
        </button>
        <button @click="exportHistory" class="btn-secondary">
          <i class="fas fa-download"></i>
          Exportar Historial
        </button>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="filters-section">
      <div class="filters-grid">
        <div class="filter-group">
          <label>Obra</label>
          <select v-model="filters.workId" class="form-select">
            <option value="">Todas las obras</option>
            <option 
              v-for="work in availableWorks"
              :key="work.id"
              :value="work.id"
            >
              {{ work.title }}
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label>Tipo de cambio</label>
          <select v-model="filters.changeType" class="form-select">
            <option value="">Todos los tipos</option>
            <option value="CREATE">Creación</option>
            <option value="UPDATE">Actualización</option>
            <option value="DELETE">Eliminación</option>
            <option value="VERSION">Nueva versión</option>
            <option value="RESTORE">Restauración</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Usuario</label>
          <select v-model="filters.userId" class="form-select">
            <option value="">Todos los usuarios</option>
            <option 
              v-for="user in users"
              :key="user.id"
              :value="user.id"
            >
              {{ user.name }}
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label>Período</label>
          <div class="date-range">
            <input 
              v-model="filters.startDate"
              type="date"
              class="form-input"
            >
            <span>a</span>
            <input 
              v-model="filters.endDate"
              type="date"
              class="form-input"
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Timeline View Toggle -->
    <div class="view-controls">
      <div class="view-toggle">
        <button 
          @click="viewMode = 'timeline'"
          :class="{ active: viewMode === 'timeline' }"
          class="toggle-btn"
        >
          <i class="fas fa-stream"></i>
          Timeline
        </button>
        <button 
          @click="viewMode = 'versions'"
          :class="{ active: viewMode === 'versions' }"
          class="toggle-btn"
        >
          <i class="fas fa-code-branch"></i>
          Versiones
        </button>
        <button 
          @click="viewMode = 'snapshots'"
          :class="{ active: viewMode === 'snapshots' }"
          class="toggle-btn"
        >
          <i class="fas fa-camera"></i>
          Snapshots
        </button>
      </div>
      <div class="view-options">
        <button 
          @click="showCompareTool = true"
          :disabled="selectedItems.length !== 2"
          class="btn-secondary"
        >
          <i class="fas fa-exchange-alt"></i>
          Comparar
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando historial...</p>
    </div>

    <!-- Timeline View -->
    <div v-else-if="viewMode === 'timeline'" class="timeline-view">
      <div class="timeline">
        <div 
          v-for="(entry, index) in filteredHistory"
          :key="entry.id"
          class="timeline-entry"
          :class="{ 'selected': selectedItems.includes(entry.id) }"
          @click="toggleSelection(entry.id)"
        >
          <!-- Date separator -->
          <div 
            v-if="index === 0 || !isSameDay(entry.timestamp, filteredHistory[index - 1].timestamp)"
            class="date-separator"
          >
            {{ formatDateHeader(entry.timestamp) }}
          </div>
          
          <div class="timeline-item">
            <div class="timeline-marker" :class="`marker-${entry.type.toLowerCase()}`">
              <i :class="getChangeIcon(entry.type)"></i>
            </div>
            <div class="timeline-content">
              <div class="timeline-header">
                <h4 class="timeline-title">{{ entry.title }}</h4>
                <div class="timeline-meta">
                  <span class="timeline-user">{{ entry.user.name }}</span>
                  <span class="timeline-time">{{ formatTime(entry.timestamp) }}</span>
                </div>
              </div>
              <p class="timeline-description">{{ entry.description }}</p>
              <div v-if="entry.work" class="timeline-work">
                <i class="fas fa-music"></i>
                {{ entry.work.title }}
              </div>
              <div class="timeline-actions">
                <button 
                  @click.stop="viewDetails(entry)"
                  class="action-btn"
                >
                  Ver detalles
                </button>
                <button 
                  v-if="entry.type === 'UPDATE' || entry.type === 'VERSION'"
                  @click.stop="restoreVersion(entry)"
                  class="action-btn"
                >
                  Restaurar
                </button>
                <button 
                  @click.stop="downloadSnapshot(entry)"
                  class="action-btn"
                >
                  Descargar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Versions View -->
    <div v-else-if="viewMode === 'versions'" class="versions-view">
      <div class="versions-grid">
        <div 
          v-for="version in filteredVersions"
          :key="version.id"
          class="version-card"
          :class="{ 'selected': selectedItems.includes(version.id) }"
          @click="toggleSelection(version.id)"
        >
          <div class="version-header">
            <div class="version-info">
              <h4>{{ version.title }}</h4>
              <span class="version-number">v{{ version.version }}</span>
            </div>
            <div class="version-status">
              <span 
                v-if="version.isCurrent"
                class="status-badge current"
              >
                Actual
              </span>
              <span 
                v-else-if="version.isStable"
                class="status-badge stable"
              >
                Estable
              </span>
            </div>
          </div>
          
          <p class="version-description">{{ version.description }}</p>
          
          <div class="version-meta">
            <div class="version-user">
              <img 
                v-if="version.user.avatar"
                :src="version.user.avatar"
                :alt="version.user.name"
                class="user-avatar"
              >
              <span class="user-name">{{ version.user.name }}</span>
            </div>
            <span class="version-date">{{ formatDate(version.createdAt) }}</span>
          </div>
          
          <div class="version-stats">
            <div class="stat">
              <i class="fas fa-edit"></i>
              <span>{{ version.changesCount }} cambios</span>
            </div>
            <div class="stat">
              <i class="fas fa-file"></i>
              <span>{{ version.filesCount }} archivos</span>
            </div>
          </div>
          
          <div class="version-actions">
            <button @click.stop="previewVersion(version)" class="btn-small">
              Vista previa
            </button>
            <button 
              v-if="!version.isCurrent"
              @click.stop="restoreVersion(version)"
              class="btn-small"
            >
              Restaurar
            </button>
            <button @click.stop="downloadVersion(version)" class="btn-small">
              Descargar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Snapshots View -->
    <div v-else-if="viewMode === 'snapshots'" class="snapshots-view">
      <div class="snapshots-grid">
        <div 
          v-for="snapshot in filteredSnapshots"
          :key="snapshot.id"
          class="snapshot-card"
          :class="{ 'selected': selectedItems.includes(snapshot.id) }"
          @click="toggleSelection(snapshot.id)"
        >
          <div class="snapshot-preview">
            <img 
              v-if="snapshot.thumbnail"
              :src="snapshot.thumbnail"
              :alt="snapshot.title"
              class="snapshot-image"
            >
            <div v-else class="snapshot-placeholder">
              <i class="fas fa-camera"></i>
            </div>
          </div>
          
          <div class="snapshot-content">
            <h4 class="snapshot-title">{{ snapshot.title }}</h4>
            <p class="snapshot-description">{{ snapshot.description }}</p>
            
            <div class="snapshot-meta">
              <span class="snapshot-user">{{ snapshot.user.name }}</span>
              <span class="snapshot-date">{{ formatDate(snapshot.createdAt) }}</span>
            </div>
            
            <div class="snapshot-tags">
              <span 
                v-for="tag in snapshot.tags"
                :key="tag"
                class="tag"
              >
                {{ tag }}
              </span>
            </div>
            
            <div class="snapshot-actions">
              <button @click.stop="viewSnapshot(snapshot)" class="btn-small">
                Ver
              </button>
              <button @click.stop="restoreSnapshot(snapshot)" class="btn-small">
                Restaurar
              </button>
              <button @click.stop="deleteSnapshot(snapshot)" class="btn-small danger">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && filteredItems.length === 0" class="empty-state">
      <i class="fas fa-history"></i>
      <h3>No hay historial disponible</h3>
      <p>No se encontraron registros para los filtros seleccionados</p>
    </div>

    <!-- Compare Tool Modal -->
    <div v-if="showCompareTool" class="modal-overlay" @click="closeCompareTool">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h3>Comparar Versiones</h3>
          <button @click="closeCompareTool" class="btn-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="compare-content">
          <div class="compare-info">
            <div class="compare-item">
              <h4>Versión A</h4>
              <p>{{ getSelectedItem(selectedItems[0])?.title }}</p>
              <span>{{ formatDate(getSelectedItem(selectedItems[0])?.timestamp) }}</span>
            </div>
            <div class="compare-separator">
              <i class="fas fa-exchange-alt"></i>
            </div>
            <div class="compare-item">
              <h4>Versión B</h4>
              <p>{{ getSelectedItem(selectedItems[1])?.title }}</p>
              <span>{{ formatDate(getSelectedItem(selectedItems[1])?.timestamp) }}</span>
            </div>
          </div>
          
          <div class="compare-diff">
            <div class="diff-section">
              <h4>Cambios</h4>
              <div class="diff-content">
                <!-- Diff visualization would go here -->
                <p class="placeholder">La comparación detallada se mostraría aquí</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="closeCompareTool" class="btn-secondary">
            Cerrar
          </button>
          <button @click="exportComparison" class="btn-primary">
            Exportar Comparación
          </button>
        </div>
      </div>
    </div>

    <!-- Details Modal -->
    <div v-if="showDetailsModal" class="modal-overlay" @click="closeDetailsModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Detalles del Cambio</h3>
          <button @click="closeDetailsModal" class="btn-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div v-if="selectedEntry" class="details-content">
          <div class="detail-item">
            <label>Título:</label>
            <span>{{ selectedEntry.title }}</span>
          </div>
          <div class="detail-item">
            <label>Tipo:</label>
            <span class="change-type" :class="`type-${selectedEntry.type.toLowerCase()}`">
              {{ getChangeTypeLabel(selectedEntry.type) }}
            </span>
          </div>
          <div class="detail-item">
            <label>Usuario:</label>
            <span>{{ selectedEntry.user.name }}</span>
          </div>
          <div class="detail-item">
            <label>Fecha:</label>
            <span>{{ formatFullDate(selectedEntry.timestamp) }}</span>
          </div>
          <div class="detail-item">
            <label>Descripción:</label>
            <p>{{ selectedEntry.description }}</p>
          </div>
          <div v-if="selectedEntry.changes" class="detail-item">
            <label>Cambios específicos:</label>
            <ul class="changes-list">
              <li 
                v-for="change in selectedEntry.changes"
                :key="change.field"
              >
                <strong>{{ change.field }}:</strong>
                <span class="old-value">{{ change.oldValue }}</span>
                →
                <span class="new-value">{{ change.newValue }}</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="closeDetailsModal" class="btn-secondary">
            Cerrar
          </button>
          <button 
            v-if="selectedEntry?.type === 'UPDATE' || selectedEntry?.type === 'VERSION'"
            @click="restoreVersion(selectedEntry)"
            class="btn-primary"
          >
            Restaurar esta versión
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useHistoryTracker } from '../composables/useHistoryTracker'
import type { 
  HistoryEntry, 
  Version, 
  Snapshot, 
  Work, 
  User 
} from '../types'

const {
  history,
  versions,
  snapshots,
  users,
  availableWorks,
  loading,
  createHistorySnapshot,
  restoreToVersion,
  exportHistoryData
} = useHistoryTracker()

// State
const viewMode = ref<'timeline' | 'versions' | 'snapshots'>('timeline')
const selectedItems = ref<string[]>([])
const showCompareTool = ref(false)
const showDetailsModal = ref(false)
const selectedEntry = ref<HistoryEntry | null>(null)

// Filters
const filters = ref({
  workId: '',
  changeType: '',
  userId: '',
  startDate: '',
  endDate: ''
})

// Computed
const filteredHistory = computed(() => {
  let result = history.value

  if (filters.value.workId) {
    result = result.filter(entry => entry.workId === filters.value.workId)
  }

  if (filters.value.changeType) {
    result = result.filter(entry => entry.type === filters.value.changeType)
  }

  if (filters.value.userId) {
    result = result.filter(entry => entry.userId === filters.value.userId)
  }

  if (filters.value.startDate) {
    result = result.filter(entry => 
      new Date(entry.timestamp) >= new Date(filters.value.startDate)
    )
  }

  if (filters.value.endDate) {
    result = result.filter(entry => 
      new Date(entry.timestamp) <= new Date(filters.value.endDate)
    )
  }

  return result.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
})

const filteredVersions = computed(() => {
  let result = versions.value

  if (filters.value.workId) {
    result = result.filter(version => version.workId === filters.value.workId)
  }

  if (filters.value.userId) {
    result = result.filter(version => version.userId === filters.value.userId)
  }

  return result.sort((a, b) => b.version - a.version)
})

const filteredSnapshots = computed(() => {
  let result = snapshots.value

  if (filters.value.workId) {
    result = result.filter(snapshot => snapshot.workId === filters.value.workId)
  }

  if (filters.value.userId) {
    result = result.filter(snapshot => snapshot.userId === filters.value.userId)
  }

  return result.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
})

const filteredItems = computed(() => {
  switch (viewMode.value) {
    case 'timeline':
      return filteredHistory.value
    case 'versions':
      return filteredVersions.value
    case 'snapshots':
      return filteredSnapshots.value
    default:
      return []
  }
})

// Methods
const createSnapshot = async () => {
  try {
    await createHistorySnapshot({
      title: `Snapshot ${new Date().toLocaleDateString()}`,
      description: 'Snapshot manual del estado actual'
    })
  } catch (error) {
    console.error('Error creating snapshot:', error)
  }
}

const exportHistory = async () => {
  try {
    await exportHistoryData({
      format: 'JSON',
      includeSnapshots: true,
      dateRange: {
        start: filters.value.startDate,
        end: filters.value.endDate
      }
    })
  } catch (error) {
    console.error('Error exporting history:', error)
  }
}

const toggleSelection = (itemId: string) => {
  const index = selectedItems.value.indexOf(itemId)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  } else {
    if (selectedItems.value.length < 2) {
      selectedItems.value.push(itemId)
    } else {
      selectedItems.value = [itemId]
    }
  }
}

const viewDetails = (entry: HistoryEntry) => {
  selectedEntry.value = entry
  showDetailsModal.value = true
}

const restoreVersion = async (item: HistoryEntry | Version) => {
  try {
    await restoreToVersion(item.id)
    selectedItems.value = []
  } catch (error) {
    console.error('Error restoring version:', error)
  }
}

const previewVersion = (version: Version) => {
  // Implementation for version preview
  console.log('Preview version:', version.id)
}

const downloadVersion = (version: Version) => {
  // Implementation for version download
  console.log('Download version:', version.id)
}

const downloadSnapshot = (entry: HistoryEntry) => {
  // Implementation for snapshot download
  console.log('Download snapshot:', entry.id)
}

const viewSnapshot = (snapshot: Snapshot) => {
  // Implementation for snapshot view
  console.log('View snapshot:', snapshot.id)
}

const restoreSnapshot = async (snapshot: Snapshot) => {
  try {
    await restoreToVersion(snapshot.id)
  } catch (error) {
    console.error('Error restoring snapshot:', error)
  }
}

const deleteSnapshot = async (snapshot: Snapshot) => {
  // Implementation for snapshot deletion
  console.log('Delete snapshot:', snapshot.id)
}

const getSelectedItem = (itemId: string) => {
  return [...history.value, ...versions.value, ...snapshots.value]
    .find(item => item.id === itemId)
}

const closeCompareTool = () => {
  showCompareTool.value = false
  selectedItems.value = []
}

const closeDetailsModal = () => {
  showDetailsModal.value = false
  selectedEntry.value = null
}

const exportComparison = () => {
  // Implementation for comparison export
  console.log('Export comparison')
}

// Utility functions
const isSameDay = (date1: string, date2: string) => {
  const d1 = new Date(date1).toDateString()
  const d2 = new Date(date2).toDateString()
  return d1 === d2
}

const formatDateHeader = (date: string) => {
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  const dateStr = new Date(date).toDateString()

  if (dateStr === today) return 'Hoy'
  if (dateStr === yesterday) return 'Ayer'
  
  return new Date(date).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatTime = (date: string) => {
  return new Date(date).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatFullDate = (date: string) => {
  return new Date(date).toLocaleString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getChangeIcon = (type: string) => {
  const icons: Record<string, string> = {
    CREATE: 'fas fa-plus',
    UPDATE: 'fas fa-edit',
    DELETE: 'fas fa-trash',
    VERSION: 'fas fa-code-branch',
    RESTORE: 'fas fa-undo'
  }
  return icons[type] || 'fas fa-info-circle'
}

const getChangeTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    CREATE: 'Creación',
    UPDATE: 'Actualización',
    DELETE: 'Eliminación',
    VERSION: 'Nueva versión',
    RESTORE: 'Restauración'
  }
  return labels[type] || type
}

onMounted(() => {
  // Data is loaded through composables
})
</script>

<style scoped>
.history-view {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
}

.header-content {
  flex: 1;
}

.view-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.view-description {
  color: #6b7280;
  margin: 0;
  font-size: 1.1rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.filters-section {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-range span {
  color: #6b7280;
  font-size: 0.875rem;
}

.view-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: white;
  padding: 1rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
}

.toggle-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.toggle-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.toggle-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.view-options {
  display: flex;
  gap: 0.75rem;
}

.loading-state {
  text-align: center;
  padding: 3rem 1rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.timeline-view {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.date-separator {
  font-weight: 600;
  color: #374151;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1rem;
  text-transform: uppercase;
  font-size: 0.875rem;
  letter-spacing: 0.05em;
}

.timeline-entry {
  cursor: pointer;
  transition: all 0.2s;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 2px solid transparent;
}

.timeline-entry:hover {
  background: #f9fafb;
}

.timeline-entry.selected {
  border-color: #3b82f6;
  background: #eff6ff;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.timeline-marker {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: white;
  flex-shrink: 0;
}

.marker-create {
  background: #10b981;
}

.marker-update {
  background: #3b82f6;
}

.marker-delete {
  background: #ef4444;
}

.marker-version {
  background: #8b5cf6;
}

.marker-restore {
  background: #f59e0b;
}

.timeline-content {
  flex: 1;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.timeline-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.timeline-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.timeline-description {
  color: #6b7280;
  margin: 0 0 0.75rem 0;
  line-height: 1.5;
}

.timeline-work {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #3b82f6;
  margin-bottom: 0.75rem;
}

.timeline-actions {
  display: flex;
  gap: 0.75rem;
}

.action-btn {
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.25rem 0;
  transition: color 0.2s;
}

.action-btn:hover {
  color: #2563eb;
  text-decoration: underline;
}

.versions-grid,
.snapshots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.version-card,
.snapshot-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.version-card:hover,
.snapshot-card:hover {
  border-color: #3b82f6;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.version-card.selected,
.snapshot-card.selected {
  border-color: #3b82f6;
  background: #eff6ff;
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.version-info h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.version-number {
  font-size: 0.875rem;
  color: #6b7280;
  font-family: monospace;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.current {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.stable {
  background: #dbeafe;
  color: #1e40af;
}

.version-description {
  color: #6b7280;
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.version-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.version-user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name {
  color: #374151;
  font-weight: 500;
}

.version-date {
  color: #6b7280;
}

.version-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.version-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.snapshot-preview {
  margin-bottom: 1rem;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #f3f4f6;
}

.snapshot-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.snapshot-placeholder {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 2rem;
}

.snapshot-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.snapshot-description {
  color: #6b7280;
  margin: 0 0 0.75rem 0;
  line-height: 1.5;
  font-size: 0.875rem;
}

.snapshot-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.snapshot-tags {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.tag {
  padding: 0.125rem 0.5rem;
  background: #f3f4f6;
  border-radius: 9999px;
  font-size: 0.625rem;
  color: #6b7280;
}

.snapshot-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-small {
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid #d1d5db;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-small:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.btn-small.danger {
  border-color: #ef4444;
  color: #ef4444;
}

.btn-small.danger:hover {
  background: #ef4444;
  color: white;
}

.btn-primary,
.btn-secondary {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-secondary:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}

.form-select,
.form-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  color: #6b7280;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #9ca3af;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content.large {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0 1.5rem;
}

.modal-header h3 {
  margin: 0;
  color: #1f2937;
}

.btn-close {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  cursor: pointer;
  color: #6b7280;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.compare-content,
.details-content {
  padding: 1.5rem;
}

.compare-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.compare-item {
  flex: 1;
  text-align: center;
}

.compare-item h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.compare-item p {
  color: #374151;
  margin: 0 0 0.25rem 0;
}

.compare-item span {
  color: #6b7280;
  font-size: 0.875rem;
}

.compare-separator {
  color: #9ca3af;
  font-size: 1.25rem;
}

.diff-section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.diff-content {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  min-height: 200px;
}

.placeholder {
  color: #6b7280;
  font-style: italic;
  text-align: center;
  margin: 0;
}

.detail-item {
  margin-bottom: 1rem;
}

.detail-item label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
}

.detail-item span,
.detail-item p {
  color: #1f2937;
  margin: 0;
}

.change-type {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.type-create {
  background: #d1fae5;
  color: #065f46;
}

.type-update {
  background: #dbeafe;
  color: #1e40af;
}

.type-delete {
  background: #fee2e2;
  color: #991b1b;
}

.type-version {
  background: #ede9fe;
  color: #6b21a8;
}

.type-restore {
  background: #fef3c7;
  color: #92400e;
}

.changes-list {
  margin: 0;
  padding-left: 1rem;
}

.changes-list li {
  margin-bottom: 0.5rem;
  color: #374151;
}

.old-value {
  background: #fee2e2;
  color: #991b1b;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-family: monospace;
  font-size: 0.875rem;
}

.new-value {
  background: #d1fae5;
  color: #065f46;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-family: monospace;
  font-size: 0.875rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 0 1.5rem 1.5rem 1.5rem;
}

@media (max-width: 768px) {
  .history-view {
    padding: 1rem;
  }

  .view-header {
    flex-direction: column;
    align-items: stretch;
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }

  .view-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .versions-grid,
  .snapshots-grid {
    grid-template-columns: 1fr;
  }

  .timeline-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .timeline-meta {
    align-items: flex-start;
  }

  .compare-info {
    flex-direction: column;
  }

  .compare-separator {
    transform: rotate(90deg);
  }
}
</style>
