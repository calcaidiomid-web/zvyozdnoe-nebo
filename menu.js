// ============================================
// menu.js — меню-«бургер» для телефонов и планшетов
// Подключено на всех страницах сайта
// ============================================
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
        '</div>' +
        '<a class="dr-phone" href="' + telHref + '">' + telText + '</a>' +
      '</div>' +
    '</aside>';
  const list = dr.querySelector('.dr-nav');
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
    const sbw = window.innerWidth - document.documentElement.clientWidth;   // полоса прокрутки — чтобы страница не дёрнулась
    if (sbw > 0) document.documentElement.style.paddingRight = sbw + 'px';
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
      document.documentElement.style.paddingRight = '';
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
  update();
})();
