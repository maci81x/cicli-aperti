// ══════════════════════════════════════════════════════════════
// D · LA SERA PER DOMANI (principio 3) · DELEGHE (9, 10) · DEMOTIVAZIONE (11)
// ══════════════════════════════════════════════════════════════
function giornoDomani() {
  const d = piuGiorni(new Date(), 1);
  while (giornoIdxDi(d) > 4) d.setDate(d.getDate() + 1);   // venerdì sera: lunedì
  return d;
}
function eSeraFeriale(ora = new Date()) { const g = giornoIdxDi(ora); return g <= 4 && hhmm(ora) >= PRINC.SERA_DA; }
function bannerSera() {
  if (!eSeraFeriale() || lsLeggi(PRINC.LS.SERA) === oggiLocale() || !eSettimanaCorrente() || modoSemplice()) return '';
  return `<section class="banner-piano" aria-label="Piano di domani"><i class="ti ti-moon"></i>
    <div><b>5 minuti per domani</b><p class="t-caption muted">Scegli dalla settimana cosa fai domani: la mattina parti già sapendo cosa fare.</p>
      <div class="banner-azioni"><button type="button" class="btn btn-primary btn-sm" data-act="sera-apri">Scegli</button></div></div>
    <button type="button" class="btn btn-icon" data-act="sera-chiudi" aria-label="Chiudi per oggi" data-tip="Chiudi per oggi"><i class="ti ti-x"></i></button></section>`;
}
document.body.insertAdjacentHTML('beforeend', `
<div class="modal-overlay" id="seraOverlay" onclick="closeModalOnBg(event,'seraOverlay')">
  <div class="modal sheet sheet-narrow" role="dialog" aria-modal="true" aria-labelledby="sera-titolo">
    <div class="sheet-grab"></div>
    <div class="sheet-head"><div class="sheet-head-txt"><h3 class="t-title" id="sera-titolo">Cosa fai domani?</h3><p class="t-label muted" id="sera-sotto"></p></div>
      <button type="button" class="btn btn-icon" onclick="closeModal('seraOverlay')" aria-label="Chiudi"><i class="ti ti-x"></i></button></div>
    <div id="sera-corpo"></div>
    <div class="sheet-cta"><button type="button" class="btn btn-primary btn-block" data-act="sera-fatto">Fatto, a domani</button></div>
  </div>
</div>`);
ui.sera = null;
function righeSera() {
  const domani = giornoDomani(), kDomani = giornoKeyDi(domani), oggiK = giornoKeyDi(oggiData()), stessa = (() => { const w = isoWeekParts(domani); return w.week === state.week && w.year === state.year; })();
  const idxOggi = giornoIdxDi(oggiData());
  const aperte = rs => rs.filter(r => !r.fatto && !isGiornaliero(r.c));
  const giorni = (da, a) => GIORNI.slice(da, a).filter(g => !(stessa && g.key === kDomani)).flatMap(g => aperte(righeGiorno(g.key)).map(r => ({ ...r, dove: g.label })));
  const gia = stessa ? aperte(righeGiorno(kDomani)) : (ui.sera ? state.cicli.filter(c => ui.sera.spostate.has(c.id)).map(c => ({ c })) : []);
  return {
    domani, kDomani, stessa, gia,
    gruppi: [
      { t: 'In settimana, senza giorno', righe: aperte(righeGiorno('settimana')) },
      { t: 'Rimaste indietro', righe: giorni(0, idxOggi) },
      { t: 'Oggi, non fatte', righe: aperte(righeGiorno(oggiK)) },
      { t: 'Più avanti in settimana', righe: giorni(idxOggi + 1) }
    ].filter(g => g.righe.length)
  };
}
function disegnaSera() {
  const s = righeSera(), sp = ui.sera.spostate;
  $('sera-sotto').textContent = `${fmtGiornoLungo(s.domani)} · ${plurale(s.gia.length, 'cosa in programma', 'cose in programma')}`;
  const rigaS = (r, giaDomani) => { const fatta = giaDomani || sp.has(r.c.id); return `<div class="sera-riga" data-id="${r.c.id}"><span>${escHtml(r.c.title)}<small>${[TIPI[computeEffectiveQ(r.c)].label, r.dove || ''].filter(Boolean).join(' · ')}</small></span>
    <button type="button" class="btn ${fatta ? 'btn-ghost' : 'btn-secondary'} btn-sm" data-act="sera-domani"${fatta ? ' disabled' : ''}>${fatta ? '<i class="ti ti-check"></i>Domani' : '<i class="ti ti-arrow-right"></i>Domani'}</button></div>`; };
  $('sera-corpo').innerHTML = `<p class="sera-domani">Tocca «Domani» su quello che vuoi fare ${s.stessa ? 'domani' : fmtGiorno(s.domani)}: tre cose bastano.</p>`
    + (s.gia.length ? `<p class="list-head"><span>${s.stessa ? 'Domani' : escHtml(fmtGiorno(s.domani))}</span><span class="mono">${s.gia.length}</span></p><div class="group">${s.gia.map(r => rigaS(r, true)).join('')}</div>` : '')
    + (s.gruppi.length ? s.gruppi.map(g => `<p class="list-head"><span>${g.t}</span><span class="mono">${g.righe.length}</span></p><div class="group">${g.righe.map(rigaS).join('')}</div>`).join('')
      : vuoto('ti-calendar-check', 'Niente da spostare', 'In questa settimana non ci sono cose senza giorno o rimaste indietro.'));
}
async function seraADomani(id) {
  const c = ciclo(id), s = righeSera();
  if (!c) return;
  try {
    if (s.stessa) await impostaGiorno(id, s.kDomani);
    else { await pianificaInData(c, s.domani, null); render(); showToast(`Spostata a ${fmtGiorno(s.domani)}`, 'success'); }
    ui.sera.spostate.add(id);
    disegnaSera();
  } catch (e) { showToast('Non spostata: ' + e.message, 'error'); }
}
Object.assign(AZIONI, {
  'sera-apri': () => { ui.sera = { spostate: new Set() }; disegnaSera(); $('seraOverlay').classList.add('open'); },
  'sera-domani': (el, id) => seraADomani(el.closest('[data-id]').dataset.id),
  'sera-fatto': () => { lsScrivi(PRINC.LS.SERA, oggiLocale()); closeModal('seraOverlay'); render(); showToast(ui.sera && ui.sera.spostate.size ? `Domani: ${plurale(ui.sera.spostate.size, 'cosa scelta', 'cose scelte')} in più` : 'A domani', 'success'); },
  'sera-chiudi': () => { lsScrivi(PRINC.LS.SERA, oggiLocale()); render(); }
});
let _seraEra = eSeraFeriale();
setInterval(() => { const ora = eSeraFeriale(); if (ora !== _seraEra) { _seraEra = ora; if (ui.tab === 'oggi') render(); } }, 60000);

