<template>
  <div class="audio-player">
    <button @click="togglePlay" :class="isPlaying ? 'btn-secondary' : 'btn-primary'">
      {{ isPlaying ? 'Pause' : 'Play' }}
    </button>
    <div class="audio-progress" @click="seek" ref="progressBar">
      <div class="audio-progress-bar" :style="{ width: progress + '%' }"></div>
    </div>
    <span class="audio-time">{{ formatTime(currentTime) }}</span>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Howl } from 'howler'

const props = defineProps({
  audioUrl: {
    type: String,
    required: true
  }
})

const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const progress = ref(0)
const progressBar = ref(null)

let sound = null
let updateInterval = null

onMounted(() => {
  sound = new Howl({
    src: [props.audioUrl],
    html5: true,
    onload: () => {
      duration.value = sound.duration()
    },
    onplay: () => {
      isPlaying.value = true
      updateProgress()
    },
    onpause: () => {
      isPlaying.value = false
      if (updateInterval) {
        clearInterval(updateInterval)
      }
    },
    onend: () => {
      isPlaying.value = false
      currentTime.value = 0
      progress.value = 0
      if (updateInterval) {
        clearInterval(updateInterval)
      }
    }
  })
})

onUnmounted(() => {
  if (sound) {
    sound.unload()
  }
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})

const togglePlay = () => {
  if (!sound) return

  if (isPlaying.value) {
    sound.pause()
  } else {
    sound.play()
  }
}

const updateProgress = () => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }

  updateInterval = setInterval(() => {
    if (sound && isPlaying.value) {
      currentTime.value = sound.seek()
      progress.value = (currentTime.value / duration.value) * 100
    }
  }, 100)
}

const seek = (event) => {
  if (!sound || !progressBar.value) return

  const rect = progressBar.value.getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  const seekTime = percent * duration.value

  sound.seek(seekTime)
  currentTime.value = seekTime
  progress.value = percent * 100
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>
