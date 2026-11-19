// ══════════════════════════════════════════════════════════════
// 5 · PREPARA LA SETTIMANA IN DUE PASSI
// Passo 1 «Ecco la mia proposta» · Passo 2 «Le ho messe nei buchi liberi». Usa lo stato del wizard
// (_bpwSel, _bpwCusc, _bpwRif) e lo attiva con bpAttiva: il piano si salva come prima.
// ══════════════════════════════════════════════════════════════
document.body.insertAdjacentHTML('beforeend', `
<div class="modal-overlay" id="bpSnOverlay">
  <div class="modal sheet sheet-wide bp-sn" role="dialog" aria-modal="true" aria-labelledby="bpsn-titolo">
    <div class="sheet-head">
      <div class="sheet-head-txt"><p class="t-caption muted" id="bpsn-sotto">—</p><h3 class="t-title" id="bpsn-titolo">Ecco la mia proposta</h3></div>
      <button type="button" class="btn btn-icon" data-act="bpsn-chiudi" aria-label="Chiudi"><i class="ti ti-x"></i></button>
    </div>
    <div id="bpsn-corpo"></div>
    <div class="bpsn-piede" id="bpsn-piede"></div>
  </div>
</div>`);
ui.bpSn = null;   // { passo, voci: Map(id → { gruppo, perche }), cerca, query, cal }
const GRUPPI_SN = [
  { k: 'imp', t: () => meteAperte().length && state.metaColOk ? 'Importanti · per le tue mete' : 'Importanti', cls: 'q2' },
  { k: 'sub', t: () => 'Subito', cls: 'q1' }, { k: 'del', t: () => 'Deleghe da controllare', cls: 'q3' }, { k: 'altre', t: () => 'Altre cose', cls: 'q4' }];
