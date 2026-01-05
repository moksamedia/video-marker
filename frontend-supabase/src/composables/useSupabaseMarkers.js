import { ref } from 'vue'
import { supabase } from './useSupabase'

export function useSupabaseMarkers() {
  const loading = ref(false)
  const error = ref(null)

  async function createMarker(sessionId, token, startTime, endTime = null) {
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('markers')
        .insert({
          session_id: sessionId,
          start_time: startTime,
          end_time: endTime
        })
        .select()
        .single()

      if (err) throw err

      // Add empty posts array for consistency with PHP version
      data.posts = []

      loading.value = false
      return data
    } catch (err) {
      error.value = err.message
      loading.value = false
      return null
    }
  }

  async function deleteMarker(markerId, token) {
    loading.value = true
    error.value = null

    try {
      // First, get all audio paths for this marker
      const { data: posts } = await supabase
        .from('posts')
        .select('audio_path')
        .eq('marker_id', markerId)

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

      // Delete marker (cascades to posts)
      const { error: err } = await supabase
        .from('markers')
        .delete()
        .eq('id', markerId)

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
    loading,
    error,
    createMarker,
    deleteMarker
  }
}
