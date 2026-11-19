// v2 · APPUNTAMENTI DI GOOGLE CALENDAR (sola lettura)
// ══════════════════════════════════════════════════════════════
const hhmm = d => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
async function caricaEventi(week, year) {
  const k = settKey(week, year);
  if (!isGcalTokenValid() || ui.eventi[k]) return ui.eventi[k] || [];
  ui.eventi[k] = [];   // segnaposto: non richiedere due volte
  try {
    const da = getWeekStart(week, year);
    const a = new Date(da); a.setDate(a.getDate() + 7);
    const qs = new URLSearchParams({ timeMin: da.toISOString(), timeMax: a.toISOString(), singleEvents: 'true', orderBy: 'startTime', maxResults: '250' });
    const res = await gcalFetch('/calendars/primary/events?' + qs.toString(), 'GET');
    ui.eventi[k] = ((res && res.items) || []).filter(e => e.status !== 'cancelled').map(e => {
      const inizio = e.start.dateTime ? new Date(e.start.dateTime) : parseISODate(e.start.date);
      const fine = e.end && e.end.dateTime ? new Date(e.end.dateTime) : null;
      return { id: e.id, titolo: e.summary || '(senza titolo)', giorno: toISODate(inizio), ora: e.start.dateTime ? hhmm(inizio) : null,
        fine: fine ? hhmm(fine) : null, minuti: fine ? Math.max(0, Math.round((fine - inizio) / 60000)) : 0 };
    });
    render();
  } catch (e) {
    delete ui.eventi[k];
    console.warn('[GCal] lettura appuntamenti:', e.message);
  }
  return ui.eventi[k] || [];
}
function eventiDelGiorno(d) {
  const w = isoWeekParts(d);
  return (ui.eventi[settKey(w.week, w.year)] || []).filter(e => e.giorno === toISODate(d));
}
// 22/10 · un evento «di giornata» (tutto il giorno o di 12 ore o più) non occupa ore
// e non dà avvisi di sovrapposizione
const GIORNATA_EVENTO_MIN = 12 * 60;
function eGiornata(e) {
  if (!e || e.tuttoIlGiorno || !e.ora) return true;
  // 22/10 sera · uno che passa la mezzanotte (23:00–00:30) resta un appuntamento con orario: conta solo la durata
  return e.minuti >= GIORNATA_EVENTO_MIN;
}
function minutiOccupati(d) { return eventiDelGiorno(d).filter(e => !eGiornata(e)).reduce((s, e) => s + e.minuti, 0); }

// Mette su Calendar ogni riga del piano che ha un giorno e un'ora: crea l'evento se non c'è, altrimenti lo aggiorna.
async function mettiPianoSuCalendar() {
  if (!(await calendarPronto())) return 0;
  let creati = 0, aggiornati = 0, errori = 0;
  for (const item of bpItemsValidi()) {
    const c = bpCiclo(item);
    const slot = slotDiItem(item);
    if (!slot || c.done || bloccoEsterno(c)) continue;
    try {
      if (c.calendar_event_id && await scriviEvento(c, slot, c.calendar_event_id)) aggiornati++;
      else { await creaBlocco(c, slot, true); creati++; }
    } catch (e) { errori++; console.warn('[GCal] evento del piano:', e.message); }
  }
  const msg = creati || aggiornati
    ? [creati && plurale(creati, 'evento creato', 'eventi creati'), aggiornati && plurale(aggiornati, 'aggiornato', 'aggiornati')].filter(Boolean).join(', ') + ' su Google Calendar'
    : 'Nessuna riga del piano ha un giorno e un\'ora';
  showToast(errori ? `${msg} · ${errori} non riusciti` : msg, errori ? 'warn' : creati || aggiornati ? 'success' : 'info');
  render();
  return creati + aggiornati;
}

// ══════════════════════════════════════════════════════════════
