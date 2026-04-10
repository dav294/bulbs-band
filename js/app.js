// app.js — Bulbs Band Website
// GSAP + Lenis + page routing + async data loading

gsap.registerPlugin(ScrollTrigger);

const IS_SUBPAGE = /\/(shows|media|merch)\//.test(window.location.pathname);
const ROOT = IS_SUBPAGE ? '../' : '';

/* ─── Data store ─────────────────────────────────────────── */
let SETTINGS = {};
let NEWS     = [];
let SHOWS    = [];
let MEDIA    = { photos: [], videos: [] };
let MERCH    = [];

async function loadData() {
  try {
    const [sRes, nRes, shRes, mRes, meRes] = await Promise.all([
      fetch(ROOT + 'data/settings.json'),
      fetch(ROOT + 'data/news.json'),
      fetch(ROOT + 'data/shows.json'),
      fetch(ROOT + 'data/media.json'),
      fetch(ROOT + 'data/merch.json'),
    ]);
    SETTINGS = await sRes.json();
    const nData  = await nRes.json();  NEWS  = nData.items  || [];
    const shData = await shRes.json(); SHOWS = shData.items || [];
    MEDIA  = await mRes.json();
    const meData = await meRes.json(); MERCH = meData.items || [];
  } catch (err) {
    console.error('Bulbs: failed to load data', err);
  }
}

/* ─── Helpers ───────────────────────────────────────────── */
function formatDateShort(str) {
  const d = new Date(str);
  return d.toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatShowDate(str) {
  const d = new Date(str);
  return {
    day:   d.toLocaleDateString('en-IE', { day: '2-digit' }),
    month: d.toLocaleDateString('en-IE', { month: 'short' }).toUpperCase(),
    year:  d.getFullYear(),
  };
}
function isUpcoming(dateStr) {
  return new Date(dateStr) >= new Date();
}

/* ─── Boot ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();

  /* Lenis */
  const lenis = new Lenis({
    duration: 1.2,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  /* Nav scroll */
  const nav = document.getElementById('site-nav');
  ScrollTrigger.create({
    start: 'top -60',
    onEnter:     () => nav && nav.classList.add('scrolled'),
    onLeaveBack: () => nav && nav.classList.remove('scrolled'),
  });

  /* Mobile nav */
  const toggle     = document.getElementById('nav-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      toggle.classList.remove('open');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    }));
  }

  /* Shop button → external store */
  document.querySelectorAll('.js-shop').forEach(btn => {
    btn.addEventListener('click', () => {
      if (SETTINGS.shopUrl) window.open(SETTINGS.shopUrl, '_blank');
    });
  });

  /* Scroll reveals */
  gsap.utils.toArray('.reveal').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true } }
    );
  });
  gsap.utils.toArray('.reveal-stagger').forEach(wrap => {
    gsap.fromTo(wrap.children,
      { opacity: 0, y: 32 },
      { opacity: 1, y: 0, duration: 0.75, stagger: 0.09, ease: 'power3.out',
        scrollTrigger: { trigger: wrap, start: 'top 85%', once: true } }
    );
  });

  /* Page routing */
  const page = document.body.dataset.page;
  if (page === 'home')   initHome();
  if (page === 'shows')  initShows();
  if (page === 'media')  initMedia();
  if (page === 'merch')  initMerch();

  /* Apply settings to footer (all pages) */
  applySettings();
});

/* =============================================================
   SETTINGS — apply to shared elements on all pages
============================================================= */
function applySettings() {
  const s = SETTINGS;

  const footerName = document.getElementById('footer-name');
  if (footerName && s.bandName) footerName.textContent = s.bandName;

  const footerBio = document.getElementById('footer-bio');
  if (footerBio && s.bio) footerBio.textContent = s.bio;

  const footerSocials = document.getElementById('footer-socials');
  if (footerSocials && s.socials) {
    const links = Object.entries(s.socials)
      .filter(([, v]) => v)
      .map(([k, v]) => `<a href="${v}" target="_blank" rel="noopener" class="footer-social">${k.charAt(0).toUpperCase() + k.slice(1)}</a>`)
      .join('');
    footerSocials.innerHTML = links;
  }

  // Footer listen links
  const map = {
    'footer-spotify':  s.socials?.spotify,
    'footer-apple':    s.socials?.appleMusic,
    'footer-bandcamp': s.socials?.bandcamp,
    'footer-sc':       s.socials?.soundcloud,
  };
  Object.entries(map).forEach(([id, url]) => {
    const el = document.getElementById(id);
    if (el && url) { el.href = url; el.style.display = 'block'; }
  });
}

