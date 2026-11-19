// v9 · APPUNTAMENTI TOCCABILI
// Il cerchio spunta l'appuntamento (solo nell'app, mai su Google); la riga apre il suo foglio.
// Spunte: tabella eventi_fatti se c'è (supabase_migration_eventi_fatti.sql), altrimenti questo browser.
// ══════════════════════════════════════════════════════════════
const EVT_FATTI = { LS: 'eventi_fatti', LS_PORTATI: 'eventi_fatti_portati', TABELLA: 'eventi_fatti', GIORNI: 60 };
function leggiEvtFattiLocali() {
  try { const v = JSON.parse(localStorage.getItem(EVT_FATTI.LS) || '{}'); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
  catch (_) { return {}; }
}
function scriviEvtFattiLocali(mappa) {
  const limite = toISODate(new Date(Date.now() - EVT_FATTI.GIORNI * 864e5));
  const recenti = Object.fromEntries(Object.entries(mappa).filter(([, g]) => g >= limite));
  try { localStorage.setItem(EVT_FATTI.LS, JSON.stringify(recenti)); } catch (_) { /* senza spazio: restano per questa sessione */ }
}
state.evtFatti = leggiEvtFattiLocali();   // { id evento: 'YYYY-MM-DD' }
state.evtFattiDb = false;

async function caricaEventiFatti() {
  const da = toISODate(new Date(Date.now() - EVT_FATTI.GIORNI * 864e5));
  const { data, error } = await db.from(EVT_FATTI.TABELLA).select('evento_id,giorno').gte('giorno', da);
  if (error) { state.evtFattiDb = false; return; }   // tabella non ancora creata: si resta sul browser
  state.evtFattiDb = true;
  const dalDb = Object.fromEntries((data || []).map(r => [r.evento_id, r.giorno]));
  let portati = false;
  try { portati = !!localStorage.getItem(EVT_FATTI.LS_PORTATI); } catch (_) { portati = true; }
  const soloQui = portati ? [] : Object.entries(state.evtFatti).filter(([id]) => !dalDb[id]);
  if (soloQui.length) {
    const r = await db.from(EVT_FATTI.TABELLA).upsert(soloQui.map(([evento_id, giorno]) => ({ evento_id, giorno })), { onConflict: 'evento_id' });
    if (r.error) console.warn('[Appuntamenti] spunte del browser non portate:', r.error.message);
  }
  try { localStorage.setItem(EVT_FATTI.LS_PORTATI, '1'); } catch (_) { /* niente */ }
  state.evtFatti = { ...dalDb, ...Object.fromEntries(soloQui) };
  scriviEvtFattiLocali(state.evtFatti);
  render();
}

function eventoFatto(e) { return !!(e && e.id && (state.evtFatti || {})[e.id]); }
function appuntamentiSpuntabili(d) { return typeof gcalEraCollegato === 'function' && gcalEraCollegato() ? eventiDelGiorno(d).filter(eventoSpuntabile) : []; }
// Chiudi la settimana: le cose del piano più gli appuntamenti spuntabili di quella settimana
function statRevConEventi() {
  const st = bpStats(revItems());
  const bp = state.bp;
  const ev = bp ? (ui.eventi[settKey(bp.settimana, bp.anno)] || []).filter(eventoSpuntabile) : [];
  const tot = st.tot + ev.length, done = st.done + ev.filter(eventoFatto).length;
  return { tot, done, pct: tot ? Math.round(done / tot * 100) : 0 };
}

async function segnaEvento(id, fatto) {
  const e = eventoPerId(id);
  if (!eventoSpuntabile(e)) return;
  const prima = state.evtFatti;
  const { [id]: _tolto, ...senza } = prima;
  state.evtFatti = fatto ? { ...senza, [id]: e.giorno } : senza;
  scriviEvtFattiLocali(state.evtFatti);
  render();
  if ($('evtOverlay').classList.contains('open')) disegnaFoglioEvento(id);
  try {
    if (state.evtFattiDb) {
      const r = fatto
        ? await db.from(EVT_FATTI.TABELLA).upsert({ evento_id: id, giorno: e.giorno }, { onConflict: 'evento_id' })
        : await db.from(EVT_FATTI.TABELLA).delete().eq('evento_id', id);
      if (r.error) throw r.error;
    }
  } catch (err) {
    state.evtFatti = prima;
    scriviEvtFattiLocali(prima);
    render();
    showToast('Non riesco a salvare la spunta: ' + err.message, 'error');
    return;
  }
  showToast(fatto ? `«${e.titolo}» fatto` : `«${e.titolo}» non ancora fatto`, 'success', { annulla: () => segnaEvento(id, !fatto) });
}

const nomeCalendario = e => (CAL_LETTURA.find(c => c.tipo === e.cal) || {}).nome || 'Google Calendar';
rigaEvento = function (e) {
  const dati = [`<span class="mono">${orarioEvento(e)}</span>`, `<span>${nomeCalendario(e)}</span>`];
  const sovrapposto = coseSovrapposte(e);
  const sovr = [
    sovrapposto.length ? `<span class="evt-nota"><i class="ti ti-alert-triangle"></i><span>si sovrappone a ${escHtml(sovrapposto[0])}${sovrapposto.length > 1 ? ` e altre ${sovrapposto.length - 1}` : ''}</span></span>` : '',
    e.orarioDiverso ? `<span class="evt-nota evt-diverso" data-tip="Nel titolo c'è ${e.oraTitolo}, l'evento è alle ${e.ora}"><i class="ti ti-clock-exclamation"></i><span>orario nel titolo diverso (${e.oraTitolo})</span></span>` : ''].join('');
  const spunta = eventoSpuntabile(e), fatto = spunta && eventoFatto(e);
  const apri = e.id && !e.routine ? ` data-act="evt-apri" data-evt="${esc(e.id)}" role="button" tabindex="0" aria-label="Apri l'appuntamento ${esc(e.titolo)}"` : '';
  const segno = spunta
    ? `<button type="button" class="evt-ico evt-spunta" data-act="evt-fatto" data-evt="${esc(e.id)}" aria-pressed="${fatto}" aria-label="${fatto ? 'Fatto' : 'Segna come fatto'}: ${esc(e.titolo)}"><span class="evt-cerchio${fatto ? ' on' : ''}">${fatto ? '<i class="ti ti-check"></i>' : ''}</span></button>`
    : `<span class="evt-ico" aria-hidden="true"><i class="ti ti-calendar-event"></i></span>`;
  const tag = e.coach ? '<span class="tag-coach">Coach</span>' : e.prepCoach ? '<span class="tag-coach tag-prep">Preparazione coach</span>' : '';
  return `<div class="evt-riga evt-app${sovr ? ' evt-sovrapposto' : ''}${fatto ? ' is-fatto' : ''}"${apri}${e.id ? ` data-evt-id="${esc(e.id)}"` : ''}>${segno}
    <span class="evt-main"><span class="item-title">${tag}${escHtml(e.titolo)}</span><span class="item-meta">${dati.join('<span class="sep">·</span>')}</span>${sovr}</span></div>`;
};

document.body.insertAdjacentHTML('beforeend', `
<div class="modal-overlay" id="evtOverlay" onclick="closeModalOnBg(event,'evtOverlay')">
  <div class="modal sheet sheet-narrow" role="dialog" aria-modal="true" aria-labelledby="evt-titolo">
    <div class="sheet-grab"></div>
    <div class="sheet-head"><h3 class="t-title" id="evt-titolo">Appuntamento</h3><button type="button" class="btn btn-icon" onclick="closeModal('evtOverlay')" aria-label="Chiudi"><i class="ti ti-x"></i></button></div>
    <div id="evt-corpo"></div>
  </div>
</div>`);
// link dell'evento; se Google non lo dà, il giorno nel calendario
const linkEvento = e => e.link || `https://calendar.google.com/calendar/r/day/${e.giorno.replace(/-/g, '/')}`;
function apriFoglioEvento(id) {
  if (!eventoPerId(id)) return;
  $('evtOverlay').classList.add('open');
  disegnaFoglioEvento(id);
}
AZIONI['evt-apri'] = el => apriFoglioEvento(el.dataset.evt);
AZIONI['evt-fatto'] = el => segnaEvento(el.dataset.evt, !eventoFatto(eventoPerId(el.dataset.evt)));
AZIONI['evt-foglio-sposta'] = el => { closeModal('evtOverlay'); apriSpostaEvento(el.dataset.evt); };
AZIONI['evt-in-elenco'] = el => eventoInElenco(el.dataset.evt);

// Sposta un appuntamento di tutto il giorno: solo la data (niente ora né durata)
const giorniEvento = e => {
  const a = e.startRaw && e.startRaw.date, b = e.endRaw && e.endRaw.date;
  return a && b ? Math.max(1, Math.round((parseISODate(b) - parseISODate(a)) / 864e5)) : 1;
};
const _disegnaSpostaEventoV9 = disegnaSpostaEvento;
disegnaSpostaEvento = function () {
  const s = ui.sevt, e = s && eventoPerId(s.id);
  if (!e || !e.tuttoIlGiorno || !e.orgIo || serveScopeEventi()) return _disegnaSpostaEventoV9();
  const dopo = parseISODate(e.giorno); dopo.setDate(dopo.getDate() + 1);
  const domani = toISODate(dopo), w = isoWeekParts(parseISODate(s.giorno));
  const giorni = GIORNI.map((g, i) => { const iso = toISODate(bpDataGiorno(w.week, w.year, i)); return `<button type="button" class="chip" data-act="sevt-giorno" data-v="${iso}" aria-pressed="${iso === s.giorno}" aria-label="${g.label} ${fmtGgMm(iso)}">${g.label.slice(0, 3)} ${parseISODate(iso).getDate()}</button>`; }).join('');
  const serie = e.ricorrente ? `<p class="dl-label">Si ripete</p><div class="seg" role="group" aria-label="Quali spostare">
      <button type="button" data-act="sevt-serie" data-v="una" aria-pressed="${!s.tutte}">Solo questa volta</button>
      <button type="button" data-act="sevt-serie" data-v="tutte" aria-pressed="${s.tutte}">Anche le prossime</button></div>` : '';
  const invitati = e.nomiInvitati || [];
  $('sevt-corpo').innerHTML = `<div class="chips chips-wrap" role="group" aria-label="Quando">
      <button type="button" class="chip" data-act="sevt-giorno" data-v="${domani}" aria-pressed="${domani === s.giorno}"><i class="ti ti-arrow-right"></i>Domani</button>${giorni}</div>
    <div class="sevt-campi"><label><span class="dl-label">Giorno</span><input type="date" class="input" id="sevt-data" value="${s.giorno}"></label></div>
    <p class="t-caption muted">Resta un appuntamento di tutto il giorno${giorniEvento(e) > 1 ? `, di ${giorniEvento(e)} giorni` : ''}.</p>
    ${serie}
    <p class="t-caption" id="sevt-errore" role="alert" hidden></p>
    <div class="sheet-cta"><button type="button" class="btn btn-primary btn-block" data-act="sevt-conferma" id="sevt-conferma"><i class="ti ti-check"></i>${invitati.length ? 'Sposta e avvisa' : 'Sposta'}</button></div>`;
};
const _confermaSpostaEventoV9 = confermaSpostaEvento;
confermaSpostaEvento = async function () {
  const s = ui.sevt, e = s && eventoPerId(s.id);
  if (!e || !e.tuttoIlGiorno) return _confermaSpostaEventoV9();
  const errore = msg => { const el = $('sevt-errore'); el.textContent = msg; el.hidden = false; };
  const manca = serveScopeEventi();
  if (manca) { errore(manca); return; }
  if (!s.giorno || s.giorno < oggiLocale()) { errore('Questo giorno è già passato: scegline uno da oggi in poi.'); return; }
  const inizio = parseISODate(s.giorno), fine = parseISODate(s.giorno);
  fine.setDate(fine.getDate() + giorniEvento(e));
  const invia = (e.nomiInvitati || []).length ? 'all' : 'none';
  const btn = $('sevt-conferma');
  btn.disabled = true;
  const path = `/calendars/${encodeURIComponent(e.calId)}/events/${encodeURIComponent(e.id)}`;
  try {
    let annulla;
    if (e.ricorrente && s.tutte) annulla = await spostaSerieEvento(e, inizio, fine, invia);
    else {
      await gcalFetchUtente(`${path}?sendUpdates=${invia}`, 'PATCH', { start: { date: toISODate(inizio) }, end: { date: toISODate(fine) } });
      annulla = () => gcalFetchUtente(`${path}?sendUpdates=${invia}`, 'PATCH', { start: e.startRaw, end: e.endRaw });
    }
    closeModal('spostaEvtOverlay');
    ui.sevt = null;
    const da = parseISODate(e.giorno);
    ricaricaEventi(da, inizio);
    showToast(`${e.titolo}: ${fmtGiorno(inizio)}${invia === 'all' ? ' · invitati avvisati' : ''}`, 'success', { annulla: async () => {
      try { await annulla(); ricaricaEventi(da, inizio); } catch (err) { showToast('Non riesco a rimetterlo com\'era: ' + err.message, 'error'); }
    } });
  } catch (err) {
    btn.disabled = false;
    console.warn('[GCal] sposta appuntamento di giornata:', err.message);
    errore('Non sono riuscito a spostarlo: ' + err.message);
  }
};

// ══════════════════════════════════════════════════════════════
