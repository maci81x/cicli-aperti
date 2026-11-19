// v39 · 10/11 — sul telefono la lente «Cerca» in alto, in ogni pagina
// (sul computer la ricerca c'è già nella barra in alto). Tocca la lente: si apre Tutte con il campo Cerca pronto.
// ══════════════════════════════════════════════════════════════
(function v39Lente() {
  const top = document.querySelector('.top');
  if (!top || top.querySelector('.v39-cerca')) return;
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'btn btn-icon v39-cerca'; b.setAttribute('aria-label', 'Cerca tra le cose');
  b.innerHTML = '<i class="ti ti-search" aria-hidden="true"></i>';
  b.addEventListener('click', () => {
    if (window.innerWidth >= 768) { focusRicerca(); return; }
    ui.tutto = 'lista';   // l'armadio non ha il campo Cerca: si apre la lista
    if (ui.tab !== 'tutto' || ui.sub) vai('tutto', { tutto: 'lista' }); else render();
    const fuoco = () => { const m = $('searchInputM'); if (m && document.activeElement !== m) { m.focus(); m.select(); } };
    fuoco(); requestAnimationFrame(fuoco); setTimeout(fuoco, 250);
  });
  const dove = top.querySelector('.v32-ctx-btn') || top.querySelector('.top-ctx');
  if (dove) dove.before(b); else top.appendChild(b);
})();

// ══════════════════════════════════════════════════════════════
