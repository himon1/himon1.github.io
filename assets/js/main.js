/* ==========================================================================
   Hao Mu — site behaviour
   No dependencies. Everything degrades gracefully without JavaScript.
   ========================================================================== */

(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');
  var body = document.body;
  var header = document.getElementById('siteHeader');
  var progressBar = document.getElementById('progressBar');
  var themeToggle = document.getElementById('themeToggle');
  var langToggle = document.getElementById('langToggle');
  var menuToggle = document.getElementById('menuToggle');
  var nav = document.getElementById('primaryNav');
  var backdrop = document.getElementById('menuBackdrop');
  var toast = document.getElementById('toast');
  var copyEmail = document.getElementById('copyEmail');
  var year = document.getElementById('year');

  var theme = root.getAttribute('data-theme') || 'light';
  var lang = root.getAttribute('lang') || 'en';
  var themeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  var reduceMotion = motionQuery.matches;

  /* ── Theme ───────────────────────────────────────────────────────────── */
  function applyTheme(next, persist) {
    theme = next;
    root.setAttribute('data-theme', theme);
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      m.setAttribute('content', theme === 'dark' ? '#111210' : '#f7f4ec');
      m.removeAttribute('media');
    });
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', lang === 'zh' ? (theme === 'dark' ? '切换浅色主题' : '切换深色主题') : (theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'));
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
  themeQuery.addEventListener('change', function (event) {
    try { if (localStorage.getItem('hm-theme')) return; } catch (e) {}
    applyTheme(event.matches ? 'dark' : 'light', false);
  });

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
    applyTheme(theme, false);
    if (copyEmail) copyEmail.setAttribute('aria-label', lang === 'zh' ? '复制邮箱地址' : 'Copy email address');
    if (sectionIds) requestScroll();
  }

  if (langToggle) {
    langToggle.addEventListener('click', function () {
      applyLang(lang === 'en' ? 'zh' : 'en', true);
    });
  }
  applyLang(lang, false);

  /* ── Mobile menu ─────────────────────────────────────────────────────── */
  function setMenuBackground(inert) {
    if (backdrop) backdrop.hidden = !inert;
    document.querySelectorAll('main, .site-footer, .side-rail').forEach(function (el) { el.inert = inert; });
  }

  function openMenu() {
    body.classList.add('menu-open');
    setMenuBackground(true);
    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', 'true');
      menuToggle.setAttribute('aria-label', lang === 'zh' ? '关闭导航' : 'Close menu');
    }
    if (nav) nav.querySelector('a').focus();
  }

  function closeMenu(restoreFocus) {
    var wasOpen = body.classList.contains('menu-open');
    body.classList.remove('menu-open');
    setMenuBackground(false);
    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', lang === 'zh' ? '打开导航' : 'Open menu');
      if (wasOpen && restoreFocus) menuToggle.focus();
    }
  }

  function toggleMenu() {
    if (body.classList.contains('menu-open')) closeMenu(true);
    else openMenu();
  }

  if (menuToggle) menuToggle.addEventListener('click', toggleMenu);
  if (backdrop) backdrop.addEventListener('click', function () { closeMenu(true); });
  if (nav) {
    nav.addEventListener('click', function (event) {
      var link = event.target.closest('a');
      if (!link) return;
      var wasOpen = body.classList.contains('menu-open');
      closeMenu();
      if (wasOpen) {
        var target = document.querySelector(link.getAttribute('href'));
        if (target) {
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
          target.addEventListener('blur', function () { target.removeAttribute('tabindex'); }, { once: true });
        }
      }
    });
  }
  document.addEventListener('keydown', function (event) {
    if (!body.classList.contains('menu-open')) return;
    if (event.key === 'Escape') closeMenu(true);
    if (event.key === 'Tab' && header) {
      var controls = Array.prototype.filter.call(header.querySelectorAll('a[href], button'), function (el) { return el.getClientRects().length > 0; });
      var first = controls[0];
      var last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
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
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var headerH = header ? header.offsetHeight : 0;

    if (header) header.classList.toggle('is-scrolled', y > 8);

    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    if (progressBar) progressBar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';

    if (hero && !reduceMotion) {
      hero.style.setProperty('--py', Math.min(y, window.innerHeight) * 0.14 + 'px');
    }

    var marker = y + headerH + Math.min(220, window.innerHeight * 0.28);
    var current = '';
    sectionIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.offsetTop <= marker) current = id;
    });
    if (max > 0 && y >= max - 4) current = 'contact';
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
  window.addEventListener('load', requestScroll);
  if (document.fonts) document.fonts.ready.then(requestScroll);
  document.querySelectorAll('details').forEach(function (el) { el.addEventListener('toggle', requestScroll); });
  onScroll();

  /* ── Reveal on scroll ────────────────────────────────────────────────── */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { observer.observe(el); });
    root.classList.add('reveal-ready');
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ── Copy email ──────────────────────────────────────────────────────── */
  var toastTimer = null;

  function showToast(success) {
    if (!toast) return;
    toast.querySelector('[data-lang="en"]').textContent = success ? 'Email copied to clipboard' : 'Please select the email address to copy it';
    toast.querySelector('[data-lang="zh"]').textContent = success ? '邮箱已复制到剪贴板' : '复制未成功，请选中邮箱复制';
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 2200);
  }

  function legacyCopy(text) {
    var focused = document.activeElement;
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
    if (focused) focused.focus({ preventScroll: true });
    return ok;
  }

  if (copyEmail) {
    copyEmail.addEventListener('click', function () {
      var text = copyEmail.getAttribute('data-email') || '';
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { showToast(true); }).catch(function () {
          showToast(legacyCopy(text));
        });
      } else {
        showToast(legacyCopy(text));
      }
    });
  }

  /* ── Dossier: light follows the pointer, card tilts a little ─────────── */
  var dossier = document.getElementById('dossier');
  if (dossier) {
    dossier.addEventListener('pointermove', function (event) {
      if (reduceMotion || !pointerQuery.matches) return;
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

  motionQuery.addEventListener('change', function (event) {
    reduceMotion = event.matches;
    if (reduceMotion) {
      root.classList.remove('reveal-ready');
      if (hero) hero.style.removeProperty('--py');
      if (dossier) dossier.style.transform = '';
    }
  });

  /* ── Misc ────────────────────────────────────────────────────────────── */
  if (year) year.textContent = String(new Date().getFullYear());

  // Keep an external link safe even if someone edits it later.
  document.querySelectorAll('a[target="_blank"]').forEach(function (a) {
    if (!a.rel) a.rel = 'noopener noreferrer';
  });
})();
