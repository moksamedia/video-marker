<template>
  <div class="creator-video-player">
    <div id="creator-youtube-player" ref="playerEl"></div>

    <div class="controls-container q-mt-md">
      <div class="row q-gutter-sm">
        <q-btn
          color="primary"
          icon="place"
          label="Mark Current Time"
          @click="createPointMarker"
          :disable="!player"
        />

        <!--
        <q-btn
          v-if="!rangeStart"
          color="secondary"
          icon="play_arrow"
          label="Start Range"
          @click="startRange"
          :disable="true"
        />

        <q-btn
          v-else
          color="secondary"
          icon="stop"
          label="End Range"
          @click="endRange"
          :disable="!player"
        />
        -->

        <q-space />

        <!-- Seek Backward Controls -->
        <q-btn-group flat>
          <q-btn icon="replay_5" @click="seekBackward(5)" :disable="!player" size="lg">
            <q-tooltip>Rewind 5s</q-tooltip>
          </q-btn>
          <q-btn icon="replay_10" @click="seekBackward(10)" :disable="!player" size="lg">
            <q-tooltip>Rewind 10s</q-tooltip>
          </q-btn>
          <q-btn icon="replay_30" @click="seekBackward(30)" :disable="!player" size="lg">
            <q-tooltip>Rewind 30s</q-tooltip>
          </q-btn>
        </q-btn-group>

        <!-- Playback Speed Controls -->
        <q-btn-group outline>
          <q-btn
            :outline="playbackSpeed !== 1"
            :color="playbackSpeed === 1 ? 'primary' : 'grey-7'"
            label="1x"
            @click="setPlaybackSpeed(1)"
            :disable="!player"
            size="sm"
          />
          <q-btn
            :outline="playbackSpeed !== 0.85"
            :color="playbackSpeed === 0.85 ? 'primary' : 'grey-7'"
            label="0.85x"
            @click="setPlaybackSpeed(0.85)"
            :disable="!player"
            size="sm"
          />
          <q-btn
            :outline="playbackSpeed !== 0.7"
            :color="playbackSpeed === 0.7 ? 'primary' : 'grey-7'"
            label="0.7x"
            @click="setPlaybackSpeed(0.7)"
            :disable="!player"
            size="sm"
          />
        </q-btn-group>

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
})

const emit = defineEmits(['currentTimeUpdate', 'createMarker', 'deleteSession', 'durationUpdate'])

const $q = useQuasar()
const playerEl = ref(null)
const player = ref(null)
const currentTime = ref(0)
const rangeStart = ref(null)
const playbackSpeed = ref(1)

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

  const tag = document.createElement('script')
  tag.src = 'https://www.youtube.com/iframe_api'
  const firstScriptTag = document.getElementsByTagName('script')[0]
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)

  window.onYouTubeIframeAPIReady = initPlayer
}

function initPlayer() {
  player.value = new window.YT.Player('creator-youtube-player', {
    videoId: props.videoId,
    width: '100%',
    height: '400',
    playerVars: {
      modestbranding: 1,
      rel: 0,
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
    },
  })
}

function onPlayerReady() {
  if (player.value && player.value.getDuration) {
    const duration = player.value.getDuration()
    emit('durationUpdate', duration)
  }

  pollInterval = setInterval(() => {
    if (player.value && player.value.getCurrentTime) {
      currentTime.value = player.value.getCurrentTime()
      emit('currentTimeUpdate', currentTime.value)
    }
  }, 250)
}

function onPlayerStateChange(event) {
  // When video ends (state 0), pause it to prevent "more videos" overlay
  if (event.data === window.YT.PlayerState.ENDED) {
    // Seek to last frame and pause
    const duration = player.value.getDuration()
    player.value.seekTo(duration - 0.1, true)
    player.value.pauseVideo()
  }
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

// eslint-disable-next-line no-unused-vars
function startRange() {
  if (!player.value) return
  rangeStart.value = player.value.getCurrentTime()
}

// eslint-disable-next-line no-unused-vars
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

function setPlaybackSpeed(speed) {
  if (!player.value) return

  player.value.setPlaybackRate(speed)
  playbackSpeed.value = speed

  $q.notify({
    type: 'info',
    message: `Playback speed set to ${speed}x`,
    icon: 'speed',
    timeout: 1000,
  })
}

function seekBackward(seconds) {
  if (!player.value) return

  const currentTime = player.value.getCurrentTime()
  const newTime = Math.max(0, currentTime - seconds)
  player.value.seekTo(newTime, true)

  $q.notify({
    type: 'info',
    message: `Rewound ${seconds}s`,
    icon: 'replay',
    timeout: 800,
  })
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

function play() {
  if (player.value && player.value.playVideo) {
    player.value.playVideo()
  }
}

function pause() {
  if (player.value && player.value.pauseVideo) {
    player.value.pauseVideo()
  }
}

function togglePlayPause() {
  if (player.value) {
    const state = player.value.getPlayerState()
    // 1 = playing, 2 = paused
    if (state === 1) {
      pause()
    } else {
      play()
    }
  }
}

defineExpose({
  seekToTime,
  play,
  pause,
  togglePlayPause,
  getCurrentTime: () => currentTime.value,
})
</script>

<style scoped>
.creator-video-player {
  width: 100%;
}

#creator-youtube-player {
  width: 100%;
  aspect-ratio: 16 / 9;
}
</style>
