import { ref } from 'vue'
import { supabase } from './useSupabase'

export function useSupabaseSession() {
  const session = ref(null)
  const role = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function createSession(youtubeUrl, youtubeTitle, youtubeThumbnail) {
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('sessions')
        .insert({
          youtube_url: youtubeUrl,
          youtube_title: youtubeTitle,
          youtube_thumbnail: youtubeThumbnail
        })
        .select('id, creator_token, helper_token, youtube_title, youtube_thumbnail')
        .single()

      if (err) throw err

      loading.value = false
      return data
    } catch (err) {
      error.value = err.message
      loading.value = false
      return null
    }
  }

  async function loadSession(sessionId, token) {
    loading.value = true
    error.value = null

    try {
      // Call the database function to get session with role
      const { data, error: err } = await supabase
        .rpc('get_session_with_role', {
          p_session_id: sessionId,
          p_token: token
        })

      if (err) throw err
      if (!data) {
        error.value = 'Session not found or invalid token'
        loading.value = false
        return false
      }

      session.value = data
      role.value = data.role
      loading.value = false
      return true
    } catch (err) {
      error.value = err.message
      loading.value = false
      return false
    }
  }

  async function deleteSession(sessionId, token) {
    loading.value = true
    error.value = null

    try {
      // First, get all audio paths for cleanup
      const { data: posts } = await supabase
        .from('posts')
        .select('audio_path')
        .in('marker_id',
          supabase
            .from('markers')
            .select('id')
            .eq('session_id', sessionId)
        )

      // Delete audio files from storage
      if (posts && posts.length > 0) {
        const audioPaths = posts
          .map(p => p.audio_path)
          .filter(path => path !== null)

        if (audioPaths.length > 0) {
          await supabase.storage
            .from('audio')
            .remove(audioPaths)
        }
      }

      // Delete session (cascades to markers and posts)
      const { error: err } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId)
        .eq('creator_token', token)

      if (err) throw err

      loading.value = false
      return true
    } catch (err) {
      error.value = err.message
      loading.value = false
      return false
    }
  }

  return {
    session,
    role,
    loading,
    error,
    createSession,
    loadSession,
    deleteSession
  }
}
