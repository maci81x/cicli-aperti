// v10 (22/10) · CALENDARIO DI SCRITTURA = LAVORO
// I due «Cicli Aperti — Battle Plan» non ci sono più. L'app scrive su Lavoro (o su un altro calendario
// esistente scelto in Impostazioni), non crea calendari, e modifica/sposta/cancella SOLO i suoi eventi
// (proprietà privata cicli_aperti). Unica eccezione: i comandi che dai tu sul foglio di un appuntamento
// («Sposta», «Mettila tra le cose da fare e toglila dal calendario»), che passano da gcalFetchUtente.
// ══════════════════════════════════════════════════════════════
const CAL_SCRITTURA = { LAVORO: GCAL_CAL_PREFERITO, RUOLI: ['owner', 'writer'] };
const NON_APP = 'NON_APP';
const evDellApp = ev => !!(ev && ev.extendedProperties && ev.extendedProperties.private && ev.extendedProperties.private.cicli_aperti);
const _gcalFetchV10 = gcalFetch;
let _gcalUtente = false;
// ogni PATCH / PUT / DELETE su un evento esistente: prima si legge, e si va avanti solo se è dell'app
gcalFetch = function (path, method, body) {
  const m = String(method || 'GET').toUpperCase(), base = String(path || '').split('?')[0];
  if (m === 'POST' && /^\/calendars\/?$/.test(base)) return Promise.reject(new Error('L\'app non crea calendari'));
  const suEvento = /^\/calendars\/[^/]+\/events\/[^/]+$/.test(base);
  if (suEvento && ['PATCH', 'PUT', 'DELETE'].includes(m) && !_gcalUtente) return scriviSoloSeDellApp(path, m, body);
  return _gcalFetchV10(path, method, body);
};
async function scriviSoloSeDellApp(path, metodo, body) {
  const ev = await _gcalFetchV10(path.split('?')[0], 'GET');   // se non esiste più l'errore arriva a chi chiama, come prima
  if (!ev || !evDellApp(ev)) {
    console.warn('[GCal] evento non creato dall\'app: non lo tocco', path.split('?')[0]);
    const err = new Error('questo evento non l\'ha creato l\'app: non lo tocco');
    err.code = NON_APP;
    throw err;
  }
  return _gcalFetchV10(path, metodo, body);
}
// comando dato da te su un tuo appuntamento: passa senza il controllo
function gcalFetchUtente(path, method, body) {
  _gcalUtente = true;
  try { return gcalFetch(path, method, body); } finally { _gcalUtente = false; }
}

// Calendario di scrittura: quello scelto se esiste ancora, altrimenti Lavoro. Mai creato.
ui.calendari = null;   // i tuoi calendari scrivibili (per la scelta in Impostazioni)
const nomeCalScrittura = () => {
  const id = gcal.calendarId || calScelto();
  const c = (ui.calendari || []).find(x => x.id === id) || CAL_LETTURA.find(x => x.id === id);
  return c ? (c.nome || c.summary || id) : id;
};
async function calendariScrivibili() {
  const lista = await gcalFetch('/users/me/calendarList', 'GET');
  return ((lista && lista.items) || []).filter(c => CAL_SCRITTURA.RUOLI.includes(c.accessRole))
    .map(c => ({ id: c.id, nome: (CAL_LETTURA.find(x => x.id === c.id) || {}).nome || c.summaryOverride || c.summary || c.id }));
}
async function ensureGcalCalendar() {
  if (!isGcalTokenValid()) return;
  const scelto = calScelto();
  if (gcal.calendarId === scelto && ui.calVerificato) return;
  let id = CAL_SCRITTURA.LAVORO;
  if (scelto !== CAL_SCRITTURA.LAVORO) {
    try { ui.calendari = await calendariScrivibili(); } catch (e) { console.warn('[GCal] calendari:', e.message); }
    if ((ui.calendari || []).some(c => c.id === scelto)) id = scelto;
    else lsScrivi(LS5.CAL_SCRITTURA, null);   // quello scelto non c'è più: si torna a Lavoro
  }
  const cambiato = gcal.calendarId !== id;
  gcal.calendarId = id;
  ui.calVerificato = true;
  localStorage.setItem('gcal_cal_id', id);
  if (cambiato) await saveGcalTokenToDB();
}
// un id vecchio (localStorage gcal_cal_id o user_tokens.google_calendar_id) che non è quello di scrittura → Lavoro, subito
function normalizzaCalendario() {
  const giusto = calScelto();
  if (gcal.calendarId && gcal.calendarId !== giusto && giusto === CAL_SCRITTURA.LAVORO) {
    gcal.calendarId = giusto;
    try { localStorage.setItem('gcal_cal_id', giusto); } catch (_) { /* niente */ }
    if (isGcalTokenValid()) saveGcalTokenToDB();
  }
}
normalizzaCalendario();
const _loadGcalTokenFromDBV10 = loadGcalTokenFromDB;
loadGcalTokenFromDB = async function () { const r = await _loadGcalTokenFromDBV10.apply(this, arguments); normalizzaCalendario(); return r; };
// Impostazioni: si sceglie tra i calendari che hai (lista letta da Google), predefinito Lavoro
function sceltaCalScrittura() {
  const attuale = calScelto(), lista = ui.calendari || [{ id: CAL_SCRITTURA.LAVORO, nome: 'Lavoro' }];
  if (ui.calendari === null && isGcalTokenValid() && !ui.calendariCarico) {
    ui.calendariCarico = true;
    calendariScrivibili().then(l => { ui.calendari = l; render(); }).catch(e => console.warn('[GCal] calendari:', e.message)).finally(() => { ui.calendariCarico = false; });
  }
  const voci = lista.some(c => c.id === attuale) ? lista : [...lista, { id: attuale, nome: attuale }];
  return `<select class="input sel-inline" id="set-cal" data-act="set-cal" aria-label="Calendario dove scrivo">${voci.map(c => `<option value="${esc(c.id)}"${c.id === attuale ? ' selected' : ''}>${escHtml(c.nome)}</option>`).join('')}</select>`;
}

