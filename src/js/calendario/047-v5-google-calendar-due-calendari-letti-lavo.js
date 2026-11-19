// v5 · GOOGLE CALENDAR: due calendari letti (Lavoro, Privato), uno scritto
// ══════════════════════════════════════════════════════════════
// «10 - …», «17.45 - …», «8.30 - …»: l'orario davanti al titolo
function prefissoOrario(t) {
  const m = /^\s*(\d{1,2})(?:[.:,](\d{2}))?\s*[-–—]\s*(.+)$/.exec(String(t || ''));
  if (!m || +m[1] > 23 || (m[2] && +m[2] > 59)) return { titolo: String(t || '').trim(), ora: null };
  return { titolo: m[3].trim(), ora: `${m[1].padStart(2, '0')}:${m[2] || '00'}` };
}
function eventoDa(e, cal) {
  if (!e || e.status === 'cancelled' || !e.start || ['workingLocation', 'birthday'].includes(e.eventType)) return null;
  const io = (e.attendees || []).find(x => x.self);
  if (io && io.responseStatus === 'declined') return null;
  const inizio = e.start.dateTime ? new Date(e.start.dateTime) : parseISODate(e.start.date);
  if (!inizio) return null;
  const fine = e.end && e.end.dateTime ? new Date(e.end.dateTime) : null;
  const ora = e.start.dateTime ? hhmm(inizio) : null;
  const conCoach = /^\s*coach\s*:\s*/i;   // «Coach: …» nel titolo = blocco di preparazione (l'incontro è quello con il coach invitato)
  const pref = prefissoOrario(String(e.summary || '').replace(conCoach, ''));
  const conIlCoach = [...(e.attendees || []).map(x => x.email), e.organizer && e.organizer.email].filter(Boolean).map(m => m.toLowerCase()).includes(COACH_PERSONA);
  const mia = x => !!x && (x.self || MIE_EMAIL.has(String(x.email || '').toLowerCase()));
  return {
    id: e.id, serie: e.recurringEventId || null, uid: e.iCalUID || e.id, calId: cal.id, cal: cal.tipo,
    titolo: pref.titolo || '(senza titolo)', titoloOrig: e.summary || '', oraTitolo: pref.ora, orarioDiverso: !!(pref.ora && ora && pref.ora !== ora),
    giorno: toISODate(inizio), ora, fine: fine ? hhmm(fine) : null, minuti: fine ? Math.max(0, Math.round((fine - inizio) / 60000)) : 0,
    inizioMs: inizio.getTime(), fineMs: fine ? fine.getTime() : inizio.getTime(), tuttoIlGiorno: !e.start.dateTime,
    invitati: (e.attendees || []).filter(x => !x.self && !x.resource && !MIE_EMAIL.has(String(x.email || '').toLowerCase())).length,
    // incontro col coach = l.beretta invitato o organizzatore; «Coach:» nel titolo senza di lui = preparazione
    mio: mia(e.creator) || mia(e.organizer), coach: conIlCoach, prepCoach: !conIlCoach && /coach\s*:/i.test(e.summary || ''),
    // per spostarlo dall'app: chi lo organizza, chi riceve l'aggiornamento, orari originali
    orgIo: !e.organizer || !!e.organizer.self || mia(e.organizer), org: e.organizer ? (e.organizer.displayName || e.organizer.email || '') : '',
    nomiInvitati: (e.attendees || []).filter(x => !x.self && !x.resource && !MIE_EMAIL.has(String(x.email || '').toLowerCase())).map(x => x.displayName || x.email),
    startRaw: e.start, endRaw: e.end, ricorrente: !!e.recurringEventId, link: e.htmlLink || null,
    // evento creato dall'app (avviso, blocco, promemoria, appuntamento) e la cosa a cui è collegato
    app: (e.extendedProperties && e.extendedProperties.private && e.extendedProperties.private.cicli_aperti) || null,
    cicloId: (e.extendedProperties && e.extendedProperties.private && e.extendedProperties.private.ciclo_id) || null,
    routine: cal.tipo === 'privato' && !!e.recurringEventId && !!ora && ora < ROUTINE_ENTRO
  };
}
// Due appuntamenti con orario che si accavallano nello stesso giorno: ognuno sa con chi.
// 22/10 · niente avvisi tra appuntamenti del calendario: l'avviso c'è solo se una cosa pianificata
// con un'ora cade sopra un appuntamento (coseSovrapposte, calcolato quando si disegna)
function segnaSovrapposizioni(lista) { return lista; }
function coseSovrapposte(e) {
  if (!e || e.routine || eGiornata(e) || !e.fine) return [];
  const s = minDi(e.ora), f = minDi(e.fine) > s ? minDi(e.fine) : 24 * 60;
  return righeGiornoData(parseISODate(e.giorno)).filter(r => r.ora && !r.fatto && minDi(r.ora) < f && s < minDi(r.ora) + (r.durata || BP_DURATA_DEFAULT)).map(r => r.c.title);
}
// Eventi dei calendari letti tra `da` e `a` (singoli, già esplosi). Un calendario che non risponde non ferma gli altri.
async function leggiEventi(da, a, calendari) {
  const out = [], visti = new Set();
  let errori = 0;
  for (const cal of calendari || CAL_LETTURA) {
    let pagina = null, giri = 0;
    try {
      do {
        const qs = new URLSearchParams({ timeMin: da.toISOString(), timeMax: a.toISOString(), singleEvents: 'true', orderBy: 'startTime', maxResults: '250', ...(pagina ? { pageToken: pagina } : {}) });
        const res = await gcalFetch(`/calendars/${encodeURIComponent(cal.id)}/events?${qs}`, 'GET');
        ((res && res.items) || []).forEach(raw => {
          const e = eventoDa(raw, cal);
          if (!e) return;
          const chiave = `${e.uid}|${e.inizioMs}`;   // lo stesso invito su Lavoro e Privato si mostra una volta
          if (visti.has(chiave)) return;
          visti.add(chiave);
          out.push(e);
        });
        pagina = res && res.nextPageToken;
      } while (pagina && ++giri < 8);
    } catch (e) { errori++; console.warn(`[GCal] calendario ${cal.nome}:`, e.message); }
  }
  if (errori === (calendari || CAL_LETTURA).length) throw new Error('nessun calendario leggibile');
  return segnaSovrapposizioni(out.sort((x, y) => x.inizioMs - y.inizioMs));
}

ui.eventiCarico = {};
function eventiSettimanaDi(d) { const w = isoWeekParts(d); return ui.eventi[settKey(w.week, w.year)] || []; }
// Gli appuntamenti del giorno, senza la routine del mattino (quella va in Routine)
eventiDelGiorno = function (d) { const iso = toISODate(d); return eventiSettimanaDi(d).filter(e => e.giorno === iso && !e.routine); };
function routineDelGiorno(d) { const iso = toISODate(d); return eventiSettimanaDi(d).filter(e => e.giorno === iso && e.routine); }
function arcoRoutine(lista) {
  if (!lista.length) return null;
  return { da: lista.map(e => e.ora).sort()[0], a: lista.map(e => e.fine || e.ora).sort().slice(-1)[0] };
}


// Calendario di scrittura: prima per id (Impostazioni, predefinito il primo «Cicli Aperti — Battle Plan»),
// poi per nome, e si crea solo se non ne esiste nessuno.
const calScelto = () => (lsLeggi(LS5.CAL_SCRITTURA) || '').trim() || GCAL_CAL_PREFERITO;

// ══════════════════════════════════════════════════════════════
