import { ref } from 'vue'
import { supabase } from './useSupabase'
import { useAudioStorage } from './useAudioStorage'

export function useSupabasePosts() {
  const loading = ref(false)
  const error = ref(null)
  const { uploadAudio } = useAudioStorage()

  async function createPost(markerId, sessionId, token, role, textContent, audioBlob = null) {
    loading.value = true
    error.value = null

    try {
      let audioPath = null

      // Upload audio if provided
      if (audioBlob) {
        audioPath = await uploadAudio(sessionId, markerId, audioBlob)
      }

      // Validate that we have at least text or audio
      if (!textContent && !audioPath) {
        throw new Error('Either text or audio is required')
      }

      // Insert post
      const { data, error: err } = await supabase
        .from('posts')
        .insert({
          marker_id: markerId,
          author_type: role,
          text_content: textContent || null,
          audio_path: audioPath
        })
        .select()
        .single()

      if (err) throw err

      // Rename audio_path to audio_filename for frontend compatibility
      data.audio_filename = data.audio_path
      delete data.audio_path

      loading.value = false
      return data
    } catch (err) {
      error.value = err.message
      loading.value = false
      return null
    }
  }

  return {
    loading,
    error,
    createPost
  }
}
