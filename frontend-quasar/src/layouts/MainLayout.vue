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
          <router-link to="/" class="text-white" style="text-decoration: none">
            Video Markup
          </router-link>
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

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered :width="isCreatorSession ? 320 : 256">
      <!-- Show Markers when in Creator Session -->
      <q-scroll-area v-if="isCreatorSession" class="fit">
        <div class="q-pa-md">
          <div class="text-h6 q-mb-sm">Markers</div>

          <!-- Navigation Links (Mini) -->
          <div class="q-mb-md">
            <q-btn flat dense size="sm" icon="home" label="Home" to="/" class="q-mr-xs" />
            <q-btn flat dense size="sm" icon="video_library" label="Sessions" to="/sessions" />
          </div>

          <q-separator class="q-mb-md" />

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
              active-class="bg-primary text-white"
              @click="selectMarker(marker)"
            >
              <q-item-section avatar>
                <q-avatar
                  :color="marker.end_time ? 'orange' : 'blue'"
                  text-color="white"
                  :icon="marker.end_time ? 'timelapse' : 'bookmark'"
                />
              </q-item-section>

              <q-item-section>
                <q-item-label>{{ formatTime(marker.start_time) }}</q-item-label>
                <q-item-label v-if="marker.end_time" caption>
                  to {{ formatTime(marker.end_time) }}
                </q-item-label>
                <q-item-label caption class="q-mt-xs">
                  {{ marker.posts?.length || 0 }} message(s)
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-icon name="chevron_right" />
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-scroll-area>

      <!-- Show Navigation when NOT in Creator Session -->
      <q-list v-else>
        <q-item-label header>Navigation</q-item-label>

        <q-item clickable to="/" exact>
          <q-item-section avatar>
            <q-icon name="add_circle" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Create Session</q-item-label>
            <q-item-label caption>Start a new annotation session</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable to="/sessions">
          <q-item-section avatar>
            <q-icon name="video_library" />
          </q-item-section>
          <q-item-section>
            <q-item-label>My Sessions</q-item-label>
            <q-item-label caption>View all annotation sessions</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { storeToRefs } from 'pinia'
import { useSessionStore } from 'src/stores/session-store'

const route = useRoute()
const $q = useQuasar()
const sessionStore = useSessionStore()
const { markers, selectedMarker } = storeToRefs(sessionStore)

const leftDrawerOpen = ref(false)

const isCreatorSession = computed(() => {
  return route.name === 'creator'
})

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function selectMarker(marker) {
  console.log('Selecting marker')
  sessionStore.setSelectedMarker(marker)
  console.log('Screen width:', $q.screen.width)
  if ($q.screen.lt.md) {
    leftDrawerOpen.value = false
    console.log('Closing drawer')
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>
