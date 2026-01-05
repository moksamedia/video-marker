import { ref } from 'vue'

// Backend adapter - provides unified interface for PHP and Supabase

const backendType = import.meta.env.VITE_BACKEND || 'php'

export function useBackendConfig() {
  return {
    isSupabase: backendType === 'supabase',
    isPhp: backendType === 'php',
    backendType
  }
}

// Unified session interface
export async function useSessionBackend() {
  const { isSupabase } = useBackendConfig()

  if (isSupabase) {
    const { useSupabaseSession } = await import('./useSupabaseSession.js')
    return useSupabaseSession()
  } else {
    // Return PHP-compatible interface
    const { useApi } = await import('./useApi.js')
    const api = useApi()

    const session = ref(null)
    const role = ref(null)
    const loading = ref(false)
    const error = ref(null)

    return {
      session,
      role,
      loading,
      error,

      async createSession(youtubeUrl, youtubeTitle, youtubeThumbnail) {
        loading.value = true
        error.value = null
        try {
          const data = await api.createSession(youtubeUrl)
          loading.value = false
          return data
        } catch (err) {
          error.value = err.message
          loading.value = false
          return null
        }
      },

      async loadSession(sessionId, token) {
        loading.value = true
        error.value = null
        try {
          const data = await api.getSession(sessionId, token)
          session.value = data
          role.value = data.role
          loading.value = false
          return true
        } catch (err) {
          error.value = err.message
          loading.value = false
          return false
        }
      },

      async deleteSession(sessionId, token) {
        loading.value = true
        error.value = null
        try {
          await api.deleteSession(sessionId, token)
          loading.value = false
          return true
        } catch (err) {
          error.value = err.message
          loading.value = false
          return false
        }
      }
    }
  }
}

// Unified markers interface
export async function useMarkersBackend() {
  const { isSupabase } = useBackendConfig()

  if (isSupabase) {
    const { useSupabaseMarkers } = await import('./useSupabaseMarkers.js')
    return useSupabaseMarkers()
  } else {
    const { useApi } = await import('./useApi.js')
    const api = useApi()

    const loading = ref(false)
    const error = ref(null)

    return {
      loading,
      error,

      async createMarker(sessionId, token, startTime, endTime = null) {
        loading.value = true
        error.value = null
        try {
          const data = await api.createMarker(sessionId, token, startTime, endTime)
          loading.value = false
          return data
        } catch (err) {
          error.value = err.message
          loading.value = false
          return null
        }
      },

      async deleteMarker(markerId, token) {
        loading.value = true
        error.value = null
        try {
          await api.deleteMarker(markerId, token)
          loading.value = false
          return true
        } catch (err) {
          error.value = err.message
          loading.value = false
          return false
        }
      }
    }
  }
}

// Unified posts interface
export async function usePostsBackend() {
  const { isSupabase } = useBackendConfig()

  if (isSupabase) {
    const { useSupabasePosts } = await import('./useSupabasePosts.js')
    return useSupabasePosts()
  } else {
    const { useApi } = await import('./useApi.js')
    const api = useApi()

    const loading = ref(false)
    const error = ref(null)

    return {
      loading,
      error,

      async createPost(markerId, sessionId, token, role, textContent, audioBlob = null) {
        loading.value = true
        error.value = null
        try {
          // PHP version doesn't need sessionId or role params
          const data = await api.createPost(markerId, token, textContent, audioBlob)
          loading.value = false
          return data
        } catch (err) {
          error.value = err.message
          loading.value = false
          return null
        }
      }
    }
  }
}

// Unified audio URL helper
export function useAudioUrl() {
  const { isSupabase } = useBackendConfig()

  if (isSupabase) {
    return async () => {
      const { useAudioStorage } = await import('./useAudioStorage.js')
      const { getAudioUrl } = useAudioStorage()
      return { getAudioUrl }
    }
  } else {
    return async () => {
      return {
        getAudioUrl(filename) {
          return `/api/audio/${filename}`
        }
      }
    }
  }
}
