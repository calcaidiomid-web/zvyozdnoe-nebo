// ============================================================
// availability.js — доступность номеров по данным из Google Таблицы
// Подключается на странице pages/availability.html
// ============================================================

// ---------- НАСТРОЙКИ (меняется только здесь) ----------

// Ссылка на опубликованную Google Таблицу в формате CSV.
// Как её получить — см. инструкцию (Файл → Поделиться → Опубликовать в интернете → CSV).
const BOOKINGS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSyPd_NQEW61TabPoUFcFddiE6q_lX8X2pFVZtBMcqfDDFcAqaCpwvWI6LUNZ8rhn28b8g8MucxMR5W/pub?gid=41014459&single=true&output=csv';

// Сколько номеров каждого типа в отеле (всего 9).
// blocked — сколько номеров этого типа занято на неопределённый срок (долгосрочные жильцы).
// Когда номер освободится — поставьте blocked: 0 (и то же число в datepicker.js).
const ROOMS = [
  { name: 'Эконом маленький', total: 2, blocked: 1, price: 1500 },
  { name: 'Эконом большой',   total: 2, blocked: 1, price: 1900 },
  { name: 'Стандарт комфорт', total: 3, blocked: 1, price: 2700 },
  { name: 'Стандарт премиум', total: 2, blocked: 1, price: 3000 }
];
// Сколько номеров этого типа вообще можно забронировать
function bookable(room) { return room.total - (room.blocked || 0); }

// ---------- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ----------

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

// Дата → число (номер дня). Так считать дни проще и без ошибок часовых поясов.
function dayNum(y, m, d) { return Math.round(Date.UTC(y, m - 1, d) / 86400000); }

function numToParts(n) {
  const dt = new Date(n * 86400000);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

function pad(n) { return String(n).padStart(2, '0'); }

function numToISO(n) { const p = numToParts(n); return `${p.y}-${pad(p.m)}-${pad(p.d)}`; }

function todayNum() { const t = new Date(); return dayNum(t.getFullYear(), t.getMonth() + 1, t.getDate()); }

// Понимает 2026-10-05 и 05.10.2026 (Google Таблицы в русской локали отдают второй вид)
function parseDate(str) {
  str = (str || '').trim();
  let m = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return dayNum(+m[1], +m[2], +m[3]);
  m = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) return dayNum(+m[3], +m[2], +m[1]);
  return null;
}

function nightsWord(n) {
  const last = n % 10, lastTwo = n % 100;
  if (last === 1 && lastTwo !== 11) return 'ночь';
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return 'ночи';
  return 'ночей';
}

function rub(n) { return n.toLocaleString('ru-RU') + ' ₽'; }

// Разбор CSV (учитывает кавычки и запятые/точки с запятой внутри)
function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', inQuotes = false;
  const delim = (text.split('\n')[0].match(/;/g) || []).length > (text.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else cell += c;
    } else if (c === '"') inQuotes = true;
    else if (c === delim) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

// ---------- ДАННЫЕ О БРОНЯХ ----------

// bookings: { 'Эконом маленький': [ {from: число, to: число}, ... ], ... }
// Ночь считается занятой с дня заезда до дня ПЕРЕД выездом (в день выезда номер уже свободен).
let bookings = {};
let dataOk = false;

ROOMS.forEach(r => bookings[r.name] = []);

function loadBookings(csvText) {
  const rows = parseCSV(csvText);
  const found = {};
  ROOMS.forEach(r => found[r.name.toLowerCase()] = r.name);
  const problems = [];

  rows.slice(1).forEach((row, i) => {            // первая строка — заголовки
    if (!row[0] || !row[0].trim()) return;       // пустая строка
    const room = found[row[0].trim().toLowerCase()];
    const from = parseDate(row[1]), to = parseDate(row[2]);
    if (!room || from === null || to === null || to <= from) {
      problems.push(i + 2);
      return;
    }
    bookings[room].push({ from, to });
  });

  if (problems.length) console.warn('Availability: пропущены строки таблицы:', problems.join(', '));
}

// Сколько номеров этого типа свободно в ночь d
function freeOn(room, d) {
  const busy = bookings[room.name].filter(b => b.from <= d && d < b.to).length;
  return Math.max(0, bookable(room) - busy);
}

// Сколько номеров свободно на ВЕСЬ период [from, to)
function freeFor(room, from, to) {
  let min = bookable(room);
  for (let d = from; d < to; d++) min = Math.min(min, freeOn(room, d));
  return min;
}

// ---------- ПОДБОР ПО ДАТАМ ----------

const checkinEl = document.getElementById('avCheckin');
const checkoutEl = document.getElementById('avCheckout');
const resultsEl = document.getElementById('avResults');

const today = todayNum();
checkinEl.min = numToISO(today);
checkoutEl.min = numToISO(today + 1);

