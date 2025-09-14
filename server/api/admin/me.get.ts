import { defineEventHandler } from 'h3';
import { requireAdmin } from '../../utils/admin-auth';

export default defineEventHandler((event) => {
  try { requireAdmin(event); return { ok: true }; }
  catch { return { ok: false }; }
});
