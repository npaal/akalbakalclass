(() => {
  const $ = (id) => document.getElementById(id);
  const uid = () => Math.random().toString(36).slice(2, 9);
  const MAX_MODULES = 10;
  const DRAFT_KEY = 'abdc-draft';

  let data = null;
  let key = sessionStorage.getItem('abdc-key') || '';
  let localMode = false;
  let dirty = false;
  let current = 'products';

  /* ---------- skema tiap bagian ---------- */
  const SECTIONS = {
    profile: {
      label: 'Profil', kind: 'object', note: 'Bagian paling atas halaman.',
      fields: [
        { k: 'name', label: 'Nama brand' },
        { k: 'handle', label: 'Username (tanpa @)' },
        { k: 'tagline', label: 'Tagline', type: 'textarea', wide: true },
        { k: 'badge', label: 'Badge kecil' },
        { k: 'avatar', label: 'Foto profil', type: 'image' }
      ]
    },
    links: {
      label: 'Link & Aset Gratis', kind: 'list', item: 'link',
      note: 'Aset gratis diarahkan ke checkout Lynk.id / Scalev (harga Rp0). Link Google Drive ditaruh di produk Lynk/Scalev-nya, jadi pembeli dapat Drive setelah checkout.',
      blank: () => ({ id: uid(), type: 'free', title: '', desc: '', url: '' }),
      title: (x) => x.title || 'Link baru',
      fields: [
        { k: 'type', label: 'Jenis', type: 'select', options: [['free', 'Aset gratis (checkout dulu)'], ['member', 'Member area / login']] },
        { k: 'title', label: 'Judul tombol' },
        { k: 'desc', label: 'Keterangan kecil', wide: true },
        { k: 'url', label: 'Link checkout / tujuan', type: 'url', wide: true, hint: 'Contoh: https://lynk.id/akalbakal/xxxx. Kosongkan kalau belum siap, tombol tampil "Segera".', check: 'checkout' }
      ]
    },
    catalog: {
      label: 'Judul Katalog', kind: 'object', note: 'Teks di atas daftar produk.',
      fields: [
        { k: 'label', label: 'Label merah (mis. Promo)' },
        { k: 'headline', label: 'Headline', wide: true },
        { k: 'copy', label: 'Copy pendek', type: 'textarea', wide: true }
      ]
    },
    products: {
      label: 'Produk & Kelas', kind: 'list', item: 'produk',
      blank: () => ({ id: uid(), title: '', label: '', thumb: '', desc: '', modules: [''], priceOld: null, pricePromo: null, cta: 'Belajar Sekarang', url: '' }),
      title: (x) => x.title || 'Produk baru',
      fields: [
        { k: 'title', label: 'Nama produk / kelas' },
        { k: 'label', label: 'Label di thumbnail (opsional)' },
        { k: 'thumb', label: 'Thumbnail (16:10)', type: 'image', wide: true },
        { k: 'desc', label: 'Deskripsi singkat', type: 'textarea', wide: true },
        { k: 'modules', label: `Isi video / modul (maks ${MAX_MODULES})`, type: 'modules', wide: true },
        { k: 'priceOld', label: 'Harga coret (tampil merah dicoret)', type: 'price', add: '+ Tambah harga coret', old: true },
        { k: 'pricePromo', label: 'Harga promo', type: 'price', add: '+ Tambah harga promo' },
        { k: 'cta', label: 'Teks tombol' },
        { k: 'url', label: 'Link checkout', type: 'url', hint: 'Link produk di Lynk.id / Scalev / Mayar.', check: 'checkout' }
      ]
    },
    videos: {
      label: 'Video Karya', kind: 'list', item: 'video',
      note: 'Tempel link YouTube (video biasa atau Shorts). Bagian ini otomatis tersembunyi kalau kosong.',
      blank: () => ({ id: uid(), youtube: '', title: '' }),
      title: (x) => x.title || 'Video',
      fields: [
        { k: 'youtube', label: 'Link YouTube', type: 'youtube', wide: true },
        { k: 'title', label: 'Judul (opsional)', wide: true }
      ]
    },
    testimonials: {
      label: 'Testimoni', kind: 'list', item: 'testimoni',
      note: 'Isi testimoni asli saja. Bagian ini tersembunyi selama kosong.',
      blank: () => ({ id: uid(), name: '', age: '', job: '', photo: '', text: '' }),
      title: (x) => x.name || 'Testimoni baru',
      fields: [
        { k: 'name', label: 'Nama' },
        { k: 'age', label: 'Usia (opsional)', type: 'number' },
        { k: 'job', label: 'Profesi (opsional)' },
        { k: 'photo', label: 'Foto (opsional)', type: 'image' },
        { k: 'text', label: 'Isi testimoni', type: 'textarea', wide: true }
      ]
    },
    benefits: {
      label: 'Benefit', kind: 'list', item: 'benefit', note: 'Tersembunyi kalau kosong.',
      blank: () => ({ id: uid(), title: '', desc: '' }),
      title: (x) => x.title || 'Benefit baru',
      fields: [{ k: 'title', label: 'Judul' }, { k: 'desc', label: 'Keterangan' }]
    },
    faqs: {
      label: 'FAQ', kind: 'list', item: 'pertanyaan', note: 'Tersembunyi kalau kosong.',
      blank: () => ({ id: uid(), q: '', a: '' }),
      title: (x) => x.q || 'Pertanyaan baru',
      fields: [{ k: 'q', label: 'Pertanyaan', wide: true }, { k: 'a', label: 'Jawaban', type: 'textarea', wide: true }]
    },
    footer: {
      label: 'Footer', kind: 'object',
      fields: [
        { k: 'instagram', label: 'Instagram (tanpa @)' },
        { k: 'whatsapp', label: 'Nomor WhatsApp', hint: 'Boleh 08xx, otomatis jadi 628xx.' },
        { k: 'note', label: 'Teks kecil paling bawah', wide: true }
      ]
    }
  };

  /* ---------- util ---------- */
  function el(tag, attrs = {}, ...kids) {
    const n = document.createElement(tag);
    for (const [a, v] of Object.entries(attrs)) {
      if (a === 'class') n.className = v;
      else if (a.startsWith('on')) n.addEventListener(a.slice(2), v);
      else if (v !== undefined && v !== null && v !== false) n.setAttribute(a, v === true ? '' : v);
    }
    for (const k of kids.flat()) if (k !== null && k !== undefined && k !== false) n.append(k);
    return n;
  }
  function toast(msg, err) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.toggle('err', !!err);
    t.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove('show'), 3200);
  }
  function markDirty() {
    dirty = true;
    $('save').classList.add('is-dirty');
    $('save').textContent = 'Simpan perubahan';
    renderTabs();
  }
  function youtubeId(input) {
    const v = String(input || '').trim();
    if (/^[\w-]{11}$/.test(v)) return v;
    const m = v.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/);
    return m ? m[1] : '';
  }
  function checkoutWarn(url) {
    const v = String(url || '').trim();
    if (!v) return '';
    if (!/^https?:\/\//i.test(v)) return 'Link harus diawali https://';
    if (/drive\.google|docs\.google/i.test(v)) return 'Ini link Drive langsung. Biar pembeli checkout dulu, taruh Drive di produk Lynk.id/Scalev lalu tempel link checkout-nya di sini.';
    return '';
  }

  async function api(path, opts = {}) {
    const res = await fetch(path, {
      ...opts,
      headers: { 'Content-Type': 'application/json', 'x-admin-key': key, ...(opts.headers || {}) }
    });
    const isJson = (res.headers.get('content-type') || '').includes('json');
    const body = isJson ? await res.json() : null;
    if (!res.ok || !isJson) {
      const e = new Error((body && body.error) || `HTTP ${res.status}`);
      e.status = res.status; e.notApi = !isJson;
      throw e;
    }
    return body;
  }

  // gambar dikecilkan dulu di browser supaya ringan
  function shrinkImage(file, max = 1200) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(img.src);
        resolve(c.toDataURL('image/webp', 0.85));
      };
      img.onerror = () => reject(new Error('Gambar tidak bisa dibaca.'));
      img.src = URL.createObjectURL(file);
    });
  }

  /* ---------- field renderers ---------- */
  function fieldNode(f, obj, rerender) {
    const wrap = el('div', { class: f.wide ? 'field f-wide' : 'field' });
    const id = 'f-' + uid();
    wrap.append(el('label', { for: id }, f.label));
    const set = (v) => { obj[f.k] = v; markDirty(); };

    if (f.type === 'textarea') {
      wrap.append(el('textarea', { id, oninput: (e) => set(e.target.value) }, obj[f.k] || ''));
    } else if (f.type === 'select') {
      const s = el('select', { id, onchange: (e) => { set(e.target.value); } },
        f.options.map(([v, t]) => el('option', { value: v, selected: obj[f.k] === v }, t)));
      wrap.append(s);
    } else if (f.type === 'modules') {
      if (!Array.isArray(obj.modules)) obj.modules = [];
      const list = el('div', { class: 'sublist' });
      const draw = () => {
        list.innerHTML = '';
        obj.modules.forEach((m, i) => {
          list.append(el('div', { class: 'sub-row' },
            el('b', {}, String(i + 1)),
            el('input', { type: 'text', value: m, placeholder: `Materi ${i + 1}`, 'aria-label': `Materi ${i + 1}`, oninput: (e) => { obj.modules[i] = e.target.value; markDirty(); } }),
            el('button', { class: 'icon-btn danger', type: 'button', title: 'Hapus materi', 'aria-label': 'Hapus materi', onclick: () => { obj.modules.splice(i, 1); markDirty(); draw(); } }, '×')
          ));
        });
        const full = obj.modules.length >= MAX_MODULES;
        list.append(el('button', {
          class: 'sub-add', type: 'button', disabled: full,
          onclick: () => { obj.modules.push(''); markDirty(); draw(); list.querySelectorAll('input')[obj.modules.length - 1]?.focus(); }
        }, full ? `Sudah ${MAX_MODULES} materi (maksimal)` : `+ Tambah materi (${obj.modules.length}/${MAX_MODULES})`));
      };
      draw();
      wrap.append(list);
    } else if (f.type === 'price') {
      const box = el('div');
      const draw = () => {
        box.innerHTML = '';
        const has = obj[f.k] !== null && obj[f.k] !== undefined && obj[f.k] !== '';
        if (!has) {
          box.append(el('button', { class: 'price-add', type: 'button', onclick: () => { obj[f.k] = 0; markDirty(); draw(); box.querySelector('input')?.focus(); } }, f.add));
          return;
        }
        box.append(el('div', { class: 'price-row' },
          el('span', { class: 'pref' }, 'Rp'),
          el('input', {
            id, type: 'text', inputmode: 'numeric', class: f.old ? 'price-old-input' : '',
            value: obj[f.k] ? Number(obj[f.k]).toLocaleString('id-ID') : '',
            placeholder: '0',
            oninput: (e) => {
              const n = Number(e.target.value.replace(/\D/g, '')) || 0;
              obj[f.k] = n; markDirty();
              e.target.value = n ? n.toLocaleString('id-ID') : '';
            }
          }),
          el('button', { class: 'icon-btn danger', type: 'button', title: 'Hapus harga', 'aria-label': 'Hapus harga', onclick: () => { obj[f.k] = null; markDirty(); draw(); } }, '×')
        ));
      };
      draw();
      wrap.append(box);
    } else if (f.type === 'image') {
      const prev = el('span', { class: 'img-prev' });
      const showPrev = () => { prev.style.backgroundImage = obj[f.k] ? `url("${String(obj[f.k]).replace(/"/g, '')}")` : ''; };
      const input = el('input', { id, type: 'text', value: obj[f.k] && !String(obj[f.k]).startsWith('data:') ? obj[f.k] : (obj[f.k] ? '(gambar lokal)' : ''), placeholder: 'Tempel URL gambar atau upload', oninput: (e) => { set(e.target.value.trim()); showPrev(); } });
      const file = el('input', {
        type: 'file', accept: 'image/png,image/jpeg,image/webp',
        onchange: async (e) => {
          const fl = e.target.files[0];
          if (!fl) return;
          try {
            toast('Mengupload gambar...');
            const dataUrl = await shrinkImage(fl);
            if (localMode) {
              set(dataUrl); input.value = '(gambar lokal)';
            } else {
              const r = await api('/api/upload', { method: 'POST', body: JSON.stringify({ dataUrl, name: fl.name.replace(/\.\w+$/, '') }) });
              set(r.url); input.value = r.url;
            }
            showPrev(); toast('Gambar terpasang. Jangan lupa Simpan.');
          } catch (err) { toast(err.message, true); }
          e.target.value = '';
        }
      });
      showPrev();
      wrap.append(el('div', { class: 'img-row' }, prev, input, el('label', { class: 'upload' }, 'Upload', file)));
    } else if (f.type === 'youtube') {
      const prev = el('div', { class: 'yt-prev' });
      const warn = el('span', { class: 'warn' });
      const show = () => {
        const yid = youtubeId(obj[f.k]);
        prev.style.backgroundImage = yid ? `url(https://i.ytimg.com/vi/${yid}/mqdefault.jpg)` : '';
        prev.hidden = !yid;
        warn.textContent = obj[f.k] && !yid ? 'Link YouTube tidak dikenali.' : '';
      };
      wrap.append(el('input', { id, type: 'url', value: obj[f.k] || '', placeholder: 'https://youtube.com/shorts/...', oninput: (e) => { set(e.target.value.trim()); show(); } }), prev, warn);
      show();
    } else {
      const warn = el('span', { class: 'warn' });
      const show = () => { warn.textContent = f.check === 'checkout' ? checkoutWarn(obj[f.k]) : ''; };
      wrap.append(el('input', {
        id, type: f.type === 'number' ? 'number' : (f.type === 'url' ? 'url' : 'text'),
        value: obj[f.k] ?? '', min: f.type === 'number' ? 0 : null,
        oninput: (e) => { set(f.type === 'number' ? e.target.value.replace(/\D/g, '') : e.target.value); show(); if (f.k === 'title' || f.k === 'name' || f.k === 'q') rerender?.(); }
      }));
      show();
      wrap.append(warn);
    }
    if (f.hint) wrap.append(el('span', { class: 'hint' }, f.hint));
    return wrap;
  }

  /* ---------- section renderers ---------- */
  function renderTabs() {
    const nav = $('tabs');
    nav.innerHTML = '';
    for (const [k, s] of Object.entries(SECTIONS)) {
      const count = s.kind === 'list' ? (data[k] || []).length : null;
      nav.append(el('button', {
        class: 'tab', type: 'button', role: 'tab', 'aria-selected': String(k === current),
        onclick: () => { current = k; renderTabs(); renderEditor(); }
      }, s.label, count !== null ? el('span', { class: 'count' }, String(count)) : null));
    }
  }

  function renderEditor() {
    const s = SECTIONS[current];
    const ed = $('editor');
    ed.innerHTML = '';
    ed.append(el('div', { class: 'ed-head' }, el('div', {}, el('h2', {}, s.label), s.note ? el('p', {}, s.note) : null)));

    if (s.kind === 'object') {
      data[current] = data[current] || {};
      ed.append(el('div', { class: 'card' }, el('div', { class: 'fields' }, s.fields.map((f) => fieldNode(f, data[current])))));
      return;
    }

    const list = data[current] = data[current] || [];
    if (!list.length) ed.append(el('div', { class: 'empty' }, `Belum ada ${s.item}.`));

    list.forEach((item, i) => {
      const titleEl = el('strong', {}, s.title(item));
      const card = el('div', { class: 'card' },
        el('div', { class: 'card-head' }, titleEl,
          el('div', { class: 'card-tools' },
            el('button', { class: 'icon-btn', type: 'button', title: 'Naikkan', 'aria-label': 'Naikkan', disabled: i === 0, onclick: () => { [list[i - 1], list[i]] = [list[i], list[i - 1]]; markDirty(); renderEditor(); } }, '↑'),
            el('button', { class: 'icon-btn', type: 'button', title: 'Turunkan', 'aria-label': 'Turunkan', disabled: i === list.length - 1, onclick: () => { [list[i + 1], list[i]] = [list[i], list[i + 1]]; markDirty(); renderEditor(); } }, '↓'),
            el('button', { class: 'icon-btn danger', type: 'button', title: 'Hapus', 'aria-label': 'Hapus', onclick: () => { if (confirm(`Hapus "${s.title(item)}"?`)) { list.splice(i, 1); markDirty(); renderEditor(); } } }, '×')
          )
        ),
        el('div', { class: 'fields' }, s.fields.map((f) => fieldNode(f, item, () => { titleEl.textContent = s.title(item); })))
      );
      ed.append(card);
    });

    ed.append(el('button', {
      class: 'add', type: 'button',
      onclick: () => { list.push(s.blank()); markDirty(); renderEditor(); ed.lastElementChild.previousElementSibling?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    }, `+ Tambah ${s.item}`));
  }

  /* ---------- save / load ---------- */
  function clean(d) {
    const out = JSON.parse(JSON.stringify(d));
    (out.products || []).forEach((p) => { p.modules = (p.modules || []).map((m) => m.trim()).filter(Boolean).slice(0, MAX_MODULES); });
    return out;
  }

  async function save() {
    const payload = clean(data);
    try {
      if (localMode) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
        toast('Tersimpan di browser ini (mode lokal).');
      } else {
        const r = await api('/api/data', { method: 'POST', body: JSON.stringify(payload) });
        if (r.data) { data = r.data; renderTabs(); renderEditor(); }
        toast('Tersimpan. Halaman publik ter-update dalam ±1 menit.');
      }
      dirty = false;
      $('save').classList.remove('is-dirty');
      $('save').textContent = 'Simpan';
    } catch (e) {
      if (e.status === 401) { toast('Sesi habis, login lagi.', true); logout(); return; }
      toast('Gagal simpan: ' + e.message, true);
    }
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(clean(data), null, 2)], { type: 'application/json' });
    const a = el('a', { href: URL.createObjectURL(blob), download: 'site.json' });
    document.body.append(a); a.click(); a.remove();
  }

  async function loadData() {
    if (localMode) {
      const d = localStorage.getItem(DRAFT_KEY);
      if (d) return JSON.parse(d);
      return (await fetch('/data/site.json', { cache: 'no-store' })).json();
    }
    return (await fetch('/api/data?fresh=1', { cache: 'no-store' })).json();
  }

  function logout() {
    sessionStorage.removeItem('abdc-key');
    key = '';
    $('shell').hidden = true;
    $('login').hidden = false;
  }

  async function enter() {
    data = await loadData();
    $('login').hidden = true;
    $('shell').hidden = false;
    $('mode-note').textContent = localMode
      ? 'Mode lokal: tersimpan di browser ini saja'
      : 'Tersambung ke server';
    renderTabs();
    renderEditor();
  }

  async function tryLogin(pass) {
    key = pass;
    try {
      const r = await api('/api/data?check=1', { method: 'POST', body: '{}' });
      localMode = false;
      sessionStorage.setItem('abdc-key', pass);
      await enter();
      if (!r.storage) toast('Login berhasil, tapi Blob storage belum disambungkan. Simpan belum bisa.', true);
    } catch (e) {
      if (e.notApi || e.status === 404 || e.status === 405 || e.status === 501) {
        // dibuka tanpa Vercel (mis. preview lokal) -> pakai localStorage
        localMode = true;
        await enter();
        return;
      }
      key = '';
      $('login-msg').textContent = e.status === 401 ? 'Password salah.' : 'Gagal: ' + e.message;
    }
  }

  $('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    $('login-msg').textContent = '';
    tryLogin($('pass').value);
  });
  $('save').addEventListener('click', save);
  $('logout').addEventListener('click', () => { if (!dirty || confirm('Ada perubahan belum disimpan. Tetap keluar?')) { dirty = false; logout(); } });
  $('import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const d = JSON.parse(await file.text());
      if (!d || !d.profile || !Array.isArray(d.products)) throw new Error('Bukan file backup halaman ini.');
      if (!confirm('Ganti semua isi admin dengan file backup ini? Klik Simpan setelahnya.')) return;
      data = d; markDirty(); renderEditor();
      toast('Backup dimuat. Cek lalu klik Simpan.');
    } catch (err) { toast('Gagal restore: ' + err.message, true); }
  });
  $('export').addEventListener('click', exportJson);
  window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
  document.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); } });

  if (key) tryLogin(key);
})();
