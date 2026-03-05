import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qzocuuldfqklicaakdhj.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6b2N1dWxkZnFrbGljYWFrZGhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNDc5ODgsImV4cCI6MjA4NTcyMzk4OH0.X_WzBp8-QLi6Ozwy6SoYY894D4Wf14mx0JiErAgNIB4";

// Ensure we only create the client if we have the keys
// (This prevents build errors if they are missing, though it won't work at runtime)
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient<Database>(supabaseUrl, supabaseAnonKey)
    : null;
