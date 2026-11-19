// v11 · TOGLIERE (25/10)
// · «Elimina» su ogni cosa, con Annulla (cicli.eliminato_at: l'app non la mostra più, Annulla la rimette)
// · appuntamenti: «Non è mio, nascondilo» (solo nell'app, tabella eventi_nascosti) e, per i tuoi, «Toglilo dal calendario»
// · «Figlie: …» nel titolo = impegno delle figlie: a parte in Oggi, non conta come tuo, non va nel foglio
// ══════════════════════════════════════════════════════════════
const TOGLI = { LS_NASCOSTI: 'eventi_nascosti', TABELLA: 'eventi_nascosti' };
const eFiglie = e => !!e && (e.figlie || /^\s*figlie\s*:/i.test(String(e.titolo || '')));
const titoloSenzaFiglie = t => String(t || '').replace(/^\s*figlie\s*:\s*/i, '');

// --- eventi delle figlie ---
const _eventoDaV11 = eventoDa;
eventoDa = function (raw, cal) {
  const e = _eventoDaV11(raw, cal);
  if (e && /^\s*figlie\s*:/i.test(e.titolo)) { e.figlie = true; e.titolo = titoloSenzaFiglie(e.titolo) || '(senza titolo)'; e.routine = false; }
  return e;
};

// --- appuntamenti nascosti ---
state.evtNascosti = new Set((() => { try { const v = JSON.parse(localStorage.getItem(TOGLI.LS_NASCOSTI) || '[]'); return Array.isArray(v) ? v : []; } catch (_) { return []; } })());
state.evtNascostiDb = false;
const salvaNascostiLocali = () => { try { localStorage.setItem(TOGLI.LS_NASCOSTI, JSON.stringify([...state.evtNascosti])); } catch (_) { /* niente */ } };
const chiaviEvento = e => [e.id, e.serie ? 'serie:' + e.serie : null].filter(Boolean);
const eNascosto = e => !!e && chiaviEvento(e).some(k => state.evtNascosti.has(k));
async function caricaEventiNascosti() {
  const { data, error } = await db.from(TOGLI.TABELLA).select('chiave');
  if (error) { state.evtNascostiDb = false; return; }   // tabella non ancora creata: si resta sul browser
  state.evtNascostiDb = true;
  const locali = [...state.evtNascosti].filter(k => !(data || []).some(r => r.chiave === k));
  if (locali.length) await db.from(TOGLI.TABELLA).upsert(locali.map(chiave => ({ chiave })), { onConflict: 'chiave' });
  state.evtNascosti = new Set([...(data || []).map(r => r.chiave), ...locali]);
  salvaNascostiLocali();
  render();
}
async function nascondiEvento(id, tutte) {
  const e = eventoPerId(id);
  if (!e) return;
  const chiave = tutte && e.serie ? 'serie:' + e.serie : e.id;
  state.evtNascosti.add(chiave);
  salvaNascostiLocali();
  closeModal('evtOverlay');
  render();
  if (state.evtNascostiDb) {
    const { error } = await db.from(TOGLI.TABELLA).upsert({ chiave, titolo: e.titolo }, { onConflict: 'chiave' });
    if (error) console.warn('[Appuntamenti] nascosto solo qui:', error.message);
  }
  showToast(`${e.titolo}: nascosto${chiave.startsWith('serie:') ? ', anche le prossime volte' : ''}`, 'success', { annulla: () => mostraEvento(chiave) });
}
async function mostraEvento(chiave) {
  state.evtNascosti.delete(chiave);
  salvaNascostiLocali();
  if (state.evtNascostiDb) await db.from(TOGLI.TABELLA).delete().eq('chiave', chiave);
  render();
}

// dove si vedono gli appuntamenti: niente nascosti, niente figlie (quelle hanno la loro riga in Oggi)
const _eventiDelGiornoV11 = eventiDelGiorno;
eventiDelGiorno = function (d) { return _eventiDelGiornoV11(d).filter(e => !eNascosto(e) && !eFiglie(e)); };
const _routineDelGiornoV11 = routineDelGiorno;
routineDelGiorno = function (d) { return _routineDelGiornoV11(d).filter(e => !eNascosto(e)); };
function figlieDelGiorno(d) { const iso = toISODate(d); return eventiSettimanaDi(d).filter(e => e.giorno === iso && eFiglie(e) && !eNascosto(e)); }

