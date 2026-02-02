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
            class="post-wrapper"
            :class="{
              'own-message': post.author_type === role,
              'other-message': post.author_type !== role,
              'has-audio': post.audio_filename,
            }"
          >
            <div class="post-bubble" :class="{ 'has-audio': post.audio_filename }">
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
                <div
                  v-if="post.text_content"
                  class="post-text-content"
                  v-html="formatTextWithTibetan(post.text_content)"
                ></div>

                <div v-if="post.audio_filename">
                  <AudioPlayer :audio-url="getAudioUrl(post.audio_filename)" />
                </div>
              </div>

              <!-- Action buttons -->
              <div
                v-if="canDeletePost(post) && editingPostId !== post.id"
                class="post-actions-inline"
              >
                <q-btn
                  flat
                  round
                  dense
                  color="primary"
                  icon="edit"
                  size="sm"
                  @click="startEdit(post)"
                  v-if="post.text_content"
                >
                  <q-tooltip>Edit post</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  dense
                  color="negative"
                  icon="delete"
                  size="sm"
                  @click="confirmDeletePost(post)"
                >
                  <q-tooltip>Delete post</q-tooltip>
                </q-btn>
              </div>
            </div>
            <div class="post-date">{{ formatDate(post.created_at) }}</div>
          </div>
        </div>
      </div>

      <!-- Reply Area -->
      <div class="reply-section">
        <!-- Recording Interface -->
        <div v-if="replyMode === 'record'">
          <AudioRecorder auto-start @audio-ready="handleAudioRecorded" @cancel="cancelReply" />
        </div>

        <!-- WhatsApp-style Input -->
        <div v-else class="whatsapp-input" ref="inputContainer">
          <q-input
            ref="messageInput"
            v-model="textContent"
            outlined
            autogrow
            placeholder="Type a message"
            :disable="isSaving"
            class="message-input"
            @keyup.enter="handleEnter"
            @focus="handleInputFocus"
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
            <!-- Slip marker backward 5s -->
            <q-btn @click="slipMarker(-5)" label="-5s" no-caps color="secondary" outline class="slip-5s">
              <q-tooltip>Slip marker start time backward 5s</q-tooltip>
            </q-btn>
            <!-- Slip marker backward 1s -->
            <q-btn @click="slipMarker(-1)" label="-1s" no-caps color="secondary" outline>
              <q-tooltip>Slip marker start time backward 1s</q-tooltip>
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

            <!-- Slip marker forward 1s -->
            <q-btn @click="slipMarker(1)" label="+1s" no-caps color="secondary" outline>
              <q-tooltip>Slip marker start time forward 1s</q-tooltip>
            </q-btn>
            <!-- Slip marker forward 5s -->
            <q-btn @click="slipMarker(5)" label="+5s" no-caps color="secondary" outline class="slip-5s">
              <q-tooltip>Slip marker start time forward 5s</q-tooltip>
            </q-btn>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Posts List -->
      <div v-if="marker.posts && marker.posts.length > 0" class="posts-section">
        <div v-for="post in marker.posts" :key="post.id" class="post-item">
          <div
            class="post-wrapper"
            :class="{
              'own-message': post.author_type === role,
              'other-message': post.author_type !== role,
              'has-audio': post.audio_filename,
            }"
          >
            <div class="post-bubble" :class="{ 'has-audio': post.audio_filename }">
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
                <div
                  v-if="post.text_content"
                  class="post-text-content"
                  v-html="formatTextWithTibetan(post.text_content)"
                ></div>

                <div v-if="post.audio_filename">
                  <AudioPlayer :audio-url="getAudioUrl(post.audio_filename)" />
                </div>
              </div>

              <!-- Action buttons -->
              <div
                v-if="canDeletePost(post) && editingPostId !== post.id"
                class="post-actions-inline"
              >
                <q-btn
                  flat
                  round
                  dense
                  color="primary"
                  icon="edit"
                  size="sm"
                  @click="startEdit(post)"
                  v-if="post.text_content"
                >
                  <q-tooltip>Edit post</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  dense
                  color="negative"
                  icon="delete"
                  size="sm"
                  @click="confirmDeletePost(post)"
                >
                  <q-tooltip>Delete post</q-tooltip>
                </q-btn>
              </div>
            </div>
            <div class="post-date">{{ formatDate(post.created_at) }}</div>
          </div>
        </div>
      </div>

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
  token: {
    type: String,
    default: null,
  },
})

