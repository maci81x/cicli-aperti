// v5 · AREE i-TIME: le categorie sono un sotto-livello di un'area.
// Aree, ordine e categorie stanno in macro_aree (migration itime_b, applicata il 20/10).
// Qui resta solo come si presenta un'area: icona, categoria per le cose nuove, se è personale.
// ══════════════════════════════════════════════════════════════
const AREE_STILE = {
  'Management':                { icona: 'ti-crown', cat: 'management' },
  'Marketing':                 { icona: 'ti-speakerphone', cat: 'marketing' },
  'Vendite':                   { icona: 'ti-trending-up', cat: 'vendite' },
  'Amministrazione':           { icona: 'ti-file-text', cat: 'amministrazione' },
  'Produzione':                { icona: 'ti-building-factory-2', cat: 'produzione' },
  'Ricerca e sviluppo':        { icona: 'ti-flask', cat: 'rnd' },
  'Famiglia / cose personali': { icona: 'ti-home', cat: 'custom_1', personale: true },
  'Formazione':                { icona: 'ti-school', cat: 'management' }
};
const STILE_AREA_NUOVA = { icona: 'ti-tag', cat: 'management' };
// I nomi di prima (li scriveva la versione precedente, tolta il 22/10): qui si leggono come i nuovi.
const AREE_NOMI_VECCHI = { 'R&D': 'Ricerca e sviluppo', 'Personale': 'Famiglia / cose personali', 'HR': 'Formazione', 'Da Delegare': null };
state.areeDb = null;   // null = non ancora lette (o lettura fallita)

async function caricaAree() {
  try {
    const { data, error } = await db.from('macro_aree').select('*').order('ordine');
    if (error) throw error;
    state.areeDb = data || [];
  } catch (e) { console.warn('[Aree] lettura:', e.message); state.areeDb = null; }
}
const areeLette = () => Array.isArray(state.areeDb);
function aree() {
  if (!areeLette()) return [];
  return state.areeDb.slice().sort((a, b) => (a.ordine ?? 99) - (b.ordine ?? 99)).map(r => {
    const st = AREE_STILE[r.nome] || STILE_AREA_NUOVA;
    return { id: r.id, nome: r.nome, icona: st.icona, cats: r.categorie || [], cat: st.cat, personale: !!st.personale };
  });
}
function nomiAree() { return aree().map(a => a.nome); }
function normArea(nome) { return !nome ? null : nome in AREE_NOMI_VECCHI ? AREE_NOMI_VECCHI[nome] : nome; }
function areaDaCategoria(cat) { const a = cat ? aree().find(x => x.cats.includes(cat)) : null; return a ? a.nome : null; }
// L'area di una cosa: quella scelta a mano (o dall'assegnazione automatica), altrimenti quella della sua categoria.
function areaDi(c) { return c ? normArea(c.macro_area) || areaDaCategoria(c.cat) : null; }
function categoriaEsiste(k) {
  const m = /^custom_(.+)$/.exec(k);
  return m ? (state.categorie || []).some(c => String(c.id) === m[1]) : !!CAT_LABELS[k];
}
// Categoria da dare a una cosa nuova di un'area (Svuota la testa, esercizio Q2)
function catPerArea(a) {
  if (!a) return 'management';
  if (a.personale) return categoriaEsiste(a.cat) ? a.cat : 'casa';
  return categoriaEsiste(a.cat) ? a.cat : 'management';
}
const areaPerNome = nome => aree().find(a => a.nome === nome) || null;
function riempiSelectAree(valore) {
  const sel = $('f-macro-area');
  if (!sel) return;
  sel.innerHTML = '<option value="">Dalla categoria</option>' + nomiAree().map(n => `<option>${escHtml(n)}</option>`).join('');
  sel.value = nomiAree().includes(valore) ? valore : '';
}

