// v3 · VENERDÌ: È ORA DEL PIANO (giorno e ora in Impostazioni)
// ══════════════════════════════════════════════════════════════
ui.pianoProssima = null;   // { k, esiste } per la settimana dopo quella corrente
// dal giorno e ora scelti fino a domenica sera
function inFinestraPiano(adesso) {
  const { giorno, ora } = quandoPiano(), idx = giornoIdxDi(adesso);
  if (idx > giorno) return true;
  if (idx < giorno) return false;
  const hhmm = `${String(adesso.getHours()).padStart(2, '0')}:${String(adesso.getMinutes()).padStart(2, '0')}`;
  return hhmm >= ora;
}
async function caricaPianoProssima() {
  const cur = bpSettimanaCorrente(), n = bpSettimanaSuccessiva(cur.week, cur.year), k = settKey(n.week, n.year);
  if (!state.bpTableOk || (ui.pianoProssima && ui.pianoProssima.k === k)) return;
  ui.pianoProssima = { k, esiste: true };   // finché non si sa, niente banner
  try { const { plan } = await bpFetchPlan(n.week, n.year); ui.pianoProssima = { k, esiste: !!plan }; render(); }
  catch (e) { ui.pianoProssima = null; }
}
function apriWizardProssima() {
  const cur = bpSettimanaCorrente(), n = bpSettimanaSuccessiva(cur.week, cur.year);
  apriWizard(n.week, n.year);
}

// ══════════════════════════════════════════════════════════════
