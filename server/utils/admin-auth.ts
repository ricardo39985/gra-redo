import { createHmac } from 'node:crypto';
import { getCookie, setCookie, deleteCookie, createError, type H3Event } from 'h3';
import { compare } from 'bcryptjs';

const COOKIE_NAME = 'admin_auth';

export async function verifyPassword(plain: string) {
    const hash = process.env.ADMIN_PASSWORD_BCRYPT;
    if (!hash) throw new Error('ADMIN_PASSWORD_BCRYPT not set');
    return compare(plain, hash);
}

function sign(payload: object) {
    const secret = process.env.ADMIN_SESSION_SECRET!;
    const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = createHmac('sha256', secret).update(data).digest('base64url');
    return `${data}.${sig}`;
}

function unsign(token: string) {
    const secret = process.env.ADMIN_SESSION_SECRET!;
    const [data, sig] = token.split('.');
    if (!data || !sig) return null;
    const expSig = createHmac('sha256', secret).update(data).digest('base64url');
    if (sig !== expSig) return null;
    try {
        const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
        if (payload.exp && Date.now() / 1000 > payload.exp) return null;
        return payload;
    } catch { return null; }
}

export function setAdminSession(event: H3Event, days = 7) {
    const now = Math.floor(Date.now() / 1000);
    const token = sign({ sub: 'admin', iat: now, exp: now + days * 86400 });
    setCookie(event, COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: days * 86400,
    });
}

export function clearAdminSession(event: H3Event) {
    deleteCookie(event, COOKIE_NAME, { path: '/' });
}

export function requireAdmin(event: H3Event) {
    const token = getCookie(event, COOKIE_NAME);
    const payload = token ? unsign(token) : null;
    if (!payload || payload.sub !== 'admin') {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }
}
