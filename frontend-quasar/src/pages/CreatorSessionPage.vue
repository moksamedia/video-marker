<template>
  <q-page class="q-pa-md">
    <!-- Loading State -->
    <div v-if="loading" class="row justify-center q-pa-xl">
      <q-spinner-dots color="primary" size="50px" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="row justify-center">
      <q-card style="max-width: 500px; width: 100%">
        <q-card-section class="bg-negative text-white">
          <div class="text-h6">
            <q-icon name="error" /> Error Loading Session
          </div>
        </q-card-section>
        <q-card-section>
          {{ error }}
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Go Home" to="/" color="primary" />
        </q-card-actions>
      </q-card>
    </div>

    <!-- Session Content -->
    <div v-else-if="sessionStore.session" class="session-container">
      <!-- Video Info Header -->
      <q-card class="q-mb-md">
        <q-card-section class="session-header">
          <div class="header-row">
            <q-avatar size="64px" rounded>
              <img :src="sessionStore.session.youtube_thumbnail" alt="Video thumbnail" />
            </q-avatar>
            <div class="title-section">
              <div class="text-h6">{{ sessionStore.session.youtube_title }}</div>
              <div class="text-caption text-grey-7">
                <q-chip dense color="primary" text-color="white" icon="manage_accounts">
                  Creator Mode
                </q-chip>
              </div>
            </div>
            <div class="header-buttons">
              <q-btn
                flat
                round
                dense
                icon="content_copy"
                @click="copyHelperLink"
                color="secondary"
              >
                <q-tooltip>Copy helper link</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                dense
                icon="open_in_new"
                @click="openHelperPage"
                color="secondary"
              >
                <q-tooltip>Open helper page</q-tooltip>
              </q-btn>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Single Column Layout -->
      <div class="vertical-layout">
        <!-- Video Player - Full Width -->
        <CreatorVideoPlayer
          ref="videoPlayerRef"
          :video-id="getYouTubeId(sessionStore.session.youtube_url)"
          :selected-marker="sessionStore.selectedMarker"
          @current-time-update="sessionStore.setCurrentTime($event)"
          @duration-update="sessionStore.setVideoDuration($event)"
          @create-marker="handleCreateMarker"
          @delete-session="handleDeleteSession"
          @delete-marker="handleDeleteMarker"
          class="q-mb-md"
        />

        <!-- Timeline with Navigation - Full Width -->
        <div class="row items-center q-gutter-sm q-mb-md">
          <q-btn
            round
            icon="chevron_left"
            @click="goToPreviousMarker"
            :disable="!hasPreviousMarker"
            color="primary"
          >
            <q-tooltip>Previous marker</q-tooltip>
          </q-btn>

          <MarkerTimeline
            :markers="sessionStore.markers"
            :current-time="sessionStore.currentTime"
            :duration="sessionStore.videoDuration"
            :selected-marker="sessionStore.selectedMarker"
            @marker-click="selectMarker"
            @seek="seekTo"
            class="col"
          />

          <q-btn
            round
            icon="chevron_right"
            @click="goToNextMarker"
            :disable="!hasNextMarker"
            color="primary"
          >
            <q-tooltip>Next marker</q-tooltip>
          </q-btn>
        </div>

        <!-- Thread Panel - Full Width -->
        <ThreadPanel
          :marker="sessionStore.selectedMarker"
          :markers="sessionStore.markers"
          role="creator"
          :token="sessionToken"
          @post-created="refreshSession"
          @marker-selected="sessionStore.setSelectedMarker"
          @seek="handleSeek"
          @play-from-marker="handlePlayFromMarker"
          @marker-updated="refreshSession"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { apiService } from 'src/services/api'
import { useSessionStore } from 'src/stores/session-store'
import CreatorVideoPlayer from 'src/components/CreatorVideoPlayer.vue'
import MarkerTimeline from 'src/components/MarkerTimeline.vue'
import ThreadPanel from 'src/components/ThreadPanel.vue'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const sessionStore = useSessionStore()

const loading = ref(true)
const error = ref(null)
const videoPlayerRef = ref(null)
const sessionToken = ref(null)  // Store token to prevent Android query param issues

const helperUrl = computed(() => {
  if (!sessionStore.session) return ''
  const base = window.location.origin
  return `${base}/#/helper/${sessionStore.session.id}?token=${sessionStore.session.helper_token}`
})

// Marker navigation
const currentMarkerIndex = computed(() => {
  if (!sessionStore.selectedMarker || !sessionStore.markers.length) return -1
  return sessionStore.markers.findIndex((m) => m.id === sessionStore.selectedMarker.id)
})

const hasPreviousMarker = computed(() => {
  return currentMarkerIndex.value > 0
})

const hasNextMarker = computed(() => {
  return currentMarkerIndex.value >= 0 && currentMarkerIndex.value < sessionStore.markers.length - 1
})

