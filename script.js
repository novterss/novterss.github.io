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
  if (hasGsap && !reduceMotion) root.classList.add('anim');

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
    $('.lightbox-close').focus();
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
      { label: th ? 'เล่นอินโทรอีกครั้ง' : 'Replay intro', icon: 'fas fa-rotate-right', keys: 'intro replay xray render อินโทร', run: () => xr.replay() }
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
    if (xr.running) return;
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
      root.classList.remove('xr-on', 'xr-raw', 'xr-mono', 'xr-boxes', 'xr-paint', 'xr-3d');
      root.style.overflow = '';
      root.style.background = '';
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
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
      window.scrollTo(0, 0);
      root.style.overflow = 'hidden';
      log.innerHTML = '';
      labels.innerHTML = '';
      gsap.set([hud, log], { autoAlpha: 1, y: 0 });

      const nodes = document.getElementsByTagName('*').length;
      const isMobile = window.innerWidth < 720;
      const counter = { n: 0 };
      clearTimeout(window.__xrFailsafe);
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
      root.classList.add('xr-on');
      css.media = 'not all';
      requestAnimationFrame(run);
    };
    $('#xrSkip').addEventListener('click', () => api.skip());
    return api;
  })();

  $('#replayIntro').addEventListener('click', () => xr.replay());
  window.__xr = xr; // debugging hook

  /* -------------------------------------------------------------- keyboard */
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (cmdk.hidden) openCmdk(); else closeCmdk();
      return;
    }
    if (xr.running && (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      xr.skip();
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
      requestAnimationFrame(() => xr.start());
    } else {
      $('#main-css').media = 'all';
      root.classList.remove('xr-on');
      clearTimeout(window.__xrFailsafe);
    }
  } else {
    heroEntrance();
  }
})();
