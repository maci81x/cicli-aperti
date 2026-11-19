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
ensureGcalCalendar = async function () {
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
};
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
corpoEvento = function (c, slot) {
  const durata = slot.durata || AVVISO.DURATA;
  const inizio = new Date(`${slot.data}T${slot.ora}:00`), fine = new Date(inizio.getTime() + durata * 60000);
  return { summary: titoloAvviso(slot.ora, c.title), description: `Cicli Aperti · appuntamento con te stesso\n${APP_URL}#ciclo=${c.id}`,
    start: { dateTime: `${slot.data}T${slot.ora}:00`, timeZone: 'Europe/Rome' },
    end: { dateTime: `${toISODate(fine)}T${hhmm(fine)}:00`, timeZone: 'Europe/Rome' },
    reminders: PROMEMORIA_EVENTO,
    extendedProperties: { private: { cicli_aperti: 'blocco', ciclo_id: c.id } } };
};
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
chiudiBlocco = async function (c) {
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
};

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
sincronizzaPromemoria = async function (tipo, forza) {
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
};

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

eventoInElenco = async function (id) {
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
};
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
const suggerimentoParente = m => m && m.tipo === 'parente' ? `<p class="dopp-parente"><i class="ti ti-link" aria-hidden="true"></i>Vedi anche: ${escHtml(m.c.title)}</p>` : '';

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
const _disegnaAnteprimaDopp = disegnaAnteprima;
disegnaAnteprima = function () {
  _disegnaAnteprimaDopp();
  const box = $('rapido-anteprima');
  if (!box || box.hidden) return;
  vociDaRighe(righeCampo($('rapido-testo').value), ui.rapido).forEach((v, i) => {
    const m = trovaDoppione(v.title), voce = box.querySelector(`.rap-voce[data-i="${i}"]`);
    if (!m || !voce) return;
    if (forte(m.livello)) voce.querySelector('.rap-sintesi > span').insertAdjacentHTML('afterend', etichettaDopp(m));
    else voce.querySelector('.rap-sintesi').insertAdjacentHTML('afterend', suggerimentoParente(m));
  });
};
const _disegnaAnteprimaCatturaDopp = disegnaAnteprimaCattura;
disegnaAnteprimaCattura = function () {
  _disegnaAnteprimaCatturaDopp();
  const box = $('cattura-anteprima');
  if (!box || box.hidden) return;
  const voci = vociDaRighe(righeCattura(), {});
  box.querySelectorAll('.ca-voci > span[class^="p-q"]').forEach((el, i) => { const m = voci[i] && trovaDoppione(voci[i].title); if (m && forte(m.livello)) el.insertAdjacentHTML('beforeend', ' ' + etichettaDopp(m)); });
};

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
function gruppiAperti() {
  const no = new Set(doppioniNo());
  return gruppiDoppioni(coseAperteDopp(), nomiNoti()).filter(g => !no.has(g.chiave));
}
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
async function unisciGruppo(k) {
  const g = gruppiAperti().find(x => x.chiave === k);
  if (!g) return;
  const tieniId = g.cose.some(c => c.id === ui.doppTieni[k]) ? ui.doppTieni[k] : g.cose[0].id;
  const tieni = ciclo(tieniId), altre = g.cose.map(c => ciclo(c.id)).filter(c => c && c.id !== tieniId && !c.done);
  if (!tieni || !altre.length) return;
  const ids = altre.map(c => c.id);
  const passi = state.cicli.filter(p => ids.includes(p.parent_id));
  const prima = [tieni, ...altre, ...passi].map(c => ({ id: c.id, campi: campi(c, campiUnione()) }));
  let assegnazioni = [];
  try {
    const conDelega = altre.find(c => c.delega_persona_id);
    await patchCiclo(tieni.id, { note: [tieni.note, ...altre.map(notaUnione)].filter(Boolean).join('\n\n'),
      persone_menzionate: unici([...(tieni.persone_menzionate || []), ...altre.flatMap(c => c.persone_menzionate || [])]),
      ...(state.delegaColsOk && !tieni.delega_persona_id && conDelega ? { delega_persona_id: conDelega.delega_persona_id, delega_controllo: conDelega.delega_controllo } : {}) });
    for (const p of passi) await patchCiclo(p.id, { parent_id: tieni.id });
    const { data: ass } = await db.from('assegnazioni').select('id,ciclo_id').in('ciclo_id', ids);
    assegnazioni = ass || [];
    if (assegnazioni.length) await db.from('assegnazioni').update({ ciclo_id: tieni.id }).in('id', assegnazioni.map(a => a.id));
    const ora = new Date().toISOString();
    for (const c of altre) await patchCiclo(c.id, { done: true, chiuso_at: ora, execution_status: 'done', note: `Unita a «${tieni.title}»${c.note ? '\n\n' + c.note : ''}` });
  } catch (err) { showToast('Unione interrotta: ' + err.message, 'error'); render(); return; }
  render();
  showToast(`Unite in «${tieni.title}»`, 'success', { annulla: () => annullaUnione(prima, assegnazioni) });
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

// ══════════════════════════════════════════════════════════════
// ACCESSO · Supabase Auth con codice personale (password), un solo utente.
// L'email è fissa e non si vede. La protezione vera sono le policy RLS
// (auth.jwt() ->> 'email'): questo serve solo a non far partire l'app senza sessione.
// ══════════════════════════════════════════════════════════════
const EMAIL_AMMESSA = 'maci81x@gmail.com';
const ACCESSO = { MAX_ERRORI: 5, BLOCCO_MS: 60 * 1000, LS_ERRORI: 'accesso_errori', LS_BLOCCO: 'accesso_blocco_fino' };
let _appAvviata = false;
let _accessoTimer = null;
const urlRitorno = () => location.origin + location.pathname;
const emailDi = s => ((s && s.user && s.user.email) || '').trim().toLowerCase();
const sessioneAmmessa = s => !!(s && s.access_token) && emailDi(s) === EMAIL_AMMESSA;
const erroriDiFila = () => parseInt(lsLeggi(ACCESSO.LS_ERRORI) || '0', 10) || 0;
const bloccatoFino = () => parseInt(lsLeggi(ACCESSO.LS_BLOCCO) || '0', 10) || 0;

function statoAccesso(testo, errore) {
  const el = $('accesso-stato');
  el.textContent = testo || '';
  el.classList.toggle('errore', !!errore);
}
function abilitaAccesso(si) {
  $('accesso-codice').disabled = !si;
  $('accesso-entra').disabled = !si;
}
// Dopo 5 codici sbagliati di fila il campo resta spento per un minuto (anche se ricarichi la pagina).
function controllaBlocco() {
  clearInterval(_accessoTimer);
  const resto = bloccatoFino() - Date.now();
  if (resto <= 0) {
    if (bloccatoFino()) { lsScrivi(ACCESSO.LS_BLOCCO, null); lsScrivi(ACCESSO.LS_ERRORI, null); statoAccesso(''); }
    abilitaAccesso(true);
    return false;
  }
  abilitaAccesso(false);
  const scrivi = () => {
    const sec = Math.ceil((bloccatoFino() - Date.now()) / 1000);
    if (sec <= 0) { controllaBlocco(); $('accesso-codice').focus(); return; }
    statoAccesso(`Troppi codici sbagliati di fila: riprova tra ${sec} ${sec === 1 ? 'secondo' : 'secondi'}.`, true);
  };
  scrivi();
  _accessoTimer = setInterval(scrivi, 1000);
  return true;
}
function mostraAccesso(msg, errore) {
  $('accesso').hidden = false;
  $('accesso-utente').value = EMAIL_AMMESSA;   // per il gestore delle password, non si vede
  statoAccesso(msg, errore);
  if (!controllaBlocco()) setTimeout(() => $('accesso-codice').focus(), 50);
}
function mostraCodice() {
  const campo = $('accesso-codice'), btn = document.querySelector('[data-act="accesso-occhio"]');
  const visibile = campo.type === 'password';
  campo.type = visibile ? 'text' : 'password';
  btn.setAttribute('aria-pressed', String(visibile));
  btn.setAttribute('aria-label', visibile ? 'Nascondi il codice' : 'Mostra il codice');
  btn.innerHTML = `<i class="ti ${visibile ? 'ti-eye-off' : 'ti-eye'}"></i>`;
  campo.focus();
}
const codiceSbagliato = e => !!e && (e.code === 'invalid_credentials' || /invalid login credentials/i.test(e.message || ''));
async function entra(ev) {
  ev.preventDefault();
  if (controllaBlocco()) return;
  const codice = $('accesso-codice').value;
  if (!codice) { statoAccesso('Scrivi il tuo codice.', true); $('accesso-codice').focus(); return; }
  abilitaAccesso(false);
  statoAccesso('Controllo il codice…');
  try {
    const { error } = await db.auth.signInWithPassword({ email: EMAIL_AMMESSA, password: codice });
    if (error) throw error;
    lsScrivi(ACCESSO.LS_ERRORI, null);
    statoAccesso('');
    // l'app parte da onAuthStateChange (SIGNED_IN)
  } catch (e) {
    console.warn('[Accesso]', e.code || e.status || '', e.message);
    abilitaAccesso(true);
    $('accesso-codice').select();
    if (!codiceSbagliato(e)) {
      const tanti = e.status === 429 || /rate|too many/i.test(e.message || '');
      return statoAccesso(tanti ? 'Troppi tentativi: aspetta qualche minuto e riprova.' : 'Non riesco a collegarmi. Controlla la connessione e riprova.', true);
    }
    const n = erroriDiFila() + 1;
    lsScrivi(ACCESSO.LS_ERRORI, String(n));
    if (n >= ACCESSO.MAX_ERRORI) { lsScrivi(ACCESSO.LS_BLOCCO, String(Date.now() + ACCESSO.BLOCCO_MS)); controllaBlocco(); return; }
    statoAccesso('Codice sbagliato', true);
  }
}
function chiediEsci() {
  apriConferma({ titolo: 'Esci da Cicli Aperti?', testo: 'Per rientrare ti servirà il tuo codice.', ok: 'Esci', no: 'Resta', onOk: esci });
}
async function esci() {
  try { await db.auth.signOut(); } catch (e) { console.warn('[Accesso] uscita:', e.message); }
  location.replace(urlRitorno());
}

(async function accesso() {
  applyTheme();
  $('accesso-form').addEventListener('submit', entra);
  db.auth.onAuthStateChange((evento, sessione) => {
    // niente chiamate a Supabase dentro questa funzione: si rimanda con setTimeout
    if (sessione && sessione.access_token) db.realtime.setAuth(sessione.access_token);
    if (evento === 'SIGNED_OUT' && _appAvviata) { setTimeout(() => location.replace(urlRitorno()), 0); return; }
    if (sessioneAmmessa(sessione) && !_appAvviata) setTimeout(() => avviaApp(sessione), 0);
  });
  const { data, error } = await db.auth.getSession();
  if (error) console.warn('[Accesso] sessione:', error.message);
  const s = data && data.session;
  if (sessioneAmmessa(s)) return avviaApp(s);
  if (s) { await db.auth.signOut(); return mostraAccesso('Questo utente non può entrare.', true); }
  mostraAccesso();
})();

function avviaApp(sessione) {
  if (_appAvviata) return;
  _appAvviata = true;
  clearInterval(_accessoTimer);
  $('accesso').hidden = true;
  state.utente = emailDi(sessione);
  const corrente = bpSettimanaCorrente();
  state.week = corrente.week; state.year = corrente.year;      // si apre sempre sulla settimana di oggi
  ui.giorno = giornoIdxDi(oggiData());
  ui.tab = 'oggi';   // Oggi è la schermata di apertura
  render();
  if (!localStorage.getItem(LS2.ONB)) onbApri();
  applicaAspetto();
  loadAll().then(() => {
    rilevaColonneV3().then(() => setTimeout(controllaMattino, 600));
    rilevaColonneV4();
    avvioV5();
    initGcal();
    db.from('cicli').select('id,calendar_event_id').limit(1).then(({ error }) => { ui.calEventColOk = !error; });
    setTimeout(riconciliaCalendar, 2500);   // dopo che initGcal ha ripreso il token
    initPullToRefresh();
    caricaEventi(state.week, state.year);
    caricaRimaste();
    const salite = state.cicli.filter(c => !c.done && computeEffectiveQ(c) !== c.q);
    // 22/10 · al massimo una volta al giorno (localStorage avviso_salite = YYYY-MM-DD)
    if (salite.length && lsLeggi('avviso_salite') !== oggiLocale()) {
      lsScrivi('avviso_salite', oggiLocale());
      setTimeout(() => showToast(`${plurale(salite.length, 'cosa è salita', 'cose sono salite')} di priorità per la scadenza`, 'warn'), 1200);
    }
  });
  window.matchMedia('(min-width: 768px)').addEventListener('change', () => render());
}

// ══════════════════════════════════════════════════════════════
// 24/10 · IPHONE: la vista non resta «scivolata» sotto la barra dopo la tastiera o il microfono
// Il documento non scorre mai (scorre solo #main): a tastiera chiusa si riporta in cima, e se l'app non copre
// lo schermo visibile se ne fissa l'altezza. Se Oggi resta vuota con i dati caricati: errore in console e ridisegno.
// ══════════════════════════════════════════════════════════════
const VISTA = { RITARDO_MS: 350, RIDISEGNO_MIN_MS: 2000 };
const campoAttivo = () => {
  const a = document.activeElement;
  if (!a || a === document.body) return false;
  if (a.isContentEditable || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT') return true;
  return a.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file'].includes(a.type);
};
function altezzaVisibile() {
  const vv = window.visualViewport;
  return Math.round(vv ? vv.height * (vv.scale || 1) : window.innerHeight);
}
let _oggiRidisegnata = 0;
function controllaOggiVuota(motivo) {
  if (!_appAvviata || ui.tab !== 'oggi' || ui.sub || state.loading || state.searchQuery) return;
  const view = $('view');
  if (!view || !(state.cicli || []).length) return;
  if (view.querySelector('.vh') && view.getBoundingClientRect().height > 0) return;
  const msg = `[Oggi] vista vuota con ${state.cicli.length} cose caricate (${motivo}): la ridisegno`;
  console.error(msg);
  if (window.__salvaErrore) window.__salvaErrore('vista', msg, '');
  if (Date.now() - _oggiRidisegnata < VISTA.RIDISEGNO_MIN_MS) return;
  _oggiRidisegnata = Date.now();
  delete view.dataset.vista;
  render();
}
function ripristinaVista(motivo) {
  if (campoAttivo()) return;   // tastiera aperta: è iOS che sposta la vista, apposta
  const se = document.scrollingElement || document.documentElement;
  if (window.scrollY || window.pageYOffset || se.scrollTop || document.body.scrollTop) {
    window.scrollTo(0, 0);
    se.scrollTop = 0;
    document.body.scrollTop = 0;
  }
  const app = $('app'), main = $('main'), view = $('view');
  if (app && window.innerWidth < 768) {
    const h = altezzaVisibile(), r = app.getBoundingClientRect();
    if (Math.abs(r.top) > 1 || Math.abs(r.height - h) > 2) {
      app.style.height = h + 'px';
      console.warn(`[Vista] app spostata (${motivo}): top ${Math.round(r.top)}, alta ${Math.round(r.height)} su ${h}: rimessa a posto`);
    }
  }
  // il contenuto finito fuori dalla parte che scorre: si torna in cima
  if (main && view) {
    const rm = main.getBoundingClientRect(), rv = view.getBoundingClientRect();
    if (rv.bottom < rm.top || rv.top > rm.bottom) main.scrollTop = 0;
  }
  controllaOggiVuota(motivo);
}
let _vistaTimer = null;
function ripristinaVistaPoi(motivo, azzeraAltezza) {
  clearTimeout(_vistaTimer);
  _vistaTimer = setTimeout(() => {
    if (azzeraAltezza && !campoAttivo() && $('app')) $('app').style.height = '';
    ripristinaVista(motivo);
  }, VISTA.RITARDO_MS);
}
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => ripristinaVistaPoi('tastiera'));
  window.visualViewport.addEventListener('scroll', () => ripristinaVistaPoi('scorrimento'));
}
document.addEventListener('focusout', () => ripristinaVistaPoi('campo lasciato'));
window.addEventListener('orientationchange', () => ripristinaVistaPoi('rotazione', true));
window.addEventListener('resize', () => ripristinaVistaPoi('dimensioni', true));
window.addEventListener('pageshow', () => ripristinaVistaPoi('riapertura', true));
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') ripristinaVistaPoi('primo piano', true); });
// dopo ogni disegno: Oggi non deve restare vuota
const _renderVista = render;
render = function () {
  const r = _renderVista.apply(this, arguments);
  setTimeout(() => controllaOggiVuota('disegno'), 0);
  return r;
};

