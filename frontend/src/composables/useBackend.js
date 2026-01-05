// Backend adapter - switches between PHP and Supabase based on config

const backendType = import.meta.env.VITE_BACKEND || 'php'

export function useBackend() {
  const isSupabase = backendType === 'supabase'
  const isPhp = backendType === 'php'

  return {
    isSupabase,
    isPhp,
    backendType
  }
}

// Session operations
export function useSession() {
  const { isSupabase } = useBackend()

  if (isSupabase) {
    const { useSupabaseSession } = await import('./useSupabaseSession')
    return useSupabaseSession()
  } else {
    const { useApi } = await import('./useApi')
    const api = useApi()

    // Adapter to match Supabase interface
    return {
      session: ref(null),
      role: ref(null),
      loading: ref(false),
      error: ref(null),

      async createSession(youtubeUrl, youtubeTitle, youtubeThumbnail) {
        // PHP version fetches oEmbed in the view, not here
        // Return format matches Supabase
        return await api.createSession(youtubeUrl)
      },

      async loadSession(sessionId, token) {
        const data = await api.getSession(sessionId, token)
        this.session.value = data
        this.role.value = data.role
        return !!data
      },

      async deleteSession(sessionId, token) {
        return await api.deleteSession(sessionId, token)
      }
    }
  }
}

// Marker operations
export function useMarkers() {
  const { isSupabase } = useBackend()

  if (isSupabase) {
    const { useSupabaseMarkers } = await import('./useSupabaseMarkers')
    return useSupabaseMarkers()
  } else {
    const { useApi } = await import('./useApi')
    const api = useApi()

    return {
      loading: ref(false),
      error: ref(null),
      createMarker: api.createMarker,
      deleteMarker: api.deleteMarker
    }
  }
}

// Post operations
export function usePosts() {
  const { isSupabase } = useBackend()

  if (isSupabase) {
    const { useSupabasePosts } = await import('./useSupabasePosts')
    return useSupabasePosts()
  } else {
    const { useApi } = await import('./useApi')
    const api = useApi()

    return {
      loading: ref(false),
      error: ref(null),
      createPost: api.createPost
    }
  }
}

// Audio storage
export function useAudio() {
  const { isSupabase } = useBackend()

  if (isSupabase) {
    const { useAudioStorage } = await import('./useAudioStorage')
    return useAudioStorage()
  } else {
    // PHP version: audio URLs are relative paths
    return {
      getAudioUrl(filename) {
        return `/api/audio/${filename}`
      }
    }
  }
}
