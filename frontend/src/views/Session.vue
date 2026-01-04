<template>
  <div class="container">
    <div v-if="isLoading" class="loading">Loading session...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="session" class="session-layout">
      <div class="video-section">
        <VideoPlayer
          ref="videoPlayerRef"
          :youtubeUrl="session.youtube_url"
          :markers="session.markers"
          :role="session.role"
          @create-marker="handleCreateMarker"
          @select-marker="handleSelectMarker"
          @delete-session="handleDeleteSession"
        />
      </div>

      <div class="markers-section">
        <MarkerList
          :markers="session.markers"
          :selectedMarker="selectedMarker"
          :role="session.role"
          @select-marker="handleSelectMarker"
          @delete-marker="handleDeleteMarker"
        />
      </div>

      <div class="thread-section">
        <ThreadPanel
          :marker="selectedMarker"
          @post-created="handlePostCreated"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '../composables/useApi'
import VideoPlayer from '../components/VideoPlayer.vue'
import MarkerList from '../components/MarkerList.vue'
import ThreadPanel from '../components/ThreadPanel.vue'

const route = useRoute()
const router = useRouter()
const api = useApi()

const session = ref(null)
const selectedMarker = ref(null)
const isLoading = ref(true)
const error = ref(null)
const videoPlayerRef = ref(null)

const sessionId = route.params.id
const token = route.query.token

onMounted(async () => {
  if (!token) {
    error.value = 'No token provided'
    isLoading.value = false
    return
  }

  await loadSession()
})

const loadSession = async () => {
  isLoading.value = true
  error.value = null

  try {
    session.value = await api.getSession(sessionId, token)
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

const handleCreateMarker = async (startTime, endTime) => {
  try {
    const newMarker = await api.createMarker(sessionId, token, startTime, endTime)

    // Add the marker with an empty posts array
    newMarker.posts = []
    session.value.markers.push(newMarker)

    // Select the new marker
    selectedMarker.value = newMarker
  } catch (err) {
    alert('Failed to create marker: ' + err.message)
  }
}

const handleSelectMarker = (marker) => {
  selectedMarker.value = marker
  // Seek video to marker start time
  if (videoPlayerRef.value && marker) {
    videoPlayerRef.value.seekToTime(marker.start_time)
  }
}

const handleDeleteMarker = async (markerId) => {
  try {
    await api.deleteMarker(markerId, token)

    // Remove marker from list
    session.value.markers = session.value.markers.filter(m => m.id !== markerId)

    // Deselect if this was selected
    if (selectedMarker.value?.id === markerId) {
      selectedMarker.value = null
    }
  } catch (err) {
    alert('Failed to delete marker: ' + err.message)
  }
}

const handlePostCreated = async ({ markerId, textContent, audioBlob }) => {
  try {
    const newPost = await api.createPost(markerId, token, textContent, audioBlob)

    // Find the marker and add the post
    const marker = session.value.markers.find(m => m.id === markerId)
    if (marker) {
      marker.posts.push(newPost)
    }

    // Update selected marker if it's the same one
    if (selectedMarker.value?.id === markerId) {
      selectedMarker.value = marker
    }
  } catch (err) {
    alert('Failed to create post: ' + err.message)
  }
}

const handleDeleteSession = async () => {
  if (!confirm('Are you sure you want to delete this entire session? This cannot be undone.')) {
    return
  }

  try {
    await api.deleteSession(sessionId, token)
    alert('Session deleted successfully')
    router.push('/')
  } catch (err) {
    alert('Failed to delete session: ' + err.message)
  }
}
</script>
