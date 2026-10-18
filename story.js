// ============================================================
// story.js — заставка главной страницы.
// Ночь, золотой луч, звезда и название «Звёздное небо» строго по центру.
// Буквы проявляются по одной. Вокруг звезды кружится золотая пыль,
// иногда пролетают падающие звёзды, небо слегка следует за мышкой.
// Гость листает — название и звезда уходят, луч гаснет, а снизу
// поднимается большая карточка с фото номера.
// Всё движение — только transform и opacity, поэтому плавно даже на телефоне.
// ============================================================
(function () {
  const section = document.getElementById('story');
  if (!section) return;
  const pin = section.querySelector('.story-pin');
  const line = section.querySelector('.hw-line');
  const eyebrow = section.querySelector('.hw-eyebrow');
  const star = section.querySelector('.star');
  const beam = section.querySelector('.beam');
  const corners = [...section.querySelectorAll('.corner')];
  const cta = section.querySelector('.hero-cta');
  const flare = section.querySelector('.beam-flare');
  const core = section.querySelector('.beam-core');
  const bglow = section.querySelector('.beam-glow');
  const show = section.querySelector('.showcase');
  const skies = [...section.querySelectorAll('.story-sky')];
  const shooting = section.querySelector('.shooting');
  const dust = section.querySelector('.star-dust');
  const cue = section.querySelector('.scroll-cue');
  const glare = section.querySelector('.sc-glare');
  const nebula = section.querySelector('.nebula');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => { const x = clamp((v - a) / (b - a), 0, 1); return x * x * x * (x * (x * 6 - 15) + 10); };  // smootherstep — мягкий старт и мягкая остановка
  const lerp = (a, b, t) => a + (b - a) * t;
  // часы появления звезды (2.8 с, плавное замедление в конце)
  const T0 = performance.now(), INTRO = reduce ? 1 : 2800;
  const introT = () => Math.min(1, (performance.now() - T0) / INTRO);
  const introEase = () => { const t = introT(); return 1 - Math.pow(1 - t, 4); };
  const memo = new Map();
  function put(el, prop, val) {
    if (!el) return;
    let m = memo.get(el); if (!m) memo.set(el, m = {});
    if (m[prop] === val) return;
    m[prop] = val;
    el.style[prop] = val;
  }

  // ---------- Буквы: по словам, каждая буква отдельно ----------
  const letters = [];
  (function split() {
    const words = line.textContent.trim().split(/\s+/);
    line.textContent = '';
    line.setAttribute('aria-label', words.join(' '));
    let n = 0;
    words.forEach((w, wi) => {
      const ws = document.createElement('span');
      ws.style.display = 'inline-block';
      ws.style.whiteSpace = 'nowrap';
      ws.setAttribute('aria-hidden', 'true');
      [...w].forEach(chr => {
        const s = document.createElement('span');
        s.className = 'ch';
        s.textContent = chr;
        s.style.animationDelay = (0.45 + n * 0.06).toFixed(3) + 's';
        ws.appendChild(s); letters.push(s); n++;
      });
      line.appendChild(ws);
      if (wi < words.length - 1) line.appendChild(document.createTextNode(' '));
    });
  })();
  // когда буквы проявились — снимаем с них анимацию, чтобы ими управляла прокрутка
  setTimeout(() => letters.forEach(s => { s.style.animation = 'none'; s.style.opacity = '1'; s.style.filter = 'none'; }), 3500);
  section.classList.add('is-ready');

  // ---------- Блик света пробегает по золотым буквам ----------
  // У каждой буквы второй слой фона — светлая полоса шириной во всё слово;
  // сдвигаем её одной переменной --sx, поэтому полоса идёт по словам непрерывно.
  function measureShine() {
    const lr = line.getBoundingClientRect();
    line.style.setProperty('--lw', lr.width.toFixed(1) + 'px');
    letters.forEach(s => { const r = s.getBoundingClientRect(); s.style.setProperty('--ox', (r.left - lr.left).toFixed(1) + 'px'); });
  }
  let shineRaf = 0, shineTimer = 0;
  function sweep() {
    clearTimeout(shineTimer);
    if (reduce || document.hidden || !visible || cur > 0.02) { shineTimer = setTimeout(sweep, 4000); return; }
    const w = line.getBoundingClientRect().width, t0 = performance.now(), dur = 2200;
    cancelAnimationFrame(shineRaf);
    (function f(now) {
      const k = Math.min(1, (now - t0) / dur), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      line.style.setProperty('--sx', (-w * 0.7 + e * w * 1.9).toFixed(1) + 'px');
      if (k < 1) shineRaf = requestAnimationFrame(f);
    })(t0);
    shineTimer = setTimeout(sweep, 9000);
  }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => {
    measureShine();
    shineTimer = setTimeout(sweep, 2600);
  });
  window.addEventListener('resize', () => setTimeout(measureShine, 100));

  // ---------- Звёзды на небе: два слоя (ближний ярче, дальний мельче) ----------
  let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const small = window.innerWidth < 760;
  skies.forEach((sky, layer) => {
    const many = (small ? 35 : 90) * (layer ? 1.4 : 1);
    for (let i = 0; i < many; i++) {
      const s = document.createElement('i');
      s.style.left = (rnd() * 100).toFixed(2) + '%';
      s.style.top = (rnd() * 100).toFixed(2) + '%';
      s.style.setProperty('--s', (0.4 + rnd() * (layer ? 0.6 : 1)).toFixed(2));
      s.style.animationDelay = (-rnd() * 6).toFixed(2) + 's';
      s.style.animationDuration = (3 + rnd() * 5).toFixed(2) + 's';
      sky.appendChild(s);
    }
  });

  let narrow = false, lite = false;
  function measure() {
    narrow = window.innerWidth < 760;
    lite = narrow || window.matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency || 8) <= 4;
    section.classList.toggle('is-lite', lite);
    memo.clear();
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
    if (lite && now - dustLast < 33) { requestAnimationFrame(drawDust); return; }   // на телефоне 30 кадров хватает
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
  function dustState(on) {
    if (reduce || !dctx) return;
    if (on && !dustOn) { dustOn = true; dustLast = 0; requestAnimationFrame(drawDust); }
    if (!on) dustOn = false;
  }

  // ---------- Падающие звёзды ----------
  let shootTimer = 0;
  function shoot() {
    if (!shooting || document.hidden || !visible) return planShoot();
    const s = document.createElement('i');
    s.style.left = (10 + rnd() * 60) + '%';
    s.style.top = (5 + rnd() * 30) + '%';
    s.style.setProperty('--a', (18 + rnd() * 22).toFixed(1) + 'deg');
    shooting.appendChild(s);
    s.addEventListener('animationend', () => s.remove());
    planShoot();
  }
  function planShoot() { clearTimeout(shootTimer); if (!reduce) shootTimer = setTimeout(shoot, 3500 + rnd() * 5000); }

  // ---------- Мышка: небо и звезда чуть смещаются (глубина) ----------
  let mx = 0, my = 0, tmx = 0, tmy = 0;
  if (!reduce) {
    pin.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = pin.getBoundingClientRect();
      tmx = (e.clientX - r.left) / r.width - 0.5;
      tmy = (e.clientY - r.top) / r.height - 0.5;
      request();
    }, { passive: true });
    pin.addEventListener('pointerleave', () => { tmx = tmy = 0; request(); });
  }

  // ---------- Кадр ----------
  function render(p) {
    const a = smooth(0.0, 0.42, p);           // название и звезда уходят
    const r = smooth(0.08, 0.8, p);           // карточка поднимается и растёт
    const fade = 1 - smooth(0.12, 0.42, p);

    // буквы разлетаются от центра в стороны и чуть вверх
    const mid = (letters.length - 1) / 2;
    if (letters[0] && letters[0].style.animation === 'none') {
      letters.forEach((s, i) => {
        const d = i - mid;
        put(s, 'transform', a ? 'translate3d(' + (d * a * (narrow ? 6 : 14)).toFixed(1) + 'px,' + (-Math.abs(d) * a * 3 - a * 30).toFixed(1) + 'px,0)' : 'none');
      });
    }
    put(line, 'opacity', fade.toFixed(3));
    put(eyebrow, 'opacity', fade.toFixed(3));
    // появление звезды: медленно раскрывается из точки и доворачивается на место
    const io = introEase();
    const sA = smooth(0.0, 0.55, p);
    put(star, 'transform', 'translate3d(' + (mx * 18).toFixed(1) + 'px,' + (my * 14 - sA * 36).toFixed(1) + 'px,0) rotate(' + ((1 - io) * -40).toFixed(2) + 'deg) scale(' + ((0.15 + 0.85 * io) * (1 + sA * 0.9)).toFixed(4) + ')');
    put(star, 'opacity', (Math.min(1, io * 1.6) * (1 - smooth(0.2, 0.66, p))).toFixed(3));
    put(beam, 'opacity', (1 - smooth(0.45, 0.85, p) * 0.7).toFixed(3));
    put(beam, 'transform', 'translate3d(' + (mx * 18).toFixed(1) + 'px,0,0) scaleX(' + (1 + a * 0.8).toFixed(3) + ')');
    const c = 1 - smooth(0.0, 0.12, p);
    corners.forEach(el => put(el, 'opacity', c.toFixed(3)));
    // нижняя часть (горизонт, кнопка, карточка) появляется только при прокрутке
    const e = smooth(0.02, 0.14, p);
    put(flare, 'opacity', e.toFixed(3));
    put(bglow, 'opacity', e.toFixed(3));
    put(core, 'transform', 'translateX(-50%) scaleY(' + lerp(0.5, 1, e).toFixed(4) + ')');
    const ci = e * (1 - smooth(0.34, 0.46, p));
    put(cta, 'opacity', ci.toFixed(3));
    put(cta, 'transform', 'translate3d(0,' + ((1 - ci) * 20).toFixed(1) + 'px,0)');
    put(cta, 'visibility', ci < 0.02 ? 'hidden' : 'visible');
    const so = smooth(0.03, 0.16, p);
    put(show, 'opacity', so.toFixed(3));
    put(show, 'visibility', so < 0.01 ? 'hidden' : 'visible');
    // карточка из-под горизонта: наклонена → выпрямляется
    const y = lerp(narrow ? 62 : 68, 0, r);
    const sc = lerp(narrow ? 0.9 : 0.74, 1, r);
    const tilt = lerp(18, 0, r);
    put(show, 'transform', 'translate3d(0,' + y.toFixed(2) + 'vh,0) perspective(1600px) rotateX(' + tilt.toFixed(2) + 'deg) scale(' + sc.toFixed(4) + ')');
    // небо: два слоя с разной глубиной
    skies.forEach((sky, i) => {
      const k = i ? 0.5 : 1;
      put(sky, 'transform', 'translate3d(' + (-mx * 24 * k).toFixed(1) + 'px,' + (-p * 70 * k - my * 16 * k).toFixed(1) + 'px,0)');
    });
    // подсказка «листайте» исчезает при первом движении
    put(cue, 'opacity', (1 - smooth(0.0, 0.05, p)).toFixed(3));
    // блик пробегает по фото, когда карточка выпрямляется
    if (glare) {
      const g = smooth(0.12, 0.7, p);
      put(glare, 'transform', 'translate3d(' + (-130 + g * 330).toFixed(1) + '%,0,0) skewX(-18deg)');
      put(glare, 'opacity', (Math.sin(g * Math.PI) * 0.55).toFixed(3));
    }
    // туманность — самый дальний слой, сдвигается медленнее всех
    put(nebula, 'transform', 'translate3d(' + (-mx * 12).toFixed(1) + 'px,' + (-p * 40 - my * 8).toFixed(1) + 'px,0)');
    put(nebula, 'opacity', (1 - smooth(0.3, 0.8, p) * 0.6).toFixed(3));
    dustState(p < 0.6);
  }

  // ---------- Плавность: сцена мягко догоняет прокрутку и мышку ----------
  let raf = 0, cur = reduce ? 1 : 0, target = cur, last = 0, visible = true, frozen = false;
  function readTarget() {
    if (reduce) return 1;
    const rr = section.getBoundingClientRect();
    const total = section.offsetHeight - window.innerHeight;
    return total > 0 ? clamp(-rr.top / total, 0, 1) : 1;
  }
  function loop(now) {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    target = readTarget();
    const k = 1 - Math.exp(-dt * (window.matchMedia('(pointer: coarse)').matches ? 14 : 9));
    cur += (target - cur) * k;
    const km = 1 - Math.exp(-dt * 3); mx += (tmx - mx) * km; my += (tmy - my) * km;
    if (Math.abs(target - cur) < 0.0002) cur = target;
    if (Math.abs(tmx - mx) < 0.001 && Math.abs(tmy - my) < 0.001) { mx = tmx; my = tmy; }
    render(cur);
    const moving = cur !== target || mx !== tmx || my !== tmy || introT() < 1;
    if (visible && !document.hidden && moving && !frozen) raf = requestAnimationFrame(loop);
  }
  function request() { if (!raf && !reduce && !frozen) { last = 0; raf = requestAnimationFrame(loop); } }

  measure();
  setupDust();
  if (reduce) section.classList.add('is-static');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(e => {
      visible = e[0].isIntersecting;
      section.classList.toggle('is-off', !visible);
      if (visible) { request(); dustState(cur < 0.6); } else dustState(false);
    }).observe(section);
  }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', () => { measure(); setupDust(); render(cur); request(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) dustState(false); else { dustState(cur < 0.6); request(); } });
  // для записи видео-превью: показать кадр с заданной прокруткой
  window.ZNStory = { render: p => { cur = target = p; render(p); }, stop: () => { frozen = true; cancelAnimationFrame(raf); raf = 0; } };
  render(cur);
  request();
  planShoot();
  setTimeout(shoot, 1800);
})();
