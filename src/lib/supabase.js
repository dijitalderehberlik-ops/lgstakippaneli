import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rlxmehpkvzkzoxgzzfqt.supabase.co'
const supabaseKey = 'sb_publishable_c7ENjtwbnRQBJQs0dcfT1Q_fgEWI8My'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJseG1laHBrdnprem94Z3p6ZnF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY2Nzc0MSwiZXhwIjoyMDg3MjQzNzQxfQ.aVxXZ99xFnSwig7G3f7DVOi5-iX0ywfusFgj84pFJqE'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storageKey: 'lgs-app',
    autoRefreshToken: true,
    persistSession: true,
  }
})

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    storageKey: 'lgs-admin-do-not-use',
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  }
})