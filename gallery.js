// ============================================================
// gallery.js — листалка фотографий в карточках номеров
// Разметка: <div class="card-gallery" data-gallery><div class="cg-track"><img>…</div></div>
// Листается пальцем (свайп), стрелками и точками. Подписи берутся из alt.
// ============================================================
(function () {
  'use strict';

  const onResize = new Map();
  window.addEventListener('resize', () => onResize.forEach((fn, root) => root.isConnected ? fn() : onResize.delete(root)), { passive: true });

  function setup(root) {
    if (root.dataset.ready) return;
    const track = root.querySelector('.cg-track');
    const imgs = [...track.querySelectorAll('img')];
    if (!imgs.length) return;
    root.dataset.ready = '1';

    if (imgs.length > 1) {
      root.insertAdjacentHTML('beforeend',
        '<button type="button" class="cg-arrow cg-prev" aria-label="Предыдущее фото">‹</button>' +
        '<button type="button" class="cg-arrow cg-next" aria-label="Следующее фото">›</button>' +
        `<div class="cg-dots">${imgs.map((_, i) => `<button type="button" aria-label="Фото ${i + 1} из ${imgs.length}"></button>`).join('')}</div>`);
    }
    root.insertAdjacentHTML('beforeend', '<span class="cg-caption" aria-hidden="true"></span>');
    const dots = [...root.querySelectorAll('.cg-dots button')];
    const caption = root.querySelector('.cg-caption');
    let current = -1;

    function index() { return Math.round(track.scrollLeft / track.clientWidth) || 0; }
    function go(i) {
      i = Math.max(0, Math.min(imgs.length - 1, i));
      track.scrollTo({ left: i * track.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
    function update() {
      const i = index();
      if (i === current) return;
      current = i;
      dots.forEach((d, k) => d.setAttribute('aria-current', k === i ? 'true' : 'false'));
      const label = imgs[i].dataset.caption || '';
      caption.textContent = (imgs.length > 1 ? `${i + 1} / ${imgs.length}` : '') + (label ? (imgs.length > 1 ? ' · ' : '') + label : '');
      caption.hidden = !caption.textContent;
      const prev = root.querySelector('.cg-prev'), next = root.querySelector('.cg-next');
      if (prev) { prev.disabled = i === 0; next.disabled = i === imgs.length - 1; }
      // следующее фото подгружаем заранее
      if (imgs[i + 1]) imgs[i + 1].loading = 'eager';
    }

    let raf = 0;
    track.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); }, { passive: true });
    root.addEventListener('click', e => {
      if (e.target.closest('.cg-prev')) go(index() - 1);
      else if (e.target.closest('.cg-next')) go(index() + 1);
      else { const k = dots.indexOf(e.target.closest('.cg-dots button')); if (k >= 0) go(k); else return; }
      e.stopPropagation();          // стрелки не открывают окно с описанием номера
    });
    root.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { go(index() - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { go(index() + 1); e.preventDefault(); }
    });
    onResize.set(root, () => { current = -1; update(); });
    update();
  }

  window.ZNGallery = { setup, init: (scope) => (scope || document).querySelectorAll('[data-gallery]').forEach(setup) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => window.ZNGallery.init());
  else window.ZNGallery.init();
})();
