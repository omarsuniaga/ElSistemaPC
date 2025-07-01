import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  Timestamp,
} from "firebase/firestore"
import {db} from "@/firebase"
import type {AttendanceDocument, AttendanceRecord, ClassObservation} from "../types"

// Colecciones
const ATTENDANCE_COLLECTION = "attendance"
const OBSERVATIONS_COLLECTION = "observations"

// Funciones de Firebase para asistencia
export async function getAllAttendanceDocumentsFirebase(): Promise<AttendanceDocument[]> {
  const querySnapshot = await getDocs(collection(db, ATTENDANCE_COLLECTION))
  return querySnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}) as AttendanceDocument)
}

export async function getAttendancesFirebase(params: {
  classId?: string
  date?: string
  startDate?: string
  endDate?: string
}): Promise<AttendanceRecord[]> {
  let q = collection(db, ATTENDANCE_COLLECTION)
  const conditions = []

  if (params.classId) conditions.push(where("classId", "==", params.classId))
  if (params.date) conditions.push(where("date", "==", params.date))
  if (params.startDate) conditions.push(where("date", ">=", params.startDate))
  if (params.endDate) conditions.push(where("date", "<=", params.endDate))

  if (conditions.length > 0) {
    q = query(q, ...conditions)
  }

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}) as AttendanceRecord)
}

export async function getAttendanceDocumentFirebase(
  docId: string
): Promise<AttendanceDocument | null> {
  const docRef = doc(db, ATTENDANCE_COLLECTION, docId)
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? ({id: docSnap.id, ...docSnap.data()} as AttendanceDocument) : null
}

export async function addJustificationToAttendanceFirebase(
  docId: string,
  studentId: string,
  justification: {reason: string; date: string}
): Promise<void> {
  const docRef = doc(db, ATTENDANCE_COLLECTION, docId)
  await updateDoc(docRef, {
    justifications: Timestamp.fromDate(new Date()),
    [`justifications.${studentId}`]: justification,
  })
}

export async function addObservationToHistoryFirebase(
  observation: ClassObservation
): Promise<string> {
  const docRef = await addDoc(collection(db, OBSERVATIONS_COLLECTION), {
    ...observation,
    createdAt: Timestamp.fromDate(new Date()),
  })
  return docRef.id
}

export async function updateObservationInHistoryFirebase(
  observationId: string,
  updates: Partial<ClassObservation>
): Promise<void> {
  const docRef = doc(db, OBSERVATIONS_COLLECTION, observationId)
  await updateDoc(docRef, updates)
}

export async function updateObservationsFirebase(
  docId: string,
  observations: ClassObservation[]
): Promise<void> {
  const docRef = doc(db, OBSERVATIONS_COLLECTION, docId)
  await updateDoc(docRef, {observations})
}

export async function getObservationsHistoryFirebase(
  classId: string,
  date: string
): Promise<ClassObservation[]> {
  const q = query(
    collection(db, OBSERVATIONS_COLLECTION),
    where("classId", "==", classId),
    where("date", "==", date)
  )
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}) as ClassObservation)
}

export async function fetchAttendanceByDateRangeFirebase(
  startDate: string,
  endDate: string
): Promise<AttendanceRecord[]> {
  return getAttendancesFirebase({startDate, endDate})
}

export async function getAttendanceStatusFirebase(
  classId: string,
  date: string,
  studentId: string
): Promise<AttendanceRecord | null> {
  const q = query(
    collection(db, ATTENDANCE_COLLECTION),
    where("classId", "==", classId),
    where("date", "==", date),
    where("studentId", "==", studentId)
  )
  const querySnapshot = await getDocs(q)
  return querySnapshot.empty
    ? null
    : ({id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data()} as AttendanceRecord)
}

export async function getAllObservationsFirebase(): Promise<ClassObservation[]> {
  const querySnapshot = await getDocs(collection(db, OBSERVATIONS_COLLECTION))
  return querySnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}) as ClassObservation)
}

export async function getAttendanceByDateAndClassFirebase(
  date: string,
  classId: string
): Promise<AttendanceRecord[]> {
  return getAttendancesFirebase({date, classId})
}

export async function fetchAttendanceByDateFirebase(date: string): Promise<AttendanceRecord[]> {
  return getAttendancesFirebase({date})
}
