// v2 · CHIP DEI GIORNI: L M M G V S D + Sett. (wizard e dettaglio)
// ══════════════════════════════════════════════════════════════
const GIORNI_CHIP = [...GIORNI.map(g => ({ k: g.key, l: g.label.slice(0, 1), nome: g.label })), { k: 'settimana', l: 'Sett.', nome: 'In settimana, senza giorno' }];
function chipGiorni(act, id, attivo, spenti) {
  return `<div class="gchips" role="group" aria-label="Giorno">${GIORNI_CHIP.map(g =>
    `<button type="button" class="gchip" data-act="${act}" data-id="${id}" data-g="${g.k}" aria-pressed="${attivo === g.k}" aria-label="${g.nome}"${spenti && spenti.includes(g.k) ? ' disabled data-tip="Serve il piano della settimana"' : ''}>${g.l}</button>`).join('')}</div>`;
}
function fmtTempo(min) {   // 60 → 1h · 150 → 2h30 · 30 → 30min
  if (!min) return '—';
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h}h${m ? String(m).padStart(2, '0') : ''}` : `${m}min`;
}

// --- wizard, passo 2: un blocco per giorno, con appuntamenti, cuscinetti e cose in ordine di ora ---
function bpwImpostaGiorno(id, g) {
  const v = _bpwSel.get(id);
  if (!v) return;
  _bpwSel.set(id, { ...v, giorno: g, fascia: g === 'settimana' ? null : v.fascia });
  bpwRenderStep2();
}
function bpwMinutiGiorno(k, idx) {
  const cose = [..._bpwSel.values()].filter(v => (v.giorno || 'settimana') === k).reduce((s, v) => s + (v.durata || BP_DURATA_DEFAULT), 0);
  if (k === 'settimana') return cose;
  const cusc = [..._bpwCusc.values()].filter(v => v.giorno === k).reduce((s, v) => s + v.durata, 0);
  return cose + cusc + minutiOccupati(bpDataGiorno(_bpwWeek, _bpwYear, idx));
}
function bpwRiga(id, v) {
  const c = ciclo(id);
  const sotto = [v.ora, v.fascia && FASCE_MAP[v.fascia] && !v.ora ? FASCE_MAP[v.fascia].label.toLowerCase() : null, formatDurata(v.durata || BP_DURATA_DEFAULT),
    v.tipo_slot === 'cuscinetto' ? 'nel cuscinetto' : null, c && c.parent_id && ciclo(c.parent_id) ? `passo di «${ciclo(c.parent_id).title}»` : null].filter(Boolean).map(escHtml).join(' · ');
  return `<div class="bpw-riga"><div class="bpw-riga-h"><b>${escHtml(c ? c.title : '')}</b>
      <button type="button" class="btn btn-icon" data-act="bpw-ora" data-id="${id}" aria-label="Ora, momento e durata" data-tip="Ora, momento e durata"><i class="ti ti-clock"></i></button>
      <button type="button" class="btn btn-icon" data-act="bpw-togli" data-id="${id}" aria-label="Togli dal piano"><i class="ti ti-x"></i></button></div>
    ${chipGiorni('bpw-giorno', id, v.giorno || 'settimana')}<div class="gchips-sotto">${sotto}</div></div>`;
}
function bpwRigaCusc(k, v) {
  const durate = [30, 45, 60, 90, 120];
  return `<div class="bpw-cusc"><i class="ti ti-lifebuoy" aria-hidden="true"></i><b>Cuscinetto <span class="t-caption muted">per gli imprevisti</span></b>
    <button type="button" class="btn btn-icon" data-act="bpw-cusc-togli" data-k="${k}" aria-label="Togli il cuscinetto"><i class="ti ti-x"></i></button>
    <div class="bpw-cusc-campi"><input type="time" class="input" data-act="bpw-cusc-ora" data-k="${k}" value="${v.ora}" aria-label="Ora del cuscinetto">
    <select class="input" data-act="bpw-cusc-durata" data-k="${k}" aria-label="Durata del cuscinetto">${durate.map(m => `<option value="${m}"${m === v.durata ? ' selected' : ''}>${fmtTempo(m)}</option>`).join('')}</select></div></div>`;
}
function bpwBloccoGiorno(k, idx) {
  const voci = [..._bpwSel.entries()].filter(([, v]) => (v.giorno || 'settimana') === k);
  if (k === 'settimana') {
    if (!voci.length) return '';
    return `<section class="bpw-g"><div class="bpw-g-h"><b>In settimana, senza giorno</b><span class="mono">${fmtTempo(bpwMinutiGiorno(k))}</span></div>${voci.map(([id, v]) => bpwRiga(id, v)).join('')}</section>`;
  }
  const d = bpDataGiorno(_bpwWeek, _bpwYear, idx);
  const cusc = [..._bpwCusc.entries()].filter(([, v]) => v.giorno === k);
  const eventi = eventiDelGiorno(d);
  if (idx > 4 && !voci.length && !cusc.length) return '';   // sabato e domenica solo se c'è qualcosa
  const conOra = [
    ...eventi.map(e => ({ ora: e.ora || '00:00', html: `<div class="bpw-evt"><i class="ti ti-calendar-event" aria-hidden="true"></i><span class="mono">${e.ora ? `${e.ora}${e.fine ? '–' + e.fine : ''}` : 'tutto il giorno'}</span><span>${escHtml(e.titolo)}</span></div>` })),
    ...cusc.map(([ck, v]) => ({ ora: v.ora, html: bpwRigaCusc(ck, v) })),
    ...voci.filter(([, v]) => v.ora).map(([id, v]) => ({ ora: v.ora, html: bpwRiga(id, v) }))
  ].sort((a, b) => a.ora.localeCompare(b.ora));
  const senzaOra = voci.filter(([, v]) => !v.ora);
  const haMeta = cusc.some(([, v]) => v.ora < CUSC.SOGLIA_FINE), haFine = cusc.some(([, v]) => v.ora >= CUSC.SOGLIA_FINE);
  const bottoni = state.cuscColOk && (!haMeta || !haFine) ? `<div class="bpw-cusc-add">
      ${haMeta ? '' : `<button type="button" class="btn btn-ghost btn-sm" data-act="bpw-cusc-add" data-g="${k}" data-v="meta"><i class="ti ti-plus"></i>Cuscinetto a metà giornata</button>`}
      ${haFine ? '' : `<button type="button" class="btn btn-ghost btn-sm" data-act="bpw-cusc-add" data-g="${k}" data-v="fine"><i class="ti ti-plus"></i>Cuscinetto a fine giornata</button>`}</div>` : '';
  const vuoto = !conOra.length && !senzaOra.length ? '<p class="bpw-vuoto">Niente in programma</p>' : '';
  return `<section class="bpw-g"><div class="bpw-g-h"><b>${GIORNI[idx].label} <span class="mono">${d.getDate()}/${d.getMonth() + 1}</span></b><span class="mono">${fmtTempo(bpwMinutiGiorno(k, idx))}</span></div>
    ${conOra.map(x => x.html).join('')}${senzaOra.length && conOra.length ? '<p class="bpw-sotto-h">Senza ora</p>' : ''}${senzaOra.map(([id, v]) => bpwRiga(id, v)).join('')}${vuoto}${bottoni}</section>`;
}
function bpwChipGiorni() {
  const passo = $('bpw-step2'), pool = $('bpw-pool');
  if (!passo || !pool) return;
  let riep = $('bpw-riepilogo');
  if (!riep) { riep = document.createElement('div'); riep.id = 'bpw-riepilogo'; riep.className = 'bpw-riepilogo'; passo.insertBefore(riep, passo.firstChild); }
  // solo il totale di ogni giorno: cose + cuscinetti + appuntamenti. Nessun limite.
  riep.innerHTML = GIORNI.map((g, idx) => {
    const app = minutiOccupati(bpDataGiorno(_bpwWeek, _bpwYear, idx));
    return `<span${app ? ` data-tip="di cui ${fmtTempo(app)} di appuntamenti"` : ''}>${g.label.slice(0, 3)} <b class="mono">${fmtTempo(bpwMinutiGiorno(g.key, idx))}</b></span>`;
  }).join('<span aria-hidden="true">·</span>') + `<span aria-hidden="true">·</span><span>Sett. <b class="mono">${fmtTempo(bpwMinutiGiorno('settimana'))}</b></span>`;

  $('bpw-pool-hd').hidden = true;
  pool.parentElement.classList.add('con-lista');
  pool.classList.add('bpw-lista');
  $('bpw-days').classList.add('solo-trascina');
  passo.querySelector('.bp-assign-wrap').classList.add('con-chip');
  const cal = isGcalTokenValid() && ui.calEventColOk
    ? `<label class="bpw-cal"><input type="checkbox" id="bpw-cal"${lsLeggi(LS4.BPW_CAL) === '1' ? ' checked' : ''}><span>Metti su Google Calendar le cose con un'ora<small>un appuntamento con te stesso per ognuna</small></span></label>` : '';
  pool.innerHTML = bpwBloccoGiorno('settimana') + GIORNI.map((g, idx) => bpwBloccoGiorno(g.key, idx)).join('') + cal;
}

