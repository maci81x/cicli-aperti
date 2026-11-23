// v26 · 3/11 · IL METODO DI LEO (disegni della sezione 9 del canvas «versione snella», approvati il 2/11)
// · rosso = «Non si sposta»: le Subito, le cose con il lucchetto (inderogabile) e gli appuntamenti segnati (eventi_fissi);
//   nei giorni stanno in cima; spostarli chiede conferma
// · obiettivi della settimana (obiettivi_settimana): riquadro in Pianifica, primo passo di «Prepara la settimana», nella mail a Leo e nel foglio
// · Pianifica → Giorno: un giorno alla volta
// · stampa: sempre un foglio per giorno, nuovo foglio (obiettivi e note a destra, in cima ciò che non si sposta)
// · Oggi: «Adesso tocca a…» in una riga (si apre col tocco, si spegne da Impostazioni); la sera «Chiudi la giornata»
// · Impostazioni: «Togli» su persone e aree; via «Assegna l'area con Claude»
// ══════════════════════════════════════════════════════════════
const V26 = { RITMO_OFF: 'v26_ritmo_off', FISSI_LS: 'eventi_fissi', OB_LS: 'obiettivi_settimana', SENZA_ORA: 'senza orario', MAX_OB: 5 };
const v26Esc = s => escHtml(String(s == null ? '' : s));

// --- «in giornata» al posto di «tutto il giorno» ---
function orarioEvento(e) { return e.ora ? `${e.ora}${e.fine ? '–' + e.fine : ''}` : V26.SENZA_ORA; }

// --- appuntamenti che non si spostano ---
state.evtFissi = new Set((() => { try { const v = JSON.parse(localStorage.getItem(V26.FISSI_LS) || '[]'); return Array.isArray(v) ? v : []; } catch (_) { return []; } })());
state.evtFissiDb = false;
const v26SalvaFissiLocali = () => { try { localStorage.setItem(V26.FISSI_LS, JSON.stringify([...state.evtFissi])); } catch (_) {} };
async function v26CaricaFissi() {
  const { data, error } = await db.from('eventi_fissi').select('chiave');
  if (error) { state.evtFissiDb = false; return; }
  state.evtFissiDb = true;
  state.evtFissi = new Set((data || []).map(r => r.chiave));
  v26SalvaFissiLocali();
  render();
}
const v26EventoFisso = e => !!e && !e.routine && chiaviEvento(e).some(k => state.evtFissi.has(k));
const v26CosaFissa = c => !!c && !c.done && (computeEffectiveQ(c) === 1 || (!!c.inderogabile && state.inderoColOk));

