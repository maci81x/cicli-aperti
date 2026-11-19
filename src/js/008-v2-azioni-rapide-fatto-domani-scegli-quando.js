// v2 · AZIONI RAPIDE (Fatto · Domani · Scegli quando · Ripeti · Lascia stare)
// Ogni azione aggiorna Supabase, lo stato locale e mostra un toast con «Annulla».
// ══════════════════════════════════════════════════════════════
async function patchCiclo(id, patch) {
  const { error } = await db.from('cicli').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
  state.cicli = state.cicli.map(c => c.id === id ? { ...c, ...patch } : c);
}
function campi(c, chiavi) { return Object.fromEntries(chiavi.map(k => [k, c[k] === undefined ? null : c[k]])); }

async function segnaItemPiano(item, fatto) {
  const quando = fatto ? new Date().toISOString() : null;
  const { error } = await db.from('battle_plan_items').update({ completato: fatto, completato_at: quando }).eq('id', item.id);
  if (error) throw error;
  state.bpItems = state.bpItems.map(i => i.id === item.id ? { ...i, completato: fatto, completato_at: quando } : i);
}

function prossimaData(iso, rip) {
  const base = parseISODate(iso) || new Date();
  const p = RIP_PASSO[rip];
  if (!p) return null;
  if (p.giorni) { const d = new Date(base); d.setDate(d.getDate() + p.giorni); return d; }
  return addMesi(base, p.mesi);
}

// Una cosa che si ripete non sparisce: si chiude questa e nasce la prossima,
// con la data (e la scadenza, se c'è) spostate di un passo.
async function chiudiERicrea(c) {
  const rip = ripetizioneDi(c);
  // 28/10 · la prossima volta è sempre dopo oggi: se era rimasta indietro di settimane non torna «lun 19 ott»
  let prossima = prossimaData(c.pianificato_data || c.scheduled_date || oggiLocale(), rip), passi = 1;
  while (prossima && toISODate(prossima) <= oggiLocale() && passi < 400) { prossima = prossimaData(toISODate(prossima), rip); passi++; }
  const scadenzaDopo = iso => { let d = parseISODate(iso); for (let i = 0; i < passi && d; i++) d = prossimaData(toISODate(d), rip); return d; };
  const now = new Date().toISOString();
  const { id, created_at, updated_at, google_event_id, _soloProssima, ...resto } = c;
  const nuova = {
    ...resto, done: false, execution_status: 'planned', sync_status: 'pending', google_event_id: null, chiuso_at: null,
    ...(resto.calendar_event_id !== undefined ? { calendar_event_id: null } : {}),   // l'evento bloccato era di questa volta
    pianificato_data: toISODate(prossima), scheduled_date: toISODate(prossima),
    settimana_anno: isoWeekStr(prossima), week: isoWeekParts(prossima).week, year: prossima.getFullYear(),
    due_date: c.due_date ? toISODate(scadenzaDopo(c.due_date)) : null,
    created_at: now, updated_at: now
  };
  const { data, error } = await db.from('cicli').insert(nuova).select();
  if (error) throw error;
  const creata = data && data[0];
  if (c._soloProssima) { state.cicli = [creata, ...state.cicli].filter(Boolean); return creata; }
  await flipDone(c.id, false);
  state.cicli = [creata, ...state.cicli.map(x => x.id === c.id ? { ...x, done: true, execution_status: 'done' } : x)].filter(Boolean);
  return creata;
}
// 28/10 · la prossima volta di una cosa che si ripete, senza toccare questa (è già fatta)
const creaProssima = c => chiudiERicrea({ ...c, done: false, _soloProssima: true });
function dataProssima(c) {
  const rip = ripetizioneDi(c);
  let d = prossimaData(c.pianificato_data || c.scheduled_date || oggiLocale(), rip), n = 0;
  while (d && toISODate(d) <= oggiLocale() && n++ < 400) d = prossimaData(toISODate(d), rip);
  return d;
}

