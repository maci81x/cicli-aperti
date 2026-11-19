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
