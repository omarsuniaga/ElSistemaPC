# Router Fix and StudentCard Profile Navigation Implementation

## Issues Fixed

### 1. Router Import Errors
- **Problem**: Router was trying to import `AttendanceActivitiesView.vue` from `../views/` but the file was located in `../modulos/Attendance/views/`
- **Fix**: Corrected import path to the actual location
- **Status**: ✅ Resolved

### 2. StudentCard Profile Navigation
- **Problem**: "Ver Perfil" button only emitted events instead of navigating directly to student profile
- **Solution**: 
  - Added `useRouter` import to StudentCard component
  - Updated `handleViewProfile` function to use Vue Router navigation
  - Route used: `StudentProfile` with parameter `studentId`
  - Added error handling with fallback to emit event
- **Status**: ✅ Implemented

## Changes Made

### StudentCard.vue
```typescript
// Added router import
import {useRouter} from "vue-router"

// Added router instance
const router = useRouter()

// Updated handleViewProfile function
const handleViewProfile = async () => {
  showMenu.value = false
  
  try {
    // Navigate to student profile using the student ID
    await router.push({
      name: "StudentProfile",
      params: {
        studentId: props.student.id,
      },
    })
  } catch (error) {
    console.error("Error navigating to student profile:", error)
    // Fallback: emit event for parent component to handle
    emit("view-profile", props.student)
  }
}
```

### Router Configuration
- Route: `/students/:studentId`
- Name: `StudentProfile`
- Component: `StudentProfileView.vue`
- Requires `studentId` parameter

## Testing
- ✅ Application builds successfully
- ✅ Router imports resolved
- ✅ StudentCard component properly imports router
- ✅ Navigation logic implemented with error handling

## Notes
- The functionality maintains backward compatibility by falling back to event emission if navigation fails
- Both "Ver Perfil" buttons (in dropdown menu and quick actions) use the same navigation logic
- The route requires authentication and RBAC permissions (`students.view_detail`)
