// v6 · colori = priorità, telefono, Pianifica a colonne, Riordina, ripetibili,
// appuntamenti spostabili, la parte per il coach (vedi privata/DECISIONI.md, solo in locale)
// ══════════════════════════════════════════════════════════════
const V6 = { LARGO: 1100, RIO_LS: 'riordina_stato', COACH_GIORNI: 60, Q2_GIORNI: 92 };
const eLargo = () => window.innerWidth >= V6.LARGO;
const giornoDi = (w, y, k) => bpDataGiorno(w, y, GIORNI.findIndex(g => g.key === k));

document.body.insertAdjacentHTML('beforeend', `
<div class="modal-overlay" id="serieOverlay" onclick="closeModalOnBg(event,'serieOverlay')">
  <div class="modal sheet sheet-narrow" role="dialog" aria-modal="true" aria-labelledby="serie-titolo" aria-describedby="serie-testo">
    <div class="sheet-grab"></div>
    <div class="sheet-head"><h3 class="t-title" id="serie-titolo">Si ripete: cosa sposti?</h3><button type="button" class="btn btn-icon" data-act="serie-annulla" aria-label="Annulla"><i class="ti ti-x"></i></button></div>
    <p class="t-label muted" id="serie-testo"></p>
    <div class="sheet-cta">
      <button type="button" class="btn btn-primary btn-block" data-act="serie-una"><i class="ti ti-point"></i>Solo questa volta</button>
      <button type="button" class="btn btn-secondary btn-block" data-act="serie-tutte"><i class="ti ti-repeat"></i>Anche le prossime</button>
    </div>
  </div>
</div>
<div class="modal-overlay" id="spostaEvtOverlay" onclick="closeModalOnBg(event,'spostaEvtOverlay')">
  <div class="modal sheet sheet-narrow" role="dialog" aria-modal="true" aria-labelledby="sevt-titolo">
    <div class="sheet-grab"></div>
    <div class="sheet-head"><div class="sheet-head-txt"><h3 class="t-title" id="sevt-titolo">Sposta a</h3><p class="t-label muted" id="sevt-sotto"></p></div>
      <button type="button" class="btn btn-icon" onclick="closeModal('spostaEvtOverlay')" aria-label="Chiudi"><i class="ti ti-x"></i></button></div>
    <div id="sevt-corpo"></div>
  </div>
</div>
<div class="modal-overlay" id="nuovoEvtOverlay" onclick="closeModalOnBg(event,'nuovoEvtOverlay')">
  <div class="modal sheet sheet-narrow" role="dialog" aria-modal="true" aria-labelledby="nevt-titolo">
    <div class="sheet-grab"></div>
    <div class="sheet-head"><div class="sheet-head-txt"><h3 class="t-title" id="nevt-titolo">Nuovo appuntamento</h3><p class="t-label muted" id="nevt-sotto"></p></div>
      <button type="button" class="btn btn-icon" onclick="closeModal('nuovoEvtOverlay')" aria-label="Chiudi"><i class="ti ti-x"></i></button></div>
    <div id="nevt-corpo"></div>
  </div>
</div>
<div class="modal-overlay riordina-overlay" id="riordinaOverlay">
  <div class="riordina" role="dialog" aria-modal="true" aria-labelledby="rio-titolo"><div id="rio-corpo"></div></div>
</div>`);

// Un div con role="button" (riga di un appuntamento) risponde anche a Invio e Spazio
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[role="button"][data-act]')) { e.preventDefault(); e.target.click(); }
});

// ─── 3. CAMPO FISSO DEL TELEFONO ─────────────────────────────
function righeCattura() { return righeCampo($('cattura-testo').value); }   // 24/10 · con le righe vuote: chiudono un'intestazione («Mattina 26»)
function allungaCattura() {
  const t = $('cattura-testo');
  t.style.height = 'auto';
  t.style.height = Math.min(t.scrollHeight + 2, 120) + 'px';
}
$('cattura').addEventListener('submit', e => { e.preventDefault(); salvaCattura(); });
$('cattura-testo').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); salvaCattura(); }
});
$('cattura-testo').addEventListener('input', allungaCattura);
$('cattura-mic').hidden = !micDaMostrare();

// «+ Ciclo» di una colonna: il foglio rapido con il giorno già scelto
const _disegnaRapidoV5 = disegnaRapido;
disegnaRapido = function () {
  _disegnaRapidoV5();
  const r = ui.rapido;
  if (r.data) $('rapido-chips').insertAdjacentHTML('beforeend', `<button type="button" class="chip" data-act="rapido-giorno" aria-pressed="true"><i class="ti ti-calendar"></i>${fmtGiorno(parseISODate(r.data))}</button>`);
};
function apriRapidoGiorno(iso) { apriRapido(); ui.rapido = { ...ui.rapido, data: iso }; disegnaRapido(); }
const _aggiungiRigheV5 = aggiungiRighe;
aggiungiRighe = async function (righe, r) {
  if (!r.data) return _aggiungiRigheV5(righe, r);
  const nuove = await inSilenzio(() => _aggiungiRigheV5(righe, { ...r, data: null }));
  if (!nuove) return nuove;
  try {
    for (const c of nuove) await pianificaInData(ciclo(c.id) || c, parseISODate(r.data), null);
    render();
    showToast(`${nuove.length === 1 ? 'Aggiunta' : plurale(nuove.length, 'cosa aggiunta', 'cose aggiunte')} a ${fmtGiorno(parseISODate(r.data))}`, 'success');
  } catch (e) { showToast('Errore: ' + e.message, 'error'); }
  return nuove;
};

// ─── 5a. CICLI CHE SI RIPETONO: solo questa volta / anche le prossime ───
let _serie = null;
const siRipete = c => !!c && !isGiornaliero(c) && ripetizioneDi(c) !== 'nessuna';
function chiediSerie(c, unaVolta, tutte) {
  _serie = { unaVolta, tutte };
  $('serie-testo').textContent = `«${c.title}» si ripete (${(RIP_LABELS[ripetizioneDi(c)] || '').toLowerCase()}). La sposti solo questa volta o anche le prossime?`;
  $('serieOverlay').classList.add('open');
  setTimeout(() => document.querySelector('[data-act="serie-una"]').focus(), 60);
}
function rispondiSerie(v) {
  const s = _serie;
  _serie = null;
  closeModal('serieOverlay');
  if (!s) return;
  if (v === 'una') s.unaVolta();
  else if (v === 'tutte') s.tutte();
}
// Anche le prossime: la serie cambia giorno (e momento) da qui in avanti; l'eccezione di questa settimana non serve più.
async function spostaSerie(c, data, fascia) {
  const g = giornoKeyDi(data), w = isoWeekParts(data);
  const prima = campi(c, ['giorno_settimana', 'fascia_oraria', 'pianificato_data']);
  const ovPrima = state.agendaOverrides.find(o => o.ciclo_id === c.id && o.settimana === w.week && o.anno === w.year) || null;
  const patch = { giorno_settimana: g, fascia_oraria: fascia || c.fascia_oraria || 'mattina' };
  if (c.pianificato_data && state.pianificaColsOk) patch.pianificato_data = toISODate(data);
  try {
    await patchCiclo(c.id, patch);
    if (state.agendaTableOk) await togliOverride(c.id, w);
    const item = state.bp && w.week === state.week && w.year === state.year ? itemDelPiano(c.id) : null;
    if (item && item.giorno !== g) {
      const { error } = await db.from('battle_plan_items').update({ giorno: g }).eq('id', item.id);
      if (error) throw error;
      state.bpItems = state.bpItems.map(i => i.id === item.id ? { ...i, giorno: g } : i);
    }
    render();
    aggiornaBlocco(c.id);
    showToast(`Da qui in avanti: ${GIORNI_MAP[g].label.toLowerCase()}`, 'success', { annulla: async () => {
      await patchCiclo(c.id, prima);
      if (ovPrima) await upsertOverride(c.id, w, ovPrima.giorno_settimana, ovPrima.fascia_oraria);
      render();
    } });
  } catch (e) { showToast('Errore: ' + e.message, 'error'); render(); }
}
const conProtezione = (c, fn) => eInderogabile(c) ? chiediSpostamento(c, fn) : fn();
const _azioneDomaniV5 = azioneDomani;
azioneDomani = function (id, daISO) {
  const c = ciclo(id);
  if (!siRipete(c)) return _azioneDomaniV5(id, daISO);
  const a = parseISODate(daISO) || new Date(); a.setDate(a.getDate() + 1);
  chiediSerie(c, () => _azioneDomaniV5(id, daISO), () => conProtezione(c, () => spostaSerie(c, a, null)));
};
const _impostaGiornoV5 = impostaGiorno;
impostaGiorno = function (id, g) {
  const c = ciclo(id);
  if (!siRipete(c) || g === 'settimana') return _impostaGiornoV5(id, g);
  chiediSerie(c, () => _impostaGiornoV5(id, g), () => conProtezione(c, () => spostaSerie(c, giornoDi(state.week, state.year, g), null)));
};
const _moveCicloV5 = moveCicloInAgenda;
moveCicloInAgenda = function (id, giorno, fascia) {
  const c = ciclo(id);
  if (!siRipete(c)) return _moveCicloV5(id, giorno, fascia);
  chiediSerie(c, () => _moveCicloV5(id, giorno, fascia), () => conProtezione(c, () => spostaSerie(c, giornoDi(state.week, state.year, giorno), fascia)));
};

