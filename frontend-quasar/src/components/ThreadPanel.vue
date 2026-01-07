<template>
  <div class="thread-panel">
    <!-- Helper View - Flat div structure -->
    <div v-if="marker && role === 'helper'" class="thread-content-helper">
      <!-- Controls -->
      <div class="controls-section">
        <div class="row items-center q-gutter-xs helper-btns" style="width: 100%">
          <!-- Seek backward 5s -->
          <q-btn @click="seekBackward(5)" label="<< 5s" no-caps block>
            <q-tooltip>Seek backward 5s</q-tooltip>
          </q-btn>
          <!-- Marker time (clickable to play from marker) -->
          <q-label class="text-subtitle2"> </q-label>
          <q-btn @click="playFromMarker">
            <q-icon :name="marker.end_time ? 'schedule' : 'place'" class="q-mr-xs" />
            {{ formatTime(marker.start_time) }}
            <span v-if="marker.end_time"> - {{ formatTime(marker.end_time) }}</span>
            <span class="text-grey-7" style="margin-left: 5px">
              {{ currentMarkerIndex + 1 }}/{{ markers.length }}
            </span>
            <q-tooltip>Play from marker start</q-tooltip>
          </q-btn>

          <!-- Play/Pause button -->
          <q-btn @click="togglePlayPause">
            <q-icon name="play_arrow" size="xs" />
            <span class="q-mx-xs">/</span>
            <q-icon name="pause" size="xs" />
            <q-tooltip>Play / Pause</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Posts List -->
      <div v-if="marker.posts && marker.posts.length > 0" class="posts-section">
        <div v-for="post in marker.posts" :key="post.id" class="post-item">
          <div
            class="post-content"
            :class="{
              'helper-post': post.author_type === 'helper',
              'creator-post-in-helper': post.author_type === 'creator',
            }"
          >
            <div class="post-body">
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
                <div v-if="post.text_content" class="post-text-content">
                  {{ post.text_content }}
                </div>

                <div v-if="post.audio_filename">
                  <AudioPlayer :audio-url="getAudioUrl(post.audio_filename)" />
                </div>
              </div>
            </div>

            <div v-if="canDeletePost(post) && editingPostId !== post.id" class="post-actions">
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
          </div>
          <div class="post-date">{{ formatDate(post.created_at) }}</div>
        </div>
      </div>

      <!-- Reply Area -->
      <div class="reply-section">
        <!-- Recording Interface -->
        <div v-if="replyMode === 'record'">
          <AudioRecorder auto-start @audio-ready="handleAudioRecorded" @cancel="cancelReply" />
        </div>

        <!-- WhatsApp-style Input -->
        <div v-else class="whatsapp-input">
          <q-input
            v-model="textContent"
            outlined
            autogrow
            placeholder="Type a message"
            :disable="isSaving"
            class="message-input"
            @keyup.enter="handleEnter"
          />
          <q-btn
            round
            :icon="textContent.trim() ? 'send' : 'mic'"
            :color="textContent.trim() ? 'primary' : 'grey-7'"
            @click="handleActionButton"
            :disable="isSaving"
            :loading="isSaving"
            class="action-btn"
          >
            <q-tooltip>{{ textContent.trim() ? 'Send' : 'Record audio' }}</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>

    <!-- Creator View - Card structure -->
    <q-card v-else-if="marker && role === 'creator'">
      <q-card-section>
        <!-- Controls -->
        <div class="row items-center justify-center q-gutter-xs">
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
        </div>
      </q-card-section>

      <q-separator />

      <!-- Posts List -->
      <q-list v-if="marker.posts && marker.posts.length > 0" separator>
        <div v-for="post in marker.posts" :key="post.id">
          <q-item
            :class="{
              'helper-post': post.author_type === 'helper',
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
        <!-- Recording Interface -->
        <div v-if="replyMode === 'record'">
          <AudioRecorder auto-start @audio-ready="handleAudioRecorded" @cancel="cancelReply" />
        </div>

        <!-- WhatsApp-style Input -->
        <div v-else class="whatsapp-input">
          <q-input
            v-model="textContent"
            outlined
            dense
            placeholder="Type a message"
            :disable="isSaving"
            class="message-input"
            @keyup.enter="handleEnter"
          />
          <q-btn
            round
            :icon="textContent.trim() ? 'send' : 'mic'"
            :color="textContent.trim() ? 'primary' : 'grey-7'"
            @click="handleActionButton"
            :disable="isSaving"
            :loading="isSaving"
            class="action-btn"
          >
            <q-tooltip>{{ textContent.trim() ? 'Send' : 'Record audio' }}</q-tooltip>
          </q-btn>
        </div>
      </q-card-section>
    </q-card>

    <!-- No marker selected -->
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

const emit = defineEmits([
  'postCreated',
  'markerSelected',
  'seek',
  'playFromMarker',
  'togglePlayPause',
])

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

function seekBackward(seconds) {
  emit('seek', -seconds)
}

function seekForward(seconds) {
  emit('seek', seconds)
}

function playFromMarker() {
  emit('playFromMarker', props.marker.start_time)
}

function togglePlayPause() {
  emit('togglePlayPause')
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

    // Reset form
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

function handleActionButton() {
  if (textContent.value.trim()) {
    // Send text message
    savePost()
  } else {
    // Start audio recording
    replyMode.value = 'record'
  }
}

function handleEnter(event) {
  // Only submit on Enter without Shift (Shift+Enter for new line)
  if (!event.shiftKey && textContent.value.trim()) {
    event.preventDefault()
    savePost()
  }
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

/* Helper view - flat styling */
.thread-content-helper {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.controls-section {
  padding: 16px 0;
}

.posts-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.post-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 0px;
  border-radius: 4px;
}

.post-content.helper-post {
  margin-left: 24px;
}

.post-content.creator-post-in-helper {
  background-color: #e3f2fd;
}

.post-body {
  flex: 1;
}

.post-actions {
  display: flex;
  gap: 4px;
}

.reply-section {
  padding: 5px 0;
  margin-bottom: 20px;
}

/* Creator view - keep existing q-item styles */
.post-item-label {
  text-align: right;
}

.post-date {
  margin: 0px 5px;
  color: gray;
  text-align: right;
}

.helper-post {
  margin-left: 24px;
}

/* Post text styling - larger font */
.post-text-content {
  font-size: 1.3rem;
  line-height: 1.5;
}

/* Post text input - larger font */
.post-text-input :deep(textarea) {
  font-size: 1.3rem;
  line-height: 1.5;
}

.helper-btns .q-btn {
  flex: 1;
}

/* WhatsApp-style input */
.whatsapp-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.whatsapp-input .message-input {
  flex: 1;
}

.whatsapp-input .message-input :deep(.q-field__control) {
  border-radius: 24px;
}

.whatsapp-input .action-btn {
  flex-shrink: 0;
}
</style>
