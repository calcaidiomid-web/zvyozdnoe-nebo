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

    // свайп пальцем
    let x0 = null, y0 = null;
    box.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    box.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(idx + (dx < 0 ? 1 : -1));
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close();      // смахнуть вниз — закрыть
      x0 = null;
    });
  }

  function show(i) {
    idx = (i + list.length) % list.length;
    const src = list[idx];
    box.classList.remove('lb-in');
    img.src = src.currentSrc || src.src;
    img.alt = src.alt;
    cap.textContent = src.dataset.caption || src.alt || '';
    count.textContent = list.length > 1 ? `${idx + 1} / ${list.length}` : '';
    prevBtn.hidden = nextBtn.hidden = list.length < 2;
    void img.offsetWidth;                         // перезапуск анимации появления
    box.classList.add('lb-in');
    // соседние фото подгружаем заранее
    [idx - 1, idx + 1].forEach(k => { const n = list[(k + list.length) % list.length]; if (n) new Image().src = n.currentSrc || n.src; });
  }

  function open(group, start) {
    if (!box) build();
    list = [...group.querySelectorAll('img')].filter(im => !im.closest('[hidden]'));
    opener = start;
    box.hidden = false;
    document.documentElement.classList.add('lb-lock');
    show(list.indexOf(start));
    box.querySelector('.lb-close').focus({ preventScroll: true });
  }

  function close() {
    box.hidden = true;
    document.documentElement.classList.remove('lb-lock');
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