// ══════════════════════════════════════════════════════════════
// 24/10 · APPUNTAMENTI SEMPRE RILETTI DA GOOGLE
// Prima una settimana letta restava in memoria (e nella copia locale) finché non si ricaricava la pagina:
// un appuntamento cancellato su Google restava in Oggi. Ora: a ogni apertura e ogni 5 minuti si rilegge
// ogni settimana da Google e la si SOSTITUISCE (niente unione); gli annullati non entrano.
// La copia locale si usa solo finché Google non risponde; se ha più di 12 ore la vista lo dice («dati di ieri»).
// ══════════════════════════════════════════════════════════════
const EVENTI_AGG = { OGNI_MS: 5 * 60 * 1000, RIPROVA_MS: 60 * 1000, VECCHI_MS: 12 * 3600 * 1000, TS: 'gcal_eventi_cache_ts', MAX_SETTIMANE: 10 };
ui.eventiLetti = {};      // settimana → quando è arrivata da Google (in questa apertura)
ui.eventiTentati = {};    // settimana → ultimo tentativo (anche fallito)
ui.eventiCacheTs = leggiJson(EVENTI_AGG.TS, {});
const _salvaCacheEventiAgg = salvaCacheEventi;
salvaCacheEventi = function () {
  _salvaCacheEventiAgg();
  const ts = {}, prima = leggiJson(EVENTI_AGG.TS, {});
  settimaneDaTenere().forEach(k => {
    if (Array.isArray(ui.eventi[k]) && !ui.eventiDaCache.has(k) && ui.eventiLetti[k]) ts[k] = ui.eventiLetti[k];
    else if (prima[k]) ts[k] = prima[k];
  });
  ui.eventiCacheTs = ts;
  try { localStorage.setItem(EVENTI_AGG.TS, JSON.stringify(ts)); } catch (e) { console.warn('[GCal] data della copia locale:', e.message); }
};
function rileggiSettimana(week, year) {
  const k = settKey(week, year);
  if (ui.eventiCarico[k]) return ui.eventiCarico[k];
  ui.eventiTentati[k] = Date.now();
  const da = getWeekStart(week, year), a = new Date(da); a.setDate(a.getDate() + 7);
  const p = leggiEventi(da, a).then(lista => {
    // a token scaduto durante la lettura Google non ha risposto davvero: si tiene quello che c'è
    if (!isGcalTokenValid() && !lista.length) return ui.eventi[k] || [];
    ui.eventi[k] = lista.filter(e => e && e.status !== 'cancelled');   // sostituisce la settimana intera
    ui.eventiDaCache.delete(k);
    ui.eventiLetti[k] = Date.now();
    if (settimaneDaTenere().includes(k)) salvaCacheEventi();
    render();
    return ui.eventi[k];
  }).catch(e => { console.warn('[GCal] lettura appuntamenti:', e.message); return ui.eventi[k] || []; })
    .finally(() => { delete ui.eventiCarico[k]; });
  ui.eventiCarico[k] = p;
  return p;
}
caricaEventi = function (week, year) {
  const k = settKey(week, year);
  if (!isGcalTokenValid()) return Promise.resolve(ui.eventi[k] || []);
  if (ui.eventiCarico[k]) return ui.eventiCarico[k];
  const letto = ui.eventiLetti[k] || 0;
  if (ui.eventi[k] && !ui.eventiDaCache.has(k) && letto && Date.now() - letto < EVENTI_AGG.OGNI_MS) return Promise.resolve(ui.eventi[k]);
  const fallito = (ui.eventiTentati[k] || 0) > letto;
  if (fallito && Date.now() - ui.eventiTentati[k] < EVENTI_AGG.RIPROVA_MS) return Promise.resolve(ui.eventi[k] || []);
  return rileggiSettimana(week, year);
};
function chiaveSett(k) { const m = /^(\d{4})-W(\d{2})$/.exec(k); return m ? { week: +m[2], year: +m[1] } : null; }
function aggiornaEventiAperti(motivo) {
  if (!_appAvviata || !isGcalTokenValid() || document.visibilityState === 'hidden') return;
  const chiavi = [...new Set([...settimaneDaTenere(), settKey(state.week, state.year), ...Object.keys(ui.eventi || {})])].slice(0, EVENTI_AGG.MAX_SETTIMANE);
  chiavi.forEach(k => {
    const w = chiaveSett(k);
    if (!w || ui.eventiCarico[k]) return;
    const letto = ui.eventiLetti[k] || 0;
    if (letto && !ui.eventiDaCache.has(k) && Date.now() - letto < EVENTI_AGG.OGNI_MS - 5000) return;
    rileggiSettimana(w.week, w.year);
  });
}
setInterval(() => aggiornaEventiAperti('ogni 5 minuti'), EVENTI_AGG.OGNI_MS);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') aggiornaEventiAperti('primo piano'); });
window.addEventListener('pageshow', e => { if (e.persisted) aggiornaEventiAperti('riapertura'); });
const _handleGcalTokenAgg = _handleGcalToken;
_handleGcalToken = async function (resp) {
  const r = await _handleGcalTokenAgg.apply(this, arguments);
  aggiornaEventiAperti('nuovo token');
  return r;
};
// «dati di ieri»: la settimana di oggi viene da una lettura di più di 12 ore fa (copia locale o token scaduto)
function eventiVecchi() {
  if (!gcalEraCollegato()) return false;
  const cur = bpSettimanaCorrente(), k = settKey(cur.week, cur.year);
  if (!Array.isArray(ui.eventi[k])) return false;
  const quando = ui.eventiLetti[k] || (ui.eventiDaCache.has(k) ? (ui.eventiCacheTs || {})[k] || 0 : 0);
  return Date.now() - quando > EVENTI_AGG.VECCHI_MS;
}
const notaEventiVecchi = () => eventiVecchi() ? '<p class="gcal-ieri"><i class="ti ti-cloud-off" aria-hidden="true"></i>Appuntamenti: dati di ieri</p>' : '';
const _vistaOggiAgg = vistaOggi;
vistaOggi = function () { const h = _vistaOggiAgg.apply(this, arguments); const n = notaEventiVecchi(); return n ? h.replace('</h1></div>', '</h1>' + n + '</div>') : h; };
const _vistaPianificaAgg = vistaPianifica;
vistaPianifica = function () { const h = _vistaPianificaAgg.apply(this, arguments); const n = notaEventiVecchi(); return n && h.includes('</h1></div>') ? h.replace('</h1></div>', '</h1>' + n + '</div>') : h; };

