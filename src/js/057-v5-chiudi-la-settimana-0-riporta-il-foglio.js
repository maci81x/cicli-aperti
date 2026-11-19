// v5 · CHIUDI LA SETTIMANA: 0. Riporta il foglio · 1. quello che è rimasto · 2. com'è andata
// ══════════════════════════════════════════════════════════════
const _openBpReviewV4 = openBpReview;
openBpReview = function () {
  _openBpReviewV4();
  if (!state.bp) return;
  ui.rev = { ...ui.rev, passo: 0, riportate: new Set(), nuoveTesto: '' };
  disegnaReview();
};
function zoneRiporto() {
  const items = revItems().slice().sort((a, b) => (bpOra(a) || '99').localeCompare(bpOra(b) || '99') || (a.ordine || 0) - (b.ordine || 0));
  return [{ titolo: 'Settimana (pensaci dopo)', giallo: true, items: items.filter(i => !i.giorno || i.giorno === 'settimana') },
    ...GIORNI.map((g, idx) => { const d = dataDelGiorno(idx); return { titolo: `${g.label} ${d.getDate()}/${d.getMonth() + 1}`, items: items.filter(i => i.giorno === g.key) }; })]
    .filter(z => z.items.length);
}
function disegnaRiporta() {
  const r = ui.rev, zone = zoneRiporto();
  const tot = revItems().length, fatte = revItems().filter(i => i.completato || r.riportate.has(i.id)).length;
  $('bprev-title').textContent = 'Riporta il foglio';
  const riga = i => {
    const c = bpCiclo(i), gia = !!i.completato, on = gia || r.riportate.has(i.id);
    const nota = c.note ? String(c.note).split(/\r?\n/)[0] : '';
    return `<button type="button" class="riporta-riga" data-act="riporta" data-item="${i.id}" aria-pressed="${on}"${gia ? ' disabled' : ''}>
      <span class="check-box" aria-hidden="true">${SVG_SPUNTA}</span>
      <span class="riporta-txt"><span>${escHtml(c.title)}</span>${nota ? `<small>${escHtml(nota)}</small>` : ''}</span>
      <span class="mono t-caption faint">${gia ? 'già fatta' : bpOra(i) || ''}</span></button>`;
  };
  $('bprev-body').innerHTML = `<p class="t-label muted riporta-intro">Prendi il foglio stampato: tocca quello che hai depennato.${state.bp.riportato_at ? ` Già riportato il ${fmtGgMm(state.bp.riportato_at)}.` : ''}</p>
    <p class="riporta-conto"><b class="mono">${fatte}</b> su <b class="mono">${tot}</b> fatte</p>
    ${zone.map(z => `<section class="riporta-zona${z.giallo ? ' giallo' : ''}"><h4>${escHtml(z.titolo)}</h4><div class="group">${z.items.map(riga).join('')}</div></section>`).join('') || '<p class="t-label muted">Il piano è vuoto.</p>'}
    <label class="field-label" for="riporta-nuove">Cose nuove che hai scritto sul foglio</label>
    <textarea class="input textarea" id="riporta-nuove" data-act="riporta-nuove" placeholder="Chiamare l'assicurazione per la polizza">${escHtml(r.nuoveTesto || '')}</textarea>
    <p class="t-caption muted">Una riga = una cosa. Finiscono in Tutto come Importanti: l'area la scegli dopo.</p>`;
  $('bprev-back').textContent = 'Annulla';
  $('bprev-ok').textContent = 'Avanti';
  $('bprev-ok').disabled = false;
}
// Una riga spuntata sul foglio: come «Fatto», senza toast per ognuna
async function segnaFattaDaFoglio(item) {
  const c = bpCiclo(item);
  if (!c || item.completato) return;
  await inSilenzio(() => toggleBpItem(item.id));   // 28/10 · anche se si ripete: fatta e basta (si rimette da Fatte, se serve)
  if (c.calendar_event_id) chiudiBlocco(ciclo(c.id) || c);
}
async function applicaRiporta() {
  const btn = $('bprev-ok');
  btn.disabled = true;
  const r = ui.rev;
  let segnate = 0, nuove = 0;
  try {
    for (const id of r.riportate) {
      const item = state.bpItems.find(i => i.id === id);
      if (!item || item.completato) continue;
      await segnaFattaDaFoglio(item);
      segnate++;
    }
    for (const t of righeDi(r.nuoveTesto)) {
      const c = await upsertCiclo(rigaNuova(t, { subito: false }, state.ctx));
      if (c) { state.cicli = [c, ...state.cicli]; nuove++; }
    }
    if (state.riportoColOk) {
      const quando = new Date().toISOString();
      const { error } = await db.from('battle_plan').update({ riportato_at: quando }).eq('id', state.bp.id);
      if (error) throw error;
      state.bp = { ...state.bp, riportato_at: quando };
    }
    ui.rev = { ...ui.rev, passo: 1, riportate: new Set(), nuoveTesto: '', scelte: new Map(revAperti().map(i => [i.id, ui.rev.scelte.get(i.id) || 'prossima'])) };
    disegnaReview();
    render();
    if (segnate || nuove) showToast([segnate && plurale(segnate, 'fatta', 'fatte'), nuove && plurale(nuove, 'cosa nuova', 'cose nuove')].filter(Boolean).join(' · ') + ' dal foglio', 'success', {});
  } catch (e) { btn.disabled = false; showToast('Riporto non finito: ' + e.message, 'error', {}); }
}
function revStatQ2() {
  const n = (state.bp && state.bp.q2_spostate) || 0, del = ((state.bp && state.bp.motivi) || {}).deleghe || [];
  const chi = [...new Set(del.map(d => d.persona).filter(Boolean))];
  return `<div class="rev-stat">
    <div><span>Q2 spostate ${eSettimanaCorrente() ? 'questa settimana' : 'nella settimana ' + state.week}</span><b class="mono">${n}</b></div>
    <div><span>Deleghe tornate indietro</span><b class="mono">${del.length}</b>${chi.length ? `<small>${escHtml(chi.join(', '))}</small>` : ''}</div></div>`;
}
const _disegnaReviewV4 = disegnaReview;
disegnaReview = function () {
  if (ui.rev.passo === 0) { disegnaRiporta(); return; }
  _disegnaReviewV4();
  $('bprev-back').textContent = 'Indietro';
  if (ui.rev.passo === 2) { const nota = $('bprev-body').querySelector('label[for="bprev-note"]'); if (nota) nota.insertAdjacentHTML('beforebegin', revStatQ2()); }
};
// I conteggi della settimana (Q2 spostate per motivo, deleghe tornate) restano in motivi anche alla chiusura.
const _revMotiviConteggioV4 = revMotiviConteggio;
revMotiviConteggio = function () {
  const m = (state.bp && state.bp.motivi) || {};
  return { ..._revMotiviConteggioV4(), ...(m.q2 ? { q2: m.q2 } : {}), ...(m.deleghe ? { deleghe: m.deleghe } : {}) };
};

// ══════════════════════════════════════════════════════════════
