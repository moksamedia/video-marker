<template>
  <div class="audio-recorder">
    <!--
    <div v-if="!isRecording && !audioBlob" class="row q-gutter-sm">
      <q-btn
        color="negative"
        icon="mic"
        label="Start Recording"
        @click="startRecording"
        :disable="!hasPermission"
      />
    </div>
    -->

    <div v-if="isRecording" class="recording-controls">
      <q-card flat bordered>
        <q-card-section class="row items-center q-gutter-sm">
          <q-spinner-audio color="negative" size="md" />
          <div class="col">
            <div class="text-weight-medium">Recording...</div>
            <div class="text-caption">{{ formatDuration(recordingDuration) }} / 5:00</div>
            <!-- Audio Level Meter -->
            <div class="audio-level-bar">
              <div class="audio-level-fill" :style="{ width: audioLevel + '%' }"></div>
            </div>
          </div>
          <q-btn flat round color="positive" icon="check" @click="stopRecording">
            <q-tooltip>Done</q-tooltip>
          </q-btn>
          <q-btn flat round color="negative" icon="close" @click="cancelRecording">
            <q-tooltip>Cancel recording</q-tooltip>
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

          <!--
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
          -->
        </q-card-section>
      </q-card>
    </div>

    <div v-if="!hasPermission" class="q-mt-sm">
      <q-banner class="bg-warning text-white" dense rounded>
        <template v-slot:avatar>
          <q-icon name="mic_off" />
        </template>
        Microphone permission required for audio recording
        <template v-slot:action>
          <q-btn flat color="white" label="Grant Permission" @click="requestPermission" />
        </template>
      </q-banner>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useQuasar } from 'quasar'
import lamejs from '@breezystack/lamejs'

const props = defineProps({
  autoStart: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['audioReady', 'cancel'])

const $q = useQuasar()

const isRecording = ref(false)
const audioBlob = ref(null)
const hasPermission = ref(false)
const recordingDuration = ref(0)
const recordingProgress = ref(0)
const previewAudio = ref(null)
const audioLevel = ref(0)

let mediaRecorder = null
let audioChunks = []
let durationInterval = null
let audioContext = null
let analyser = null
let microphone = null
let animationId = null
let activeStream = null // Keep stream active to avoid delay on recording
const MAX_DURATION = 300 // 5 minutes in seconds

onMounted(async () => {
  await requestPermission()
})

async function requestPermission() {
  try {
    console.log('Requesting microphone permission...')
    const startTime = performance.now()

    activeStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    hasPermission.value = true

    const elapsedTime = performance.now() - startTime
    console.log(`Microphone permission granted in ${elapsedTime.toFixed(0)}ms`)

    // Log which microphone is being used
    const audioTrack = activeStream.getAudioTracks()[0]
    if (audioTrack) {
      console.log('  Device label:', audioTrack.label || 'Unknown device')
      console.log('  Device ID:', audioTrack.getSettings().deviceId || 'Unknown')
      console.log('  Settings:', audioTrack.getSettings())
    }

    // Auto-start recording if prop is set (stream is already active)
    if (props.autoStart) {
      startRecording()
    }
  } catch {
    hasPermission.value = false
    $q.notify({
      type: 'warning',
      message: 'Microphone permission denied. Please allow microphone access in your browser settings.',
      icon: 'mic_off',
      timeout: 3000,
    })
  }
}

onBeforeUnmount(() => {
  if (durationInterval) {
    clearInterval(durationInterval)
  }
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  stopAudioLevelMonitoring()

  // Clean up active stream
  if (activeStream) {
    activeStream.getTracks().forEach((track) => track.stop())
    activeStream = null
  }
})

async function startRecording() {
  try {
    console.log('Starting recording...')
    const startTime = performance.now()

    // Use existing stream if available, otherwise request new one
    let stream = activeStream
    if (!stream) {
      console.log('No active stream, requesting new one...')
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      activeStream = stream
    }

    mediaRecorder = new MediaRecorder(stream)
    audioChunks = []
    recordingDuration.value = 0
    recordingProgress.value = 0

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data)
    }

    mediaRecorder.onstop = async () => {
      const webmBlob = new Blob(audioChunks, { type: 'audio/webm' })
      await encodeToMP3(webmBlob)
      // Don't stop the stream - keep it active for next recording
      stopAudioLevelMonitoring()
    }

    mediaRecorder.start()
    isRecording.value = true

    const elapsedTime = performance.now() - startTime
    console.log(`Recording started in ${elapsedTime.toFixed(0)}ms`)

    // Start audio level monitoring
    startAudioLevelMonitoring(stream)

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

function startAudioLevelMonitoring(stream) {
  try {
    console.log('Starting audio level monitoring...')
    // Create audio context and analyser
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    analyser = audioContext.createAnalyser()
    microphone = audioContext.createMediaStreamSource(stream)

    analyser.smoothingTimeConstant = 0.8
    analyser.fftSize = 1024

    microphone.connect(analyser)

    // Process audio level
    const array = new Uint8Array(analyser.frequencyBinCount)

    const updateLevel = () => {
      if (!isRecording.value) return

      analyser.getByteFrequencyData(array)
      const values = array.reduce((a, b) => a + b, 0)
      const average = values / array.length
      // Scale to 0-100
      audioLevel.value = Math.min(100, Math.round(average * 1.5))

      animationId = requestAnimationFrame(updateLevel)
    }

    updateLevel()
    console.log('Finished starting audio level monitoring...')
  } catch (error) {
    console.error('Failed to start audio level monitoring:', error)
  }
}

function stopAudioLevelMonitoring() {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }

  if (microphone) {
    microphone.disconnect()
    microphone = null
  }

  if (analyser) {
    analyser.disconnect()
    analyser = null
  }

  if (audioContext) {
    audioContext.close()
    audioContext = null
  }

  audioLevel.value = 0
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

function cancelRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
    isRecording.value = false

    if (durationInterval) {
      clearInterval(durationInterval)
      durationInterval = null
    }
  }

  stopAudioLevelMonitoring()

  // Reset state and emit cancel
  audioBlob.value = null
  recordingDuration.value = 0
  recordingProgress.value = 0
  emit('cancel')
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

    // If autoStart, emit immediately without preview
    if (props.autoStart) {
      emit('audioReady', audioBlob.value)
    } else {
      // Set up preview for manual flow
      if (previewAudio.value) {
        previewAudio.value.src = URL.createObjectURL(audioBlob.value)
      }
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

/*
function discardRecording() {
  audioBlob.value = null
  recordingDuration.value = 0
  recordingProgress.value = 0

  if (previewAudio.value) {
    previewAudio.value.src = ''
  }
}
  */

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

.audio-level-bar {
  width: 100%;
  height: 16px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.2);
  margin-top: 8px;
}

.audio-level-fill {
  height: 100%;
  background: linear-gradient(to right, #4caf50, #8bc34a, #ffeb3b, #ff9800);
  transition: width 0.1s ease-out;
  border-radius: 7px;
}
</style>
