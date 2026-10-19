// ============================================================
//  НОМЕРА ОТЕЛЯ — единственное место, где их нужно менять на сайте.
//  Отсюда берут данные: форма бронирования и подбор номеров на главной,
//  календарь дат и страница «Свободные даты». Цены в карточках номеров
//  на главной тоже подставляются отсюда автоматически.
//
//  name    — название типа номера (как в заявках и в боте; не меняйте без нужды)
//  total   — сколько номеров этого типа в отеле
//  blocked — сколько из них занято на неопределённый срок (постоянные жильцы);
//            когда номер освободится, поставьте 0
//  price   — цена за ночь, ₽
//  photo   — фото для карточки (файл images-edit/<photo>.webp)
//
//  ⚠ После изменения цены или количества поправьте ещё ДВА места,
//    которые этот файл не может обновить сам:
//    1) bot-yandex/bot.js, блок ROOMS вверху файла (total = total − blocked,
//       price — та же цена) → пересобрать zip и загрузить в Яндекс.
//       По этим числам бот считает сумму заявки и свободные номера.
//    2) index.html, строки для поисковиков: <title>, описание и блок
//       "@type": "Hotel" вверху файла (цены «от … ₽» и "price").
//  И увеличьте ?v=… у rooms.js в index.html и pages/availability.html.
// ============================================================
window.ZN_ROOMS = [
  { name: 'Эконом маленький', total: 2, blocked: 1, price: 1920, photo: 'ekonom-mal-1' },
  { name: 'Эконом большой',   total: 2, blocked: 1, price: 2120, photo: 'ekonom-bol-1' },
  { name: 'Стандарт комфорт', total: 3, blocked: 1, price: 2680, photo: 'komfort-3' },
  { name: 'Стандарт премиум', total: 2, blocked: 1, price: 2980, photo: 'premium-1' }
];

// Цены в карточках: элементы с data-room-price="<название>" (или data-room-price-min)
document.addEventListener('DOMContentLoaded', function () {
  var rub = function (n) { return n.toLocaleString('ru-RU') + ' ₽'; };
  var byName = {};
  window.ZN_ROOMS.forEach(function (r) { byName[r.name] = r; });
  document.querySelectorAll('[data-room-price]').forEach(function (el) {
    var r = byName[el.getAttribute('data-room-price')];
    if (r && el.firstChild && el.firstChild.nodeType === 3) el.firstChild.textContent = rub(r.price) + ' ';
  });
  var min = Math.min.apply(null, window.ZN_ROOMS.map(function (r) { return r.price; }));
  document.querySelectorAll('[data-room-price-min]').forEach(function (el) { el.textContent = 'от ' + rub(min); });
});
