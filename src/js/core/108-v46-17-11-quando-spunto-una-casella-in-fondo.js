// v46 · 17/11 — «quando spunto una casella in fondo o a metà, l'elenco riparte dall'inizio»
// Ogni ridisegno ricostruisce la pagina e gli elenchi che scorrono da soli (Da pianificare, le colonne dei giorni,
// «Da mettere in giornata», la lavagna in orizzontale) tornavano in cima. Ora prima del disegno si annota dove
// eri in ognuno e dopo si rimette lì; anche la pagina resta dov'era.
// ══════════════════════════════════════════════════════════════
function v46Chiave(el) {
  if (el.id) return '#' + el.id;
  if (el.dataset && el.dataset.zona) return '[data-zona="' + el.dataset.zona + '"]';
  const cls = [...el.classList].filter(c => !/^(drag|sopra|aperto|on|su)$/.test(c)).slice(0, 2);
  if (!cls.length) return null;
  const sel = el.tagName.toLowerCase() + '.' + cls.map(c => CSS.escape(c)).join('.');
  const tutti = [...document.querySelectorAll('#view ' + sel)];
  return sel + '|' + tutti.indexOf(el);
}
function v46Annota() {
  const view = $('view'); if (!view) return null;
  const pos = [];
  view.querySelectorAll('*').forEach(el => {
    if (el.scrollTop > 0 || el.scrollLeft > 0) { const k = v46Chiave(el); if (k) pos.push([k, el.scrollTop, el.scrollLeft]); }
  });
  const m = document.getElementById('main');
  return { tab: ui.tab, pian: ui.pian, pos, main: m ? m.scrollTop : 0, win: window.scrollY, view: view.scrollTop, scroller: document.scrollingElement ? document.scrollingElement.scrollTop : 0 };
}
function v46Rimetti(a) {
  if (!a || a.tab !== ui.tab || a.pian !== ui.pian) return;
  a.pos.forEach(([k, t, l]) => {
    let el = null;
    if (k.includes('|')) { const [sel, i] = k.split('|'); el = document.querySelectorAll('#view ' + sel)[+i]; }
    else el = document.querySelector('#view ' + k);
    if (el) { if (t) el.scrollTop = t; if (l) el.scrollLeft = l; }
  });
  const view = $('view'), m = document.getElementById('main');
  if (m && a.main && Math.abs(m.scrollTop - a.main) > 2) m.scrollTop = a.main;
  if (view && a.view && view.scrollTop !== a.view) view.scrollTop = a.view;
  if (a.win && Math.abs(window.scrollY - a.win) > 2) window.scrollTo(0, a.win);
}

