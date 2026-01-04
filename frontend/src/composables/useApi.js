const API_BASE = '/api'

export function useApi() {
  const createSession = async (youtubeUrl) => {
    const response = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ youtube_url: youtubeUrl })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create session')
    }

    return response.json()
  }

  const getSession = async (sessionId, token) => {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}?token=${token}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch session')
    }

    return response.json()
  }

  const deleteSession = async (sessionId, token) => {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}?token=${token}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete session')
    }

    return response.json()
  }

  const createMarker = async (sessionId, token, startTime, endTime = null) => {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}/markers?token=${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ start_time: startTime, end_time: endTime })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create marker')
    }

    return response.json()
  }

  const deleteMarker = async (markerId, token) => {
    const response = await fetch(`${API_BASE}/markers/${markerId}?token=${token}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete marker')
    }

    return response.json()
  }

  const createPost = async (markerId, token, textContent, audioBlob = null) => {
    const formData = new FormData()

    if (textContent) {
      formData.append('text_content', textContent)
    }

    if (audioBlob) {
      formData.append('audio', audioBlob, 'recording.mp3')
    }

    const response = await fetch(`${API_BASE}/markers/${markerId}/posts?token=${token}`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create post')
    }

    return response.json()
  }

  return {
    createSession,
    getSession,
    deleteSession,
    createMarker,
    deleteMarker,
    createPost
  }
}
