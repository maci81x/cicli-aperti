// v2 · RICONCILIAZIONE CON GOOGLE CALENDAR
// Cose aperte che erano in calendario nei giorni scorsi: si chiede sempre,
// non si chiude mai niente da soli.
// ══════════════════════════════════════════════════════════════
const RECON = { LS_ULTIMA: 'cal_recon_last', LS_IGNORATI: 'cal_recon_ignored', OGNI_MS: 6 * 60 * 60 * 1000, GIORNI: 14, SOGLIA: 0.8,
  INCLUSO_PAROLE: 3, INCLUSO_CARATTERI: 12, MAX_RIGHE: 10, MAX_IGNORATI: 500 };
ui.recon = [];

// Esclusioni salvate in locale: { id, t }. `t` (titolo normalizzato) c'è solo per i «Non ancora»:
// serve a non riproporre lo stesso impegno quando torna con un altro id o un titolo quasi uguale.
function reconIgnorati() {
  try {
    return JSON.parse(localStorage.getItem(RECON.LS_IGNORATI) || '[]').map(x => typeof x === 'string' ? { id: x, t: null } : x).filter(x => x && x.id);
  } catch (e) { return []; }
}
function reconIgnora(eventoId, titolo) {
  const lista = reconIgnorati().filter(x => x.id !== eventoId);
  const voce = { id: eventoId, t: titolo ? normTitolo(titolo) : null };
  localStorage.setItem(RECON.LS_IGNORATI, JSON.stringify([...lista, voce].slice(-RECON.MAX_IGNORATI)));
}
function reconEventoIgnorato(e, ignorati) {
  const t = normTitolo(e.titolo);
  return ignorati.some(x => x.id === e.id || (x.t && t && (x.t === t || dice(x.t, t) >= RECON.SOGLIA)));
}

// minuscolo, senza accenti, senza punteggiatura; via i prefissi [Area] e [DONE] messi dalla sincronizzazione
function normTitolo(t) {
  return String(t || '').replace(/\[[^\]]*\]/g, ' ').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}
// coefficiente di Dice sui bigrammi
function dice(a, b) {
  if (a === b) return a ? 1 : 0;
  if (a.length < 2 || b.length < 2) return 0;
  const big = x => { const m = new Map(); for (let i = 0; i < x.length - 1; i++) { const g = x.slice(i, i + 2); m.set(g, (m.get(g) || 0) + 1); } return m; };
  const A = big(a), B = big(b);
  let comuni = 0;
  A.forEach((n, g) => { comuni += Math.min(n, B.get(g) || 0); });
  return (2 * comuni) / (a.length - 1 + b.length - 1);
}
function abbastanzaLungo(t) { return t.length >= RECON.INCLUSO_CARATTERI && t.split(' ').length >= RECON.INCLUSO_PAROLE; }
// Titolo della cosa e titolo dell'evento parlano della stessa cosa?
//  - simili: Dice sui bigrammi ≥ 0.8
//  - oppure uno contiene l'altro, ma solo se il titolo dell'evento ha almeno 3 parole e 12 caratteri
//    (e lo stesso vale per il pezzo contenuto): «Dentista», «Call», «Riunione» da soli non agganciano mai.
function titoliUguali(titoloCosa, titoloEvento) {
  const cosa = normTitolo(titoloCosa), evento = normTitolo(titoloEvento);
  if (!cosa || !evento) return false;
  if (cosa === evento || dice(cosa, evento) >= RECON.SOGLIA) return true;
  if (!abbastanzaLungo(evento)) return false;
  const corto = cosa.length <= evento.length ? cosa : evento, lungo = corto === cosa ? evento : cosa;
  return abbastanzaLungo(corto) && (' ' + lungo + ' ').includes(' ' + corto + ' ');
}

// Eventi degli ultimi 14 giorni fino a ieri: calendario principale + quello di Cicli Aperti.
async function eventiPassatiCalendar() {
  const a = new Date(); a.setHours(0, 0, 0, 0);
  const da = new Date(a); da.setDate(da.getDate() - RECON.GIORNI);
  const qs = new URLSearchParams({ timeMin: da.toISOString(), timeMax: a.toISOString(), singleEvents: 'true', orderBy: 'startTime', maxResults: '500' });
  const calendari = [...new Set(['primary', gcal.calendarId].filter(Boolean))];
  const out = [];
  for (const cal of calendari) {
    try {
      const res = await gcalFetch(`/calendars/${encodeURIComponent(cal)}/events?${qs}`, 'GET');
      ((res && res.items) || []).forEach(e => {
        if (e.status === 'cancelled' || !e.start) return;
        const inizio = e.start.dateTime ? new Date(e.start.dateTime) : parseISODate(e.start.date);
        if (!inizio || inizio >= a) return;
        out.push({ id: e.id, titolo: e.summary || '', inizio, ora: e.start.dateTime ? `${String(inizio.getHours()).padStart(2, '0')}:${String(inizio.getMinutes()).padStart(2, '0')}` : null });
      });
    } catch (err) { console.warn('[GCal] riconciliazione:', err.message); }
  }
  return out;
}

