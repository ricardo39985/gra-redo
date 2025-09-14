import { z } from 'zod';
import { createHash } from 'node:crypto';
import {
  defineEventHandler,
  readBody,
  getRequestHeader,
  getCookie,
  type H3Event,
} from 'h3';
import { createClient } from '@supabase/supabase-js';

const Body = z.object({
  fuel: z.enum(['Gasoline', 'Diesel', 'Electric']),
  vehicle_type: z.string().min(1),
  vehicleYear: z.number().int().min(1950).max(new Date().getFullYear() + 1),
  plate: z.string().min(1),
  cc: z.number().int().min(0).max(10000).nullable().optional(),
  cif: z.number().min(0),
  exchange_rate: z.number().min(0),
  displayCurrency: z.enum(['GYD', 'USD']).optional(),
  results: z.object({
    totalTax: z.number().min(0),   // GYD
    totalPrice: z.number().min(0), // GYD
  }),
});

function ipHash(e: H3Event) {
  const raw =
    getRequestHeader(e, 'x-forwarded-for') ||
    e.node.req.socket.remoteAddress ||
    '0';
  const salt = process.env.IP_HASH_SALT || 'change-me';
  return createHash('sha256').update(raw + salt).digest('hex').slice(0, 32);
}

export default defineEventHandler(async (event) => {
  const p = Body.parse(await readBody(event));

  // Inline client (prevents circular init issues during dev renderer boot)
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!,
    { auth: { persistSession: false } }
  );

  const visitorId = getCookie(event, 'v_id') || null;
  const ua = getRequestHeader(event, 'user-agent') || null;

  const { error } = await supabase.from('calc_events').insert({
    visitor_id: visitorId,
    ip_hash: ipHash(event),
    user_agent: ua,

    currency: p.displayCurrency ?? 'GYD',
    propulsion: p.fuel.toLowerCase(), // 'gasoline' | 'diesel' | 'electric'
    vehicle_type: p.vehicle_type,
    vehicle_year: p.vehicleYear,
    engine_cc: p.cc ?? null,
    cif_usd: p.cif,
    exchange_rate: p.exchange_rate,

    total_tax: p.results.totalTax,
    total_cost: p.results.totalPrice,
  });

  if (error) {
    console.error('calc_events insert failed:', error);
    return { ok: false };
  }
  return { ok: true };
});