async function azioneFatto(id) {
  const c = ciclo(id);
  if (!c) return;
  try {
    // routine di ogni giorno: fatta per oggi, domani torna
    if (isGiornaliero(c)) {
      const era = rituraleFattoOggi(id);
      await inSilenzio(() => toggleRitualeOggi(id));
      render();
      showToast(era ? 'Riaperta per oggi' : `Fatta per oggi: ${c.title}`, 'success', { annulla: () => inSilenzio(() => toggleRitualeOggi(id)) });
      return;
    }
    const item = state.bp ? itemDelPiano(id) : null;
    const eraFatta = !!c.done || !!(item && item.completato);

    if (eraFatta) {                                   // togliere la spunta: riapre
      if (item) await segnaItemPiano(item, false);
      if (c.done) { await flipDone(id, true); state.cicli = state.cicli.map(x => x.id === id ? { ...x, done: false, execution_status: 'planned' } : x); }
      render();
      showToast(`Riaperta: ${c.title}`, 'info');
      return;
    }

    if (ripetizioneDi(c) !== 'nessuna') {             // 28/10 · settimanale, mensile…: sparisce, e si chiede se rimetterla
      if (item) await inSilenzio(() => toggleBpItem(item.id));
      else { await flipDone(id, false); state.cicli = state.cicli.map(x => x.id === id ? { ...x, done: true, execution_status: 'done' } : x); }
      render();
      const quando = dataProssima(c);
      showToast(`Fatta: ${c.title}. Si ripete: la rimetto ${quando ? fmtGiorno(quando) : 'la prossima volta'}?`, 'success', {
        etichetta: 'Sì, rimettila', durata: 12000,
        annulla: async () => { const nuova = await creaProssima(c); showToast(`Rimessa: ${fmtGiorno(parseISODate(nuova.pianificato_data))}`, 'success'); },
        altre: [{ etichetta: 'Annulla', fn: async () => {
          if (item) await inSilenzio(() => toggleBpItem(item.id));
          else { await flipDone(id, true); state.cicli = state.cicli.map(x => x.id === id ? { ...x, done: false, execution_status: 'planned' } : x); }
        } }] });
      return;
    }

    if (item) await inSilenzio(() => toggleBpItem(item.id));   // chiude anche il ciclo
    else { await flipDone(id, false); state.cicli = state.cicli.map(x => x.id === id ? { ...x, done: true, execution_status: 'done' } : x); }
    render();
    showToast(`Fatta: ${c.title}`, 'success', { annulla: async () => {
      if (item) await inSilenzio(() => toggleBpItem(item.id));
      else { await flipDone(id, true); state.cicli = state.cicli.map(x => x.id === id ? { ...x, done: false, execution_status: 'planned' } : x); }
    }, durata: 8000, altre: [{ etichetta: '+ Seguito', fn: () => apriSeguito(c) }] });
  } catch (e) { showToast('Errore: ' + e.message, 'error'); render(); }
}

async function upsertOverride(cicloId, w, giorno, fascia) {
  const payload = { ciclo_id: cicloId, settimana: w.week, anno: w.year, giorno_settimana: giorno, fascia_oraria: fascia };
  const { data, error } = await db.from('agenda_override').upsert(payload, { onConflict: 'ciclo_id,settimana,anno' }).select();
  if (error) throw error;
  const saved = (data && data[0]) || payload;
  if (w.week === state.week && w.year === state.year) {
    state.agendaOverrides = [...state.agendaOverrides.filter(o => !(o.ciclo_id === cicloId && o.settimana === w.week && o.anno === w.year)), saved];
  }
  ui.ovMese = null;
  return saved;
}
async function togliOverride(cicloId, w) {
  await db.from('agenda_override').delete().eq('ciclo_id', cicloId).eq('settimana', w.week).eq('anno', w.year);
  state.agendaOverrides = state.agendaOverrides.filter(o => !(o.ciclo_id === cicloId && o.settimana === w.week && o.anno === w.year));
  ui.ovMese = null;
}

