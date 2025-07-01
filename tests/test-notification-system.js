// Test file to verify the notification system implementation
// This file demonstrates how the notification system works

import {createStudentRegistrationNotification} from "../src/modulos/Teachers/services/generalNotifications"
import {fetchTeachersFromFirebase} from "../src/modulos/Teachers/services/teachers"

// Test function to create a sample notification
export const testNotificationSystem = async () => {
  try {
    console.log("🧪 Testing notification system...")

    // Sample student data
    const sampleStudent = {
      id: "test-student-123",
      firstName: "Juan",
      lastName: "Pérez",
      email: "juan.perez@example.com",
      phone: "+1234567890",
      instrument: "Guitarra",
    }

    // Get teachers
    const teachers = await fetchTeachersFromFirebase()
    console.log("📚 Found teachers:", teachers.length)

    // Send notification to first teacher (if exists)
    if (teachers.length > 0) {
      const firstTeacher = teachers[0]
      console.log("📤 Sending notification to teacher:", firstTeacher.name)

      const notificationId = await createStudentRegistrationNotification({
        teacherId: firstTeacher.id,
        studentId: sampleStudent.id,
        studentName: `${sampleStudent.firstName} ${sampleStudent.lastName}`,
        studentData: sampleStudent,
        fromUserId: "admin-test",
        fromUserName: "Administrador de Prueba",
      })

      console.log("✅ Notification created with ID:", notificationId)
      return {success: true, notificationId}
    } else {
      console.log("⚠️ No teachers found in the system")
      return {success: false, error: "No teachers found"}
    }
  } catch (error) {
    console.error("❌ Error testing notification system:", error)
    return {success: false, error: error.message}
  }
}

// Example usage:
// testNotificationSystem().then(result => {
//   if (result.success) {
//     console.log('Test passed!', result.notificationId)
//   } else {
//     console.log('Test failed:', result.error)
//   }
// })
