<template>
  <div class="collaboration-view">
    <!-- Header -->
    <div class="view-header">
      <div class="header-content">
        <h1 class="view-title">Centro de Colaboración</h1>
        <p class="view-description">Colabora con otros músicos y profesores en tiempo real</p>
      </div>
      <div class="header-actions">
        <button class="btn-primary" @click="showInviteModal = true">
          <i class="fas fa-user-plus" />
          Invitar Colaborador
        </button>
      </div>
    </div>

    <!-- Active Sessions -->
    <div class="section">
      <h2 class="section-title">Sesiones Activas</h2>
      <div v-if="activeSessions.length === 0" class="empty-state">
        <i class="fas fa-users" />
        <p>No hay sesiones de colaboración activas</p>
        <button class="btn-primary" @click="startNewSession">Iniciar Sesión</button>
      </div>
      <div v-else class="sessions-grid">
        <div
          v-for="session in activeSessions"
          :key="session.id"
          class="session-card"
          @click="joinSession(session)"
        >
          <div class="session-header">
            <h3>{{ session.title }}</h3>
            <span class="session-status live">
              <i class="fas fa-circle" />
              En vivo
            </span>
          </div>
          <p class="session-description">{{ session.description }}</p>
          <div class="session-participants">
            <div class="participants-avatars">
              <div
                v-for="participant in session.participants.slice(0, 3)"
                :key="participant.id"
                class="avatar"
                :title="participant.name"
              >
                <img v-if="participant.avatar" :src="participant.avatar" :alt="participant.name" />
                <span v-else class="avatar-initials">
                  {{ getInitials(participant.name) }}
                </span>
              </div>
              <div v-if="session.participants.length > 3" class="avatar-count">
                +{{ session.participants.length - 3 }}
              </div>
            </div>
            <span class="participants-count">
              {{ session.participants.length }} participante{{
                session.participants.length !== 1 ? "s" : ""
              }}
            </span>
          </div>
          <div class="session-meta">
            <span class="session-type">{{ getSessionTypeLabel(session.type) }}</span>
            <span class="session-duration">{{ formatDuration(session.startTime) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="section">
      <h2 class="section-title">Actividad Reciente</h2>
      <div class="activity-feed">
        <div v-for="activity in recentActivity" :key="activity.id" class="activity-item">
          <div class="activity-avatar">
            <img
              v-if="activity.user.avatar"
              :src="activity.user.avatar"
              :alt="activity.user.name"
            />
            <span v-else class="avatar-initials">
              {{ getInitials(activity.user.name) }}
            </span>
          </div>
          <div class="activity-content">
            <div class="activity-header">
              <span class="activity-user">{{ activity.user.name }}</span>
              <span class="activity-action">{{ activity.action }}</span>
              <span class="activity-target">{{ activity.target }}</span>
            </div>
            <div class="activity-meta">
              <span class="activity-time">{{ formatTimeAgo(activity.timestamp) }}</span>
              <span v-if="activity.work" class="activity-work"> en {{ activity.work }} </span>
            </div>
          </div>
          <div class="activity-icon">
            <i :class="getActivityIcon(activity.type)" />
          </div>
        </div>
      </div>
    </div>

    <!-- Shared Resources -->
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Recursos Compartidos</h2>
        <button class="btn-secondary" @click="showResourceModal = true">
          <i class="fas fa-plus" />
          Compartir Recurso
        </button>
      </div>
      <div class="resources-grid">
        <div
          v-for="resource in sharedResources"
          :key="resource.id"
          class="resource-card"
          @click="openResource(resource)"
        >
          <div class="resource-icon">
            <i :class="getResourceIcon(resource.type)" />
          </div>
          <div class="resource-content">
            <h4>{{ resource.title }}</h4>
            <p>{{ resource.description }}</p>
            <div class="resource-meta">
              <span class="resource-type">{{ getResourceTypeLabel(resource.type) }}</span>
              <span class="resource-date">{{ formatDate(resource.createdAt) }}</span>
            </div>
          </div>
          <div class="resource-actions">
            <button class="btn-icon" @click.stop="downloadResource(resource)">
              <i class="fas fa-download" />
            </button>
            <button class="btn-icon" @click.stop="shareResource(resource)">
              <i class="fas fa-share" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Comments and Feedback -->
    <div class="section">
      <h2 class="section-title">Comentarios y Retroalimentación</h2>
      <div class="comments-section">
        <div class="comment-form">
          <div class="form-header">
            <h3>Nuevo Comentario</h3>
            <select v-model="newComment.workId" class="form-select">
              <option value="">Seleccionar obra...</option>
              <option v-for="work in availableWorks" :key="work.id" :value="work.id">
                {{ work.title }}
              </option>
            </select>
          </div>
          <div class="comment-input">
            <textarea
              v-model="newComment.content"
              placeholder="Escribe tu comentario..."
              rows="3"
              class="form-textarea"
            />
            <div class="comment-actions">
              <button
                :disabled="!newComment.content.trim()"
                class="btn-primary"
                @click="submitComment"
              >
                <i class="fas fa-paper-plane" />
                Enviar
              </button>
            </div>
          </div>
        </div>

        <div class="comments-list">
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <div class="comment-avatar">
              <img v-if="comment.user.avatar" :src="comment.user.avatar" :alt="comment.user.name" />
              <span v-else class="avatar-initials">
                {{ getInitials(comment.user.name) }}
              </span>
            </div>
            <div class="comment-content">
              <div class="comment-header">
                <span class="comment-user">{{ comment.user.name }}</span>
                <span v-if="comment.work" class="comment-work">
                  sobre {{ comment.work.title }}
                </span>
                <span class="comment-time">{{ formatTimeAgo(comment.createdAt) }}</span>
              </div>
              <p class="comment-text">{{ comment.content }}</p>
              <div class="comment-actions">
                <button class="comment-action" @click="likeComment(comment)">
                  <i :class="comment.liked ? 'fas fa-heart' : 'far fa-heart'" />
                  {{ comment.likes }}
                </button>
                <button class="comment-action" @click="replyToComment(comment)">
                  <i class="fas fa-reply" />
                  Responder
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Invite Modal -->
    <div v-if="showInviteModal" class="modal-overlay" @click="closeInviteModal">
      <div class="modal-content" @click.stop>
        <h3>Invitar Colaborador</h3>
        <form @submit.prevent="sendInvitation">
          <div class="form-group">
            <label>Email del colaborador</label>
            <input
              v-model="invitation.email"
              type="email"
              required
              class="form-input"
              placeholder="ejemplo@email.com"
            />
          </div>
          <div class="form-group">
            <label>Rol</label>
            <select v-model="invitation.role" class="form-select">
              <option value="VIEWER">Visualizador</option>
              <option value="COLLABORATOR">Colaborador</option>
              <option value="EDITOR">Editor</option>
            </select>
          </div>
          <div class="form-group">
            <label>Mensaje (opcional)</label>
            <textarea
              v-model="invitation.message"
              rows="3"
              class="form-textarea"
              placeholder="Mensaje personalizado..."
            />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="closeInviteModal">Cancelar</button>
            <button type="submit" class="btn-primary">Enviar Invitación</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Resource Share Modal -->
    <div v-if="showResourceModal" class="modal-overlay" @click="closeResourceModal">
      <div class="modal-content" @click.stop>
        <h3>Compartir Recurso</h3>
        <form @submit.prevent="shareNewResource">
          <div class="form-group">
            <label>Título</label>
            <input v-model="newResource.title" type="text" required class="form-input" />
          </div>
          <div class="form-group">
            <label>Tipo</label>
            <select v-model="newResource.type" class="form-select">
              <option value="SCORE">Partitura</option>
              <option value="AUDIO">Audio</option>
              <option value="VIDEO">Video</option>
              <option value="DOCUMENT">Documento</option>
              <option value="LINK">Enlace</option>
            </select>
          </div>
          <div class="form-group">
            <label>Descripción</label>
            <textarea v-model="newResource.description" rows="3" class="form-textarea" />
          </div>
          <div class="form-group">
            <label>Archivo o URL</label>
            <input
              v-if="newResource.type === 'LINK'"
              v-model="newResource.url"
              type="url"
              class="form-input"
              placeholder="https://..."
            />
            <input v-else type="file" class="form-input" @change="handleFileUpload" />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="closeResourceModal">
              Cancelar
            </button>
            <button type="submit" class="btn-primary">Compartir</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {useRouter} from "vue-router"
import {useCollaboration} from "../composables/useCollaboration"
import type {CollaborationSession, Activity, SharedResource, Comment, Work} from "../types"

const router = useRouter()
const {
  activeSessions,
  recentActivity,
  sharedResources,
  comments,
  availableWorks,
  startSession,
  joinSession: joinCollaborationSession,
  sendInvitation: sendCollaborationInvitation,
  shareResource: shareCollaborationResource,
  addComment,
} = useCollaboration()

// State
const showInviteModal = ref(false)
const showResourceModal = ref(false)

// Form data
const invitation = ref({
  email: "",
  role: "COLLABORATOR",
  message: "",
})

const newResource = ref({
  title: "",
  type: "DOCUMENT",
  description: "",
  url: "",
  file: null as File | null,
})

const newComment = ref({
  workId: "",
  content: "",
})

// Methods
const startNewSession = async () => {
  try {
    const session = await startSession({
      title: "Nueva Sesión de Colaboración",
      description: "Sesión de trabajo colaborativo",
      type: "GENERAL",
    })
    await joinSession(session)
  } catch (error) {
    console.error("Error starting session:", error)
  }
}

const joinSession = async (session: CollaborationSession) => {
  try {
    await joinCollaborationSession(session.id)
    // Navigate to session view or open session modal
    console.log("Joined session:", session.id)
  } catch (error) {
    console.error("Error joining session:", error)
  }
}

const sendInvitation = async () => {
  try {
    await sendCollaborationInvitation({
      email: invitation.value.email,
      role: invitation.value.role as "VIEWER" | "COLLABORATOR" | "EDITOR",
      message: invitation.value.message,
    })
    closeInviteModal()
  } catch (error) {
    console.error("Error sending invitation:", error)
  }
}

const shareNewResource = async () => {
  try {
    await shareCollaborationResource({
      title: newResource.value.title,
      type: newResource.value.type as any,
      description: newResource.value.description,
      url: newResource.value.url,
      file: newResource.value.file,
    })
    closeResourceModal()
  } catch (error) {
    console.error("Error sharing resource:", error)
  }
}

const submitComment = async () => {
  if (newComment.value.content.trim()) {
    try {
      await addComment({
        workId: newComment.value.workId || undefined,
        content: newComment.value.content,
      })
      newComment.value = {workId: "", content: ""}
    } catch (error) {
      console.error("Error submitting comment:", error)
    }
  }
}

const likeComment = async (comment: Comment) => {
  // Implementation for liking a comment
  console.log("Like comment:", comment.id)
}

const replyToComment = (comment: Comment) => {
  // Implementation for replying to a comment
  console.log("Reply to comment:", comment.id)
}

const openResource = (resource: SharedResource) => {
  if (resource.url) {
    window.open(resource.url, "_blank")
  }
}

const downloadResource = (resource: SharedResource) => {
  // Implementation for downloading resource
  console.log("Download resource:", resource.id)
}

const shareResource = (resource: SharedResource) => {
  // Implementation for sharing resource
  console.log("Share resource:", resource.id)
}

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    newResource.value.file = target.files[0]
  }
}

