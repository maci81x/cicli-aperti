// v25 · 2/11 · IL MENU SEGUE IL RITMO (strada A), L'ARMADIO DELLE SEZIONI (Leo), LA SEZIONE PROPOSTA ALLE COSE NUOVE
// · menu: Oggi · Settimana · Cicli · Altro, con il «quando» nei suggerimenti
// · in Oggi, sotto la testata: «Adesso tocca a…», cambia con l'ora e il giorno (mattina, giornata sul foglio, sera, venerdì, lunedì)
// · Cicli: vista «Armadio» (predefinita): una colonna per area (macro_aree) + «Da delegare» (le Delega) + «Da smistare» (lavoro senza area)
// · cose nuove di lavoro: la sezione la propone l'app dalle parole del titolo e dalle cose già smistate; se non sa, resta «Da smistare»
// ══════════════════════════════════════════════════════════════
const V25 = { RITMO_CHIUSO: 'v25_ritmo_chiuso' };
function v25Momento(d = new Date()) {
  const g = d.getDay(), h = d.getHours() + d.getMinutes() / 60, feriale = g >= 1 && g <= 5;
  const bp = state.bp, inviato = !!(bp && bp.inviato_at);
  if ((g === 5 && h >= 14) || g === 6 || g === 0) return inviato
    ? { k: 'ven-ok', ico: 'ti-check', t: 'Piano mandato a Leo', s: 'La settimana prossima è pronta. Se arrivano cose nuove, mettile nell\'armadio.', act: 'tab-tutto', btn: 'Apri l\'armadio' }
    : { k: 'ven', ico: 'ti-calendar-week', t: 'Venerdì: prepara la settimana prossima', s: 'Scegli le cose dall\'armadio, stampa un foglio per giorno e manda il piano a Leo.', act: 'wizard', btn: 'Prepara la settimana' };
  if (g === 1 && h < 9.5) return { k: 'lun', ico: 'ti-users', t: 'Lunedì: la riunione con i venditori', s: 'Confronta i loro piani con i risultati e i target. Prima, 10 minuti sulle urgenze.', act: 'v21-stampa-oggi', btn: 'Stampa il foglio di oggi' };
  if (feriale && h < 9.5) return { k: 'mattina', ico: 'ti-sunrise', t: 'Mattina: 10 minuti', s: 'Controlla «Da rispondere» e la giornata, poi stampa il foglio e lavora sulla carta.', act: 'v21-stampa-oggi', btn: 'Stampa il foglio di oggi' };
  if (feriale && h < 17.5) return { k: 'giorno', ico: 'ti-file-pencil', t: 'Giornata sul foglio', s: 'Qui torna solo per aggiungere le cose nuove che arrivano.', act: 'nuovo', btn: 'Aggiungi una cosa' };
  return { k: 'sera', ico: 'ti-moon', t: 'Sera: 2 minuti', s: 'Spunta quello che hai fatto sul foglio e metti dentro le cose nuove.', act: 'v16-riporta', btn: 'Riporta il foglio' };
}
AZIONI['v25-ritmo-chiudi'] = el => { try { sessionStorage.setItem(V25.RITMO_CHIUSO, el.dataset.k + toISODate(new Date())); } catch (_) {} render(); };

