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