const emit = defineEmits([
  'postCreated',
  'markerSelected',
  'seek',
  'playFromMarker',
  'togglePlayPause',
  'markerUpdated',
])

const $q = useQuasar()

const textContent = ref('')
const audioBlob = ref(null)
const isSaving = ref(false)
const editingPostId = ref(null)
const editingText = ref('')
const replyMode = ref(null) // null, 'text', or 'record'
const messageInput = ref(null)
const inputContainer = ref(null)

// Marker navigation
const currentMarkerIndex = computed(() => {
  if (!props.marker || !props.markers.length) return -1
  return props.markers.findIndex((m) => m.id === props.marker.id)
})

function seekBackward(seconds) {
  emit('seek', -seconds)
}

async function slipMarker(seconds) {
  if (!props.marker) return

  const newStartTime = Math.max(0, props.marker.start_time + seconds)
  const newEndTime = props.marker.end_time ? props.marker.end_time + seconds : null

  try {
    await apiService.updateMarker(props.marker.id, props.token, newStartTime, newEndTime)

    $q.notify({
      type: 'positive',
      message: `Marker time adjusted by ${seconds > 0 ? '+' : ''}${seconds}s`,
      icon: 'schedule',
      timeout: 1000,
    })

    emit('markerUpdated')
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.response?.data?.error || 'Failed to update marker',
      icon: 'error',
    })
  }
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
    if (!props.token) {
      throw new Error('Token not found')
    }
    await apiService.createPost(
      props.marker.id,
      props.token,
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

function handleInputFocus() {
  // Scroll input into view when keyboard appears on mobile
  // Use setTimeout to allow keyboard animation to complete
  setTimeout(() => {
    if (inputContainer.value) {
      inputContainer.value.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, 300)
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

function formatTextWithTibetan(text) {
  if (!text) return ''

  // Escape HTML to prevent XSS
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  // Wrap Tibetan text in spans (Tibetan Unicode range: U+0F00-U+0FFF)
  escaped = escaped.replace(/([\u0F00-\u0FFF]+)/g, '<span class="tibetan-text">$1</span>')

  // Convert line breaks to <br>
  escaped = escaped.replace(/\n/g, '<br>')

  return escaped
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
    if (!props.token) {
      throw new Error('Token not found')
    }

    await apiService.deletePost(postId, props.token)

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
    if (!props.token) {
      throw new Error('Token not found')
    }

    await apiService.updatePost(post.id, props.token, editingText.value.trim())

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
  gap: 8px;
  padding: 8px 0;
}

.post-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* WhatsApp-style message bubbles */
.post-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 85%;
}

.post-wrapper.own-message {
  align-self: flex-end;
  align-items: flex-end;
}

.post-wrapper.other-message {
  align-self: flex-start;
  align-items: flex-start;
}

.post-bubble {
  padding: 10px 14px;
  border-radius: 12px;
  position: relative;
  display: inline-block;
  max-width: 100%;
  word-wrap: break-word;
}

.post-bubble.has-audio {
  width: 100%;
}

.post-wrapper.has-audio {
  max-width: 100%;
  min-width: 85%;
}

.own-message .post-bubble {
  background-color: #dcf8c6;
  border-bottom-right-radius: 2px;
}

.other-message .post-bubble {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-bottom-left-radius: 2px;
}

.post-actions-inline {
  display: flex;
  gap: 4px;
  margin-top: 8px;
  justify-content: flex-end;
}

.reply-section {
  padding: 5px 0;
  margin-bottom: 20px;
}

.post-date {
  font-size: 0.75rem;
  color: #888;
  margin: 2px 8px;
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

/* Mobile: hide 5s slip buttons, keep only 1s buttons */
@media (max-width: 599px) {
  .slip-5s {
    display: none;
  }

  /* Smaller font sizes for posts on mobile */
  .post-text-content {
    font-size: 1rem;
  }

  .post-text-input :deep(textarea) {
    font-size: 1rem;
  }
}
</style>
<style>
/* Tibetan text - even larger font */
.post-text-content .tibetan-text {
  font-size: 2.2rem;
  line-height: 1.6;
}

/* Mobile: smaller Tibetan text */
@media (max-width: 599px) {
  .post-text-content .tibetan-text {
    font-size: 1.6rem;
  }
}
</style>