const gruppoDiQ = q => q === 1 ? 'sub' : q === 2 ? 'imp' : q === 3 ? 'del' : 'altre';
const durataSn = c => (c && c.durata_minuti) || (c && c.q === 3 ? 15 : BP_DURATA_DEFAULT);
function fmtOre(min) { if (min < 60) return `${min} min`; const h = Math.floor(min / 60), m = min % 60; return m ? `${h}h${String(m).padStart(2, '0')}` : `${h} ${h === 1 ? 'ora' : 'ore'}`; }
function giorniSettSn() {
  const da = getWeekStart(_bpwWeek, _bpwYear), ven = piuGiorni(da, 4);
  return da.getMonth() === ven.getMonth() ? `${da.getDate()}–${ven.getDate()} ${MESI_SN[ven.getMonth()]}` : `${da.getDate()} ${MESI_SN[da.getMonth()]} – ${ven.getDate()} ${MESI_SN[ven.getMonth()]}`;
}
function settimanaPrima(week, year) { const d = piuGiorni(getWeekStart(week, year), -7), w = isoWeekParts(d); return w.week; }
function settimaneFerma(m) {
  const u = ultimaAttivitaMeta(m) || giornoIso(m.created_at || '');
  if (!u) return 0;
  return Math.floor((Date.now() - (parseISODate(u) || new Date()).getTime()) / (7 * 864e5));
}
const minutiScelti = () => [..._bpwSel.entries()].reduce((s, [id, v]) => s + (v.durata || durataSn(ciclo(id))), 0);
// il tempo libero della settimana: lun–ven 9–19, meno appuntamenti e cuscinetti
function minutiLiberiSettimana() {
  return GIORNI.slice(0, 5).reduce((tot, g, idx) => {
    const occ = [...occupatiEventi(bpDataGiorno(_bpwWeek, _bpwYear, idx)), ...[..._bpwCusc.values()].filter(v => v.giorno === g.key).map(v => [minDi(v.ora), minDi(v.ora) + (v.durata || CUSC.DURATA)])];
    return tot + spaziLiberi(occ, minDi(GIORNATA.INIZIO), minDi(GIORNATA.FINE)).reduce((s, [a, b]) => s + b - a, 0);
  }, 0);
}
function aggiungiSn(id, gruppo, perche, scelta) {
  const c = ciclo(id);
  if (!c || ui.bpSn.voci.has(id)) return false;
  ui.bpSn.voci.set(id, { gruppo: gruppo || gruppoDiQ(computeEffectiveQ(c)), perche: perche || '' });
  if (scelta && !_bpwSel.has(id)) {
    const slot = agendaSlotForWeek(c, _bpwWeek, _bpwYear);
    _bpwSel.set(id, { giorno: slot.giorno || null, fascia: slot.fascia || null, ora: bpwDefaultOra(c), durata: durataSn(c) });
  }
  return true;
}
// La proposta: rimaste + Importanti bloccate o in agenda + almeno una Importante per meta + Subito che scadono
// entro 10 giorni + deleghe da controllare in settimana. Poi il tetto: il 30% in più di quante ne hai fatte.
function propostaSnella(presel) {
  ui.bpSn.voci = new Map();
  const rimaste = new Set(presel || []), prec = settimanaPrima(_bpwWeek, _bpwYear);
  const da = toISODate(getWeekStart(_bpwWeek, _bpwYear)), a = toISODate(piuGiorni(getWeekStart(_bpwWeek, _bpwYear), 6));
  const entro = toISODate(piuGiorni(new Date(), SN.SUBITO_GG));
  const conMeta = (c, perche) => { const m = metaDi(c); return m ? [corta(m.testo, 40), perche].filter(Boolean).join(' · ') : perche; };
  const obbligate = new Set();
  // 1. quello che il wizard ha già scelto: rimaste dalla settimana prima e cose in agenda
  [..._bpwSel.entries()].forEach(([id, v]) => {
    const c = ciclo(id);
    if (!c) { _bpwSel.delete(id); return; }
    const perche = rimaste.has(id) ? `rimasta dalla ${prec}` : v.inAgenda ? 'già in agenda' : c.inderogabile ? 'bloccata' : 'nel piano';
    aggiungiSn(id, null, conMeta(c, perche), true);
    obbligate.add(id);
  });
  const cand = bpwCandidati(), opzionali = [];
  // 2. Importanti bloccate in agenda
  cand.filter(c => computeEffectiveQ(c) === 2 && (c.inderogabile || (c.calendar_event_id && !bloccoEsterno(c)))).forEach(c => { if (aggiungiSn(c.id, 'imp', conMeta(c, 'bloccata in agenda'), true)) obbligate.add(c.id); });
  // 3. almeno una Importante per meta (la più vecchia)
  if (state.metaColOk) meteAperte().forEach(m => {
    if ([...ui.bpSn.voci.keys()].some(id => String((ciclo(id) || {}).meta_id || '') === String(m.id))) return;
    const c = cand.find(x => computeEffectiveQ(x) === 2 && String(x.meta_id || '') === String(m.id) && !ui.bpSn.voci.has(x.id));
    if (!c) return;
    const n = settimaneFerma(m);
    if (aggiungiSn(c.id, 'imp', conMeta(c, n >= 2 ? `ferma da ${n} settimane` : 'per questa meta'), true)) opzionali.push(c.id);
  });
  // 4. Subito che scadono (o sono in programma) entro 10 giorni
  cand.filter(c => computeEffectiveQ(c) === 1).map(c => ({ c, d: c.due_date || c.pianificato_data || c.scheduled_date || null })).filter(x => x.d && x.d <= entro)
    .sort((x, y) => x.d.localeCompare(y.d)).forEach(({ c, d }) => { if (aggiungiSn(c.id, 'sub', c.due_date ? `scade il ${fmtGgMm(d)}` : `in programma il ${fmtGgMm(d)}`, true)) opzionali.push(c.id); });
  // 5. deleghe da controllare in settimana (le scadute anche; quelle tornate indietro 2 volte senza spunta)
  if (state.delegaColsOk) cand.filter(c => c.q === 3 && c.delega_controllo && c.delega_controllo <= a).sort((x, y) => x.delega_controllo.localeCompare(y.delega_controllo)).forEach(c => {
    const p = personaDi(c.delega_persona_id), chi = p ? `${p.nome}: ` : '';
    const tornata = (c.ritorni_delega || 0) >= PRINC.DELEGHE_COSA;
    const quando = c.delega_controllo < da ? `controllo scaduto il ${fmtGgMm(c.delega_controllo)}` : `controllo ${GIORNI[giornoIdxDi(parseISODate(c.delega_controllo))].label.toLowerCase()}`;
    if (aggiungiSn(c.id, 'del', chi + (tornata ? `tornata indietro ${c.ritorni_delega} volte` : quando), !tornata) && !tornata) opzionali.push(c.id);
  });
  // il tetto: le opzionali in fondo si tolgono (restano in elenco senza spunta)
  const rif = _bpwRif && _bpwRif.tot ? _bpwRif : null;
  const maxCose = rif ? Math.max(5, Math.ceil(rif.fatte * 1.3)) : 12, liberi = minutiLiberiSettimana();
  for (let k = opzionali.length - 1; k >= 0 && (_bpwSel.size > maxCose || minutiScelti() > liberi); k--) _bpwSel.delete(opzionali[k]);
}
const _openBpWizardSn = openBpWizard;
openBpWizard = async function (week, year, presel) {
  await _openBpWizardSn.apply(this, arguments);
  if (!$('bpWizOverlay').classList.contains('open') || bpwModifica() || ui.bpwDettagliata) return;   // modifica di un piano attivo: il wizard di prima
  closeBpWizard();
  ui.bpSn = { passo: 1, voci: new Map(), cerca: false, query: '', cal: lsLeggi(SN.CAL_LS) !== '0' };
  $('bpSnOverlay').classList.add('open');
  $('bpsn-corpo').innerHTML = '<p class="t-label muted">Preparo la proposta…</p>';
  $('bpsn-piede').innerHTML = '';
  try {
    await Promise.race([caricaEventi(week, year), new Promise(ok => setTimeout(ok, 4000))]);
    if (ui.bpwAuto && isGcalTokenValid()) bpwRipiazzaAuto();
    await Promise.race([bpwCaricaRiferimento(week, year), new Promise(ok => setTimeout(ok, 3000))]);
  } catch (e) { console.warn('[Prepara] dati:', e.message); }
  // un cuscinetto al giorno (quello del pomeriggio, se c'è): gli altri automatici si tolgono
  GIORNI.slice(0, 5).forEach(g => {
    const auto = [..._bpwCusc.entries()].filter(([, v]) => v.giorno === g.key && v.auto && !v.id);
    if (auto.length + [..._bpwCusc.values()].filter(v => v.giorno === g.key && !(v.auto && !v.id)).length <= 1) return;
    auto.sort((x, y) => y[1].ora.localeCompare(x[1].ora)).slice(1).forEach(([k]) => _bpwCusc.delete(k));
  });
  propostaSnella(presel);
  disegnaSn();
};
function rigaSceltaSn(id) {
  const c = ciclo(id), v = ui.bpSn.voci.get(id), si = _bpwSel.has(id);
  return `<label class="sn-pick${si ? ' on' : ''}"><input type="checkbox" data-sn-pick="${id}"${si ? ' checked' : ''}>
    <span class="sn-pick-txt"><span>${escHtml(c.title)}</span>${v.perche ? `<small>${escHtml(v.perche)}</small>` : ''}</span>
    <span class="mono sn-pick-dur">${fmtTempo((_bpwSel.get(id) || {}).durata || durataSn(c))}</span></label>`;
}
function disegnaPasso1() {
  const s = ui.bpSn, ids = [...s.voci.keys()].filter(ciclo);
  $('bpsn-sotto').textContent = `Settimana ${_bpwWeek} · ${giorniSettSn()} · passo 1 di 2`;
  $('bpsn-titolo').textContent = 'Ecco la mia proposta';
  const gruppi = GRUPPI_SN.map(g => ({ ...g, ids: ids.filter(id => s.voci.get(id).gruppo === g.k) })).filter(g => g.ids.length);
  const q = s.query.toLowerCase().trim();
  const altri = s.cerca ? bpwCandidati().filter(c => !s.voci.has(c.id) && (!q || c.title.toLowerCase().includes(q))).slice(0, 12) : [];
  $('bpsn-corpo').innerHTML = `<div class="sn-sticky">${barraFuturo(quotaWizard(), 'Si aggiorna mentre togli o aggiungi. Obiettivo 25–30%.')}</div>
    ${gruppi.map(g => `<section class="sn-gruppo"><h4 class="sn-gh ${g.cls}">${g.t()}</h4><div class="group">${g.ids.map(rigaSceltaSn).join('')}</div></section>`).join('') || '<p class="t-label muted">Niente da proporre: aggiungi dalle cose da fare.</p>'}
    ${s.cerca ? `<div class="sn-cerca"><input type="search" class="input" id="bpsn-q" value="${esc(s.query)}" placeholder="Cerca tra le cose da fare" aria-label="Cerca tra le cose da fare" autocomplete="off">
      <div class="group">${altri.map(c => `<button type="button" class="sn-agg" data-act="bpsn-agg" data-id="${c.id}">${quadratino(computeEffectiveQ(c))}<span>${escHtml(c.title)}</span><i class="ti ti-plus" aria-hidden="true"></i></button>`).join('') || '<p class="t-label muted sn-vuoto">Nessuna cosa trovata.</p>'}</div></div>`
      : '<button type="button" class="btn btn-secondary btn-block sn-agg-apri" data-act="bpsn-cerca"><i class="ti ti-plus"></i>Aggiungi dalle cose da fare</button>'}`;
  const rif = _bpwRif && _bpwRif.tot ? _bpwRif : null;
  $('bpsn-piede').innerHTML = `<p class="sn-somma"><b class="mono">${_bpwSel.size}</b> ${_bpwSel.size === 1 ? 'cosa' : 'cose'} · <b class="mono">${fmtOre(minutiScelti())}</b>${rif ? ` · ${rif.etichetta.toLowerCase()} ne hai fatte ${rif.fatte} su ${rif.tot}` : ''}</p>
    <button type="button" class="btn btn-primary btn-block" data-act="bpsn-avanti"${_bpwSel.size ? '' : ' disabled'}>Va bene, mettile nei giorni</button>
    <button type="button" class="link sn-dett" data-act="bpsn-dettagli">Modalità dettagliata</button>`;
}
// ─── Passo 2: nei buchi liberi tra gli appuntamenti (9–19, lun–ven), Subito presto, Importanti nei blocchi lunghi ───
function liberiDelGiorno(idx, salta) {
  const g = GIORNI[idx].key, d = bpDataGiorno(_bpwWeek, _bpwYear, idx);
  const occ = [...occupatiEventi(d), ...[..._bpwCusc.values()].filter(v => v.giorno === g).map(v => [minDi(v.ora), minDi(v.ora) + (v.durata || CUSC.DURATA)]),
    ...[..._bpwSel.entries()].filter(([id, v]) => !salta.has(id) && v.giorno === g && v.ora).map(([id, v]) => [minDi(v.ora), minDi(v.ora) + (v.durata || durataSn(ciclo(id)))])];
  const ora = new Date(), oggi = toISODate(ora) === toISODate(d);
  const da = Math.max(minDi(GIORNATA.INIZIO), oggi ? Math.ceil((ora.getHours() * 60 + ora.getMinutes()) / 15) * 15 : 0);
  if (d < oggiData() && !oggi) return [];
  return spaziLiberi(occ, da, minDi(GIORNATA.FINE)).map(([s, e]) => ({ g, idx, s, e }));
}
function distribuisciSn() {
  const fissi = new Set(), daMettere = [];
  _bpwSel.forEach((v, id) => {
    const c = ciclo(id);
    if (!c) return;
    if (v.giorno && v.giorno !== 'settimana' && (v.ora || v.completato)) fissi.add(id); else daMettere.push(id);
  });
  const salta = new Set(daMettere);
  let buchi = GIORNI.slice(0, 5).flatMap((_, idx) => liberiDelGiorno(idx, salta));
  const prendi = (id, scegli) => {
    const c = ciclo(id), v = _bpwSel.get(id), dur = v.durata || durataSn(c);
    const adatti = buchi.filter(b => b.e - b.s >= dur);
    const suo = v.giorno && v.giorno !== 'settimana' ? v.giorno : null;   // già in agenda quel giorno: resta lì
    const b = suo ? (l => l.length ? scegli(l) : null)(adatti.filter(x => x.g === suo)) : adatti.length ? scegli(adatti) : null;
    if (!b) { if (!suo) _bpwSel.set(id, { ...v, giorno: 'settimana', fascia: null, ora: null }); return; }
    const ora = hmDi(b.s);
    _bpwSel.set(id, { ...v, giorno: b.g, ora, fascia: fasciaDaOra(ora), durata: dur });
    buchi = buchi.flatMap(x => x !== b ? [x] : b.s + dur < b.e ? [{ ...b, s: b.s + dur }] : []);
  };
  const q = id => computeEffectiveQ(ciclo(id));
  const scad = id => { const c = ciclo(id); return c.due_date || c.delega_controllo || '9999'; };
  const presto = l => l.slice().sort((x, y) => x.idx - y.idx || x.s - y.s)[0];
  const lungo = l => l.slice().sort((x, y) => (y.e - y.s) - (x.e - x.s) || x.idx - y.idx)[0];
  daMettere.filter(id => q(id) === 1).sort((x, y) => scad(x).localeCompare(scad(y))).forEach(id => prendi(id, presto));
  daMettere.filter(id => q(id) === 3).forEach(id => {
    const c = ciclo(id), da = toISODate(getWeekStart(_bpwWeek, _bpwYear));
    const giorno = c.delega_controllo && c.delega_controllo >= da ? GIORNI[giornoIdxDi(parseISODate(c.delega_controllo))].key : null;   // scaduta: il primo buco
    prendi(id, l => presto(l.filter(b => b.g === giorno)) || presto(l));
  });
  daMettere.filter(id => q(id) === 2).sort((x, y) => (_bpwSel.get(y).durata || 0) - (_bpwSel.get(x).durata || 0)).forEach(id => prendi(id, lungo));
  daMettere.filter(id => q(id) === 4).forEach(id => prendi(id, lungo));
}
function righeGiornoSn(idx) {
  const g = GIORNI[idx].key, d = bpDataGiorno(_bpwWeek, _bpwYear, idx);
  const ev = eventiDelGiorno(d).filter(e => e.ora && !eGiornata(e) && !e.routine && !eventoCollegato(e)).map(e => ({ tipo: 'evt', ora: e.ora, titolo: e.titolo }));
  const cose = [..._bpwSel.entries()].filter(([, v]) => v.giorno === g).map(([id, v]) => ({ tipo: 'cosa', id, ora: v.ora || '', titolo: (ciclo(id) || {}).title || '', q: computeEffectiveQ(ciclo(id) || { q: 2 }) }));
  const cusc = [..._bpwCusc.values()].filter(v => v.giorno === g).map(v => ({ tipo: 'cusc', ora: v.ora, titolo: 'Cuscinetto per gli imprevisti' }));
  return [...ev, ...cose, ...cusc].sort((x, y) => (x.ora || '99').localeCompare(y.ora || '99'));
}
function htmlRigaSn(r, g) {
  if (r.tipo === 'cosa') return `<button type="button" class="sn-r q${r.q}" data-act="bpsn-sposta" data-id="${r.id}" data-g="${g}" draggable="true" aria-label="${esc(r.titolo)}${r.ora ? ' alle ' + r.ora : ''}: tocca per spostarla"><span class="mono">${r.ora || '—'}</span><span>${escHtml(r.titolo)}</span></button>`;
  return `<div class="sn-r ${r.tipo}"><span class="mono">${r.ora}</span><span>${escHtml(r.titolo)}</span></div>`;
}
function disegnaPasso2() {
  $('bpsn-sotto').textContent = `Settimana ${_bpwWeek} · passo 2 di 2`;
  $('bpsn-titolo').textContent = 'Le ho messe nei buchi liberi';
  const giorni = GIORNI.map((g, idx) => ({ g, idx, righe: righeGiornoSn(idx) })).filter(x => x.idx < 5 || x.righe.some(r => r.tipo === 'cosa'));
  const senza = [..._bpwSel.entries()].filter(([, v]) => !v.giorno || v.giorno === 'settimana');
  const collegato = isGcalTokenValid();
  $('bpsn-corpo').innerHTML = `<p class="t-label muted sn-intro">${collegato ? 'Ho tenuto conto dei tuoi appuntamenti.' : 'Calendario non collegato: ho usato le ore dalle 9 alle 19.'} ${eTelefono() ? 'Tocca una riga per spostarla.' : 'Trascina una riga o toccala per spostarla.'}</p>
    <div class="sn-giorni">${giorni.map(({ g, idx, righe }) => { const d = bpDataGiorno(_bpwWeek, _bpwYear, idx); return `<div class="sn-giorno" data-sn-giorno="${g.key}"><div class="sn-gnome"><b>${g.short}</b><span class="mono">${d.getDate()}</span></div>
      <div class="sn-grighe">${righe.map(r => htmlRigaSn(r, g.key)).join('') || '<span class="t-caption muted">Niente</span>'}</div></div>`; }).join('')}
    ${senza.length ? `<div class="sn-giorno" data-sn-giorno="settimana"><div class="sn-gnome"><b>SETT.</b><span class="t-caption">senza giorno</span></div><div class="sn-grighe">${senza.map(([id]) => htmlRigaSn({ tipo: 'cosa', id, ora: '', titolo: ciclo(id).title, q: computeEffectiveQ(ciclo(id)) }, 'settimana')).join('')}</div></div>` : ''}</div>`;
  $('bpsn-piede').innerHTML = `<label class="sn-cal"><input type="checkbox" id="bpsn-cal"${ui.bpSn.cal && collegato ? ' checked' : ''}${collegato ? '' : ' disabled'}><span>Mettile anche su Google Calendar, con l'avviso${collegato ? '' : ' (collega prima Google Calendar)'}</span></label>
    <div class="sn-tasti"><button type="button" class="btn btn-secondary" data-act="bpsn-stampa">Solo stampa</button><button type="button" class="btn btn-primary" data-act="bpsn-attiva"><i class="ti ti-send"></i>Attiva e manda al coach</button></div>
    <div class="sn-link"><button type="button" class="link" data-act="bpsn-indietro"><i class="ti ti-chevron-left" aria-hidden="true"></i>Indietro</button> · <button type="button" class="link" data-act="bpsn-dettagli">Modalità dettagliata</button></div>`;
  agganciaTrascinaSn();
}
function disegnaSn() { if (!ui.bpSn) return; const corpo = $('bpsn-corpo'), y = corpo.closest('.modal').scrollTop; if (ui.bpSn.passo === 1) disegnaPasso1(); else disegnaPasso2(); corpo.closest('.modal').scrollTop = y; }
function agganciaTrascinaSn() {
  let trascinata = null;
  document.querySelectorAll('#bpsn-corpo .sn-r[draggable]').forEach(el => {
    el.addEventListener('dragstart', e => { trascinata = el.dataset.id; el.classList.add('dragging'); try { e.dataTransfer.setData('text/plain', trascinata); e.dataTransfer.effectAllowed = 'move'; } catch (_) {} });
    el.addEventListener('dragend', () => { el.classList.remove('dragging'); document.querySelectorAll('.sn-giorno.drag-over').forEach(z => z.classList.remove('drag-over')); });
  });
  document.querySelectorAll('#bpsn-corpo [data-sn-giorno]').forEach(z => {
    z.addEventListener('dragover', e => { if (!trascinata) return; e.preventDefault(); z.classList.add('drag-over'); });
    z.addEventListener('dragleave', e => { if (!z.contains(e.relatedTarget)) z.classList.remove('drag-over'); });
    z.addEventListener('drop', e => {
      e.preventDefault(); z.classList.remove('drag-over');
      const id = trascinata; trascinata = null;
      if (!id || !_bpwSel.has(id)) return;
      spostaInGiornoSn(id, z.dataset.snGiorno);
    });
  });
}
// trascinata in un altro giorno: il primo buco libero che la contiene (o senza ora)
function spostaInGiornoSn(id, g) {
  const v = _bpwSel.get(id), idx = GIORNI.findIndex(x => x.key === g);
  if (g === 'settimana' || idx < 0) { _bpwSel.set(id, { ...v, giorno: 'settimana', ora: null, fascia: null }); disegnaSn(); return; }
  const dur = v.durata || durataSn(ciclo(id));
  const b = (idx < 5 ? liberiDelGiorno(idx, new Set([id])) : []).find(x => x.e - x.s >= dur);
  const ora = b ? hmDi(b.s) : null;
  _bpwSel.set(id, { ...v, giorno: g, ora, fascia: ora ? fasciaDaOra(ora) : v.fascia });
  disegnaSn();
}
const _bpSlotConfirmSn = bpSlotConfirm;
bpSlotConfirm = function () { const r = _bpSlotConfirmSn.apply(this, arguments); if ($('bpSnOverlay').classList.contains('open')) disegnaSn(); return r; };
// Attiva: il piano si salva con bpAttiva (come prima); poi foglio o invio al coach, e Calendar se spuntato
const _apriProntoSn = apriPronto;
apriPronto = function () { if (ui.bpSnSenzaPronto) { ui.bpSnSenzaPronto = false; return; } return _apriProntoSn.apply(this, arguments); };
const _corpoEventoSn = corpoEvento;
corpoEvento = function (c, slot) { const b = _corpoEventoSn.apply(this, arguments); return ui._snAvviso ? { ...b, reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 10 }] } } : b; };
async function attivaSn(invia) {
  const week = _bpwWeek, year = _bpwYear, cal = !!($('bpsn-cal') && $('bpsn-cal').checked);
  lsScrivi(SN.CAL_LS, cal ? '1' : '0');
  document.querySelectorAll('#bpsn-piede button').forEach(b => { b.disabled = true; });
  ui.bpSnSenzaPronto = true;
  await bpAttiva();
  const ok = state.week === week && state.year === year && state.bp && state.bp.settimana === week && state.bp.stato === 'attivo';
  if (!ok) { document.querySelectorAll('#bpsn-piede button').forEach(b => { b.disabled = false; }); return; }
  $('bpSnOverlay').classList.remove('open');
  ui.bpSn = null;
  setTimeout(async () => {
    try { if (invia) apriInvia(); else bpStampaPdf(); } catch (e) { console.warn('[Prepara] foglio:', e.message); showToast('Non riesco a fare il PDF: ' + e.message, 'error'); }
    if (cal) { ui._snAvviso = true; try { await mettiPianoSuCalendar(); } catch (e) { console.warn('[Prepara] calendario:', e.message); } finally { ui._snAvviso = false; } }
  }, 450);
}
function dettagliataSn() {
  const passo = ui.bpSn ? ui.bpSn.passo : 1;
  $('bpSnOverlay').classList.remove('open');
  ui.bpSn = null;
  const ov = $('bpWizOverlay');
  ov.classList.add('open');
  bpwGoStep(passo === 2 ? 3 : 1);
}
Object.assign(AZIONI, {
  'bpsn-chiudi': () => { $('bpSnOverlay').classList.remove('open'); ui.bpSn = null; },
  'bpsn-cerca': () => { ui.bpSn.cerca = true; disegnaSn(); setTimeout(() => $('bpsn-q') && $('bpsn-q').focus(), 50); },
  'bpsn-agg': (el, id) => { aggiungiSn(id, null, 'aggiunta da te', true); ui.bpSn.cerca = false; ui.bpSn.query = ''; disegnaSn(); },
  'bpsn-avanti': () => { distribuisciSn(); ui.bpSn.passo = 2; disegnaSn(); $('bpsn-corpo').closest('.modal').scrollTop = 0; },
  'bpsn-indietro': () => { ui.bpSn.passo = 1; disegnaSn(); },
  'bpsn-sposta': (el, id) => bpSlotOpen(id, el.dataset.g === 'settimana' ? 'settimana' : el.dataset.g),
  'bpsn-stampa': () => attivaSn(false),
  'bpsn-attiva': () => attivaSn(true),
  'bpsn-dettagli': () => dettagliataSn()
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset && t.dataset.snPick && ui.bpSn) {
    const id = t.dataset.snPick;
    if (t.checked) { const c = ciclo(id), slot = agendaSlotForWeek(c, _bpwWeek, _bpwYear); _bpwSel.set(id, { giorno: slot.giorno || null, fascia: slot.fascia || null, ora: bpwDefaultOra(c), durata: durataSn(c) }); }
    else _bpwSel.delete(id);
    disegnaSn();
  }
  if (t.id === 'bpsn-cal' && ui.bpSn) ui.bpSn.cal = t.checked;
});
document.addEventListener('input', e => {
  if (e.target.id !== 'bpsn-q' || !ui.bpSn) return;
  ui.bpSn.query = e.target.value;
  const pos = e.target.selectionStart;
  disegnaSn();
  const q = $('bpsn-q'); if (q) { q.focus(); try { q.setSelectionRange(pos, pos); } catch (_) {} }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('bpSnOverlay').classList.contains('open') && !document.querySelector('.bp-slot-panel.open')) { $('bpSnOverlay').classList.remove('open'); ui.bpSn = null; } });

// ══════════════════════════════════════════════════════════════