// ─── 5b. APPUNTAMENTI DI GOOGLE CALENDAR SPOSTABILI ──────────
function eventoPerId(id) { return Object.values(ui.eventi).flat().find(e => e.id === id) || null; }
function ricaricaEventi(...date) {
  const settimane = new Set(date.filter(Boolean).map(d => { const w = isoWeekParts(d); return settKey(w.week, w.year); }));
  settimane.forEach(k => { delete ui.eventi[k]; });
  date.filter(Boolean).forEach(d => { const w = isoWeekParts(d); caricaEventi(w.week, w.year); });
}
const isoLocale = (iso, hm) => `${iso}T${hm}:00`;
const fusoEvento = e => (e.startRaw && e.startRaw.timeZone) || 'Europe/Rome';
function serveScopeEventi() {
  if (!isGcalTokenValid() && !gcalDaRicollegare() && gcalEraCollegato()) { rinnovaGcalSilenzioso('sposta appuntamento'); return 'Sto rinnovando il collegamento a Google Calendar: riprova tra un momento.'; }
  if (!isGcalTokenValid()) return 'Il collegamento a Google Calendar è scaduto: ricollegalo per spostare gli appuntamenti.';
  if (!haScopeEventi()) return 'Google non ha dato all\'app il permesso di modificare gli eventi. Ricollega Google e lascia spuntato il permesso sul calendario.';
  return '';
}
// Il primo spazio libero di quel giorno lungo «min», dalle 9 alle 19 (esclusi l'evento stesso e le cose con ora)
function primoLibero(iso, min, tranne, daOra) {
  const d = parseISODate(iso);
  const occ = [...eventiDelGiorno(d).filter(e => e.id !== tranne && e.ora && e.fine).map(e => [minDi(e.ora), Math.max(minDi(e.fine), minDi(e.ora) + 1)]),
    ...righeGiornoData(d).filter(r => r.ora).map(r => [minDi(r.ora), minDi(r.ora) + (r.durata || BP_DURATA_DEFAULT)])];
  const inizio = Math.max(minDi(GIORNATA.INIZIO), daOra != null ? daOra : 0);
  const spazio = spaziLiberi(occ, inizio, minDi(GIORNATA.FINE)).find(([a, b]) => b - a >= min);
  return spazio ? hmDi(spazio[0]) : null;
}
// Da quel giorno in avanti (al massimo una settimana): oggi si parte da adesso, arrotondato al quarto d'ora
function primoLiberoDa(iso, min, tranne) {
  const d0 = parseISODate(iso);
  for (let i = 0; i < 7; i++) {
    const d = new Date(d0); d.setDate(d0.getDate() + i);
    const g = toISODate(d);
    if (g < oggiLocale()) continue;
    const adesso = new Date(), daOra = g === oggiLocale() ? Math.ceil((adesso.getHours() * 60 + adesso.getMinutes()) / 15) * 15 : null;
    const ora = primoLibero(g, min, tranne, daOra);
    if (ora) return { iso: g, ora };
  }
  return null;
}
function righeGiornoData(d) {
  const w = isoWeekParts(d);
  return w.week === state.week && w.year === state.year ? righeDaFare(giornoKeyDi(d)) : [];
}
function sovrapposti(iso, ora, min, tranne) {
  const d = parseISODate(iso), s = minDi(ora), f = s + min;
  // 22/10 · solo le cose pianificate: niente avvisi tra appuntamenti
  return righeGiornoData(d).filter(r => r.ora && !r.fatto && minDi(r.ora) < f && s < minDi(r.ora) + (r.durata || BP_DURATA_DEFAULT)).map(r => r.c.title);
}
ui.sevt = null;
function apriSpostaEvento(id, isoDest) {
  const e = eventoPerId(id);
  if (!e) return;
  $('sevt-titolo').textContent = 'Sposta a';
  $('sevt-sotto').textContent = `${e.titolo} · ${fmtGiorno(parseISODate(e.giorno))} ${orarioEvento(e)}`;
  const durata = e.minuti || 60;
  ui.sevt = { id, giorno: isoDest || e.giorno, ora: e.ora || '09:00', durata, tutte: false };
  $('spostaEvtOverlay').classList.add('open');
  disegnaSpostaEvento();
}
function disegnaSpostaEvento() {
  const s = ui.sevt, e = eventoPerId(s.id), corpo = $('sevt-corpo');
  if (!e) { corpo.innerHTML = '<p class="t-label muted">Questo appuntamento non c\'è più.</p>'; return; }
  if (!e.orgIo) {
    corpo.innerHTML = `<div class="sevt-avviso"><i class="ti ti-user-exclamation"></i><p>Lo organizza ${escHtml(e.org || 'un\'altra persona')}: chiedigli di spostarlo. Da qui non lo sposto, cambierebbe solo nel tuo calendario.</p></div>
      <div class="sheet-cta"><button type="button" class="btn btn-primary btn-block" data-act="sevt-promemoria"><i class="ti ti-bell-plus"></i>Crea un promemoria per chiederglielo</button></div>`;
    return;
  }
  const manca = serveScopeEventi();
  if (manca) {
    corpo.innerHTML = `<div class="sevt-avviso"><i class="ti ti-lock-open"></i><p>${escHtml(manca)}</p></div>
      <div class="sheet-cta"><button type="button" class="btn btn-primary btn-block" data-act="sevt-ricollega"><i class="ti ti-refresh"></i>Ricollega Google</button></div>`;
    return;
  }
  const dopo = parseISODate(e.giorno); dopo.setDate(dopo.getDate() + 1);
  const domani = toISODate(dopo);
  const w = isoWeekParts(parseISODate(s.giorno));
  const giorni = GIORNI.map((g, i) => { const iso = toISODate(bpDataGiorno(w.week, w.year, i)); return `<button type="button" class="chip" data-act="sevt-giorno" data-v="${iso}" aria-pressed="${iso === s.giorno}" aria-label="${g.label} ${fmtGgMm(iso)}">${g.label.slice(0, 3)} ${parseISODate(iso).getDate()}</button>`; }).join('');
  const sovr = sovrapposti(s.giorno, s.ora, s.durata, e.id);
  const libero = sovr.length ? primoLiberoDa(s.giorno, s.durata, e.id) : null;
  const doveLibero = libero ? (libero.iso === s.giorno ? `alle <b class="mono">${libero.ora}</b>` : `${fmtGiorno(parseISODate(libero.iso))} alle <b class="mono">${libero.ora}</b>`) : '';
  const avvisoSovr = sovr.length ? `<div class="sevt-avviso warn"><i class="ti ti-alert-triangle"></i><p>Alle ${s.ora} si sovrappone a ${escHtml(sovr[0])}${sovr.length > 1 ? ` e altri ${sovr.length - 1}` : ''}.${libero ? ` Il primo spazio libero è ${doveLibero}.` : ' Nei prossimi giorni non trovo uno spazio libero abbastanza lungo.'}</p>${libero ? `<button type="button" class="btn btn-secondary btn-sm" data-act="sevt-libero" data-v="${libero.ora}" data-g="${libero.iso}">Usa ${libero.iso === s.giorno ? '' : fmtGiorno(parseISODate(libero.iso)) + ' '}alle ${libero.ora}</button>` : ''}</div>` : '';
  const passato = new Date(isoLocale(s.giorno, s.ora)) < new Date();
  const avvisoPassato = passato ? '<div class="sevt-avviso warn"><i class="ti ti-clock-x"></i><p>Questo orario è già passato: scegline uno da adesso in poi.</p></div>' : '';
  const invitati = e.nomiInvitati || [];
  const avvisoInv = invitati.length ? `<div class="sevt-avviso"><i class="ti ti-mail"></i><p>${escHtml(invitati.slice(0, 2).join(', '))}${invitati.length > 2 ? ` e altri ${invitati.length - 2}` : ''} ${invitati.length === 1 ? 'riceve' : 'ricevono'} l'aggiornamento.</p></div>` : '';
  const serie = e.ricorrente ? `<p class="dl-label">Si ripete</p><div class="seg" role="group" aria-label="Quali spostare">
      <button type="button" data-act="sevt-serie" data-v="una" aria-pressed="${!s.tutte}">Solo questa volta</button>
      <button type="button" data-act="sevt-serie" data-v="tutte" aria-pressed="${s.tutte}">Anche le prossime</button></div>` : '';
  const durate = [15, 30, 45, 60, 90, 120, 180];
  if (!durate.includes(s.durata)) durate.push(s.durata);
  corpo.innerHTML = `<div class="chips chips-wrap" role="group" aria-label="Quando">
      <button type="button" class="chip" data-act="sevt-giorno" data-v="${domani}" aria-pressed="${domani === s.giorno}"><i class="ti ti-arrow-right"></i>Domani</button>${giorni}</div>
    <div class="sevt-campi">
      <label><span class="dl-label">Giorno</span><input type="date" class="input" id="sevt-data" value="${s.giorno}"></label>
      <label><span class="dl-label">Ora</span><input type="time" class="input" id="sevt-ora" value="${s.ora}" step="300"></label>
      <label><span class="dl-label">Durata</span><select class="input" id="sevt-durata">${durate.sort((a, b) => a - b).map(m => `<option value="${m}"${m === s.durata ? ' selected' : ''}>${fmtTempo(m)}</option>`).join('')}</select></label>
    </div>
    ${serie}${avvisoPassato}${avvisoSovr}${avvisoInv}
    <p class="t-caption" id="sevt-errore" role="alert" hidden></p>
    <div class="sheet-cta"><button type="button" class="btn btn-primary btn-block" data-act="sevt-conferma" id="sevt-conferma"><i class="ti ti-check"></i>${invitati.length ? 'Sposta e avvisa' : 'Sposta'}</button></div>`;
}
document.addEventListener('change', e => {
  if (!ui.sevt) return;
  const t = e.target;
  if (t.id === 'sevt-data' && t.value) { ui.sevt = { ...ui.sevt, giorno: t.value }; disegnaSpostaEvento(); }
  else if (t.id === 'sevt-ora' && t.value) { ui.sevt = { ...ui.sevt, ora: t.value }; disegnaSpostaEvento(); }
  else if (t.id === 'sevt-durata') { ui.sevt = { ...ui.sevt, durata: parseInt(t.value, 10) || 60 }; disegnaSpostaEvento(); }
});
const rruleDi = master => (master.recurrence || []).find(r => /^RRULE:/i.test(r)) || null;
const utcCompatto = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
// «Anche le prossime» su un evento che si ripete: la serie vecchia finisce prima di questa volta, ne parte una nuova da qui.
async function spostaSerieEvento(e, inizio, fine, invia) {
  const calPath = `/calendars/${encodeURIComponent(e.calId)}/events`;
  const master = await gcalFetchUtente(`${calPath}/${encodeURIComponent(e.serie)}`, 'GET');
  const rr = master && rruleDi(master);
  if (!rr) throw new Error('non trovo la regola della serie');
  let nuovaRegola = rr.replace(/;?UNTIL=[^;]+/i, '').replace(/;?COUNT=\d+/i, '');
  const count = /COUNT=(\d+)/i.exec(rr), until = /UNTIL=([^;]+)/i.exec(rr);
  if (count) {   // quante volte restano da qui
    const qs = new URLSearchParams({ timeMin: new Date(e.inizioMs).toISOString(), maxResults: '2500', showDeleted: 'false' });
    const ist = await gcalFetchUtente(`${calPath}/${encodeURIComponent(e.serie)}/instances?${qs}`, 'GET');
    nuovaRegola += `;COUNT=${Math.max(1, ((ist && ist.items) || []).length)}`;
  } else if (until) nuovaRegola += `;UNTIL=${until[1]}`;
  const vecchioGiorno = BYDAY[(new Date(e.inizioMs).getDay() + 6) % 7], nuovoGiorno = BYDAY[(inizio.getDay() + 6) % 7];
  nuovaRegola = nuovaRegola.replace(new RegExp(`BYDAY=${vecchioGiorno}(?=;|$)`), `BYDAY=${nuovoGiorno}`);
  const tz = fusoEvento(e);
  const nuovo = {
    summary: master.summary, description: master.description, location: master.location, colorId: master.colorId,
    attendees: master.attendees, reminders: master.reminders, transparency: master.transparency, visibility: master.visibility,
    start: e.tuttoIlGiorno ? { date: toISODate(inizio) } : { dateTime: isoLocale(toISODate(inizio), hhmm(inizio)), timeZone: tz },
    end: e.tuttoIlGiorno ? { date: toISODate(fine) } : { dateTime: isoLocale(toISODate(fine), hhmm(fine)), timeZone: tz },
    recurrence: [...(master.recurrence || []).filter(r => !/^RRULE:/i.test(r)), nuovaRegola]
  };
  const creato = await gcalFetchUtente(`${calPath}?sendUpdates=${invia}`, 'POST', nuovo);
  if (!creato || !creato.id) throw new Error('la serie nuova non è stata creata');
  const primaDi = new Date(e.inizioMs); primaDi.setDate(primaDi.getDate() - 1);   // tutto il giorno: UNTIL è una data
  const fineVecchia = rr.replace(/;?UNTIL=[^;]+/i, '').replace(/;?COUNT=\d+/i, '') + `;UNTIL=${e.tuttoIlGiorno ? toISODate(primaDi).replace(/-/g, '') : utcCompatto(new Date(e.inizioMs - 1000))}`;
  try {
    await gcalFetchUtente(`${calPath}/${encodeURIComponent(e.serie)}?sendUpdates=${invia}`, 'PATCH', { recurrence: [...(master.recurrence || []).filter(r => !/^RRULE:/i.test(r)), fineVecchia] });
  } catch (err) {   // non sono riuscito a chiudere la vecchia: tolgo la nuova, così non resta doppia
    await gcalFetchUtente(`${calPath}/${encodeURIComponent(creato.id)}?sendUpdates=none`, 'DELETE').catch(() => {});
    throw err;
  }
  return async () => {   // annulla
    await gcalFetchUtente(`${calPath}/${encodeURIComponent(creato.id)}?sendUpdates=${invia}`, 'DELETE');
    await gcalFetchUtente(`${calPath}/${encodeURIComponent(e.serie)}?sendUpdates=${invia}`, 'PATCH', { recurrence: master.recurrence });
  };
}
async function confermaSpostaEvento() {
  const s = ui.sevt, e = eventoPerId(s.id);
  if (!e) return;
  const errore = msg => { const el = $('sevt-errore'); el.textContent = msg; el.hidden = false; };
  const manca = serveScopeEventi();
  if (manca) { errore(manca); return; }
  const inizio = new Date(isoLocale(s.giorno, s.ora)), fine = new Date(inizio.getTime() + s.durata * 60000);
  if (isNaN(inizio)) { errore('Scegli giorno e ora'); return; }
  if (inizio < new Date()) { errore('Questo orario è già passato: scegline uno da adesso in poi.'); return; }
  const invia = (e.nomiInvitati || []).length ? 'all' : 'none';
  const btn = $('sevt-conferma');
  btn.disabled = true;
  const tz = fusoEvento(e);
  const path = `/calendars/${encodeURIComponent(e.calId)}/events/${encodeURIComponent(e.id)}`;
  try {
    let annulla;
    if (e.ricorrente && s.tutte) annulla = await spostaSerieEvento(e, inizio, fine, invia);
    else {
      await gcalFetchUtente(`${path}?sendUpdates=${invia}`, 'PATCH', { start: { dateTime: isoLocale(s.giorno, s.ora), timeZone: tz }, end: { dateTime: isoLocale(toISODate(fine), hhmm(fine)), timeZone: tz } });
      annulla = () => gcalFetchUtente(`${path}?sendUpdates=${invia}`, 'PATCH', { start: e.startRaw, end: e.endRaw });
    }
    closeModal('spostaEvtOverlay');
    ui.sevt = null;
    const da = parseISODate(e.giorno), a = parseISODate(s.giorno);
    ricaricaEventi(da, a);
    showToast(`${e.titolo}: ${fmtGiorno(a)} alle ${s.ora}${invia === 'all' ? ' · invitati avvisati' : ''}`, 'success', { annulla: async () => {
      try { await annulla(); ricaricaEventi(da, a); } catch (err) { showToast('Non riesco a rimetterlo com\'era: ' + err.message, 'error'); }
    } });
  } catch (err) {
    btn.disabled = false;
    console.warn('[GCal] sposta appuntamento:', err.message);
    errore(/insufficient|permission|forbidden|403/i.test(err.message) ? 'Google non permette di modificare questo evento: ricollega Google o chiedi a chi lo organizza.' : 'Non sono riuscito a spostarlo: ' + err.message);
  }
}
async function promemoriaOrganizzatore() {
  const e = eventoPerId(ui.sevt && ui.sevt.id);
  if (!e) return;
  closeModal('spostaEvtOverlay');
  ui.sevt = null;
  await aggiungiRighe([`Chiedi a ${e.org || 'chi lo organizza'} di spostare «${e.titolo}» (${fmtGgMm(e.giorno)})`], { subito: false, oggi: true, persona: null });
}

