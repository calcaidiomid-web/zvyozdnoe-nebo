// ---------- ZNCalm: отложенная работа — только когда человек не листает ----------
// Тяжёлые, но не срочные дела (сборка анимаций, дорисовка блоков ниже экрана, дальние звёзды)
// выполняются в паузах: не раньше delay мс, и не во время прокрутки или касания.
(function () {
  var last = 0, queue = [], timer = 0;
  var bump = function () { last = performance.now(); };
  ['scroll', 'touchstart', 'touchmove', 'wheel'].forEach(function (t) { window.addEventListener(t, bump, { passive: true }); });
  function pump() {
    timer = 0;
    var now = performance.now();
    if (now - last < 300) { timer = setTimeout(pump, 300 - (now - last) + 20); return; }
    var job = queue.shift();
    if (!job) return;
    var run = function () {
      if (performance.now() - last < 300) { queue.unshift(job); timer = setTimeout(pump, 320); return; }
      try { job(); } catch (e) { /* не мешаем остальным */ }
      if (queue.length) timer = setTimeout(pump, 60);
    };
    if (window.requestIdleCallback) requestIdleCallback(run, { timeout: 800 }); else run();
  }
  window.ZNCalm = function (fn, delay) {
    setTimeout(function () { queue.push(fn); if (!timer) pump(); }, delay || 0);
  };
})();

