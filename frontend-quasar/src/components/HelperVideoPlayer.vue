<template>
  <div class="helper-video-player">
    <iframe
      id="helper-youtube-player"
      :src="`https://www.youtube.com/embed/${props.videoId}?enablejsapi=1&modestbranding=1&rel=0`"
      style="border: 0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    ></iframe>
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

const emit = defineEmits(['currentTimeUpdate', 'durationUpdate'])

const $q = useQuasar()

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

  // If script is already being loaded, wait for it
  if (!window.YT && !document.querySelector('script[src*="youtube.com/iframe_api"]')) {
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
  }

  // Add our callback to a queue to avoid overwriting
  if (!window.onYouTubeIframeAPIReady) {
    window.onYouTubeIframeAPIReady = () => {
      if (window.ytCallbacks) {
        window.ytCallbacks.forEach(cb => cb())
        window.ytCallbacks = []
      }
    }
    window.ytCallbacks = []
  }
  window.ytCallbacks = window.ytCallbacks || []
  window.ytCallbacks.push(initPlayer)
}

function initPlayer() {
  console.log('Initializing helper YouTube player with video ID:', props.videoId)

  if (!props.videoId || props.videoId.length !== 11) {
    console.error('Invalid video ID:', props.videoId)
    $q.notify({
      type: 'negative',
      message: 'Invalid video ID format. Please check the YouTube URL.',
      icon: 'error',
    })
    return
  }

  // When using an existing iframe, only pass the element ID and events
  // No videoId or playerVars needed - those are in the iframe src
  player.value = new window.YT.Player('helper-youtube-player', {
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
      onError: onPlayerError,
    },
  })
}

function onPlayerError(event) {
  console.error('YouTube Player Error:', event.data)
  // Error codes:
  // 2 = Invalid parameter
  // 5 = HTML5 player error
  // 100 = Video not found or private
  // 101/150 = Video cannot be embedded

  let errorMessage = 'Video playback error'
  if (event.data === 100) {
    errorMessage = 'Video not found or is private'
  } else if (event.data === 101 || event.data === 150) {
    errorMessage = 'This video cannot be embedded. Please try a different video.'
  } else if (event.data === 2) {
    errorMessage = 'Invalid video parameter'
  } else if (event.data === 5) {
    errorMessage = 'HTML5 player error. Try refreshing the page.'
  }

  $q.notify({
    type: 'negative',
    message: errorMessage,
    caption: `Error code: ${event.data}`,
    icon: 'error',
    timeout: 5000,
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
  height: 100%;
  aspect-ratio: 16 / 9;
}
</style>
