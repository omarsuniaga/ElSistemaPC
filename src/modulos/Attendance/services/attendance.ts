// ... existing imports ...

/**
 * Get attendance records by date and class ID
 * @param date The date in 'YYYY-MM-DD' format
 * @param classId The class ID
 * @returns Promise resolving to array of attendance records
 */
export async function getAttendanceByDateAndClassFirebase(
  date: string,
  classId: string
): Promise<AttendanceRecord[]> {
  try {
    // Get Firestore references
    const db = getFirestore();
    const attendancesCollection = collection(db, 'attendances');
    
    // Query for attendance records matching date and class
    const q = query(
      attendancesCollection,
      where('Fecha', '==', date),
      where('classId', '==', classId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log(`No attendance records found for date ${date} and class ${classId}`);
      return [];
    }
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        studentId: data.studentId,
        classId: data.classId,
        Fecha: data.Fecha,
        status: data.status,
        notes: data.notes
      } as AttendanceRecord;
    });
  } catch (error) {
    console.error('Error in getAttendanceByDateAndClassFirebase:', error);
    throw error;
  }
}

// ... existing code ...
