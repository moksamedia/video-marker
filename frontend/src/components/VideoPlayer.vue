<template>
  <div class="video-player">
    <div class="video-wrapper">
      <div :id="playerId"></div>
    </div>

    <div class="video-controls">
      <span class="timestamp">{{ formatTime(currentTime) }}</span>
      <button @click="createPointMarker" class="btn-primary" :disabled="!canCreateMarker">
        Add Point Marker
      </button>
      <button
        @click="toggleRangeSelection"
        :class="rangeStart !== null ? 'btn-danger' : 'btn-secondary'"
        :disabled="!canCreateMarker"
      >
        {{ rangeStart !== null ? 'End Range' : 'Start Range' }}
      </button>
      <button v-if="role === 'creator'" @click="emit('delete-session')" class="btn-danger">
        Delete Session
      </button>
    </div>

    <MarkerTimeline
      v-if="duration > 0"
      :markers="markers"
      :duration="duration"
      :currentTime="currentTime"
      @seek="seekTo"
      @select-marker="selectMarker"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import MarkerTimeline from './MarkerTimeline.vue'

const props = defineProps({
  youtubeUrl: {
    type: String,
    required: true
  },
  markers: {
    type: Array,
    default: () => []
  },
  role: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['create-marker', 'select-marker', 'delete-session'])

const playerId = 'youtube-player-' + Math.random().toString(36).substr(2, 9)
const player = ref(null)
const currentTime = ref(0)
const duration = ref(0)
const rangeStart = ref(null)
const canCreateMarker = ref(false)

let updateInterval = null

onMounted(() => {
  loadYouTubeAPI()
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
  if (player.value) {
    player.value.destroy()
  }
})

const loadYouTubeAPI = () => {
  if (window.YT && window.YT.Player) {
    initPlayer()
    return
  }

  const tag = document.createElement('script')
  tag.src = 'https://www.youtube.com/iframe_api'
  const firstScriptTag = document.getElementsByTagName('script')[0]
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)

  window.onYouTubeIframeAPIReady = () => {
    initPlayer()
  }
}

const initPlayer = () => {
  const videoId = extractVideoId(props.youtubeUrl)

  player.value = new window.YT.Player(playerId, {
    videoId: videoId,
    playerVars: {
      rel: 0,
      modestbranding: 1
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange
    }
  })
}

const extractVideoId = (url) => {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[7].length === 11) ? match[7] : null
}

const onPlayerReady = () => {
  duration.value = player.value.getDuration()
  canCreateMarker.value = props.role === 'creator'
  startTimeUpdate()
}

const onPlayerStateChange = (event) => {
  if (event.data === window.YT.PlayerState.PLAYING) {
    startTimeUpdate()
  } else {
    stopTimeUpdate()
  }
}

const startTimeUpdate = () => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }

  updateInterval = setInterval(() => {
    if (player.value && player.value.getCurrentTime) {
      currentTime.value = player.value.getCurrentTime()
    }
  }, 250)
}

const stopTimeUpdate = () => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
}

const seekTo = (time) => {
  if (player.value && player.value.seekTo) {
    player.value.seekTo(time, true)
    currentTime.value = time
  }
}

const createPointMarker = () => {
  if (props.role !== 'creator') return
  emit('create-marker', currentTime.value, null)
}

const toggleRangeSelection = () => {
  if (props.role !== 'creator') return

  if (rangeStart.value === null) {
    rangeStart.value = currentTime.value
  } else {
    const start = Math.min(rangeStart.value, currentTime.value)
    const end = Math.max(rangeStart.value, currentTime.value)

    // Check for overlap
    const hasOverlap = props.markers.some(marker => {
      if (marker.end_time === null) return false
      return !(marker.end_time <= start || marker.start_time >= end)
    })

    if (hasOverlap) {
      alert('This range overlaps with an existing range marker')
    } else {
      emit('create-marker', start, end)
    }

    rangeStart.value = null
  }
}

const selectMarker = (marker) => {
  seekTo(marker.start_time)
  emit('select-marker', marker)
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>
