import { DATA_KEY, json, isAdmin, denied, sanitize } from '../shared.js';

// GET /api/data        -> data halaman (dari KV, kalau kosong pakai /data/site.json)
// GET /api/data?fresh  -> sama, tanpa cache (dipakai admin)
export async function onRequestGet({ request, env }) {
  const fresh = new URL(request.url).searchParams.has('fresh');
  let data = null;
  if (env.DATA) {
    data = await env.DATA.get(DATA_KEY, fresh ? { type: 'json' } : { type: 'json', cacheTtl: 60 });
  }
  if (!data) {
    const res = await env.ASSETS.fetch(new URL('/data/site.json', request.url));
    data = await res.json();
  }
  return json(data);
}

// POST /api/data?check -> cek password
// POST /api/data       -> simpan data (butuh header x-admin-key)
export async function onRequestPost({ request, env }) {
  if (!(await isAdmin(request, env))) return denied();

  if (new URL(request.url).searchParams.has('check')) {
    return json({ ok: true, storage: Boolean(env.DATA) });
  }
  if (!env.DATA) return json({ error: 'KV belum di-binding dengan nama DATA.' }, 500);

  const text = await request.text();
  if (text.length > 400000) return json({ error: 'Data terlalu besar.' }, 413);
  let body;
  try { body = JSON.parse(text); } catch { return json({ error: 'Format data tidak valid.' }, 400); }

  const clean = sanitize(body);
  await env.DATA.put(DATA_KEY, JSON.stringify(clean));
  return json({ ok: true, data: clean, savedAt: new Date().toISOString() });
}
