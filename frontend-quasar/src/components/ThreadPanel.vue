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
          <div v-for="post in marker.posts" :key="post.id">
            <q-item :class="post.author_type === 'creator' ? 'bg-blue-1' : 'bg-green-1'">
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
                    class="q-mb-sm"
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
                  <q-item-label v-if="post.text_content">
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
          <AudioRecorder v-if="!audioBlob" @audio-ready="handleAudioReady" />
          <div v-else class="row items-center q-gutter-sm">
            <q-icon name="mic" color="positive" size="sm" />
            <span class="text-positive">Audio attached</span>
            <q-space />
            <q-btn flat dense color="negative" icon="close" @click="audioBlob = null">
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
  role: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['postCreated'])

const route = useRoute()
const $q = useQuasar()

const textContent = ref('')
const audioBlob = ref(null)
const isSaving = ref(false)
const editingPostId = ref(null)
const editingText = ref('')

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
</style>
