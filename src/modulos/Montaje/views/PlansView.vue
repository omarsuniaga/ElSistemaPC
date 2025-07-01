<template>
  <div class="plans-view">
    <!-- Header -->
    <div class="view-header">
      <div class="header-content">
        <h1 class="view-title">Planes de Montaje</h1>
        <p class="view-description">
          Gestiona los planes de montaje para diferentes períodos y proyectos
        </p>
      </div>
      <div class="header-actions">
        <button class="btn-primary" @click="showCreateModal = true">
          <i class="fas fa-plus" />
          Nuevo Plan
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filters-grid">
        <div class="filter-group">
          <label>Estado</label>
          <select v-model="filters.status" class="form-select">
            <option value="">Todos</option>
            <option value="DRAFT">Borrador</option>
            <option value="ACTIVE">Activo</option>
            <option value="COMPLETED">Completado</option>
            <option value="ARCHIVED">Archivado</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Período</label>
          <select v-model="filters.period" class="form-select">
            <option value="">Todos los períodos</option>
            <option value="2024-1">2024 - Primer Semestre</option>
            <option value="2024-2">2024 - Segundo Semestre</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Búsqueda</label>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar planes..."
            class="form-input"
          />
        </div>
      </div>
    </div>

    <!-- Plans Grid -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <p>Cargando planes...</p>
    </div>

    <div v-else-if="filteredPlans.length === 0" class="empty-state">
      <i class="fas fa-calendar-alt" />
      <h3>No hay planes disponibles</h3>
      <p>Crea tu primer plan de montaje para comenzar</p>
      <button class="btn-primary" @click="showCreateModal = true">Crear Plan</button>
    </div>

    <div v-else class="plans-grid">
      <PlanCard
        v-for="plan in filteredPlans"
        :key="plan.id"
        :plan="plan"
        @edit="editPlan"
        @delete="deletePlan"
        @view="viewPlan"
      />
    </div>

    <!-- Create/Edit Modal -->
    <PlanFormModal
      v-if="showCreateModal || showEditModal"
      :plan="selectedPlan"
      :is-editing="!!selectedPlan"
      @save="handleSavePlan"
      @cancel="closeModal"
    />

    <!-- Delete Confirmation -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content" @click.stop>
        <h3>Confirmar eliminación</h3>
        <p>¿Estás seguro de que deseas eliminar este plan? Esta acción no se puede deshacer.</p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="closeDeleteModal">Cancelar</button>
          <button class="btn-danger" @click="confirmDelete">Eliminar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {useRouter} from "vue-router"
import {useMontaje} from "../composables/useMontaje"
import type {Plan} from "../types"
import PlanCard from "../components/PlanCard.vue"
import PlanFormModal from "../components/PlanFormModal.vue"

const router = useRouter()
const {plans, loading, createPlan, updatePlan, deletePlan: removePlan} = useMontaje()

// State
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedPlan = ref<Plan | null>(null)
const planToDelete = ref<Plan | null>(null)
const searchQuery = ref("")

// Filters
const filters = ref({
  status: "",
  period: "",
})

// Computed
const filteredPlans = computed(() => {
  let result = plans.value

  if (filters.value.status) {
    result = result.filter((plan) => plan.status === filters.value.status)
  }

  if (filters.value.period) {
    result = result.filter((plan) => plan.period === filters.value.period)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (plan) =>
        plan.title.toLowerCase().includes(query) || plan.description.toLowerCase().includes(query)
    )
  }

  return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
})

// Methods
const editPlan = (plan: Plan) => {
  selectedPlan.value = plan
  showEditModal.value = true
}

const viewPlan = (plan: Plan) => {
  router.push(`/montaje/planes/${plan.id}`)
}

const deletePlan = (plan: Plan) => {
  planToDelete.value = plan
  showDeleteModal.value = true
}

const handleSavePlan = async (planData: Partial<Plan>) => {
  try {
    if (selectedPlan.value) {
      await updatePlan(selectedPlan.value.id, planData)
    } else {
      await createPlan(planData)
    }
    closeModal()
  } catch (error) {
    console.error("Error saving plan:", error)
  }
}

const confirmDelete = async () => {
  if (planToDelete.value) {
    try {
      await removePlan(planToDelete.value.id)
      closeDeleteModal()
    } catch (error) {
      console.error("Error deleting plan:", error)
    }
  }
}

const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  selectedPlan.value = null
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  planToDelete.value = null
}

onMounted(() => {
  // Plans are loaded through the composable
})
</script>

<style scoped>
.plans-view {
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

.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.loading-state .spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.empty-state i {
  font-size: 3rem;
  color: #9ca3af;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: #6b7280;
  margin: 0 0 1.5rem 0;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.btn-primary,
.btn-secondary,
.btn-danger {
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

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
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
  padding: 2rem;
  border-radius: 0.75rem;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-content h3 {
  margin: 0 0 1rem 0;
  color: #1f2937;
}

.modal-content p {
  margin: 0 0 1.5rem 0;
  color: #6b7280;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .plans-view {
    padding: 1rem;
  }

  .view-header {
    flex-direction: column;
    align-items: stretch;
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }

  .plans-grid {
    grid-template-columns: 1fr;
  }
}
</style>
