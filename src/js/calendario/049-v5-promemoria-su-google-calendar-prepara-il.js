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

// ══════════════════════════════════════════════════════════════
