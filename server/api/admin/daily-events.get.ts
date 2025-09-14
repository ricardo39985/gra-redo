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
    .select('created_at, cif_usd')
    .gte('created_at', since);

  if (error) return { ok: false, rows: [] };

  const rows: { date: string; count: number; sum: number; avg_cif: number }[] = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return { date: d.toISOString().slice(0, 10), count: 0, sum: 0, avg_cif: 0 };
  });

  data?.forEach((r: any) => {
    const d = r.created_at.slice(0, 10);
    const row = rows.find((x) => x.date === d);
    if (row) {
      row.count += 1;
      row.sum += Number(r.cif_usd) || 0;
    }
  });
  rows.forEach((r) => {
    r.avg_cif = r.count ? r.sum / r.count : 0;
    delete (r as any).sum;
  });

  return { ok: true, rows };
});
