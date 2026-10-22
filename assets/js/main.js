/* ==========================================================================
   Mu Hao — site behaviour
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
  var themeTransition = null;
  var fallbackThemeAnimation = null;

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
    themeToggle.addEventListener('click', function (event) {
      var next = theme === 'dark' ? 'light' : 'dark';
      var rect = themeToggle.getBoundingClientRect();
      var x = event.detail ? event.clientX : rect.left + rect.width / 2;
      var y = event.detail ? event.clientY : rect.top + rect.height / 2;
      root.style.setProperty('--theme-x', x + 'px');
      root.style.setProperty('--theme-y', y + 'px');
      root.style.setProperty('--theme-radius', (Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 2) + 'px');
      if (themeTransition) themeTransition.skipTransition();
      if (fallbackThemeAnimation) fallbackThemeAnimation.cancel();
      if (document.startViewTransition && !reduceMotion) {
        var transition = document.startViewTransition(function () { applyTheme(next, true); });
        themeTransition = transition;
        transition.ready.catch(function () {});
        transition.finished.catch(function () {}).then(function () {
          if (themeTransition === transition) themeTransition = null;
        });
      } else {
        applyTheme(next, true);
        if (!reduceMotion && body.animate) {
          fallbackThemeAnimation = body.animate([{ opacity: 0.72 }, { opacity: 1 }], { duration: 320, easing: 'ease-out' });
        }
      }
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
    if (dialStage && dialStage.classList.contains('is-interactive')) dialStage.setAttribute('title', lang === 'zh' ? '拖动旋转' : 'Drag to rotate');
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
    }, { rootMargin: '0px 0px -4% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { observer.observe(el); });
    root.classList.add('reveal-ready');
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ── Copy email ──────────────────────────────────────────────────────── */
  var toastTimer = null;
  var copiedTimer = null;

  function showToast(success) {
    if (!toast) return;
    toast.querySelector('[data-lang="en"]').textContent = success ? 'Email copied to clipboard' : 'Please select the email address to copy it';
    toast.querySelector('[data-lang="zh"]').textContent = success ? '邮箱已复制到剪贴板' : '复制未成功，请选中邮箱复制';
    if (success && copyEmail) {
      copyEmail.classList.add('is-copied');
      copyEmail.querySelector('[data-lang="en"]').textContent = 'Copied';
      copyEmail.querySelector('[data-lang="zh"]').textContent = '已复制';
      window.clearTimeout(copiedTimer);
      copiedTimer = window.setTimeout(function () {
        copyEmail.classList.remove('is-copied');
        copyEmail.querySelector('[data-lang="en"]').textContent = 'Copy';
        copyEmail.querySelector('[data-lang="zh"]').textContent = '复制';
      }, 2400);
    }
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

  /* ── Surface light: one update per animation frame, no background loop ── */
  var dossier = document.getElementById('dossier');
  var dialStage = document.querySelector('.mark');
  var surfaceResets = [];
  document.querySelectorAll('.dossier, .project-card, .btn').forEach(function (surface) {
    var frame = null;
    var x = 0;
    var y = 0;

    function resetSurface() {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
      surface.style.removeProperty('--mx');
      surface.style.removeProperty('--my');
      surface.style.removeProperty('--pull-x');
      surface.style.removeProperty('--pull-y');
      if (surface === dossier) surface.style.transform = '';
    }

    surface.addEventListener('pointermove', function (event) {
      if (reduceMotion || !pointerQuery.matches) return;
      x = event.clientX;
      y = event.clientY;
      if (frame !== null) return;
      frame = window.requestAnimationFrame(function () {
        frame = null;
        var rect = surface.getBoundingClientRect();
        var px = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
        var py = Math.max(0, Math.min(1, (y - rect.top) / rect.height));
        surface.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        surface.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        if (surface.classList.contains('btn')) {
          surface.style.setProperty('--pull-x', ((px - 0.5) * 10).toFixed(1) + 'px');
          surface.style.setProperty('--pull-y', ((py - 0.5) * 6).toFixed(1) + 'px');
        }
        if (surface === dossier && !(dialStage && dialStage.classList.contains('is-dragging'))) {
          surface.style.transform = 'perspective(1200px) rotateX(' + ((0.5 - py) * 1.6).toFixed(2) + 'deg) rotateY(' + ((px - 0.5) * 2).toFixed(2) + 'deg)';
        }
      });
    });
    surface.addEventListener('pointerleave', resetSurface);
    surface.addEventListener('pointercancel', resetSurface);
    surfaceResets.push(resetSurface);
  });

  /* Decorative dial: phase-preserving hover acceleration and direct rotation. */
  if (dialStage) {
    var dialPointer = null;
    var previousAngle = 0;
    var dialAngle = 0;
    var dialFrame = null;

    function setDialRate(rate) {
      dialStage.querySelectorAll('.dial-orbit, .dial-counter').forEach(function (orbit) {
        if (!orbit.getAnimations) return;
        orbit.getAnimations().forEach(function (animation) {
          if (animation.updatePlaybackRate) animation.updatePlaybackRate(rate);
        });
      });
    }

    function pointerAngle(event) {
      var center = dialStage.querySelector('.dial-center').getBoundingClientRect();
      return Math.atan2(event.clientY - center.top - center.height / 2, event.clientX - center.left - center.width / 2) * 180 / Math.PI;
    }

    function finishDial() {
      if (dialFrame !== null) window.cancelAnimationFrame(dialFrame);
      dialFrame = null;
      dialStage.style.setProperty('--dial-angle', dialAngle.toFixed(2) + 'deg');
      var pointer = dialPointer;
      dialPointer = null;
      dialStage.classList.remove('is-dragging');
      if (pointer !== null && dialStage.hasPointerCapture(pointer)) dialStage.releasePointerCapture(pointer);
      setDialRate(!reduceMotion && pointerQuery.matches && dialStage.matches(':hover') ? 2.2 : 1);
    }

    function updateDialAvailability() {
      var enabled = !motionQuery.matches && pointerQuery.matches;
      dialStage.classList.toggle('is-interactive', enabled);
      if (enabled) dialStage.setAttribute('title', lang === 'zh' ? '拖动旋转' : 'Drag to rotate');
      else dialStage.removeAttribute('title');
      if (!enabled) finishDial();
    }

    dialStage.addEventListener('pointerenter', function () {
      if (!reduceMotion && pointerQuery.matches) setDialRate(2.2);
    });
    dialStage.addEventListener('pointerleave', function () { setDialRate(1); });
    dialStage.addEventListener('pointerdown', function (event) {
      if (reduceMotion || !pointerQuery.matches || event.button !== 0) return;
      dialPointer = event.pointerId;
      if (dossier) dossier.style.transform = '';
      previousAngle = pointerAngle(event);
      dialStage.classList.add('is-dragging');
      dialStage.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    dialStage.addEventListener('pointermove', function (event) {
      if (event.pointerId !== dialPointer) return;
      var angle = pointerAngle(event);
      var delta = ((angle - previousAngle + 540) % 360) - 180;
      dialAngle += delta;
      previousAngle = angle;
      if (dialFrame !== null) return;
      dialFrame = window.requestAnimationFrame(function () {
        dialFrame = null;
        dialStage.style.setProperty('--dial-angle', dialAngle.toFixed(2) + 'deg');
      });
    });
    dialStage.addEventListener('pointerup', finishDial);
    dialStage.addEventListener('pointercancel', finishDial);
    dialStage.addEventListener('lostpointercapture', function () { if (dialPointer !== null) finishDial(); });
    pointerQuery.addEventListener('change', updateDialAvailability);
    motionQuery.addEventListener('change', updateDialAvailability);
    updateDialAvailability();
    surfaceResets.push(finishDial);
  }

  if (hero) {
    var heroFrame = null;
    var lightX = 0;
    var lightY = 0;
    function resetHeroLight() {
      if (heroFrame !== null) window.cancelAnimationFrame(heroFrame);
      heroFrame = null;
      hero.classList.remove('is-lit');
    }
    hero.addEventListener('pointermove', function (event) {
      if (reduceMotion || !pointerQuery.matches) return;
      lightX = event.clientX;
      lightY = event.clientY;
      if (heroFrame !== null) return;
      heroFrame = window.requestAnimationFrame(function () {
        heroFrame = null;
        var rect = hero.getBoundingClientRect();
        hero.style.setProperty('--light-x', ((lightX - rect.left) / rect.width * 100).toFixed(1) + '%');
        hero.style.setProperty('--light-y', ((lightY - rect.top) / rect.height * 100).toFixed(1) + '%');
        hero.classList.add('is-lit');
      });
    });
    hero.addEventListener('pointerleave', resetHeroLight);
    surfaceResets.push(resetHeroLight);

    if ('IntersectionObserver' in window) {
      var ambientObserver = new IntersectionObserver(function (entries) {
        hero.classList.toggle('is-dormant', !entries[0].isIntersecting);
      });
      ambientObserver.observe(hero);
    }
  }

  motionQuery.addEventListener('change', function (event) {
    reduceMotion = event.matches;
    if (reduceMotion) {
      root.classList.remove('reveal-ready');
      if (hero) hero.style.removeProperty('--py');
      surfaceResets.forEach(function (reset) { reset(); });
      if (themeTransition) themeTransition.skipTransition();
      if (fallbackThemeAnimation) fallbackThemeAnimation.cancel();
    }
  });

  /* ── Misc ────────────────────────────────────────────────────────────── */
  if (year) year.textContent = String(new Date().getFullYear());

  // Keep an external link safe even if someone edits it later.
  document.querySelectorAll('a[target="_blank"]').forEach(function (a) {
    if (!a.rel) a.rel = 'noopener noreferrer';
  });
})();
