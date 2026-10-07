// ============================================
// menu.js — меню-«бургер» для телефонов и планшетов
// Подключено на всех страницах сайта
// ============================================
(function () {
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('header nav');
  if (!burger || !nav) return;

  function openMenu() {
    nav.classList.add('open');
    burger.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Закрыть меню');
  }

  function closeMenu() {
    nav.classList.remove('open');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
  }

  // Нажали на ☰ — открыть или закрыть
  burger.addEventListener('click', function (e) {
    e.stopPropagation();
    nav.classList.contains('open') ? closeMenu() : openMenu();
  });

  // Выбрали пункт меню — закрываем
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

  // Нажали мимо меню — закрываем
  document.addEventListener('click', function (e) {
    if (nav.classList.contains('open') && !nav.contains(e.target)) closeMenu();
  });

  // Escape — закрываем
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  // Повернули телефон / расширили окно — убираем открытое меню
  window.addEventListener('resize', function () {
    if (window.innerWidth > 1150) closeMenu();
  });
})();

// ============================================
// Нижняя панель «Забронировать» на телефонах
// Появляется, когда прокрутили первый экран; прячется у формы бронирования
// ============================================
(function () {
  const cta = document.querySelector('.header-cta');
  if (!cta) return;
  const bookHref = cta.getAttribute('href');

  const bar = document.createElement('div');
  bar.className = 'm-cta';
  bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML =
    '<div class="m-cta-price"><small>Номера</small><b>от 1 500 ₽<span> / ночь</span></b></div>' +
    '<a class="m-cta-chat" href="https://wa.me/79992213311" target="_blank" rel="noopener" aria-label="Написать в WhatsApp" tabindex="-1">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18.5V6.8A2.8 2.8 0 0 1 6.8 4h10.4A2.8 2.8 0 0 1 20 6.8v6.9a2.8 2.8 0 0 1-2.8 2.8H8.3L4 20z"/><path d="M8.5 9.5h7M8.5 12.5h4.5"/></svg>' +
    '</a>' +
    '<a class="btn m-cta-btn" href="' + bookHref + '" tabindex="-1">Забронировать</a>';
  document.body.appendChild(bar);

  const form = document.getElementById('kontakty');
  let formVisible = false, shown = false, raf = 0;

  function update() {
    raf = 0;
    const want = window.scrollY > window.innerHeight * 0.6 && !formVisible;
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
