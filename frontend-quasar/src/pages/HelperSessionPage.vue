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
      <!-- Video Info Header -->
      <q-card class="q-mb-md">
        <q-card-section class="row items-center">
          <q-avatar size="64px" rounded>
            <img :src="sessionStore.session.youtube_thumbnail" alt="Video thumbnail" />
          </q-avatar>
          <div class="q-ml-md col">
            <div class="text-h6">{{ sessionStore.session.youtube_title }}</div>
          </div>
        </q-card-section>
      </q-card>

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

        <!-- Timeline - Full Width -->
        <MarkerTimeline
          :markers="sessionStore.markers"
          :current-time="sessionStore.currentTime"
          :duration="sessionStore.videoDuration"
          @marker-click="selectMarker"
          @seek="seekTo"
          class="q-mb-md"
        />

        <!-- Thread Panel - Full Width -->
        <ThreadPanel :marker="sessionStore.selectedMarker" role="helper" @post-created="refreshSession" />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
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

// Watch for marker selection from drawer
watch(() => sessionStore.selectedMarker, (newMarker) => {
  if (newMarker && videoPlayerRef.value) {
    videoPlayerRef.value.seekToTime(newMarker.start_time)
  }
})

onMounted(() => {
  loadSession()
})

onUnmounted(() => {
  // Clear session when leaving
  sessionStore.clearSession()
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
    const token = route.query.token
    const sessionData = await apiService.getSession(route.params.id, token)
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

function seekTo(time) {
  if (videoPlayerRef.value) {
    videoPlayerRef.value.seekToTime(time)
  }
}

function getYouTubeId(url) {
  const match = url.match(/[?&]v=([^&]+)/)
  return match ? match[1] : ''
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
