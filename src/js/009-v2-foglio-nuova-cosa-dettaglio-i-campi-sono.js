// v2 · FOGLIO NUOVA COSA / DETTAGLIO (i campi sono quelli di saveCiclo)
// ══════════════════════════════════════════════════════════════
function toggleMoreOpts() { $('moreOptsSection').classList.contains('open') ? closeMoreOpts() : openMoreOpts(); }
function openMoreOpts()  { $('moreOptsSection').classList.add('open');    const b = $('moreOptsBtn'); b.textContent = 'Meno opzioni';  b.setAttribute('aria-expanded', 'true'); }
function closeMoreOpts() { $('moreOptsSection').classList.remove('open'); const b = $('moreOptsBtn'); b.textContent = 'Altre opzioni'; b.setAttribute('aria-expanded', 'false'); }

function apriNuovo(q) {
  openModal(q || 2);
  closeMoreOpts();
  $('sheetTitle').textContent = 'Cosa devi fare?';
  $('btn-save').textContent = 'Aggiungi';
  $('nuovo-quando').hidden = false;
  $('det-azioni').hidden = true;
  $('det-pianificazione').hidden = true;
  $('det-passi').hidden = true;
  $('det-log').hidden = true;
  impostaScelta('quando', ui.tab === 'oggi' ? 'oggi' : 'nessuna');
  riempiSelectAree('');
  impostaDurata(null);
  $('q2-nudge').classList.remove('show');   // su una cosa nuova compare solo se tocchi «Importante»
}

function apriDettaglio(id) {
  const c = ciclo(id);
  if (!c) return;
  openModal(null, id);
  closeMoreOpts();
  $('sheetTitle').textContent = c.done ? 'Fatta' : isParcheggiato(c) ? 'Un giorno' : 'Dettagli';
  $('btn-save').textContent = 'Salva';
  $('nuovo-quando').hidden = true;

  const az = $('det-azioni');
  az.hidden = false;
  az.innerHTML = c.done
    ? `<button type="button" class="btn btn-secondary btn-sm" data-act="d-riapri"><i class="ti ti-arrow-back-up"></i>Riapri</button>`
    : isParcheggiato(c)
      ? `<button type="button" class="btn btn-secondary btn-sm" data-act="d-riattiva"><i class="ti ti-arrow-back-up"></i>Rimetti tra le cose aperte</button>
         <button type="button" class="btn btn-ghost btn-danger btn-sm" data-act="d-elimina">Elimina definitivamente</button>`
      : `<button type="button" class="btn btn-primary btn-sm" data-act="d-fatto"><i class="ti ti-check"></i>Fatto</button>
         <button type="button" class="btn btn-secondary btn-sm" data-act="d-domani">Domani</button>
         <button type="button" class="btn btn-ghost btn-sm" data-act="d-lascia">Lascia stare</button>`;

  const pianificata = disegnaPianificazione(c);
  riempiSelectAree(normArea(c.macro_area));
  disegnaPassi(c);
  impostaDurata(c.durata_minuti);
  $('f-durata-det').disabled = !state.ritualiColsOk;

  // il suggerimento «mettila in agenda» serve solo se è Importante e non ha ancora una data
  $('q2-nudge').classList.toggle('show', selectedQ === 2 && !pianificata && !c.done);

  const log = $('det-log');
  const quando = s => s ? new Date(s).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  log.hidden = false;
  log.innerHTML = `Creata il ${quando(c.created_at)} · ultima modifica ${quando(c.updated_at)}${c.da_plaud ? ' · da una registrazione' : ''}${computeEffectiveQ(c) !== c.q ? ' · salita di priorità perché la scadenza è vicina' : ''}`;
}

// Salva dal foglio: saveCiclo fa la scrittura; qui si applica solo il «Quando?» di una cosa nuova.
async function salvaDalFoglio() {
  const nuova = !editingId;
  const quando = ui.nuovoQuando;
  const prima = editingId ? ciclo(editingId) : null;
  const durata = parseInt($('f-durata-det').value, 10) || null;
  const diventaDelega = selectedQ === 3 && (!prima || prima.q !== 3);
  const saved = await inSilenzio(() => saveCiclo());
  if (!saved || !saved.id) { if (!$('f-title').value.trim()) showToast('Scrivi cosa devi fare', 'warn', {}); return; }
  if (state.ritualiColsOk && durata !== ((prima && prima.durata_minuti) || null)) {
    try { await patchCiclo(saved.id, { durata_minuti: durata }); } catch (e) { showToast('Salvata, ma senza durata: ' + e.message, 'error'); }
  }
  if (!nuova) aggiornaBlocco(saved.id);
  if (diventaDelega) { render(); setTimeout(() => apriDelega(saved.id), 150); return; }   // «A chi? Quando controlli?»
  if (nuova && (quando === 'oggi' || quando === 'domani')) {
    const d = new Date(); if (quando === 'domani') d.setDate(d.getDate() + 1);
    try { await pianificaInData(saved, d, null); } catch (e) { showToast('Salvata, ma senza data: ' + e.message, 'error'); }
  }
  render();
  if (nuova && quando === 'scegli') { setTimeout(() => azioneQuando(saved.id), 150); return; }
  showToast(nuova ? 'Aggiunta' : 'Salvata', 'success');
}

// «Quanto ci vuole?»: una durata fuori dall'elenco (es. 45 min di una routine) diventa una voce in più
function impostaDurata(min) {
  const sel = $('f-durata-det');
  [...sel.options].filter(o => o.dataset.extra).forEach(o => o.remove());
  const v = min ? String(min) : '';
  if (v && ![...sel.options].some(o => o.value === v)) {
    const o = document.createElement('option');
    o.value = v; o.textContent = formatDurata(min); o.dataset.extra = '1';
    sel.appendChild(o);
  }
  sel.value = v;
}

function pianificaProssimiMesi() {
  if (editingId) { const id = editingId; closeModal('modalOverlay'); azioneQuando(id, true); return; }
  if (!$('f-title').value.trim()) { showToast('Scrivi prima cosa devi fare', 'warn'); return; }
  inSilenzio(() => saveCiclo()).then(saved => { if (saved && saved.id) { render(); setTimeout(() => azioneQuando(saved.id, true), 150); } });
}

// ══════════════════════════════════════════════════════════════