// ─── Promemoria su Google Calendar: «18.45 - Piano di domani (5 minuti)», solo dal tasto ───
function primoFerialeDa(ora) {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  if (hhmm(new Date()) >= ora) d.setDate(d.getDate() + 1);
  while (giornoIdxDi(d) > 4) d.setDate(d.getDate() + 1);
  return d;
}
const _corpoPromemoriaPr = corpoPromemoriaV10;
corpoPromemoriaV10 = async function (tipo) {
  if (tipo !== 'domani') return _corpoPromemoriaPr.apply(this, arguments);
  const iso = toISODate(primoFerialeDa(PRINC.DOMANI_ORA));
  return { firma: `domani|${calScelto()}`, corpo: {
    summary: titoloAvviso(PRINC.DOMANI_ORA, 'Piano di domani (5 minuti)'),
    description: `5 minuti per domani: apri l'app e scegli dalla settimana cosa fai domani.\n${APP_URL}`,
    start: { dateTime: `${iso}T${PRINC.DOMANI_ORA}:00`, timeZone: 'Europe/Rome' }, end: { dateTime: `${iso}T${PRINC.DOMANI_FINE}:00`, timeZone: 'Europe/Rome' },
    recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'],
    reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 0 }] },
    extendedProperties: { private: { cicli_aperti: 'promemoria', promemoria: 'domani' } } } };
};
const _sezioneItimePr = sezioneItime;
sezioneItime = function () {
  const h = _sezioneItimePr.apply(this, arguments), prom = leggiJson(LS5.PROM, {}), collegato = isGcalTokenValid();
  const tasto = `<button type="button" class="riga-link" data-act="prom-domani"${collegato ? '' : ' disabled'}><i class="ti ti-moon"></i><span>Piano di domani<small>${collegato ? (prom.domani ? `Dal lunedì al venerdì alle 18:45, 5 minuti, nel calendario ${escHtml(nomeCalScrittura())}` : 'Tocca per crearlo: dal lunedì al venerdì alle 18:45, 5 minuti') : 'Collega Google Calendar'}</small></span><span></span><i class="ti ti-refresh"></i></button>`;
  const segno = 'data-act="prom-bp"';
  const i = h.indexOf(segno);
  if (i < 0) return h;
  const fine = h.indexOf('</button>', i) + '</button>'.length;
  return h.slice(0, fine) + tasto + h.slice(fine);
};
AZIONI['prom-domani'] = async el => {
  el.disabled = true;
  const id = await sincronizzaPromemoria('domani', true);
  el.disabled = false;
  render();
  showToast(id ? 'Promemoria «Piano di domani» su Google Calendar: dal lunedì al venerdì alle 18:45' : 'Non riesco a scrivere su Google Calendar', id ? 'success' : 'error');
};

