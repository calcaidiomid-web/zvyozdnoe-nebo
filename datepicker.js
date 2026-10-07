// ============================================================
// datepicker.js — удобный выбор дат заезда и выезда
// Один календарь на пару полей: нажимаешь день заезда, потом день выезда.
// Занятые ночи (по данным Google Таблицы) зачёркнуты и не выбираются.
// Подключение: <script src="datepicker.js"></script> и в разметке
// у поля заезда атрибут data-range-start, у поля выезда data-range-end
// (оба поля внутри одной формы или блока с атрибутом data-range).
// ============================================================
(function () {
  'use strict';

  // ---------- НАСТРОЙКИ ----------
  const BOOKINGS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSyPd_NQEW61TabPoUFcFddiE6q_lX8X2pFVZtBMcqfDDFcAqaCpwvWI6LUNZ8rhn28b8g8MucxMR5W/pub?gid=41014459&single=true&output=csv';
  const ROOMS = { 'Эконом маленький': 2, 'Эконом большой': 2, 'Стандарт комфорт': 3, 'Стандарт премиум': 2 };
  const MONTHS_AHEAD = 12;

  const M_NOM = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const M_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const M_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const WD = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

  // ---------- ДАТЫ (номер дня — без ошибок часовых поясов) ----------
  const dayNum = (y, m, d) => Math.round(Date.UTC(y, m - 1, d) / 86400000);
  const parts = n => { const t = new Date(n * 86400000); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), wd: (t.getUTCDay() + 6) % 7 }; };
  const pad = n => String(n).padStart(2, '0');
  const toISO = n => { const p = parts(n); return `${p.y}-${pad(p.m)}-${pad(p.d)}`; };
  function parse(str) {
    str = (str || '').trim();
    let m = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) return dayNum(+m[1], +m[2], +m[3]);
    m = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (m) return dayNum(+m[3], +m[2], +m[1]);
    return null;
  }
  const now = new Date();
  const TODAY = dayNum(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const T = parts(TODAY);
  const FIRST_MONTH = T.y * 12 + (T.m - 1);
  const LAST_MONTH = FIRST_MONTH + MONTHS_AHEAD;
  const MAX_DAY = (() => { const y = Math.floor((LAST_MONTH + 1) / 12), m = (LAST_MONTH + 1) % 12; return dayNum(y, m + 1, 1) - 1; })();

  function nightsWord(n) {
    const a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return 'ночь';
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return 'ночи';
    return 'ночей';
  }
  const fieldText = n => { const p = parts(n); return `${WD[p.wd]}, ${p.d} ${M_SHORT[p.m - 1]}`; };
  const longText = n => { const p = parts(n); return `${p.d} ${M_GEN[p.m - 1]}, ${WD[p.wd]}`; };
  function rangeText(a, b) {
    const pa = parts(a), pb = parts(b);
    return pa.m === pb.m ? `${pa.d}–${pb.d} ${M_SHORT[pa.m - 1]}` : `${pa.d} ${M_SHORT[pa.m - 1]} – ${pb.d} ${M_SHORT[pb.m - 1]}`;
  }

  // ---------- ЗАНЯТОСТЬ ИЗ GOOGLE ТАБЛИЦЫ ----------
  let occ = null;            // { 'Эконом маленький': [{from, to}], ... }
  let occPromise = null;

  function parseCSV(text) {
    const rows = []; let row = [], cell = '', q = false;
    const first = text.split('\n')[0];
    const delim = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ',';
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
      else if (c === '"') q = true;
      else if (c === delim) { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  function loadOcc() {
    if (occPromise) return occPromise;
    occPromise = fetch(BOOKINGS_URL + '&t=' + Date.now())
      .then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(text => {
        const byLower = {}; Object.keys(ROOMS).forEach(n => byLower[n.toLowerCase()] = n);
        const data = {}; Object.keys(ROOMS).forEach(n => data[n] = []);
        parseCSV(text).slice(1).forEach(row => {
          const room = byLower[(row[0] || '').trim().toLowerCase()];
          const from = parse(row[1]), to = parse(row[2]);
          if (room && from !== null && to !== null && to > from) data[room].push({ from, to });
        });
        occ = data;
        if (picker.isOpen()) picker.render();
        instances.forEach(i => i.checkWarn());
      })
      .catch(() => { occ = null; });
    return occPromise;
  }

  // Ночь d полностью занята? (для конкретного типа номера или для всего отеля)
  function fullNight(d, room) {
    if (!occ) return false;
    const list = room && ROOMS[room] ? [room] : Object.keys(ROOMS);
    return list.every(r => occ[r].filter(b => b.from <= d && d < b.to).length >= ROOMS[r]);
  }
  // Первая занятая ночь в промежутке [from, to) или null
  function firstFull(from, to, room) {
    for (let d = from; d < to; d++) if (fullNight(d, room)) return d;
    return null;
  }

  // Сколько номеров типа room свободно на все ночи [from, to); null — данных нет
  function freeFor(room, from, to) {
    if (!occ || !ROOMS[room]) return null;
    let min = ROOMS[room];
    for (let d = from; d < to; d++) min = Math.min(min, ROOMS[room] - occ[room].filter(b => b.from <= d && d < b.to).length);
    return Math.max(0, min);
  }
  // Для других скриптов сайта (свободные номера на главной)
  window.ZNDates = {
    load: () => loadOcc().then(() => !!occ),
    free: (room, isoFrom, isoTo) => { const a = parse(isoFrom), b = parse(isoTo); return a === null || b === null ? null : freeFor(room, a, b); },
    rangeText: (isoFrom, isoTo) => rangeText(parse(isoFrom), parse(isoTo)),
    ROOMS
  };

  // ---------- ПАРА ПОЛЕЙ «ЗАЕЗД / ВЫЕЗД» ----------
  const instances = [];

  function makeButton(input, label) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dp-field';
    btn.id = input.id + 'Btn';
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.innerHTML = `<svg class="dp-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg><span class="dp-val"></span>`;
    btn.dataset.placeholder = label;
    input.insertAdjacentElement('afterend', btn);
    // подпись <label for="..."> теперь указывает на кнопку
    document.querySelectorAll(`label[for="${input.id}"]`).forEach(l => l.htmlFor = btn.id);
    return btn;
  }

  function Instance(inEl, outEl, opts) {
    this.inEl = inEl; this.outEl = outEl; this.opts = opts;
    this.form = inEl.form || inEl.closest('[data-range]');
    // настоящие поля остаются (их значения читает остальной код), но прячутся
    [inEl, outEl].forEach(el => { el.type = 'hidden'; el.classList.add('dp-native'); });
    this.inBtn = makeButton(inEl, 'Дата заезда');
    this.outBtn = makeButton(outEl, 'Дата выезда');
    this.warn = document.createElement('p');
    this.warn.className = 'dp-warn'; this.warn.hidden = true; this.warn.setAttribute('role', 'status');
    (outEl.closest('.form-group, .qb-field') || this.outBtn).insertAdjacentElement('afterend', this.warn);

    this.inBtn.addEventListener('click', () => picker.open(this, 'in'));
    this.outBtn.addEventListener('click', () => picker.open(this, 'out'));
    [inEl, outEl].forEach(el => el.addEventListener('change', () => this.paint()));

    if (this.form) {
      // форма очищается — очищаем и даты (у скрытых полей reset сам этого не делает)
      this.form.addEventListener('reset', () => setTimeout(() => this.set(null, null), 0));
    }
    if (opts.roomSelect) opts.roomSelect.addEventListener('change', () => this.checkWarn());
    this.paint();
  }
  Instance.prototype.room = function () { return this.opts.roomSelect ? this.opts.roomSelect.value || null : null; };
  Instance.prototype.get = function () {
    const a = parse(this.inEl.value), b = parse(this.outEl.value);
    return { a, b: a !== null && b !== null && b > a ? b : null };
  };
  Instance.prototype.set = function (a, b) {
    const ia = a === null ? '' : toISO(a), ib = b === null ? '' : toISO(b);
    if (this.inEl.value !== ia) { this.inEl.value = ia; this.inEl.dispatchEvent(new Event('change', { bubbles: true })); }
    if (this.outEl.value !== ib) { this.outEl.value = ib; this.outEl.dispatchEvent(new Event('change', { bubbles: true })); }
    this.paint();
  };
  Instance.prototype.paint = function () {
    const { a, b } = this.get();
    const show = (btn, n) => {
      btn.querySelector('.dp-val').textContent = n === null ? btn.dataset.placeholder : fieldText(n);
      btn.classList.toggle('dp-empty', n === null);
      btn.classList.remove('dp-invalid');
    };
    show(this.inBtn, a); show(this.outBtn, b);
    this.inBtn.setAttribute('aria-label', 'Заезд: ' + (a === null ? 'не выбрано' : longText(a)));
    this.outBtn.setAttribute('aria-label', 'Выезд: ' + (b === null ? 'не выбрано' : longText(b)));
    this.checkWarn();
  };
  // Если сменили тип номера, а он на эти даты занят — предупреждаем
  Instance.prototype.checkWarn = function () {
    const { a, b } = this.get();
    const room = this.room();
    const blocked = a !== null && b !== null && room && firstFull(a, b, room) !== null;
    this.warn.hidden = !blocked;
    if (blocked) this.warn.textContent = `«${room}» на эти даты уже занят — выберите другие даты или другой номер.`;
  };

  // ---------- САМ КАЛЕНДАРЬ (один на страницу) ----------
  const mqMobile = window.matchMedia('(max-width: 600px)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const picker = (function () {
    let root, dialog, monthsEl, prevBtn, nextBtn, hintEl, sumIn, sumOut, nightsEl, chipsEl, doneBtn;
    let inst = null, a = null, b = null, origA = null, origB = null, hover = null, viewMonth = FIRST_MONTH, opener = null, closeTimer = null;

    function build() {
      root = document.createElement('div');
      root.className = 'dp-overlay';
      root.hidden = true;
      root.innerHTML = `
        <div class="dp-dialog" role="dialog" aria-modal="true" aria-label="Выбор дат заезда и выезда">
          <div class="dp-grip" aria-hidden="true"></div>
          <div class="dp-head">
            <div class="dp-sum">
              <button type="button" class="dp-sum-cell" data-k="in"><small>Заезд</small><b></b></button>
              <span class="dp-sum-arrow" aria-hidden="true">→</span>
              <button type="button" class="dp-sum-cell" data-k="out"><small>Выезд</small><b></b></button>
            </div>
            <button type="button" class="dp-close" aria-label="Закрыть">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
          </div>
          <div class="dp-chips"></div>
          <p class="dp-hint" aria-live="polite"></p>
          <div class="dp-body">
            <button type="button" class="dp-nav dp-prev" aria-label="Предыдущий месяц">‹</button>
            <div class="dp-months"></div>
            <button type="button" class="dp-nav dp-next" aria-label="Следующий месяц">›</button>
          </div>
          <div class="dp-foot">
            <span class="dp-legend"><i></i>нет свободных мест</span>
            <span class="dp-nights"></span>
            <button type="button" class="dp-reset">Сбросить</button>
            <button type="button" class="btn dp-done">Готово</button>
          </div>
        </div>`;
      document.body.appendChild(root);
      dialog = root.querySelector('.dp-dialog');
      monthsEl = root.querySelector('.dp-months');
      prevBtn = root.querySelector('.dp-prev');
      nextBtn = root.querySelector('.dp-next');
      hintEl = root.querySelector('.dp-hint');
      chipsEl = root.querySelector('.dp-chips');
      nightsEl = root.querySelector('.dp-nights');
      doneBtn = root.querySelector('.dp-done');
      sumIn = root.querySelector('[data-k="in"]');
      sumOut = root.querySelector('[data-k="out"]');

      root.addEventListener('click', e => { if (e.target === root) close(); });
      root.querySelector('.dp-close').addEventListener('click', () => close());
      doneBtn.addEventListener('click', () => close());
      root.querySelector('.dp-reset').addEventListener('click', () => { a = b = hover = null; inst.set(null, null); hint('Выберите дату заезда'); render(); });
      sumIn.addEventListener('click', () => { a = b = null; hint('Выберите дату заезда'); render(); });
      sumOut.addEventListener('click', () => { if (a !== null) { b = null; hint('Выберите дату выезда'); render(); } });
      prevBtn.addEventListener('click', () => { viewMonth = Math.max(FIRST_MONTH, viewMonth - 1); render(); });
      nextBtn.addEventListener('click', () => { viewMonth = Math.min(LAST_MONTH - 1, viewMonth + 1); render(); });

      monthsEl.addEventListener('click', e => {
        const cell = e.target.closest('[data-d]');
        if (cell && !cell.disabled) pick(+cell.dataset.d);
      });
      monthsEl.addEventListener('pointerover', e => {
        if (e.pointerType !== 'mouse' || a === null || b !== null) return;
        const cell = e.target.closest('[data-d]');
        hover = cell && !cell.disabled ? +cell.dataset.d : null;
        paintHover();
      });
      monthsEl.addEventListener('pointerleave', () => { hover = null; paintHover(); });
      root.addEventListener('keydown', onKey);
      mqMobile.addEventListener && mqMobile.addEventListener('change', () => { if (isOpen()) render(true); });
    }

    function hint(text, warn) { hintEl.textContent = text; hintEl.classList.toggle('dp-hint-warn', !!warn); }
    function isOpen() { return root && !root.hidden; }
    const room = () => inst ? inst.room() : null;

    // самая поздняя возможная дата выезда при выбранном заезде (до первой занятой ночи)
    function maxOut() {
      if (a === null) return null;
      const f = firstFull(a, MAX_DAY, room());
      return f === null ? MAX_DAY : f;
    }

    function pick(d) {
      if (a === null || b !== null || d <= a) {
        if (fullNight(d, room())) { hint('В эту ночь свободных номеров нет — выберите другую дату', true); return; }
        a = d; b = null; hover = null;
        hint('Теперь выберите дату выезда');
        render();
        return;
      }
      if (d > maxOut()) {               // между датами есть занятая ночь
        hint('Между этими датами есть ночи без свободных номеров', true);
        return;
      }
      b = d;
      inst.set(a, b);
      hint(`${b - a} ${nightsWord(b - a)} · ${rangeText(a, b)}`);
      render();
      clearTimeout(closeTimer);
      closeTimer = setTimeout(close, reduceMotion.matches ? 150 : 450);   // сам закрывается, когда обе даты выбраны
    }

    function chips() {
      const fri = TODAY + ((4 - parts(TODAY).wd + 7) % 7);           // ближайшая пятница
      const list = [
        ['Сегодня', TODAY, TODAY + 1],
        ['Завтра', TODAY + 1, TODAY + 2],
        ['Выходные', fri, fri + 2],
        ['Неделя', TODAY, TODAY + 7]
      ];
      chipsEl.innerHTML = list.map(([name, x, y]) => {
        const blocked = firstFull(x, y, room()) !== null;
        const on = a === x && b === y;
        return `<button type="button" class="dp-chip${on ? ' is-on' : ''}" data-a="${x}" data-b="${y}" ${blocked ? 'disabled title="Нет свободных мест"' : ''}>
                  <b>${name}</b><small>${rangeText(x, y)}</small></button>`;
      }).join('');
      chipsEl.querySelectorAll('.dp-chip').forEach(c => c.addEventListener('click', () => {
        a = +c.dataset.a; b = null; pick(+c.dataset.b);
        if (!mqMobile.matches) viewMonth = Math.min(Math.max(FIRST_MONTH, monthOf(a)), LAST_MONTH - 1);
        render();
      }));
    }

    const monthOf = n => { const p = parts(n); return p.y * 12 + p.m - 1; };

    function monthHTML(mi) {
      const y = Math.floor(mi / 12), m = mi % 12 + 1;
      const first = dayNum(y, m, 1);
      const days = new Date(y, m, 0).getDate();
      const offset = parts(first).wd;
      const lim = maxOut();
      const r = room();
      let cells = '';
      for (let i = 0; i < offset; i++) cells += '<span class="dp-day dp-pad"></span>';
      for (let day = 1; day <= days; day++) {
        const d = first + day - 1;
        const full = fullNight(d, r);
        let disabled = d < TODAY || d > MAX_DAY;
        if (!disabled && a !== null && b === null && d > a) disabled = d > lim;     // выезд — не дальше первой занятой ночи
        else if (!disabled && full && !(a !== null && b === null && d > a)) disabled = true;
        const cls = ['dp-day'];
        if (d === TODAY) cls.push('is-today');
        if (full && d >= TODAY) cls.push('is-full');
        if (parts(d).wd >= 5) cls.push('is-weekend');
        if (d === a) cls.push('is-start');
        if (d === a && b !== null) cls.push('has-end');
        if (d === b) cls.push('is-end');
        if (a !== null && b !== null && d > a && d < b) cls.push('is-in');
        const label = longText(d) + (full ? ', мест нет' : '');
        cells += `<button type="button" class="${cls.join(' ')}" data-d="${d}" ${disabled ? 'disabled' : ''} tabindex="-1" aria-label="${label}"${d === a || d === b ? ' aria-pressed="true"' : ''}>${day}</button>`;
      }
      return `<div class="dp-month">
          <div class="dp-mtitle">${M_NOM[m - 1]} ${y}</div>
          <div class="dp-wd">${WD.map((w, i) => `<span${i >= 5 ? ' class="is-weekend"' : ''}>${w}</span>`).join('')}</div>
          <div class="dp-grid">${cells}</div>
        </div>`;
    }

    function render(scrollToStart) {
      const mobile = mqMobile.matches;
      root.classList.toggle('dp-mobile', mobile);
      const list = [];
      if (mobile) for (let mi = FIRST_MONTH; mi < LAST_MONTH; mi++) list.push(mi);
      else list.push(viewMonth, viewMonth + 1);
      const keepScroll = monthsEl.scrollTop;
      monthsEl.innerHTML = list.map(monthHTML).join('');
      if (mobile) {
        if (scrollToStart) {
          const target = a !== null ? monthsEl.querySelector(`[data-d="${a}"]`) : null;
          monthsEl.scrollTop = target ? target.closest('.dp-month').offsetTop - monthsEl.offsetTop - 8 : 0;
        } else monthsEl.scrollTop = keepScroll;
      }
      prevBtn.disabled = viewMonth <= FIRST_MONTH;
      nextBtn.disabled = viewMonth >= LAST_MONTH - 1;

      sumIn.querySelector('b').textContent = a === null ? '—' : fieldText(a);
      sumOut.querySelector('b').textContent = b === null ? '—' : fieldText(b);
      sumIn.classList.toggle('is-active', a === null || b !== null);
      sumOut.classList.toggle('is-active', a !== null && b === null);
      nightsEl.textContent = a !== null && b !== null ? `${b - a} ${nightsWord(b - a)}` : '';
      doneBtn.disabled = false;
      root.querySelector('.dp-legend').hidden = !occ;
      chips();
      paintHover();
      setRoving();
    }

    // Подсветка будущего диапазона под курсором
    function paintHover() {
      monthsEl.querySelectorAll('.dp-day[data-d]').forEach(c => {
        const d = +c.dataset.d;
        c.classList.toggle('is-preview', a !== null && b === null && hover !== null && d > a && d <= hover);
        c.classList.toggle('is-preview-end', a !== null && b === null && hover !== null && d === hover && d > a);
        if (d === a) c.classList.toggle('has-end', b !== null || (hover !== null && hover > a));
      });
    }

    // ---------- клавиатура: стрелки по дням ----------
    function setRoving() {
      const cells = [...monthsEl.querySelectorAll('.dp-day[data-d]:not([disabled])')];
      if (!cells.length) return;
      const want = b !== null ? b : a !== null ? a : null;
      const cur = cells.find(c => +c.dataset.d === want) || cells[0];
      cur.tabIndex = 0;
    }
    function focusDay(d) {
      if (d < TODAY || d > MAX_DAY) return;
      let cell = monthsEl.querySelector(`[data-d="${d}"]`);
      if (!cell && !mqMobile.matches) {
        viewMonth = Math.min(Math.max(FIRST_MONTH, monthOf(d) - (monthOf(d) > viewMonth ? 1 : 0)), LAST_MONTH - 1);
        render();
        cell = monthsEl.querySelector(`[data-d="${d}"]`);
      }
      if (!cell) return;
      monthsEl.querySelectorAll('.dp-day[tabindex="0"]').forEach(c => c.tabIndex = -1);
      cell.tabIndex = 0; cell.focus();
      if (a !== null && b === null && !cell.disabled) { hover = d; paintHover(); }
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      const cell = e.target.closest && e.target.closest('.dp-day[data-d]');
      if (cell) {
        const d = +cell.dataset.d;
        const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
        if (step) { e.preventDefault(); focusDay(d + step); return; }
      }
      if (e.key === 'Tab') {             // фокус не уходит из окна
        const f = [...dialog.querySelectorAll('button:not([disabled])')].filter(x => x.tabIndex !== -1 && x.offsetParent !== null);
        if (!f.length) return;
        const i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    }

    function open(instance, which) {
      if (!root) build();
      clearTimeout(closeTimer);
      inst = instance; opener = which === 'out' ? instance.outBtn : instance.inBtn;
      const cur = instance.get();
      a = cur.a !== null && cur.a >= TODAY ? cur.a : null;
      b = a !== null ? cur.b : null;
      origA = a; origB = b;
      if (which === 'out' && a !== null) { b = null; hint('Выберите дату выезда'); }
      else hint(a === null ? 'Выберите дату заезда' : b === null ? 'Выберите дату выезда' : 'Нажмите на день, чтобы выбрать даты заново');
      hover = null;
      viewMonth = Math.min(Math.max(FIRST_MONTH, a !== null ? monthOf(a) : FIRST_MONTH), LAST_MONTH - 1);
      loadOcc();
      root.hidden = false;
      render(true);
      document.documentElement.classList.add('dp-lock');
      void root.offsetWidth;                // чтобы анимация появления сработала
      root.classList.add('dp-show');
      const target = monthsEl.querySelector('.dp-day[tabindex="0"]');
      (mqMobile.matches ? root.querySelector('.dp-close') : target || doneBtn).focus({ preventScroll: true });
    }

    function close() {
      if (!isOpen()) return;
      clearTimeout(closeTimer);
      // выбран только заезд: если это тот же заезд, что был, — оставляем прежний выезд
      if (a !== null && b === null && !(a === origA && origB !== null)) inst.set(a, null);
      root.classList.remove('dp-show');
      document.documentElement.classList.remove('dp-lock');
      const done = () => { root.hidden = true; };
      if (reduceMotion.matches) done(); else setTimeout(done, 260);
      if (opener) opener.focus({ preventScroll: true });
      // заезд выбран, выезд нет — подсказываем
      if (inst && inst.get().a !== null && inst.get().b === null) inst.outBtn.classList.add('dp-invalid');
    }

    return { open, close, isOpen, render: () => render() };
  })();

  // ---------- ПРОВЕРКА ПРИ ОТПРАВКЕ ФОРМЫ ----------
  document.addEventListener('submit', e => {
    const inst = instances.find(i => i.form === e.target);
    if (!inst) return;
    const { a, b } = inst.get();
    if (a === null || b === null) {
      e.preventDefault();
      e.stopImmediatePropagation();
      (a === null ? inst.inBtn : inst.outBtn).classList.add('dp-invalid');
      picker.open(inst, a === null ? 'in' : 'out');
    }
  }, true);

  // ---------- ЗАПУСК ----------
  function init() {
    document.querySelectorAll('input[data-range-start]').forEach(inEl => {
      const scope = inEl.form || inEl.closest('[data-range]') || document;
      const outEl = scope.querySelector('input[data-range-end]');
      if (!outEl) return;
      const roomSel = inEl.dataset.roomSelect ? document.getElementById(inEl.dataset.roomSelect) : null;
      instances.push(new Instance(inEl, outEl, { roomSelect: roomSel }));
    });
    if (!instances.length) return;
    // данные о занятости грузим, когда браузер свободен
    (window.requestIdleCallback || (f => setTimeout(f, 1200)))(() => loadOcc());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
