<template>
  <div class="marker-timeline">
    <q-card>
      <div>
        <div class="timeline-container" ref="timelineRef" @click="handleTimelineClick">
          <!-- Current time indicator -->
          <div class="current-time-indicator" :style="{ left: currentTimePercent + '%' }"></div>

          <!-- Point markers -->
          <div
            v-for="marker in pointMarkers"
            :key="marker.id"
            class="timeline-marker point-marker"
            :style="{ left: getMarkerPosition(marker.start_time) + '%' }"
            @click.stop="$emit('markerClick', marker)"
          >
            <q-tooltip>{{ formatTime(marker.start_time) }}</q-tooltip>
          </div>

          <!-- Range markers -->
          <div
            v-for="marker in rangeMarkers"
            :key="marker.id"
            class="timeline-marker range-marker"
            :style="{
              left: getMarkerPosition(marker.start_time) + '%',
              width: getRangeWidth(marker.start_time, marker.end_time) + '%',
            }"
            @click.stop="$emit('markerClick', marker)"
          >
            <q-tooltip>
              {{ formatTime(marker.start_time) }} - {{ formatTime(marker.end_time) }}
            </q-tooltip>
          </div>
        </div>

        <!--
        <div class="row justify-between q-mt-sm text-caption text-grey-7">
          <div>0:00</div>
          <div>{{ formatTime(duration) }}</div>
        </div>
        -->
      </div>
    </q-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  markers: {
    type: Array,
    default: () => [],
  },
  currentTime: {
    type: Number,
    default: 0,
  },
  duration: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['markerClick', 'seek'])

const timelineRef = ref(null)

const pointMarkers = computed(() => {
  return props.markers.filter((m) => m.end_time === null)
})

const rangeMarkers = computed(() => {
  return props.markers.filter((m) => m.end_time !== null)
})

const currentTimePercent = computed(() => {
  if (!props.duration) return 0
  return (props.currentTime / props.duration) * 100
})

function getMarkerPosition(time) {
  if (!props.duration) return 0
  return (time / props.duration) * 100
}

function getRangeWidth(startTime, endTime) {
  if (!props.duration) return 0
  return ((endTime - startTime) / props.duration) * 100
}

function handleTimelineClick(event) {
  if (!timelineRef.value || !props.duration) return

  const rect = timelineRef.value.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const percent = clickX / rect.width
  const time = percent * props.duration

  emit('seek', time)
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.timeline-container {
  position: relative;
  height: 40px;
  background: linear-gradient(to right, var(--q-primary) 0%, var(--q-secondary) 100%);
  border-radius: 4px;
  cursor: pointer;
  overflow: hidden;
}

.current-time-indicator {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: black;
  z-index: 10;
  pointer-events: none;
}

.timeline-marker {
  position: absolute;
  top: 0;
  bottom: 0;
  cursor: pointer;
  transition: opacity 0.2s;
}

.timeline-marker:hover {
  opacity: 0.8;
}

.point-marker {
  width: 4px;
  background: #ff6b6b;
  border-radius: 2px;
}

.range-marker {
  background: rgba(255, 193, 7, 0.6);
  border: 2px solid #ffc107;
  border-radius: 4px;
}
</style>
