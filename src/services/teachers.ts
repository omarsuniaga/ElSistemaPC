// src/services/teachers.ts
import { fetchTeachersFromFirebase, addTeacherToFirebase } from './firestore';
import { getFromLocalStorage, saveToLocalStorage, clearLocalStorage } from '../utils/localStorageUtils';

export const getTeachers = async () => {
  if (process.env.NODE_ENV === 'development') {
    const cachedTeachers = getFromLocalStorage('teachers');
    if (cachedTeachers) {
      return cachedTeachers;
    }
  }
  const teachers = await fetchTeachersFromFirebase();
  if (process.env.NODE_ENV === 'development') {
    saveToLocalStorage('teachers', teachers);
  }
  return teachers;
};

export const addTeacher = async (teacher: Teacher) => {
  await addTeacherToFirebase(teacher);
  if (process.env.NODE_ENV === 'development') {
    clearLocalStorage('teachers');
  }
};