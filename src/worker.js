import * as data from './routes/data.js';
import * as upload from './routes/upload.js';
import * as img from './routes/img.js';

// Worker hanya dipanggil untuk /api/* dan /img/* (lihat run_worker_first di wrangler.jsonc).
// Semua file lain (halaman, CSS, JS, logo) dilayani langsung sebagai static assets.
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;
    const context = { request, env, ctx, params: {} };

    try {
      if (url.pathname === '/api/data') {
        if (method === 'GET') return await data.onRequestGet(context);
        if (method === 'POST') return await data.onRequestPost(context);
        return notAllowed('GET, POST');
      }
      if (url.pathname === '/api/upload') {
        if (method === 'POST') return await upload.onRequestPost(context);
        return notAllowed('POST');
      }
      if (url.pathname.startsWith('/img/')) {
        if (method !== 'GET' && method !== 'HEAD') return notAllowed('GET');
        context.params.name = decodeURIComponent(url.pathname.slice(5));
        return await img.onRequestGet(context);
      }
    } catch (err) {
      console.error(err);
      return Response.json({ error: 'Terjadi kesalahan di server.' }, { status: 500 });
    }

    return env.ASSETS.fetch(request);
  }
};

function notAllowed(allow) {
  return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: allow } });
}
