<!-- src/modulos/Superusuario/views/AuditoriaView.vue -->
<template>
  <div class="auditoria-view">
    <!-- Header -->
    <div class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-lg">
      <h1 class="text-2xl font-bold mb-2">📋 Auditoría del Sistema</h1>
      <p class="text-purple-100">Monitorea todas las actividades y cambios en el sistema</p>
    </div>

    <div class="bg-white rounded-b-lg shadow-lg">
      <!-- Quick Stats -->
      <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">{{ todayLogs }}</div>
            <div class="text-sm text-gray-600">Logs Hoy</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">{{ weekLogs }}</div>
            <div class="text-sm text-gray-600">Esta Semana</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-orange-600">{{ criticalLogs }}</div>
            <div class="text-sm text-gray-600">Críticos</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">{{ totalLogs }}</div>
            <div class="text-sm text-gray-600">Total Logs</div>
          </div>
        </div>
      </div>

      <!-- Filters and Actions -->
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex flex-wrap gap-4 items-center justify-between">
          <div class="flex flex-wrap gap-4">
            <!-- Date Range -->
            <div class="flex items-center space-x-2">
              <label class="text-sm font-medium text-gray-700">Desde:</label>
              <input
                v-model="filters.startDate"
                type="date"
                class="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div class="flex items-center space-x-2">
              <label class="text-sm font-medium text-gray-700">Hasta:</label>
              <input
                v-model="filters.endDate"
                type="date"
                class="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <!-- Action Filter -->
            <select
              v-model="filters.action"
              class="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Todas las acciones</option>
              <option value="LOGIN">Inicios de sesión</option>
              <option value="LOGOUT">Cerrar sesión</option>
              <option value="CREATE">Creaciones</option>
              <option value="UPDATE">Actualizaciones</option>
              <option value="DELETE">Eliminaciones</option>
              <option value="ROLE_CHANGE">Cambios de rol</option>
              <option value="PERMISSION_CHANGE">Cambios de permisos</option>
              <option value="SYSTEM_CONFIG">Configuraciones</option>
            </select>

            <!-- User Filter -->
            <input
              v-model="filters.userEmail"
              type="text"
              placeholder="Filtrar por usuario..."
              class="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />

            <!-- Level Filter -->
            <select
              v-model="filters.level"
              class="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Todos los niveles</option>
              <option value="INFO">Información</option>
              <option value="WARNING">Advertencia</option>
              <option value="ERROR">Error</option>
              <option value="CRITICAL">Crítico</option>
            </select>
          </div>

          <div class="flex space-x-2">
            <button
              class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
              @click="clearFilters"
            >
              🔄 Limpiar
            </button>
            <button
              :disabled="loading"
              class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
              @click="exportLogs"
            >
              📊 Exportar
            </button>
            <button
              :disabled="loading"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
              @click="refreshLogs"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        <span class="ml-2 text-gray-600">Cargando logs de auditoría...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-6 text-center text-red-600">
        ❌ {{ error }}
        <button class="ml-2 text-blue-600 underline" @click="refreshLogs">Reintentar</button>
      </div>

      <!-- Audit Logs -->
      <div v-else class="p-6">
        <div class="space-y-4">
          <div
            v-for="log in paginatedLogs"
            :key="log.id"
            class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-start space-x-4 flex-1">
                <!-- Icon -->
                <div
                  class="w-10 h-10 flex items-center justify-center rounded-full"
                  :class="getLevelColor(log.level)"
                >
                  <span class="text-lg">{{ getActionIcon(log.action) }}</span>
                </div>

                <!-- Content -->
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-1">
                    <h3 class="font-medium text-gray-900">
                      {{ getActionDescription(log.action) }}
                    </h3>
                    <span
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      :class="getLevelBadgeColor(log.level)"
                    >
                      {{ log.level }}
                    </span>
                  </div>

                  <p class="text-sm text-gray-600 mb-2">{{ log.description }}</p>

                  <div class="flex items-center space-x-4 text-xs text-gray-500">
                    <span>👤 {{ log.userEmail || "Sistema" }}</span>
                    <span>🕒 {{ formatDate(log.timestamp) }}</span>
                    <span v-if="log.ipAddress">🌐 {{ log.ipAddress }}</span>
                    <span v-if="log.resource">📄 {{ log.resource }}</span>
                  </div>

                  <!-- Additional Details -->
                  <div v-if="log.details" class="mt-3 p-3 bg-gray-50 rounded-md">
                    <button
                      class="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      @click="toggleDetails(log.id)"
                    >
                      {{ expandedLogs.includes(log.id) ? "▼ Ocultar detalles" : "▶ Ver detalles" }}
                    </button>

                    <div v-if="expandedLogs.includes(log.id)" class="mt-2">
                      <pre class="text-xs text-gray-700 whitespace-pre-wrap">{{
                        JSON.stringify(log.details, null, 2)
                      }}</pre>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex flex-col space-y-1">
                <button
                  class="p-1 text-blue-600 hover:bg-blue-100 rounded"
                  title="Ver detalles completos"
                  @click="viewLogDetails(log)"
                >
                  👁️
                </button>
                <button
                  v-if="log.level === 'ERROR' || log.level === 'CRITICAL'"
                  class="p-1 text-red-600 hover:bg-red-100 rounded"
                  title="Reportar problema"
                  @click="reportIssue(log)"
                >
                  🚨
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="mt-6 flex justify-center">
          <nav class="flex space-x-2">
            <button
              :disabled="currentPage === 1"
              class="px-3 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              @click="currentPage = Math.max(1, currentPage - 1)"
            >
              ← Anterior
            </button>

            <span v-for="page in visiblePages" :key="page">
              <button
                v-if="page !== '...'"
                :class="[
                  'px-3 py-2 text-sm rounded-md',
                  page === currentPage
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200',
                ]"
                @click="currentPage = page"
              >
                {{ page }}
              </button>
              <span v-else class="px-3 py-2 text-sm text-gray-500">...</span>
            </span>

            <button
              :disabled="currentPage === totalPages"
              class="px-3 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              @click="currentPage = Math.min(totalPages, currentPage + 1)"
            >
              Siguiente →
            </button>
          </nav>
        </div>

        <!-- Empty State -->
        <div v-if="filteredLogs.length === 0" class="text-center py-8 text-gray-500">
          <span class="text-4xl">📋</span>
          <p class="text-lg font-medium mt-2">No se encontraron logs</p>
          <p class="text-sm">Intenta ajustar los filtros de búsqueda</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue"

