// v5 · TUTTO: «N cose aperte» e com'era 7 giorni fa (meno è meglio)
// ══════════════════════════════════════════════════════════════
function statoAperte() {
  const base = c => vedi(c.ctx) && !(c.parent_id && state.passiColOk);
  const T = Date.now() - 7 * 864e5, t = s => s ? new Date(s).getTime() : 0;
  const ora = state.cicli.filter(c => base(c) && isAttivo(c)).length;
  // 7 giorni fa: esisteva, non era ancora chiusa (updated_at di una chiusa ≈ quando è stata chiusa) e non era in Un giorno
  const prima = state.cicli.filter(c => base(c) && t(c.created_at) <= T && (!c.done || t(c.updated_at) > T)
    && !(c.parcheggiato && t(c.parcheggiato_at) && t(c.parcheggiato_at) <= T)).length;
  return { ora, delta: ora - prima };
}
function htmlAperte() {
  const { ora, delta } = statoAperte();
  const var_ = delta < 0 ? `<span class="delta meglio"><i class="ti ti-trending-down"></i>${-delta} in meno di 7 giorni fa</span>`
    : delta > 0 ? `<span class="delta peggio"><i class="ti ti-trending-up"></i>${delta} in più di 7 giorni fa</span>` : '<span class="delta">come 7 giorni fa</span>';
  return `<div class="aperte-stato"><div><b class="mono">${ora}</b> ${ora === 1 ? 'cosa aperta' : 'cose aperte'}<br>${var_}</div>
    <div class="aperte-azioni"><button type="button" class="btn btn-secondary btn-sm" data-act="riordina"><i class="ti ti-arrows-sort"></i>Riordina</button>
    <button type="button" class="btn btn-secondary btn-sm" data-act="svuota"><i class="ti ti-brain"></i>Svuota la testa</button></div></div>`;
}
const _aggiornaTuttoV4 = aggiornaTutto;
aggiornaTutto = function () {
  _aggiornaTuttoV4();
  const corpo = $('tutto-corpo');
  if (corpo && !modoSemplice()) corpo.insertAdjacentHTML('afterbegin', htmlAperte());
};

// ══════════════════════════════════════════════════════════════
