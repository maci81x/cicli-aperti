// v2 · CHIUDI LA SETTIMANA (review in due passi)
// ══════════════════════════════════════════════════════════════
const REV_SCELTE = [
  { k: 'domani',   label: 'Domani' },
  { k: 'prossima', label: 'Prossima settimana' },      // predefinita
  { k: 'tra2',     label: 'Tra 2 settimane' },
  { k: 'data',     label: 'Scegli data' },
  { k: 'aperte',   label: 'Rimetti in Cose aperte' },
  { k: 'lascia',   label: 'Lascia stare' }
];

function revItems() { return bpItemsValidi(); }
function revAperti() { return revItems().filter(i => !i.completato && !bpCiclo(i).done); }

function openBpReview() {
  if (!state.bp) { showToast('Prima prepara la settimana', 'warn'); return; }
  ui.rev = { passo: 1, scelte: new Map(revAperti().map(i => [i.id, 'prossima'])), date: new Map(), motivi: new Map(), altro: new Map(), aggiunte: new Set() };
  $('bprev-sub').textContent = bpSottotitolo(state.week, state.year).replace(/^Settimana/, 'Settimana');
  disegnaReview();
  $('bpRevOverlay').classList.add('open');
}

function disegnaReview() {
  const aperti = revAperti(), st = statRevConEventi();
  const body = $('bprev-body');
  if (ui.rev.passo === 1 && aperti.length) {
    $('bprev-title').textContent = 'Cosa fai di quello che è rimasto?';
    body.innerHTML = aperti.map(i => {
      const c = bpCiclo(i), scelta = ui.rev.scelte.get(i.id);
      const motivo = ui.rev.motivi.get(i.id);
      return `<div class="rev-item"><b>${escHtml(c.title)}</b>
        <span class="rev-lbl">Quando la rifai?</span>
        <div class="chips chips-wrap" role="group" aria-label="Quando la rifai">${REV_SCELTE.map(s =>
          `<button type="button" class="chip" data-act="rev-scelta" data-item="${i.id}" data-v="${s.k}" aria-pressed="${scelta === s.k}">${s.label}</button>`).join('')}</div>
        ${scelta === 'data' ? `<input type="date" class="input" data-act="rev-data" data-item="${i.id}" value="${ui.rev.date.get(i.id) || ''}" min="${oggiLocale()}" aria-label="Data">` : ''}
        <span class="rev-lbl">Perché?</span>
        <div class="chips chips-wrap rev-motivi" role="group" aria-label="Perché non l'hai fatta">${REV_MOTIVI.map(m =>
          `<button type="button" class="chip" data-act="rev-motivo" data-item="${i.id}" data-v="${m.k}" aria-pressed="${motivo === m.k}">${m.l}</button>`).join('')}</div>
        ${motivo === 'altro' ? `<input type="text" class="input" data-act="rev-altro" data-item="${i.id}" value="${esc(ui.rev.altro.get(i.id) || '')}" placeholder="Cosa è successo?" aria-label="Altro motivo" maxlength="120">` : ''}</div>`;
    }).join('');
    $('bprev-back').textContent = 'Annulla';
    $('bprev-ok').textContent = 'Avanti';
    $('bprev-ok').disabled = false;
    return;
  }
  ui.rev.passo = 2;
  const collegato = !!isGcalTokenValid();
  $('bprev-title').textContent = 'Com\'è andata';
  body.innerHTML = `<div class="rev-fine"><b>${st.done} su ${st.tot}</b><span class="t-label muted">${st.tot && st.done === st.tot ? 'Hai fatto tutto quello che avevi scelto.' : `cose fatte ${eSettimanaCorrente() ? 'questa settimana' : 'nella settimana ' + state.week}`}</span></div>
    <div class="bar" style="margin-bottom:var(--sp-4)"><i style="width:${st.pct}%"></i></div>
    ${revRallentato()}
    <label class="field-label" for="bprev-note">Una nota per te</label>
    <textarea class="input textarea" id="bprev-note" placeholder="Cosa ha funzionato, cosa cambieresti">${escHtml(state.bp.note || '')}</textarea>
    <div style="margin-top:var(--sp-4)"><button type="button" class="btn btn-secondary btn-block" data-act="rev-gcal"${collegato ? '' : ' disabled'} data-tip="${collegato ? 'Crea un evento per ogni riga con un\'ora' : 'Collega prima Google Calendar da Altro, Impostazioni'}"><i class="ti ti-calendar-plus"></i>Metti il piano su Google Calendar</button></div>`;
  $('bprev-back').textContent = aperti.length ? 'Indietro' : 'Annulla';
  $('bprev-ok').textContent = 'Chiudi la settimana';
  $('bprev-ok').disabled = false;
}

