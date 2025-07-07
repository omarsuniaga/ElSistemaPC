import { reactive, readonly } from 'vue'
import type { MusicalWork, Instrument, InstrumentEvaluation, WeeklyEvaluation } from '../type/heatmap'
import type { MontajeProject, ProjectMember } from '../type/montaje'

// Define state interface
interface MontajeState {
  currentProject: MontajeProject | null
  projects: MontajeProject[]
  currentWork: MusicalWork | null
  works: MusicalWork[]
  evaluations: InstrumentEvaluation[]
  weeklyEvaluations: WeeklyEvaluation[]
  loading: boolean
  error: string | null
}

// Create state
const state = reactive<MontajeState>({
  currentProject: null,
  projects: [],
  currentWork: null,
  works: [],
  evaluations: [],
  weeklyEvaluations: [],
  loading: false,
  error: null
})

// Actions
const actions = {
  // Project actions
  async loadProjects() {
    state.loading = true
    state.error = null
    
    try {
      // Load from localStorage or API
      const savedProjects = localStorage.getItem('montaje_projects')
      if (savedProjects) {
        state.projects = JSON.parse(savedProjects)
      }
      
      // If no projects exist, create a sample one
      if (state.projects.length === 0) {
        await actions.createProject({
          name: 'Concierto de Primavera 2024',
          description: 'Concierto de temporada con obras clásicas y contemporáneas',
          director: 'Maestro Juan Pérez',
          organization: 'Orquesta Sinfónica Municipal',
          season: 'Primavera 2024',
          startDate: '2024-03-01',
          endDate: '2024-06-15'
        })
      }
    } catch (error) {
      state.error = 'Error al cargar proyectos'
      console.error(error)
    } finally {
      state.loading = false
    }
  },
  
  async createProject(projectData: {
    name: string
    description: string
    director: string
    organization: string
    season: string
    startDate: string
    endDate: string
  }) {
    state.loading = true
    state.error = null
    
    try {
      const projectId = `montaje_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const newProject: MontajeProject = {
        id: projectId,
        ...projectData,
        status: 'planning',
        works: [],
        members: [],
        settings: {
          evaluationFrequency: 'weekly',
          autoReminders: true,
          reportGeneration: 'manual',
          exportFormats: ['pdf', 'excel'],
          integrations: {
            calendar: true,
            email: true,
            metronome: false,
            tuner: false
          }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      state.projects.push(newProject)
      state.currentProject = newProject
      
      // Save to localStorage
      localStorage.setItem('montaje_projects', JSON.stringify(state.projects))
      localStorage.setItem('montaje_current_project', projectId)
      
      return projectId
    } catch (error) {
      state.error = 'Error al crear proyecto'
      console.error(error)
      throw error
    } finally {
      state.loading = false
    }
  },
  
  selectProject(projectId: string) {
    const project = state.projects.find(p => p.id === projectId)
    if (project) {
      state.currentProject = project
      localStorage.setItem('montaje_current_project', projectId)
    }
  },
  
  // Work actions
  async loadWorks() {
    if (!state.currentProject) return
    
    state.loading = true
    state.error = null
    
    try {
      // Load from localStorage or API
      const savedWorks = localStorage.getItem(`montaje_works_${state.currentProject.id}`)
      if (savedWorks) {
        state.works = JSON.parse(savedWorks)
      }
    } catch (error) {
      state.error = 'Error al cargar obras'
      console.error(error)
    } finally {
      state.loading = false
    }
  },
  
  async createWork(workData: Partial<MusicalWork>) {
    if (!state.currentProject) return
    
    state.loading = true
    state.error = null
    
    try {
      const workId = `work_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const newWork: MusicalWork = {
        id: workId,
        projectId: state.currentProject.id,
        name: workData.name || 'Nueva Obra',
        composer: workData.composer || '',
        description: workData.description || '',
        genre: workData.genre || '',
        difficulty: workData.difficulty || 3,
        duration: workData.duration || 0,
        rows: workData.rows || 12,
        cols: workData.cols || 18,
        totalMeasures: (workData.rows || 12) * (workData.cols || 18),
        key: workData.key || 'Do Mayor',
        tempo: workData.tempo || 'Moderato',
        timeSignature: workData.timeSignature || '4/4',
        requirements: workData.requirements || '',
        techniques: workData.techniques || '',
        startDate: workData.startDate || new Date().toISOString().split('T')[0],
        endDate: workData.endDate || '',
        instruments: workData.instruments || [],
        levels: workData.levels || [
          { id: 0, name: 'Muy Bajo', color: 'bg-red-500', description: 'Nivel mínimo' },
          { id: 1, name: 'Bajo', color: 'bg-orange-500', description: 'Nivel bajo' },
          { id: 2, name: 'Medio', color: 'bg-yellow-500', description: 'Nivel medio' },
          { id: 3, name: 'Alto', color: 'bg-lime-500', description: 'Nivel alto' },
          { id: 4, name: 'Muy Alto', color: 'bg-green-500', description: 'Nivel máximo' }
        ],
        sections: workData.sections || [],
        resources: workData.resources || [],
        milestones: workData.milestones || [],
        status: workData.status || 'planning',
        priority: workData.priority || 1,
        tags: workData.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'current_user_id'
      }
      
      state.works.push(newWork)
      state.currentWork = newWork
      
      // Update project
      if (state.currentProject) {
        state.currentProject.works.push(workId)
        localStorage.setItem('montaje_projects', JSON.stringify(state.projects))
      }
      
      // Save to localStorage
      localStorage.setItem(`montaje_works_${state.currentProject.id}`, JSON.stringify(state.works))
      
      return workId
    } catch (error) {
      state.error = 'Error al crear obra'
      console.error(error)
      throw error
    } finally {
      state.loading = false
    }
  },
  
  selectWork(workId: string) {
    const work = state.works.find(w => w.id === workId)
    if (work) {
      state.currentWork = work
    }
  },
  
  // Evaluation actions
  async loadEvaluations(workId: string) {
    state.loading = true
    state.error = null
    
    try {
      // Load from localStorage or API
      const savedEvaluations = localStorage.getItem(`montaje_evaluations_${workId}`)
      if (savedEvaluations) {
        state.evaluations = JSON.parse(savedEvaluations)
      }
    } catch (error) {
      state.error = 'Error al cargar evaluaciones'
      console.error(error)
    } finally {
      state.loading = false
    }
  },
  
  async saveEvaluation(evaluation: Partial<InstrumentEvaluation>) {
    if (!state.currentWork) return
    
    state.loading = true
    state.error = null
    
    try {
      const evaluationId = evaluation.id || `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const newEvaluation: InstrumentEvaluation = {
        ...evaluation as InstrumentEvaluation,
        id: evaluationId,
        workId: evaluation.workId || state.currentWork.id,
        createdAt: evaluation.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      // Update or add to evaluations
      const index = state.evaluations.findIndex(e => e.id === evaluationId)
      if (index !== -1) {
        state.evaluations[index] = newEvaluation
      } else {
        state.evaluations.push(newEvaluation)
      }
      
      // Save to localStorage
      localStorage.setItem(`montaje_evaluations_${newEvaluation.workId}`, JSON.stringify(
        state.evaluations.filter(e => e.workId === newEvaluation.workId)
      ))
      
      return evaluationId
    } catch (error) {
      state.error = 'Error al guardar evaluación'
      console.error(error)
      throw error
    } finally {
      state.loading = false
    }
  }
}

// Getters
const getters = {
  getProjectById: (id: string) => state.projects.find(p => p.id === id),
  getWorkById: (id: string) => state.works.find(w => w.id === id),
  getWorksByProject: (projectId: string) => state.works.filter(w => w.projectId === projectId),
  getEvaluationsByWork: (workId: string) => state.evaluations.filter(e => e.workId === workId),
  getEvaluationsByInstrument: (workId: string, instrumentId: string) => 
    state.evaluations.filter(e => e.workId === workId && e.instrumentId === instrumentId)
}

// Export store
export default {
  state: readonly(state),
  actions,
  getters
}