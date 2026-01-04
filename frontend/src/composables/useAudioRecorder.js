import { ref } from 'vue'
import lamejs from 'lamejs'

export function useAudioRecorder() {
  const isRecording = ref(false)
  const recordingTime = ref(0)
  const audioBlob = ref(null)

  let mediaRecorder = null
  let audioChunks = []
  let recordingInterval = null
  let audioContext = null
  let mediaStream = null

  const startRecording = async () => {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Use webm if available, otherwise default
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/wav'

      mediaRecorder = new MediaRecorder(mediaStream, { mimeType })
      audioChunks = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: mimeType })
        await convertToMp3(audioBlob)

        // Stop all tracks
        if (mediaStream) {
          mediaStream.getTracks().forEach(track => track.stop())
        }
      }

      mediaRecorder.start()
      isRecording.value = true
      recordingTime.value = 0

      // Update timer every second
      recordingInterval = setInterval(() => {
        recordingTime.value++

        // Auto-stop at 5 minutes (300 seconds)
        if (recordingTime.value >= 300) {
          stopRecording()
        }
      }, 1000)
    } catch (error) {
      console.error('Failed to start recording:', error)
      throw new Error('Failed to access microphone')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording.value) {
      mediaRecorder.stop()
      isRecording.value = false

      if (recordingInterval) {
        clearInterval(recordingInterval)
        recordingInterval = null
      }
    }
  }

  const convertToMp3 = async (webmBlob) => {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()

      const arrayBuffer = await webmBlob.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      // Get audio data
      const channels = audioBuffer.numberOfChannels
      const sampleRate = audioBuffer.sampleRate
      const samples = audioBuffer.getChannelData(0) // Use first channel

      // Convert to 16-bit PCM
      const pcmData = new Int16Array(samples.length)
      for (let i = 0; i < samples.length; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]))
        pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
      }

      // Encode to MP3
      const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, 128)
      const mp3Data = []
      const sampleBlockSize = 1152

      for (let i = 0; i < pcmData.length; i += sampleBlockSize) {
        const sampleChunk = pcmData.subarray(i, i + sampleBlockSize)
        const mp3buf = mp3encoder.encodeBuffer(sampleChunk)
        if (mp3buf.length > 0) {
          mp3Data.push(mp3buf)
        }
      }

      const mp3buf = mp3encoder.flush()
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf)
      }

      audioBlob.value = new Blob(mp3Data, { type: 'audio/mp3' })
    } catch (error) {
      console.error('Failed to convert to MP3:', error)
      // Fallback: use original blob
      audioBlob.value = webmBlob
    }
  }

  const clearRecording = () => {
    audioBlob.value = null
    recordingTime.value = 0
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return {
    isRecording,
    recordingTime,
    audioBlob,
    startRecording,
    stopRecording,
    clearRecording,
    formatTime
  }
}
