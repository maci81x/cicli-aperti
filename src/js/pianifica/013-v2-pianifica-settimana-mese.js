// v2 · PIANIFICA (Settimana · Mese)
// ══════════════════════════════════════════════════════════════
function navSettimana() {
  const da = getWeekStart(state.week, state.year), a = new Date(da); a.setDate(a.getDate() + 6);
  return `<div class="weeknav">
    <button type="button" class="btn btn-icon" data-act="sett" data-dir="-1" aria-label="Settimana precedente"><i class="ti ti-chevron-left"></i></button>
    <div class="mid"><b>${eSettimanaCorrente() ? 'Questa settimana' : 'Settimana ' + state.week}</b><small>${fmtCorta(da)} – ${fmtCorta(a)}</small></div>
    ${eSettimanaCorrente() ? '' : '<button type="button" class="btn btn-ghost btn-sm" data-act="sett-oggi">Oggi</button>'}
    <button type="button" class="btn btn-icon" data-act="sett" data-dir="1" aria-label="Settimana successiva"><i class="ti ti-chevron-right"></i></button>
  </div>`;
}

function vistaPianifica() {
  if (ui.pian !== 'mese') ui.pian = 'settimana';   // l'agenda è dentro la Settimana
  const seg = [['settimana', 'Settimana'], ['mese', 'Mese']].map(([k, l]) =>
    `<button type="button" data-act="pian" data-v="${k}" aria-pressed="${ui.pian === k}">${l}</button>`).join('');
  const matita = ui.pian === 'settimana' && state.bp && !bpSolaLettura()
    ? '<button type="button" class="btn btn-icon" data-act="wizard" aria-label="Modifica il piano" data-tip="Modifica il piano"><i class="ti ti-pencil"></i></button>' : '';
  let h = `<div class="vh"><div><h1>Pianifica${btnAiuto('pianifica')}</h1></div>${matita}</div><div class="seg" role="group" aria-label="Vista">${seg}</div>`;
  if (ui.pian === 'mese') return h + pianMese();
  h += navSettimana();
  h += pianSettimana();
  return h + pianFondo();
}

// Riepilogo del piano in cima a Pianifica → Settimana: stessa forma del «Hai scelto» del wizard.
function cardPiano() {
  if (!state.bp) {
    if (bpSettimanaPassata()) return '';
    return `<div class="bp-wiz-right piano-card"><div class="pc-top"><div><span class="bp-sum-h">Nessun piano</span><p class="t-label muted">Scegli cosa portare a casa ${bpwFrase(state.week, state.year).nome}.</p></div>
      <button type="button" class="btn btn-primary btn-sm" data-act="wizard">Prepara la settimana</button></div></div>`;
  }
  const items = bpItemsValidi().filter(i => vedi(bpCiclo(i).ctx));
  const st = bpStats(items);
  const minuti = items.reduce((s, i) => s + bpDurata(i), 0);
  const chiuso = state.bp.stato === 'chiuso';
  const titolo = chiuso ? 'Settimana chiusa' : state.bp.stato === 'bozza' ? 'Piano in bozza' : 'Piano della settimana';
  return `<div class="bp-wiz-right piano-card">
    <div class="pc-top"><div><span class="bp-sum-h">${titolo}</span><div><span class="bp-sum-n">${st.tot}</span><span class="bp-sum-lbl">${st.tot === 1 ? 'cosa' : 'cose'}</span></div></div>
      ${bpSolaLettura() ? '' : '<button type="button" class="btn btn-secondary btn-sm" data-act="wizard"><i class="ti ti-pencil"></i>Modifica il piano</button>'}</div>
    <div class="bp-sum-row"><span>Tempo previsto</span><strong>${bpFormatMin(minuti)}</strong></div>
    <div class="bp-sum-row"><span>Fatte</span><strong>${st.done}/${st.tot}</strong></div>
    <div class="bar" role="progressbar" aria-label="Fatte nel piano" aria-valuemin="0" aria-valuemax="${st.tot}" aria-valuenow="${st.done}"><i style="width:${st.pct}%"></i></div>
    ${inviatoIl(state.week, state.year) ? `<p class="pc-inviato"><i class="ti ti-circle-check"></i>Piano inviato al coach il ${inviatoIl(state.week, state.year)}</p>` : ''}
    ${chiuso && state.bp.note ? `<p class="pc-nota"><i class="ti ti-quote"></i>${escHtml(state.bp.note)}</p>` : ''}
  </div>`;
}

function settimanaVuota() {
  if (state.bp) return false;
  return !GIORNI.some(g => righeGiorno(g.key).length);
}

