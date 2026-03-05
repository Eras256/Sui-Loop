import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qzocuuldfqklicaakdhj.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE0Nzk4OCwiZXhwIjoyMDg1NzIzOTg4fQ.d1mfIye20GN3T9YLwa0bcZR4lA3dH0j_6bgc9357k14';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTable() {
    const { data, error } = await supabase.from('suiloop_agents').select('*').limit(1);
    if (error) {
        console.error("Error accessing table:", error);
    } else {
        console.log("Table exists, data:", data);
    }
}
checkTable();
