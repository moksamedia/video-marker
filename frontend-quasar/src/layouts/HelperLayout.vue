<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
          class="q-mr-sm"
        />

        <q-toolbar-title>
          Video Markup - Helper View
        </q-toolbar-title>

        <q-btn
          flat
          round
          dense
          :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
          @click="$q.dark.toggle()"
        >
          <q-tooltip>Toggle {{ $q.dark.isActive ? 'Light' : 'Dark' }} Mode</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered :width="320">
      <q-scroll-area class="fit">
        <div class="q-pa-md">
          <div class="text-h6 q-mb-md">Markers</div>

          <!-- Empty State -->
          <div v-if="markers.length === 0" class="text-center text-grey-6 q-pa-md">
            <q-icon name="bookmark_border" size="48px" />
            <div class="q-mt-sm">No markers yet</div>
          </div>

          <!-- Markers List -->
          <q-list v-else separator>
            <q-item
              v-for="marker in markers"
              :key="marker.id"
              clickable
              :active="selectedMarker?.id === marker.id"
              active-class="bg-secondary text-white"
              @click="selectMarker(marker)"
            >
              <q-item-section avatar>
                <q-avatar :color="marker.end_time ? 'orange' : 'blue'" text-color="white" :icon="marker.end_time ? 'timelapse' : 'bookmark'" />
              </q-item-section>

              <q-item-section>
                <q-item-label>{{ formatTime(marker.start_time) }}</q-item-label>
                <q-item-label v-if="marker.end_time" caption>
                  to {{ formatTime(marker.end_time) }}
                </q-item-label>
                <q-item-label caption class="q-mt-xs">
                  {{ marker.posts?.length || 0 }} post(s)
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-icon name="chevron_right" />
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSessionStore } from 'src/stores/session-store'

const sessionStore = useSessionStore()
const { markers, selectedMarker } = storeToRefs(sessionStore)

const leftDrawerOpen = ref(true)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function selectMarker(marker) {
  sessionStore.setSelectedMarker(marker)
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>
