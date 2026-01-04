import { createRouter, createWebHistory } from 'vue-router'
import CreateSession from './views/CreateSession.vue'
import Session from './views/Session.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: CreateSession
  },
  {
    path: '/session/:id',
    name: 'session',
    component: Session
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
