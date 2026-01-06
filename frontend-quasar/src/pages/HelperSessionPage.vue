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
    <div v-else-if="session" class="session-container">
      <!-- Video Info Header -->
      <q-card class="q-mb-md">
        <q-card-section class="row items-center">
          <q-avatar size="64px" rounded>
            <img :src="session.youtube_thumbnail" alt="Video thumbnail" />
          </q-avatar>
          <div class="q-ml-md col">
            <div class="text-h6">{{ session.youtube_title }}</div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Main Content Grid -->
      <div class="row q-col-gutter-md">
        <!-- Left Column: Video & Timeline -->
        <div class="col-12 col-md-6">
          <VideoPlayer
            ref="videoPlayerRef"
            :video-id="getYouTubeId(session.youtube_url)"
            :is-creator="false"
            :compact="true"
            @current-time-update="currentTime = $event"
            @duration-update="videoDuration = $event"
            class="q-mb-md"
          />

          <MarkerTimeline
            :markers="session.markers"
            :current-time="currentTime"
            :duration="videoDuration"
            @marker-click="selectMarker"
            @seek="seekTo"
            class="q-mb-md"
          />

          <MarkerList
            :markers="session.markers"
            :selected-marker-id="selectedMarker?.id"
            :is-creator="false"
            @marker-click="selectMarker"
          />
        </div>

        <!-- Right Column: Thread Panel -->
        <div class="col-12 col-md-6">
          <ThreadPanel :marker="selectedMarker" role="helper" @post-created="refreshSession" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { apiService } from 'src/services/api'
import VideoPlayer from 'src/components/VideoPlayer.vue'
import MarkerTimeline from 'src/components/MarkerTimeline.vue'
import MarkerList from 'src/components/MarkerList.vue'
import ThreadPanel from 'src/components/ThreadPanel.vue'

const route = useRoute()
const $q = useQuasar()

const loading = ref(true)
const error = ref(null)
const session = ref(null)
const currentTime = ref(0)
const videoDuration = ref(0)
const selectedMarker = ref(null)
const videoPlayerRef = ref(null)

onMounted(() => {
  loadSession()
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

    session.value = await apiService.getSession(route.params.id, token)

    if (session.value.role !== 'helper') {
      error.value = 'This URL is for helpers only'
      return
    }
  } catch (err) {
    error.value = err.response?.data?.error || err.message || 'Failed to load session'
  } finally {
    loading.value = false
  }
}

async function refreshSession() {
  try {
    const token = route.query.token
    session.value = await apiService.getSession(route.params.id, token)

    // Re-select marker if it still exists
    if (selectedMarker.value) {
      const marker = session.value.markers.find((m) => m.id === selectedMarker.value.id)
      if (marker) {
        selectedMarker.value = marker
      } else {
        selectedMarker.value = null
      }
    }
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to refresh session',
      icon: 'error',
    })
  }
}

function selectMarker(marker) {
  selectedMarker.value = marker
  if (videoPlayerRef.value) {
    videoPlayerRef.value.seekToTime(marker.start_time)
  }
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
  max-width: 1400px;
  margin: 0 auto;
}
.text-h6 {
  font-size: 1rem;
}
</style>