// Mette una cosa in un giorno preciso: la data (pianificato_data) e l'eccezione della settimana di quel giorno.
// Il giorno fisso (giorno_settimana) NON si scrive qui: si imposta solo da «Giorno fisso» nel dettaglio.
async function pianificaInData(c, data, fascia) {
  const giorno = giornoKeyDi(data), w = isoWeekParts(data);
  const f = fascia || c.fascia_oraria || 'mattina';
  const patch = { fascia_oraria: f };
  if (state.pianificaColsOk) patch.pianificato_data = toISODate(data);
  if (isParcheggiato(c) && state.parcheggioColsOk) { patch.parcheggiato = false; patch.parcheggiato_at = null; }
  await patchCiclo(c.id, patch);
  if (state.agendaTableOk) await upsertOverride(c.id, w, giorno, f);
}

// Domani: sposta al giorno dopo, stesso momento. `daISO` è il giorno in cui la riga è mostrata.
async function azioneDomani(id, daISO) {
  const c = ciclo(id);
  if (!c) return;
  if (isGiornaliero(c)) { showToast('Una routine di ogni giorno c\'è già anche domani', 'info'); return; }
  if (!state.agendaColsOk) { showToast('Migration agenda non applicata', 'error'); return; }
  const da = parseISODate(daISO) || new Date();
  const a = new Date(da); a.setDate(a.getDate() + 1);
  const wDa = isoWeekParts(da), wA = isoWeekParts(a);
  const item = state.bp && wA.week === state.week && wA.year === state.year ? itemDelPiano(id) : null;
  const slot = agendaSlotForWeek(c, wDa.week, wDa.year);
  const fascia = (item && item.fascia) || slot.fascia || c.fascia_oraria || 'mattina';
  const prima = campi(c, ['giorno_settimana', 'fascia_oraria', 'pianificato_data', 'parcheggiato', 'parcheggiato_at']);
  const ovPrima = state.agendaOverrides.find(o => o.ciclo_id === id && o.settimana === wA.week && o.anno === wA.year) || null;
  const itemPrima = item ? { giorno: item.giorno, fascia: item.fascia } : null;
  const ricorrente = ripetizioneDi(c) !== 'nessuna';
  try {
    if (ricorrente) await upsertOverride(id, wA, giornoKeyDi(a), fascia);   // solo questa volta
    else await pianificaInData(c, a, fascia);
    if (item) {
      const { error } = await db.from('battle_plan_items').update({ giorno: giornoKeyDi(a), fascia }).eq('id', item.id);
      if (error) throw error;
      state.bpItems = state.bpItems.map(i => i.id === item.id ? { ...i, giorno: giornoKeyDi(a), fascia } : i);
    }
    render();
    aggiornaBlocco(id);
    showToast(`Spostata a ${fmtGiorno(a)}`, 'success', { annulla: async () => {
      if (!ricorrente) await patchCiclo(id, prima);
      if (ovPrima) await upsertOverride(id, wA, ovPrima.giorno_settimana, ovPrima.fascia_oraria); else await togliOverride(id, wA);
      if (item && itemPrima) {
        await db.from('battle_plan_items').update(itemPrima).eq('id', item.id);
        state.bpItems = state.bpItems.map(i => i.id === item.id ? { ...i, ...itemPrima } : i);
      }
      aggiornaBlocco(id);
    } });
  } catch (e) { showToast('Errore: ' + e.message, 'error'); render(); }
}

function azioneQuando(id, evidenziaMesi) {
  openPianificaModal(id);
  $('pf-save').textContent = 'Pianifica';
  document.querySelectorAll('#pianificaOverlay .pf-opt[data-quando]').forEach(b =>
    b.classList.toggle('suggerito', !!evidenziaMesi && (b.dataset.quando === 'mese1' || b.dataset.quando === 'mese3')));
  if (evidenziaMesi) pfSelectQuando('mese1');
}

// Lascia stare: diventa «Lascia stare» (Q4) e va in Un giorno.
async function azioneLascia(id) {
  const c = ciclo(id);
  if (!c) return;
  if (!state.parcheggioColsOk) { showToast('Migration parcheggio non applicata', 'error'); return; }
  const prima = campi(c, ['q', 'parcheggiato', 'parcheggiato_at']);
  try {
    await patchCiclo(id, { q: 4, parcheggiato: true, parcheggiato_at: new Date().toISOString() });
    render();
    showToast('Spostata in Un giorno', 'success', { annulla: () => patchCiclo(id, prima) });
  } catch (e) { showToast('Errore: ' + e.message, 'error'); }
}

