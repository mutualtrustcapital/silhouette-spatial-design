(function () {
  window.__ssd = 1;
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  // ---- navigation
  var nav = document.getElementById('nav'), burger = document.getElementById('burger'), menu = document.getElementById('menu');
  var hero = document.querySelector('.hero');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var plan = document.getElementById('heroArt');
  function onScroll() {
    if (hero) nav.classList.toggle('solid', window.scrollY > hero.offsetHeight - nav.offsetHeight);
    if (plan && !reduceMotion && window.scrollY < hero.offsetHeight) plan.style.setProperty('--py', (window.scrollY * 0.18).toFixed(1) + 'px');
  }
  if (plan) requestAnimationFrame(function () { requestAnimationFrame(function () { plan.classList.add('in'); }); });
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if (burger) {
    burger.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    $$('a', menu).forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) burger.click();
    });
  }

  // ---- hero film: loads after the page, plays once, then rests on its final frame
  var v = document.querySelector('.hero-video');
  if (v && !reduce && !(navigator.connection && navigator.connection.saveData)) {
    var start = function () {
      v.src = v.getAttribute('data-src');
      v.addEventListener('playing', function () { v.classList.add('playing'); }, { once: true });
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    };
    if (document.readyState === 'complete') setTimeout(start, 250);
    else window.addEventListener('load', function () { setTimeout(start, 250); });
  }

  // ---- reveal on scroll
  var items = $$('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .1, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else { items.forEach(function (el) { el.classList.add('in'); }); }

  // ---- live local times (studio + markets)
  var clocks = $$('[data-tz]');
  function tick() {
    var now = new Date();
    clocks.forEach(function (el) {
      try {
        var t = new Intl.DateTimeFormat('en-NZ', { hour: 'numeric', minute: '2-digit', timeZone: el.getAttribute('data-tz') }).format(now);
        el.textContent = (el.getAttribute('data-prefix') || '') + t.replace(/\s/g, ' ').toLowerCase();
      } catch (e) { el.textContent = ''; }
    });
  }
  if (clocks.length) { tick(); setInterval(tick, 30000); }

  // ---- drawn vs built compare slider (pointer + keyboard via the range input)
  $$('[data-compare]').forEach(function (box) {
    var range = box.querySelector('.cmp-range');
    function set(pct) { pct = Math.max(0, Math.min(100, pct)); box.style.setProperty('--pos', pct + '%'); if (range) range.value = Math.round(pct); }
    if (range) range.addEventListener('input', function () { set(+range.value); });
    var dragging = false;
    function at(e) { var r = box.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); }
    box.addEventListener('pointerdown', function (e) { dragging = true; at(e); try { box.setPointerCapture(e.pointerId); } catch (_) {} });
    box.addEventListener('pointermove', function (e) { if (dragging) at(e); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { box.addEventListener(t, function () { dragging = false; }); });
    set(50);
  });

  // ---- full-screen image viewer
  var zoomables = $$('img[data-zoom]');
  if (zoomables.length) {
    var ic = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="' + d + '"/></svg>'; };
    var lb = document.createElement('div');
    lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Image viewer');
    lb.innerHTML = '<span class="lb-c"></span><figure><img alt=""><figcaption class="lb-cap"></figcaption></figure>' +
      '<button class="lb-p" type="button" aria-label="Previous image">' + ic('M15 5l-7 7 7 7') + '</button>' +
      '<button class="lb-n" type="button" aria-label="Next image">' + ic('M9 5l7 7-7 7') + '</button>' +
      '<button class="lb-x" type="button" aria-label="Close">' + ic('M5 5l14 14M19 5L5 19') + '</button>';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('img'), lbCap = lb.querySelector('.lb-cap'), lbCount = lb.querySelector('.lb-c'), idx = 0, last = null;
    var caption = function (img) {
      var f = img.closest('figure'); var c = f && f.querySelector('figcaption');
      return c && !f.classList.contains('lb') ? c.textContent : img.alt;
    };
    var show = function (i) {
      idx = (i + zoomables.length) % zoomables.length;
      var img = zoomables[idx];
      lbImg.src = img.getAttribute('data-full'); lbImg.alt = img.alt;
      lbCap.textContent = caption(img);
      lbCount.textContent = (idx + 1) + ' / ' + zoomables.length;
    };
    var open = function (i) { last = document.activeElement; show(i); lb.classList.add('open'); document.body.classList.add('lb-open'); lb.querySelector('.lb-x').focus(); };
    var close = function () { lb.classList.remove('open'); document.body.classList.remove('lb-open'); if (last && last.focus) last.focus(); };
    zoomables.forEach(function (img, i) {
      img.setAttribute('tabindex', '0'); img.setAttribute('role', 'button');
      img.addEventListener('click', function () { open(i); });
      img.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); } });
    });
    lb.querySelector('.lb-x').addEventListener('click', close);
    lb.querySelector('.lb-p').addEventListener('click', function () { show(idx - 1); });
    lb.querySelector('.lb-n').addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'ArrowRight') show(idx + 1);
      else if (e.key === 'Tab') { // keep focus inside the viewer
        var b = $$('button', lb), f = b[0], l = b[b.length - 1];
        if (e.shiftKey && document.activeElement === f) { e.preventDefault(); l.focus(); }
        else if (!e.shiftKey && document.activeElement === l) { e.preventDefault(); f.focus(); }
      }
    });
    var sx = null;
    lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    });
  }

  // ---- interactive light layers
  $$('[data-lights]').forEach(function (box) {
    $$('button[data-layer]', box).forEach(function (b) {
      b.addEventListener('click', function () {
        var on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        box.classList.toggle('on-' + b.getAttribute('data-layer'), on);
      });
    });
  });

  // ---- reading progress (journal)
  var bar = document.querySelector('.progress span'), art = document.querySelector('article');
  if (bar && art) {
    var prog = function () {
      var r = art.getBoundingClientRect(), total = r.height - window.innerHeight;
      bar.style.setProperty('--p', total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1);
    };
    window.addEventListener('scroll', prog, { passive: true }); prog();
  }

  // ---- mobile "Begin a project" button: shows after the first screen, hides near forms and the footer
  var mcta = document.querySelector('.m-cta');
  if (mcta) {
    var blockers = $$('.contact, .footer, .cta-band'), visible = {};
    var update = function () {
      var hidden = Object.keys(visible).some(function (k) { return visible[k]; });
      mcta.classList.toggle('show', window.scrollY > window.innerHeight * 0.8 && !hidden);
    };
    if ('IntersectionObserver' in window) {
      var bo = new IntersectionObserver(function (es) {
        es.forEach(function (e) { visible[blockers.indexOf(e.target)] = e.isIntersecting; }); update();
      });
      blockers.forEach(function (b) { bo.observe(b); });
    }
    window.addEventListener('scroll', update, { passive: true }); update();
  }

  // ---- enquiry forms: Netlify Forms (with attachments) when deployed, email fallback otherwise
  var EMAIL = 'info@silhouettespatialdesign.com';
  $$('form.enquiry').forEach(function (form) {
    var note = form.querySelector('.form-note');
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var val = function (n) { var el = form.elements[n]; return el ? String(el.value || '').trim() : ''; };
      var subject = 'Project enquiry — ' + val('type') + ' · ' + val('location') + ' (' + val('name') + ')';
      var lines = [['Location', 'location'], ['Project', 'type'], ['Stage', 'stage'], ['Ideal start', 'timing'], ['Budget', 'budget'], ['Phone', 'phone'], ['Heard about us', 'source']]
        .map(function (p) { return val(p[1]) ? p[0] + ': ' + val(p[1]) : ''; }).filter(Boolean).join('\n');
      var body = 'Hi Mannat,\n\n' + val('message') + '\n\n' + lines + '\n\n— ' + val('name') + '\n' + val('email');
      function mail() {
        note.innerHTML = 'If your email app didn’t open, send it to <strong>' + EMAIL + '</strong> — <button type="button" class="copy">copy the message</button>.';
        note.querySelector('.copy').addEventListener('click', function () {
          try {
            navigator.clipboard.writeText('Subject: ' + subject + '\n\n' + body).then(
              function () { note.textContent = 'Copied — paste it into an email to ' + EMAIL + '.'; },
              function () { note.textContent = 'Please email ' + EMAIL + ' directly.'; });
          } catch (e) { note.textContent = 'Please email ' + EMAIL + ' directly.'; }
        });
        try { window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body); } catch (e) {}
      }
      if (form.hasAttribute('data-netlify')) {
        var btn = form.querySelector('button[type=submit]'); if (btn) btn.disabled = true;
        note.textContent = 'Sending…';
        fetch('/', { method: 'POST', body: new FormData(form) })
          .then(function (r) { if (!r.ok) throw new Error(r.status); window.location.href = form.getAttribute('action'); })
          .catch(function () { if (btn) btn.disabled = false; mail(); });
      } else { mail(); }
    });
  });

  var y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
})();
