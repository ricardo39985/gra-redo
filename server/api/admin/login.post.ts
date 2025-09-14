import { defineEventHandler, readBody } from 'h3';
import { verifyPassword, setAdminSession } from './../../utils/admin-auth';

export default defineEventHandler(async (event) => {
    const { password } = await readBody<{ password: string }>(event);
    if (!password) return { ok: false };

    const ok = await verifyPassword(password);
    if (!ok) return { ok: false };

    setAdminSession(event, 7);
    return { ok: true };
});