// Gli eventi dell'app: titolo «16.45 - titolo», popup all'ora e 10 minuti prima, link all'app, proprietà cicli_aperti
const PROMEMORIA_EVENTO = { useDefault: false, overrides: [{ method: 'popup', minutes: 0 }, { method: 'popup', minutes: 10 }] };
function corpoEvento(c, slot) {
  const durata = slot.durata || AVVISO.DURATA;
  const inizio = new Date(`${slot.data}T${slot.ora}:00`), fine = new Date(inizio.getTime() + durata * 60000);
  return { summary: titoloAvviso(slot.ora, c.title), description: `Cicli Aperti · appuntamento con te stesso\n${APP_URL}#ciclo=${c.id}`,
    start: { dateTime: `${slot.data}T${slot.ora}:00`, timeZone: 'Europe/Rome' },
    end: { dateTime: `${toISODate(fine)}T${hhmm(fine)}:00`, timeZone: 'Europe/Rome' },
    reminders: PROMEMORIA_EVENTO,
    extendedProperties: { private: { cicli_aperti: 'blocco', ciclo_id: c.id } } };
}
// togli: un evento che non è dell'app non si cancella, si scollega soltanto
const _togliBloccoV10 = togliBlocco;
togliBlocco = async function (c, silenzioso) {
  try { return await _togliBloccoV10(c, silenzioso); }
  catch (e) {
    if (e.code !== NON_APP) throw e;
    await patchCiclo(c.id, { calendar_event_id: null });
    if (!silenzioso) { render(); showToast('Scollegata: l\'evento sul calendario non è dell\'app e resta com\'è', 'info'); }
  }
};
// chiusa: avviso → cancellato; blocco futuro → cancellato; blocco passato → «✓» davanti al titolo. Solo eventi dell'app.
async function chiudiBlocco(c) {
  if (!c || !c.calendar_event_id || bloccoEsterno(c) || !isGcalTokenValid()) return;
  try {
    await ensureGcalCalendar();
    if (!gcal.calendarId) return;
    const ev = await eventoDellApp(c);
    if (!evDellApp(ev)) return;   // non è dell'app (o non c'è più): niente
    const inizio = ev.start && (ev.start.dateTime || ev.start.date);
    const futuro = inizio && new Date(inizio) > new Date();
    if (eAvviso(ev) || futuro) { await togliBlocco(ciclo(c.id) || c, true); return; }
    if (!/^✓ /.test(ev.summary || '')) await gcalFetch(`${percorsoEventi(c)}/${c.calendar_event_id}`, 'PATCH', { summary: '✓ ' + (ev.summary || c.title) });
  } catch (e) { if (!nonEsiste(e)) console.warn('[GCal] chiudi:', e.message); }
}

// In Oggi e nelle colonne: un evento dell'app collegato a una cosa non compare (si vede la cosa, con la sua ora)
const collegatoACosa = e => !!(e && e.app && e.cicloId);
const _leggiEventiV10 = leggiEventi;
leggiEventi = async function () { return (await _leggiEventiV10.apply(this, arguments)).filter(e => !collegatoACosa(e)); };
const _eventiDelGiornoV10 = eventiDelGiorno;
eventiDelGiorno = function (d) { return _eventiDelGiornoV10(d).filter(e => !collegatoACosa(e)); };

