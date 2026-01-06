<template>
  <q-page class="q-pa-md">
    <div class="sessions-container">
      <div class="row items-center q-mb-md">
        <div class="col">
          <div class="text-h5">My Sessions</div>
          <div class="text-caption text-grey-7">Manage all your annotation sessions</div>
        </div>
        <q-btn-toggle
          v-model="viewMode"
          toggle-color="primary"
          :options="[
            { icon: 'view_module', value: 'grid' },
            { icon: 'view_list', value: 'list' }
          ]"
          class="q-mr-md"
        />
        <q-btn color="primary" icon="add" label="Create New" to="/" />
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="row justify-center q-pa-xl">
        <q-spinner-dots color="primary" size="50px" />
      </div>

      <!-- Error State -->
      <q-banner v-else-if="error" class="bg-negative text-white" rounded>
        <template v-slot:avatar>
          <q-icon name="error" />
        </template>
        {{ error }}
      </q-banner>

      <!-- Empty State -->
      <q-card v-else-if="sessions.length === 0" class="text-center q-pa-xl">
        <q-icon name="video_library" size="64px" color="grey-5" />
        <div class="text-h6 q-mt-md text-grey-7">No Sessions Yet</div>
        <div class="text-body2 text-grey-6 q-mb-md">
          Create your first annotation session to get started
        </div>
        <q-btn color="primary" icon="add" label="Create Session" to="/" />
      </q-card>

      <!-- Sessions Grid View -->
      <div v-else-if="viewMode === 'grid'" class="row q-col-gutter-md">
        <div
          v-for="session in sessions"
          :key="session.id"
          class="col-12 col-sm-6 col-md-4"
        >
          <q-card>
            <q-img
              :src="session.youtube_thumbnail"
              :ratio="16 / 9"
              class="cursor-pointer"
              @click="goToCreator(session)"
            >
              <div class="absolute-bottom text-subtitle2 text-center">
                {{ session.youtube_title }}
              </div>
            </q-img>

            <q-card-section>
              <div class="row items-center q-gutter-xs q-mb-sm">
                <q-chip dense color="primary" text-color="white" icon="schedule">
                  {{ session.marker_count }} marker(s)
                </q-chip>
                <q-chip dense color="grey-7" text-color="white" icon="calendar_today">
                  {{ formatDate(session.created_at) }}
                </q-chip>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-actions align="center">
              <q-btn
                flat
                color="primary"
                icon="manage_accounts"
                label="Creator"
                @click="goToCreator(session)"
              />
              <q-btn
                flat
                color="secondary"
                icon="help"
                label="Helper"
                @click="goToHelper(session)"
              />
              <q-space />
              <q-btn flat round dense icon="more_vert">
                <q-menu>
                  <q-list style="min-width: 150px">
                    <q-item clickable v-close-popup @click="copyCreatorLink(session)">
                      <q-item-section avatar>
                        <q-icon name="content_copy" color="primary" />
                      </q-item-section>
                      <q-item-section>Copy Creator Link</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="copyHelperLink(session)">
                      <q-item-section avatar>
                        <q-icon name="content_copy" color="secondary" />
                      </q-item-section>
                      <q-item-section>Copy Helper Link</q-item-section>
                    </q-item>
                    <q-separator />
                    <q-item clickable v-close-popup @click="confirmDelete(session)">
                      <q-item-section avatar>
                        <q-icon name="delete" color="negative" />
                      </q-item-section>
                      <q-item-section>Delete Session</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </q-card-actions>
          </q-card>
        </div>
      </div>

      <!-- Sessions List View -->
      <q-list v-else bordered separator class="rounded-borders">
        <q-item
          v-for="session in sessions"
          :key="session.id"
          clickable
          @click="goToCreator(session)"
        >
          <q-item-section avatar>
            <q-img
              :src="session.youtube_thumbnail"
              style="width: 120px; height: 68px"
              class="rounded-borders"
            />
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-weight-medium">
              {{ session.youtube_title }}
            </q-item-label>
            <q-item-label caption>
              <q-icon name="schedule" size="xs" />
              {{ session.marker_count }} marker(s) •
              <q-icon name="calendar_today" size="xs" />
              {{ formatDate(session.created_at) }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <div class="row q-gutter-xs">
              <q-btn
                flat
                dense
                round
                color="primary"
                icon="manage_accounts"
                @click.stop="goToCreator(session)"
              >
                <q-tooltip>Open as Creator</q-tooltip>
              </q-btn>
              <q-btn
                flat
                dense
                round
                color="secondary"
                icon="help"
                @click.stop="goToHelper(session)"
              >
                <q-tooltip>Open as Helper</q-tooltip>
              </q-btn>
              <q-btn
                flat
                dense
                round
                color="negative"
                icon="delete"
                @click.stop="confirmDelete(session)"
              >
                <q-tooltip>Delete Session</q-tooltip>
              </q-btn>
              <q-btn flat dense round icon="more_vert" @click.stop>
                <q-menu>
                  <q-list style="min-width: 150px">
                    <q-item clickable v-close-popup @click="copyCreatorLink(session)">
                      <q-item-section avatar>
                        <q-icon name="content_copy" color="primary" />
                      </q-item-section>
                      <q-item-section>Copy Creator Link</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="copyHelperLink(session)">
                      <q-item-section avatar>
                        <q-icon name="content_copy" color="secondary" />
                      </q-item-section>
                      <q-item-section>Copy Helper Link</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { apiService } from 'src/services/api'

const router = useRouter()
const $q = useQuasar()

const loading = ref(true)
const error = ref(null)
const sessions = ref([])
const viewMode = ref(localStorage.getItem('sessionsViewMode') || 'grid')

// Save view mode preference
watch(viewMode, (newMode) => {
  localStorage.setItem('sessionsViewMode', newMode)
})

onMounted(() => {
  loadSessions()
})

async function loadSessions() {
  loading.value = true
  error.value = null

  try {
    const data = await apiService.listSessions()
    sessions.value = data.sessions || []
  } catch (err) {
    error.value = err.response?.data?.error || err.message || 'Failed to load sessions'
  } finally {
    loading.value = false
  }
}

function goToCreator(session) {
  router.push(`/creator/${session.id}?token=${session.creator_token}`)
}

function goToHelper(session) {
  router.push(`/helper/${session.id}?token=${session.helper_token}`)
}

function copyCreatorLink(session) {
  const url = `${window.location.origin}/#/creator/${session.id}?token=${session.creator_token}`
  navigator.clipboard.writeText(url)
  $q.notify({
    type: 'positive',
    message: 'Creator link copied to clipboard!',
    icon: 'content_copy',
    timeout: 1500,
  })
}

function copyHelperLink(session) {
  const url = `${window.location.origin}/#/helper/${session.id}?token=${session.helper_token}`
  navigator.clipboard.writeText(url)
  $q.notify({
    type: 'positive',
    message: 'Helper link copied to clipboard!',
    icon: 'content_copy',
    timeout: 1500,
  })
}

function confirmDelete(session) {
  $q.dialog({
    title: 'Delete Session',
    message: `Are you sure you want to delete "${session.youtube_title}"? This will delete all markers and posts.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await apiService.deleteSession(session.id, session.creator_token)
      $q.notify({
        type: 'positive',
        message: 'Session deleted successfully',
        icon: 'delete',
      })
      // Reload sessions
      loadSessions()
    } catch (err) {
      $q.notify({
        type: 'negative',
        message: err.response?.data?.error || 'Failed to delete session',
        icon: 'error',
      })
    }
  })
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`

  return date.toLocaleDateString()
}
</script>

<style scoped>
.sessions-container {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