async function azioneRiattiva(id) {
  await inSilenzio(() => riattivaCiclo(id));
  showToast('Tornata tra le cose aperte', 'success', { annulla: () => patchCiclo(id, { parcheggiato: true, parcheggiato_at: new Date().toISOString() }) });
}

async function azioneElimina(id) {
  const c = ciclo(id);
  if (!c || !confirm(`Eliminare definitivamente «${c.title}»? Non si può annullare.`)) return;
  try {
    await removeCiclo(id);
    state.cicli = state.cicli.filter(x => x.id !== id);
    render();
    showToast('Eliminata', 'info');
  } catch (e) { showToast('Errore: ' + e.message, 'error'); }
}

// --- Ripeti ---
function apriRipeti(id) {
  const c = ciclo(id);
  if (!c) return;
  ui.rip = { id, v: ripetizioneDi(c) };
  $('rip-ciclo').textContent = c.title || '';
  $('rip-ora').value = formatOra(c.ora_inizio) || '';
  $('rip-durata').value = ['15', '30', '45', '60', '90', '120'].includes(String(c.durata_minuti)) ? String(c.durata_minuti) : '30';
  $('rip-errore').hidden = true;
  $('rip-data').value = c.pianificato_data || '';            // 22/10 · il giorno lo sceglie Roby, non più «oggi»
  $('rip-ora-cosa').value = formatOra(c.scheduled_time) || '';
  impostaScelta('ripeti', ui.rip.v);
  $('ripetiOverlay').classList.add('open');
}
function impostaScelta(nome, v) {
  document.querySelectorAll(`[data-scelta="${nome}"] button`).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
  if (nome === 'ripeti') { ui.rip.v = v; $('rip-oradurata').hidden = v !== 'giornaliera'; $('rip-quando').hidden = v === 'giornaliera' || v === 'nessuna'; }
  if (nome === 'quando') ui.nuovoQuando = v;
  if (nome === 'cat-ctx') ui.cat.ctx = v;
  if (nome === 'onb-modo') ui.onbModo = v;
}
async function salvaRipeti() {
  const c = ciclo(ui.rip.id), v = ui.rip.v;
  if (!c) return;
  const giornaliera = v === 'giornaliera';
  if (giornaliera && !state.ritualiColsOk) { showToast('Migration rituali non applicata', 'error'); return; }
  const ora = $('rip-ora').value || null;
  if (giornaliera && !ora) { const e = $('rip-errore'); e.textContent = 'Per una routine di ogni giorno serve l\'ora'; e.hidden = false; $('rip-ora').focus(); return; }
  const chiavi = ['pianificato_ripetizione', 'ricorrenza', 'pianificato_data', 'giorno_settimana', 'fascia_oraria', 'ora_inizio', 'durata_minuti', 'scheduled_time'];
  const prima = campi(c, chiavi);
  const patch = { ricorrenza: v };
  const daQuando = $('rip-data').value || null, oraCosa = $('rip-ora-cosa').value || null;
  if (!giornaliera && v !== 'nessuna' && !daQuando) { const e = $('rip-errore'); e.textContent = 'Scegli il primo giorno'; e.hidden = false; $('rip-data').focus(); return; }
  if (state.pianificaColsOk) {
    patch.pianificato_ripetizione = RIP_DB(v);
    if (!giornaliera && v !== 'nessuna') { patch.pianificato_data = daQuando; patch.scheduled_time = oraCosa; }
  }
  if (giornaliera) { patch.giorno_settimana = null; patch.fascia_oraria = null; patch.pianificato_data = todayISO(); patch.ora_inizio = ora; patch.durata_minuti = parseInt($('rip-durata').value, 10) || 30; }
  try {
    await patchCiclo(c.id, patch);
    closeModal('ripetiOverlay');
    render();
    showToast(v === 'nessuna' ? 'Non si ripete più' : `Si ripete: ${RIP_LABELS[v].toLowerCase()}`, 'success', { annulla: () => patchCiclo(c.id, prima) });
  } catch (e) { showToast('Errore: ' + e.message, 'error'); }
}

// ══════════════════════════════════════════════════════════════