// --- l'armadio ---
if (!localStorage.getItem('cicli_tutto_v25')) { ui.tutto = 'armadio'; try { localStorage.setItem('cicli_tutto_v25', '1'); } catch (_) {} }
const V25_DELEGA = { nome: 'Da delegare', icona: 'ti-user-share', cls: 'delega' }, V25_SMISTA = { nome: 'Da smistare', icona: 'ti-inbox', cls: 'smista' };
function v25Colonne(lista) {
  const cols = aree().map(a => ({ ...a, cls: a.personale ? 'personale' : '', items: [] }));
  const delega = { ...V25_DELEGA, items: [] }, smista = { ...V25_SMISTA, items: [] };
  for (const c of lista) {
    if (computeEffectiveQ(c) === 3) { delega.items.push(c); continue; }
    const a = areaDi(c), col = a ? cols.find(x => x.nome === a) : null;
    if (col) col.items.push(c);
    else if (c.ctx === 'personale') { const f = cols.find(x => x.personale); (f || smista).items.push(c); }
    else smista.items.push(c);
  }
  const ord = (a, b) => (computeEffectiveQ(a) - computeEffectiveQ(b)) || String(a.due_date || '9').localeCompare(String(b.due_date || '9')) || String(a.title).localeCompare(String(b.title));
  [...cols, delega, smista].forEach(k => k.items.sort(ord));
  return [...cols, delega, smista];
}
function tuttoArmadio(lista) {
  const cols = v25Colonne(lista), opz = { evidenzia: ui.q.trim() || null, data: oggiLocale() };
  const stretto = window.innerWidth < 768;
  const corpo = k => k.items.length ? `<div class="group">${k.items.map(c => riga({ c, fatto: false }, opz)).join('')}</div>` : `<div class="col-vuota">${k.cls === 'smista' ? 'Tutto smistato' : 'Niente qui'}</div>`;
  if (stretto) {
    const prime = cols.filter(k => k.items.length);
    if (prime.length && !cols.some(k => ui.aperti.has('v25-' + k.nome))) ui.aperti.add('v25-' + prime[0].nome);
    return `<div class="armadio-tel">${cols.filter(k => k.items.length).map((k, i) => accordion('v25-' + (k.nome), `<i class="ti ${k.icona}" aria-hidden="true"></i> ${escHtml(k.nome)}`, `<span class="mono">${k.items.length}</span>`, corpo(k))).join('')}</div>`;
  }
  return `<div class="armadio" role="list" aria-label="Le sezioni dell'armadio">${cols.filter(k => k.items.length || !['delega', 'smista'].includes(k.cls)).map(k => `<section class="acol ${k.cls || ''}" role="listitem" aria-label="${esc(k.nome)}">
      <div class="acol-h"><i class="ti ${k.icona}" aria-hidden="true"></i><span>${escHtml(k.nome)}</span><span class="mono">${k.items.length}</span></div>${corpo(k)}</section>`).join('')}</div>`;
}
const _vistaTuttoV25 = vistaTutto;
vistaTutto = function () {
  let h = _vistaTuttoV25.apply(this, arguments);
  if (modoSemplice()) return h;
  h = h.replace('<h1>Cose aperte', '<h1>Cicli aperti');
  h = h.replace('<button type="button" data-act="tutto" data-v="lista"', `<button type="button" data-act="tutto" data-v="armadio" aria-pressed="${ui.tutto === 'armadio'}">Armadio</button><button type="button" data-act="tutto" data-v="lista"`);
  return h;
};
const _aggiornaTuttoV25 = aggiornaTutto;
aggiornaTutto = function () {
  if (modoSemplice() || ui.tutto !== 'armadio') return _aggiornaTuttoV25.apply(this, arguments);
  const corpo = $('tutto-corpo');
  if (!corpo) return;
  document.querySelectorAll('[data-act="tutto"]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === ui.tutto)));
  const nf = nFiltri(), bf = $('btn-filtri');
  if (bf) bf.innerHTML = `<i class="ti ti-adjustments-horizontal"></i>Filtri${nf ? ` <span class="badge">${nf}</span>` : ''}`;
  const lista = cicliFiltrati();
  const attesa = state.cicli.filter(c => vedi(c.ctx) && !c.done && isParcheggiato(c)).length;
  let h = lista.length ? tuttoArmadio(lista)
    : (ui.q || nf) ? vuoto('ti-search', 'Nessuna cosa trovata', 'Prova con un\'altra parola o togli un filtro.', `<button type="button" class="btn btn-secondary btn-sm" data-act="filtri-azzera">Togli i filtri</button>`)
    : vuoto('ti-layout-columns', 'L\'armadio è vuoto', 'Scrivi ogni cosa rimasta aperta, anche piccola: l\'app la mette nella sua sezione.', `<button type="button" class="btn btn-primary btn-sm" data-act="nuovo">Aggiungi la prima cosa</button>`);
  h += `<div class="group" style="margin-top:var(--sp-5)"><button type="button" class="riga-link" data-act="sub" data-tab="tutto" data-sub="attesa"><i class="ti ti-hourglass-empty"></i><span>Un giorno</span><small class="mono">${attesa}</small><i class="ti ti-chevron-right"></i></button></div>`;
  corpo.innerHTML = h;
};

// l'armadio usa tutta la larghezza, come la board della settimana
const v25ArmadioAttivo = () => ui.tab === 'tutto' && !ui.sub && ui.tutto === 'armadio' && !modoSemplice() && window.innerWidth >= 768;
const _disegnaV25 = disegna;
disegna = function () {
  _disegnaV25.apply(this, arguments);
  if (v25ArmadioAttivo()) $('view').classList.add('largo');
};
const _aggiornaTuttoV25b = aggiornaTutto;
aggiornaTutto = function () { _aggiornaTuttoV25b.apply(this, arguments); $('view').classList.toggle('largo', v25ArmadioAttivo() || boardAttiva()); };

// --- la sezione proposta alle cose nuove ---
const V25_PAROLE = [
  ['Vendite', /preventiv|offert|incass|insolut|scadut|fattur[ae] (aperte|da)|agent[ei]|commercial|venditor|target|lead|clien[ti]|segnalazion|affiancament|listino|rinnov|contratto|cross|upsell|appuntament/i],
  ['Produzione', /\bdvr\b|duvri|rspp|sopralluog|report|idoneit|medico|\basl\b|antincendio|primo soccorso|privacy|gdpr|piano d.emergenza|verbale|visite? medich|formazione (lavorator|dipendent)|haccp|sicurezza/i],
  ['Amministrazione', /\bfattur|contabil|bilanc|provvigion|\bpf\b|piano finanziario|bando|gestionale|promarsis|securmars|codic[ei] f\d|pagament|bonific|\bf24\b|tass[ae]|iva\b/i],
  ['Marketing', /sito|social|linkedin|instagram|facebook|brochure|marketing|campagn|\bads\b|newsletter|bexb|evento|fiera|logo|grafica/i],
  ['Formazione', /\bcorso\b|formazion|coach|beretta|iprofile|i-?profile|\bq2\b|webinar|lezione|studi/i],
  ['Ricerca e sviluppo', /\bapp\b|crm|software|odoo|essetech|test|claude|automazion|dashboard|intelligenza|\bai\b/i]
];
function v25Parole(t) { return String(t || '').toLowerCase().replace(/[^a-zàèéìòù0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 3); }
function v25SuggerisciArea(titolo) {
  const t = String(titolo || '');
  for (const [area, rx] of V25_PAROLE) if (rx.test(t) && nomiAree().includes(area)) return area;
  // somiglianza con le cose già smistate: la sezione con più parole in comune
  const parole = v25Parole(t); if (parole.length < 2) return null;
  const punti = new Map();
  for (const c of state.cicli) { const a = normArea(c.macro_area); if (!a || a === 'Management' || c.id === undefined) continue;
    const comuni = v25Parole(c.title).filter(w => parole.includes(w)).length; if (comuni >= 2) punti.set(a, (punti.get(a) || 0) + comuni); }
  const top = [...punti.entries()].sort((a, b) => b[1] - a[1])[0];
  return top && nomiAree().includes(top[0]) ? top[0] : null;
}
const _autoCategoriaV25 = autoCategoria;
autoCategoria = async function (title, note) {
  const area = v25SuggerisciArea(title);
  if (area) { setTimeout(() => showToast(`Messa in «${area}»`, 'info', { etichetta: 'Cambia', durata: 7000, annulla: () => { const c = state.cicli.find(x => x.title === title); if (c) apriDettaglio(c.id); } }), 900); return area; }
  try { return await _autoCategoriaV25.apply(this, arguments); } catch (e) { return null; }
};

// ══════════════════════════════════════════════════════════════
