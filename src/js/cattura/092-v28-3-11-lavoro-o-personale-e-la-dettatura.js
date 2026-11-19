// v28 · 3/11 · LAVORO O PERSONALE, E LA DETTATURA
// «Fissare appuntamento per farsi i capelli prima della cresima» era finita in Lavoro:
// parole come «appuntamento», «settimana» le aveva imparate dalle cose di lavoro (che sono la maggioranza)
// e «cresima» da cose indovinate male in passato. Ora:
//  - le parole generiche non contano più; la lista fissa batte le parole imparate solo dalle cose salvate
//    (le tue correzioni con l'etichetta continuano a vincere su tutto);
//  - nell'anteprima c'è sempre la scelta Lavoro | Personale, ben visibile;
//  - la dettatura toglie le parole ripetute («Comprare Comprare»), la maiuscola a metà frase e capisce «virgola».
// ══════════════════════════════════════════════════════════════
'appuntamento appuntamenti settimana settimane fissare prenotare prenotazione comprare prendere farsi farmi prima dopo giorno giorni mese mesi ricordarsi ricordare controllare vedere mettere portare'
  .split(' ').forEach(w => CTX_AMBIGUE.add(w));
_ctxImp.chiave = '';   // ricalcola le parole imparate senza le generiche
(() => {
  const i = CTX_PAROLE.findIndex(([re]) => re.source.includes('cresima'));
  if (i >= 0) CTX_PAROLE[i] = [CTX_PAROLE[i][0], CTX_P, 4];
})();
CTX_PAROLE.push(
  [/\bcapelli\b|\btaglio dei capelli\b|\bestetista\b|\bmanicure\b|\bmassaggi\w*\b|\bfisioterapi\w*\b|\bottico\b|\bocchiali\b/, CTX_P, 3],
  [/\bvestit[oi]\b|\bscarpe\b|\bcamici[ae]\b|\bcappotto\b|\bgiacca\b/, CTX_P, 2],
  [/\bbattesimo\b|\bmatrimonio\b|\bfunerale\b|\bfesta\b|\bcena con\b/, CTX_P, 3]
);
// «Mia» dettata minuscola: «la cresima di mia», «vestito cresima mia»
const _segnaleMiaV28 = segnaleMia;
segnaleMia = function (testo) {
  if (_segnaleMiaV28(testo)) return true;
  return /\b(?:cresima|comunione|compleanno|festa|pallavolo|scuola|verifica|interrogazione|vestito|regalo|recita|maestra|pediatra|dentista)\s+(?:di\s+|della\s+|per\s+)?mia\b/.test(testoCtx(testo));
};

// Dettatura: unisce il pezzo nuovo a quello già scritto, pulito
const V28_PICCOLE = new Set('il lo la i gli le un uno una di a da in con su per tra fra e o ma che nel nella nello nei negli nelle al alla allo ai agli alle del della dello dei degli delle dal dalla dai sul sulla poi entro prima dopo quando se non anche'.split(' '));
function v28PulisciDettato(t) {
  return String(t || '')
    .replace(/\s*\bpunto e virgola\b\s*/gi, '; ')
    .replace(/\s*\bvirgola\b\s*/gi, ', ')
    .replace(/\s*\b(?:punto a capo|nuova riga)\b\s*/gi, '\n')
    .replace(/(?<!\p{L})(\p{L}{3,})(?:\s+\1)+(?!\p{L})/giu, '$1')   // «Comprare Comprare» → «Comprare»
    .replace(/[ \t]+([,;])/g, '$1').replace(/([,;])(?=\S)/g, '$1 ').replace(/[ \t]{2,}/g, ' ')
    .replace(/,\s*$/, '');
}
function v28UnisciDettatura(base, t) {
  let pezzo = String(t || '');
  const b = String(base || '');
  if (b.trim() && !/[.!?\n]\s*$/.test(b)) {
    const m = pezzo.match(/^\s*(\p{Lu})(\p{Ll}*)/u);
    if (m && V28_PICCOLE.has((m[1] + m[2]).toLowerCase())) pezzo = pezzo.replace(/^\s*\p{Lu}/u, x => x.toLowerCase());   // «… farsi i capelli Nella settimana» → «nella»
  }
  return v28PulisciDettato(b + pezzo);
}

// ══════════════════════════════════════════════════════════════
