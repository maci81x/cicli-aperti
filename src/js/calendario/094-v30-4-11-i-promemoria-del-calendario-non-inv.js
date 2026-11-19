// v30 · 4/11 · I PROMEMORIA DEL CALENDARIO NON INVECCHIANO NELLE DOMANDE
// «scrivere ad Anita per pranzo di domani» (2/11) veniva chiesto ancora il 4/11, a pranzo già fatto.
// Regole di Roby: un promemoria del calendario che sembra una cosa da fare si chiede la sera del suo giorno
// (dalle 17:30) o il giorno dopo (il lunedì anche quelli del venerdì e del weekend); prima si controlla che
// non l'abbia già riprogrammato (stesso promemoria più avanti, o una cosa uguale tra quelle da fare/fatte).
// Passata quella finestra senza una scelta, diventa una cosa in «Da pianificare» segnata «da rivedere»
// (colonna cicli.da_rivedere): è lì che Roby guarda tutto quello che va messo nella settimana.
// Le serie (ogni giorno da più di un mese) restano come prima.
// ══════════════════════════════════════════════════════════════
const V30 = { SERA: '17:30', MARK: 'cal:' };
function v30Finestra(e) {
  const oggi = oggiLocale(), d = parseISODate(oggi);
  if (e.giorno > oggi) return 'presto';
  if (e.giorno === oggi) return hhmm(new Date()) >= V30.SERA ? 'chiedi' : 'presto';
  const dalGiorno = toISODate(piuGiorni(d, d.getDay() === 1 ? -3 : -1));   // il lunedì: venerdì, sabato e domenica
  return e.giorno >= dalGiorno ? 'chiedi' : 'scaduta';
}
function v30Riprogrammata(e) {
  const dopo = Object.values(ui.eventi || {}).flat().filter(x => x && x.id !== e.id && (x.serie || x.id) !== (e.serie || e.id) && x.giorno > e.giorno);
  if (migliore(e.titolo, dopo, ['uguale', 'molto'], x => x.titolo)) return 'riprogrammata';
  const cose = state.cicli.filter(c => !c.parent_id && !(c.note || '').includes('[' + V30.MARK));
  if (migliore(e.titolo, cose, ['uguale', 'molto'], c => c.title)) return 'gia-tra-le-cose';
  return null;
}
// la parola deve essere l'azione, non stare tra parentesi: «Cena a La Bottega (orario da chiedere)» è un appuntamento (4/11)
const v30Parola = t => PAROLE_CICLO.test(normTitolo(String(t || '').replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')));
cercaCicliInCalendario = async function () {
  if (!isGcalTokenValid()) return;
  const cur = bpSettimanaCorrente(), oggi = parseISODate(oggiLocale());
  let ev = [...(await caricaEventi(cur.week, cur.year) || [])];
  const w = isoWeekParts(piuGiorni(oggi, -3));
  if (w.week !== cur.week || w.year !== cur.year) ev = ev.concat(await caricaEventi(w.week, w.year) || []);
  const scelte = leggiJson(LS5.CICLI_CAL, {});
  let cambiate = false;
  const perSerie = new Map(), visti = new Set();
  ev.forEach(e => {
    if (!e || visti.has(e.id)) return;
    visti.add(e.id);
    if (e.routine || !e.mio || e.invitati || e.coach || e.prepCoach || e.app || eventoCollegato(e)) return;
    const k = e.serie || e.id;
    if (scelte[k]) return;
    if (!e.serie && eventoFatto(e)) { scelte[k] = 'fatta'; cambiate = true; return; }   // v41: spuntato come fatto nell'app
    perSerie.set(k, [...(perSerie.get(k) || []), e]);
  });
  const out = [], scadute = [];
  for (const [k, lista] of perSerie) {
    const e = lista[0];
    if (e.serie) {   // le serie come prima
      if (PAROLE_CICLO.test(normTitolo(e.titolo))) { out.push({ k, e, perche: 'parola' }); continue; }
      if (new Set(lista.map(x => x.giorno)).size >= 3 && quotidianaDaPiuDi30(await eventoMaster(e.calId, e.serie))) out.push({ k, e, perche: 'ogni giorno' });
      continue;
    }
    if (!v30Parola(e.titolo)) continue;
    const f = v30Finestra(e);
    if (f === 'presto') continue;
    const gia = v30Riprogrammata(e);
    if (gia) { scelte[k] = gia; cambiate = true; continue; }
    if (f === 'chiedi') out.push({ k, e, perche: 'parola', passata: e.giorno < oggiLocale() });
    else scadute.push({ k, e });
  }
  let messe = 0;
  // v42: niente più trasformazione silenziosa: un promemoria passato senza risposta resta una domanda («L'hai fatta?»)
  for (const { k, e } of scadute) out.push({ k, e, perche: 'parola', passata: true });
  if (cambiate) scriviJson(LS5.CICLI_CAL, scelte);
  ui.calCicli = out.sort((a, b) => (a.e.inizioMs || 0) - (b.e.inizioMs || 0));
  render();
  if ($('calCicliOverlay').classList.contains('open')) disegnaCalCicli();
  if (messe) showToast(messe === 1 ? '1 promemoria passato è in «Da pianificare» · da rivedere' : `${messe} promemoria passati sono in «Da pianificare» · da rivedere`, 'info');
};
// il foglio: per i promemoria passati «Già fatta · Mettila tra le cose da fare · Lascia stare»
const _disegnaCalCicliV30 = disegnaCalCicli;
disegnaCalCicli = function () {
  const lista = ui.calCicli || [];
  if (!lista.some(x => x.passata || x.e.giorno === oggiLocale())) return _disegnaCalCicliV30.apply(this, arguments);
  const b = (act, k, ico, t) => `<button type="button" class="chip" data-act="${act}" data-k="${esc(k)}">${ico ? `<i class="ti ${ico}"></i>` : ''}${t}</button>`;
  $('calc-lista').innerHTML = lista.map(({ k, e, perche, passata }) => {
    const quando = `${escHtml(fmtGiorno(parseISODate(e.giorno)))}${e.ora ? ` · <span class="mono">${e.ora}</span>` : ''} · ${(CAL_LETTURA.find(c => c.tipo === e.cal) || {}).nome || ''}`;
    const breve = passata || e.giorno === oggiLocale();
    return `<div class="recon-riga"><b>${escHtml(e.titolo)}</b><p>${quando}${e.serie ? ' · si ripete' : ''}${perche === 'ogni giorno' ? ' ogni giorno da più di un mese' : ''}${passata ? ' · <b>è passato: l\'hai fatto?</b>' : ''}</p>
      <div class="chips chips-wrap">${breve
        ? b('v30-calc-fatta', k, 'ti-check', 'Già fatta') + b('calc-tutto', k, 'ti-stack-2', 'Mettila tra le cose da fare') + b('v30-calc-lascia', k, '', 'Lascia stare')
        : b('calc-tutto', k, 'ti-stack-2', 'Mettila tra le cose da fare') + b('calc-togli', k, 'ti-calendar-minus', 'Mettila tra le cose da fare e toglila dal calendario') + b('calc-app', k, '', 'È un appuntamento')}</div></div>`;
  }).join('');
};
AZIONI['v30-calc-fatta'] = el => { sceltaCalCiclo(el.dataset.k, 'fatta'); showToast('Bene: segnata come fatta, non te la chiedo più', 'success'); };
AZIONI['v30-calc-lascia'] = el => { sceltaCalCiclo(el.dataset.k, 'lascia'); showToast('Lasciata stare', 'info'); };
// la sera, in «Chiudi la giornata»
const _v26DisegnaChiudiV30 = v26DisegnaChiudi;
v26DisegnaChiudi = function () {
  _v26DisegnaChiudiV30.apply(this, arguments);
  const n = (ui.calCicli || []).length, box = $('v26cg-corpo');
  if (!n || !box) return;
  box.insertAdjacentHTML('beforeend', `<p class="list-head"><span>3 · Promemoria del calendario</span></p>
    <button type="button" class="riga-link" data-act="calc-apri"><i class="ti ti-calendar-question"></i><span>${n === 1 ? '1 promemoria da guardare' : n + ' promemoria da guardare'}<small>li hai fatti? se no, li metto tra le cose da fare</small></span><span></span><i class="ti ti-chevron-right"></i></button>`);
};

// --- «Da rivedere» in Da pianificare ---
ui.dp = ui.dp || { q: '', tipo: null };
const v30DaRivedere = () => daSistemare().filter(c => c.da_rivedere && !c.done);
const _daPianificareFiltrateV30 = daPianificareFiltrate;
daPianificareFiltrate = function () {
  let l = _daPianificareFiltrateV30.apply(this, arguments);
  if (ui.dp.rivedere) l = l.filter(c => c.da_rivedere);
  return [...l.filter(c => c.da_rivedere), ...l.filter(c => !c.da_rivedere)];   // da rivedere sempre in cima
};
const _colonnaDaPianificareV30 = colonnaDaPianificare;
colonnaDaPianificare = function () {
  const h = _colonnaDaPianificareV30.apply(this, arguments), n = v30DaRivedere().length;
  if (!n && !ui.dp.rivedere) return h;
  const chip = `<button type="button" class="chip v30-chip" data-act="v30-dp-rivedere" aria-pressed="${!!ui.dp.rivedere}"><i class="ti ti-calendar-question"></i>Da rivedere <span class="mono">${n}</span></button>`;
  return h.replace(/(<div class="chips chips-wrap dp-chips"[^>]*>)/, '$1' + chip);
};
AZIONI['v30-dp-rivedere'] = () => { ui.dp.rivedere = !ui.dp.rivedere; render(); };
const _rigaV30 = riga;
riga = function (r, opz) {
  const h = _rigaV30.apply(this, arguments);
  try {
    if (!r || !r.c || !r.c.da_rivedere || r.fatto || r.c.done) return h;
    return h.replace(/<span class="item-meta">/, '<span class="item-meta"><span class="tag-v30" title="Promemoria passato del calendario: è ancora da fare?"><i class="ti ti-calendar-question" aria-hidden="true"></i>da rivedere</span>');
  } catch (_) { return h; }
};
// basta toccarla (spostarla, cambiarla, chiuderla) e non è più «da rivedere»
const _patchCicloV30 = patchCiclo;
patchCiclo = function (id, patch) {
  const c = ciclo(id);
  if (c && c.da_rivedere && patch && !('da_rivedere' in patch)) patch = { ...patch, da_rivedere: false };
  return _patchCicloV30.call(this, id, patch);
};

// ══════════════════════════════════════════════════════════════
