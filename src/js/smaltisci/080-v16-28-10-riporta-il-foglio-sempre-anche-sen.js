// v16 · 28/10 · RIPORTA IL FOGLIO, sempre (anche senza Battle Plan)
// Prendi il foglio stampato: tocchi quello che hai depennato (cose e appuntamenti), scrivi le cose nuove, Salva.
// Da Settimana, accanto a «Chiudi la settimana».
// ══════════════════════════════════════════════════════════════
document.body.insertAdjacentHTML('beforeend', `
<div class="modal-overlay" id="riportaOverlay" onclick="closeModalOnBg(event,'riportaOverlay')">
  <div class="modal sheet sheet-narrow" role="dialog" aria-modal="true" aria-labelledby="rip-titolo">
    <div class="sheet-grab"></div>
    <div class="sheet-head"><h3 class="t-title" id="rip-titolo">Riporta il foglio</h3><button type="button" class="btn btn-icon" onclick="closeModal('riportaOverlay')" aria-label="Chiudi"><i class="ti ti-x"></i></button></div>
    <div id="rip-corpo"></div>
    <div class="sheet-cta"><button type="button" class="btn btn-primary btn-block" data-act="rip-salva" id="rip-salva"><i class="ti ti-check"></i>Salva</button></div>
  </div>
</div>`);
ui.rip16 = null;   // { scelte: Set('c:<id>' | 'e:<id>'), nuove: '' }
function vociRiporto() {
  const oggi = oggiLocale(), zone = [];
  GIORNI.forEach((g, idx) => {
    const d = dataDelGiorno(idx), iso = toISODate(d);
    if (iso > oggi) return;   // solo fino a oggi: il resto non è ancora successo
    ui._tuttiCtx++;
    let righe, evts;
    try { righe = righeGiorno(g.key).filter(r => !r.fatto); evts = eventiDelGiorno(d).filter(e => eventoSpuntabile(e) && !eventoFatto(e)); }
    finally { ui._tuttiCtx--; }
    const voci = [...evts.map(e => ({ k: 'e:' + e.id, titolo: e.titolo, ora: e.tuttoIlGiorno ? 'giornata' : e.ora, evt: true })),
      ...righe.map(r => ({ k: 'c:' + r.c.id, titolo: r.c.title, ora: r.ora || '', subito: computeEffectiveQ(r.c) === 1 }))]
      .sort((a, b) => String(a.ora || '99').localeCompare(String(b.ora || '99')));
    if (voci.length) zone.push({ titolo: `${g.label} ${d.getDate()}/${d.getMonth() + 1}`, voci });
  });
  ui._tuttiCtx++;
  try { const sett = righeGiorno('settimana').filter(r => !r.fatto); if (sett.length) zone.unshift({ titolo: 'Settimana (pensaci dopo)', giallo: true, voci: sett.map(r => ({ k: 'c:' + r.c.id, titolo: r.c.title, ora: '' })) }); }
  finally { ui._tuttiCtx--; }
  return zone;
}
function apriRiportaFoglio() {
  ui.rip16 = { scelte: new Set(), nuove: '' };
  $('riportaOverlay').classList.add('open');
  disegnaRiportaFoglio();
}
function disegnaRiportaFoglio() {
  const r = ui.rip16, zone = vociRiporto(), tot = zone.reduce((n, z) => n + z.voci.length, 0);
  const riga = v => `<button type="button" class="riporta-riga" data-act="rip-tocca" data-k="${esc(v.k)}" aria-pressed="${r.scelte.has(v.k)}">
      <span class="check-box" aria-hidden="true">${SVG_SPUNTA}</span>
      <span class="riporta-txt"><span>${v.subito ? '! ' : ''}${escHtml(v.titolo)}</span>${v.evt ? '<small>appuntamento</small>' : ''}</span>
      <span class="mono t-caption faint">${escHtml(v.ora || '')}</span></button>`;
  $('rip-corpo').innerHTML = `<p class="t-label muted riporta-intro">Settimana ${state.week}. Prendi il foglio stampato e tocca quello che hai depennato. Quello che non tocchi resta da fare.</p>
    <p class="riporta-conto"><b class="mono">${r.scelte.size}</b> su <b class="mono">${tot}</b> fatte</p>
    ${zone.map(z => `<section class="riporta-zona${z.giallo ? ' giallo' : ''}"><h4>${escHtml(z.titolo)}</h4><div class="group">${z.voci.map(riga).join('')}</div></section>`).join('') || '<p class="t-label muted">Niente di aperto fino a oggi in questa settimana.</p>'}
    <label class="field-label" for="rip-nuove">Cose nuove che hai scritto sul foglio</label>
    <textarea class="input textarea" id="rip-nuove" rows="3" placeholder="Una riga, una cosa. Es. chiamare l'assicurazione per la polizza">${escHtml(r.nuove || '')}</textarea>`;
  const n = r.scelte.size, nuove = righeCampo(r.nuove || '').filter(Boolean).length;
  $('rip-salva').innerHTML = `<i class="ti ti-check"></i>${n || nuove ? `Salva${n ? ` · ${plurale(n, 'fatta', 'fatte')}` : ''}${nuove ? ` · ${plurale(nuove, 'nuova', 'nuove')}` : ''}` : 'Chiudi'}`;
}
async function salvaRiportaFoglio() {
  const r = ui.rip16;
  if (!r) return;
  const btn = $('rip-salva');
  btn.disabled = true;
  let fatte = 0, nuove = 0, errori = 0;
  try {
    for (const k of r.scelte) {
      const [tipo, id] = [k.slice(0, 1), k.slice(2)];
      try {
        if (tipo === 'e') {
          const e = eventoPerId(id);
          if (!e) continue;
          state.evtFatti = { ...state.evtFatti, [id]: e.giorno };
          if (state.evtFattiDb) {
            const res = await db.from(EVT_FATTI.TABELLA).upsert({ evento_id: id, giorno: e.giorno, ...(state.evtInfoOk ? { titolo: e.titolo } : {}) }, { onConflict: 'evento_id' });
            if (res.error) throw res.error;
          }
          if (state.evtInfoOk) state.evtInfo[id] = { evento_id: id, giorno: e.giorno, titolo: e.titolo, fatto_at: new Date().toISOString() };
        } else {
          const c = ciclo(id);
          if (!c || c.done) continue;
          const item = state.bp ? itemDelPiano(id) : null;
          if (item && !item.completato) await inSilenzio(() => toggleBpItem(item.id));
          else { await flipDone(id, false); state.cicli = state.cicli.map(x => x.id === id ? { ...x, done: true, execution_status: 'done' } : x); }
          if (c.calendar_event_id) chiudiBlocco(ciclo(id) || c);
        }
        fatte++;
      } catch (e) { errori++; console.warn('[Riporta] ', k, e.message); }
    }
    scriviEvtFattiLocali(state.evtFatti);
    const testo = ($('rip-nuove') || {}).value || r.nuove || '';
    const righe = righeCampo(testo).filter(Boolean);
    if (righe.length) { const add = await aggiungiFrasi(vociDaRighe(righe, {}), {}); nuove = add ? add.length || righe.length : 0; }
    if (state.bp && state.bpTableOk) { try { await db.from('battle_plan').update({ riportato_at: new Date().toISOString() }).eq('id', state.bp.id); } catch (_) { /* niente */ } }
  } finally { btn.disabled = false; }
  closeModal('riportaOverlay');
  ui.rip16 = null;
  render();
  if (fatte || nuove || errori) showToast([fatte && plurale(fatte, 'fatta', 'fatte'), nuove && plurale(nuove, 'cosa nuova', 'cose nuove'), errori && `${errori} non riuscite`].filter(Boolean).join(' · ') + ' dal foglio', errori ? 'warn' : 'success');
}
Object.assign(AZIONI, {
  'v16-riporta': () => apriRiportaFoglio(),
  'rip-tocca': el => { const k = el.dataset.k, s = ui.rip16.scelte; if (s.has(k)) s.delete(k); else s.add(k); ui.rip16.nuove = ($('rip-nuove') || {}).value || ui.rip16.nuove; disegnaRiportaFoglio(); },
  'rip-salva': () => { if (ui.rip16 && !ui.rip16.scelte.size && !righeCampo(($('rip-nuove') || {}).value || '').filter(Boolean).length) { closeModal('riportaOverlay'); return; } salvaRiportaFoglio(); }
});
document.addEventListener('input', e => { if (e.target.id === 'rip-nuove' && ui.rip16) { ui.rip16.nuove = e.target.value; const n = ui.rip16.scelte.size, nuove = righeCampo(e.target.value).filter(Boolean).length; $('rip-salva').innerHTML = `<i class="ti ti-check"></i>${n || nuove ? `Salva${n ? ` · ${plurale(n, 'fatta', 'fatte')}` : ''}${nuove ? ` · ${plurale(nuove, 'nuova', 'nuove')}` : ''}` : 'Chiudi'}`; } });

// ══════════════════════════════════════════════════════════════