// Applica le scelte, chiude il piano e apre la preparazione della settimana dopo
// con le cose spostate già selezionate.
async function bpChiudiSettimana() {
  if (!state.bp) return;
  const btn = $('bprev-ok');
  btn.disabled = true;
  const note = ($('bprev-note') || {}).value || null;
  const next = bpSettimanaSuccessiva(state.week, state.year);
  const lunProssima = getWeekStart(next.week, next.year);
  const presel = [];
  let lasciate = 0;
  try {
    for (const [itemId, scelta] of ui.rev.scelte) {
      const item = state.bpItems.find(i => i.id === itemId);
      const c = item && bpCiclo(item);
      if (!c) continue;
      const idxGiorno = Math.max(0, GIORNI.findIndex(g => g.key === item.giorno));
      if (scelta === 'prossima') presel.push(c.id);                     // come «sposta»: si decide il giorno nel wizard
      else if (scelta === 'domani') {
        const d = new Date(); d.setDate(d.getDate() + 1);
        await pianificaInData(c, d, item.fascia);
        const w = isoWeekParts(d);
        if (w.week === next.week && w.year === next.year) presel.push(c.id);
      } else if (scelta === 'tra2') {
        const d = new Date(lunProssima); d.setDate(d.getDate() + 7 + idxGiorno);
        await pianificaInData(c, d, item.fascia);
      } else if (scelta === 'data') {
        const d = parseISODate(ui.rev.date.get(itemId));
        if (!d) { showToast(`Scegli una data per «${c.title}»`, 'warn'); btn.disabled = false; ui.rev.passo = 1; disegnaReview(); return; }
        await pianificaInData(c, d, item.fascia);
        const w = isoWeekParts(d);
        if (w.week === next.week && w.year === next.year) presel.push(c.id);
      } else if (scelta === 'lascia') {
        await patchCiclo(c.id, { q: 4, ...(state.parcheggioColsOk ? { parcheggiato: true, parcheggiato_at: new Date().toISOString() } : {}) });
        lasciate++;
      }
      // 'aperte': nessuna scrittura, resta tra le cose aperte
    }
    const chiuso_at = new Date().toISOString();
    const st = statRevConEventi();
    const numeri = state.statsColOk ? { pianificate: st.tot, completate: st.done, percentuale: st.pct, motivi: revMotiviConteggio() } : {};
    const { error } = await db.from('battle_plan').update({ stato: 'chiuso', chiuso_at, note, ...numeri }).eq('id', state.bp.id);
    if (error) throw error;
    state.bp = { ...state.bp, stato: 'chiuso', chiuso_at, note, ...numeri };
    ui.settimane = null;
    closeModal('bpRevOverlay');
    render();
    showToast(`Settimana chiusa. ${plurale(presel.length, 'cosa passa', 'cose passano')} alla prossima${lasciate ? `, ${lasciate} in Un giorno` : ''}.`, 'success');
    setTimeout(() => openBpWizard(next.week, next.year, presel), 400);
  } catch (err) {
    showToast('Errore chiusura: ' + err.message, 'error');
    btn.disabled = false;
  }
}

// ══════════════════════════════════════════════════════════════
