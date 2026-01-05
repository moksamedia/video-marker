<template>
  <div class="timeline" @click="handleClick" ref="timelineEl">
    <div class="timeline-bar">
      <!-- Current time indicator -->
      <div class="timeline-current-time" :style="getCurrentTimeStyle()"></div>

      <!-- Markers -->
      <div
        v-for="marker in markers"
        :key="marker.id"
        :class="['timeline-marker', marker.end_time ? 'range' : 'point']"
        :style="getMarkerStyle(marker)"
        @click.stop="selectMarker(marker)"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  markers: {
    type: Array,
    default: () => []
  },
  duration: {
    type: Number,
    required: true
  },
  currentTime: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['seek', 'select-marker'])

const timelineEl = ref(null)

const getCurrentTimeStyle = () => {
  if (!props.duration || props.duration === 0) return { left: '0%' }
  const left = (props.currentTime / props.duration) * 100
  return {
    left: `${Math.min(100, Math.max(0, left))}%`
  }
}

const getMarkerStyle = (marker) => {
  if (marker.end_time === null) {
    // Point marker
    const left = (marker.start_time / props.duration) * 100
    return {
      left: `${left}%`
    }
  } else {
    // Range marker
    const left = (marker.start_time / props.duration) * 100
    const width = ((marker.end_time - marker.start_time) / props.duration) * 100
    return {
      left: `${left}%`,
      width: `${width}%`
    }
  }
}

const handleClick = (event) => {
  if (!timelineEl.value) return

  const rect = timelineEl.value.getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  const time = percent * props.duration

  emit('seek', time)
}

const selectMarker = (marker) => {
  emit('select-marker', marker)
}
</script>