// ══════════════════════════════════════════════════════════════
// 24/10 · «COPIA ERRORI» in Altro → Impostazioni (gli errori li raccoglie lo script in testa alla pagina)
// ══════════════════════════════════════════════════════════════
const ERRORI_LS = 'cicli_errori';
function erroriSalvati() { try { const l = JSON.parse(localStorage.getItem(ERRORI_LS) || '[]'); return Array.isArray(l) ? l : []; } catch (_) { return []; } }
function testoErrori() {
  const l = erroriSalvati();
  if (!l.length) return 'Nessun errore registrato.';
  return l.map(e => [e.t, e.tipo, e.msg, e.dove, e.schermo].filter(Boolean).join(' · ')).join('\n') + '\n' + (l[l.length - 1].ua || '');
}
ui.erroriTesto = false;
function sezioneErrori() {
  const n = erroriSalvati().length;
  return `<p class="list-head"><span>Problemi</span><span class="mono">${n}</span></p>
    <div class="group"><button type="button" class="riga-link" data-act="errori-copia"><i class="ti ti-bug"></i><span>Copia errori<small>${n ? plurale(n, 'errore registrato', 'errori registrati') + ' su questo dispositivo' : 'Nessun errore registrato'}</small></span><span></span><i class="ti ti-copy"></i></button>
    ${ui.erroriTesto ? `<div class="riga-link" style="grid-template-columns:minmax(0,1fr)"><textarea class="input" id="errori-testo" rows="8" readonly aria-label="Errori registrati" style="min-height:160px;font-size:12px;line-height:16px">${escHtml(testoErrori())}</textarea></div>` : ''}</div>`;
}
AZIONI['errori-copia'] = async () => {
  const t = testoErrori();
  try {
    await navigator.clipboard.writeText(t);
    showToast(erroriSalvati().length ? 'Errori copiati: incollali in un messaggio' : 'Nessun errore da copiare', 'success');
  } catch (_) {
    ui.erroriTesto = true;
    render();
    setTimeout(() => { const ta = $('errori-testo'); if (ta) { ta.focus(); ta.select(); } }, 50);
    showToast('Selezionali nel riquadro e copia', 'info');
  }
};
const _vistaImpostazioniErr = vistaImpostazioni;
vistaImpostazioni = function () { return _vistaImpostazioniErr.apply(this, arguments) + sezioneErrori(); };

// ══════════════════════════════════════════════════════════════
// 25/10 · I 18 PRINCIPI (Ruggeri) NELL'APP
// A · Mete e «dire no» (12, 16, 5) · B · Tempo per il futuro 25–30% (1, 6, 7, 17)
// C · Fallo subito e specifico (4, 2) · D · Sera, deleghe, demotivazione (3, 9, 10, 11)
// Tabelle nuove (additive): mete, non_doppioni; colonna cicli.meta_id. Se mancano, le funzioni si spengono.
// ══════════════════════════════════════════════════════════════
const PRINC = {
  METE_MIN: 7, METE_MAX: 10, METE_FERMA_GG: 28,
  FUTURO_MIN: 25, FUTURO_MAX: 30, GIORNI_LAV: 5,
  BREVE_MIN: 5, TIMER_MS: 5 * 60 * 1000,
  SERA_DA: '18:30', DOMANI_ORA: '18:45', DOMANI_FINE: '18:50',
  DELEGHE_GG: 60, DELEGHE_PERSONA: 3, DELEGHE_COSA: 2, DELEGHE_OK_GG: 30,
  SPINTA_NON_FATTE: 0.4, SPINTA_RINVIATE: 3,
  LS: { METE_CARD: 'mete_card_sett', METE_CHIUDI: 'mete_chiudi_chiesto', NON_DOPP_MIGR: 'non_doppioni_migrati', SPEC_OK: 'specifiche_ok',
    SERA: 'sera_piano_fatto', DELEGHE_OK: 'deleghe_ok' }
};
state.mete = null;          // null = non lette (o tabella assente)
state.meteOk = undefined;   // tabella mete
state.metaColOk = undefined; // colonna cicli.meta_id
state.nonDopp = new Set();
state.nonDoppOk = undefined;

async function rilevaPrincipi() {
  const prova = async (tabella, colonne) => { try { const { error } = await db.from(tabella).select(colonne).limit(1); return !error; } catch (_) { return false; } };
  [state.meteOk, state.metaColOk] = await Promise.all([prova('mete', 'id,testo,area,entro,ordine,raggiunta'), prova('cicli', 'id,meta_id')]);
  if (state.meteOk) await caricaMete();
  await caricaNonDoppioni();
  render();
}
async function caricaMete() {
  try {
    const { data, error } = await db.from('mete').select('*').order('ordine', { ascending: true });
    if (error) throw error;
    state.mete = ordinaMete(data || []);
  } catch (e) { console.warn('[Mete] lettura:', e.message); state.meteOk = false; state.mete = null; }
}
const ordinaMete = l => l.slice().sort((a, b) => (a.ordine ?? 0) - (b.ordine ?? 0) || String(a.created_at || '').localeCompare(String(b.created_at || '')));
const meteTutte = () => state.meteOk && Array.isArray(state.mete) ? state.mete : [];
const meteAperte = () => meteTutte().filter(m => !m.raggiunta);
const metaPerId = id => id ? meteTutte().find(m => String(m.id) === String(id)) || null : null;
const metaDi = c => c && state.metaColOk ? metaPerId(c.meta_id) : null;
const corta = (t, n) => { const s = String(t || ''); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };

