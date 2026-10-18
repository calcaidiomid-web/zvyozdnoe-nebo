// ============================================================
// ui.js — общее поведение ВСЕХ страниц (редакция «Apple»).
//  1. Стеклянная шапка: тонкая линия при прокрутке, тёмное стекло над ночным экраном.
//  2. Первый экран внутренних страниц: звёздное небо и маленькая звезда.
//  3. Блоки мягко появляются при прокрутке (пружина без отскока).
//  4. Цифры об отеле досчитываются, когда видны.
//  5. Плавная прокрутка колесом мыши (только компьютер).
//  6. Пружины (как в iOS): «отклик» (response) и «затухание» (damping).
//  7. Окно номера: на компьютере вырастает из карточки и уходит обратно,
//     на телефоне — шторка снизу: тянется за пальцем 1:1, бросок с инерцией.
// Двигаем только transform и opacity — это плавно даже на телефоне.
// ============================================================
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const header = document.querySelector('header');

  // iOS показывает :active (нажатие) только если на странице есть touchstart
  document.addEventListener('touchstart', function () {}, { passive: true });

  // ---------- 1. Шапка ----------
  let night = null;
  function onScroll() {
    if (!header) return;
    night = night || document.querySelector('.story, .page-hero');
    header.classList.toggle('is-scrolled', window.scrollY > 8);
    if (night) header.classList.toggle('theme-night', night.getBoundingClientRect().bottom > header.offsetHeight);
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // ---------- 2. Первый экран внутренних страниц ----------
  const hero = document.querySelector('section.hero');
  if (hero) {
    hero.classList.add('page-hero', 'theme-night');
    const sky = document.createElement('div');
    sky.className = 'ph-sky'; sky.setAttribute('aria-hidden', 'true');
    let seed = 3;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const many = window.innerWidth < 760 ? 30 : 64;
    for (let i = 0; i < many; i++) {
      const s = document.createElement('i');
      s.style.left = (rnd() * 100).toFixed(2) + '%';
      s.style.top = (rnd() * 100).toFixed(2) + '%';
      s.style.setProperty('--s', (0.4 + rnd()).toFixed(2));
      s.style.animationDelay = (-rnd() * 6).toFixed(2) + 's';
      s.style.animationDuration = (4 + rnd() * 5).toFixed(2) + 's';
      sky.appendChild(s);
    }
    hero.prepend(sky);
    const star = document.createElement('div');
    star.className = 'ph-star'; star.setAttribute('aria-hidden', 'true');
    star.innerHTML = '<i class="ph-halo"></i><svg viewBox="-100 -100 200 200"><path d="M0-100C2-30 3-6 7-7 6-3 30-2 100 0 30 2 6 3 7 7 3 6 2 30 0 100-2 30-3 6-7 7-6 3-30 2-100 0-30-2-6-3-7-7-3-6-2-30 0-100Z"/></svg><i class="ph-core"></i>';
    hero.insertBefore(star, hero.querySelector('h1'));
    // небо слегка следует за мышкой (мягко догоняет)
    if (fine && !reduce) {
      let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
      const step = () => {
        x += (tx - x) * 0.08; y += (ty - y) * 0.08;
        sky.style.transform = 'translate3d(' + (-x * 18).toFixed(1) + 'px,' + (-y * 12).toFixed(1) + 'px,0)';
        raf = (Math.abs(tx - x) > 0.001 || Math.abs(ty - y) > 0.001) ? requestAnimationFrame(step) : 0;
      };
      hero.addEventListener('pointermove', e => {
        const r = hero.getBoundingClientRect();
        tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5;
        if (!raf) raf = requestAnimationFrame(step);
      }, { passive: true });
      hero.addEventListener('pointerleave', () => { tx = ty = 0; if (!raf) raf = requestAnimationFrame(step); });
    }
  }
  onScroll();

  // ---------- 3. Появление блоков при прокрутке ----------
  if ('IntersectionObserver' in window && !reduce) {
    const mark = (sel, cls, step) => document.querySelectorAll(sel).forEach((el, i) => {
      if (el.closest('.story, .modal')) return;
      el.classList.add('rv'); if (cls) el.classList.add(cls);
      if (step) el.style.setProperty('--d', ((i % 4) * step).toFixed(2) + 's');
    });
    mark('.section-head');
    mark('section:not(.hero):not(.story) > h2');
    mark('.stat', '', 0.06);
    mark('.quick-book', 'rv-zoom');
    mark('.rooms .card', '', 0.08);
    mark('.feature', '', 0.06);
    mark('.ud-row > *', '', 0.1);
    mark('.contacts, .booking-form, .finale-text, .finale-star');
    mark('.service-card, .direction-card, .review-card, .faq-item, .addr-card, .page-cta, .ask-box, .rev-cta, .quiz, .cmp-wrap, .route-btn, .av-dates, .cal-wrap, .room-section', '', 0.06);
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.rv, .route').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.route').forEach(el => el.classList.add('in'));
  }

  // ---------- 4. Счётчики ----------
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduce) {
    const fmt = n => n.toLocaleString('ru-RU');
    const io3 = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      io3.unobserve(e.target);
      const el = e.target, to = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now(), dur = 1400;
      (function tick(now) {
        const k = Math.min(1, (now - t0) / dur), v = 1 - Math.pow(1 - k, 4);
        el.textContent = fmt(Math.round(to * v)) + suf;
        if (k < 1) requestAnimationFrame(tick);
      })(t0);
    }), { threshold: 0.6 });
    counters.forEach(el => { el.textContent = '0' + (el.dataset.suffix || ''); io3.observe(el); });
  }
})();

