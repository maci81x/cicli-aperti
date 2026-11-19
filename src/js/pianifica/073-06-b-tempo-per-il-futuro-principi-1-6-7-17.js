// ══════════════════════════════════════════════════════════════
// B · TEMPO PER IL FUTURO (principi 1, 6, 7, 17): 25–30% del tempo di lavoro sulle Importanti
// Futuro = minuti delle cose Importanti nel piano (durata, 30 min se non c'è) + Esercizio Q2 in agenda.
// Tempo di lavoro = lun–ven 9–19 (50 ore), oppure di più se tra cose, cuscinetti e appuntamenti ne hai messe di più.
// ══════════════════════════════════════════════════════════════
const minFinestra = e => {
  if (!e || !e.ora || !e.fine || e.tuttoIlGiorno || (typeof eGiornata === 'function' && eGiornata(e))) return 0;
  const s = Math.max(minDi(e.ora), minDi(GIORNATA.INIZIO)), f = Math.min(minDi(e.fine) > minDi(e.ora) ? minDi(e.fine) : 24 * 60, minDi(GIORNATA.FINE));
  return Math.max(0, f - s);
};
const eQ2App = e => !!e && (e.app === 'q2' || (!!e.app && /esercizio q2/i.test(e.titolo || '')));
function quotaDa(p) {
  const disponibile = PRINC.GIORNI_LAV * (minDi(GIORNATA.FINE) - minDi(GIORNATA.INIZIO));
  const pianificato = p.cose + p.cusc + p.app;
  const base = Math.max(disponibile, pianificato);
  const futuro = p.importanti + p.q2;
  const pct = base ? Math.round(futuro / base * 100) : 0;
  const manca = Math.max(0, Math.ceil(base * PRINC.FUTURO_MIN / 100) - futuro);
  return { ...p, disponibile, pianificato, base, futuro, pct, manca };
}
const giorniLav = () => GIORNI.slice(0, PRINC.GIORNI_LAV);
function eventiLavoro(dataDi) {
  const evs = giorniLav().flatMap((_, idx) => eventiDelGiorno(dataDi(idx)));
  const visti = new Set();
  return evs.filter(e => e && !e.routine && !visti.has(e.id) && visti.add(e.id));
}
// La settimana in vista (Pianifica, Chiudi la settimana): tutte e due le parti, lavoro e personale
function quotaSettimana() {
  const prima = state.ctx, righe = [];
  try {
    for (const ctx of ['lavoro', 'personale']) { state.ctx = ctx; righe.push(...[...giorniLav().map(g => g.key), 'settimana'].flatMap(k => righeGiorno(k))); }
  } finally { state.ctx = prima; }
  const visti = new Set(), uniche = righe.filter(r => !visti.has(r.c.id) && visti.add(r.c.id));
  const dur = r => r.durata || BP_DURATA_DEFAULT;
  const evs = eventiLavoro(dataDelGiorno);
  return quotaDa({
    importanti: uniche.filter(r => r.c.q === 2).reduce((s, r) => s + dur(r), 0),
    cose: uniche.reduce((s, r) => s + dur(r), 0), n: uniche.length,
    cusc: giorniLav().reduce((s, _, idx) => s + cuscinettiDelGiorno(dataDelGiorno(idx)).reduce((t, i) => t + bpDurata(i), 0), 0),
    app: evs.reduce((s, e) => s + minFinestra(e), 0),
    q2: evs.filter(eQ2App).reduce((s, e) => s + minFinestra(e), 0)
  });
}
// Il wizard: quello che stai mettendo nel piano
function quotaWizard() {
  const voci = [..._bpwSel.entries()].map(([id, v]) => ({ c: ciclo(id), v })).filter(x => x.c);
  const dur = x => x.v.durata || BP_DURATA_DEFAULT;
  const evs = eventiLavoro(idx => bpDataGiorno(_bpwWeek, _bpwYear, idx));
  const lav = new Set(giorniLav().map(g => g.key));
  return quotaDa({
    importanti: voci.filter(x => x.c.q === 2).reduce((s, x) => s + dur(x), 0),
    cose: voci.reduce((s, x) => s + dur(x), 0), n: voci.length,
    cusc: [..._bpwCusc.values()].filter(v => lav.has(v.giorno)).reduce((s, v) => s + (v.durata || CUSC.DURATA), 0),
    app: evs.reduce((s, e) => s + minFinestra(e), 0),
    q2: evs.filter(eQ2App).reduce((s, e) => s + minFinestra(e), 0)
  });
}
function oreTesto(min) {
  const mezze = Math.max(1, Math.ceil(min / 30)), h = Math.floor(mezze / 2), mezza = mezze % 2;
  if (!h) return 'mezz\'ora';
  return `${h === 1 ? 'un\'ora' : h + ' ore'}${mezza ? ' e mezza' : ''}`;
}
const fmtT = m => m ? fmtTempo(m) : '0 min';
function testoCome(q) {
  return `Conto i minuti che hai messo sulle Importanti (le cose segnate Importante, con la loro durata; 30 minuti se non ce l'hanno)${q.q2 ? ' più l\'Esercizio Q2 in agenda' : ''}: <b>${fmtT(q.futuro)}</b>. `
    + `Li divido per il tempo di lavoro della settimana: da lunedì a venerdì, dalle 9 alle 19 (${fmtT(q.disponibile)}). `
    + (q.pianificato > q.disponibile ? `Hai pianificato di più (${fmtT(q.pianificato)} tra cose, cuscinetti e appuntamenti): uso questo. ` : `Tra cose, cuscinetti e appuntamenti hai pianificato ${fmtT(q.pianificato)}. `)
    + `Obiettivo: il 25–30% per il futuro.`;
}
const statoFuturo = pct => pct < PRINC.FUTURO_MIN ? 'basso' : pct <= PRINC.FUTURO_MAX ? 'ok' : 'alto';
const FUTURO_SCALA = 50;   // la barra va da 0 al 50%: la fascia 25–30 sta a metà e si vede bene
function htmlFuturo(q, chiave) {
  const st = statoFuturo(q.pct), sc = FUTURO_SCALA;
  const aperto = ui.futuroCome && ui.futuroCome[chiave] ? ' open' : '';
  const banda = `left:${PRINC.FUTURO_MIN / sc * 100}%;width:${(PRINC.FUTURO_MAX - PRINC.FUTURO_MIN) / sc * 100}%`;
  const stato = st === 'basso' ? ['ti-alert-circle', 'Sotto l\'obiettivo.', `Blocca almeno ${oreTesto(q.manca)} per le Importanti, come appuntamenti veri.`]
    : st === 'ok' ? ['ti-circle-check', 'Nell\'obiettivo.', 'Tieni le Importanti bloccate in agenda come appuntamenti veri.']
    : ['ti-circle-check', 'Sopra l\'obiettivo.', q.pct > 45 ? 'Tanto futuro: controlla che le urgenze vere abbiano ancora spazio (i cuscinetti).' : 'Il futuro ha il suo spazio.'];
  return `<div class="futuro" data-stato="${st}" data-futuro="${chiave}">
    <div class="futuro-testa"><span class="futuro-tit"><i class="ti ti-seeding" aria-hidden="true"></i>Tempo per il futuro</span><span class="futuro-pct mono">${q.pct}%</span></div>
    <div class="futuro-bar" role="img" aria-label="${q.pct}% del tempo di lavoro sulle Importanti, obiettivo 25–30%"><i style="width:${Math.min(100, q.pct / sc * 100)}%"></i><span class="futuro-banda" style="${banda}"></span></div>
    <div class="futuro-scala" aria-hidden="true"><span class="mono">0</span><span class="obj" style="left:${(PRINC.FUTURO_MIN + PRINC.FUTURO_MAX) / 2 / sc * 100}%">obiettivo 25–30%</span><span class="mono">50%</span></div>
    <p class="futuro-stato"><i class="ti ${stato[0]}" aria-hidden="true"></i><span><b>${stato[1]}</b> ${stato[2]}</span></p>
    <details class="futuro-come" data-k="${chiave}"${aperto}><summary><i class="ti ti-chevron-right" aria-hidden="true"></i>Come lo calcolo</summary><p>${testoCome(q)}</p></details></div>`;
}
ui.futuroCome = {};
document.addEventListener('toggle', e => { const d = e.target; if (d && d.matches && d.matches('details.futuro-come')) ui.futuroCome[d.dataset.k] = d.open; }, true);

