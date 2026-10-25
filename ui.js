// ============================================================
// ui.js — общее поведение ВСЕХ страниц (редакция «Apple»).
//  1. Стеклянная шапка: тонкая линия при прокрутке, тёмное стекло над ночным экраном.
//  2. Первый экран внутренних страниц: звёздное небо и маленькая звезда.
//  3. Блоки мягко появляются при прокрутке (пружина без отскока).
//  4. Цифры об отеле досчитываются, когда видны.
//  5. (Прокрутка колесом — родная, браузерная, без перехвата.)
//  6. Пружины (как в iOS): «отклик» (response) и «затухание» (damping).
//  7. Окно номера вырастает из карточки и уходит обратно (компьютер и телефон);
//     на телефоне его можно смахнуть вниз пальцем.
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
  let scrollRaf = 0;
  window.addEventListener('scroll', () => { if (!scrollRaf) scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; onScroll(); }); }, { passive: true });

  // ---------- 1б. Логотип зовёт вернуться на главную ----------
  // На внутренних страницах: стрелка ‹ перед звездой, при наведении — подпись «на главную».
  const logo = header && header.querySelector('.logo');
  const isHome = !!document.getElementById('story');
  if (logo && !isHome) {
    logo.classList.add('logo-inner');
    const back = document.createElement('span');
    back.className = 'logo-back'; back.setAttribute('aria-hidden', 'true');
    logo.prepend(back);
    const words = logo.querySelector('.logo-words');
    if (words) {
      const home = document.createElement('span');
      home.className = 'logo-home'; home.setAttribute('aria-hidden', 'true');
      home.textContent = 'На главную';
      words.appendChild(home);
    }
  }

  // ---------- 2. Первый экран внутренних страниц ----------
  const hero = document.querySelector('section.hero');
  if (hero) {
    hero.classList.add('page-hero', 'theme-night');
    const sky = document.createElement('div');
    sky.className = 'ph-sky'; sky.setAttribute('aria-hidden', 'true');
    const many = window.innerWidth < 760 ? 30 : 64;
    hero.prepend(sky);
    if (window.ZNSky) ZNSky(sky, { count: many, size: 2, spread: 1, alpha: .7, seed: 3 });
    const star = document.createElement('div');
    star.className = 'ph-star'; star.setAttribute('aria-hidden', 'true');
    star.innerHTML = '<i class="ph-halo"></i><svg viewBox="-100 -100 200 200"><path d="M0-100C2-30 3-6 7-7 6-3 30-2 100 0 30 2 6 3 7 7 3 6 2 30 0 100-2 30-3 6-7 7-6 3-30 2-100 0-30-2-6-3-7-7-3-6-2-30 0-100Z"/></svg><i class="ph-core"></i>';
    hero.insertBefore(star, hero.querySelector('h1'));
    // Заголовок: самое длинное слово всегда помещается целиком (не обрезается «конфиденциальн…»)
    const h1 = hero.querySelector('h1');
    if (h1) {
      const fit = () => {
        h1.style.fontSize = '';
        let i = 0;
        while (h1.scrollWidth > h1.clientWidth + 1 && i++ < 6) {
          const fs = parseFloat(getComputedStyle(h1).fontSize);
          h1.style.fontSize = (fs * h1.clientWidth / h1.scrollWidth * 0.98).toFixed(1) + 'px';
        }
      };
      fit();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
      let ft = 0, fw = window.innerWidth; window.addEventListener('resize', () => { if (window.innerWidth === fw) return; fw = window.innerWidth; clearTimeout(ft); ft = setTimeout(fit, 120); });
    }
    // Подстраховка: если браузер не проиграл появление (вкладка открылась в фоне и т. п.),
    // через 1,6 с заголовок и звезда всё равно на месте
    setTimeout(() => hero.classList.add('ph-shown'), 900);
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
      // считаем, когда гость перестал листать: смена цифр перестраивает текст, а во время
      // прокрутки процессор нужен заставке
      const el = e.target;
      (window.ZNCalm || ((f, d) => setTimeout(f, d)))(() => count(el), 60);
    }), { threshold: 0.6 });
    function count(el) {
      const to = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now(), dur = 1400;
      (function tick(now) {
        const k = Math.min(1, (now - t0) / dur), v = 1 - Math.pow(1 - k, 4);
        // меняем сам текст, а не узел — так браузер не пересчитывает стили всей страницы
        const tn = el.firstChild; if (tn && tn.nodeType === 3) tn.data = fmt(Math.round(to * v)) + suf; else el.textContent = fmt(Math.round(to * v)) + suf;
        if (k < 1) requestAnimationFrame(tick);
      })(t0);
    }
    counters.forEach(el => { el.textContent = '0' + (el.dataset.suffix || ''); io3.observe(el); });
  }
})();

