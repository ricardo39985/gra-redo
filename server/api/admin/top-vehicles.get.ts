import { defineEventHandler } from 'h3';
import { requireAdmin } from '../../utils/admin-auth';
import { createClient } from '@supabase/supabase-js';

export default defineEventHandler( async (event) => {
  requireAdmin(event);
  const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE!, { auth: { persistSession: false }});

  const { data, error } = await supa
    .rpc('top_vehicle_types', { days: 90 })
    .select(); // optional if RPC returns table

  // If you didn't create the RPC, fallback:
  // const { data, error } = await supa
  //   .from('calc_events')
  //   .select('vehicle_type, cif_usd')
  //   .gte('created_at', new Date(Date.now() - 90*86400000).toISOString());

  if (error) return { ok: false };
  return { ok: true, rows: data };
});
