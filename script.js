// language toggle
let currentLang = 'en';

function applyLang(lang) {
  currentLang = lang;
  document.querySelectorAll('[data-en]').forEach(el => {
    el.textContent = el.getAttribute('data-' + lang);
  });
  document.getElementById('langLabel').textContent = lang === 'en' ? 'TH' : 'EN';
}

document.getElementById('langToggle').addEventListener('click', () => {
  applyLang(currentLang === 'en' ? 'th' : 'en');
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

// currently building status
function updateNowStatus() {
  const now = new Date();
  const statusEl = document.getElementById('nowStatus');
  const subEl    = document.getElementById('nowSub');
  const iconEl   = document.getElementById('nowIcon');
  if (!statusEl) return;
  const lang = currentLang;
  const phase1End = new Date(2026, 4, 6);
  const phase2End = new Date(2026, 4, 10);
  if (now < phase1End) {
    statusEl.textContent = lang === 'th' ? 'เตรียมตัวสอบ Final 📚' : 'Preparing for Final Exams 📚';
    subEl.textContent    = lang === 'th' ? 'สอบวันที่ 6 พ.ค. นี้ — ขอให้โชคดีด้วยนะ!' : 'Exams on May 6 — wish me luck!';
    iconEl.innerHTML = '<i class="fas fa-book-open"></i>';
  } else if (now < phase2End) {
    statusEl.textContent = lang === 'th' ? 'กำลังพัฒนา Doseries 💻' : 'Developing Doseries 💻';
    subEl.textContent    = lang === 'th' ? 'ปรับปรุงฟีเจอร์และประสิทธิภาพของแพลตฟอร์ม' : 'Improving features and performance of the platform';
    iconEl.innerHTML = '<i class="fas fa-code"></i>';
  } else {
    statusEl.textContent = lang === 'th' ? 'กำลังฝึกงานที่ บล.ทรีนีตี้ 🏢' : 'Interning at Trinity Securities 🏢';
    subEl.textContent    = lang === 'th' ? 'ฝึกงานที่ บริษัทหลักทรัพย์ ทรีนีตี้ จำกัด — เก็บเกี่ยวประสบการณ์จริง!' : 'Gaining real-world experience at Trinity Securities Company Limited!';
    iconEl.innerHTML = '<img src="https://i.ibb.co/FbW36hqr/image.png" alt="Trinity" style="width:56px;height:56px;object-fit:contain;" />';
  }
}
updateNowStatus();

// Update "Currently" on language switch
const _origApply = applyLang;
applyLang = lang => {
  _origApply(lang);
  updateNowStatus();
  const cvBtn = document.getElementById('cvDownloadBtn');
  if (cvBtn) cvBtn.href = cvBtn.getAttribute('data-cv-' + lang);
};

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
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Load saved preference
const savedTheme = localStorage.getItem('theme');
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
