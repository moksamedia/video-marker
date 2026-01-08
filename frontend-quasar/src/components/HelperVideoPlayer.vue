<template>
  <div class="helper-video-player">
    <div id="helper-youtube-player" ref="playerEl"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  videoId: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['currentTimeUpdate', 'durationUpdate'])

const playerEl = ref(null)
const player = ref(null)
const currentTime = ref(0)

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
  player.value = new window.YT.Player('helper-youtube-player', {
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
.helper-video-player {
  width: 100%;
}

#helper-youtube-player {
  width: 100%;
  aspect-ratio: 16 / 9;
}
</style>
