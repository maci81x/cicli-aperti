// v3 · IMPOSTAZIONI: modalità semplice, testo, contrasto, quando preparo la settimana
// ══════════════════════════════════════════════════════════════
const TESTO_SCALE = [{ v: '100', l: 'Normale' }, { v: '112', l: 'Grande' }, { v: '125', l: 'Molto grande' }];
function applicaAspetto() {
  const scala = lsLeggi(LS3.TESTO);
  document.documentElement.style.fontSize = scala === '112' || scala === '125' ? scala + '%' : '';
  if (lsLeggi(LS3.CONTRASTO) === 'alto') document.documentElement.setAttribute('data-contrast', 'alto');
  else document.documentElement.removeAttribute('data-contrast');
  document.body.classList.toggle('semplice', modoSemplice());
  document.querySelectorAll('.l-tutto').forEach(e => { e.textContent = modoSemplice() ? 'Cose' : 'Tutte'; });
}
function impostaSemplice(on) {
  lsScrivi(LS3.SEMPLICE, on ? '1' : null);
  applicaAspetto();
  render();
}
function sezioneAspetto() {
  const semplice = modoSemplice(), alto = lsLeggi(LS3.CONTRASTO) === 'alto', scala = lsLeggi(LS3.TESTO) || '100';
  const { giorno, ora } = quandoPiano();
  const mancano = [!state.focusColOk && 'Le tue 3', !state.delegaColsOk && 'delega con data di controllo'].filter(Boolean);
  return `${mancano.length && state.focusColOk !== undefined ? `<div class="avviso"><i class="ti ti-alert-triangle"></i><span>Spente: ${mancano.join(', ')}. Manca la migration v3: esegui <span class="mono">supabase_migration_v3.sql</span> nel SQL Editor di Supabase.</span></div>` : ''}
    <p class="list-head"><span>Come la vedi</span></p>
    <div class="group">
      <button type="button" class="riga-link" data-act="semplice" role="switch" aria-checked="${semplice}"><i class="ti ti-layout-bottombar"></i><span>Modalità semplice<small>Solo Oggi e le tue cose</small></span><span></span><span class="switch"></span></button>
      <div class="riga-link riga-scelta"><i class="ti ti-text-size"></i><span id="lbl-testo">Dimensione testo</span>
        <div class="seg" role="group" aria-labelledby="lbl-testo">${TESTO_SCALE.map(t => `<button type="button" data-act="testo" data-v="${t.v}" aria-pressed="${scala === t.v}">${t.l}</button>`).join('')}</div></div>
      <button type="button" class="riga-link" data-act="contrasto" role="switch" aria-checked="${alto}"><i class="ti ti-contrast"></i><span>Contrasto alto<small>Bordi e testi più marcati</small></span><span></span><span class="switch"></span></button>
      <div class="riga-link riga-scelta"><i class="ti ti-calendar-time"></i><span id="lbl-piano">Quando preparo il piano<small>Da quel momento a domenica, in Oggi compare «È ora del Business Plan». Con Google Calendar collegato, c'è anche l'evento.</small></span>
        <div class="tools-row"><select class="input sel-inline" data-act="piano-giorno" aria-label="Giorno">${GIORNI.map((g, i) => `<option value="${i}"${i === giorno ? ' selected' : ''}>${g.label}</option>`).join('')}</select>
          <input type="time" class="input" data-act="piano-ora" value="${ora}" aria-label="Ora">
          <select class="input sel-inline" data-act="piano-durata" aria-label="Durata">${DURATE_PIANO.map(m => `<option value="${m}"${m === durataPiano() ? ' selected' : ''}>${fmtTempo(m)}</option>`).join('')}</select></div></div>
    </div>`;
}

// ══════════════════════════════════════════════════════════════