// «+ Appuntamento» in una colonna: un evento nel calendario Lavoro (Privato se sei su Personale)
ui.nevt = null;
function apriNuovoEvento(iso) {
  const manca = serveScopeEventi();
  if (manca) { showToast(manca, 'warn'); openGcalModal(); return; }
  const cal = CAL_LETTURA.find(c => c.tipo === (state.ctx === 'personale' ? 'privato' : 'lavoro')) || CAL_LETTURA[0];
  ui.nevt = { iso, cal: cal.id };
  $('nevt-sotto').textContent = `${fmtGiornoLungo(parseISODate(iso))} · calendario ${cal.nome}`;
  const lib = primoLiberoDa(iso, 60);
  const ora = lib && lib.iso === iso ? lib.ora : '09:00';
  $('nevt-corpo').innerHTML = `<label><span class="dl-label">Cosa</span><input type="text" class="input" id="nevt-titolo-in" maxlength="200" autocomplete="off" placeholder="Es. Incontro con Marco"></label>
    <div class="sevt-campi"><label><span class="dl-label">Ora</span><input type="time" class="input" id="nevt-ora" value="${ora}" step="300"></label>
      <label><span class="dl-label">Durata</span><select class="input" id="nevt-durata">${[15, 30, 45, 60, 90, 120].map(m => `<option value="${m}"${m === 60 ? ' selected' : ''}>${fmtTempo(m)}</option>`).join('')}</select></label></div>
    <p class="t-caption" id="nevt-errore" role="alert" hidden></p>
    <div class="sheet-cta"><button type="button" class="btn btn-primary btn-block" data-act="nevt-crea" id="nevt-crea"><i class="ti ti-calendar-plus"></i>Crea l'appuntamento</button></div>`;
  $('nuovoEvtOverlay').classList.add('open');
  setTimeout(() => $('nevt-titolo-in').focus(), 80);
}
async function creaNuovoEvento() {
  const n = ui.nevt, titolo = $('nevt-titolo-in').value.trim(), ora = $('nevt-ora').value, durata = parseInt($('nevt-durata').value, 10) || 60;
  const errore = msg => { const el = $('nevt-errore'); el.textContent = msg; el.hidden = false; };
  if (!titolo) { errore('Scrivi cos\'è'); $('nevt-titolo-in').focus(); return; }
  if (!ora) { errore('Scegli l\'ora'); return; }
  const inizio = new Date(isoLocale(n.iso, ora)), fine = new Date(inizio.getTime() + durata * 60000);
  const sovr = sovrapposti(n.iso, ora, durata, null);
  if (sovr.length && !n.confermato) {
    const lib = primoLiberoDa(n.iso, durata), libero = lib && lib.iso === n.iso ? lib.ora : null;
    errore(`Si sovrappone a ${sovr[0]}.${libero ? ` Ho messo il primo spazio libero, alle ${libero}.` : ''} Tocca di nuovo per crearlo.`);
    if (libero) $('nevt-ora').value = libero;
    ui.nevt = { ...n, confermato: true };
    return;
  }
  $('nevt-crea').disabled = true;
  try {
    const creato = await gcalFetch(`/calendars/${encodeURIComponent(n.cal)}/events`, 'POST', {
      summary: titolo, start: { dateTime: isoLocale(n.iso, ora), timeZone: 'Europe/Rome' }, end: { dateTime: isoLocale(toISODate(fine), hhmm(fine)), timeZone: 'Europe/Rome' },
      extendedProperties: { private: { cicli_aperti: 'appuntamento' } } });
    if (!creato || !creato.id) throw new Error('Google non ha risposto');
    closeModal('nuovoEvtOverlay');
    ricaricaEventi(inizio);
    showToast(`Appuntamento creato: ${fmtGiorno(inizio)} alle ${ora}`, 'success', { annulla: async () => {
      await gcalFetch(`/calendars/${encodeURIComponent(n.cal)}/events/${encodeURIComponent(creato.id)}`, 'DELETE').catch(() => {});
      ricaricaEventi(inizio);
    } });
  } catch (e) { $('nevt-crea').disabled = false; errore('Non sono riuscito a crearlo: ' + e.message); }
}

