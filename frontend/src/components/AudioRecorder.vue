<template>
  <div class="audio-recorder">
    <div v-if="!audioBlob">
      <button
        v-if="!isRecording"
        @click="startRecording"
        class="btn-danger"
      >
        Start Recording
      </button>
      <div v-else>
        <div class="recording-indicator">
          <span class="recording-dot"></span>
          <span class="recording-time">{{ formatTime(recordingTime) }}</span>
        </div>
        <button @click="stopRecording" class="btn-secondary">
          Stop Recording
        </button>
      </div>
    </div>

    <div v-else>
      <p>Recording ready ({{ formatTime(recordingTime) }})</p>
      <div style="display: flex; gap: 10px; margin-top: 10px;">
        <button @click="clearRecording" class="btn-secondary">
          Discard
        </button>
        <button @click="emit('save', audioBlob)" class="btn-success">
          Save Recording
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAudioRecorder } from '../composables/useAudioRecorder'

const emit = defineEmits(['save'])

const {
  isRecording,
  recordingTime,
  audioBlob,
  startRecording,
  stopRecording,
  clearRecording,
  formatTime
} = useAudioRecorder()
</script>
