<template>
  <div class="marker-list">
    <q-card>
      <q-card-section>
        <div class="text-subtitle2">
          <q-icon name="list" /> Markers ({{ markers.length }})
        </div>
      </q-card-section>

      <q-separator />

      <q-scroll-area style="height: 400px">
        <q-list v-if="markers.length > 0" separator>
          <q-item
            v-for="marker in sortedMarkers"
            :key="marker.id"
            clickable
            @click="$emit('markerClick', marker)"
            :active="selectedMarkerId === marker.id"
          >
            <q-item-section avatar>
              <q-avatar
                :color="marker.end_time ? 'secondary' : 'primary'"
                text-color="white"
                :icon="marker.end_time ? 'schedule' : 'place'"
              />
            </q-item-section>

            <q-item-section>
              <q-item-label>
                {{ formatTime(marker.start_time) }}
                <span v-if="marker.end_time">
                  - {{ formatTime(marker.end_time) }}
                </span>
              </q-item-label>
              <q-item-label caption>
                {{ marker.end_time ? 'Range Marker' : 'Point Marker' }}
                • {{ marker.posts?.length || 0 }} post(s)
              </q-item-label>
            </q-item-section>

            <q-item-section side v-if="isCreator">
              <q-btn
                flat
                round
                dense
                color="negative"
                icon="delete"
                @click.stop="confirmDelete(marker)"
              >
                <q-tooltip>Delete marker</q-tooltip>
              </q-btn>
            </q-item-section>
          </q-item>
        </q-list>

        <q-card-section v-else class="text-center text-grey-7">
          <q-icon name="info" size="48px" class="q-mb-sm" />
          <div class="text-body2">No markers yet</div>
          <div class="text-caption" v-if="isCreator">
            Click "Mark Current Time" to create your first marker
          </div>
        </q-card-section>
      </q-scroll-area>
    </q-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'

const props = defineProps({
  markers: {
    type: Array,
    default: () => [],
  },
  selectedMarkerId: {
    type: Number,
    default: null,
  },
  isCreator: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['markerClick', 'deleteMarker'])

const $q = useQuasar()

const sortedMarkers = computed(() => {
  return [...props.markers].sort((a, b) => a.start_time - b.start_time)
})

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function confirmDelete(marker) {
  $q.dialog({
    title: 'Delete Marker',
    message: 'Are you sure you want to delete this marker? This will also delete all posts in this thread.',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    emit('deleteMarker', marker.id)
  })
}
</script>

<style scoped>
.marker-list {
  height: 100%;
}
</style>
