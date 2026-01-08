<template>
  <q-page class="flex flex-center">
    <div class="q-pa-md" style="max-width: 600px; width: 100%">
      <!-- Video Preview (shown when URL is valid) -->
      <q-card v-if="videoMetadata || isFetchingMetadata" class="q-mb-md">
        <div class="row items-center q-pa-md">
          <q-skeleton
            v-if="isFetchingMetadata"
            type="rect"
            style="width: 120px; height: 90px"
            class="rounded-borders"
          />
          <q-img
            v-else
            :src="videoMetadata.thumbnail_url"
            style="width: 120px; height: 90px"
            class="rounded-borders"
          />
          <div class="q-ml-md col">
            <div class="text-subtitle1 text-weight-medium">
              <q-skeleton v-if="isFetchingMetadata" type="text" />
              <template v-else>{{ videoMetadata.title }}</template>
            </div>
            <div class="text-caption text-grey-7">
              <q-icon name="play_circle" size="xs" />
              YouTube Video
            </div>
          </div>
        </div>
      </q-card>

      <q-card>
        <q-card-section>
          <div class="text-h5">Create New Session</div>
          <div class="text-subtitle2 text-grey-7">
            Paste a YouTube URL to create a new annotation session
          </div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="createSession">
            <q-input
              v-model="sessionName"
              outlined
              label="Session Name (Optional)"
              placeholder="My Tibetan Lesson"
              :disable="isLoading"
              :rules="[
                (val) => !val || val.length >= 3 || 'Name must be at least 3 characters',
                (val) => !val || val.length <= 50 || 'Name must be less than 50 characters'
              ]"
              lazy-rules
              class="q-mb-md"
              hint="Optional: Custom name for your URL (e.g. my-tibetan-lesson). Leave blank for random ID."
            >
              <template v-slot:prepend>
                <q-icon name="label" />
              </template>
              <template v-slot:append v-if="sessionName">
                <q-chip dense size="sm" color="grey-3">
                  {{ slugPreview }}
                </q-chip>
              </template>
            </q-input>

            <q-input
              v-model="youtubeUrl"
              outlined
              label="YouTube URL"
              placeholder="https://www.youtube.com/watch?v=..."
              type="url"
              :disable="isLoading"
              :rules="[(val) => !!val || 'YouTube URL is required']"
              lazy-rules
            >
              <template v-slot:prepend>
                <q-icon name="play_circle" />
              </template>
            </q-input>

            <q-btn
              type="submit"
              color="primary"
              :loading="isLoading"
              :disable="!youtubeUrl"
              class="full-width q-mt-md"
              size="lg"
            >
              Create Session
            </q-btn>
          </q-form>

          <q-banner v-if="error" class="bg-negative text-white q-mt-md" rounded>
            <template v-slot:avatar>
              <q-icon name="error" />
            </template>
            {{ error }}
          </q-banner>
        </q-card-section>

        <q-card-section v-if="sessionData">
          <q-separator class="q-mb-md" />

          <div class="text-h6 q-mb-md text-positive">
            <q-icon name="check_circle" /> Session Created Successfully!
          </div>

          <p class="text-body2 q-mb-md">Share these URLs:</p>

          <!-- Creator URL -->
          <q-card flat bordered class="q-mb-md">
            <q-card-section>
              <div class="text-subtitle2 text-weight-medium q-mb-sm">
                <q-icon name="manage_accounts" color="primary" />
                Your URL (Creator - Full Access)
              </div>
              <q-input
                :model-value="creatorUrl"
                outlined
                readonly
                dense
                class="q-mb-sm"
              >
                <template v-slot:append>
                  <q-btn
                    flat
                    dense
                    icon="content_copy"
                    @click="copyToClipboard(creatorUrl, 'Creator')"
                  >
                    <q-tooltip>Copy to clipboard</q-tooltip>
                  </q-btn>
                </template>
              </q-input>
              <q-btn
                color="primary"
                icon="open_in_new"
                label="Open Session"
                @click="goToSession(creatorUrl)"
                class="full-width"
              />
            </q-card-section>
          </q-card>

          <!-- Helper URL -->
          <q-card flat bordered>
            <q-card-section>
              <div class="text-subtitle2 text-weight-medium q-mb-sm">
                <q-icon name="help" color="secondary" />
                Helper URL (Can Reply Only)
              </div>
              <q-input :model-value="helperUrl" outlined readonly dense>
                <template v-slot:append>
                  <q-btn
                    flat
                    dense
                    icon="content_copy"
                    @click="copyToClipboard(helperUrl, 'Helper')"
                  >
                    <q-tooltip>Copy to clipboard</q-tooltip>
                  </q-btn>
                </template>
              </q-input>
            </q-card-section>
          </q-card>

          <q-banner class="q-mt-md" dense>
            <template v-slot:avatar>
              <q-icon name="info" color="info" />
            </template>
            Click any URL to copy to clipboard
          </q-banner>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { apiService } from 'src/services/api'

