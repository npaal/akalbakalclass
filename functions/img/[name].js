// GET /img/<nama> -> gambar hasil upload admin (disimpan di KV)
export async function onRequestGet({ params, env }) {
  const name = String(params.name || '');
  if (!env.DATA || !/^[\w-]+\.(webp|jpg|png)$/.test(name)) return new Response('Not found', { status: 404 });

  const { value, metadata } = await env.DATA.getWithMetadata(`img/${name}`, { type: 'arrayBuffer', cacheTtl: 86400 });
  if (!value) return new Response('Not found', { status: 404 });

  return new Response(value, {
    headers: {
      'Content-Type': metadata?.type || 'image/webp',
      // nama file unik per upload, jadi aman di-cache lama
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
}
