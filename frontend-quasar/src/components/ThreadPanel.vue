<template>
  <div class="thread-panel">
    <q-card v-if="marker">
      <q-card-section>
        <!-- Mobile: Prev/Next buttons on separate row (< 450px) -->
        <div class="row q-gutter-sm q-mb-sm mobile-marker-nav">
          <q-btn
            class="col"
            label="Prev Mark"
            @click="goToPreviousMarker"
            :disable="!hasPreviousMarker"
          />
          <q-btn class="col" label="Next Mark" @click="goToNextMarker" :disable="!hasNextMarker" />
        </div>

        <!-- Desktop/Main controls -->
        <div class="row items-center justify-between desktop-controls">
          <!-- Previous marker (far left) - hidden on mobile -->
          <q-btn
            round
            icon="chevron_left"
            @click="goToPreviousMarker"
            :disable="!hasPreviousMarker"
            class="desktop-nav-btn"
          >
            <q-tooltip>Previous marker</q-tooltip>
          </q-btn>

          <!-- Middle controls group -->
          <div class="row items-center q-gutter-xs">
            <!-- Seek backward 30s (desktop only) -->
            <q-btn @click="seekBackward(30)" label="<< 30s" no-caps class="gt-xs">
              <q-tooltip>Seek backward 30s</q-tooltip>
            </q-btn>
            <!-- Seek backward 5s -->
            <q-btn @click="seekBackward(5)" label="<< 5s" no-caps>
              <q-tooltip>Seek backward 5s</q-tooltip>
            </q-btn>

            <!-- Marker time (clickable to play from marker) -->
            <q-btn @click="playFromMarker">
              <q-icon :name="marker.end_time ? 'schedule' : 'place'" class="q-mr-xs" />
              {{ formatTime(marker.start_time) }}
              <span v-if="marker.end_time"> - {{ formatTime(marker.end_time) }}</span>
              <span class="text-grey-7 q-ml-sm text-caption">
                {{ currentMarkerIndex + 1 }}/{{ markers.length }}
              </span>
              <q-tooltip>Play from marker start</q-tooltip>
            </q-btn>

            <!-- Seek forward 5s -->
            <q-btn @click="seekForward(5)" label="5s >>" no-caps>
              <q-tooltip>Seek forward 5s</q-tooltip>
            </q-btn>
            <!-- Seek forward 30s (desktop only) -->
            <q-btn @click="seekForward(30)" label="30s >>" no-caps class="gt-xs">
              <q-tooltip>Seek forward 30s</q-tooltip>
            </q-btn>
          </div>

          <!-- Next marker (far right) - hidden on mobile -->
          <q-btn
            round
            icon="chevron_right"
            @click="goToNextMarker"
            :disable="!hasNextMarker"
            class="desktop-nav-btn"
          >
            <q-tooltip>Next marker</q-tooltip>
          </q-btn>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Posts List -->
      <q-list v-if="marker.posts && marker.posts.length > 0" separator>
        <div v-for="post in marker.posts" :key="post.id">
          <q-item
            :class="{
              'helper-post': post.author_type === 'helper',
              'creator-post-in-helper': role === 'helper' && post.author_type === 'creator',
            }"
          >
            <q-item-section>
              <!-- Edit mode -->
              <div v-if="editingPostId === post.id">
                <q-input
                  v-model="editingText"
                  outlined
                  dense
                  type="textarea"
                  rows="3"
                  autofocus
                  class="q-mb-sm post-text-input"
                />
                <div class="row q-gutter-xs">
                  <q-btn
                    flat
                    dense
                    size="sm"
                    color="primary"
                    icon="check"
                    label="Save"
                    @click="saveEdit(post)"
                  />
                  <q-btn
                    flat
                    dense
                    size="sm"
                    color="grey"
                    icon="close"
                    label="Cancel"
                    @click="cancelEdit()"
                  />
                </div>
              </div>

              <!-- View mode -->
              <div v-else>
                <q-item-label v-if="post.text_content" class="post-text-content">
                  {{ post.text_content }}
                </q-item-label>

                <div v-if="post.audio_filename">
                  <AudioPlayer :audio-url="getAudioUrl(post.audio_filename)" />
                </div>
              </div>
            </q-item-section>

            <q-item-section side v-if="canDeletePost(post) && editingPostId !== post.id">
              <div class="row q-gutter-xs">
                <q-btn
                  flat
                  round
                  color="primary"
                  icon="edit"
                  size="md"
                  @click="startEdit(post)"
                  v-if="post.text_content"
                >
                  <q-tooltip>Edit post</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  color="negative"
                  icon="delete"
                  size="md"
                  @click="confirmDeletePost(post)"
                >
                  <q-tooltip>Delete post</q-tooltip>
                </q-btn>
              </div>
            </q-item-section>
          </q-item>
          <q-item-label class="post-item-label post-date">
            {{ formatDate(post.created_at) }}
          </q-item-label>
        </div>
      </q-list>

      <!-- Reply Area -->
      <q-card-section>
        <!-- Reply Buttons -->
        <div v-if="!replyMode" class="row justify-center q-gutter-sm">
          <q-btn outline color="primary" icon="edit" label="Text" @click="replyMode = 'text'" />
          <q-btn outline color="primary" icon="mic" label="Audio" @click="replyMode = 'record'" />
        </div>

        <!-- Text Reply Form -->
        <div v-if="replyMode === 'text'">
          <q-input
            v-model="textContent"
            outlined
            type="textarea"
            label="Type your message"
            rows="3"
            :disable="isSaving"
            class="q-mb-sm post-text-input"
          />
          <div class="row q-gutter-sm">
            <q-btn
              color="primary"
              icon="send"
              label="Submit"
              @click="savePost"
              :disable="!textContent.trim() || isSaving"
              :loading="isSaving"
            />
            <q-btn flat color="grey" label="Cancel" @click="cancelReply" :disable="isSaving" />
          </div>
        </div>

        <!-- Record Reply Form -->
        <div v-if="replyMode === 'record'">
          <AudioRecorder auto-start @audio-ready="handleAudioRecorded" @cancel="cancelReply" />
        </div>
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
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import AudioRecorder from './AudioRecorder.vue'
import AudioPlayer from './AudioPlayer.vue'
import { apiService } from 'src/services/api'

