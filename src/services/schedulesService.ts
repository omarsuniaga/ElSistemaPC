// src/services/schedulesService.ts
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION_NAME = 'SCHEDULES';

export const fetchSchedulesFromDB = async () => {
  const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const addScheduleToDB = async (scheduleData) => {
  const newDocRef = doc(collection(db, COLLECTION_NAME));
  const newSchedule = { ...scheduleData, id: newDocRef.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await setDoc(newDocRef, newSchedule);
  return newSchedule;
};

export const updateScheduleInDB = async (id, updates) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
};

export const deleteScheduleFromDB = async (id) => {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
};
