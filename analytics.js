// ============================================================
// analytics.js — Яндекс Метрика и цели (подключено на всех страницах)
// Чтобы включить: вставьте номер счётчика вместо 0 и загрузите файл на сайт.
// ============================================================
(function () {
  'use strict';

  const METRIKA_ID = 0;          // ← номер счётчика из metrika.yandex.ru (например 98765432)

  // Цели, которые стоит создать в Метрике (тип «JavaScript-событие», идентификатор — как ниже):
  //   booking_sent   — заявка с сайта отправлена
  //   dates_search   — гость посмотрел свободные номера на главной
  //   room_choose    — нажал «Выбрать» / «Забронировать» у номера
  //   call_click     — нажал на телефон
  //   chat_click     — нажал WhatsApp или Telegram
  window.znGoal = function (name, params) {
    if (METRIKA_ID && typeof window.ym === 'function') window.ym(METRIKA_ID, 'reachGoal', name, params);
  };

  if (!METRIKA_ID) return;

  // Официальный код загрузки Метрики (асинхронно, не тормозит сайт)
  (function (m, e, t, r, i, k, a) {
    m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
    m[i].l = 1 * new Date();
    k = e.createElement(t); a = e.getElementsByTagName(t)[0];
    k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
  })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');

  window.ym(METRIKA_ID, 'init', {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true
  });

  // Нажатия на телефон и мессенджеры — по всему сайту
  document.addEventListener('click', function (e) {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (href.startsWith('tel:')) window.znGoal('call_click');
    else if (/wa\.me|t\.me|whatsapp/i.test(href)) window.znGoal('chat_click');
  }, true);
})();
