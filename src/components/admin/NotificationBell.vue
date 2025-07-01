<template>
  <div class="notification-bell-container">
    <button ref="bellButton" class="notification-bell-button" @click="toggleDropdown">
      <BellIcon class="h-6 w-6" />
      <span v-if="unreadCount > 0" class="notification-badge">
        {{ unreadCount > 99 ? "99+" : unreadCount }}
      </span>
    </button>

    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div v-if="isOpen" ref="dropdown" class="notification-dropdown">
        <div class="notification-dropdown-header">
          <h3>Notificaciones</h3>
          <button class="view-all-btn" @click="viewAllNotifications">Ver todas</button>
        </div>

        <div v-if="notifications.length === 0" class="empty-notification">
          <p>No hay notificaciones nuevas</p>
        </div>

        <div v-else class="notification-list">
          <div
            v-for="notification in notifications.slice(0, 5)"
            :key="notification.id"
            class="notification-item"
            :class="{unread: !notification.read}"
            @click="handleNotificationClick(notification)"
          >
            <div class="notification-dot" :class="getNotificationTypeClass(notification.type)" />
            <div class="notification-content">
              <h4 class="notification-title">{{ notification.title }}</h4>
              <p class="notification-message">{{ notification.message }}</p>
              <span class="notification-time">{{
                formatNotificationTime(notification.createdAt)
              }}</span>
            </div>
          </div>
        </div>

        <div v-if="unreadCount > 0" class="notification-dropdown-footer">
          <button class="mark-all-read-btn" @click="markAllAsRead">Marcar todas como leídas</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, onUnmounted} from "vue"
import {useRouter} from "vue-router"
import {BellIcon} from "@heroicons/vue/24/outline"
import {useNotificationsStore, type Notification} from "../../stores/notifications"
import {formatDistance} from "date-fns"
import {es} from "date-fns/locale"

const notificationsStore = useNotificationsStore()
const router = useRouter()

const isOpen = ref(false)
const bellButton = ref<HTMLElement | null>(null)
const dropdown = ref<HTMLElement | null>(null)

// Computed properties
const notifications = computed(() => notificationsStore.notifications)
const unreadCount = computed(() => notificationsStore.unreadCount)

// Methods
const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const closeDropdown = (event: MouseEvent) => {
  if (
    isOpen.value &&
    bellButton.value &&
    dropdown.value &&
    !bellButton.value.contains(event.target as Node) &&
    !dropdown.value.contains(event.target as Node)
  ) {
    isOpen.value = false
  }
}

const handleNotificationClick = (notification: Notification) => {
  // Mark as read if unread
  if (!notification.read && notification.id) {
    notificationsStore.markAsRead(notification.id)
  }

  // Navigate if link exists
  if (notification.link) {
    router.push(notification.link)
  }

  // Close dropdown
  isOpen.value = false
}

const viewAllNotifications = () => {
  router.push("/admin/notifications")
  isOpen.value = false
}

const markAllAsRead = async () => {
  // Get all unread notifications
  const unreadNotifications = notifications.value.filter((n) => !n.read)

  // Mark each one as read
  for (const notification of unreadNotifications) {
    if (notification.id) {
      await notificationsStore.markAsRead(notification.id)
    }
  }
}

const getNotificationTypeClass = (type: string) => {
  switch (type) {
    case "error":
      return "notification-error"
    case "warning":
      return "notification-warning"
    case "success":
      return "notification-success"
    case "info":
    default:
      return "notification-info"
  }
}

const formatNotificationTime = (createdAt: any) => {
  if (!createdAt) return ""

  const date =
    createdAt instanceof Date
      ? createdAt
      : typeof createdAt === "string"
        ? new Date(createdAt)
        : createdAt.toDate
          ? createdAt.toDate()
          : new Date()

  return formatDistance(date, new Date(), {addSuffix: true, locale: es})
}

// Lifecycle hooks
onMounted(() => {
  document.addEventListener("click", closeDropdown)
  notificationsStore.fetchNotifications()
})

onUnmounted(() => {
  document.removeEventListener("click", closeDropdown)
})
</script>

<style scoped>
.notification-bell-container {
  position: relative;
}

.notification-bell-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f3f4f6;
  color: #4b5563;
  transition: all 0.2s;
}

.notification-bell-button:hover {
  background-color: #e5e7eb;
}

.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background-color: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 600;
  border-radius: 9px;
}

.notification-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 5px);
  width: 320px;
  max-height: 400px;
  background-color: white;
  border-radius: 8px;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  z-index: 50;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.notification-dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.notification-dropdown-header h3 {
  font-weight: 600;
  font-size: 16px;
  color: #1f2937;
}

.view-all-btn {
  font-size: 12px;
  color: #3b82f6;
}

.view-all-btn:hover {
  text-decoration: underline;
}

.empty-notification {
  padding: 24px 16px;
  text-align: center;
  color: #6b7280;
}

.notification-list {
  overflow-y: auto;
  max-height: 320px;
}

.notification-item {
  display: flex;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: #f9fafb;
}

.notification-item.unread {
  background-color: #f3f4f6;
}

.notification-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 6px;
  margin-right: 12px;
  flex-shrink: 0;
}

.notification-error {
  background-color: #ef4444;
}

.notification-warning {
  background-color: #f59e0b;
}

.notification-success {
  background-color: #10b981;
}

.notification-info {
  background-color: #3b82f6;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #1f2937;
}

.notification-message {
  font-size: 12px;
  color: #4b5563;
  margin-bottom: 6px;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notification-time {
  font-size: 11px;
  color: #9ca3af;
}

.notification-dropdown-footer {
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.mark-all-read-btn {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 4px;
  background-color: #f3f4f6;
  transition: all 0.2s;
}

.mark-all-read-btn:hover {
  background-color: #e5e7eb;
  color: #4b5563;
}
</style>
