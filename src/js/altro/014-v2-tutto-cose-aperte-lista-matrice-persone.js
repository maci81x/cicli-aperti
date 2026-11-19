// v2 · TUTTO (Cose aperte): Lista · Matrice · Persone, filtri, Un giorno
// ══════════════════════════════════════════════════════════════
function cicliFiltrati() {
  const q = ui.q.trim().toLowerCase();
  const semplice = modoSemplice();   // in modalità semplice niente filtri, solo la ricerca
  return state.cicli.filter(c => {
    if (!vedi(c.ctx) || !isAttivo(c)) return false;
    if (c.parent_id && !q && state.passiColOk) return false;   // i passi stanno dentro la loro cosa (si trovano cercando)
    if (semplice) return !q || (c.title || '').toLowerCase().includes(q) || (c.note || '').toLowerCase().includes(q);
    if (ui.filtri.cats.size && !ui.filtri.cats.has(String(c.cat))) return false;
    if (ui.filtri.tipi.size && !ui.filtri.tipi.has(String(computeEffectiveQ(c)))) return false;
    if (ui.filtri.aree.size && !ui.filtri.aree.has(String(areaDi(c)))) return false;
    if (q && !((c.title || '').toLowerCase().includes(q) || (c.note || '').toLowerCase().includes(q) || (c.persone_menzionate || []).some(p => p.toLowerCase().includes(q)))) return false;
    return true;
  }).sort((a, b) => (computeEffectiveQ(a) - computeEffectiveQ(b)) || String(a.due_date || '9999').localeCompare(String(b.due_date || '9999')) || String(b.created_at || '').localeCompare(String(a.created_at || '')));
}

function vistaTutto() {
  const seg = [['lista', 'Lista'], ['matrice', 'Matrice'], ['persone', 'Persone']].map(([k, l]) =>
    `<button type="button" data-act="tutto" data-v="${k}" aria-pressed="${ui.tutto === k}">${l}</button>`).join('');
  if (modoSemplice()) return `<div class="vh"><div><h1>Cose</h1></div></div>
    <div class="tools"><label class="cerca solo-tel"><i class="ti ti-search" aria-hidden="true"></i><input type="search" id="searchInputM" name="q-nofill-m" placeholder="Cerca" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Cerca tra le cose" value="${esc(ui.q)}"></label></div>
    <div id="tutto-corpo"></div>`;
  return `<div class="vh"><div><h1>Cose aperte${btnAiuto('tutto')}</h1></div></div>
    <div class="tools">
      <label class="cerca solo-tel"><i class="ti ti-search" aria-hidden="true"></i><input type="search" id="searchInputM" name="q-nofill-m" placeholder="Cerca" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Cerca tra le cose aperte" value="${esc(ui.q)}"></label>
      <div class="tools-row"><div class="seg grow" role="group" aria-label="Vista">${seg}</div>
        <button type="button" class="btn btn-secondary btn-sm" data-act="filtri" id="btn-filtri"><i class="ti ti-adjustments-horizontal"></i>Filtri</button></div>
    </div>
    <div id="tutto-corpo"></div>`;
}

