/* ==========================================================================
   Hao Mu — site behaviour
   No dependencies. Everything degrades gracefully without JavaScript.
   ========================================================================== */

(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var header = document.getElementById('siteHeader');
  var progressBar = document.getElementById('progressBar');
  var themeToggle = document.getElementById('themeToggle');
  var langToggle = document.getElementById('langToggle');
  var menuToggle = document.getElementById('menuToggle');
  var nav = document.getElementById('primaryNav');
  var toast = document.getElementById('toast');
  var copyEmail = document.getElementById('copyEmail');
  var year = document.getElementById('year');

  var theme = root.getAttribute('data-theme') || 'light';
  var lang = root.getAttribute('lang') || 'en';

  /* ── Theme ───────────────────────────────────────────────────────────── */
  function applyTheme(next, persist) {
    theme = next;
    root.setAttribute('data-theme', theme);
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      m.setAttribute('content', theme === 'dark' ? '#111210' : '#f7f4ec');
      m.removeAttribute('media');
    });
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    }
    if (persist) {
      try { localStorage.setItem('hm-theme', theme); } catch (e) {}
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      applyTheme(theme === 'dark' ? 'light' : 'dark', true);
    });
  }
  applyTheme(theme, false);

  /* ── Language ────────────────────────────────────────────────────────── */
  function applyLang(next, persist) {
    lang = next;
    root.setAttribute('lang', lang);
    if (langToggle) {
      langToggle.setAttribute('aria-label', lang === 'en' ? '切换至中文' : 'Switch to English');
      langToggle.setAttribute('aria-pressed', lang === 'zh' ? 'true' : 'false');
    }
    if (persist) {
      try { localStorage.setItem('hm-lang', lang); } catch (e) {}
    }
    closeMenu();
  }

  if (langToggle) {
    langToggle.addEventListener('click', function () {
      applyLang(lang === 'en' ? 'zh' : 'en', true);
    });
  }
  applyLang(lang, false);

  /* ── Mobile menu ─────────────────────────────────────────────────────── */
  function openMenu() {
    body.classList.add('menu-open');
    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', 'true');
      menuToggle.setAttribute('aria-label', 'Close menu');
    }
  }

  function closeMenu() {
    body.classList.remove('menu-open');
    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open menu');
    }
  }

  function toggleMenu() {
    if (body.classList.contains('menu-open')) closeMenu();
    else openMenu();
  }

  if (menuToggle) menuToggle.addEventListener('click', toggleMenu);
  if (nav) {
    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeMenu();
    });
  }
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeMenu();
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 880) closeMenu();
  });

  /* ── Header, progress, scroll spy ────────────────────────────────────── */
  var sectionIds = ['about', 'news', 'research', 'projects', 'cv', 'contact'];
  var sectionLinks = {};
  sectionIds.forEach(function (id) {
    sectionLinks[id] = Array.prototype.slice.call(
      document.querySelectorAll('[data-section="' + id + '"]')
    );
  });

  var hero = document.getElementById('top');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var headerH = header ? header.offsetHeight : 0;

    if (header) header.classList.toggle('is-scrolled', y > 8);

    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    if (progressBar) progressBar.style.width = (max > 0 ? Math.min(1, y / max) * 100 : 0) + '%';

    if (hero && !reduceMotion) {
      hero.style.setProperty('--py', Math.min(y, window.innerHeight) * 0.14 + 'px');
    }

    var marker = y + headerH + Math.min(220, window.innerHeight * 0.28);
    var current = '';
    sectionIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.offsetTop <= marker) current = id;
    });
    sectionIds.forEach(function (id) {
      sectionLinks[id].forEach(function (link) {
        var active = id === current;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    });

    ticking = false;
  }

  function requestScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }

  window.addEventListener('scroll', requestScroll, { passive: true });
  window.addEventListener('resize', requestScroll);
  onScroll();

  /* ── Reveal on scroll ────────────────────────────────────────────────── */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { observer.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ── Copy email ──────────────────────────────────────────────────────── */
  var toastTimer = null;

  function showToast() {
    if (!toast) return;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 2200);
  }

  function legacyCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(area);
    return ok;
  }

  if (copyEmail) {
    copyEmail.addEventListener('click', function () {
      var text = copyEmail.getAttribute('data-email') || '';
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(showToast).catch(function () {
          if (legacyCopy(text)) showToast();
        });
      } else if (legacyCopy(text)) {
        showToast();
      }
    });
  }

  /* ── Dossier: light follows the pointer, card tilts a little ─────────── */
  var dossier = document.getElementById('dossier');
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  if (dossier && finePointer && !reduceMotion) {
    dossier.addEventListener('pointermove', function (event) {
      var rect = dossier.getBoundingClientRect();
      var px = (event.clientX - rect.left) / rect.width;
      var py = (event.clientY - rect.top) / rect.height;
      dossier.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      dossier.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      var rx = (0.5 - py) * 3.2;
      var ry = (px - 0.5) * 4.2;
      dossier.style.transform = 'perspective(1000px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
    });
    dossier.addEventListener('pointerleave', function () {
      dossier.style.transform = '';
    });
  }

  /* ── Misc ────────────────────────────────────────────────────────────── */
  if (year) year.textContent = String(new Date().getFullYear());

  // Keep an external link safe even if someone edits it later.
  document.querySelectorAll('a[target="_blank"]').forEach(function (a) {
    if (!a.rel) a.rel = 'noopener noreferrer';
  });
})();
