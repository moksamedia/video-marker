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

        <!-- Helper Link for Creators -->
        <div v-if="session.role === 'creator' && session.helper_token" class="helper-link-section">
          <h3>Share Helper Link</h3>
          <p>Share this link with someone who can help you:</p>
          <div class="url-input-group">
            <input
              type="text"
              readonly
              :value="helperUrl"
              @click="copyHelperUrl"
              class="helper-url-input"
            />
            <button @click="copyHelperUrl" class="btn-primary">Copy Link</button>
          </div>
        </div>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSupabaseSession } from '../composables/useSupabaseSession'
import { useSupabaseMarkers } from '../composables/useSupabaseMarkers'
import { useSupabasePosts } from '../composables/useSupabasePosts'
import { useAudioStorage } from '../composables/useAudioStorage'
import VideoPlayer from '../components/VideoPlayer.vue'
import MarkerList from '../components/MarkerList.vue'
import ThreadPanel from '../components/ThreadPanel.vue'

const route = useRoute()
const router = useRouter()

const { session, role, loadSession, deleteSession } = useSupabaseSession()
const { createMarker } = useSupabaseMarkers()
const { createPost } = useSupabasePosts()
const { deleteMarker } = useSupabaseMarkers()
const { getAudioUrl } = useAudioStorage()

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

  const success = await loadSession(sessionId, token)

  if (!success) {
    error.value = 'Failed to load session. Invalid session ID or token.'
  }

  isLoading.value = false
})

const handleCreateMarker = async (startTime, endTime) => {
  try {
    const newMarker = await createMarker(sessionId, token, startTime, endTime)

    if (!newMarker) {
      throw new Error('Failed to create marker')
    }

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
    const success = await deleteMarker(markerId, token)

    if (!success) {
      throw new Error('Failed to delete marker')
    }

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
    const newPost = await createPost(
      markerId,
      sessionId,
      token,
      role.value,
      textContent,
      audioBlob
    )

    if (!newPost) {
      throw new Error('Failed to create post')
    }

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
    const success = await deleteSession(sessionId, token)

    if (!success) {
      throw new Error('Failed to delete session')
    }

    alert('Session deleted successfully')
    router.push('/')
  } catch (err) {
    alert('Failed to delete session: ' + err.message)
  }
}

// Computed property for helper URL
const helperUrl = computed(() => {
  if (!session.value || !session.value.helper_token) return ''
  const base = window.location.origin
  return `${base}/session/${sessionId}?token=${session.value.helper_token}`
})

// Copy helper URL to clipboard
const copyHelperUrl = async () => {
  try {
    await navigator.clipboard.writeText(helperUrl.value)
    alert('Helper link copied to clipboard!')
  } catch (err) {
    console.error('Failed to copy:', err)
    alert('Failed to copy link. Please copy manually.')
  }
}
</script>
