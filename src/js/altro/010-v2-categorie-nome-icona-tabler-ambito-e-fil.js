// v2 · CATEGORIE (nome + icona Tabler + ambito) E FILTRI
// ══════════════════════════════════════════════════════════════
function apriCategoria(id, poi) {
  const cat = id ? state.categorie.find(c => c.id === id) : null;
  ui.cat = { id: id || null, icona: cat && /^ti-/.test(cat.emoji || '') ? cat.emoji : 'ti-tag', ctx: (cat && cat.ctx) || state.ctx, poi: poi || null };
  $('cat-titolo').textContent = cat ? 'Modifica categoria' : 'Nuova categoria';
  $('cat-nome').value = cat ? cat.nome : '';
  disegnaIconeCategoria();
  impostaScelta('cat-ctx', ui.cat.ctx);
  $('catOverlay').classList.add('open');
  setTimeout(() => $('cat-nome').focus(), 150);
}
function disegnaIconeCategoria() {
  $('cat-icone').innerHTML = CAT_ICONE_SCELTA.map(i => `<button type="button" data-act="cat-icona" data-v="${i}" aria-pressed="${i === ui.cat.icona}" aria-label="${i.slice(3)}"><i class="ti ${i}"></i></button>`).join('');
}
async function salvaCategoria() {
  const nome = $('cat-nome').value.trim();
  if (!nome) { showToast('Dai un nome alla categoria', 'warn'); return; }
  const riga = { nome, emoji: ui.cat.icona, ctx: ui.cat.ctx };
  try {
    let salvata = null;
    if (ui.cat.id) {
      const { data, error } = await db.from('categorie').update(riga).eq('id', ui.cat.id).select();
      if (error) throw error;
      salvata = data && data[0];
      state.categorie = state.categorie.map(c => c.id === ui.cat.id ? { ...c, ...riga } : c);
    } else {
      const { data, error } = await db.from('categorie').insert({ ...riga, ordine: state.categorie.length, created_at: new Date().toISOString() }).select();
      if (error) throw error;
      salvata = data && data[0];
      if (salvata) state.categorie = [...state.categorie, salvata];
    }
    closeModal('catOverlay');
    showToast(ui.cat.id ? 'Categoria aggiornata' : 'Categoria aggiunta', 'success');
    if (ui.cat.poi === 'dettaglio' && salvata) { setModalCtx(salvata.ctx, true); $('f-cat').value = 'custom_' + salvata.id; }
    if (ui.cat.poi === 'filtri') disegnaFiltri();
    render();
  } catch (e) { showToast('Errore: ' + e.message, 'error'); }
}

function categorieDelContesto() {
  const builtin = (ctxVista() === 'tutti' ? [...new Set([...(CAT_BUILTIN.lavoro || []), ...(CAT_BUILTIN.personale || [])])] : (CAT_BUILTIN[ctxVista()] || [])).map(k => ({ v: k, nome: CAT_LABELS[k] || k }));
  const custom = (state.categorie || []).filter(c => vedi(c.ctx)).sort((a, b) => (a.ordine ?? 0) - (b.ordine ?? 0)).map(c => ({ v: 'custom_' + c.id, nome: c.nome }));
  return [...builtin, ...custom];
}
function nFiltri() { return ui.filtri.cats.size + ui.filtri.tipi.size + ui.filtri.aree.size; }

function apriFiltri() { disegnaFiltri(); $('filtriOverlay').classList.add('open'); }
function disegnaFiltri() {
  const base = state.cicli.filter(c => vedi(c.ctx) && isAttivo(c));
  const conta = fn => base.filter(fn).length;
  const chip = (gruppo, v, testo, n, icona) => `<button type="button" class="chip" data-act="filtro" data-g="${gruppo}" data-v="${esc(v)}" aria-pressed="${ui.filtri[gruppo].has(String(v))}">${icona ? `<i class="ti ${icona}"></i>` : ''}${escHtml(testo)} <span class="mono">${n}</span></button>`;
  const cats = categorieDelContesto().map(k => ({ ...k, n: conta(c => c.cat === k.v) })).filter(k => k.n > 0 || k.v.startsWith('custom_'));
  const aree = nomiAree().map(a => ({ a, n: conta(c => areaDi(c) === a) })).filter(x => x.n > 0);
  $('filtri-body').innerHTML = `
    <div class="fil-sez"><span class="field-label">Tipo</span><div class="chips chips-wrap">${[1, 2, 3, 4].map(q => chip('tipi', q, TIPI[q].label, conta(c => computeEffectiveQ(c) === q), TIPI[q].icon)).join('')}</div></div>
    <div class="fil-sez"><span class="field-label">Categoria</span><div class="chips chips-wrap">${cats.map(k => chip('cats', k.v, k.nome, k.n, catIconaTi(k.v))).join('')}</div>
      <button type="button" class="btn btn-ghost btn-sm fil-nuova" data-act="cat-nuova" data-poi="filtri"><i class="ti ti-plus"></i>Nuova categoria</button></div>
    ${aree.length ? `<div class="fil-sez"><span class="field-label">Area</span><div class="chips chips-wrap">${aree.map(x => chip('aree', x.a, x.a, x.n)).join('')}</div></div>` : ''}`;
  $('filtri-ok').textContent = `Mostra ${plurale(cicliFiltrati().length, 'cosa', 'cose')}`;
}

// ══════════════════════════════════════════════════════════════