// ---------- Лёгкий режим для слабых телефонов и компьютеров ----------
// Если устройство слабое (мало памяти/ядер, режим экономии трафика) или сайт
// начинает «подлагивать» (это замечает ui.js), на <html> ставится класс lite:
// тяжёлые украшения (размытое стекло, блики, искры) выключаются, вид остаётся тем же.
(function () {
  var root = document.documentElement, n = navigator, c = n.connection || {};
  var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  var lite = !!c.saveData || (n.hardwareConcurrency && n.hardwareConcurrency <= 2) ||
             (n.deviceMemory && (n.deviceMemory <= 2 || (coarse && n.deviceMemory <= 4)));
  try { if (sessionStorage.getItem('zn-lite') === '1') lite = true; } catch (e) {}
  if (lite) root.classList.add('lite');
  var subs = [];
  window.ZNPerf = {
    isLite: function () { return root.classList.contains('lite'); },
    setLite: function () {
      if (root.classList.contains('lite')) return;
      root.classList.add('lite');
      try { sessionStorage.setItem('zn-lite', '1'); } catch (e) {}
      subs.forEach(function (f) { try { f(); } catch (e) {} });
    },
    onLite: function (f) { subs.push(f); }
  };

  // Звёздное небо одним рисунком, а не сотнями отдельных точек: звёзды рисуются
  // один раз в картинку, дальше браузер просто сдвигает готовые слои.
  // Неподвижные звёзды — фон самого неба, мерцающие — один слой поверх (всего 2 слоя).
  window.ZNSky = function (host, o) {
    var seed = o.seed || 7;
    var rnd = function () { return (seed = (seed * 9301 + 49297) % 233280) / 233280; };
    var stars = [], layers = [], urls = [], lastW = 0, lastH = 0, rt = 0;
    for (var i = 0; i < o.count; i++) stars.push({ x: rnd(), y: rnd(), r: o.size * (0.4 + rnd() * (o.spread || 1)) / 2, g: rnd(), a: o.alpha || .6, ta: 1 });
    // o.extra — второй, дальний слой звёзд (мельче и тусклее) рисуется в те же картинки:
    // вместо четырёх слоёв на весь экран видеокарта двигает два
    if (o.extra) { var e = o.extra; seed = e.seed || 38;
      for (var j = 0; j < e.count; j++) stars.push({ x: rnd(), y: rnd(), r: e.size * (0.4 + rnd() * (e.spread || 1)) / 2, g: rnd(), a: e.alpha || .35, ta: e.twinkle || .6 }); }
    var tw = document.createElement('div'); tw.className = 'sky-c sky-c1'; host.appendChild(tw);
    layers.push(host, tw);
    function draw() {
      var w = host.clientWidth, h = host.clientHeight;
      // перерисовываем, только если размер заметно изменился (не из-за строки адреса на телефоне)
      if (!w || !h || (Math.abs(w - lastW) < 2 && Math.abs(h - lastH) / h < 0.12)) return;
      lastW = w; lastH = h;
      // на телефонах звёзды — крошечные точки: хватает плотности 1.5, холсты вдвое легче
      var dpr = Math.min(window.devicePixelRatio || 1, window.matchMedia('(pointer: coarse)').matches ? 1.5 : 2);
      layers.forEach(function (el, k) {
        var cv = document.createElement('canvas');
        cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
        var x = cv.getContext('2d');
        x.setTransform(dpr, 0, 0, dpr, 0, 0);
        x.fillStyle = '#f4ecd6';
        stars.forEach(function (st) {
          if ((st.g < .62 ? 0 : 1) !== k) return;
          x.globalAlpha = k ? st.ta : st.a;
          x.beginPath(); x.arc(st.x * w, st.y * h, Math.max(.45, st.r), 0, 6.283); x.fill();
        });
        var put = function (url) {
          if (urls[k]) URL.revokeObjectURL(urls[k]);
          urls[k] = url;
          el.style.backgroundImage = 'url(' + url + ')';
          el.style.backgroundSize = '100% 100%'; el.style.backgroundRepeat = 'no-repeat';
        };
        if (cv.toBlob) cv.toBlob(function (bl) { if (bl) put(URL.createObjectURL(bl)); }, 'image/png');
        else el.style.backgroundImage = 'url(' + cv.toDataURL() + ')';
      });
    }
    // дальний слой (o.defer) рисуем, когда браузер освободится — на старте он не нужен
    if (o.defer && window.ZNCalm) ZNCalm(draw, 1200); else draw();
    var later = function () { clearTimeout(rt); rt = setTimeout(draw, 150); };
    if ('ResizeObserver' in window) new ResizeObserver(later).observe(host); else window.addEventListener('resize', later);
    twinkles.push({ el: tw, host: host, lo: o.lo == null ? .15 : o.lo, hi: o.hi == null ? .85 : o.hi, period: o.period || 5000, phase: o.phase || 0, on: true });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { twinkles.forEach(function (t) { if (t.host === host) t.on = e[0].isIntersecting; }); }).observe(host);
    startTwinkle();
    return { redraw: function () { lastW = 0; draw(); } };
  };

  // Мерцание: яркость меняется 5 раз в секунду, а не 60 — глазу незаметно,
  // а видеокарте не нужно перерисовывать весь экран в каждом кадре.
  var twinkles = [], twTimer = 0;
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function twinkleTick() {
    if (document.hidden || root.classList.contains('theme-switching')) return;
    var now = performance.now(), lite = root.classList.contains('lite');
    twinkles.forEach(function (t) {
      if (!t.on) return;
      var v = lite || still ? (t.lo + t.hi) / 2 : t.lo + (t.hi - t.lo) * (0.5 + 0.5 * Math.sin(now / t.period * 6.2832 + t.phase));
      v = Math.round(v * 40) / 40;
      if (v !== t.v) { t.v = v; t.el.style.opacity = v; }
    });
  }
  function startTwinkle() { if (!twTimer) { twTimer = setInterval(twinkleTick, 200); twinkleTick(); } }
})();

