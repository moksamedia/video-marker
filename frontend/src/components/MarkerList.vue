<template>
  <div class="markers-panel">
    <h3>Markers ({{ markers.length }})</h3>

    <div v-if="markers.length === 0" style="color: #6c757d; text-align: center; padding: 20px;">
      No markers yet. {{ role === 'creator' ? 'Create one using the buttons above.' : '' }}
    </div>

    <div
      v-for="marker in sortedMarkers"
      :key="marker.id"
      :class="['marker-item', { active: selectedMarker?.id === marker.id }]"
      @click="selectMarker(marker)"
    >
      <div class="marker-time">
        {{ formatTime(marker.start_time) }}
        <span v-if="marker.end_time" class="marker-type">
          - {{ formatTime(marker.end_time) }} (Range)
        </span>
        <span v-else class="marker-type">(Point)</span>
      </div>

      <div class="marker-actions" v-if="role === 'creator'">
        <button @click.stop="deleteMarker(marker.id)" class="btn-danger">
          Delete
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  markers: {
    type: Array,
    default: () => []
  },
  selectedMarker: {
    type: Object,
    default: null
  },
  role: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['select-marker', 'delete-marker'])

const sortedMarkers = computed(() => {
  return [...props.markers].sort((a, b) => a.start_time - b.start_time)
})

const selectMarker = (marker) => {
  emit('select-marker', marker)
}

const deleteMarker = (markerId) => {
  if (confirm('Are you sure you want to delete this marker and all its posts?')) {
    emit('delete-marker', markerId)
  }
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>
