// src/modulos/Attendance/service/attendanceCollaboration.ts
import { addDoc, updateDoc, doc, collection } from 'firebase/firestore';
import { db } from '../../../firebase';
import type { AttendanceRecord } from '../types/attendance';
import { ATTENDANCE_COLLECTION } from './attendance';

/**
 * Verifica permisos de maestro antes de registrar asistencia
 * Integración con el sistema de colaboración de maestros
 */
async function validateTeacherPermissions(
  classId: string,
  teacherId: string,
  action: 'attendance' | 'observation' | 'history',
): Promise<boolean> {
  try {
    // Importar dinámicamente para evitar dependencias circulares
    const { canTeacherRecordAttendance, canTeacherAddObservations, canTeacherViewAttendanceHistory } =
      await import('../../Classes/service/classes');

    switch (action) {
    case 'attendance':
      return await canTeacherRecordAttendance(classId, teacherId);
    case 'observation':
      return await canTeacherAddObservations(classId, teacherId);
    case 'history':
      return await canTeacherViewAttendanceHistory(classId, teacherId);
    default:
      return false;
    }
  } catch (error) {
    console.error('Error validating teacher permissions:', error);
    return false;
  }
}

/**
 * Versión mejorada de addAttendanceRecord que verifica permisos de maestro
 */
export async function addAttendanceRecordWithPermissions(
  record: Omit<AttendanceRecord, 'id'>,
  teacherId: string,
): Promise<AttendanceRecord> {
  try {
    // Verificar permisos del maestro para esta clase
    const hasPermission = await validateTeacherPermissions(record.classId, teacherId, 'attendance');

    if (!hasPermission) {
      throw new Error('No tienes permisos para registrar asistencia en esta clase');
    }

    // Agregar información del maestro que registra la asistencia
    const recordWithTeacher = {
      ...record,
      updatedAt: new Date(),
    };

    // Limpiar valores undefined antes de enviar a Firestore
    const cleanedRecord = JSON.parse(JSON.stringify(recordWithTeacher));

    // Manejar casos especiales de undefined
    if (cleanedRecord.justification && cleanedRecord.justification.documentUrl === undefined) {
      cleanedRecord.justification.documentUrl = null;
    }

    // Crear el documento en Firestore
    const attendanceCollection = db ? collection(db, ATTENDANCE_COLLECTION) : null;
    if (!attendanceCollection) {
      throw new Error('Error de configuración de base de datos');
    }

    const docRef = await addDoc(attendanceCollection, cleanedRecord);
    return { id: docRef.id, ...record } as AttendanceRecord;
  } catch (error) {
    console.error('Error adding attendance record with permissions:', error);
    throw error;
  }
}

/**
 * Versión mejorada de updateAttendanceRecord que verifica permisos de maestro
 */
export async function updateAttendanceRecordWithPermissions(
  recordId: string,
  updates: Partial<AttendanceRecord>,
  teacherId: string,
  classId: string,
): Promise<void> {
  try {
    // Verificar permisos del maestro para esta clase
    const hasPermission = await validateTeacherPermissions(classId, teacherId, 'attendance');

    if (!hasPermission) {
      throw new Error('No tienes permisos para actualizar asistencia en esta clase');
    }

    // Agregar información del maestro que actualiza la asistencia
    const updatesWithTeacher = {
      ...updates,
      updatedAt: new Date(),
    };

    // Limpiar valores undefined
    const cleanedUpdates = JSON.parse(JSON.stringify(updatesWithTeacher));

    if (cleanedUpdates.justification && cleanedUpdates.justification.documentUrl === undefined) {
      cleanedUpdates.justification.documentUrl = null;
    }

    // Actualizar el documento en Firestore
    const docRef = doc(db, ATTENDANCE_COLLECTION, recordId);
    await updateDoc(docRef, cleanedUpdates);
  } catch (error) {
    console.error('Error updating attendance record with permissions:', error);
    throw error;
  }
}

/**
 * Verifica si un maestro puede agregar observaciones
 */
export async function canAddObservationWithPermissions(
  classId: string,
  teacherId: string,
): Promise<boolean> {
  return await validateTeacherPermissions(classId, teacherId, 'observation');
}

/**
 * Verifica si un maestro puede ver el historial de asistencia
 */
export async function canViewAttendanceHistoryWithPermissions(
  classId: string,
  teacherId: string,
): Promise<boolean> {
  return await validateTeacherPermissions(classId, teacherId, 'history');
}
