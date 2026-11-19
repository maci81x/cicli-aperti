// v5 · Q2 INDEROGABILI: spostare un'Importante bloccata chiede conferma (e si conta)
// ══════════════════════════════════════════════════════════════
const MOTIVI_SPOSTA = [{ k: 'urgenza', l: 'Urgenza vera' }, { k: 'imprevisto', l: 'Imprevisto personale' }, { k: 'dimenticato', l: 'Me ne sono dimenticato' }, { k: 'altro', l: 'Altro' }];
async function pianoSettimanaCorrente() {
  const cur = bpSettimanaCorrente();
  if (state.bp && state.week === cur.week && state.year === cur.year) return state.bp;
  const { plan } = await bpFetchPlan(cur.week, cur.year);
  return plan;
}
// Aggiorna il piano della settimana corrente con il risultato di fn(piano). Senza piano non fa niente.
async function aggiornaPianoCorrente(fn) {
  if (!state.bpTableOk) return false;
  const plan = await pianoSettimanaCorrente();
  if (!plan) return false;
  const patch = fn(plan);
  if (!Object.keys(patch).length) return false;
  const { error } = await db.from('battle_plan').update(patch).eq('id', plan.id);
  if (error) throw error;
  if (state.bp && state.bp.id === plan.id) state.bp = { ...state.bp, ...patch };
  return true;
}
async function contaQ2Spostata(motivo) {
  try {
    await aggiornaPianoCorrente(p => {
      const m = p.motivi || {}, q2 = m.q2 || {}, k = motivo || 'senza';
      return { ...(state.q2ColOk ? { q2_spostate: (p.q2_spostate || 0) + 1 } : {}),
        ...(state.statsColOk ? { motivi: { ...m, q2: { ...q2, [k]: (q2[k] || 0) + 1 } } } : {}) };
    });
  } catch (e) { console.warn('[Q2] conteggio spostamento:', e.message); }
}
function chiediSpostamento(c, esegui) {
  if (protezione() === 'avviso') {
    return Promise.resolve(esegui()).then(() => { contaQ2Spostata(null); showToast('Era un\'Importante bloccata: conta tra le Q2 spostate', 'warn', {}); });
  }
  ui.proteggi = { id: c.id, esegui, motivo: null };
  $('proteggi-cosa').textContent = c.title || '';
  disegnaProteggi();
  $('proteggiOverlay').classList.add('open');
  return Promise.resolve();
}
function disegnaProteggi() {
  const p = ui.proteggi || {};
  $('proteggi-motivi').innerHTML = MOTIVI_SPOSTA.map(m => `<button type="button" class="chip" data-act="proteggi-motivo" data-v="${m.k}" aria-pressed="${p.motivo === m.k}">${m.l}</button>`).join('');
}
async function rispondiProteggi(sposta) {
  const p = ui.proteggi;
  ui.proteggi = null;
  closeModal('proteggiOverlay');
  if (!p) return;
  if (!sposta) { render(); showToast('Resta dov\'era', 'info'); return; }
  await p.esegui();
  contaQ2Spostata(p.motivo);
}
function proteggi(base) {
  return function (id, ...args) {
    const c = ciclo(id);
    if (!eInderogabile(c)) return base(id, ...args);
    return chiediSpostamento(c, () => base(id, ...args));
  };
}
azioneDomani = proteggi(azioneDomani);
azioneQuando = proteggi(azioneQuando);
impostaGiorno = proteggi(impostaGiorno);
moveCicloInAgenda = proteggi(moveCicloInAgenda);
// Lascia stare toglie anche il blocco in agenda: non è più un impegno con te stesso.
const _azioneLasciaV4 = azioneLascia;
azioneLascia = proteggi(async function (id) {
  const c = ciclo(id);
  await _azioneLasciaV4(id);
  const dopo = ciclo(id);
  if (!c || !dopo || !dopo.parcheggiato) return;
  try {
    if (c.calendar_event_id && !bloccoEsterno(c) && isGcalTokenValid()) await togliBlocco(dopo, true);
    if (c.inderogabile && state.inderoColOk) await patchCiclo(id, { inderogabile: false });
    render();
  } catch (e) { console.warn('[Lascia] blocco:', e.message); }
});

// Blocca in agenda su un'Importante = inderogabile; togliere il blocco la libera.
const _creaBloccoV4 = creaBlocco;
creaBlocco = async function (c, slot, silenzioso) {
  const id = await _creaBloccoV4(c, slot, silenzioso);
  const ora = ciclo(c.id);
  if (!silenzioso && state.inderoColOk && ora && computeEffectiveQ(ora) === 2 && !ora.inderogabile) {
    try { await patchCiclo(c.id, { inderogabile: true }); render(); } catch (e) { console.warn('[Q2] inderogabile:', e.message); }
  }
  return id;
};
const _togliBloccoV4 = togliBlocco;
togliBlocco = async function (c, silenzioso) {
  if (!c) return;
  if (bloccoEsterno(c)) await patchCiclo(c.id, { calendar_event_id: null });   // evento del calendario Lavoro: si scollega, non si cancella
  else await _togliBloccoV4(c, silenzioso);
  if (c.inderogabile && state.inderoColOk) await patchCiclo(c.id, { inderogabile: false });
  if (bloccoEsterno(c) && !silenzioso) { render(); showToast('Scollegata dall\'evento del calendario', 'info'); }
};
const _aggiornaBloccoV4 = aggiornaBlocco;
aggiornaBlocco = id => bloccoEsterno(ciclo(id)) ? Promise.resolve() : _aggiornaBloccoV4(id);

// ══════════════════════════════════════════════════════════════