// ---------- 5. Прокрутка колесом — родная, браузерная ----------
// Раньше колесо мыши перехватывалось и «сглаживалось» скриптом. Это давало
// задержку и подлагивания: браузер сам прокручивает плавнее и без нагрузки.

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
  // затемнение — отдельный слой: меняем только его прозрачность (раньше менялась переменная
  // у всего окна, и браузер пересчитывал стили всего содержимого в каждом кадре)
  const scrim = document.createElement('div');
  scrim.className = 'modal-scrim'; scrim.setAttribute('aria-hidden', 'true');
  modal.prepend(scrim); modal.classList.add('has-scrim');
  const setScrim = v => { scrim.style.opacity = v; };
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileQ = window.matchMedia('(max-width: 760px)');
  let mode = '', spring = null, from = null, open = false, H = 0, dragOff = 0, back = null;

  // ---- Телефон: шторка двигается по вертикали (y в пикселях, 0 — открыта, H — спрятана) ----
  function setY(y) {
    sheet.style.transform = 'translate3d(0,' + y.toFixed(2) + 'px,0)';
    setScrim(Math.max(0, Math.min(1, 1 - y / H)).toFixed(3));
  }
  // ---- Компьютер: окно вырастает из карточки (p: 0 — карточка, 1 — окно) ----
  function setP(p) {
    if (!from) { sheet.style.transform = 'scale(' + (0.94 + 0.06 * p).toFixed(4) + ')'; sheet.style.opacity = Math.min(1, p * 1.6).toFixed(3); setScrim(Math.max(0, Math.min(1, p)).toFixed(3)); return; }
    const q = 1 - p;
    // dragOff — насколько окно стянули пальцем вниз: из этого места оно и уходит обратно в карточку
    sheet.style.transform = 'translate3d(' + (from.dx * q).toFixed(2) + 'px,' + (from.dy * q + dragOff * p).toFixed(2) + 'px,0) scale(' + ((from.s + (1 - from.s) * p) * (1 - dragShrink(dragOff) * p)).toFixed(4) + ')';
    sheet.style.opacity = Math.max(0, Math.min(1, p * 1.8)).toFixed(3);
    setScrim(Math.max(0, Math.min(1, p * (1 - Math.max(0, Math.min(1, dragOff / (H || 1))) * 0.8))).toFixed(3));
  }
  // ---- Телефон: окно тянут пальцем вниз (y — сдвиг в пикселях) ----
  const dragShrink = y => Math.max(0, Math.min(1, y / (H || 1))) * 0.08;
  function setDrag(y) {
    sheet.style.transform = 'translate3d(0,' + y.toFixed(2) + 'px,0) scale(' + (1 - dragShrink(y)).toFixed(4) + ')';
    setScrim(Math.max(0, Math.min(1, 1 - Math.max(0, y) / (H || 1) * 0.8)).toFixed(3));
  }
  function reset() {
    sheet.style.transform = ''; sheet.style.opacity = ''; scrim.style.opacity = '';
  }

  function openSheet(card) {
    open = true;
    root.classList.add('sheet-lock');
    modal.classList.add('show');
    sheet.scrollTop = 0;
    if (reduce) { reset(); modal.classList.add('blurred'); return; }
    // и на компьютере, и на телефоне окно вырастает из карточки, на которую нажали
    mode = 'pop'; dragOff = 0;
    if (back) { back.stop(); back = null; }
    {
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
      modal.classList.remove('blurred');
      spring = ZNSpring({ from: startP, to: 1, response: 0.36, damping: 1, precision: 0.004, onUpdate: setP, onDone: () => { if (open) modal.classList.add('blurred'); } }).start();
    }
    setTimeout(() => { const b = modal.querySelector('.close-btn'); if (b) b.focus({ preventScroll: true }); }, 50);
  }

  function closeSheet(velocity) {
    if (!open) return;
    open = false;
    root.classList.remove('sheet-lock');                    // страницу можно листать сразу (ссылка «Забронировать» сработает)
    const done = () => { if (!open) { modal.classList.remove('show', 'blurred'); reset(); } };
    if (reduce || !spring) { done(); return; }
    modal.classList.remove('blurred');                     // размытие убираем сразу — уход окна лёгкий
    if (back) { back.stop(); back = null; }
    spring.retarget(0, { response: 0.3, damping: 1, onDone: done });   // уходит туда же, откуда пришло
  }
  window.ZNSheet = { open: openSheet, close: () => closeSheet(0) };

  // Закрытие с клавиатуры по кнопке ×
  const closeBtn = modal.querySelector('.close-btn');
  if (closeBtn) closeBtn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeSheet(0); } });

  // ---- Жест: тянем шторку пальцем (телефон) ----
  let tracking = false, dragging = false, decided = false, y0 = 0, x0 = 0, base = 0, inGrab = false, hist = [];
  const rubber = (over, dim) => (over * dim * 0.55) / (dim + 0.55 * Math.abs(over));   // мягкое сопротивление у края
  sheet.addEventListener('touchstart', e => {
    if (!mobileQ.matches || reduce || !open || e.touches.length > 1 || (spring && spring.raf)) return;
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
        if (back) { back.stop(); base = back.value; back = null; } else base = 0;
        modal.classList.remove('blurred');                    // пока тянут пальцем — без размытия
        H = sheet.offsetHeight;
        y0 = t.clientY;                                           // уважаем место, где схватили
      } else { tracking = false; return; }
    }
    if (!dragging) return;
    e.preventDefault();
    let y = base + (t.clientY - y0);
    if (y < 0) y = -rubber(-y, H);
    dragOff = y;
    setDrag(y);
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
    const y = dragOff;
    // куда «долетело» бы окно по инерции (формула Apple, замедление 0.998)
    const projected = y + (v / 1000) * 0.998 / (1 - 0.998);
    if (projected > H * 0.35 && v > -200) closeSheet(v);              // смахнули — уходит обратно в карточку
    else {                                                            // не дотянули — мягко возвращается на место
      back = ZNSpring({ from: y, to: 0, velocity: v, response: 0.32, damping: 1, onUpdate: yy => { dragOff = yy; setDrag(yy); }, onDone: () => { back = null; dragOff = 0; if (open) modal.classList.add('blurred'); } }).start();
    }
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
    const calc = () => Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, el.getBoundingClientRect().top + scrollY - head + 1));
    let to = calc(), n = 0;
    const dist = Math.abs(to - scrollY);
    // блоки ниже экрана дорисовываются по пути и могут сдвинуть цель — подправляем её на ходу
    const done = () => { const t2 = calc(); if (sp && Math.abs(t2 - scrollY) > 2) { to = t2; sp.retarget(to, { response: 0.3, onDone: () => { sp = null; } }); } else sp = null; };
    sp = ZNSpring({ from: scrollY, to, response: Math.min(1.1, 0.5 + dist / 9000), damping: 1,
      onUpdate: v => { window.scrollTo({ top: v, behavior: 'instant' }); if (++n % 4 === 0 && sp) { const t2 = calc(); if (Math.abs(t2 - to) > 2) { to = t2; sp.retarget(to); } } },
      onDone: done }).start();
    if (history.replaceState) history.replaceState(null, '', url.hash);
  });
})();