// ─── 2. COMPUTER: PIANIFICA A COLONNE (da 1100px) ────────────
ui.dp = { q: '', tipo: null };
ui.scorsa = {};
ui.boardSel = null;
function boardAttiva() { return ui.tab === 'pianifica' && !ui.sub && ui.pian === 'settimana' && eLargo(); }
function legendaColori() {
  const voce = (cl, l) => `<span class="leg-voce"><span class="leg-segno ${cl}" aria-hidden="true"></span>${l}</span>`;
  return `<div class="legenda" aria-label="Legenda dei colori">${voce('q1', 'Subito')}${voce('q2', 'Importante')}${voce('q3', 'Delega')}${voce('q4', 'Lascia stare')}${voce('leg-app', 'Appuntamento')}</div>`;
}
async function caricaScorsa(week, year) {
  const k = settKey(week, year);
  if (k in ui.scorsa || !state.bpTableOk) return;
  ui.scorsa[k] = null;
  const prima = new Date(getWeekStart(week, year)); prima.setDate(prima.getDate() - 7);
  const w = isoWeekParts(prima);
  try {
    const { data, error } = await db.from('battle_plan').select('id,battle_plan_items(ciclo_id,completato,tipo_slot)').eq('settimana', w.week).eq('anno', w.year).maybeSingle();
    if (error) throw error;
    const items = ((data && data.battle_plan_items) || []).filter(i => i.ciclo_id && i.tipo_slot !== 'cuscinetto').filter(i => { const c = ciclo(i.ciclo_id); return !!c; });
    ui.scorsa[k] = items.length ? bpStats(items) : { tot: 0 };
    if (boardAttiva()) render();
  } catch (e) { console.warn('[Pianifica] settimana scorsa:', e.message); }
}
function righeSettimana() { return [...GIORNI.map(g => g.key), 'settimana'].flatMap(k => righeGiorno(k)); }
function testaBoard() {
  const da = getWeekStart(state.week, state.year), a = new Date(da); a.setDate(a.getDate() + 6);
  const tutte = righeSettimana(), daFare = tutte.filter(r => !r.fatto), fatte = tutte.length - daFare.length;   // v51 · il conto è di quello che resta
  const minuti = daFare.reduce((s, r) => s + (r.durata || BP_DURATA_DEFAULT), 0);
  caricaScorsa(state.week, state.year);
  const sc = ui.scorsa[settKey(state.week, state.year)];
  const scorsa = sc && sc.tot ? ` · sett. scorsa <b class="mono">${sc.done}</b> su <b class="mono">${sc.tot}</b> (${sc.pct}%)` : '';
  const sola = bpSolaLettura();
  const piano = sola ? '' : `<button type="button" class="btn btn-secondary btn-sm" data-act="wizard"><i class="ti ${state.bp ? 'ti-pencil' : 'ti-calendar-plus'}"></i>${state.bp ? 'Modifica il piano' : 'Prepara la settimana'}</button>`;
  return `<div class="board-testa">
    <div class="bt-titolo"><h2>Business Plan · Settimana <span class="mono">${state.week}</span></h2>
      <div class="bt-nav"><button type="button" class="btn btn-icon" data-act="sett" data-dir="-1" aria-label="Settimana prima"><i class="ti ti-chevron-left"></i></button>
        <span class="mono">${fmtGgMm(toISODate(da))} – ${fmtGgMm(toISODate(a))}</span>
        <button type="button" class="btn btn-icon" data-act="sett" data-dir="1" aria-label="Settimana dopo"><i class="ti ti-chevron-right"></i></button>
        ${eSettimanaCorrente() ? '' : '<button type="button" class="btn btn-ghost btn-sm" data-act="sett-oggi"><i class="ti ti-arrow-back-up"></i>Torna alla settimana di oggi</button>'}</div></div>
    <p class="bt-stat"><b class="mono">${daFare.length}</b> ${daFare.length === 1 ? 'cosa' : 'cose'} · <b class="mono">${fmtTempo(minuti)}</b>${fatte ? ` · <b class="mono">${fatte}</b> ${fatte === 1 ? 'fatta' : 'fatte'}` : ''}${scorsa}</p>
    ${legendaColori()}
    <div class="bt-azioni">${piano}
      <button type="button" class="btn btn-secondary btn-sm" data-act="pdf"${tutte.length ? '' : ' disabled'}><i class="ti ti-printer"></i>Stampa il foglio</button>
      <button type="button" class="btn btn-primary btn-sm" data-act="invia"${tutte.length ? '' : ' disabled'}><i class="ti ti-send"></i>Invia al coach</button></div>
  </div>`;
}
function daPianificareFiltrate() {
  const q = ui.dp.q.trim().toLowerCase();
  return daSistemare()
    .filter(c => !q || String(c.title || '').toLowerCase().includes(q))
    .filter(c => !ui.dp.tipo || computeEffectiveQ(c) === ui.dp.tipo)
    .sort(perTipoEData);
}
function htmlDaPianificareLista() {
  const lista = daPianificareFiltrate();
  return lista.length ? lista.map(c => riga({ c, fatto: false }, { trascina: true, data: oggiLocale() })).join('') : '<div class="col-vuota">Niente da pianificare</div>';
}
function colonnaDaPianificare() {
  const tutte = daSistemare(), scad = conScadenzaSenzaGiorno();
  const n = q => tutte.filter(c => computeEffectiveQ(c) === q).length;
  const chip = (q, l) => `<button type="button" class="chip chip-q${q}" data-act="dp-tipo" data-v="${q}" aria-pressed="${ui.dp.tipo === q}">${l} <span class="mono">${n(q)}</span></button>`;
  const senza = tutte.length;
  const conScad = scad.length ? `<div class="group" style="margin-top:var(--sp-3)">${accordion('dp-scad', 'Con una scadenza', `<span class="mono">${scad.length}</span>`,
    scad.map(c => riga({ c, fatto: false }, { trascina: true, data: oggiLocale() })).join(''))}</div>` : '';
  return `<section class="bcol bcol-dp" aria-label="Da pianificare">
    <div class="bcol-h"><span>Da pianificare</span><span class="mono">${tutte.length}</span></div><p class="bcol-sotto">${etichettaCtx()} · senza giorno, data né piano</p>
    <label class="cerca"><i class="ti ti-search" aria-hidden="true"></i><input type="search" id="dp-cerca" placeholder="Cerca" autocomplete="off" aria-label="Cerca tra le cose da pianificare" value="${esc(ui.dp.q)}"></label>
    <div class="chips chips-wrap dp-chips" role="group" aria-label="Filtra per tipo">${chip(1, 'Subito')}${chip(2, 'Importante')}${chip(3, 'Delega')}</div>
    ${senza ? `<button type="button" class="dp-avviso" data-act="riordina"><i class="ti ti-arrows-sort"></i><span><b class="mono">${senza}</b> da sistemare · ${etichettaCtx()} · Riordina in 10 minuti</span></button>` : ''}
    <div class="group bzona" data-zona="dapiano" id="dp-lista">${htmlDaPianificareLista()}</div>${conScad}
  </section>`;
}
// Spazi liberi del giorno senza cuscinetto nel piano: tratteggiati, «pensaci tu»
function rigaSpazio(p) {
  return `<div class="evt-riga spazio-riga" aria-label="Spazio libero alle ${p.ora}"><span class="evt-ico" aria-hidden="true"><i class="ti ti-lifebuoy"></i></span>
    <span class="evt-main"><span class="item-title">Spazio libero <span class="sep">·</span> <span class="mono">${p.ora}</span></span><span class="item-meta"><span class="mono">${fmtTempo(p.durata)}</span><span class="sep">·</span><span>buono per un cuscinetto</span></span></span></div>`;
}
function colonnaGiorno(gg, idx) {
  const d = dataDelGiorno(idx), rs = righeDaFare(gg.key), tot = minutiGiorno(rs, d), op = opzRighe(d), fatte = fatteDelGiorno(gg.key);
  const oggi = eSettimanaCorrente() && giornoIdxDi(oggiData()) === idx;
  const muovi = r => ({ ...op, trascina: !r.fatto && !op.solaLettura });
  const { conOra, senzaOra } = sequenzaGiorno(rs, d);
  const spazi = !giornoPassato(d) && !cuscinettiDelGiorno(d).length && !op.solaLettura ? postiCuscinetto(d, occupatiPiano(gg.key)).map(p => ({ tipo: 'spazio', ora: p.ora, p })) : [];
  const seq = [...conOra, ...spazi].sort((a, b) => a.ora.localeCompare(b.ora));
  const evt = e => rigaEvento(e).replace('<div class="evt-riga', `<div draggable="${e.orgIo && !e.routine ? 'true' : 'false'}" class="evt-riga`);
  const corpo = seq.map(x => x.tipo === 'evento' ? evt(x.e) : x.tipo === 'cuscinetto' ? rigaCuscinetto(x.item, op) : x.tipo === 'spazio' ? rigaSpazio(x.p) : riga(x.r, muovi(x.r))).join('')
    + (senzaOra.length && seq.length ? '<div class="fascia-h">Senza ora</div>' : '') + senzaOra.map(r => riga(r, muovi(r))).join('');
  const piu = op.solaLettura ? '' : `<div class="bcol-piu"><button type="button" class="btn btn-ghost btn-sm" data-act="b-ciclo" data-v="${toISODate(d)}"><i class="ti ti-plus"></i>Ciclo</button>
    <button type="button" class="btn btn-ghost btn-sm" data-act="b-evento" data-v="${toISODate(d)}"><i class="ti ti-calendar-plus"></i>Appuntamento</button></div>`;
  return `<section class="bcol${oggi ? ' oggi' : ''}" aria-label="${gg.label} ${d.getDate()}">
    <div class="bcol-h"><span>${gg.label.slice(0, 3)} <span class="mono">${d.getDate()}</span></span>${etichettaFatte(fatte, true)}${tot ? `<span class="mono" data-tip="Cose, appuntamenti e cuscinetti">${fmtTempo(tot)}</span>` : ''}</div>
    <div class="group bzona" data-zona="${gg.key}">${corpo || '<div class="col-vuota">—</div>'}</div>${piu}
  </section>`;
}
function giorniVisibili() {
  return GIORNI.map((g, idx) => ({ g, idx })).filter(({ g, idx }) => idx < 5 || ui.weekend || righeGiorno(g.key).length || eventiDelGiorno(dataDelGiorno(idx)).length);
}
function pianLargo() {
  const inSett = righeDaFare('settimana'), fineSett = dataDelGiorno(6);
  const giorni = giorniVisibili();
  const weekend = giorni.length < 7 ? `<button type="button" class="btn btn-ghost btn-sm" data-act="weekend">${ui.weekend ? 'Nascondi sabato e domenica' : 'Mostra sabato e domenica'}</button>` : '';
  const pensaci = `<section class="bcol bcol-sett" aria-label="In settimana, pensaci dopo">
      <div class="bcol-h"><span>In settimana</span><span class="mono">${inSett.length}</span></div><p class="bcol-sotto">pensaci dopo</p>
      <div class="group bzona" data-zona="settimana">${inSett.map(r => riga(r, { ...opzRighe(fineSett), data: oggiLocale(), trascina: !r.fatto })).join('') || '<div class="col-vuota">Trascina qui le cose della settimana senza un giorno</div>'}</div></section>`;
  return `${testaBoard()}${eSettimanaCorrente() ? bloccoRimaste() : ''}${cardCoach()}
    <div class="board-scorri"><div class="cols board" style="--giorni:${giorni.length}">${colonnaDaPianificare()}${pensaci}${giorni.map(({ g, idx }) => colonnaGiorno(g, idx)).join('')}</div></div>
    <div class="board-piede">${weekend}<span class="t-caption muted">Trascina le cose e gli appuntamenti tra le colonne · con la tastiera: seleziona una cosa e premi Alt + freccia</span></div>
    ${pianFondoLargo()}`;
}
function pianFondoLargo() {
  const sola = bpSolaLettura();
  return `<div class="group" style="margin-top:var(--sp-5)">
    <button type="button" class="riga-link" data-act="review"${state.bp && !sola ? '' : ' disabled'}><i class="ti ti-flag"></i><span>Chiudi la settimana</span><small>${!state.bp ? 'serve un piano' : state.bp.stato === 'chiuso' ? 'già chiusa' : ''}</small><i class="ti ti-chevron-right"></i></button>
    <button type="button" class="riga-link" data-act="v16-riporta"><i class="ti ti-file-check"></i><span>Riporta il foglio</span><small>spunta quello che hai fatto sulla carta</small><i class="ti ti-chevron-right"></i></button></div>`;
}
const _vistaPianificaV5 = vistaPianifica;
vistaPianifica = function () {
  if (!boardAttiva()) return _vistaPianificaV5();
  const seg = [['settimana', 'Settimana'], ['mese', 'Mese']].map(([k, l]) => `<button type="button" data-act="pian" data-v="${k}" aria-pressed="${ui.pian === k}">${l}</button>`).join('');
  return `<div class="vh vh-board"><div><h1>Pianifica${btnAiuto('pianifica')}</h1></div><div class="seg" role="group" aria-label="Vista">${seg}</div></div>${pianLargo()}`;
};
// sotto i 1100px resta la lista: in più la card del coach, sopra «Da piazzare»
const _pianFondoV5 = pianFondo;
pianFondo = function () { return cardCoach() + _pianFondoV5(); };

