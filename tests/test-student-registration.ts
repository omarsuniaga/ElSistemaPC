// Test script to verify student registration functionality
import { createStudentFirebase, verifyDatabaseConnection } from '../src/modulos/Students/service/students.ts'

async function testStudentCreation() {
  console.log('=== Testing Student Registration ===')
  
  // Test 1: Verify database connection
  console.log('\n1. Testing database connection...')
  const isConnected = await verifyDatabaseConnection()
  if (!isConnected) {
    console.error('❌ Database connection failed')
    return
  }
  console.log('✅ Database connection successful')
  
  // Test 2: Create a test student
  console.log('\n2. Testing student creation...')
  const testStudent = {
    nombre: 'Test Student',
    apellido: 'Registration',
    email: 'test@example.com',
    instrumento: 'Piano',
    edad: '25',
    tlf: '123456789',
    direccion: 'Test Address',
    observaciones: 'Test student for registration verification',
    grupo: ['Test Group'],
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  try {
    const createdStudent = await createStudentFirebase(testStudent)
    console.log('✅ Student created successfully:', createdStudent.id)
    console.log('Student data:', JSON.stringify(createdStudent, null, 2))
  } catch (error) {
    console.error('❌ Student creation failed:', error)
  }
}

// Only run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testStudentCreation()
}

export { testStudentCreation }