// ---------- 10. «Перейти к содержанию» для клавиатуры и экранных дикторов ----------
(function () {
  const header = document.querySelector('header');
  if (!header) return;
  let main = header.nextElementSibling;
  while (main && !/^(SECTION|MAIN|DIV)$/.test(main.tagName)) main = main.nextElementSibling;
  if (!main) return;
  if (!main.id) main.id = 'content';
  main.setAttribute('tabindex', '-1');
  main.style.outline = 'none';
  const a = document.createElement('a');
  a.className = 'skip-link'; a.href = '#' + main.id; a.textContent = 'Перейти к содержанию';
  document.body.prepend(a);
  a.addEventListener('click', e => { e.preventDefault(); main.focus({ preventScroll: true }); main.scrollIntoView(); });
})();

// ---------- 11. Сторож плавности ----------
// Пока на экране идут анимации, считаем кадры. Если устройство не успевает
// (медленные кадры встречаются часто), включаем лёгкий режим (класс lite).
(function () {
  if (!window.ZNPerf || ZNPerf.isLite() || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let raf = 0, t = [], last = 0, until = 0, checks = 0;
  function judge() {
    if (t.length < 24) return;
    const s = t.slice().sort((a, b) => a - b), med = s[s.length >> 1];
    const slow = t.filter(x => x > 34).length / t.length;
    checks++;
    if (med > 24 || slow > 0.22) ZNPerf.setLite();
  }
  function frame(now) {
    if (document.hidden) { raf = 0; t = []; last = 0; return; }
    if (last) { const d = now - last; if (d < 250) t.push(d); }   // долгие паузы (вкладка свёрнута) не считаем
    last = now;
    if (now < until && !ZNPerf.isLite()) raf = requestAnimationFrame(frame);
    else { raf = 0; last = 0; judge(); t = []; }
  }
  function watch(ms) {
    if (ZNPerf.isLite() || checks >= 6 || raf) return;
    until = performance.now() + ms; t = []; last = 0;
    raf = requestAnimationFrame(frame);
  }
  // первая проверка — после загрузки (идёт появление звезды), дальше — во время прокрутки
  const start = () => setTimeout(() => watch(2500), 900);
  if (document.readyState === 'complete') start(); else window.addEventListener('load', start, { once: true });
  let cool = 0;
  window.addEventListener('scroll', () => { if (!raf && performance.now() > cool) { cool = performance.now() + 4000; watch(1800); } }, { passive: true });
})();

// ============================================================
// 12. «КАК НА iPHONE»: отклик, пилюли-переключатели, островок-уведомление, листы
// ============================================================

// Лёгкая вибрация на важных действиях (Android; iPhone в браузере не вибрирует)
window.ZNTap = function (ms) {
  try { if (navigator.vibrate && window.matchMedia('(pointer: coarse)').matches) navigator.vibrate(ms || 8); } catch (e) { /* нет — и ладно */ }
};

// ---------- Пилюли-переключатели: плашка переезжает к выбранному варианту ----------
// Подходит и для кнопок с aria-pressed (фильтры, вопросы подбора), и для радиокнопок (мессенджер).
window.ZNSeg = (function () {
  const all = [];
  function make(box, itemSel, isOn) {
    if (!box || box.__seg) return;
    box.__seg = true;
    box.classList.add('seg');
    const thumb = document.createElement('span');
    thumb.className = 'seg-thumb'; thumb.setAttribute('aria-hidden', 'true');
    box.prepend(thumb);
    let shown = false;
    function place(instant) {
      const on = [...box.querySelectorAll(itemSel)].find(isOn);
      if (!on || !box.offsetParent) { thumb.style.opacity = '0'; shown = false; return; }
      const el = on.matches('label') ? (on.querySelector('.messenger-card-content') || on) : on;
      const x = el.offsetLeft, y = el.offsetTop;
      let p = el.offsetParent, guard = 0;
      let ox = x, oy = y;
      while (p && p !== box && guard++ < 4) { ox += p.offsetLeft; oy += p.offsetTop; p = p.offsetParent; }
      if (instant || !shown) thumb.classList.add('seg-jump');
      thumb.style.width = el.offsetWidth + 'px';
      thumb.style.height = el.offsetHeight + 'px';
      thumb.style.transform = 'translate(' + ox + 'px,' + oy + 'px)';
      thumb.style.opacity = '1';
      if (instant || !shown) { void thumb.offsetWidth; thumb.classList.remove('seg-jump'); }
      shown = true;
      box.classList.add('seg-ready');
    }
    box.addEventListener('click', e => { if (e.target.closest(itemSel)) { requestAnimationFrame(() => place()); window.ZNTap(6); } });
    box.addEventListener('change', () => requestAnimationFrame(() => place()));
    // кто-то поменял выбор из кода (aria-pressed / checked) — догоняем
    new MutationObserver(() => requestAnimationFrame(() => place())).observe(box, { subtree: true, attributes: true, attributeFilter: ['aria-pressed'] });
    all.push(() => place(true));
    // ставим плашку, только когда переключатель показался на экране (не тормозим открытие страницы)
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); requestAnimationFrame(() => place(true)); } }, { rootMargin: '200px' });
      io.observe(box);
    } else place(true);
  }
  let rt = 0;
  let segW = window.innerWidth;
  window.addEventListener('resize', () => { if (window.innerWidth === segW) return; segW = window.innerWidth; clearTimeout(rt); rt = setTimeout(() => all.forEach(f => f()), 100); });
  function auto() {
    document.querySelectorAll('.chips[role="group"]').forEach(b => make(b, '.chip', c => c.getAttribute('aria-pressed') === 'true'));
    document.querySelectorAll('.quiz-opts').forEach(b => make(b, '.quiz-opt', c => c.getAttribute('aria-pressed') === 'true'));
    document.querySelectorAll('.messenger-options').forEach(b => make(b, '.messenger-card', c => { const i = c.querySelector('input'); return i && i.checked; }));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
  return { make, refresh: () => all.forEach(f => f()) };
})();