// ---------- 5. Плавная прокрутка колесом мыши (только компьютер) ----------
(function () {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fine || reduce) return;
  const root = document.documentElement;
  let cur = window.scrollY, target = cur, raf = 0, last = 0, mine = false;
  const maxY = () => root.scrollHeight - window.innerHeight;
  function canScrollInside(el, dy) {
    for (; el && el !== document.body && el !== root; el = el.parentElement) {
      const cs = getComputedStyle(el);
      if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1) {
        if (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true;
      }
    }
    return false;
  }
  const locked = () => getComputedStyle(document.body).overflow === 'hidden' || getComputedStyle(root).overflow === 'hidden';
  function step(now) {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    cur += (target - cur) * (1 - Math.exp(-dt * 11));
    if (Math.abs(target - cur) < 0.5) cur = target;
    mine = true;
    window.scrollTo({ top: cur, behavior: 'instant' });
    if (cur !== target) raf = requestAnimationFrame(step);
    else { raf = 0; last = 0; setTimeout(() => { mine = false; }, 60); }
  }
  window.addEventListener('wheel', e => {
    if (e.ctrlKey || e.defaultPrevented || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1);
    if (!dy || locked() || canScrollInside(e.target, dy)) return;
    e.preventDefault();
    if (!raf) cur = target = window.scrollY;
    target = Math.max(0, Math.min(maxY(), target + dy));
    if (!raf) { last = 0; raf = requestAnimationFrame(step); }
  }, { passive: false });
  window.addEventListener('scroll', () => { if (!raf && !mine) cur = target = window.scrollY; }, { passive: true });
})();

// ---------- 6. Пружина, как в iOS ----------
// response — за сколько секунд значение примерно доходит до цели; damping 1 — без отскока.
// Пружину можно в любой момент перенаправить: она продолжит с текущей скорости, без рывка.
window.ZNSpring = function (opts) {
  const s = { value: opts.from, velocity: opts.velocity || 0, target: opts.to, raf: 0, last: 0 };
  let response = opts.response || 0.4, damping = opts.damping == null ? 1 : opts.damping;
  function step(now) {
    const k = Math.pow(2 * Math.PI / response, 2), c = 4 * Math.PI * damping / response;
    let dt = s.last ? Math.min(0.064, (now - s.last) / 1000) : 1 / 60;
    s.last = now;
    // несколько маленьких шагов за кадр — устойчиво при любом FPS
    const n = Math.ceil(dt / (1 / 240)), h = dt / n;
    for (let i = 0; i < n; i++) {
      const a = -k * (s.value - s.target) - c * s.velocity;
      s.velocity += a * h; s.value += s.velocity * h;
    }
    opts.onUpdate(s.value);
    if (Math.abs(s.velocity) < 0.5 && Math.abs(s.value - s.target) < 0.5 * (opts.precision || 1)) {
      s.value = s.target; s.velocity = 0; s.raf = 0; s.last = 0;
      opts.onUpdate(s.value);
      if (opts.onDone) opts.onDone();
      return;
    }
    s.raf = requestAnimationFrame(step);
  }
  s.start = function () { if (!s.raf) { s.last = 0; s.raf = requestAnimationFrame(step); } return s; };
  s.retarget = function (to, o) {
    s.target = to;
    if (o) { if (o.velocity != null) s.velocity = o.velocity; if (o.response) response = o.response; if (o.damping != null) damping = o.damping; if (o.onDone !== undefined) opts.onDone = o.onDone; }
    return s.start();
  };
  s.stop = function () { cancelAnimationFrame(s.raf); s.raf = 0; s.last = 0; };
  return s;
};

