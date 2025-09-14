import { nanoid } from 'nanoid';
import { defineNuxtPlugin, useCookie } from 'nuxt/app';

export default defineNuxtPlugin(() => {
  const v = useCookie<string>('v_id', { sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 * 2 });
  if (!v.value) v.value = nanoid(16);
});
