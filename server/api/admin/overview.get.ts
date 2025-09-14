import { defineEventHandler } from 'h3';
import { requireAdmin } from '../../utils/admin-auth';
import { createClient } from '@supabase/supabase-js';

export default defineEventHandler( async (event) => {
  requireAdmin(event);
  const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE!, { auth: { persistSession: false }});

  const [{ count: total }, { count: d1 }, latest] = await Promise.all([
    supa.from('calc_events').select('*', { count: 'exact', head: true }),
    supa.from('calc_events').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 86400000).toISOString()),
    supa.from('calc_events').select('created_at').order('created_at', { ascending: false }).limit(1),
  ]);

  return {
    ok: true,
    totals: { all: total ?? 0, last24h: d1 ?? 0 },
    latest: latest.data?.[0]?.created_at ?? null,
  };
});