function pianSettimana() {
  if (settimanaVuota()) {
    return (eSettimanaCorrente() ? bloccoRimaste() : '') + vuoto('ti-calendar-week', 'Nessun piano', bpSettimanaPassata() ? 'In questa settimana non c\'era niente in programma.' : 'Scegli le cose che vuoi portare a casa e dai a ognuna un giorno.',
      bpSettimanaPassata() ? '' : `<button type="button" class="btn btn-primary btn-sm" data-act="wizard">Prepara la settimana</button>`);
  }
  const oggi = oggiData();
  const eOggi = idx => eSettimanaCorrente() && giornoIdxDi(oggi) === idx;
  let h = cardPiano() + (eSettimanaCorrente() ? bloccoRimaste() : '');
  const desk = window.innerWidth >= 768;
  const inSett = righeDaFare('settimana');
  const fineSett = dataDelGiorno(6);
  // le cose della settimana senza giorno stanno in cima, come nel piano stampato del coach
  h += inSett.length ? `<p class="list-head"><span>In settimana, senza giorno</span><span class="mono">${inSett.length}</span></p><div class="group">${inSett.map(r => riga(r, { ...opzRighe(fineSett), data: oggiLocale() })).join('')}</div>` : '';
  if (desk) return h + pianSettimanaColonne(eOggi);

  // telefono: un giorno alla volta
  const giorni = GIORNI.map((g, idx) => {
    const d = dataDelGiorno(idx), n = righeDaFare(g.key).length;
    return `<button type="button" class="day${eOggi(idx) ? ' oggi' : ''}${n ? ' ha' : ''}" data-act="giorno" data-i="${idx}" aria-pressed="${ui.giorno === idx}" aria-label="${g.label} ${d.getDate()}, ${plurale(n, 'cosa', 'cose')}">${g.label.slice(0, 1)}<b>${d.getDate()}</b><i></i></button>`;
  }).join('');
  const g = GIORNI[ui.giorno], dSel = dataDelGiorno(ui.giorno), righe = righeDaFare(g.key), fatteG = fatteDelGiorno(g.key);
  const tot = minutiGiorno(righe, dSel), corpo = htmlGiorno(righe, opzRighe(dSel), dSel);
  h += `<div style="margin-top:var(--sp-4)"><div class="days" role="group" aria-label="Giorno">${giorni}</div>
    <p class="list-head"><span>${fmtGiornoLungo(dSel)}</span>${etichettaFatte(fatteG)}${tot ? `<span class="mono" data-tip="Cose, appuntamenti e cuscinetti">${fmtTempo(tot)} in tutto</span>` : ''}</p>
    ${corpo ? corpo.replace('<p class="list-head">', '<p class="list-head" style="margin-top:var(--sp-3)">')
      : `<div class="group"><div class="col-vuota">Niente in programma per ${g.label.toLowerCase()}</div></div>`}</div>`;
  return h;
}

// desktop: Lun–Ven in colonne (Sab e Dom a richiesta). In cima la sequenza per ora (appuntamenti, cuscinetti,
// cose con ora); sotto le zone di rilascio per le cose senza ora: per momenti se almeno una ne ha uno, altrimenti una sola.
// Trascinare = override solo per questa settimana (moveCicloInAgenda).
function pianSettimanaColonne(eOggi) {
  const quanti = ui.weekend ? 7 : 5;
  const puoiTrascinare = state.agendaColsOk && state.agendaTableOk;
  return `<div><div class="tools-row" style="justify-content:flex-end;margin-bottom:var(--sp-2)"><button type="button" class="btn btn-ghost btn-sm" data-act="weekend">${ui.weekend ? 'Nascondi sabato e domenica' : 'Mostra sabato e domenica'}</button></div>
    <div class="cols${ui.weekend ? ' sette' : ''}">${GIORNI.slice(0, quanti).map((gg, idx) => {
      const d = dataDelGiorno(idx), rs = righeDaFare(gg.key), tot = minutiGiorno(rs, d);
      const op = opzRighe(d);
      const trascina = r => ({ ...op, trascina: puoiTrascinare && !r.fatto && !op.solaLettura });
      const { conOra, senzaOra } = sequenzaGiorno(rs, d);
      const sequenza = conOra.map(x => x.tipo === 'evento' ? rigaEvento(x.e) : x.tipo === 'cuscinetto' ? rigaCuscinetto(x.item, op) : riga(x.r, trascina(x.r))).join('');
      const zona = (fascia, titolo, righe) => `<div class="slot${titolo ? '' : ' slot-unica'}${conOra.length ? ' dopo-sequenza' : ''}" data-giorno="${gg.key}" data-fascia="${fascia}">${titolo ? `<div class="fascia-h">${titolo}</div>` : ''}${righe.map(r => riga(r, trascina(r))).join('')}${!righe.length && !titolo && !conOra.length ? '<div class="col-vuota">—</div>' : ''}</div>`;
      const zone = senzaOra.some(r => r.haFascia)
        ? FASCE.map(f => zona(f.key, f.label, senzaOra.filter(r => r.fascia === f.key))).join('')
        : zona('mattina', conOra.length && senzaOra.length ? 'Senza ora' : '', senzaOra);
      return `<div><div class="col-h${eOggi(idx) ? ' oggi' : ''}"><span>${gg.label.slice(0, 3)} <span class="mono">${d.getDate()}</span></span>${tot ? `<span class="mono t-caption" data-tip="Cose, appuntamenti e cuscinetti">${fmtTempo(tot)}</span>` : ''}</div>
        <div class="group">${sequenza}${zone}</div></div>`;
    }).join('')}</div></div>`;
}

