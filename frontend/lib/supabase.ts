import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

let supabase: SupabaseClient

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL and Anon Key must be set in environment variables')
  // Create a dummy client to prevent crashes during build
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key')
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export { supabase }

