// ============================================================
// story.js — заставка главной страницы.
// Ночь, золотой луч, звезда и название «Звёздное небо» строго по центру.
// Буквы проявляются по одной. Вокруг звезды кружится золотая пыль,
// иногда пролетают падающие звёзды, небо слегка следует за мышкой.
// Гость листает — название и звезда уходят, луч бьёт в фото,
// снизу поднимается большая карточка, по рамке бежит огонёк.
//
// КАК УСТРОЕНА ПЛАВНОСТЬ
// Вся сцена описана одной функцией scene(p): для каждой точки прокрутки p
// она говорит, где стоит каждый элемент. Дальше два пути:
//  1) Современные браузеры (Chrome, Яндекс, Samsung, Edge, Safari 26+):
//     из scene() один раз собираются CSS-анимации, привязанные к прокрутке
//     (animation-timeline). Их двигает видеокарта вместе с прокруткой —
//     скрипт в каждом кадре не работает вообще, поэтому нет подлагиваний,
//     даже если телефон занят чем-то ещё.
//  2) Остальные браузеры: та же scene() применяется скриптом в каждом кадре.
// Всё движение — только transform и opacity.
// ============================================================
(function () {
  const section = document.getElementById('story');
  if (!section) return;
  const pin = section.querySelector('.story-pin');
  const line = section.querySelector('.hw-line');
  const eyebrow = section.querySelector('.hw-eyebrow');
  const star = section.querySelector('.star');
  const beam = section.querySelector('.beam');
  const core = section.querySelector('.beam-core');
  const show = section.querySelector('.showcase');
  const skies = [...section.querySelectorAll('.story-sky')];
  const shooting = section.querySelector('.shooting');
  const dust = section.querySelector('.star-dust');
  const cue = [...section.querySelectorAll('.scroll-cue > *')];
  const glare = section.querySelector('.sc-glare');
  // луч бьёт в фото: вспышка в точке удара и два огонька по рамке
  const frame = section.querySelector('.sc-frame');
  const hit = section.querySelector('.sc-hit');
  const runR = section.querySelector('.sc-run-r');
  const runL = section.querySelector('.sc-run-l');
  const nebula = section.querySelector('.nebula');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // анимации, привязанные к прокрутке, умеет ли браузер
  const CSSMODE = !reduce && !!(window.CSS && CSS.supports &&
    CSS.supports('animation-timeline: view()') && CSS.supports('animation-range: contain 0% contain 100%'));

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => { const x = clamp((v - a) / (b - a), 0, 1); return x * x * x * (x * (x * 6 - 15) + 10); };  // smootherstep — мягкий старт и мягкая остановка
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIO = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  // ---------- Буквы: по словам, каждая буква отдельно ----------
  // Внешний span двигает прокрутка, внутренний .ch — проявление при открытии.
  // Так две анимации не мешают друг другу и буквы никогда не «прыгают».
  const letters = [], glyphs = [];
  (function split() {
    const words = line.textContent.trim().split(/\s+/);
    line.textContent = '';
    line.setAttribute('aria-label', words.join(' '));
    let n = 0;
    words.forEach((w, wi) => {
      const ws = document.createElement('span');
      ws.className = 'chs';
      ws.setAttribute('aria-hidden', 'true');
      [...w].forEach(chr => {
        const o = document.createElement('span');
        o.className = 'chw';
        const s = document.createElement('span');
        s.className = 'ch';
        s.textContent = chr;
        s.style.animationDelay = (0.08 + n * 0.025).toFixed(3) + 's';
        o.appendChild(s); ws.appendChild(o);
        letters.push(o); glyphs.push(s); n++;
      });
      line.appendChild(ws);
      if (wi < words.length - 1) line.appendChild(document.createTextNode(' '));
    });
  })();
  // буквы проявились — снимаем с них отдельные слои, они больше не двигаются сами
  const introDone = () => glyphs.forEach(s => s.classList.add('done'));
  setTimeout(introDone, reduce ? 0 : 1100);

  // ---------- Блик света пробегает по золотым буквам ----------
  // У каждой буквы второй слой фона — светлая полоса шириной во всё слово;
  // сдвигаем её одной переменной --sx, поэтому полоса идёт по словам непрерывно.
  let prog = 0, visible = true, weak = false, scrolling = false;
  function measureShine() {
    const lr = line.getBoundingClientRect();
    line.style.setProperty('--lw', lr.width.toFixed(1) + 'px');
    glyphs.forEach(s => { const r = s.getBoundingClientRect(); s.style.setProperty('--ox', (r.left - lr.left).toFixed(1) + 'px'); });
  }
  let shineRaf = 0, shineTimer = 0;
  function sweep() {
    clearTimeout(shineTimer);
    if (reduce || weak || scrolling || document.hidden || !visible || prog > 0.02) { shineTimer = setTimeout(sweep, 4000); return; }
    const w = line.getBoundingClientRect().width, t0 = performance.now(), dur = 2200;
    cancelAnimationFrame(shineRaf);
    (function f(now) {
      const k = Math.min(1, (now - t0) / dur), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      line.style.setProperty('--sx', (-w * 0.7 + e * w * 1.9).toFixed(1) + 'px');
      if (k < 1 && prog <= 0.02) shineRaf = requestAnimationFrame(f);
    })(t0);
    shineTimer = setTimeout(sweep, 9000);
  }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => {
    measureShine();
    shineTimer = setTimeout(sweep, 1900);
  });
  // строка адреса на телефоне меняет только высоту окна — буквы при этом не двигаются, замер не нужен
  let shineW = window.innerWidth;
  window.addEventListener('resize', () => { if (window.innerWidth === shineW) return; shineW = window.innerWidth; setTimeout(measureShine, 100); });

  // ---------- Звёзды на небе: два слоя (ближний ярче, дальний мельче) ----------
  let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  // рисуются один раз на холсте (см. ZNSky в theme.js) — это в десятки раз легче
  // Оба слоя звёзд (ближний ярче, дальний мельче) рисуются в одно небо: раньше это были
  // четыре прозрачных слоя на весь экран, и видеокарта смешивала их в каждом кадре прокрутки.
  const small = window.innerWidth < 760;
  if (skies[1]) { skies[1].remove(); skies.length = 1; }
  const many = small ? 35 : 90;
  const lowSky = !!(window.ZNPerf && ZNPerf.isLite());
  if (window.ZNSky && skies[0]) ZNSky(skies[0], { count: many, size: 2.2, spread: 1, alpha: .6, seed: 7, lo: .15, hi: .85, period: 5000,
    extra: lowSky ? null : { count: Math.round(many * 1.4), size: 1.5, spread: 0.6, alpha: .35, twinkle: .55, seed: 38 } });

  let narrow = false, lite = false, coarse = false;
  function measure() {
    narrow = window.innerWidth < 760;
    coarse = window.matchMedia('(pointer: coarse)').matches;
    const wasWeak = weak;
    weak = !!(window.ZNPerf && ZNPerf.isLite());
    // слабое устройство: буквы уходят всей надписью, а не по одной — снимаем с них отдельные слои
    if (weak && !wasWeak) letters.forEach(s => { s.style.transform = ''; memo.delete(s); });
    section.classList.toggle('is-low', weak);
    lite = weak || narrow || coarse || (navigator.hardwareConcurrency || 8) <= 4;
    section.classList.toggle('is-lite', lite);
  }

  // ---------- Золотая пыль вокруг звезды (маленький холст) ----------
  const dctx = dust && dust.getContext('2d');
  const motes = [];
  let dustW = 0, dustOn = false;
  function setupDust() {
    if (!dctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, lite ? 1.25 : 2);
    dustW = dust.clientWidth;
    dust.width = dust.height = Math.round(dustW * dpr);
    dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    motes.length = 0;
    const count = lite ? 14 : 48;
    for (let i = 0; i < count; i++) {
      motes.push({
        a: rnd() * Math.PI * 2,              // угол на орбите
        r: dustW * (0.12 + rnd() * 0.36),     // радиус орбиты
        sp: (0.04 + rnd() * 0.12) * (rnd() < 0.5 ? 1 : -1),
        up: 4 + rnd() * 10,                   // медленный подъём
        s: 0.6 + rnd() * 1.6,
        ph: rnd() * 6.28, life: rnd()
      });
    }
  }
  let dustLast = 0;
  function drawDust(now) {
    if (!dctx || !dustOn) return;
    if (dustLast && now - dustLast < 31) { requestAnimationFrame(drawDust); return; }   // 30 кадров в секунду хватает, это вдвое легче
    const dt = dustLast ? Math.min(0.05, (now - dustLast) / 1000) : 0.016;
    dustLast = now;
    const c = dustW / 2;
    dctx.clearRect(0, 0, dustW, dustW);
    for (const m of motes) {
      m.a += m.sp * dt; m.life += dt * 0.12;
      if (m.life > 1) { m.life = 0; m.r = dustW * (0.12 + rnd() * 0.36); }
      const tw = 0.5 + 0.5 * Math.sin(now / 600 + m.ph);
      const fade = Math.sin(m.life * Math.PI);
      const x = c + Math.cos(m.a) * m.r;
      const y = c + Math.sin(m.a) * m.r * 0.6 - m.life * m.up * 6;
      dctx.globalAlpha = fade * (0.35 + 0.65 * tw);
      dctx.fillStyle = tw > 0.8 ? '#fffbe8' : '#e8c766';
      dctx.beginPath(); dctx.arc(x, y, m.s * (0.7 + 0.5 * tw), 0, 6.283); dctx.fill();
    }
    requestAnimationFrame(drawDust);
  }
  let dustReady = false;             // пыль включаем после проявления звезды — на старте процессор занят
  function dustState(on) {
    if (reduce || !dctx || weak || !visible || document.hidden || !dustReady || scrolling) on = false;
    if (on && !dustOn) { dustOn = true; dustLast = 0; requestAnimationFrame(drawDust); }
    if (!on) dustOn = false;
  }

  // ---------- Падающие звёзды ----------
  let shootTimer = 0;
  function shoot() {
    if (!shooting || weak || scrolling || document.hidden || !visible || prog > 0.3) return planShoot();
    const s = document.createElement('i');
    s.style.left = (10 + rnd() * 60) + '%';
    s.style.top = (5 + rnd() * 30) + '%';
    s.style.setProperty('--a', (18 + rnd() * 22).toFixed(1) + 'deg');
    shooting.appendChild(s);
    s.addEventListener('animationend', () => s.remove());
    planShoot();
  }
  function planShoot() { clearTimeout(shootTimer); if (!reduce) shootTimer = setTimeout(shoot, 3500 + rnd() * 5000); }

  // ---------- Геометрия: где верх фото и докуда достаёт луч ----------
  // Фото поднимается с «повёрнутой» верхней кромкой (поворот вокруг неё), поэтому
  // её высоту на экране можно посчитать без замеров в каждом кадре.
  const SPAN = 0.655;                         // какая часть сцены проигрывается за прокрутку первого экрана
  const rOf = p => smooth(0.05, 0.62, p);
  let pinH = 1, showTop = 0, pHit = 0.2;
  const cardTop = p => showTop + lerp(narrow ? 62 : 68, 0, rOf(p)) / 100 * pinH;
  const reach = p => pinH * lerp(0.37, 1.05, smooth(0.0, 0.5, p));   // луч догоняет фото, когда оно уже почти поднялось
  let secTop = 0, travel = 1;
  function measureGeom() {
    pinH = pin.offsetHeight || window.innerHeight;
    // где начинается заставка и сколько её листать — запоминаем, чтобы при прокрутке ничего не замерять
    secTop = section.getBoundingClientRect().top + window.scrollY;
    travel = section.offsetHeight - pinH;
    showTop = show ? show.offsetTop : pinH;
    pHit = 0.6;
    for (let q = 0; q <= 0.6; q += 0.002) if (reach(q) >= cardTop(q)) { pHit = q; break; }
    if (frame && runR) {
      const w = frame.offsetWidth, h = frame.offsetHeight, d = Math.ceil(Math.hypot(w, h)) + 6;
      [runR, runL].forEach(el => { if (!el) return; el.style.width = el.style.height = d + 'px'; el.style.left = ((w - d) / 2) + 'px'; el.style.top = ((h - d) / 2) + 'px'; });
    }
  }

  // ---------- Сцена: положение всех элементов при прокрутке p ----------
  // set(элемент, свойство, значение). Мышка и проявление звезды сюда не входят:
  // они двигают отдельные свойства (translate) и внутренний слой звезды.
  function scene(p, set) {
    // название стоит на месте, пока не начнёт подниматься фото, и только потом уходит
    const a = smooth(0.14, 0.46, p);
    const r = rOf(p);                         // карточка поднимается и растёт
    const fade = 1 - smooth(0.16, 0.44, p);

    // буквы разлетаются от центра в стороны и чуть вверх
    const mid = (letters.length - 1) / 2;
    if (weak) set(line, 'transform', 'translate3d(0,' + (-a * 34).toFixed(1) + 'px,0)');   // слабое устройство: надпись уходит целиком
    else letters.forEach((s, i) => {
      const d = i - mid;
      set(s, 'transform', 'translate3d(' + (d * a * (narrow ? 6 : 14)).toFixed(1) + 'px,' + (-Math.abs(d) * a * 3 - a * 30).toFixed(1) + 'px,0)');
    });
    set(line, 'opacity', fade.toFixed(3));
    set(eyebrow, 'opacity', fade.toFixed(3));
    // звезда поднимается и растёт, коротко вспыхивает, когда выпускает луч в фото
    const sA = smooth(0.0, 0.55, p);
    const fl = smooth(pHit - 0.05, pHit - 0.01, p) * (1 - smooth(pHit, pHit + 0.06, p));
    set(star, 'transform', 'translate3d(0,' + (-sA * 36).toFixed(1) + 'px,0) scale(' + ((1 + sA * 0.9) * (1 + fl * 0.22)).toFixed(4) + ')');
    set(star, 'opacity', (1 - smooth(0.2, 0.66, p)).toFixed(3));
    set(beam, 'opacity', (1 - smooth(0.45, 0.85, p) * 0.7).toFixed(3));
    set(beam, 'transform', 'scaleX(' + (1 + a * 0.8).toFixed(3) + ')');
    // луч опускается с прокруткой и упирается в верхний край фото
    set(core, 'transform', 'translateX(-50%) scaleY(' + (Math.min(reach(p), cardTop(p)) / (0.74 * pinH)).toFixed(4) + ')');
    const so = smooth(0.02, 0.1, p);
    set(show, 'opacity', so.toFixed(3));
    // карточка из-под горизонта: наклонена → выпрямляется
    const y = lerp(narrow ? 62 : 68, 0, r);
    const sc = lerp(narrow ? 0.9 : 0.74, 1, r);
    const tilt = lerp(18, 0, r);
    set(show, 'transform', 'translate3d(0,' + y.toFixed(2) + 'vh,0)' + (weak ? '' : ' perspective(1600px) rotateX(' + tilt.toFixed(2) + 'deg)') + ' scale(' + sc.toFixed(4) + ')');
    // небо: два слоя с разной глубиной
    skies.forEach(sky => set(sky, 'transform', 'translate3d(0,' + (-p * 60).toFixed(1) + 'px,0)'));
    // подсказка «листайте» исчезает при первом движении
    cue.forEach(el => set(el, 'opacity', (1 - smooth(0.0, 0.05, p)).toFixed(3)));
    // блик скользит по фото сразу после удара луча
    if (glare) {
      const g = smooth(pHit + 0.01, pHit + 0.32, p);
      set(glare, 'transform', 'translate3d(' + (-130 + g * 330).toFixed(1) + '%,0,0) skewX(-18deg)');
      set(glare, 'opacity', (Math.sin(g * Math.PI) * 0.55).toFixed(3));
    }
    // удар луча: вспышка, затем два огонька бегут по рамке в разные стороны и сливаются внизу
    if (hit) {
      const f = p < pHit ? smooth(pHit - 0.012, pHit, p) : 1 - smooth(pHit, pHit + 0.07, p);
      set(hit, 'opacity', f.toFixed(3));
      set(hit, 'transform', 'scale(' + (0.5 + 0.7 * f).toFixed(3) + ')');
    }
    if (runR && runL) {
      const q = easeIO(clamp((p - pHit) / 0.25, 0, 1));   // огоньки сходятся внизу, когда фото уже целиком видно
      const on = smooth(pHit, pHit + 0.008, p);
      set(runR, 'rotate', (q * 180).toFixed(2) + 'deg');
      set(runL, 'rotate', (-q * 180).toFixed(2) + 'deg');
      set(runR, 'opacity', on.toFixed(3));
      set(runL, 'opacity', (q >= 1 ? 0 : on).toFixed(3));
    }
    // туманность — самый дальний слой, сдвигается медленнее всех
    set(nebula, 'transform', 'translate3d(0,' + (-p * 40).toFixed(1) + 'px,0)');
    set(nebula, 'opacity', (1 - smooth(0.3, 0.8, p) * 0.6).toFixed(3));
  }

  // То, что включается и выключается (а не плавно меняется): кружащий огонёк, пыль
  let merged = false;
  function states(p) {
    prog = p;
    // фото прячем целиком, пока оно не начало проявляться (переключатель, а не анимация — дёшево)
    put(show, 'visibility', p < 0.023 ? 'hidden' : 'visible');
    // огоньки, блик и вспышка невидимы большую часть пути — пока они не нужны, видеокарта их вовсе не рисует
    const vis = (el, on) => el && put(el, 'visibility', on ? 'visible' : 'hidden');
    vis(runR, p > pHit - 0.002 || merged);
    vis(runL, p > pHit - 0.002 && p < pHit + 0.26);
    vis(glare, p > pHit && p < pHit + 0.335);
    vis(hit, p > pHit - 0.014 && p < pHit + 0.075);
    if (runR && runL) {
      const q = clamp((p - pHit) / 0.25, 0, 1);
      if (!merged && q >= 1) { merged = true; runR.classList.add('orbit'); frame.classList.add('lit'); }
      else if (merged && q < 0.6) { merged = false; runR.classList.remove('orbit'); frame.classList.remove('lit'); }
    }
    dustState(p < 0.6);
  }

  // Прокрутка → p (0…SPAN)
  function readP() {
    if (reduce) return 1;
    // только арифметика по запомненным числам — браузеру не приходится пересчитывать страницу
    return travel > 0 ? clamp((window.scrollY - secTop) / travel, 0, 1) * SPAN : SPAN;
  }

  // ---------- Путь 1: CSS-анимации, привязанные к прокрутке ----------
  // Собираются не сразу, а когда браузер освободится (первые секунды сцену двигает скрипт) —
  // так открытие страницы и проявление звезды не подтормаживают.
  let sda = false;
  const styleEl = CSSMODE ? document.head.appendChild(document.createElement('style')) : null;
  function buildCSS() {
    const N = 36, tracks = new Map();         // элемент → { свойство → [значения] }
    for (let i = 0; i <= N; i++) {
      scene(i / N * SPAN, (el, prop, val) => {
        if (!el) return;
        let t = tracks.get(el); if (!t) tracks.set(el, t = {});
        (t[prop] = t[prop] || []).push(val);
      });
    }
    let css = '', k = 0;
    const frames = (name, props) => {
      let s = '@keyframes ' + name + '{';
      for (let i = 0; i <= N; i++) s += (i / N * 100).toFixed(3) + '%{' + props.map(pr => pr[0] + ':' + pr[1][i]).join(';') + '}';
      return s + '}';
    };
    tracks.forEach((t, el) => {
      const id = 'zs' + (k++);
      el.setAttribute('data-zs', id);
      // видимость меняется скачком и не умеет работать на видеокарте — её держим отдельно,
      // чтобы не утянуть на процессор движение того же элемента
      const smoothProps = Object.keys(t).filter(pr => pr !== 'visibility').map(pr => [pr, t[pr]]);
      const names = [];
      if (smoothProps.length) { css += frames(id, smoothProps); names.push(id); }
      if (t.visibility) { css += frames(id + 'v', [['visibility', t.visibility]]); names.push(id + 'v'); }
      css += '[data-zs="' + id + '"]{animation:' + names.map(n => n + ' 1s linear both').join(',') +
        ';animation-timeline:' + names.map(() => '--story').join(',') +
        ';animation-range:contain 0% contain 100%}';
    });
    styleEl.textContent = css;
  }

  // ---------- Путь 2: скрипт применяет сцену в каждом кадре ----------
  const memo = new Map();
  function put(el, prop, val) {
    if (!el) return;
    let m = memo.get(el); if (!m) memo.set(el, m = {});
    if (m[prop] === val) return;
    m[prop] = val;
    el.style[prop] = val;
  }
  // Мягкий догон: сцена догоняет прокрутку с лёгкой инерцией (≈0,15 с),
  // поэтому резкие рывки колёсика и «броски» пальцем выглядят плавно.
  const TAU = 0.05;                              // чем меньше, тем ближе к пальцу
  let raf = 0, cur = reduce ? 1 : 0, target = cur, last = 0, frozen = false;
  function render(p) { scene(p, put); states(p); }
  // Сторож: если во время прокрутки кадры часто опаздывают, устройство не успевает —
  // переходим на «строго за пальцем» (сцену двигает видеокарта) и облегчаем украшения.
  const boot = performance.now();
  let sess = [], strikes = 0;
  function judge() {
    const n = sess.length;
    if (n >= 20 && performance.now() - boot > 2500 && !weak) {
      const slow = sess.filter(d => d > 24).length / n;
      if (slow > 0.35) strikes += 2; else if (slow > 0.18) strikes++;
      if (strikes >= 2) goStrict();
    }
    sess = [];
  }
  function loop(now) {
    raf = 0;
    if (last) { const d = now - last; if (d < 250) sess.push(d); }
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    target = readP();
    cur += (target - cur) * (1 - Math.exp(-dt / TAU));
    if (Math.abs(target - cur) < 0.0002) cur = target;
    render(cur);
    if (visible && !document.hidden && cur !== target && !frozen && !sda) raf = requestAnimationFrame(loop);
    else judge();
  }
  // пока листают, пыль, блик на буквах и падающие звёзды ждут — весь процессор отдан сцене
  let sraf = 0, stillT = 0;
  function onScroll() {
    if (!scrolling) { scrolling = true; dustState(false); }
    clearTimeout(stillT);
    stillT = setTimeout(() => { scrolling = false; dustState(prog < 0.6); }, 220);
    // в режиме «строго за пальцем» скрипт только переключает огонёк (дёшево, без записи стилей)
    if (sda) { if (!sraf) sraf = requestAnimationFrame(() => { sraf = 0; states(readP()); }); return; }
    if (!raf && !reduce && !frozen) { last = 0; raf = requestAnimationFrame(loop); }
  }

  // ---------- Мышка: небо и звезда чуть смещаются (глубина) ----------
  // Двигает отдельное свойство translate — не мешает анимации прокрутки.
  let mx = 0, my = 0, tmx = 0, tmy = 0, mraf = 0;
  function mouseLoop() {
    mraf = 0;
    const km = 0.06;
    mx += (tmx - mx) * km; my += (tmy - my) * km;
    if (Math.abs(tmx - mx) < 0.001 && Math.abs(tmy - my) < 0.001) { mx = tmx; my = tmy; }
    const tr = (el, x, y) => el && (el.style.translate = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px');
    tr(star, mx * 18, my * 14);
    tr(beam, mx * 18, 0);
    skies.forEach((sky, i) => { const k = i ? 0.5 : 1; tr(sky, -mx * 24 * k, -my * 16 * k); });
    tr(nebula, -mx * 12, -my * 8);
    if (mx !== tmx || my !== tmy) mraf = requestAnimationFrame(mouseLoop);
  }
  if (!reduce) {
    const mreq = () => { if (!mraf) mraf = requestAnimationFrame(mouseLoop); };
    pin.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || prog > 0.5) return;
      const r = pin.getBoundingClientRect();
      tmx = (e.clientX - r.left) / r.width - 0.5;
      tmy = (e.clientY - r.top) / r.height - 0.5;
      mreq();
    }, { passive: true });
    pin.addEventListener('pointerleave', () => { tmx = tmy = 0; mreq(); });
  }

  // ---------- Запуск ----------
  function rebuild() {
    measure(); measureGeom();
    if (sda) { buildCSS(); states(readP()); }
    else { memo.clear(); render(cur); onScroll(); }
  }
  function goSDA() {
    if (sda || !CSSMODE) return;
    sda = true;
    cancelAnimationFrame(raf); raf = 0;
    buildCSS();
    section.classList.add('is-sda');
    states(readP());
  }
  function goStrict() {
    try { sessionStorage.setItem('zn-strict', '1'); } catch (e) {}
    if (window.ZNPerf) ZNPerf.setLite();          // лёгкий режим: subscribers ниже пересоберут сцену
    else { measure(); rebuild(); }
    goSDA();
  }
  measure();
  measureGeom();
  setupDust();
  if (reduce) section.classList.add('is-static');
  cur = target = reduce ? 1 : readP();
  render(cur);                                   // стартовый кадр — сразу, без сборки анимаций
  // «Строго за пальцем» сразу — только на слабых устройствах (или если сторож уже переключал).
  // Остальные получают мягкий догон.
  let strictWanted = weak;
  try { if (sessionStorage.getItem('zn-strict') === '1') strictWanted = true; } catch (e) {}
  if (CSSMODE && strictWanted) {
    // собираем сразу после первого кадра, в спокойный момент (не во время прокрутки)
    if (window.ZNCalm) ZNCalm(goSDA, 350); else setTimeout(goSDA, 600);
  }
  const wakeDust = () => { dustReady = true; dustState(prog < 0.6); };
  if (window.ZNCalm) ZNCalm(wakeDust, 1500); else setTimeout(wakeDust, 1800);
  // сцена готова — теперь её можно показывать (до этого фото и надпись скрыты в CSS)
  section.classList.add('is-ready');

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(e => {
      visible = e[0].isIntersecting;
      section.classList.toggle('is-off', !visible);
      if (visible) { onScroll(); dustState(prog < 0.6); } else dustState(false);
    }).observe(section);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  // устройство оказалось слабым — переходим на лёгкий режим на ходу
  if (window.ZNPerf) ZNPerf.onLite(() => { measure(); setupDust(); dustState(prog < 0.6); if (sda) buildCSS(); else { render(cur); if (CSSMODE) goSDA(); } });
  let rt = 0, lastW = window.innerWidth, lastH = window.innerHeight;
  window.addEventListener('resize', () => {
    // строка адреса на телефоне меняет высоту окна при прокрутке — на это сцену не пересобираем
    if (coarse && window.innerWidth === lastW && Math.abs(window.innerHeight - lastH) < 160) return;
    lastW = window.innerWidth; lastH = window.innerHeight;
    clearTimeout(rt); rt = setTimeout(() => { rebuild(); setupDust(); }, 150);
  });
  window.addEventListener('load', rebuild);
  document.addEventListener('visibilitychange', () => { if (document.hidden) dustState(false); else { dustState(prog < 0.6); onScroll(); } });
  // для записи видео-превью: показать кадр с заданной прокруткой (только путь 2)
  window.ZNStory = { css: CSSMODE, render: p => { cur = target = p; render(p); }, stop: () => { frozen = true; cancelAnimationFrame(raf); raf = 0; } };
  planShoot();
  setTimeout(shoot, 3500);
})();