// Mete nel piano della settimana: quante Importanti per meta, e quelle ferme da 4 settimane
function htmlMetePiano(perMeta, extraDi) {
  const l = meteAperte();
  if (!l.length || !state.metaColOk) return '';
  const ferme = [];
  const voci = l.map(m => {
    const n = perMeta.get(String(m.id)) || 0;
    if (!n && metaFerma(m, extraDi ? extraDi(m) : null)) ferme.push(m);
    return `<li><span class="fm-nome"><i class="ti ti-flag" aria-hidden="true"></i><span>${escHtml(m.testo)}</span></span><span class="fm-n${n ? '' : ' zero'}">${n ? `<b class="mono">${n}</b> ${n === 1 ? 'Importante' : 'Importanti'}` : 'nessuna'}</span></li>`;
  }).join('');
  const avviso = ferme.length ? `<li class="ferma"><i class="ti ti-zzz" aria-hidden="true"></i><span>Da 4 settimane niente per ${ferme.length === 1 ? 'questa meta' : 'queste mete'}: ${ferme.map(m => '«' + escHtml(corta(m.testo, 30)) + '»').join(', ')}. Scegli un'Importante che ti avvicina.</span></li>` : '';
  return `<div class="bpw-mete"><span class="field-label">Le tue mete in questo piano</span><ul class="futuro-mete">${voci}${avviso}</ul></div>`;
}
function disegnaFuturoWizard() {
  const corpo = $('bpw-step2');
  if (!corpo || !_bpwWeek) return;
  let box = $('bpw-futuro');
  if (!box) { corpo.insertAdjacentHTML('afterbegin', '<div id="bpw-futuro" class="bpw-futuro"></div>'); box = $('bpw-futuro'); }
  const perMeta = new Map();
  [..._bpwSel.keys()].map(ciclo).filter(c => c && c.q === 2 && c.meta_id).forEach(c => perMeta.set(String(c.meta_id), (perMeta.get(String(c.meta_id)) || 0) + 1));
  box.innerHTML = htmlFuturo(quotaWizard(), 'wizard') + htmlMetePiano(perMeta, m => [..._bpwSel.keys()].map(ciclo).some(c => c && String(c.meta_id || '') === String(m.id)) ? [oggiLocale()] : null);
}
const _bpwRenderStep2Pr = bpwRenderStep2;
bpwRenderStep2 = function () { const r = _bpwRenderStep2Pr.apply(this, arguments); disegnaFuturoWizard(); return r; };