// ─── «Non sono doppioni»: tabella non_doppioni, localStorage come riserva ───
async function caricaNonDoppioni() {
  try {
    const { data, error } = await db.from('non_doppioni').select('chiave');
    if (error) throw error;
    state.nonDoppOk = true;
    state.nonDopp = new Set((data || []).map(r => r.chiave).filter(Boolean));
  } catch (e) { state.nonDoppOk = false; console.warn('[Doppioni] tabella non_doppioni:', e.message); return; }
  // una volta: le scelte già fatte su questo dispositivo vanno nella tabella
  if (lsLeggi(PRINC.LS.NON_DOPP_MIGR) !== '1') {
    const locali = leggiJson(DOPP.LS_NO, []).filter(k => k && !state.nonDopp.has(k));
    try {
      if (locali.length) {
        const { error } = await db.from('non_doppioni').upsert(locali.map(chiave => ({ chiave })), { onConflict: 'chiave' });
        if (error) throw error;
        locali.forEach(k => state.nonDopp.add(k));
      }
      lsScrivi(PRINC.LS.NON_DOPP_MIGR, '1');
    } catch (e) { console.warn('[Doppioni] migrazione:', e.message); }
  }
  scriviJson(DOPP.LS_NO, unici([...leggiJson(DOPP.LS_NO, []), ...state.nonDopp]));   // la copia locale resta allineata
}
gruppiAperti = function () {
  const no = new Set([...doppioniNo(), ...state.nonDopp]);
  return gruppiDoppioni(coseAperteDopp(), nomiNoti()).filter(g => !no.has(g.chiave));
};
AZIONI['dopp-no'] = async el => {
  const k = el.dataset.k;
  scriviJson(DOPP.LS_NO, unici([...doppioniNo(), k]));
  state.nonDopp = new Set([...state.nonDopp, k]);
  render();
  if (state.nonDoppOk) {
    try { const { error } = await db.from('non_doppioni').upsert({ chiave: k }, { onConflict: 'chiave' }); if (error) throw error; }
    catch (e) { console.warn('[Doppioni] salvataggio:', e.message); }
  }
  showToast('Non te li propongo più', 'info', { annulla: async () => {
    scriviJson(DOPP.LS_NO, doppioniNo().filter(x => x !== k));
    const s = new Set(state.nonDopp); s.delete(k); state.nonDopp = s;
    if (state.nonDoppOk) { try { await db.from('non_doppioni').delete().eq('chiave', k); } catch (e) { console.warn('[Doppioni] annulla:', e.message); } }
    render();
  } });
};

