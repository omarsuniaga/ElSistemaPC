// (or whichever component is using both AttendanceList and JustifiedAbsenceModal) // Modify the
template section to handle the justification save separately
<JustifiedAbsenceModal
  :student="selectedStudent"
  :classId="classId"
  :date="date"
  @close="closeJustificationModal"
  @save="handleJustificationSave"
/>

<AttendanceList
  :selectedClassName="className"
  :initialClassId="classId"
  :date="date"
  :students="students"
  :attendanceRecords="attendanceRecords"
  @open-justification="openJustificationModal"
  @handle-justification-save="attendanceListRef.handleSaveJustification"
/>

// In the script section: const attendanceListRef = ref(null); // Add a ref to the AttendanceList
component // And add the handler: const handleJustificationSave = (justificationData) => { // Pass
the justification data to the AttendanceList component if (attendanceListRef.value) {
attendanceListRef.value.handleSaveJustification(justificationData); } };
