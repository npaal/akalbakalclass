import { json, isAdmin, denied } from '../../lib/shared.js';

const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX = 2 * 1024 * 1024; // 2 MB setelah dikecilkan di browser

// POST /api/upload  { dataUrl: "data:image/webp;base64,..." } -> { url: "/img/xxxx.webp" }
export async function onRequestPost({ request, env }) {
  if (!(await isAdmin(request, env))) return denied();
  if (!env.DATA) return json({ error: 'KV belum di-binding dengan nama DATA.' }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Format tidak valid.' }, 400); }
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(body?.dataUrl || '');
  if (!m) return json({ error: 'File harus gambar JPG, PNG, atau WebP.' }, 400);

  const bin = atob(m[2]);
  if (bin.length > MAX) return json({ error: 'Gambar terlalu besar (maks 2 MB).' }, 413);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

  const name = `${Date.now().toString(36)}${crypto.randomUUID().slice(0, 8)}.${TYPES[m[1]]}`;
  await env.DATA.put(`img/${name}`, bytes, { metadata: { type: m[1] } });
  return json({ url: `/img/${name}` });
}