const router = useRouter()
const $q = useQuasar()

const sessionName = ref('')
const youtubeUrl = ref('')
const isLoading = ref(false)
const error = ref(null)
const sessionData = ref(null)
const videoMetadata = ref(null)
const isFetchingMetadata = ref(false)

// Generate URL slug preview
const slugPreview = computed(() => {
  if (!sessionName.value) return ''
  return sessionName.value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
})

const creatorUrl = computed(() => {
  if (!sessionData.value) return ''
  const base = window.location.origin
  return `${base}/#/creator/${sessionData.value.id}?token=${sessionData.value.creator_token}`
})

const helperUrl = computed(() => {
  if (!sessionData.value) return ''
  const base = window.location.origin
  return `${base}/#/helper/${sessionData.value.id}?token=${sessionData.value.helper_token}`
})

// Watch for YouTube URL changes to fetch metadata
watch(youtubeUrl, async (newUrl) => {
  // Clear previous metadata
  videoMetadata.value = null

  // Don't fetch if URL is empty
  if (!newUrl || newUrl.trim() === '') {
    return
  }

  // Basic YouTube URL validation
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/
  if (!youtubeRegex.test(newUrl)) {
    return
  }

  await fetchVideoMetadata(newUrl)
})

async function fetchVideoMetadata(url) {
  isFetchingMetadata.value = true

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    const response = await fetch(oembedUrl)

    if (!response.ok) {
      throw new Error('Failed to fetch video metadata')
    }

    const data = await response.json()
    videoMetadata.value = data

    // Auto-populate session name with truncated title (max 50 chars)
    if (data.title && !sessionName.value) {
      const truncatedTitle = data.title.length > 50
        ? data.title.substring(0, 50).trim()
        : data.title
      sessionName.value = truncatedTitle
    }
  } catch (err) {
    // Silently fail - don't show error to user for metadata fetch
    console.error('Failed to fetch video metadata:', err)
  } finally {
    isFetchingMetadata.value = false
  }
}

async function createSession() {
  isLoading.value = true
  error.value = null

  try {
    // Only pass session name if provided
    const name = sessionName.value ? slugPreview.value : null
    sessionData.value = await apiService.createSession(youtubeUrl.value, name)
    $q.notify({
      type: 'positive',
      message: 'Session created successfully!',
      icon: 'check_circle',
    })
  } catch (err_) {
    error.value = err_.response?.data?.error || err_.message || 'Failed to create session'
    $q.notify({
      type: 'negative',
      message: error.value,
      icon: 'error',
    })
    sessionData.value = null
  } finally {
    isLoading.value = false
  }
}

async function copyToClipboard(text, type) {
  try {
    await navigator.clipboard.writeText(text)
    $q.notify({
      type: 'positive',
      message: `${type} URL copied to clipboard!`,
      icon: 'content_copy',
      timeout: 1500,
    })
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to copy to clipboard',
      icon: 'error',
    })
  }
}

function goToSession(url) {
  const urlObj = new URL(url)
  router.push(urlObj.hash.substring(1)) // Remove the # from hash
}
</script>
