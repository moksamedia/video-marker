<template>
  <div class="thread-panel">
    <q-card v-if="marker">
      <q-card-section>
        <div class="text-h6">
          <q-icon :name="marker.end_time ? 'schedule' : 'place'" />
          {{ formatTime(marker.start_time) }}
          <span v-if="marker.end_time"> - {{ formatTime(marker.end_time) }}</span>
        </div>
        <div class="text-caption text-grey-7">
          {{ marker.end_time ? 'Range Marker' : 'Point Marker' }}
        </div>
      </q-card-section>

      <q-separator />

      <!-- Posts List -->
      <q-scroll-area style="height: 400px">
        <q-list v-if="marker.posts && marker.posts.length > 0" separator>
          <q-item
            v-for="post in marker.posts"
            :key="post.id"
            :class="post.author_type === 'creator' ? 'bg-blue-1' : 'bg-green-1'"
          >
            <q-item-section>
              <q-item-label overline>
                <q-chip
                  :color="post.author_type === 'creator' ? 'primary' : 'secondary'"
                  text-color="white"
                  dense
                  size="sm"
                >
                  {{ post.author_type === 'creator' ? 'Creator' : 'Helper' }}
                </q-chip>
                {{ formatDate(post.created_at) }}
              </q-item-label>

              <q-item-label v-if="post.text_content" class="q-mt-sm">
                {{ post.text_content }}
              </q-item-label>

              <div v-if="post.audio_filename" class="q-mt-sm">
                <AudioPlayer :audio-url="getAudioUrl(post.audio_filename)" />
              </div>
            </q-item-section>
          </q-item>
        </q-list>

        <q-card-section v-else class="text-center text-grey-7">
          <q-icon name="chat" size="48px" class="q-mb-sm" />
          <div class="text-body2">No posts yet</div>
          <div class="text-caption">Be the first to add a message</div>
        </q-card-section>
      </q-scroll-area>

      <q-separator />

      <!-- New Post Form -->
      <q-card-section>
        <div class="text-subtitle2 q-mb-md">Add Post</div>

        <q-input
          v-model="textContent"
          outlined
          type="textarea"
          label="Text message (optional)"
          rows="3"
          :disable="isSaving"
        />

        <div class="q-mt-md">
          <AudioRecorder
            v-if="!audioBlob"
            @audio-ready="handleAudioReady"
          />
          <div v-else class="row items-center q-gutter-sm">
            <q-icon name="mic" color="positive" size="sm" />
            <span class="text-positive">Audio attached</span>
            <q-space />
            <q-btn
              flat
              dense
              color="negative"
              icon="close"
              @click="audioBlob = null"
            >
              <q-tooltip>Remove audio</q-tooltip>
            </q-btn>
          </div>
        </div>

        <q-btn
          color="primary"
          icon="send"
          label="Save Post"
          @click="savePost"
          :disable="!canSave || isSaving"
          :loading="isSaving"
          class="full-width q-mt-md"
        />
      </q-card-section>
    </q-card>

    <q-card v-else class="text-center">
      <q-card-section>
        <q-icon name="touch_app" size="64px" color="grey-5" />
        <div class="text-h6 text-grey-7 q-mt-md">Select a Marker</div>
        <div class="text-body2 text-grey-6">
          Click on a marker in the timeline or list to view its thread
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import AudioRecorder from './AudioRecorder.vue'
import AudioPlayer from './AudioPlayer.vue'
import { apiService } from 'src/services/api'

const props = defineProps({
  marker: {
    type: Object,
    default: null,
  },
  role: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['postCreated'])

const $q = useQuasar()

const textContent = ref('')
const audioBlob = ref(null)
const isSaving = ref(false)

const canSave = computed(() => {
  return textContent.value.trim() || audioBlob.value
})

function handleAudioReady(blob) {
  audioBlob.value = blob
}

async function savePost() {
  if (!props.marker || !canSave.value) return

  isSaving.value = true

  try {
    const token = new URLSearchParams(window.location.search).get('token')
    await apiService.createPost(
      props.marker.id,
      token,
      textContent.value.trim() || null,
      audioBlob.value
    )

    $q.notify({
      type: 'positive',
      message: 'Post created successfully!',
      icon: 'check_circle',
    })

    // Reset form
    textContent.value = ''
    audioBlob.value = null

    // Notify parent to refresh
    emit('postCreated')
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.response?.data?.error || 'Failed to create post',
      icon: 'error',
    })
  } finally {
    isSaving.value = false
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleString()
}

function getAudioUrl(filename) {
  return apiService.getAudioUrl(filename)
}
</script>

<style scoped>
.thread-panel {
  height: 100%;
}
</style>
