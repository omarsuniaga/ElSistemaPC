// src/modulos/Classes/composables/useTeacherCollaboration.ts

import { ref, computed } from 'vue';
import type { 
  TeacherClassView, 
  ClassTeacher, 
  InviteAssistantData,
  TeacherRole 
} from '../types/class';
import { 
  getTeacherClasses,
  inviteAssistantTeacher,
  removeAssistantTeacher,
  updateAssistantPermissions,
  checkTeacherPermission
} from '../service/classes';
import { useAuthStore } from '../../../stores/auth';

export const useTeacherCollaboration = () => {
  const authStore = useAuthStore();
  
  // Estado
  const isLoading = ref(false);
  const myClasses = ref<TeacherClassView[]>([]);
  const error = ref<string | null>(null);

  /**
   * Obtiene todas las clases del maestro actual (como encargado y asistente)
   */
  const fetchMyClasses = async () => {
    if (!authStore.user?.uid) {
      error.value = 'Usuario no autenticado';
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const classes = await getTeacherClasses(authStore.user.uid);
      myClasses.value = classes;
    } catch (err) {
      error.value = 'Error al cargar las clases';
      console.error('Error fetching teacher classes:', err);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Invita un maestro como asistente a una clase
   */
  const inviteAssistant = async (inviteData: Omit<InviteAssistantData, 'invitedBy'>) => {
    if (!authStore.user?.uid) {
      throw new Error('Usuario no autenticado');
    }

    isLoading.value = true;
    error.value = null;

    try {
      await inviteAssistantTeacher({
        ...inviteData,
        invitedBy: authStore.user.uid
      });
      
      // Recargar clases para reflejar cambios
      await fetchMyClasses();
    } catch (err: any) {
      error.value = err.message || 'Error al invitar maestro asistente';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Remueve un maestro asistente de una clase
   */
  const removeAssistant = async (classId: string, assistantTeacherId: string) => {
    if (!authStore.user?.uid) {
      throw new Error('Usuario no autenticado');
    }

    isLoading.value = true;
    error.value = null;

    try {
      await removeAssistantTeacher(classId, assistantTeacherId, authStore.user.uid);
      
      // Recargar clases para reflejar cambios
      await fetchMyClasses();
    } catch (err: any) {
      error.value = err.message || 'Error al remover maestro asistente';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Actualiza los permisos de un maestro asistente
   */
  const updatePermissions = async (
    classId: string, 
    assistantTeacherId: string, 
    newPermissions: ClassTeacher['permissions']
  ) => {
    if (!authStore.user?.uid) {
      throw new Error('Usuario no autenticado');
    }

    isLoading.value = true;
    error.value = null;

    try {
      await updateAssistantPermissions(classId, assistantTeacherId, newPermissions, authStore.user.uid);
      
      // Recargar clases para reflejar cambios
      await fetchMyClasses();
    } catch (err: any) {
      error.value = err.message || 'Error al actualizar permisos';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Verifica si el maestro actual tiene un permiso específico en una clase
   */
  const hasPermission = async (classId: string, permission: keyof ClassTeacher['permissions']): Promise<boolean> => {
    if (!authStore.user?.uid) {
      return false;
    }

    try {
      return await checkTeacherPermission(classId, authStore.user.uid, permission);
    } catch (err) {
      console.error('Error checking permission:', err);
      return false;
    }
  };

  // Computed properties

  /**
   * Clases donde el maestro actual es encargado
   */
  const leadClasses = computed(() => 
    myClasses.value.filter(classData => classData.myRole === 'lead')
  );

  /**
   * Clases donde el maestro actual es asistente
   */
  const assistantClasses = computed(() => 
    myClasses.value.filter(classData => classData.myRole === 'assistant')
  );

  /**
   * Total de clases (como encargado + como asistente)
   */
  const totalClasses = computed(() => myClasses.value.length);

  /**
   * Obtiene una clase específica por ID
   */
  const getClassById = (classId: string) => 
    myClasses.value.find(classData => classData.id === classId);

  /**
   * Verifica si el maestro actual es encargado de una clase específica
   */
  const isLeadTeacher = (classId: string) => {
    const classData = getClassById(classId);
    return classData?.myRole === 'lead';
  };

  /**
   * Verifica si el maestro actual es asistente en una clase específica
   */
  const isAssistantTeacher = (classId: string) => {
    const classData = getClassById(classId);
    return classData?.myRole === 'assistant';
  };

  /**
   * Obtiene los permisos del maestro actual en una clase específica
   */
  const getMyPermissions = (classId: string) => {
    const classData = getClassById(classId);
    return classData?.myPermissions;
  };

  /**
   * Formatea la información de rol para mostrar en UI
   */
  const formatRole = (role: TeacherRole) => {
    return role === 'lead' ? 'Encargado' : 'Asistente';
  };

  /**
   * Obtiene estadísticas de colaboración
   */
  const collaborationStats = computed(() => ({
    totalClasses: totalClasses.value,
    leadClasses: leadClasses.value.length,
    assistantClasses: assistantClasses.value.length,
    totalAssistants: leadClasses.value.reduce((total, classData) => 
      total + (classData.assistantTeachers?.length || 0), 0
    )
  }));

  return {
    // Estado
    isLoading,
    myClasses,
    error,

    // Acciones
    fetchMyClasses,
    inviteAssistant,
    removeAssistant,
    updatePermissions,
    hasPermission,

    // Computed
    leadClasses,
    assistantClasses,
    totalClasses,
    collaborationStats,

    // Utilidades
    getClassById,
    isLeadTeacher,
    isAssistantTeacher,
    getMyPermissions,
    formatRole
  };
};
