import { api } from 'boot/axios'

/**
 * API Service for Video Markup App
 * Handles all communication with the PHP backend
 */

export const apiService = {
  // ==================== Sessions ====================

  /**
   * List all sessions
   * @returns {Promise} Array of all sessions
   */
  async listSessions() {
    const response = await api.get('/sessions')
    return response.data
  },

  /**
   * Create a new session with a YouTube URL
   * @param {string} youtubeUrl - The YouTube video URL
   * @param {string} sessionName - The session name (original text, may include Tibetan)
   * @param {string} slug - The URL-safe slug (Wylie-converted, optional)
   * @returns {Promise} Session data with creator_token and helper_token
   */
  async createSession(youtubeUrl, sessionName, slug) {
    const response = await api.post('/sessions', {
      youtube_url: youtubeUrl,
      session_name: sessionName,
      slug: slug
    })
    return response.data
  },

  /**
   * Get session data with markers and posts
   * @param {string} sessionId - The session ID
   * @param {string} token - Creator or helper token
   * @returns {Promise} Complete session data with role
   */
  async getSession(sessionId, token) {
    const response = await api.get(`/sessions/${sessionId}`, {
      params: { token },
    })
    return response.data
  },

  /**
   * Delete a session (creator only)
   * @param {string} sessionId - The session ID
   * @param {string} token - Creator token
   * @returns {Promise}
   */
  async deleteSession(sessionId, token) {
    const response = await api.delete(`/sessions/${sessionId}`, {
      params: { token },
    })
    return response.data
  },

  // ==================== Markers ====================

  /**
   * Create a marker (point or range)
   * @param {string} sessionId - The session ID
   * @param {string} token - Creator token
   * @param {number} startTime - Start timestamp in seconds
   * @param {number|null} endTime - End timestamp for range markers (null for point markers)
   * @returns {Promise} Created marker data
   */
  async createMarker(sessionId, token, startTime, endTime = null) {
    const response = await api.post(
      `/sessions/${sessionId}/markers`,
      {
        start_time: startTime,
        end_time: endTime,
      },
      {
        params: { token },
      }
    )
    return response.data
  },

  /**
   * Update a marker's times (creator only)
   * @param {number} markerId - The marker ID
   * @param {string} token - Creator token
   * @param {number} startTime - New start time
   * @param {number|null} endTime - New end time (optional)
   * @returns {Promise} Updated marker data
   */
  async updateMarker(markerId, token, startTime, endTime = null) {
    const response = await api.put(`/markers/${markerId}`, {
      start_time: startTime,
      end_time: endTime
    }, {
      params: { token },
    })
    return response.data
  },

  /**
   * Delete a marker (creator only)
   * @param {number} markerId - The marker ID
   * @param {string} token - Creator token
   * @returns {Promise}
   */
  async deleteMarker(markerId, token) {
    const response = await api.delete(`/markers/${markerId}`, {
      params: { token },
    })
    return response.data
  },

  // ==================== Posts ====================

  /**
   * Create a post on a marker
   * @param {number} markerId - The marker ID
   * @param {string} token - Creator or helper token
   * @param {string|null} textContent - Text content (optional)
   * @param {Blob|null} audioBlob - Audio file blob (optional)
   * @returns {Promise} Created post data
   */
  async createPost(markerId, token, textContent = null, audioBlob = null) {
    const formData = new FormData()

    if (textContent) {
      formData.append('text_content', textContent)
    }

    if (audioBlob) {
      formData.append('audio', audioBlob, 'recording.mp3')
    }

    const response = await api.post(`/markers/${markerId}/posts`, formData, {
      params: { token },
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  /**
   * Update a post
   * @param {number} postId - The post ID
   * @param {string} token - Creator or helper token
   * @param {string} textContent - Updated text content
   * @returns {Promise}
   */
  async updatePost(postId, token, textContent) {
    const response = await api.put(`/posts/${postId}`,
      { text_content: textContent },
      { params: { token } }
    )
    return response.data
  },

  /**
   * Delete a post
   * @param {number} postId - The post ID
   * @param {string} token - Creator or helper token
   * @returns {Promise}
   */
  async deletePost(postId, token) {
    const response = await api.delete(`/posts/${postId}`, {
      params: { token },
    })
    return response.data
  },

  // ==================== Audio ====================

  /**
   * Get audio file URL
   * @param {string} filename - The audio filename
   * @returns {string} Full URL to the audio file
   */
  getAudioUrl(filename) {
    return `http://localhost:8000/api/audio/${filename}`
  },
}
