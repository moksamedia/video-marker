import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Create base Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Create Supabase client with custom token in headers for RLS
export function getSupabaseClient(token) {
  if (!token) return supabase

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        'x-session-token': token
      }
    },
    db: {
      schema: 'public'
    },
    auth: {
      persistSession: false
    }
  })
}

// Helper to set JWT claims for RLS policies
export function setSessionToken(token) {
  if (!token) return

  // Store token for use in RLS policies
  localStorage.setItem('session_token', token)
}

export function getSessionToken() {
  return localStorage.getItem('session_token')
}

export function clearSessionToken() {
  localStorage.removeItem('session_token')
}
