// v17 · 29/10 · COLLEGATE: mentre scrivi o detti, se c'è un nome (persona, cliente) o una parola che hai già usato,
// ti faccio vedere le cose aperte, quelle fatte e gli appuntamenti che la contengono.
// Basta una parola: «Arillo», «Raia», «muletti». Anche scritta minuscola o dettata.
// ══════════════════════════════════════════════════════════════
const V17 = { MAX: 5, FATTE_GIORNI: 180, EVT_PRIMA: 14, EVT_DOPO: 21, RARA: 6 };
let _v17Df = { k: '', df: new Map() };
// in quante cose compare ogni parola (per capire quali parole «dicono qualcosa»)
function frequenzeParole() {
  const k = `${state.cicli.length}`;
  if (_v17Df.k === k) return _v17Df.df;
  const df = new Map();
  state.cicli.forEach(c => new Set(paroleDopp(c.title).map(w => w.p)).forEach(p => df.set(p, (df.get(p) || 0) + 1)));
  _v17Df = { k, df };
  return df;
}
// i nomi veri (persone, clienti, sigle): maiuscola NON a inizio titolo, oppure tutto maiuscolo, oppure una persona dell'app.
// «Preventivo», «Chiedere», «Controlla» a inizio titolo non sono nomi.
const v17Verbo = p => /(?:are|ere|ire|arsi|ersi|irsi)$/.test(p) || /^(?:controlla|chiama|manda|scrivi|fai|vedi|senti|prepara|chiedi|ricorda|prendi|porta|metti|organizza)$/.test(p);
const V17_COMUNI = new Set('centro casa cliente clienti commerciale commerciali lead app strategia gestione definizione preventivo preventivi riunione call mail email progetto programma partner ufficio sito pagina post social video foto file documento documenti fattura fatture contratto contratti offerta ordine report piano lista info dati database materiale incontro appuntamento calendario settimana mese giorno anno lunedi martedi mercoledi giovedi venerdi sabato domenica claude plaud chatgpt google drive whatsapp telefono'.split(' '));
const v17Comune = p => V17_COMUNI.has(p) || DOPP_COMUNI.has(p) || DOPP_GENERICHE.has(p) || [...DOPP_COMUNI].some(c => c.length >= 6 && Math.abs(c.length - p.length) <= 1 && c[0] === p[0] && distanza(c, p, 1) <= 1);
let _v17Nomi = { k: '', nomi: new Set() };
function v17Nomi() {
  const k = `${state.cicli.length}:${(state.persone || []).length}`;
  if (_v17Nomi.k === k) return _v17Nomi.nomi;
  const nomi = new Set(), conti = new Map();
  (state.persone || []).forEach(pp => String(pp.nome || '').split(/\s+/).map(parolaPulita).filter(x => x.length >= 3).forEach(x => nomi.add(x)));
  state.cicli.forEach(c => {
    const parole = String(c.title || '').replace(/\[[^\]]*\]/g, ' ').split(/[\s\-–—+:/(),.;!?"«»']+/).filter(Boolean);
    parole.forEach((raw, i) => {
      const p = parolaPulita(raw), lettere = togliAccenti(raw).replace(/[^A-Za-z]/g, '');
      if (p.length < 3 || DOPP_VUOTE.has(p) || v17Comune(p) || v17Verbo(p)) return;
      const sigla = lettere.length >= 2 && lettere.length <= 6 && lettere === lettere.toUpperCase();
      if (i === 0 && !sigla) return;   // la prima parola del titolo ha sempre la maiuscola: non conta
      const s = conti.get(p) || { su: 0, giu: 0 };
      if (sigla || /^[A-ZÀ-Ý]/.test(raw)) s.su++; else s.giu++;
      conti.set(p, s);
    });
  });
  conti.forEach((s, p) => { if (s.su && s.su >= s.giu * 2) nomi.add(p); });   // maiuscola almeno 2 volte su 3
  _v17Nomi = { k, nomi };
  return nomi;
}
function candidatiCollegate() {
  const limite = toISODate(piuGiorni(new Date(), -V17.FATTE_GIORNI));
  const da = toISODate(piuGiorni(new Date(), -V17.EVT_PRIMA)), a = toISODate(piuGiorni(new Date(), V17.EVT_DOPO)), visti = new Set();
  const cose = state.cicli.filter(c => !isGiornaliero(c) && (!c.done || giornoIso(c.chiuso_at || c.updated_at) >= limite))
    .map(c => ({ tipo: c.done ? 'fatta' : 'aperta', c, titolo: c.parent_id && ciclo(c.parent_id) ? `${ciclo(c.parent_id).title} › ${c.title}` : c.title }));
  const evts = Object.values(ui.eventi || {}).flat().filter(e => e && e.giorno >= da && e.giorno <= a && !e.app && !e.routine && !eFiglie(e) && !visti.has(e.id) && visti.add(e.id))
    .map(e => ({ tipo: 'evento', e, titolo: e.titolo }));
  return [...cose, ...evts];
}
const _v17Cache = new Map();
function collegate(titolo) {
  const t = String(titolo || '').trim();
  if (t.length < 3) return { parole: [], lista: [] };
  const k = `${state.cicli.length}|${Object.keys(ui.eventi || {}).length}|${t}`;
  if (_v17Cache.has(k)) return _v17Cache.get(k);
  const nomi = v17Nomi(), df = frequenzeParole();
  const A = paroleDopp(t);
  const pNomi = [...new Set(A.filter(w => w.p.length >= 3 && nomi.has(w.p)).map(w => w.p))];
  const pRare = [...new Set(A.filter(w => !pNomi.includes(w.p) && w.p.length >= 5 && !v17Comune(w.p) && !v17Verbo(w.p) && (df.get(w.p) || 0) > 0 && (df.get(w.p) || 0) <= V17.RARA).map(w => w.p))];
  const persone = (state.persone || []).filter(p => pNomi.some(x => parolaPulita(String(p.nome || '').split(/\s+/)[0]) === x));
  const out = [];
  if (pNomi.length || pRare.length) candidatiCollegate().forEach(x => {
    const B = paroleDopp(x.titolo).map(w => w.p);
    const nomiPresi = pNomi.filter(p => B.some(b => stessaParola(p, b, true)));
    const rarePrese = pRare.filter(p => B.some(b => stessaParola(p, b, false)));
    const perPersona = x.c && persone.some(p => String(x.c.delega_persona_id) === String(p.id) || (x.c.persone_menzionate || []).includes(p.nome));
    const punti = nomiPresi.length * 3 + rarePrese.length + (perPersona && !nomiPresi.length ? 3 : 0);
    const rarissima = rarePrese.some(p => p.length >= 6 && (df.get(p) || 0) <= 3);   // una parola che hai usato 1–3 volte basta («muletti», «mansionario»)
    if (!nomiPresi.length && !perPersona && rarePrese.length < 2 && !rarissima) return;
    out.push({ ...x, punti, parole: [...nomiPresi, ...rarePrese] });
  });
  const ordine = { aperta: 0, evento: 1, fatta: 2 };
  out.sort((x, y) => y.punti - x.punti || ordine[x.tipo] - ordine[y.tipo] || String((y.c && (y.c.updated_at || y.c.created_at)) || (y.e && y.e.giorno)).localeCompare(String((x.c && (x.c.updated_at || x.c.created_at)) || (x.e && x.e.giorno))));
  const parole = [...new Set(out.flatMap(x => x.parole))];
  const r = { parole, lista: out };
  if (_v17Cache.size > 200) _v17Cache.clear();
  _v17Cache.set(k, r);
  return r;
}
const v17Parola = p => `«${p.length <= 3 ? p.toUpperCase() : maiuscola(p)}»`;
function htmlCollegate(titolo) {
  const { parole, lista } = collegate(titolo);
  if (!lista.length) return '';
  const nome = parole.slice(0, 2).map(v17Parola).join(' e ');
  const riga = x => {
    if (x.tipo === 'evento') return `<button type="button" class="v17-riga" data-act="v17-apri" data-evt="${esc(x.e.id)}"><i class="ti ti-calendar-event v17-evt" aria-hidden="true"></i><span>${escHtml(corta(x.titolo, 70))}</span><small>${escHtml(giornoEvento(x.e))}${x.e.ora ? ' · ' + x.e.ora : ''}</small></button>`;
    const q = computeEffectiveQ(x.c);
    return `<button type="button" class="v17-riga" data-act="v17-apri" data-id="${esc(x.c.id)}"><i class="ti ${x.tipo === 'fatta' ? 'ti-circle-check v17-fatta' : `ti-circle v17-q${q}`}" aria-hidden="true"></i><span>${escHtml(corta(x.titolo, 70))}</span><small>${x.tipo === 'fatta' ? `fatta il ${fmtGgMm(giornoIso(x.c.chiuso_at || x.c.updated_at))}` : (TIPI[q] || {}).label || ''}${x.c.ctx === 'personale' ? ' · Personale' : ''}</small></button>`;
  };
  const viste = lista.slice(0, V17.MAX);
  return `<div class="v17-coll"><p class="v17-testa"><i class="ti ti-link" aria-hidden="true"></i>Su ${nome} hai già <b class="mono">${lista.length}</b></p>${viste.map(riga).join('')}${lista.length > viste.length ? `<p class="v17-altre">e altre ${lista.length - viste.length}: cercale in Cose aperte</p>` : ''}</div>`;
}
// nel foglio Aggiungi: sotto ogni cosa
const _disegnaAnteprimaV17 = disegnaAnteprima;
disegnaAnteprima = function () {
  const r = _disegnaAnteprimaV17.apply(this, arguments);
  const box = $('rapido-anteprima');
  if (!box || box.hidden) return r;
  const voci = vociDi('rapido');
  box.querySelectorAll('.sn-voce[data-i], .rap-voce[data-i]').forEach(el => {
    const v = voci[+el.dataset.i];
    if (!v || el.querySelector('.v17-coll')) return;
    const h = htmlCollegate(v.title || v.testo);
    if (h) el.insertAdjacentHTML('beforeend', h);
  });
  return r;
};
// nel campo del telefono: quante, e «Modifica» le mostra
const _disegnaAnteprimaCatturaV17 = disegnaAnteprimaCattura;
disegnaAnteprimaCattura = function () {
  const r = _disegnaAnteprimaCatturaV17.apply(this, arguments);
  const box = $('cattura-anteprima');
  if (!box || box.hidden || box.querySelector('.v17-ca')) return r;
  const voci = vociDi('cattura');
  const tutte = new Set(), parole = new Set();
  voci.forEach(v => { const c = collegate(v.title || v.testo); c.lista.forEach(x => tutte.add(x.c ? x.c.id : x.e.id)); c.parole.forEach(p => parole.add(p)); });
  if (!tutte.size) return r;
  box.insertAdjacentHTML('beforeend', `<button type="button" class="v17-ca" data-act="cattura-modifica"><i class="ti ti-link" aria-hidden="true"></i>Su ${[...parole].slice(0, 2).map(v17Parola).join(' e ')} hai già ${tutte.size}: guarda</button>`);
  return r;
};
// toccando una collegata: la bozza resta, si apre la cosa o l'appuntamento
AZIONI['v17-apri'] = el => {
  closeModal('rapidoOverlay');
  if (el.dataset.evt) apriFoglioEvento(el.dataset.evt);
  else if (el.dataset.id) apriDettaglio(el.dataset.id);
};

// ══════════════════════════════════════════════════════════════
