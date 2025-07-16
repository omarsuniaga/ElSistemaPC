// Store para gestión de calificaciones y comentarios de estudiantes
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

// Tipos para el sistema de calificaciones
export interface StudentComment {
  teacherId: string
  teacherName: string
  comentario: string
  date: string
  timestamp: Timestamp
  observationId?: string // Referencia a la observación origen
  tags: string[] // Para hashtags (#obra, #metodo, etc.)
  context?: string // Contexto adicional
}

export interface StudentGrade {
  studentId: string
  studentName: string
  classId: string
  className: string
  comments: StudentComment[]
  lastUpdated: Timestamp
}

export interface TaggedContent {
  id: string
  name: string
  type: 'obra' | 'metodo' | 'leccion' | 'ejercicio' | 'otro'
  frequency: number // Cuántas veces se ha usado
  lastUsed: Timestamp
  createdBy: string
}

export const useCalificacionesStore = defineStore('calificaciones', () => {
  // Estado reactivo
  const studentGrades = ref<Map<string, StudentGrade>>(new Map());
  const availableTags = ref<TaggedContent[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Cache para optimizar consultas
  const cache = ref<Map<string, {data: any; timestamp: number}>>(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  // Computed properties
  const getStudentComments = computed(() => {
    return (studentId: string, classId: string, date: string) => {
      const key = `${studentId}_${date}_${classId}`;
      return studentGrades.value.get(key)?.comments || [];
    };
  });

  const getTagsSuggestions = computed(() => {
    return (query: string, type?: string) => {
      return availableTags.value
        .filter((tag) => {
          const matchesQuery = tag.name.toLowerCase().includes(query.toLowerCase());
          const matchesType = !type || tag.type === type;
          return matchesQuery && matchesType;
        })
        .sort((a, b) => b.frequency - a.frequency) // Más usados primero
        .slice(0, 10); // Máximo 10 sugerencias
    };
  });

  const getMostUsedTags = computed(() => {
    return (type?: string, limit = 20) => {
      return availableTags.value
        .filter((tag) => !type || tag.type === type)
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, limit);
    };
  });

  // Utilidades
  const generateDocumentId = (studentId: string, date: string, classId: string): string => {
    return `${studentId}_${date}_${classId}`;
  };

  const isValidCache = (timestamp: number): boolean => {
    return Date.now() - timestamp < CACHE_DURATION;
  };

  // Acciones principales
  const addStudentComment = async (
    studentId: string,
    studentName: string,
    classId: string,
    className: string,
    date: string,
    teacherId: string,
    teacherName: string,
    comentario: string,
    tags: string[] = [],
    observationId?: string,
  ): Promise<void> => {
    try {
      loading.value = true;
      error.value = null;

      const documentId = generateDocumentId(studentId, date, classId);
      const docRef = doc(db, 'CALIFICACIONES', documentId);

      // Crear el comentario
      const newComment: StudentComment = {
        teacherId,
        teacherName,
        comentario,
        date,
        timestamp: Timestamp.now(),
        observationId,
        tags,
        context: 'observation-tagging',
      };

      // Verificar si el documento existe
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // Actualizar documento existente
        const currentData = docSnap.data();
        const classData = currentData[classId] || [];

        await updateDoc(docRef, {
          [`${classId}`]: arrayUnion(newComment),
          lastUpdated: Timestamp.now(),
        });
      } else {
        // Crear nuevo documento
        const newGrade: Partial<StudentGrade> = {
          studentId,
          studentName,
          classId,
          className,
          lastUpdated: Timestamp.now(),
          [classId]: [newComment],
        };

        await setDoc(docRef, newGrade);
      }

      // Actualizar cache local
      const key = documentId;
      const existingGrade = studentGrades.value.get(key);
      if (existingGrade) {
        existingGrade.comments.push(newComment);
        existingGrade.lastUpdated = Timestamp.now();
      } else {
        studentGrades.value.set(key, {
          studentId,
          studentName,
          classId,
          className,
          comments: [newComment],
          lastUpdated: Timestamp.now(),
        });
      }

      // Actualizar frecuencia de tags usados
      await updateTagsUsage(tags, teacherId);

      console.log(`[CalificacionesStore] Comentario agregado para estudiante ${studentName}`);
    } catch (err) {
      console.error('[CalificacionesStore] Error al agregar comentario:', err);
      error.value = `Error al guardar comentario: ${err.message}`;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getStudentGrades = async (
    studentId: string,
    date: string,
    classId: string,
  ): Promise<StudentComment[]> => {
    try {
      loading.value = true;
      const documentId = generateDocumentId(studentId, date, classId);

      // Verificar cache
      const cacheKey = `grade_${documentId}`;
      if (cache.value.has(cacheKey)) {
        const cached = cache.value.get(cacheKey)!;
        if (isValidCache(cached.timestamp)) {
          return cached.data;
        }
      }

      const docRef = doc(db, 'CALIFICACIONES', documentId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const comments = data[classId] || [];

        // Actualizar cache
        cache.value.set(cacheKey, {
          data: comments,
          timestamp: Date.now(),
        });

        return comments;
      }

      return [];
    } catch (err) {
      console.error('[CalificacionesStore] Error al obtener calificaciones:', err);
      error.value = `Error al cargar calificaciones: ${err.message}`;
      return [];
    } finally {
      loading.value = false;
    }
  };

  const loadAvailableTags = async (forceRefresh = false): Promise<void> => {
    try {
      const cacheKey = 'available_tags';
      if (!forceRefresh && cache.value.has(cacheKey)) {
        const cached = cache.value.get(cacheKey)!;
        if (isValidCache(cached.timestamp)) {
          availableTags.value = cached.data;
          return;
        }
      }

      const tagsRef = collection(db, 'TAGS_CONTENT');
      const querySnapshot = await getDocs(tagsRef);

      const tags: TaggedContent[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tags.push({
          id: doc.id,
          ...data,
        } as TaggedContent);
      });

      availableTags.value = tags;

      // Actualizar cache
      cache.value.set(cacheKey, {
        data: tags,
        timestamp: Date.now(),
      });

      console.log(`[CalificacionesStore] ${tags.length} tags cargados`);
    } catch (err) {
      console.error('[CalificacionesStore] Error al cargar tags:', err);
      error.value = `Error al cargar contenido etiquetable: ${err.message}`;
    }
  };

  const updateTagsUsage = async (tags: string[], userId: string): Promise<void> => {
    try {
      for (const tagName of tags) {
        if (!tagName.trim()) continue;

        const tagDoc = doc(db, 'TAGS_CONTENT', tagName.toLowerCase());
        const tagSnap = await getDoc(tagDoc);

        if (tagSnap.exists()) {
          // Incrementar frecuencia
          await updateDoc(tagDoc, {
            frequency: (tagSnap.data().frequency || 0) + 1,
            lastUsed: Timestamp.now(),
          });
        } else {
          // Crear nuevo tag
          await setDoc(tagDoc, {
            id: tagName.toLowerCase(),
            name: tagName,
            type: 'otro', // Tipo por defecto
            frequency: 1,
            lastUsed: Timestamp.now(),
            createdBy: userId,
          });
        }
      }

      // Recargar tags después de actualizar
      await loadAvailableTags(true);
    } catch (err) {
      console.error('[CalificacionesStore] Error al actualizar tags:', err);
    }
  };

  const createOrUpdateTag = async (
    name: string,
    type: 'obra' | 'metodo' | 'leccion' | 'ejercicio' | 'otro',
    userId: string,
  ): Promise<TaggedContent> => {
    try {
      const tagId = name.toLowerCase().replace(/\s+/g, '_');
      const tagDoc = doc(db, 'TAGS_CONTENT', tagId);

      const newTag: TaggedContent = {
        id: tagId,
        name,
        type,
        frequency: 1,
        lastUsed: Timestamp.now(),
        createdBy: userId,
      };

      await setDoc(tagDoc, newTag);

      // Actualizar cache local
      const existingIndex = availableTags.value.findIndex((tag) => tag.id === tagId);
      if (existingIndex >= 0) {
        availableTags.value[existingIndex] = newTag;
      } else {
        availableTags.value.push(newTag);
      }

      return newTag;
    } catch (err) {
      console.error('[CalificacionesStore] Error al crear tag:', err);
      throw err;
    }
  };

  const getStudentHistory = async (
    studentId: string,
    classId?: string,
  ): Promise<StudentComment[]> => {
    try {
      loading.value = true;

      const calificacionesRef = collection(db, 'CALIFICACIONES');
      const q = query(calificacionesRef, where('studentId', '==', studentId));
      const querySnapshot = await getDocs(q);

      const allComments: StudentComment[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        Object.keys(data).forEach((key) => {
          if (key.startsWith('class_') || !classId || key === classId) {
            const comments = data[key];
            if (Array.isArray(comments)) {
              allComments.push(...comments);
            }
          }
        });
      });

      // Ordenar por fecha más reciente
      allComments.sort((a, b) => {
        const dateA = a.timestamp?.toDate() || new Date(a.date);
        const dateB = b.timestamp?.toDate() || new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });

      return allComments;
    } catch (err) {
      console.error('[CalificacionesStore] Error al obtener historial:', err);
      return [];
    } finally {
      loading.value = false;
    }
  };

  const clearCache = (): void => {
    cache.value.clear();
    console.log('[CalificacionesStore] Cache limpiado');
  };

  // Inicialización
  const initialize = async (): Promise<void> => {
    await loadAvailableTags();
  };

  return {
    // Estado
    studentGrades: studentGrades.value,
    availableTags: availableTags.value,
    loading,
    error,

    // Computed
    getStudentComments,
    getTagsSuggestions,
    getMostUsedTags,

    // Acciones
    addStudentComment,
    getStudentGrades,
    loadAvailableTags,
    updateTagsUsage,
    createOrUpdateTag,
    getStudentHistory,
    clearCache,
    initialize,
  };
});
