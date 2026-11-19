// v4 · IL GIORNO ORA PER ORA: appuntamenti + cuscinetti + cose con ora
// ══════════════════════════════════════════════════════════════
// Cuscinetti ancora vuoti del giorno `d` (solo se `d` è nella settimana in vista: il piano caricato è quello).
function cuscinettiDelGiorno(d) {
  if (!state.bp || !d) return [];
  const w = isoWeekParts(d);
  if (w.week !== state.week || w.year !== state.year) return [];
  const gk = giornoKeyDi(d);
  return state.bpItems.filter(i => i.tipo_slot === 'cuscinetto' && !i.ciclo_id && i.giorno === gk);
}
// { conOra: in ordine di ora (gli appuntamenti di tutto il giorno in cima), senzaOra: le cose senza ora }
function sequenzaGiorno(righe, d) {
  const peso = { evento: 0, cuscinetto: 1, cosa: 2 };
  const eventi = d && gcalEraCollegato() ? eventiDelGiorno(d) : [];   // anche a token scaduto: restano quelli già letti finché si rinnova
  const conOra = [
    ...eventi.map(e => ({ tipo: 'evento', ora: e.ora || '00:00', e })),
    ...cuscinettiDelGiorno(d).map(item => ({ tipo: 'cuscinetto', ora: bpOra(item) || CUSC.META, item })),
    ...righe.filter(r => r.ora).map(r => ({ tipo: 'cosa', ora: r.ora, r }))
  ].sort((a, b) => a.ora.localeCompare(b.ora) || peso[a.tipo] - peso[b.tipo]);
  return { conOra, senzaOra: righe.filter(r => !r.ora) };
}
function orarioEvento(e) { return e.ora ? `${e.ora}${e.fine ? '–' + e.fine : ''}` : 'tutto il giorno'; }
function rigaEvento(e) {
  return `<div class="evt-riga"><span class="evt-ico" aria-hidden="true"><i class="ti ti-calendar-event"></i></span>
    <span class="evt-main"><span class="item-title">${escHtml(e.titolo)}</span><span class="item-meta"><span class="mono">${orarioEvento(e)}</span><span class="sep">·</span><span>Google Calendar</span></span></span></div>`;
}
function oraFine(ora, min) { const [h, m] = ora.split(':').map(Number), t = h * 60 + m + min; return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; }
// Cuscinetto · 13:00 · 1h — in Oggi con [Urgenza arrivata] e [Riempi]
function rigaCuscinetto(item, opz) {
  const ora = bpOra(item) || CUSC.META, dur = bpDurata(item);
  const azioni = opz && opz.azioni ? `<div class="chips cusc-azioni" role="group" aria-label="Cosa fai di questo tempo">
      <button type="button" class="chip" data-act="cusc-urgenza" data-item="${item.id}"><i class="ti ti-urgent"></i>Urgenza arrivata</button>
      <button type="button" class="chip" data-act="cusc-riempi" data-item="${item.id}"><i class="ti ti-arrow-bar-to-down"></i>Riempi</button></div>` : '';
  return `<div class="cusc-riga"><div class="evt-riga"><span class="evt-ico cusc-ico" aria-hidden="true"><i class="ti ti-lifebuoy"></i></span>
    <span class="evt-main"><span class="item-title">Cuscinetto <span class="sep">·</span> <span class="mono">${ora}</span> <span class="sep">·</span> <span class="mono">${fmtTempo(dur)}</span></span><span class="item-meta"><span>per gli imprevisti · fino alle <span class="mono">${oraFine(ora, dur)}</span></span></span></span></div>${azioni}</div>`;
}

// ══════════════════════════════════════════════════════════════
