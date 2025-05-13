// This is an example of how the function should be called from other components

// Look for something like this in your attendance view:
const exportCurrentClassAttendanceToPDF = async () => {
  try {
    // Make sure parameters are passed in the correct order
    await generateAttendancePDF(
      studentsInClass.value, // Array of students
      attendanceRecords.value, // Record of attendance states
      observations.value || 'Sin observaciones', // Observations text
      classData.value.name, // Class name
      classData.value.teacher?.name || 'Profesor no especificado', // Teacher name - MAKE SURE THIS IS CORRECT
      selectedDate.value, // Date string in ISO format
      justifications.value // Object with justifications if any
    );
  } catch (error) {
    console.error('Error generando PDF:', error);
  }
};
