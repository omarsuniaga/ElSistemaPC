<template>
  <div class="plan-detail-view">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <p>Cargando plan...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-triangle" />
      <h3>Error al cargar el plan</h3>
      <p>{{ error }}</p>
      <button class="btn-secondary" @click="$router.go(-1)">Volver</button>
    </div>

    <!-- Plan Content -->
    <div v-else-if="plan" class="plan-content">
      <!-- Header -->
      <div class="plan-header">
        <div class="header-main">
          <button class="btn-back" @click="$router.go(-1)">
            <i class="fas fa-arrow-left" />
            Volver
          </button>
          <div class="plan-info">
            <h1 class="plan-title">{{ plan.title }}</h1>
            <div class="plan-meta">
              <span class="status-badge" :class="`status-${plan.status.toLowerCase()}`">
                {{ getStatusLabel(plan.status) }}
              </span>
              <span class="period">{{ plan.period }}</span>
              <span class="dates">
                {{ formatDate(plan.startDate) }} - {{ formatDate(plan.endDate) }}
              </span>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" @click="showEditModal = true">
            <i class="fas fa-edit" />
            Editar
          </button>
          <button class="btn-primary" @click="exportPlan">
            <i class="fas fa-download" />
            Exportar
          </button>
        </div>
      </div>

      <!-- Plan Description -->
      <div class="plan-section">
        <h2>Descripción</h2>
        <p class="plan-description">{{ plan.description }}</p>
      </div>

      <!-- Progress Overview -->
      <div class="plan-section">
        <h2>Progreso General</h2>
        <div class="progress-overview">
          <div class="progress-card">
            <div class="progress-header">
              <h3>Obras Completadas</h3>
              <span class="progress-value">{{ completedWorks }}/{{ totalWorks }}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{width: `${worksProgress}%`}" />
            </div>
          </div>

          <div class="progress-card">
            <div class="progress-header">
              <h3>Objetivos Alcanzados</h3>
              <span class="progress-value">{{ completedObjectives }}/{{ totalObjectives }}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{width: `${objectivesProgress}%`}" />
            </div>
          </div>
        </div>
      </div>

      <!-- Objectives -->
      <div class="plan-section">
        <div class="section-header">
          <h2>Objetivos</h2>
          <button class="btn-small" @click="showObjectiveModal = true">
            <i class="fas fa-plus" />
            Agregar
          </button>
        </div>
        <div v-if="plan.objectives.length === 0" class="empty-content">
          <p>No hay objetivos definidos</p>
        </div>
        <div v-else class="objectives-list">
          <div
            v-for="objective in plan.objectives"
            :key="objective.id"
            class="objective-item"
            :class="{completed: objective.completed}"
          >
            <div class="objective-content">
              <h4>{{ objective.title }}</h4>
              <p>{{ objective.description }}</p>
              <div class="objective-meta">
                <span class="priority" :class="`priority-${objective.priority.toLowerCase()}`">
                  {{ objective.priority }}
                </span>
                <span class="deadline"> Fecha límite: {{ formatDate(objective.deadline) }} </span>
              </div>
            </div>
            <div class="objective-actions">
              <button
                class="btn-toggle"
                :class="{completed: objective.completed}"
                @click="toggleObjectiveCompletion(objective)"
              >
                <i :class="objective.completed ? 'fas fa-check' : 'far fa-circle'" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Associated Works -->
      <div class="plan-section">
        <div class="section-header">
          <h2>Obras Asociadas</h2>
          <button class="btn-small" @click="showWorksModal = true">
            <i class="fas fa-plus" />
            Asociar Obra
          </button>
        </div>
        <div v-if="associatedWorks.length === 0" class="empty-content">
          <p>No hay obras asociadas a este plan</p>
        </div>
        <div v-else class="works-grid">
          <div
            v-for="work in associatedWorks"
            :key="work.id"
            class="work-card"
            @click="viewWork(work)"
          >
            <div class="work-header">
              <h4>{{ work.title }}</h4>
              <span class="work-status" :class="`status-${work.status.toLowerCase()}`">
                {{ getStatusLabel(work.status) }}
              </span>
            </div>
            <p class="work-composer">{{ work.composer }}</p>
            <div class="work-progress">
              <div class="progress-bar small">
                <div class="progress-fill" :style="{width: `${work.progress}%`}" />
              </div>
              <span class="progress-text">{{ work.progress }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline -->
      <div class="plan-section">
        <h2>Cronograma</h2>
        <div class="timeline">
          <div
            v-for="milestone in plan.milestones"
            :key="milestone.id"
            class="timeline-item"
            :class="{completed: milestone.completed}"
          >
            <div class="timeline-marker">
              <i :class="milestone.completed ? 'fas fa-check' : 'far fa-circle'" />
            </div>
            <div class="timeline-content">
              <h4>{{ milestone.title }}</h4>
              <p>{{ milestone.description }}</p>
              <span class="timeline-date">{{ formatDate(milestone.date) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <PlanFormModal
      v-if="showEditModal"
      :plan="plan"
      :is-editing="true"
      @save="handleUpdatePlan"
      @cancel="showEditModal = false"
    />

    <!-- Objective Modal -->
    <div v-if="showObjectiveModal" class="modal-overlay" @click="closeObjectiveModal">
      <div class="modal-content" @click.stop>
        <h3>Nuevo Objetivo</h3>
        <form @submit.prevent="addObjective">
          <div class="form-group">
            <label>Título</label>
            <input v-model="newObjective.title" type="text" required class="form-input" />
          </div>
          <div class="form-group">
            <label>Descripción</label>
            <textarea v-model="newObjective.description" rows="3" class="form-input" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Prioridad</label>
              <select v-model="newObjective.priority" class="form-select">
                <option value="HIGH">Alta</option>
                <option value="MEDIUM">Media</option>
                <option value="LOW">Baja</option>
              </select>
            </div>
            <div class="form-group">
              <label>Fecha límite</label>
              <input v-model="newObjective.deadline" type="date" required class="form-input" />
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="closeObjectiveModal">
              Cancelar
            </button>
            <button type="submit" class="btn-primary">Agregar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Works Association Modal -->
    <div v-if="showWorksModal" class="modal-overlay" @click="closeWorksModal">
      <div class="modal-content large" @click.stop>
        <h3>Asociar Obras al Plan</h3>
        <div class="works-selection">
          <div
            v-for="work in availableWorks"
            :key="work.id"
            class="work-option"
            :class="{selected: selectedWorks.includes(work.id)}"
            @click="toggleWorkSelection(work.id)"
          >
            <div class="work-info">
              <h4>{{ work.title }}</h4>
              <p>{{ work.composer }}</p>
            </div>
            <div class="work-checkbox">
              <i
                :class="selectedWorks.includes(work.id) ? 'fas fa-check-square' : 'far fa-square'"
              />
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="closeWorksModal">Cancelar</button>
          <button class="btn-primary" @click="associateWorks">Asociar Obras</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {useRoute, useRouter} from "vue-router"
import {useMontaje} from "../composables/useMontaje"
import type {Plan, Objective, Work} from "../types"
import PlanFormModal from "../components/PlanFormModal.vue"

const route = useRoute()
const router = useRouter()
const {
  currentPlan: plan,
  loading,
  error,
  updatePlan,
  getPlanById,
  associatedWorks,
  availableWorks,
} = useMontaje()

// State
const showEditModal = ref(false)
const showObjectiveModal = ref(false)
const showWorksModal = ref(false)
const selectedWorks = ref<string[]>([])

// New objective form
const newObjective = ref<Partial<Objective>>({
  title: "",
  description: "",
  priority: "MEDIUM",
  deadline: "",
  completed: false,
})

// Computed
const completedWorks = computed(
  () => associatedWorks.value.filter((work) => work.status === "COMPLETED").length
)

const totalWorks = computed(() => associatedWorks.value.length)

const worksProgress = computed(() =>
  totalWorks.value > 0 ? (completedWorks.value / totalWorks.value) * 100 : 0
)

const completedObjectives = computed(
  () => plan.value?.objectives.filter((obj) => obj.completed).length ?? 0
)

const totalObjectives = computed(() => plan.value?.objectives.length ?? 0)

const objectivesProgress = computed(() =>
  totalObjectives.value > 0 ? (completedObjectives.value / totalObjectives.value) * 100 : 0
)

// Methods
const handleUpdatePlan = async (planData: Partial<Plan>) => {
  if (plan.value) {
    try {
      await updatePlan(plan.value.id, planData)
      showEditModal.value = false
    } catch (error) {
      console.error("Error updating plan:", error)
    }
  }
}

const toggleObjectiveCompletion = async (objective: Objective) => {
  if (plan.value) {
    const updatedObjectives = plan.value.objectives.map((obj) =>
      obj.id === objective.id ? {...obj, completed: !obj.completed} : obj
    )
    await updatePlan(plan.value.id, {objectives: updatedObjectives})
  }
}

const addObjective = async () => {
  if (plan.value && newObjective.value.title) {
    const objective: Objective = {
      id: Date.now().toString(),
      title: newObjective.value.title,
      description: newObjective.value.description || "",
      priority: newObjective.value.priority as "HIGH" | "MEDIUM" | "LOW",
      deadline: newObjective.value.deadline!,
      completed: false,
    }

    const updatedObjectives = [...plan.value.objectives, objective]
    await updatePlan(plan.value.id, {objectives: updatedObjectives})
    closeObjectiveModal()
  }
}

const closeObjectiveModal = () => {
  showObjectiveModal.value = false
  newObjective.value = {
    title: "",
    description: "",
    priority: "MEDIUM",
    deadline: "",
    completed: false,
  }
}

const toggleWorkSelection = (workId: string) => {
  const index = selectedWorks.value.indexOf(workId)
  if (index > -1) {
    selectedWorks.value.splice(index, 1)
  } else {
    selectedWorks.value.push(workId)
  }
}

const associateWorks = async () => {
  if (plan.value) {
    const updatedWorkIds = [...(plan.value.workIds || []), ...selectedWorks.value]
    await updatePlan(plan.value.id, {workIds: updatedWorkIds})
    closeWorksModal()
  }
}

const closeWorksModal = () => {
  showWorksModal.value = false
  selectedWorks.value = []
}

const viewWork = (work: Work) => {
  router.push(`/montaje/obras/${work.id}`)
}

const exportPlan = () => {
  // Implementation for PDF export
  console.log("Exporting plan to PDF...")
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    DRAFT: "Borrador",
    ACTIVE: "Activo",
    COMPLETED: "Completado",
    ARCHIVED: "Archivado",
  }
  return labels[status] || status
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

onMounted(async () => {
  const planId = route.params.id as string
  if (planId) {
    await getPlanById(planId)
  }
})
</script>

<style scoped>
.plan-detail-view {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.loading-state,
.error-state {
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
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-state i {
  font-size: 3rem;
  color: #ef4444;
  margin-bottom: 1rem;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-main {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.btn-back {
  padding: 0.5rem;
  background: #f3f4f6;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #e5e7eb;
  color: #374151;
}

.plan-info {
  flex: 1;
}

.plan-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.75rem 0;
}

.plan-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-draft {
  background: #fef3c7;
  color: #92400e;
}

.status-active {
  background: #d1fae5;
  color: #065f46;
}

.status-completed {
  background: #dbeafe;
  color: #1e40af;
}

.status-archived {
  background: #f3f4f6;
  color: #374151;
}

.period,
.dates {
  color: #6b7280;
  font-size: 0.875rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.plan-section {
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.plan-section h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h2 {
  margin: 0;
}

.plan-description {
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
}

.progress-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.progress-card {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.progress-header h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.progress-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar.small {
  height: 6px;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s ease;
}

.empty-content {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.objectives-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.objective-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.objective-item.completed {
  opacity: 0.7;
}

.objective-item.completed .objective-content h4 {
  text-decoration: line-through;
}

.objective-content {
  flex: 1;
}

.objective-content h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.objective-content p {
  color: #6b7280;
  margin: 0 0 0.75rem 0;
  line-height: 1.5;
}

.objective-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.75rem;
}

.priority {
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-weight: 600;
  text-transform: uppercase;
}

.priority-high {
  background: #fee2e2;
  color: #991b1b;
}

.priority-medium {
  background: #fef3c7;
  color: #92400e;
}

.priority-low {
  background: #d1fae5;
  color: #065f46;
}

.deadline {
  color: #6b7280;
}

.btn-toggle {
  padding: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  font-size: 1.25rem;
  transition: color 0.2s;
}

.btn-toggle.completed {
  color: #10b981;
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.work-card {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.work-card:hover {
  background: #f3f4f6;
  transform: translateY(-1px);
}

.work-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.work-header h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.work-status {
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.work-composer {
  color: #6b7280;
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
}

.work-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-text {
  font-size: 0.75rem;
  color: #6b7280;
  min-width: 30px;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.timeline-marker {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 0.875rem;
}

.timeline-item.completed .timeline-marker {
  background: #10b981;
  color: white;
}

.timeline-content h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.timeline-content p {
  color: #6b7280;
  margin: 0 0 0.5rem 0;
  line-height: 1.5;
}

.timeline-date {
  font-size: 0.75rem;
  color: #9ca3af;
}

.btn-primary,
.btn-secondary,
.btn-small {
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

.btn-small {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
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
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-content.large {
  max-width: 700px;
}

.modal-content h3 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
}

.form-group {
  margin-bottom: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.works-selection {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 1.5rem;
}

.work-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.work-option:hover {
  background: #f9fafb;
}

.work-option.selected {
  background: #eff6ff;
  border-color: #3b82f6;
}

.work-info h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.work-info p {
  color: #6b7280;
  margin: 0;
  font-size: 0.875rem;
}

.work-checkbox {
  font-size: 1.25rem;
  color: #3b82f6;
}

@media (max-width: 768px) {
  .plan-detail-view {
    padding: 1rem;
  }

  .plan-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-main {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    align-self: stretch;
  }

  .progress-overview {
    grid-template-columns: 1fr;
  }

  .works-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
