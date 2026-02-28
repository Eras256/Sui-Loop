import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

export const supabase = (supabaseUrl && supabaseKey)
    ? createClient<Database>(supabaseUrl, supabaseKey)
    : null;

if (!supabase) {
    console.warn('⚠️ Supabase credentials missing. Persistent logging disabled.');
}
