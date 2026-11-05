// language toggle
let currentLang = 'en';

function safeGet(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}

function safeSet(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { /* storage unavailable */ }
}

function applyLang(lang) {
  currentLang = lang;
  document.querySelectorAll('[data-en]').forEach(el => {
    const value = el.getAttribute('data-' + lang);
    if (value === null) return;
    // a few translations carry inline markup such as <strong>
    if (value.includes('<')) el.innerHTML = value;
    else el.textContent = value;
  });
  document.documentElement.lang = lang;
  document.getElementById('langLabel').textContent = lang === 'en' ? 'TH' : 'EN';
  const cvBtn = document.getElementById('cvDownloadBtn');
  if (cvBtn) cvBtn.href = cvBtn.getAttribute('data-cv-' + lang);
  safeSet('lang', lang);
}

document.getElementById('langToggle').addEventListener('click', () => {
  applyLang(currentLang === 'en' ? 'th' : 'en');
  // restart the typewriter so it never slices a word from the other language
  charIndex = 0;
  deleting = false;
});

// typewriter effect
const roles = ['CS Student', 'Web Developer', 'Project Builder'];
const rolesth = ['นักศึกษา CS', 'นักพัฒนาเว็บ', 'ผู้สร้างโปรเจกต์'];
let roleIndex = 0;
let charIndex = 0;
let deleting = false;
const tw = document.getElementById('typewriter');

function typeLoop() {
  const list = currentLang === 'en' ? roles : rolesth;
  const word = list[roleIndex];
  if (!deleting) {
    tw.textContent = word.slice(0, charIndex + 1);
    charIndex++;
    if (charIndex === word.length) {
      deleting = true;
      setTimeout(typeLoop, 1800);
      return;
    }
  } else {
    tw.textContent = word.slice(0, charIndex - 1);
    charIndex--;
    if (charIndex === 0) {
      deleting = false;
      roleIndex = (roleIndex + 1) % list.length;
    }
  }
  setTimeout(typeLoop, deleting ? 60 : 100);
}
applyLang(safeGet('lang') === 'th' ? 'th' : 'en');
typeLoop();

// navbar scroll
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});

// mobile menu
const menuBtn = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
menuBtn.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// fade in on scroll
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
}, { threshold: 0.12 });

document.querySelectorAll('.about-card, .about-stats-row, .interests-block, .bio-p, .about-info-grid, .skill-cat, .proj-card, .edu-card, .contact-card, .sec-header').forEach(el => {
  el.classList.add('fade-in');
  observer.observe(el);
});

// active nav highlight
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 100) current = s.id;
  });
  document.querySelectorAll('.nav-link').forEach(link => {
    link.style.color = link.getAttribute('href') === '#' + current ? 'var(--primary)' : '';
    link.style.background = link.getAttribute('href') === '#' + current ? 'var(--primary-light)' : '';
  });
});

// back to top
const btt = document.getElementById('backToTop');
window.addEventListener('scroll', () => btt.classList.toggle('show', window.scrollY > 400));
btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// dark mode
const darkToggleBtn = document.getElementById('darkToggle');
const themeColorMeta = document.querySelector('meta[name="theme-color"]');

function applyTheme(isDark) {
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  darkToggleBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  darkToggleBtn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  if (themeColorMeta) themeColorMeta.setAttribute('content', isDark ? '#0f172a' : '#0ea5e9');
  safeSet('theme', isDark ? 'dark' : 'light');
}

// Load saved preference
const savedTheme = safeGet('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(savedTheme ? savedTheme === 'dark' : prefersDark);

darkToggleBtn.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  applyTheme(!isDark);
});

// scroll progress
const progressBar = document.getElementById('scrollProgress');
window.addEventListener('scroll', () => {
  const scrollTop  = window.scrollY;
  const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
  const pct        = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = pct + '%';
}, { passive: true });

// Lightbox functionality
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.querySelector('.lightbox-close');

// Open lightbox for all project and AFS images
document.querySelectorAll('.proj-screenshot-img, .afs-photo-img').forEach(img => {
  img.addEventListener('click', () => {
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightbox.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
  });
});

function closeLightbox() {
  lightbox.classList.remove('show');
  document.body.style.overflow = '';
}

// Close lightbox on clicking close button
if (lightboxClose) {
  lightboxClose.addEventListener('click', closeLightbox);
}

// Close lightbox on clicking outside the image
if (lightbox) {
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
}

// Close lightbox with the Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && lightbox && lightbox.classList.contains('show')) closeLightbox();
});
