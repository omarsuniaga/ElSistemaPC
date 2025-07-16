// src/services/classesService.ts
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION_NAME = 'CLASES';

export const fetchClassesFromDB = async () => {
  const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const addClassToDB = async (classData) => {
  const newDocRef = doc(collection(db, COLLECTION_NAME));
  const newClass = { ...classData, id: newDocRef.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await setDoc(newDocRef, newClass);
  return newClass;
};

export const updateClassInDB = async (id, updates) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
};

export const deleteClassFromDB = async (id) => {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
};
