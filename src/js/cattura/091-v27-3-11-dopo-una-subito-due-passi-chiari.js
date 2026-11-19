// v27 · 3/11 · DOPO UNA «SUBITO»: DUE PASSI CHIARI
// Prima la domanda mescolava «cosa l'ha generata» e «cosa la previene»: Roby rispondeva col motivo
// («ho risposto alla mail») e l'app ne faceva una cosa Importante senza contesto.
// Passo 1: perché è diventata urgente → resta come nota sulla cosa fatta, non crea niente.
// Passo 2: puoi fare qualcosa perché non ricapiti? → solo questo diventa una cosa, e in Dettagli dice da dove nasce.
// ══════════════════════════════════════════════════════════════
const V27_GIA_FATTO = /^(ho|hai|abbiamo|avevo|era|è stat[oa]|sono stat[oi]|fatto|fatta|risposto|chiamato|mandato|inviato)\b/i;
function v27DataBreve(d) { d = d || new Date(); return d.getDate() + '/' + (d.getMonth() + 1); }
function v27DisegnaSubito() {
  const s = ui.subito, box = $('subitoOverlay') && $('subitoOverlay').querySelector('.modal');
  if (!s || !box) return;
  const p1 = s.passo !== 2;
  box.innerHTML = `<div class="sheet-grab"></div>
    <div class="sheet-head"><div class="sheet-head-txt">
      <p class="t-caption muted v27-passo">${p1 ? 'Passo 1 di 2' : 'Passo 2 di 2'}</p>
      <h3 class="t-title" id="subito-titolo">${p1 ? 'Perché è diventata urgente?' : 'Puoi fare qualcosa perché non ricapiti?'}</h3>
      <p class="t-label muted v27-cosa" id="subito-cosa"><i class="ti ti-flame" aria-hidden="true"></i>${escHtml(s.titolo || '')}</p>
    </div></div>
    ${p1
      ? `<label class="field-label" for="subito-testo">Il motivo, in due parole · resta come nota su questa cosa</label>
         <input type="text" class="input" id="subito-testo" maxlength="160" autocomplete="off" enterkeyhint="next" placeholder="Es. l'invito è arrivato all'ultimo">`
      : `${s.motivo ? `<p class="t-label v27-motivo">Motivo: ${escHtml(s.motivo)}</p>` : ''}
         <label class="field-label" for="subito-testo">Una cosa da fare che la eviterà · diventa Importante</label>
         <input type="text" class="input" id="subito-testo" maxlength="160" autocomplete="off" enterkeyhint="done" placeholder="Es. fissare le riunioni PAN per tutto l'anno">
         <p class="t-caption v27-avviso" id="v27-avviso" hidden>Sembra una cosa già fatta. Scrivi cosa farai, oppure tocca «No, va bene così».</p>`}
    <div class="sheet-cta sheet-cta-row">
      ${p1
        ? `<button type="button" class="btn btn-ghost" data-act="subito-salta">Salta</button>
           <button type="button" class="btn btn-primary" data-act="v27-subito-avanti">Avanti</button>`
        : `<button type="button" class="btn btn-ghost" data-act="subito-salta">No, va bene così</button>
           <button type="button" class="btn btn-primary" data-act="subito-crea">Crea attività importante</button>`}
    </div>`;
  const inp = $('subito-testo');
  inp.value = '';
  inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); e.stopPropagation(); p1 ? v27SubitoAvanti() : creaDaSubito(); } });
  setTimeout(() => inp.focus(), 150);
}
const _chiediOrigineSubitoV27 = chiediOrigineSubito;
chiediOrigineSubito = function (c) {
  _chiediOrigineSubitoV27.apply(this, arguments);
  if (!ui.subito || !$('subitoOverlay').classList.contains('open')) return;
  ui.subito.passo = 1; ui.subito.motivo = ''; ui.subito.fattaIl = v27DataBreve();
  v27DisegnaSubito();
};
async function v27SubitoAvanti() {
  const s = ui.subito;
  if (!s) return;
  const m = ($('subito-testo').value || '').trim();
  if (m) {
    s.motivo = m;
    const c = ciclo(s.id), riga = `Perché è diventata urgente: ${m}`;
    try { await patchCiclo(s.id, { note: c && c.note ? `${c.note}\n${riga}` : riga }); }
    catch (e) { console.warn('[v27] motivo:', e.message); }
  }
  s.passo = 2;
  v27DisegnaSubito();
}
AZIONI['v27-subito-avanti'] = () => v27SubitoAvanti();
creaDaSubito = async function () {
  const s = ui.subito;
  if (!s) return;
  const t = ($('subito-testo').value || '').trim();
  if (!t) { $('subito-testo').focus(); return; }
  if (V27_GIA_FATTO.test(t) && !s.avvisato) { s.avvisato = true; $('v27-avviso').hidden = false; $('subito-testo').focus(); return; }
  if (s.creando) return;
  s.creando = true;
  const note = `Nasce da: «${s.titolo}» (Subito, fatta il ${s.fattaIl || v27DataBreve()})` + (s.motivo ? `\nPerché era urgente: ${s.motivo}` : '');
  try {
    const nuova = await upsertCiclo({ ...rigaNuova(t, { subito: false }, s.ctx), cat: s.cat || (s.ctx === 'personale' ? 'salute' : 'management'), macro_area: s.macro_area || null, note });
    if (nuova) state.cicli = [nuova, ...state.cicli];
    ui.subito = null;
    closeModal('subitoOverlay');
    render();
    showToast('Aggiunta a Importante · dice da dove nasce', 'success', nuova ? { annulla: () => apriDettaglio(nuova.id), etichetta: 'Dettagli' } : undefined);
  } catch (e) { s.creando = false; showToast('Non aggiunta: ' + e.message, 'error'); }
};

// In Dettagli: da dove nasce (anche per quelle create con la versione vecchia)
function v27Origine(c) {
  const n = String((c && c.note) || '');
  let m = n.match(/^Nasce da: «([\s\S]*?)»(?: \(([^)]*)\))?(?:\nPerché era urgente: ([^\n]*))?/);
  if (m) return { titolo: m[1], quando: m[2] || '', motivo: m[3] || '' };
  m = n.match(/^Per evitare che si ripeta: «([\s\S]*?)»/);
  if (m) return { titolo: m[1], quando: 'Subito', motivo: '' };
  return null;
}
const _apriDettaglioV27 = apriDettaglio;
apriDettaglio = function (id) {
  const r = _apriDettaglioV27.apply(this, arguments);
  const vecchio = $('det-origine');
  if (vecchio) vecchio.remove();
  const o = v27Origine(ciclo(id)), dove = $('det-azioni');
  if (!o || !dove) return r;
  dove.insertAdjacentHTML('afterend', `<div id="det-origine" class="det-box v27-origine">
    <p class="v27-origine-testa"><i class="ti ti-flame" aria-hidden="true"></i><b>Nasce da una cosa urgente</b>${o.quando ? `<span class="t-caption muted">${escHtml(o.quando)}</span>` : ''}</p>
    <p class="v27-origine-cosa">${escHtml(o.titolo)}</p>
    ${o.motivo ? `<p class="t-label muted">Perché era urgente: ${escHtml(o.motivo)}</p>` : ''}
    <p class="t-caption muted">Questa cosa serve a evitare che ricapiti.</p></div>`);
  return r;
};

// ══════════════════════════════════════════════════════════════
