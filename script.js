(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var cur = d.currentScript;
  var VER = cur && cur.src.indexOf('?v=') > -1 ? cur.src.split('?v=')[1] : '';
  /* корень сайта - папка script.js: страницы классов лежат уровнем ниже */
  var BASE = cur ? cur.src.replace(/script\.js.*$/, '') : '';
  var PAGE = root.getAttribute('data-page');
  var WA = 'https://wa.me/77766666648?text=';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var G = window.gsap, ST = window.ScrollTrigger;
  var anim = !!(G && ST) && !reduce;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || d).querySelectorAll(s)); };
  var lenis = null;

  /* бегущая строка: четыре копии списка, шаг цикла - две копии */
  var track = $('.marq__track');
  if (track && !reduce) {
    var set = $$('span', track);
    for (var c = 0; c < 3; c++) set.forEach(function (s) {
      var n = s.cloneNode(true); n.setAttribute('aria-hidden', 'true'); track.appendChild(n);
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        track.parentNode.classList.toggle('is-paused', !e[0].isIntersecting);
      }).observe(track.parentNode);
    }
  }

  /* языки: русский в разметке, остальные словари грузятся по выбору */
  var nodes = $$('[data-i18n]'), RU = {};
  nodes.forEach(function (n) { var k = n.getAttribute('data-i18n'); if (!(k in RU)) RU[k] = n.textContent; });
  var DICT = { ru: RU }, GLOB = { kk: 'SITE_KK', en: 'SITE_EN' }, PGLOB = { kk: 'SITE_PAGE_KK', en: 'SITE_PAGE_EN' }, lang = 'ru';
  var langBtns = $$('.lang button');

  function apply(l) {
    var D = DICT[l] || RU;
    lang = l;
    nodes.forEach(function (n) {
      var k = n.getAttribute('data-i18n'), t = D[k] != null ? D[k] : RU[k];
      if (n.textContent !== t) n.textContent = t;
    });
    root.lang = l;
    langBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === l)); });
    $$('[data-wa]').forEach(function (a) {
      var t = (l !== 'ru' && D[a.getAttribute('data-wa')]) || a.getAttribute('data-wa-text');
      var m = a.getAttribute('data-wa-model');
      if (m) t = t.replace('{m}', m);
      a.href = WA + encodeURIComponent(t);
    });
    if (anim) ST.refresh();
  }
  function setLang(l, save, done) {
    if (save) { try { localStorage.setItem('lang', l); } catch (e) {} }
    if (DICT[l]) { apply(l); if (done) done(); return; }
    var q = VER ? '?v=' + VER : '';
    var load = function (src, cb) {
      var s = d.createElement('script');
      s.src = src; s.onload = cb; s.onerror = cb;
      d.head.appendChild(s);
    };
    var fin = function () {
      var D = {}, a = window[GLOB[l]] || {}, b = (PAGE && window[PGLOB[l]]) || {}, k;
      for (k in a) D[k] = a[k];
      for (k in b) D[k] = b[k];
      DICT[l] = D; apply(l); if (done) done();
    };
    load(BASE + 'assets/lang/' + l + '.js' + q, function () {
      if (PAGE) load(BASE + 'assets/lang/' + PAGE + '-' + l + '.js' + q, fin); else fin();
    });
  }
  langBtns.forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang'), true); });
  });
  var startLang = 'ru';
  try {
    var q = new URLSearchParams(location.search).get('lang');
    var saved = localStorage.getItem('lang');
    if (q === 'ru' || q === 'kk' || q === 'en') startLang = q;
    else if (saved === 'kk' || saved === 'en') startLang = saved;
  } catch (e) {}

  /* шапка и меню */
  var hdr = $('#hdr'), menu = $('#menu'), burger = $('.burger');
  function onScroll() { hdr.classList.toggle('is-solid', window.scrollY > 30); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  function toggleMenu(open) {
    menu.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    d.body.style.overflow = open ? 'hidden' : '';
    d.body.classList.toggle('menu-open', open);
    hdr.classList.toggle('is-solid', open || window.scrollY > 30);
    if (lenis) { open ? lenis.stop() : lenis.start(); }
  }
  burger.addEventListener('click', function () { toggleMenu(menu.hidden); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) toggleMenu(false); });

  /* якоря */
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var t = d.getElementById(a.getAttribute('href').slice(1));
    if (!t) return;
    e.preventDefault();
    if (!menu.hidden) toggleMenu(false);
    var off = t.classList.contains('bay') || t.id === 'top' ? 0 : -hdr.offsetHeight + 1;
    if (lenis) lenis.scrollTo(t, { offset: off, duration: 1.3 });
    else window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY + off, behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', '#' + t.id);
  });

  /* конверсии Google Ads: звонок, WhatsApp, форма */
  function fireConv(key) {
    if (typeof window.gtag_report_conversion !== 'function' || !window.AW_CONV) return;
    var sendTo = window.AW_CONV[key];
    if (sendTo) window.gtag_report_conversion(undefined, sendTo);
  }
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="tel:"], a[href*="wa.me"]');
    if (!a) return;
    fireConv(a.getAttribute('href').indexOf('tel:') === 0 ? 'phone' : 'contact');
  });

  /* форма: заявка уходит сообщением в WhatsApp */
  var form = $('#lead-form');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements, phone = f.phone, fld = phone.closest('.fld');
    if (phone.value.replace(/\D/g, '').length < 10) { fld.classList.add('is-err'); phone.focus(); return; }
    fld.classList.remove('is-err');
    var D = DICT[lang] || RU;
    var tpl = (lang !== 'ru' && D['rq.tpl']) || form.getAttribute('data-wa-tpl');
    var dt = f.datetime.value ? f.datetime.value.replace('T', ' ') : '';
    var txt = tpl.replace('{name}', f.name.value.trim())
      .replace('{cls}', f['class'].options[f['class'].selectedIndex].textContent)
      .replace('{guests}', f.guests.value).replace('{dt}', dt).replace('{route}', f.route.value.trim());
    fireConv('form');
    window.open(WA + encodeURIComponent(txt), '_blank', 'noopener');
    $('.form__ok', form).hidden = false;
  });

  /* полосы раскрытия на кадрах */
  $$('.frame').forEach(function (f) {
    if (!anim) return;
    var s = d.createElement('span'); s.className = 'slats'; s.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 7; i++) s.appendChild(d.createElement('i'));
    f.appendChild(s);
  });

  function start() {
    if (!anim) return;
    G.registerPlugin(ST);
    if (window.SplitText) G.registerPlugin(window.SplitText);
    var E = 'power3.out';
    G.defaults({ ease: E, duration: 0.8 });

    if (window.Lenis) {
      lenis = new window.Lenis({ duration: 1.15 });
      lenis.on('scroll', ST.update);
      G.ticker.add(function (t) { lenis.raf(t * 1000); });
      G.ticker.lagSmoothing(0);
    }

    /* герой: потолок загорается секциями от дальней стены к зрителю, машина выходит из темноты.
       Строки заголовка режем только после загрузки шрифтов, иначе SplitText меряет запасной шрифт */
    var hero = $('.hero'), plane = $('.ceil__plane'), strips = [];
    if (hero) {
    for (var i = 0; i < 13; i++) { var s = d.createElement('i'); plane.appendChild(s); strips.push(s); }
    strips.reverse();
    var dark = $('.hero__dark'), gleam = $('.hero__gleam'), h1 = $('.hero h1');
    var rest = [$('.hero .kicker'), $('.hero .lead'), $('.hero__btns'), $('.iglink')];
    G.set(strips, { opacity: 0 });
    G.set(dark, { opacity: 1 });
    G.set(rest, { opacity: 0, y: 18 });
    G.set(h1, { autoAlpha: 0 });
    var tl = G.timeline({ delay: 0.15 });
    tl.to(strips, { keyframes: { opacity: [0, 0.85, 0.2, 1] }, duration: 0.5, ease: 'none', stagger: 0.1 }, 0)
      .to(dark, { keyframes: { opacity: [1, 0.6, 0.75, 0.3, 0.4, 0] }, duration: 1.7, ease: 'none' }, 0.25)
      .to(rest, { opacity: 1, y: 0, stagger: 0.08 }, 0.6);
    var h1done = false;
    var revealH1 = function () {
      if (h1done) return; h1done = true;
      G.set(h1, { autoAlpha: 1 });
      if (window.SplitText) {
        var split = new window.SplitText(h1, { type: 'lines', mask: 'lines' });
        G.from(split.lines, { yPercent: 110, duration: 1.1, stagger: 0.09, onComplete: function () { split.revert(); } });
      } else G.from(h1, { opacity: 0, y: 24, duration: 1 });
    };
    if (d.fonts && d.fonts.ready) { d.fonts.ready.then(revealH1); setTimeout(revealH1, 1200); }
    else revealH1();
    var gl = G.fromTo(gleam, { xPercent: -120 }, { xPercent: 120, duration: 2.6, ease: 'power1.inOut', repeat: -1, repeatDelay: 7, delay: 1.9 });
    ST.create({ trigger: hero, start: 'top bottom', end: 'bottom top', onToggle: function (st) { st.isActive ? gl.resume() : gl.pause(); } });
    G.to('.hero__car', { opacity: 0.2, yPercent: 6, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    G.to('.ceil', { opacity: 0.1, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 30%', scrub: true } });
    }

    /* боксы: лампа загорается, кадр проявляется полосами сверху вниз; уходя, свет гаснет */
    $$('.bay__media, .transfer__media, .req__side').forEach(function (m) {
      var host = m.closest('.bay') || m.parentNode, lamp = $('.lamp', m), frames = $$('.frame', m);
      var info = m.closest('.bay') ? $$('.bay__info > *', host) : [];
      var t = G.timeline({ paused: true });
      t.fromTo(lamp, { opacity: 0 }, { keyframes: { opacity: [0, 0.8, 0.2, 1] }, duration: 0.55, ease: 'none' }, 0);
      frames.forEach(function (f, i) {
        t.to($$('.slats i', f), { opacity: 0, duration: 0.55, stagger: 0.07, ease: 'power2.out' }, 0.3 + i * 0.14);
      });
      if (info.length) t.fromTo(info, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.07 }, 0.35);
      var on = function () { t.timeScale(1).play(); }, off = function () { t.timeScale(2.2).reverse(); };
      ST.create({ trigger: host, start: 'top 68%', end: 'bottom 28%', onEnter: on, onEnterBack: on, onLeave: off, onLeaveBack: off });
    });
    $$('.role__ph, .cls .frame').forEach(function (f) {
      G.to($$('.slats i', f), { opacity: 0, duration: 0.55, stagger: 0.07, ease: 'power2.out', scrollTrigger: { trigger: f, start: 'top 86%' } });
    });

    /* общее проявление */
    var lit = $$('.lit, .shead > *, .sub, .facts li, .park__more > *, .geo li, .cts__btns, .transfer__txt > .btn');
    G.set(lit, { opacity: 0, y: 22 });
    ST.batch(lit, { start: 'top 90%', once: true, onEnter: function (b) { G.to(b, { opacity: 1, y: 0, stagger: 0.08, overwrite: true }); } });

    /* маршрут */
    var line = $('.route__line');
    if (line) {
      var rt = G.timeline({ scrollTrigger: { trigger: '.route', start: 'top 82%' } });
      rt.fromTo(line, { scaleX: 0, transformOrigin: '0 50%' }, { scaleX: 1, duration: 1.6, ease: 'power2.inOut' }, 0)
        .fromTo('.route__n', { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.3 }, 0.1);
    }

    /* шаги: линия света проходит над этапами */
    var rail = $('.steps__rail i'), steps = $$('.step');
    if (steps.length) {
      var stl = G.timeline({ scrollTrigger: { trigger: '.steps', start: 'top 82%', end: 'top 36%', scrub: 0.6 } });
      stl.fromTo(rail, { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: 1 }, 0)
        .fromTo($$('.step__n'), { opacity: 0.25 }, { opacity: 1, ease: 'none', duration: 0.25, stagger: 0.25 }, 0);
    }

    if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { ST.refresh(); });
    window.addEventListener('load', function () { ST.refresh(); });
  }

  /* сначала язык, потом сцена: текст героя не должен смениться посреди раскрытия */
  var started = false;
  function go() { if (started) return; started = true; start(); }
  if (startLang === 'ru') { apply('ru'); go(); }
  else { setLang(startLang, false, go); setTimeout(go, 1500); }
})();
