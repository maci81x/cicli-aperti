// v3 · LE TUE 3 (in_focus sulle righe del piano di oggi)
// ══════════════════════════════════════════════════════════════
const FOCUS_MAX = 99;   // v36 · nessun limite: «Cosa porti a casa oggi?» è un promemoria, si spunta o si toglie quello che si vuole
function righePianoOggi() {
  if (!eSettimanaCorrente()) return [];
  return righeGiorno(giornoKeyDi(oggiData())).filter(r => r.item);
}
// Le tue 3: quelle segnate; se non ne è segnata nessuna e il piano di oggi ha ≤ 3 righe, tutte.
function focusDiOggi(righe) {
  if (!state.focusColOk) return new Set();
  const piano = righe.filter(r => r.item);
  const segnate = piano.filter(r => r.item.in_focus);
  if (segnate.length) return new Set(segnate.slice(0, FOCUS_MAX).map(r => r.c.id));
  return piano.length && piano.length <= FOCUS_MAX ? new Set(piano.map(r => r.c.id)) : new Set();
}
function focusAperte() {
  const righe = eSettimanaCorrente() ? righeGiorno(giornoKeyDi(oggiData())) : [];
  const ids = focusDiOggi(righe);
  return { tot: ids.size, aperte: righe.filter(r => ids.has(r.c.id) && !r.fatto).length };
}

// Il foglio del mattino: prima apertura di Oggi nel giorno, piano di oggi con più di 3 righe.
function controllaMattino() {
  if (!state.focusColOk || !state.bp || ui.tab !== 'oggi') return;
  if (lsLeggi(LS3.FOCUS) === oggiLocale()) return;
  if (!$('onb').hidden || document.querySelector('.modal-overlay.open')) return;
  const righe = righePianoOggi().filter(r => !r.fatto);
  if (!righe.length || righe.some(r => r.item.in_focus)) return;   // v36 · ogni mattina, anche con poche cose
  lsScrivi(LS3.FOCUS, oggiLocale());
  apriFocus();
}
function apriFocus() {
  const righe = righePianoOggi().filter(r => !r.fatto);
  const segnate = righe.filter(r => r.item.in_focus);
  const base = segnate.length ? segnate : righe;   // v36 · tutte spuntate: togli quelle che oggi non porti a casa
  ui.focusScelta = new Set(base.slice(0, FOCUS_MAX).map(r => r.item.id));
  disegnaFocus();
  $('focusOverlay').classList.add('open');
}
function disegnaFocus() {
  const righe = righePianoOggi().filter(r => !r.fatto);
  const pieno = ui.focusScelta.size >= FOCUS_MAX;
  $('focus-sub').textContent = `Togli la spunta a quello che oggi non porti a casa · ${ui.focusScelta.size} di ${righe.length}`;
  $('focus-lista').innerHTML = righe.map(r => {
    const sel = ui.focusScelta.has(r.item.id);
    return `<label class="bp-pick${sel ? ' sel' : ''}"><input type="checkbox" data-act="focus-scelta" data-item="${r.item.id}"${sel ? ' checked' : ''}${!sel && pieno ? ' disabled' : ''}>
      <div class="bp-pick-main"><div class="bp-pick-title">${escHtml(r.c.title)}</div><div class="bp-pick-meta">${modoSemplice() ? '' : tagTipo(computeEffectiveQ(r.c))}${r.ora ? `<span class="mono">${r.ora}</span>` : ''}</div></div></label>`;
  }).join('');
}
async function scriviFocus(scelti, tutti) {
  const si = tutti.filter(id => scelti.has(id)), no = tutti.filter(id => !scelti.has(id));
  if (si.length) { const { error } = await db.from('battle_plan_items').update({ in_focus: true }).in('id', si); if (error) throw error; }
  if (no.length) { const { error } = await db.from('battle_plan_items').update({ in_focus: false }).in('id', no); if (error) throw error; }
  state.bpItems = state.bpItems.map(i => tutti.includes(i.id) ? { ...i, in_focus: scelti.has(i.id) } : i);
}
async function confermaFocus() {
  const tutti = righePianoOggi().map(r => r.item.id);
  try {
    await scriviFocus(ui.focusScelta, tutti);
    closeModal('focusOverlay');
    render();
    showToast(ui.focusScelta.size ? `Oggi porti a casa ${ui.focusScelta.size === 1 ? '1 cosa' : ui.focusScelta.size + ' cose'}: hanno la stellina` : 'Nessuna spunta: vedi tutto il piano di oggi', 'success');
  } catch (e) { showToast('Errore: ' + e.message, 'error'); }
}
// La stellina: entra o esce dalle 3. Se le 3 erano «tutte, perché poche», la scelta diventa esplicita.
async function azioneStella(cicloId) {
  const righe = righePianoOggi();
  const r = righe.find(x => x.c.id === cicloId);
  if (!r) return;
  const ora = focusDiOggi(righeGiorno(giornoKeyDi(oggiData())));
  const scelti = new Set(righe.filter(x => ora.has(x.c.id)).map(x => x.item.id));
  if (scelti.has(r.item.id)) scelti.delete(r.item.id);
  else if (scelti.size >= FOCUS_MAX) { showToast('Ne hai già 3: togline una prima', 'warn'); return; }
  else scelti.add(r.item.id);
  try { await scriviFocus(scelti, righe.map(x => x.item.id)); render(); } catch (e) { showToast('Errore: ' + e.message, 'error'); }
}

// ══════════════════════════════════════════════════════════════
