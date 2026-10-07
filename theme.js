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
    meta.content = dark ? '#0e1018' : '#ffffff';
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
      var vt = document.startViewTransition(flip);
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
    flip();
    setTimeout(function () { root.classList.remove('theme-anim', 'theme-switching'); busy = false; }, 1100);
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