function aggiornaTutto() {
  const corpo = $('tutto-corpo');
  if (!corpo) return;
  if (modoSemplice()) {
    const lista = cicliFiltrati();
    corpo.innerHTML = lista.length
      ? `<div class="group">${lista.map(c => riga({ c, fatto: false }, { evidenzia: ui.q.trim() || null, data: oggiLocale() })).join('')}</div>`
      : ui.q ? vuoto('ti-search', 'Nessuna cosa trovata', 'Prova con un\'altra parola.') : vuoto('ti-stack-2', 'Qui dentro va tutto quello che hai in testa', 'Tocca + e scrivi la prima cosa.', `<button type="button" class="btn btn-primary btn-sm" data-act="nuovo">Aggiungi la prima cosa</button>`);
    return;
  }
  document.querySelectorAll('[data-act="tutto"]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === ui.tutto)));
  const nf = nFiltri();
  $('btn-filtri').innerHTML = `<i class="ti ti-adjustments-horizontal"></i>Filtri${nf ? ` <span class="badge">${nf}</span>` : ''}`;
  const lista = cicliFiltrati();
  const attesa = state.cicli.filter(c => vedi(c.ctx) && !c.done && isParcheggiato(c)).length;
  let h = '';
  if (!lista.length) {
    const filtrato = ui.q || nf;
    h = filtrato
      ? vuoto('ti-search', 'Nessuna cosa trovata', 'Prova con un\'altra parola o togli un filtro.', `<button type="button" class="btn btn-secondary btn-sm" data-act="filtri-azzera">Togli i filtri</button>`)
      : vuoto('ti-stack-2', 'Qui dentro va tutto quello che hai in testa', 'Scrivi ogni cosa rimasta aperta, anche piccola. Poi decidi quando farla.', `<button type="button" class="btn btn-primary btn-sm" data-act="nuovo">Aggiungi la prima cosa</button>`);
  } else if (ui.tutto === 'matrice') h = tuttoMatrice(lista);
  else if (ui.tutto === 'persone') h = tuttoPersone(lista);
  else h = tuttoLista(lista);
  h += `<div class="group" style="margin-top:var(--sp-5)"><button type="button" class="riga-link" data-act="sub" data-tab="tutto" data-sub="attesa"><i class="ti ti-hourglass-empty"></i><span>Un giorno</span><small class="mono">${attesa}</small><i class="ti ti-chevron-right"></i></button></div>`;
  corpo.innerHTML = h;
}

function gruppiPer(lista, come) {
  const g = new Map();
  const metti = (k, etichetta, c, ord) => { if (!g.has(k)) g.set(k, { etichetta, items: [], ord }); g.get(k).items.push(c); };
  lista.forEach(c => {
    if (come === 'categoria') metti(c.cat || '', catNome(c.cat) || 'Senza categoria', c, catNome(c.cat) || 'zzz');
    else if (come === 'area') { const a = areaDi(c), i = nomiAree().indexOf(a); metti(a || '', a || 'Senza area', c, i < 0 ? 'zzz' : String(i).padStart(2, '0')); }
    else if (come === 'persona') { const ps = (c.persone_menzionate || []).filter(Boolean); if (!ps.length) metti('', 'Nessuna persona', c, 'zzz'); ps.forEach(p => metti(p, p, c, p)); }
    else { const q = computeEffectiveQ(c); metti(String(q), tagTipo(q), c, String(q)); }
  });
  return [...g.values()].sort((a, b) => String(a.ord).localeCompare(String(b.ord)));
}

function tuttoLista(lista) {
  const opz = [['tipo', 'Tipo'], ['categoria', 'Categoria'], ['area', 'Area'], ['persona', 'Persona']];
  let h = `<div class="tools-row" style="margin-bottom:var(--sp-2)"><label class="t-label muted" for="raggruppa">Raggruppa per</label>
    <select id="raggruppa" class="sel-inline" data-act="raggruppa">${opz.map(([k, l]) => `<option value="${k}"${ui.raggruppa === k ? ' selected' : ''}>${l}</option>`).join('')}</select>
    <span class="grow"></span><span class="mono t-label faint">${lista.length}</span></div>`;
  gruppiPer(lista, ui.raggruppa).forEach(gr => {
    h += `<p class="list-head"><span>${ui.raggruppa === 'tipo' ? gr.etichetta : escHtml(gr.etichetta)}</span><span class="mono">${gr.items.length}</span></p>
      <div class="group">${gr.items.map(c => riga({ c, fatto: false }, { suggerisci: true, evidenzia: ui.q.trim() || null, data: oggiLocale() })).join('')}</div>`;
  });
  return h;
}

function tuttoMatrice(lista) {
  const MAX = window.innerWidth >= 768 ? 8 : 4;
  return `<div class="matrice">${[1, 2, 3, 4].map(q => {
    const rs = lista.filter(c => computeEffectiveQ(c) === q);
    return `<div class="group mq"><button type="button" class="mq-h" data-act="mq" data-q="${q}" data-tip="${esc(TIPI[q].osm)}">${tagTipo(q).replace(/ data-tip="[^"]*"/, '')}<span class="mono">${rs.length}</span></button>
      ${rs.slice(0, MAX).map(c => `<button type="button" class="mq-r" data-act="apri" data-id="${c.id}">${escHtml(c.title)}</button>`).join('')}
      ${rs.length > MAX ? `<div class="mq-piu">e altre ${rs.length - MAX}</div>` : ''}
      ${rs.length ? '' : `<div class="mq-piu">${TIPI[q].aiuto}</div>`}</div>`;
  }).join('')}</div>`;
}

function tuttoPersone(lista) {
  const gr = gruppiPer(lista, 'persona').filter(g => g.etichetta !== 'Nessuna persona');
  if (!gr.length) return vuoto('ti-users', 'Nessuna persona collegata', 'Apri una cosa e scrivi con chi la devi fare: la ritrovi qui.');
  return gr.map(g => `<p class="list-head"><span><span class="avatar">${escHtml(g.etichetta.charAt(0).toUpperCase())}</span> ${escHtml(g.etichetta)}</span><span class="mono">${g.items.length}</span></p>
    <div class="group">${g.items.map(c => riga({ c, fatto: false }, { data: oggiLocale() })).join('')}</div>`).join('');
}

function indietro(tab, etichetta) { return `<button type="button" class="back" data-act="sub" data-tab="${tab}" data-sub=""><i class="ti ti-chevron-left"></i>${etichetta}</button>`; }

function vistaAttesa() {
  const lista = state.cicli.filter(c => vedi(c.ctx) && !c.done && isParcheggiato(c))
    .sort((a, b) => String(b.parcheggiato_at || '').localeCompare(String(a.parcheggiato_at || '')));
  let h = `${indietro('tutto', 'Cose aperte')}<div class="vh"><div><h1>Un giorno${btnAiuto('attesa')}</h1></div></div>`;
  if (!lista.length) return h + vuoto('ti-hourglass-empty', 'Niente qui', 'Quello che decidi di lasciar stare finisce qui: un giorno, forse. Fuori dalla vista.', `<button type="button" class="btn btn-secondary btn-sm" data-act="sub" data-tab="tutto" data-sub="">Torna alle cose aperte</button>`);
  return h + `<div class="group">${lista.map(c => `<div class="item" data-id="${c.id}"><div class="item-row no-check">
      <button type="button" class="item-main" data-act="apri"><span class="item-title">${escHtml(c.title)}</span><span class="item-meta">${tagTipo(c.q)}${c.parcheggiato_at ? `<span class="sep">·</span><span>dal ${fmtCorta(new Date(c.parcheggiato_at))}</span>` : ''}</span></button>
      <span class="item-side"><button type="button" class="btn btn-secondary btn-sm" data-act="riattiva">Riprendi</button></span></div></div>`).join('')}</div>`;
}

// ══════════════════════════════════════════════════════════════