// State
const loading = ref(false)
const error = ref<string | null>(null)
const currentPage = ref(1)
const pageSize = 20
const expandedLogs = ref<string[]>([])

const filters = ref({
  startDate: "",
  endDate: "",
  action: "",
  userEmail: "",
  level: "",
})

// Mock data - in real app this would come from the API
const auditLogs = ref([
  {
    id: "1",
    timestamp: new Date(),
    action: "LOGIN",
    level: "INFO",
    userEmail: "admin@example.com",
    description: "Usuario inició sesión en el sistema",
    ipAddress: "192.168.1.100",
    resource: "auth",
    details: {userAgent: "Mozilla/5.0...", sessionId: "abc123"},
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    action: "ROLE_CHANGE",
    level: "WARNING",
    userEmail: "superuser@example.com",
    description: "Cambio de rol de usuario: juan@example.com de Maestro a Admin",
    ipAddress: "192.168.1.101",
    resource: "users",
    details: {userId: "user123", oldRole: "Maestro", newRole: "Admin"},
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    action: "SYSTEM_CONFIG",
    level: "CRITICAL",
    userEmail: "superuser@example.com",
    description: "Configuración del sistema RBAC modificada",
    ipAddress: "192.168.1.101",
    resource: "rbac_config",
    details: {configKey: "permissions", oldValue: "disabled", newValue: "enabled"},
  },
])

// Computed
const filteredLogs = computed(() => {
  return auditLogs.value.filter((log) => {
    const matchesDateRange =
      (!filters.value.startDate || log.timestamp >= new Date(filters.value.startDate)) &&
      (!filters.value.endDate || log.timestamp <= new Date(filters.value.endDate))
    const matchesAction = !filters.value.action || log.action === filters.value.action
    const matchesUser =
      !filters.value.userEmail ||
      log.userEmail?.toLowerCase().includes(filters.value.userEmail.toLowerCase())
    const matchesLevel = !filters.value.level || log.level === filters.value.level

    return matchesDateRange && matchesAction && matchesUser && matchesLevel
  })
})

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredLogs.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredLogs.value.length / pageSize))

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push("...")
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      pages.push("...")
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push("...")
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push("...")
      pages.push(total)
    }
  }

  return pages
})