// ---------- Островок (как Dynamic Island): шапка-капсула сжимается в чёрную пилюлю с сообщением ----------
window.ZNIsland = (function () {
  const header = document.querySelector('header');
  if (!header) return { show() {}, hide() {} };
  const isl = document.createElement('div');
  isl.className = 'island';
  isl.setAttribute('role', 'status'); isl.setAttribute('aria-live', 'polite');
  isl.innerHTML = '<span class="isl-ico" aria-hidden="true"></span><span class="isl-text"></span>';
  header.appendChild(isl);
  const ico = isl.querySelector('.isl-ico'), txt = isl.querySelector('.isl-text');
  const ICONS = {
    load: '<i class="isl-spin"></i>',
    ok: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" class="isl-ok-bg"/><path d="M7 12.5l3.2 3.2L17 9" class="isl-ok-tick"/></svg>',
    err: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" class="isl-err-bg"/><path d="M12 7v6M12 16.5v.5" class="isl-err-mark"/></svg>',
    moon: '<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" class="isl-moon"/></svg>',
    sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5" class="isl-sun"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" class="isl-rays"/></svg>'
  };
  let timer = 0, on = false;
  function show(o) {
    clearTimeout(timer);
    ico.innerHTML = ICONS[o.icon] || '';
    ico.className = 'isl-ico isl-' + (o.icon || 'none');
    txt.textContent = o.text || '';
    // ширина пилюли — по тексту (меряем без анимации)
    isl.classList.add('isl-measure');
    const w = Math.min(window.innerWidth - 32, Math.ceil(txt.scrollWidth + 32 + (o.icon ? 32 : 0) + 6));   // поля 16+16, значок 22 + зазор 10
    isl.classList.remove('isl-measure');
    isl.style.setProperty('--iw', w + 'px');
    if (!on) { header.classList.add('island-on'); on = true; }
    isl.classList.remove('isl-pop'); void isl.offsetWidth; isl.classList.add('isl-pop');
    if (o.icon === 'ok' || o.icon === 'err') window.ZNTap(o.icon === 'ok' ? [8, 60, 8] : 20);
    if (o.ms) timer = setTimeout(hide, o.ms);
  }
  function hide() {
    clearTimeout(timer);
    if (!on) return;
    on = false;
    header.classList.remove('island-on');
  }
  isl.addEventListener('click', hide);
  return { show, hide };
})();

