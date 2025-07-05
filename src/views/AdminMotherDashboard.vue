<template>
  <div
    class="min-h-screen bg-gradient-to-br mb-16 from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6"
  >
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Centro de Comando
        </h1>
        <p class="mt-1 text-md text-gray-600 dark:text-gray-400">
          Vista general del estado y rendimiento de la academia.
        </p>
      </div>

      <!-- Global Overview Section -->
      <GlobalOverview />

      <!-- Main Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column (2/3 width) -->
        <div class="lg:col-span-2 space-y-6">
          <!-- KPIs -->
          <DashboardKPIs />

          <!-- Attendance Chart -->
          <WeeklyAttendanceChart />

          <!-- Quick Actions -->
          <QuickActionsPanel />
        </div>

        <!-- Right Column (1/3 width) -->
        <div class="space-y-6">
          <!-- System Health -->
          <SystemHealthMonitor />

          <!-- Pending Notifications -->
          <PendingNotifications />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DashboardKPIs from "../components/Admin/Dashboard/DashboardKPIs.vue"
import WeeklyAttendanceChart from "../components/Admin/Dashboard/WeeklyAttendanceChart.vue"
import QuickActionsPanel from "../components/Admin/Dashboard/QuickActionsPanel.vue"
import SystemHealthMonitor from "../components/Admin/Dashboard/SystemHealthMonitor.vue"
import PendingNotifications from "../components/Admin/Dashboard/PendingNotifications.vue"
import GlobalOverview from "../components/Admin/Dashboard/GlobalOverview.vue"

defineOptions({
  name: "AdminMotherDashboard",
})
</script>

<style scoped>
/* Scoped styles for the dashboard */
</style>