// ══════════════════════════════════════════════════════════════
// A · LE MIE METE (principio 12: abbi chiara la meta · 16: costruisci qualcosa · 5: impara a dire no)
// ══════════════════════════════════════════════════════════════
ui.metaEdit = null;
function cicliDiMeta(m) { return state.metaColOk ? state.cicli.filter(c => String(c.meta_id || '') === String(m.id)) : []; }
// l'ultima volta che qualcosa di questa meta era in programma o è stato fatto (ISO) — null se mai
function ultimaAttivitaMeta(m, extra) {
  const date = cicliDiMeta(m).flatMap(c => [c.pianificato_data, c.scheduled_date, c.done ? giornoIso(c.chiuso_at || c.updated_at) : null]).filter(Boolean);
  if (extra) date.push(...extra);
  return date.length ? date.sort().pop() : null;
}
// ferma = da 4 settimane niente (e la meta ha più di 4 settimane)
function metaFerma(m, extra) {
  if (m.raggiunta) return false;
  const limite = toISODate(piuGiorni(new Date(), -PRINC.METE_FERMA_GG));
  if (giornoIso(m.created_at || '') > limite) return false;
  const u = ultimaAttivitaMeta(m, extra);
  return !u || u < limite;
}
ui.meteRiordina = false;
const ICO_META = 'ti-flag';
function infoMeta(m) {
  const n = cicliDiMeta(m).filter(c => !c.done).length, fatte = cicliDiMeta(m).filter(c => c.done).length;
  const entro = m.entro ? `entro il ${fmtGgMm(m.entro)}/${String(m.entro).slice(0, 4)}` : '';
  const cose = state.metaColOk && !m.raggiunta ? (n || fatte ? plurale(n, 'cosa aperta', 'cose aperte') + (fatte ? `, ${fatte} fatte` : '') : 'nessuna cosa collegata') : '';
  const ferma = metaFerma(m) ? '<span class="ferma"><i class="ti ti-zzz" aria-hidden="true"></i>da 4 settimane niente in programma</span>' : '';
  return [m.area ? escHtml(m.area) : '', entro, cose, ferma].filter(Boolean);
}
function rigaMeta(m, i, gruppo) {
  const pos = gruppo.indexOf(m), info = infoMeta(m);
  const num = m.raggiunta ? '<i class="ti ti-check" aria-hidden="true"></i><span class="sr-only">Raggiunta</span>' : i + 1;
  if (ui.metaEdit === m.id) return `<div class="meta-riga in-modifica" data-meta="${esc(m.id)}"><span class="meta-n mono">${num}</span>${formMeta(m)}</div>`;
  const tasti = ui.meteRiordina && !m.raggiunta ? `<div class="meta-tasti">
      <button type="button" class="btn btn-icon" data-act="meta-su" data-id="${esc(m.id)}" aria-label="Sposta su: ${esc(m.testo)}"${pos === 0 ? ' disabled' : ''}><i class="ti ti-arrow-up"></i></button>
      <button type="button" class="btn btn-icon" data-act="meta-giu" data-id="${esc(m.id)}" aria-label="Sposta giù: ${esc(m.testo)}"${pos === gruppo.length - 1 ? ' disabled' : ''}><i class="ti ti-arrow-down"></i></button></div>` : '<span></span>';
  return `<div class="meta-riga${m.raggiunta ? ' raggiunta' : ''}" data-meta="${esc(m.id)}"><span class="meta-n mono">${num}</span>
    <button type="button" class="meta-corpo" data-act="meta-modifica" data-id="${esc(m.id)}" aria-label="Modifica la meta: ${esc(m.testo)}"><span class="meta-testo">${escHtml(m.testo)}</span>${info.length ? `<span class="meta-info">${info.join('<span class="sep" aria-hidden="true">·</span>')}</span>` : ''}</button>
    ${tasti}</div>`;
}
function formMeta(m) {
  const v = m || {}, aree = nomiAree();
  return `<div class="meta-form${m ? '' : ' meta-nuova'}"${m ? ' style="padding:0"' : ''}>
    <input type="text" class="input" id="${m ? 'meta-testo-mod' : 'meta-testo'}" maxlength="160" value="${esc(v.testo || '')}" placeholder="Fra 5 anni voglio… (es. SSI con 2.000 clienti)" aria-label="La meta">
    <div class="meta-form-riga">
      ${aree.length ? `<select class="input" id="${m ? 'meta-area-mod' : 'meta-area'}" aria-label="Area"><option value="">Area (facoltativa)</option>${aree.map(a => `<option${a === v.area ? ' selected' : ''}>${escHtml(a)}</option>`).join('')}</select>` : ''}
      <input type="date" lang="it" class="input" id="${m ? 'meta-entro-mod' : 'meta-entro'}" value="${v.entro || ''}" aria-label="Entro (facoltativo)" title="Entro (facoltativo)">
      ${m ? `<button type="button" class="btn btn-primary btn-sm" data-act="meta-salva" data-id="${esc(m.id)}">Salva</button>` : '<button type="button" class="btn btn-primary btn-sm" data-act="meta-aggiungi"><i class="ti ti-plus"></i>Aggiungi</button>'}
    </div>
    ${m ? `<div class="tools-row"><button type="button" class="btn btn-ghost btn-sm" data-act="meta-annulla">Annulla</button>
      <button type="button" class="btn btn-secondary btn-sm" data-act="meta-raggiunta" data-id="${esc(m.id)}" aria-pressed="${!!m.raggiunta}"><i class="ti ${m.raggiunta ? 'ti-arrow-back-up' : 'ti-flag-check'}"></i>${m.raggiunta ? 'Non ancora raggiunta' : 'Raggiunta'}</button>
      <button type="button" class="btn btn-ghost btn-danger btn-sm" data-act="meta-togli" data-id="${esc(m.id)}">Togli la meta</button></div>` : ''}
  </div>`;
}
function anelloMete(n) {
  const obj = n > PRINC.METE_MIN ? PRINC.METE_MAX : PRINC.METE_MIN, r = 27, giro = 2 * Math.PI * r, pieno = Math.min(1, n / obj);
  return `<div class="mete-anello" role="img" aria-label="${n} mete scritte su ${obj}"><svg viewBox="0 0 64 64" aria-hidden="true"><circle class="tr" cx="32" cy="32" r="${r}"/><circle class="ar" cx="32" cy="32" r="${r}" stroke-dasharray="${giro.toFixed(1)}" stroke-dashoffset="${(giro * (1 - pieno)).toFixed(1)}"${n ? '' : ' style="display:none"'}/></svg>
    <span aria-hidden="true"><b class="mono">${n}</b><small>di ${obj}</small></span></div>`;
}
function vistaMete() {
  const l0 = Array.isArray(state.mete) ? meteTutte() : [];
  const aperteL = l0.filter(m => !m.raggiunta), fatteL = l0.filter(m => m.raggiunta);
  const riordina = aperteL.length > 1 && state.meteOk ? `<button type="button" class="btn ${ui.meteRiordina ? 'btn-primary' : 'btn-secondary'} btn-sm" data-act="mete-riordina" aria-pressed="${ui.meteRiordina}"><i class="ti ${ui.meteRiordina ? 'ti-check' : 'ti-arrows-sort'}"></i>${ui.meteRiordina ? 'Fine' : 'Riordina'}</button>` : '';
  let h = `${indietro('altro', 'Altro')}<div class="vh mete-testa"><div><h1>Le mie mete</h1></div>${riordina}</div>
    <p class="t-label muted mete-intro">Cosa stai costruendo da qui a 5 anni? Scrivi 7–10 mete: ti aiutano a scegliere cosa conta e a dire di no al resto.</p>`;
  if (state.meteOk === false) return h + vuoto('ti-database-off', 'Le mete non sono disponibili', 'Manca la tabella delle mete nel database: le altre funzioni vanno lo stesso.');
  if (!Array.isArray(state.mete)) return h + '<div class="skel"></div>';
  const n = l0.length;
  const titolo = n < PRINC.METE_MIN ? (n ? `Ne mancano ${PRINC.METE_MIN - n} per arrivare a 7` : 'Comincia dalla prima') : n > PRINC.METE_MAX ? 'Sono tante: tieni le 10 che contano di più' : 'Hai le tue mete';
  const collegate = state.metaColOk ? state.cicli.filter(c => c.meta_id && !c.done && metaPerId(c.meta_id)).length : 0;
  const sotto = [plurale(n, 'meta scritta', 'mete scritte'), fatteL.length ? plurale(fatteL.length, 'raggiunta', 'raggiunte') : '', state.metaColOk && n ? plurale(collegate, 'cosa collegata', 'cose collegate') : ''].filter(Boolean).join(' · ');
  h += `<section class="mete-sommario" aria-label="Quante mete">${anelloMete(n)}<div class="mete-sommario-txt"><b>${titolo}</b><span>${sotto}</span></div></section>`;
  if (aperteL.length) h += `<p class="list-head"><span>In corso</span><span class="mono">${aperteL.length}</span></p><div class="group">${aperteL.map((m, i) => rigaMeta(m, i, aperteL)).join('')}</div>`;
  if (fatteL.length) h += `<p class="list-head"><span>Raggiunte</span><span class="mono">${fatteL.length}</span></p><div class="group">${fatteL.map((m, i) => rigaMeta(m, i, fatteL)).join('')}</div>`;
  h += `<p class="list-head"><span>${n ? 'Un\'altra meta' : 'La prima meta'}</span></p><div class="group">${formMeta(null)}</div>`;
  if (n && state.metaColOk) h += `<p class="t-caption muted mete-nota"><i class="ti ${ICO_META}" aria-hidden="true"></i><span>Tocca una meta per modificarla o segnarla raggiunta. Collega le cose alle mete dal dettaglio («Serve a quale meta?») o in Riordina.</span></p>`;
  return h;
}
async function aggiungiMeta() {
  const testo = ($('meta-testo').value || '').trim();
  if (!testo) { $('meta-testo').focus(); showToast('Scrivi la meta', 'warn'); return; }
  const riga = { testo: testo.slice(0, 160), area: ($('meta-area') || {}).value || null, entro: $('meta-entro').value || null, ordine: meteTutte().length };
  try {
    const { data, error } = await db.from('mete').insert(riga).select();
    if (error) throw error;
    state.mete = ordinaMete([...meteTutte(), (data && data[0]) || { ...riga, id: 'tmp' + Date.now() }]);
    render();
    showToast('Meta aggiunta', 'success');
    setTimeout(() => { const t = $('meta-testo'); if (t) t.focus(); }, 60);
    proponiChiudiScrivereMete();
  } catch (e) { showToast('Meta non salvata: ' + e.message, 'error'); }
}
// Con 7 mete scritte: «SCRIVERE LE METE» si può chiudere (una volta sola)
function proponiChiudiScrivereMete() {
  if (meteTutte().length < PRINC.METE_MIN) return;
  const c = state.cicli.find(x => !x.done && /\bscriver\w*\s+(?:le\s+)?(?:mie\s+)?mete\b/i.test(senzaAccenti(x.title)));
  if (!c || lsLeggi(PRINC.LS.METE_CHIUDI) === String(c.id)) return;
  lsScrivi(PRINC.LS.METE_CHIUDI, String(c.id));
  setTimeout(() => apriConferma({ titolo: `Hai scritto ${meteTutte().length} mete`, testo: `Chiudo «${c.title}»?`, ok: 'Sì, è fatta', no: 'Non ancora', onOk: () => azioneFatto(c.id) }), 300);
}
async function salvaMeta(id) {
  const m = metaPerId(id);
  if (!m) return;
  const testo = ($('meta-testo-mod').value || '').trim();
  if (!testo) { $('meta-testo-mod').focus(); return; }
  await patchMeta(id, { testo: testo.slice(0, 160), area: ($('meta-area-mod') || {}).value || (m.area && !nomiAree().length ? m.area : null), entro: $('meta-entro-mod').value || null });
  ui.metaEdit = null;
  render();
  showToast('Meta salvata', 'success');
}
async function patchMeta(id, patch) {
  const conData = { ...patch, updated_at: new Date().toISOString() };
  const { error } = await db.from('mete').update(conData).eq('id', id);
  if (error) { showToast('Non salvata: ' + error.message, 'error'); throw error; }
  state.mete = ordinaMete(meteTutte().map(m => String(m.id) === String(id) ? { ...m, ...conData } : m));
}
async function spostaMeta(id, dir) {
  const l = meteTutte().slice(), i = l.findIndex(m => String(m.id) === String(id));
  if (i < 0) return;
  let j = i + dir;
  while (j >= 0 && j < l.length && !!l[j].raggiunta !== !!l[i].raggiunta) j += dir;
  if (j < 0 || j >= l.length) return;
  [l[i], l[j]] = [l[j], l[i]];
  const cambiate = l.map((m, k) => ({ m, k })).filter(({ m, k }) => (m.ordine ?? -1) !== k);
  state.mete = l.map((m, k) => ({ ...m, ordine: k }));
  render();
  try { for (const { m, k } of cambiate) { const { error } = await db.from('mete').update({ ordine: k }).eq('id', m.id); if (error) throw error; } }
  catch (e) { showToast('Ordine non salvato: ' + e.message, 'error'); }
}
function togliMeta(id) {
  const m = metaPerId(id);
  if (!m) return;
  const n = cicliDiMeta(m).length;
  apriConferma({ titolo: 'Togli questa meta?', testo: `«${m.testo}»${n ? `: ${plurale(n, 'cosa resta', 'cose restano')} ma senza meta` : ''}.`, ok: 'Sì, toglila', no: 'Annulla', onOk: async () => {
    try {
      const { error } = await db.from('mete').delete().eq('id', id);
      if (error) throw error;
      state.mete = meteTutte().filter(x => String(x.id) !== String(id));
      state.cicli = state.cicli.map(c => String(c.meta_id || '') === String(id) ? { ...c, meta_id: null } : c);   // nel database: on delete set null
      ui.metaEdit = null;
      render();
      showToast('Meta tolta', 'info');
    } catch (e) { showToast('Non riesco: ' + e.message, 'error'); }
  } });
}
Object.assign(AZIONI, {
  'meta-aggiungi': () => aggiungiMeta(),
  'meta-modifica': el => { ui.metaEdit = el.dataset.id; ui.meteRiordina = false; render(); setTimeout(() => { const t = $('meta-testo-mod'); if (t) t.focus(); }, 50); },
  'meta-annulla': () => { ui.metaEdit = null; render(); },
  'meta-salva': el => salvaMeta(el.dataset.id).catch(() => {}),
  'meta-togli': el => togliMeta(el.dataset.id),
  'meta-su': el => spostaMeta(el.dataset.id, -1),
  'meta-giu': el => spostaMeta(el.dataset.id, 1),
  'meta-raggiunta': async el => { const m = metaPerId(el.dataset.id); if (!m) return; try { await patchMeta(m.id, { raggiunta: !m.raggiunta }); ui.metaEdit = null; render(); showToast(m.raggiunta ? 'Di nuovo in corso' : 'Meta raggiunta: bel lavoro', 'success'); } catch (_) {} },
  'mete-riordina': () => { ui.meteRiordina = !ui.meteRiordina; ui.metaEdit = null; render(); },
  'mete-apri': () => vai('altro', { sub: 'mete' }),
  'mete-card-chiudi': () => { const c = bpSettimanaCorrente(); lsScrivi(PRINC.LS.METE_CARD, settKey(c.week, c.year)); render(); }
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || e.isComposing) return;
  if (e.target.id === 'meta-testo') { e.preventDefault(); aggiungiMeta(); }
  if (e.target.id === 'meta-testo-mod') { e.preventDefault(); const r = e.target.closest('[data-meta]'); if (r) salvaMeta(r.dataset.meta).catch(() => {}); }
});

// La card gentile in Oggi: nessuna meta → una volta a settimana
function cardMete() {
  if (!state.meteOk || !Array.isArray(state.mete) || state.mete.length || modoSemplice()) return '';
  const c = bpSettimanaCorrente();
  if (lsLeggi(PRINC.LS.METE_CARD) === settKey(c.week, c.year)) return '';
  return `<section class="banner-piano banner-leggero" aria-label="Le tue mete"><i class="ti ti-flag"></i>
    <div><b>Non hai ancora scritto le tue mete</b><p class="t-caption muted">Cosa stai costruendo da qui a 5 anni? Con le mete scritte è più facile dire di no a quello che non serve.</p>
      <div class="banner-azioni"><button type="button" class="btn btn-primary btn-sm" data-act="mete-apri">Scrivile</button></div></div>
    <button type="button" class="btn btn-icon" data-act="mete-card-chiudi" aria-label="Non ora" data-tip="Non questa settimana"><i class="ti ti-x"></i></button></section>`;
}

// ─── Nel dettaglio: «Serve a quale meta?» (si salva subito) ───
$('det-passi').insertAdjacentHTML('afterend', `<div id="det-meta" class="det-box det-meta" hidden>
  <label class="field-label" for="f-meta"><i class="ti ti-flag" aria-hidden="true"></i>Serve a quale meta?</label>
  <select class="input" id="f-meta" aria-label="Serve a quale meta?"></select></div>`);
