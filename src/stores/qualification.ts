import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  deleteQualificationFromFirebase,
  addQualificationToFirebase,
  updateQualificationInFirebase,
  fetchQualificationsByClass // Add this import
} from '../services/firestore/qualification'
import type { QualificationCard, QualificationIndicator } from '../types/qualification'

// Modificar la interfaz QualificationData
interface QualificationData {
  id?: string;
  classId: string;
  date: string;
  contentTitle: string;
  contentSubtitle: string;
  group: string[];
  indicators: {
    uniqueId: string;
    label: string;
    score: number;
  }[];
  comments?: string;
  locked: boolean;
  hideProgress: boolean;
}

export const useQualificationStore = defineStore('qualification', () => {
  // State
  const qualifications = ref<QualificationCard[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const selectedClassId = ref<string>('')

  // Getters
  const getQualificationsByClass = computed(() => {
    return (classId: string) => {
    return qualifications.value.filter((q: QualificationCard) => q.classId === classId)
    }
  })

  const getQualificationById = computed(() => {
    return (id: string) => {
    return qualifications.value.find((q: QualificationCard) => q.id === id) || null as QualificationCard | null
    }
  })

  // Actions
  async function fetchQualifications(classId: string) {
    try {
      isLoading.value = true
      error.value = null
      selectedClassId.value = classId
      
      // Use the imported function
      const fetchedQualifications = await fetchQualificationsByClass(classId)
      qualifications.value = fetchedQualifications
      
      return fetchedQualifications
    } catch (err) {
      console.error('Error in fetchQualifications:', err)
      error.value = 'Failed to fetch qualifications'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function saveQualification(qualificationData: QualificationData) {
    try {
      isLoading.value = true
      error.value = null
      
      const id = await addQualificationToFirebase(qualificationData)
      
      // Add the saved qualification to state with its new ID
      const newQualification: QualificationCard = {
        id,
        ...qualificationData
      }
      
      qualifications.value.push(newQualification)
      return id
    } catch (err) {
      console.error('Error in saveQualification:', err)
      error.value = 'Failed to save qualification'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateQualification(id: string, qualificationData: Partial<QualificationData>) {
    try {
      isLoading.value = true
      error.value = null
      
      // Ensure we have all the required fields for the update
      const updateData: QualificationData = {
        ...qualificationData,
        id,
        classId: qualificationData.classId || selectedClassId.value,
        // Ensure required fields have default values
        contentTitle: qualificationData.contentTitle || '',
        contentSubtitle: qualificationData.contentSubtitle || '',
        date: qualificationData.date || new Date().toISOString(),
        group: qualificationData.group || [],
        indicators: qualificationData.indicators || [],
        locked: qualificationData.locked ?? false,
        hideProgress: qualificationData.hideProgress ?? false
      }
      
      await updateQualificationInFirebase(updateData)
      
      // Update the qualification in state
    const index: number = qualifications.value.findIndex((q: QualificationCard) => q.id === id)
      if (index !== -1) {
        qualifications.value[index] = {
          ...qualifications.value[index],
          ...updateData
        }
      }
      
      return true
    } catch (err) {
      console.error('Error in updateQualification:', err)
      error.value = 'Failed to update qualification'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteQualification(id: string) {
    try {
      isLoading.value = true
      error.value = null
      
      await deleteQualificationFromFirebase(id)
      
      // Remove the qualification from state
    qualifications.value = qualifications.value.filter((q: QualificationCard) => q.id !== id)
      
      return true
    } catch (err) {
      console.error('Error in deleteQualification:', err)
      error.value = 'Failed to delete qualification'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function toggleQualificationLock(id: string, locked: boolean) {
    return updateQualification(id, { locked })
  }

  async function toggleProgressVisibility(id: string, hideProgress: boolean) {
    return updateQualification(id, { hideProgress })
  }

  async function updateQualificationIndicators(id: string, indicators: QualificationIndicator[]) {
    return updateQualification(id, { indicators })
  }

  async function updateQualificationComments(id: string, comments: string) {
    return updateQualification(id, { comments })
  }

  function reset() {
    qualifications.value = []
    isLoading.value = false
    error.value = null
    selectedClassId.value = ''
  }

  return {
    // State
    qualifications,
    isLoading,
    error,
    selectedClassId,
    
    // Getters
    getQualificationsByClass,
    getQualificationById,
    
    // Actions
    fetchQualifications,
    saveQualification,
    updateQualification,
    deleteQualification,
    toggleQualificationLock,
    toggleProgressVisibility,
    updateQualificationIndicators,
    updateQualificationComments,
    reset
  }
})