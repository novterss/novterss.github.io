/* ==========================================================================
   Kan — portfolio interactions
   ========================================================================== */
(function () {
  'use strict';

  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const hasGsap = typeof window.gsap !== 'undefined';
  // ?motion=full overrides the OS "reduce motion" setting (handy for demos)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches && !/[?&]motion=full/.test(location.search);
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function safeGet(store, key) {
    try { return window[store].getItem(key); } catch (e) { return null; }
  }
  function safeSet(store, key, value) {
    try { window[store].setItem(key, value); } catch (e) { /* storage unavailable */ }
  }

  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  // reveal-on-scroll styles only when ScrollTrigger is there to reveal them
  if (hasGsap && window.ScrollTrigger && !reduceMotion) root.classList.add('anim');

  /* ------------------------------------------------------------------ toast */
  const toastEl = $('#toast');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  /* ----------------------------------------------------------- typewriter */
  let currentLang = 'en';
  const tw = (function () {
    const el = $('#typewriter');
    const words = {
      en: ['Web Developer', 'CS Student', 'Product Builder', 'Full-stack Tinkerer'],
      th: ['นักพัฒนาเว็บ', 'นักศึกษา CS', 'คนสร้างโปรดักต์', 'สาย Full-stack']
    };
    let i = 0, c = 0, del = false, timer = null;
    function tick() {
      const list = words[currentLang];
      const w = list[i % list.length];
      if (!del) {
        c++;
        el.textContent = w.slice(0, c);
        if (c >= w.length) { del = true; timer = setTimeout(tick, 1700); return; }
      } else {
        c--;
        el.textContent = w.slice(0, c);
        if (c <= 0) { del = false; i++; }
      }
      timer = setTimeout(tick, del ? 45 : 85);
    }
    return {
      start() { clearTimeout(timer); tick(); },
      restart() { clearTimeout(timer); i = 0; c = 0; del = false; tick(); }
    };
  })();

  /* ------------------------------------------------------------- language */
  function applyLang(lang) {
    currentLang = lang;
    $$('[data-en]').forEach(el => {
      const value = el.getAttribute('data-' + lang);
      if (value === null) return;
      if (value.includes('<')) el.innerHTML = value;
      else el.textContent = value;
    });
    root.lang = lang;
    $('#langLabel').textContent = lang === 'en' ? 'TH' : 'EN';
    const cv = $('#cvDownloadBtn');
    if (cv) cv.href = cv.getAttribute('data-cv-' + lang);
    $('#cmdkInput').placeholder = lang === 'en' ? 'Type a command or search…' : 'พิมพ์คำสั่งหรือค้นหา…';
    safeSet('localStorage', 'lang', lang);
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }
  function toggleLang() {
    applyLang(currentLang === 'en' ? 'th' : 'en');
    tw.restart();
  }
  $('#langToggle').addEventListener('click', toggleLang);

  applyLang(safeGet('localStorage', 'lang') === 'th' ? 'th' : 'en');
  tw.start();

  /* ---------------------------------------------------------------- theme */
  const darkBtn = $('#darkToggle');
  const themeMeta = $('meta[name="theme-color"]');
  function applyTheme(dark, save) {
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    darkBtn.innerHTML = dark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    darkBtn.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
    if (themeMeta) themeMeta.setAttribute('content', dark ? '#060a14' : '#0ea5e9');
    if (save) safeSet('localStorage', 'theme', dark ? 'dark' : 'light');
  }
  applyTheme(root.getAttribute('data-theme') === 'dark', false);
  function toggleTheme() {
    applyTheme(root.getAttribute('data-theme') !== 'dark', true);
  }
  darkBtn.addEventListener('click', toggleTheme);

  /* ------------------------------------------------------------------ nav */
  const navbar = $('#navbar');
  const menuBtn = $('#menuToggle');
  const navLinks = $('#navLinks');
  function setMenu(open) {
    navLinks.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  menuBtn.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
  $$('.nav-link').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', e => {
    if (navLinks.classList.contains('open') && !navbar.contains(e.target)) setMenu(false);
  });

  const progress = $('#scrollProgress');
  const btt = $('#backToTop');
  function onScroll() {
    const y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 20);
    btt.classList.toggle('show', y > 600);
    const h = root.scrollHeight - window.innerHeight;
    progress.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  // active section highlight
  const linkFor = {};
  $$('.nav-link').forEach(a => { linkFor[a.getAttribute('href').slice(1)] = a; });
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      $$('.nav-link.active').forEach(a => a.classList.remove('active'));
      const a = linkFor[en.target.id];
      if (a) a.classList.add('active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => sectionObserver.observe(s));

  /* ------------------------------------------------------------- lightbox */
  const lightbox = $('#lightbox');
  const lightboxImg = $('#lightbox-img');
  let lastFocus = null;
  function openLightbox(src, alt) {
    lastFocus = document.activeElement;
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightbox.classList.add('show');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => $('.lightbox-close').focus());
  }
  function closeLightbox() {
    if (!lightbox.classList.contains('show')) return;
    lightbox.classList.remove('show');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  $$('.zoomable').forEach(img => img.addEventListener('click', () => openLightbox(img.currentSrc || img.src, img.alt)));
  $$('[data-lightbox]').forEach(b => b.addEventListener('click', () => openLightbox(b.getAttribute('data-lightbox'), 'Certificate')));
  $('.lightbox-close').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

  /* --------------------------------------------------------------- slider */
  $$('.p-slider').forEach(sl => {
    const track = $('.sl-track', sl);
    const dots = $$('.sl-dot', sl);
    dots.forEach((d, i) => d.addEventListener('click', () => {
      track.scrollTo({ left: track.clientWidth * i, behavior: 'smooth' });
    }));
    track.addEventListener('scroll', () => {
      const i = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
      dots.forEach((d, k) => d.classList.toggle('on', k === i));
    }, { passive: true });
  });

  /* --------------------------------------------------------------- filter */
  const cards = $$('.p-card');
  function filterProjects(cat) {
    $$('.f-btn').forEach(b => {
      const on = b.dataset.filter === cat;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    const show = cards.filter(c => cat === 'all' || c.dataset.cat.split(' ').includes(cat));
    const hide = cards.filter(c => !show.includes(c));
    // swap visibility right away so the result never depends on an animation finishing
    hide.forEach(c => c.classList.add('is-hidden'));
    show.forEach(c => c.classList.remove('is-hidden'));
    if (hasGsap && !reduceMotion) {
      gsap.killTweensOf(cards);
      gsap.fromTo(show, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .5, stagger: .05, ease: 'power3.out', clearProps: 'transform' });
    } else {
      show.forEach(c => { c.style.opacity = ''; c.style.transform = ''; });
    }
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }
  $$('.f-btn').forEach(b => b.addEventListener('click', () => filterProjects(b.dataset.filter)));

  /* ------------------------------------------------------- spotlight + tilt */
  if (finePointer) {
    const heroEl = $('#hero');
    heroEl.addEventListener('pointermove', e => {
      const r = heroEl.getBoundingClientRect();
      heroEl.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      heroEl.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
    cards.forEach(c => c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--px', (e.clientX - r.left) + 'px');
      c.style.setProperty('--py', (e.clientY - r.top) + 'px');
    }));
    const portrait = $('.portrait');
    if (portrait && hasGsap && !reduceMotion) {
      gsap.set(portrait, { transformPerspective: 900 });
      const rx = gsap.quickTo(portrait, 'rotationX', { duration: .6, ease: 'power3' });
      const ry = gsap.quickTo(portrait, 'rotationY', { duration: .6, ease: 'power3' });
      heroEl.addEventListener('pointermove', e => {
        const r = portrait.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
        const dy = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
        ry(dx * 14);
        rx(-dy * 14);
      });
      heroEl.addEventListener('pointerleave', () => { rx(0); ry(0); });
    }
  }

  /* --------------------------------------------------- cursor + magnetic */
  if (finePointer && hasGsap && !reduceMotion) {
    root.classList.add('has-cursor');
    const ring = $('#cursorRing');
    const dot = $('#cursorDot');
    const rx = gsap.quickTo(ring, 'x', { duration: .35, ease: 'power3' });
    const ry = gsap.quickTo(ring, 'y', { duration: .35, ease: 'power3' });
    const dx = gsap.quickTo(dot, 'x', { duration: .08 });
    const dy = gsap.quickTo(dot, 'y', { duration: .08 });
    window.addEventListener('pointermove', e => { rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', e => {
      ring.classList.toggle('hover', !!e.target.closest('a, button, summary, .zoomable, input'));
    });
    document.documentElement.addEventListener('pointerleave', () => { ring.classList.add('hidden'); dot.classList.add('hidden'); });
    document.documentElement.addEventListener('pointerenter', () => { ring.classList.remove('hidden'); dot.classList.remove('hidden'); });

    $$('[data-magnetic]').forEach(el => {
      const mx = gsap.quickTo(el, 'x', { duration: .4, ease: 'power3' });
      const my = gsap.quickTo(el, 'y', { duration: .4, ease: 'power3' });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * .28);
        my((e.clientY - (r.top + r.height / 2)) * .35);
      });
      el.addEventListener('pointerleave', () => { mx(0); my(0); });
    });
  }

  /* ------------------------------------------------------------ counters */
  function countUp(el) {
    const to = parseFloat(el.dataset.to);
    const decimals = (el.dataset.to.split('.')[1] || '').length;
    const fmt = v => decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-US');
    if (!hasGsap || reduceMotion) { el.textContent = fmt(to); return; }
    const o = { v: 0 };
    gsap.to(o, { v: to, duration: 1.6, ease: 'power3.out', onUpdate: () => { el.textContent = fmt(o.v); } });
  }
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      countUp(en.target);
      counterObserver.unobserve(en.target);
    });
  }, { threshold: .6 });

  /* -------------------------------------------------------------- reveals */
  function initReveals() {
    $$('.count').forEach(el => {
      if (hasGsap && !reduceMotion) el.textContent = '0';
      counterObserver.observe(el);
    });
    if (!hasGsap || reduceMotion || !window.ScrollTrigger) return;
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 88%',
      once: true,
      onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, duration: .8, stagger: .08, ease: 'power3.out', overwrite: true })
    });
    ScrollTrigger.batch('.p-card', {
      start: 'top 90%',
      once: true,
      onEnter: batch => gsap.fromTo(batch, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: .9, stagger: .1, ease: 'power3.out', clearProps: 'transform' })
    });
    gsap.from('.gb-bar', {
      scaleY: 0, duration: 1, stagger: .1, ease: 'power3.out',
      scrollTrigger: { trigger: '.gpa-bars', start: 'top 85%', once: true }
    });
    gsap.from('.lang-meter span', {
      scaleX: 0, duration: 1.2, stagger: .12, ease: 'power3.out',
      scrollTrigger: { trigger: '.lang-grid', start: 'top 85%', once: true }
    });
    gsap.utils.toArray('.hb-glow').forEach((g, i) => {
      gsap.to(g, { yPercent: 30 + i * 15, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
    });
    gsap.to('.hero-visual', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  function heroEntrance() {
    if (!hasGsap || reduceMotion) return;
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.from('.hn-text', { yPercent: 60, opacity: 0, duration: 1 })
      .from(['.status-pill', '.hi-line', '.hero-name-th', '.role-line', '.hero-desc'], { y: 22, opacity: 0, duration: .7, stagger: .07 }, '-=.75')
      .from('.hero-btns > *', { y: 18, opacity: 0, duration: .6, stagger: .06, clearProps: 'opacity' }, '-=.5')
      .from('.hero-socials > *', { y: 12, opacity: 0, duration: .5, stagger: .05 }, '-=.45')
      .from('.portrait-frame', { scale: .9, opacity: 0, duration: 1.1 }, 0.1)
      .from('.orbit-chip', { scale: .6, opacity: 0, duration: .6, stagger: .08, ease: 'back.out(2)' }, '-=.7')
      .from('.term-card', { y: 30, opacity: 0, duration: .7 }, '-=.5')
      .from('.stat', { y: 30, opacity: 0, duration: .7, stagger: .07, clearProps: 'all' }, '-=.6');
  }

  /* ------------------------------------------------------------ copy email */
  const EMAIL = 'naphatcharakan.p68@rsu.ac.th';
  function copyEmail() {
    const done = () => toast(currentLang === 'en' ? 'Email copied ✓' : 'คัดลอกอีเมลแล้ว ✓');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(EMAIL).then(done, () => toast(EMAIL));
    } else {
      toast(EMAIL);
    }
  }
  $('#copyEmail').addEventListener('click', copyEmail);

  /* ------------------------------------------------------- command palette */
  const cmdk = $('#cmdk');
  const cmdkInput = $('#cmdkInput');
  const cmdkList = $('#cmdkList');
  let cmdkItems = [];
  let cmdkIndex = 0;

  function goTo(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }
  function goToProject(id) {
    filterProjects('all');
    setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      el.classList.remove('flash');
      void el.offsetWidth;
      el.classList.add('flash');
    }, hasGsap && !reduceMotion ? 420 : 0);
  }

  function commands() {
    const th = currentLang === 'th';
    const sections = [
      ['about', 'About', 'เกี่ยวกับ', 'fa-user'], ['experience', 'Experience', 'ประสบการณ์', 'fa-briefcase'],
      ['skills', 'Skills', 'ทักษะ', 'fa-wand-magic-sparkles'], ['projects', 'Projects', 'โปรเจกต์', 'fa-code'],
      ['education', 'Education', 'การศึกษา', 'fa-graduation-cap'], ['languages', 'Languages', 'ภาษา', 'fa-language'],
      ['contact', 'Contact', 'ติดต่อ', 'fa-paper-plane']
    ].map(([id, en, t, ic]) => ({ group: th ? 'ไปที่' : 'Go to', label: th ? t : en, icon: 'fas ' + ic, keys: id + ' ' + en + ' ' + t, run: () => goTo(id) }));
    const projects = cards.map(c => ({
      group: th ? 'โปรเจกต์' : 'Projects', label: c.dataset.name, icon: 'fas fa-folder-open',
      keys: c.dataset.name + ' ' + c.dataset.cat, run: () => goToProject(c.id)
    }));
    const isDark = root.getAttribute('data-theme') === 'dark';
    const actions = [
      { label: th ? (isDark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด') : (isDark ? 'Switch to light mode' : 'Switch to dark mode'), icon: isDark ? 'fas fa-sun' : 'fas fa-moon', keys: 'theme dark light mode ธีม มืด สว่าง', run: toggleTheme },
      { label: th ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย', icon: 'fas fa-globe', keys: 'language lang thai english ภาษา ไทย อังกฤษ', run: toggleLang },
      { label: th ? 'คัดลอกอีเมล' : 'Copy email address', icon: 'fas fa-copy', keys: 'copy email mail อีเมล', run: copyEmail },
      { label: th ? 'ดาวน์โหลด CV' : 'Download CV', icon: 'fas fa-file-arrow-down', keys: 'cv resume download pdf เรซูเม่', run: () => $('#cvDownloadBtn').click() },
      { label: th ? 'เปิดหน้า CV' : 'Open printable CV', icon: 'fas fa-file-lines', keys: 'cv resume print view', run: () => { window.location.href = 'cv.html'; } },
      { label: th ? 'เปิด GitHub' : 'Open GitHub', icon: 'fab fa-github', keys: 'github code repo', run: () => window.open('https://github.com/novterss', '_blank', 'noopener') },
      { label: th ? 'เล่นอินโทรอีกครั้ง' : 'Replay intro', icon: 'fas fa-rotate-right', keys: 'intro replay code อินโทร', run: () => intro.replay('code') },
      { label: th ? 'เล่นอินโทรแบบ X-ray' : 'Replay X-ray intro', icon: 'fas fa-layer-group', keys: 'intro replay xray render อินโทร', run: () => intro.replay('xray') }
    ].map(a => Object.assign({ group: th ? 'คำสั่ง' : 'Actions' }, a));
    return actions.concat(sections, projects);
  }

  function renderCmdk() {
    const q = cmdkInput.value.trim().toLowerCase();
    const all = commands();
    cmdkItems = q ? all.filter(c => (c.label + ' ' + c.keys).toLowerCase().includes(q)) : all;
    cmdkIndex = Math.min(cmdkIndex, Math.max(cmdkItems.length - 1, 0));
    cmdkList.innerHTML = '';
    if (!cmdkItems.length) {
      const li = document.createElement('li');
      li.className = 'cmdk-empty';
      li.textContent = currentLang === 'th' ? 'ไม่พบผลลัพธ์' : 'No results';
      cmdkList.appendChild(li);
      return;
    }
    let group = '';
    cmdkItems.forEach((c, i) => {
      if (c.group !== group) {
        group = c.group;
        const g = document.createElement('li');
        g.className = 'cmdk-group';
        g.setAttribute('role', 'presentation');
        g.textContent = group;
        cmdkList.appendChild(g);
      }
      const li = document.createElement('li');
      li.className = 'cmdk-item';
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(i === cmdkIndex));
      const icon = document.createElement('i');
      icon.className = c.icon;
      const span = document.createElement('span');
      span.textContent = c.label;
      li.append(icon, span);
      if (i === cmdkIndex) {
        const hint = document.createElement('span');
        hint.className = 'hint';
        hint.textContent = '⏎';
        li.appendChild(hint);
      }
      li.addEventListener('pointermove', () => { if (cmdkIndex !== i) { cmdkIndex = i; renderCmdk(); } });
      li.addEventListener('click', () => runCmd(i));
      cmdkList.appendChild(li);
    });
    const sel = $('.cmdk-item[aria-selected="true"]', cmdkList);
    if (sel) sel.scrollIntoView({ block: 'nearest' });
  }
  function runCmd(i) {
    const c = cmdkItems[i];
    if (!c) return;
    closeCmdk(false);
    c.run();
  }
  function openCmdk() {
    if (intro.running) return;
    lastFocus = document.activeElement;
    cmdk.hidden = false;
    cmdkInput.value = '';
    cmdkIndex = 0;
    renderCmdk();
    cmdkInput.focus();
    document.body.style.overflow = 'hidden';
  }
  function closeCmdk(restoreFocus = true) {
    if (cmdk.hidden) return;
    cmdk.hidden = true;
    document.body.style.overflow = '';
    if (restoreFocus && lastFocus) lastFocus.focus();
  }
  $('#cmdkBtn').addEventListener('click', openCmdk);
  cmdk.addEventListener('click', e => { if (e.target === cmdk) closeCmdk(); });
  cmdkInput.addEventListener('input', () => { cmdkIndex = 0; renderCmdk(); });
  cmdkInput.addEventListener('keydown', e => {
    const n = Math.max(cmdkItems.length, 1);
    if (e.key === 'ArrowDown') { e.preventDefault(); cmdkIndex = (cmdkIndex + 1) % n; renderCmdk(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); cmdkIndex = (cmdkIndex - 1 + n) % n; renderCmdk(); }
    else if (e.key === 'Enter') { e.preventDefault(); runCmd(cmdkIndex); }
  });

  /* ==================================================================
     X-ray intro: Parse → Style → Layout → Paint → Composite
     ================================================================== */
  const xr = (function () {
    const css = $('#main-css');
    const hud = $('#xr-hud');
    const log = $('#xr-log');
    const labels = $('#xr-labels');
    const app = $('#app');
    const LAYERS = ['.nav', '.hero-inner', '.stats'];
    let tl = null;
    const api = { running: false };

    function step(n) {
      $$('#xr-hud li').forEach((li, i) => {
        li.classList.toggle('on', i === n);
        li.classList.toggle('done', i < n);
      });
    }
    function line(html) {
      const p = document.createElement('div');
      p.innerHTML = html;
      log.appendChild(p);
      while (log.children.length > 7) log.removeChild(log.firstChild);
      return p;
    }
    function cleanup() {
      if (tl) { tl.kill(); tl = null; }
      clearTimeout(window.__xrFailsafe);
      css.media = 'all';
      labels.innerHTML = '';
      log.innerHTML = '';
      $$('.xr-layer-tag').forEach(t => t.remove());
      root.classList.remove('xr-on', 'xr-raw', 'xr-mono', 'xr-boxes', 'xr-paint', 'xr-3d', 'xr-code', 'xr-xray');
      root.style.overflow = '';
      root.style.background = '';
      if ('scrollRestoration' in history) history.scrollRestoration = 'auto';
      document.body.style.perspective = '';
      if (hasGsap) {
        gsap.killTweensOf([app].concat(LAYERS));
        gsap.set([app, 'main', '#hero'].concat(LAYERS), { clearProps: 'transform,transformOrigin,transformStyle,overflow' });
        gsap.set([hud, log], { clearProps: 'all' });
      }
      api.running = false;
      safeSet('sessionStorage', 'xr-played', '1');
    }
    function finish() {
      const wasRunning = api.running;
      cleanup();
      if (wasRunning) {
        heroEntrance();
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      }
    }

    function drawBoxes() {
      const targets = [
        ['.nav-inner', 'header.nav'], ['.status-pill', 'div.pill'], ['.hero-name', 'h1'], ['.role-line', 'p.role'],
        ['.hero-desc', 'p'], ['.hero-btns', 'div.flex'], ['.portrait-frame', 'img'], ['.term-card', 'pre'], ['.stats', 'section.grid']
      ];
      const out = [];
      targets.forEach(([sel, name]) => {
        const el = $(sel);
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.bottom < 0 || r.top > window.innerHeight) return;
        const box = document.createElement('div');
        box.className = 'xr-box';
        Object.assign(box.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
        const tag = document.createElement('div');
        tag.className = 'xr-tag';
        tag.innerHTML = name + '<b>' + Math.round(r.width) + '×' + Math.round(r.height) + '</b>';
        Object.assign(tag.style, { left: r.left + 'px', top: Math.max(r.top, 16) + 'px' });
        labels.append(box, tag);
        out.push(box, tag);
      });
      return out;
    }

    function layerTag(el, text) {
      if (!el) return;
      const t = document.createElement('span');
      t.className = 'xr-layer-tag';
      t.textContent = text;
      el.appendChild(t);
    }

    function run() {
      if (!hasGsap) { cleanup(); return; }
      api.running = true;
      clearTimeout(window.__xrFailsafe);
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
      window.__xrFailsafe = setTimeout(() => { if (window.__xrRestore) window.__xrRestore(); api.running = false; }, 45000);
      window.scrollTo(0, 0);
      root.style.overflow = 'hidden';
      log.innerHTML = '';
      labels.innerHTML = '';
      gsap.set([hud, log], { autoAlpha: 1, y: 0 });

      const nodes = document.getElementsByTagName('*').length;
      const isMobile = window.innerWidth < 720;
      const counter = { n: 0 };
      root.classList.add('xr-raw');
      tl = gsap.timeline({ id: 'xr', onComplete: finish });

      // 01 PARSE — raw HTML, stylesheet switched off
      const PARSE_TIME = 6;
      const parsed = ['&lt;head&gt;', '&lt;nav#navbar&gt;', '&lt;section#hero&gt;', '&lt;h1.hero-name&gt;', '&lt;img kan.webp&gt;',
        '&lt;section#about&gt;', '&lt;section#experience&gt;', '&lt;section#skills&gt;', '&lt;section#projects&gt;',
        '&lt;section#education&gt;', '&lt;section#contact&gt;', '&lt;script gsap.min.js&gt;'];
      tl.call(() => {
        step(0);
        line('<b>fetch</b> index.html · 200 OK');
        const p = line('<b>parse</b> building DOM · <span class="n">0</span> nodes');
        gsap.to(counter, { n: nodes, duration: PARSE_TIME - .6, ease: 'power1.inOut', onUpdate: () => { $('.n', p).textContent = Math.round(counter.n); } });
      });
      parsed.forEach((tag, i) => {
        tl.call(() => line('<span class="dim">  ↳ ' + tag + '</span>'), null, .3 + i * ((PARSE_TIME - 1) / parsed.length));
      });
      tl.call(() => line('<b>parse</b> done · <span class="ok">no stylesheet applied yet</span>'), null, PARSE_TIME - .5)
        .to({}, { duration: .5 })

        // 02 STYLE — fonts, sizes and layout arrive, but nothing is painted yet
        .call(() => {
          step(1);
          root.classList.remove('xr-raw');
          root.classList.add('xr-mono');
          css.media = 'all';
          let rules = 0;
          try { rules = css.sheet ? css.sheet.cssRules.length : 0; } catch (e) { rules = 0; }
          line('<b>style</b> style.css → ' + (rules || 'all') + ' rules matched');
        })
        .to({}, { duration: .75 })

        // 03 LAYOUT — box model made visible
        .call(() => {
          step(2);
          root.classList.add('xr-boxes');
          const els = drawBoxes();
          if (els.length) gsap.from(els, { opacity: 0, scale: .96, duration: .35, stagger: .03, ease: 'power2.out' });
          line('<b>layout</b> reflow · ' + window.innerWidth + '×' + window.innerHeight + ' viewport');
        })
        .to({}, { duration: 1.0 })

        // 04 PAINT — colours flood back in
        .call(() => {
          step(3);
          labels.innerHTML = '';
          root.classList.remove('xr-boxes');
          root.classList.add('xr-paint');
          requestAnimationFrame(() => root.classList.remove('xr-mono'));
          const sweep = document.createElement('div');
          Object.assign(sweep.style, {
            position: 'absolute', left: 0, right: 0, top: '-30%', height: '30%',
            background: 'linear-gradient(transparent, rgba(56,189,248,.18), transparent)'
          });
          labels.appendChild(sweep);
          gsap.to(sweep, { top: '110%', duration: .8, ease: 'power2.inOut' });
          line('<b>paint</b> rasterising layers · <span class="ok">60fps</span>');
        })
        .to({}, { duration: .85 });

      if (reduceMotion) {
        // calm variant: no 3D movement
        tl.call(() => { step(4); labels.innerHTML = ''; root.classList.remove('xr-paint'); line('<b>composite</b> layers → GPU <span class="ok">✓</span>'); })
          .to({}, { duration: .6 })
          .to([hud, log], { autoAlpha: 0, duration: .3 });
        return;
      }

      // 05 COMPOSITE — split the page into GPU layers, then stack them back
      tl.call(() => {
          step(4);
          labels.innerHTML = '';
          root.classList.remove('xr-paint', 'xr-mono');
          root.classList.add('xr-3d');
          root.style.background = 'var(--bg-alt)';
          document.body.style.perspective = '1600px';
          gsap.set(['main', '#hero'], { transformStyle: 'preserve-3d', overflow: 'visible' });
          layerTag($('.nav-inner'), 'layer 3 · nav (position: fixed)');
          layerTag($('.hero-inner'), 'layer 2 · content');
          layerTag($('.hero-bg'), 'layer 1 · background');
          line('<b>composite</b> 3 layers → GPU <span class="ok">✓</span>');
        })
        .to(app, {
          rotationX: isMobile ? 42 : 54, rotationZ: isMobile ? -16 : -24, scale: isMobile ? .66 : .72, y: isMobile ? 30 : 40,
          transformOrigin: '50% ' + Math.round(window.innerHeight * .45) + 'px', duration: .9, ease: 'power3.inOut'
        })
        .to('.nav', { z: isMobile ? 180 : 280, duration: .9, ease: 'power3.inOut' }, '<')
        .to('.hero-inner', { z: isMobile ? 110 : 170, duration: .9, ease: 'power3.inOut' }, '<')
        .to('.stats', { z: isMobile ? 60 : 90, duration: .9, ease: 'power3.inOut' }, '<')
        .to({}, { duration: .9 })
        .call(() => $$('.xr-layer-tag').forEach(t => gsap.to(t, { opacity: 0, duration: .2 })))
        .to(LAYERS, { z: 0, duration: .8, ease: 'power3.inOut' })
        .to(app, { rotationX: 0, rotationZ: 0, scale: 1, y: 0, duration: .8, ease: 'power3.inOut' }, '<')
        .to([hud, log], { autoAlpha: 0, y: 20, duration: .3 }, '-=.2');
    }

    api.timeline = () => tl;
    api.start = function () {
      if (root.classList.contains('xr-on')) run();
    };
    api.skip = function () {
      if (api.running) finish();
    };
    api.replay = function () {
      if (api.running || !hasGsap) return;
      closeLightbox();
      closeCmdk(false);
      window.scrollTo(0, 0);
      root.classList.add('xr-on', 'xr-xray');
      root.classList.remove('xr-code');
      css.media = 'not all';
      requestAnimationFrame(run);
    };
    return api;
  })();

  /* ==================================================================
     Code intro (default): raw HTML → typo'd CSS → error flood →
     "just kidding" → fixed CSS → boot to port → LOADING SUCCESS
     Timing: 6s raw + 4s typing + 5s errors + 4s fix + 5s boot + 3s success = 27s
     ================================================================== */
  const ci = (function () {
    const css = $('#main-css');
    const stage = $('#ci');
    const hud = $('#xr-hud');
    const api = { running: false };
    let tl = null;
    let heroDone = false;

    const escHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    function greeting() {
      const h = new Date().getHours();
      const part = h < 5 ? 'up late' : h < 12 ? 'good morning' : h < 17 ? 'good afternoon' : h < 21 ? 'good evening' : 'up late';
      const ua = navigator.userAgent;
      const br = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox'
        : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'web';
      const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS'
        : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
      return '/* ' + part + ', ' + br + (os ? ' on ' + os : '') + ' user 👋 */';
    }

    // [text, class, isError]
    const wrongCss = () => [
      [[greeting(), 'c']],
      [['body', 'k'], [' {', 'pu']],
      [['  '], ['colour', 'p', 1], [': ', 'pu'], ['blu', 'v', 1], [';', 'pu']],
      [['  '], ['dispaly', 'p', 1], [': ', 'pu'], ['flex', 'v', 1]],
      [['  '], ['font-famliy', 'p', 1], [': ', 'pu'], ['Comic Sans', 'v', 1], [';', 'pu']],
      [['  '], ['margin', 'p'], [': ', 'pu'], ['-9999px', 'v', 1], [';', 'pu']],
      [['}}', 'pu', 1]]
    ];
    const fixedCss = [
      [['/* fixed — 0 problems */', 'c']],
      [['body', 'k'], [' {', 'pu']],
      [['  '], ['color', 'p'], [': ', 'pu'], ['#0b1220', 'v'], [';', 'pu']],
      [['  '], ['display', 'p'], [': ', 'pu'], ['flex', 'v'], [';', 'pu']],
      [['  '], ['font-family', 'p'], [': ', 'pu'], ['"Inter", sans-serif', 'v'], [';', 'pu']],
      [['  '], ['margin', 'p'], [': ', 'pu'], ['0', 'v'], [';', 'pu']],
      [['}', 'pu']],
      [[':root', 'k'], [' { ', 'pu'], ['--brand', 'p'], [': ', 'pu'], ['#2563eb', 'v'], [' }', 'pu']]
    ];
    const errors = [
      ["Unknown property <em>'colour'</em>. Did you mean <em>'color'</em>?", 'style.css:3:3'],
      ["<em>'blu'</em> is not a valid color.", 'style.css:3:11'],
      ["Unknown property <em>'dispaly'</em>. Did you mean <em>'display'</em>?", 'style.css:4:3'],
      ["Expected <em>';'</em> after <em>'flex'</em>.", 'style.css:4:16'],
      ["Unknown property <em>'font-famliy'</em>. Did you mean <em>'font-family'</em>?", 'style.css:5:3'],
      ["<em>Comic Sans</em> is not allowed in production.", 'style.css:5:16'],
      ["<em>margin: -9999px</em> pushed the whole page off-screen.", 'style.css:6:11'],
      ["Unexpected <em>'}'</em>.", 'style.css:7:2'],
      ['Stylesheet failed to parse. Rendering without CSS.', 'renderer'],
      ['Layout engine is confused.', 'renderer']
    ];
    const titles = ['ERROR', 'SYSTEM WARNING', 'ALERT', 'ERROR', 'CRITICAL'];

    function render(lines, k, opts) {
      let left = k;
      let out = '';
      lines.forEach((tokens, li) => {
        if (left <= 0 && li > 0) return;
        let line = '';
        let lineDone = true;
        tokens.forEach(([text, cls, err]) => {
          if (left <= 0) { lineDone = false; return; }
          const part = text.slice(0, left);
          left -= part.length;
          if (part.length < text.length) lineDone = false;
          const classes = [cls || '', err && opts.squiggle && part.length === text.length ? 'sq' : ''].join(' ').trim();
          line += classes ? '<span class="' + classes + '">' + escHtml(part) + '</span>' : escHtml(part);
        });
        const isLast = left <= 0 || li === lines.length - 1;
        if (lineDone && opts.ticks && (left > 0 || li < lines.length - 1 || k >= opts.total)) line += '<span class="tick">✓</span>';
        if (isLast && opts.caret) line += '<span class="caret"></span>';
        out += '<span class="ln" data-n="' + (li + 1) + '">' + (line || ' ') + '</span>';
        left -= 1; // newline
      });
      return out;
    }

    function totalChars(lines) {
      return lines.reduce((n, tokens) => n + tokens.reduce((m, [t]) => m + t.length, 0) + 1, 0);
    }

    // a tween that "types" with human-ish rhythm over `duration` seconds
    function typeInto(pre, lines, duration, opts) {
      const total = totalChars(lines);
      const flat = lines.map(tokens => tokens.map(([t]) => t).join('') + '\n').join('');
      const times = [];
      let acc = 0;
      for (let i = 0; i < flat.length; i++) {
        const ch = flat[i];
        acc += ch === '\n' ? 2.6 : ch === ' ' ? 0.7 : 0.6 + Math.random() * 0.9;
        times.push(acc);
      }
      const scale = duration / acc;
      const o = { t: 0 };
      const o2 = Object.assign({ total }, opts);
      return gsap.to(o, {
        t: duration, duration, ease: 'none',
        onUpdate() {
          let k = 0;
          while (k < times.length && times[k] * scale <= o.t) k++;
          pre.innerHTML = render(lines, k, o2);
        },
        onComplete() { pre.innerHTML = render(lines, total, o2); }
      });
    }

    function editor(name, extraClass) {
      const ed = document.createElement('div');
      ed.className = 'ed' + (extraClass ? ' ' + extraClass : '');
      ed.innerHTML = '<div class="ed-bar"><i></i><i></i><i></i><span class="ed-tab">' + name + '</span>' +
        '<span class="ed-state">typing…</span></div><pre></pre><span class="enter">⏎ Enter</span>';
      stage.appendChild(ed);
      return ed;
    }

    function sysWindow(cls, title, body, loc) {
      const w = document.createElement('div');
      w.className = 'sys ' + cls;
      w.innerHTML = '<div class="sys-h"><b>!</b>' + title + '</div><div class="sys-b">' + body +
        (loc ? '<span class="sys-loc">' + loc + '</span>' : '') + '</div>';
      stage.appendChild(w);
      return w;
    }

    // default: error windows imitating different systems (generic look, no real logos)
    // ?errors=red → glowing red system windows instead
    const errStyle = /[?&]errors=red(?:&|$)/.test(location.search) ? 'red' : 'os';
    const strip = s => s.replace(/<[^>]+>/g, '');
    const OS_KINDS = ['win', 'win', 'mac', 'code', 'crash', 'term'];
    const OS_SIZE = { win: [330, 150], mac: [300, 170], code: [360, 96], crash: [300, 200], term: [380, 140] };
    function osWindow(kind, msg, loc, i) {
      const w = document.createElement('div');
      w.className = 'osw osw-' + kind;
      const plain = strip(msg);
      if (kind === 'win') {
        w.innerHTML = '<div class="w-bar"><span>style.css — Error</span><b>✕</b></div>' +
          '<div class="w-body"><i class="fas fa-circle-xmark"></i><p>' + plain + '</p></div><div class="w-btns"><span>OK</span></div>';
      } else if (kind === 'mac') {
        w.innerHTML = '<div class="m-dots"><i></i><i></i><i></i></div><i class="fas fa-triangle-exclamation m-ic"></i>' +
          '<b>“style.css” can’t be rendered.</b><p>' + plain + '</p><div class="m-btns"><span>Ignore</span><span class="m-ok">OK</span></div>';
      } else if (kind === 'code') {
        w.innerHTML = '<i class="fas fa-circle-xmark"></i><div><b>CSS</b> ' + plain + '<small>' + (loc || 'style.css') + '</small></div><span class="c-x">✕</span>';
      } else if (kind === 'crash') {
        w.innerHTML = '<div class="cr-tab"><span>Kan · Portfolio</span>✕</div><div class="cr-body"><i class="fas fa-face-frown"></i>' +
          '<b>Oh no! This page crashed.</b><p>Something went wrong while rendering it.</p><span class="cr-btn">Reload</span></div>';
      } else {
        const traces = ['panic: stylesheet is on fire', 'TypeError: Cannot read properties of undefined (reading \'color\')',
          'Error: ENOSTYLE: no such stylesheet', 'Segmentation fault (core dumped)', 'RangeError: margin -9999px out of range'];
        w.innerHTML = '<span class="t-red">' + traces[i % traces.length] + '</span>\n    at render (style.css:' + (3 + i % 5) + ':' + (2 + i % 9) +
          ')\n    at paint (browser:1:1)\n<span class="t-dim">exit code 1</span>';
      }
      stage.appendChild(w);
      return w;
    }

    function cleanup() {
      if (tl) { tl.kill(); tl = null; }
      clearTimeout(window.__xrFailsafe);
      gsap.killTweensOf(stage);
      stage.innerHTML = '';
      gsap.set(stage, { clearProps: 'all' });
      css.media = 'all';
      root.classList.remove('xr-on', 'xr-raw', 'xr-code', 'xr-xray');
      root.style.overflow = '';
      if ('scrollRestoration' in history) history.scrollRestoration = 'auto';
      gsap.set(hud, { clearProps: 'all' });
      api.running = false;
      safeSet('sessionStorage', 'xr-played', '1');
    }
    function finish() {
      const wasRunning = api.running;
      cleanup();
      if (wasRunning) {
        if (!heroDone) heroEntrance();
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      }
    }

    function run() {
      if (!hasGsap) { cleanup(); return; }
      api.running = true;
      heroDone = false;
      clearTimeout(window.__xrFailsafe);
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
      window.__xrFailsafe = setTimeout(() => { if (window.__xrRestore) window.__xrRestore(); api.running = false; }, 45000);
      window.scrollTo(0, 0);
      root.style.overflow = 'hidden';
      root.classList.add('xr-raw');
      stage.innerHTML = '';
      gsap.set(hud, { autoAlpha: 1, y: 0 });

      const W = window.innerWidth;
      const H = window.innerHeight;
      const small = W < 640;
      const flash = document.createElement('div');
      flash.className = 'flash';
      stage.appendChild(flash);
      const count = document.createElement('div');
      count.className = 'count';
      count.textContent = '⚠ 0 problems';
      stage.appendChild(count);

      tl = gsap.timeline({ id: 'ci', onComplete: finish });

      /* ---- 1) raw HTML only (0 → 6s), then an editor types broken CSS (6 → 10s) ---- */
      const ed = editor('style.css');
      const pre = $('pre', ed);
      const state = $('.ed-state', ed);
      const enter = $('.enter', ed);
      gsap.set(ed, { autoAlpha: 0, y: 30 });
      tl.to(ed, { autoAlpha: 1, y: 0, duration: .4, ease: 'power3.out' }, 6)
        .add(typeInto(pre, wrongCss(), 3, { squiggle: true, caret: true }), 6.3)
        .call(() => { state.textContent = '6 problems'; state.className = 'ed-state bad'; }, null, 9.4)
        .to(enter, { autoAlpha: 1, duration: .15 }, 9.4)
        .to(enter, { scale: .86, duration: .08, yoyo: true, repeat: 1 }, 9.75);

      /* ---- 2) error windows pile up until the screen is fully covered (10 → 15s) ---- */
      // Scatter windows at random spots and angles until every sample point of the
      // viewport is covered, so nothing behind them shows through.
      const baseW = small ? 230 : 330;
      const baseH = small ? 118 : 150;
      const STEP = small ? 12 : 16;
      const pts = [];
      for (let px = 0; px <= W; px += STEP) for (let py = 0; py <= H; py += STEP) pts.push([Math.min(px, W - 1), Math.min(py, H - 1)]);
      let open = pts.slice();
      const placed = [];
      const maxWins = small ? 70 : 110;
      const angle = () => {
        const r = Math.random();
        if (reduceMotion) return gsap.utils.random(-6, 6);
        if (r < .12) return gsap.utils.random(160, 200);          // upside down
        if (r < .30) return gsap.utils.random(-90, 90);           // steep tilt
        return gsap.utils.random(-28, 28);                        // casual tilt
      };
      while (open.length && placed.length < maxWins) {
        const [cx, cy] = open[Math.floor(Math.random() * open.length)];
        const kind = errStyle === 'os' ? OS_KINDS[Math.floor(Math.random() * OS_KINDS.length)] : 'sys';
        const s = gsap.utils.random(.95, 1.3) * (small ? .72 : 1);
        const w = (kind === 'sys' ? baseW / (small ? .72 : 1) : OS_SIZE[kind][0]) * s;
        const h = (kind === 'sys' ? baseH / (small ? .72 : 1) : OS_SIZE[kind][1]) * s;
        const rot = angle();
        const x = cx + gsap.utils.random(-w * .25, w * .25);
        const y = cy + gsap.utils.random(-h * .25, h * .25);
        const rad = rot * Math.PI / 180, cos = Math.cos(-rad), sin = Math.sin(-rad);
        const hw = w / 2 - 6, hh = h / 2 - 6;
        open = open.filter(([px, py]) => {
          const dx = px - x, dy = py - y;
          const lx = dx * cos - dy * sin, ly = dx * sin + dy * cos;
          return !(Math.abs(lx) <= hw && Math.abs(ly) <= hh);
        });
        placed.push({ x, y, w, h, rot, kind });
      }
      const n = placed.length;
      const wins = [];
      // dark backing that fades in under the pile once it is nearly complete,
      // so even a pinhole between tilted windows never shows the page
      const backing = document.createElement('div');
      Object.assign(backing.style, { position: 'absolute', inset: '0', background: errStyle === 'os' ? '#008080' : '#1a0509', opacity: '0' });
      stage.appendChild(backing);
      tl.to(backing, { opacity: 1, duration: .5 }, 13.2);
      placed.forEach((p, i) => {
        const [msg, loc] = errors[i % errors.length];
        const w = p.kind === 'sys'
          ? sysWindow('err', '[ ' + titles[i % titles.length] + ' ]', msg, loc)
          : osWindow(p.kind, msg, loc, i);
        gsap.set(w, {
          width: p.w, height: p.h, left: p.x - p.w / 2, top: p.y - p.h / 2,
          rotation: p.rot, autoAlpha: 0, scale: .8
        });
        wins.push(w);
        const at = 10 + 3.5 * Math.pow(i / Math.max(n - 1, 1), 0.85);
        tl.to(w, { autoAlpha: 1, scale: 1, duration: .16, ease: 'back.out(2)' }, at)
          .call(() => { count.textContent = '⚠ ' + (6 + i + 1) + ' problems'; }, null, at);
      });
      tl.to(count, { autoAlpha: 1, duration: .2 }, 10);
      if (!reduceMotion) {
        tl.to(stage, { x: 'random(-7, 7)', y: 'random(-5, 5)', duration: .05, repeat: 15, yoyo: true, ease: 'none' }, 13.1)
          .set(stage, { x: 0, y: 0 }, 13.9);
      }
      const kidding = sysWindow('big', '[ SYSTEM ]', 'Just kidding 😄<br><em>let me fix that.</em>');
      gsap.set(kidding, { autoAlpha: 0, scale: .8, xPercent: -50, yPercent: -50 });
      tl.to(kidding, { autoAlpha: 1, scale: 1, duration: .3, ease: 'back.out(1.8)' }, 14.1);

      /* ---- 3) fix it (15 → 19s) ---- */
      const falling = wins.concat([kidding, ed]);
      tl.to(backing, { opacity: 0, duration: .5 }, 15.1);
      if (reduceMotion) {
        tl.to(falling, { autoAlpha: 0, duration: .4 }, 15);
      } else {
        tl.to(falling, { y: () => H + 500, rotation: () => gsap.utils.random(-40, 40), duration: .8, ease: 'power2.in', stagger: .01 }, 15);
      }
      const fix = editor('style.css — fixed', 'fix');
      const pre2 = $('pre', fix);
      const state2 = $('.ed-state', fix);
      $('.enter', fix).remove();
      gsap.set(fix, { autoAlpha: 0, scale: .92, xPercent: -50, yPercent: -50 });
      tl.to(fix, { autoAlpha: 1, scale: 1, duration: .35, ease: 'power3.out' }, 15.45)
        .add(typeInto(pre2, fixedCss, 2.6, { ticks: true, caret: true }), 15.7)
        .call(() => {
          state2.textContent = '✓ 0 problems'; state2.className = 'ed-state good';
          count.textContent = '✓ 0 problems'; count.classList.add('ok');
        }, null, 18.4)
        .to(fix, { scale: 1.02, duration: .15, yoyo: true, repeat: 1 }, 18.4);

      /* ---- 4) boot to port (19 → 24s) ---- */
      const boot = sysWindow('boot', '[ SYSTEM ] BOOTING PORTFOLIO', [
        '<span class="bl"><span class="hl">$</span> npm run dev</span>',
        '<span class="bl">› compiling style.css ........... <span class="ok">done</span></span>',
        '<span class="bl">› optimising 25 images .......... <span class="ok">done</span></span>',
        '<span class="bl">› loading 11 projects ........... <span class="ok">done</span></span>',
        '<span class="bl">› connecting to port 5500 ....... <span class="ok">ok</span></span>',
        '<div class="stat"><div><span>NAME</span> <b>Kan</b></div><div><span>ROLE</span> <b>Web Developer</b></div>' +
        '<div><span>STUDY</span> <b>Year 2 · CS @ RSU</b></div><div><span>GPAX</span> <b>3.68</b></div>' +
        '<div><span>SKILLS</span> <b>47</b></div><div><span>STATUS</span> <b>Open to internship</b></div></div>',
        '<span class="bl"><span class="ok">✓ ready on</span> <span class="hl">http://localhost:5500</span></span>',
        '<div class="bar"><i></i></div><div class="pct"><span>loading</span><span class="p">0%</span></div>'
      ].join(''));
      gsap.set(boot, { autoAlpha: 0, scale: .92, xPercent: -50, yPercent: -50 });
      const lines = $$('.bl', boot);
      const pct = { v: 0 };
      tl.to([fix, count], { autoAlpha: 0, scale: .95, duration: .3 }, 19)
        .to(boot, { autoAlpha: 1, scale: 1, duration: .35, ease: 'power3.out' }, 19.1);
      [19.4, 19.95, 20.5, 21.05, 21.6].forEach((at, i) => tl.to(lines[i], { autoAlpha: 1, duration: .15 }, at));
      tl.to($('.stat', boot), { autoAlpha: 1, duration: .3 }, 22.05)
        .to(lines[5], { autoAlpha: 1, duration: .15 }, 23.1)
        .to($('.bar i', boot), { width: '100%', duration: 4.4, ease: 'power1.inOut' }, 19.3)
        .to(pct, { v: 100, duration: 4.4, ease: 'power1.inOut', onUpdate: () => { $('.pct .p', boot).textContent = Math.round(pct.v) + '%'; } }, 19.3)
        .call(() => { $('.pct span', boot).textContent = 'ready'; }, null, 23.7);

      /* ---- 5) LOADING SUCCESS (24 → 27s) ---- */
      const lvl = document.createElement('div');
      lvl.className = 'lvl';
      lvl.innerHTML = '<div class="lvl-t">LOADING SUCCESS</div><div class="lvl-s">✓ novterss.github.io · online</div>';
      stage.appendChild(lvl);
      gsap.set(lvl, { xPercent: -50, yPercent: -50 });
      tl.to(boot, { autoAlpha: 0, scale: .7, y: -40, duration: .4, ease: 'power3.in' }, 24)
        .to(flash, { opacity: 1, duration: .35, ease: 'power2.in' }, 24.15)
        .call(() => { css.media = 'all'; root.classList.remove('xr-raw'); window.scrollTo(0, 0); }, null, 24.5)
        .fromTo(lvl, { autoAlpha: 0, scale: reduceMotion ? 1 : 1.35 }, { autoAlpha: 1, scale: 1, duration: .45, ease: 'power3.out' }, 24.45)
        .to(lvl, { autoAlpha: 0, scale: reduceMotion ? 1 : .96, duration: .5, ease: 'power2.in' }, 25.55)
        .to(flash, { opacity: 0, duration: 1.1, ease: 'power2.out' }, 25.7)
        .call(() => { heroDone = true; heroEntrance(); }, null, 25.8)
        .to(hud, { autoAlpha: 0, duration: .3 }, 26.3)
        .to({}, { duration: .1 }, 26.9);
    }

    api.timeline = () => tl;
    api.start = function () {
      if (root.classList.contains('xr-on')) run();
    };
    api.skip = function () {
      if (api.running) finish();
    };
    api.replay = function () {
      if (api.running || !hasGsap) return;
      window.scrollTo(0, 0);
      root.classList.add('xr-on', 'xr-raw', 'xr-code');
      root.classList.remove('xr-xray');
      css.media = 'not all';
      requestAnimationFrame(run);
    };
    return api;
  })();

  /* ---------------------------------------------------------- intro router */
  const intro = {
    get running() { return xr.running || ci.running; },
    skip() { xr.skip(); ci.skip(); },
    replay(mode) {
      if (intro.running || !hasGsap) return;
      closeLightbox();
      closeCmdk(false);
      setMenu(false);
      if (mode === 'xray') xr.replay(); else ci.replay();
    }
  };
  $('#xrSkip').addEventListener('click', () => intro.skip());
  $('#replayIntro').addEventListener('click', () => intro.replay('code'));
  window.__xr = xr; // debugging hooks
  window.__ci = ci;

  /* ------------------------------------------------- console easter egg */
  const EMAIL_ADDR = 'naphatcharakan.p68@rsu.ac.th';
  window.kan = {
    hire() {
      console.log('%c📬 Let\'s talk!', 'font:700 16px Inter,sans-serif;color:#2563eb');
      console.log('Email : ' + EMAIL_ADDR);
      console.log('CV    : ' + new URL('cv.html', location.href).href);
      console.log('GitHub: https://github.com/novterss');
      return 'Thanks for stopping by — Kan 🙌';
    },
    intro(mode) { intro.replay(mode === 'xray' ? 'xray' : 'code'); return 'replaying ' + (mode === 'xray' ? 'X-ray' : 'code') + ' intro…'; },
    about: 'Naphatcharakan (Kan) · CS @ Rangsit University · Web Developer'
  };
  console.log('%c<Kub/>', 'font:700 34px "JetBrains Mono",monospace;color:#2563eb;text-shadow:0 0 12px rgba(56,189,248,.6)');
  console.log('%c👋 Hiring? type %ckan.hire()%c — or replay the intro with %ckan.intro()',
    'font:500 13px Inter,sans-serif;color:#64748b', 'font:600 13px monospace;color:#0ea5e9', 'font:500 13px Inter,sans-serif;color:#64748b',
    'font:600 13px monospace;color:#0ea5e9');


  /* -------------------------------------------------------------- keyboard */
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (cmdk.hidden) openCmdk(); else closeCmdk();
      return;
    }
    if (intro.running && (e.key === 'Escape' || (xr.running && (e.key === 'Enter' || e.key === ' ')))) {
      e.preventDefault();
      intro.skip();
      return;
    }
    if (e.key === 'Escape') {
      closeLightbox();
      closeCmdk();
      setMenu(false);
    }
  });

  /* ---------------------------------------------------------------- boot */
  initReveals();
  if (root.classList.contains('xr-on')) {
    if (hasGsap) {
      requestAnimationFrame(() => (root.classList.contains('xr-xray') ? xr : ci).start());
    } else {
      $('#main-css').media = 'all';
      root.classList.remove('xr-on', 'xr-raw', 'xr-code', 'xr-xray');
      clearTimeout(window.__xrFailsafe);
    }
  } else {
    heroEntrance();
  }
})();
