// src/services/attendance.ts
import { db } from '../firebase';
import { collection, getDocs, addDoc, query, updateDoc, where, doc } from 'firebase/firestore';
import { getFromLocalStorage, saveToLocalStorage, clearLocalStorage } from '../utils/localStorageUtils';
import { Attendance } from '../types/attendance';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getStorage } from 'firebase/storage';

const storage = getStorage();

const COLLECTION_NAME = 'ASISTENCIAS';

export const fetchAttendancesFromFirebase = async () => {
  // 
  const q = query(collection(db, COLLECTION_NAME));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addAttendanceToFirebase = async (attendance: Attendance) => {
  await addDoc(collection(db, COLLECTION_NAME), attendance);
  // Actualizar localStorage después de agregar
  const updatedAttendances = await fetchAttendancesFromFirebase();
  saveToLocalStorage('attendances', updatedAttendances);
};

export const getAttendances = async () => {
  if (process.env.NODE_ENV === 'development') {
    const cachedAttendances = getFromLocalStorage('attendances');
    if (cachedAttendances) {
      return cachedAttendances;
    }
  }
  const attendances = await fetchAttendancesFromFirebase();
  if (process.env.NODE_ENV === 'development') {
    saveToLocalStorage('attendances', attendances);
  }
  return attendances;
};

export const addAttendance = async (attendance: Attendance) => {
  await addAttendanceToFirebase(attendance);
  if (process.env.NODE_ENV === 'development') {
    clearLocalStorage('attendances');
  }
};

export const updateAttendance = async (record: any) => {
  try {
    // Buscar si ya existe un registro para este estudiante, fecha y clase
    const q = query(
      collection(db, COLLECTION_NAME),
      where("studentId", "==", record.studentId),
      where("Fecha", "==", record.Fecha),
      where("classId", "==", record.classId)
    );
    const snapshot = await getDocs(q);
    let docId = record.id;
    let oldStatus: any = null;

    // Asegurarse de que no hay campos undefined en el objeto record
    const cleanRecord = { ...record };

    // Si hay justificación, asegurarse de que todos sus campos están definidos
    if (cleanRecord.justification) {
      cleanRecord.justification = {
        reason: cleanRecord.justification.reason || '',
        ...(cleanRecord.justification.documentUrl ? { documentUrl: cleanRecord.justification.documentUrl } : {}),
        timestamp: cleanRecord.justification.timestamp || new Date(),
      };
    }

    if (!snapshot.empty) {
      // Actualizar el registro existente
      const docRef = snapshot.docs[0];
      docId = docRef.id;
      const existingRecord = docRef.data();
      oldStatus = existingRecord.status;

      await updateDoc(doc(db, COLLECTION_NAME, docId), {
        ...cleanRecord,
        id: docId,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Crear un nuevo registro
      const newDocRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...cleanRecord,
        createdAt: new Date().toISOString(),
      });
      docId = newDocRef.id;
    }

    // Registrar el cambio de estado
    if (oldStatus !== record.status) {
      // this.statusChanges.push({
      //   studentId: parseInt(record.studentId),
      //   date: record.Fecha,
      //   clase: record.classId,
      //   oldStatus,
      //   newStatus: record.status,
      //   timestamp: new Date().toISOString(),
      // });
    }

    // Actualizar localStorage después de la modificación
    const updatedAttendances = await fetchAttendancesFromFirebase();
    saveToLocalStorage('attendances', updatedAttendances);
  } catch (error) {
    // this.error = 'Error al actualizar la asistencia';
    console.error(error);
  } finally {
    // this.isLoading = false;
  }
};

export const updateAttendanceWithJustification = async (studentId: string, date: string, classId: string, reason: string, file: File | null) => {
  try {
    let documentUrl: string | undefined = undefined;

    // Si hay un archivo, subirlo a Firebase Storage
    if (file) {
      const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
      const fileName = `${studentId}_${date}_${Date.now()}${fileExtension}`;
      const fileRef = storageRef(storage, `justificaciones/${fileName}`);

      // Subir el archivo
      const snapshot = await uploadBytes(fileRef, file);

      // Obtener la URL de descarga
      documentUrl = await getDownloadURL(snapshot.ref);
    }

    // Crear el objeto de justificación
    const justification: any = {
      reason,
      timestamp: new Date(),
    };

    // Solo agregar documentUrl si existe
    if (documentUrl) {
      justification.documentUrl = documentUrl;
    }

    // Actualizar el registro de asistencia
    await updateAttendance({
      studentId,
      classId,
      Fecha: date,
      status: 'Justificado',
      justification,
    });

    // Actualizar localStorage después de la modificación
    const updatedAttendances = await fetchAttendancesFromFirebase();
    saveToLocalStorage('attendances', updatedAttendances);

    return true;
  } catch (error) {
    console.error('Error saving justification:', error);
    throw error;
  }
};

export const clearLocalStorageData = () => {
  clearLocalStorage('attendances');
};