<template>
  <div class="audio-player">
    <q-card flat bordered>
      <q-card-section class="row items-center q-gutter-sm q-py-sm no-bottom">
        <q-btn
          flat
          round
          compact
          size="xl"
          :color="isPlaying ? 'primary' : 'grey-7'"
          :icon="isPlaying ? 'pause' : 'play_arrow'"
          @click="togglePlay"
          :disable="!isLoaded"
        />

        <div class="col">
          <canvas
            ref="waveformCanvas"
            class="waveform-canvas"
            @click="handleWaveformClick"
            :class="{ disabled: !isLoaded }"
          ></canvas>
          <div class="row justify-between text-caption text-grey-7">
            <span>{{ formatTime(currentPosition) }}</span>
            <span>{{ formatTime(duration) }}</span>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Howl } from 'howler'

const props = defineProps({
  audioUrl: {
    type: String,
    required: true,
  },
})

const isPlaying = ref(false)
const isLoaded = ref(false)
const currentPosition = ref(0)
const duration = ref(0)
const waveformCanvas = ref(null)

let sound = null
let progressInterval = null
let waveformData = []
const BARS_COUNT = 100

onMounted(() => {
  initSound()
  generateWaveform()
})

onBeforeUnmount(() => {
  if (progressInterval) {
    clearInterval(progressInterval)
  }
  if (sound) {
    sound.unload()
  }
})

function initSound() {
  sound = new Howl({
    src: [props.audioUrl],
    html5: true,
    volume: 1.0,
    onload: () => {
      isLoaded.value = true
      duration.value = sound.duration()
    },
    onplay: () => {
      isPlaying.value = true
      startProgressTracking()
    },
    onpause: () => {
      isPlaying.value = false
      stopProgressTracking()
    },
    onend: () => {
      isPlaying.value = false
      stopProgressTracking()
      currentPosition.value = 0
      drawWaveform()
    },
  })
}

function togglePlay() {
  if (!sound) return

  if (isPlaying.value) {
    sound.pause()
  } else {
    sound.play()
  }
}

function seek(value) {
  if (!sound) return
  sound.seek(value)
  currentPosition.value = value
  drawWaveform()
}

function startProgressTracking() {
  progressInterval = setInterval(() => {
    if (sound && isPlaying.value) {
      currentPosition.value = sound.seek()
      drawWaveform()
    }
  }, 100)
}

function stopProgressTracking() {
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

async function generateWaveform() {
  try {
    // Fetch the audio file
    const response = await fetch(props.audioUrl)
    const arrayBuffer = await response.arrayBuffer()

    // Create audio context and decode
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    // Get channel data
    const rawData = audioBuffer.getChannelData(0)
    const samples = BARS_COUNT
    const blockSize = Math.floor(rawData.length / samples)

    // Calculate amplitude for each bar
    waveformData = []
    for (let i = 0; i < samples; i++) {
      let sum = 0
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[i * blockSize + j])
      }
      waveformData.push(sum / blockSize)
    }

    // Normalize to 0-1 range
    const max = Math.max(...waveformData)
    waveformData = waveformData.map((val) => val / max)

    // Wait for canvas to be available and draw
    await nextTick()
    drawWaveform()
  } catch (error) {
    console.error('Error generating waveform:', error)
    // Fallback to flat bars if generation fails
    waveformData = new Array(BARS_COUNT).fill(0.5)
    await nextTick()
    drawWaveform()
  }
}

function drawWaveform() {
  if (!waveformCanvas.value) return

  const canvas = waveformCanvas.value
  const ctx = canvas.getContext('2d')

  // Set canvas size
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = 48 * dpr
  ctx.scale(dpr, dpr)

  const width = rect.width
  const height = 48
  const barWidth = width / BARS_COUNT
  const gap = 2

  // Clear canvas
  ctx.clearRect(0, 0, width, height)

  // Calculate progress
  const progress = duration.value > 0 ? currentPosition.value / duration.value : 0

  // Draw bars
  for (let i = 0; i < BARS_COUNT; i++) {
    const barHeight = Math.max(3, waveformData[i] * height * 0.8)
    const x = i * barWidth
    const y = (height - barHeight) / 2

    // Color based on progress
    if (i / BARS_COUNT <= progress) {
      ctx.fillStyle = '#1976d2' // Primary blue for played portion
    } else {
      ctx.fillStyle = '#bdbdbd' // Grey for unplayed portion
    }

    ctx.fillRect(x, y, barWidth - gap, barHeight)
  }
}

function handleWaveformClick(event) {
  if (!isLoaded.value || !waveformCanvas.value || !duration.value) return

  const rect = waveformCanvas.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const clickPosition = x / rect.width
  const seekTime = clickPosition * duration.value

  seek(seekTime)
}
</script>

<style scoped>
.audio-player {
  width: 100%;
}

.waveform-canvas {
  width: 100%;
  height: 30px;
  cursor: pointer;
  margin-bottom: 4px;
}

.waveform-canvas.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.no-bottom {
  padding-bottom: 0 !important;
  padding-top: 5 !important;
}
</style>
