<template>
  <div class="container">
    <div class="create-session">
      <h1>Create New Session</h1>
      <p>Paste a YouTube URL to create a new annotation session</p>

      <form @submit.prevent="createSession">
        <div>
          <label for="youtube-url">YouTube URL</label>
          <input
            id="youtube-url"
            type="url"
            v-model="youtubeUrl"
            placeholder="https://www.youtube.com/watch?v=..."
            required
            :disabled="isLoading"
          />
        </div>

        <button type="submit" class="btn-primary" :disabled="isLoading || !youtubeUrl">
          {{ isLoading ? 'Creating...' : 'Create Session' }}
        </button>

        <div v-if="error" class="error">{{ error }}</div>
      </form>

      <div v-if="sessionData" class="session-urls">
        <h3>Session Created Successfully!</h3>
        <p style="margin-bottom: 15px;">Share these URLs:</p>

        <div class="url-box">
          <label>Your URL (Creator - Full Access):</label>
          <input
            type="text"
            readonly
            :value="creatorUrl"
            @click="copyToClipboard(creatorUrl, 'creator')"
            style="cursor: pointer;"
          />
          <button @click="goToSession(creatorUrl)" class="btn-primary" style="margin-top: 8px;">
            Open Session
          </button>
        </div>

        <div class="url-box">
          <label>Helper URL (Can Reply Only):</label>
          <input
            type="text"
            readonly
            :value="helperUrl"
            @click="copyToClipboard(helperUrl, 'helper')"
            style="cursor: pointer;"
          />
        </div>

        <p style="font-size: 12px; color: #6c757d; margin-top: 15px;">
          Click any URL to copy to clipboard
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionBackend } from '../composables/useBackendAdapter'

const router = useRouter()
let sessionBackend = null

// Load backend adapter on mount
onMounted(async () => {
  sessionBackend = await useSessionBackend()
})

const youtubeUrl = ref('')
const isLoading = ref(false)
const error = ref(null)
const sessionData = ref(null)

const creatorUrl = computed(() => {
  if (!sessionData.value) return ''
  const base = window.location.origin
  return `${base}/session/${sessionData.value.id}?token=${sessionData.value.creator_token}`
})

const helperUrl = computed(() => {
  if (!sessionData.value) return ''
  const base = window.location.origin
  return `${base}/session/${sessionData.value.id}?token=${sessionData.value.helper_token}`
})

const createSession = async () => {
  isLoading.value = true
  error.value = null

  try {
    sessionData.value = await api.createSession(youtubeUrl.value)
  } catch (err) {
    error.value = err.message
    sessionData.value = null
  } finally {
    isLoading.value = false
  }
}

const copyToClipboard = async (text, type) => {
  try {
    await navigator.clipboard.writeText(text)
    alert(`${type} URL copied to clipboard!`)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

const goToSession = (url) => {
  const urlObj = new URL(url)
  router.push(urlObj.pathname + urlObj.search)
}
</script>
