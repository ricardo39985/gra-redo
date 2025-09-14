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

  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data, error } = await supa
    .from('calc_events')
    .select('cif_usd')
    .gte('created_at', since);

  if (error) return { ok: false, buckets: [] };

  const values = (data ?? [])
    .map((r: any) => Number(r.cif_usd))
    .filter((n) => !isNaN(n));

  if (!values.length) return { ok: true, buckets: [] };

  const min = Math.min(...values);
  const max = Math.max(...values);
  const size = (max - min) / 12 || 1;
  const buckets = Array.from({ length: 12 }, (_, i) => ({
    min: min + size * i,
    max: min + size * (i + 1),
    count: 0,
  }));

  values.forEach((v) => {
    const idx = Math.min(Math.floor((v - min) / size), 11);
    buckets[idx].count += 1;
  });

  return { ok: true, buckets };
});