// In Settimana: una pillola compatta in testa, tocchi e vedi come lo calcolo
function chipFuturo() {
  const q = quotaSettimana();
  if (!q.n) return '';
  const sc = FUTURO_SCALA;
  return `<button type="button" class="futuro-chip" data-stato="${statoFuturo(q.pct)}" data-act="futuro-come" data-tip="Tempo per il futuro: ${q.pct}% (obiettivo 25–30%)" aria-label="Tempo per il futuro: ${q.pct}%, obiettivo 25–30%. Come lo calcolo"><i class="ti ti-seeding" aria-hidden="true"></i>Futuro <b class="mono">${q.pct}%</b><span class="fchip-bar" aria-hidden="true"><i style="width:${Math.min(100, q.pct / sc * 100)}%"></i><s style="left:${PRINC.FUTURO_MIN / sc * 100}%;width:${(PRINC.FUTURO_MAX - PRINC.FUTURO_MIN) / sc * 100}%"></s></span></button>`;
}
const _navSettimanaPr = navSettimana;
navSettimana = function () { const c = chipFuturo(); return _navSettimanaPr.apply(this, arguments) + (c ? `<div class="futuro-riga">${c}</div>` : ''); };
const _testaBoardPr = testaBoard;
testaBoard = function () { const h = _testaBoardPr.apply(this, arguments), c = chipFuturo(); return c ? h.replace(/(<p class="bt-stat">[\s\S]*?)(<\/p>)/, `$1${c}$2`) : h; };
document.body.insertAdjacentHTML('beforeend', `
<div class="modal-overlay" id="futuroOverlay" onclick="closeModalOnBg(event,'futuroOverlay')">
  <div class="modal sheet sheet-narrow" role="dialog" aria-modal="true" aria-labelledby="futuro-titolo">
    <div class="sheet-grab"></div>
    <div class="sheet-head"><h3 class="t-title" id="futuro-titolo">Tempo per il futuro</h3><button type="button" class="btn btn-icon" onclick="closeModal('futuroOverlay')" aria-label="Chiudi"><i class="ti ti-x"></i></button></div>
    <div id="futuro-corpo"></div>
  </div>
</div>`);
AZIONI['futuro-come'] = () => {
  const q = quotaSettimana();
  ui.futuroCome = { ...ui.futuroCome, foglio: true };
  $('futuro-corpo').innerHTML = htmlFuturo(q, 'foglio') + `<p class="t-caption muted futuro-principio">Principio 1: il tempo per il futuro va messo in agenda per primo. Le Importanti non urgenti, se non le blocchi, le mangiano le urgenze.</p>`;
  $('futuroOverlay').classList.add('open');
};