// ---------- 7. Окно номера: шторка / всплывающее окно ----------
(function () {
  const modal = document.getElementById('roomModal');
  if (!modal) return;
  const sheet = modal.querySelector('.modal-content');
  const grab = modal.querySelector('.sheet-grab');
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileQ = window.matchMedia('(max-width: 760px)');
  let mode = '', spring = null, from = null, open = false, H = 0;

  // ---- Телефон: шторка двигается по вертикали (y в пикселях, 0 — открыта, H — спрятана) ----
  function setY(y) {
    sheet.style.transform = 'translate3d(0,' + y.toFixed(2) + 'px,0)';
    modal.style.setProperty('--scrim', Math.max(0, Math.min(1, 1 - y / H)).toFixed(3));
  }
  // ---- Компьютер: окно вырастает из карточки (p: 0 — карточка, 1 — окно) ----
  function setP(p) {
    if (!from) { sheet.style.transform = 'scale(' + (0.94 + 0.06 * p).toFixed(4) + ')'; sheet.style.opacity = Math.min(1, p * 1.6).toFixed(3); modal.style.setProperty('--scrim', Math.max(0, Math.min(1, p)).toFixed(3)); return; }
    const q = 1 - p;
    sheet.style.transform = 'translate3d(' + (from.dx * q).toFixed(2) + 'px,' + (from.dy * q).toFixed(2) + 'px,0) scale(' + (from.s + (1 - from.s) * p).toFixed(4) + ')';
    sheet.style.opacity = Math.max(0, Math.min(1, p * 1.8)).toFixed(3);
    modal.style.setProperty('--scrim', Math.max(0, Math.min(1, p)).toFixed(3));
  }
  function reset() {
    sheet.style.transform = ''; sheet.style.opacity = ''; modal.style.removeProperty('--scrim');
  }

  function openSheet(card) {
    open = true;
    root.classList.add('sheet-lock');
    modal.classList.add('show');
    sheet.scrollTop = 0;
    if (reduce) { reset(); return; }
    mode = mobileQ.matches ? 'sheet' : 'pop';
    if (mode === 'sheet') {
      H = sheet.offsetHeight + 40;
      const startY = spring && spring.raf ? spring.value : H;        // перехват на лету — с текущего места
      if (spring) spring.stop();
      spring = ZNSpring({ from: startY, to: 0, velocity: spring ? spring.velocity : 0, response: 0.42, damping: 1, onUpdate: setY }).start();
    } else {
      from = null;
      if (card) {
        const c = card.getBoundingClientRect(), r = sheet.getBoundingClientRect();
        from = {
          dx: (c.left + c.width / 2) - (r.left + r.width / 2),
          dy: (c.top + c.height / 2) - (r.top + r.height / 2),
          s: Math.max(0.35, Math.min(0.9, Math.min(c.width / r.width, c.height / r.height)))
        };
      }
      const startP = spring && spring.raf ? spring.value : 0;
      if (spring) spring.stop();
      spring = ZNSpring({ from: startP, to: 1, response: 0.5, damping: 1, precision: 0.002, onUpdate: setP }).start();
    }
    setTimeout(() => { const b = modal.querySelector('.close-btn'); if (b) b.focus({ preventScroll: true }); }, 50);
  }

  function closeSheet(velocity) {
    if (!open) return;
    open = false;
    root.classList.remove('sheet-lock');                    // страницу можно листать сразу (ссылка «Забронировать» сработает)
    const done = () => { if (!open) { modal.classList.remove('show'); reset(); } };
    if (reduce || !spring) { done(); return; }
    if (mode === 'sheet') {
      spring.retarget(H, { velocity: velocity || spring.velocity, response: 0.36, damping: 1, onDone: done });
    } else {
      spring.retarget(0, { response: 0.42, damping: 1, onDone: done });   // уходит туда же, откуда пришло
    }
  }
  window.ZNSheet = { open: openSheet, close: () => closeSheet(0) };

  // Закрытие с клавиатуры по кнопке ×
  const closeBtn = modal.querySelector('.close-btn');
  if (closeBtn) closeBtn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeSheet(0); } });

  // ---- Жест: тянем шторку пальцем (телефон) ----
  let tracking = false, dragging = false, decided = false, y0 = 0, x0 = 0, base = 0, inGrab = false, hist = [];
  const rubber = (over, dim) => (over * dim * 0.55) / (dim + 0.55 * Math.abs(over));   // мягкое сопротивление у края
  sheet.addEventListener('touchstart', e => {
    if (mode !== 'sheet' || !open || e.touches.length > 1) return;
    const t = e.touches[0];
    tracking = true; dragging = false; decided = false;
    x0 = t.clientX; y0 = t.clientY; hist = [{ y: t.clientY, t: e.timeStamp }];
    inGrab = !!(grab && (e.target === grab || grab.contains(e.target)));
  }, { passive: true });
  sheet.addEventListener('touchmove', e => {
    if (!tracking) return;
    const t = e.touches[0], dx = t.clientX - x0, dy = t.clientY - y0;
    if (!decided) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;          // порог ~10px, чтобы понять намерение
      decided = true;
      if (Math.abs(dx) > Math.abs(dy) && !inGrab) { tracking = false; return; }   // листают фото — не мешаем
      if (inGrab || (sheet.scrollTop <= 0 && dy > 0)) {
        dragging = true;
        if (spring) spring.stop();
        base = spring ? spring.value : 0;
        y0 = t.clientY;                                           // уважаем место, где схватили
      } else { tracking = false; return; }
    }
    if (!dragging) return;
    e.preventDefault();
    let y = base + (t.clientY - y0);
    if (y < 0) y = -rubber(-y, H);
    if (spring) { spring.value = y; spring.velocity = 0; }
    setY(y);
    hist.push({ y: t.clientY, t: e.timeStamp });
    if (hist.length > 6) hist.shift();
  }, { passive: false });
  function endDrag(e) {
    if (!tracking) return;
    tracking = false;
    if (!dragging) return;
    dragging = false;
    // скорость пальца за последние ~100 мс (px/с)
    let v = 0;
    const lastP = hist[hist.length - 1];
    for (let i = hist.length - 2; i >= 0; i--) {
      if (lastP.t - hist[i].t > 30) { v = (lastP.y - hist[i].y) / ((lastP.t - hist[i].t) / 1000); break; }
    }
    const y = spring ? spring.value : 0;
    // куда «долетит» шторка по инерции (формула Apple, замедление 0.998)
    const projected = y + (v / 1000) * 0.998 / (1 - 0.998);
    if (projected > H * 0.5 && v > -200) closeSheet(v);
    else if (spring) spring.retarget(0, { velocity: v, response: 0.32, damping: 0.8 });   // бросок — лёгкий отскок
  }
  sheet.addEventListener('touchend', endDrag);
  sheet.addEventListener('touchcancel', endDrag);
})();