// la riga di un impegno delle figlie: grigia, con l'etichetta
function rigaFiglie(e) {
  return rigaEvento({ ...e, titolo: titoloSenzaFiglie(e.titolo) }).replace('class="evt-riga evt-app', 'class="evt-riga evt-app evt-figlie')
    .replace('<span class="item-title">', '<span class="item-title"><span class="tag-coach tag-figlie">Figlie</span>');
}
const _vistaOggiV11 = vistaOggi;
vistaOggi = function () {
  const h = _vistaOggiV11.apply(this, arguments);
  const lista = figlieDelGiorno(new Date());
  if (!lista.length) return h;
  const blocco = `<p class="list-head"><span><i class="ti ti-heart lh-ico"></i>Le figlie</span><span class="mono">non contano come tuoi</span></p><div class="group">${lista.map(rigaFiglie).join('')}</div>`;
  const prima = ['<p class="list-head"><span><i class="ti ti-bolt lh-ico">', '<p class="list-head"><span><i class="ti ti-user-check lh-ico">'].map(s => h.indexOf(s)).filter(i => i >= 0).sort((a, b) => a - b)[0];
  return prima >= 0 ? h.slice(0, prima) + blocco + h.slice(prima) : h + blocco;
};

// --- il foglio dell'appuntamento: nascondi / togli ---
// la seconda domanda, nello stesso foglio
function domandaFoglioEvento(id, tipo) {
  const e = eventoPerId(id), corpo = $('evt-corpo');
  if (!e || !corpo) return;
  const b = (act, v, cls, testo) => `<button type="button" class="btn ${cls} btn-block" data-act="${act}" data-evt="${esc(e.id)}" data-v="${v}">${testo}</button>`;
  const serie = e.ricorrente || !!e.serie;
  if (tipo === 'nascondi') {
    corpo.innerHTML = `<h4 class="t-title" id="evt-dom">Lo nascondo solo questa volta o sempre?</h4>
      <div class="evt-domanda" role="group" aria-labelledby="evt-dom">${b('evt-nascondi-ok', 'una', 'btn-secondary', 'Solo questa volta')}${b('evt-nascondi-ok', 'serie', 'btn-secondary', 'Anche le prossime')}${b('evt-indietro', '', 'btn-ghost', 'Indietro')}</div>`;
    return;
  }
  corpo.innerHTML = `<h4 class="t-title" id="evt-dom">Lo tolgo da Google Calendar?</h4>
    <p class="t-label muted">«${escHtml(e.titoloOrig || e.titolo)}» · ${fmtGiornoLungo(parseISODate(e.giorno))}. Se ti serve ancora, lo ritrovi nel Cestino di Google Calendar per 30 giorni.</p>
    <div class="evt-domanda" role="group" aria-labelledby="evt-dom">${serie
      ? b('evt-togli-ok', 'una', 'btn-danger-pieno', 'Sì, solo questa volta') + b('evt-togli-ok', 'serie', 'btn-secondary', 'Sì, tutta la serie')
      : b('evt-togli-ok', 'una', 'btn-danger-pieno', 'Sì, toglilo')}${b('evt-indietro', '', 'btn-ghost', 'No, lascialo')}</div>`;
}
async function togliDalCalendario(id, tutte) {
  const e = eventoPerId(id);
  if (!e || !e.orgIo || (e.nomiInvitati || []).length) return;   // mai un invito, mai con invitati (avviserebbe tutti)
  const bersaglio = tutte && e.serie ? e.serie : e.id;
  try { await gcalFetchUtente(`/calendars/${encodeURIComponent(e.calId)}/events/${encodeURIComponent(bersaglio)}?sendUpdates=none`, 'DELETE'); }   // comando di Roby
  catch (err) { if (!nonEsiste(err)) { showToast('Non riesco a toglierlo: ' + err.message, 'error'); return; } }
  const via = x => bersaglio === e.serie ? (x.serie || x.id) !== e.serie : x.id !== e.id;
  ui.eventi = Object.fromEntries(Object.entries(ui.eventi).map(([k, lista]) => [k, Array.isArray(lista) ? lista.filter(via) : lista]));
  if (typeof salvaCacheEventi === 'function') { try { salvaCacheEventi(); } catch (_) { /* niente */ } }
  closeModal('evtOverlay');
  render();
  showToast(`Tolto dal calendario: ${e.titolo}`, 'success');
}
Object.assign(AZIONI, {
  'evt-nascondi': el => { const e = eventoPerId(el.dataset.evt); if (e && (e.ricorrente || e.serie)) domandaFoglioEvento(el.dataset.evt, 'nascondi'); else nascondiEvento(el.dataset.evt, false); },
  'evt-nascondi-ok': el => nascondiEvento(el.dataset.evt, el.dataset.v === 'serie'),
  'evt-togli-cal': el => domandaFoglioEvento(el.dataset.evt, 'togli'),
  'evt-togli-ok': el => togliDalCalendario(el.dataset.evt, el.dataset.v === 'serie'),
  'evt-indietro': el => disegnaFoglioEvento(el.dataset.evt)
});

