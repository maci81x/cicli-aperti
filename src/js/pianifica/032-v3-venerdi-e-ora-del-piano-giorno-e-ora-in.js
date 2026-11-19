// v3 · VENERDÌ: È ORA DEL PIANO (giorno e ora in Impostazioni)
// ══════════════════════════════════════════════════════════════
ui.pianoProssima = null;   // { k, esiste } per la settimana dopo quella corrente
function quandoPiano() {
  const g = parseInt(lsLeggi(LS3.PIANO_GIORNO), 10);
  return { giorno: g >= 0 && g <= 6 ? g : 4, ora: /^\d{2}:\d{2}$/.test(lsLeggi(LS3.PIANO_ORA) || '') ? lsLeggi(LS3.PIANO_ORA) : '14:00' };
}
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
// Due stati: senza piano per la settimana dopo → «Prepara»; con il piano ma non ancora inviato → «Invia il piano».
function bannerPiano() {
  if (!inFinestraPiano(new Date()) || lsLeggi(LS3.PIANO_CHIUSO) === oggiLocale()) return '';
  caricaPianoProssima();
  if (!ui.pianoProssima) return '';
  const cur = bpSettimanaCorrente(), n = bpSettimanaSuccessiva(cur.week, cur.year);
  const chiudi = `<button type="button" class="btn btn-icon" data-act="banner-chiudi" aria-label="Chiudi per oggi" data-tip="Chiudi per oggi"><i class="ti ti-x"></i></button>`;
  if (!ui.pianoProssima.esiste) return `<section class="banner-piano" aria-label="Piano della settimana"><i class="ti ti-calendar-plus"></i>
    <div><b>È ora del piano della settimana</b><div class="banner-azioni"><button type="button" class="btn btn-primary btn-sm" data-act="banner-piano">Prepara la settimana prossima</button></div></div>${chiudi}</section>`;
  if (inviatoIl(n.week, n.year)) return '';
  return `<section class="banner-piano" aria-label="Piano della settimana"><i class="ti ti-send"></i>
    <div><b>Il piano della prossima settimana è pronto</b><div class="banner-azioni"><button type="button" class="btn btn-primary btn-sm" data-act="banner-invia">Invia il piano</button>
      <button type="button" class="btn btn-secondary btn-sm" data-act="banner-piano">Modifica</button></div></div>${chiudi}</section>`;
}
function apriWizardProssima() {
  const cur = bpSettimanaCorrente(), n = bpSettimanaSuccessiva(cur.week, cur.year);
  apriWizard(n.week, n.year);
}

// ══════════════════════════════════════════════════════════════