// Watch for marker selection from drawer
watch(() => sessionStore.selectedMarker, (newMarker) => {
  if (newMarker && videoPlayerRef.value) {
    videoPlayerRef.value.seekToTime(newMarker.start_time)
  }
})

onMounted(() => {
  loadSession()

  // Add spacebar listener for play/pause
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  // Clear session when leaving
  sessionStore.clearSession()

  // Remove spacebar listener
  window.removeEventListener('keydown', handleKeyDown)
})

async function loadSession() {
  loading.value = true
  error.value = null

  try {
    const token = route.query.token
    if (!token) {
      error.value = 'Token is required'
      return
    }

    // Store token for later use (prevents Android query param issues)
    sessionToken.value = token

    const sessionData = await apiService.getSession(route.params.id, token)

    if (sessionData.role !== 'creator') {
      error.value = 'This URL is for creators only'
      return
    }

    sessionStore.setSession(sessionData)
  } catch (err) {
    error.value = err.response?.data?.error || err.message || 'Failed to load session'
  } finally {
    loading.value = false
  }
}

async function refreshSession() {
  try {
    // Use stored token instead of route.query.token (Android fix)
    const sessionData = await apiService.getSession(route.params.id, sessionToken.value)
    sessionStore.updateSession(sessionData)
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to refresh session',
      icon: 'error',
    })
  }
}

async function handleCreateMarker(startTime, endTime) {
  try {
    await apiService.createMarker(route.params.id, sessionToken.value, startTime, endTime)
    await refreshSession()
  } catch (err) {
    throw new Error(err.response?.data?.error || 'Failed to create marker')
  }
}

async function handleDeleteSession() {
  try {
    await apiService.deleteSession(route.params.id, sessionToken.value)

    $q.notify({
      type: 'positive',
      message: 'Session deleted',
      icon: 'delete',
    })

    router.push('/')
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.response?.data?.error || 'Failed to delete session',
      icon: 'error',
    })
  }
}

async function handleDeleteMarker(markerId) {
  try {
    await apiService.deleteMarker(markerId, sessionToken.value)

    $q.notify({
      type: 'positive',
      message: 'Marker deleted',
      icon: 'delete',
    })

    // Clear selection and refresh
    sessionStore.setSelectedMarker(null)
    await refreshSession()
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.response?.data?.error || 'Failed to delete marker',
      icon: 'error',
    })
  }
}

function selectMarker(marker) {
  sessionStore.setSelectedMarker(marker)
}

function goToPreviousMarker() {
  if (hasPreviousMarker.value) {
    const previousMarker = sessionStore.markers[currentMarkerIndex.value - 1]
    sessionStore.setSelectedMarker(previousMarker)
  }
}

function goToNextMarker() {
  if (hasNextMarker.value) {
    const nextMarker = sessionStore.markers[currentMarkerIndex.value + 1]
    sessionStore.setSelectedMarker(nextMarker)
  }
}

function seekTo(time) {
  if (videoPlayerRef.value) {
    videoPlayerRef.value.seekToTime(time)
  }
}

function handleSeek(deltaSeconds) {
  if (videoPlayerRef.value) {
    const currentTime = sessionStore.currentTime
    const newTime = Math.max(0, currentTime + deltaSeconds)
    videoPlayerRef.value.seekToTime(newTime)
  }
}

function handlePlayFromMarker(startTime) {
  if (videoPlayerRef.value) {
    videoPlayerRef.value.seekToTime(startTime)
    videoPlayerRef.value.play()
  }
}

function getYouTubeId(url) {
  if (!url) return ''
  const match = url.match(/[?&]v=([^&]+)/)
  return match ? match[1] : ''
}

function copyHelperLink() {
  navigator.clipboard.writeText(helperUrl.value)
  $q.notify({
    type: 'positive',
    message: 'Helper link copied to clipboard!',
    icon: 'content_copy',
    timeout: 1500,
  })
}

function openHelperPage() {
  window.open(helperUrl.value, '_blank')
}

function handleKeyDown(event) {
  // Spacebar for play/pause
  if (event.code === 'Space' || event.key === ' ') {
    // Don't override spacebar if user is typing in an input or textarea
    const target = event.target
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return
    }

    // Prevent default scrolling behavior and button triggers
    event.preventDefault()
    if (videoPlayerRef.value) {
      videoPlayerRef.value.togglePlayPause()
    }
  }
}
</script>

<style scoped>
.session-container {
  max-width: 1200px;
  margin: 0 auto;
}

.vertical-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* Session header responsive layout */
.session-header {
  padding: 16px;
}

.header-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-section {
  flex: 1;
  min-width: 0; /* Allow text truncation */
}

.header-buttons {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* Mobile layout: stack title below thumbnail and buttons */
@media (max-width: 500px) {
  .header-row {
    flex-wrap: wrap;
  }

  .title-section {
    order: 3;
    flex-basis: 100%;
    margin-top: 12px;
    margin-left: 0;
  }

  .header-buttons {
    order: 2;
    margin-left: auto;
  }
}
</style>
