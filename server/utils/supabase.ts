import { createClient } from '@supabase/supabase-js';

export const supabaseServer = createClient(
  process.env.SUPABASE_URL!,          // from your env
  process.env.SUPABASE_SERVICE_ROLE!, // server-only key; bypasses RLS
  { auth: { persistSession: false } }
);