// ---------- 8. Фото проявляются после загрузки ----------
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    if (img.complete && img.naturalWidth) return;
    img.classList.add('lz');
    const ok = () => img.classList.add('ok');
    img.addEventListener('load', ok, { once: true });
    img.addEventListener('error', ok, { once: true });
  });
})();

// ---------- 9. Ссылки внутри страницы: прокрутка пружиной ----------
// Плавный старт и мягкая остановка без рывка; любое касание, колесо или клавиша
// сразу отдают управление человеку.
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let sp = null;
  const stop = () => { if (sp) { sp.stop(); sp = null; } };
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(t => window.addEventListener(t, stop, { passive: true }));
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a) return;
    const url = new URL(a.getAttribute('href'), location.href);
    if (url.pathname !== location.pathname || !url.hash || url.hash.length < 2) return;
    const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!el) return;
    e.preventDefault();
    stop();
    const head = (document.querySelector('header') || { offsetHeight: 0 }).offsetHeight;
    const to = Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, el.getBoundingClientRect().top + scrollY - head + 1));
    const dist = Math.abs(to - scrollY);
    sp = ZNSpring({ from: scrollY, to, response: Math.min(1.1, 0.5 + dist / 9000), damping: 1, onUpdate: v => window.scrollTo({ top: v, behavior: 'instant' }), onDone: () => { sp = null; } }).start();
    if (history.replaceState) history.replaceState(null, '', url.hash);
  });
})();