// Promemoria del Business Plan: «16.45 - Prepara il Business Plan» ogni venerdì 16:45–18:30 su Lavoro,
// saltando i giorni in cui a quell'ora c'è già un incontro col coach (o la sua preparazione).
const PROM = { SETTIMANE_SALTI: 26 };
async function saltiPerCoach(giorno, ora, durata) {
  const da = new Date(), a = new Date(Date.now() + PROM.SETTIMANE_SALTI * 7 * 864e5);
  const eventi = await _leggiEventiV10(da, a);
  const [h, m] = ora.split(':').map(Number);
  return eventi.filter(e => (e.coach || e.prepCoach) && giornoIdxDi(parseISODate(e.giorno)) === giorno && e.ora).filter(e => {
    const s = new Date(parseISODate(e.giorno)); s.setHours(h, m, 0, 0);
    const f = new Date(s.getTime() + durata * 60000);
    return e.inizioMs < f.getTime() && s.getTime() < (e.fineMs || e.inizioMs);
  }).map(e => `${e.giorno.replace(/-/g, '')}T${ora.replace(':', '')}00`);
}
async function corpoPromemoriaV10(tipo) {
  const desc = tipo === 'bp'
    ? `Il piano della prossima settimana: scegli le Q2, i cicli aperti realistici, distribuiscili nei giorni. Poi stampalo e mandalo al coach.\n${APP_URL}`
    : `Scegli le attività importanti dei prossimi 3 mesi e fissale in agenda.\n${APP_URL}`;
  const { ora } = quandoPiano();
  if (tipo === 'bp') {
    const { giorno } = quandoPiano(), durata = durataPiano(), d = prossimoGiorno(giorno, ora);
    const fine = new Date(`${toISODate(d)}T${ora}:00`); fine.setMinutes(fine.getMinutes() + durata);
    const salti = await saltiPerCoach(giorno, ora, durata);
    return { firma: `${giorno}|${ora}|${durata}|${calScelto()}|${salti.join(',')}`, corpo: {
      summary: titoloAvviso(ora, 'Prepara il Business Plan'), description: desc,
      start: { dateTime: `${toISODate(d)}T${ora}:00`, timeZone: 'Europe/Rome' }, end: { dateTime: `${toISODate(fine)}T${hhmm(fine)}:00`, timeZone: 'Europe/Rome' },
      recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${BYDAY[giorno]}`, ...(salti.length ? [`EXDATE;TZID=Europe/Rome:${salti.join(',')}`] : [])],
      reminders: PROMEMORIA_EVENTO, extendedProperties: { private: { cicli_aperti: 'promemoria', promemoria: 'bp' } } } };
  }
  const base = state.ultimoQ2 ? new Date(state.ultimoQ2) : new Date();
  const d = new Date(base); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + Q2.OGNI_GIORNI);
  const fine = new Date(`${toISODate(d)}T${ora}:00`); fine.setMinutes(fine.getMinutes() + 120);
  return { firma: `${toISODate(d)}|${ora}|${calScelto()}`, corpo: {
    summary: titoloAvviso(ora, 'Esercizio Q2'), description: desc,
    start: { dateTime: `${toISODate(d)}T${ora}:00`, timeZone: 'Europe/Rome' }, end: { dateTime: `${toISODate(fine)}T${hhmm(fine)}:00`, timeZone: 'Europe/Rome' },
    recurrence: ['RRULE:FREQ=MONTHLY;INTERVAL=3'], reminders: PROMEMORIA_EVENTO, extendedProperties: { private: { cicli_aperti: 'promemoria', promemoria: 'q2' } } } };
}
async function sincronizzaPromemoria(tipo, forza) {
  if (!isGcalTokenValid()) return null;
  await ensureGcalCalendar();
  if (!gcal.calendarId) return null;
  const tutti = leggiJson(LS5.PROM, {}), salvato = tutti[tipo] || {};
  try {
    const { firma, corpo } = await corpoPromemoriaV10(tipo);
    if (!forza && salvato.id && salvato.firma === firma && salvato.cal === gcal.calendarId) return salvato.id;
    let id = salvato.cal === gcal.calendarId ? salvato.id || null : null;   // id di un altro calendario (quello cancellato): non vale
    if (!id) {
      const qs = new URLSearchParams({ privateExtendedProperty: `promemoria=${tipo}`, maxResults: '5', showDeleted: 'false' });
      const res = await gcalFetch(`${percorsoEventi()}?${qs}`, 'GET');
      const trovato = ((res && res.items) || []).find(e => e.status !== 'cancelled' && evDellApp(e));
      id = trovato ? trovato.id : null;
    }
    if (id) {
      try { await gcalFetch(`${percorsoEventi()}/${id}`, 'PATCH', corpo); }
      catch (e) { if (!nonEsiste(e) && e.code !== NON_APP) throw e; id = null; }
    }
    if (!id) { const ev = await gcalFetch(percorsoEventi(), 'POST', corpo); id = ev && ev.id; }
    if (!id) return null;
    scriviJson(LS5.PROM, { ...leggiJson(LS5.PROM, {}), [tipo]: { id, firma, cal: gcal.calendarId } });
    return id;
  } catch (e) { console.warn(`[GCal] promemoria ${tipo}:`, e.message); return null; }
}

// ══════════════════════════════════════════════════════════════
// 22/10 sera · «È una cosa da fare» dal foglio di un appuntamento
// La cosa prende giorno e ora dell'appuntamento; il foglio chiede «Lo tolgo anche dal calendario?».
// Se resta sul calendario la cosa è collegata (calendar_event_id = 'ext:<id dell'evento>'): in Oggi si vede solo lei, con «dal calendario».
// ══════════════════════════════════════════════════════════════
const DAL_CAL = { LAMPO_MS: 1300 };
const TAG_DAL_CAL = '<span class="tag-cal" data-tip="Collegata a un appuntamento di Google Calendar"><i class="ti ti-calendar-event"></i>dal calendario</span>';
ui.evtNuova = null;   // { evtId, cicloId } finché il foglio aspetta la risposta
const idCollegato = c => bloccoEsterno(c) ? c.calendar_event_id.slice(4) : null;
const eventoCollegato = e => !!e && state.cicli.some(c => idCollegato(c) === e.id);
// già tra le cose da fare: collegata a questo evento, oppure una cosa aperta uguale o molto simile (vedi DOPPIONI)
const cosaDiEvento = e => state.cicli.find(c => idCollegato(c) === e.id) || (m => m && m.tipo === 'aperta' ? m.c : null)(trovaDoppione(e.titolo, { senzaEventi: true }));
const eventoDiSerie = e => !!(e && e.serie && e.serie !== e.id);

const _eventiDelGiornoDalCal = eventiDelGiorno;
eventiDelGiorno = function (d) { return _eventiDelGiornoDalCal(d).filter(e => !eventoCollegato(e)); };

async function eventoInElenco(id) {
  const e = eventoPerId(id);
  if (!e) return;
  const gia = cosaDiEvento(e);
  if (gia) { closeModal('evtOverlay'); apriDettaglio(gia.id); return; }
  const ctx = e.cal === 'privato' ? 'personale' : 'lavoro', ora = e.ora || null;
  try {
    const c = await upsertCiclo({ ...rigaNuova(e.titolo, { subito: false }, ctx),
      note: `Dal calendario ${nomeCalendario(e)}: «${e.titoloOrig || e.titolo}» del ${fmtGgMm(e.giorno)}`,
      scheduled_date: e.giorno, scheduled_time: ora,
      ...(state.ritualiColsOk && ora && e.minuti ? { durata_minuti: e.minuti } : {}),
      ...(ui.calEventColOk !== false ? { calendar_event_id: 'ext:' + e.id } : {}) });
    if (!c) throw new Error('la cosa non è stata salvata');
    state.cicli = [c, ...state.cicli.filter(x => x.id !== c.id)];
    await pianificaInData(ciclo(c.id) || c, parseISODate(e.giorno), fasciaDaOra(ora));
    ui.evtNuova = { evtId: e.id, cicloId: c.id };
    disegnaDomandaEvento(e);
  } catch (err) { showToast('Non riesco: ' + err.message, 'error'); }
}
function disegnaDomandaEvento(e) {
  const b = (v, cls, testo) => `<button type="button" class="btn ${cls} btn-block" data-act="evt-togli" data-v="${v}">${testo}</button>`;
  const quando = `${fmtGiornoLungo(parseISODate(e.giorno))}${e.ora ? ` alle <span class="mono">${e.ora}</span>` : ''}`;
  const fatta = `<p class="t-body evt-fatta"><i class="ti ti-circle-check" aria-hidden="true"></i><span>Messa tra le cose da fare: ${quando}.</span></p>`;
  // invito di un'altra persona: toglierlo sarebbe rifiutarlo (e l'organizzatore riceve l'avviso) → solo nell'app
  if (!e.orgIo) {
    $('evt-corpo').innerHTML = `${fatta}
      <div class="evt-domanda">${b('no', 'btn-secondary', 'Ok, nascondilo nell\'app')}</div>
      <p class="t-label muted evt-invito">È un invito di ${escHtml(e.org || 'un\'altra persona')}: per rifiutarlo usa Google Calendar.</p>`;
    return;
  }
  const si = eventoDiSerie(e)
    ? b('una', 'btn-secondary', 'Sì, solo questa volta') + b('serie', 'btn-secondary', 'Sì, tutta la serie')
    : b('una', 'btn-secondary', 'Sì, toglilo');
  $('evt-corpo').innerHTML = `${fatta}
    <h4 class="t-title" id="evt-domanda">Lo tolgo anche dal calendario?</h4>
    <div class="evt-domanda" role="group" aria-labelledby="evt-domanda">${si}${b('no', 'btn-ghost', 'No, lascialo')}</div>`;
}
async function rispondiTogliEvento(v) {
  const n = ui.evtNuova;
  if (!n) return;
  const e = eventoPerId(n.evtId);
  if (v !== 'no' && e && e.orgIo) {   // mai su un invito: sarebbe rifiutarlo
    const bersaglio = v === 'serie' && eventoDiSerie(e) ? e.serie : e.id;
    try { await gcalFetchUtente(`/calendars/${encodeURIComponent(e.calId)}/events/${encodeURIComponent(bersaglio)}`, 'DELETE'); }   // comando di Roby
    catch (err) { if (!nonEsiste(err)) { showToast('Non riesco a toglierlo dal calendario: ' + err.message, 'error'); return; } }
    if (ui.calEventColOk !== false) await patchCiclo(n.cicloId, { calendar_event_id: null });
    const via = x => bersaglio === e.serie ? (x.serie || x.id) !== e.serie : x.id !== e.id;
    ui.eventi = Object.fromEntries(Object.entries(ui.eventi).map(([k, lista]) => [k, Array.isArray(lista) ? lista.filter(via) : lista]));
  }
  ui.evtNuova = null;
  _closeModalDalCal('evtOverlay');
  render();
  lampeggia(n.cicloId);
}
// la riga nuova lampeggia una volta
function lampeggia(id) {
  requestAnimationFrame(() => {
    const el = document.querySelector(`#view .item[data-id="${id}"]`);
    if (!el) return;
    el.scrollIntoView({ block: 'nearest' });
    el.classList.add('lampo');
    setTimeout(() => el.classList.remove('lampo'), DAL_CAL.LAMPO_MS);
  });
}
// mentre il foglio aspetta la risposta: la X vale «No, lascialo», il tocco fuori non chiude
const _closeModalDalCal = closeModal;
closeModal = function (id) {
  if (id === 'evtOverlay' && ui.evtNuova) { rispondiTogliEvento('no'); return; }
  return _closeModalDalCal.apply(this, arguments);
};
const _closeModalOnBgDalCal = closeModalOnBg;
closeModalOnBg = function (ev, id) {
  if (id === 'evtOverlay' && ui.evtNuova) return;
  return _closeModalOnBgDalCal.apply(this, arguments);
};
AZIONI['evt-in-elenco'] = el => eventoInElenco(el.dataset.evt);
AZIONI['evt-togli'] = el => rispondiTogliEvento(el.dataset.v);
document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape' && ui.evtNuova && $('evtOverlay').classList.contains('open')) { ev.preventDefault(); ev.stopImmediatePropagation(); rispondiTogliEvento('no'); }
}, true);
const _apriFoglioEventoDalCal = apriFoglioEvento;
apriFoglioEvento = function (id) { ui.evtNuova = null; return _apriFoglioEventoDalCal(id); };

