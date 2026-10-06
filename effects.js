// ============================================================
// effects.js — «вау-эффекты» сайта «Звёздное небо»
// Подключён на всех страницах. Каждый эффект — отдельный блок,
// любой можно выключить, закомментировав его вызов внизу файла.
// ============================================================
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;   // мышка, а не палец
  const isSmallScreen = window.innerWidth < 768;

  // ---------- ЗАГОТОВКИ ЗВЁЗД ----------
  // Звезду рисуем один раз в маленькую картинку, а потом только копируем её —
  // это в разы быстрее, чем каждый кадр заново рисовать каждую звезду.
  function makeSprite(size, kind) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const m = size / 2;
    if (kind === 'dot') {
      const grad = g.createRadialGradient(m, m, 0, m, m, m);
      grad.addColorStop(0, 'rgba(255, 236, 170, 1)');
      grad.addColorStop(0.35, 'rgba(212, 175, 55, 0.95)');
      grad.addColorStop(1, 'rgba(212, 175, 55, 0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, size, size);
    } else {
      g.fillStyle = 'rgb(212, 175, 55)';
      g.beginPath();
      g.moveTo(m, 0);
      g.quadraticCurveTo(m, m, size, m);
      g.quadraticCurveTo(m, m, m, size);
      g.quadraticCurveTo(m, m, 0, m);
      g.quadraticCurveTo(m, m, m, 0);
      g.fill();
    }
    return c;
  }
  const DOT = makeSprite(16, 'dot');
  const SPARKLE = makeSprite(32, 'sparkle');

  // ---------- 0. ОДИН ОБЩИЙ ОБРАБОТЧИК ПРОКРУТКИ ----------
  // Все эффекты, которым нужна прокрутка, подписываются сюда.
  // Обновление — не чаще одного раза за кадр, высота страницы
  // пересчитывается только при изменении размера окна.
  const scrollTasks = [];
  let maxScroll = 1, scrollQueued = false;

  function measure() {
    maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }

  function runScrollTasks() {
    scrollQueued = false;
    const y = window.scrollY;
    const progress = Math.min(1, y / maxScroll);
    scrollTasks.forEach(fn => fn(y, progress));
  }

  function onScroll(fn) { scrollTasks.push(fn); }

  // Пока страницу крутят, мелкие мерцания ставим на паузу — вся мощность уходит на плавную прокрутку
  const root = document.documentElement;
  let scrollIdleTimer = null;

  window.addEventListener('scroll', () => {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(runScrollTasks); }
    if (!scrollIdleTimer) root.classList.add('is-scrolling');
    clearTimeout(scrollIdleTimer);
    scrollIdleTimer = setTimeout(() => { root.classList.remove('is-scrolling'); scrollIdleTimer = null; }, 180);
  }, { passive: true });
  window.addEventListener('resize', () => { measure(); runScrollTasks(); });
  window.addEventListener('load', () => { measure(); runScrollTasks(); });

  // ---------- 1. ШАПКА: уменьшается при прокрутке + золотая линия прогресса ----------
  function headerEffects() {
    const header = document.querySelector('header');
    if (!header) return;

    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    header.appendChild(bar);

    let wasScrolled = null;
    onScroll((y, p) => {
      bar.style.transform = `scaleX(${p})`;
      const scrolled = y > 40;
      if (scrolled !== wasScrolled) { header.classList.toggle('scrolled', scrolled); wasScrolled = scrolled; }
    });
  }

  // ---------- 2. ЗВЁЗДНОЕ НЕБО В ПЕРВОМ ЭКРАНЕ (+ падающие звёзды) ----------
  function starfield() {
    const hero = document.querySelector('.hero');
    if (!hero || reduceMotion) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'hero-stars';
    canvas.setAttribute('aria-hidden', 'true');
    hero.prepend(canvas);
    const ctx = canvas.getContext('2d');

    let w = 0, h = 0, dpr = 1, stars = [], shooting = [];
    let mouseX = 0, mouseY = 0, running = true, last = 0, nextShot = 1500;

    function resize() {
      dpr = 0.6;   // рисуем в уменьшенном размере, браузер растягивает — звёзды мягкие, а работы втрое меньше
      w = hero.clientWidth;
      h = hero.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(140, Math.round((w * h) / (isSmallScreen ? 12000 : 8000)));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 + 0.4,
        depth: Math.random() * 0.8 + 0.2,              // для параллакса
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.002 + 0.0008,
        sparkle: Math.random() < 0.08                    // крупные звёздочки-крестики
      }));
    }

    function drawSparkle(x, y, size, alpha) {
      ctx.globalAlpha = alpha;
      ctx.drawImage(SPARKLE, x - size, y - size, size * 2, size * 2);
    }

    function launchShootingStar() {
      shooting.push({
        x: Math.random() * w * 0.7 + w * 0.2,
        y: Math.random() * h * 0.3,
        vx: -(Math.random() * 4 + 6),
        vy: Math.random() * 2 + 2.5,
        life: 0,
        max: 60 + Math.random() * 30
      });
    }

    function frame(t) {
      if (!running) return;
      requestAnimationFrame(frame);
      if (t - last < 33) return;            // 30 кадров в секунду глазу достаточно
      if (root.classList.contains('is-scrolling')) return;   // пока крутят страницу — небо замирает
      const dt = Math.min(t - last, 66);
      last = t;
      ctx.clearRect(0, 0, w, h);

      const offX = (mouseX - w / 2) * 0.02;
      const offY = (mouseY - h / 2) * 0.02;

      stars.forEach(s => {
        const a = 0.35 + 0.6 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
        const x = s.x + offX * s.depth, y = s.y + offY * s.depth;
        if (s.sparkle) {
          drawSparkle(x, y, s.r * 3.2, a);
        } else {
          const d = s.r * 5.5;
          ctx.globalAlpha = a;
          ctx.drawImage(DOT, x - d / 2, y - d / 2, d, d);
        }
      });
      ctx.globalAlpha = 1;

      nextShot -= dt;
      if (nextShot <= 0) {
        launchShootingStar();
        nextShot = 2500 + Math.random() * 4000;
      }
      shooting = shooting.filter(s => s.life < s.max);
      shooting.forEach(s => {
        s.life += 2;
        s.x += s.vx * 2;                       // кадров стало вдвое меньше — летим вдвое быстрее
        s.y += s.vy * 2;
        const fade = 1 - s.life / s.max;
        const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 14, s.y - s.vy * 14);
        grad.addColorStop(0, `rgba(212, 175, 55, ${0.9 * fade})`);
        grad.addColorStop(1, 'rgba(212, 175, 55, 0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 14, s.y - s.vy * 14);
        ctx.stroke();
        drawSparkle(s.x, s.y, 4, fade);
      });
      ctx.globalAlpha = 1;
    }

    function start() {
      if (running) return;
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    }

    hero.addEventListener('mousemove', e => {
      const r = hero.getBoundingClientRect();
      mouseX = e.clientX - r.left;
      mouseY = e.clientY - r.top;
    });

    // Не рисуем, когда первый экран не виден или вкладка свёрнута — бережём батарею
    new IntersectionObserver(entries => {
      entries[0].isIntersecting && !document.hidden ? start() : (running = false);
    }).observe(hero);
    document.addEventListener('visibilitychange', () => document.hidden ? (running = false) : start());

    window.addEventListener('resize', resize);
    resize();
    mouseX = w / 2; mouseY = h / 2;
    running = false;
    start();
  }

  // ---------- 3. ЗАГОЛОВОК ПЕРВОГО ЭКРАНА: слова появляются по очереди ----------
  function heroTitle() {
    const h1 = document.querySelector('.hero h1');
    if (!h1 || reduceMotion) return;
    const words = h1.textContent.trim().split(/\s+/);
    h1.innerHTML = words.map((word, i) =>
      `<span class="word" style="animation-delay:${0.15 + i * 0.12}s">${word}</span>`).join(' ');
  }

  // ---------- 4. ПАРАЛЛАКС ГЛАВНОГО ФОТО ----------
  function heroParallax() { /* отключено: фото налезало на кнопку */ }

  // ---------- 5. ЗОЛОТЫЕ ИСКРЫ ЗА КУРСОРОМ ----------
  // Рисуются на одном прозрачном холсте поверх страницы.
  // Холст работает, только пока есть искры, — в покое он ничего не тратит.
  function cursorTrail() {
    if (!finePointer || reduceMotion) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'spark-layer';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.display = 'none';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let sparks = [], looping = false, lastSpawn = 0;

    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    window.addEventListener('resize', resize);
    resize();

    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      sparks = sparks.filter(p => p.life < 1);
      sparks.forEach(p => {
        p.life += 0.045;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04;                                  // искры чуть «падают»
        const size = p.size * (1 - p.life * 0.7);
        ctx.globalAlpha = 1 - p.life;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.life * 2);
        ctx.drawImage(SPARKLE, -size / 2, -size / 2, size, size);
        ctx.restore();
      });
      ctx.globalAlpha = 1;
      if (sparks.length) requestAnimationFrame(loop);
      else { looping = false; canvas.style.display = 'none'; }   // спрятан — ничего не стоит
    }

    document.addEventListener('mousemove', e => {
      const now = performance.now();
      if (now - lastSpawn < 45 || sparks.length > 18) return;
      lastSpawn = now;
      sparks.push({
        x: e.clientX, y: e.clientY,
        vx: Math.random() * 1.2 - 0.6, vy: Math.random() * 0.6 + 0.2,
        size: Math.random() * 7 + 7, life: 0
      });
      if (!looping) { looping = true; canvas.style.display = 'block'; requestAnimationFrame(loop); }
    }, { passive: true });
  }

  // ---------- 6. 3D-НАКЛОН КАРТОЧЕК ЗА МЫШКОЙ + БЛИК ----------
  function tiltCards() {
    if (!finePointer || reduceMotion) return;
    document.querySelectorAll('.card, .review-card, .service-card').forEach(card => {
      const glare = document.createElement('span');
      glare.className = 'tilt-glare';
      card.appendChild(glare);
      card.classList.add('tilt');

      let rect = null, pending = null;
      card.addEventListener('mouseenter', () => { rect = card.getBoundingClientRect(); });
      card.addEventListener('mousemove', e => {
        const first = !pending;
        pending = e;
        if (!first) return;
        requestAnimationFrame(() => {
          if (!pending) return;
          const r = rect || card.getBoundingClientRect();
          const px = (pending.clientX - r.left) / r.width;      // 0…1
          const py = (pending.clientY - r.top) / r.height;
          pending = null;
          const max = card.classList.contains('card') ? 7 : 4;
          card.style.transform =
            `perspective(900px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * max}deg) translateY(-6px)`;
          glare.style.background =
            `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.22), transparent 55%)`;
        });
      });
      card.addEventListener('mouseleave', () => {
        pending = null;
        rect = null;
        card.style.transform = '';
        glare.style.background = '';
      });
    });
  }

  // ---------- 7. ВОЛНА ОТ НАЖАТИЯ НА КНОПКУ ----------
  function rippleButtons() {
    document.addEventListener('click', e => {
      const btn = e.target.closest('.btn, .header-cta');
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const size = Math.max(r.width, r.height) * 2;
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - r.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - r.top - size / 2) + 'px';
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  }

  // ---------- 8. СЧЁТЧИКИ ЦИФР (0 → 9 и т.д.) ----------
  function counters() {
    const items = document.querySelectorAll('[data-count]');
    if (!items.length) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        obs.unobserve(entry.target);
        const el = entry.target;
        const target = Number(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        if (reduceMotion) { el.textContent = target + suffix; return; }
        const start = performance.now(), dur = 1600;
        (function tick(now) {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        })(start);
      });
    }, { threshold: 0.5 });
    items.forEach(el => obs.observe(el));
  }

  // ---------- 9. КНОПКА «НАВЕРХ» С КОЛЬЦОМ ПРОГРЕССА ----------
  function backToTop() {
    const btn = document.createElement('button');
    btn.className = 'to-top';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Наверх');
    btn.innerHTML =
      '<svg viewBox="0 0 48 48" aria-hidden="true">' +
      '<circle class="ring-bg" cx="24" cy="24" r="21"/>' +
      '<circle class="ring" cx="24" cy="24" r="21"/>' +
      '<path class="arrow" d="M24 31 V17 M17 23 L24 16 L31 23"/>' +
      '</svg>';
    document.body.appendChild(btn);
    const ring = btn.querySelector('.ring');
    const len = 2 * Math.PI * 21;
    ring.style.strokeDasharray = len;

    let shown = null;
    onScroll((y, p) => {
      ring.style.strokeDashoffset = len * (1 - p);
      const show = y > 500;
      if (show !== shown) { btn.classList.toggle('show', show); shown = show; }
    });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
  }

  // ---------- 10. ПЛАВНЫЙ ПЕРЕХОД МЕЖДУ СТРАНИЦАМИ ----------
  function pageTransitions() {
    if (reduceMotion) return;
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.protocol !== location.protocol || url.host !== location.host) return;   // внешняя ссылка
      if (url.pathname === location.pathname && url.hash) return;                     // якорь на этой же странице
      if (!/\.html?$|\/$/.test(url.pathname)) return;
      e.preventDefault();
      document.body.classList.add('page-leave');
      setTimeout(() => { location.href = a.href; }, 280);
    });
    // Кнопка «назад» в браузере может вернуть страницу «погасшей» — включаем обратно
    window.addEventListener('pageshow', () => document.body.classList.remove('page-leave'));
  }

  // ---------- 11. ПОЯВЛЕНИЕ КАРТОЧЕК ПО ОЧЕРЕДИ ----------
  function staggerReveal() {
    if (reduceMotion) return;
    const groups = document.querySelectorAll('.rooms, .gallery-grid, .stats');
    groups.forEach(group => {
      Array.from(group.children).forEach((child, i) => {
        child.classList.remove('scroll-fade');   // появлением управляет этот эффект
        child.classList.add('stagger');
        child.style.transitionDelay = (i * 0.1) + 's';
      });
    });
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        obs.unobserve(entry.target);
        // после появления убираем задержку, чтобы наведение реагировало сразу
        setTimeout(() => { entry.target.style.transitionDelay = ''; }, 1200);
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.stagger').forEach(el => obs.observe(el));
  }

  // ---------- ЗАПУСК ----------
  measure();
  headerEffects();
  heroTitle();
  starfield();
  heroParallax();
  cursorTrail();
  tiltCards();
  rippleButtons();
  counters();
  backToTop();
  pageTransitions();
  staggerReveal();
  runScrollTasks();
})();