// la riga di una cosa: classe per il rosso
const _rigaV26 = riga;
riga = function (r, o) {
  const h = _rigaV26.apply(this, arguments);
  try { if (r && r.c && !r.fatto && v26CosaFissa(r.c)) return h.replace(/^(\s*<div class="item )/, '$1v26-fisso '); } catch (_) {}
  return h;
};
// la riga di un appuntamento: rosso + «non si sposta»
const _rigaEventoV26 = rigaEvento;
rigaEvento = function (e) {
  let h = _rigaEventoV26.apply(this, arguments);
  try {
    if (!v26EventoFisso(e)) return h;
    h = h.replace(/class="evt-riga /, 'class="evt-riga v26-fisso ').replace(/class="evt-riga"/, 'class="evt-riga v26-fisso"');
    const i = h.lastIndexOf('</span></div>');
    if (i >= 0) h = h.slice(0, i) + '<span class="evt-nota v26-nota-fisso"><i class="ti ti-lock" aria-hidden="true"></i><span>non si sposta</span></span>' + h.slice(i);
  } catch (err) { console.warn('[v26] riga evento:', err.message); }
  return h;
};
// nei giorni: in cima «Non si sposta», poi il resto
function v26Raggruppa(zona) {
  if (!zona) return;
  const figli = [...zona.children].filter(x => x.matches('.item, .evt-riga'));
  const fissi = figli.filter(x => x.classList.contains('v26-fisso') && !x.classList.contains('is-done'));
  if (!fissi.length) return;
  const testa = document.createElement('div');
  testa.className = 'fascia-h v26-h-fisso';
  testa.innerHTML = '<i class="ti ti-lock" aria-hidden="true"></i>Non si sposta';
  zona.prepend(testa);
  let dopo = testa;
  fissi.forEach(x => { dopo.after(x); dopo = x; });
  const resto = [...zona.children].slice([...zona.children].indexOf(dopo) + 1).filter(x => !x.classList.contains('col-vuota'));
  if (resto.length) {
    const t2 = document.createElement('div');
    t2.className = 'fascia-h v26-h-resto';
    t2.textContent = 'Si può spostare';
    dopo.after(t2);
  }
}
const _colonnaGiornoV26 = colonnaGiorno;
colonnaGiorno = function (gg, idx) {
  const h = _colonnaGiornoV26.apply(this, arguments);
  try { const t = v21Tpl(h); v26Raggruppa(t.content.querySelector('.bzona')); return t.innerHTML; } catch (e) { console.warn('[v26] colonna:', e.message); return h; }
};
// conferma prima di spostare un appuntamento che non si sposta
function v26ChiediEvento(e, esegui) {
  ui.proteggi = { id: null, esegui, motivo: null, v26Evento: true };
  $('proteggi-cosa').textContent = e.titolo || '';
  $('proteggi-titolo').textContent = 'Avevi detto che non si sposta. Lo sposti davvero?';
  disegnaProteggi();
  $('proteggiOverlay').classList.add('open');
}
const _rispondiProteggiV26 = rispondiProteggi;
rispondiProteggi = async function (sposta) {
  const p = ui.proteggi;
  $('proteggi-titolo').textContent = 'È un\'attività importante bloccata. La sposti davvero?';
  if (!p || !p.v26Evento) return _rispondiProteggiV26.apply(this, arguments);
  ui.proteggi = null;
  closeModal('proteggiOverlay');
  if (!sposta) { render(); showToast('Resta dov\'era', 'info'); return; }
  await p.esegui();
};
const _chiediSpostamentoV26 = chiediSpostamento;
chiediSpostamento = function (c, esegui) {
  const r = _chiediSpostamentoV26.apply(this, arguments);
  if (c && computeEffectiveQ(c) !== 2) $('proteggi-titolo').textContent = 'Avevi detto che non si sposta. La sposti davvero?';
  return r;
};
const _apriSpostaEventoV26 = apriSpostaEvento;
apriSpostaEvento = function (id, iso) {
  const e = eventoPerId(id);
  if (v26EventoFisso(e) && protezione() !== 'spento') return v26ChiediEvento(e, () => _apriSpostaEventoV26(id, iso));
  return _apriSpostaEventoV26.apply(this, arguments);
};
// il foglio dell'appuntamento: «Non si sposta»
const _disegnaFoglioEventoV26 = disegnaFoglioEvento;
disegnaFoglioEvento = function (id) {
  _disegnaFoglioEventoV26(id);
  const e = eventoPerId(id), corpo = $('evt-corpo');
  if (!e || !corpo || e.routine) return;
  const fisso = v26EventoFisso(e);
  const btn = `<button type="button" class="riga-link${fisso ? ' v26-riga-fisso' : ''}" data-act="v26-evt-fisso" data-evt="${esc(e.id)}"><i class="ti ${fisso ? 'ti-lock-open' : 'ti-lock'}"></i><span>${fisso ? 'Si può spostare' : 'Non si sposta'}<small>${fisso ? 'adesso è in rosso' : 'diventa rosso e spostarlo chiede conferma'}${e.serie ? ' · vale anche per le prossime volte' : ''}</small></span><span></span><i class="ti ti-chevron-right"></i></button>`;
  const gruppo = corpo.querySelector('[data-act="v24-tipo"]');
  if (gruppo && gruppo.parentElement) gruppo.parentElement.insertAdjacentHTML('afterbegin', btn);
  else corpo.insertAdjacentHTML('beforeend', `<div class="group">${btn}</div>`);
};
AZIONI['v26-evt-fisso'] = async el => {
  const e = eventoPerId(el.dataset.evt);
  if (!e) return;
  const chiave = e.serie ? 'serie:' + e.serie : e.id, era = v26EventoFisso(e);
  chiaviEvento(e).forEach(k => state.evtFissi.delete(k));
  if (!era) state.evtFissi.add(chiave);
  v26SalvaFissiLocali();
  render();
  if ($('evtOverlay').classList.contains('open')) disegnaFoglioEvento(e.id);
  if (state.evtFissiDb) {
    try {
      for (const k of chiaviEvento(e)) await db.from('eventi_fissi').delete().eq('chiave', k);
      if (!era) { const { error } = await db.from('eventi_fissi').upsert({ chiave, titolo: e.titolo }, { onConflict: 'chiave' }); if (error) throw error; }
    } catch (err) { console.warn('[v26] salvato solo qui:', err.message); }
  }
  showToast(era ? `${e.titolo}: si può spostare` : `${e.titolo}: non si sposta${e.serie ? ', anche le prossime volte' : ''}`, 'success');
};
// il menu ⋯ di una cosa: «Non si sposta»
const _apriMenuV26 = apriMenu;
apriMenu = function (btn, id, data) {
  _apriMenuV26.apply(this, arguments);
  const c = ciclo(id), m = $('rigaMenu');
  if (!c || !state.inderoColOk || !m) return;
  const fissa = !!c.inderogabile;
  const voce = `<button type="button" role="menuitem" data-act="v26-fisso" data-id="${id}"><i class="ti ${fissa ? 'ti-lock-open' : 'ti-lock'}"></i>${fissa ? 'Si può spostare' : 'Non si sposta'}</button>`;
  const primo = m.querySelector('button');
  if (primo) primo.insertAdjacentHTML('afterend', voce); else m.insertAdjacentHTML('afterbegin', voce);
};
AZIONI['v26-fisso'] = async (el, id) => {
  chiudiMenu();
  const c = ciclo(id || el.dataset.id);
  if (!c) return;
  const nuovo = !c.inderogabile;
  try {
    await patchCiclo(c.id, { inderogabile: nuovo });
    render();
    showToast(nuovo ? `«${c.title}»: non si sposta` : `«${c.title}»: si può spostare`, 'success', { annulla: async () => { await patchCiclo(c.id, { inderogabile: !nuovo }); render(); } });
  } catch (e) { showToast('Errore: ' + e.message, 'error'); }
};

// --- obiettivi della settimana ---
state.obiettivi = new Map((() => { try { const v = JSON.parse(localStorage.getItem(V26.OB_LS) || '[]'); return Array.isArray(v) ? v : []; } catch (_) { return []; } })());
state.obiettiviDb = false;
const v26ObSalvaLocali = () => { try { localStorage.setItem(V26.OB_LS, JSON.stringify([...state.obiettivi].slice(-20))); } catch (_) {} };
const v26ObDi = (w, y) => state.obiettivi.get(settKey(w, y)) || [];
async function v26CaricaObiettivi() {
  const { data, error } = await db.from('obiettivi_settimana').select('settimana_anno,voci');
  if (error) { state.obiettiviDb = false; return; }
  state.obiettiviDb = true;
  (data || []).forEach(r => state.obiettivi.set(r.settimana_anno, Array.isArray(r.voci) ? r.voci : []));
  v26ObSalvaLocali();
  render();
}
async function v26ObSalva(w, y, voci) {
  const k = settKey(w, y);
  state.obiettivi.set(k, voci);
  v26ObSalvaLocali();
  render();
  if (!state.obiettiviDb) return;
  try { const { error } = await db.from('obiettivi_settimana').upsert({ settimana_anno: k, voci, updated_at: new Date().toISOString() }, { onConflict: 'settimana_anno' }); if (error) throw error; }
  catch (e) { console.warn('[v26] obiettivi salvati solo qui:', e.message); showToast('Obiettivi salvati solo su questo dispositivo', 'warn'); }
}
function v26BoxObiettivi(w = state.week, y = state.year) {
  const voci = v26ObDi(w, y);
  const lista = voci.length
    ? `<ul class="v26-ob-lista">${voci.map((v, i) => `<li><button type="button" class="v26-ob-voce${v.fatto ? ' fatto' : ''}" data-act="v26-ob-spunta" data-i="${i}" aria-pressed="${!!v.fatto}"><span class="v26-ob-check" aria-hidden="true">${v.fatto ? '<i class="ti ti-check"></i>' : ''}</span><span>${v26Esc(v.testo)}</span></button></li>`).join('')}</ul>`
    : `<button type="button" class="v26-ob-vuoto" data-act="v26-ob-modifica"><i class="ti ti-plus"></i>Scrivi da 1 a 5 obiettivi</button>`;
  const fatti = voci.filter(v => v.fatto).length;
  return `<section class="v26-obiettivi" aria-label="Obiettivi della settimana"><div class="v26-ob-h"><b>Obiettivi della settimana</b>${voci.length ? `<span class="mono">${fatti}/${voci.length}</span>` : ''}
    <button type="button" class="btn btn-icon" data-act="v26-ob-modifica" aria-label="Modifica gli obiettivi"><i class="ti ti-pencil"></i></button></div>${lista}</section>`;
}
AZIONI['v26-ob-spunta'] = el => {
  const voci = v26ObDi(state.week, state.year).map(v => ({ ...v }));
  const v = voci[+el.dataset.i];
  if (!v) return;
  v.fatto = !v.fatto;
  v26ObSalva(state.week, state.year, voci);
};
function v26OverlayObiettivi() {
  let ov = $('v26obOverlay');
  if (ov) return ov;
  document.body.insertAdjacentHTML('beforeend', `<div class="modal-overlay" id="v26obOverlay" onclick="closeModalOnBg(event,'v26obOverlay')">
    <div class="modal sheet sheet-narrow" role="dialog" aria-modal="true" aria-labelledby="v26ob-titolo"><div class="sheet-grab"></div>
      <div class="sheet-head"><h3 class="t-title" id="v26ob-titolo">Cosa vuoi portare a casa questa settimana?</h3></div>
      <p class="t-caption muted" id="v26ob-sotto">Da 1 a 5 obiettivi. Le cose della settimana le scegli dopo, partendo da questi.</p>
      <div id="v26ob-campi" class="v26-ob-campi"></div>
      <div class="sheet-cta sheet-cta-row"><button type="button" class="btn btn-ghost" data-act="v26-ob-salta">Salta</button><button type="button" class="btn btn-primary" data-act="v26-ob-ok" id="v26ob-ok">Salva</button></div>
    </div></div>`);
  return $('v26obOverlay');
}
function v26ApriObiettivi(w, y, poi) {
  const ov = v26OverlayObiettivi(), voci = v26ObDi(w, y);
  ui.v26Ob = { w, y, poi };
  const da = getWeekStart(w, y), a = new Date(da); a.setDate(da.getDate() + 6);
  $('v26ob-sotto').textContent = `Settimana ${w} (${fmtCorta(da)} – ${fmtCorta(a)}). Da 1 a 5 obiettivi.${poi ? ' Le cose della settimana le scegli dopo, partendo da questi.' : ''}`;
  $('v26ob-campi').innerHTML = Array.from({ length: V26.MAX_OB }, (_, i) => `<label class="v26-ob-campo"><span>Obiettivo ${i + 1}</span><input type="text" class="input" maxlength="120" data-i="${i}" value="${esc((voci[i] || {}).testo || '')}" placeholder="${i === 0 ? 'es. vendere 20.000 €' : i === 1 ? 'es. 10 clienti nuovi' : 'facoltativo'}"></label>`).join('');
  $('v26ob-ok').textContent = poi ? 'Avanti: scegli le cose' : 'Salva';
  ov.classList.add('open');
  setTimeout(() => { const f = ov.querySelector('input'); if (f) f.focus(); }, 60);
}
AZIONI['v26-ob-modifica'] = () => v26ApriObiettivi(state.week, state.year);
AZIONI['v26-ob-ok'] = async () => {
  const s = ui.v26Ob; if (!s) return;
  const prima = v26ObDi(s.w, s.y);
  const voci = [...$('v26ob-campi').querySelectorAll('input')].map(i => i.value.trim()).filter(Boolean).slice(0, V26.MAX_OB)
    .map(testo => ({ testo, fatto: !!(prima.find(p => p.testo === testo) || {}).fatto }));
  closeModal('v26obOverlay');
  ui.v26Ob = null;
  await v26ObSalva(s.w, s.y, voci);
  if (s.poi) s.poi();
};
AZIONI['v26-ob-salta'] = () => { const s = ui.v26Ob; closeModal('v26obOverlay'); ui.v26Ob = null; if (s) { ui.v26ObSaltati = ui.v26ObSaltati || new Set(); ui.v26ObSaltati.add(settKey(s.w, s.y)); if (s.poi) s.poi(); } };
// «Prepara la settimana»: primo passo gli obiettivi
const _apriWizardV26 = apriWizard;
apriWizard = async function (week, year) {
  const w = week ? { week, year } : ui.tab === 'oggi' ? bpSettimanaCorrente() : { week: state.week, year: state.year };
  const saltati = ui.v26ObSaltati || new Set();
  if (!v26ObDi(w.week, w.year).length && !saltati.has(settKey(w.week, w.year))) { v26ApriObiettivi(w.week, w.year, () => _apriWizardV26(week, year)); return; }
  return _apriWizardV26.apply(this, arguments);
};
// la mail a Leo
const _testoInvioV26 = testoInvio;
testoInvio = function (rp) {
  const t = _testoInvioV26.apply(this, arguments), voci = v26ObDi(state.week, state.year);
  if (!voci.length) return t;
  const ob = `Obiettivi della settimana:\n${voci.map(v => `- ${v.testo}${v.fatto ? ' (fatto)' : ''}`).join('\n')}\n\n`;
  return t.replace('\n\nPDF in allegato.', `\n\n${ob}PDF in allegato.`);
};

// --- Pianifica: Giorno, obiettivi in alto, stampa per giorni ---
function v26SegConGiorno(h) {
  return h.replace(/(<button type="button" data-act="pian" data-v="settimana"[^>]*>Settimana<\/button>)/, `$1<button type="button" data-act="pian" data-v="giorno" aria-pressed="${ui.pian === 'giorno'}">Giorno</button>`);
}
function v26InserisciObiettivi(h) {
  const t = v21Tpl(h), f = t.content, box = v21Tpl(v26BoxObiettivi()).content.firstElementChild;
  const vh = f.querySelector('.vh-board') || [...f.children].find(x => x.classList.contains('vh'));
  if (!vh) return h;
  if (vh.classList.contains('vh-board')) {
    const wrap = document.createElement('div'); wrap.className = 'v26-testa';
    vh.before(wrap); wrap.appendChild(vh); wrap.appendChild(box);
  } else {
    const dopo = f.querySelector('.v22-righe-tel') || f.querySelector('.days') || vh;
    (dopo.classList.contains('days') ? dopo.parentElement : dopo).after(box);
  }
  // la stampante della settimana: si sceglie quali giorni (un foglio per giorno)
  f.querySelectorAll('[data-act="pdf"]').forEach(b => { b.dataset.act = 'v26-stampa-scegli'; b.setAttribute('aria-label', 'Stampa: un foglio per giorno'); b.setAttribute('data-tip', 'Stampa: un foglio per giorno'); });
  return t.innerHTML;
}
function v26VistaGiorno() {
  const idx = Math.max(0, Math.min(6, ui.giorno || 0)), d = dataDelGiorno(idx), g = GIORNI[idx];
  const rs = righeDaFare(g.key), op = opzRighe(d), fatte = fatteDelGiorno(g.key);
  const { conOra, senzaOra } = sequenzaGiorno(rs, d);
  const seq = [...conOra.filter(x => x.tipo !== 'evento' || !x.e.routine), ...senzaOra.map(r => ({ tipo: 'cosa', r }))];
  const html = x => x.tipo === 'evento' ? rigaEvento(x.e) : x.tipo === 'cuscinetto' ? rigaCuscinetto(x.item, op) : riga(x.r, op);
  const fisso = x => x.tipo === 'evento' ? v26EventoFisso(x.e) : x.tipo === 'cosa' ? !x.r.fatto && v26CosaFissa(x.r.c) : false;
  const fissi = seq.filter(fisso), resto = seq.filter(x => !fisso(x));
  const oggiIdx = eSettimanaCorrente() ? giornoIdxDi(oggiData()) : -1;
  const chips = GIORNI.map((x, i) => `<button type="button" class="v26-chip-g${i === oggiIdx ? ' oggi' : ''}" data-act="v26-giorno" data-i="${i}" aria-pressed="${i === idx}" aria-label="${x.label} ${dataDelGiorno(i).getDate()}">${x.short.charAt(0)} <span class="mono">${dataDelGiorno(i).getDate()}</span></button>`).join('');
  const seg = [['settimana', 'Settimana'], ['giorno', 'Giorno'], ['mese', 'Mese']].map(([k, l]) => `<button type="button" data-act="pian" data-v="${k}" aria-pressed="${ui.pian === k}">${l}</button>`).join('');
  const inSett = righeDaFare('settimana');
  const vuoto = !seq.length;
  const titolo = fmtGiornoLungo(d).replace(/^./, c => c.toUpperCase());
  return `<div class="vh"><div><h1>Pianifica${btnAiuto('pianifica')}</h1></div><div class="seg" role="group" aria-label="Vista">${seg}</div></div>
    <div class="v26-g-nav">
      <div class="v26-g-frecce"><button type="button" class="btn btn-icon" data-act="v26-giorno-sposta" data-v="-1" aria-label="Giorno prima"><i class="ti ti-chevron-left"></i></button><b>${v26Esc(titolo)}</b>${etichettaFatte(fatte)}<button type="button" class="btn btn-icon" data-act="v26-giorno-sposta" data-v="1" aria-label="Giorno dopo"><i class="ti ti-chevron-right"></i></button></div>
      <div class="v26-g-chips" role="group" aria-label="Giorni della settimana ${state.week}">${chips}</div>
      <button type="button" class="btn btn-primary btn-sm v26-g-stampa" data-act="v26-stampa-giorni" data-v="${toISODate(d)}"><i class="ti ti-printer"></i>Stampa questo giorno</button>
    </div>
    <div class="v26-g-grid"><div class="v26-g-main">
      ${v24OreGiorno(d) || ''}
      ${fissi.length ? `<p class="list-head v26-lh-fisso"><span><i class="ti ti-lock" aria-hidden="true"></i> Non si sposta</span><span class="mono">${fissi.length}</span></p><div class="group">${fissi.map(html).join('')}</div>` : ''}
      ${resto.length ? `<p class="list-head"><span>${fissi.length ? 'La giornata · si può spostare' : 'La giornata'}</span><span class="mono">${resto.length}</span></p><div class="group">${resto.map(html).join('')}</div>` : ''}
      ${vuoto ? vuoto_g(d) : ''}
      ${op.solaLettura ? '' : `<div class="bcol-piu"><button type="button" class="btn btn-ghost btn-sm" data-act="b-ciclo" data-v="${toISODate(d)}"><i class="ti ti-plus"></i>Ciclo</button><button type="button" class="btn btn-ghost btn-sm" data-act="b-evento" data-v="${toISODate(d)}"><i class="ti ti-calendar-plus"></i>Appuntamento</button></div>`}
    </div><aside class="v26-g-lato">
      ${v26BoxObiettivi()}
      ${inSett.length ? `<section class="v26-insett"><b>In settimana</b> · ${inSett.slice(0, 4).map(r => v26Esc(r.c.title)).join(' · ')}${inSett.length > 4 ? ` · e altre ${inSett.length - 4}` : ''}</section>` : ''}
      <button type="button" class="riga-link v26-g-altre" data-act="v26-stampa-scegli"><i class="ti ti-printer"></i><span>Stampa più giorni<small>un foglio per giorno</small></span><span></span><i class="ti ti-chevron-right"></i></button>
    </aside></div>`;
}
function vuoto_g(d) {
  return vuoto('ti-calendar-off', 'Niente in programma', giornoPassato(d) ? 'Questo giorno è passato.' : 'Aggiungi una cosa o un appuntamento, oppure trascina le cose da «Da pianificare» nella vista Settimana.');
}
AZIONI['v26-giorno'] = el => { ui.giorno = +el.dataset.i; render(); };
AZIONI['v26-giorno-sposta'] = el => {
  const n = (ui.giorno || 0) + (+el.dataset.v);
  if (n >= 0 && n <= 6) { ui.giorno = n; render(); return; }
  ui.giorno = n < 0 ? 6 : 0;
  changeWeek(n < 0 ? -1 : 1);
};
const _vistaPianificaV26 = vistaPianifica;
vistaPianifica = function () {
  if (ui.sub) return _vistaPianificaV26.apply(this, arguments);
  if (ui.pian === 'giorno') { try { return v26VistaGiorno(); } catch (e) { console.warn('[v26] Giorno:', e.message); ui.pian = 'settimana'; } }
  let h = _vistaPianificaV26.apply(this, arguments);
  try { h = v26SegConGiorno(h); if (ui.pian === 'settimana') h = v26InserisciObiettivi(h); } catch (e) { console.warn('[v26] Pianifica:', e.message); }
  return h;
};

// --- il foglio di un giorno (PDF, un foglio per giorno) ---
async function v26AssicuraSettimana(d) {
  const w = isoWeekParts(d);
  if (w.week === state.week && w.year === state.year) return;
  state.week = w.week; state.year = w.year;
  try { localStorage.setItem(LS.WEEK, state.week); } catch (_) {}
  await reloadWeekData();
  try { await caricaEventi(state.week, state.year); } catch (_) {}
}
function v26DatiGiorno(idx) {
  const g = GIORNI[idx], d = dataDelGiorno(idx), rs = righeDaFare(g.key);
  const eventi = (gcalEraCollegato() ? eventiDelGiorno(d) : []).filter(e => !e.routine && !eNascosto(e));
  const perOra = (a, b) => String(a.ora || '99').localeCompare(String(b.ora || '99'));
  const coseFisse = rs.filter(r => v26CosaFissa(r.c) && !r.fatto).map(r => ({ tipo: 'cosa', r, ora: r.ora || '' }));
  const evFissi = eventi.filter(v26EventoFisso).map(e => ({ tipo: 'evento', e, ora: e.ora || '' }));
  return {
    d, g, idx,
    fissi: [...evFissi.filter(x => !x.ora), ...[...coseFisse, ...evFissi.filter(x => x.ora)].sort(perOra)],
    cose: rs.filter(r => !(v26CosaFissa(r.c) && !r.fatto)).map(r => ({ tipo: 'cosa', r, ora: r.ora || '' })).sort(perOra),
    appuntamenti: [...eventi.filter(e => !v26EventoFisso(e) && !e.ora), ...eventi.filter(e => !v26EventoFisso(e) && e.ora)].map(e => ({ tipo: 'evento', e, ora: e.ora || '' })),
    inSett: righeDaFare('settimana'),
    vuoto: !rs.length && !eventi.length
  };
}
function v26DisegnaFoglio(doc, dati, n, tot) {
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 12;
  const DX = W - M - 52, LX = M, LW = DX - 6 - M;   // colonna destra: obiettivi e note
  const ROSA = [251, 213, 209], ROSSO = [180, 35, 24], GIALLO = [255, 248, 219], BORDO_G = [240, 220, 140], AZZ = [238, 245, 255], BORDO_A = [158, 195, 245], GRIGIO = [107, 107, 107];
  const giornoTit = fmtGiornoLungo(dati.d).replace(/^./, c => c.toUpperCase());
  const da = getWeekStart(state.week, state.year), a = new Date(da); a.setDate(da.getDate() + 6);
  const ora = new Date(), oraTxt = `${ora.getDate()}/${ora.getMonth() + 1} ${hhmm(ora)}`;
  const T = s => pdfTxt(s);
  let y = 0, pagine = 0;
  const destra = () => {
    // obiettivi
    const voci = v26ObDi(state.week, state.year), rh = 7.2, bh = 10 + rh * V26.MAX_OB;
    doc.setFillColor(...AZZ); doc.setDrawColor(...BORDO_A); doc.setLineWidth(.3); doc.roundedRect(DX, M, W - M - DX, bh, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(30, 58, 138); doc.text(T('Obiettivi della settimana'), DX + 3, M + 6);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(27, 26, 23);
    for (let i = 0; i < V26.MAX_OB; i++) {
      const yy = M + 10 + rh * (i + 1) - 1.6, v = voci[i];
      doc.setDrawColor(...BORDO_A); doc.line(DX + 3, yy + 1.4, W - M - 3, yy + 1.4);
      doc.rect(DX + 3, yy - 2.8, 2.8, 2.8);
      if (v) { if (v.fatto) { doc.setDrawColor(27, 26, 23); doc.line(DX + 3.5, yy - 1.4, DX + 4.4, yy - .4); doc.line(DX + 4.4, yy - .4, DX + 5.6, yy - 2.4); } doc.text(doc.splitTextToSize(T(v.testo), W - M - DX - 11)[0], DX + 7.5, yy); }
    }
    // note a righe
    const ny = M + bh + 8;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(27, 26, 23); doc.text('Note', DX, ny);
    doc.setDrawColor(212, 212, 212); doc.setLineWidth(.2);
    for (let yy = ny + 7; yy < H - M - 10; yy += 7) doc.line(DX, yy, W - M, yy);
    doc.setDrawColor(189, 189, 189); doc.setLineDashPattern([1, 1], 0); doc.line(DX - 3, M, DX - 3, H - M - 8); doc.setLineDashPattern([], 0);
  };
  const piede = () => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...GRIGIO);
    doc.text(T('Sera: spunta qui, poi in Cicli Aperti «Chiudi la giornata» (2 minuti).'), LX, H - M + 2);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(27, 26, 23);
    doc.text(T(`${dati.g.label} ${dati.d.getDate()} · foglio ${n} di ${tot}${pagine > 1 ? ` (segue ${pagine})` : ''}`), W - M, H - M + 2, { align: 'right' });
  };
  const pagina = (segue) => {
    if (pagine) { piede(); doc.addPage(); }
    pagine++;
    destra();
    doc.setTextColor(27, 26, 23); doc.setFont('helvetica', 'bold'); doc.setFontSize(segue ? 13 : 17);
    doc.text(T(segue ? `${giornoTit} (segue)` : giornoTit), LX, M + 5);
    y = M + 5;
    if (!segue) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...GRIGIO);
      doc.text(T(`Battle Plan di ${nomeUtente()} · settimana ${state.week} (${fmtCorta(da)} – ${fmtCorta(a)}) · stampato ${oraTxt}`), LX, y + 5);
      y += 5;
    }
    y += 6;
  };
  const spazio = h => { if (y + h > H - M - 8) pagina(true); };
  const titoloSez = (txt, nota, colore) => {
    spazio(14);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...(colore || [27, 26, 23])); doc.text(T(txt), LX, y + 4);
    if (nota) { doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...GRIGIO); doc.text(T(nota), LX + LW, y + 4, { align: 'right' }); }
    doc.setDrawColor(27, 26, 23); doc.setLineWidth(.4); doc.line(LX, y + 5.6, LX + LW, y + 5.6);
    y += 8;
  };
  const X_ORA = LX + 1.5, X_SEGNO = LX + 25, X_TIT = LX + 30, L_TIT = LX + LW - X_TIT - 1;
  const voce = (x, rosa) => {
    const ev = x.tipo === 'evento', c = ev ? null : x.r.c, fatto = !ev && x.r.fatto;
    const titolo = T(ev ? `${x.e.coach ? 'Coach: ' : ''}${x.e.titolo}` : c.title);
    const sotto = ev ? (x.sovrap ? `si sovrappone a «${x.sovrap}» · ` : '') + (v26EventoFisso(x.e) ? 'non si sposta · ' : '') + (typeof v24ConChi === 'function' && typeof v24ConAltri === 'function' ? (v24ConAltri(x.e) ? v24ConChi(x.e) : 'tempo tuo') : '')
      : [testoMadre(c), c.inderogabile && state.inderoColOk ? 'non si sposta' : computeEffectiveQ(c) === 1 ? 'Subito' : '', (String(c.note || '').split(/\r?\n/).find(s => s.trim() && !/^📧/.test(s)) || '').trim()].filter(Boolean).join(' · ');
    doc.setFont('helvetica', rosa || ev ? 'bold' : 'normal'); doc.setFontSize(9.5);
    const righeT = doc.splitTextToSize(titolo, L_TIT).slice(0, 3);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.8);
    const righeS = sotto ? doc.splitTextToSize(T(sotto), L_TIT).slice(0, 1) : [];
    const h = righeT.length * 4.3 + righeS.length * 3.6 + 2.6;
    spazio(h);
    if (rosa) { doc.setFillColor(...ROSA); doc.rect(LX, y - .4, LW, h, 'F'); }
    // ora o etichetta
    doc.setFont('helvetica', ev ? 'bold' : 'normal'); doc.setFontSize(8.2); doc.setTextColor(...(rosa ? ROSSO : [27, 26, 23]));
    const oraTxt = ev ? (x.e.ora ? `${x.e.ora}${x.e.fine ? '–' + x.e.fine : ''}` : V26.SENZA_ORA) : (x.r.ora || '');
    if (oraTxt) doc.text(T(oraTxt), X_ORA, y + 3.4);
    // segno: quadratino per le cose, cerchio per gli appuntamenti
    doc.setDrawColor(27, 26, 23); doc.setLineWidth(.35); doc.setFillColor(255, 255, 255);
    if (ev) doc.circle(X_SEGNO + 1.5, y + 2.2, 1.5, 'FD'); else doc.rect(X_SEGNO, y + .7, 3, 3, 'FD');
    if (fatto) { doc.line(X_SEGNO + .5, y + 2.2, X_SEGNO + 1.3, y + 3.2); doc.line(X_SEGNO + 1.3, y + 3.2, X_SEGNO + 2.6, y + 1.1); }
    doc.setFont('helvetica', rosa || ev ? 'bold' : 'normal'); doc.setFontSize(9.5); doc.setTextColor(27, 26, 23);
    righeT.forEach((t, i) => doc.text(t, X_TIT, y + 3.4 + i * 4.3));
    if (righeS.length) { doc.setFont('helvetica', 'normal'); doc.setFontSize(7.8); doc.setTextColor(...(rosa ? [92, 42, 38] : x.sovrap ? ROSSO : GRIGIO)); doc.text(righeS[0], X_TIT, y + 3.4 + righeT.length * 4.3 - .6); }
    if (!rosa) { doc.setDrawColor(229, 229, 229); doc.setLineWidth(.2); doc.line(LX, y + h - .4, LX + LW, y + h - .4); }
    y += h + (rosa ? .5 : 0);
  };

  pagina(false);
  // in settimana (giallo)
  if (dati.inSett.length) {
    const testi = dati.inSett.slice(0, 5).map(r => T(r.c.title)), altre = dati.inSett.length - testi.length;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    const righe = testi.flatMap(t => doc.splitTextToSize(t, LW - 12).slice(0, 1));
    const h = 8 + righe.length * 4.4 + (altre > 0 ? 4.4 : 0);
    doc.setFillColor(...GIALLO); doc.setDrawColor(...BORDO_G); doc.setLineWidth(.3); doc.roundedRect(LX, y, LW, h, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(27, 26, 23); doc.text(T('In settimana · pensaci dopo'), LX + 3, y + 5);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    righe.forEach((t, i) => { doc.setDrawColor(27, 26, 23); doc.rect(LX + 3, y + 7.2 + i * 4.4, 2.6, 2.6); doc.text(t, LX + 8, y + 9.4 + i * 4.4); });
    if (altre > 0) { doc.setTextColor(...GRIGIO); doc.text(T(`e altre ${altre}`), LX + 8, y + 9.4 + righe.length * 4.4); }
    y += h + 5;
  }
  if (dati.vuoto) {
    spazio(12);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(...ROSSO);
    const dp = daPianificarePdf({ voci: [] });
    doc.splitTextToSize(T(dp.length ? 'Nessuna attività pianificata per questo giorno: scegli qui sotto cosa fare.' : 'Nessuna attività pianificata per questo giorno.'), LW).forEach(t => { doc.text(t, LX, y + 4); y += 5; });
    y += 3;
    if (dp.length) { titoloSez('Da pianificare (Subito e rimaste indietro)'); dp.forEach(x => voce({ tipo: 'cosa', r: x.r }, false)); y += 4; }
  }
  if (dati.fissi.length) { titoloSez('Non si sposta', 'in rosso: non si sposta', ROSSO); dati.fissi.forEach(x => voce(x, true)); y += 5; }
  if (dati.cose.length) { titoloSez('Da fare'); dati.cose.forEach(x => voce(x, false)); y += 5; }
  // v35 · appuntamenti ora per ora: le ore libere restano righe vuote per scriverci quello che entra
  {
    const conOra = dati.appuntamenti.filter(x => x.e.ora && !eGiornata(x.e)), senza = dati.appuntamenti.filter(x => !x.e.ora || eGiornata(x.e));
    const ini = x => minDi(x.e.ora), fin = x => x.e.fine && minDi(x.e.fine) > ini(x) ? minDi(x.e.fine) : ini(x) + (x.e.minuti || 60);
    const tutti = [...conOra, ...dati.fissi.filter(x => x.tipo === 'evento' && x.e.ora && !eGiornata(x.e))];
    conOra.forEach(x => { const o = tutti.find(z => z !== x && z.e.id !== x.e.id && ini(z) < fin(x) && ini(x) < fin(z)); if (o) x.sovrap = o.e.titolo; });
    const altrove = [...dati.fissi, ...dati.cose].map(x => x.tipo === 'evento'
        ? (x.e.ora && !eGiornata(x.e) ? { a: minDi(x.e.ora), b: x.e.fine && minDi(x.e.fine) > minDi(x.e.ora) ? minDi(x.e.fine) : minDi(x.e.ora) + (x.e.minuti || 60), ora: x.e.ora, t: x.e.titolo } : null)
        : (x.r.ora && !x.r.fatto ? { a: minDi(x.r.ora), b: minDi(x.r.ora) + (x.r.durata || BP_DURATA_DEFAULT), ora: x.r.ora, t: x.r.c.title } : null)).filter(Boolean);
    titoloSez('Appuntamenti, ora per ora', 'nelle ore vuote scrivi quello che entra');
    senza.forEach(x => voce(x, false));
    const h0 = Math.min(8, ...conOra.map(x => Math.floor(ini(x) / 60))), h1 = Math.max(19, ...conOra.map(x => Math.ceil(fin(x) / 60)));
    for (let h = h0; h < h1; h++) {
      const qui = conOra.filter(x => Math.floor(ini(x) / 60) === h);
      if (qui.length) { qui.forEach(x => voce(x, false)); y += 1.5; continue; }
      const incorso = conOra.find(x => ini(x) < h * 60 && fin(x) >= (h + 1) * 60);
      // le cose a un'ora precisa e gli appuntamenti che non si spostano sono stampati sopra: qui solo un richiamo, così l'ora non sembra libera
      const sopra = altrove.filter(z => Math.floor(z.a / 60) === h || (z.a < h * 60 && z.b >= (h + 1) * 60));
      const testo = incorso ? `in corso: ${incorso.e.titolo} (fino alle ${incorso.e.fine || ''})` : sopra.length ? sopra.map(z => `${z.ora} ${z.t}`).join(' · ') + ' (sopra)' : '';
      const alto = testo ? 5.5 : 8.5;
      spazio(alto);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.2); doc.setTextColor(...GRIGIO);
      doc.text(`${String(h).padStart(2, '0')}:00`, X_ORA, y + 3.4);
      if (testo) { doc.setFontSize(7.6); doc.text(doc.splitTextToSize(T(testo), L_TIT)[0], X_TIT, y + 3.4); }
      doc.setDrawColor(229, 229, 229); doc.setLineWidth(.2); doc.line(LX, y + alto - .4, LX + LW, y + alto - .4);
      y += alto;
    }
    y += 5;
  }
  // arrivate oggi: righe vuote
  spazio(34);
  titoloSez('Arrivate oggi', 'scrivile qui, stasera le metti nell\'app');
  doc.setDrawColor(212, 212, 212); doc.setLineWidth(.2);
  const fine = Math.min(y + 7 * 5, H - M - 8);
  for (let yy = y + 6; yy <= fine; yy += 7) doc.line(LX, yy, LX + LW, yy);
  piede();
}
// stampa una lista di date (Date): un foglio per giorno
async function v26Stampa(date, opz = {}) {
  const jsPDFCtor = window.jspdf && window.jspdf.jsPDF;
  if (!jsPDFCtor) { showToast('Libreria PDF non caricata, riprova', 'error'); return null; }
  const doc = new jsPDFCtor({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  let vuoti = 0;
  for (let i = 0; i < date.length; i++) {
    await v26AssicuraSettimana(date[i]);
    const dati = v26DatiGiorno(giornoIdxDi(date[i]));
    if (dati.vuoto) vuoti++;
    if (i) doc.addPage();
    v26DisegnaFoglio(doc, dati, i + 1, date.length);
  }
  render();
  const iso = toISODate(date[0]), nome = date.length > 1 ? `giornate-${iso}_${toISODate(date[date.length - 1])}.pdf` : `giornata-${iso}.pdf`;
  window.__v26UltimaStampa = { nome, giorni: date.length, pagine: doc.getNumberOfPages(), vuoti, doc };
  if (opz.soloDoc) return { doc, nome };
  const msg = vuoti === date.length ? (date.length > 1 ? 'Nessuna attività pianificata in questi giorni: nel foglio trovi cosa pianificare' : 'Nessuna attività pianificata per questo giorno: nel foglio trovi cosa pianificare')
    : `${date.length > 1 ? `${date.length} fogli, uno per giorno` : 'Foglio del giorno'} pronto per la stampa${vuoti ? ` · ${vuoti} ${vuoti === 1 ? 'giorno vuoto' : 'giorni vuoti'}` : ''}`;
  try {
    const url = URL.createObjectURL(doc.output('blob'));
    const win = window.open(url, '_blank');
    if (!win) doc.save(nome);
    showToast(msg, vuoti === date.length ? 'warn' : 'success');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (e) { doc.save(nome); showToast(msg, 'info'); }
  return { doc, nome };
}
// il tasto stampante di Oggi e dei giorni: il foglio nuovo
async function stampaGiorno(idx, daOggi) {
  const d = daOggi ? oggiData() : dataDelGiorno(idx);
  return v26Stampa([new Date(d.getFullYear(), d.getMonth(), d.getDate())]);
}
AZIONI['v26-stampa-giorni'] = el => { const d = parseISODate(el.dataset.v); if (d) v26Stampa([d]); };
// la scelta: solo un giorno, da oggi a domenica, tutta la settimana (+ il riepilogo per il coach)
function v26OverlayStampa() {
  let ov = $('v26stOverlay');
  if (ov) return ov;
  document.body.insertAdjacentHTML('beforeend', `<div class="modal-overlay" id="v26stOverlay" onclick="closeModalOnBg(event,'v26stOverlay')">
    <div class="modal sheet sheet-narrow" role="dialog" aria-modal="true" aria-labelledby="v26st-titolo"><div class="sheet-grab"></div>
      <div class="sheet-head"><h3 class="t-title" id="v26st-titolo">Stampa</h3></div>
      <p class="t-caption muted">Ogni giorno è un foglio A4 a sé: con quello che non si sposta, la giornata, gli obiettivi e le note.</p>
      <div id="v26st-scelte" class="v26-st-scelte" role="radiogroup" aria-label="Cosa stampare"></div>
      <div class="sheet-cta sheet-cta-row"><button type="button" class="btn btn-ghost" onclick="closeModal('v26stOverlay')">Annulla</button><button type="button" class="btn btn-primary" data-act="v26-stampa-ok"><i class="ti ti-printer"></i>Stampa</button></div>
    </div></div>`);
  return $('v26stOverlay');
}
function v26ScelteStampa() {
  const corrente = eSettimanaCorrente(), oi = corrente ? giornoIdxDi(oggiData()) : 0, gi = ui.pian === 'giorno' ? (ui.giorno || 0) : oi;
  const g = i => `${GIORNI[i].label.toLowerCase()} ${dataDelGiorno(i).getDate()}`;
  const s = [{ v: 'uno', l: `Solo ${g(gi)}`, n: 1, giorni: [gi] }];
  if (corrente && oi > 0) s.push({ v: 'da-oggi', l: 'Da oggi a domenica', n: 7 - oi, giorni: Array.from({ length: 7 - oi }, (_, i) => oi + i) });
  s.push({ v: 'tutta', l: 'Tutta la settimana', n: 7, giorni: [0, 1, 2, 3, 4, 5, 6] });
  s.push({ v: 'feriali', l: 'Da lunedì a venerdì', n: 5, giorni: [0, 1, 2, 3, 4] });
  return s;
}
AZIONI['v26-stampa-scegli'] = () => {
  const ov = v26OverlayStampa(), s = v26ScelteStampa();
  ui.v26St = ui.v26St && s.some(x => x.v === ui.v26St) ? ui.v26St : s[0].v;
  $('v26st-scelte').innerHTML = s.map(x => `<button type="button" class="riga-link" role="radio" aria-checked="${x.v === ui.v26St}" data-act="v26-stampa-v" data-v="${x.v}"><i class="ti ${x.v === ui.v26St ? 'ti-circle-dot' : 'ti-circle'}"></i><span>${x.l}<small>${x.n} ${x.n === 1 ? 'foglio' : 'fogli, uno per giorno'}</small></span><span></span><span></span></button>`).join('')
    + `<button type="button" class="riga-link" data-act="v26-stampa-coach"><i class="ti ti-file-text"></i><span>Il riepilogo della settimana<small>1 foglio, quello che mandi a Leo</small></span><span></span><i class="ti ti-chevron-right"></i></button>`;
  ov.classList.add('open');
};
AZIONI['v26-stampa-v'] = el => { ui.v26St = el.dataset.v; AZIONI['v26-stampa-scegli'](); };
AZIONI['v26-stampa-ok'] = () => {
  const x = v26ScelteStampa().find(s => s.v === ui.v26St) || v26ScelteStampa()[0];
  closeModal('v26stOverlay');
  v26Stampa(x.giorni.map(i => { const d = dataDelGiorno(i); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }));
};
AZIONI['v26-stampa-coach'] = () => { closeModal('v26stOverlay'); bpStampaPdf(); };
AZIONI.pdf = () => AZIONI['v26-stampa-scegli']();

// --- Oggi: «Adesso tocca a…» in una riga, «Prima di iniziare», la sera «Chiudi la giornata» ---
const _v25MomentoV26 = v25Momento;
v25Momento = function () {
  const m = _v25MomentoV26.apply(this, arguments);
  if (m.k === 'mattina') return { ...m, t: 'Prima di iniziare · 10 minuti', s: 'Guarda «Da rispondere» e la giornata, poi stampa il foglio e lavora sulla carta.' };
  if (m.k === 'sera') return { ...m, s: 'Spunta quello che hai fatto, decidi cosa fare di quello che resta e metti dentro le cose nuove.', act: 'v26-chiudi-giornata', btn: 'Chiudi la giornata' };
  return m;
};
const v26RitmoAcceso = () => lsLeggi(V26.RITMO_OFF) !== '1';
AZIONI['v26-ritmo-apri'] = () => { ui.v26RitmoAperto = !ui.v26RitmoAperto; render(); };
AZIONI['v26-ritmo-onoff'] = () => { const ora = v26RitmoAcceso(); try { localStorage.setItem(V26.RITMO_OFF, ora ? '1' : '0'); } catch (_) {} render(); showToast(ora ? '«Adesso tocca a…» non si vede più in Oggi' : '«Adesso tocca a…» torna in Oggi', 'success'); };

// «Chiudi la giornata»
function v26OverlayChiudi() {
  let ov = $('v26cgOverlay');
  if (ov) return ov;
  document.body.insertAdjacentHTML('beforeend', `<div class="modal-overlay" id="v26cgOverlay" onclick="closeModalOnBg(event,'v26cgOverlay')">
    <div class="modal sheet" role="dialog" aria-modal="true" aria-labelledby="v26cg-titolo"><div class="sheet-grab"></div>
      <div class="sheet-head"><h3 class="t-title" id="v26cg-titolo">Chiudi la giornata</h3><button type="button" class="btn btn-icon" onclick="closeModal('v26cgOverlay')" aria-label="Chiudi"><i class="ti ti-x"></i></button></div>
      <div id="v26cg-corpo"></div>
      <div class="sheet-cta"><button type="button" class="btn btn-primary" data-act="v26-cg-fine" style="width:100%"><i class="ti ti-printer"></i>Fatto · stampa il foglio di domani</button></div>
    </div></div>`);
  return $('v26cgOverlay');
}
function v26DisegnaChiudi() {
  const oggi = oggiData(), righe = eSettimanaCorrente() ? righeGiorno(giornoKeyDi(oggi)) : [];
  const ordina = (a, b) => (b.fatto ? -1 : 0) - (a.fatto ? -1 : 0) || (v26CosaFissa(b.c) ? 1 : 0) - (v26CosaFissa(a.c) ? 1 : 0);
  const lista = [...righe].sort(ordina);
  const voce = r => {
    const c = r.c, rosso = !r.fatto && v26CosaFissa(c);
    return `<div class="v26-cg-voce${rosso ? ' rosso' : ''}${r.fatto ? ' fatto' : ''}">
      <button type="button" class="v26-cg-spunta" data-act="v26-cg-fatta" data-id="${c.id}" aria-pressed="${!!r.fatto}" aria-label="${r.fatto ? 'Fatta' : 'Segna fatta'}: ${esc(c.title)}"><span class="v26-ob-check" aria-hidden="true">${r.fatto ? '<i class="ti ti-check"></i>' : ''}</span><span class="v26-cg-tit">${escHtml(c.title)}</span></button>
      ${r.fatto ? '' : `<div class="v26-cg-azioni" role="group" aria-label="Non fatta: cosa ne faccio"><button type="button" class="btn btn-secondary btn-sm" data-act="v26-cg-domani" data-id="${c.id}">Domani</button><button type="button" class="btn btn-ghost btn-sm" data-act="v26-cg-quando" data-id="${c.id}">Scegli giorno</button><button type="button" class="btn btn-ghost btn-sm" data-act="v26-cg-lascia" data-id="${c.id}">Lascia stare</button></div>`}</div>`;
  };
  const fatte = righe.filter(r => r.fatto).length;
  $('v26cg-corpo').innerHTML = `<p class="t-caption muted">${fmtGiornoLungo(oggi)} · <b class="mono">${fatte}</b> di <b class="mono">${righe.length}</b> fatte</p>
    <p class="list-head"><span>1 · Spunta quello che hai fatto sul foglio</span></p>
    ${lista.length ? `<div class="v26-cg-lista">${lista.map(voce).join('')}</div>` : '<p class="t-caption muted">Oggi non c\'erano cose in programma.</p>'}
    <p class="list-head"><span>2 · Cosa è arrivato oggi?</span></p>
    <button type="button" class="riga-link" data-act="v26-cg-nuove"><i class="ti ti-plus"></i><span>Aggiungi le cose arrivate oggi<small>dalle righe «Arrivate oggi» del foglio: scrivile o dettale</small></span><span></span><i class="ti ti-chevron-right"></i></button>
    ${v26ObDi(state.week, state.year).length ? `<div class="v26-cg-ob">${v26BoxObiettivi()}</div>` : ''}`;
}
AZIONI['v26-chiudi-giornata'] = async () => {
  if (!eSettimanaCorrente()) { const c = bpSettimanaCorrente(); state.week = c.week; state.year = c.year; try { localStorage.setItem(LS.WEEK, state.week); } catch (_) {} await reloadWeekData(); }
  v26OverlayChiudi(); v26DisegnaChiudi(); $('v26cgOverlay').classList.add('open');
};
const v26CgDopo = () => setTimeout(() => { if ($('v26cgOverlay') && $('v26cgOverlay').classList.contains('open')) v26DisegnaChiudi(); }, 350);
AZIONI['v26-cg-fatta'] = async el => { await azioneFatto(el.dataset.id); v26CgDopo(); };
AZIONI['v26-cg-domani'] = async el => { await azioneDomani(el.dataset.id, toISODate(oggiData())); v26CgDopo(); };
AZIONI['v26-cg-quando'] = el => { closeModal('v26cgOverlay'); azioneQuando(el.dataset.id); };
AZIONI['v26-cg-lascia'] = async el => { await azioneLascia(el.dataset.id); v26CgDopo(); };
AZIONI['v26-cg-nuove'] = () => { closeModal('v26cgOverlay'); apriRapido(); };
AZIONI['v26-cg-fine'] = async () => {
  closeModal('v26cgOverlay');
  const d = oggiData(), domani = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  await v26Stampa([domani]);
};

// --- Impostazioni: «Togli» su persone e aree, l'interruttore di «Adesso tocca a…», via «Assegna l'area con Claude» ---
function v26OverlayScegli() {
  let ov = $('v26scOverlay');
  if (ov) return ov;
  document.body.insertAdjacentHTML('beforeend', `<div class="modal-overlay" id="v26scOverlay" onclick="closeModalOnBg(event,'v26scOverlay')">
    <div class="modal sheet sheet-narrow" role="alertdialog" aria-modal="true" aria-labelledby="v26sc-titolo" aria-describedby="v26sc-testo"><div class="sheet-grab"></div>
      <div class="sheet-head"><h3 class="t-title" id="v26sc-titolo"></h3></div>
      <p class="t-label" id="v26sc-testo"></p>
      <div class="chips chips-wrap" id="v26sc-scelte" role="radiogroup"></div>
      <div class="sheet-cta sheet-cta-row"><button type="button" class="btn btn-ghost" onclick="closeModal('v26scOverlay')">Annulla</button><button type="button" class="btn btn-danger" data-act="v26-sc-ok" id="v26sc-ok"></button></div>
    </div></div>`);
  return $('v26scOverlay');
}
function v26Scegli({ titolo, testo, scelte, ok, poi }) {
  const ov = v26OverlayScegli();
  ui.v26Sc = { scelta: scelte && scelte.length ? scelte[0].v : null, poi, scelte };
  $('v26sc-titolo').textContent = titolo;
  $('v26sc-testo').textContent = testo;
  $('v26sc-ok').textContent = ok;
  v26DisegnaScelte();
  ov.classList.add('open');
}
function v26DisegnaScelte() {
  const s = ui.v26Sc || {};
  $('v26sc-scelte').innerHTML = (s.scelte || []).map(x => `<button type="button" class="chip" role="radio" data-act="v26-sc-v" data-v="${esc(x.v)}" aria-checked="${x.v === s.scelta}" aria-pressed="${x.v === s.scelta}">${escHtml(x.l)}</button>`).join('');
  $('v26sc-scelte').hidden = !(s.scelte || []).length;
}
AZIONI['v26-sc-v'] = el => { if (ui.v26Sc) { ui.v26Sc.scelta = el.dataset.v; v26DisegnaScelte(); } };
AZIONI['v26-sc-ok'] = async () => { const s = ui.v26Sc; closeModal('v26scOverlay'); ui.v26Sc = null; if (s && s.poi) await s.poi(s.scelta); };

AZIONI['v26-persona-togli'] = el => {
  const p = (state.persone || []).find(x => String(x.id) === el.dataset.id);
  if (!p) return;
  const deleghe = state.cicli.filter(c => !c.done && String(c.delega_persona_id || '') === String(p.id));
  const altre = state.persone.filter(x => x.id !== p.id);
  v26Scegli({
    titolo: `Togli ${p.nome}?`,
    testo: deleghe.length ? (deleghe.length === 1 ? 'Ha 1 cosa delegata ancora aperta: a chi la passo?' : `Ha ${deleghe.length} cose delegate ancora aperte: a chi le passo?`) : 'Non ha cose delegate aperte. Le cose già chiuse restano come sono.',
    scelte: deleghe.length ? [{ v: '', l: 'A nessuno: restano da delegare' }, ...altre.map(x => ({ v: String(x.id), l: x.nome }))] : null,
    ok: 'Togli',
    poi: async scelta => {
      try {
        for (const c of deleghe) await patchCiclo(c.id, { delega_persona_id: scelta || null });
        const { error } = await db.from('persone').delete().eq('id', p.id);
        if (error) throw error;
        state.persone = state.persone.filter(x => x.id !== p.id);
        render();
        showToast(`${p.nome} tolta${deleghe.length ? scelta ? ` · deleghe passate a ${(altre.find(x => String(x.id) === scelta) || {}).nome}` : ' · deleghe senza persona' : ''}`, 'success');
      } catch (e) { showToast('Non riesco a toglierla: ' + e.message, 'error'); }
    }
  });
};
AZIONI['v26-area-togli'] = el => {
  const a = aree().find(x => String(x.id) === el.dataset.id);
  if (!a) return;
  const dentro = state.cicli.filter(c => isAttivo(c) && areaDi(c) === a.nome);
  const altre = aree().filter(x => x.nome !== a.nome);
  v26Scegli({
    titolo: `Togli l'area «${a.nome}»?`,
    testo: dentro.length ? (dentro.length === 1 ? 'Dentro c\'è 1 cosa aperta: dove la sposto?' : `Dentro ci sono ${dentro.length} cose aperte: dove le sposto?`) : 'È vuota: nessuna cosa da spostare.',
    scelte: dentro.length ? [{ v: '', l: 'Da smistare' }, ...altre.map(x => ({ v: x.nome, l: x.nome }))] : null,
    ok: 'Togli',
    poi: async scelta => {
      try {
        for (const c of dentro) await patchCiclo(c.id, { macro_area: scelta || null });
        const { error } = await db.from('macro_aree').delete().eq('id', a.id);
        if (error) throw error;
        state.areeDb = (state.areeDb || []).filter(x => x.id !== a.id);
        render();
        showToast(`Area «${a.nome}» tolta${dentro.length ? ` · ${dentro.length} ${dentro.length === 1 ? 'cosa spostata' : 'cose spostate'} in «${scelta || 'Da smistare'}»` : ''}`, 'success');
      } catch (e) { showToast('Non riesco a toglierla: ' + e.message, 'error'); }
    }
  });
};
const _vistaImpostazioniV26 = vistaImpostazioni;
vistaImpostazioni = function () {
  const h = _vistaImpostazioniV26.apply(this, arguments);
  try {
    const t = v21Tpl(h), f = t.content;
    // via «Assegna l'area con Claude»: la sezione la propone già l'app
    const ass = f.querySelector('[data-act="aree-assegna"]'); if (ass) ass.remove();
    // persone: Togli
    const lhP = [...f.querySelectorAll('.list-head')].find(x => /^Persone/.test(x.textContent.trim()));
    const grpP = lhP && lhP.nextElementSibling;
    if (grpP) [...grpP.querySelectorAll('.riga-link')].filter(r => r.querySelector('.avatar')).forEach((r, i) => {
      const p = state.persone[i]; if (!p) return;
      r.style.gridTemplateColumns = '24px 1fr auto auto';
      r.insertAdjacentHTML('beforeend', `<button type="button" class="btn btn-icon" data-act="v26-persona-togli" data-id="${esc(String(p.id))}" aria-label="Togli ${esc(p.nome)}"><i class="ti ti-trash"></i></button>`);
    });
    // aree: Togli
    const ar = aree();
    [...f.querySelectorAll('.aree-lista .area-riga')].forEach((r, i) => {
      const a = ar[i], h2 = r.querySelector('.area-h'); if (!a || !h2) return;
      h2.insertAdjacentHTML('beforeend', `<button type="button" class="btn btn-icon v26-area-togli" data-act="v26-area-togli" data-id="${esc(String(a.id))}" aria-label="Togli l'area ${esc(a.nome)}"><i class="ti ti-trash"></i></button>`);
    });
    // Oggi: l'interruttore di «Adesso tocca a…»
    const acceso = v26RitmoAcceso();
    const blocco = `<p class="list-head"><span>Oggi</span></p><div class="group"><button type="button" class="riga-link" data-act="v26-ritmo-onoff" role="switch" aria-checked="${acceso}"><i class="ti ti-clock-hour-4"></i><span>«Adesso tocca a…»<small>la riga in cima a Oggi che dice cosa fare a quell'ora</small></span><span class="mono">${acceso ? 'Sì' : 'No'}</span><i class="ti ti-chevron-right"></i></button></div>`;
    const lhCal = [...f.querySelectorAll('.list-head')].find(x => /Google Calendar/.test(x.textContent));
    if (lhCal) lhCal.insertAdjacentHTML('beforebegin', blocco); else f.appendChild(v21Tpl(blocco).content);
    return t.innerHTML;
  } catch (e) { console.warn('[v26] Impostazioni:', e.message); return h; }
};

// --- caricamento ---
const _caricaEventiNascostiV26 = caricaEventiNascosti;
caricaEventiNascosti = async function () {
  const r = await _caricaEventiNascostiV26.apply(this, arguments);
  v26CaricaFissi().catch(err => console.warn('[v26] fissi:', err.message));
  v26CaricaObiettivi().catch(err => console.warn('[v26] obiettivi:', err.message));
  return r;
};

// ══════════════════════════════════════════════════════════════
