// v3 · RAPIDE (≤ 15 minuti) — «Ci vogliono 2 minuti? Falle ora.»
// ══════════════════════════════════════════════════════════════
const RAPIDA_MIN = 15, RAPIDE_DA_TUTTO = 3;
const RAPIDA_CHIP = '<span class="rapida"><i class="ti ti-bolt"></i>Rapida</span>';
function eRapida(c, item) {
  const min = (item && item.durata_prevista && item.durata_prevista !== BP_DURATA_DEFAULT ? item.durata_prevista : null) || c.durata_minuti;
  return !!min && min <= RAPIDA_MIN && !isGiornaliero(c);
}
// le rapide di oggi (fuori dalle 3) e, se sono meno di 3, quelle ancora da piazzare
function rapideDiOggi(righe, focusIds) {
  const diOggi = righe.filter(r => !r.fatto && !focusIds.has(r.c.id) && eRapida(r.c, r.item));
  if (diOggi.length >= RAPIDE_DA_TUTTO) return diOggi;
  const gia = new Set(righe.map(r => r.c.id));
  const senzaData = state.cicli
    .filter(c => vedi(c.ctx) && isAttivo(c) && !gia.has(c.id) && !haPianificazione(c) && !haPassiAperti(c) && eRapida(c, null))
    .slice(0, RAPIDE_DA_TUTTO - diOggi.length)
    .map(c => ({ c, fatto: false }));
  return [...diOggi, ...senzaData];
}

// ══════════════════════════════════════════════════════════════
