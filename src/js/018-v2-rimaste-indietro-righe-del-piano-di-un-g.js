// v2 · RIMASTE INDIETRO: righe del piano di un giorno passato non fatte
// Si cercano nei piani attivi o in bozza delle ultime settimane (quelli chiusi
// hanno già avuto la loro revisione). Niente si sposta da solo: si sceglie riga per riga.
// ══════════════════════════════════════════════════════════════
const CARRY = { LS: 'carry_dismissed', SETTIMANE: 4 };
ui.carry = [];          // [{ item, plan }]
ui.carryScegli = null;  // item con i chip dei giorni aperti

function carryData(item, plan) {
  const idx = GIORNI.findIndex(g => g.key === item.giorno);
  return idx < 0 ? null : bpDataGiorno(plan.settimana, plan.anno, idx);
}
// senza giorno: rimasta indietro solo quando la sua settimana è finita
function carryERimasta(item, plan) {
  if (item.completato) return false;
  return giornoPassato(carryData(item, plan) || bpDataGiorno(plan.settimana, plan.anno, 6));
}

async function caricaRimaste() {
  if (!state.bpTableOk) return;
  try {
    const cur = bpSettimanaCorrente(), inizio = getWeekStart(cur.week, cur.year);
    const limite = new Date(inizio); limite.setDate(limite.getDate() - 7 * CARRY.SETTIMANE);
    const { data: piani, error } = await db.from('battle_plan').select('id,settimana,anno,stato').in('stato', ['attivo', 'bozza']);
    if (error) throw error;
    const validi = (piani || []).filter(p => { const d = getWeekStart(p.settimana, p.anno); return d >= limite && d <= inizio; });
    if (!validi.length) { ui.carry = []; render(); return; }
    const { data: items, error: e2 } = await db.from('battle_plan_items').select('*').in('battle_plan_id', validi.map(p => p.id)).eq('completato', false);
    if (e2) throw e2;
    const perId = new Map(validi.map(p => [p.id, p]));
    ui.carry = (items || []).map(item => ({ item, plan: perId.get(item.battle_plan_id) })).filter(r => carryERimasta(r.item, r.plan));
    render();
  } catch (e) { console.warn('[Rimaste indietro] lettura:', e.message); }
}

// Quelle da mostrare adesso: il piano della settimana in vista (state.bpItems) è più fresco di ui.carry.
function rimasteVisibili() {
  return ui.carry.filter(({ item, plan }) => {
    const c = ciclo(item.ciclo_id);
    if (!c || c.done || isParcheggiato(c) || isGiornaliero(c) || !vedi(c.ctx)) return false;
    if (state.bp && state.bp.id === plan.id) {
      const fresco = state.bpItems.find(i => i.id === item.id);
      return !!fresco && !fresco.completato && fresco.giorno === item.giorno;
    }
    return true;
  }).sort((a, b) => (carryData(a.item, a.plan) || bpDataGiorno(a.plan.settimana, a.plan.anno, 7)) - (carryData(b.item, b.plan) || bpDataGiorno(b.plan.settimana, b.plan.anno, 7)));
}

function carryNascosto() { return localStorage.getItem(CARRY.LS) === oggiLocale(); }

function bloccoRimaste() {
  const lista = rimasteVisibili();
  if (!lista.length || carryNascosto()) return '';
  const righe = lista.map(({ item, plan }) => {
    const c = ciclo(item.ciclo_id), d = carryData(item, plan);
    const era = d ? `era ${d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric' })}` : `era nella settimana del ${fmtCorta(getWeekStart(plan.settimana, plan.anno))}`;
    const aperto = ui.carryScegli === item.id;
    const chip = (v, testo, extra) => `<button type="button" class="chip" data-act="carry" data-v="${v}" data-item="${item.id}"${extra || ''}>${testo}</button>`;
    const giorni = aperto ? `<div class="carry-giorni"><div class="gchips" role="group" aria-label="Giorno di questa settimana">${GIORNI.map((g, idx) => {
        const dd = bpDataGiorno(bpSettimanaCorrente().week, bpSettimanaCorrente().year, idx);
        return `<button type="button" class="gchip" data-act="carry" data-v="giorno" data-g="${idx}" data-item="${item.id}" aria-label="${g.label} ${dd.getDate()}"${giornoPassato(dd) ? ' disabled' : ''}>${g.label.slice(0, 1)}</button>`;
      }).join('')}</div>${chip('prossima', 'Prossima settimana')}</div>` : '';
    return `<div class="item carry-riga" data-id="${c.id}">
      <div class="item-row"><label class="check"><input type="checkbox" data-act="carry-fatta" aria-label="Fatta: ${esc(c.title)}"><span class="check-box">${SVG_SPUNTA}</span></label>
        <div class="carry-main"><span class="item-title">${escHtml(c.title)}</span><span class="item-meta"><span class="ritardo">${era}</span></span></div></div>
      <div class="chips chips-wrap carry-azioni" role="group" aria-label="Quando la fai">${chip('oggi', 'Oggi')}${chip('domani', 'Domani')}${chip('scegli', 'Scegli giorno', ` aria-expanded="${aperto}" aria-pressed="${aperto}"`)}${chip('lascia', 'Lascia stare')}</div>
      ${giorni}</div>`;
  }).join('');
  return `<section class="group carry" aria-label="Rimaste indietro">
    <div class="carry-h"><b>Rimaste indietro <span class="mono">(${lista.length})</span></b>
      <button type="button" class="btn btn-icon" data-act="carry-chiudi" aria-label="Chiudi per oggi" data-tip="Chiudi per oggi"><i class="ti ti-x"></i></button>
      <button type="button" class="btn btn-secondary btn-sm carry-tutte" data-act="carry-tutte"><i class="ti ti-sun"></i>Porta tutte a oggi</button></div>
    ${righe}</section>`;
}

