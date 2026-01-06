<template>
  <div class="audio-recorder">
    <div v-if="!isRecording && !audioBlob" class="row q-gutter-sm">
      <q-btn
        color="negative"
        icon="mic"
        label="Start Recording"
        @click="startRecording"
        :disable="!hasPermission"
      />
    </div>

    <div v-if="isRecording" class="recording-controls">
      <q-card flat bordered>
        <q-card-section class="row items-center q-gutter-sm">
          <q-spinner-audio color="negative" size="md" />
          <div class="col">
            <div class="text-weight-medium">Recording...</div>
            <div class="text-caption">{{ formatDuration(recordingDuration) }} / 5:00</div>
          </div>
          <q-btn flat round color="negative" icon="stop" @click="stopRecording">
            <q-tooltip>Stop recording</q-tooltip>
          </q-btn>
        </q-card-section>
        <q-linear-progress :value="recordingProgress" color="negative" />
      </q-card>
    </div>

    <div v-if="audioBlob && !isRecording" class="preview-controls">
      <q-card flat bordered>
        <q-card-section>
          <div class="text-subtitle2 q-mb-sm">
            <q-icon name="check_circle" color="positive" />
            Recording ready
          </div>

          <audio ref="previewAudio" controls class="full-width q-mb-sm"></audio>

          <div class="row q-gutter-sm">
            <q-btn flat color="negative" icon="delete" label="Discard" @click="discardRecording" />
            <q-space />
            <q-btn
              color="positive"
              icon="check"
              label="Use This Recording"
              @click="$emit('audioReady', audioBlob)"
            />
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div v-if="!hasPermission" class="q-mt-sm">
      <q-banner class="bg-warning text-white" dense rounded>
        <template v-slot:avatar>
          <q-icon name="mic_off" />
        </template>
        Microphone permission required for audio recording
      </q-banner>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useQuasar } from 'quasar'
import lamejs from '@breezystack/lamejs'

defineEmits(['audioReady'])

const $q = useQuasar()

const isRecording = ref(false)
const audioBlob = ref(null)
const hasPermission = ref(false)
const recordingDuration = ref(0)
const recordingProgress = ref(0)
const previewAudio = ref(null)

let mediaRecorder = null
let audioChunks = []
let durationInterval = null
const MAX_DURATION = 300 // 5 minutes in seconds

onMounted(async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true })
    hasPermission.value = true
  } catch {
    hasPermission.value = false
    $q.notify({
      type: 'warning',
      message: 'Microphone permission denied',
      icon: 'mic_off',
    })
  }
})

onBeforeUnmount(() => {
  if (durationInterval) {
    clearInterval(durationInterval)
  }
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
})

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream)
    audioChunks = []
    recordingDuration.value = 0
    recordingProgress.value = 0

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data)
    }

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
      await encodeToMP3(audioBlob)
      stream.getTracks().forEach((track) => track.stop())
    }

    mediaRecorder.start()
    isRecording.value = true

    // Track duration and auto-stop at 5 minutes
    durationInterval = setInterval(() => {
      recordingDuration.value++
      recordingProgress.value = recordingDuration.value / MAX_DURATION

      if (recordingDuration.value >= MAX_DURATION) {
        stopRecording()
        $q.notify({
          type: 'info',
          message: 'Maximum recording duration (5 minutes) reached',
          icon: 'info',
        })
      }
    }, 1000)
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to start recording',
      icon: 'error',
    })
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
    isRecording.value = false

    if (durationInterval) {
      clearInterval(durationInterval)
      durationInterval = null
    }
  }
}

async function encodeToMP3(webmBlob) {
  try {
    const arrayBuffer = await webmBlob.arrayBuffer()
    const audioContext = new AudioContext()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    const channels = audioBuffer.numberOfChannels
    const sampleRate = audioBuffer.sampleRate

    // Get samples for left channel
    const samplesLeft = audioBuffer.getChannelData(0)

    // Convert to 16-bit PCM for left channel
    const bufferLeft = new Int16Array(samplesLeft.length)
    for (let i = 0; i < samplesLeft.length; i++) {
      const s = Math.max(-1, Math.min(1, samplesLeft[i]))
      bufferLeft[i] = s < 0 ? s * 0x8000 : s * 0x7fff
    }

    // If stereo, get right channel too
    let bufferRight = null
    if (channels === 2) {
      const samplesRight = audioBuffer.getChannelData(1)
      bufferRight = new Int16Array(samplesRight.length)
      for (let i = 0; i < samplesRight.length; i++) {
        const s = Math.max(-1, Math.min(1, samplesRight[i]))
        bufferRight[i] = s < 0 ? s * 0x8000 : s * 0x7fff
      }
    }

    // Encode to MP3
    const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, 128)
    const mp3Data = []

    const sampleBlockSize = 1152
    for (let i = 0; i < bufferLeft.length; i += sampleBlockSize) {
      const leftChunk = bufferLeft.subarray(i, i + sampleBlockSize)
      let mp3buf

      if (channels === 2 && bufferRight) {
        const rightChunk = bufferRight.subarray(i, i + sampleBlockSize)
        mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk)
      } else {
        mp3buf = mp3encoder.encodeBuffer(leftChunk)
      }

      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf)
      }
    }

    const mp3buf = mp3encoder.flush()
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf)
    }

    audioBlob.value = new Blob(mp3Data, { type: 'audio/mp3' })

    // Set up preview
    if (previewAudio.value) {
      previewAudio.value.src = URL.createObjectURL(audioBlob.value)
    }
  } catch (err) {
    console.error('Audio encoding error:', err)
    $q.notify({
      type: 'negative',
      message: 'Failed to encode audio: ' + err.message,
      icon: 'error',
    })
  }
}

function discardRecording() {
  audioBlob.value = null
  recordingDuration.value = 0
  recordingProgress.value = 0

  if (previewAudio.value) {
    previewAudio.value.src = ''
  }
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

<style scoped>
audio {
  width: 100%;
}
</style>
