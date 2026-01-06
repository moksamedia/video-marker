import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSessionStore = defineStore('session', () => {
  const session = ref(null)
  const selectedMarker = ref(null)
  const currentTime = ref(0)
  const videoDuration = ref(0)

  const markers = computed(() => session.value?.markers || [])
  const videoTitle = computed(() => session.value?.youtube_title || '')
  const videoUrl = computed(() => session.value?.youtube_url || '')
  const role = computed(() => session.value?.role || null)

  function setSession(sessionData) {
    session.value = sessionData
    // Auto-select first marker if available
    if (sessionData?.markers?.length > 0 && !selectedMarker.value) {
      selectedMarker.value = sessionData.markers[0]
    }
  }

  function setSelectedMarker(marker) {
    selectedMarker.value = marker
  }

  function setCurrentTime(time) {
    currentTime.value = time
  }

  function setVideoDuration(duration) {
    videoDuration.value = duration
  }

  function updateSession(sessionData) {
    session.value = sessionData
    // Re-select marker if it still exists
    if (selectedMarker.value) {
      const marker = sessionData.markers.find((m) => m.id === selectedMarker.value.id)
      if (marker) {
        selectedMarker.value = marker
      } else {
        selectedMarker.value = sessionData.markers[0] || null
      }
    }
  }

  function clearSession() {
    session.value = null
    selectedMarker.value = null
    currentTime.value = 0
    videoDuration.value = 0
  }

  return {
    // State
    session,
    selectedMarker,
    currentTime,
    videoDuration,
    // Computed
    markers,
    videoTitle,
    videoUrl,
    role,
    // Actions
    setSession,
    setSelectedMarker,
    setCurrentTime,
    setVideoDuration,
    updateSession,
    clearSession,
  }
})
