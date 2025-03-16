import { db } from '../../firebase';
import { collection, getDocs, addDoc, query, updateDoc, where, doc, deleteDoc } from 'firebase/firestore';
import { getFromLocalStorage, saveToLocalStorage, clearLocalStorage } from '../../utils/localStorageUtils';

const COLLECTION_NAME = 'CALIFICACIONES';

// Interface for qualification data
export interface QualificationData {
  id?: string;
  classId: string;
  date?: string;
  contentTitle: string;
  contentSubtitle?: string;
  group: string[]; // Array of student IDs
  indicators: {
    uniqueId: string;
    label: string;
    score: number;
  }[];
  comments?: string;
  locked: boolean;
  hideProgress?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Fetches all qualifications from Firebase
 */
export const fetchQualificationsFromFirebase = async () => {
  const q = query(collection(db, COLLECTION_NAME));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as QualificationData[];
};

/**
 * Fetch qualifications by class ID
 */
export const fetchQualificationsByClass = async (classId: string) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("classId", "==", classId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as QualificationData[];
  } catch (error) {
    console.error("Error fetching qualifications by class:", error);
    throw error;
  }
};

/**
 * Adds a new qualification record to Firebase
 */
export const addQualificationToFirebase = async (qualification: QualificationData) => {
  try {
    // Add timestamp
    const qualificationWithTimestamp = {
      ...qualification,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), qualificationWithTimestamp);
    
    // Update local storage if in development
    if (process.env.NODE_ENV === 'development') {
      const updatedQualifications = await fetchQualificationsFromFirebase();
      saveToLocalStorage('qualifications', updatedQualifications);
    }
    
    return { id: docRef.id, ...qualificationWithTimestamp };
  } catch (error) {
    console.error("Error adding qualification:", error);
    throw error;
  }
};

/**
 * Updates an existing qualification record
 */
export const updateQualificationInFirebase = async (qualification: QualificationData) => {
  try {
    if (!qualification.id) {
      throw new Error("Qualification ID is required for update");
    }
    
    // Create a clean copy of the data without the id field
    const { id, ...updateData } = qualification;
    
    // Ensure group is an array of strings
    updateData.group = Array.isArray(updateData.group) 
      ? updateData.group.map(id => typeof id === 'string' ? id : String(id))
      : [];

    // Ensure indicators array is properly formatted
    if (updateData.indicators) {
      updateData.indicators = updateData.indicators.map(indicator => ({
        uniqueId: indicator.uniqueId || '',
        label: indicator.label || '',
        score: Number(indicator.score) || 0
      }));
    }
    
    // Update timestamp
    const updatedQualification = {
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updatedQualification);
    
    // Update local storage if in development
    if (process.env.NODE_ENV === 'development') {
      const updatedQualifications = await fetchQualificationsFromFirebase();
      saveToLocalStorage('qualifications', updatedQualifications);
    }
    
    return { id, ...updatedQualification };
  } catch (error) {
    console.error("Error updating qualification:", error);
    throw error;
  }
};

/**
 * Deletes a qualification record
 */
export const deleteQualificationFromFirebase = async (qualificationId: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, qualificationId));
    
    // Update local storage if in development
    if (process.env.NODE_ENV === 'development') {
      const updatedQualifications = await fetchQualificationsFromFirebase();
      saveToLocalStorage('qualifications', updatedQualifications);
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting qualification:", error);
    throw error;
  }
};

/**
 * Gets all qualifications, using localStorage cache in development
 */
export const getQualifications = async () => {
  if (process.env.NODE_ENV === 'development') {
    const cachedQualifications = getFromLocalStorage('qualifications');
    if (cachedQualifications) {
      return cachedQualifications as QualificationData[];
    }
  }
  
  const qualifications = await fetchQualificationsFromFirebase();
  
  if (process.env.NODE_ENV === 'development') {
    saveToLocalStorage('qualifications', qualifications);
  }
  
  return qualifications;
};

/**
 * Clears qualification data from localStorage
 */
export const clearQualificationCache = () => {
  clearLocalStorage('qualifications');
};