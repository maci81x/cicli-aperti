// v5 · CUSCINETTI NEGLI SPAZI LIBERI (non più a orario fisso)
// I due spazi liberi più lunghi tra le 9 e le 19 (almeno 45 minuti), uno prima delle 14 e uno dopo.
// ══════════════════════════════════════════════════════════════
function spaziLiberi(occupati, da, a) {
  const ord = occupati.map(([s, e]) => [Math.max(s, da), Math.min(e, a)]).filter(([s, e]) => e > s).sort((x, y) => x[0] - y[0]);
  const out = [];
  let t = da;
  ord.forEach(([s, e]) => { if (s > t) out.push([t, s]); t = Math.max(t, e); });
  if (a > t) out.push([t, a]);
  return out;
}
function occupatiEventi(d) {
  return eventiDelGiorno(d).filter(e => e.ora && e.fine && !eGiornata(e)).map(e => { const s = minDi(e.ora), f = minDi(e.fine); return [s, f > s ? f : 24 * 60]; });
}
// [{ ora, durata }]: al massimo due, a fine spazio (fanno da cuscinetto dopo il lavoro di quella mezza giornata)
function postiCuscinetto(d, extra) {
  const occ = [...occupatiEventi(d), ...(extra || [])];
  const I = minDi(GIORNATA.INIZIO), F = minDi(GIORNATA.FINE), M = minDi(GIORNATA.META);
  return [[I, M], [M, F]].map(([da, a]) => {
    const meglio = spaziLiberi(occ, da, a).sort((x, y) => (y[1] - y[0]) - (x[1] - x[0]))[0];
    if (!meglio || meglio[1] - meglio[0] < GIORNATA.CUSC_MIN) return null;
    const durata = Math.min(CUSC.DURATA, meglio[1] - meglio[0]);
    return { ora: hmDi(meglio[1] - durata), durata };
  }).filter(Boolean);
}
const occupatiWizard = giorno => [..._bpwSel.values()].filter(v => v.giorno === giorno && v.ora).map(v => [minDi(v.ora), minDi(v.ora) + (v.durata || BP_DURATA_DEFAULT)]);
const occupatiPiano = gk => righeGiorno(gk).filter(r => r.ora).map(r => [minDi(r.ora), minDi(r.ora) + (r.durata || BP_DURATA_DEFAULT)]);

// «+ Cuscinetto a metà / fine giornata» e i cuscinetti automatici: nello spazio libero più lungo di quella mezza giornata.
bpwAggiungiCusc = function (giorno, quando, auto) {
  const idx = GIORNI.findIndex(g => g.key === giorno);
  const posti = idx >= 0 && _bpwWeek ? postiCuscinetto(bpDataGiorno(_bpwWeek, _bpwYear, idx), occupatiWizard(giorno)) : [];
  const meta = minDi(GIORNATA.META);
  const posto = posti.find(p => quando === 'fine' ? minDi(p.ora) >= meta : minDi(p.ora) < meta) || null;
  if (auto && !posto) return;                      // giornata piena: niente cuscinetto automatico
  const v = posto || { ora: quando === 'fine' ? CUSC.FINE : CUSC.META, durata: CUSC.DURATA };
  _bpwCusc.set('n' + (++_cuscN), { id: null, giorno, ora: v.ora, durata: v.durata, auto: !!auto });
  if (!auto) bpwRenderStep2();
};
// Quando arrivano gli appuntamenti, i cuscinetti automatici ancora da salvare si rimettono negli spazi veri.
function bpwRipiazzaAuto() {
  [..._bpwCusc.entries()].filter(([, v]) => v.auto && !v.id).forEach(([k]) => _bpwCusc.delete(k));
  GIORNI.slice(0, 5).forEach(g => { bpwAggiungiCusc(g.key, 'meta', true); bpwAggiungiCusc(g.key, 'fine', true); });
}
const _openBpWizardV4 = openBpWizard;
openBpWizard = async function (week, year, presel) {
  await _openBpWizardV4(week, year, presel);
  ui.bpwAuto = [..._bpwCusc.values()].some(v => v.auto);
  bpwConEventi(week, year);
};
bpwConEventi = function (week, year) {
  caricaEventi(week, year).then(() => {
    if (!$('bpWizOverlay').classList.contains('open') || _bpwWeek !== week || _bpwYear !== year) return;
    if (ui.bpwAuto && isGcalTokenValid()) bpwRipiazzaAuto();
    if (_bpwStep === 3) bpwRenderStep2(); else bpwRenderSummary();
  });
};
const giornataPiena = (d, extra) => !!state.cuscColOk && isGcalTokenValid() && !postiCuscinetto(d, extra).length;
const _bpwBloccoGiornoV4 = bpwBloccoGiorno;
bpwBloccoGiorno = function (k, idx) {
  const html = _bpwBloccoGiornoV4(k, idx);
  if (!html || k === 'settimana' || idx > 4) return html;
  const senza = ![..._bpwCusc.values()].some(v => v.giorno === k);
  if (!senza || !giornataPiena(bpDataGiorno(_bpwWeek, _bpwYear, idx), occupatiWizard(k))) return html;
  const i = html.indexOf('</div>') + 6;   // dopo l'intestazione del giorno
  return html.slice(0, i) + '<p class="bpw-pieno"><i class="ti ti-alert-triangle"></i>Giornata piena: nessun cuscinetto possibile</p>' + html.slice(i);
};

// ══════════════════════════════════════════════════════════════
