// v2 · SWIPE (telefono) E MENU «···» (desktop)
// ══════════════════════════════════════════════════════════════
function chiudiSwipe(tranne) {
  document.querySelectorAll('.item.is-swiped').forEach(el => { if (el !== tranne) { el.classList.remove('is-swiped'); el.querySelector('.item-row').style.transform = ''; } });
}
let _sw = null;
document.addEventListener('touchstart', e => {
  const rowEl = e.target.closest('.item-row');
  const item = rowEl && rowEl.closest('.item');
  if (!item || !item.querySelector('.swipe-actions') || e.target.closest('.check')) { _sw = null; return; }
  const t = e.touches[0];
  _sw = { item, row: rowEl, x: t.clientX, y: t.clientY, dx: 0, blocco: null, largo: rowEl.offsetWidth, base: item.classList.contains('is-swiped') ? -rowEl.offsetWidth : 0 };
}, { passive: true });
document.addEventListener('touchmove', e => {
  if (!_sw) return;
  const t = e.touches[0], dx = t.clientX - _sw.x, dy = t.clientY - _sw.y;
  if (!_sw.blocco) {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    _sw.blocco = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (_sw.blocco === 'x') { chiudiSwipe(_sw.item); _sw.item.classList.add('is-dragging'); }
  }
  if (_sw.blocco !== 'x') return;
  _sw.dx = dx;
  const x = Math.max(-_sw.largo, Math.min(120, _sw.base + dx));
  _sw.row.style.transform = `translateX(${x}px)`;
}, { passive: true });
document.addEventListener('touchend', () => {
  if (!_sw || _sw.blocco !== 'x') { _sw = null; return; }
  const { item, row, dx, base } = _sw;
  _sw = null;
  item.classList.remove('is-dragging');
  row.style.transform = '';
  const finale = base + dx;
  if (finale > SWIPE_FATTO) { item.classList.remove('is-swiped'); azioneFatto(item.dataset.id); return; }
  item.classList.toggle('is-swiped', finale < -SWIPE_APRI);
  item._appenaTrascinato = true;
  setTimeout(() => { item._appenaTrascinato = false; }, 250);
});

function apriMenu(btn, id, data) {
  const m = $('rigaMenu');
  const voce = (act, icona, testo) => `<button type="button" role="menuitem" data-act="${act}" data-id="${id}"${data ? ` data-data="${data}"` : ''}><i class="ti ${icona}"></i>${testo}</button>`;
  const bloccata = !!(ciclo(id) || {}).calendar_event_id;
  const delegata = (ciclo(id) || {}).q === 3;
  m.innerHTML = voce('q-fatto', 'ti-check', 'Fatto') + voce('q-domani', 'ti-arrow-right', 'Domani') + voce('q-quando', 'ti-calendar-event', 'Scegli quando')
    + (delegata ? voce('q-tornata', 'ti-arrow-back-up', 'Mi è tornata indietro') : voce('q-delega', 'ti-user-share', 'Delega'))
    + voce('q-scomponi', 'ti-list-tree', 'Scomponi') + voce('q-blocca', bloccata ? 'ti-calendar-x' : 'ti-calendar-plus', bloccata ? 'Togli dall\'agenda' : 'Blocca in agenda')
    + voce('q-ripeti', 'ti-repeat', 'Ripeti') + voce('q-lascia', 'ti-wind', 'Lascia stare');
  m.hidden = false;
  const r = btn.getBoundingClientRect(), mh = m.offsetHeight, mw = m.offsetWidth;
  m.style.left = Math.max(8, Math.min(window.innerWidth - mw - 8, r.right - mw)) + 'px';
  m.style.top = (r.bottom + mh + 8 > window.innerHeight ? r.top - mh - 4 : r.bottom + 4) + 'px';
  m.querySelector('button').focus();
}
function chiudiMenu() { $('rigaMenu').hidden = true; }

// ══════════════════════════════════════════════════════════════