/* =============================================================
   HOME PAGE
============================================================= */
function initHome() {
  const s = SETTINGS;

  /* Hero */
  const heroBg = document.getElementById('hero-bg');
  if (heroBg && s.heroImage) {
    heroBg.innerHTML = `<img src="${ROOT}${s.heroImage}" alt="${s.bandName || 'Bulbs'}" loading="eager">`;
  }
  const headline = document.getElementById('hero-headline');
  if (headline && s.heroHeadline) headline.textContent = s.heroHeadline;

  const cta1 = document.getElementById('hero-cta1');
  if (cta1) {
    cta1.textContent = s.heroCta1Label || 'Listen Now';
    cta1.href = s.heroCta1Link || '#';
    if (s.heroCta1Link && s.heroCta1Link.startsWith('http')) cta1.target = '_blank';
  }
  const cta2 = document.getElementById('hero-cta2');
  if (cta2) {
    cta2.textContent = s.heroCta2Label || 'Tour Dates';
    cta2.href = s.heroCta2Link || 'shows/';
  }

  // Hero entrance
  gsap.set(['.hero-eyebrow', '.hero-band-name', '.hero-headline', '.hero-ctas'], { y: 30, opacity: 0 });
  gsap.timeline({ defaults: { ease: 'power4.out' }, delay: 0.15 })
    .to('.hero-eyebrow',   { opacity: 1, y: 0, duration: 0.6 })
    .to('.hero-band-name', { opacity: 1, y: 0, duration: 0.8 }, '-=0.3')
    .to('.hero-headline',  { opacity: 1, y: 0, duration: 0.6 }, '-=0.5')
    .to('.hero-ctas',      { opacity: 1, y: 0, duration: 0.6 }, '-=0.4');

  // Subtle parallax on hero bg
  if (heroBg) {
    gsap.to(heroBg, {
      yPercent: 20,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
  }

  /* News */
  renderNewsGrid(NEWS.slice(0, 4), document.getElementById('news-grid'));

  /* Shows */
  const upcoming = SHOWS.filter(s => isUpcoming(s.date)).slice(0, 5);
  renderShowsList(upcoming, document.getElementById('home-shows-list'), true);

  if (!upcoming.length) {
    const sec = document.getElementById('shows-section');
    if (sec) sec.style.display = 'none';
  }

  /* Media strip */
  renderMediaStrip();

  /* Merch CTA */
  const featured = MERCH.filter(m => m.featured).slice(0, 3);
  const ctaGrid  = document.getElementById('merch-cta-grid');
  if (ctaGrid) {
    if (featured.length) {
      ctaGrid.innerHTML = featured.map(m => `
        <a href="${ROOT}merch/" class="merch-card" style="text-decoration:none">
          <div class="merch-card-img-wrap">
            ${m.image
              ? `<img src="${ROOT}${m.image}" alt="${m.name}" class="merch-card-img" loading="lazy">`
              : `<div class="merch-card-img-placeholder">♪</div>`}
            ${m.soldOut ? '<div class="merch-card-sold-overlay">Sold Out</div>' : ''}
          </div>
        </a>`).join('');
    } else {
      document.getElementById('merch-cta-section').style.display = 'none';
    }
  }
}

/* =============================================================
   NEWS GRID RENDERER
============================================================= */
function renderNewsGrid(items, el) {
  if (!el) return;
  if (!items.length) { el.innerHTML = '<div class="empty-state">No news yet.</div>'; return; }

  el.innerHTML = items.map(item => {
    const imgHtml = item.coverImage
      ? `<img src="${ROOT}${item.coverImage}" alt="${item.title}" class="news-card-img" loading="lazy">`
      : '';

    return `
      <a href="${item.link || '#'}" class="news-card" ${item.link && item.link.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>
        ${imgHtml}
        <div class="news-card-body">
          <span class="news-card-category">${item.category || 'News'}</span>
          <div class="news-card-title">${item.title}</div>
          <p class="news-card-excerpt">${item.excerpt || ''}</p>
          <div class="news-card-meta">${formatDateShort(item.date)}</div>
          ${item.linkLabel ? `<span class="news-card-link">${item.linkLabel} →</span>` : ''}
        </div>
      </a>`;
  }).join('');

  gsap.fromTo(el.children,
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true } }
  );
}

