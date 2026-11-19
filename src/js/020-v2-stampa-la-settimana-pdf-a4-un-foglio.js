// v2 · STAMPA LA SETTIMANA (PDF A4, un foglio)
// ══════════════════════════════════════════════════════════════
// Il piano della settimana in vista, come lo stampa il coach: in cima le cose senza giorno, poi un blocco per giorno
// con appuntamenti (cerchio, grigio), cuscinetti e cose (quadratino) in ordine di ora, e sotto le cose senza ora.
// Restituisce { doc, nome, riepilogo } oppure null se non c'è niente da stampare.
function righePdfGiorno(righe, d) {
  const { conOra, senzaOra } = sequenzaGiorno(righe, d);
  return [...conOra, ...senzaOra.map(r => ({ tipo: 'cosa', r }))];
}