// Per ogni cosa aperta, l'evento passato che le corrisponde.
// Match certo (id dell'evento salvato sulla cosa): sempre proposto, in cima.
// Match per titolo: solo su eventi non esclusi, nemmeno per titolo simile.
function reconAbbina(eventi) {
  const ignorati = reconIgnorati();
  const idIgnorati = new Set(ignorati.map(x => x.id));
  const perTitolo = eventi.filter(e => !reconEventoIgnorato(e, ignorati));
  const recente = lista => lista.sort((x, y) => y.inizio - x.inizio)[0];
  const out = [];
  state.cicli.filter(c => !c.done && !isGiornaliero(c)).forEach(c => {
    const certi = eventi.filter(e => !idIgnorati.has(e.id) && ((c.calendar_event_id && c.calendar_event_id === e.id) || (c.google_event_id && c.google_event_id === e.id)));
    const e = certi.length ? recente(certi) : recente(perTitolo.filter(ev => titoliUguali(c.title, ev.titolo)));
    if (!e) return;
    out.push({ id: c.id, eventoId: e.id, titoloEvento: e.titolo, inizio: e.inizio, ora: e.ora, certo: certi.length > 0, dalPiano: !!c.calendar_event_id && c.calendar_event_id === e.id });
  });
  return out.sort((x, y) => (Number(y.certo) - Number(x.certo)) || (y.inizio - x.inizio));
}

async function riconciliaCalendar(forza) {
  if (!isGcalTokenValid()) return;
  const ultima = parseInt(localStorage.getItem(RECON.LS_ULTIMA) || '0', 10);
  if (!forza && Date.now() - ultima < RECON.OGNI_MS) return;
  localStorage.setItem(RECON.LS_ULTIMA, String(Date.now()));
  const trovate = reconAbbina(await eventiPassatiCalendar());
  ui.recon = trovate.slice(0, RECON.MAX_RIGHE);
  // oltre le 10 righe: le altre valgono come «Chiedimelo dopo», tornano alla prossima apertura
  if (trovate.length > RECON.MAX_RIGHE) localStorage.removeItem(RECON.LS_ULTIMA);
  reconMostra();
}

function reconMostra() {
  if (!ui.recon.length || ui.tab !== 'oggi' || !$('onb').hidden) return;
  if (document.querySelector('.modal-overlay.open')) return;
  reconDisegna();
  $('reconOverlay').classList.add('open');
}
function reconDisegna() {
  ui.recon = ui.recon.filter(r => { const c = ciclo(r.id); return c && !c.done; });
  if (!ui.recon.length) { $('reconOverlay').classList.remove('open'); return; }
  $('recon-lista').innerHTML = ui.recon.map(r => `<div class="recon-riga">
      <div><b>${escHtml(ciclo(r.id).title)}</b>${r.dalPiano ? ' <span class="hint-quando t-caption">dal piano</span>' : ''}<p>sul calendario ${fmtGiornoLungo(r.inizio)}${r.ora ? ` alle <span class="mono">${r.ora}</span>` : ''}</p></div>
      <div class="azioni"><button type="button" class="btn btn-primary btn-sm" data-act="recon-fatta" data-id="${r.id}"><i class="ti ti-check"></i>Fatta</button>
        <button type="button" class="btn btn-ghost btn-sm" data-act="recon-no" data-id="${r.id}">Non ancora</button></div></div>`).join('');
  document.querySelector('[data-act="recon-tutte"]').hidden = ui.recon.length < 2;
}
// Fatta = lo stesso «Fatto» di ogni riga (ricorrenza compresa). In entrambi i casi quell'evento non viene più chiesto.
async function reconRisposta(id, fatta) {
  const r = ui.recon.find(x => x.id === id);
  if (!r) return;
  reconIgnora(r.eventoId, fatta ? null : r.titoloEvento);   // «Non ancora»: escluso anche per titoli simili
  ui.recon = ui.recon.filter(x => x.id !== id);
  if (fatta) await azioneFatto(id);
  reconDisegna();
}
async function reconTutte() {
  for (const r of [...ui.recon]) { reconIgnora(r.eventoId, null); await azioneFatto(r.id); }
  ui.recon = [];
  reconDisegna();
  showToast('Segnate tutte come fatte', 'success');
}
function reconDopo() {
  $('reconOverlay').classList.remove('open');
  localStorage.removeItem(RECON.LS_ULTIMA);   // alla prossima apertura lo richiede
  ui.recon = [];
}

// ══════════════════════════════════════════════════════════════
