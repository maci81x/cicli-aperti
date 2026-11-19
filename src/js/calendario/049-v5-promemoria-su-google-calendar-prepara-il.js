// v5 · PROMEMORIA SU GOOGLE CALENDAR: «Prepara il Business Plan» (ogni settimana) ed «Esercizio Q2» (ogni 3 mesi)
// Un solo evento ricorrente per tipo: si ritrova per id (salvato qui) o per la proprietà privata
// cicli_aperti=<tipo>, e si aggiorna invece di crearne un altro.
// ══════════════════════════════════════════════════════════════
const BYDAY = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
function prossimoGiorno(idx, ora) {   // la prossima data (da oggi) con quel giorno della settimana; oggi se l'ora non è passata
  const d = new Date(); d.setHours(0, 0, 0, 0);
  let diff = (idx - giornoIdxDi(d) + 7) % 7;
  if (diff === 0 && hhmm(new Date()) >= ora) diff = 7;
  d.setDate(d.getDate() + diff);
  return d;
}
function corpoPromemoria(tipo) {
  const promemoria = { useDefault: false, overrides: [{ method: 'popup', minutes: 0 }, { method: 'popup', minutes: 30 }] };
  if (tipo === 'bp') {
    const { giorno, ora } = quandoPiano(), durata = durataPiano(), d = prossimoGiorno(giorno, ora);
    const fine = new Date(`${toISODate(d)}T${ora}:00`); fine.setMinutes(fine.getMinutes() + durata);
    return { firma: `${giorno}|${ora}|${durata}|${calScelto()}`, corpo: {
      summary: 'Prepara il Business Plan', description: `Il piano della prossima settimana: scegli le Q2, i cicli aperti realistici, distribuiscili nei giorni. Poi stampalo e mandalo al coach.\n${APP_URL}`,
      start: { dateTime: `${toISODate(d)}T${ora}:00`, timeZone: 'Europe/Rome' }, end: { dateTime: `${toISODate(fine)}T${hhmm(fine)}:00`, timeZone: 'Europe/Rome' },
      recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${BYDAY[giorno]}`], reminders: promemoria, extendedProperties: { private: { cicli_aperti: 'bp' } } } };
  }
  const base = state.ultimoQ2 ? new Date(state.ultimoQ2) : new Date();
  const d = new Date(base); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + Q2.OGNI_GIORNI);
  const { ora } = quandoPiano(), fine = new Date(`${toISODate(d)}T${ora}:00`); fine.setMinutes(fine.getMinutes() + 120);
  return { firma: `${toISODate(d)}|${ora}|${calScelto()}`, corpo: {
    summary: 'Esercizio Q2', description: `Scegli le attività importanti dei prossimi 3 mesi e fissale in agenda.\n${APP_URL}`,
    start: { dateTime: `${toISODate(d)}T${ora}:00`, timeZone: 'Europe/Rome' }, end: { dateTime: `${toISODate(fine)}T${hhmm(fine)}:00`, timeZone: 'Europe/Rome' },
    recurrence: ['RRULE:FREQ=MONTHLY;INTERVAL=3'], reminders: promemoria, extendedProperties: { private: { cicli_aperti: 'q2' } } } };
}

// ══════════════════════════════════════════════════════════════
