// v2 · PREPARA LA SETTIMANA: tempo già occupato dagli appuntamenti
// ══════════════════════════════════════════════════════════════
// Agisce sulla settimana visualizzata in Pianifica (in Oggi: quella corrente).
// Se ha già un piano, il wizard si apre in modalità modifica.
async function apriWizard(week, year) {
  const w = week ? { week, year } : ui.tab === 'oggi' ? bpSettimanaCorrente() : { week: state.week, year: state.year };
  $('bpw-search').value = '';
  await openBpWizard(w.week, w.year);
  bpwConEventi(w.week, w.year);
}

// ‹ › nell'intestazione del wizard: ricarica tutto per l'altra settimana (pre-spunte comprese)
function bpwCambiaSettimana(dir) {
  const d = getWeekStart(_bpwWeek, _bpwYear);
  d.setDate(d.getDate() + dir * 7);
  const w = isoWeekParts(d), cur = bpSettimanaCorrente();
  if (getWeekStart(w.week, w.year) < getWeekStart(cur.week, cur.year)) return;
  apriWizard(w.week, w.year);
}

// Gli appuntamenti arrivano dopo: quando ci sono, ridisegna il riepilogo del wizard.
function bpwConEventi(week, year) {
  caricaEventi(week, year).then(() => {
    if (!$('bpWizOverlay').classList.contains('open') || _bpwWeek !== week || _bpwYear !== year) return;
    if (_bpwStep === 2) bpwRenderStep2(); else bpwRenderSummary();
  });
}
function bpwMinutiAppuntamenti() {
  if (!_bpwWeek) return 0;
  return GIORNI.reduce((s, _, idx) => s + minutiOccupati(bpDataGiorno(_bpwWeek, _bpwYear, idx)), 0);
}

// «Prepara la settimana» oppure «Modifica il piano», per la settimana selezionata
function etichettaWizard() { return state.bp && state.bp.stato !== 'chiuso' ? 'Modifica il piano' : 'Prepara la settimana'; }
function decoraWizard() {
  if (!_bpwWeek) return;
  document.querySelectorAll('#bpw-days .bp-drop').forEach(zona => {
    const idx = GIORNI.findIndex(g => g.key === zona.dataset.zona);
    if (idx < 0) return;
    const min = minutiOccupati(bpDataGiorno(_bpwWeek, _bpwYear, idx));
    if (!min) return;
    const hd = zona.querySelector('.bp-drop-hd');
    if (hd && !hd.querySelector('.bp-occ')) hd.insertAdjacentHTML('beforeend', `<span class="bp-occ">${bpFormatMin(min)} già occupati da appuntamenti</span>`);
  });
}

// ══════════════════════════════════════════════════════════════
