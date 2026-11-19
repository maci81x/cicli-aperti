// v2 · NAVIGAZIONE
// ══════════════════════════════════════════════════════════════
function vai(tab, opz) {
  if (modoSemplice() && tab === 'pianifica') tab = 'oggi';
  if (modoSemplice() && tab === 'altro' && !(opz && opz.sub)) opz = { ...(opz || {}), sub: 'impostazioni' };
  ui.tab = tab;
  ui.sub = (opz && opz.sub) || null;
  if (opz && opz.pian) ui.pian = opz.pian;
  if (opz && opz.tutto) ui.tutto = opz.tutto;
  localStorage.setItem(LS2.TAB, tab);
  chiudiSwipe();
  $('main').scrollTop = 0;
  if (tab === 'oggi') { setTimeout(reconMostra, 300); setTimeout(controllaMattino, 400); caricaRimaste(); }
  if (tab === 'oggi' && !eSettimanaCorrente()) { tornaAOggi(); return; }
  render();
}

// Oggi lavora sempre sulla settimana corrente.
function tornaAOggi() {
  const c = bpSettimanaCorrente();
  state.week = c.week; state.year = c.year;
  localStorage.setItem(LS.WEEK, state.week);
  render();
  reloadWeekData().then(render);
}

// Nomi di vista della versione precedente → nuove sezioni (li usa ancora la logica).
function switchView(v) {
  const mappa = {
    oggi: ['oggi'], bp: ['pianifica', { pian: 'settimana' }], settimana: ['pianifica', { pian: 'settimana' }],
    mese: ['pianifica', { pian: 'mese' }], agenda: ['pianifica', { pian: 'settimana' }],
    matrix: ['tutto', { tutto: 'matrice' }], list: ['tutto', { tutto: 'lista' }], persone: ['tutto', { tutto: 'persone' }],
    aree: ['tutto', { tutto: 'lista' }], parcheggio: ['tutto', { sub: 'attesa' }],
    storico: ['altro', { sub: 'fatte' }], guida: ['altro', { sub: 'guida' }]
  };
  const m = mappa[v] || ['oggi'];
  if (v === 'aree') { ui.raggruppa = 'area'; }
  state.view = v;
  vai(m[0], m[1]);
}

function changeWeek(dir) {
  const d = getWeekStart(state.week, state.year);
  d.setDate(d.getDate() + dir * 7);
  const w = isoWeekParts(d);
  state.week = w.week; state.year = w.year;
  localStorage.setItem(LS.WEEK, state.week);
  render();
  reloadWeekData().then(() => { caricaEventi(state.week, state.year); render(); });
}

function vaiAData(d) {
  const w = isoWeekParts(d);
  ui.giorno = giornoIdxDi(d);
  ui.pian = 'settimana';
  ui.tab = 'pianifica';
  if (w.week === state.week && w.year === state.year) { render(); return; }
  state.week = w.week; state.year = w.year;
  localStorage.setItem(LS.WEEK, state.week);
  render();
  reloadWeekData().then(() => { caricaEventi(state.week, state.year); render(); });
}

function focusRicerca() {
  if (window.innerWidth >= 768) { const i = $('searchInput'); i.focus(); i.select(); return; }
  if (ui.tab !== 'tutto' || ui.sub) vai('tutto');
  const m = $('searchInputM'); if (m) { m.focus(); m.select(); }
}

// ══════════════════════════════════════════════════════════════
