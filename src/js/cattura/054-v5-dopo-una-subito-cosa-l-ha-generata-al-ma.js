// v5 · DOPO UNA «SUBITO»: cosa l'ha generata? (al massimo una volta al giorno per area)
// ══════════════════════════════════════════════════════════════
function chiediOrigineSubito(c) {
  if (!c || $('confermaOverlay').classList.contains('open') || $('modalOverlay').classList.contains('open')) return;
  const area = areaDi(c) || 'senza area', chiesti = leggiJson(LS5.SUBITO, {});
  if (chiesti[area] === oggiLocale()) return;
  scriviJson(LS5.SUBITO, { ...chiesti, [area]: oggiLocale() });
  ui.subito = { id: c.id, ctx: c.ctx, cat: c.cat, macro_area: c.macro_area, titolo: c.title };
  $('subito-cosa').textContent = c.title || '';
  $('subito-testo').value = '';
  $('subitoOverlay').classList.add('open');
  setTimeout(() => $('subito-testo').focus(), 150);
}
const _azioneFattoV4 = azioneFatto;
azioneFatto = async function (id) {
  const c = ciclo(id);
  const subito = !!c && !c.done && !isGiornaliero(c) && computeEffectiveQ(c) === 1;
  await _azioneFattoV4(id);
  const dopo = ciclo(id);
  if (subito && dopo && dopo.done) setTimeout(() => chiediOrigineSubito(c), 700);
};

// ══════════════════════════════════════════════════════════════