// Piano di una settimana, creato in bozza se non c'è. `cache` evita di crearlo due volte in un giro.
async function pianoPer(w, cache) {
  const k = settKey(w.week, w.year);
  if (cache.has(k)) return cache.get(k).plan;
  const { data, error } = await db.from('battle_plan').select('*').eq('settimana', w.week).eq('anno', w.year).maybeSingle();
  if (error) throw error;
  if (data) { cache.set(k, { plan: data, creato: false }); return data; }
  const { data: nuovo, error: e2 } = await db.from('battle_plan').insert({ settimana: w.week, anno: w.year, stato: 'bozza' }).select();
  if (e2) throw e2;
  cache.set(k, { plan: nuovo[0], creato: true });
  return nuovo[0];
}

async function overrideDi(cicloId, w) {
  const { data } = await db.from('agenda_override').select('*').eq('ciclo_id', cicloId).eq('settimana', w.week).eq('anno', w.year).maybeSingle();
  return data || null;
}

// Sposta una riga rimasta indietro in un giorno (`data`) o nella prossima settimana senza giorno.
// Restituisce la funzione che rimette tutto com'era.
async function carrySposta(rec, dest, cache) {
  const { item } = rec;
  const c = ciclo(item.ciclo_id);
  const ricorrente = ripetizioneDi(c) !== 'nessuna';
  const cur = bpSettimanaCorrente();
  const w = dest.data ? isoWeekParts(dest.data) : bpSettimanaSuccessiva(cur.week, cur.year);
  const giorno = dest.data ? giornoKeyDi(dest.data) : 'settimana';
  const fascia = dest.data ? (item.fascia || c.fascia_oraria || 'mattina') : null;
  const piano = await pianoPer(w, cache);
  const annulla = [];

  // 1. la riga del piano
  if (piano.id === item.battle_plan_id) {
    await db.from('battle_plan_items').update({ giorno, fascia }).eq('id', item.id).then(r => { if (r.error) throw r.error; });
    annulla.push(() => db.from('battle_plan_items').update({ giorno: item.giorno, fascia: item.fascia }).eq('id', item.id));
  } else {
    const { data: gia } = await db.from('battle_plan_items').select('*').eq('battle_plan_id', piano.id).eq('ciclo_id', c.id).maybeSingle();
    if (gia) {   // la cosa è già nel piano di quella settimana: si aggiorna quella riga, la vecchia va via
      await db.from('battle_plan_items').update({ giorno, fascia, completato: false }).eq('id', gia.id).then(r => { if (r.error) throw r.error; });
      await db.from('battle_plan_items').delete().eq('id', item.id).then(r => { if (r.error) throw r.error; });
      annulla.push(() => db.from('battle_plan_items').update({ giorno: gia.giorno, fascia: gia.fascia, completato: gia.completato }).eq('id', gia.id));
      annulla.push(() => db.from('battle_plan_items').insert(item));
    } else {     // la riga passa al piano della nuova settimana, con lo stesso id
      await db.from('battle_plan_items').update({ battle_plan_id: piano.id, giorno, fascia }).eq('id', item.id).then(r => { if (r.error) throw r.error; });
      annulla.push(() => db.from('battle_plan_items').update({ battle_plan_id: item.battle_plan_id, giorno: item.giorno, fascia: item.fascia }).eq('id', item.id));
    }
  }

  // 2. l'agenda, come «Domani»: data della cosa + override di quella settimana
  const prima = campi(c, ['giorno_settimana', 'fascia_oraria', 'pianificato_data', 'parcheggiato', 'parcheggiato_at']);
  if (dest.data && state.agendaColsOk) {
    const ovPrima = state.agendaTableOk ? await overrideDi(c.id, w) : null;
    if (ricorrente) await upsertOverride(c.id, w, giorno, fascia);
    else await pianificaInData(c, dest.data, fascia);
    annulla.push(async () => {
      if (!ricorrente) await patchCiclo(c.id, prima);
      if (!state.agendaTableOk) return;
      if (ovPrima) await upsertOverride(c.id, w, ovPrima.giorno_settimana, ovPrima.fascia_oraria); else await togliOverride(c.id, w);
    });
  } else if (!dest.data && !ricorrente && state.pianificaColsOk && state.agendaColsOk) {
    // prossima settimana, senza giorno: la data passa al lunedì e non resta un giorno vecchio in agenda
    const wCur = { week: cur.week, year: cur.year };
    const ovPrima = state.agendaTableOk ? await overrideDi(c.id, wCur) : null;
    await patchCiclo(c.id, { pianificato_data: toISODate(getWeekStart(w.week, w.year)), giorno_settimana: null });
    if (ovPrima) await togliOverride(c.id, wCur);
    annulla.push(async () => {
      await patchCiclo(c.id, prima);
      if (ovPrima) await upsertOverride(c.id, wCur, ovPrima.giorno_settimana, ovPrima.fascia_oraria);
    });
  }
  return async () => { for (const fn of annulla.reverse()) await fn(); };
}

