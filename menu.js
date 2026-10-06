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
