// ============================================
// menu.js — меню-«бургер» для телефонов и планшетов
// Подключено на всех страницах сайта
// ============================================
// ------------------------------------------------------------
// Ссылка на профиль отеля в мессенджере MAX.
// Где взять: приложение MAX → профиль → «Поделиться» → «Скопировать ссылку»
// (вида https://max.ru/u/...). Вставьте её между кавычками.
// Пока пусто, кнопки MAX копируют номер телефона и подсказывают найти нас по нему.
// ------------------------------------------------------------
window.ZN_MAX_URL = 'https://max.ru/u/f9LHodD0cOK-fC90-HI91MrE-S6VmBSuV-BXJwXbgZ_oJeNv8qXlPnJGHjE';

(function () {
  const PHONE = '+7 999 221-33-11';
  function toast(text) {
    let t = document.querySelector('.zn-toast');
    if (!t) { t = document.createElement('div'); t.className = 'zn-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 4200);
  }
  const url = (window.ZN_MAX_URL || '').trim();
  if (url) document.querySelectorAll('a.js-max').forEach(a => { a.href = url; a.target = '_blank'; });
  // ссылки MAX, появившиеся позже (например, после отправки заявки), — через общий обработчик
  document.addEventListener('click', e => {
    const a = e.target.closest('a.js-max');
    if (!a) return;
    if (url) { if (a.getAttribute('href') !== url) { e.preventDefault(); window.open(url, '_blank', 'noopener'); } return; }
    e.preventDefault();
    if (navigator.clipboard) navigator.clipboard.writeText(PHONE.replace(/\s/g, '')).catch(() => {});
    toast('Номер ' + PHONE + ' скопирован — найдите нас в MAX по этому номеру');
  });
})();

(function () {
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('header nav');
  const header = document.querySelector('header');
  if (!burger || !nav) return;

  // ---------- Отмечаем текущую страницу в меню шапки ----------
  const here = location.pathname.split('/').pop() || 'index.html';
  nav.querySelectorAll('a').forEach(a => {
    const file = a.getAttribute('href').split('#')[0].split('/').pop();
    if (file && file === here) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
      const d = a.closest('.nav-more');
      if (d) d.classList.add('has-active');
    }
  });

  // ---------- Пункт «Ещё» в шапке (компьютер) ----------
  const more = nav.querySelector('.nav-more');
  if (more) {
    document.addEventListener('click', e => { if (more.open && !more.contains(e.target)) more.open = false; });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && more.open) { more.open = false; more.querySelector('summary').focus(); } });
  }

  // ---------- Золотая плашка за курсором (компьютер) ----------
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const pill = document.createElement('span');
    pill.className = 'nav-pill'; pill.setAttribute('aria-hidden', 'true');
    nav.prepend(pill);
    const items = [...nav.querySelectorAll(':scope > a, :scope > .nav-more > summary')];
    const place = el => {
      const r = el.getBoundingClientRect(), nr = nav.getBoundingClientRect();
      pill.style.width = (r.width + 22) + 'px';
      pill.style.transform = 'translateX(' + (r.left - nr.left - 11).toFixed(1) + 'px)';
    };
    items.forEach(el => el.addEventListener('pointerenter', () => {
      if (!pill.classList.contains('on')) { pill.classList.add('jump'); place(el); void pill.offsetWidth; pill.classList.remove('jump'); }
      else place(el);
      pill.classList.add('on');
    }));
    nav.addEventListener('pointerleave', () => pill.classList.remove('on'));
  }

  // ---------- Цена в кнопке брони ----------
  const hcta = document.querySelector('.header-cta');
  if (hcta && !hcta.querySelector('.hc-price')) {
    const min = window.ZN_ROOMS ? Math.min.apply(null, window.ZN_ROOMS.map(r => r.price)).toLocaleString('ru-RU') + ' ₽' : '1 920 ₽';
    hcta.innerHTML = 'Забронировать<span class="hc-price">от ' + min + '</span>';
  }

  // ================================================================
  // Боковая панель (телефоны и планшеты): выезжает справа.
  // Ссылки берём из меню шапки — их не нужно поддерживать в двух местах.
  // ================================================================
  const cta = document.querySelector('.header-cta');
  const phone = document.querySelector('header .phone');
  const telHref = phone ? phone.getAttribute('href') : 'tel:+79992213311';
  const telText = phone ? phone.textContent.trim() : '+7 999 221-33-11';
  const ico = {
    tel: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
    tg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.5 3.5 2.8 10.8c-.9.4-.9 1.6 0 1.9l4.7 1.6 1.8 5.6c.2.7 1.1.9 1.6.4l2.6-2.5 4.9 3.6c.6.4 1.4.1 1.6-.6L22.9 4.9c.2-.9-.6-1.7-1.4-1.4z"/><path d="m7.5 14.3 10-7.3-7.6 8.6"/></svg>',
    max: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 15.5V9l4 4 4-4v6.5"/></svg>',
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18.5V6.8A2.8 2.8 0 0 1 6.8 4h10.4A2.8 2.8 0 0 1 20 6.8v6.9a2.8 2.8 0 0 1-2.8 2.8H8.3L4 20z"/><path d="M8.5 9.5h7M8.5 12.5h4.5"/></svg>'
  };

  const dr = document.createElement('div');
  dr.className = 'drawer';
  dr.innerHTML =
    '<div class="dr-scrim"></div><div class="dr-blur"></div>' +
    '<aside class="dr-panel" role="dialog" aria-modal="true" aria-label="Меню сайта">' +
      '<div class="dr-top"><p class="eyebrow">Меню</p><button type="button" class="dr-close" aria-label="Закрыть меню"></button></div>' +
      '<nav class="dr-nav" aria-label="Разделы сайта"></nav>' +
      '<div class="dr-foot">' +
        (cta ? '<a class="btn" href="' + cta.getAttribute('href') + '">Забронировать</a>' : '') +
        '<div class="dr-contacts">' +
          '<a href="' + telHref + '"><i>' + ico.tel + '</i>Позвонить</a>' +
          '<a href="https://t.me/+79992213311" target="_blank" rel="noopener"><i>' + ico.tg + '</i>Telegram</a>' +
          '<a href="https://wa.me/79992213311" target="_blank" rel="noopener"><i>' + ico.wa + '</i>WhatsApp</a>' +
          '<a class="js-max" href="' + ((window.ZN_MAX_URL || '').trim() || '#') + '"' + ((window.ZN_MAX_URL || '').trim() ? ' target="_blank"' : '') + ' rel="noopener"><i>' + ico.max + '</i>MAX</a>' +
        '</div>' +
        '<a class="dr-phone" href="' + telHref + '">' + telText + '</a>' +
      '</div>' +
    '</aside>';
  const list = dr.querySelector('.dr-nav');
  // «Главная» — первым пунктом (адрес берём у логотипа: index.html или ../index.html)
  const logoLink = document.querySelector('header .logo');
  if (logoLink) {
    const h = document.createElement('a');
    h.href = logoLink.getAttribute('href');
    h.textContent = 'Главная';
    if (document.getElementById('story')) { h.classList.add('active'); h.setAttribute('aria-current', 'page'); }
    list.appendChild(h);
  }
  [...nav.children].forEach(el => {
    if (el.matches('a')) { list.appendChild(el.cloneNode(true)); return; }
    if (el.matches('details')) {
      const d = document.createElement('details');
      d.className = 'dr-more';
      d.innerHTML = '<summary>' + el.querySelector('summary').textContent + '</summary><div class="dr-more-list"></div>';
      el.querySelectorAll('.nav-more-list a').forEach(a => d.lastChild.appendChild(a.cloneNode(true)));
      list.appendChild(d);
    }
  });
  document.body.appendChild(dr);
  const panel = dr.querySelector('.dr-panel');
  const closeBtn = dr.querySelector('.dr-close');

  let isOpen = false, settleT = 0, lastFocus = null;
  function openMenu() {
    if (isOpen) return;
    isOpen = true;
    // над тёмной заставкой — тёмная панель, ниже — по теме сайта
    dr.classList.toggle('theme-night', !!(header && header.classList.contains('theme-night')));
    document.documentElement.classList.add('dr-lock');
    panel.style.removeProperty('--drag');
    dr.classList.add('open');
    clearTimeout(settleT); settleT = setTimeout(() => dr.classList.add('settled'), 380);
    burger.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    lastFocus = document.activeElement;
    setTimeout(() => closeBtn.focus({ preventScroll: true }), 60);
  }
  function closeMenu() {
    if (!isOpen) return;
    isOpen = false;
    clearTimeout(settleT);
    dr.classList.remove('open', 'settled', 'dragging');
    panel.style.removeProperty('--drag');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    setTimeout(() => {
      if (isOpen) return;
      document.documentElement.classList.remove('dr-lock');
    }, 420);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  burger.addEventListener('click', e => { e.stopPropagation(); isOpen ? closeMenu() : openMenu(); });
  closeBtn.addEventListener('click', closeMenu);
  dr.querySelector('.dr-scrim').addEventListener('click', closeMenu);
  dr.querySelector('.dr-blur').addEventListener('click', closeMenu);
  // выбрали пункт — закрываем (для ссылок на эту же страницу, например #kontakty)
  dr.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setTimeout(closeMenu, 10)));
  document.addEventListener('keydown', e => {
    if (!isOpen) return;
    if (e.key === 'Escape') { closeMenu(); return; }
    // Tab не уходит за пределы панели
    if (e.key === 'Tab') {
      const f = [...panel.querySelectorAll('a, button, summary')].filter(x => x.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  // ---------- Свайп вправо закрывает панель (панель едет за пальцем) ----------
  let sx = 0, sy = 0, dx = 0, t0 = 0, mode = '';
  panel.addEventListener('touchstart', e => {
    const t = e.touches[0]; sx = t.clientX; sy = t.clientY; dx = 0; t0 = performance.now(); mode = '';
  }, { passive: true });
  panel.addEventListener('touchmove', e => {
    const t = e.touches[0], mx = t.clientX - sx, my = t.clientY - sy;
    if (!mode) { if (Math.abs(mx) < 8 && Math.abs(my) < 8) return; mode = Math.abs(mx) > Math.abs(my) && mx > 0 ? 'x' : 'y'; if (mode === 'x') dr.classList.add('dragging'); }
    if (mode !== 'x') return;
    dx = Math.max(0, mx);
    panel.style.setProperty('--drag', dx + 'px');
    if (e.cancelable) e.preventDefault();
  }, { passive: false });
  panel.addEventListener('touchend', () => {
    if (mode !== 'x') return;
    dr.classList.remove('dragging');
    const v = dx / Math.max(1, performance.now() - t0);        // пикселей в мс
    if (dx > panel.offsetWidth * 0.3 || v > 0.5) closeMenu();
    else panel.style.removeProperty('--drag');                 // пружиной обратно
    mode = '';
  });

  // Расширили окно до компьютерного меню — убираем панель
  window.addEventListener('resize', () => { if (window.innerWidth > 1080) closeMenu(); });
})();

// ============================================
// Нижняя панель «Забронировать» на телефонах
// Появляется, когда прокрутили первый экран; прячется у формы бронирования
// ============================================
(function () {
  const cta = document.querySelector('.header-cta');
  if (!cta) return;
  const bookHref = cta.getAttribute('href');

  // Самая низкая цена — из rooms.js (если файл подключён на странице)
  const minPrice = window.ZN_ROOMS
    ? Math.min.apply(null, window.ZN_ROOMS.map(r => r.price)).toLocaleString('ru-RU') + ' ₽'
    : '1 920 ₽';

  const bar = document.createElement('div');
  bar.className = 'm-cta';
  bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML =
    '<div class="m-cta-price"><small>Номера</small><b>от ' + minPrice + '<span> / ночь</span></b></div>' +
    '<a class="m-cta-chat" href="https://wa.me/79992213311" target="_blank" rel="noopener" aria-label="Написать в WhatsApp" tabindex="-1">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18.5V6.8A2.8 2.8 0 0 1 6.8 4h10.4A2.8 2.8 0 0 1 20 6.8v6.9a2.8 2.8 0 0 1-2.8 2.8H8.3L4 20z"/><path d="M8.5 9.5h7M8.5 12.5h4.5"/></svg>' +
    '</a>' +
    '<a class="btn m-cta-btn" href="' + bookHref + '" tabindex="-1">Забронировать</a>';
  document.body.appendChild(bar);

  const form = document.getElementById('kontakty');
  let formVisible = false, shown = false, raf = 0;

  function update() {
    raf = 0;
    // на главной — только после заставки (там своя кнопка «Выбрать даты»)
    const story = document.getElementById('story');
    const from = story ? story.offsetTop + story.offsetHeight - window.innerHeight * 0.4 : window.innerHeight * 0.6;
    const want = window.scrollY > from && !formVisible;
    if (want === shown) return;
    shown = want;
    bar.classList.toggle('show', want);
    bar.setAttribute('aria-hidden', want ? 'false' : 'true');
    bar.querySelectorAll('a').forEach(a => a.tabIndex = want ? 0 : -1);
    document.body.classList.toggle('m-cta-on', want);
  }

  if (form && 'IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      formVisible = entries[0].isIntersecting;
      update();
    }, { rootMargin: '0px 0px -20% 0px' }).observe(form);
  }
  window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  // первая проверка — после загрузки (замер положения блоков на старте тормозил заставку)
  if (document.readyState === 'complete') update(); else window.addEventListener('load', () => requestAnimationFrame(update), { once: true });
})();