// ---------- Лист снизу (телефон) / окно по центру (компьютер) ----------
// ZNPanel.open({ title, html, ok: 'Отправить', cancel: 'Изменить', onOk })
window.ZNPanel = (function () {
  let root, card, body, okBtn, cancelBtn, titleEl, onOk = null, last = null;
  const mobile = () => window.matchMedia('(max-width: 640px)').matches;
  function build() {
    root = document.createElement('div');
    root.className = 'zp';
    root.innerHTML =
      '<div class="zp-scrim"></div>' +
      '<div class="zp-card" role="dialog" aria-modal="true">' +
        '<div class="zp-grip" aria-hidden="true"></div>' +
        '<h3 class="zp-title"></h3>' +
        '<div class="zp-body"></div>' +
        '<div class="zp-actions"><button type="button" class="btn btn-large zp-ok"></button><button type="button" class="zp-cancel"></button></div>' +
      '</div>';
    document.body.appendChild(root);
    card = root.querySelector('.zp-card'); body = root.querySelector('.zp-body');
    okBtn = root.querySelector('.zp-ok'); cancelBtn = root.querySelector('.zp-cancel'); titleEl = root.querySelector('.zp-title');
    card.setAttribute('aria-labelledby', 'zpTitle'); titleEl.id = 'zpTitle';
    root.querySelector('.zp-scrim').addEventListener('click', close);
    cancelBtn.addEventListener('click', close);
    okBtn.addEventListener('click', () => { const f = onOk; close(); window.ZNTap(12); if (f) f(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('open')) close(); });
    // смахнуть лист вниз (телефон): лист едет за пальцем, у верхней границы — упругое сопротивление
    let y0 = 0, dy = 0, t0 = 0, drag = false;
    card.addEventListener('pointerdown', e => {
      if (!mobile() || e.pointerType === 'mouse' || e.target.closest('button, a, input')) return;
      drag = true; y0 = e.clientY; dy = 0; t0 = performance.now(); card.setPointerCapture(e.pointerId); root.classList.add('zp-drag');
    });
    card.addEventListener('pointermove', e => {
      if (!drag) return;
      const d = e.clientY - y0;
      dy = d > 0 ? d : -(Math.abs(d) * 40) / (40 + Math.abs(d));      // вверх — резинка
      card.style.setProperty('--zy', dy.toFixed(1) + 'px');
    });
    const end = () => {
      if (!drag) return; drag = false; root.classList.remove('zp-drag');
      const v = dy / Math.max(1, performance.now() - t0);
      if (dy > card.offsetHeight * 0.3 || v > 0.6) close(); else card.style.setProperty('--zy', '0px');
    };
    card.addEventListener('pointerup', end); card.addEventListener('pointercancel', end);
  }
  function open(o) {
    if (!root) build();
    titleEl.textContent = o.title || '';
    body.innerHTML = o.html || '';
    okBtn.textContent = o.ok || 'Готово';
    cancelBtn.textContent = o.cancel || 'Отмена';
    onOk = o.onOk || null;
    last = document.activeElement;
    card.style.setProperty('--zy', '0px');
    root.classList.toggle('zp-mobile', mobile());
    root.classList.add('show');
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('open')));
    document.documentElement.classList.add('zp-lock');
    setTimeout(() => okBtn.focus({ preventScroll: true }), 80);
  }
  function close() {
    if (!root || !root.classList.contains('open')) return;
    root.classList.remove('open');
    card.style.removeProperty('--zy');
    document.documentElement.classList.remove('zp-lock');
    setTimeout(() => { if (!root.classList.contains('open')) root.classList.remove('show'); }, 450);
    if (last && last.focus) last.focus({ preventScroll: true });
  }
  return { open, close };
})();

