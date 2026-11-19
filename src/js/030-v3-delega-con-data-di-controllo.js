// v3 · DELEGA CON DATA DI CONTROLLO
// ══════════════════════════════════════════════════════════════
const DELEGA_QUANDO = [{ k: '2', l: 'Tra 2 giorni' }, { k: '7', l: 'Tra una settimana' }, { k: 'data', l: 'Scegli data' }];
function personaDi(id) { return id ? state.persone.find(p => String(p.id) === String(id)) || null : null; }
function delegaTesto(c) {
  if (!state.delegaColsOk) return '';
  const p = personaDi(c.delega_persona_id);
  const parti = [p ? `a ${p.nome}` : null, c.delega_controllo ? `controlla il ${fmtGgMm(c.delega_controllo)}` : null].filter(Boolean);
  return parti.join(' · ');
}
function daControllare() {
  if (!state.delegaColsOk) return [];
  const oggi = oggiLocale();
  return state.cicli.filter(c => vedi(c.ctx) && isAttivo(c) && c.q === 3 && c.delega_controllo && c.delega_controllo <= oggi)
    .sort((a, b) => String(a.delega_controllo).localeCompare(String(b.delega_controllo)));
}
function rigaControllo(c) {
  const p = personaDi(c.delega_persona_id);
  const quando = c.delega_controllo < oggiLocale() ? `<span class="ritardo">dovevi controllare il ${fmtGgMm(c.delega_controllo)}</span>` : '<span>oggi</span>';
  return `<div class="item carry-riga ctrl-riga" data-id="${c.id}">
    <div class="item-row no-check"><button type="button" class="item-main" data-act="apri"><span class="item-title">${p ? `Chiedi a ${escHtml(p.nome)}: ` : 'Controlla: '}${escHtml(c.title)}</span><span class="item-meta">${quando}</span></button></div>
    <div class="chips chips-wrap carry-azioni tre" role="group" aria-label="Com'è andata">
      <button type="button" class="chip" data-act="ctrl-fatto">Fatto</button>
      <button type="button" class="chip" data-act="ctrl-rimanda">Rimanda 2 giorni</button>
      <button type="button" class="chip" data-act="ctrl-riprendi">Riprendila io</button>
      <button type="button" class="chip" data-act="q-tornata"><i class="ti ti-arrow-back-up"></i>Mi è tornata indietro</button></div></div>`;
}
async function azioneControllo(id, v) {
  const c = ciclo(id);
  if (!c) return;
  if (v === 'fatto') { await azioneFatto(id); return; }
  const prima = campi(c, ['q', 'delega_persona_id', 'delega_controllo']);
  const patch = v === 'rimanda' ? { delega_controllo: toISODate(dataPiu(2)) } : { q: 2, delega_persona_id: null, delega_controllo: null };
  try {
    await patchCiclo(id, patch);
    render();
    showToast(v === 'rimanda' ? `Controlli il ${fmtGgMm(patch.delega_controllo)}` : 'Ripresa: è di nuovo Importante', 'success', { annulla: () => patchCiclo(id, prima) });
  } catch (e) { showToast('Errore: ' + e.message, 'error'); }
}

function apriDelega(id) {
  const c = ciclo(id);
  if (!c) return;
  if (!state.delegaColsOk) {   // senza migration: resta il tipo «Delega», senza persona né controllo
    if (c.q !== 3) patchCiclo(id, { q: 3 }).then(render);
    showToast('Delega senza data di controllo: manca la migration v3 (vedi Impostazioni)', 'warn');
    return;
  }
  ui.delega = { id, persona: c.delega_persona_id || null, quando: c.delega_controllo ? 'data' : '2', data: c.delega_controllo || '' };
  $('delega-cosa').textContent = c.title || '';
  $('delega-nuova').value = '';
  $('delega-errore').hidden = true;
  disegnaDelega();
  $('delegaOverlay').classList.add('open');
}
function disegnaDelega() {
  const d = ui.delega;
  $('delega-persone').innerHTML = state.persone.length
    ? state.persone.map(p => `<button type="button" class="chip" data-act="delega-persona" data-p="${p.id}" aria-pressed="${String(d.persona) === String(p.id)}"><span class="avatar">${escHtml((p.nome || '?').charAt(0).toUpperCase())}</span>${escHtml(p.nome)}</button>`).join('')
    : '<p class="t-label muted">Nessuna persona ancora: aggiungila qui sotto.</p>';
  $('delega-quando').innerHTML = DELEGA_QUANDO.map(q => `<button type="button" class="chip" data-act="delega-quando" data-v="${q.k}" aria-pressed="${d.quando === q.k}">${q.l}</button>`).join('');
  const inp = $('delega-data');
  inp.hidden = d.quando !== 'data';
  inp.min = oggiLocale();
  if (d.quando === 'data' && d.data) inp.value = d.data;
}
async function delegaNuovaPersona() {
  const nome = ($('delega-nuova').value || '').trim();
  if (!nome) { $('delega-nuova').focus(); return; }
  try {
    const { data, error } = await db.from('persone').insert({ nome, colore: personColor({ nome }), created_at: new Date().toISOString() }).select();
    if (error) throw error;
    const p = data && data[0];
    if (p) { state.persone = [...state.persone, p].sort((a, b) => a.nome.localeCompare(b.nome)); ui.delega = { ...ui.delega, persona: p.id }; }
    $('delega-nuova').value = '';
    disegnaDelega();
  } catch (e) { showToast('Errore: ' + e.message, 'error'); }
}
async function salvaDelega() {
  const d = ui.delega, c = ciclo(d.id);
  if (!c) return;
  const errore = msg => { const e = $('delega-errore'); e.textContent = msg; e.hidden = false; };
  if (!d.persona) { errore('Scegli a chi la deleghi'); return; }
  const quando = d.quando === 'data' ? $('delega-data').value : toISODate(dataPiu(parseInt(d.quando, 10)));
  if (!quando) { errore('Scegli quando controlli'); return; }
  const p = personaDi(d.persona);
  const persone = (c.persone_menzionate || []).includes(p.nome) ? c.persone_menzionate : [...(c.persone_menzionate || []), p.nome];
  const prima = campi(c, ['q', 'delega_persona_id', 'delega_controllo', 'persone_menzionate']);
  try {
    await patchCiclo(c.id, { q: 3, delega_persona_id: p.id, delega_controllo: quando, persone_menzionate: persone });
    closeModal('delegaOverlay');
    render();
    showToast(`Delegata a ${p.nome} · controlli il ${fmtGgMm(quando)}`, 'success', { annulla: () => patchCiclo(c.id, prima) });
  } catch (e) { showToast('Errore: ' + e.message, 'error'); }
}

// ══════════════════════════════════════════════════════════════
