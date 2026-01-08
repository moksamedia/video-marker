<template>
  <q-page class="q-pa-md">
    <!-- Loading State -->
    <div v-if="loading" class="row justify-center q-pa-xl">
      <q-spinner-dots color="secondary" size="50px" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="row justify-center">
      <q-card style="max-width: 500px; width: 100%">
        <q-card-section class="bg-negative text-white">
          <div class="text-h6"><q-icon name="error" /> Error Loading Session</div>
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
      <!-- Single Column Layout -->
      <div class="vertical-layout">
        <!-- Video Player - Full Width -->
        <HelperVideoPlayer
          ref="videoPlayerRef"
          :video-id="getYouTubeId(sessionStore.session.youtube_url)"
          @current-time-update="sessionStore.setCurrentTime($event)"
          @duration-update="sessionStore.setVideoDuration($event)"
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
          role="helper"
          :token="sessionToken"
          @post-created="refreshSession"
          @marker-selected="sessionStore.setSelectedMarker"
          @seek="handleSeek"
          @play-from-marker="handlePlayFromMarker"
          @toggle-play-pause="handleTogglePlayPause"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { apiService } from 'src/services/api'
import { useSessionStore } from 'src/stores/session-store'
import HelperVideoPlayer from 'src/components/HelperVideoPlayer.vue'
import MarkerTimeline from 'src/components/MarkerTimeline.vue'
import ThreadPanel from 'src/components/ThreadPanel.vue'

const route = useRoute()
const $q = useQuasar()
const sessionStore = useSessionStore()

const loading = ref(true)
const error = ref(null)
const videoPlayerRef = ref(null)
const sessionToken = ref(null)  // Store token to prevent Android query param issues

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
watch(
  () => sessionStore.selectedMarker,
  (newMarker) => {
    if (newMarker && videoPlayerRef.value) {
      videoPlayerRef.value.seekToTime(newMarker.start_time)
    }
  },
)

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

    if (sessionData.role !== 'helper') {
      error.value = 'This URL is for helpers only'
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

function handleTogglePlayPause() {
  if (videoPlayerRef.value) {
    videoPlayerRef.value.togglePlayPause()
  }
}

function getYouTubeId(url) {
  const match = url.match(/[?&]v=([^&]+)/)
  return match ? match[1] : ''
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

.text-h6 {
  font-size: 1rem;
}
</style>
