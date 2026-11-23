// Dipakai bersama oleh semua Pages Functions di folder /functions

export const DATA_KEY = 'site';

export function json(body, status = 200, cache = 'no-store') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache }
  });
}

const enc = new TextEncoder();
async function digest(text) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(text)));
}

// Password admin diisi di Cloudflare: Settings > Variables and Secrets > ADMIN_PASSWORD
export async function isAdmin(request, env) {
  const expected = env.ADMIN_PASSWORD || '';
  const given = request.headers.get('x-admin-key') || '';
  if (!expected || !given) return false;
  const [a, b] = await Promise.all([digest(expected), digest(given)]);
  if (crypto.subtle.timingSafeEqual) return crypto.subtle.timingSafeEqual(a, b);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// Jeda kecil tiap password salah, biar tebak-tebakan password jadi lambat
export async function denied() {
  await new Promise((r) => setTimeout(r, 800));
  return json({ error: 'Password admin salah.' }, 401);
}

/* ---------- pembersih data sebelum disimpan ---------- */
const str = (v, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 1e10) : null;
};
const link = (v) => {
  const s = str(v, 600);
  return /^https?:\/\//i.test(s) ? s : '';
};
const image = (v) => {
  const s = str(v, 600);
  if (/^https?:\/\//i.test(s) || /^\/(img|assets)\/[\w./-]+$/.test(s)) return s;
  return '';
};
const list = (v, max, fn) => (Array.isArray(v) ? v.slice(0, max).map(fn).filter(Boolean) : []);
const id = (v) => str(v, 20).replace(/[^\w-]/g, '') || Math.random().toString(36).slice(2, 9);

export function sanitize(d = {}) {
  const p = d.profile || {}, c = d.catalog || {}, f = d.footer || {};
  return {
    profile: {
      name: str(p.name, 80), handle: str(p.handle, 40).replace(/^@/, ''),
      tagline: str(p.tagline, 300), badge: str(p.badge, 60), avatar: image(p.avatar)
    },
    links: list(d.links, 20, (l) => ({
      id: id(l.id), type: l.type === 'member' ? 'member' : 'free',
      title: str(l.title, 80), desc: str(l.desc, 160), url: link(l.url)
    })),
    catalog: { label: str(c.label, 30), headline: str(c.headline, 140), copy: str(c.copy, 400) },
    products: list(d.products, 30, (x) => ({
      id: id(x.id), title: str(x.title, 100), label: str(x.label, 30), thumb: image(x.thumb),
      desc: str(x.desc, 500),
      modules: list(x.modules, 10, (m) => str(m, 140)),
      priceOld: num(x.priceOld), pricePromo: num(x.pricePromo),
      cta: str(x.cta, 40), url: link(x.url)
    })),
    videos: list(d.videos, 60, (v) => ({ id: id(v.id), youtube: /^[\w-]{11}$/.test(str(v.youtube)) ? str(v.youtube) : link(v.youtube), title: str(v.title, 100) })),
    testimonials: list(d.testimonials, 60, (t) => ({
      id: id(t.id), name: str(t.name, 60), age: num(t.age), job: str(t.job, 60),
      photo: image(t.photo), text: str(t.text, 600)
    })),
    benefits: list(d.benefits, 12, (b) => ({ id: id(b.id), title: str(b.title, 60), desc: str(b.desc, 160) })),
    faqs: list(d.faqs, 30, (q) => ({ id: id(q.id), q: str(q.q, 160), a: str(q.a, 800) })),
    footer: {
      instagram: str(f.instagram, 40).replace(/^@/, ''),
      whatsapp: str(f.whatsapp, 20).replace(/[^\d+]/g, ''),
      note: str(f.note, 120)
    }
  };
}
