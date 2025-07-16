import { computed } from 'vue';
import { useMontajeStore } from '../store/montaje';
import type { MontajeProject, ProjectMember, MontajeSettings } from '../types/montaje';

export function useMontaje() {
  const montajeStore = useMontajeStore();

  const createProject = async (
    name: string,
    description: string,
    director: string,
    organization: string,
    season: string,
    startDate: string,
    endDate: string,
  ): Promise<string> => {
    try {
      const docId = await montajeStore.createMontajeProject(
        name,
        description,
        director,
        organization,
        season,
        startDate,
        endDate,
      );
      return docId;
    } catch (error) {
      console.error('Error creando el proyecto:', error);
      throw error;
    }
  };

  const loadProjects = async () => {
    try {
      await montajeStore.loadMontajeProjects();
    } catch (error) {
      console.error('Error cargando proyectos:', error);
    }
  };

  const selectProject = (projectId: string) => {
    montajeStore.selectMontajeProject(projectId);
  };

  const addMember = async (projectId: string, member: Omit<ProjectMember, 'id' | 'joinedAt'>) => {
    await montajeStore.addMemberToMontajeProject(projectId, member);
  };

  const updateSettings = async (projectId: string, settings: Partial<MontajeSettings>) => {
    await montajeStore.updateMontajeProjectSettings(projectId, settings);
  };

  const saveProject = async (project: MontajeProject) => {
    await montajeStore.saveMontajeProject(project);
  };

  

  

  return {
    currentProject: computed(() => montajeStore.currentProject),
    projects: computed(() => montajeStore.projects),
    loading: computed(() => montajeStore.isLoadingProjects),
    projectStats: computed(() => montajeStore.getProjectStats),
    createProject,
    loadProjects,
    selectProject,
    addMember,
    updateSettings,
    saveProject,
  };
}