// ─── Deleghe che tornano (principio 9: istruzioni scritte e la persona giusta · 10: non riprenderle) ───
const delegheOk = () => leggiJson(PRINC.LS.DELEGHE_OK, {});
function avvisiDeleghe() {
  if (!state.delegaColsOk) return [];
  const limite = toISODate(piuGiorni(new Date(), -PRINC.DELEGHE_GG)), oggi = oggiLocale(), ok = delegheOk();
  const per = new Map();
  state.cicli.forEach(c => {
    if (!c.delega_persona_id) return;
    const tornata = (c.ritorni_delega || 0) > 0 && giornoIso(c.updated_at || c.created_at) >= limite;
    const scaduta = !c.done && c.q === 3 && c.delega_controllo && c.delega_controllo < oggi && c.delega_controllo >= limite;
    if (!tornata && !scaduta && (c.ritorni_delega || 0) < PRINC.DELEGHE_COSA) return;
    const k = String(c.delega_persona_id);
    const x = per.get(k) || { cose: [], ripetuta: null };
    if (tornata || scaduta) x.cose.push(c);
    if ((c.ritorni_delega || 0) >= PRINC.DELEGHE_COSA && !c.done) x.ripetuta = x.ripetuta && (x.ripetuta.ritorni_delega || 0) >= (c.ritorni_delega || 0) ? x.ripetuta : c;
    per.set(k, x);
  });
  return [...per.entries()].map(([pid, x]) => ({ p: personaDi(pid), ...x }))
    .filter(a => a.p && (a.cose.length >= PRINC.DELEGHE_PERSONA || a.ripetuta))
    .filter(a => !ok[a.p.id] || Date.now() - new Date(ok[a.p.id]).getTime() > PRINC.DELEGHE_OK_GG * 864e5)
    .map(a => ({ ...a, cosa: a.ripetuta || a.cose.filter(c => !c.done).sort((x, y) => String(y.updated_at || '').localeCompare(String(x.updated_at || '')))[0] || null }));
}
const testoAvvisoDelega = a => `Con ${a.p.nome} le deleghe tornano spesso`;
const DOMANDA_DELEGA = 'Le hai dato istruzioni scritte? È la persona giusta?';
const tastiDelega = a => `<div class="banner-azioni"><button type="button" class="btn btn-secondary btn-sm" data-act="del-istruzioni" data-p="${esc(a.p.id)}"><i class="ti ti-file-text"></i>Scrivi le istruzioni</button>
  <button type="button" class="btn btn-secondary btn-sm" data-act="del-incontro" data-p="${esc(a.p.id)}"><i class="ti ti-calendar-repeat"></i>Incontro settimanale</button></div>`;
