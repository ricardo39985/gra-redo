import { defineEventHandler } from 'h3';
import { requireAdmin } from '../../utils/admin-auth';
import { createClient } from '@supabase/supabase-js';

export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const supa = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!,
    { auth: { persistSession: false } }
  );

  const since = new Date(Date.now() - 90 * 86400000).toISOString();
  const { data, error } = await supa
    .from('calc_events')
    .select('propulsion')
    .gte('created_at', since);

  if (error) return { ok: false, rows: [] };

  const counts: Record<string, number> = {};
  (data ?? []).forEach((r: any) => {
    const key = r.propulsion || 'unknown';
    counts[key] = (counts[key] ?? 0) + 1;
  });

  const rows = Object.entries(counts).map(([propulsion, count]) => ({ propulsion, count }));

  return { ok: true, rows };
});