/* =============================================================
   SHOWS LIST RENDERER
============================================================= */
function renderShowsList(shows, el, homeMode) {
  if (!el) return;
  if (!shows.length) {
    el.innerHTML = '<div class="shows-empty">No shows scheduled yet. Check back soon.</div>';
    return;
  }

  el.innerHTML = shows.map(show => {
    const d    = formatShowDate(show.date);
    const past = !isUpcoming(show.date);

    const ticketBtn = show.soldOut
      ? `<span class="show-sold-out">Sold Out</span>`
      : past
      ? ''
      : `<a href="${show.ticketLink || '#'}" target="_blank" rel="noopener" class="btn btn-primary" style="padding:10px 24px;font-size:0.82rem">Tickets →</a>`;

    return `
      <div class="show-row${past ? ' show-past' : ''}">
        <div class="show-date">
          <span class="show-date-day">${d.day}</span>
          ${d.month} ${d.year}
        </div>
        <div>
          <div class="show-venue">${show.venue}</div>
          ${show.supportActs ? `<div class="show-support">w/ ${show.supportActs}</div>` : ''}
        </div>
        <div class="show-city">${show.city}, ${show.country}</div>
        <div class="show-actions">${ticketBtn}</div>
      </div>`;
  }).join('');

  gsap.fromTo(el.children,
    { opacity: 0, x: -16 },
    { opacity: 1, x: 0, duration: 0.6, stagger: 0.07, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true } }
  );
}

/* =============================================================
   MEDIA STRIP (home)
============================================================= */
function renderMediaStrip() {
  const track = document.getElementById('media-strip-track');
  if (!track) return;

  const photos = MEDIA.photos || [];
  if (!photos.length) {
    document.getElementById('media-strip-section').style.display = 'none';
    return;
  }

  const items = photos.slice(0, 10);
  track.innerHTML = items.map((src, i) => {
    const imgSrc = typeof src === 'string' ? src : (src.photo || src.image || '');
    return `
      <div class="media-strip-item">
        <img src="${ROOT}${imgSrc}" alt="Bulbs photo ${i + 1}" loading="lazy">
      </div>`;
  }).join('');

  // Drag scroll
  const scroll = track.closest('.media-strip-scroll');
  let isDown = false, startX, scrollLeft;
  scroll.addEventListener('mousedown', e => {
    isDown = true; startX = e.pageX - scroll.offsetLeft; scrollLeft = scroll.scrollLeft;
  });
  scroll.addEventListener('mouseleave', () => { isDown = false; });
  scroll.addEventListener('mouseup',    () => { isDown = false; });
  scroll.addEventListener('mousemove', e => {
    if (!isDown) return;
    e.preventDefault();
    scroll.scrollLeft = scrollLeft - (e.pageX - scroll.offsetLeft - startX);
  });
}

/* =============================================================
   SHOWS PAGE
============================================================= */
function initShows() {
  let activeFilter = 'all';
  const listEl    = document.getElementById('shows-page-list');
  const filterBtns = document.querySelectorAll('.filter-btn');

  function render() {
    let list = SHOWS;
    if (activeFilter === 'upcoming') list = SHOWS.filter(s => isUpcoming(s.date));
    if (activeFilter === 'past')     list = SHOWS.filter(s => !isUpcoming(s.date));
    list = [...list].sort((a, b) => {
      if (activeFilter === 'past') return new Date(b.date) - new Date(a.date);
      return new Date(a.date) - new Date(b.date);
    });
    renderShowsList(list, listEl);
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      render();
    });
  });

  render();
}

