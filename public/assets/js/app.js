(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = (u) => {
    const v = String(u || '').trim();
    if (/^https?:\/\//i.test(v) || /^\/(?!\/)/.test(v)) return v;
    return '';
  };
  // gambar boleh juga data:image (hasil upload di mode lokal)
  const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
  const safeImg = (u) => (isLocal && /^data:image\/(png|jpe?g|webp);base64,/i.test(String(u || '')) ? String(u) : safeUrl(u));
  const rupiah = (n) => 'Rp' + Number(n).toLocaleString('id-ID');
  const hasNum = (n) => n !== null && n !== undefined && n !== '' && !isNaN(Number(n)) && Number(n) > 0;
  const icon = (id) => `<svg aria-hidden="true"><use href="#${id}"/></svg>`;

  function youtubeId(input) {
    const v = String(input || '').trim();
    if (/^[\w-]{11}$/.test(v)) return v;
    const m = v.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/);
    return m ? m[1] : '';
  }
  const isShort = (input) => /\/shorts\//.test(String(input || ''));

  function platformOf(url) {
    const v = String(url || '').toLowerCase();
    if (v.includes('lynk.id')) return 'Lynk.id';
    if (v.includes('scalev')) return 'Scalev';
    if (v.includes('mayar')) return 'Mayar';
    if (v.includes('drive.google')) return 'Drive';
    return '';
  }

  async function loadData() {
    try {
      const res = await fetch('/api/data', { cache: 'no-store' });
      if (res.ok && (res.headers.get('content-type') || '').includes('json')) return await res.json();
    } catch (e) { /* lanjut ke cadangan */ }
    // draft mode lokal hanya dipakai saat preview di komputer sendiri
    if (isLocal) {
      try {
        const draft = localStorage.getItem('abdc-draft');
        if (draft) return JSON.parse(draft);
      } catch (e) { /* abaikan */ }
    }
    const res = await fetch('/data/site.json', { cache: 'no-store' });
    return res.json();
  }

  function renderProfile(p = {}) {
    $('name').textContent = p.name || 'AkalBakal Digital Class';
    $('handle').textContent = p.handle ? '@' + p.handle.replace(/^@/, '') : '';
    $('tagline').textContent = p.tagline || '';
    $('badge').innerHTML = p.badge ? `<svg class="spark-ico" style="color:var(--olive);width:13px;height:13px"><use href="#spark"/></svg>${esc(p.badge)}` : '';
    if (safeImg(p.avatar)) $("avatar").src = safeImg(p.avatar);
    document.title = p.name || document.title;
  }

  function renderLinks(links = []) {
    $('links').innerHTML = links.map((l) => {
      const url = safeUrl(l.url);
      const member = l.type === 'member';
      const tag = member ? '' : (platformOf(url) && platformOf(url) !== 'Drive' ? `Gratis · ${platformOf(url)}` : 'Gratis');
      const inner = `
        <span class="link-ico">${icon(member ? 'lock' : 'gift')}</span>
        <span class="link-text"><strong>${esc(l.title)}</strong>${l.desc ? `<span>${esc(l.desc)}</span>` : ''}</span>
        ${url ? (tag ? `<span class="link-tag">${esc(tag)}</span>` : '') : '<span class="link-tag">Segera</span>'}`;
      const cls = `link rise ${member ? 'is-member' : ''} ${url ? '' : 'is-off'}`;
      return url
        ? `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener">${inner}</a>`
        : `<div class="${cls}" aria-disabled="true">${inner}</div>`;
    }).join('');
  }

  function priceBlock(p) {
    const old = hasNum(p.priceOld), now = hasNum(p.pricePromo);
    if (!old && !now) return '';
    if (old && now && Number(p.priceOld) > Number(p.pricePromo)) {
      const save = Math.round((1 - Number(p.pricePromo) / Number(p.priceOld)) * 100);
      return `<div class="price"><span class="price-old">${rupiah(p.priceOld)}</span><span class="price-now">${rupiah(p.pricePromo)}</span>${save ? `<span class="price-save">Hemat ${save}%</span>` : ''}</div>`;
    }
    return `<div class="price"><span class="price-now">${rupiah(now ? p.pricePromo : p.priceOld)}</span></div>`;
  }

  function renderCatalog(c = {}, products = []) {
    $('catalog-label').textContent = c.label || '';
    $('catalog-title').textContent = c.headline || '';
    $('catalog-copy').textContent = c.copy || '';
    $('catalog').hidden = !products.length;
    $('products').innerHTML = products.map((p) => {
      const thumb = safeImg(p.thumb);
      const url = safeUrl(p.url);
      const mods = (p.modules || []).filter(Boolean).slice(0, 10);
      return `
      <article class="product rise">
        <div class="product-thumb ${thumb ? '' : 'is-empty'}">
          ${thumb ? `<img src="${esc(thumb)}" alt="${esc(p.title)}" loading="lazy" width="800" height="500">` : esc(p.title)}
          ${p.label ? `<span class="product-label">${esc(p.label)}</span>` : ''}
        </div>
        <div class="product-body">
          <h3>${esc(p.title)}</h3>
          ${p.desc ? `<p class="product-desc">${esc(p.desc)}</p>` : ''}
          ${mods.length ? `<ol class="modules"><li class="modules-title">${mods.length} materi di dalamnya</li>${mods.map((m, i) => `<li><b>${i + 1}</b><span>${esc(m)}</span></li>`).join('')}</ol>` : ''}
          ${priceBlock(p)}
          ${url
            ? `<a class="btn" href="${esc(url)}" target="_blank" rel="noopener">${esc(p.cta || 'Belajar Sekarang')}${icon('bolt')}</a>`
            : `<span class="btn is-off" aria-disabled="true">Segera dibuka</span>`}
        </div>
      </article>`;
    }).join('');
  }

  function renderVideos(videos = []) {
    const list = videos.filter((v) => youtubeId(v.youtube));
    $('videos-wrap').hidden = !list.length;
    $('videos').innerHTML = list.map((v) => {
      const id = youtubeId(v.youtube);
      return `<button class="video rise" type="button" data-yt="${id}" data-short="${isShort(v.youtube) ? 1 : 0}" aria-label="Putar ${esc(v.title || 'video')}">
        <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy" width="480" height="360">
        <span class="video-title">${esc(v.title)}</span>
        <span class="play">${icon('play')}</span>
      </button>`;
    }).join('');
  }

  function renderTestis(items = []) {
    const list = items.filter((t) => String(t.name || '').trim() && String(t.text || '').trim());
    $('testi-wrap').hidden = !list.length;
    $('testis').innerHTML = list.map((t) => {
      const meta = [t.age ? `${t.age} th` : '', t.job].filter(Boolean).join(' · ');
      const photo = safeImg(t.photo);
      return `<figure class="testi rise" style="margin:0">
        <div class="testi-head">
          ${photo ? `<img src="${esc(photo)}" alt="" loading="lazy" width="46" height="46">` : `<span class="testi-initial">${esc(t.name.trim()[0].toUpperCase())}</span>`}
          <div><strong>${esc(t.name)}</strong>${meta ? `<span>${esc(meta)}</span>` : ''}</div>
        </div>
        <p>${esc(t.text)}</p>
      </figure>`;
    }).join('');
  }

  function renderBenefits(items = []) {
    const list = items.filter((b) => b.title);
    $('benefit-wrap').hidden = !list.length;
    $('benefits').innerHTML = list.map((b) => `<div class="benefit rise"><span class="benefit-ico">${icon('check')}</span><strong>${esc(b.title)}</strong>${b.desc ? `<span>${esc(b.desc)}</span>` : ''}</div>`).join('');
  }

  function renderFaqs(items = []) {
    const list = items.filter((f) => f.q && f.a);
    $('faq-wrap').hidden = !list.length;
    $('faqs').innerHTML = list.map((f) => `<details class="faq"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('');
  }

  function renderFooter(f = {}) {
    const links = [];
    if (f.instagram && f.instagram.trim()) links.push(`<a href="https://instagram.com/${encodeURIComponent(f.instagram.replace(/^@/, ''))}" target="_blank" rel="noopener">Instagram</a>`);
    const num = String(f.whatsapp || '').replace(/\D/g, '').replace(/^0/, '62');
    if (num.length >= 9) {
      links.push(`<a href="https://wa.me/${num}" target="_blank" rel="noopener">WhatsApp</a>`);
    }
    $('foot-links').innerHTML = links.join('');
    $('foot-note').textContent = f.note || '';
  }

  function staggerIn() {
    document.querySelectorAll('.rise').forEach((el, i) => { el.style.animationDelay = `${Math.min(i, 12) * 60}ms`; });
  }

  // modal video
  const modal = $('video-modal');
  const frame = $('modal-frame');
  document.addEventListener('click', (e) => {
    const card = e.target.closest('[data-yt]');
    if (card) {
      frame.classList.toggle('is-wide', card.dataset.short !== '1');
      frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${card.dataset.yt}?autoplay=1&rel=0&playsinline=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Video"></iframe>`;
      modal.showModal();
    }
    if (e.target.closest('.modal-close') || e.target === modal) modal.close();
  });
  modal.addEventListener('close', () => { frame.innerHTML = ''; });

  loadData().catch(() => ({})).then((d) => {
    renderProfile(d.profile);
    renderLinks(d.links);
    renderCatalog(d.catalog, d.products || []);
    renderVideos(d.videos);
    renderTestis(d.testimonials);
    renderBenefits(d.benefits);
    renderFaqs(d.faqs);
    renderFooter(d.footer);
    staggerIn();
    $('app').setAttribute('aria-busy', 'false');
  });
})();
