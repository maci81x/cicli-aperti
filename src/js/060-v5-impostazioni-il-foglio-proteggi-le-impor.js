// v5 · IMPOSTAZIONI: il foglio, proteggi le Importanti, coach in copia, calendario di scrittura
// ══════════════════════════════════════════════════════════════
function sezioneItime() {
  const mancano = [state.inderoColOk === false && 'Q2 inderogabili', state.ritorniColOk === false && 'deleghe tornate indietro', state.q2ColOk === false && 'Q2 spostate',
    state.riportoColOk === false && 'data del riporto del foglio', state.esQ2Ok === false && 'esercizio Q2'].filter(Boolean);
  const prom = leggiJson(LS5.PROM, {}), collegato = isGcalTokenValid();
  const seg = (act, voci, attivo, lbl) => `<div class="seg" role="group" aria-labelledby="${lbl}">${voci.map(v => `<button type="button" data-act="${act}" data-v="${v.v}" aria-pressed="${attivo === v.v}">${v.l}</button>`).join('')}</div>`;
  return `${mancano.length ? `<div class="avviso"><i class="ti ti-alert-triangle"></i><span>Spente: ${mancano.join(', ')}. Manca la migration i-Time: esegui <span class="mono">supabase_migration_itime_a.sql</span> nel SQL Editor di Supabase.</span></div>` : ''}
    <p class="list-head"><span>Metodo i-Time</span></p>
    <div class="group">
      <div class="riga-link riga-scelta"><i class="ti ti-file-text"></i><span id="lbl-formato">Formato del foglio<small>«Stampa il foglio» e «Invia il piano»</small></span>${seg('formato', FORMATI, formatoFoglio(), 'lbl-formato')}</div>
      <div class="riga-link riga-scelta"><i class="ti ti-lock"></i><span id="lbl-proteggi">Proteggi le attività importanti<small>Spostare un'Importante bloccata in agenda chiede conferma</small></span>${seg('proteggi', PROTEZIONI, protezione(), 'lbl-proteggi')}</div>
      <button type="button" class="riga-link" data-act="q2-apri"${state.esQ2Ok ? '' : ' disabled'}><i class="ti ti-target"></i><span>Esercizio Q2 · prossimi 3 mesi<small>${state.ultimoQ2 ? 'Ultimo il ' + fmtGgMm(state.ultimoQ2) : 'Mai fatto'}</small></span><span></span><i class="ti ti-chevron-right"></i></button>
    </div>
    <p class="list-head"><span>Promemoria su Google Calendar</span></p>
    <div class="group">
      <button type="button" class="riga-link" data-act="prom-bp"${collegato ? '' : ' disabled'}><i class="ti ti-bell"></i><span>Prepara il Business Plan<small>${collegato ? (prom.bp ? `Ogni ${GIORNI[quandoPiano().giorno].label.toLowerCase()} alle ${quandoPiano().ora} nel calendario ${escHtml(nomeCalScrittura())}, avvisi all'ora e 10 minuti prima` : 'Tocca per crearlo') : 'Collega Google Calendar'}</small></span><span></span><i class="ti ti-refresh"></i></button>
      <div class="riga-link riga-scelta"><i class="ti ti-calendar-cog"></i><label for="set-cal">Calendario dove scrivo<small>Uno dei tuoi calendari. Non ne creo altri.</small></label>
        <div class="tools-row">${sceltaCalScrittura()}</div></div>
      <div class="riga-link"><i class="ti ti-eye"></i><span>Calendari che leggo<small>${CAL_LETTURA.map(c => `${c.nome} (${c.id})`).join(' · ')}</small></span><span></span><span></span></div>
    </div>`;
}
// Email del coach + in copia (nella sezione v4 «Piano della settimana»)
const _sezionePianoV4 = sezionePiano;
sezionePiano = function () {
  const h = _sezionePianoV4()
    .replace(/In un piano nuovo, ogni giorno lavorativo alle [^<]*/, 'In un piano nuovo, nei due spazi liberi più lunghi di ogni giorno lavorativo (almeno 45 minuti, tra le 9 e le 19). Senza spazi: «Giornata piena».')
    .replace('«Invia il piano» la mette come destinatario', 'Destinatario di «Invia il piano»');
  const cc = `<div class="riga-link riga-scelta"><i class="ti ti-users"></i><label for="set-cc">In copia<small>Lascia vuoto per non mettere nessuno</small></label>
        <div class="tools-row"><input type="email" class="input" id="set-cc" data-act="set-cc" value="${esc(emailCC())}" autocomplete="email" inputmode="email"></div></div>`;
  const i = h.indexOf('<div class="riga-link riga-scelta"><i class="ti ti-user">');
  return i < 0 ? h + cc : h.slice(0, i) + cc + h.slice(i);
};

// ══════════════════════════════════════════════════════════════