// ══════════════════════════════════════════════════════════════
// 22/10 · DOPPIONI · il confronto tra due titoli, in locale (senza AI)
// simile(a, b) → { livello: 'uguale' | 'molto' | 'forse' | 'parente' | null, punteggio }
// uguale = stesse parole (ordine libero, piccoli errori ammessi) · molto = quasi le stesse, stessi nomi ·
// forse = da guardare (solo nella pulizia) · parente = stesso nome proprio o cliente
// ══════════════════════════════════════════════════════════════
const DOPP = { MOLTO: 0.75, FORSE: 0.5, FATTE_GIORNI: 30, AGENDA_GIORNI: 14, LS_NO: 'doppioni_no' };
const DOPP_VUOTE = new Set(('il lo la i gli le l un una uno di a ad da in con su per tra fra del dello della dei degli delle dell al allo alla ai agli alle all ' +
  'dal dallo dalla dai dagli dalle nel nello nella nei negli nelle sul sullo sulla sui sugli sulle e ed o od anche che come cosa cose fare fatto fatta fatte ' +
  'devo deve devi dovrei bisogna mi ti si ci vi ne non piu poi questo questa questi queste quello quella quelli quelle mio mia miei mie tuo tua suo sua ' +
  'loro nostro nostra io tu lui lei noi voi c d s ma se entro dopo prima oppure')
  .split(' '));
// parole che non sono mai un nome proprio, anche con la maiuscola
const DOPP_COMUNI = new Set(('preventivo preventivi mail email cliente clienti controllo controllare gestione gestire app strategia definizione partner program ' +
  'corso corsi date fatture fattura agenti agente formazione tempo lettera riunione piani piano incentivi scheda organizzazione q1 q2 q3 q4 report call ' +
  'appuntamento calendario sopralluogo progetto ufficio area chiamare chiamata incontro visita').split(' '));
// parole troppo generiche per dire «è la stessa cosa» insieme a un nome
const DOPP_GENERICHE = new Set('attivita gestione gestire punto situazione elenco info tempo mail email lavoro'.split(' '));