// theme.js — переключатель светлой / тёмной темы.
// Подключается в <head>, чтобы нужная тема включалась ДО отрисовки страницы (без «вспышки» белого).
(function () {
  var KEY = 'zvezdnoe-nebo-theme';
  var root = document.documentElement;

  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  var dark = read() === 'dark';
  root.setAttribute('data-theme', dark ? 'dark' : 'light');

  var button = null, busy = false;

  function paint() {
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
    meta.content = dark ? '#121317' : '#ffffff';
    if (button) {
      button.setAttribute('aria-pressed', dark ? 'true' : 'false');
      button.setAttribute('aria-label', dark ? 'Включить светлую тему' : 'Включить тёмную тему');
      button.title = dark ? 'Светлая тема' : 'Тёмная тема';
    }
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function flip() {
    dark = !dark;
    paint();
    write(dark ? 'dark' : 'light');
  }

  // Плавная смена: от кнопки расходится «капля-волна» новой темы.
  // Браузер делает снимки старой и новой страницы и раскрывает новую кругом. Пока идёт переход,
  // тяжёлые декоративные анимации (звёздное небо, блики, искры) ставятся на паузу — поэтому нет лагов.
  function toggle() {
    if (busy) return;
    busy = true;
    if (navigator.vibrate && window.matchMedia('(pointer: coarse)').matches) { try { navigator.vibrate(6); } catch (e) {} }

    // Основной способ: браузер делает снимок страницы в старой теме, а новая тема мягко
    // проявляется поверх неё (растворение за 1.2 с). Без резких границ и «волн».
    // Сама кнопка в снимок не попадает — она живая и спокойно доигрывает свою анимацию.
    if (document.startViewTransition && !reduce) {
      root.classList.add('theme-vt', 'theme-switching');
      var vt = document.startViewTransition(function () { flip(); island(); });   // островок — сразу, вместе со сменой темы
      var done = function () { root.classList.remove('theme-vt', 'theme-switching'); busy = false; };
      vt.ready.then(function () {
        root.animate({ opacity: [0, 1] },
          { duration: 1200, easing: 'cubic-bezier(.4, 0, .2, 1)', pseudoElement: '::view-transition-new(root)', fill: 'both' });
      }).catch(function () {});
      vt.finished.then(done, done);
      return;
    }
    // Запасной вариант для старых браузеров: цвета плавно растворяются
    root.classList.add('theme-anim', 'theme-switching');
    flip(); island();
    setTimeout(function () { root.classList.remove('theme-anim', 'theme-switching'); busy = false; }, 1100);
  }
  // островок в шапке: «Ночная тема» / «Дневная тема»
  function island() {
    if (!window.ZNIsland) return;
    var dark = root.getAttribute('data-theme') === 'dark';
    window.ZNIsland.show({ icon: dark ? 'moon' : 'sun', text: dark ? 'Ночная тема' : 'Дневная тема', ms: 1500 });
  }

  function build() {
    var header = document.querySelector('header');
    if (!header || header.querySelector('.theme-toggle')) return;
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-toggle';
    // Минималистичная кнопка: один кружок. Днём — золотое солнце; ночью на него плавно
    // наплывает «тень» и он превращается в лунный серп.
    // Кружок катится по дорожке: солнце (лучи, тёплый свет) → луна (серп, кратеры, звёзды на небе)
    button.innerHTML =
      '<svg class="tstars" viewBox="0 0 52 28" aria-hidden="true"><circle cx="10" cy="9" r="1"/><circle cx="17" cy="18" r="0.75"/><circle cx="24" cy="8" r="0.6"/></svg>' +
      '<span class="knob" aria-hidden="true">' +
        '<svg class="rays" viewBox="-15 -15 30 30"><g>' +
          '<path d="M0-11.6V-14M0 11.6V14M-11.6 0H-14M11.6 0H14M-8.2-8.2l-1.7-1.7M8.2 8.2l1.7 1.7M8.2-8.2l1.7-1.7M-8.2 8.2l-1.7 1.7"/>' +
        '</g></svg>' +
        '<span class="disc"><i class="sun"></i><i class="moon"></i>' +
          '<svg class="craters" viewBox="0 0 20 20"><circle cx="7" cy="8" r="2.6"/><circle cx="12.5" cy="13.5" r="1.6"/><circle cx="6.5" cy="14" r="1"/></svg>' +
          '<i class="shade"></i></span>' +
      '</span>';
    button.addEventListener('click', toggle);
    header.appendChild(button);
    paint();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
  paint();
})();