const closeInviteModal = () => {
  showInviteModal.value = false
  invitation.value = {email: "", role: "COLLABORATOR", message: ""}
}

const closeResourceModal = () => {
  showResourceModal.value = false
  newResource.value = {
    title: "",
    type: "DOCUMENT",
    description: "",
    url: "",
    file: null,
  }
}

// Utility functions
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const getSessionTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    PRACTICE: "Práctica",
    REVIEW: "Revisión",
    PLANNING: "Planificación",
    GENERAL: "General",
  }
  return labels[type] || type
}

const getResourceTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    SCORE: "Partitura",
    AUDIO: "Audio",
    VIDEO: "Video",
    DOCUMENT: "Documento",
    LINK: "Enlace",
  }
  return labels[type] || type
}

const getResourceIcon = (type: string) => {
  const icons: Record<string, string> = {
    SCORE: "fas fa-music",
    AUDIO: "fas fa-volume-up",
    VIDEO: "fas fa-video",
    DOCUMENT: "fas fa-file-text",
    LINK: "fas fa-link",
  }
  return icons[type] || "fas fa-file"
}

const getActivityIcon = (type: string) => {
  const icons: Record<string, string> = {
    COMMENT: "fas fa-comment",
    EDIT: "fas fa-edit",
    SHARE: "fas fa-share",
    JOIN: "fas fa-sign-in-alt",
    UPLOAD: "fas fa-upload",
  }
  return icons[type] || "fas fa-info-circle"
}