const todayLogs = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return auditLogs.value.filter((log) => log.timestamp >= today).length
})

const weekLogs = computed(() => {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return auditLogs.value.filter((log) => log.timestamp >= weekAgo).length
})

const criticalLogs = computed(() => {
  return auditLogs.value.filter((log) => log.level === "CRITICAL" || log.level === "ERROR").length
})

const totalLogs = computed(() => auditLogs.value.length)

// Methods
const getLevelColor = (level: string) => {
  const colors = {
    INFO: "bg-blue-100 text-blue-600",
    WARNING: "bg-yellow-100 text-yellow-600",
    ERROR: "bg-red-100 text-red-600",
    CRITICAL: "bg-red-200 text-red-700",
  }
  return colors[level as keyof typeof colors] || "bg-gray-100 text-gray-600"
}

const getLevelBadgeColor = (level: string) => {
  const colors = {
    INFO: "bg-blue-100 text-blue-800",
    WARNING: "bg-yellow-100 text-yellow-800",
    ERROR: "bg-red-100 text-red-800",
    CRITICAL: "bg-red-200 text-red-900",
  }
  return colors[level as keyof typeof colors] || "bg-gray-100 text-gray-800"
}

const getActionIcon = (action: string) => {
  const icons = {
    LOGIN: "🔐",
    LOGOUT: "🚪",
    CREATE: "➕",
    UPDATE: "✏️",
    DELETE: "🗑️",
    ROLE_CHANGE: "🔄",
    PERMISSION_CHANGE: "🔑",
    SYSTEM_CONFIG: "⚙️",
  }
  return icons[action as keyof typeof icons] || "📝"
}

const getActionDescription = (action: string) => {
  const descriptions = {
    LOGIN: "Inicio de sesión",
    LOGOUT: "Cierre de sesión",
    CREATE: "Creación",
    UPDATE: "Actualización",
    DELETE: "Eliminación",
    ROLE_CHANGE: "Cambio de rol",
    PERMISSION_CHANGE: "Cambio de permisos",
    SYSTEM_CONFIG: "Configuración del sistema",
  }
  return descriptions[action as keyof typeof descriptions] || action
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date)
}

const toggleDetails = (logId: string) => {
  const index = expandedLogs.value.indexOf(logId)
  if (index > -1) {
    expandedLogs.value.splice(index, 1)
  } else {
    expandedLogs.value.push(logId)
  }
}

const viewLogDetails = (log: any) => {
  alert(
    `Detalles completos del log:\n\nID: ${log.id}\nAcción: ${log.action}\nNivel: ${log.level}\nUsuario: ${log.userEmail}\nIP: ${log.ipAddress}\nFecha: ${formatDate(log.timestamp)}\n\nDescripción:\n${log.description}\n\nDetalles:\n${JSON.stringify(log.details, null, 2)}`
  )
}

const reportIssue = (log: any) => {
  if (confirm(`¿Deseas reportar este problema para seguimiento?\n\nLog: ${log.description}`)) {
    console.log("Reportando problema:", log.id)
    alert("Problema reportado exitosamente. Se ha enviado una notificación al equipo de soporte.")
  }
}

const clearFilters = () => {
  filters.value = {
    startDate: "",
    endDate: "",
    action: "",
    userEmail: "",
    level: "",
  }
  currentPage.value = 1
}

const refreshLogs = async () => {
  loading.value = true
  try {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log("✅ Logs actualizados")
  } catch (err) {
    error.value = "Error al cargar logs de auditoría"
    console.error("Error loading audit logs:", err)
  } finally {
    loading.value = false
  }
}

const exportLogs = () => {
  console.log("Exportando logs...")
  // TODO: Implement export functionality
  alert("Funcionalidad de exportación en desarrollo")
}

// Lifecycle
onMounted(() => {
  // Set default date range to last 7 days
  const endDate = new Date()
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  filters.value.startDate = startDate.toISOString().split("T")[0]
  filters.value.endDate = endDate.toISOString().split("T")[0]

  refreshLogs()
})
</script>

<style scoped>
.auditoria-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}
</style>