// --- Elimina una cosa, con Annulla ---
const _loadBattlePlanV11 = loadBattlePlan;
loadBattlePlan = async function () {
  const r = await _loadBattlePlanV11.apply(this, arguments);
  if (state.eliminati && state.eliminati.size) state.bpItems = (state.bpItems || []).filter(i => !i.ciclo_id || !state.eliminati.has(i.ciclo_id));
  return r;
};
// la cosa e i suoi passi
const conIPassi = id => [id, ...state.cicli.filter(c => c.parent_id === id).map(c => c.id)];
async function azioneElimina(id) {
  const c = ciclo(id);
  if (!c) return;
  if (!state.eliminatoColOk) {   // colonna non ancora creata: come prima, definitiva e con la domanda
    if (!confirm(`Eliminare definitivamente «${c.title}»? Non si può annullare.`)) return;
    try { await removeCiclo(id); state.cicli = state.cicli.filter(x => x.id !== id); render(); showToast('Eliminata', 'info'); }
    catch (e) { showToast('Errore: ' + e.message, 'error'); }
    return;
  }
  const ids = conIPassi(id), copie = state.cicli.filter(x => ids.includes(x.id));
  const quando = new Date().toISOString();
  state.cicli = state.cicli.filter(x => !ids.includes(x.id));
  ids.forEach(x => state.eliminati.add(x));
  render();
  try {
    const { error } = await db.from('cicli').update({ eliminato_at: quando }).in('id', ids);
    if (error) throw error;
  } catch (e) {
    state.cicli = [...copie, ...state.cicli];
    ids.forEach(x => state.eliminati.delete(x));
    render();
    showToast('Non riesco a eliminarla: ' + e.message, 'error');
    return;
  }
  const passi = ids.length - 1;
  showToast(`Eliminata: ${c.title}${passi ? ` (con ${plurale(passi, 'passo', 'passi')})` : ''}`, 'info', { annulla: async () => {
    const { error } = await db.from('cicli').update({ eliminato_at: null }).in('id', ids);
    if (error) throw error;
    ids.forEach(x => state.eliminati.delete(x));
    state.cicli = [...copie.map(x => ({ ...x, eliminato_at: null })), ...state.cicli.filter(x => !ids.includes(x.id))];
    await reloadWeekData();
  } });
}
// il tasto c'è sempre: aperte, fatte, in Un giorno
const _apriDettaglioV11 = apriDettaglio;
apriDettaglio = function (id) {
  const r = _apriDettaglioV11.apply(this, arguments);
  const az = $('det-azioni'), c = ciclo(id);
  if (az && c && !az.querySelector('[data-act="d-elimina"]')) az.insertAdjacentHTML('beforeend', '<button type="button" class="btn btn-ghost btn-danger btn-sm det-elimina" data-act="d-elimina"><i class="ti ti-trash"></i>Elimina</button>');
  const vecchio = az && az.querySelector('[data-act="d-elimina"]:not(.det-elimina)');
  if (vecchio && state.eliminatoColOk) vecchio.innerHTML = '<i class="ti ti-trash"></i>Elimina';
  return r;
};

// all'avvio: i nascosti
const _avviaAppV11 = avviaApp;
avviaApp = function (sessione) {
  const prima = _appAvviata;
  _avviaAppV11(sessione);
  if (prima) return;
  caricaEventiNascosti().catch(err => console.warn('[Appuntamenti] nascosti:', err.message));
};

// ══════════════════════════════════════════════════════════════