const formatDuration = (startTime: string) => {
  const start = new Date(startTime)
  const now = new Date()
  const diff = now.getTime() - start.getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 60) {
    return `${minutes} min`
  } else {
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
  }
}

const formatTimeAgo = (timestamp: string) => {
  const now = new Date()
  const time = new Date(timestamp)
  const diff = now.getTime() - time.getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return "Hace un momento"
  if (minutes < 60) return `Hace ${minutes} min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours}h`

  const days = Math.floor(hours / 24)
  return `Hace ${days} día${days !== 1 ? "s" : ""}`
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

onMounted(() => {
  // Data is loaded through composables
})
</script>

<style scoped>
.collaboration-view {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
}

.header-content {
  flex: 1;
}

.view-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.view-description {
  color: #6b7280;
  margin: 0;
  font-size: 1.1rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.section {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1.5rem 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header .section-title {
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #9ca3af;
}

.sessions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.session-card {
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.session-card:hover {
  border-color: #3b82f6;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.session-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.session-status.live {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #10b981;
  text-transform: uppercase;
}

.session-status.live i {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.session-description {
  color: #6b7280;
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.session-participants {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.participants-avatars {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3b82f6;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
}

.avatar-count {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
}

.participants-count {
  font-size: 0.875rem;
  color: #6b7280;
}

.session-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: #9ca3af;
}

.activity-feed {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.activity-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.activity-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.activity-content {
  flex: 1;
}

.activity-header {
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.activity-user {
  font-weight: 600;
  color: #1f2937;
}

.activity-action {
  color: #6b7280;
}

.activity-target {
  font-weight: 500;
  color: #3b82f6;
}

.activity-meta {
  font-size: 0.75rem;
  color: #9ca3af;
}

.activity-work {
  font-style: italic;
}

.activity-icon {
  color: #9ca3af;
  font-size: 0.875rem;
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.resource-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.resource-card:hover {
  border-color: #3b82f6;
  transform: translateY(-1px);
}

.resource-icon {
  width: 40px;
  height: 40px;
  border-radius: 0.5rem;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.resource-content {
  flex: 1;
}

.resource-content h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.resource-content p {
  color: #6b7280;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
  font-size: 0.875rem;
}

.resource-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: #9ca3af;
}

.resource-actions {
  display: flex;
  gap: 0.25rem;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  border-radius: 0.25rem;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: #f3f4f6;
  color: #374151;
}

.comments-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.comment-form {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.form-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.comment-input {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comment-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.comment-user {
  font-weight: 600;
  color: #1f2937;
}

.comment-work {
  color: #6b7280;
}

.comment-time {
  color: #9ca3af;
  margin-left: auto;
}

.comment-text {
  color: #374151;
  margin: 0 0 0.75rem 0;
  line-height: 1.5;
}

.comment-actions {
  display: flex;
  gap: 1rem;
}

.comment-action {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 0.75rem;
  cursor: pointer;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.comment-action:hover {
  color: #374151;
}

.btn-primary,
.btn-secondary {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.form-select,
.form-input,
.form-textarea {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-select:focus,
.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 0.75rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-content h3 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

@media (max-width: 768px) {
  .collaboration-view {
    padding: 1rem;
  }

  .view-header {
    flex-direction: column;
    align-items: stretch;
  }

  .sessions-grid,
  .resources-grid {
    grid-template-columns: 1fr;
  }

  .session-participants {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .form-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
}
</style>
