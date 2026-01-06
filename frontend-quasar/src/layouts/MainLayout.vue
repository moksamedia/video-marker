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

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
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

        <q-separator spaced />

        <q-item-label header>About</q-item-label>

        <q-item>
          <q-item-section>
            <q-item-label caption class="text-weight-medium">
              Language Learning Video Annotation
            </q-item-label>
            <q-item-label caption class="q-mt-sm">
              Mark moments in YouTube videos you don't understand and share with a native speaker
              for clarification.
            </q-item-label>
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
import { ref } from 'vue'

const leftDrawerOpen = ref(false)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>
