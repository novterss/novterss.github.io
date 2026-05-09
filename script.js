// ===== LANGUAGE SYSTEM =====
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

// ===== TYPEWRITER =====
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

// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});

// ===== MOBILE MENU =====
const menuBtn = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
menuBtn.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ===== FADE-IN ON SCROLL =====
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
}, { threshold: 0.12 });

document.querySelectorAll('.about-card, .about-stats-row, .interests-block, .bio-p, .about-info-grid, .skill-cat, .proj-card, .edu-card, .contact-card, .sec-header').forEach(el => {
  el.classList.add('fade-in');
  observer.observe(el);
});

// ===== ACTIVE NAV HIGHLIGHT =====
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

// ===== CURRENTLY BUILDING =====
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
    statusEl.textContent = lang === 'th' ? 'กำลังมองหาที่ฝึกงาน 🔍' : 'Actively Seeking Internship 🔍';
    subEl.textContent    = lang === 'th' ? 'ต้องการประสบการณ์จริงด้าน Web Development — ติดต่อมาได้เลย!' : 'Looking for hands-on web development experience — feel free to reach out!';
    iconEl.innerHTML = '<i class="fas fa-briefcase"></i>';
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

// ===== BACK TO TOP =====
const btt = document.getElementById('backToTop');
window.addEventListener('scroll', () => btt.classList.toggle('show', window.scrollY > 400));
btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ===== DARK MODE TOGGLE =====
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

// ===== SCROLL PROGRESS BAR =====
const progressBar = document.getElementById('scrollProgress');
window.addEventListener('scroll', () => {
  const scrollTop  = window.scrollY;
  const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
  const pct        = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = pct + '%';
}, { passive: true });
