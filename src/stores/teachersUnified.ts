/**
 * 🔄 STORE UNIFICADO DE MAESTROS
 * Implementación consolidada que reemplaza teachers.ts y adminTeachers.ts
 * Fase 0 - Iniciativa 1: Centralización del State Management
 */

import { defineStore } from 'pinia';
import { ref, computed, readonly } from 'vue';
import {
  collection,
  query,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { useRBACStore } from '@/stores/rbacStore';
import { useAuthStore } from '@/stores/auth';
import { useClassesStore } from '@/modulos/Classes/store/classes';

// Importar schemas de validación
import {
  TeacherDataSchema,
  TeacherCreateSchema,
  TeacherUpdateSchema,
  validateFirebaseData,
  validateAndTransform,
  type TeacherData,
  type TeacherCreate,
  type TeacherUpdate,
} from '@/schemas';

/**
 * Store unificado de maestros con funcionalidades consolidadas
 * y verificación de permisos integrada usando RBAC
 */
export const useTeachersStore = defineStore('teachers', () => {
  // ==================== STATE ====================
  const teachers = ref<TeacherData[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const lastSync = ref<Date | null>(null);

  // ==================== STORES DEPENDENCIES ====================
  const rbacStore = useRBACStore();
  const authStore = useAuthStore();
  const classesStore = useClassesStore();

  // ==================== GETTERS ====================

  /**
   * Lista completa de maestros (compatible con ambos stores anteriores)
   */
  const items = computed(() => teachers.value);

  /**
   * Maestros activos únicamente
   */
  const activeTeachers = computed(() =>
    teachers.value.filter((teacher) => teacher.status === 'activo'),
  );

  /**
   * Estadísticas consolidadas
   */
  const stats = computed(() => ({
    total: teachers.value.length,
    active: activeTeachers.value.length,
    inactive: teachers.value.filter((t) => t.status === 'inactivo').length,
    pending: teachers.value.filter((t) => t.status === 'pendiente').length,
    totalSpecialties: new Set(teachers.value.flatMap((t) => t.specialties || [])).size,
    totalAssignedClasses: teachers.value.reduce((total, teacher) => {
      const teacherClasses = classesStore.classes.filter((c) => c.teacherId === teacher.id);
      return total + teacherClasses.length;
    }, 0),
  }));

  /**
   * Búsqueda por ID
   */
  const getTeacherById = computed(
    () => (id: string) => teachers.value.find((teacher) => teacher.id === id),
  );

  /**
   * Búsqueda por nombre (partial match)
   */
  const getTeacherByName = computed(
    () => (name: string) =>
      teachers.value.find((teacher) =>
        (teacher.name || '').toLowerCase().includes(name.toLowerCase()),
      ),
  );

  /**
   * Filtrar por especialidad
   */
  const getTeachersBySpecialty = computed(
    () => (specialty: string) =>
      teachers.value.filter((teacher) =>
        teacher.specialties?.some((s) => s.toLowerCase().includes(specialty.toLowerCase())),
      ),
  );

  /**
   * Lista ordenada alfabéticamente
   */
  const sortedTeachers = computed(() =>
    [...teachers.value].sort((a, b) => a.name.localeCompare(b.name)),
  );

  /**
   * Maestro actual basado en la sesión activa
   */
  const currentTeacher = computed(() => {
    const currentUid = authStore.user?.uid;
    if (!currentUid) return null;
    return teachers.value.find((teacher) => teacher.uid === currentUid);
  });

  /**
   * UID del maestro actual
   */
  const getCurrentTeacherUid = computed(() => authStore.user?.uid || null);

  // ==================== PERMISSION CHECKS ====================

  /**
   * Verifica si el usuario puede crear maestros
   */
  const canCreate = computed(() => rbacStore.hasPermission('teachers_create'));

  /**
   * Verifica si el usuario puede ver maestros
   */
  const canView = computed(() => rbacStore.hasPermission('teachers_view'));

  /**
   * Verifica si el usuario puede editar maestros
   */
  const canEdit = computed(() => rbacStore.hasPermission('teachers_edit'));

  /**
   * Verifica si el usuario puede eliminar maestros
   */
  const canDelete = computed(() => rbacStore.hasPermission('teachers_delete'));

  // ==================== ACTIONS ====================

  /**
   * Helper para manejar loading y errores de forma centralizada
   */
  async function withLoading<T>(action: () => Promise<T>): Promise<T> {
    isLoading.value = true;
    error.value = null;
    try {
      return await action();
    } catch (err: any) {
      error.value = err.message || 'Error inesperado';
      console.error('TeachersStore Error:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Carga todos los maestros desde Firebase con validación
   */
  async function fetchTeachers(): Promise<TeacherData[]> {
    return withLoading(async () => {
      if (!canView.value) {
        throw new Error('No tienes permisos para ver maestros');
      }

      const teachersRef = collection(db, 'MAESTROS');
      const q = query(teachersRef, orderBy('name'));
      const snapshot = await getDocs(q);

      const validatedTeachers = snapshot.docs.map((doc) => {
        const rawData = { id: doc.id, ...doc.data() };

        // Validar datos con Zod antes de almacenar
        const validated = validateFirebaseData(TeacherDataSchema, rawData);
        
        // Ensure required fields have defaults
        return {
          ...validated,
          status: validated.status || 'activo',
          specialties: validated.specialties || [],
        };
      });

      teachers.value = validatedTeachers;
      lastSync.value = new Date();

      return teachers.value;
    });
  }

  /**
   * Compatibilidad con BaseStore pattern
   */
  async function fetchItems(): Promise<TeacherData[]> {
    return fetchTeachers();
  }

  /**
   * Crear nuevo maestro con validación y permisos
   */
  async function createTeacher(teacherData: TeacherCreate): Promise<string> {
    return withLoading(async () => {
      if (!canCreate.value) {
        throw new Error('No tienes permisos para crear maestros');
      }

      // Validar datos antes de enviar a Firebase
      const validatedData = validateAndTransform(TeacherCreateSchema, teacherData);

      const dataToSave = {
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'MAESTROS'), dataToSave);

      // Recargar para mantener sincronización
      await fetchTeachers();

      return docRef.id;
    });
  }

  /**
   * Compatibilidad con BaseStore pattern
   */
  async function addItem(teacherData: TeacherCreate): Promise<string> {
    return createTeacher(teacherData);
  }

  /**
   * Actualizar maestro existente con validación
   */
  async function updateTeacher(id: string, updates: TeacherUpdate): Promise<void> {
    return withLoading(async () => {
      if (!canEdit.value) {
        throw new Error('No tienes permisos para editar maestros');
      }

      // Validar actualizaciones
      const validatedUpdates = validateAndTransform(TeacherUpdateSchema, updates);

      const dataToUpdate = {
        ...validatedUpdates,
        updatedAt: new Date(),
      };

      const teacherDoc = doc(db, 'MAESTROS', id);
      await updateDoc(teacherDoc, dataToUpdate);

      // Recargar para mantener sincronización
      await fetchTeachers();
    });
  }

  /**
   * Compatibilidad con BaseStore pattern
   */
  async function updateItem(id: string, updates: TeacherUpdate): Promise<void> {
    return updateTeacher(id, updates);
  }

  /**
   * Eliminar maestro con validación de permisos
   */
  async function deleteTeacher(id: string): Promise<void> {
    return withLoading(async () => {
      if (!canDelete.value) {
        throw new Error('No tienes permisos para eliminar maestros');
      }

      // Verificar si el maestro tiene clases asignadas
      const teacherClasses = classesStore.classes.filter((c) => c.teacherId === id);
      if (teacherClasses.length > 0) {
        throw new Error(
          `No se puede eliminar: el maestro tiene ${teacherClasses.length} clases asignadas`,
        );
      }

      const teacherDoc = doc(db, 'MAESTROS', id);
      await deleteDoc(teacherDoc);

      // Recargar para mantener sincronización
      await fetchTeachers();
    });
  }

  /**
   * Compatibilidad con BaseStore pattern
   */
  async function deleteItem(id: string): Promise<void> {
    return deleteTeacher(id);
  }

  /**
   * Actualizar estado de un maestro (activo/inactivo)
   */
  async function updateTeacherStatus(
    id: string,
    status: 'activo' | 'inactivo' | 'pendiente',
  ): Promise<void> {
    return updateTeacher(id, { status });
  }

  /**
   * Buscar maestro por UID de autenticación
   */
  async function fetchTeacherByAuthUid(authUid: string): Promise<TeacherData | null> {
    return withLoading(async () => {
      if (!canView.value) {
        throw new Error('No tienes permisos para ver maestros');
      }

      const teachersRef = collection(db, 'MAESTROS');
      const q = query(teachersRef, where('uid', '==', authUid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const teacherDoc = querySnapshot.docs[0];
        const rawData = { id: teacherDoc.id, ...teacherDoc.data() };

        const validated = validateFirebaseData(TeacherDataSchema, rawData);
        
        // Ensure required fields have defaults
        return {
          ...validated,
          status: validated.status || 'activo',
          specialties: validated.specialties || [],
        };
      }

      return null;
    });
  }

  /**
   * Obtener clases de un maestro
   */
  async function getTeacherClasses(teacherId: string) {
    await classesStore.fetchClasses();
    return classesStore.classes.filter((c) => c.teacherId === teacherId);
  }

  /**
   * Forzar sincronización
   */
  async function forceSync(): Promise<TeacherData[]> {
    return fetchTeachers();
  }

  /**
   * Exportar datos de maestros (solo si tiene permisos)
   */
  function exportTeachers(teachersToExport = teachers.value) {
    if (!canView.value) {
      throw new Error('No tienes permisos para exportar datos de maestros');
    }

    const csvContent = [
      'Name,Email,Phone,Specialty,Experience,Status',
      ...teachersToExport.map(
        (teacher) =>
          `"${teacher.name}","${teacher.email}","${teacher.phone || ''}","${(teacher.specialties || []).join('; ')}","${teacher.experiencia || ''}","${teacher.status}"`,
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `maestros_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /**
   * Reset del store
   */
  function $reset() {
    teachers.value = [];
    isLoading.value = false;
    error.value = null;
    lastSync.value = null;
  }

  // ==================== RETURN STORE ====================
  return {
    // State
    teachers: readonly(teachers),
    isLoading: readonly(isLoading),
    error: readonly(error),
    lastSync: readonly(lastSync),

    // Getters
    items,
    activeTeachers,
    stats,
    getTeacherById,
    getTeacherByName,
    getTeachersBySpecialty,
    sortedTeachers,
    currentTeacher,
    getCurrentTeacherUid,

    // Permissions
    canCreate,
    canView,
    canEdit,
    canDelete,

    // Actions
    fetchTeachers,
    fetchItems,
    createTeacher,
    addItem,
    updateTeacher,
    updateItem,
    deleteTeacher,
    deleteItem,
    updateTeacherStatus,
    fetchTeacherByAuthUid,
    getTeacherClasses,
    forceSync,
    exportTeachers,
    $reset,
  };
});
