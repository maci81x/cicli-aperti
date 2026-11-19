// v5 · FINE DEL WIZARD: «Il piano è pronto» con Stampa il foglio e Invia al coach
// ══════════════════════════════════════════════════════════════
function disegnaPronto() {
  const w = { week: state.week, year: state.year }, da = getWeekStart(w.week, w.year), a = new Date(da); a.setDate(da.getDate() + 6);
  $('pronto-sub').textContent = `Settimana ${w.week} · ${fmtCorta(da)} – ${fmtCorta(a)}`;
  const inv = inviatoIl(w.week, w.year), st = stampatoIl(w.week, w.year);
  $('pronto-stato').innerHTML = [
    `<span${inv ? ' class="fatto"' : ''}><i class="ti ${inv ? 'ti-circle-check' : 'ti-circle-dashed'}"></i>${inv ? `Piano inviato il ${inv}` : 'Non ancora inviato al coach'}</span>`,
    `<span${st ? ' class="fatto"' : ''}><i class="ti ${st ? 'ti-circle-check' : 'ti-circle-dashed'}"></i>${st ? `Stampato il ${st}` : 'Non ancora stampato'}</span>`].join('');
}
function apriPronto() { disegnaPronto(); $('prontoOverlay').classList.add('open'); }
const _bpAttivaV4 = bpAttiva;
bpAttiva = async function () {
  await _bpAttivaV4();
  if (!$('bpWizOverlay').classList.contains('open')) setTimeout(apriPronto, 350);   // chiuso = salvato
};
const _bpStampaPdfV4 = bpStampaPdf;
bpStampaPdf = function () {
  const prima = ui.ultimoPdf;
  _bpStampaPdfV4();
  if (ui.ultimoPdf && ui.ultimoPdf !== prima) { segnaStampato(state.week, state.year); render(); if ($('prontoOverlay').classList.contains('open')) disegnaPronto(); }
};

// ══════════════════════════════════════════════════════════════
