import { createClient } from '@supabase/supabase-js'

// SECURITY: Always use environment variables in production
// These fallback values are for development only
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (import.meta.env.DEV ? "https://spagewdjddxmehzppwuq.supabase.co" : "");
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (import.meta.env.DEV ? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwYWdld2RqZGR4bWVoenBwd3VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MTQ5OTksImV4cCI6MjA3MjQ5MDk5OX0.YuRW-m1XWlQWD6BMJST0eWcRmBTdju141scUi_3JIOk" : "");

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing required Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.");
}

// Export single supabase client for whole app
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
