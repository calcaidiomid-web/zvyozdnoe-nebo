// ============================================================
// lightbox.js — просмотр фото на весь экран
// Разметка: <div data-lightbox="группа"><img …><img …></div>
// Нажатие на фото открывает его крупно; листается стрелками, свайпом
// и клавишами ← →; закрывается крестиком, Esc или нажатием на фон.
// ============================================================
(function () {
  'use strict';

  let box, img, cap, count, prevBtn, nextBtn, list = [], idx = 0, opener = null;

  function build() {
    box = document.createElement('div');
    box.className = 'lb';
    box.hidden = true;
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Просмотр фото');
    box.innerHTML =
      '<button type="button" class="lb-close" aria-label="Закрыть">×</button>' +
      '<button type="button" class="lb-arrow lb-prev" aria-label="Предыдущее фото">‹</button>' +
      '<figure class="lb-fig"><img alt=""><figcaption><span class="lb-cap"></span><span class="lb-count"></span></figcaption></figure>' +
      '<button type="button" class="lb-arrow lb-next" aria-label="Следующее фото">›</button>';
    document.body.appendChild(box);
    img = box.querySelector('img');
    cap = box.querySelector('.lb-cap');
    count = box.querySelector('.lb-count');
    prevBtn = box.querySelector('.lb-prev');
    nextBtn = box.querySelector('.lb-next');

    box.addEventListener('click', e => {
      if (e.target.closest('.lb-prev')) show(idx - 1);
      else if (e.target.closest('.lb-next')) show(idx + 1);
      else if (e.target.closest('.lb-close') || e.target === box || e.target.classList.contains('lb-fig')) close();
    });
    document.addEventListener('keydown', e => {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
      if (e.key === 'Tab') {                       // фокус не уходит за пределы окна
        const f = [...box.querySelectorAll('button:not([hidden])')];
        const i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });

    // Жесты как в «Фото» на iPhone: фото едет за пальцем.
    // Вбок — листаем (с инерцией), вниз — фото уменьшается, фон светлеет, отпустили — закрылось.
    let x0 = 0, y0 = 0, t0 = 0, dx = 0, dy = 0, axis = '';
    const set = (x, y, sc) => { img.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + sc.toFixed(3) + ')'; };
    box.addEventListener('touchstart', e => {
      if (e.touches.length > 1) { axis = 'pinch'; return; }
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = performance.now(); dx = dy = 0; axis = '';
    }, { passive: true });
    box.addEventListener('touchmove', e => {
      if (axis === 'pinch' || e.touches.length > 1) { axis = 'pinch'; return; }
      dx = e.touches[0].clientX - x0; dy = e.touches[0].clientY - y0;
      if (!axis) { if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return; axis = Math.abs(dx) > Math.abs(dy) ? 'x' : (dy > 0 ? 'y' : 'none'); box.classList.add('lb-drag'); }
      if (axis === 'x') { const edge = list.length < 2; set(edge ? dx * 0.3 : dx, 0, 1); }
      else if (axis === 'y') { const k = Math.min(1, Math.max(0, dy) / 600); set(dx * 0.6, Math.max(0, dy), 1 - k * 0.35); box.style.setProperty('--lbA', (1 - Math.min(1, Math.max(0, dy) / 380)).toFixed(3)); }
      if (axis === 'x' || axis === 'y') { if (e.cancelable) e.preventDefault(); }
    }, { passive: false });
    box.addEventListener('touchend', () => {
      if (axis === 'pinch') { axis = ''; return; }
      box.classList.remove('lb-drag');
      const v = (axis === 'x' ? dx : dy) / Math.max(1, performance.now() - t0);
      if (axis === 'x' && list.length > 1 && (Math.abs(dx) > 70 || Math.abs(v) > 0.5)) {
        const dir = dx < 0 ? 1 : -1;
        set(-dir * window.innerWidth, 0, 1);                       // уезжает в сторону свайпа
        setTimeout(() => show(idx + dir, -dir), 180);              // следующее въезжает с другой стороны
      } else if (axis === 'y' && (dy > 110 || v > 0.6)) close();
      else { img.style.transform = ''; box.style.removeProperty('--lbA'); }
      axis = '';
    });
  }

  function show(i, from) {
    idx = (i + list.length) % list.length;
    const src = list[idx];
    img.style.transition = 'none';
    img.style.transform = from ? 'translate3d(' + (from * -0.35 * window.innerWidth) + 'px,0,0)' : '';
    img.style.opacity = from ? '0' : '';
    img.src = src.src;                            // всегда полное фото
    img.alt = src.alt;
    cap.textContent = src.dataset.caption || src.alt || '';
    count.textContent = list.length > 1 ? `${idx + 1} / ${list.length}` : '';
    prevBtn.hidden = nextBtn.hidden = list.length < 2;
    if (from) { void img.offsetWidth; img.style.transition = ''; img.style.transform = ''; img.style.opacity = ''; }
    else requestAnimationFrame(() => { img.style.transition = ''; });
    if (window.ZNTap && from) ZNTap(5);
    // соседние фото подгружаем заранее
    [idx - 1, idx + 1].forEach(k => { const n = list[(k + list.length) % list.length]; if (n) new Image().src = n.src; });
  }

  // Открытие и закрытие «из миниатюры»: фото вырастает из того места, где его нажали, и уходит туда же
  function fromThumb(el) {
    if (!el || !el.getBoundingClientRect) return null;
    const t = el.getBoundingClientRect(), r = img.getBoundingClientRect();
    if (!t.width || !r.width || t.bottom < 0 || t.top > window.innerHeight) return null;
    const sc = Math.max(t.width / r.width, t.height / r.height);
    return 'translate3d(' + (t.left + t.width / 2 - (r.left + r.width / 2)).toFixed(1) + 'px,' + (t.top + t.height / 2 - (r.top + r.height / 2)).toFixed(1) + 'px,0) scale(' + sc.toFixed(3) + ')';
  }

  function open(group, start) {
    if (!box) build();
    list = [...group.querySelectorAll('img')].filter(im => !im.closest('[hidden]'));
    opener = start;
    box.hidden = false;
    box.classList.remove('lb-out');
    box.style.removeProperty('--lbA');
    document.documentElement.classList.add('lb-lock');
    show(list.indexOf(start));
    const go = () => {
      const tr = fromThumb(start);
      box.classList.add('lb-open');
      if (!tr) return;
      img.style.transition = 'none'; img.style.transform = tr;
      void img.offsetWidth;
      img.style.transition = ''; img.style.transform = '';
    };
    box.classList.remove('lb-open');
    if (img.decode) img.decode().then(go, go); else go();
    box.querySelector('.lb-close').focus({ preventScroll: true });
  }

  function close() {
    if (box.hidden || box.classList.contains('lb-out')) return;
    const tr = fromThumb(list[idx]);
    box.classList.add('lb-out');
    box.classList.remove('lb-open');
    img.style.transform = tr || 'scale(.9)';
    setTimeout(() => {
      box.hidden = true; box.classList.remove('lb-out');
      img.style.transform = ''; box.style.removeProperty('--lbA');
      document.documentElement.classList.remove('lb-lock');
    }, 360);
    if (opener) opener.focus({ preventScroll: true });
  }

  function init(scope) {
    (scope || document).querySelectorAll('[data-lightbox] img').forEach(im => {
      if (im.dataset.lbReady) return;
      im.dataset.lbReady = '1';
      im.tabIndex = 0;
      im.setAttribute('role', 'button');
      im.addEventListener('click', () => open(im.closest('[data-lightbox]'), im));
      im.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(im.closest('[data-lightbox]'), im); } });
    });
  }

  window.ZNLightbox = { init };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init());
  else init();
})();
