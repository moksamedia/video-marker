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
    <div v-else-if="session" class="session-container">
      <!-- Video Info Header -->
      <q-card class="q-mb-md">
        <q-card-section class="row items-center">
          <q-avatar size="64px" rounded>
            <img :src="session.youtube_thumbnail" alt="Video thumbnail" />
          </q-avatar>
          <div class="q-ml-md col">
            <div class="text-h6">{{ session.youtube_title }}</div>
            <div class="text-caption text-grey-7">
              <q-chip dense color="primary" text-color="white" icon="manage_accounts">
                Creator Mode
              </q-chip>
            </div>
          </div>
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
        </q-card-section>
      </q-card>

      <!-- Main Content Grid -->
      <div class="row q-col-gutter-md">
        <!-- Left Column: Video & Timeline -->
        <div class="col-12 col-md-6">
          <VideoPlayer
            ref="videoPlayerRef"
            :video-id="getYouTubeId(session.youtube_url)"
            :is-creator="true"
            @current-time-update="currentTime = $event"
            @duration-update="videoDuration = $event"
            @create-marker="handleCreateMarker"
            @delete-session="handleDeleteSession"
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
            :is-creator="true"
            @marker-click="selectMarker"
            @delete-marker="handleDeleteMarker"
          />
        </div>

        <!-- Right Column: Thread Panel -->
        <div class="col-12 col-md-6">
          <ThreadPanel
            :marker="selectedMarker"
            role="creator"
            @post-created="refreshSession"
          />
        </div>
      </div>

      <!-- Helper Link Dialog -->
      <q-dialog v-model="showHelperLink">
        <q-card style="min-width: 400px">
          <q-card-section>
            <div class="text-h6">Helper Link</div>
          </q-card-section>

          <q-card-section>
            <q-input
              :model-value="helperUrl"
              outlined
              readonly
              dense
            >
              <template v-slot:append>
                <q-btn
                  flat
                  dense
                  icon="content_copy"
                  @click="copyHelperLink"
                />
              </template>
            </q-input>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Close" color="primary" v-close-popup />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { apiService } from 'src/services/api'
import VideoPlayer from 'src/components/VideoPlayer.vue'
import MarkerTimeline from 'src/components/MarkerTimeline.vue'
import MarkerList from 'src/components/MarkerList.vue'
import ThreadPanel from 'src/components/ThreadPanel.vue'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const loading = ref(true)
const error = ref(null)
const session = ref(null)
const currentTime = ref(0)
const videoDuration = ref(0)
const selectedMarker = ref(null)
const videoPlayerRef = ref(null)
const showHelperLink = ref(false)

const helperUrl = computed(() => {
  if (!session.value) return ''
  const base = window.location.origin
  return `${base}/#/helper/${session.value.id}?token=${session.value.helper_token}`
})

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

    if (session.value.role !== 'creator') {
      error.value = 'This URL is for creators only'
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

async function handleCreateMarker(startTime, endTime) {
  try {
    const token = route.query.token
    await apiService.createMarker(route.params.id, token, startTime, endTime)
    await refreshSession()
  } catch (err) {
    throw new Error(err.response?.data?.error || 'Failed to create marker')
  }
}

async function handleDeleteMarker(markerId) {
  try {
    const token = route.query.token
    await apiService.deleteMarker(markerId, token)

    $q.notify({
      type: 'positive',
      message: 'Marker deleted',
      icon: 'delete',
    })

    if (selectedMarker.value?.id === markerId) {
      selectedMarker.value = null
    }

    await refreshSession()
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.response?.data?.error || 'Failed to delete marker',
      icon: 'error',
    })
  }
}

async function handleDeleteSession() {
  try {
    const token = route.query.token
    await apiService.deleteSession(route.params.id, token)

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

function copyHelperLink() {
  navigator.clipboard.writeText(helperUrl.value)
  $q.notify({
    type: 'positive',
    message: 'Helper link copied to clipboard!',
    icon: 'content_copy',
    timeout: 1500,
  })
}
</script>

<style scoped>
.session-container {
  max-width: 1400px;
  margin: 0 auto;
}
</style>