function disegnaDetMeta(c) {
  const box = $('det-meta');
  const l = meteTutte();
  const mostra = !!c && !!state.metaColOk && l.length > 0;
  box.hidden = !mostra;
  if (!mostra) return;
  const att = c.meta_id ? String(c.meta_id) : '';
  const voci = l.filter(m => !m.raggiunta || String(m.id) === att);
  $('f-meta').innerHTML = `<option value="">Nessuna</option>${voci.map(m => `<option value="${esc(m.id)}"${String(m.id) === att ? ' selected' : ''}>${escHtml(corta(m.testo, 60))}</option>`).join('')}`;
}
const _apriDettaglioPr = apriDettaglio;
apriDettaglio = function (id) { const r = _apriDettaglioPr.apply(this, arguments); disegnaDetMeta(ciclo(id)); return r; };
const _apriNuovoPr = apriNuovo;
apriNuovo = function () { const r = _apriNuovoPr.apply(this, arguments); $('det-meta').hidden = true; return r; };
async function collegaMeta(id, metaId, silenzioso) {
  const c = ciclo(id);
  if (!c || !state.metaColOk) return;
  const prima = c.meta_id || null, dopo = metaId || null;
  if (String(prima || '') === String(dopo || '')) return;
  try {
    await patchCiclo(id, { meta_id: dopo });
    render();
    const m = metaPerId(dopo);
    if (!silenzioso) showToast(m ? `Serve a: ${corta(m.testo, 40)}` : 'Senza meta', 'success', { annulla: async () => { await patchCiclo(id, { meta_id: prima }); if (editingId === id) disegnaDetMeta(ciclo(id)); render(); } });
  } catch (e) { showToast('Non collegata: ' + e.message, 'error'); }
}
document.addEventListener('change', e => { if (e.target.id === 'f-meta' && editingId) collegaMeta(editingId, e.target.value); });

// ─── Nella riga: il segno della meta ───
const _rigaPr = riga;
riga = function (r, opz) {
  const h = _rigaPr(r, opz);
  const m = r && r.c && metaDi(r.c);
  if (!m) return h;
  const tag = `<span class="meta-tag" data-tip="Serve a: ${esc(m.testo)}"><i class="ti ti-flag" aria-hidden="true"></i><span><span class="sr-only">Meta: </span>${escHtml(corta(m.testo, 28))}</span></span>`;
  return h.replace(/(<span class="item-meta">)([\s\S]*?)(<\/span><\/button>)/, (x, a, dentro, b) => a + dentro + (dentro.trim() ? '<span class="sep">·</span>' : '') + tag + b);
};

// ─── Riordina: un'Importante ti avvicina a una meta? Se no: Delega o Lascia stare (dire no) ───
const _disegnaRiordinaPr = disegnaRiordina;
disegnaRiordina = function () {
  _disegnaRiordinaPr();
  const r = ui.rio;
  if (!r || r.rimaste || r.i >= r.ids.length) return;
  const c = ciclo(r.ids[r.i]), corpo = $('rio-corpo');
  if (!c || !corpo) return;
  const m = metaDi(c), meta = corpo.querySelector('.rio-meta');
  if (m && meta) meta.insertAdjacentHTML('beforeend', `<span class="meta-tag"><i class="ti ti-flag" aria-hidden="true"></i><span>${escHtml(corta(m.testo, 28))}</span></span>`);
  const cosa = corpo.querySelector('.rio-cosa');
  if (cosa && troppoGenerica(c)) cosa.insertAdjacentHTML('afterend', `<div class="rio-vaga"><i class="ti ti-help-circle" aria-hidden="true"></i><span>Troppo generica: cosa devi fare, con chi, quanto?</span><button type="button" class="btn btn-secondary btn-sm" data-act="rio-spacchetta"><i class="ti ti-list-tree"></i>Spacchettala</button></div>`);
  if (r.scelta !== 'importante' || !state.metaColOk || !meteAperte().length) return;
  const date = corpo.querySelector('.rio-date');
  if (!date) return;
  const scelta = r.metaScelta && r.metaScelta.id === c.id ? r.metaScelta.v : (c.meta_id ? String(c.meta_id) : null);
  const chip = (v, l) => `<button type="button" class="chip" data-act="rio-meta" data-v="${esc(v)}" aria-pressed="${scelta === v}">${l}</button>`;
  const domanda = `<div class="rio-mete" role="group" aria-label="Ti avvicina a una meta?"><b>Ti avvicina a una meta?</b>
    <div class="chips chips-wrap">${meteAperte().map(x => chip(String(x.id), `<i class="ti ti-flag" aria-hidden="true"></i>${escHtml(corta(x.testo, 34))}`)).join('')}${chip('nessuna', 'Nessuna')}</div>
    ${scelta === 'nessuna' ? `<div class="rio-dire-no"><b>Allora è una Delega o Lascia stare?</b><span class="t-caption">Se non ti avvicina a niente di quello che stai costruendo, puoi dire di no.</span>
      <div class="tasti"><button type="button" class="btn btn-q3 btn-sm" data-act="rio-tipo" data-v="delega"><i class="ti ti-user-share"></i>Delega</button>
        <button type="button" class="btn btn-q4 btn-sm" data-act="rio-tipo" data-v="lascia"><i class="ti ti-wind"></i>Lascia stare</button>
        <button type="button" class="btn btn-ghost btn-sm" data-act="rio-meta" data-v="comunque">È Importante lo stesso</button></div></div>` : ''}</div>`;
  date.insertAdjacentHTML('beforebegin', domanda);
  if (scelta === 'nessuna') date.hidden = true;
};
AZIONI['rio-meta'] = async el => {
  const r = ui.rio;
  if (!r) return;
  const c = ciclo(r.ids[r.i]);
  if (!c) return;
  const v = el.dataset.v;
  r.metaScelta = { id: c.id, v };
  if (v === 'nessuna') { if (c.meta_id) await collegaMeta(c.id, null, true); }
  else if (v !== 'comunque') await collegaMeta(c.id, v, true);
  disegnaRiordina();
};

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

// ══════════════════════════════════════════════════════════════
// C · FALLO SUBITO (principio 4) E SPECIFICO (principio 2)
// ══════════════════════════════════════════════════════════════
const RE_BREVE = /(?:\b(?:ci\s+vogliono|ci\s+vuole|bastano|basta|in)\s+)?\b(?:5|cinque|2|due|3|tre)\s*min(?:uti|uto)?\b\.?|\bal\s+volo\b/gi;
const togliBreve = t => { const s = String(t || '').replace(RE_BREVE, ' ').replace(/\s+([,.;:!?])/g, '$1').replace(/\s+/g, ' ').replace(/^[\s,;:.\-–—]+|[\s,;:\-–—]+$/g, '').trim(); return s ? s.charAt(0).toUpperCase() + s.slice(1) : String(t || ''); };
const detto = (re, t) => { re.lastIndex = 0; const ok = re.test(t); re.lastIndex = 0; return ok; };

// ─── Troppo generica? 1–2 parole senza un verbo, senza chi (persona, azienda) e senza quanto (numero, €) ───
const VERBI_FORME = new Set(('chiama chiedi scrivi manda invia compra paga prenota fai porta ritira prepara leggi controlla verifica senti organizza rispondi vai ordina aggiorna rinnova disdici ' +
  'telefona cerca trova finisci inizia completa chiudi apri consegna spedisci prova ricorda parla incontra vedi sistema fissa passa saluta ringrazia sollecita').split(' '));
// finiscono come un infinito ma non sono verbi
const NON_VERBI = new Set(('carattere potere piacere dovere cellulare solare regolare familiare popolare particolare militare scolare collare altare affare mare lunare polare singolare ' +
  'salutare molare sire').split(' '));
// cose di lavoro che con un nome bastano a dire cosa fare («Preventivo Rosseti», «Mail Raia»)
const OGGETTI_LAVORO = new Set(('preventivo preventivi offerta offerte fattura fatture mail email contratto contratti ordine ordini report riunione incontro appuntamento chiamata telefonata ' +
  'pagamento bonifico sollecito verbale documento documenti corso visita sopralluogo call proposta relazione consegna bolletta polizza ricevuta pratica certificato modulo dvr colloquio ' +
  'presentazione demo meeting checkup check rinnovo scadenza nota messaggio whatsapp').split(' '));