const togliAccenti = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
const parolaPulita = w => togliAccenti(w).toLowerCase().replace(/[^a-z0-9]/g, '');
function distanza(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prima = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const riga = [i];
    let minimo = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prima[j] + 1, riga[j - 1] + 1, prima[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      riga.push(v);
      if (v < minimo) minimo = v;
    }
    if (minimo > max) return max + 1;
    prima = riga;
  }
  return prima[b.length];
}
// stessa parola: uguale, un piccolo errore («preventvo»), o la stessa radice («preventivo» / «preventivi»)
function stessaParola(x, y, nomi) {
  if (x === y) return true;
  if (/\d/.test(x + y)) return false;   // i numeri: solo uguali
  const corta = Math.min(x.length, y.length);
  if (nomi && (corta < 6 || x[0] !== y[0] || x[x.length - 1] !== y[y.length - 1])) return false;   // Rosseti/Rossetti sì, Marco/Mario e Francesco/Francesca no
  if (corta >= 5 && distanza(x, y, corta >= 8 ? 2 : 1) <= (corta >= 8 ? 2 : 1)) return true;
  return !nomi && corta >= 6 && x.slice(0, 6) === y.slice(0, 6) && Math.abs(x.length - y.length) <= 3;
}
const _paroleCache = new Map();
// le parole di un titolo, senza quelle vuote; nome = nome proprio o cliente (dalla maiuscola o da `nomi`)
function paroleDopp(titolo) {
  const t = String(titolo || '').replace(/\[[^\]]*\]/g, ' ').replace(/^\s*\d{1,2}(?:[.:]\d{2})?\s*[-–—]\s*/, '');   // etichette [TEST] e «10 - …» degli appuntamenti
  if (_paroleCache.has(t)) return _paroleCache.get(t);
  const tuttoMaiuscolo = !/[a-zà-ÿ]/.test(t);
  const segmenti = t.split(/\s[-–—]\s|\s[-–—]|[-–—]\s|[+:/(),.;!?"«»]/).map(s => s.trim()).filter(Boolean);
  const out = [];
  segmenti.forEach((seg, si) => {
    const grezze = seg.replace(/['’`]/g, ' ').split(/\s+/).filter(Boolean);
    grezze.forEach((raw, j) => {
      const p = parolaPulita(raw);
      if (!p || DOPP_VUOTE.has(p)) return;
      const lettere = togliAccenti(raw).replace(/[^A-Za-z]/g, '');
      const maiusc = /^[A-ZÀ-Ý]/.test(raw);
      const nome = !tuttoMaiuscolo && !DOPP_COMUNI.has(p) && !!lettere && (
        (lettere.length >= 2 && lettere === lettere.toUpperCase()) ||          // sigla: DV, BE PROF, LUNA
        /[a-z][A-Z]/.test(raw) ||                                              // BeProf, iProfile
        (maiusc && j > 0 && p.length >= 3) ||                                  // maiuscola in mezzo alla frase
        (maiusc && si === 0 && segmenti.length > 1 && grezze.length <= 2 && p.length >= 3));   // «Arillo - Preventivo»
      out.push({ p, nome, primo: si === 0 && j === 0 });
    });
  });
  _paroleCache.set(t, out);
  return out;
}
// «be prof» / «beprof»: due parole vicine che insieme sono una parola dell'altro titolo
function unisciVicine(X, Y) {
  const out = [];
  for (let i = 0; i < X.length; i++) {
    const a = X[i], b = X[i + 1];
    if (b) {
      const insieme = a.p + b.p;
      const y = Y.find(w => w.p.length >= 5 && stessaParola(w.p, insieme));
      if (y && !Y.some(w => w.p === a.p || w.p === b.p)) { out.push({ p: insieme, nome: a.nome || b.nome || y.nome }); i++; continue; }
    }
    out.push(a);
  }
  return out;
}
// scritto di corsa (niente maiuscole dopo la prima lettera) o prima parola: i nomi si riconoscono da quelli già noti
const scrittoMinuscolo = t => !/[A-ZÀ-Ý]/.test(String(t || '').trim().slice(1));
function simile(a, b, nomi) {
  const conNomi = t => w => ({ ...w, nome: w.nome || (!!nomi && (w.primo || scrittoMinuscolo(t)) && nomi.has(w.p)) });   // la maiuscola non dice niente: prima parola o tutto minuscolo
  let A = paroleDopp(a).map(conNomi(a)), B = paroleDopp(b).map(conNomi(b));
  A = unisciVicine(A, B); B = unisciVicine(B, A);
  if (!A.length || !B.length) return { livello: null, punteggio: 0 };
  const usate = new Set(), coppie = [];
  A.forEach((x, i) => {
    let j = B.findIndex((y, k) => !usate.has(k) && y.p === x.p);
    if (j < 0) j = B.findIndex((y, k) => !usate.has(k) && stessaParola(x.p, y.p, x.nome || y.nome));
    if (j >= 0) { usate.add(j); coppie.push([i, j]); }
  });
  const n = coppie.length, punteggio = 2 * n / (A.length + B.length);
  if (n === A.length && n === B.length) return { livello: 'uguale', punteggio: 1 };
  const presiA = new Set(coppie.map(c => c[0])), presiB = new Set(coppie.map(c => c[1]));
  const nomiFuori = (X, presi) => X.some((w, i) => w.nome && !presi.has(i));
  const nomiDiversi = nomiFuori(A, presiA) && nomiFuori(B, presiB);
  const conNome = coppie.filter(([i, j]) => A[i].nome && B[j].nome).length;   // lo stesso nome, per tutti e due
  const altre = coppie.filter(([i, j]) => !A[i].nome && !B[j].nome);
  const altreVere = altre.filter(([i]) => !DOPP_GENERICHE.has(A[i].p)).length;
  if (!nomiDiversi && altre.length && (punteggio >= DOPP.MOLTO || (conNome && altreVere))) return { livello: 'molto', punteggio };
  if (conNome) return { livello: 'parente', punteggio };
  const ultime = presiA.has(A.length - 1) && presiB.has(B.length - 1);   // finiscono con la stessa parola («… della settimana»)
  if (!nomiDiversi && altre.length >= 2 && punteggio >= DOPP.FORSE && ultime) return { livello: 'forse', punteggio };
  return { livello: null, punteggio };
}
const LIV_DOPP = { uguale: 4, molto: 3, forse: 2, parente: 1 };
// gruppi di doppioni in una lista di cose { id, title, created_at }: uguale / molto (e forse, «da guardare»)
function gruppiDoppioni(lista, nomi) {
  const padre = new Map(lista.map(c => [c.id, c.id]));
  const radice = id => { while (padre.get(id) !== id) id = padre.get(id); return id; };
  const coppie = [];
  for (let i = 0; i < lista.length; i++) for (let j = i + 1; j < lista.length; j++) {
    const s = simile(lista[i].title, lista[j].title, nomi);
    if (s.livello && s.livello !== 'parente') { coppie.push({ a: lista[i].id, b: lista[j].id, livello: s.livello }); padre.set(radice(lista[i].id), radice(lista[j].id)); }
  }
  const gruppi = new Map();
  lista.forEach(c => { const r = radice(c.id); if (r !== c.id || coppie.some(p => p.a === c.id || p.b === c.id)) gruppi.set(r, [...(gruppi.get(r) || []), c]); });
  return [...gruppi.values()].filter(g => g.length > 1).map(cose => {
    const ids = new Set(cose.map(c => c.id)), livelli = coppie.filter(p => ids.has(p.a)).map(p => p.livello);
    const tipo = livelli.every(l => l === 'uguale') ? 'uguali' : livelli.some(l => l !== 'forse') ? 'simili' : 'da guardare';
    const ordinate = cose.slice().sort((x, y) => String(x.created_at).localeCompare(String(y.created_at)));
    return { chiave: ordinate.map(c => c.id).sort().join('|'), tipo, cose: ordinate };
  }).sort((x, y) => ['uguali', 'simili', 'da guardare'].indexOf(x.tipo) - ['uguali', 'simili', 'da guardare'].indexOf(y.tipo));
}

// ─── Dove cercare: cose aperte, fatte negli ultimi 30 giorni, appuntamenti delle prossime 2 settimane ───
let _nomiNoti = { chiave: '', nomi: new Set() };
function nomiNoti() {
  const chiave = `${state.cicli.length}:${(state.persone || []).length}`;
  if (_nomiNoti.chiave === chiave) return _nomiNoti.nomi;
  const nomi = new Set([...state.cicli.flatMap(c => paroleDopp(c.title).filter(w => w.nome).map(w => w.p)),
    ...(state.persone || []).flatMap(p => String(p.nome || '').split(/\s+/).map(parolaPulita).filter(x => x.length >= 3))]);
  _nomiNoti = { chiave, nomi };
  return nomi;
}
const forte = l => l === 'uguale' || l === 'molto';
const giornoIso = s => String(s || '').slice(0, 10);
// la corrispondenza migliore in una lista (solo i livelli accettati)
function migliore(titolo, lista, livelli, testo) {
  const nomi = nomiNoti();
  let meglio = null;
  for (const x of lista) {
    const s = simile(titolo, testo(x), nomi);
    if (!s.livello || !livelli.includes(s.livello)) continue;
    if (!meglio || LIV_DOPP[s.livello] > LIV_DOPP[meglio.livello] || (s.livello === meglio.livello && s.punteggio > meglio.punteggio)) meglio = { x, livello: s.livello };
  }
  return meglio;
}
const coseAperteDopp = salta => state.cicli.filter(c => !c.done && !c.parent_id && !(salta && salta.has(c.id)));
function fatteDiRecente() {
  const limite = toISODate(piuGiorni(new Date(), -DOPP.FATTE_GIORNI));
  return state.cicli.filter(c => c.done && !c.parent_id && giornoIso(c.chiuso_at || c.updated_at) >= limite);
}
function eventiProssimiDopp() {
  const da = oggiLocale(), a = toISODate(piuGiorni(new Date(), DOPP.AGENDA_GIORNI)), visti = new Set();
  return Object.values(ui.eventi || {}).flat().filter(e => e && e.giorno >= da && e.giorno <= a && !e.app && !e.routine && !eventoCollegato(e) && !visti.has(e.id) && visti.add(e.id));
}
// gli appuntamenti delle prossime 2 settimane (dalla copia se Google non è collegato)
async function caricaEventiDopp() {
  if (!isGcalTokenValid()) return;
  const settimane = new Map();
  for (let n = 0; n <= DOPP.AGENDA_GIORNI; n += 7) { const w = isoWeekParts(piuGiorni(new Date(), n)); settimane.set(`${w.year}-${w.week}`, w); }
  const w = isoWeekParts(piuGiorni(new Date(), DOPP.AGENDA_GIORNI)); settimane.set(`${w.year}-${w.week}`, w);
  for (const s of settimane.values()) { try { await caricaEventi(s.week, s.year); } catch (err) { console.warn('[Doppioni] appuntamenti:', err.message); } }
}
// { tipo: 'aperta' | 'fatta' | 'evento' | 'parente', livello, c | e }
function trovaDoppione(titolo, opz = {}) {
  if (!String(titolo || '').trim()) return null;
  const aperta = migliore(titolo, coseAperteDopp(opz.salta), ['uguale', 'molto'], c => c.title);
  if (aperta) return { tipo: 'aperta', livello: aperta.livello, c: aperta.x };
  const fatta = migliore(titolo, fatteDiRecente(), ['uguale', 'molto'], c => c.title);
  if (fatta) return { tipo: 'fatta', livello: fatta.livello, c: fatta.x };
  if (!opz.senzaEventi) {
    const ev = migliore(titolo, eventiProssimiDopp(), ['uguale', 'molto'], e => e.titolo);
    if (ev) return { tipo: 'evento', livello: ev.livello, e: ev.x };
  }
  const parente = migliore(titolo, coseAperteDopp(opz.salta), ['parente'], c => c.title);
  return parente ? { tipo: 'parente', livello: 'parente', c: parente.x } : null;
}
const GG_SETT = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
const giornoEvento = e => `${GG_SETT[parseISODate(e.giorno).getDay()]} ${fmtGgMm(e.giorno)}`;
const etichettaDopp = m => !m || !forte(m.livello) ? '' : `<span class="tag-dopp" data-tip="${esc(testoDopp(m))}"><i class="ti ti-copy" aria-hidden="true"></i>${m.livello === 'uguale' ? 'c\'è già' : 'simile'}</span>`;
function testoDopp(m) {
  if (m.tipo === 'aperta') return `C'è già: ${m.c.title} (${TIPI[m.c.q] ? TIPI[m.c.q].label : 'Importante'}, dal ${fmtGgMm(giornoIso(m.c.created_at))})`;
  if (m.tipo === 'fatta') return `L'hai già fatta il ${fmtGgMm(giornoIso(m.c.chiuso_at || m.c.updated_at))}: la riapro o ne faccio una nuova?`;
  if (m.tipo === 'evento') return `In agenda c'è già: ${m.e.titoloOrig || m.e.titolo}, ${giornoEvento(m.e)}`;
  return `Vedi anche: ${m.c.title}`;
}

// ─── Il foglio «C'è già» (una voce alla volta) ───
document.body.insertAdjacentHTML('beforeend', `
<div class="modal-overlay" id="doppOverlay" onclick="if(event.target===this)rispondiDopp('annulla')">
  <div class="modal sheet sheet-narrow" role="dialog" aria-modal="true" aria-labelledby="dopp-titolo">
    <div class="sheet-grab"></div>
    <div class="sheet-head"><h3 class="t-title" id="dopp-titolo">C'è già?</h3><button type="button" class="btn btn-icon" onclick="rispondiDopp('annulla')" aria-label="Chiudi"><i class="ti ti-x"></i></button></div>
    <div id="dopp-corpo"></div>
  </div>
</div>`);
let _doppRisposta = null;
function chiediDoppione(titolo, m, opz = {}) {
  const b = (v, cls, testo) => `<button type="button" class="btn ${cls} btn-block" data-act="dopp-scelta" data-v="${v}">${testo}</button>`;
  const tasti = m.tipo === 'aperta'
    ? b('salta', 'btn-primary', 'È quella, non aggiungere') + (opz.senzaPasso ? '' : b('passo', 'btn-secondary', 'Aggiungi come passo di quella')) + b('aggiungi', 'btn-ghost', 'Aggiungi comunque')
    : m.tipo === 'fatta' ? b('riapri', 'btn-primary', 'Riaprila') + b('aggiungi', 'btn-secondary', 'Fanne una nuova')
    : b('collega', 'btn-primary', 'Collegala all\'appuntamento') + b('aggiungi', 'btn-ghost', 'Aggiungi comunque');
  $('dopp-titolo').textContent = m.tipo === 'evento' ? 'È già in agenda?' : m.tipo === 'fatta' ? 'L\'hai già fatta?' : 'C\'è già?';
  $('dopp-corpo').innerHTML = `${opz.conto ? `<p class="t-caption muted">${opz.conto}</p>` : ''}
    <p class="t-label muted">Stai aggiungendo «${escHtml(titolo)}»</p>
    <p class="t-body dopp-domanda">${escHtml(testoDopp(m))}${m.tipo === 'fatta' ? `<small>${escHtml(m.c.title)}</small>` : ''}</p>
    <div class="evt-domanda">${tasti}</div>`;
  $('doppOverlay').classList.add('open');
  return new Promise(ok => { _doppRisposta = ok; });
}
function rispondiDopp(v) {
  const ok = _doppRisposta;
  _doppRisposta = null;
  $('doppOverlay').classList.remove('open');
  if (ok) ok(v);
}
AZIONI['dopp-scelta'] = el => rispondiDopp(el.dataset.v);
document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape' && _doppRisposta && $('doppOverlay').classList.contains('open')) { ev.preventDefault(); ev.stopImmediatePropagation(); rispondiDopp('annulla'); }
}, true);

// una cosa con giorno e ora dell'appuntamento, collegata (in Oggi si vede solo lei, «dal calendario»)
async function creaCosaDaEvento(e, titolo, ctx) {
  const ora = e.ora || null;
  const c = await upsertCiclo({ ...rigaNuova(titolo, { subito: false }, ctx), note: `Dal calendario ${nomeCalendario(e)}: «${e.titoloOrig || e.titolo}» del ${fmtGgMm(e.giorno)}`,
    scheduled_date: e.giorno, scheduled_time: ora, ...(state.ritualiColsOk && ora && e.minuti ? { durata_minuti: e.minuti } : {}),
    ...(ui.calEventColOk !== false ? { calendar_event_id: 'ext:' + e.id } : {}) });
  if (!c) throw new Error('la cosa non è stata salvata');
  state.cicli = [c, ...state.cicli.filter(x => x.id !== c.id)];
  await pianificaInData(ciclo(c.id) || c, parseISODate(e.giorno), fasciaDaOra(ora));
  return ciclo(c.id) || c;
}
async function creaPassoDi(madre, v, ctx) {
  const p = await upsertCiclo({ ...rigaNuova(v.title, { subito: v.q === 1 }, ctx), q: madre.q === 1 ? 1 : 2, cat: madre.cat, macro_area: madre.macro_area, ...(state.passiColOk ? { parent_id: madre.id } : {}) });
  if (p) state.cicli = [p, ...state.cicli];
  return p;
}

// ─── Quando aggiungi («+», campo del telefono, Ricordami): prima di salvare, una domanda per ogni doppione ───
async function decidiDoppioni(voci) {
  await caricaEventiDopp();
  const trovate = voci.map(v => ({ v, m: trovaDoppione(v.title) })).map(x => ({ ...x, m: x.m && forte(x.m.livello) ? x.m : null }));
  const da = trovate.filter(x => x.m);
  const scelte = [];
  for (const x of trovate) {
    if (!x.m) { scelte.push({ ...x, scelta: 'aggiungi' }); continue; }
    const conto = da.length > 1 ? `${da.indexOf(x) + 1} di ${da.length}` : '';
    const scelta = await chiediDoppione(x.v.title, x.m, { conto, senzaPasso: !!(x.v.passi || []).length || !state.passiColOk });
    if (scelta === 'annulla') return null;
    scelte.push({ ...x, scelta });
  }
  return scelte;
}
const _aggiungiFrasiDopp = aggiungiFrasi;
aggiungiFrasi = async function (voci, r) {
  if (r && r.cusc) return _aggiungiFrasiDopp(voci, r);   // urgenza arrivata: va nel cuscinetto com'è
  const scelte = await decidiDoppioni(voci);
  if (!scelte) return null;
  const nuove = scelte.some(s => s.scelta === 'aggiungi') ? await _aggiungiFrasiDopp(scelte.filter(s => s.scelta === 'aggiungi').map(s => s.v), r) : [];
  if (!nuove) return null;
  const ctx = state.ctx, fatti = [];
  try {
    for (const s of scelte) {
      if (s.scelta === 'salta') fatti.push(`Non aggiunta: c'è già «${s.m.c.title}»`);
      else if (s.scelta === 'passo') { const p = await creaPassoDi(s.m.c, s.v, ctx); if (p) { nuove.push(p); fatti.push(`Passo di «${s.m.c.title}»`); } }
      else if (s.scelta === 'riapri') { await flipDone(s.m.c.id, true); fatti.push(`Riaperta «${s.m.c.title}»`); }
      else if (s.scelta === 'collega') { const c = await creaCosaDaEvento(s.m.e, s.v.title, ctx); nuove.push(c); fatti.push('Collegata all\'appuntamento'); }
    }
  } catch (err) { showToast('Non riesco: ' + err.message, 'error'); }
  if (fatti.length) { render(); showToast(fatti.length === 1 ? fatti[0] : `${fatti.length} cose sistemate`, 'success'); }
  return nuove;
};

// ─── Il riepilogo prima di salvare: «c'è già» / «simile», e «Vedi anche» per i parenti ───

// ─── Plaud: le cose che ci sono già partono senza spunta, con «c'è già» (si possono riattivare) ───
const _preparaPlaudDopp = preparaPlaud;
preparaPlaud = function (r, fonte) {
  const p = _preparaPlaudDopp(r, fonte);
  return { ...p, cose: p.cose.map(c => { const m = trovaDoppione(c.title, { senzaEventi: true }); return m && forte(m.livello) ? { ...c, scelta: false, gia: m } : c; }) };
};
const _voceAnteprimaPlaudDopp = voceAnteprimaPlaud;
voceAnteprimaPlaud = function (c) {
  const h = _voceAnteprimaPlaudDopp(c);
  return c.gia ? h.replace('</span></label>', `</span>${etichettaDopp(c.gia)}</label>`).replace('<div class="plaud-item-meta">', `<div class="plaud-item-note dopp-nota">${escHtml(testoDopp(c.gia))}</div><div class="plaud-item-meta">`) : h;
};

// ─── «È una cosa da fare»: già aperta → il dettaglio (come prima, ora anche se è scritta un po' diversa); fatta da poco → riapro o nuova ───
const _eventoInElencoDopp = eventoInElenco;
eventoInElenco = async function (id) {
  const e = eventoPerId(id);
  if (e && !cosaDiEvento(e)) {
    const m = trovaDoppione(e.titolo, { senzaEventi: true });
    if (m && m.tipo === 'fatta') {
      const scelta = await chiediDoppione(e.titolo, m);
      if (scelta === 'annulla') return;
      if (scelta === 'riapri') { await flipDone(m.c.id, true); closeModal('evtOverlay'); render(); apriDettaglio(m.c.id); return; }
    }
  }
  return _eventoInElencoDopp(id);
};

// ─── Altro → Doppioni: i gruppi tra le cose aperte, «Unisci» e «Non sono doppioni» ───
ui.doppTieni = {};
const doppioniNo = () => leggiJson(DOPP.LS_NO, []);
const TIPO_GRUPPO = { uguali: 'Uguali', simili: 'Simili', 'da guardare': 'Da guardare' };
function rigaDopp(c, k, tieni) {
  const passi = state.cicli.filter(p => p.parent_id === c.id && !p.done).length;
  const info = [TIPI[c.q] ? TIPI[c.q].label : '', `dal ${fmtGgMm(giornoIso(c.created_at))}`, passi ? plurale(passi, 'passo', 'passi') : '', isParcheggiato(c) ? 'Un giorno' : '', c.note ? 'con una nota' : ''].filter(Boolean).join(' · ');
  return `<label class="riga-link dopp-riga"><input type="radio" name="dopp-${esc(k)}" data-dopp-k="${esc(k)}" value="${c.id}"${c.id === tieni ? ' checked' : ''}>
    <span>${escHtml(c.title)}<small>${escHtml(info)}</small></span><span class="t-caption muted">${c.id === tieni ? 'tengo questa' : ''}</span><span></span></label>`;
}
function vistaDoppioni() {
  const gruppi = gruppiAperti();
  let h = `${indietro('altro', 'Altro')}<div class="vh"><div><h1>Doppioni</h1></div></div>
    <p class="t-label muted dopp-intro">Cose aperte che sembrano la stessa. «Unisci» tiene quella scelta (di solito la più vecchia), ci copia note e date delle altre, sposta passi e deleghe e chiude le altre come «unita a…». Niente si cancella.</p>`;
  if (!gruppi.length) return h + vuoto('ti-copy-check', 'Nessun doppione', 'Quando due cose aperte si somigliano compaiono qui.');
  gruppi.forEach(g => {
    const tieni = g.cose.some(c => c.id === ui.doppTieni[g.chiave]) ? ui.doppTieni[g.chiave] : g.cose[0].id;
    h += `<p class="list-head"><span>${TIPO_GRUPPO[g.tipo]}</span><span class="mono">${g.cose.length}</span></p>
      <div class="group dopp-gruppo" data-k="${esc(g.chiave)}">${g.cose.map(c => rigaDopp(c, g.chiave, tieni)).join('')}
        <div class="dopp-azioni"><button type="button" class="btn btn-primary btn-sm" data-act="dopp-unisci" data-k="${esc(g.chiave)}"><i class="ti ti-arrows-join"></i>Unisci</button>
        <button type="button" class="btn btn-ghost btn-sm" data-act="dopp-no" data-k="${esc(g.chiave)}">Non sono doppioni</button></div></div>`;
  });
  return h;
}
document.addEventListener('change', ev => {
  const t = ev.target;
  if (!t.dataset || !t.dataset.doppK) return;
  ui.doppTieni = { ...ui.doppTieni, [t.dataset.doppK]: t.value };
  render();
});
const campiUnione = () => ['note', 'done', 'chiuso_at', 'execution_status', 'persone_menzionate', ...(state.passiColOk ? ['parent_id'] : []), ...(state.delegaColsOk ? ['delega_persona_id', 'delega_controllo'] : [])];
function notaUnione(c) {
  const date = [`creata il ${fmtGgMm(giornoIso(c.created_at))}`, c.pianificato_data ? `giorno ${fmtGgMm(c.pianificato_data)}` : '', c.due_date ? `scadenza ${fmtGgMm(c.due_date)}` : '', c.delega_controllo ? `controllo ${fmtGgMm(c.delega_controllo)}` : ''].filter(Boolean).join(', ');
  return `— Unita: «${c.title}» (${date})${c.note ? '\n' + c.note : ''}`;
}
async function annullaUnione(prima, assegnazioni) {
  try {
    for (const x of prima) await patchCiclo(x.id, x.campi);
    for (const a of assegnazioni) await db.from('assegnazioni').update({ ciclo_id: a.ciclo_id }).eq('id', a.id);
    render();
    showToast('Unione annullata', 'info');
  } catch (err) { showToast('Non riesco ad annullare: ' + err.message, 'error'); }
}
AZIONI['dopp-unisci'] = el => unisciGruppo(el.dataset.k);
AZIONI['dopp-no'] = el => {
  const k = el.dataset.k;
  scriviJson(DOPP.LS_NO, unici([...doppioniNo(), k]));
  render();
  showToast('Non te li propongo più', 'info', { annulla: () => { scriviJson(DOPP.LS_NO, doppioniNo().filter(x => x !== k)); render(); } });
};
const _vistaAltroDopp = vistaAltro;
vistaAltro = function () {
  if (ui.sub === 'doppioni') return vistaDoppioni();
  const n = gruppiAperti().length;
  const riga = `<button type="button" class="riga-link" data-act="sub" data-tab="altro" data-sub="doppioni"><i class="ti ti-copy"></i><span>Doppioni<small>${n ? plurale(n, 'gruppo da guardare', 'gruppi da guardare') : 'nessuno'}</small></span><span></span><i class="ti ti-chevron-right"></i></button>`;
  return _vistaAltroDopp().replace('<button type="button" class="riga-link" data-act="sub" data-tab="altro" data-sub="guida">', riga + '<button type="button" class="riga-link" data-act="sub" data-tab="altro" data-sub="guida">');
};

const _avviaAppV9 = avviaApp;
avviaApp = function (sessione) {
  const prima = _appAvviata;
  _avviaAppV9(sessione);
  if (prima) return;
  controllaClaudeServer().then(() => { if (ui.tab === 'altro') render(); });
  caricaEventiFatti().catch(err => console.warn('[Appuntamenti] spunte:', err.message));
};

