// v4 · BLOCCA IN AGENDA: un evento sul calendario «Cicli Aperti — Battle Plan»
// L'id resta in cicli.calendar_event_id: lo usa anche la riconciliazione.
// ══════════════════════════════════════════════════════════════
async function calendarPronto() {
  if (!isGcalTokenValid()) { showToast('Prima collega Google Calendar da Altro, Impostazioni', 'warn'); return false; }
  if (ui.calEventColOk === false) { showToast('Manca la colonna calendar_event_id: vedi Impostazioni', 'warn'); return false; }
  await ensureGcalCalendar();
  if (!gcal.calendarId) { showToast('Non trovo il calendario dove scrivo: controlla in Impostazioni', 'error'); return false; }
  return true;
}
// Giorno, ora e durata di una riga del piano della settimana in vista (null se manca il giorno o l'ora).
function slotDiItem(item) {
  const idx = GIORNI.findIndex(g => g.key === item.giorno), ora = bpOra(item);
  if (idx < 0 || !ora) return null;
  return { data: toISODate(dataDelGiorno(idx)), ora, durata: bpDurata(item), completo: true };
}
// Dove sta una cosa: prima la riga del piano, poi la sua data in agenda e la sua ora.
function slotBlocco(c) {
  const item = state.bp ? itemDelPiano(c.id) : null;
  const daItem = item && slotDiItem(item);
  if (daItem) return daItem;
  const sl = agendaSlotForWeek(c, state.week, state.year);
  const idx = sl.giorno ? GIORNI.findIndex(g => g.key === sl.giorno) : -1;
  const data = idx >= 0 ? toISODate(dataDelGiorno(idx)) : c.pianificato_data || null;
  const ora = (item && bpOra(item)) || oraDi(c);
  const durata = (item && item.durata_prevista) || c.durata_minuti || null;
  return { data, ora, durata, completo: !!(data && ora && durata) };
}
const nonEsiste = e => /not found|deleted|404|410/i.test(String(e && e.message));
// 27/10 · ogni cosa sul suo calendario: personali sul Privato (se si può scrivere), le altre su quello di scrittura
function percorsoEventi(c) { return `/calendars/${encodeURIComponent(calDellaCosa(c))}/events`; }
// Aggiorna l'evento esistente. false = su Google non c'è più (l'id viene tolto dalla cosa).
async function scriviEvento(c, slot, eventId) {
  try { await gcalFetch(`${percorsoEventi(c)}/${eventId}`, 'PATCH', corpoEvento(c, slot)); return true; }
  catch (e) { if (nonEsiste(e)) { await patchCiclo(c.id, { calendar_event_id: null }); return false; } throw e; }
}
async function creaBlocco(c, slot, silenzioso) {
  const ev = await gcalFetch(percorsoEventi(c), 'POST', corpoEvento(c, slot));
  if (!ev || !ev.id) throw new Error('Google Calendar non ha creato l\'evento');
  await patchCiclo(c.id, { calendar_event_id: ev.id, ...(state.calColCosaOk ? { calendar_event_cal: calDellaCosa(c) } : {}) });
  if (silenzioso) return ev.id;
  render();
  showToast(`Bloccata in agenda: ${fmtGiorno(parseISODate(slot.data))}, ${slot.ora}–${oraFine(slot.ora, slot.durata)}`, 'success', { annulla: () => togliBlocco(ciclo(c.id), true) });
  return ev.id;
}
async function togliBlocco(c, silenzioso) {
  if (!c || !c.calendar_event_id) return;
  try { await gcalFetch(`${percorsoEventi(c)}/${c.calendar_event_id}`, 'DELETE'); }
  catch (e) { if (!nonEsiste(e)) throw e; }
  await patchCiclo(c.id, { calendar_event_id: null });
  if (!silenzioso) { render(); showToast('Tolta dall\'agenda', 'info'); }
}
// Azione rapida: blocca (o sblocca). Se manca il giorno, l'ora o la durata, si chiedono nel foglio.
async function azioneBlocca(id) {
  const c = ciclo(id);
  if (!c) return;
  if (!(await calendarPronto())) return;
  try {
    if (c.calendar_event_id) { await togliBlocco(c); return; }
    const slot = slotBlocco(c);
    if (slot.completo) await creaBlocco(c, slot);
    else apriBlocca(id, slot);
  } catch (e) { showToast('Google Calendar: ' + e.message, 'error'); }
}
function apriBlocca(id, slot) {
  const c = ciclo(id);
  ui.blocca = id;
  $('blocca-cosa').textContent = c.title || '';
  $('blocca-data').value = slot.data || oggiLocale();
  $('blocca-data').min = oggiLocale();
  $('blocca-ora').value = slot.ora || '';
  const dur = String(slot.durata || BP_DURATA_DEFAULT), sel = $('blocca-durata');
  sel.value = [...sel.options].some(o => o.value === dur) ? dur : String(BP_DURATA_DEFAULT);
  $('blocca-errore').hidden = true;
  $('bloccaOverlay').classList.add('open');
  setTimeout(() => (slot.ora ? $('blocca-data') : $('blocca-ora')).focus(), 150);
}
// Dal foglio: scrive giorno e ora sulla cosa (e sulla riga del piano se è in questa settimana), poi crea l'evento.
async function salvaBlocca() {
  const c = ciclo(ui.blocca);
  if (!c) return;
  const data = $('blocca-data').value, ora = $('blocca-ora').value, durata = parseInt($('blocca-durata').value, 10) || BP_DURATA_DEFAULT;
  const errore = msg => { const e = $('blocca-errore'); e.textContent = msg; e.hidden = false; };
  if (!data) { errore('Scegli il giorno'); return; }
  if (!ora) { errore('Scegli l\'ora'); $('blocca-ora').focus(); return; }
  try {
    const giorno = parseISODate(data), w = isoWeekParts(giorno);
    const item = state.bp && w.week === state.week && w.year === state.year ? itemDelPiano(c.id) : null;
    if (item) {
      const patch = { giorno: giornoKeyDi(giorno), ora_prevista: ora, durata_prevista: durata, fascia: fasciaDi(null, ora) };
      const { error } = await db.from('battle_plan_items').update(patch).eq('id', item.id);
      if (error) throw error;
      state.bpItems = state.bpItems.map(i => i.id === item.id ? { ...i, ...patch } : i);
    }
    if (ripetizioneDi(c) === 'nessuna' && state.agendaColsOk) await pianificaInData(c, giorno, fasciaDi(null, ora));
    if (state.ritualiColsOk) await patchCiclo(c.id, { ora_inizio: ora, durata_minuti: durata });
    closeModal('bloccaOverlay');
    await creaBlocco(ciclo(c.id), { data, ora, durata, completo: true });
  } catch (e) { errore('Non riesco: ' + e.message); }
}
// Dopo uno spostamento o una modifica: l'evento segue la cosa. Non fa niente se la cosa non è bloccata.
async function aggiornaBlocco(id) {
  const c = ciclo(id);
  if (!c || !c.calendar_event_id || c.done || !isGcalTokenValid()) return;
  try {
    await ensureGcalCalendar();
    const slot = slotBlocco(c);
    if (gcal.calendarId && slot.completo) await scriviEvento(c, slot, c.calendar_event_id);
  } catch (e) { console.warn('[GCal] aggiorna blocco:', e.message); }
}
function allineaBlocchi() { bpItemsValidi().forEach(i => { if (bpCiclo(i).calendar_event_id) aggiornaBlocco(i.ciclo_id); }); }

// ══════════════════════════════════════════════════════════════
