<template>
  <div class="audio-player">
    <q-card flat bordered>
      <q-card-section class="row items-center q-gutter-sm">
        <q-btn
          flat
          round
          :color="isPlaying ? 'primary' : 'grey-7'"
          :icon="isPlaying ? 'pause' : 'play_arrow'"
          @click="togglePlay"
          :disable="!isLoaded"
        />

        <div class="col">
          <q-slider
            v-model="currentPosition"
            :min="0"
            :max="duration"
            :step="0.1"
            @update:model-value="seek"
            :disable="!isLoaded"
            color="primary"
            class="q-mb-xs"
          />
          <div class="row justify-between text-caption text-grey-7">
            <span>{{ formatTime(currentPosition) }}</span>
            <span>{{ formatTime(duration) }}</span>
          </div>
        </div>

        <q-btn
          flat
          round
          dense
          icon="volume_up"
          color="grey-7"
        >
          <q-menu>
            <q-card style="width: 80px">
              <q-card-section class="q-pa-sm">
                <q-slider
                  v-model="volume"
                  :min="0"
                  :max="1"
                  :step="0.1"
                  vertical
                  reverse
                  color="primary"
                  style="height: 100px"
                />
              </q-card-section>
            </q-card>
          </q-menu>
          <q-tooltip>Volume</q-tooltip>
        </q-btn>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
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
const volume = ref(0.8)

let sound = null
let progressInterval = null

onMounted(() => {
  initSound()
})

onBeforeUnmount(() => {
  if (progressInterval) {
    clearInterval(progressInterval)
  }
  if (sound) {
    sound.unload()
  }
})

watch(volume, (newVolume) => {
  if (sound) {
    sound.volume(newVolume)
  }
})

function initSound() {
  sound = new Howl({
    src: [props.audioUrl],
    html5: true,
    volume: volume.value,
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
}

function startProgressTracking() {
  progressInterval = setInterval(() => {
    if (sound && isPlaying.value) {
      currentPosition.value = sound.seek()
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
</script>

<style scoped>
.audio-player {
  width: 100%;
}
</style>
