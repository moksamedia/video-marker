import { supabase } from './useSupabase'

export function useAudioStorage() {
  async function uploadAudio(sessionId, markerId, audioBlob) {
    // Create unique filename
    const timestamp = Date.now()
    const filename = `${sessionId}/${markerId}/${timestamp}.mp3`

    const { data, error } = await supabase.storage
      .from('audio')
      .upload(filename, audioBlob, {
        contentType: 'audio/mpeg',
        upsert: false
      })

    if (error) throw error

    return filename
  }

  async function deleteAudio(path) {
    const { error } = await supabase.storage
      .from('audio')
      .remove([path])

    if (error) throw error
  }

  function getAudioUrl(path) {
    const { data } = supabase.storage
      .from('audio')
      .getPublicUrl(path)

    return data.publicUrl
  }

  return {
    uploadAudio,
    deleteAudio,
    getAudioUrl
  }
}
