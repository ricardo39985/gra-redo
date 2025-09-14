import { defineEventHandler } from 'h3';
import { requireAdmin } from '../../utils/admin-auth';
import { createClient } from '@supabase/supabase-js';

export default defineEventHandler( async (event) => {
  requireAdmin(event);
  const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE!, { auth: { persistSession: false }});
  const { data, error } = await supa
    .from('calc_events')
    .select('created_at, currency, propulsion, vehicle_type, vehicle_year, engine_cc, cif_usd, exchange_rate, total_tax, total_cost')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return { ok: false };
  return { ok: true, rows: data };
});
