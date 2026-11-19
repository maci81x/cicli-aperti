// v5 · APPUNTAMENTI CHE SEMBRANO CICLI (mai cancellare senza il tocco di Roberto)
// ══════════════════════════════════════════════════════════════
const PAROLE_CICLO = /\b(chiamare|chiamata|scrivere|inviare|mandare|chiedere|recuperare|sentire|controllare|export)\b/;
ui.calCicli = null;
const _master = new Map();
async function eventoMaster(calId, serie) {
  const k = calId + '|' + serie;
  if (!_master.has(k)) _master.set(k, gcalFetch(`/calendars/${encodeURIComponent(calId)}/events/${encodeURIComponent(serie)}`, 'GET').catch(() => null));
  return _master.get(k);
}
const quotidianaDaPiuDi30 = m => !!m && (m.recurrence || []).some(r => /FREQ=DAILY/.test(r)) && !!m.start
  && (Date.now() - new Date(m.start.dateTime || m.start.date).getTime()) > 30 * 864e5;
function disegnaCalCicli() {
  const lista = ui.calCicli || [];
  $('calc-lista').innerHTML = lista.length ? lista.map(({ k, e, perche }) => `<div class="recon-riga"><b>${escHtml(e.titolo)}</b>
    <p>${escHtml(fmtGiorno(parseISODate(e.giorno)))}${e.ora ? ` · <span class="mono">${e.ora}</span>` : ''} · ${(CAL_LETTURA.find(c => c.tipo === e.cal) || {}).nome || ''}${e.serie ? ' · si ripete' : ''}${perche === 'ogni giorno' ? ' ogni giorno da più di un mese' : ''}</p>
    <div class="chips chips-wrap"><button type="button" class="chip" data-act="calc-tutto" data-k="${esc(k)}"><i class="ti ti-stack-2"></i>Mettila tra le cose da fare</button>
      <button type="button" class="chip" data-act="calc-togli" data-k="${esc(k)}"><i class="ti ti-calendar-minus"></i>Mettila tra le cose da fare e toglila dal calendario</button>
      <button type="button" class="chip" data-act="calc-app" data-k="${esc(k)}">È un appuntamento</button></div></div>`).join('')
    : '<div class="col-vuota">Nient\'altro da guardare.</div>';
}
function apriCalCicli() { disegnaCalCicli(); $('calCicliOverlay').classList.add('open'); }
function sceltaCalCiclo(k, v) {
  scriviJson(LS5.CICLI_CAL, { ...leggiJson(LS5.CICLI_CAL, {}), [k]: v });
  ui.calCicli = (ui.calCicli || []).filter(x => x.k !== k);
  disegnaCalCicli();
  render();
  if (!ui.calCicli.length) setTimeout(() => closeModal('calCicliOverlay'), 400);
}
async function portaInTutto(k, togli) {
  const voce = (ui.calCicli || []).find(x => x.k === k);
  if (!voce) return;
  const e = voce.e, ctx = e.cal === 'privato' ? 'personale' : 'lavoro';
  try {
    const c = await upsertCiclo({ ...rigaNuova(e.titolo, { subito: false }, ctx), note: `Dal calendario ${e.cal === 'privato' ? 'Privato' : 'Lavoro'}: «${e.titoloOrig}»` });
    if (c) state.cicli = [c, ...state.cicli];
    if (togli) {
      try { await gcalFetchUtente(`/calendars/${encodeURIComponent(e.calId)}/events/${encodeURIComponent(e.serie || e.id)}`, 'DELETE'); }
      catch (err) { if (!nonEsiste(err)) throw err; }
      ui.eventi = {};
      caricaEventi(state.week, state.year);
    }
    sceltaCalCiclo(k, 'tutto');
    showToast(togli ? 'Tra le cose da fare, e tolta dal calendario' : 'Messa tra le cose da fare, come Importante', 'success', c ? { annulla: () => apriDettaglio(c.id), etichetta: 'Dettagli' } : undefined);
  } catch (err) { showToast('Non riesco: ' + err.message, 'error'); }
}

// ══════════════════════════════════════════════════════════════