const eVerbo = w => VERBI_FORME.has(w) || (!NON_VERBI.has(w) && !/iere$/.test(w) && /^[a-z]{3,}(?:are|ere|ire|arre|orre|urre)(?:lo|la|li|le|gli|ne|ci|si|mi|ti|vi)?$/.test(w));
function troppoGenericaTitolo(titolo, opz = {}) {
  const t = String(titolo || '').replace(/\[[^\]]*\]/g, ' ').replace(/^\s*\d{1,2}(?:[.:]\d{2})?\s*[-–—]\s*/, '').trim();
  if (!t || /[:]\s*$/.test(t)) return false;
  if (/[\d€$%]/.test(t)) return false;   // un numero o un importo: c'è il «quanto»
  const grezze = t.split(/[\s/+,;()«»"]+/).filter(Boolean);
  if (grezze.length > 2) return false;
  const tuttoMaiuscolo = !/[a-zà-ÿ]/.test(t);
  const nomi = nomiNoti();
  const parole = grezze.map((raw, j) => {
    const w = parolaPulita(raw);
    const lettere = togliAccenti(raw).replace(/[^A-Za-z]/g, '');
    const nome = !!w && !OGGETTI_LAVORO.has(w) && !DOPP_COMUNI.has(w) && (
      (!tuttoMaiuscolo && lettere.length >= 2 && lettere === lettere.toUpperCase()) ||   // sigla: ASM, DV
      (!tuttoMaiuscolo && j > 0 && /^[A-ZÀ-Ý]/.test(raw)) ||                           // maiuscola non all'inizio
      /^(?:srl|spa|snc|sas|srls)$/.test(w) || nomi.has(w));
    return { w, nome };
  }).filter(x => x.w);
  if (!parole.length) return true;
  if (parole.some(x => eVerbo(x.w))) return false;
  const chi = parole.some(x => x.nome) || !!opz.persona;
  const cosa = parole.some(x => OGGETTI_LAVORO.has(x.w) || DOPP_COMUNI.has(x.w)) || (parole.length === 2 && parole.some(x => !x.nome) && opz.persona);
  return !(chi && cosa);
}
function troppoGenerica(c) {
  if (!c || c.done || c.parent_id || isGiornaliero(c)) return false;
  if (state.cicli.some(p => p.parent_id === c.id && !p.done)) return false;   // ha già i suoi passi
  return troppoGenericaTitolo(c.title, { persona: (c.persone_menzionate || []).length > 0 || !!c.delega_persona_id });
}
const specificheOk = () => new Set(leggiJson(PRINC.LS.SPEC_OK, []));
function daRendereSpecifiche() {
  const ok = specificheOk();
  return state.cicli.filter(c => vedi(c.ctx) && isAttivo(c) && !ok.has(String(c.id)) && troppoGenerica(c))
    .sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')));
}
function vistaSpecifiche() {
  const l = daRendereSpecifiche();
  let h = `${indietro('altro', 'Altro')}<div class="vh"><div><h1>Da rendere specifiche</h1></div></div>
    <p class="t-label muted mete-intro">Scritte in una o due parole non dicono cosa fare. Aggiungi cosa, con chi e quanto, oppure spacchettale in passi.</p>`;
  if (!l.length) return h + vuoto('ti-checks', 'Sono tutte chiare', `In ${etichettaCtx()} ogni cosa aperta dice cosa fare.`);
  return h + `<div class="group">${l.map(c => `<div class="spec-riga" data-id="${c.id}"><button type="button" class="item-main" data-act="apri" data-id="${c.id}" style="padding:0"><span class="item-title">${escHtml(c.title)}</span><span class="item-meta">${tagTipo(computeEffectiveQ(c))}<span class="sep">·</span><span>dal ${fmtGgMm(giornoIso(c.created_at))}</span></span></button>
    <div class="tasti"><button type="button" class="btn btn-secondary btn-sm" data-act="q-scomponi" data-id="${c.id}"><i class="ti ti-list-tree"></i>Spacchettala</button>
      <button type="button" class="btn btn-secondary btn-sm" data-act="spec-riscrivi" data-id="${c.id}"><i class="ti ti-pencil"></i>Riscrivila</button>
      <button type="button" class="btn btn-ghost btn-sm" data-act="spec-ok" data-id="${c.id}">Va bene così</button></div></div>`).join('')}</div>`;
}
Object.assign(AZIONI, {
  'spec-riscrivi': (el, id) => { apriDettaglio(id); setTimeout(() => { const t = $('f-title'); if (t) { t.focus(); t.select(); } }, 120); },
  'spec-ok': (el, id) => { scriviJson(PRINC.LS.SPEC_OK, unici([...specificheOk(), String(id)])); render(); showToast('Non te la propongo più', 'info', { annulla: () => { scriviJson(PRINC.LS.SPEC_OK, [...specificheOk()].filter(x => x !== String(id))); render(); } }); }
});

// ─── Le voci del campo: «5 minuti», «al volo», «subito» o il chip «5 min» → breve; titolo generico → avviso ───
const _vociDaRighePr = vociDaRighe;
vociDaRighe = function (righe, r) {
  const cinque = (r && r.cinque) || [];
  return _vociDaRighePr(righe, r).map(v => {
    const parlato = detto(RE_BREVE, v.testo);
    const title = detto(RE_BREVE, v.title) ? togliBreve(v.title) : v.title;
    const cinqueMin = parlato || cinque.includes(v.testo);
    const breve = v.q !== 3 && (cinqueMin || /\bsubito\b/i.test(v.testo));
    return { ...v, title, cinque: cinqueMin && v.q !== 3, breve, vaga: !(v.passi || []).length && troppoGenericaTitolo(title, { persona: !!v.delega || !!(r && r.persona) }) };
  });
};
// la durata di 5 minuti la rende una Rapida (≤ 15 min, come prima)
const _rigaDaVocePr = rigaDaVoce;
rigaDaVoce = async function (v, r, ctx) {
  const riga = await _rigaDaVocePr.apply(this, arguments);
  return v && v.cinque && state.ritualiColsOk ? { ...riga, durata_minuti: PRINC.BREVE_MIN } : riga;
};
const _disegnaAnteprimaPr = disegnaAnteprima;
disegnaAnteprima = function () {
  _disegnaAnteprimaPr();
  const box = $('rapido-anteprima');
  if (!box || box.hidden) return;
  const voci = vociDaRighe(righeCampo($('rapido-testo').value), ui.rapido);
  box.querySelectorAll('.rap-voce[data-i]').forEach(el => {
    const i = +el.dataset.i, v = voci[i];
    if (!v) return;
    const sintesi = el.querySelector('.rap-sintesi');
    if (!sintesi) return;
    let extra = '';
    if (v.vaga) extra += `<p class="rap-vaga"><i class="ti ti-help-circle" aria-hidden="true"></i><span>Troppo generica: cosa devi fare, con chi, quanto?</span></p>`;
    if (v.q !== 3) extra += `<div class="rap-breve"><button type="button" class="chip" data-act="rap-cinque" data-i="${i}" aria-pressed="${!!v.cinque}"><i class="ti ti-clock-bolt"></i>5 min</button>
      ${v.breve ? `<button type="button" class="btn btn-secondary btn-sm" data-act="rap-fallaora" data-i="${i}"><i class="ti ti-player-play"></i>Falla ora</button><span class="t-caption muted">Ci vogliono pochi minuti? Falla adesso.</span>` : ''}</div>`;
    sintesi.insertAdjacentHTML('afterend', extra);
  });
};
const _disegnaAnteprimaCatturaPr = disegnaAnteprimaCattura;
disegnaAnteprimaCattura = function () {
  _disegnaAnteprimaCatturaPr();
  const box = $('cattura-anteprima');
  if (!box || box.hidden) return;
  const voci = vociDaRighe(righeCattura(), {});
  const spans = box.querySelectorAll('.ca-voci > span[class^="p-q"]');
  spans.forEach((el, i) => { if (voci[i] && voci[i].vaga) el.insertAdjacentHTML('beforeend', ' <span class="ca-vaga">· troppo generica: cosa, con chi, quanto?</span>'); });
  if (voci.length === 1 && voci[0].breve) {
    const mod = box.querySelector('[data-act="cattura-modifica"]');
    const b = '<button type="button" class="btn btn-secondary btn-sm ca-falla" data-act="ca-fallaora"><i class="ti ti-player-play"></i>Falla ora</button>';
    if (mod) mod.insertAdjacentHTML('beforebegin', b); else box.insertAdjacentHTML('beforeend', b);
  }
};
AZIONI['rap-cinque'] = el => {
  const v = vociDaRighe(righeCampo($('rapido-testo').value), ui.rapido)[+el.dataset.i];
  if (!v) return;
  const l = (ui.rapido.cinque || []).filter(x => x !== v.testo);
  ui.rapido = { ...ui.rapido, cinque: el.getAttribute('aria-pressed') === 'true' ? l : [...l, v.testo] };
  disegnaAnteprima();
};
AZIONI['rap-fallaora'] = el => {
  const v = vociDaRighe(righeCampo($('rapido-testo').value), ui.rapido)[+el.dataset.i];
  if (!v) return;
  const r = { ...ui.rapido };
  // tolta dal campo: le altre righe restano da salvare
  const righe = $('rapido-testo').value.split(/\r?\n/);
  const k = righe.findIndex(x => x.trim() === v.testo);
  if (k >= 0) righe.splice(k, 1);
  $('rapido-testo').value = righe.join('\n').trim();
  if (!$('rapido-testo').value) { fermaDettatura(); closeModal('rapidoOverlay'); } else disegnaAnteprima();
  avviaFallaOra({ voce: { ...v, cinque: true }, r });
};
AZIONI['ca-fallaora'] = () => {
  const v = vociDaRighe(righeCattura(), {})[0];
  if (!v) return;
  fermaDettatura();
  $('cattura-testo').value = '';
  allungaCattura();
  disegnaAnteprimaCattura();
  avviaFallaOra({ voce: { ...v, cinque: true }, r: {} });
};
// dopo un salvataggio normale di una cosa breve: «Falla ora» nel messaggio
const _salvaRapidoPr = salvaRapido;
salvaRapido = async function () {
  const voci = vociDaRighe(righeCampo($('rapido-testo').value), ui.rapido);
  const idsPrima = new Set(state.cicli.map(c => c.id));
  const r = await _salvaRapidoPr.apply(this, arguments);
  offriFallaOraDopo(voci, idsPrima);
  return r;
};
const _salvaCatturaPr = salvaCattura;
salvaCattura = async function () {
  const voci = vociDaRighe(righeCattura(), {});
  const idsPrima = new Set(state.cicli.map(c => c.id));
  const r = await _salvaCatturaPr.apply(this, arguments);
  offriFallaOraDopo(voci, idsPrima);
  return r;
};
function offriFallaOraDopo(voci, idsPrima) {
  if (voci.length !== 1 || !voci[0].breve || ui.fallaOra) return;
  const c = state.cicli.find(x => !idsPrima.has(x.id) && !x.parent_id && x.title === voci[0].title);
  if (!c) return;
  setTimeout(() => showToast('Ci vogliono pochi minuti?', 'info', { annulla: () => avviaFallaOra({ id: c.id, voce: voci[0] }), etichetta: 'Falla ora' }), 250);
}

// ─── Il timer di 5 minuti ───
document.body.insertAdjacentHTML('beforeend', `<div class="falla-ora" id="fallaOra" role="region" aria-label="Falla ora" hidden></div>`);
ui.fallaOra = null;
let _fallaTimer = null;
function avviaFallaOra(o) {
  if (ui.fallaOra) { showToast('Finisci prima quella che stai facendo', 'warn'); return; }
  ui.fallaOra = { ...o, fine: Date.now() + PRINC.TIMER_MS };
  disegnaFallaOra();
  clearInterval(_fallaTimer);
  _fallaTimer = setInterval(disegnaFallaOra, 1000);
}
const FO_R = 25, FO_GIRO = 2 * Math.PI * FO_R;
function disegnaFallaOra() {
  const box = $('fallaOra'), f = ui.fallaOra;
  if (!f) { box.hidden = true; box.innerHTML = ''; clearInterval(_fallaTimer); return; }
  const resto = Math.max(0, f.fine - Date.now()), m = Math.floor(resto / 60000), s = Math.floor(resto % 60000 / 1000);
  const titolo = f.id ? (ciclo(f.id) || {}).title || f.voce.title : f.voce.title;
  const tempo = `${m}:${String(s).padStart(2, '0')}`;
  const off = (FO_GIRO * (1 - resto / PRINC.TIMER_MS)).toFixed(1);
  const et = resto ? '<i class="ti ti-player-play" aria-hidden="true"></i>Falla ora · 5 minuti' : '<i class="ti ti-clock-check" aria-hidden="true"></i>Tempo finito: com\'è andata?';
  box.classList.toggle('finito', !resto);
  if (box.dataset.titolo === titolo && box.querySelector('.fo-tempo')) {
    box.querySelector('.fo-tempo').textContent = tempo;
    box.querySelector('.fo-anello .ar').setAttribute('stroke-dashoffset', off);
    const e = box.querySelector('.fo-et'); if (!resto && !e.dataset.finito) { e.innerHTML = et; e.dataset.finito = '1'; }
    return;
  }
  box.dataset.titolo = titolo;
  box.innerHTML = `<div class="fo-anello"><svg viewBox="0 0 56 56" aria-hidden="true"><circle class="tr" cx="28" cy="28" r="${FO_R}"/><circle class="ar" cx="28" cy="28" r="${FO_R}" stroke-dasharray="${FO_GIRO.toFixed(1)}" stroke-dashoffset="${off}"/></svg><span class="fo-tempo" role="timer" aria-label="Tempo che resta">${tempo}</span></div>
    <div class="fo-txt"><span class="fo-et">${et}</span><b class="fo-tit">${escHtml(titolo)}</b></div>
    <div class="fo-tasti"><button type="button" class="btn btn-primary btn-sm" data-act="fo-fatta"><i class="ti ti-check"></i>Fatta</button>
      <button type="button" class="btn btn-secondary btn-sm" data-act="fo-salva"><i class="ti ti-bookmark"></i>Non finita: salvala</button></div>`;
  box.hidden = false;
}
function chiudiFallaOra() { ui.fallaOra = null; delete $('fallaOra').dataset.titolo; disegnaFallaOra(); }
async function salvaVoceFalla(f) {
  const nuove = await aggiungiFrasi([f.voce], f.r || {});
  return nuove && nuove.find(c => !c.parent_id) || null;
}
AZIONI['fo-fatta'] = async () => {
  const f = ui.fallaOra;
  if (!f) return;
  chiudiFallaOra();
  try {
    if (f.id) { await azioneFatto(f.id); return; }
    const c = await salvaVoceFalla(f);
    if (!c) return;
    await azioneFatto(c.id);
  } catch (e) { showToast('Errore: ' + e.message, 'error'); }
};
AZIONI['fo-salva'] = async () => {
  const f = ui.fallaOra;
  if (!f) return;
  chiudiFallaOra();
  if (f.id) { showToast('Resta tra le cose da fare: la ritrovi tra le Rapide', 'info'); return; }
  await salvaVoceFalla(f);
};

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
// in Oggi: sopra «Da controllare» (o tra i banner); in Tutto → Persone: sotto il nome
const _vistaOggiPr = vistaOggi;
vistaOggi = function () {
  const h = _vistaOggiPr.apply(this, arguments);
  const segno = '<p class="list-head"><span><i class="ti ti-user-check lh-ico"></i>Da controllare';
  const card = h.includes(segno) ? cardDeleghe() : '';
  return card ? h.replace(segno, card + segno) : h;
};
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

// ══════════════════════════════════════════════════════════════
// ALTRO: «Le mie mete» e «Da rendere specifiche» · GUIDA · AVVIO
// ══════════════════════════════════════════════════════════════
const _vistaAltroPr = vistaAltro;
vistaAltro = function () {
  if (ui.sub === 'mete') return vistaMete();
  if (ui.sub === 'specifiche') return vistaSpecifiche();
  const n = meteTutte().length, vaghe = daRendereSpecifiche().length;
  const righe = `<button type="button" class="riga-link" data-act="sub" data-tab="altro" data-sub="mete"><i class="ti ti-flag"></i><span>Le mie mete<small>${state.meteOk === false ? 'non disponibili' : n ? plurale(n, 'meta', 'mete') + ' da qui a 5 anni' : 'ancora da scrivere'}</small></span><span></span><i class="ti ti-chevron-right"></i></button>
    <button type="button" class="riga-link" data-act="sub" data-tab="altro" data-sub="specifiche"><i class="ti ti-zoom-question"></i><span>Da rendere specifiche<small>${vaghe ? plurale(vaghe, 'cosa troppo generica', 'cose troppo generiche') : 'nessuna'}</small></span><span></span><i class="ti ti-chevron-right"></i></button>`;
  const segno = '<button type="button" class="riga-link" data-act="sub" data-tab="altro" data-sub="fatte">';
  const h = _vistaAltroPr.apply(this, arguments);
  return h.includes(segno) ? h.replace(segno, righe + segno) : h;
};
GUIDA_ITIME.push(
  { titolo: 'Le mete (principi 12, 16 e 5)', testo: `<p><strong>Principio 12: abbi chiara la meta.</strong> In Altro → <strong>Le mie mete</strong> scrivi 7–10 mete da qui a 5 anni: cosa stai costruendo, nel lavoro e fuori.</p><p><strong>Principio 16: costruisci qualcosa.</strong> Nel dettaglio di una cosa scegli «Serve a quale meta?»: le cose collegate hanno il segno <i class="ti ti-flag"></i>. Nel piano della settimana vedi quante Importanti vanno a ogni meta, e quale è ferma da 4 settimane.</p><p><strong>Principio 5: impara a dire no.</strong> In Riordina, quando segni Importante, l'app chiede «Ti avvicina a una meta?». Se no, propone Delega o Lascia stare.</p>` },
  { titolo: 'Tempo per il futuro: 25–30% (principi 1, 6, 7, 17)', testo: `<p><strong>Principio 1: il tempo per il futuro va prima di tutto.</strong> Un quarto del tempo di lavoro va alle Importanti: sviluppo, collaboratori, clienti nuovi, salute.</p><p>In Prepara la settimana (passo 3), in Chiudi la settimana e in cima alla Settimana vedi «Tempo per il futuro» con una barra. Sotto il 25% l'app ti dice quante ore bloccare: mettile in agenda come appuntamenti veri (Blocca in agenda), così diventano inderogabili.</p><p>Il calcolo: minuti delle Importanti nel piano (30 minuti se non hanno durata) più l'Esercizio Q2, diviso il tempo di lavoro da lunedì a venerdì, dalle 9 alle 19.</p>` },
  { titolo: 'Fallo subito, e scrivilo specifico (principi 4 e 2)', testo: `<p><strong>Principio 4: se ci vogliono pochi minuti, fallo subito.</strong> Quando scrivi una cosa con «5 minuti», «al volo» o «subito», o tocchi il chip «5 min» nel riepilogo, compare <strong>Falla ora</strong>: parte un timer di 5 minuti con «Fatta» e «Non finita: salvala».</p><p><strong>Principio 2: una cosa specifica si fa, una generica si rimanda.</strong> «Incassi» o «Orto» non dicono cosa fare: l'app avvisa «Troppo generica: cosa devi fare, con chi, quanto?». Le trovi in Riordina e in Altro → <strong>Da rendere specifiche</strong>, con Spacchettala.</p>` },
  { titolo: 'La sera, le deleghe, la spinta (principi 3, 9, 10, 11)', testo: `<p><strong>Principio 3: prepara la giornata la sera prima.</strong> Dalle 18:30, nei giorni feriali, in Oggi compare «5 minuti per domani»: scegli dalla settimana cosa fai domani. In Impostazioni → Promemoria su Google Calendar c'è anche «Piano di domani», un promemoria alle 18:45 (lo crei tu con il tasto).</p><p><strong>Principio 9: delega con istruzioni scritte, alla persona giusta.</strong> Se con qualcuno le deleghe tornano spesso, l'app te lo dice e propone di scrivere le istruzioni o un punto settimanale con lui.</p><p><strong>Principio 10: non riprenderti il lavoro delegato.</strong> Prima di riprenderla, l'app chiede: è un'urgenza vera?</p><p><strong>Principio 11: accorgiti di cosa ti toglie la spinta.</strong> Se la settimana è andata storta, Chiudi la settimana chiede cosa ti ha tolto la spinta, e ti mostra le risposte delle ultime volte.</p>` }
);
const _avviaAppPr = avviaApp;
avviaApp = function (sessione) {
  const prima = _appAvviata;
  _avviaAppPr(sessione);
  if (prima) return;
  dopoIlCaricamento().then(() => rilevaPrincipi()).catch(e => console.warn('[Principi] avvio:', e.message));
};
// ══════════════════════════════════════════════════════════════
