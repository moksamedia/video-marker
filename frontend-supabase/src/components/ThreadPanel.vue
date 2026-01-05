<template>
  <div class="thread-panel">
    <h3 v-if="marker">
      Thread at {{ formatTime(marker.start_time) }}
      <span v-if="marker.end_time"> - {{ formatTime(marker.end_time) }}</span>
    </h3>
    <p v-else style="color: #6c757d;">Select a marker to view its thread</p>

    <div v-if="marker">
      <div class="posts-list">
        <div v-if="posts.length === 0" style="color: #6c757d; text-align: center; padding: 20px;">
          No posts yet. Be the first to add one!
        </div>

        <div
          v-for="post in posts"
          :key="post.id"
          :class="['post', post.author_type]"
        >
          <div class="post-author">{{ post.author_type }}</div>
          <div v-if="post.text_content" class="post-text">{{ post.text_content }}</div>
          <AudioPlayer
            v-if="post.audio_filename"
            :audioUrl="`/api/audio/${post.audio_filename}`"
          />
          <div class="post-time">{{ formatDateTime(post.created_at) }}</div>
        </div>
      </div>

      <div class="post-form">
        <textarea
          v-model="newPostText"
          placeholder="Type your message here..."
          :disabled="isSubmitting"
        ></textarea>

        <AudioRecorder @save="handleAudioSave" />

        <div class="post-form-actions">
          <button
            @click="submitPost"
            class="btn-primary"
            :disabled="!canSubmit || isSubmitting"
          >
            {{ isSubmitting ? 'Posting...' : 'Post' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AudioPlayer from './AudioPlayer.vue'
import AudioRecorder from './AudioRecorder.vue'

const props = defineProps({
  marker: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['post-created'])

const newPostText = ref('')
const newPostAudio = ref(null)
const isSubmitting = ref(false)

const posts = computed(() => {
  if (!props.marker || !props.marker.posts) return []
  return props.marker.posts
})

const canSubmit = computed(() => {
  return newPostText.value.trim() || newPostAudio.value
})

const handleAudioSave = (audioBlob) => {
  newPostAudio.value = audioBlob
}

const submitPost = async () => {
  if (!canSubmit.value) return

  isSubmitting.value = true

  try {
    await emit('post-created', {
      markerId: props.marker.id,
      textContent: newPostText.value.trim() || null,
      audioBlob: newPostAudio.value
    })

    // Clear form
    newPostText.value = ''
    newPostAudio.value = null
  } catch (error) {
    console.error('Failed to submit post:', error)
    alert('Failed to submit post. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatDateTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString()
}
</script>
