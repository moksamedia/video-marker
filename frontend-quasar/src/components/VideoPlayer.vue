<template>
  <div class="video-player-container" :class="{ 'compact-mode': compact }">
    <div id="youtube-player" ref="playerEl"></div>

    <div v-if="isCreator" class="controls-container q-mt-md">
      <div class="row q-gutter-sm">
        <q-btn
          color="primary"
          icon="place"
          label="Mark Current Time"
          @click="createPointMarker"
          :disable="!player"
        />

        <q-btn
          v-if="!rangeStart"
          color="secondary"
          icon="play_arrow"
          label="Start Range"
          @click="startRange"
          :disable="!player"
        />

        <q-btn
          v-else
          color="secondary"
          icon="stop"
          label="End Range"
          @click="endRange"
          :disable="!player"
        />

        <q-space />

        <q-btn
          color="negative"
          icon="delete"
          label="Delete Session"
          @click="confirmDeleteSession"
          outline
        />
      </div>

      <div v-if="rangeStart" class="q-mt-sm">
        <q-banner class="bg-secondary text-white" dense rounded>
          <template v-slot:avatar>
            <q-icon name="schedule" />
          </template>
          Range started at {{ formatTime(rangeStart) }}
        </q-banner>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useQuasar } from 'quasar'

const props = defineProps({
  videoId: {
    type: String,
    required: true,
  },
  isCreator: {
    type: Boolean,
    default: false,
  },
  compact: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['currentTimeUpdate', 'createMarker', 'deleteSession', 'durationUpdate'])

const $q = useQuasar()
const playerEl = ref(null)
const player = ref(null)
const currentTime = ref(0)
const rangeStart = ref(null)

let pollInterval = null

onMounted(() => {
  loadYouTubeAPI()
})

onBeforeUnmount(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
  }
  if (player.value) {
    player.value.destroy()
  }
})

function loadYouTubeAPI() {
  if (window.YT && window.YT.Player) {
    initPlayer()
    return
  }

  // Load YouTube IFrame API
  const tag = document.createElement('script')
  tag.src = 'https://www.youtube.com/iframe_api'
  const firstScriptTag = document.getElementsByTagName('script')[0]
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)

  window.onYouTubeIframeAPIReady = initPlayer
}

function initPlayer() {
  player.value = new window.YT.Player('youtube-player', {
    videoId: props.videoId,
    width: '100%',
    height: '300',
    playerVars: {
      modestbranding: 1,
      rel: 0,
    },
    events: {
      onReady: onPlayerReady,
    },
  })
}

function onPlayerReady() {
  // Get the video duration and emit it
  if (player.value && player.value.getDuration) {
    const duration = player.value.getDuration()
    emit('durationUpdate', duration)
  }

  // Poll for current time every 250ms
  pollInterval = setInterval(() => {
    if (player.value && player.value.getCurrentTime) {
      currentTime.value = player.value.getCurrentTime()
      emit('currentTimeUpdate', currentTime.value)
    }
  }, 250)
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function createPointMarker() {
  if (!player.value) return

  const time = player.value.getCurrentTime()
  emit('createMarker', time, null)

  $q.notify({
    type: 'positive',
    message: `Point marker created at ${formatTime(time)}`,
    icon: 'place',
  })
}

function startRange() {
  if (!player.value) return
  rangeStart.value = player.value.getCurrentTime()
}

function endRange() {
  if (!player.value || !rangeStart.value) return

  const endTime = player.value.getCurrentTime()

  if (endTime <= rangeStart.value) {
    $q.notify({
      type: 'warning',
      message: 'End time must be after start time',
      icon: 'warning',
    })
    return
  }

  emit('createMarker', rangeStart.value, endTime)

  $q.notify({
    type: 'positive',
    message: `Range marker created: ${formatTime(rangeStart.value)} - ${formatTime(endTime)}`,
    icon: 'schedule',
  })
  rangeStart.value = null
}

function confirmDeleteSession() {
  $q.dialog({
    title: 'Delete Session',
    message:
      'Are you sure you want to delete this session? This will delete all markers and posts.',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    emit('deleteSession')
  })
}

function seekToTime(time) {
  if (player.value && player.value.seekTo) {
    player.value.seekTo(time, true)
  }
}

defineExpose({
  seekToTime,
  getCurrentTime: () => currentTime.value,
})
</script>

<style scoped>
.video-player-container {
  width: 100%;
}

#youtube-player {
  width: 100%;
  aspect-ratio: 16 / 9;
}

/* Compact mode for mobile/helper view */
.compact-mode #youtube-player {
  max-height: 250px;
}

@media (max-width: 599px) {
  .compact-mode #youtube-player {
    max-height: 200px;
  }
}
</style>