// --- dettaglio: sezione Pianificazione, con gli stessi chip per cambiare giorno anche dopo ---
function giornoInSettimana(c) {
  const item = state.bp ? itemDelPiano(c.id) : null;
  if (item) return item.giorno;
  return agendaSlotForWeek(c, state.week, state.year).giorno || null;
}
function disegnaPianificazione(c) {
  const pianificata = haPianificazione(c);
  const rip = ripetizioneDi(c);
  const dove = [];
  if (isGiornaliero(c)) dove.push(`Ogni giorno alle <span class="mono">${formatOra(c.ora_inizio)}</span>`);
  else if (c.pianificato_data) dove.push(`${fmtGiorno(parseISODate(c.pianificato_data))}${c.fascia_oraria ? ', ' + FASCE_MAP[c.fascia_oraria].label.toLowerCase() : ''}`);
  else if (c.giorno_settimana) dove.push(`Ogni ${GIORNI_MAP[c.giorno_settimana].label.toLowerCase()}${c.fascia_oraria ? ', ' + FASCE_MAP[c.fascia_oraria].label.toLowerCase() : ''}`);
  if (rip !== 'nessuna' && rip !== 'giornaliera') dove.push(`si ripete: ${RIP_LABELS[rip].toLowerCase()}`);
  const box = $('det-pianificazione');
  box.hidden = !!c.done;
  const chip = isGiornaliero(c) || !state.agendaColsOk ? '' : `<div><span class="t-caption muted">${eSettimanaCorrente() ? 'Questa settimana' : 'Settimana ' + state.week}</span>
      ${chipGiorni('det-giorno', c.id, giornoInSettimana(c), state.bp && !bpSolaLettura() ? null : ['settimana'])}
      ${c.durata_minuti ? `<div class="gchips-sotto">${formatDurata(c.durata_minuti)}</div>` : ''}</div>`;
  box.innerHTML = `<div><b>Pianificazione</b> · ${pianificata ? 'ha un giorno' : 'da piazzare'}${dove.length ? ' · ' + dove.join(' · ') : ''}</div>
    ${chip}
    <div class="azioni"><button type="button" class="btn btn-secondary btn-sm" data-act="d-quando"><i class="ti ti-calendar-event"></i>Scegli quando</button>
    <button type="button" class="btn btn-ghost btn-sm" data-act="d-ripeti"><i class="ti ti-repeat"></i>Ripeti</button></div>`;
  return pianificata;
}