// Impostazioni → Aree: ogni area con le sue categorie; si sposta una categoria o se ne aggiunge una.
function sezioneAree() {
  const mappate = areeLette();
  const usate = new Set(aree().flatMap(a => a.cats));
  const tutte = [...Object.keys(CAT_LABELS), ...(state.categorie || []).map(c => 'custom_' + c.id)];
  const libere = tutte.filter(k => !usate.has(k));
  const n = nome => state.cicli.filter(c => isAttivo(c) && areaDi(c) === nome).length;
  const chip = k => `<button type="button" class="chip" data-act="area-cat" data-k="${esc(k)}"${mappate ? '' : ' disabled'}><i class="ti ${catIconaTi(k)}"></i>${escHtml(catNome(k))}</button>`;
  const avviso = state.areeColOk === false
    ? `<div class="avviso"><i class="ti ti-alert-triangle"></i><span>Manca la colonna <span class="mono">macro_aree.categorie</span>: esegui <span class="mono">supabase_migration_itime_a.sql</span>.</span></div>`
    : !mappate ? `<div class="avviso"><i class="ti ti-alert-triangle"></i><span>Non riesco a leggere le aree. Controlla la connessione e riapri Impostazioni.</span></div>` : '';
  return `<p class="list-head"><span>Aree</span><span class="mono">${aree().length}</span></p>${avviso}
    <div class="group aree-lista">${aree().map(a => `<div class="area-riga"><div class="area-h"><i class="ti ${a.icona}"></i><b>${escHtml(a.nome)}</b><span class="mono t-caption faint">${n(a.nome)}</span></div>
      <div class="chips chips-wrap">${a.cats.filter(categoriaEsiste).map(chip).join('') || '<span class="t-caption faint">Nessuna categoria</span>'}</div></div>`).join('')}
      ${libere.length ? `<div class="area-riga"><div class="area-h"><i class="ti ti-tag"></i><b>Senza area</b></div><div class="chips chips-wrap">${libere.map(chip).join('')}</div></div>` : ''}
      <div class="riga-link riga-scelta"><i class="ti ti-plus"></i><label for="area-nuova">Un'area tua<small>Si aggiunge in fondo alle 8 di i-Time</small></label>
        <div class="tools-row"><input type="text" class="input" id="area-nuova" maxlength="40" placeholder="Nome dell'area"${mappate ? '' : ' disabled'}><button type="button" class="btn btn-secondary btn-sm" data-act="area-aggiungi"${mappate ? '' : ' disabled'}>Aggiungi</button></div></div>
      <button type="button" class="riga-link" data-act="aree-assegna"><i class="ti ti-sparkles"></i><span>Assegna l'area con Claude<small>Solo alle cose di lavoro senza area</small></span><span></span><i class="ti ti-chevron-right"></i></button>
    </div>`;
}
function apriSpostaCategoria(k) {
  const attuale = areaDaCategoria(k);
  ui.areaCat = k;
  $('area-sub').textContent = `${catNome(k)} · ora in ${attuale || 'nessuna area'}`;
  $('area-lista').innerHTML = aree().map(a => `<button type="button" class="riga-link" data-act="area-sposta" data-v="${esc(a.nome)}"${a.nome === attuale ? ' disabled' : ''}><i class="ti ${a.icona}"></i><span>${escHtml(a.nome)}</span><span></span>${a.nome === attuale ? '<i class="ti ti-check"></i>' : '<i class="ti ti-chevron-right"></i>'}</button>`).join('');
  $('areaOverlay').classList.add('open');
}
// Sposta la categoria `k` nell'area `dest`: la toglie dalla vecchia, la aggiunge alla nuova, e le sue cose cambiano area.
async function spostaCategoria(k, dest) {
  if (!areeLette()) return;
  const da = state.areeDb.find(r => (r.categorie || []).includes(k)) || null, a = state.areeDb.find(r => r.nome === dest);
  if (!a || da === a) { closeModal('areaOverlay'); return; }
  try {
    if (da) { const { error } = await db.from('macro_aree').update({ categorie: da.categorie.filter(x => x !== k) }).eq('id', da.id); if (error) throw error; }
    const { error } = await db.from('macro_aree').update({ categorie: [...(a.categorie || []), k] }).eq('id', a.id);
    if (error) throw error;
    const { error: e2 } = await db.from('cicli').update({ macro_area: dest }).eq('cat', k);
    if (e2) throw e2;
    state.cicli = state.cicli.map(c => c.cat === k ? { ...c, macro_area: dest } : c);
    await caricaAree();
    closeModal('areaOverlay');
    render();
    showToast(`${catNome(k)} ora è in ${dest}`, 'success', da ? { annulla: () => spostaCategoria(k, da.nome) } : undefined);
  } catch (e) { showToast('Non riesco a spostarla: ' + e.message, 'error'); await caricaAree(); render(); }
}
async function aggiungiArea() {
  const nome = ($('area-nuova').value || '').trim();
  if (!nome) { $('area-nuova').focus(); return; }
  if (nomiAree().some(n => n.toLowerCase() === nome.toLowerCase())) { showToast('Questa area c\'è già', 'warn'); return; }
  try {
    const ordine = Math.max(0, ...(state.areeDb || []).map(r => r.ordine || 0)) + 1;
    const { error } = await db.from('macro_aree').insert({ nome, icona: 'tag', colore: '#64748b', ordine, categorie: [] });
    if (error) throw error;
    await caricaAree();
    render();
    showToast(`Area aggiunta: ${nome}`, 'success');
  } catch (e) { showToast('Area non aggiunta: ' + e.message, 'error'); }
}

// ══════════════════════════════════════════════════════════════
