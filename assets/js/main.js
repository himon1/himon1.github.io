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
        if (surface === dossier) {
          surface.style.transform = 'perspective(1200px) rotateX(' + ((0.5 - py) * 1.6).toFixed(2) + 'deg) rotateY(' + ((px - 0.5) * 2).toFixed(2) + 'deg)';
        }
      });
    });
    surface.addEventListener('pointerleave', resetSurface);
    surface.addEventListener('pointercancel', resetSurface);
    surfaceResets.push(resetSurface);
  });

  /* Flowing engraved lines: 14 paths, capped at 16 updates/s while visible. */
  var flow = document.querySelector('.hero-flow');
  var flowPaths = flow ? flow.querySelectorAll('path') : [];
  var flowFrame = null;
  var flowLast = 0;
  var flowPhase = 0;
  var flowVisible = !!hero && hero.getBoundingClientRect().bottom > 0;
  var flowTargetX = 0.5;
  var flowTargetY = 0;
  var flowX = 0.5;
  var flowY = 0;

  function flowAllowed() { return flow && flowVisible && !reduceMotion && !document.hidden; }
  function paintFlow(time) {
    flowFrame = null;
    if (!flowAllowed()) return;
    if (!flowLast || time - flowLast >= 62.5) {
      flowPhase += flowLast ? Math.min(time - flowLast, 100) * 0.00035 : 0;
      flowLast = time;
      flowX += (flowTargetX - flowX) * 0.16;
      flowY += (flowTargetY - flowY) * 0.16;
      flowPaths.forEach(function (path, index) {
        var d = '';
        for (var point = 0; point < 49; point += 1) {
          var x = -80 + point * 32.5;
          var distance = (x / 1400 - flowX) * 3;
          var y = 520 + index * 13 + Math.sin(x * 0.0042 + flowPhase) * 58 + Math.sin(x * 0.0018 - flowPhase * 0.45) * 36 + Math.exp(-distance * distance) * flowY;
          d += (point ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
        }
        path.setAttribute('d', d);
      });
    }
    flowFrame = window.requestAnimationFrame(paintFlow);
  }
  function updateFlow() {
    if (flowAllowed()) {
      if (flowFrame === null) { flowLast = 0; flowFrame = window.requestAnimationFrame(paintFlow); }
    } else {
      if (flowFrame !== null) window.cancelAnimationFrame(flowFrame);
      flowFrame = null;
      flowLast = 0;
    }
  }
  document.addEventListener('visibilitychange', updateFlow);
  updateFlow();

  if (hero) {
    var heroFrame = null;
    var lightX = 0;
    var lightY = 0;
    function resetHeroLight() {
      if (heroFrame !== null) window.cancelAnimationFrame(heroFrame);
      heroFrame = null;
      hero.classList.remove('is-lit');
      flowTargetX = 0.5;
      flowTargetY = 0;
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
        flowTargetX = (lightX - rect.left) / rect.width;
        flowTargetY = ((lightY - rect.top) / rect.height - 0.5) * 80;
        hero.classList.add('is-lit');
      });
    });
    hero.addEventListener('pointerleave', resetHeroLight);
    surfaceResets.push(resetHeroLight);

    if ('IntersectionObserver' in window) {
      var ambientObserver = new IntersectionObserver(function (entries) {
        hero.classList.toggle('is-dormant', !entries[0].isIntersecting);
        flowVisible = entries[0].isIntersecting;
        updateFlow();
      });
      ambientObserver.observe(hero);
    }
  }

  motionQuery.addEventListener('change', function (event) {
    reduceMotion = event.matches;
    updateFlow();
    if (reduceMotion) {
      root.classList.remove('reveal-ready');
      if (hero) hero.style.removeProperty('--py');
      surfaceResets.forEach(function (reset) { reset(); });
      if (themeTransition) themeTransition.skipTransition();
      if (fallbackThemeAnimation) fallbackThemeAnimation.cancel();
    }
  });

  /* Project quick view: a native modal drawer sourced from the existing cards. */
  if (typeof HTMLDialogElement !== 'undefined' && HTMLDialogElement.prototype.showModal) {
    var projectGrid = document.querySelector('.project-grid');
    var preview = document.createElement('dialog');
    preview.className = 'project-dialog';
    preview.setAttribute('aria-labelledby', 'projectPreviewTitle');
    preview.innerHTML = '<div class="dialog-panel"><header class="preview-header"><span class="mono preview-kicker"></span><button class="preview-close" type="button">×</button></header><div class="preview-content"></div><footer class="preview-footer"><a class="btn btn-primary preview-source" target="_blank" rel="noopener noreferrer"></a><div class="preview-switcher"><button class="preview-prev" type="button">←</button><span class="preview-counter mono"></span><button class="preview-next" type="button">→</button></div></footer></div>';
    body.appendChild(preview);
    var previewContent = preview.querySelector('.preview-content');
    var previewClose = preview.querySelector('.preview-close');
    var previewSource = preview.querySelector('.preview-source');
    var previewCards = [];
    var previewIndex = 0;
    var previewTrigger = null;
    var previewClosing = false;

    function renderPreview(index) {
      previewIndex = (index + previewCards.length) % previewCards.length;
      var card = previewCards[previewIndex];
      previewContent.replaceChildren();
      var category = document.createElement('p');
      category.className = 'mono preview-category';
      category.textContent = card.querySelector('.project-top > span').textContent;
      var title = document.createElement('h2');
      title.id = 'projectPreviewTitle';
      title.className = 'preview-title';
      title.textContent = card.querySelector('h3').textContent;
      var description = card.querySelector('p').cloneNode(true);
      description.classList.add('preview-description');
      previewContent.append(category, title, description);
      var chips = card.querySelector('.chips');
      if (chips) previewContent.appendChild(chips.cloneNode(true));
      preview.querySelector('.preview-kicker').textContent = lang === 'zh' ? '项目预览' : 'Project preview';
      previewClose.setAttribute('aria-label', lang === 'zh' ? '关闭项目预览' : 'Close project preview');
      previewSource.href = card.href;
      previewSource.textContent = lang === 'zh' ? '在 GitHub 查看 ↗' : 'View on GitHub ↗';
      preview.querySelector('.preview-counter').textContent = String(previewIndex + 1).padStart(2, '0') + ' / ' + String(previewCards.length).padStart(2, '0');
      preview.querySelector('.preview-prev').setAttribute('aria-label', lang === 'zh' ? '上一个项目' : 'Previous project');
      preview.querySelector('.preview-next').setAttribute('aria-label', lang === 'zh' ? '下一个项目' : 'Next project');
      preview.querySelectorAll('.preview-switcher button').forEach(function (button) { button.disabled = previewCards.length < 2; });
      if (preview.open && !reduceMotion && previewContent.animate) {
        previewContent.animate([{ opacity: 0, transform: 'translateX(10px)' }, { opacity: 1, transform: 'translateX(0)' }], { duration: 220, easing: 'ease-out' });
      }
    }

    function closePreview() {
      if (!preview.open || previewClosing) return;
      previewClosing = true;
      var panel = preview.querySelector('.dialog-panel');
      var current = getComputedStyle(panel);
      var from = { opacity: current.opacity, transform: current.transform };
      preview.classList.add('is-closing');
      if (!reduceMotion && panel.animate) {
        panel.animate([from, { opacity: 0, transform: 'translateX(48px)' }], { duration: 220, easing: 'ease-in', fill: 'forwards' }).finished.catch(function () {}).then(function () { preview.close(); });
      } else preview.close();
    }

    preview.addEventListener('close', function () {
      previewClosing = false;
      preview.classList.remove('is-closing');
      var panel = preview.querySelector('.dialog-panel');
      if (panel.getAnimations) panel.getAnimations().forEach(function (animation) { animation.cancel(); });
      body.classList.remove('preview-open');
      if (previewTrigger && previewTrigger.isConnected) previewTrigger.focus({ preventScroll: true });
    });
    preview.addEventListener('cancel', function (event) { event.preventDefault(); closePreview(); });
    preview.addEventListener('click', function (event) { if (event.target === preview) closePreview(); });
    previewClose.addEventListener('click', closePreview);
    preview.querySelector('.preview-prev').addEventListener('click', function () { renderPreview(previewIndex - 1); });
    preview.querySelector('.preview-next').addEventListener('click', function () { renderPreview(previewIndex + 1); });
    preview.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') { event.preventDefault(); renderPreview(previewIndex - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); renderPreview(previewIndex + 1); }
    });

    if (projectGrid) {
      projectGrid.querySelectorAll('.project-card').forEach(function (card) {
        card.setAttribute('aria-haspopup', 'dialog');
        var cue = document.createElement('span');
        cue.className = 'project-preview-cue mono';
        cue.innerHTML = '<span><span data-lang="en">Quick view</span><span data-lang="zh">快速预览</span></span><span aria-hidden="true">→</span>';
        card.appendChild(cue);
        card.querySelector('.project-arrow').textContent = '+';
      });
      projectGrid.addEventListener('click', function (event) {
        var card = event.target.closest('.project-card');
        if (!card || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.defaultPrevented) return;
        previewCards = Array.prototype.slice.call(projectGrid.querySelectorAll('.project-card'));
        renderPreview(previewCards.indexOf(card));
        previewTrigger = card;
        try { preview.showModal(); } catch (e) { return; }
        event.preventDefault();
        body.classList.add('preview-open');
      });
    }
  }

  /* ── Misc ────────────────────────────────────────────────────────────── */
  if (year) year.textContent = String(new Date().getFullYear());

  // Keep an external link safe even if someone edits it later.
  document.querySelectorAll('a[target="_blank"]').forEach(function (a) {
    if (!a.rel) a.rel = 'noopener noreferrer';
  });
})();