// Cambia il giorno di una cosa nella settimana selezionata. «Sett.» = nel piano, senza giorno.
async function impostaGiorno(id, g) {
  const c = ciclo(id);
  if (!c) return;
  const item = state.bp ? itemDelPiano(id) : null;
  const w = { week: state.week, year: state.year };
  try {
    if (g === 'settimana') {
      if (!state.bp) return;
      const riga = { battle_plan_id: state.bp.id, ciclo_id: id, giorno: 'settimana', fascia: null, ora_prevista: (item && item.ora_prevista) || null,
        durata_prevista: (item && item.durata_prevista) || c.durata_minuti || BP_DURATA_DEFAULT, completato: !!(item && item.completato), ordine: item ? item.ordine : state.bpItems.length };
      const { data, error } = await db.from('battle_plan_items').upsert(riga, { onConflict: 'battle_plan_id,ciclo_id' }).select();
      if (error) throw error;
      const salvata = (data && data[0]) || riga;
      state.bpItems = [...state.bpItems.filter(i => i.ciclo_id !== id), salvata];
    } else {
      const idx = GIORNI.findIndex(x => x.key === g);
      const data = bpDataGiorno(w.week, w.year, idx);
      const fascia = (item && item.fascia) || c.fascia_oraria || 'mattina';
      if (ripetizioneDi(c) !== 'nessuna') await upsertOverride(id, w, g, fascia);   // solo questa settimana
      else await pianificaInData(c, data, fascia);
      if (item) {
        const { error } = await db.from('battle_plan_items').update({ giorno: g, fascia }).eq('id', item.id);
        if (error) throw error;
        state.bpItems = state.bpItems.map(i => i.id === item.id ? { ...i, giorno: g, fascia } : i);
      }
    }
    const agg = ciclo(id);
    if (editingId === id) { const p = disegnaPianificazione(agg); $('q2-nudge').classList.toggle('show', selectedQ === 2 && !p && !agg.done); }
    render();
    aggiornaBlocco(id);
    showToast(g === 'settimana' ? 'In settimana, senza giorno' : `Spostata a ${GIORNI_MAP[g].label.toLowerCase()}`, 'success');
  } catch (e) { showToast('Errore: ' + e.message, 'error'); }
}

// ══════════════════════════════════════════════════════════════
