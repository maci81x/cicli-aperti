// v4: chiudere una cosa bloccata in agenda aggiorna l'evento; l'ultimo passo fatto chiede di chiudere la cosa intera.
const _azioneFattoV3 = azioneFatto;
azioneFatto = async function (id) {
  const c = ciclo(id), eraAperta = !!c && !c.done;
  await _azioneFattoV3(id);
  const dopo = ciclo(id);
  if (c && dopo && eraAperta && dopo.done) {
    if (c.calendar_event_id) chiudiBlocco(dopo);
    if (c.parent_id) controllaMadre(c.parent_id);
  }
  if (editingId && $('modalOverlay').classList.contains('open')) disegnaPassi(ciclo(editingId));
};

// ══════════════════════════════════════════════════════════════