const chiudiDelega = a => `<button type="button" class="btn btn-icon" data-act="del-ok" data-p="${esc(a.p.id)}" aria-label="Ok, lo so: non mostrarlo per 30 giorni" data-tip="Non mostrarlo per 30 giorni"><i class="ti ti-x"></i></button>`;
function cardDeleghe() {
  const l = avvisiDeleghe();
  if (!l.length || modoSemplice()) return '';
  return l.map(a => `<section class="banner-piano banner-leggero delega-avviso" aria-label="Deleghe con ${esc(a.p.nome)}"><i class="ti ti-arrow-back-up" aria-hidden="true"></i>
    <div><b>${escHtml(testoAvvisoDelega(a))}</b> <span class="da-dom">${DOMANDA_DELEGA}</span><p class="t-caption muted">${a.ripetuta ? `«${escHtml(a.ripetuta.title)}» è tornata ${a.ripetuta.ritorni_delega} volte.` : `${plurale(a.cose.length, 'delega tornata o scaduta', 'deleghe tornate o scadute')} negli ultimi 60 giorni.`}</p>${tastiDelega(a)}</div>${chiudiDelega(a)}</section>`).join('');
}
function avvisoPerPersona(a) { lsScrivi(PRINC.LS.DELEGHE_OK, JSON.stringify({ ...delegheOk(), [a.p.id]: new Date().toISOString() })); }
const trovaAvviso = pid => avvisiDeleghe().find(a => String(a.p.id) === String(pid)) || null;
Object.assign(AZIONI, {
  'del-ok': el => { const a = trovaAvviso(el.dataset.p); if (a) avvisoPerPersona(a); render(); },
  'del-istruzioni': async el => {
    const a = trovaAvviso(el.dataset.p);
    if (!a) return;
    const titolo = `Scrivere le istruzioni per ${a.p.nome}${a.cosa ? '' : ' (deleghe)'}`;
    try {
      let p = null;
      if (a.cosa && state.passiColOk) p = await creaPassoDi(a.cosa, { title: titolo, q: 2 }, a.cosa.ctx || state.ctx);
      else { p = await upsertCiclo({ ...rigaNuova(titolo, { subito: false }, 'lavoro'), persone_menzionate: [a.p.nome] }); if (p) state.cicli = [p, ...state.cicli]; }
      avvisoPerPersona(a);
      render();
      showToast(a.cosa && state.passiColOk ? `Passo aggiunto a «${a.cosa.title}»` : 'Aggiunta: ' + titolo, 'success', p ? { annulla: () => apriDettaglio(a.cosa && state.passiColOk ? a.cosa.id : p.id), etichetta: 'Apri' } : undefined);
    } catch (e) { showToast('Non aggiunta: ' + e.message, 'error'); }
  },
  'del-incontro': async el => {
    const a = trovaAvviso(el.dataset.p);
    if (!a) return;
    const titolo = `Punto settimanale con ${a.p.nome}`;
    const gia = state.cicli.find(c => !c.done && senzaAccenti(c.title) === senzaAccenti(titolo));
    if (gia) { avvisoPerPersona(a); render(); showToast('C\'è già: ' + gia.title, 'info', { annulla: () => apriDettaglio(gia.id), etichetta: 'Apri' }); return; }
    const lun = lunediDopo(new Date());
    try {
      const c = await upsertCiclo({ ...rigaNuova(titolo, { subito: false }, 'lavoro'), q: 2, persone_menzionate: [a.p.nome], ricorrenza: 'settimanale',
        ...(state.pianificaColsOk ? { pianificato_ripetizione: 'settimanale', pianificato_data: toISODate(lun) } : {}) });
      if (c) state.cicli = [c, ...state.cicli];
      avvisoPerPersona(a);
      render();
      showToast(`Importante, ogni settimana da ${fmtGiorno(lun)}: ${titolo}`, 'success', c ? { annulla: () => apriDettaglio(c.id), etichetta: 'Apri' } : undefined);
    } catch (e) { showToast('Non aggiunta: ' + e.message, 'error'); }
  }
});
const _bannerCicliCalPr = bannerCicliCal;
bannerCicliCal = function () {
  const conControlli = daControllare().length > 0;
  return _bannerCicliCalPr.apply(this, arguments) + bannerSera() + cardMete() + (conControlli ? '' : cardDeleghe());
};
const _tuttoPersonePr = tuttoPersone;
tuttoPersone = function (lista) {
  const h = _tuttoPersonePr.apply(this, arguments);
  return avvisiDeleghe().reduce((out, a) => {
    const testa = `${escHtml(a.p.nome)}</span><span class="mono">`;
    const i = out.indexOf(testa);
    if (i < 0) return out;
    const g = out.indexOf('<div class="group">', i);
    if (g < 0) return out;
    const dopo = g + '<div class="group">'.length;
    return out.slice(0, dopo) + `<div class="persona-avviso"><i class="ti ti-arrow-back-up" aria-hidden="true"></i><div><b>${escHtml(testoAvvisoDelega(a))}</b> <span class="da-dom">${DOMANDA_DELEGA}</span>${tastiDelega(a)}</div>${chiudiDelega(a)}</div>` + out.slice(dopo);
  }, h);
};
// «Riprendila io» e «Mi è tornata indietro»: prima una domanda (principio 10)
const _rispondiConfermaPr = rispondiConferma;
rispondiConferma = function (si) { const o = ui.conferma; _rispondiConfermaPr.apply(this, arguments); if (!si && o && o.onNo) o.onNo(); };
function primaDiRiprendere(id, poi, seNo) {
  const c = ciclo(id);
  if (!c) return;
  const p = state.delegaColsOk ? personaDi(c.delega_persona_id) : null;
  const chi = p ? p.nome : 'chi l\'aveva';
  apriConferma({ titolo: 'Prima di riprenderla: è un\'urgenza vera?', testo: `Se la riprendi tu, la prossima volta tornerà di nuovo da te. Se non brucia, ridalla a ${chi} con due righe di istruzioni.`,
    ok: 'Sì, la riprendo', no: `No, resta a ${chi}`, onOk: poi, onNo: seNo });
}
const _ctrlRiprendiPr = AZIONI['ctrl-riprendi'], _qTornataPr = AZIONI['q-tornata'];
AZIONI['ctrl-riprendi'] = (el, id, data) => primaDiRiprendere(id, () => _ctrlRiprendiPr(el, id, data), () => showToast('Resta delegata', 'info'));
AZIONI['q-tornata'] = (el, id, data) => primaDiRiprendere(id, () => _qTornataPr(el, id, data), async () => {
  // è tornata, ma la ridai: si conta il ritorno e si ricontrolla tra 2 giorni
  const c = ciclo(id);
  if (!c) return;
  const quando = toISODate(dataPiu(2));
  try {
    await patchCiclo(id, { ...(state.delegaColsOk ? { delega_controllo: quando } : {}), ...(state.ritorniColOk ? { ritorni_delega: (c.ritorni_delega || 0) + 1 } : {}) });
    render();
    showToast(`Resta delegata · controlli il ${fmtGgMm(quando)}`, 'success');
  } catch (e) { showToast('Errore: ' + e.message, 'error'); }
});