// Tempo di un giorno: cose (30 minuti se non hanno durata) + appuntamenti + cuscinetti ancora vuoti.
function minutiGiorno(righe, d) {
  const cose = righe.reduce((s, r) => s + (r.durata || BP_DURATA_DEFAULT), 0);
  const cusc = d ? cuscinettiDelGiorno(d).reduce((s, i) => s + bpDurata(i), 0) : 0;
  return cose + (d ? minutiOccupati(d) : 0) + cusc;
}

function agganciaAgenda() {
  document.querySelectorAll('#view .slot').forEach(s => attachDropZone(s, s.dataset.giorno, s.dataset.fascia));
  document.querySelectorAll('#view .item[draggable="true"]').forEach(el => {
    el.addEventListener('dragstart', e => { _agendaDragId = el.dataset.id; el.classList.add('dragging'); try { e.dataTransfer.setData('text/plain', el.dataset.id); e.dataTransfer.effectAllowed = 'move'; } catch (_) {} });
    el.addEventListener('dragend', () => { _agendaDragId = null; el.classList.remove('dragging'); document.querySelectorAll('.slot.drag-over').forEach(z => z.classList.remove('drag-over')); });
  });
}

// --- Mese ---
function slotConOverride(c, week, year, ovs) {
  const tieni = state.agendaOverrides;
  state.agendaOverrides = ovs;
  try { return agendaSlotForWeek(c, week, year); } finally { state.agendaOverrides = tieni; }
}
async function caricaOverrideMese() {
  if (ui.ovMese || !state.agendaTableOk) return;
  ui.ovMese = [];
  try {
    const { data, error } = await db.from('agenda_override').select('*');
    if (error) throw error;
    ui.ovMese = data || [];
    render();
  } catch (e) { console.warn('[Mese] override non disponibili:', e.message); }
}
function pianMese() {
  caricaOverrideMese();
  const base = new Date(); base.setDate(1); base.setMonth(base.getMonth() + ui.meseOffset);
  const mese = base.getMonth(), anno = base.getFullYear();
  const primo = new Date(anno, mese, 1);
  const inizio = new Date(primo); inizio.setDate(1 - giornoIdxDi(primo));
  const attivi = state.cicli.filter(c => vedi(c.ctx) && isAttivo(c) && !isGiornaliero(c));
  const ovs = ui.ovMese || state.agendaOverrides;
  const oggiIso = oggiLocale();
  let celle = '';
  for (let s = 0; s < 6; s++) {
    const lun = new Date(inizio); lun.setDate(inizio.getDate() + s * 7);
    if (s > 0 && lun.getMonth() !== mese) break;
    const w = isoWeekParts(lun);
    const perGiorno = {};
    attivi.forEach(c => { const sl = slotConOverride(c, w.week, w.year, ovs); if (sl.giorno) (perGiorno[sl.giorno] = perGiorno[sl.giorno] || []).push(computeEffectiveQ(c)); });
    GIORNI.forEach((g, idx) => {
      const d = new Date(lun); d.setDate(lun.getDate() + idx);
      const qs = (perGiorno[g.key] || []).sort();
      const iso = toISODate(d);
      const punti = qs.slice(0, 6).map(q => `<i class="dot q${q}"></i>`).join('');
      celle += `<button type="button" class="mese-g${d.getMonth() !== mese ? ' fuori' : ''}${iso === oggiIso ? ' oggi' : ''}" data-act="mese-giorno" data-data="${iso}" aria-label="${fmtGiornoLungo(d)}, ${plurale(qs.length, 'cosa', 'cose')}"><b>${d.getDate()}</b><span class="dots">${punti}</span></button>`;
    });
  }
  const titolo = base.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  return `<div class="weeknav">
      <button type="button" class="btn btn-icon" data-act="mese" data-dir="-1" aria-label="Mese precedente"><i class="ti ti-chevron-left"></i></button>
      <div class="mid"><b style="text-transform:capitalize">${titolo}</b></div>
      ${ui.meseOffset ? '<button type="button" class="btn btn-ghost btn-sm" data-act="mese-oggi">Oggi</button>' : ''}
      <button type="button" class="btn btn-icon" data-act="mese" data-dir="1" aria-label="Mese successivo"><i class="ti ti-chevron-right"></i></button>
    </div>
    <div class="group"><div class="mese">${GIORNI.map(g => `<div class="mese-h">${g.label.slice(0, 1)}</div>`).join('')}${celle}</div></div>
    <div class="legenda">${[1, 2, 3, 4].map(q => `<span><i class="dot q${q}"></i>${TIPI[q].label}</span>`).join('')}</div>`;
}

