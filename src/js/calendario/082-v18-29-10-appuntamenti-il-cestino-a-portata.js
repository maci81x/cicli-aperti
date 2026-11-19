// v18 · 29/10 · APPUNTAMENTI: il cestino a portata di mano
// · computer: tasto destro sulla riga (o il cestino che compare passandoci sopra)
// · telefono: scorri a sinistra, compare il cestino
// Il cestino chiede sempre conferma. Gli inviti e gli eventi con invitati non si cancellano: si nascondono.
// ══════════════════════════════════════════════════════════════
const V18 = { APRI: 56, LARGO: 88 };
// cosa fa il cestino su questo appuntamento
function cestinoDi(e) {
  if (!e) return null;
  if (collegatoACosa(e) && ciclo(e.cicloId)) return { act: 'q-blocca', id: e.cicloId, ico: 'ti-calendar-x', testo: 'Togli dall\'agenda', sotto: 'la cosa resta da fare' };
  if (e.orgIo && !(e.nomiInvitati || []).length) return { act: 'v18-togli', ico: 'ti-trash', testo: 'Cancella da Google Calendar', sotto: 'ti chiedo conferma' };
  return { act: 'v18-nascondi', ico: 'ti-eye-off', testo: 'Nascondilo', sotto: 'è un invito: solo nell\'app' };
}
const attrCestino = (c, e) => `data-act="${c.act}" data-evt="${esc(e.id)}"${c.id ? ` data-id="${esc(c.id)}"` : ''}`;
function apriMenuEvento(e, x, y) {
  const m = $('rigaMenu'), c = cestinoDi(e);
  const voce = (act, ico, testo, cls) => `<button type="button" role="menuitem" data-act="${act}" data-evt="${esc(e.id)}"${cls ? ` class="${cls}"` : ''}><i class="ti ${ico}"></i>${testo}</button>`;
  const spunta = eventoSpuntabile(e), fatto = spunta && eventoFatto(e);
  m.innerHTML = (spunta ? voce('evt-fatto', fatto ? 'ti-circle-x' : 'ti-check', fatto ? 'Non è fatto' : 'Fatto') + voce('v18-fb', 'ti-message-2', 'Fatto con feedback') : '')
    + voce('evt-apri', 'ti-arrows-move', 'Apri · sposta')
    + (c.act !== 'v18-nascondi' ? voce('v18-nascondi', 'ti-eye-off', 'Non è mio · nascondilo') : '')
    + `<button type="button" role="menuitem" class="v18-menu-cestino" ${attrCestino(c, e)}><i class="ti ${c.ico}"></i>${c.testo}</button>`;
  m.hidden = false;
  const mh = m.offsetHeight, mw = m.offsetWidth;
  m.style.left = Math.max(8, Math.min(window.innerWidth - mw - 8, x)) + 'px';
  m.style.top = Math.max(8, y + mh + 8 > window.innerHeight ? y - mh : y) + 'px';
  m.querySelector('.v18-menu-cestino').focus();
}
document.addEventListener('contextmenu', ev => {
  const r = ev.target.closest('.evt-riga[data-evt]');
  const e = r && eventoPerId(r.dataset.evt);
  if (!e || e.routine) return;
  ev.preventDefault();
  chiudiSwipeEvt();
  apriMenuEvento(e, ev.clientX, ev.clientY);
});
Object.assign(AZIONI, {
  'v18-togli': el => { apriFoglioEvento(el.dataset.evt); domandaFoglioEvento(el.dataset.evt, 'togli'); },
  'v18-nascondi': el => { const e = eventoPerId(el.dataset.evt); if (!e) return; if (e.ricorrente || e.serie) { apriFoglioEvento(e.id); domandaFoglioEvento(e.id, 'nascondi'); } else nascondiEvento(e.id, false); },
  'v18-fb': el => { apriFoglioEvento(el.dataset.evt); ui.evtFb = el.dataset.evt; disegnaFoglioEvento(el.dataset.evt); }
});
// il cestino dentro la riga: lo aggiungo dopo ogni disegno (passandoci sopra sul computer, scorrendo sul telefono)
function cestiniEventi(root) {
  (root || document).querySelectorAll('.evt-riga[data-evt]:not([data-v18])').forEach(r => {
    const e = eventoPerId(r.dataset.evt);
    r.dataset.v18 = '1';
    if (!e || e.routine) return;
    const c = cestinoDi(e);
    r.insertAdjacentHTML('beforeend', `<button type="button" class="v18-cestino${c.act === 'v18-nascondi' ? ' v18-nascondi' : ''}" ${attrCestino(c, e)} aria-label="${escAttr(c.testo + ': ' + e.titolo)}" title="${escAttr(c.testo)}"><i class="ti ${c.ico}" aria-hidden="true"></i><span>${c.act === 'v18-togli' ? 'Cancella' : c.act === 'q-blocca' ? 'Togli' : 'Nascondi'}</span></button>`);
  });
}
const _renderV18 = render;
render = function () {
  const r = _renderV18.apply(this, arguments);
  try { cestiniEventi(); } catch (err) { console.warn('[Cestino]', err.message); }
  return r;
};
new MutationObserver(() => { try { cestiniEventi(); } catch (_) { /* niente */ } }).observe(document.body, { childList: true, subtree: true });
// scorri a sinistra
function chiudiSwipeEvt(tranne) {
  document.querySelectorAll('.evt-riga.v18-aperta').forEach(r => { if (r !== tranne) { r.classList.remove('v18-aperta'); r.style.removeProperty('--v18-dx'); } });
}
let _sw18 = null;
document.addEventListener('touchstart', ev => {
  const r = ev.target.closest('.evt-riga[data-evt]');
  if (!r || !r.querySelector('.v18-cestino') || ev.target.closest('.v18-cestino, .evt-spunta')) { _sw18 = null; if (!ev.target.closest('.v18-cestino')) chiudiSwipeEvt(); return; }
  const t = ev.touches[0];
  _sw18 = { r, x: t.clientX, y: t.clientY, dx: 0, blocco: null, base: r.classList.contains('v18-aperta') ? -V18.LARGO : 0 };
}, { passive: true });
document.addEventListener('touchmove', ev => {
  if (!_sw18) return;
  const t = ev.touches[0], dx = t.clientX - _sw18.x, dy = t.clientY - _sw18.y;
  if (!_sw18.blocco) {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    _sw18.blocco = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (_sw18.blocco === 'x') { chiudiSwipeEvt(_sw18.r); _sw18.r.classList.add('v18-trascina'); }
  }
  if (_sw18.blocco !== 'x') return;
  _sw18.dx = dx;
  _sw18.r.style.setProperty('--v18-dx', Math.max(-V18.LARGO - 24, Math.min(0, _sw18.base + dx)) + 'px');
}, { passive: true });
document.addEventListener('touchend', () => {
  if (!_sw18 || _sw18.blocco !== 'x') { _sw18 = null; return; }
  const { r, dx, base } = _sw18;
  _sw18 = null;
  r.classList.remove('v18-trascina');
  r.style.removeProperty('--v18-dx');
  r.classList.toggle('v18-aperta', base + dx < -V18.APRI);
  r._v18Trascinato = true;
  setTimeout(() => { r._v18Trascinato = false; }, 300);
});
// dopo uno scorrimento il tocco non apre il foglio
document.addEventListener('click', ev => {
  const r = ev.target.closest('.evt-riga[data-evt]');
  if (r && r._v18Trascinato) { ev.stopPropagation(); ev.preventDefault(); return; }
  if (r && r.classList.contains('v18-aperta') && !ev.target.closest('.v18-cestino')) { ev.stopPropagation(); ev.preventDefault(); chiudiSwipeEvt(); }
}, true);

// ══════════════════════════════════════════════════════════════
