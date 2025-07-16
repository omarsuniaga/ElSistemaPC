import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export interface TeacherStatistics {
  activeClasses: number
  totalStudents: number
  averageAttendance: number
  classesGiven: number
  lastUpdated: string
}

export async function getTeacherStatistics(teacherId: string): Promise<TeacherStatistics> {
  try {
    // Get teacher document
    const teacherDoc = await getDoc(doc(db, 'teachers', teacherId));

    if (!teacherDoc.exists()) {
      throw new Error('Teacher not found');
    }

    // Get active classes count
    const classesQuery = query(
      collection(db, 'classes'),
      where('teacherId', '==', teacherId),
      where('status', '==', 'active'),
    );
    const classesSnapshot = await getDocs(classesQuery);

    // Get students count
    const studentsQuery = query(collection(db, 'students'), where('teacherId', '==', teacherId));
    const studentsSnapshot = await getDocs(studentsQuery);

    // Calculate average attendance (mock implementation - adjust based on your schema)
    let totalAttendance = 0;
    let totalSessions = 0;

    classesSnapshot.forEach((classDoc) => {
      // Assuming each class has attendance data
      const classData = classDoc.data();
      totalAttendance += classData.attendanceRate || 0;
      totalSessions += 1;
    });

    // Get classes given count (mock implementation - adjust based on your schema)
    const allClassesQuery = query(collection(db, 'classes'), where('teacherId', '==', teacherId));
    const allClassesSnapshot = await getDocs(allClassesQuery);

    return {
      activeClasses: classesSnapshot.size,
      totalStudents: studentsSnapshot.size,
      averageAttendance:
        totalSessions > 0 ? Math.round((totalAttendance / totalSessions) * 100) : 0,
      classesGiven: allClassesSnapshot.size,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching teacher statistics:', error);
    throw error;
  }
}