// ---------- Пришли по ссылке с #якорем (например, «…/index.html#kontakty» с другой страницы) ----------
// Блоки выше якоря дорисовываются после загрузки и сдвигают его — доводим прокрутку до места.
(function () {
  const id = decodeURIComponent((location.hash || '').slice(1));
  const el = id && document.getElementById(id);
  if (!el) return;
  let touched = false;
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(t => window.addEventListener(t, () => { touched = true; }, { passive: true, once: true }));
  const fix = () => {
    if (touched) return;
    const head = (document.querySelector('header') || { offsetHeight: 0 }).offsetHeight;
    const to = Math.round(el.getBoundingClientRect().top + scrollY - head + 1);
    if (Math.abs(to - scrollY) > 2) window.scrollTo({ top: to, behavior: 'instant' });
  };
  const run = () => { fix(); requestAnimationFrame(fix); setTimeout(fix, 400); setTimeout(fix, 1200); };
  if (document.readyState === 'complete') run(); else window.addEventListener('load', run, { once: true });
})();

// ---------- Блоки ниже экрана дорисовываются заранее, в паузах ----------
// Иначе браузер дорисовывал бы их в момент, когда до них долистали, — и прокрутка на миг «спотыкалась».
(function () {
  const list = [...document.querySelectorAll('body > section:not(.story):not(.hero), body > .site-footer')];
  if (!list.length || !window.ZNCalm) return;
  const start = () => list.forEach((el, i) => ZNCalm(() => el.classList.add('cv-ready'), 600 + i * 120));
  if (document.readyState === 'complete') start(); else window.addEventListener('load', start, { once: true });
})();