// Dopo uno spostamento: ricarica il piano in vista e l'elenco.
async function dopoCarry() { await loadBattlePlan(); await caricaRimaste(); render(); }

// Toglie dal piano i piani creati in bozza durante il giro, se l'utente annulla.
async function annullaPianiCreati(cache) {
  for (const { plan, creato } of cache.values()) if (creato) await db.from('battle_plan').delete().eq('id', plan.id);
}

async function azioneCarry(itemId, v, idxGiorno) {
  const rec = ui.carry.find(r => r.item.id === itemId);
  if (!rec) return;
  if (v === 'scegli') { ui.carryScegli = ui.carryScegli === itemId ? null : itemId; render(); return; }
  const c = ciclo(rec.item.ciclo_id);
  ui.carryScegli = null;
  try {
    if (v === 'lascia') {
      if (!state.parcheggioColsOk) { showToast('Migration parcheggio non applicata', 'error'); return; }
      const prima = campi(c, ['q', 'parcheggiato', 'parcheggiato_at']);
      await patchCiclo(c.id, { q: 4, parcheggiato: true, parcheggiato_at: new Date().toISOString() });
      const { error } = await db.from('battle_plan_items').delete().eq('id', itemId);
      if (error) throw error;
      ui.carry = ui.carry.filter(r => r.item.id !== itemId);
      await dopoCarry();
      showToast('Spostata in Un giorno e tolta dal piano', 'success', { annulla: async () => {
        await patchCiclo(c.id, prima);
        await db.from('battle_plan_items').insert(rec.item);
        await dopoCarry();
      } });
      return;
    }
    const oggi = new Date(); oggi.setHours(0, 0, 0, 0);
    const cur = bpSettimanaCorrente();
    const data = v === 'oggi' ? oggi
      : v === 'domani' ? new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate() + 1)
      : v === 'giorno' ? bpDataGiorno(cur.week, cur.year, idxGiorno) : null;
    const cache = new Map();
    const annulla = await carrySposta(rec, { data }, cache);
    ui.carry = ui.carry.filter(r => r.item.id !== itemId);
    await dopoCarry();
    const msg = v === 'oggi' ? 'Spostata a oggi' : v === 'domani' ? 'Spostata a domani' : data ? `Spostata a ${fmtGiorno(data)}` : 'Nel piano della prossima settimana';
    showToast(msg, 'success', { annulla: async () => { await annulla(); await annullaPianiCreati(cache); await dopoCarry(); } });
  } catch (e) { showToast('Errore: ' + e.message, 'error'); dopoCarry(); }
}

async function carryTutteAOggi() {
  const lista = rimasteVisibili();
  if (!lista.length) return;
  const oggi = new Date(); oggi.setHours(0, 0, 0, 0);
  const cache = new Map(), annulla = [];
  try {
    for (const rec of lista) annulla.push(await carrySposta(rec, { data: oggi }, cache));
    const ids = new Set(lista.map(r => r.item.id));
    ui.carry = ui.carry.filter(r => !ids.has(r.item.id));
    await dopoCarry();
    showToast(`${plurale(lista.length, 'cosa portata', 'cose portate')} a oggi`, 'success', { annulla: async () => {
      for (const fn of annulla.reverse()) await fn();
      await annullaPianiCreati(cache);
      await dopoCarry();
    } });
  } catch (e) {
    showToast('Errore: ' + e.message, 'error');
    for (const fn of annulla.reverse()) await fn().catch(() => {});   // niente a metà
    await dopoCarry();
  }
}

function carryChiudiPerOggi() {
  localStorage.setItem(CARRY.LS, oggiLocale());
  render();
  showToast('Le ritrovi domani', 'info', { annulla: () => localStorage.removeItem(CARRY.LS) });
}

// ══════════════════════════════════════════════════════════════
