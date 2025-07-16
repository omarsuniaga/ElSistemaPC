// src/services/studentsService.ts
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION_NAME = 'ESTUDIANTES';

export const fetchStudentsFromDB = async () => {
  const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const addStudentToDB = async (studentData) => {
  const newDocRef = doc(collection(db, COLLECTION_NAME));
  const newStudent = { ...studentData, id: newDocRef.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await setDoc(newDocRef, newStudent);
  return newStudent;
};

export const updateStudentInDB = async (id, updates) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
};

export const deleteStudentFromDB = async (id) => {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
};
