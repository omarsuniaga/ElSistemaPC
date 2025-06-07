# Firebase Services API Documentation

This document provides comprehensive documentation for all Firebase services used in the Music Academy application.

## Table of Contents

1. [Authentication Service](#authentication-service)
2. [Firestore Services](#firestore-services)
3. [Storage Service](#storage-service)
4. [Error Handling](#error-handling)
5. [Security Rules](#security-rules)

## Authentication Service

### Overview
The authentication service handles user authentication using Firebase Auth.

### Location
- Store: `@/stores/auth.ts`
- Firebase config: `@/firebase.ts`

### Methods

#### `signIn(email: string, password: string)`
Authenticates a user with email and password.

**Parameters:**
- `email` (string): User's email address
- `password` (string): User's password

**Returns:** `Promise<void>`

**Example:**
```typescript
const authStore = useAuthStore();
await authStore.signIn('user@example.com', 'password123');
```

#### `signUp(email: string, password: string, userData: UserData)`
Creates a new user account.

**Parameters:**
- `email` (string): User's email address
- `password` (string): User's password
- `userData` (UserData): Additional user information

**Returns:** `Promise<void>`

#### `signOut()`
Signs out the current user.

**Returns:** `Promise<void>`

#### `initializeAuth()`
Initializes authentication state listener.

**Returns:** `Promise<void>`

### State Properties

- `user`: Current authenticated user
- `loading`: Authentication loading state
- `error`: Authentication error message
- `isAuthenticated`: Boolean indicating if user is authenticated

---

## Firestore Services

### Students Service

#### Location
- Store: `@/modulos/Students/store/students.ts`
- Types: `@/modulos/Students/types/student.ts`

#### Methods

##### `fetchStudents()`
Retrieves all students from Firestore.

**Returns:** `Promise<Student[]>`

**Example:**
```typescript
const studentsStore = useStudentsStore();
await studentsStore.fetchStudents();
const students = studentsStore.students;
```

##### `addStudent(student: CreateStudentData)`
Adds a new student to the database.

**Parameters:**
- `student` (CreateStudentData): Student data without ID

**Returns:** `Promise<void>`

##### `updateStudent(id: string, updates: Partial<Student>)`
Updates an existing student.

**Parameters:**
- `id` (string): Student ID
- `updates` (Partial<Student>): Fields to update

**Returns:** `Promise<void>`

##### `deleteStudent(id: string)`
Deletes a student from the database.

**Parameters:**
- `id` (string): Student ID

**Returns:** `Promise<void>`

### Teachers Service

#### Location
- Store: `@/modulos/Teachers/store/teachers.ts`
- Types: `@/modulos/Teachers/types/teacher.ts`

#### Methods

##### `fetchTeachers()`
Retrieves all teachers from Firestore.

**Returns:** `Promise<Teacher[]>`

##### `addTeacher(teacher: CreateTeacherData)`
Adds a new teacher to the database.

**Parameters:**
- `teacher` (CreateTeacherData): Teacher data without ID

**Returns:** `Promise<void>`

##### `updateTeacher(id: string, updates: Partial<Teacher>)`
Updates an existing teacher.

**Parameters:**
- `id` (string): Teacher ID
- `updates` (Partial<Teacher>): Fields to update

**Returns:** `Promise<void>`

### Classes Service

#### Location
- Store: `@/modulos/Classes/store/classes.ts`
- Types: `@/modulos/Classes/types/class.ts`

#### Methods

##### `fetchClasses()`
Retrieves all classes from Firestore.

**Returns:** `Promise<Class[]>`

##### `addClass(classData: CreateClassData)`
Adds a new class to the database.

**Parameters:**
- `classData` (CreateClassData): Class data without ID

**Returns:** `Promise<void>`

##### `updateClass(id: string, updates: Partial<Class>)`
Updates an existing class.

**Parameters:**
- `id` (string): Class ID
- `updates` (Partial<Class>): Fields to update

**Returns:** `Promise<void>`

### Attendance Service

#### Location
- Store: `@/modulos/Attendance/store/attendance.ts`
- Types: `@/modulos/Attendance/types/attendance.ts`

#### Methods

##### `fetchAttendanceDocuments(startDate?: string, endDate?: string)`
Retrieves attendance documents within a date range.

**Parameters:**
- `startDate` (string, optional): Start date in YYYY-MM-DD format
- `endDate` (string, optional): End date in YYYY-MM-DD format

**Returns:** `Promise<AttendanceDocument[]>`

##### `saveAttendance(attendanceData: AttendanceDocument)`
Saves attendance data to Firestore.

**Parameters:**
- `attendanceData` (AttendanceDocument): Complete attendance document

**Returns:** `Promise<void>`

##### `updateAttendance(id: string, updates: Partial<AttendanceDocument>)`
Updates existing attendance record.

**Parameters:**
- `id` (string): Attendance document ID
- `updates` (Partial<AttendanceDocument>): Fields to update

**Returns:** `Promise<void>`

---

## Storage Service

### Overview
Firebase Storage is used for storing files like images, documents, and other media.

### Location
- Service: `@/services/storage.ts`

### Methods

#### `uploadFile(file: File, path: string)`
Uploads a file to Firebase Storage.

**Parameters:**
- `file` (File): File to upload
- `path` (string): Storage path

**Returns:** `Promise<string>` - Download URL

#### `deleteFile(path: string)`
Deletes a file from Firebase Storage.

**Parameters:**
- `path` (string): Storage path

**Returns:** `Promise<void>`

---

## Error Handling

### Firebase Error Codes

#### Authentication Errors

| Code | Description | User Message |
|------|-------------|--------------|
| `auth/user-not-found` | User doesn't exist | Usuario no encontrado |
| `auth/wrong-password` | Incorrect password | Contraseña incorrecta |
| `auth/email-already-in-use` | Email already registered | El correo electrónico ya está en uso |
| `auth/weak-password` | Password too weak | La contraseña es muy débil |
| `auth/invalid-email` | Invalid email format | Correo electrónico inválido |

#### Firestore Errors

| Code | Description | User Message |
|------|-------------|--------------|
| `firestore/permission-denied` | Insufficient permissions | No tienes permisos para esta operación |
| `firestore/not-found` | Document not found | Documento no encontrado |
| `firestore/already-exists` | Document already exists | El documento ya existe |

### Error Handling Utility

Use the centralized error handler:

```typescript
import { ErrorHandler } from '@/utils/errorHandler';

const { data, error } = await ErrorHandler.withErrorHandling(
  () => studentsStore.fetchStudents(),
  'Fetching students'
);

if (error) {
  // Handle error
  console.error(error.message);
}
```

---

## Security Rules

### Firestore Security Rules

#### Students Collection
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /students/{studentId} {
      allow read, write: if request.auth != null && 
        (request.auth.token.role == 'admin' || 
         request.auth.token.role == 'teacher');
    }
  }
}
```

#### Teachers Collection
```javascript
match /teachers/{teacherId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && 
    request.auth.token.role == 'admin';
}
```

#### Attendance Collection
```javascript
match /attendance/{attendanceId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && 
    (request.auth.token.role == 'admin' || 
     request.auth.token.role == 'teacher');
}
```

### Storage Security Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /students/{studentId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
        (request.auth.token.role == 'admin' || 
         request.auth.token.role == 'teacher');
    }
  }
}
```

---

## Best Practices

### 1. Error Handling
- Always wrap Firebase operations in try-catch blocks
- Use the centralized error handler for consistent error messages
- Log errors with appropriate context

### 2. Performance
- Use Firestore queries efficiently with proper indexing
- Implement pagination for large datasets
- Cache frequently accessed data

### 3. Security
- Never expose sensitive data in client-side code
- Validate all data on both client and server side
- Use security rules to enforce permissions

### 4. Data Structure
- Keep documents under 1MB
- Use subcollections for nested data
- Structure data for efficient queries

### 5. Offline Support
- Design for offline-first when possible
- Handle network errors gracefully
- Implement proper sync strategies

---

## Debugging

### Enable Debug Mode
Set `VITE_DEBUG_MODE=true` in your environment variables to enable detailed Firebase logging.

### Common Issues

1. **Permission Denied**
   - Check security rules
   - Verify user authentication
   - Ensure user has proper role

2. **Document Not Found**
   - Verify document ID
   - Check if document was deleted
   - Ensure proper collection path

3. **Network Errors**
   - Check internet connection
   - Verify Firebase configuration
   - Check for firewall issues