function renderResults() {
  const from = parseDate(checkinEl.value), to = parseDate(checkoutEl.value);

  if (from === null || to === null) {
    resultsEl.innerHTML = '<p class="av-hint">Выберите даты заезда и выезда — покажем, какие номера свободны.</p>';
    return;
  }
  if (to <= from) {
    resultsEl.innerHTML = '<p class="av-hint">Дата выезда должна быть позже даты заезда.</p>';
    return;
  }

  const nights = to - from;
  resultsEl.innerHTML = ROOMS.map(room => {
    const free = freeFor(room, from, to);
    const link = `../index.html?room=${encodeURIComponent(room.name)}&checkin=${numToISO(from)}&checkout=${numToISO(to)}#kontakty`;
    if (free > 0) {
      return `
        <div class="av-card av-card-free">
          <h4>${room.name}</h4>
          <p class="av-status status-available">✓ Свободно: ${free} из ${bookable(room)}</p>
          <p class="av-sum">${nights} ${nightsWord(nights)} × ${rub(room.price)} = <strong>${rub(nights * room.price)}</strong></p>
          <a class="btn" href="${link}">Забронировать</a>
        </div>`;
    }
    return `
      <div class="av-card av-card-busy">
        <h4>${room.name}</h4>
        <p class="av-status status-unavailable">✗ На эти даты занято</p>
        <p class="av-sum">Попробуйте другие даты или другой тип номера.</p>
      </div>`;
  }).join('');
}

checkinEl.addEventListener('change', function () {
  const from = parseDate(this.value);
  if (from !== null) {
    checkoutEl.min = numToISO(from + 1);
    if (parseDate(checkoutEl.value) <= from) checkoutEl.value = '';
  }
  renderResults();
});
checkoutEl.addEventListener('change', renderResults);

// ---------- КАЛЕНДАРИ ПО МЕСЯЦАМ ----------

const calEl = document.getElementById('avCalendars');
const monthTitleEl = document.getElementById('avMonthTitle');
const prevBtn = document.getElementById('avPrev');
const nextBtn = document.getElementById('avNext');

const nowParts = numToParts(today);
const firstMonth = { y: nowParts.y, m: nowParts.m };
let view = { y: nowParts.y, m: nowParts.m };
const MONTHS_AHEAD = 12;

function monthIndex(v) { return v.y * 12 + (v.m - 1); }

function renderCalendars() {
  monthTitleEl.textContent = `${MONTHS[view.m - 1]} ${view.y}`;
  prevBtn.disabled = monthIndex(view) <= monthIndex(firstMonth);
  nextBtn.disabled = monthIndex(view) >= monthIndex(firstMonth) + MONTHS_AHEAD;

  const daysInMonth = new Date(view.y, view.m, 0).getDate();
  const startOffset = (new Date(view.y, view.m - 1, 1).getDay() + 6) % 7; // неделя с понедельника

  calEl.innerHTML = ROOMS.map(room => {
    let cells = '';
    for (let i = 0; i < startOffset; i++) cells += '<span class="cal-day cal-empty"></span>';

    for (let day = 1; day <= daysInMonth; day++) {
      const d = dayNum(view.y, view.m, day);
      const free = freeOn(room, d);
      let cls, label;
      if (d < today)               { cls = 'cal-past';    label = ''; }
      else if (!dataOk)            { cls = 'cal-unknown'; label = ''; }
      else if (free === bookable(room)){ cls = 'cal-free';    label = ''; }
      else if (free === 0)         { cls = 'cal-full';    label = ''; }
      else                         { cls = 'cal-partial'; label = free; }
      const title = d < today ? '' : (dataOk ? `title="${day}: свободно ${free} из ${bookable(room)}"` : '');
      cells += `<span class="cal-day ${cls}" ${title}>${day}${label !== '' ? `<small>${label}</small>` : ''}</span>`;
    }

    return `
      <div class="cal-block">
        <h4>${room.name} <span class="cal-count">для брони: ${bookable(room)} из ${room.total}</span></h4>
        <div class="cal-weekdays"><span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span></div>
        <div class="cal-grid">${cells}</div>
      </div>`;
  }).join('');
}

prevBtn.addEventListener('click', () => {
  view.m--; if (view.m < 1) { view.m = 12; view.y--; }
  renderCalendars();
});
nextBtn.addEventListener('click', () => {
  view.m++; if (view.m > 12) { view.m = 1; view.y++; }
  renderCalendars();
});

// ---------- ЗАПУСК ----------

const statusEl = document.getElementById('avStatus');

// Даты, пришедшие с главной страницы (?checkin=...&checkout=...)
(function () {
  const q = new URLSearchParams(location.search);
  const ci = parseDate(q.get('checkin')), co = parseDate(q.get('checkout'));
  if (ci !== null && ci >= today) {
    checkinEl.value = numToISO(ci);
    checkoutEl.min = numToISO(ci + 1);
    if (co !== null && co > ci) checkoutEl.value = numToISO(co);
    const p = numToParts(ci); view = { y: p.y, m: p.m };      // календарь сразу на нужном месяце
    if (monthIndex(view) > monthIndex(firstMonth) + MONTHS_AHEAD) view = { ...firstMonth };
  }
})();

renderResults();
renderCalendars();

fetch(BOOKINGS_URL + (BOOKINGS_URL.includes('?') ? '&' : '?') + 't=' + Date.now())
  .then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
  .then(text => {
    loadBookings(text);
    dataOk = true;
    statusEl.hidden = true;
    renderResults();
    renderCalendars();
  })
  .catch(() => {
    statusEl.innerHTML = '⚠️ Не удалось загрузить данные о занятости. ' +
      'Позвоните нам: <a href="tel:+79992213311">+7 (999) 221-33-11</a> — подскажем, какие номера свободны.';
    statusEl.hidden = false;
    document.getElementById('avResults').innerHTML = '';
  });