// --- In fondo a Pianifica: Da piazzare · Riepilogo · Stampa · Chiudi la settimana ---
function pianFondo() {
  const senza = daSistemare().sort(perTipoEData), scad = conScadenzaSenzaGiorno();
  const tutte = [...GIORNI.map(g => g.key), 'settimana'].flatMap(k => righeGiorno(k));
  const fatte = tutte.filter(r => r.fatto).length;
  const minuti = tutte.reduce((s, r) => s + (r.durata || BP_DURATA_DEFAULT), 0);
  const occ = GIORNI.reduce((s, _, i) => s + minutiOccupati(dataDelGiorno(i)), 0);
  const perTipo = [1, 2, 3, 4].map(q => `<div><b>${tutte.filter(r => computeEffectiveQ(r.c) === q).length}</b><span>${TIPI[q].label}</span></div>`).join('');
  const sola = bpSolaLettura();
  return `<div class="group" style="margin-top:var(--sp-6)">
    ${accordion('senza', `Da piazzare <span class="ctx-etichetta">· ${etichettaCtx()}</span>`, `<span class="mono">${senza.length}</span>`,
      senza.length ? senza.map(c => riga({ c, fatto: false }, { suggerisci: true, data: oggiLocale() })).join('') : '<div class="col-vuota">Ogni cosa aperta ha già un giorno, una data o un posto nel piano</div>')}
    ${scad.length ? accordion('scad-senza', 'Con una scadenza, senza giorno', `<span class="mono">${scad.length}</span>`,
      scad.map(c => riga({ c, fatto: false }, { suggerisci: true, data: oggiLocale() })).join('')) : ''}
    ${accordion('riepilogo', 'Riepilogo', `<span class="mono">${fatte}/${tutte.length}</span>`,
      `<div class="stat"><div><b>${fatte}/${tutte.length}</b><span>fatte</span></div><div><b>${bpFormatMin(minuti)}</b><span>tempo previsto</span></div>${perTipo}${occ ? `<div><b>${bpFormatMin(occ)}</b><span>già occupato da appuntamenti</span></div>` : ''}</div>`)}
    <button type="button" class="riga-link" data-act="pdf"${tutte.length ? '' : ' disabled'}><i class="ti ti-printer"></i><span>Stampa il foglio</span><small>PDF ${formatoFoglio().toUpperCase()}</small><i class="ti ti-chevron-right"></i></button>
    <button type="button" class="riga-link" data-act="invia"${tutte.length ? '' : ' disabled'}><i class="ti ti-send"></i><span>Invia il piano</span><small>${inviatoIl(state.week, state.year) ? 'inviato il ' + inviatoIl(state.week, state.year) : 'al coach'}</small><i class="ti ti-chevron-right"></i></button>
    <button type="button" class="riga-link" data-act="review"${state.bp && !sola ? '' : ' disabled'} ${state.bp ? '' : 'data-tip="Prima prepara la settimana"'}><i class="ti ti-flag"></i><span>Chiudi la settimana</span><small>${!state.bp ? 'serve un piano' : state.bp.stato === 'chiuso' ? 'già chiusa' : ''}</small><i class="ti ti-chevron-right"></i></button>
    <button type="button" class="riga-link" data-act="v16-riporta"><i class="ti ti-file-check"></i><span>Riporta il foglio</span><small>spunta quello che hai fatto sulla carta</small><i class="ti ti-chevron-right"></i></button>
  </div>`;
}

// ══════════════════════════════════════════════════════════════
