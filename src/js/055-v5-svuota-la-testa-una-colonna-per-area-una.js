// v5 · SVUOTA LA TESTA: una colonna per area, una riga = una cosa
// ══════════════════════════════════════════════════════════════
const INIZI_GENERICI = /^(gestione|organizzare|recupero|inaugurazione|progetto)\b/;
function eGenerica(t) { const n = normTitolo(t); return !!n && (n.split(' ').length === 1 || INIZI_GENERICI.test(n)); }
const _infoPassiV4 = infoPassi;
infoPassi = function (c, fatto) {
  const h = _infoPassiV4(c, fatto);
  if (h || fatto || !state.passiColOk || c.parent_id || passiDi(c.id).length || !eGenerica(c.title)) return h;
  return '<span class="hint-quando"><i class="ti ti-list-tree"></i>Spacchettala</span>';
};
ui.svuota = { testi: [], fase: 'scrivi', create: [] };
function apriSvuota() {
  ui.svuota = { testi: aree().map(() => ''), fase: 'scrivi', create: [] };
  disegnaSvuota();
  $('svuotaOverlay').classList.add('open');
  setTimeout(() => { const t = document.querySelector('#svuota-track textarea'); if (t && window.innerWidth >= 768) t.focus(); }, 200);
}
const righeDi = t => String(t || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
function svuotaTotale() { return ui.svuota.testi.reduce((s, t) => s + righeDi(t).length, 0); }
function disegnaSvuota() {
  const s = ui.svuota, body = $('svuota-body');
  if (s.fase === 'fatto') {
    const generiche = s.create.filter(c => eGenerica(c.title));
    body.innerHTML = `<div class="rev-fine"><b>${s.create.length}</b><span class="t-label muted">${s.create.length === 1 ? 'cosa aggiunta a Tutto' : 'cose aggiunte a Tutto'}</span></div>
      ${generiche.length ? `<p class="rev-lbl">Queste contengono altre cose: spacchettale in passi</p><div class="group">${generiche.map(c => `<div class="sugg-riga"><span><i class="ti ti-list-tree" aria-hidden="true"></i>${escHtml(c.title)}</span>
        <button type="button" class="btn btn-secondary btn-sm" data-act="svuota-spacchetta" data-id="${c.id}">Spacchettala</button></div>`).join('')}</div>` : '<p class="t-label muted svuota-ok">Adesso decidi con calma cosa farne: le trovi in Tutto.</p>'}`;
    $('svuota-ok').textContent = 'Fatto';
    $('svuota-annulla').hidden = true;
    return;
  }
  const lista = aree();
  body.innerHTML = `<div class="svuota-nav" aria-hidden="true"><button type="button" class="btn btn-icon" data-act="svuota-scorri" data-dir="-1" tabindex="-1"><i class="ti ti-chevron-left"></i></button>
      <span class="t-label" id="svuota-pos">1 di ${lista.length}</span><button type="button" class="btn btn-icon" data-act="svuota-scorri" data-dir="1" tabindex="-1"><i class="ti ti-chevron-right"></i></button></div>
    <div class="svuota-track" id="svuota-track">${lista.map((a, i) => `<section class="svuota-col" aria-label="${esc(a.nome)}">
      <h4><i class="ti ${a.icona}" aria-hidden="true"></i><span>${escHtml(a.nome)}</span><span class="mono" id="svuota-n-${i}"></span></h4>
      <textarea class="input textarea" data-act="svuota-testo" data-i="${i}" aria-label="Cose aperte: ${esc(a.nome)}" placeholder="Una riga = una cosa">${escHtml(s.testi[i] || '')}</textarea>
      <div class="svuota-gen" id="svuota-gen-${i}"></div></section>`).join('')}</div>`;
  lista.forEach((_, i) => aggiornaColonnaSvuota(i));
  $('svuota-annulla').hidden = false;
  $('svuota-track').addEventListener('scroll', () => requestAnimationFrame(posizioneSvuota), { passive: true });
}
function aggiornaColonnaSvuota(i) {
  const righe = righeDi(ui.svuota.testi[i]);
  const n = $('svuota-n-' + i); if (n) n.textContent = righe.length || '';
  const gen = $('svuota-gen-' + i);
  if (gen) gen.innerHTML = righe.filter(eGenerica).slice(0, 3).map(t => `<p><i class="ti ti-list-tree" aria-hidden="true"></i>«${escHtml(t)}» contiene altre cose: dopo la salvi, la spacchetti in passi</p>`).join('');
  const tot = svuotaTotale();
  $('svuota-ok').textContent = tot ? `Aggiungi ${plurale(tot, 'cosa', 'cose')}` : 'Aggiungi';
  $('svuota-ok').disabled = !tot;
}
function posizioneSvuota() {
  const t = $('svuota-track'), p = $('svuota-pos');
  if (!t || !p) return;
  const col = t.firstElementChild, i = col ? Math.round(t.scrollLeft / Math.max(1, col.offsetWidth)) : 0;
  p.textContent = `${Math.min(aree().length, i + 1)} di ${aree().length} · ${aree()[Math.min(aree().length - 1, i)].nome}`;
}
async function salvaSvuota() {
  if (ui.svuota.fase === 'fatto') { closeModal('svuotaOverlay'); return; }
  const btn = $('svuota-ok');
  btn.disabled = true;
  const create = [];
  try {
    for (const [i, a] of aree().entries()) {
      const ctx = a.personale ? 'personale' : 'lavoro';
      for (const t of righeDi(ui.svuota.testi[i])) {
        const c = await upsertCiclo({ ...rigaNuova(t, { subito: false }, ctx), cat: catPerArea(a), macro_area: a.nome });
        if (c) create.push(c);
      }
    }
    state.cicli = [...create, ...state.cicli];
    ui.svuota = { ...ui.svuota, fase: 'fatto', create };
    btn.disabled = false;
    disegnaSvuota();
    render();
  } catch (e) {
    if (create.length) state.cicli = [...create, ...state.cicli];
    btn.disabled = false;
    showToast(`Salvate ${create.length}, poi errore: ${e.message}`, 'error');
    render();
  }
}

// ══════════════════════════════════════════════════════════════