// ─── Chiudi la settimana: tempo per il futuro, e «Cosa ti ha tolto la spinta?» (principio 11) ───
const SPINTA = [
  { k: 'persona', l: 'Una persona' }, { k: 'azienda', l: 'Una cosa successa in azienda' }, { k: 'stanchezza', l: 'Stanchezza' },
  { k: 'urgenze', l: 'Troppe urgenze di altri' }, { k: 'altro', l: 'Altro' }];
const _openBpReviewPr = openBpReview;
openBpReview = function () {
  const r = _openBpReviewPr.apply(this, arguments);
  if (!state.bp) return r;
  const gia = (state.bp.motivi || {}).spinta;
  ui.rev = { ...ui.rev, spinta: { scelte: new Set((gia && gia.scelte) || []), testo: (gia && gia.testo) || '' }, rinviate: 0, spintePassate: null };
  caricaRinviate().then(() => { if (ui.rev.passo === 2) disegnaReview(); });
  caricaSpintePassate().then(() => { if (ui.rev.passo === 2) disegnaReview(); });
  return r;
};
// rinviate 2+ volte: la stessa cosa nel piano di almeno 2 settimane prima di questa, senza essere fatta
async function caricaRinviate() {
  if (!state.bp) return;
  const ids = unici(revItems().filter(i => !i.completato).map(i => i.ciclo_id));
  if (!ids.length) return;
  try {
    const { data, error } = await db.from('battle_plan_items').select('ciclo_id,battle_plan_id,completato').in('ciclo_id', ids);
    if (error) throw error;
    const piani = new Map();
    (data || []).filter(x => x.battle_plan_id !== state.bp.id && !x.completato).forEach(x => piani.set(x.ciclo_id, new Set([...(piani.get(x.ciclo_id) || []), x.battle_plan_id])));
    ui.rev = { ...ui.rev, rinviate: [...piani.values()].filter(s => s.size >= 2).length };
  } catch (e) { console.warn('[Review] rinviate:', e.message); }
}
async function caricaSpintePassate() {
  if (!state.statsColOk) { ui.rev = { ...ui.rev, spintePassate: [] }; return; }
  try {
    const { data, error } = await db.from('battle_plan').select('id,settimana,anno,motivi').eq('stato', 'chiuso');
    if (error) throw error;
    const l = (data || []).filter(p => p.id !== (state.bp && state.bp.id) && p.motivi && p.motivi.spinta && ((p.motivi.spinta.scelte || []).length || p.motivi.spinta.testo))
      .sort((a, b) => (b.anno - a.anno) || (b.settimana - a.settimana)).slice(0, 3);
    ui.rev = { ...ui.rev, spintePassate: l };
  } catch (e) { console.warn('[Review] settimane passate:', e.message); ui.rev = { ...ui.rev, spintePassate: [] }; }
}
const testoSpinta = s => [...(s.scelte || []).map(k => (SPINTA.find(x => x.k === k) || { l: k }).l.toLowerCase()), s.testo ? `«${s.testo}»` : ''].filter(Boolean).join(', ');
function serveSpinta() {
  const st = statRevConEventi();
  return (st.tot && (st.tot - st.done) / st.tot >= PRINC.SPINTA_NON_FATTE) || (ui.rev.rinviate || 0) >= PRINC.SPINTA_RINVIATE;
}
function htmlSpinta() {
  const passate = (ui.rev.spintePassate || []).map(p => `<li><b>sett. ${p.settimana}</b>: ${escHtml(testoSpinta(p.motivi.spinta))}</li>`);
  const giaDetta = state.bp && (state.bp.motivi || {}).spinta;
  const passateHtml = passate.length ? `<ul class="spinta-passate"><li><b>Le ultime volte</b></li>${passate.join('')}</ul>` : '';
  if (!serveSpinta() && !giaDetta) return passateHtml ? `<div class="spinta">${passateHtml}</div>` : '';
  const s = ui.rev.spinta;
  return `<div class="spinta" id="rev-spinta"><b>Cosa ti ha tolto la spinta questa settimana?</b>
    <span class="t-caption muted">Capita. Saperlo aiuta a non ripeterlo: scegli quello che c'entra, anche più di uno.</span>
    <div class="chips chips-wrap" role="group" aria-label="Cosa ti ha tolto la spinta">${SPINTA.map(x => `<button type="button" class="chip" data-act="rev-spinta" data-v="${x.k}" aria-pressed="${s.scelte.has(x.k)}">${x.l}</button>`).join('')}</div>
    <input type="text" class="input" id="rev-spinta-testo" maxlength="160" value="${esc(s.testo)}" placeholder="Se vuoi, due parole (facoltativo)" aria-label="Cosa è successo">
    ${passateHtml}</div>`;
}
const _disegnaReviewPr = disegnaReview;
disegnaReview = function () {
  const notaPrima = ui.rev && ui.rev.passo === 2 && $('bprev-note') ? $('bprev-note').value : null;   // la nota già scritta non si perde
  const r = _disegnaReviewPr.apply(this, arguments);
  if (ui.rev.passo !== 2 || !state.bp) return r;
  const body = $('bprev-body');
  const dove = body.querySelector('.rev-stat') || body.querySelector('label[for="bprev-note"]');
  const nota = $('bprev-note'), testoNota = notaPrima;
  body.querySelectorAll('.futuro, .spinta').forEach(x => x.remove());
  const h = htmlFuturo(quotaSettimana(), 'review') + (ui.rev.spinta ? htmlSpinta() : '');
  if (dove) dove.insertAdjacentHTML('beforebegin', h); else body.insertAdjacentHTML('beforeend', h);
  if (nota && testoNota !== null) nota.value = testoNota;
  return r;
};
AZIONI['rev-spinta'] = el => {
  const s = ui.rev.spinta, k = el.dataset.v;
  if (s.scelte.has(k)) s.scelte.delete(k); else s.scelte.add(k);
  el.setAttribute('aria-pressed', String(s.scelte.has(k)));   // senza ridisegnare: la nota resta com'è
};
document.addEventListener('input', e => { if (e.target.id === 'rev-spinta-testo' && ui.rev && ui.rev.spinta) ui.rev.spinta.testo = e.target.value; });
const _revMotiviConteggioPr = revMotiviConteggio;
revMotiviConteggio = function () {
  const out = _revMotiviConteggioPr.apply(this, arguments), s = ui.rev && ui.rev.spinta;
  if (s && (s.scelte.size || s.testo.trim())) out.spinta = { scelte: [...s.scelte], testo: s.testo.trim().slice(0, 160), quando: new Date().toISOString() };
  else if (state.bp && state.bp.motivi && state.bp.motivi.spinta) out.spinta = state.bp.motivi.spinta;
  return out;
};

