import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'

// API instance configured for the PHP backend
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export default defineBoot(({ app }) => {
  // for use inside Vue files (Composition API) through import
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api, axios }