// Spostare dalla colonna: giorno = come i chip del dettaglio; «In settimana» = riga del piano senza giorno (si crea il piano in bozza se manca).
async function bordoSposta(id, zona) {
  const c = ciclo(id);
  if (!c || zona === 'dapiano') return;
  try {
    if (zona === 'settimana' && !state.bp) {
      await pianoPer({ week: state.week, year: state.year }, new Map());
      await loadBattlePlan();
    }
    const eraNelPiano = !!(state.bp && itemDelPiano(id));
    await impostaGiorno(id, zona);
    if (state.bp && !eraNelPiano && zona !== 'settimana' && !siRipete(c) && !itemDelPiano(id)) {
      const riga = { battle_plan_id: state.bp.id, ciclo_id: id, giorno: zona, fascia: null, durata_prevista: c.durata_minuti || BP_DURATA_DEFAULT, ordine: state.bpItems.length };
      const { data, error } = await db.from('battle_plan_items').upsert(riga, { onConflict: 'battle_plan_id,ciclo_id' }).select();
      if (error) throw error;
      state.bpItems = [...state.bpItems.filter(i => i.ciclo_id !== id), (data && data[0]) || riga];
      render();
    }
  } catch (e) { showToast('Errore: ' + e.message, 'error'); }
}
let _bDrag = null;
document.addEventListener('dragstart', e => {
  const board = e.target.closest && e.target.closest('.board');
  if (!board) return;
  const it = e.target.closest('.item[draggable="true"]'), ev = e.target.closest('.evt-riga[draggable="true"]');
  if (it) _bDrag = { tipo: 'cosa', id: it.dataset.id };
  else if (ev) _bDrag = { tipo: 'evento', id: ev.dataset.evtId };
  else return;
  try { e.dataTransfer.setData('text/plain', `${_bDrag.tipo}:${_bDrag.id}`); e.dataTransfer.effectAllowed = 'move'; } catch (_) {}
  (it || ev).classList.add('dragging');
  rimandaRender(true);
});
// Mentre si trascina la pagina non si ridisegna (un aggiornamento in arrivo toglieva la riga da sotto il mouse):
// il disegno rimandato si fa al rilascio.
let _renderRimandato = null;
function rimandaRender(si) {
  if (si) { if (!_renderRimandato) _renderRimandato = { attesa: false }; return; }
  const r = _renderRimandato;
  _renderRimandato = null;
  if (r && r.attesa) render();
}
const _renderV9 = render;
render = function () {
  if (_renderRimandato) { _renderRimandato.attesa = true; return; }
  return _renderV9.apply(this, arguments);
};
document.addEventListener('dragend', () => {
  _bDrag = null;
  rimandaRender(false);
  document.querySelectorAll('.board .dragging').forEach(x => x.classList.remove('dragging'));
  document.querySelectorAll('.bzona.drag-over').forEach(z => z.classList.remove('drag-over'));
});
// la colonna intera (intestazione e «+» compresi) prende il rilascio, non solo la sua lista
function zonaSotto(target) {
  if (!target || !target.closest) return null;
  const col = target.closest('.board .bcol');
  return (col && col.querySelector('.bzona')) || target.closest('.board .bzona');
}
document.addEventListener('dragover', e => {
  const z = _bDrag && zonaSotto(e.target);
  if (!z || z.dataset.zona === 'dapiano' || (_bDrag.tipo === 'evento' && z.dataset.zona === 'settimana')) return;
  e.preventDefault();
  document.querySelectorAll('.bzona.drag-over').forEach(x => { if (x !== z) x.classList.remove('drag-over'); });
  z.classList.add('drag-over');
});
document.addEventListener('drop', e => {
  const z = _bDrag && zonaSotto(e.target);
  if (!z || z.dataset.zona === 'dapiano') { _bDrag = null; rimandaRender(false); return; }
  e.preventDefault();
  e.stopPropagation();
  const d = _bDrag;
  _bDrag = null;
  rimandaRender(false);
  z.classList.remove('drag-over');
  if (d.tipo === 'evento') { if (z.dataset.zona !== 'settimana') apriSpostaEvento(d.id, toISODate(giornoDi(state.week, state.year, z.dataset.zona))); return; }
  bordoSposta(d.id, z.dataset.zona);
}, true);
// Tastiera: Alt + freccia sposta la cosa selezionata nella colonna accanto
function zoneBoard() { return ['settimana', ...giorniVisibili().map(x => x.g.key)]; }
document.addEventListener('keydown', async e => {
  if (!e.altKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
  const it = e.target.closest && e.target.closest('.board .item');
  if (!it) return;
  e.preventDefault();
  e.stopImmediatePropagation();   // le frecce da sole cambiano settimana: con Alt no
  const zone = zoneBoard(), da = it.closest('.bzona').dataset.zona;
  const i = zone.indexOf(da), passo = e.key === 'ArrowRight' ? 1 : -1;
  const dest = da === 'dapiano' ? (passo > 0 ? zone[0] : null) : zone[i + passo];
  if (!dest) return;
  const id = it.dataset.id;
  await bordoSposta(id, dest);
  setTimeout(() => { const el = document.querySelector(`.board .item[data-id="${id}"] .item-main`); if (el) el.focus(); }, 80);
}, true);
document.addEventListener('input', e => {
  if (e.target.id !== 'dp-cerca') return;
  ui.dp = { ...ui.dp, q: e.target.value };
  const l = $('dp-lista');
  if (l) l.innerHTML = htmlDaPianificareLista();
});
window.matchMedia(`(min-width: ${V6.LARGO}px)`).addEventListener('change', () => render());

// ─── 4. RIORDINA: una cosa alla volta, le più vecchie prima ──
ui.rio = null;
function rioCoda() {
  return daSistemare()
    .sort((a, b) => (computeEffectiveQ(a) === 1 ? 0 : 1) - (computeEffectiveQ(b) === 1 ? 0 : 1) || String(a.created_at || '').localeCompare(String(b.created_at || '')))
    .map(c => c.id);
}
function rioSalva() { if (ui.rio) lsScrivi(V6.RIO_LS, JSON.stringify({ ids: ui.rio.ids, i: ui.rio.i, conta: ui.rio.conta, saltate: ui.rio.saltate || [], ctx: state.ctx })); }
function apriRiordina(daCapo) {
  let salvato = null;
  try { salvato = JSON.parse(lsLeggi(V6.RIO_LS) || 'null'); } catch (_) { salvato = null; }
  const valido = salvato && !daCapo && salvato.ctx === state.ctx && salvato.i < (salvato.ids || []).length;
  // ripresa: le cose già passate restano contate, le altre solo se sono ancora da sistemare
  const ancora = new Set(rioCoda());
  const fatte = valido ? salvato.ids.slice(0, salvato.i).filter(id => ciclo(id)) : [];
  ui.rio = valido ? { ids: [...fatte, ...salvato.ids.slice(salvato.i).filter(id => ancora.has(id))], i: fatte.length, conta: salvato.conta || {}, saltate: salvato.saltate || [], ripreso: true } : { ids: [...ancora], i: 0, conta: {}, saltate: [], ripreso: false };
  ui.rio.scelta = null;
  $('riordinaOverlay').classList.add('open');
  rioSalta(0);
}
function chiudiRiordina() { rioSalva(); ui.rio = null; closeModal('riordinaOverlay'); render(); }
// salta in avanti le cose già chiuse o tolte nel frattempo
function rioSalta(passo) {
  const r = ui.rio;
  r.i += passo;
  while (r.i < r.ids.length && !(ciclo(r.ids[r.i]) && isAttivo(ciclo(r.ids[r.i])))) r.i++;
  r.scelta = null;
  rioSalva();
  disegnaRiordina();
}
const RIO_TASTI = [
  { k: 'subito', q: 1, l: 'Subito', s: 'questa settimana', i: 'ti-flame' },
  { k: 'importante', q: 2, l: 'Importante', s: 'scegli una data', i: 'ti-target-arrow' },
  { k: 'delega', q: 3, l: 'Delega', s: 'a chi e quando controlli', i: 'ti-user-share' },
  { k: 'lascia', q: 4, l: 'Lascia stare', s: 'fuori dalla vista', i: 'ti-wind' }];
const RIO_DATE = [{ k: 'sett', l: 'Questa sett.' }, { k: 'prossima', l: 'Prossima' }, { k: 'mese', l: 'Tra 1 mese' }, { k: 'tre', l: 'Tra 3 mesi' }];
function rioRiepilogo() {
  const c = ui.rio.conta, voci = [['subito', 'Subito'], ['importante', 'Importante'], ['delega', 'Delega'], ['lascia', 'Lascia stare'], ['fatta', 'Fatte'], ['spacchettata', 'Spacchettate'], ['saltata', 'Saltate']]
    .filter(([k]) => c[k]).map(([k, l]) => `<span><b class="mono">${c[k]}</b> ${l}</span>`);
  return voci.length ? voci.join('<span class="sep">·</span>') : '<span>Ancora niente: comincia dalla prima.</span>';
}
function disegnaRiordina() {
  const r = ui.rio, tot = r.ids.length, corpo = $('rio-corpo');
  const testa = `<div class="rio-testa"><button type="button" class="btn btn-ghost btn-sm" data-act="rio-chiudi"><i class="ti ti-x"></i>Interrompi</button>
    <h2 id="rio-titolo">Riordina <span class="ctx-etichetta">· ${etichettaCtx()}</span></h2><span class="mono rio-conto" aria-live="polite">${Math.min(r.i + 1, tot)} / ${tot}</span></div>
    <div class="bar" role="progressbar" aria-label="Riordinate" aria-valuemin="0" aria-valuemax="${tot}" aria-valuenow="${r.i}"><i style="width:${tot ? Math.round(r.i / tot * 100) : 100}%"></i></div>`;
  const piede = `<div class="rio-piede" aria-label="Riepilogo">${rioRiepilogo()}</div>`;
  if (r.i >= tot) {
    lsScrivi(V6.RIO_LS, null);
    // 22/10 · a fine giro: «Riordinate N · saltate M» e, se ne hai saltate, «Rivedi le saltate»
    const saltate = rioSaltateAncora(), fatte = Object.entries(r.conta).filter(([k]) => k !== 'saltata').reduce((t, [, n]) => t + n, 0);
    const titolo = tot ? `Riordinate ${fatte} · saltate ${saltate.length}` : 'Niente da sistemare';
    const testo = !tot ? `In ${etichettaCtx()} ogni cosa aperta ha un tipo e, se serve, una data.` : saltate.length ? 'Le saltate sono ancora da sistemare: puoi rivederle adesso o la prossima volta.' : 'Ogni cosa aperta ha un tipo e, se serve, una data. Le trovi in Tutto e in Pianifica.';
    const tasti = (saltate.length ? '<button type="button" class="btn btn-secondary btn-sm" data-act="rio-saltate"><i class="ti ti-rotate"></i>Rivedi le saltate</button>' : '')
      + '<button type="button" class="btn btn-primary btn-sm" data-act="rio-chiudi">Chiudi</button>';
    corpo.innerHTML = testa + `<div class="rio-fine">${vuoto('ti-circle-check', titolo, testo, `<div class="rio-fine-tasti">${tasti}</div>`)}</div>` + piede;
    return;
  }
  const c = ciclo(r.ids[r.i]);
  const giorni = c.created_at ? Math.max(0, Math.floor((Date.now() - new Date(c.created_at).getTime()) / 864e5)) : null;
  const area = areaDi(c);
  const q = computeEffectiveQ(c);
  const scelta = r.scelta === 'importante' ? `<div class="rio-date" role="group" aria-label="Quando la fai">
      ${RIO_DATE.map(x => `<button type="button" class="chip" data-act="rio-data" data-v="${x.k}">${x.l}</button>`).join('')}
      <label class="chip rio-data-scelta"><i class="ti ti-calendar"></i><span>Data</span><input type="date" id="rio-data" min="${oggiLocale()}" aria-label="Scegli la data"></label></div>` : '';
  corpo.innerHTML = testa + `<article class="rio-carta p-q${q}">
      <p class="rio-meta">${area ? `<span class="rio-area">${escHtml(area)}</span>` : ''}${giorni != null ? `<span>${giorni === 0 ? 'aperta oggi' : giorni === 1 ? 'aperta da 1 giorno' : `aperta da ${giorni} giorni`}</span>` : ''}<span>ora: ${TIPI[q].label}</span></p>
      <h3 class="rio-cosa">${escHtml(c.title)}</h3>
      ${c.note ? `<p class="rio-nota">${escHtml(c.note)}</p>` : ''}
    </article>
    <div class="rio-tasti">${RIO_TASTI.map(t => `<button type="button" class="rio-tasto t-q${t.q}" data-act="rio-tipo" data-v="${t.k}" aria-pressed="${r.scelta === t.k}"><i class="ti ${t.i}"></i><b>${t.l}</b><small>${t.s}</small></button>`).join('')}</div>
    ${scelta}
    <div class="rio-altro"><button type="button" class="btn btn-secondary btn-sm" data-act="rio-fatta"><i class="ti ti-check"></i>È fatta</button>
      <button type="button" class="btn btn-secondary btn-sm" data-act="rio-spacchetta"><i class="ti ti-list-tree"></i>Spacchettala</button>
      <button type="button" class="btn btn-ghost btn-sm" data-act="rio-salta">Salta<i class="ti ti-arrow-right"></i></button></div>
    ${r.ripreso && r.i > 0 ? '<p class="t-caption muted rio-ripresa">Ripreso da dove eri rimasto · <button type="button" class="link-btn" data-act="rio-dacapo">ricomincia</button></p>' : ''}` + piede;
  setTimeout(() => { const b = corpo.querySelector('.rio-tasto'); if (b && !r.scelta) b.focus({ preventScroll: true }); }, 30);
}
// le saltate ancora aperte (una saltata e poi chiusa altrove non torna)
function rioSaltateAncora() { return [...new Set((ui.rio && ui.rio.saltate) || [])].filter(id => ciclo(id) && isAttivo(ciclo(id))); }
function rioRivediSaltate() {
  const ids = rioSaltateAncora();
  ui.rio = { ids, i: 0, conta: {}, saltate: [], ripreso: false, scelta: null };
  rioSalta(0);
}
function rioConta(k, d) { ui.rio.conta = { ...ui.rio.conta, [k]: Math.max(0, (ui.rio.conta[k] || 0) + d) }; }
// ogni scelta: salva, toast con Annulla (che rimette la cosa com'era e torna indietro), avanti
async function rioApplica(k, fn) {
  const r = ui.rio, id = r.ids[r.i], c = ciclo(id);
  const prima = campi(c, ['q', 'parcheggiato', 'parcheggiato_at', 'pianificato_data', 'giorno_settimana', 'fascia_oraria']);
  try {
    const dopo = await fn(c);
    rioConta(k, 1);
    rioSalta(1);
    render();
    showToast(`«${c.title}» · ${dopo}`, 'success', { annulla: async () => {
      await patchCiclo(id, prima);
      if (ui.rio) { rioConta(k, -1); ui.rio.i = Math.max(0, ui.rio.ids.indexOf(id)); rioSalva(); disegnaRiordina(); }
      render();
    } });
  } catch (e) { showToast('Errore: ' + e.message, 'error'); }
}
async function rioInSettimana(c, q) {
  await patchCiclo(c.id, { q, ...(isParcheggiato(c) ? { parcheggiato: false, parcheggiato_at: null } : {}), ...(state.pianificaColsOk ? { pianificato_data: oggiLocale() } : {}) });
  const cur = bpSettimanaCorrente(), cache = new Map();
  const plan = await pianoPer(cur, cache);
  const { error } = await db.from('battle_plan_items').upsert({ battle_plan_id: plan.id, ciclo_id: c.id, giorno: 'settimana', fascia: null, durata_prevista: c.durata_minuti || BP_DURATA_DEFAULT },
    { onConflict: 'battle_plan_id,ciclo_id' });
  if (error) throw error;
  if (state.week === cur.week && state.year === cur.year) await loadBattlePlan();
}
function rioDataDi(k) {
  const d = new Date();
  if (k === 'prossima') { const n = bpSettimanaSuccessiva(bpSettimanaCorrente().week, bpSettimanaCorrente().year); return getWeekStart(n.week, n.year); }
  if (k === 'mese') return addMesi(d, 1);
  if (k === 'tre') return addMesi(d, 3);
  return parseISODate(k);
}
function rioTipo(k) {
  if (k === 'importante') { ui.rio.scelta = 'importante'; disegnaRiordina(); setTimeout(() => { const b = document.querySelector('[data-act="rio-data"]'); if (b) b.focus(); }, 30); return; }
  if (k === 'subito') return rioApplica('subito', async c => { await rioInSettimana(c, 1); return 'Subito, questa settimana'; });
  if (k === 'lascia') return rioApplica('lascia', async c => { await patchCiclo(c.id, { q: 4, ...(state.parcheggioColsOk ? { parcheggiato: true, parcheggiato_at: new Date().toISOString() } : {}) }); return 'Lascia stare'; });
  if (k === 'delega') { ui.rio.delega = ui.rio.ids[ui.rio.i]; apriDelega(ui.rio.delega); }
}
async function rioData(k) {
  if (k === 'sett') return rioApplica('importante', async c => { await rioInSettimana(c, 2); return 'Importante, questa settimana'; });
  const d = rioDataDi(k);
  if (!d || isNaN(d)) return;
  return rioApplica('importante', async c => { await patchCiclo(c.id, { q: 2 }); await pianificaInData(ciclo(c.id), d, null); return `Importante, ${fmtGiorno(d)}`; });
}
// la Delega passa dal suo foglio (a chi + quando controlli): quando è salvata, avanti
const _salvaDelegaV5 = salvaDelega;
salvaDelega = async function () {
  const id = ui.delega && ui.delega.id;
  await _salvaDelegaV5();
  if (ui.rio && ui.rio.delega === id && !$('delegaOverlay').classList.contains('open') && ciclo(id) && ciclo(id).q === 3) {
    ui.rio.delega = null; rioConta('delega', 1); rioSalta(1);
  }
};
async function rioFatta() {
  const id = ui.rio.ids[ui.rio.i];
  await azioneFatto(id);
  if (!ui.rio) return;
  rioConta('fatta', 1);
  rioSalta(1);
}
function rioSpacchetta() {
  const id = ui.rio.ids[ui.rio.i];
  rioConta('spacchettata', 1);
  rioSalta(1);
  azioneScomponi(id);   // il dettaglio si apre sopra Riordina; chiudendolo si torna qui
}
document.addEventListener('change', e => {
  if (e.target.id === 'rio-data' && e.target.value && ui.rio) rioData(e.target.value);
});
document.addEventListener('keydown', e => {
  if (!ui.rio || !$('riordinaOverlay').classList.contains('open') || document.querySelector('.modal-overlay.open:not(#riordinaOverlay)')) return;
  if (e.key === 'Escape') { e.preventDefault(); chiudiRiordina(); }
});

// ─── 7. LA PARTE PER IL COACH ────────────────────────────────
ui.coach = { evento: null, letto: false, chiusa: null, prossimo: null };
// il prossimo incontro: eventi con il coach o che iniziano con «Coach:», nei prossimi 60 giorni
async function caricaCoach(forza) {
  if (!isGcalTokenValid() || (ui.coach.letto && !forza) || ui.coach.carico) return;
  ui.coach = { ...ui.coach, carico: true };
  try {
    const da = new Date(), a = new Date(Date.now() + V6.COACH_GIORNI * 864e5);
    const trovati = [];
    for (const cal of CAL_LETTURA) {
      for (const q of ['beretta', 'Coach']) {
        const qs = new URLSearchParams({ timeMin: da.toISOString(), timeMax: a.toISOString(), singleEvents: 'true', orderBy: 'startTime', maxResults: '20', q });
        const res = await gcalFetch(`/calendars/${encodeURIComponent(cal.id)}/events?${qs}`, 'GET').catch(() => null);
        ((res && res.items) || []).map(x => eventoDa(x, cal)).filter(x => x && x.coach && x.inizioMs > Date.now()).forEach(x => trovati.push(x));
      }
    }
    trovati.sort((x, y) => x.inizioMs - y.inizioMs);
    if (trovati[0]) salvaRiservaCoach(trovati[0]);
    ui.coach = { ...ui.coach, evento: trovati[0] || null, letto: true };
    await caricaPianiCoach();
    render();
  } catch (e) { console.warn('[Coach] prossimo incontro:', e.message); }
  finally { ui.coach = { ...ui.coach, carico: false }; }
}
// la settimana da chiudere (quella prima dell'incontro) e il piano della settimana dell'incontro
function settimaneCoach() {
  const e = coachEvento();
  const dIncontro = e ? new Date(e.inizioMs) : null;
  const wInc = dIncontro ? isoWeekParts(dIncontro) : bpSettimanaSuccessiva(bpSettimanaCorrente().week, bpSettimanaCorrente().year);
  const prima = new Date(getWeekStart(wInc.week, wInc.year)); prima.setDate(prima.getDate() - 7);
  const cur = bpSettimanaCorrente();
  const wChiudi = getWeekStart(wInc.week, wInc.year) <= getWeekStart(cur.week, cur.year) ? cur : isoWeekParts(prima);
  return { wInc, wChiudi };
}
async function caricaPianiCoach() {
  if (!state.bpTableOk) return;
  const { wInc, wChiudi } = settimaneCoach();
  const leggi = async w => {
    const { data, error } = await db.from('battle_plan').select(`id,stato,${state.statsColOk ? 'motivi,' : ''}battle_plan_items(id)`).eq('settimana', w.week).eq('anno', w.year).maybeSingle();
    if (error) throw error;
    return data;
  };
  try { ui.coach = { ...ui.coach, chiusa: await leggi(wChiudi), prossimo: await leggi(wInc) }; }
  catch (e) { console.warn('[Coach] piani:', e.message); }
}

function vociCoach() {
  const { wInc, wChiudi } = settimaneCoach();
  const mancano = daSistemare().length, dove = etichettaCtx();
  const ultimoQ2 = state.ultimoQ2 ? new Date(state.ultimoQ2) : null;
  const q2ok = !!ultimoQ2 && Date.now() - ultimoQ2.getTime() <= V6.Q2_GIORNI * 864e5;
  const ch = ui.coach.chiusa, motivi = ch && ch.motivi && Object.keys(ch.motivi).length;
  const pr = ui.coach.prossimo, pronto = !!(pr && pr.stato === 'attivo' && (pr.battle_plan_items || []).length);
  const st = stampatoIl(wInc.week, wInc.year), inv = inviatoIl(wInc.week, wInc.year);
  ui.coachSett = wInc;   // «Invia» della checklist manda il piano della settimana dell'incontro
  return [
    { k: 'foglio', ok: mancano === 0, l: 'Foglio cicli aperti sistemato', d: mancano ? `${mancano} da sistemare · ${dove}` : `niente da sistemare · ${dove}`, az: mancano ? '<button type="button" class="btn btn-secondary btn-sm" data-act="riordina"><i class="ti ti-arrows-sort"></i>Riordina</button>' : '' },
    { k: 'q2', ok: q2ok, l: 'Esercizio Q2 fatto negli ultimi 3 mesi', d: ultimoQ2 ? `l'ultimo il ${fmtGgMm(toISODate(ultimoQ2))}` : 'mai fatto', az: q2ok ? '' : '<button type="button" class="btn btn-secondary btn-sm" data-act="q2-apri">Fallo ora</button>' },
    { k: 'chiusa', ok: !!(ch && ch.stato === 'chiuso' && motivi), l: `Settimana ${wChiudi.week} chiusa con i perché`, d: !ch ? 'nessun piano' : ch.stato !== 'chiuso' ? 'non ancora chiusa' : motivi ? 'chiusa, con i perché' : 'chiusa, ma senza i perché', az: ch && ch.stato !== 'chiuso' ? `<button type="button" class="btn btn-secondary btn-sm" data-act="coach-chiudi" data-w="${wChiudi.week}" data-y="${wChiudi.year}">Chiudi</button>` : '' },
    { k: 'bp', ok: pronto && !!st && !!inv, l: `Business Plan della settimana ${wInc.week}`, d: [pronto ? 'pronto' : pr ? 'in bozza' : 'da preparare', st ? `stampato il ${st}` : 'da stampare', inv ? `inviato il ${inv}` : 'da inviare'].join(' · '),
      az: !pronto ? `<button type="button" class="btn btn-secondary btn-sm" data-act="coach-prepara" data-w="${wInc.week}" data-y="${wInc.year}">Prepara</button>` : !inv ? '<button type="button" class="btn btn-secondary btn-sm" data-act="coach-invia">Invia</button>' : '' }];
}
function contoAllaRovescia(ms) {
  const min = Math.max(0, Math.round((ms - Date.now()) / 60000));
  const g = Math.floor(min / 1440), h = Math.floor((min % 1440) / 60), m = min % 60;
  return g ? `tra ${g} ${g === 1 ? 'giorno' : 'giorni'}${h ? ` e ${h} ${h === 1 ? 'ora' : 'ore'}` : ''}` : h ? `tra ${h} ${h === 1 ? 'ora' : 'ore'}${m ? ` e ${m} min` : ''}` : `tra ${m} min`;
}
// Riserva: l'ultimo incontro trovato sul calendario (localStorage), altrimenti quello già fissato.
// Così la card c'è anche senza Google Calendar o col collegamento scaduto.
const COACH_RISERVA = { LS: 'coach_prossimo_v2', PREDEFINITO: { inizio: '2026-11-02T18:50:00+01:00', ora: '18:50' } };
function salvaRiservaCoach(e) { lsScrivi(COACH_RISERVA.LS, JSON.stringify({ inizioMs: e.inizioMs, ora: e.ora })); }
function riservaCoach() {
  const salvata = leggiJson(COACH_RISERVA.LS, null);
  const pred = { inizioMs: new Date(COACH_RISERVA.PREDEFINITO.inizio).getTime(), ora: COACH_RISERVA.PREDEFINITO.ora };
  const r = salvata && Number.isFinite(salvata.inizioMs) && /^\d{2}:\d{2}$/.test(salvata.ora || '') ? salvata : pred;
  return r.inizioMs > Date.now() ? { ...r, riserva: true } : null;
}
const coachEvento = () => ui.coach.evento || riservaCoach();
// Banner in Oggi: 48 ore prima dell'incontro, se una voce è ancora aperta
const _bannerCoachV5 = bannerCoach;
bannerCoach = function () {
  const e = coachEvento();
  if (!e || e.inizioMs - Date.now() > COACH_ORE * 3600e3 || e.inizioMs < Date.now()) return _bannerCoachV5();
  const aperte = vociCoach().filter(v => !v.ok);
  if (!aperte.length) return '';
  return `<section class="banner-piano banner-coach" aria-label="Incontro con il coach"><i class="ti ti-user-check"></i>
    <div><b>Incontro con il coach ${fmtGiorno(new Date(e.inizioMs))} alle ${e.ora}: ${aperte.length === 1 ? 'manca una cosa' : `mancano ${aperte.length} cose`}</b>
      <p class="t-caption muted">${aperte.map(v => escHtml(v.l)).join(' · ')}</p>
      <div class="banner-azioni"><button type="button" class="btn btn-primary btn-sm" data-act="coach-vedi">Vedi cosa manca</button></div></div>${chiudiBanner}</section>`;
};
// la checklist si aggiorna con i dati: dopo la chiusura, l'invio, la stampa, l'esercizio Q2
['bpChiudiSettimana', 'inviaPiano', 'salvaEsercizioQ2', 'bpAttiva'].forEach(nome => {
  const base = window[nome];
  if (typeof base !== 'function') return;
  window[nome] = async function (...args) { const r = await base.apply(this, args); caricaPianiCoach().then(() => render()); return r; };
});
const _segnaStampatoV5 = segnaStampato;
segnaStampato = function (w, y) { _segnaStampatoV5(w, y); setTimeout(render, 0); };

Object.assign(AZIONI, {
  'serie-una': () => rispondiSerie('una'),
  'serie-tutte': () => rispondiSerie('tutte'),
  'serie-annulla': () => rispondiSerie(null),
  'evt-sposta': el => apriSpostaEvento(el.dataset.evt),
  'sevt-giorno': el => { ui.sevt = { ...ui.sevt, giorno: el.dataset.v }; disegnaSpostaEvento(); },
  'sevt-libero': el => { ui.sevt = { ...ui.sevt, ora: el.dataset.v, giorno: el.dataset.g || ui.sevt.giorno }; disegnaSpostaEvento(); },
  'sevt-serie': el => { ui.sevt = { ...ui.sevt, tutte: el.dataset.v === 'tutte' }; disegnaSpostaEvento(); },
  'sevt-conferma': () => confermaSpostaEvento(),
  'sevt-promemoria': () => promemoriaOrganizzatore(),
  'sevt-ricollega': () => { closeModal('spostaEvtOverlay'); connectGoogleCalendar(); },
  'nevt-crea': () => creaNuovoEvento(),
  'b-ciclo': el => apriRapidoGiorno(el.dataset.v),
  'b-evento': el => apriNuovoEvento(el.dataset.v),
  'rapido-giorno': () => { ui.rapido = { ...ui.rapido, data: null }; disegnaRapido(); },
  'dp-tipo': el => { const q = parseInt(el.dataset.v, 10); ui.dp = { ...ui.dp, tipo: ui.dp.tipo === q ? null : q }; render(); },
  riordina: () => apriRiordina(false),
  'rio-chiudi': () => chiudiRiordina(),
  'rio-dacapo': () => apriRiordina(true),
  'rio-tipo': el => rioTipo(el.dataset.v),
  'rio-data': el => rioData(el.dataset.v),
  'rio-fatta': () => rioFatta(),
  'rio-spacchetta': () => rioSpacchetta(),
  'rio-salta': () => { rioConta('saltata', 1); ui.rio.saltate = [...(ui.rio.saltate || []), ui.rio.ids[ui.rio.i]]; rioSalta(1); },
  'rio-saltate': () => rioRivediSaltate(),
  'coach-vedi': () => vai('pianifica'),
  'coach-chiudi': el => vaiSettimanaE({ week: +el.dataset.w, year: +el.dataset.y }, () => openBpReview()),
  'coach-prepara': el => apriWizard(+el.dataset.w, +el.dataset.y)
});

// ══════════════════════════════════════════════════════════════
