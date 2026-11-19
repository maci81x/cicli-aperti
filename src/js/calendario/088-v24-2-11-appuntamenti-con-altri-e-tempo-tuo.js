// v24 · 2/11 · APPUNTAMENTI CON ALTRI E TEMPO TUO (disegno 8 del canvas «versione snella»)
// · ogni evento del calendario è «con altri» (invitati, Meet/Teams, sala, invito ricevuto, coach) o «tempo tuo»;
//   Roby può correggere dal foglio dell'appuntamento (tabella eventi_tipo, chiave = id o serie:<id>)
// · il promemoria «Da rispondere (N)» del giro della posta non si vede nell'app (c'è già la riga rossa in Oggi)
// · ore del giorno divise: «4h con altri · 1h tue»; spazi liberi grigi; legenda con le due voci
// · «Correggi il titolo» quando l'ora nel titolo non è quella dell'evento (PATCH su Google, solo quella volta)
// · Da pianificare: Subito tutte, poi poche Importanti e «Altre N»
// ══════════════════════════════════════════════════════════════
const V24 = { TABELLA: 'eventi_tipo', LS: 'eventi_tipo' };
state.evtTipo = new Map((() => { try { const v = JSON.parse(localStorage.getItem(V24.LS) || '[]'); return Array.isArray(v) ? v : []; } catch (_) { return []; } })());
state.evtTipoDb = false;
const v24SalvaLocali = () => { try { localStorage.setItem(V24.LS, JSON.stringify([...state.evtTipo])); } catch (_) { /* niente */ } };
async function caricaEventiTipo() {
  const { data, error } = await db.from(V24.TABELLA).select('chiave,tipo');
  if (error) { state.evtTipoDb = false; return; }
  state.evtTipoDb = true;
  state.evtTipo = new Map((data || []).map(r => [r.chiave, r.tipo]));
  v24SalvaLocali();
  render();
}
const _caricaEventiNascostiV24 = caricaEventiNascosti;
caricaEventiNascosti = async function () {
  const r = await _caricaEventiNascostiV24.apply(this, arguments);
  caricaEventiTipo().catch(err => console.warn('[v24] tipi:', err.message));
  return r;
};
const V24_PROMEMORIA = /^\s*\d{1,2}(?:[.:]\d{2})?\s*[-–]\s*Da rispondere\s*\(\d+\)/i;
const _eventoDaV24 = eventoDa;
eventoDa = function (raw, cal) {
  const e = _eventoDaV24(raw, cal);
  if (!e || !raw) return e;
  const descr = String(raw.description || '');
  if (V24_PROMEMORIA.test(raw.summary || '') && /Cicli Aperti · posta/.test(descr)) return null;   // il promemoria della posta: solo su Google
  e.luogo = String(raw.location || '').trim();
  e.call = !!(raw.hangoutLink || (raw.conferenceData && (raw.conferenceData.entryPoints || raw.conferenceData.conferenceSolution || raw.conferenceData.conferenceId)))
    || /meet\.google\.com|teams\.microsoft\.com|zoom\.us|webex\.com/i.test(descr) || /\b(teams|meet|zoom|webex|videochiamata|videocall)\b/i.test(e.luogo);
  e.comeCall = /teams/i.test(JSON.stringify(raw.conferenceData || '') + e.luogo + descr.slice(0, 400)) ? 'Teams' : /zoom/i.test(e.luogo + descr.slice(0, 400)) ? 'Zoom' : 'Meet';
  e.sala = (raw.attendees || []).some(x => x.resource);
  e.conAltriAuto = e.invitati > 0 || e.call || e.sala || !!e.coach || !e.orgIo;
  return e;
};
function tipoEvento(e) {
  if (!e) return 'mio';
  for (const k of chiaviEvento(e)) if (state.evtTipo.has(k)) return state.evtTipo.get(k);
  return e.conAltriAuto ? 'altri' : 'mio';
}
const v24ConAltri = e => tipoEvento(e) === 'altri';
const v24SceltoAMano = e => !!e && chiaviEvento(e).some(k => state.evtTipo.has(k));
const v24Nome = s => { const t = String(s || '').trim(); if (!t.includes('@')) return t; const l = t.split('@')[0].split(/[._]/).filter(Boolean); return l.map((p, i) => i === 0 && p.length === 1 ? p.toUpperCase() + '.' : p.charAt(0).toUpperCase() + p.slice(1)).join(' '); };
function v24ConChi(e) {
  const nomi = (e.nomiInvitati || []).map(v24Nome).filter(Boolean);
  const chi = nomi.length > 2 ? `${nomi.slice(0, 2).join(', ')} e altri ${nomi.length - 2}` : nomi.join(' e ');
  const come = e.call ? e.comeCall : e.sala ? (e.luogo || 'in sala') : e.luogo ? e.luogo.slice(0, 40) : '';
  const parti = [chi ? 'con ' + chi : (!e.orgIo && e.org ? 'invito di ' + v24Nome(e.org) : ''), come].filter(Boolean);
  return parti.join(' · ') || 'con altre persone';
}
const _rigaEventoV24 = rigaEvento;
rigaEvento = function (e) {
  let h = _rigaEventoV24.apply(this, arguments);
  try {
    if (!e || e.routine || eFiglie(e) || !/class="evt-riga[^"]*evt-app/.test(h)) return h;
    const altri = v24ConAltri(e), mano = v24SceltoAMano(e);
    h = h.replace(/class="evt-riga /, `class="evt-riga ${altri ? 'v24-altri' : 'v24-mio'} `);
    const sotto = altri
      ? `<span class="evt-nota v24-chi"><i class="ti ti-users"></i><span>${escHtml(v24ConChi(e))}${mano ? ' · segnato da te' : ''}</span></span>`
      : `<span class="evt-nota v24-chi"><i class="ti ti-user"></i><span>tempo tuo${mano ? ' · segnato da te' : ''}</span></span>`;
    const i = h.lastIndexOf('</span></div>');
    if (i >= 0) h = h.slice(0, i) + sotto + h.slice(i);
    if (e.orarioDiverso && e.orgIo && e.ora) h = h.replace(/(<span class="evt-nota evt-diverso"[\s\S]*?<\/span><\/span>)/, `$1<button type="button" class="v24-correggi" data-act="v24-correggi" data-evt="${esc(e.id)}" aria-label="Correggi il titolo: metti ${esc(e.ora)} davanti a ${esc(e.titolo)}"><i class="ti ti-pencil"></i>Correggi</button>`);
  } catch (err) { console.warn('[v24] riga:', err.message); }
  return h;
};
// «8.45 - Allineamento samu/roby»: ora senza zero davanti, minuti col punto solo se non sono :00
function v24TitoloConOra(e) { const [h, m] = String(e.ora).split(':'); return `${+h}${m && m !== '00' ? '.' + m : ''} - ${e.titolo}`; }
AZIONI['v24-correggi'] = async el => {
  const e = eventoPerId(el.dataset.evt);
  if (!e || !e.ora) return;
  const nuovo = v24TitoloConOra(e), vecchio = e.titoloOrig;
  el.disabled = true;
  try {
    const percorso = `/calendars/${encodeURIComponent(e.calId)}/events/${encodeURIComponent(e.id)}`;
    await gcalFetchUtente(percorso, 'PATCH', { summary: nuovo });
    Object.assign(e, { titoloOrig: nuovo, oraTitolo: e.ora, orarioDiverso: false });
    render();
    showToast(`Titolo corretto: «${nuovo}»${e.ricorrente ? ' (solo questa volta)' : ''}`, 'success', { annulla: async () => {
      await gcalFetchUtente(percorso, 'PATCH', { summary: vecchio });
      Object.assign(e, { titoloOrig: vecchio, oraTitolo: prefissoOrario(vecchio).ora, orarioDiverso: true });
      render();
    } });
  } catch (err) { el.disabled = false; showToast('Non riesco a correggere il titolo: ' + err.message, 'error'); }
};
// il foglio dell'appuntamento: «È con altre persone» / «È tempo mio» (vale per tutta la serie)
const _disegnaFoglioEventoV24 = disegnaFoglioEvento;
disegnaFoglioEvento = function (id) {
  _disegnaFoglioEventoV24(id);
  const e = eventoPerId(id), corpo = $('evt-corpo');
  if (!e || !corpo || e.routine || eFiglie(e)) return;
  const altri = v24ConAltri(e), mano = v24SceltoAMano(e);
  const serie = e.serie ? 'vale anche per le prossime volte' : '';
  const riga = (act, ico, testo, sotto, v) => `<button type="button" class="riga-link" data-act="${act}" data-evt="${esc(e.id)}" data-v="${v}"><i class="ti ${ico}"></i><span>${testo}${sotto ? `<small>${sotto}</small>` : ''}</span><span></span><i class="ti ti-chevron-right"></i></button>`;
  const stato = altri ? `<i class="ti ti-users"></i> ${escHtml(v24ConChi(e))}` : '<i class="ti ti-user"></i> tempo tuo';
  const blocco = `<p class="list-head"><span>Nella settimana</span><span class="mono">${mano ? 'segnato da te' : 'automatico'}</span></p><div class="group">
    <div class="riga-link" style="cursor:default"><span>${stato}</span></div>
    ${altri ? riga('v24-tipo', 'ti-user', 'È tempo mio', serie, 'mio') : riga('v24-tipo', 'ti-users', 'È con altre persone', serie, 'altri')}
    ${mano ? riga('v24-tipo', 'ti-wand', 'Decidi tu', 'torna automatico', '') : ''}</div>`;
  const dove = corpo.querySelector('p.list-head');
  if (dove) dove.insertAdjacentHTML('beforebegin', blocco); else corpo.insertAdjacentHTML('beforeend', blocco);
};
AZIONI['v24-tipo'] = async el => {
  const e = eventoPerId(el.dataset.evt);
  if (!e) return;
  const chiave = e.serie ? 'serie:' + e.serie : e.id, tipo = el.dataset.v || '';
  const prima = chiaviEvento(e).map(k => [k, state.evtTipo.get(k)]);
  chiaviEvento(e).forEach(k => state.evtTipo.delete(k));
  if (tipo) state.evtTipo.set(chiave, tipo);
  v24SalvaLocali();
  render();
  if ($('evtOverlay').classList.contains('open')) disegnaFoglioEvento(e.id);
  if (state.evtTipoDb) {
    try {
      for (const [k] of prima) await db.from(V24.TABELLA).delete().eq('chiave', k);
      if (tipo) { const { error } = await db.from(V24.TABELLA).upsert({ chiave, tipo, titolo: e.titolo }, { onConflict: 'chiave' }); if (error) throw error; }
    } catch (err) { console.warn('[v24] salvato solo qui:', err.message); }
  }
  showToast(tipo === 'altri' ? `${e.titolo}: con altre persone${e.serie ? ', anche le prossime volte' : ''}` : tipo === 'mio' ? `${e.titolo}: tempo tuo${e.serie ? ', anche le prossime volte' : ''}` : `${e.titolo}: decido io`, 'success');
};
// le ore del giorno: con altri e tue (eventi con un orario; quelli di tutto il giorno a parte)
function v24OreGiorno(d) {
  const lista = eventiDelGiorno(d).filter(e => !e.routine);
  const min = f => lista.filter(e => e.ora && f(e)).reduce((s, e) => s + (e.minuti || 0), 0);
  const altri = min(v24ConAltri), mie = min(e => !v24ConAltri(e)), giornata = lista.filter(e => !e.ora).length;
  if (!altri && !mie && !giornata) return '';
  const parti = [altri ? `<b>${fmtTempo(altri)}</b> con altri` : '', mie ? `<b class="mie">${fmtTempo(mie)}</b> tue` : '', giornata ? `${giornata} senza ora` : ''].filter(Boolean);
  return `<p class="v24-ore" aria-label="Ore del giorno">${parti.join('<span aria-hidden="true">·</span>')}</p>`;
}
const _colonnaGiornoV24 = colonnaGiorno;
colonnaGiorno = function (gg, idx) {
  let h = _colonnaGiornoV24.apply(this, arguments);
  try { const ore = v24OreGiorno(dataDelGiorno(idx)); if (ore) h = h.replace(/(<div class="bcol-h">[\s\S]*?<\/div>)/, '$1' + ore); } catch (err) { console.warn('[v24] ore:', err.message); }
  return h;
};
const _rigaSpazioV24 = rigaSpazio;
rigaSpazio = function (p) { return _rigaSpazioV24.apply(this, arguments).replace('ti ti-lifebuoy', 'ti ti-plus').replace('buono per un cuscinetto', 'libero'); };
const _legendaColoriV24 = legendaColori;
legendaColori = function () {
  return _legendaColoriV24.apply(this, arguments).replace(/<span class="leg-voce"><span class="leg-segno leg-app" aria-hidden="true"><\/span>Appuntamento<\/span>/,
    '<span class="leg-voce"><span class="leg-segno leg-app" aria-hidden="true"></span>Con altri</span><span class="leg-voce"><span class="leg-segno leg-mio" aria-hidden="true"></span>Tempo tuo</span>');
};
// Da pianificare: le Subito tutte, poi poche Importanti; il resto sotto «Altre N»
const V24_DP_VISTE = 8;
const _htmlDaPianificareListaV24 = htmlDaPianificareLista;
htmlDaPianificareLista = function () {
  const lista = daPianificareFiltrate();
  if (ui.dp.q || ui.dp.tipo || ui.v24DpTutte || lista.length <= V24_DP_VISTE) return _htmlDaPianificareListaV24.apply(this, arguments);
  const subito = lista.filter(c => computeEffectiveQ(c) === 1), altre = lista.filter(c => computeEffectiveQ(c) !== 1);
  const viste = [...subito, ...altre.slice(0, Math.max(3, V24_DP_VISTE - subito.length))];
  const resto = lista.length - viste.length;
  return viste.map(c => riga({ c, fatto: false }, { trascina: true, data: oggiLocale() })).join('')
    + (resto > 0 ? `<button type="button" class="riga-link v24-altre" data-act="v24-dp-tutte"><i class="ti ti-chevron-down"></i><span>Altre ${resto}<small>senza data: meglio passare da «Riordina»</small></span><span></span><i class="ti ti-chevron-right"></i></button>` : '');
};
AZIONI['v24-dp-tutte'] = () => { ui.v24DpTutte = true; render(); };

// ══════════════════════════════════════════════════════════════
