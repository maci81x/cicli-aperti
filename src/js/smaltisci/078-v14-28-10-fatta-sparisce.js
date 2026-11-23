// v14 · 28/10 · FATTA = SPARISCE
// · una cosa che si ripete, fatta, sparisce: il messaggio chiede «la rimetto lun 2/11?» (Sì, rimettila · Annulla)
// · dopo Fatto: «+ Seguito» apre Aggiungi per un'attività o un promemoria collegati
// · Fatte: tutte le cose chiuse in un posto, con cerca e Riapri (da Altro e da Cose aperte)
// ══════════════════════════════════════════════════════════════
// messaggi con più tasti e una durata scelta
const _showToastV14 = showToast;
showToast = function (msg, type, opz) {
  const r = _showToastV14.apply(this, arguments);
  if (!opz || (!opz.altre && !opz.durata)) return r;
  const box = $('toast-container'), el = box && box.lastElementChild;
  if (!el) return r;
  (opz.altre || []).forEach(a => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'toast-action toast-action-2';
    b.textContent = a.etichetta;
    b.onclick = async () => { el.remove(); try { await a.fn(); } catch (e) { showToast('Non riesco: ' + e.message, 'error'); } render(); };
    el.appendChild(b);
  });
  if (opz.durata) { el.id = el.id + '-l'; setTimeout(() => el.remove(), opz.durata); }   // il timer di prima cerca l'id vecchio: non lo trova
  return r;
};

// + Seguito
ui.seguitoDi = null;
function apriSeguito(c) {
  if (!c) return;
  ui._v14ApriSeguito = true;
  try { apriRapido(); } finally { ui._v14ApriSeguito = false; }
  ui.seguitoDi = { id: c.id, title: c.title, ctx: c.ctx };
  const t = $('rapido-testo');
  if (t) { t.value = ''; t.placeholder = 'Cosa segue? Es. «ricordami lunedì alle 9 di sentire Raia»'; }
  disegnaAnteprima();
}
const _apriRapidoV14 = apriRapido;
apriRapido = function () {
  if (!ui._v14ApriSeguito) ui.seguitoDi = null;
  const t = $('rapido-testo');
  if (t) t.placeholder = 'Cosa hai in testa?';
  return _apriRapidoV14.apply(this, arguments);
};
const _rigaDaVoceV14 = rigaDaVoce;
rigaDaVoce = async function (v, r, ctx) {
  const s = ui.seguitoDi;
  const riga = await _rigaDaVoceV14.call(this, v, r, s && !v.ctxToccato ? s.ctx : ctx);
  if (!s || !riga) return riga;
  const nota = `Seguito di «${s.title}»`;
  return { ...riga, ctx: v.ctxToccato ? riga.ctx : s.ctx, note: riga.note ? `${nota}\n${riga.note}` : nota };
};
const _salvaRapidoV14 = salvaRapido;
salvaRapido = async function () {
  const r = await _salvaRapidoV14.apply(this, arguments);
  if (!$('rapidoOverlay').classList.contains('open')) ui.seguitoDi = null;
  return r;
};

// Fatte: tutte le cose chiuse, con cerca e Riapri
ui.fatteQ = '';
function vistaFatte() {
  const q = normTitolo(ui.fatteQ || '');
  const tutte = state.cicli.filter(c => c.done && vedi(c.ctx));
  const lista = tutte.filter(c => !q || normTitolo(c.title).includes(q) || normTitolo(c.note || '').includes(q))
    .sort((a, b) => new Date(b.chiuso_at || b.updated_at || b.created_at) - new Date(a.chiuso_at || a.updated_at || a.created_at));
  const seg = [['cose', 'Cose'], ['settimane', 'Settimane']].map(([k, l]) =>
    `<button type="button" data-act="fatte" data-v="${k}" aria-pressed="${ui.fatte === k}">${l}</button>`).join('');
  let h = `${indietro('altro', 'Altro')}<div class="vh"><div><h1>Fatte${btnAiuto('fatte')}</h1><p class="t-label muted">Tutte le cose chiuse: cercale, riaprile o dagli un seguito.</p></div></div>
    <div class="seg" role="group" aria-label="Vista" style="margin-bottom:var(--sp-3)">${seg}</div>`;
  if (ui.fatte === 'settimane') return h + fatteSettimane();
  h += `<label class="cerca v14-cerca"><i class="ti ti-search" aria-hidden="true"></i><input type="search" id="fatte-q" value="${escAttr(ui.fatteQ || '')}" placeholder="Cerca tra le ${tutte.length} fatte" autocomplete="off" aria-label="Cerca tra le cose fatte"></label>`;
  if (!tutte.length) return h + vuoto('ti-circle-check', 'Ancora niente, inizia da Oggi', 'Ogni cosa che spunti finisce qui, così vedi quanta strada hai fatto.', `<button type="button" class="btn btn-primary btn-sm" data-tab="oggi">Vai a Oggi</button>`);
  if (!lista.length) return h + `<p class="t-label muted" style="padding:var(--sp-4)">Nessuna cosa fatta con «${escHtml(ui.fatteQ)}».</p>`;
  const mesi = new Map();
  lista.forEach(c => { const d = new Date(c.chiuso_at || c.updated_at || c.created_at); const k = d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }); if (!mesi.has(k)) mesi.set(k, []); mesi.get(k).push(c); });
  mesi.forEach((items, k) => {
    h += `<p class="list-head"><span style="text-transform:capitalize">${k}</span><span class="mono">${items.length}</span></p><div class="group">${items.map(c =>
      riga({ c, fatto: true }, { senzaAzioni: true, lato: `<span class="t-caption">${fmtCorta(new Date(c.chiuso_at || c.updated_at || c.created_at))}</span>
        <button type="button" class="btn btn-ghost btn-sm v14-riapri" data-act="v14-riapri" data-id="${c.id}">Riapri</button>
        <button type="button" class="btn btn-ghost btn-sm v14-riapri" data-act="v14-seguito" data-id="${c.id}">+ Seguito</button>` })).join('')}</div>`;
  });
  return h;
}
AZIONI['v14-riapri'] = (el, id) => azioneFatto(id);   // su una cosa fatta, Fatto la riapre
AZIONI['v14-seguito'] = (el, id) => apriSeguito(ciclo(id));
document.addEventListener('input', e => {
  if (e.target.id !== 'fatte-q') return;
  ui.fatteQ = e.target.value;
  const pos = e.target.selectionStart;
  render();
  const q = $('fatte-q'); if (q) { q.focus(); try { q.setSelectionRange(pos, pos); } catch (_) {} }
});
// in Cose aperte: il passaggio alle Fatte
const _vistaTuttoV14 = vistaTutto;
vistaTutto = function () {
  const h = _vistaTuttoV14.apply(this, arguments);
  const n = state.cicli.filter(c => c.done && vedi(c.ctx)).length;
  return h + `<div class="group v14-fatte"><button type="button" class="riga-link" data-act="sub" data-tab="altro" data-sub="fatte"><i class="ti ti-circle-check"></i><span>Fatte<small>tutte le cose chiuse: cerca, riapri, seguito</small></span><small class="mono">${n}</small><i class="ti ti-chevron-right"></i></button></div>`;
};

// ══════════════════════════════════════════════════════════════
