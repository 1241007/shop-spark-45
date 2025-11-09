import { createClient } from '@supabase/supabase-js'

// Get these from Supabase → Project Settings → API
const supabaseUrl = "https://spagewdjddxmehzppwuq.supabase.co"
const supabaseAnonKey = "<eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwYWdld2RqZGR4bWVoenBwd3VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MTQ5OTksImV4cCI6MjA3MjQ5MDk5OX0.YuRW-m1XWlQWD6BMJST0eWcRmBTdju141scUi_3JIOk>"

// Export single supabase client for whole app
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