/* =============================================================
   MEDIA PAGE
============================================================= */
function initMedia() {
  const photosWrap = document.getElementById('media-photos-wrap');
  const videosWrap = document.getElementById('media-videos-wrap');
  const masonryEl  = document.getElementById('photo-masonry');
  const videosEl   = document.getElementById('videos-grid');
  const filterBtns = document.querySelectorAll('.filter-btn[data-tab]');

  // Photos
  const photos = MEDIA.photos || [];
  if (photos.length && masonryEl) {
    masonryEl.innerHTML = photos.map((src, i) => {
      const imgSrc = typeof src === 'string' ? src : (src.photo || src.image || '');
      return `
        <div class="photo-masonry-item" data-index="${i}">
          <img src="${ROOT}${imgSrc}" alt="Bulbs photo ${i + 1}" loading="lazy">
        </div>`;
    }).join('');

    // Lightbox
    initLightbox(photos.map(src => typeof src === 'string' ? src : (src.photo || src.image || '')));
  } else if (masonryEl) {
    masonryEl.innerHTML = '<div class="empty-state">No photos yet.</div>';
  }

  // Videos
  const videos = MEDIA.videos || [];
  if (videos.length && videosEl) {
    videosEl.innerHTML = videos.map(v => `
      <div class="video-card">
        <div class="video-embed-wrap">
          ${v.embedUrl
            ? `<iframe src="${v.embedUrl}" allowfullscreen allow="autoplay; encrypted-media"></iframe>`
            : v.coverImage
            ? `<img src="${ROOT}${v.coverImage}" alt="${v.title}" style="width:100%;height:100%;object-fit:cover">`
            : '<div style="width:100%;height:100%;background:var(--bg-3)"></div>'}
        </div>
        <div class="video-card-body">
          <div class="video-card-title">${v.title}</div>
          ${v.description ? `<p class="video-card-desc">${v.description}</p>` : ''}
          <div class="video-card-date">${formatDateShort(v.date)}</div>
        </div>
      </div>`).join('');
  } else if (videosEl) {
    videosEl.innerHTML = '<div class="empty-state">No videos yet.</div>';
  }

  // Tab switching
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      photosWrap.style.display = tab === 'photos' ? '' : 'none';
      videosWrap.style.display = tab === 'videos' ? '' : 'none';
    });
  });
}

function initLightbox(photos) {
  const lightbox = document.getElementById('lightbox');
  const img      = document.getElementById('lightbox-img');
  const counter  = document.getElementById('lightbox-counter');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn  = document.getElementById('lightbox-prev');
  const nextBtn  = document.getElementById('lightbox-next');
  if (!lightbox || !photos.length) return;

  let current = 0;

  function show(i) {
    current = (i + photos.length) % photos.length;
    img.src = ROOT + photos[current];
    counter.textContent = `${current + 1} / ${photos.length}`;
  }
  function open(i) {
    show(i);
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.getElementById('photo-masonry').addEventListener('click', e => {
    const item = e.target.closest('.photo-masonry-item');
    if (item) open(parseInt(item.dataset.index));
  });

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', () => show(current - 1));
  nextBtn.addEventListener('click', () => show(current + 1));
  lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'ArrowRight') show(current + 1);
    if (e.key === 'ArrowLeft')  show(current - 1);
    if (e.key === 'Escape') close();
  });
}

/* =============================================================
   MERCH PAGE
============================================================= */
function initMerch() {
  const grid      = document.getElementById('merch-grid');
  const filterBtns = document.querySelectorAll('.filter-btn[data-filter]');
  let activeFilter = 'all';

  // External shop links
  if (SETTINGS.shopUrl) {
    const navShop = document.getElementById('merch-nav-shop');
    if (navShop) navShop.href = SETTINGS.shopUrl;
    const fullCta = document.getElementById('shop-full-cta');
    if (fullCta) fullCta.href = SETTINGS.shopUrl;
  }

  function render() {
    let list = MERCH;
    if (activeFilter !== 'all') list = MERCH.filter(m => m.category === activeFilter);

    if (!list.length) {
      grid.innerHTML = '<div class="empty-state">No items found.</div>';
      return;
    }

    grid.innerHTML = list.map(m => `
      <div class="merch-card">
        <div class="merch-card-img-wrap">
          ${m.image
            ? `<img src="${ROOT}${m.image}" alt="${m.name}" class="merch-card-img" loading="lazy">`
            : `<div class="merch-card-img-placeholder">♪</div>`}
          ${m.soldOut ? '<div class="merch-card-sold-overlay">Sold Out</div>' : ''}
        </div>
        <div class="merch-card-body">
          <div class="merch-card-category">${m.category || 'Merch'}</div>
          <div class="merch-card-name">${m.name}</div>
          <div class="merch-card-price">€${m.price}</div>
          <a href="${m.buyLink || SETTINGS.shopUrl || '#'}" target="_blank" rel="noopener"
             class="merch-card-btn${m.soldOut ? ' sold' : ''}">
            ${m.soldOut ? 'Sold Out' : 'Buy Now →'}
          </a>
        </div>
      </div>`).join('');

    gsap.fromTo(grid.children,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.55, stagger: 0.07, ease: 'power3.out' }
    );
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      render();
    });
  });

  render();
}
