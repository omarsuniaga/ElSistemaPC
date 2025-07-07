import { ref, computed } from 'vue'
import type { MontajeProject, ProjectMember, MontajeSettings } from '../types/montaje'

const currentProject = ref<MontajeProject | null>(null)
const projects = ref<MontajeProject[]>([])
const loading = ref(false)

export function useMontaje() {
  const createProject = async (
    name: string,
    description: string,
    director: string,
    organization: string,
    season: string,
    startDate: string,
    endDate: string
  ): Promise<string> => {
    loading.value = true
    
    try {
      const projectId = `montaje_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const newProject: MontajeProject = {
        id: projectId,
        name,
        description,
        director,
        organization,
        season,
        startDate,
        endDate,
        status: 'planning',
        works: [],
        members: [],
        settings: getDefaultSettings(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      projects.value.push(newProject)
      currentProject.value = newProject
      
      // Save to storage
      await saveProject(newProject)
      
      return projectId
    } finally {
      loading.value = false
    }
  }

  const loadProjects = async () => {
    loading.value = true
    
    try {
      // Load from localStorage or API
      const savedProjects = localStorage.getItem('montaje_projects')
      if (savedProjects) {
        projects.value = JSON.parse(savedProjects)
      }
      
      // If no projects exist, create a sample one
      if (projects.value.length === 0) {
        await createProject(
          'Concierto de Primavera 2024',
          'Concierto de temporada con obras clásicas y contemporáneas',
          'Maestro Juan Pérez',
          'Orquesta Sinfónica Municipal',
          'Primavera 2024',
          '2024-03-01',
          '2024-06-15'
        )
      }
    } finally {
      loading.value = false
    }
  }

  const selectProject = (projectId: string) => {
    const project = projects.value.find(p => p.id === projectId)
    if (project) {
      currentProject.value = project
      localStorage.setItem('montaje_current_project', projectId)
    }
  }

  const addMember = async (projectId: string, member: Omit<ProjectMember, 'id' | 'joinedAt'>) => {
    const project = projects.value.find(p => p.id === projectId)
    if (!project) return

    const newMember: ProjectMember = {
      ...member,
      id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      joinedAt: new Date().toISOString()
    }

    project.members.push(newMember)
    project.updatedAt = new Date().toISOString()
    
    await saveProject(project)
  }

  const updateSettings = async (projectId: string, settings: Partial<MontajeSettings>) => {
    const project = projects.value.find(p => p.id === projectId)
    if (!project) return

    project.settings = { ...project.settings, ...settings }
    project.updatedAt = new Date().toISOString()
    
    await saveProject(project)
  }

  const saveProject = async (project: MontajeProject) => {
    try {
      // Update in memory
      const index = projects.value.findIndex(p => p.id === project.id)
      if (index !== -1) {
        projects.value[index] = project
      }
      
      // Save to localStorage
      localStorage.setItem('montaje_projects', JSON.stringify(projects.value))
      
      // TODO: Save to backend/Firebase
      console.log('Project saved:', project.id)
    } catch (error) {
      console.error('Error saving project:', error)
    }
  }

  const getDefaultSettings = (): MontajeSettings => ({
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
  })

  const getProjectStats = computed(() => {
    if (!currentProject.value) return null

    return {
      totalWorks: currentProject.value.works.length,
      totalMembers: currentProject.value.members.length,
      daysRemaining: Math.max(0, Math.ceil(
        (new Date(currentProject.value.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )),
      progress: calculateProjectProgress(currentProject.value)
    }
  })

  const calculateProjectProgress = (project: MontajeProject): number => {
    // Calculate based on works completion, time elapsed, etc.
    const totalDays = Math.ceil(
      (new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)
    )
    const elapsedDays = Math.ceil(
      (new Date().getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)
    )
    
    return Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100))
  }

  return {
    currentProject: computed(() => currentProject.value),
    projects: computed(() => projects.value),
    loading: computed(() => loading.value),
    projectStats: getProjectStats,
    createProject,
    loadProjects,
    selectProject,
    addMember,
    updateSettings,
    saveProject
  }
}