const props = defineProps({
  marker: {
    type: Object,
    default: null,
  },
  markers: {
    type: Array,
    default: () => [],
  },
  role: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['postCreated', 'markerSelected', 'seek', 'playFromMarker'])

const route = useRoute()
const $q = useQuasar()

const textContent = ref('')
const audioBlob = ref(null)
const isSaving = ref(false)
const editingPostId = ref(null)
const editingText = ref('')
const replyMode = ref(null) // null, 'text', or 'record'

// Marker navigation
const currentMarkerIndex = computed(() => {
  if (!props.marker || !props.markers.length) return -1
  return props.markers.findIndex((m) => m.id === props.marker.id)
})

const hasPreviousMarker = computed(() => {
  return currentMarkerIndex.value > 0
})

const hasNextMarker = computed(() => {
  return currentMarkerIndex.value >= 0 && currentMarkerIndex.value < props.markers.length - 1
})

function goToPreviousMarker() {
  if (hasPreviousMarker.value) {
    const previousMarker = props.markers[currentMarkerIndex.value - 1]
    emit('markerSelected', previousMarker)
  }
}

function goToNextMarker() {
  if (hasNextMarker.value) {
    const nextMarker = props.markers[currentMarkerIndex.value + 1]
    emit('markerSelected', nextMarker)
  }
}

function seekBackward(seconds) {
  emit('seek', -seconds)
}

function seekForward(seconds) {
  emit('seek', seconds)
}

function playFromMarker() {
  emit('playFromMarker', props.marker.start_time)
}

async function handleAudioRecorded(blob) {
  audioBlob.value = blob
  await savePost()
}

async function savePost() {
  if (!props.marker) return

  isSaving.value = true

  try {
    const token = route.query.token
    if (!token) {
      throw new Error('Token not found')
    }
    await apiService.createPost(
      props.marker.id,
      token,
      textContent.value.trim() || null,
      audioBlob.value,
    )

    $q.notify({
      type: 'positive',
      message: 'Post created successfully!',
      icon: 'check_circle',
    })

    // Reset form and return to button layout
    textContent.value = ''
    audioBlob.value = null
    replyMode.value = null

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

function cancelReply() {
  replyMode.value = null
  textContent.value = ''
  audioBlob.value = null
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffSeconds < 60) {
    return 'just now'
  } else if (diffMinutes < 60) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`
  } else if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`
  } else if (diffDays < 7) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`
  } else if (diffWeeks < 4) {
    return diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`
  } else if (diffMonths < 12) {
    return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`
  } else {
    return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`
  }
}

function getAudioUrl(filename) {
  return apiService.getAudioUrl(filename)
}

function canDeletePost(post) {
  // User can delete their own posts (author_type matches role)
  return post.author_type === props.role
}

function confirmDeletePost(post) {
  $q.dialog({
    title: 'Delete Post',
    message: 'Are you sure you want to delete this post? This action cannot be undone.',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    await handleDeletePost(post.id)
  })
}

async function handleDeletePost(postId) {
  try {
    const token = route.query.token
    if (!token) {
      throw new Error('Token not found')
    }

    await apiService.deletePost(postId, token)

    $q.notify({
      type: 'positive',
      message: 'Post deleted successfully',
      icon: 'delete',
    })

    // Notify parent to refresh
    emit('postCreated')
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.response?.data?.error || 'Failed to delete post',
      icon: 'error',
    })
  }
}

function startEdit(post) {
  editingPostId.value = post.id
  editingText.value = post.text_content || ''
}

function cancelEdit() {
  editingPostId.value = null
  editingText.value = ''
}

async function saveEdit(post) {
  if (!editingText.value.trim()) {
    $q.notify({
      type: 'warning',
      message: 'Post text cannot be empty',
      icon: 'warning',
    })
    return
  }

  try {
    const token = route.query.token
    if (!token) {
      throw new Error('Token not found')
    }

    await apiService.updatePost(post.id, token, editingText.value.trim())

    $q.notify({
      type: 'positive',
      message: 'Post updated successfully',
      icon: 'check_circle',
    })

    editingPostId.value = null
    editingText.value = ''

    // Notify parent to refresh
    emit('postCreated')
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.response?.data?.error || 'Failed to update post',
      icon: 'error',
    })
  }
}
</script>

<style scoped>
.thread-panel {
  height: 100%;
}
.post-item-label {
  text-align: right;
}
.post-date {
  margin: 5px;
  color: gray;
}
.helper-post {
  margin-left: 24px;
}
.creator-post-in-helper {
  background-color: #e3f2fd;
}

/* Post text styling - larger font */
.post-text-content {
  font-size: 1.7rem;
  line-height: 1.5;
}

/* Post text input - larger font */
.post-text-input :deep(textarea) {
  font-size: 1.7rem;
  line-height: 1.5;
}

/* Mobile marker navigation - show only on screens < 450px */
.mobile-marker-nav {
  display: none;
}

@media (max-width: 449px) {
  .mobile-marker-nav {
    display: flex;
  }

  /* Hide the round prev/next buttons on mobile */
  .desktop-nav-btn {
    display: none;
  }

  /* Center the middle controls on mobile */
  .desktop-controls {
    justify-content: center;
  }
}
</style>
