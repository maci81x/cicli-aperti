// v9 · AVVISO ALL'ORA DETTA
// Una cosa con giorno E ora (da «Ricordami», dal «+» o dal dettaglio) → al salvataggio un evento sul
// calendario «Cicli Aperti — Battle Plan»: «16.30 - titolo», promemoria all'ora e 10 minuti prima.
// L'evento ha la proprietà privata cicli_aperti = 'avviso': si sposta con la cosa, si cancella quando è chiusa.
// È l'unica scrittura automatica su Calendar.
// ══════════════════════════════════════════════════════════════
const AVVISO = { TIPO: 'avviso', DURATA: 30, PRIMA_MIN: 10, ATTESA_MS: 500,
  CAMPI: ['pianificato_data', 'fascia_oraria', 'giorno_settimana', 'scheduled_time', 'scheduled_date', 'ora_inizio', 'durata_minuti', 'title'] };
// «16:30» → «16.30», «09:00» → «9»
function oraAvviso(ora) { const [h, m] = String(ora).split(':'); return `${parseInt(h, 10)}${m && m !== '00' ? '.' + m : ''}`; }
const titoloAvviso = (ora, titolo) => `${oraAvviso(ora)} - ${titolo}`;
function slotAvviso(c) {
  if (!c || c.done || isGiornaliero(c)) return null;   // una routine di ogni giorno non ha «un'ora detta»
  const s = slotBlocco(c);
  return s.data && s.ora ? { data: s.data, ora: s.ora, durata: s.durata || AVVISO.DURATA, completo: true } : null;
}
const chiaveSlot = s => s ? `${s.data} ${s.ora} ${s.durata}` : '';
function corpoAvviso(c, slot) {
  return { ...corpoEvento(c, slot), summary: titoloAvviso(slot.ora, c.title), description: `Cicli Aperti · promemoria\n${APP_URL}#ciclo=${c.id}`,
    reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 0 }, { method: 'popup', minutes: AVVISO.PRIMA_MIN }] },
    extendedProperties: { private: { cicli_aperti: AVVISO.TIPO, ciclo_id: c.id } } };
}
// l'evento collegato alla cosa, solo se l'ha creato l'app (null se non c'è o non è nostro)
async function eventoDellApp(c) {
  if (!c || !c.calendar_event_id || bloccoEsterno(c)) return null;
  try { return await gcalFetch(`${percorsoEventi(c)}/${c.calendar_event_id}`, 'GET'); }
  catch (e) { if (nonEsiste(e)) return null; throw e; }
}
// ultimo contenuto scritto per ogni avviso: uno spostamento visto due volte si scrive una volta sola
const _avvisoScritto = new Map();
const firmaAvviso = (c, slot) => `${chiaveSlot(slot)} ${c.title}`;
const eAvviso = ev => !!(ev && ev.status !== 'cancelled' && ev.extendedProperties && ev.extendedProperties.private && ev.extendedProperties.private.cicli_aperti === AVVISO.TIPO);

async function creaAvviso(id) {
  const c = ciclo(id), slot = slotAvviso(c);
  if (!slot || c.calendar_event_id) return null;
  if (new Date(isoLocale(slot.data, slot.ora)) < new Date()) return null;   // ora già passata: niente avviso
  if (!isGcalTokenValid()) { showToast('Avviso non messo: collega Google Calendar da Altro, Impostazioni', 'warn'); return null; }
  try {
    await ensureGcalCalendar();
    if (!gcal.calendarId) return null;
    const ev = await gcalFetch(percorsoEventi(c), 'POST', corpoAvviso(c, slot));
    if (!ev || !ev.id) throw new Error('Google Calendar non ha creato l\'evento');
    _avvisoScritto.set(c.id, firmaAvviso(c, slot));
    await patchCiclo(c.id, { calendar_event_id: ev.id, ...(state.calColCosaOk ? { calendar_event_cal: calDellaCosa(c) } : {}) });
    render();
    return ev.id;
  } catch (e) { showToast('Avviso non messo su Calendar: ' + e.message, 'error'); return null; }
}

// spostata: l'avviso segue la cosa (senza ora → si toglie). Per gli altri eventi resta il comportamento di prima.
const _aggiornaBloccoV9 = aggiornaBlocco;
aggiornaBlocco = async function (id) {
  const c = ciclo(id);
  if (!c || !c.calendar_event_id || c.done || bloccoEsterno(c) || !isGcalTokenValid()) return _aggiornaBloccoV9(id);
  try {
    clearTimeout(_seguiTimer.get(id)); _seguiTimer.delete(id);   // questa chiamata vale anche per quella in attesa
    const slot = slotAvviso(c);
    if (slot && _avvisoScritto.get(id) === firmaAvviso(c, slot)) return;
    await ensureGcalCalendar();
    if (!gcal.calendarId) return;
    const ev = await eventoDellApp(c);
    if (!eAvviso(ev)) return _aggiornaBloccoV9(id);
    if (!slot) { _avvisoScritto.delete(id); await togliBlocco(c, true); render(); return; }
    _avvisoScritto.set(id, firmaAvviso(c, slot));
    await gcalFetch(`${percorsoEventi(c)}/${c.calendar_event_id}`, 'PATCH', corpoAvviso(c, slot));
  } catch (e) { console.warn('[GCal] aggiorna avviso:', e.message); }
};

