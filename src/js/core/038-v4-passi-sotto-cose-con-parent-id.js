// v4 · PASSI (sotto-cose con parent_id)
// ══════════════════════════════════════════════════════════════
function passiDi(id) {
  if (!state.passiColOk) return [];
  return state.cicli.filter(c => c.parent_id === id).sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')));
}
const haPassiAperti = c => !!c && passiDi(c.id).some(p => !p.done);
// Il dato «passi» di una riga: «di Madre», «2/5 passi» o il suggerimento per le cose grosse
function infoPassi(c, fatto) {
  if (!state.passiColOk) return '';
  if (c.parent_id) { const m = ciclo(c.parent_id); return m ? `<span class="passo-di"><i class="ti ti-corner-down-right"></i>${escHtml(m.title)}</span>` : ''; }
  const ps = passiDi(c.id);
  if (ps.length) return `<span class="passi-n"><i class="ti ti-list-tree"></i><span class="mono">${ps.filter(p => p.done).length}/${ps.length}</span> passi</span>`;
  if (!fatto && (c.durata_minuti || 0) >= PASSI.GROSSA) return '<span class="hint-quando"><i class="ti ti-list-tree"></i>Grossa: scomponila in passi</span>';
  return '';
}
// v52 · 23/11 · un passo si riconosce ovunque: in Pianifica (riga ↳), nei fogli stampati e in testa al dettaglio
function madreDi(c) { const m = c && c.parent_id ? ciclo(c.parent_id) : null; return m || null; }
function testoMadre(c) { const m = madreDi(c); return m ? `Passo di «${m.title}»` : ''; }
function disegnaMadreInTesta(c) {
  const t = $('f-title'); if (!t) return;
  let el = $('v52-madre');
  const m = madreDi(c);
  if (!m) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('button'); el.type = 'button'; el.id = 'v52-madre'; el.className = 'v52-madre'; t.before(el); }
  el.dataset.act = 'apri-madre'; el.dataset.id = m.id;
  el.innerHTML = `<i class="ti ti-corner-down-right" aria-hidden="true"></i><span>Passo di</span><b>${escHtml(m.title)}</b>`;
  el.setAttribute('aria-label', `Passo di «${m.title}»: apri la cosa intera`);
}
function disegnaPassi(c) {
  try { disegnaMadreInTesta(c); } catch (_) {}
  const box = $('det-passi');
  if (!box) return;
  if (!c || !state.passiColOk) { box.hidden = true; return; }
  if (c.parent_id) {
    const m = ciclo(c.parent_id);
    box.hidden = !m;
    if (m) box.innerHTML = `<div class="passi-h"><b>Passo di «${escHtml(m.title)}»</b></div>
      <div class="azioni"><button type="button" class="btn btn-secondary btn-sm" data-act="apri-madre" data-id="${m.id}"><i class="ti ti-arrow-up"></i>Apri la cosa intera</button></div>`;
    return;
  }
  // il ridisegno (realtime, azioni) non deve perdere quello che si sta scrivendo
  const campo = $('passo-nuovo'), testo = campo ? campo.value : '', aFuoco = document.activeElement === campo;
  const ps = passiDi(c.id), fatti = ps.filter(p => p.done).length;
  const grossa = !ps.length && (c.durata_minuti || 0) >= PASSI.GROSSA;
  const durate = [['', 'Durata'], ['15', '15 min'], ['30', '30 min'], ['60', '1 ora'], ['120', '2 ore']];
  box.hidden = false;
  box.innerHTML = `<div class="passi-h"><b>Passi</b>${ps.length ? `<span class="mono">${fatti}/${ps.length} fatti</span>` : ''}</div>
    ${ps.length ? `<div class="bar passi-bar" role="progressbar" aria-label="Passi fatti" aria-valuemin="0" aria-valuemax="${ps.length}" aria-valuenow="${fatti}"><i style="width:${Math.round(fatti / ps.length * 100)}%"></i></div>
      <div class="group passi-lista">${ps.map(p => riga({ c: p, fatto: !!p.done }, { data: oggiLocale(), nelDettaglio: true, extra: p.durata_minuti ? formatDurata(p.durata_minuti) : null })).join('')}</div>`
      : `<p class="t-caption ${grossa ? 'passi-grossa' : 'muted'}">${grossa ? '<i class="ti ti-list-tree"></i><b>Grossa:</b> scomponila in passi.' : 'Una cosa grossa si fa un passo alla volta.'} Ogni passo si pianifica da solo.</p>`}
    ${c.done ? '' : `<div class="passo-nuovo"><input type="text" class="input" id="passo-nuovo" placeholder="+ Passo" aria-label="Nuovo passo" autocomplete="off" enterkeyhint="done" maxlength="200">
      <select class="input" id="passo-durata" aria-label="Durata del passo">${durate.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>
      <button type="button" class="btn btn-secondary btn-sm" data-act="passo-aggiungi">Aggiungi</button></div>`}`;
  const nuovo = $('passo-nuovo');
  if (nuovo) { nuovo.value = testo; if (aFuoco) nuovo.focus(); }
}
async function aggiungiPasso() {
  const madre = ciclo(editingId), campo = $('passo-nuovo');
  const titolo = ((campo && campo.value) || '').trim();
  if (!madre || !titolo) { if (campo) campo.focus(); return; }
  const durata = parseInt($('passo-durata').value, 10) || null;
  const passo = { ...rigaNuova(titolo, { subito: false }, madre.ctx), q: madre.q === 1 ? 1 : 2, cat: madre.cat, macro_area: madre.macro_area,
    persone_menzionate: madre.persone_menzionate || [], parent_id: madre.id, ...(durata && state.ritualiColsOk ? { durata_minuti: durata } : {}) };
  try {
    const salvato = await upsertCiclo(passo);
    if (salvato) state.cicli = [salvato, ...state.cicli];
    campo.value = '';
    disegnaPassi(madre);
    $('passo-nuovo').focus();
    render();
  } catch (e) { showToast('Passo non salvato: ' + e.message, 'error'); }
}
function azioneScomponi(id) {
  const c = ciclo(id);
  if (!c) return;
  if (!state.passiColOk) { showToast('Passi spenti: manca la migration v4 (vedi Impostazioni)', 'warn'); return; }
  const madre = c.parent_id ? ciclo(c.parent_id) : null;
  if (madre) showToast('È già un passo: aggiungi gli altri qui', 'info');
  apriDettaglio(madre ? madre.id : id);
  setTimeout(() => { const campo = $('passo-nuovo'); if (campo) { campo.scrollIntoView({ block: 'center', behavior: 'smooth' }); campo.focus(); } }, 250);
}
// Quando l'ultimo passo è fatto, si chiede se chiudere anche la cosa intera.
function controllaMadre(madreId) {
  const m = ciclo(madreId);
  if (!m || m.done) return;
  const ps = passiDi(madreId);
  if (!ps.length || ps.some(p => !p.done)) return;
  setTimeout(() => apriConferma({ titolo: 'Tutti i passi sono fatti', testo: `Chiudi anche «${m.title}»?`, ok: 'Sì, chiudila', no: 'Non ancora', onOk: () => azioneFatto(madreId) }), 400);
}

// Foglio di conferma riusabile (al posto di confirm(), che blocca la pagina)
function apriConferma(o) {
  ui.conferma = o;
  $('conferma-titolo').textContent = o.titolo;
  $('conferma-testo').textContent = o.testo || '';
  $('conferma-ok').textContent = o.ok || 'Sì';
  $('conferma-no').textContent = o.no || 'Annulla';
  $('confermaOverlay').classList.add('open');
}
function rispondiConferma(si) {
  const o = ui.conferma;
  ui.conferma = null;
  closeModal('confermaOverlay');
  if (si && o && o.onOk) o.onOk();
}

// ══════════════════════════════════════════════════════════════