// Ogni spostamento passa da patchCiclo o upsertOverride: dopo un attimo l'evento si allinea (una volta sola)
const _seguiTimer = new Map();
function seguiCosa(id) {
  const c = ciclo(id);
  if (!c || !c.calendar_event_id) return;
  clearTimeout(_seguiTimer.get(id));
  _seguiTimer.set(id, setTimeout(() => { _seguiTimer.delete(id); aggiornaBlocco(id); }, AVVISO.ATTESA_MS));
}
const _patchCicloV9 = patchCiclo;
patchCiclo = async function (id, patch) {
  const r = await _patchCicloV9(id, patch);
  if (patch && AVVISO.CAMPI.some(k => k in patch)) seguiCosa(id);
  return r;
};
const _upsertOverrideV9 = upsertOverride;
upsertOverride = async function (cicloId, ...resto) {
  const r = await _upsertOverrideV9(cicloId, ...resto);
  seguiCosa(cicloId);
  return r;
};
// tutte le chiusure passano da flipDone
const _flipDoneV9 = flipDone;
flipDone = async function (id, currentDone) {
  const prima = ciclo(id);
  const r = await _flipDoneV9(id, currentDone);
  if (!currentDone && prima && prima.calendar_event_id) chiudiBlocco(ciclo(id) || prima);
  return r;
};
// dettaglio: giorno e ora nuovi (o cambiati) e nessun evento → avviso
const _salvaDalFoglioV9 = salvaDalFoglio;
salvaDalFoglio = async function () {
  const prima = editingId ? ciclo(editingId) : null, idsPrima = new Set(state.cicli.map(c => c.id));
  const slotPrima = chiaveSlot(slotAvviso(prima));
  const r = await _salvaDalFoglioV9.apply(this, arguments);
  const dopo = prima ? ciclo(prima.id) : state.cicli.find(c => !idsPrima.has(c.id));
  const s = slotAvviso(dopo);
  if (dopo && s && !dopo.calendar_event_id && chiaveSlot(s) !== slotPrima) await creaAvviso(dopo.id);
  return r;
};
const _confermaPianificazioneV9 = confermaPianificazione;
confermaPianificazione = async function () {
  const id = _pfCicloId, prima = id ? ciclo(id) : null;
  const slotPrima = chiaveSlot(slotAvviso(prima));
  const r = await _confermaPianificazioneV9.apply(this, arguments);
  const dopo = id ? ciclo(id) : null, s = slotAvviso(dopo);
  if (dopo && s && !dopo.calendar_event_id && chiaveSlot(s) !== slotPrima) await creaAvviso(dopo.id);
  return r;
};

// «Avvisami» nel riepilogo: attiva di default quando c'è l'ora (e Google è collegato)
const puoAvvisare = v => !!(v && v.data && v.ora && v.q !== 3 && gcalEraCollegato());
function spuntaAvviso(v, attr) {
  return puoAvvisare(v) ? `<label class="check rap-avvisa"><input type="checkbox" ${attr}${v.avvisa ? ' checked' : ''}><span>Avvisami alle ${v.ora}</span></label>` : '';
}
const _vociDaRigheV9 = vociDaRighe;
vociDaRighe = function (righe, r) {
  const no = (r && r.noAvviso) || [];
  return _vociDaRigheV9(righe, r).map(v => ({ ...v, avvisa: puoAvvisare(v) && !no.includes(v.testo) }));
};
ui.catturaNoAvviso = false;
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'cattura-avvisa') { ui.catturaNoAvviso = !t.checked; return; }
  if (!t.matches || !t.matches('#rapido-anteprima [data-avvisa]')) return;
  const v = vociDaRighe(righeCampo($('rapido-testo').value), ui.rapido)[+t.dataset.avvisa];
  if (!v) return;
  const no = (ui.rapido.noAvviso || []).filter(x => x !== v.testo);
  ui.rapido = { ...ui.rapido, noAvviso: t.checked ? no : [...no, v.testo] };
});
// i campi ascoltavano le versioni di prima: si ridisegna anche con la spunta
$('rapido-testo').addEventListener('input', () => disegnaAnteprima());
$('cattura-testo').addEventListener('input', () => disegnaAnteprimaCattura());
const _apriRapidoV9 = apriRapido;
apriRapido = function () { ui.rapido = { ...(ui.rapido || {}), noAvviso: [] }; _apriRapidoV9(); };
// dopo il salvataggio: un avviso per ogni cosa con giorno e ora e la spunta attiva
const _aggiungiFrasiV9 = aggiungiFrasi;
aggiungiFrasi = async function (voci, r) {
  const idsPrima = new Set(state.cicli.map(c => c.id));
  const nuove = await _aggiungiFrasiV9(voci, r);
  if (!nuove || r && r.cusc) return nuove;
  const conAvviso = voci.filter(v => v.avvisa && !ui._catturaNoAvviso);
  for (const v of conAvviso) {
    const c = nuove.find(n => !idsPrima.has(n.id) && n.title === v.title && !n.parent_id);
    if (c) await creaAvviso(c.id);
  }
  return nuove;
};

// ══════════════════════════════════════════════════════════════
